/**
 * One-off data migration: OLD store (MySQL) -> NEW build (Postgres).
 *
 * Reads the legacy purepeptide store (MySQL) and loads customers, orders,
 * order items and the contact inbox into the new Postgres schema, parking
 * loyalty balances and promo/affiliate codes in `legacy_*` holding tables
 * (the new build has no feature for those yet, so nothing is lost).
 *
 * SAFETY:
 *   - Only READS from the old DB. Never writes to it.
 *   - Idempotent: re-running upserts by natural key, so it is safe to retry.
 *   - The new catalog (products/categories) is NOT touched.
 *
 * Env:
 *   OLD_DATABASE_URL  mysql://...   (legacy store)
 *   DATABASE_URL      postgres://... (new build — injected by Railway)
 *   MIGRATION_DRY_RUN=1  optional — read + report counts, write nothing
 */
import mysql from "mysql2/promise";
import postgres from "postgres";

const OLD = process.env.OLD_DATABASE_URL;
const NEW = process.env.DATABASE_URL;
const DRY = process.env.MIGRATION_DRY_RUN === "1";

if (!OLD || !NEW) {
  console.error("[migrate] missing OLD_DATABASE_URL or DATABASE_URL — aborting");
  process.exit(1);
}

const centsOf = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
const slugify = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200) || "item";

// old order status -> new order_status enum
const STATUS_MAP = {
  pending_payment: "awaiting_payment",
  pending: "paid",
  processing: "paid",
  shipped: "shipped",
  delivered: "shipped",
  cancelled: "cancelled",
};

const log = (...a) => console.log("[migrate]", ...a);

async function main() {
  log(`=== old MySQL -> new Postgres ===${DRY ? "  (DRY RUN — no writes)" : ""}`);

  const src = await mysql.createConnection(OLD);
  log("connected to OLD MySQL");
  const pg = postgres(NEW, { max: 4, prepare: false });
  log("connected to NEW Postgres");

  const q = async (sql) => (await src.query(sql))[0];

  // ---- holding tables for features the new build doesn't have yet ----
  if (!DRY) {
    await pg.unsafe(`CREATE TABLE IF NOT EXISTS legacy_loyalty_balances (
      legacy_user_id integer PRIMARY KEY,
      email text, name text,
      points_balance integer NOT NULL DEFAULT 0,
      points_lifetime integer NOT NULL DEFAULT 0,
      created_at timestamp
    )`);
    await pg.unsafe(`CREATE TABLE IF NOT EXISTS legacy_loyalty_transactions (
      legacy_id integer PRIMARY KEY,
      legacy_user_id integer, email text,
      legacy_order_id integer, order_number text,
      type text, points integer, balance_after integer,
      description text, created_at timestamp
    )`);
    await pg.unsafe(`CREATE TABLE IF NOT EXISTS legacy_promo_codes (
      legacy_id integer PRIMARY KEY,
      code text, affiliate_name text,
      discount_percent numeric, commission_percent numeric,
      is_active boolean, starts_at timestamp, ends_at timestamp, created_at timestamp
    )`);
    log("legacy holding tables ready");
  }

  // ---- prefetch lookups ----
  const oldUsers = await q("SELECT id, email, passwordHash, name, createdAt, pointsBalance, pointsLifetime FROM users");
  const userEmailById = new Map(oldUsers.map((u) => [u.id, u.email]));

  const newProducts = await pg.unsafe(`SELECT id, slug, name FROM products`);
  const productByName = new Map(newProducts.map((p) => [String(p.name).toLowerCase(), p]));

  const counts = { members: 0, loyaltyBal: 0, orders: 0, orderItems: 0, loyaltyTx: 0, promo: 0, contact: 0 };

  // ---- 1. customers -> member_users (+ loyalty balance stash) ----
  for (const u of oldUsers) {
    if (!u.email) continue;
    const ageVerified = u.createdAt || new Date();
    const ph = u.passwordHash || "legacy-no-password-reset-required";
    if (!DRY) {
      await pg.unsafe(
        `INSERT INTO member_users (email, password_hash, age_verified_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$4)
         ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, age_verified_at=EXCLUDED.age_verified_at`,
        [u.email, ph, ageVerified, u.createdAt || new Date()]
      );
      await pg.unsafe(
        `INSERT INTO legacy_loyalty_balances (legacy_user_id,email,name,points_balance,points_lifetime,created_at)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (legacy_user_id) DO UPDATE SET points_balance=EXCLUDED.points_balance, points_lifetime=EXCLUDED.points_lifetime`,
        [u.id, u.email, u.name || null, u.pointsBalance || 0, u.pointsLifetime || 0, u.createdAt || null]
      );
    }
    counts.members++;
    if ((u.pointsBalance || 0) !== 0 || (u.pointsLifetime || 0) !== 0) counts.loyaltyBal++;
  }
  log(`customers: ${counts.members} (with loyalty points: ${counts.loyaltyBal})`);

  // ---- 2. orders ----
  const oldOrders = await q("SELECT * FROM orders");
  const newIdByOldOrder = new Map();
  const orderNumberByOldId = new Map();
  for (const o of oldOrders) {
    orderNumberByOldId.set(o.id, o.orderNumber);
    const email = o.shippingEmail || userEmailById.get(o.userId) || `legacy-${o.orderNumber}@migrated.local`;
    const status = STATUS_MAP[o.status] || "awaiting_payment";
    const noteBits = [`legacy order #${o.id}`];
    if (o.promoCode) noteBits.push(`promo ${o.promoCode} (-$${o.discountAmount ?? 0})`);
    if (o.trackingCarrier) noteBits.push(`carrier ${o.trackingCarrier}`);
    if (o.shippingMethod && o.shippingMethod !== "standard") noteBits.push(`ship ${o.shippingMethod}`);
    if (o.status && !["pending_payment", "shipped", "cancelled"].includes(o.status)) noteBits.push(`orig status ${o.status}`);
    const adminNote = noteBits.join(" · ");
    const paid = status === "paid" || status === "shipped";
    const params = [
      o.orderNumber,
      email,
      o.shippingName || "Unknown",
      null, // phone (not in old schema)
      o.shippingAddress || "N/A",
      null, // address2
      o.shippingCity || "",
      o.shippingState || "",
      o.shippingZip || "",
      o.shippingCountry || "US",
      centsOf(o.subtotal),
      centsOf(o.shippingCost),
      centsOf(o.total),
      status,
      "venmo",
      o.notes || null,
      adminNote,
      o.shippoTransactionId || null,
      o.trackingNumber || null,
      null, // tracking_url
      o.shippoLabelUrl || null,
      paid ? o.updatedAt || o.createdAt : null,
      paid ? "migration" : null,
      status === "shipped" ? o.updatedAt || o.createdAt : null,
      o.createdAt || new Date(),
      o.updatedAt || o.createdAt || new Date(),
    ];
    if (!DRY) {
      const rows = await pg.unsafe(
        `INSERT INTO orders (order_number,email,name,phone,address1,address2,city,state,postal_code,country,
           subtotal_cents,shipping_cents,total_cents,status,payment_method,customer_note,admin_note,
           shippo_transaction_id,tracking_number,tracking_url,label_url,approved_at,approved_by,shipped_at,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::order_status,$15::payment_method,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
         ON CONFLICT (order_number) DO UPDATE SET
           email=EXCLUDED.email,name=EXCLUDED.name,address1=EXCLUDED.address1,city=EXCLUDED.city,state=EXCLUDED.state,
           postal_code=EXCLUDED.postal_code,country=EXCLUDED.country,subtotal_cents=EXCLUDED.subtotal_cents,
           shipping_cents=EXCLUDED.shipping_cents,total_cents=EXCLUDED.total_cents,status=EXCLUDED.status,
           payment_method=EXCLUDED.payment_method,customer_note=EXCLUDED.customer_note,admin_note=EXCLUDED.admin_note,
           shippo_transaction_id=EXCLUDED.shippo_transaction_id,tracking_number=EXCLUDED.tracking_number,
           label_url=EXCLUDED.label_url,approved_at=EXCLUDED.approved_at,approved_by=EXCLUDED.approved_by,
           shipped_at=EXCLUDED.shipped_at,created_at=EXCLUDED.created_at,updated_at=EXCLUDED.updated_at
         RETURNING id`,
        params
      );
      newIdByOldOrder.set(o.id, rows[0].id);
    }
    counts.orders++;
  }
  log(`orders: ${counts.orders}`);

  // ---- 3. order items ----
  const oldItems = await q("SELECT * FROM order_items");
  if (!DRY) {
    // clear items only for the orders we are (re)loading, then reinsert
    const touched = [...newIdByOldOrder.values()];
    if (touched.length) {
      await pg.unsafe(`DELETE FROM order_items WHERE order_id IN (${touched.map((_, i) => `$${i + 1}`).join(",")})`, touched);
    }
  }
  for (const it of oldItems) {
    const newOrderId = newIdByOldOrder.get(it.orderId);
    if (!DRY && !newOrderId) continue; // order wasn't migrated
    const match = productByName.get(String(it.productName).toLowerCase());
    const slug = match ? match.slug : slugify(it.productName);
    const productId = match ? match.id : null;
    if (!DRY) {
      await pg.unsafe(
        `INSERT INTO order_items (order_id,product_id,slug,name,dosage,unit_price_cents,quantity,line_total_cents)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [newOrderId, productId, slug, it.productName, "", centsOf(it.unitPrice), it.quantity, centsOf(it.totalPrice)]
      );
    }
    counts.orderItems++;
  }
  log(`order items: ${counts.orderItems}`);

  // ---- 4. loyalty transactions (stash) ----
  const oldTx = await q("SELECT * FROM loyalty_transactions").catch(() => []);
  for (const t of oldTx) {
    if (!DRY) {
      await pg.unsafe(
        `INSERT INTO legacy_loyalty_transactions (legacy_id,legacy_user_id,email,legacy_order_id,order_number,type,points,balance_after,description,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (legacy_id) DO NOTHING`,
        [t.id, t.userId, userEmailById.get(t.userId) || null, t.orderId || null, t.orderId ? orderNumberByOldId.get(t.orderId) || null : null, t.type, t.points, t.balanceAfter, t.description, t.createdAt || null]
      );
    }
    counts.loyaltyTx++;
  }
  log(`loyalty transactions (stashed): ${counts.loyaltyTx}`);

  // ---- 5. promo / affiliate codes (stash) ----
  const oldPromos = await q("SELECT * FROM promo_codes").catch(() => []);
  for (const p of oldPromos) {
    if (!DRY) {
      await pg.unsafe(
        `INSERT INTO legacy_promo_codes (legacy_id,code,affiliate_name,discount_percent,commission_percent,is_active,starts_at,ends_at,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (legacy_id) DO UPDATE SET is_active=EXCLUDED.is_active, discount_percent=EXCLUDED.discount_percent, commission_percent=EXCLUDED.commission_percent`,
        [p.id, p.code, p.affiliateName, p.discountPercent, p.commissionPercent, !!p.isActive, p.startsAt || null, p.endsAt || null, p.createdAt || null]
      );
    }
    counts.promo++;
  }
  log(`promo/affiliate codes (stashed): ${counts.promo}`);

  // ---- 6. contact messages -> inbox (dedupe by email+created_at) ----
  const oldMsgs = await q("SELECT * FROM contact_messages").catch(() => []);
  for (const m of oldMsgs) {
    if (!DRY) {
      await pg.unsafe(
        `INSERT INTO contact_messages (name,email,subject,message,handled,created_at)
         SELECT $1,$2,$3,$4,$5,$6
         WHERE NOT EXISTS (SELECT 1 FROM contact_messages WHERE email=$2 AND created_at=$6)`,
        [m.name, m.email, m.subject || "(no subject)", m.message, !!m.isRead, m.createdAt || new Date()]
      );
    }
    counts.contact++;
  }
  log(`contact messages: ${counts.contact}`);

  // ---- readback from NEW db ----
  if (!DRY) {
    const rb = async (t) => (await pg.unsafe(`SELECT COUNT(*)::int AS c FROM ${t}`))[0].c;
    log("── NEW DB totals after migration ──");
    log(`  member_users:              ${await rb("member_users")}`);
    log(`  orders:                    ${await rb("orders")}`);
    log(`  order_items:               ${await rb("order_items")}`);
    log(`  contact_messages:          ${await rb("contact_messages")}`);
    log(`  legacy_loyalty_balances:   ${await rb("legacy_loyalty_balances")}`);
    log(`  legacy_loyalty_transactions: ${await rb("legacy_loyalty_transactions")}`);
    log(`  legacy_promo_codes:        ${await rb("legacy_promo_codes")}`);
  }

  await src.end();
  await pg.end({ timeout: 5 });
  log("✅ migration complete");
}

main().catch((err) => {
  console.error("[migrate] FAILED:", err?.message || err);
  console.error(err?.stack || "");
  process.exit(1);
});

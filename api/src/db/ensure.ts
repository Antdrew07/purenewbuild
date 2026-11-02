import { sql } from "drizzle-orm";
import { db } from "./index.js";

/**
 * Idempotent schema catch-up, run once at boot. The project has no migration
 * runner yet, and drizzle-kit push is a manual step, so the columns and tables
 * added since the last push are created here with IF NOT EXISTS guards.
 * Everything in here is safe to run on every start.
 */
export async function ensureSchema(): Promise<void> {
  if (!db) return;

  await db.execute(sql`ALTER TABLE member_users
    ADD COLUMN IF NOT EXISTS reset_token text,
    ADD COLUMN IF NOT EXISTS reset_token_expiry timestamp,
    ADD COLUMN IF NOT EXISTS points_balance integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS points_lifetime integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS points_seeded_at timestamp`);

  await db.execute(sql`ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS promo_code text,
    ADD COLUMN IF NOT EXISTS discount_cents integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS shipping_method text NOT NULL DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS points_redeemed integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS points_discount_cents integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS points_earned integer NOT NULL DEFAULT 0`);

  await db.execute(sql`ALTER TABLE contact_messages
    ADD COLUMN IF NOT EXISTS admin_reply text,
    ADD COLUMN IF NOT EXISTS replied_at timestamp`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id serial PRIMARY KEY,
    legacy_id integer,
    email text NOT NULL,
    order_number text,
    type text NOT NULL,
    points integer NOT NULL,
    balance_after integer NOT NULL,
    description text NOT NULL DEFAULT '',
    created_at timestamp NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS loyalty_tx_email_idx ON loyalty_transactions (email)`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS loyalty_tx_legacy_idx
    ON loyalty_transactions (legacy_id) WHERE legacy_id IS NOT NULL`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS promo_codes (
    id serial PRIMARY KEY,
    code text NOT NULL,
    affiliate_name text NOT NULL DEFAULT '',
    affiliate_email text,
    discount_percent double precision NOT NULL DEFAULT 10,
    commission_percent double precision NOT NULL DEFAULT 20,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_code_idx ON promo_codes (code)`);

  await db.execute(sql`CREATE TABLE IF NOT EXISTS affiliate_credit_transactions (
    id serial PRIMARY KEY,
    legacy_id integer,
    email text NOT NULL,
    order_number text,
    type text NOT NULL,
    amount_cents integer NOT NULL,
    balance_after_cents integer NOT NULL,
    description text NOT NULL DEFAULT '',
    created_at timestamp NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS affiliate_credit_email_idx ON affiliate_credit_transactions (email)`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS affiliate_credit_legacy_idx
    ON affiliate_credit_transactions (legacy_id) WHERE legacy_id IS NOT NULL`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS affiliate_credit_earn_order_idx
    ON affiliate_credit_transactions (order_number) WHERE type = 'earn'`);

  // Carry the previous store's codes and ledger forward. The legacy_* tables are
  // written by the data migration; on a fresh database they simply do not exist.
  try {
    await db.execute(sql`INSERT INTO promo_codes (code, affiliate_name, affiliate_email, discount_percent, commission_percent, is_active, created_at)
      SELECT upper(trim(l.code)),
             coalesce(l.affiliate_name, ''),
             (SELECT b.email FROM legacy_loyalty_balances b WHERE upper(trim(b.affiliate_code)) = upper(trim(l.code)) AND b.email IS NOT NULL LIMIT 1),
             coalesce(l.discount_percent, 10)::float8,
             coalesce(l.commission_percent, 20)::float8,
             coalesce(l.is_active, true),
             coalesce(l.created_at, now())
      FROM legacy_promo_codes l
      WHERE l.code IS NOT NULL AND trim(l.code) <> ''
      ON CONFLICT (code) DO UPDATE SET
        affiliate_name = EXCLUDED.affiliate_name,
        affiliate_email = coalesce(EXCLUDED.affiliate_email, promo_codes.affiliate_email),
        discount_percent = EXCLUDED.discount_percent,
        commission_percent = EXCLUDED.commission_percent,
        is_active = EXCLUDED.is_active`);

    await db.execute(sql`INSERT INTO affiliate_credit_transactions (legacy_id, email, order_number, type, amount_cents, balance_after_cents, description, created_at)
      SELECT l.legacy_id, l.email, l.order_number, coalesce(l.type, 'adjustment'),
             round(coalesce(l.amount, 0) * 100)::int, round(coalesce(l.balance_after, 0) * 100)::int,
             coalesce(l.description, ''), coalesce(l.created_at, now())
      FROM legacy_affiliate_credit_transactions l
      WHERE l.email IS NOT NULL
      ON CONFLICT (legacy_id) WHERE legacy_id IS NOT NULL DO NOTHING`);

    // Loyalty balances copy in once per member (points_seeded_at guards it), so
    // points earned on this store are never overwritten by a later boot.
    await db.execute(sql`UPDATE member_users m
      SET points_balance = b.points_balance, points_lifetime = b.points_lifetime, points_seeded_at = now()
      FROM legacy_loyalty_balances b
      WHERE m.points_seeded_at IS NULL AND b.email IS NOT NULL AND lower(b.email) = lower(m.email)`);

    await db.execute(sql`INSERT INTO loyalty_transactions (legacy_id, email, order_number, type, points, balance_after, description, created_at)
      SELECT l.legacy_id, lower(l.email), l.order_number, coalesce(l.type, 'adjustment'),
             coalesce(l.points, 0), coalesce(l.balance_after, 0), coalesce(l.description, ''), coalesce(l.created_at, now())
      FROM legacy_loyalty_transactions l
      WHERE l.email IS NOT NULL
      ON CONFLICT (legacy_id) WHERE legacy_id IS NOT NULL DO NOTHING`);
  } catch (err) {
    console.warn("[db] legacy promo/credit carry-over skipped:", (err as Error).message);
  }
}

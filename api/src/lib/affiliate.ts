import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { findPromo } from "./promo.js";

type Db = NonNullable<typeof db>;

/** Spendable store credit = the signed sum of the ledger, never below zero. */
export async function getCreditBalanceCents(database: Db, email: string): Promise<number> {
  const [row] = await database
    .select({ cents: sql<number>`coalesce(sum(${schema.affiliateCreditTransactions.amountCents}), 0)` })
    .from(schema.affiliateCreditTransactions)
    .where(eq(schema.affiliateCreditTransactions.email, email.toLowerCase()));
  return Math.max(0, Number(row?.cents ?? 0));
}

export async function getCreditHistory(database: Db, email: string, limit = 50) {
  return database
    .select()
    .from(schema.affiliateCreditTransactions)
    .where(eq(schema.affiliateCreditTransactions.email, email.toLowerCase()))
    .orderBy(desc(schema.affiliateCreditTransactions.createdAt), desc(schema.affiliateCreditTransactions.id))
    .limit(limit);
}

async function writeLedger(
  database: Db,
  input: { email: string; orderNumber: string | null; type: "earn" | "redeem" | "adjustment"; amountCents: number; description: string },
) {
  const balance = await getCreditBalanceCents(database, input.email);
  const balanceAfterCents = Math.max(0, balance + input.amountCents);
  const delta = balanceAfterCents - balance; // clamp so the balance never goes negative
  if (delta === 0 && input.type !== "earn") return { balanceAfterCents, appliedCents: 0 };
  await database.insert(schema.affiliateCreditTransactions).values({
    email: input.email.toLowerCase(),
    orderNumber: input.orderNumber,
    type: input.type,
    amountCents: delta,
    balanceAfterCents,
    description: input.description,
  });
  return { balanceAfterCents, appliedCents: Math.abs(delta) };
}

/** Spend credit at checkout; guarded so the balance never goes negative. */
export async function redeemCredit(database: Db, email: string, amountCents: number, orderNumber: string) {
  if (amountCents <= 0) return { appliedCents: 0 };
  const r = await writeLedger(database, { email, orderNumber, type: "redeem", amountCents: -Math.round(amountCents), description: `Applied to order ${orderNumber}` });
  return { appliedCents: r.appliedCents };
}

/** Admin manual adjustment (positive grants, negative deducts). */
export async function adjustCredit(database: Db, email: string, amountCents: number, description: string) {
  return writeLedger(database, { email, orderNumber: null, type: "adjustment", amountCents: Math.round(amountCents), description });
}

/** Zero an affiliate's spendable credit after paying them out; recorded as an adjustment. */
export async function clearCredit(database: Db, email: string, description: string) {
  const balance = await getCreditBalanceCents(database, email);
  if (balance <= 0) return { clearedCents: 0 };
  await writeLedger(database, { email, orderNumber: null, type: "adjustment", amountCents: -balance, description });
  return { clearedCents: balance };
}

/** The member who owns a code: member_users.affiliate_code first, then the code's own affiliate_email. */
export async function affiliateEmailForCode(database: Db, code: string, fallback: string | null): Promise<string | null> {
  const [m] = await database
    .select({ email: schema.memberUsers.email })
    .from(schema.memberUsers)
    .where(sql`upper(${schema.memberUsers.affiliateCode}) = ${code.toUpperCase()}`)
    .limit(1);
  return (m?.email ?? fallback)?.toLowerCase() ?? null;
}

/**
 * Stats for one code — the shape the affiliate dashboard and the admin tab share.
 * Commission excludes cancelled orders and the affiliate's own orders.
 */
export async function statsForCode(database: Db, rawCode: string) {
  const promo = await findPromo(database, rawCode);
  if (!promo) return null;
  const affiliateEmail = await affiliateEmailForCode(database, promo.code, promo.affiliateEmail);
  const orders = await database
    .select({
      id: schema.orders.id,
      orderNumber: schema.orders.orderNumber,
      name: schema.orders.name,
      email: schema.orders.email,
      status: schema.orders.status,
      totalCents: schema.orders.totalCents,
      discountCents: schema.orders.discountCents,
      createdAt: schema.orders.createdAt,
    })
    .from(schema.orders)
    .where(sql`upper(${schema.orders.promoCode}) = ${promo.code}`)
    .orderBy(desc(schema.orders.createdAt));
  const isSelf = (o: { email: string }) => !!affiliateEmail && o.email.toLowerCase() === affiliateEmail;
  const live = orders.filter((o) => o.status !== "cancelled");
  const commissionCents = live
    .filter((o) => !isSelf(o))
    .reduce((s, o) => s + Math.round((o.totalCents * promo.commissionPercent) / 100), 0);
  return {
    promo,
    affiliateEmail,
    orders: orders.slice(0, 100).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      name: o.name,
      status: o.status,
      totalCents: o.totalCents,
      discountCents: o.discountCents,
      createdAt: o.createdAt,
      isSelf: isSelf(o),
    })),
    stats: {
      totalOrders: orders.length,
      totalRevenueCents: live.reduce((s, o) => s + o.totalCents, 0),
      totalDiscountCents: live.reduce((s, o) => s + o.discountCents, 0),
      totalCommissionCents: commissionCents,
      selfOrders: orders.filter(isSelf).length,
      commissionRate: promo.commissionPercent,
      discountRate: promo.discountPercent,
    },
  };
}

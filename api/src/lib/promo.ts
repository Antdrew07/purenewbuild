import { desc, eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { affiliateEmailForCode } from "./affiliate.js";

type Db = NonNullable<typeof db>;

/** Codes are compared uppercase with all whitespace removed, so pasted codes still match. */
export const normalizeCode = (raw: string) => raw.toUpperCase().replace(/\s+/g, "");

export async function findPromo(database: Db, raw: string) {
  const code = normalizeCode(raw);
  if (!code) return null;
  const [promo] = await database.select().from(schema.promoCodes).where(eq(schema.promoCodes.code, code)).limit(1);
  return promo ?? null;
}

export async function findActivePromo(database: Db, raw: string) {
  const promo = await findPromo(database, raw);
  return promo && promo.isActive ? promo : null;
}

/** Discount is a percentage of the subtotal, never more than the subtotal itself. */
export const discountCentsFor = (subtotalCents: number, percent: number) =>
  Math.min(subtotalCents, Math.max(0, Math.round((subtotalCents * percent) / 100)));

/**
 * Credits the affiliate once an order is paid: order total × commission%.
 * Same rules as before: house codes and self-orders earn nothing, and an order
 * can only ever earn once (unique index on the earn row).
 */
export async function creditAffiliateCommission(
  database: Db,
  order: { orderNumber: string; email: string; totalCents: number; promoCode: string | null },
): Promise<{ creditedCents: number; reason?: string }> {
  if (!order.promoCode) return { creditedCents: 0, reason: "no-promo" };
  const promo = await findPromo(database, order.promoCode);
  if (!promo) return { creditedCents: 0, reason: "unknown-code" };
  if (!promo.commissionPercent) return { creditedCents: 0, reason: "zero-commission" };
  const affiliateEmail = await affiliateEmailForCode(database, promo.code, promo.affiliateEmail);
  if (!affiliateEmail) return { creditedCents: 0, reason: "house-code" };
  if (affiliateEmail === order.email.toLowerCase()) return { creditedCents: 0, reason: "self-order" };
  const amountCents = Math.round((order.totalCents * promo.commissionPercent) / 100);
  if (amountCents <= 0) return { creditedCents: 0, reason: "zero-amount" };

  const [last] = await database
    .select({ balance: schema.affiliateCreditTransactions.balanceAfterCents })
    .from(schema.affiliateCreditTransactions)
    .where(eq(schema.affiliateCreditTransactions.email, affiliateEmail))
    .orderBy(desc(schema.affiliateCreditTransactions.createdAt), desc(schema.affiliateCreditTransactions.id))
    .limit(1);

  const inserted = await database
    .insert(schema.affiliateCreditTransactions)
    .values({
      email: affiliateEmail,
      orderNumber: order.orderNumber,
      type: "earn",
      amountCents,
      balanceAfterCents: (last?.balance ?? 0) + amountCents,
      description: `${promo.commissionPercent}% commission on ${order.orderNumber} (${promo.code})`,
    })
    .onConflictDoNothing()
    .returning({ id: schema.affiliateCreditTransactions.id });
  return inserted.length ? { creditedCents: amountCents } : { creditedCents: 0, reason: "already-credited" };
}

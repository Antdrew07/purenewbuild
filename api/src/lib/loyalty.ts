import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";

type Db = NonNullable<typeof db>;

/** Earn 2 points per full $100 of the final total; each point is worth 1¢ at checkout. */
export const POINTS_PER_100_DOLLARS = 2;
export const pointsEarnedFor = (totalCents: number) => Math.floor(totalCents / 10_000) * POINTS_PER_100_DOLLARS;
export const pointsDiscountCents = (points: number) => Math.max(0, Math.floor(points));

export async function getLoyaltyBalance(database: Db, email: string) {
  const [row] = await database
    .select({ balance: schema.memberUsers.pointsBalance, lifetime: schema.memberUsers.pointsLifetime })
    .from(schema.memberUsers)
    .where(sql`lower(${schema.memberUsers.email}) = ${email.toLowerCase()}`)
    .limit(1);
  return { balance: row?.balance ?? 0, lifetime: row?.lifetime ?? 0 };
}

export async function getLoyaltyHistory(database: Db, email: string, limit = 30) {
  return database
    .select()
    .from(schema.loyaltyTransactions)
    .where(eq(schema.loyaltyTransactions.email, email.toLowerCase()))
    .orderBy(desc(schema.loyaltyTransactions.createdAt), desc(schema.loyaltyTransactions.id))
    .limit(limit);
}

/**
 * Moves points on the member's balance and writes the ledger row. Positive
 * deltas also raise the lifetime total (the tier counter); redemptions do not.
 */
export async function movePoints(
  database: Db,
  input: { email: string; orderNumber: string | null; type: "earn" | "redeem" | "adjustment"; points: number; description: string },
): Promise<number> {
  const delta = Math.trunc(input.points);
  if (delta === 0) return (await getLoyaltyBalance(database, input.email)).balance;
  const [updated] = await database
    .update(schema.memberUsers)
    .set({
      pointsBalance: sql`${schema.memberUsers.pointsBalance} + ${delta}`,
      pointsLifetime: sql`${schema.memberUsers.pointsLifetime} + ${delta > 0 ? delta : 0}`,
    })
    .where(sql`lower(${schema.memberUsers.email}) = ${input.email.toLowerCase()}`)
    .returning({ balance: schema.memberUsers.pointsBalance });
  const balanceAfter = updated?.balance ?? 0;
  await database.insert(schema.loyaltyTransactions).values({
    email: input.email.toLowerCase(),
    orderNumber: input.orderNumber,
    type: input.type,
    points: delta,
    balanceAfter,
    description: input.description,
  });
  return balanceAfter;
}

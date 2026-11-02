import { Router } from "express";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireMember } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { getCreditBalanceCents, getCreditHistory, statsForCode } from "../lib/affiliate.js";
import { findActivePromo } from "../lib/promo.js";

export const affiliateRouter = Router();

async function memberCode(database: NonNullable<typeof db>, email: string) {
  const [m] = await database
    .select({ code: schema.memberUsers.affiliateCode })
    .from(schema.memberUsers)
    .where(sql`lower(${schema.memberUsers.email}) = ${email.toLowerCase()}`)
    .limit(1);
  return m?.code ?? null;
}

/** GET /api/affiliate/me — credit balance + ledger, and stats for the member's linked code. */
affiliateRouter.get(
  "/me",
  requireMember,
  asyncHandler(async (req, res) => {
    if (!db) throw new HttpError(503, "Affiliate data requires a configured database");
    const email = req.member!.email;
    const [code, balanceCents, history] = await Promise.all([
      memberCode(db, email),
      getCreditBalanceCents(db, email),
      getCreditHistory(db, email),
    ]);
    const stats = code ? await statsForCode(db, code) : null;
    res.json({
      data: {
        code,
        balanceCents,
        history: history.map((t) => ({
          id: t.id, type: t.type, amountCents: t.amountCents, balanceAfterCents: t.balanceAfterCents,
          orderNumber: t.orderNumber, description: t.description, createdAt: t.createdAt,
        })),
        stats: stats
          ? {
              code: stats.promo.code,
              affiliateName: stats.promo.affiliateName,
              isActive: stats.promo.isActive,
              ...stats.stats,
              orders: stats.orders.map(({ name: _n, ...o }) => o),
            }
          : null,
      },
    });
  }),
);

const LinkBody = z.object({ code: z.string().trim().min(1).max(64) });

/** POST /api/affiliate/link — connect an active promo code to the member's account. */
affiliateRouter.post(
  "/link",
  requireMember,
  validateBody(LinkBody),
  asyncHandler(async (req, res) => {
    if (!db) throw new HttpError(503, "Affiliate data requires a configured database");
    const email = req.member!.email;
    const promo = await findActivePromo(db, (req.body as z.infer<typeof LinkBody>).code);
    if (!promo) throw new HttpError(400, "Invalid or inactive promo code");
    await db.update(schema.memberUsers).set({ affiliateCode: promo.code }).where(sql`lower(${schema.memberUsers.email}) = ${email.toLowerCase()}`);
    if (!promo.affiliateEmail) {
      await db.update(schema.promoCodes).set({ affiliateEmail: email.toLowerCase() }).where(sql`${schema.promoCodes.id} = ${promo.id}`);
    }
    res.json({ data: { code: promo.code, affiliateName: promo.affiliateName } });
  }),
);

import { Router } from "express";
import { db } from "../db/index.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireMember } from "../middleware/auth.js";
import { getLoyaltyBalance, getLoyaltyHistory, POINTS_PER_100_DOLLARS } from "../lib/loyalty.js";

export const loyaltyRouter = Router();

/** GET /api/loyalty/me — the signed-in member's balance, lifetime points and recent history. */
loyaltyRouter.get(
  "/me",
  requireMember,
  asyncHandler(async (req, res) => {
    if (!db) throw new HttpError(503, "Loyalty points require a configured database");
    const email = req.member!.email;
    const [balance, history] = await Promise.all([getLoyaltyBalance(db, email), getLoyaltyHistory(db, email, 50)]);
    res.json({
      data: {
        ...balance,
        pointsPer100Dollars: POINTS_PER_100_DOLLARS,
        history: history.map((t) => ({
          id: t.id,
          type: t.type,
          points: t.points,
          balanceAfter: t.balanceAfter,
          orderNumber: t.orderNumber,
          description: t.description,
          createdAt: t.createdAt,
        })),
      },
    });
  }),
);

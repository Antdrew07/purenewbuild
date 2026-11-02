import { Router } from "express";
import rateLimit from "express-rate-limit";
import { db } from "../db/index.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { findActivePromo } from "../lib/promo.js";

export const promoRouter = Router();

const validateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, try again shortly" },
});

/** GET /api/promo/validate?code=… — same shape the storefront relied on before. */
promoRouter.get(
  "/validate",
  validateLimiter,
  asyncHandler(async (req, res) => {
    if (!db) throw new HttpError(503, "Promo codes require a configured database");
    const promo = await findActivePromo(db, String(req.query.code ?? ""));
    if (!promo) {
      res.json({ data: { valid: false, code: null, discountPercent: null, affiliateName: null, exclusive: false, message: "Invalid or expired promo code" } });
      return;
    }
    res.json({
      data: {
        valid: true,
        code: promo.code,
        discountPercent: promo.discountPercent,
        affiliateName: promo.affiliateName,
        exclusive: promo.exclusive,
        message: `${promo.code} — ${promo.discountPercent}% off applied!`,
      },
    });
  }),
);

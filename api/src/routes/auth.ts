import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { signAdminToken } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, try again later" },
});

const LoginBody = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
});

/** POST /api/admin/login */
authRouter.post(
  "/login",
  loginLimiter,
  validateBody(LoginBody),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof LoginBody>;
    if (!db) throw new HttpError(503, "Admin sign-in requires a configured database");

    const rows = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email)).limit(1);
    const user = rows[0];

    // Compare against a dummy hash when the user is missing so response time
    // doesn't reveal whether the account exists.
    const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
    const ok = await bcrypt.compare(password, hash);
    if (!user || !ok) throw new HttpError(401, "Invalid credentials");

    const token = signAdminToken({ sub: String(user.id), email: user.email });
    res.json({ data: { token, email: user.email } });
  }),
);

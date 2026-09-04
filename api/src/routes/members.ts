import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { signMemberToken } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";
import { verifyTurnstile } from "../lib/turnstile.js";

export const membersRouter = Router();

const registrationLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many account attempts, try again later" },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts, try again later" },
});

const Credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(200).transform((value) => value.toLowerCase()),
  password: z.string().min(12, "Password must be at least 12 characters").max(200),
  turnstileToken: z.string().trim().min(1, "Complete bot verification").max(2048),
});

const RegisterBody = Credentials.extend({
  ageConfirmed: z.literal(true, { errorMap: () => ({ message: "Age confirmation is required" }) }),
});

function requestIp(header: string | string[] | undefined, fallback?: string) {
  return (Array.isArray(header) ? header[0] : header)?.split(",")[0]?.trim() || fallback;
}

function sessionFor(user: { id: number; email: string }) {
  return {
    token: signMemberToken({ sub: String(user.id), email: user.email, scope: "member" }),
    member: { id: user.id, email: user.email },
  };
}

/** POST /api/members/register — creates an adult member account after Turnstile validation. */
membersRouter.post(
  "/register",
  registrationLimiter,
  validateBody(RegisterBody),
  asyncHandler(async (req, res) => {
    if (!db) throw new HttpError(503, "Member accounts require a configured database");
    const body = req.body as z.infer<typeof RegisterBody>;
    await verifyTurnstile({
      token: body.turnstileToken,
      remoteIp: requestIp(req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"], req.ip),
      action: "member_register",
    });

    const existing = await db.select({ id: schema.memberUsers.id })
      .from(schema.memberUsers).where(eq(schema.memberUsers.email, body.email)).limit(1);
    if (existing[0]) throw new HttpError(409, "An account already exists for this email. Sign in instead.");

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(schema.memberUsers).values({
      email: body.email,
      passwordHash,
      ageVerifiedAt: new Date(),
    }).returning({ id: schema.memberUsers.id, email: schema.memberUsers.email });

    res.status(201).json({ data: sessionFor(user) });
  }),
);

/** POST /api/members/login — returns a short-lived session after bot verification. */
membersRouter.post(
  "/login",
  loginLimiter,
  validateBody(Credentials),
  asyncHandler(async (req, res) => {
    if (!db) throw new HttpError(503, "Member accounts require a configured database");
    const body = req.body as z.infer<typeof Credentials>;
    await verifyTurnstile({
      token: body.turnstileToken,
      remoteIp: requestIp(req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"], req.ip),
      action: "member_login",
    });

    const rows = await db.select().from(schema.memberUsers).where(eq(schema.memberUsers.email, body.email)).limit(1);
    const user = rows[0];
    // Compare a dummy hash when missing so account existence is not exposed by timing.
    const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
    const valid = await bcrypt.compare(body.password, hash);
    if (!user || !valid) throw new HttpError(401, "Invalid email or password");

    res.json({ data: sessionFor(user) });
  }),
);

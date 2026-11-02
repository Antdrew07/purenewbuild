import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { eq } from "drizzle-orm";
import { ensureSchema } from "../db/ensure.js";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { signAdminToken, signMemberToken } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";
import { verifyTurnstile } from "../lib/turnstile.js";
import { sendPasswordReset } from "../lib/email.js";
import { env } from "../env.js";

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

    await ensureResetColumns(db);
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

    // Compare a dummy hash when missing so account existence is not exposed by timing.
    const DUMMY_HASH = "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";

    await ensureResetColumns(db);
    const rows = await db.select().from(schema.memberUsers).where(eq(schema.memberUsers.email, body.email)).limit(1);
    const user = rows[0];
    const valid = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH);
    if (user && valid) {
      res.json({ data: sessionFor(user) });
      return;
    }

    // Admin credentials open the member gate too, so the owner signs in once, not twice.
    const admins = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, body.email)).limit(1);
    const admin = admins[0];
    const adminValid = await bcrypt.compare(body.password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !adminValid) throw new HttpError(401, "Invalid email or password");

    // One sign-in opens both doors: the storefront session plus a dashboard token.
    res.json({
      data: {
        ...sessionFor(admin),
        member: { id: admin.id, email: admin.email, isAdmin: true },
        adminToken: signAdminToken({ sub: String(admin.id), email: admin.email }),
      },
    });
  }),
);

/* ── password reset ─────────────────────────────────────────────────────── */

/* Columns are created at boot by ensureSchema(); this keeps the call sites as a
   cheap belt-and-braces for a process that raced the ensure. */
function ensureResetColumns(_database: NonNullable<typeof db>) {
  return ensureSchema();
}

const ForgotBody = Credentials.omit({ password: true });
const ResetBody = Credentials.pick({ password: true }).extend({
  token: z.string().min(32).max(200),
});

/** POST /api/members/forgot — always 200, so addresses cannot be enumerated. */
membersRouter.post(
  "/forgot",
  loginLimiter,
  validateBody(ForgotBody),
  asyncHandler(async (req, res) => {
    if (!db) throw new HttpError(503, "Member accounts require a configured database");
    const body = req.body as z.infer<typeof ForgotBody>;
    await verifyTurnstile({
      token: body.turnstileToken,
      remoteIp: requestIp(req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"], req.ip),
      action: "member_forgot",
    });
    await ensureResetColumns(db);

    const rows = await db.select({ id: schema.memberUsers.id, email: schema.memberUsers.email })
      .from(schema.memberUsers).where(eq(schema.memberUsers.email, body.email)).limit(1);
    const user = rows[0];
    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60_000);
      await db.update(schema.memberUsers)
        .set({ resetToken: token, resetTokenExpiry: expiry, updatedAt: new Date() })
        .where(eq(schema.memberUsers.id, user.id));
      const origin = (env.SITE_URL || env.CORS_ORIGIN[0] || "").replace(/\/+$/, "");
      // Fire-and-forget like every other email: a Resend hiccup must not leak
      // whether the address exists through a different response.
      void sendPasswordReset({ email: user.email, resetUrl: `${origin}/?reset=${token}` });
    }
    res.json({ data: { ok: true } });
  }),
);

/** POST /api/members/reset — consumes the token and signs the member in. */
membersRouter.post(
  "/reset",
  loginLimiter,
  validateBody(ResetBody),
  asyncHandler(async (req, res) => {
    if (!db) throw new HttpError(503, "Member accounts require a configured database");
    const body = req.body as z.infer<typeof ResetBody>;
    await ensureResetColumns(db);

    const rows = await db.select().from(schema.memberUsers).where(eq(schema.memberUsers.resetToken, body.token)).limit(1);
    const user = rows[0];
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new HttpError(400, "This reset link is invalid or has expired. Request a new one.");
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    await db.update(schema.memberUsers)
      .set({ passwordHash, resetToken: null, resetTokenExpiry: null, updatedAt: new Date() })
      .where(eq(schema.memberUsers.id, user.id));
    res.json({ data: sessionFor(user) });
  }),
);

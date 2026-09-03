import { Router } from "express";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { env, isEmailConfigured } from "../env.js";
import { asyncHandler } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";

export const contactRouter = Router();

const ContactBody = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("A valid email is required").max(200),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
  // Honeypot — real users never fill this; bots usually do.
  website: z.string().max(0).optional(),
});

/** POST /api/contact */
contactRouter.post(
  "/",
  validateBody(ContactBody),
  asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body as z.infer<typeof ContactBody>;

    if (db) {
      await db.insert(schema.contactMessages).values({ name, email, subject, message });
    }

    if (isEmailConfigured) {
      // Resend is called directly to avoid pulling an SDK for one endpoint.
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Pure Peptide <noreply@purepeptide.us>",
          to: [env.OWNER_EMAIL],
          reply_to: email,
          subject: `[Contact] ${subject}`,
          text: `From: ${name} <${email}>\n\n${message}`,
        }),
      });
      if (!r.ok) console.error("[contact] resend failed", r.status, await r.text());
    }

    res.status(201).json({
      data: { received: true },
      meta: { persisted: Boolean(db), emailed: isEmailConfigured },
    });
  }),
);

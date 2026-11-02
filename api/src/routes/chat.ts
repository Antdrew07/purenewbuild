import Anthropic from "@anthropic-ai/sdk";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env, isChatConfigured } from "../env.js";
import { repo } from "../lib/repo.js";
import { money } from "../lib/orders.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";

export const chatRouter = Router();

const chatLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages, give it a minute" },
});

const ChatBody = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(4000) }))
    .min(1)
    .max(40),
});

/** GET /api/chat/status — lets the storefront hide the bubble when no key is configured. */
chatRouter.get("/status", (_req, res) => {
  res.json({ data: { enabled: isChatConfigured } });
});

const client = isChatConfigured ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

/* The catalog is the bulk of the prompt and changes rarely, so it is rebuilt
   every few minutes and kept byte-stable in between — that is what lets the
   prompt cache hit across customers. */
let catalogCache: { text: string; builtAt: number } | null = null;
async function catalogText(): Promise<string> {
  if (catalogCache && Date.now() - catalogCache.builtAt < 5 * 60_000) return catalogCache.text;
  const [{ items }, categories] = await Promise.all([
    repo.listProducts({ limit: 300, offset: 0, sort: "name" }),
    repo.listCategories(),
  ]);
  const lines = items.map((p) =>
    `- ${p.name}${p.dosage ? ` ${p.dosage}` : ""} | ${p.priceCents === null ? "price on request" : money(p.priceCents)} | ${p.category} | ${p.status.replace("_", " ")} | /products/${p.slug}${p.description ? ` | ${p.description.slice(0, 160)}` : ""}`,
  );
  const text = `CATEGORIES: ${categories.map((c) => c.name).join(", ")}\n\nPRODUCT CATALOG (name | price | category | availability | link):\n${lines.join("\n")}`;
  catalogCache = { text, builtAt: Date.now() };
  return text;
}

const RULES = `You are Pure Peptide's research assistant. You help customers learn about research peptides and find their way around the Pure Peptide catalog.

IMPORTANT RULES:
- All products are for RESEARCH USE ONLY. Never suggest products for human consumption, dosing, or medical use, and never give medical advice.
- Be knowledgeable, professional, and concise. Keep responses brief (2-4 short paragraphs at most).
- When recommending products, include the product name and price, and link it as [Product Name](/products/SLUG) using the link from the catalog.
- If asked about something outside the catalog or company information, say you can help with product questions and point to the Contact page at /contact.

COMPANY INFO:
- Pure Peptide LLC (purepeptide.us), premium research peptides and compounds
- Every product is third-party tested; Certificates of Analysis are available on request (see /lab-results)
- Shipping: standard $15, free on orders of $200 or more. United States only.
- Payment: Venmo after placing the order (order number in the note). Members earn 2 loyalty points per $100 spent (1 point = 1¢ at checkout).
- Address: 30 N Gould St, Ste R, Sheridan, WY 82801 · Phone: (307) 204-5373 · Email: info@purepeptide.us`;

/** POST /api/chat — one reply for the conversation so far. */
chatRouter.post(
  "/",
  chatLimiter,
  validateBody(ChatBody),
  asyncHandler(async (req, res) => {
    if (!client) throw new HttpError(503, "The assistant is not available right now");
    const { messages } = req.body as z.infer<typeof ChatBody>;

    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1024,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [
        { type: "text", text: RULES },
        { type: "text", text: await catalogText(), cache_control: { type: "ephemeral" } },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    if (response.stop_reason === "refusal") {
      res.json({ data: { response: "I can't help with that one. For product questions I'm here, or reach the team via the Contact page." } });
      return;
    }
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    res.json({ data: { response: text || "I'm sorry, I couldn't process that. Please try again." } });
  }),
);

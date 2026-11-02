import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { slugify } from "../lib/catalog.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";
import { sendContactReply } from "../lib/email.js";
import { normalizeCode } from "../lib/promo.js";
import { sql } from "drizzle-orm";

export const adminRouter = Router();

// Every route below this line requires a valid admin bearer token.
adminRouter.use(requireAdmin);

function requireDb() {
  if (!db) throw new HttpError(503, "This operation requires a configured database");
  return db;
}

const ProductBody = z.object({
  name: z.string().trim().min(1).max(200),
  dosage: z.string().trim().max(100).default(""),
  price: z.number().min(0).nullable(),
  categorySlug: z.string().trim().min(1),
  status: z.enum(["active", "out_of_stock", "coming_soon", "unavailable"]).default("active"),
  featured: z.boolean().default(false),
  note: z.string().trim().max(1000).nullable().default(null),
  description: z.string().trim().max(5000).nullable().default(null),
  imageUrl: z.string().url().nullable().default(null),
  coaUrl: z.string().url().nullable().default(null),
});

async function categoryIdFor(slug: string): Promise<number> {
  const d = requireDb();
  const rows = await d.select().from(schema.categories).where(eq(schema.categories.slug, slug)).limit(1);
  if (!rows[0]) throw new HttpError(400, `Unknown category: ${slug}`);
  return rows[0].id;
}

/** GET /api/admin/products — full list including unavailable rows. */
adminRouter.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const d = requireDb();
    const rows = await d.select().from(schema.products).orderBy(desc(schema.products.updatedAt));
    res.json({ data: rows });
  }),
);

/** POST /api/admin/products */
adminRouter.post(
  "/products",
  validateBody(ProductBody),
  asyncHandler(async (req, res) => {
    const d = requireDb();
    const body = req.body as z.infer<typeof ProductBody>;
    const categoryId = await categoryIdFor(body.categorySlug);
    const slug = slugify(body.name, body.dosage);

    const existing = await d.select().from(schema.products).where(eq(schema.products.slug, slug)).limit(1);
    if (existing[0]) throw new HttpError(409, `A product with slug "${slug}" already exists`);

    const inserted = await d
      .insert(schema.products)
      .values({
        slug, name: body.name, dosage: body.dosage,
        priceCents: body.price === null ? null : Math.round(body.price * 100),
        categoryId, status: body.status, featured: body.featured,
        note: body.note, description: body.description,
        imageUrl: body.imageUrl, coaUrl: body.coaUrl,
      })
      .returning();

    res.status(201).json({ data: inserted[0] });
  }),
);

/** PATCH /api/admin/products/:id */
adminRouter.patch(
  "/products/:id",
  validateBody(ProductBody.partial()),
  asyncHandler(async (req, res) => {
    const d = requireDb();
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, "Invalid product id");

    const body = req.body as Partial<z.infer<typeof ProductBody>>;
    const patch: Record<string, unknown> = { updatedAt: new Date() };

    if (body.name !== undefined) patch.name = body.name;
    if (body.dosage !== undefined) patch.dosage = body.dosage;
    if (body.price !== undefined) patch.priceCents = body.price === null ? null : Math.round(body.price * 100);
    if (body.status !== undefined) patch.status = body.status;
    if (body.featured !== undefined) patch.featured = body.featured;
    if (body.note !== undefined) patch.note = body.note;
    if (body.description !== undefined) patch.description = body.description;
    if (body.imageUrl !== undefined) patch.imageUrl = body.imageUrl;
    if (body.coaUrl !== undefined) patch.coaUrl = body.coaUrl;
    if (body.categorySlug !== undefined) patch.categoryId = await categoryIdFor(body.categorySlug);
    if (body.name !== undefined || body.dosage !== undefined) {
      const current = await d.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
      if (!current[0]) throw new HttpError(404, "Product not found");
      patch.slug = slugify(body.name ?? current[0].name, body.dosage ?? current[0].dosage);
    }

    const updated = await d.update(schema.products).set(patch).where(eq(schema.products.id, id)).returning();
    if (!updated[0]) throw new HttpError(404, "Product not found");
    res.json({ data: updated[0] });
  }),
);

/** DELETE /api/admin/products/:id */
adminRouter.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const d = requireDb();
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, "Invalid product id");
    const deleted = await d.delete(schema.products).where(eq(schema.products.id, id)).returning();
    if (!deleted[0]) throw new HttpError(404, "Product not found");
    res.status(204).end();
  }),
);

/** GET /api/admin/messages */
adminRouter.get(
  "/messages",
  asyncHandler(async (_req, res) => {
    const d = requireDb();
    const rows = await d.select().from(schema.contactMessages).orderBy(desc(schema.contactMessages.createdAt)).limit(200);
    res.json({ data: rows });
  }),
);

/** POST /api/admin/messages/:id/read */
adminRouter.post(
  "/messages/:id/read",
  asyncHandler(async (req, res) => {
    const d = requireDb();
    const id = Number(req.params.id);
    const [row] = await d.update(schema.contactMessages).set({ handled: true })
      .where(eq(schema.contactMessages.id, id)).returning();
    if (!row) throw new HttpError(404, "Message not found");
    res.json({ data: row });
  }),
);

const ReplyBody = z.object({ replyText: z.string().trim().min(1).max(10_000) });

/** POST /api/admin/messages/:id/reply — emails the customer and records the reply. */
adminRouter.post(
  "/messages/:id/reply",
  validateBody(ReplyBody),
  asyncHandler(async (req, res) => {
    const d = requireDb();
    const id = Number(req.params.id);
    const { replyText } = req.body as z.infer<typeof ReplyBody>;
    const [msg] = await d.select().from(schema.contactMessages).where(eq(schema.contactMessages.id, id)).limit(1);
    if (!msg) throw new HttpError(404, "Message not found");
    const emailed = await sendContactReply({
      to: msg.email,
      customerName: msg.name,
      originalSubject: msg.subject,
      originalMessage: msg.message,
      replyText,
    });
    const [row] = await d.update(schema.contactMessages)
      .set({ adminReply: replyText, repliedAt: new Date(), handled: true })
      .where(eq(schema.contactMessages.id, id)).returning();
    res.json({ data: row, meta: { emailed } });
  }),
);

/* ─────────────────────────── promo codes / affiliates ─────────────────────────── */

/** GET /api/admin/promos — every code with its order stats and ledger total. */
adminRouter.get(
  "/promos",
  asyncHandler(async (_req, res) => {
    const d = requireDb();
    const codes = await d.select().from(schema.promoCodes).orderBy(desc(schema.promoCodes.createdAt));
    const orders = await d
      .select({
        id: schema.orders.id,
        orderNumber: schema.orders.orderNumber,
        name: schema.orders.name,
        promoCode: schema.orders.promoCode,
        status: schema.orders.status,
        totalCents: schema.orders.totalCents,
        discountCents: schema.orders.discountCents,
        createdAt: schema.orders.createdAt,
      })
      .from(schema.orders)
      .where(sql`${schema.orders.promoCode} IS NOT NULL`)
      .orderBy(desc(schema.orders.createdAt));
    const credited = await d
      .select({ email: schema.affiliateCreditTransactions.email, cents: sql<number>`coalesce(sum(${schema.affiliateCreditTransactions.amountCents}), 0)` })
      .from(schema.affiliateCreditTransactions)
      .where(eq(schema.affiliateCreditTransactions.type, "earn"))
      .groupBy(schema.affiliateCreditTransactions.email);
    const creditedByEmail = new Map(credited.map((c) => [c.email.toLowerCase(), Number(c.cents)]));

    const data = codes.map((c) => {
      const mine = orders.filter((o) => o.promoCode === c.code);
      const live = mine.filter((o) => o.status !== "cancelled");
      const revenueCents = live.reduce((s, o) => s + o.totalCents, 0);
      const discountCents = live.reduce((s, o) => s + o.discountCents, 0);
      return {
        id: c.id,
        code: c.code,
        affiliateName: c.affiliateName,
        affiliateEmail: c.affiliateEmail,
        discountPercent: c.discountPercent,
        commissionPercent: c.commissionPercent,
        isActive: c.isActive,
        createdAt: c.createdAt,
        totalOrders: live.length,
        revenueCents,
        discountCents,
        // Same formula as before: revenue × commission%, over every non-cancelled order.
        commissionOwedCents: Math.round((revenueCents * c.commissionPercent) / 100),
        // What the live ledger has actually credited (earned on approval).
        commissionCreditedCents: c.affiliateEmail ? creditedByEmail.get(c.affiliateEmail.toLowerCase()) ?? 0 : 0,
        orders: mine.slice(0, 50),
      };
    });
    res.json({ data });
  }),
);

const PromoBody = z.object({
  code: z.string().trim().min(2).max(64),
  affiliateName: z.string().trim().min(1).max(120),
  affiliateEmail: z.string().trim().email().max(200).nullable().optional(),
  discountPercent: z.number().min(0).max(100).default(10),
  commissionPercent: z.number().min(0).max(100).default(20),
});

/** POST /api/admin/promos — create, or update an existing code in place. */
adminRouter.post(
  "/promos",
  validateBody(PromoBody),
  asyncHandler(async (req, res) => {
    const d = requireDb();
    const b = req.body as z.infer<typeof PromoBody>;
    const code = normalizeCode(b.code);
    if (!code) throw new HttpError(400, "Code is required");
    const [row] = await d
      .insert(schema.promoCodes)
      .values({
        code,
        affiliateName: b.affiliateName,
        affiliateEmail: b.affiliateEmail ? b.affiliateEmail.toLowerCase() : null,
        discountPercent: b.discountPercent,
        commissionPercent: b.commissionPercent,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: schema.promoCodes.code,
        set: {
          affiliateName: b.affiliateName,
          affiliateEmail: b.affiliateEmail ? b.affiliateEmail.toLowerCase() : null,
          discountPercent: b.discountPercent,
          commissionPercent: b.commissionPercent,
          isActive: true,
        },
      })
      .returning();
    res.status(201).json({ data: row });
  }),
);

const PromoToggle = z.object({ isActive: z.boolean() });

/** PATCH /api/admin/promos/:id — enable or disable a code. */
adminRouter.patch(
  "/promos/:id",
  validateBody(PromoToggle),
  asyncHandler(async (req, res) => {
    const d = requireDb();
    const id = Number(req.params.id);
    const { isActive } = req.body as z.infer<typeof PromoToggle>;
    const [row] = await d.update(schema.promoCodes).set({ isActive }).where(eq(schema.promoCodes.id, id)).returning();
    if (!row) throw new HttpError(404, "Promo code not found");
    res.json({ data: row });
  }),
);

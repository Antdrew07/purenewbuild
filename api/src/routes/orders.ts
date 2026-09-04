import { Router } from "express";
import rateLimit from "express-rate-limit";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";
import { requireMember } from "../middleware/auth.js";
import { priceCart, reserveOrderNumber, paymentLinks, money } from "../lib/orders.js";
import { sendOrderPlaced, sendOwnerNewOrder } from "../lib/email.js";

export const ordersRouter = Router();

/** Order placement is expensive and spammable; throttle harder than the app default. */
const placeLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many orders from this address. Try again shortly." },
});

const PlaceBody = z.object({
  email: z.string().trim().email("A valid email is required").max(200),
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().max(40).optional(),
  address1: z.string().trim().min(1, "Address is required").max(200),
  address2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1, "City is required").max(120),
  state: z.string().trim().min(2, "State is required").max(60),
  postalCode: z.string().trim().min(3, "ZIP is required").max(20),
  country: z.string().trim().length(2).default("US"),
  customerNote: z.string().trim().max(2000).optional(),
  // Only slug + quantity is accepted. Prices are always looked up server-side.
  items: z
    .array(z.object({ slug: z.string().trim().min(1).max(200), quantity: z.number().int().min(1).max(99) }))
    .min(1, "Cart is empty")
    .max(50),
  // Honeypot.
  website: z.string().max(0).optional(),
});

/** POST /api/orders — place an order. An authenticated member owns the order. */
ordersRouter.post(
  "/",
  placeLimiter,
  requireMember,
  validateBody(PlaceBody),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof PlaceBody>;
    if (req.member?.email !== b.email) {
      throw new HttpError(403, "Use the email address associated with your member account");
    }
    const priced = await priceCart(b.items);
    const orderNumber = await reserveOrderNumber();

    let orderId: number | null = null;
    if (db) {
      const [row] = await db
        .insert(schema.orders)
        .values({
          orderNumber,
          email: b.email,
          name: b.name,
          phone: b.phone ?? null,
          address1: b.address1,
          address2: b.address2 ?? null,
          city: b.city,
          state: b.state,
          postalCode: b.postalCode,
          country: b.country,
          subtotalCents: priced.subtotalCents,
          shippingCents: priced.shippingCents,
          totalCents: priced.totalCents,
          customerNote: b.customerNote ?? null,
        })
        .returning({ id: schema.orders.id });
      orderId = row.id;

      await db.insert(schema.orderItems).values(
        priced.items.map((i) => ({
          orderId: row.id,
          productId: i.productId,
          slug: i.slug,
          name: i.name,
          dosage: i.dosage,
          unitPriceCents: i.unitPriceCents,
          quantity: i.quantity,
          lineTotalCents: i.lineTotalCents,
        })),
      );
    }

    const emailData = {
      orderNumber,
      name: b.name,
      email: b.email,
      totalCents: priced.totalCents,
      items: priced.items,
    };
    // Never let a mail failure fail the order — the customer already owes us money.
    const [emailed] = await Promise.all([
      sendOrderPlaced(emailData),
      sendOwnerNewOrder(emailData),
    ]);

    res.status(201).json({
      data: {
        orderNumber,
        status: "awaiting_payment",
        subtotalCents: priced.subtotalCents,
        shippingCents: priced.shippingCents,
        totalCents: priced.totalCents,
        totalFormatted: money(priced.totalCents),
        items: priced.items,
        payment: paymentLinks(),
      },
      meta: { persisted: Boolean(orderId), emailed },
    });
  }),
);

/**
 * GET /api/orders/:orderNumber?email=...
 *
 * The order number travels in payment notes and email subject lines, so it is
 * not treated as a secret — the caller must also present the matching email
 * before any address or contact detail is returned.
 */
ordersRouter.get(
  "/:orderNumber",
  asyncHandler(async (req, res) => {
    const orderNumber = String(req.params.orderNumber).toUpperCase();
    const email = String(req.query.email ?? "").trim().toLowerCase();
    if (!email) throw new HttpError(400, "email query parameter is required");
    if (!db) throw new HttpError(503, "Order lookup requires a database");

    const rows = await db
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.orderNumber, orderNumber), eq(schema.orders.email, email)))
      .limit(1);

    const order = rows[0];
    // Same response for "no such order" and "wrong email" so this cannot be
    // used to enumerate which order numbers exist.
    if (!order) throw new HttpError(404, "No order found for that number and email");

    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));

    res.json({
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        totalCents: order.totalCents,
        totalFormatted: money(order.totalCents),
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        createdAt: order.createdAt,
        items: items.map((i) => ({
          name: i.name, dosage: i.dosage, quantity: i.quantity, lineTotalCents: i.lineTotalCents,
        })),
        payment: paymentLinks(),
      },
    });
  }),
);

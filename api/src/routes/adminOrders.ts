import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validateBody } from "../middleware/validate.js";
import { money } from "../lib/orders.js";
import { buyLabel } from "../lib/shippo.js";
import { sendOrderApproved } from "../lib/email.js";

export const adminOrdersRouter = Router();

// Everything below is admin-only.
adminOrdersRouter.use(requireAdmin);

function requireDb() {
  if (!db) throw new HttpError(503, "Order management requires a database");
  return db;
}

/** GET /api/admin/orders?status=awaiting_payment */
adminOrdersRouter.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const d = requireDb();
    const status = req.query.status ? String(req.query.status) : null;
    const rows = status
      ? await d.select().from(schema.orders).where(eq(schema.orders.status, status as never)).orderBy(desc(schema.orders.createdAt)).limit(200)
      : await d.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(200);

    res.json({
      data: rows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        name: o.name,
        email: o.email,
        status: o.status,
        totalCents: o.totalCents,
        totalFormatted: money(o.totalCents),
        trackingNumber: o.trackingNumber,
        trackingUrl: o.trackingUrl,
        labelUrl: o.labelUrl,
        adminNote: o.adminNote,
        createdAt: o.createdAt,
        approvedAt: o.approvedAt,
      })),
    });
  }),
);

/** GET /api/admin/orders/:id — full detail including address and items. */
adminOrdersRouter.get(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const d = requireDb();
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, "Invalid order id");

    const [order] = await d.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
    if (!order) throw new HttpError(404, "Order not found");
    const items = await d.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));

    res.json({ data: { ...order, totalFormatted: money(order.totalCents), items } });
  }),
);

const ApproveBody = z.object({
  paymentMethod: z.enum(["cashapp", "venmo"]).optional(),
  adminNote: z.string().trim().max(2000).optional(),
  /** Skip label purchase — for orders shipped by hand. */
  skipLabel: z.boolean().optional(),
  weightOz: z.number().min(1).max(1120).optional(),
});

/**
 * POST /api/admin/orders/:id/approve
 *
 * Marks payment verified, then attempts a Shippo label and emails the customer.
 *
 * Approval is committed BEFORE the label is attempted. A carrier outage must
 * not leave an order stuck in awaiting_payment after money has been received —
 * the label can be retried, the payment cannot be un-received.
 */
adminOrdersRouter.post(
  "/orders/:id/approve",
  validateBody(ApproveBody),
  asyncHandler(async (req, res) => {
    const d = requireDb();
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, "Invalid order id");
    const body = req.body as z.infer<typeof ApproveBody>;

    const [order] = await d.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
    if (!order) throw new HttpError(404, "Order not found");
    if (order.status === "cancelled") throw new HttpError(409, "Order is cancelled");
    if (order.status === "shipped") throw new HttpError(409, "Order is already shipped");

    await d
      .update(schema.orders)
      .set({
        status: "paid",
        paymentMethod: body.paymentMethod ?? order.paymentMethod,
        adminNote: body.adminNote ?? order.adminNote,
        approvedAt: new Date(),
        approvedBy: req.admin?.email ?? "admin",
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, id));

    let label: Awaited<ReturnType<typeof buyLabel>> = { ok: false, reason: "skipped" };
    if (!body.skipLabel) {
      label = await buyLabel({
        orderNumber: order.orderNumber,
        weightOz: body.weightOz,
        to: {
          name: order.name,
          street1: order.address1,
          street2: order.address2,
          city: order.city,
          state: order.state,
          zip: order.postalCode,
          country: order.country,
          email: order.email,
          phone: order.phone,
        },
      });

      if (label.ok) {
        await d
          .update(schema.orders)
          .set({
            status: "shipped",
            shippoTransactionId: label.transactionId ?? null,
            trackingNumber: label.trackingNumber ?? null,
            trackingUrl: label.trackingUrl ?? null,
            labelUrl: label.labelUrl ?? null,
            shippedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(schema.orders.id, id));
      } else {
        // Keep the failure visible to whoever opens the order next.
        await d
          .update(schema.orders)
          .set({
            adminNote: [order.adminNote, `Label failed: ${label.reason}`].filter(Boolean).join("\n"),
            updatedAt: new Date(),
          })
          .where(eq(schema.orders.id, id));
      }
    }

    const emailed = await sendOrderApproved({
      orderNumber: order.orderNumber,
      name: order.name,
      email: order.email,
      trackingNumber: label.ok ? label.trackingNumber : null,
      trackingUrl: label.ok ? label.trackingUrl : null,
    });

    res.json({
      data: {
        orderNumber: order.orderNumber,
        status: label.ok ? "shipped" : "paid",
        tracking: label.ok
          ? { number: label.trackingNumber, url: label.trackingUrl, labelUrl: label.labelUrl }
          : null,
      },
      meta: {
        approved: true,
        labelPurchased: label.ok,
        labelError: label.ok ? null : label.reason,
        emailed,
      },
    });
  }),
);

/** POST /api/admin/orders/:id/label — retry a label that failed at approval. */
adminOrdersRouter.post(
  "/orders/:id/label",
  validateBody(z.object({ weightOz: z.number().min(1).max(1120).optional() })),
  asyncHandler(async (req, res) => {
    const d = requireDb();
    const id = Number(req.params.id);
    const [order] = await d.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
    if (!order) throw new HttpError(404, "Order not found");
    if (order.status === "awaiting_payment") throw new HttpError(409, "Approve the payment first");
    if (order.trackingNumber) throw new HttpError(409, "This order already has a label");

    const label = await buyLabel({
      orderNumber: order.orderNumber,
      weightOz: (req.body as { weightOz?: number }).weightOz,
      to: {
        name: order.name, street1: order.address1, street2: order.address2,
        city: order.city, state: order.state, zip: order.postalCode,
        country: order.country, email: order.email, phone: order.phone,
      },
    });
    if (!label.ok) throw new HttpError(502, `Label purchase failed: ${label.reason}`);

    await d.update(schema.orders).set({
      status: "shipped",
      shippoTransactionId: label.transactionId ?? null,
      trackingNumber: label.trackingNumber ?? null,
      trackingUrl: label.trackingUrl ?? null,
      labelUrl: label.labelUrl ?? null,
      shippedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(schema.orders.id, id));

    const emailed = await sendOrderApproved({
      orderNumber: order.orderNumber, name: order.name, email: order.email,
      trackingNumber: label.trackingNumber, trackingUrl: label.trackingUrl,
    });

    res.json({ data: { tracking: { number: label.trackingNumber, url: label.trackingUrl, labelUrl: label.labelUrl } }, meta: { emailed } });
  }),
);

/** POST /api/admin/orders/:id/cancel */
adminOrdersRouter.post(
  "/orders/:id/cancel",
  validateBody(z.object({ adminNote: z.string().trim().max(2000).optional() })),
  asyncHandler(async (req, res) => {
    const d = requireDb();
    const id = Number(req.params.id);
    const [order] = await d.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
    if (!order) throw new HttpError(404, "Order not found");
    if (order.status === "shipped") throw new HttpError(409, "Cannot cancel a shipped order");

    await d.update(schema.orders).set({
      status: "cancelled",
      adminNote: (req.body as { adminNote?: string }).adminNote ?? order.adminNote,
      updatedAt: new Date(),
    }).where(eq(schema.orders.id, id));

    res.json({ data: { orderNumber: order.orderNumber, status: "cancelled" } });
  }),
);

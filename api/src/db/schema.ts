import {
  pgTable, serial, text, integer, boolean, timestamp, pgEnum, index, uniqueIndex,
} from "drizzle-orm/pg-core";

export const productStatus = pgEnum("product_status", [
  "active",
  "out_of_stock",
  "coming_soon",
  "unavailable",
]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  blurb: text("blurb"),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => ({
  slugIdx: uniqueIndex("categories_slug_idx").on(t.slug),
}));

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull().default(""),
  /** Stored in cents to avoid float drift. Null = price on request / unavailable. */
  priceCents: integer("price_cents"),
  categoryId: integer("category_id").references(() => categories.id),
  status: productStatus("status").notNull().default("active"),
  featured: boolean("featured").notNull().default(false),
  /** Presentation form drives the product mockup: vial | dropper | spray | pen. */
  form: text("form").notNull().default("vial"),
  note: text("note"),
  description: text("description"),
  imageUrl: text("image_url"),
  coaUrl: text("coa_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  slugIdx: uniqueIndex("products_slug_idx").on(t.slug),
  categoryIdx: index("products_category_idx").on(t.categoryId),
  statusIdx: index("products_status_idx").on(t.status),
}));

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  handled: boolean("handled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex("admin_users_email_idx").on(t.email),
}));

/** Storefront accounts. Age confirmation is recorded at registration time. */
export const memberUsers = pgTable("member_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  ageVerifiedAt: timestamp("age_verified_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex("member_users_email_idx").on(t.email),
}));

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;

/* ─────────────────────────────── orders ─────────────────────────────── */

export const orderStatus = pgEnum("order_status", [
  /** Placed; we are waiting to see the Venmo/Cash App transfer land. */
  "awaiting_payment",
  /** Payment verified by an admin. */
  "paid",
  /** Shipping label bought, tracking sent to the customer. */
  "shipped",
  "cancelled",
]);

export const paymentMethod = pgEnum("payment_method", ["cashapp", "venmo"]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  /**
   * Short, unambiguous, human-typeable — the customer copies this into the
   * Venmo/Cash App payment note, so it avoids 0/O and 1/I entirely.
   */
  orderNumber: text("order_number").notNull(),

  email: text("email").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),

  address1: text("address1").notNull(),
  address2: text("address2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("US"),

  /** Always recomputed server-side from the catalog — never trusted from the client. */
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),

  status: orderStatus("status").notNull().default("awaiting_payment"),
  paymentMethod: paymentMethod("payment_method"),

  customerNote: text("customer_note"),
  adminNote: text("admin_note"),

  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),

  /* Shippo */
  shippoTransactionId: text("shippo_transaction_id"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  labelUrl: text("label_url"),
  shippedAt: timestamp("shipped_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  numberIdx: uniqueIndex("orders_number_idx").on(t.orderNumber),
  statusIdx: index("orders_status_idx").on(t.status),
  emailIdx: index("orders_email_idx").on(t.email),
  createdIdx: index("orders_created_idx").on(t.createdAt),
}));

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  /** Denormalised so a later catalog edit never rewrites order history. */
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull().default(""),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotalCents: integer("line_total_cents").notNull(),
}, (t) => ({
  orderIdx: index("order_items_order_idx").on(t.orderId),
}));

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

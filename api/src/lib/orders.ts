import { randomInt } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { env } from "../env.js";
import { HttpError } from "../middleware/error.js";
import { CATALOG, toRecord } from "./catalog.js";

/**
 * Order-number alphabet.
 *
 * The customer retypes this into a Venmo / Cash App payment note by hand, and
 * we match on it to approve the order — so 0/O and 1/I/L are excluded outright.
 * Six characters over 30 symbols is ~729M combinations, and we retry on
 * collision rather than trusting that.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateOrderNumber(): string {
  let out = "";
  for (let i = 0; i < 6; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return `PP-${out}`;
}

/** Free shipping is the standing offer; the column exists so it can change. */
export const SHIPPING_CENTS = 0;

export interface CartLine {
  slug: string;
  quantity: number;
}

export interface PricedLine {
  productId: number | null;
  slug: string;
  name: string;
  dosage: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

/**
 * Prices every line from the catalog, ignoring anything the client claimed.
 *
 * The browser sends only slug + quantity. Trusting a client-supplied price is
 * how storefronts get bought for a penny, so the unit price is always looked up
 * here and the totals are derived from the lookup.
 */
export async function priceCart(lines: CartLine[]): Promise<{
  items: PricedLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}> {
  if (!lines.length) throw new HttpError(400, "Cart is empty");
  if (lines.length > 50) throw new HttpError(400, "Too many distinct items");

  // Collapse duplicate slugs rather than pricing them twice.
  const wanted = new Map<string, number>();
  for (const l of lines) {
    const q = Math.floor(l.quantity);
    if (!Number.isFinite(q) || q < 1 || q > 99) {
      throw new HttpError(400, `Invalid quantity for ${l.slug}`);
    }
    wanted.set(l.slug, (wanted.get(l.slug) ?? 0) + q);
  }
  const slugs = [...wanted.keys()];

  type Row = { id: number | null; slug: string; name: string; dosage: string; priceCents: number | null; status: string };
  let rows: Row[];

  if (db) {
    rows = await db
      .select({
        id: schema.products.id,
        slug: schema.products.slug,
        name: schema.products.name,
        dosage: schema.products.dosage,
        priceCents: schema.products.priceCents,
        status: schema.products.status,
      })
      .from(schema.products)
      .where(inArray(schema.products.slug, slugs));
  } else {
    // Demo mode: price against the seed catalog so checkout is testable with no DB.
    rows = CATALOG.products
      .map(toRecord)
      .filter((p) => slugs.includes(p.slug))
      .map((p) => ({
        id: null, slug: p.slug, name: p.name, dosage: p.dosage,
        priceCents: p.priceCents, status: p.status,
      }));
  }

  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const items: PricedLine[] = [];

  for (const [slug, quantity] of wanted) {
    const p = bySlug.get(slug);
    if (!p) throw new HttpError(400, `Unknown product: ${slug}`);
    if (p.status !== "active") throw new HttpError(400, `${p.name} is not currently available`);
    if (p.priceCents === null) throw new HttpError(400, `${p.name} is priced on request and cannot be ordered online`);

    items.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      dosage: p.dosage,
      unitPriceCents: p.priceCents,
      quantity,
      lineTotalCents: p.priceCents * quantity,
    });
  }

  const subtotalCents = items.reduce((a, i) => a + i.lineTotalCents, 0);
  const shippingCents = SHIPPING_CENTS;
  return { items, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents };
}

/** Reserve a collision-free order number. */
export async function reserveOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateOrderNumber();
    if (!db) return candidate;
    const clash = await db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(eq(schema.orders.orderNumber, candidate))
      .limit(1);
    if (!clash.length) return candidate;
  }
  throw new HttpError(500, "Could not allocate an order number");
}

export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function paymentLinks() {
  return {
    cashapp: env.CASHAPP_PAYMENT_URL,
    venmo: env.VENMO_PAYMENT_URL,
    cashappHandle: env.CASHAPP_PAYMENT_URL.split("/").pop() ?? "",
    venmoHandle: env.VENMO_PAYMENT_URL.split("/").pop() ?? "",
  };
}

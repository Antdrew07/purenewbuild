const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const ordersApiConfigured = Boolean(API_URL);

export type ShippingMethod = "standard" | "next_day";

/** Same shipping rules as the API: $15 standard, free from $200 (before discounts), $65 next-day. */
export function shippingCentsFor(subtotalCents: number, method: ShippingMethod): number {
  if (method === "next_day") return 6_500;
  return subtotalCents >= 20_000 ? 0 : 1_500;
}

export interface PlacedOrder {
  orderNumber: string;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  totalFormatted: string;
  promoCode?: string | null;
  discountCents?: number;
  shippingMethod?: ShippingMethod;
  pointsRedeemed?: number;
  pointsDiscountCents?: number;
  pointsEarned?: number;
  items: { name: string; dosage: string; quantity: number; lineTotalCents: number }[];
  payment: { cashapp: string; venmo: string; cashappHandle: string; venmoHandle: string };
}

export interface PlaceOrderInput {
  email: string;
  name: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  customerNote?: string;
  promoCode?: string;
  shippingMethod?: ShippingMethod;
  redeemPoints?: number;
  items: { slug: string; quantity: number }[];
}

export class OrderError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Places an order. Only slug + quantity are sent — the API prices every line
 * from the catalog, so nothing the browser claims about price is trusted.
 */
export async function placeOrder(input: PlaceOrderInput, memberToken?: string | null): Promise<PlacedOrder> {
  if (!API_URL) {
    throw new OrderError(503, "Checkout is not connected yet — NEXT_PUBLIC_API_URL is not set.");
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(memberToken ? { Authorization: `Bearer ${memberToken}` } : {}),
      },
      body: JSON.stringify({ country: "US", ...input }),
    });
  } catch {
    throw new OrderError(0, "Could not reach the server. Check your connection and try again.");
  }

  const json = (await res.json().catch(() => null)) as
    | { data?: PlacedOrder; error?: string; details?: { message?: string }[] }
    | null;

  if (!res.ok || !json?.data) {
    const detail = json?.details?.[0]?.message ?? json?.error;
    throw new OrderError(res.status, detail ?? `Order failed (${res.status})`);
  }
  return json.data;
}

/** Look an order up again later. The email must match — the number alone is not enough. */
export async function lookupOrder(orderNumber: string, email: string) {
  if (!API_URL) throw new OrderError(503, "Order lookup is not available yet.");
  const res = await fetch(
    `${API_URL}/api/orders/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`,
  );
  const json = (await res.json().catch(() => null)) as { data?: unknown; error?: string } | null;
  if (!res.ok || !json?.data) throw new OrderError(res.status, json?.error ?? "Order not found");
  return json.data as PlacedOrder & { trackingNumber?: string | null; trackingUrl?: string | null };
}

export interface MemberOrder {
  orderNumber: string;
  status: string;
  promoCode?: string | null;
  discountCents?: number;
  shippingMethod?: ShippingMethod;
  shippingCents?: number;
  pointsRedeemed?: number;
  pointsDiscountCents?: number;
  pointsEarned?: number;
  totalCents: number;
  totalFormatted: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  createdAt: string;
  items: { name: string; dosage: string; quantity: number; lineTotalCents: number }[];
}

/** The signed-in member's order history, newest first. */
export async function myOrders(memberToken: string): Promise<MemberOrder[]> {
  if (!API_URL) throw new OrderError(503, "Order history is not available yet.");
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/orders/mine`, { headers: { Authorization: `Bearer ${memberToken}` } });
  } catch {
    throw new OrderError(0, "Could not reach the server. Check your connection and try again.");
  }
  const json = (await res.json().catch(() => null)) as { data?: MemberOrder[]; error?: string } | null;
  if (!res.ok || !json?.data) throw new OrderError(res.status, json?.error ?? "Could not load your orders");
  return json.data;
}

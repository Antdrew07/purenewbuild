const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const ordersApiConfigured = Boolean(API_URL);

export interface PlacedOrder {
  orderNumber: string;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  totalFormatted: string;
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
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  if (!API_URL) {
    throw new OrderError(503, "Checkout is not connected yet — NEXT_PUBLIC_API_URL is not set.");
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

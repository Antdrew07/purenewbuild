import { env, isShippoConfigured } from "../env.js";

/**
 * Shippo label purchase.
 *
 * Deliberately fail-soft: approving an order is a business action that must
 * succeed even when the carrier API is down, misconfigured, or out of postage
 * balance. Every function here returns a result object instead of throwing, and
 * the caller records the reason on the order so an admin can retry.
 */

const BASE = "https://api.goshippo.com";

function headers() {
  return {
    Authorization: `ShippoToken ${env.SHIPPO_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export interface LabelResult {
  ok: boolean;
  reason?: string;
  transactionId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  labelUrl?: string;
}

export interface ShipTo {
  name: string;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  email?: string;
  phone?: string | null;
}

async function post<T>(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: T | null; raw: string }> {
  const r = await fetch(`${BASE}${path}`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  const raw = await r.text();
  let data: T | null = null;
  try { data = JSON.parse(raw) as T; } catch { /* non-JSON error body */ }
  return { ok: r.ok, status: r.status, data, raw };
}

/**
 * Buy the cheapest available label for one order.
 *
 * Uses Shippo's one-call create+purchase flow (`async: false`) so we either get
 * a usable label back or a reason, with no polling state to manage.
 */
export async function buyLabel(opts: {
  to: ShipTo;
  orderNumber: string;
  /** Total ounces. Defaults to a small padded-envelope weight. */
  weightOz?: number;
}): Promise<LabelResult> {
  if (!isShippoConfigured) return { ok: false, reason: "SHIPPO_API_KEY is not set" };
  if (!env.SHIP_FROM_NAME || !env.SHIP_FROM_STREET1 || !env.SHIP_FROM_ZIP) {
    return { ok: false, reason: "Ship-from address is not configured (SHIP_FROM_*)" };
  }

  const addressFrom = {
    name: env.SHIP_FROM_NAME,
    company: env.SHIP_FROM_COMPANY || undefined,
    street1: env.SHIP_FROM_STREET1,
    street2: env.SHIP_FROM_STREET2 || undefined,
    city: env.SHIP_FROM_CITY,
    state: env.SHIP_FROM_STATE,
    zip: env.SHIP_FROM_ZIP,
    country: env.SHIP_FROM_COUNTRY || "US",
    phone: env.SHIP_FROM_PHONE || undefined,
    email: env.OWNER_EMAIL || undefined,
  };

  const addressTo = {
    name: opts.to.name,
    street1: opts.to.street1,
    street2: opts.to.street2 || undefined,
    city: opts.to.city,
    state: opts.to.state,
    zip: opts.to.zip,
    country: opts.to.country || "US",
    email: opts.to.email,
    phone: opts.to.phone || undefined,
  };

  const shipment = await post<{
    object_id: string;
    status: string;
    rates: { object_id: string; amount: string; provider: string; servicelevel: { name: string } }[];
    messages?: { text: string }[];
  }>("/shipments/", {
    address_from: addressFrom,
    address_to: addressTo,
    parcels: [{
      length: "9", width: "6", height: "2", distance_unit: "in",
      weight: String(opts.weightOz ?? 8), mass_unit: "oz",
    }],
    async: false,
  });

  if (!shipment.ok || !shipment.data) {
    return { ok: false, reason: `Shippo shipment failed (${shipment.status}): ${shipment.raw.slice(0, 300)}` };
  }
  const rates = shipment.data.rates ?? [];
  if (!rates.length) {
    const msg = shipment.data.messages?.map((m) => m.text).join("; ");
    return { ok: false, reason: `No rates returned${msg ? `: ${msg}` : ""}` };
  }

  const cheapest = rates.reduce((a, b) => (Number(a.amount) <= Number(b.amount) ? a : b));

  const tx = await post<{
    object_id: string;
    status: string;
    tracking_number?: string;
    tracking_url_provider?: string;
    label_url?: string;
    messages?: { text: string }[];
  }>("/transactions/", {
    rate: cheapest.object_id,
    label_file_type: "PDF_4x6",
    async: false,
    metadata: opts.orderNumber,
  });

  if (!tx.ok || !tx.data) {
    return { ok: false, reason: `Shippo transaction failed (${tx.status}): ${tx.raw.slice(0, 300)}` };
  }
  if (tx.data.status !== "SUCCESS") {
    const msg = tx.data.messages?.map((m) => m.text).join("; ");
    return { ok: false, reason: `Label not purchased (${tx.data.status})${msg ? `: ${msg}` : ""}` };
  }

  return {
    ok: true,
    transactionId: tx.data.object_id,
    trackingNumber: tx.data.tracking_number,
    trackingUrl: tx.data.tracking_url_provider,
    labelUrl: tx.data.label_url,
  };
}

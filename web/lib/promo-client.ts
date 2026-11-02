const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface PromoInfo {
  valid: boolean;
  code: string | null;
  discountPercent: number | null;
  affiliateName: string | null;
  message: string;
}

/** Checks a promo code with the API; never throws on an invalid code, only on transport failure. */
export async function validatePromo(code: string): Promise<PromoInfo> {
  if (!API_URL) return { valid: false, code: null, discountPercent: null, affiliateName: null, message: "Promo codes are not available yet." };
  const res = await fetch(`${API_URL}/api/promo/validate?code=${encodeURIComponent(code)}`);
  const json = (await res.json().catch(() => null)) as { data?: PromoInfo; error?: string } | null;
  if (!res.ok || !json?.data) throw new Error(json?.error ?? "Could not check that code right now.");
  return json.data;
}

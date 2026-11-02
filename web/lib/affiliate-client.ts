const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface CreditTransaction {
  id: number;
  type: string;
  amountCents: number;
  balanceAfterCents: number;
  orderNumber: string | null;
  description: string;
  createdAt: string;
}

export interface AffiliateStats {
  code: string;
  affiliateName: string;
  isActive: boolean;
  totalOrders: number;
  totalRevenueCents: number;
  totalDiscountCents: number;
  totalCommissionCents: number;
  selfOrders: number;
  commissionRate: number;
  discountRate: number;
  orders: { id: number; orderNumber: string; status: string; totalCents: number; discountCents: number; createdAt: string; isSelf: boolean }[];
}

export interface AffiliateMe {
  code: string | null;
  balanceCents: number;
  history: CreditTransaction[];
  stats: AffiliateStats | null;
}

async function call<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error("Affiliate tools are not available yet.");
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers },
  });
  const json = (await res.json().catch(() => null)) as { data?: T; error?: string } | null;
  if (!res.ok || !json?.data) throw new Error(json?.error ?? `Request failed (${res.status})`);
  return json.data;
}

export const myAffiliate = (token: string) => call<AffiliateMe>("/api/affiliate/me", token);
export const linkAffiliateCode = (token: string, code: string) =>
  call<{ code: string; affiliateName: string }>("/api/affiliate/link", token, { method: "POST", body: JSON.stringify({ code }) });

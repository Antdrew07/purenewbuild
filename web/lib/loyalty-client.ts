const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface LoyaltyTransaction {
  id: number;
  type: "earn" | "redeem" | "adjustment" | string;
  points: number;
  balanceAfter: number;
  orderNumber: string | null;
  description: string;
  createdAt: string;
}

export interface LoyaltySummary {
  balance: number;
  lifetime: number;
  pointsPer100Dollars: number;
  history: LoyaltyTransaction[];
}

/** Earn 2 points per full $100 of the order total; each point is worth 1¢. Mirrors the API. */
export const pointsEarnedFor = (totalCents: number) => Math.floor(totalCents / 10_000) * 2;
export const pointsValueCents = (points: number) => Math.max(0, Math.floor(points));

export const TIERS = [
  { name: "Researcher", min: 0, max: 499 },
  { name: "Associate", min: 500, max: 1499 },
  { name: "Senior", min: 1500, max: 2999 },
  { name: "Elite", min: 3000, max: Infinity },
] as const;

export function tierFor(lifetime: number) {
  return TIERS.find((t) => lifetime >= t.min && lifetime <= t.max) ?? TIERS[0];
}
export function nextTierFor(lifetime: number) {
  const idx = TIERS.findIndex((t) => lifetime >= t.min && lifetime <= t.max);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export async function myLoyalty(token: string): Promise<LoyaltySummary> {
  if (!API_URL) throw new Error("Loyalty points are not available yet.");
  const res = await fetch(`${API_URL}/api/loyalty/me`, { headers: { Authorization: `Bearer ${token}` } });
  const json = (await res.json().catch(() => null)) as { data?: LoyaltySummary; error?: string } | null;
  if (!res.ok || !json?.data) throw new Error(json?.error ?? "Could not load your points.");
  return json.data;
}

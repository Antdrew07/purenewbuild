import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  DISCLAIMER,
  FREE_GIFT_TIERS,
} from "./demo";
import type { Category, FreeGiftTier, Product } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** The API flips on independently — no key, no crash, just seed data. */
export const isApiConfigured = Boolean(API_URL);

async function get<T>(path: string, revalidate = 300): Promise<T | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) {
      console.error("[api]", path, res.status);
      return null;
    }
    const json = (await res.json()) as { data: T };
    return json.data;
  } catch (err) {
    // A down API degrades to seed data rather than a 500 page.
    console.error("[api] unreachable", path, err);
    return null;
  }
}

export async function getProducts(): Promise<Product[]> {
  return (await get<Product[]>("/api/products?limit=100")) ?? DEMO_PRODUCTS;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const live = await get<Product[]>("/api/products?featured=true&limit=8");
  return live ?? DEMO_PRODUCTS.filter((p) => p.featured);
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (API_URL) {
    const live = await get<Product>(`/api/products/${slug}`);
    if (live) return live;
  }
  return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  return (await get<Category[]>("/api/categories")) ?? DEMO_CATEGORIES;
}

export function getFreeGiftTiers(): FreeGiftTier[] {
  return FREE_GIFT_TIERS;
}

export function getDisclaimer(): string {
  return DISCLAIMER;
}

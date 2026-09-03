import catalog from "./catalog.json";
import type { Category, FreeGiftTier, Product, ProductForm, ProductStatus } from "../types";

/**
 * Deterministic seed data so the site renders fully with zero credentials.
 * Anchored to a fixed reference date — never Date.now() — so server and client
 * markup match and hydration stays stable.
 */
export const REFERENCE_NOW = new Date("2026-08-22T12:00:00.000Z");

interface RawProduct {
  name: string;
  dosage: string;
  price: number | null;
  category: string;
  status: ProductStatus;
  featured?: boolean;
  form?: ProductForm;
  note?: string;
}

const raw = catalog as unknown as {
  disclaimer: string;
  freeGifts: FreeGiftTier[];
  categories: { slug: string; name: string; blurb: string }[];
  products: RawProduct[];
};

export function slugify(name: string, dosage: string): string {
  return `${name} ${dosage}`
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function describe(p: RawProduct): string {
  const dose = p.dosage ? ` ${p.dosage}` : "";
  return (
    `${p.name}${dose} is a research-grade compound supplied in a sealed, lyophilised vial. ` +
    `Every lot is third-party tested for identity and purity, with a Certificate of Analysis available on request. ` +
    (p.note ? `Composition: ${p.note}. ` : "") +
    `For laboratory research use only — not for human consumption, and not for diagnostic or therapeutic use.`
  );
}

export const DEMO_PRODUCTS: Product[] = raw.products.map((p, i) => ({
  id: i + 1,
  slug: slugify(p.name, p.dosage),
  name: p.name,
  dosage: p.dosage,
  priceCents: p.price === null ? null : Math.round(p.price * 100),
  category: p.category,
  status: p.status,
  featured: Boolean(p.featured),
  form: p.form ?? "vial",
  note: p.note ?? null,
  description: describe(p),
  imageUrl: null,
  coaUrl: null,
}));

export const DEMO_CATEGORIES: Category[] = raw.categories.map((c) => ({
  slug: c.slug,
  name: c.name,
  blurb: c.blurb,
  count: DEMO_PRODUCTS.filter((p) => p.category === c.slug).length,
}));

export const FREE_GIFT_TIERS: FreeGiftTier[] = raw.freeGifts;
export const DISCLAIMER: string = raw.disclaimer;

import catalog from "../db/catalog.json" with { type: "json" };

export type CatalogStatus = "active" | "out_of_stock" | "coming_soon" | "unavailable";
export type ProductForm = "vial" | "dropper" | "spray" | "pen" | "pills" | "jar";

export interface CatalogProduct {
  name: string;
  dosage: string;
  price: number | null;
  category: string;
  status: CatalogStatus;
  featured?: boolean;
  note?: string;
  form?: ProductForm;
}

export const CATALOG = catalog as unknown as {
  source: string;
  currency: string;
  disclaimer: string;
  freeGifts: { min: number; max: number | null; gift: string }[];
  categories: { slug: string; name: string; blurb: string }[];
  products: CatalogProduct[];
};

export function slugify(name: string, dosage: string): string {
  return `${name} ${dosage}`
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const CONTAINER: Record<ProductForm, string> = {
  vial: "a sealed, lyophilised vial",
  dropper: "a sealed dropper bottle",
  spray: "a ready-to-use nasal spray",
  pills: "a sealed bottle of capsules",
  jar: "a sealed cosmetic jar",
  pen: "a ready-to-use pen kit",
};

export function describe(p: CatalogProduct): string {
  const dose = p.dosage ? ` ${p.dosage}` : "";
  return (
    `${p.name}${dose} is a research-grade compound supplied in ${CONTAINER[p.form ?? "vial"]}. ` +
    `Every lot is third-party tested for identity and purity, with a Certificate of Analysis available on request. ` +
    (p.note ? `Composition: ${p.note}. ` : "") +
    `For laboratory research use only — not for human consumption, and not for diagnostic or therapeutic use.`
  );
}

/** The wire shape returned by every product endpoint, live or demo. */
export interface ProductRecord {
  id: number;
  slug: string;
  name: string;
  dosage: string;
  priceCents: number | null;
  category: string;
  status: CatalogStatus;
  featured: boolean;
  form: ProductForm;
  note: string | null;
  description: string | null;
  imageUrl: string | null;
  coaUrl: string | null;
}

/** Deterministic record used by the demo repository and the seeder. */
export function toRecord(p: CatalogProduct, index: number): ProductRecord {
  return {
    id: index + 1,
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
  };
}

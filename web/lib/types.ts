export type ProductStatus = "active" | "out_of_stock" | "coming_soon" | "unavailable";

/** Which physical mockup a product is rendered as. */
export type ProductForm = "vial" | "dropper" | "spray" | "pen";

export interface Product {
  id: number;
  slug: string;
  name: string;
  dosage: string;
  priceCents: number | null;
  category: string;
  status: ProductStatus;
  featured: boolean;
  form: ProductForm;
  note: string | null;
  description: string | null;
  imageUrl: string | null;
  coaUrl: string | null;
}

export interface Category {
  slug: string;
  name: string;
  blurb: string | null;
  count: number;
}

export interface FreeGiftTier {
  min: number;
  max: number | null;
  gift: string;
}

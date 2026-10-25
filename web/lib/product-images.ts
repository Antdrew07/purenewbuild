/**
 * A few products are photographed with their own finished label art, so they
 * use that image directly instead of the generated blank-panel mockup.
 * Keyed by slug (slugify of name + dosage).
 */
export const CUSTOM_PRODUCT_IMAGES: Record<string, string> = {
  "ghk-cu-face-serum-30ml": "/products/ghk-cu-face-serum.png",
  "ghk-cu-snap-8-face-cream": "/products/ghk-cu-snap8-face-cream.png",
  "ghk-cu-snap-8-methylene-blue-balm": "/products/ghk-cu-snap8-methylene-blue-balm.png",
};

export function productImage(p: { slug: string; imageUrl?: string | null }): string | null {
  return p.imageUrl ?? CUSTOM_PRODUCT_IMAGES[p.slug] ?? null;
}

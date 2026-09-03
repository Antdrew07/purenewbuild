/** Prices are stored in cents everywhere; format at the edge only. */
export function formatPrice(cents: number | null): string {
  if (cents === null) return "Enquire";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export const STATUS_LABEL: Record<string, string> = {
  active: "In stock",
  out_of_stock: "Out of stock",
  coming_soon: "Coming soon",
  unavailable: "Enquire",
};

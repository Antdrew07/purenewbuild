import type { ProductStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/format";

/**
 * Each tone carries an explicit light-mode override — the dark-mode pastels
 * drop below 4.5:1 on a white card.
 */
const TONE: Record<ProductStatus, string> = {
  active:
    "border-emerald-400/35 bg-emerald-400/10 text-emerald-300 light:border-emerald-700/40 light:bg-emerald-700/10 light:text-emerald-800",
  out_of_stock:
    "border-chrome-500/40 bg-chrome-500/10 text-chrome-300 light:text-chrome-700",
  coming_soon:
    "border-blue/40 bg-blue/10 text-blue",
  unavailable:
    "border-chrome-600/40 bg-chrome-600/10 text-chrome-400 light:text-chrome-700",
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Fixed compliance marker — required on every product surface. */
export function RuoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded border border-red/40 bg-red/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-red ${className}`}
    >
      Research use only
    </span>
  );
}

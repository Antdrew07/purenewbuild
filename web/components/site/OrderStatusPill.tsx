import { ORDER_STATUS_LABEL } from "@/lib/format";

const TONE: Record<string, string> = {
  awaiting_payment: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  paid: "border-blue/40 bg-blue/10 text-blue",
  shipped: "border-emerald-600/40 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300",
  cancelled: "border-chrome-500/40 bg-chrome-500/10 text-chrome-700 dark:text-chrome-300",
};

export function OrderStatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${TONE[status] ?? TONE.cancelled}`}>
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}

import { formatCents } from "@/lib/cart";
import type { MemberOrder } from "@/lib/orders-client";
import { OrderStatusPill } from "./OrderStatusPill";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

/** One order, as shown in account history and the public tracker. */
export function OrderSummaryCard({ order }: { order: MemberOrder }) {
  return (
    <article className="rounded-2xl border border-border-hair bg-bg-elevated p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Order</p>
          <p className="mt-1 font-display text-2xl font-black tracking-[0.08em] text-text-primary">{order.orderNumber}</p>
          <p className="mt-1 text-xs text-text-secondary">Placed {fmtDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <OrderStatusPill status={order.status} />
          <p className="mt-2 font-display text-2xl font-black tabular-nums text-text-primary">{formatCents(order.totalCents)}</p>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-border-hair border-t border-border-hair text-sm">
        {order.items.map((i, idx) => (
          <li key={`${i.name}-${idx}`} className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-text-secondary">
              {i.name}{i.dosage ? ` ${i.dosage}` : ""} <span className="text-text-dim">× {i.quantity}</span>
            </span>
            <span className="tabular-nums text-text-primary">{formatCents(i.lineTotalCents)}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-1 py-2.5 text-sm">
        {order.discountCents ? (
          <p className="flex justify-between">
            <span className="text-emerald-600">Promo {order.promoCode}</span>
            <span className="tabular-nums text-emerald-600">−{formatCents(order.discountCents)}</span>
          </p>
        ) : null}
        {order.pointsDiscountCents ? (
          <p className="flex justify-between">
            <span className="text-violet-600">Loyalty points</span>
            <span className="tabular-nums text-violet-600">−{formatCents(order.pointsDiscountCents)}</span>
          </p>
        ) : null}
        {order.creditDiscountCents ? (
          <p className="flex justify-between">
            <span className="text-emerald-600">Affiliate credit</span>
            <span className="tabular-nums text-emerald-600">−{formatCents(order.creditDiscountCents)}</span>
          </p>
        ) : null}
        {order.shippingCents !== undefined && (
          <p className="flex justify-between">
            <span className="text-text-secondary">Shipping</span>
            <span className="tabular-nums text-text-primary">{order.shippingCents > 0 ? formatCents(order.shippingCents) : "Free"}</span>
          </p>
        )}
      </div>

      {order.trackingNumber && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-hair bg-bg-base/60 px-4 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Tracking number</p>
            <p className="mt-0.5 font-semibold text-text-primary">{order.trackingNumber}</p>
          </div>
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-text-primary px-4 text-xs font-bold uppercase tracking-wider text-bg-base transition-opacity hover:opacity-85">
              Track shipment
            </a>
          )}
        </div>
      )}
    </article>
  );
}

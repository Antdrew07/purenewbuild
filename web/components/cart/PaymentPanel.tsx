"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { formatCents } from "@/lib/cart";
import type { PlacedOrder } from "@/lib/orders-client";

/**
 * Post-checkout payment step.
 *
 * The order number is the only link between a Venmo/Cash App transfer and the
 * order, so it is the loudest element on the page and is copyable in one tap —
 * a mistyped note means a payment nobody can match.
 */
export function PaymentPanel({ order }: { order: PlacedOrder }) {
  const [copied, setCopied] = useState(false);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      toast.success("Order number copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — please select and copy it manually");
    }
  }

  return (
    <section className="commerce-page mx-auto max-w-2xl px-5 pb-20 pt-32 sm:px-8">
      <div className="text-center">
        <div className="success-seal mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-500/10">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-4xl font-black uppercase leading-none text-text-primary sm:text-5xl">
          Order received
        </h1>
        <p className="mt-3 text-text-secondary">
          One step left — send payment so we can release it.
        </p>
      </div>

      {/* Payment note — the single thing that must not be got wrong. */}
      <div className="payment-note mt-9 rounded-2xl border-2 border-red bg-red/5 p-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-dim">
          Put this in the payment note
        </p>
        <p className="mt-2 font-display text-4xl font-black tracking-[0.15em] text-red sm:text-5xl">
          {order.orderNumber}
        </p>
        <button
          type="button"
          onClick={copyNumber}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold text-red transition-colors hover:bg-red/10"
        >
          {copied ? "Copied" : "Copy order number"}
        </button>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          Without it we cannot match your payment to this order.
        </p>
      </div>

      <div className="order-ticket mt-7 rounded-2xl border border-border-hair bg-bg-elevated p-6">
        <div className="flex items-baseline justify-between">
          <span className="font-bold text-text-primary">Amount to send</span>
          <span className="font-display text-3xl font-black tabular-nums text-text-primary">
            {order.totalFormatted}
          </span>
        </div>

        <ul className="mt-4 space-y-1.5 border-t border-border-hair pt-4 text-sm">
          {order.items.map((i) => (
            <li key={`${i.name}-${i.dosage}`} className="flex justify-between gap-3">
              <span className="min-w-0 truncate text-text-secondary">
                {i.name} {i.dosage} × {i.quantity}
              </span>
              <span className="shrink-0 tabular-nums text-text-primary">{formatCents(i.lineTotalCents)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-3">
          <a
            href={order.payment.cashapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00B841] px-5 text-sm font-bold text-white transition-all hover:brightness-110"
          >
            Pay {order.totalFormatted} with Cash App
            <span className="font-mono opacity-90">{order.payment.cashappHandle}</span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <a
            href={order.payment.venmo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#008CFF] px-5 text-sm font-bold text-white transition-all hover:brightness-110"
          >
            Pay {order.totalFormatted} with Venmo
            <span className="font-mono opacity-90">{order.payment.venmoHandle}</span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>

      <div className="payment-steps mt-7 rounded-2xl border border-border-hair bg-bg-elevated p-6 text-sm leading-relaxed text-text-secondary">
        <h2 className="font-display text-base font-black uppercase tracking-wide text-text-primary">
          What happens next
        </h2>
        <ol className="mt-3 space-y-2">
          <li><strong className="text-text-primary">1.</strong> Send {order.totalFormatted} using either option above, with <strong className="text-text-primary">{order.orderNumber}</strong> in the note.</li>
          <li><strong className="text-text-primary">2.</strong> We verify the transfer and approve your order.</li>
          <li><strong className="text-text-primary">3.</strong> You get an email with your tracking number.</li>
        </ol>
        <p className="mt-4 text-xs text-text-dim">
          A copy of these details is in your inbox. Orders dispatch within 48 hours; the Friday cut-off is
          2pm CT and Friday orders ship Monday. Every order includes reconstitution liquid.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/products" className="inline-flex min-h-11 items-center rounded-xl border border-border-hair px-6 text-sm font-semibold text-text-primary transition-colors hover:border-red/60 hover:text-red">
          Continue shopping
        </Link>
        <Link href="/contact" className="inline-flex min-h-11 items-center rounded-xl border border-border-hair px-6 text-sm font-semibold text-text-primary transition-colors hover:border-red/60 hover:text-red">
          Need help?
        </Link>
      </div>
    </section>
  );
}

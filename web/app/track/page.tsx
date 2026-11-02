"use client";

import { useState, type FormEvent } from "react";
import { lookupOrder, OrderError, type MemberOrder } from "@/lib/orders-client";
import { OrderSummaryCard } from "@/components/site/OrderSummaryCard";

/** Public tracker: order number + the email it was placed with. */
export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<MemberOrder | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setOrder(null);
    setPending(true);
    try {
      const found = await lookupOrder(orderNumber.trim(), email.trim());
      setOrder({
        orderNumber: found.orderNumber,
        status: found.status,
        totalCents: found.totalCents,
        totalFormatted: found.totalFormatted,
        trackingNumber: found.trackingNumber ?? null,
        trackingUrl: found.trackingUrl ?? null,
        createdAt: (found as { createdAt?: string }).createdAt ?? new Date().toISOString(),
        items: found.items,
      });
    } catch (cause) {
      setError(cause instanceof OrderError ? cause.message : "Could not look up that order.");
    } finally {
      setPending(false);
    }
  }

  const input = "commerce-input min-h-11 w-full rounded-xl border border-border-hair bg-bg-base/60 px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:border-red/60 focus:outline-none";

  return (
    <section className="commerce-page mx-auto max-w-3xl px-5 pb-20 pt-32 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">Where is my order?</p>
      <h1 className="mt-3 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl">
        <span className="chrome-text chrome-shine">Track</span> <span className="text-red red-chrome">Order</span>
      </h1>
      <p className="mt-4 max-w-xl text-text-secondary">
        Enter your order number and the email you used at checkout. Both are on your confirmation email.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-border-hair bg-bg-elevated p-6 sm:grid-cols-[1fr_1fr_auto]" noValidate>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-text-dim">Order number</span>
          <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())} required placeholder="PP-XXXXXXXX" className={input} />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-text-dim">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className={input} />
        </label>
        <button type="submit" disabled={pending} className="brand-button mt-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-red px-6 text-sm font-semibold uppercase tracking-wider text-white disabled:opacity-50">
          {pending ? "Looking…" : "Track"}
        </button>
      </form>

      {error && <p role="alert" className="mt-5 text-sm text-red">{error}</p>}
      {order && <div className="mt-8"><OrderSummaryCard order={order} /></div>}
    </section>
  );
}

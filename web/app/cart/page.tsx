"use client";

import Link from "next/link";
import { ProductMockup } from "@/components/ui/ProductMockup";
import { formatCents, useCart } from "@/lib/cart";
import type { ProductForm } from "@/lib/types";

export default function CartPage() {
  const { lines, setQty, remove, subtotalCents, hydrated, count } = useCart();

  return (
    <section className="commerce-page mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">Your order</p>
      <h1 className="mt-3 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl">
        <span className="chrome-text chrome-shine">The</span> <span className="text-red red-chrome">Cart</span>
      </h1>

      {!hydrated ? (
        <div className="mt-12 space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border-hair bg-bg-elevated" />
          ))}
        </div>
      ) : lines.length === 0 ? (
        <div className="commerce-empty mt-12 rounded-2xl border border-border-hair bg-bg-elevated p-12 text-center">
          <p className="text-lg font-semibold text-text-primary">Your cart is empty.</p>
          <p className="mt-2 text-sm text-text-secondary">
            Browse the catalog and add what you need — every order ships with reconstitution liquid.
          </p>
          <Link
            href="/products"
            className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-red px-7 text-sm font-bold uppercase tracking-wide text-white transition-all hover:brightness-110"
          >
            Shop the catalog
          </Link>
        </div>
      ) : (
        <div className="commerce-layout mt-12 grid gap-10 lg:grid-cols-[1fr_20rem]">
          <ul className="space-y-3">
            {lines.map((l) => (
              <li
                key={l.slug}
                className="cart-line flex items-center gap-4 rounded-2xl border border-border-hair bg-bg-elevated p-4"
              >
                <Link href={`/products/${l.slug}`} className="shrink-0">
                  <ProductMockup form={l.form as ProductForm} name={l.name} dosage={l.dosage} className="h-20" />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`/products/${l.slug}`} className="block font-display text-lg font-bold uppercase leading-tight text-text-primary hover:text-red">
                    {l.name}
                  </Link>
                  <p className="mt-0.5 text-sm text-text-secondary">{l.dosage}</p>
                  <p className="mt-1 font-mono text-sm text-text-secondary">{formatCents(l.priceCents)} each</p>
                </div>

                <div className="cart-quantity flex items-center overflow-hidden rounded-xl border border-border-hair">
                  <button
                    type="button" aria-label={`Decrease quantity for ${l.name}`}
                    onClick={() => setQty(l.slug, l.quantity - 1)}
                    className="grid h-11 w-10 place-items-center text-text-secondary hover:text-red"
                  >−</button>
                  <span className="grid h-11 w-10 place-items-center border-x border-border-hair text-sm font-semibold tabular-nums">
                    {l.quantity}
                  </span>
                  <button
                    type="button" aria-label={`Increase quantity for ${l.name}`}
                    onClick={() => setQty(l.slug, l.quantity + 1)}
                    className="grid h-11 w-10 place-items-center text-text-secondary hover:text-red"
                  >+</button>
                </div>

                <div className="w-20 shrink-0 text-right">
                  <p className="font-display text-lg font-bold tabular-nums text-text-primary">
                    {formatCents(l.priceCents * l.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(l.slug)}
                    className="mt-1 text-xs text-text-dim underline-offset-2 hover:text-red hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <aside className="order-ticket h-fit rounded-2xl border border-border-hair bg-bg-elevated p-6 lg:sticky lg:top-28">
            <h2 className="font-display text-lg font-black uppercase tracking-wide text-text-primary">Summary</h2>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Items</dt>
                <dd className="tabular-nums text-text-primary">{count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Subtotal</dt>
                <dd className="tabular-nums text-text-primary">{formatCents(subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Shipping</dt>
                <dd className="font-semibold text-green-600 dark:text-green-400">Free</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-between border-t border-border-hair pt-4">
              <span className="font-bold text-text-primary">Total</span>
              <span className="font-display text-2xl font-black tabular-nums text-text-primary">
                {formatCents(subtotalCents)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-red text-sm font-bold uppercase tracking-wide text-white transition-all hover:brightness-110"
            >
              Checkout
            </Link>
            <p className="mt-3 text-center text-xs leading-relaxed text-text-dim">
              Pay by Cash App or Venmo after checkout. Reconstitution liquid included.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}

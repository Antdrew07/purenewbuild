"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

/**
 * Add-to-cart control.
 *
 * Products with no price cannot be ordered online — the API rejects them — so
 * the button says so here rather than letting checkout fail later.
 *
 * On add, the button runs a liquid fill, the label flips to "Added", and a
 * `pp:cart-add` event tells any VialFill on the page to fill the vial too.
 */
export function AddToCart({
  product,
  size = "lg",
  className = "",
}: {
  product: Product;
  size?: "sm" | "lg";
  className?: string;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [notice, setNotice] = useState("");
  const [filling, setFilling] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const orderable = product.status === "active" && product.priceCents !== null;

  if (!orderable) {
    return (
      <span
        className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-border-hair px-5 text-sm font-semibold text-text-secondary ${className}`}
      >
        {product.priceCents === null ? "Enquire for price" : "Out of stock"}
      </span>
    );
  }

  const base =
    "purchase-button inline-flex min-h-11 items-center justify-center rounded-xl bg-red font-bold uppercase tracking-wide text-white transition-all hover:brightness-110 active:translate-y-px";

  function addItem(quantity: number) {
    add(product, quantity);
    const message = quantity === 1 ? `${product.name} added to cart` : `${quantity} × ${product.name} added to cart`;
    setNotice(message);
    toast.success(message);
    window.dispatchEvent(new CustomEvent("pp:cart-add", { detail: { slug: product.slug } }));
    setFilling(false);
    requestAnimationFrame(() => setFilling(true));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFilling(false), 1300);
  }

  const label = (
    <span className="relative z-[1] inline-flex items-center gap-1.5">
      {filling ? (
        <>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Added
        </>
      ) : (
        "Add to cart"
      )}
    </span>
  );

  if (size === "sm") {
    return (
      <button
        type="button"
        onClick={() => addItem(1)}
        className={`${base} ${filling ? "is-filling" : ""} w-full px-4 text-xs ${className}`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className={`purchase-control flex flex-wrap items-center gap-3 ${className}`}>
      <span className="sr-only" aria-live="polite">{notice}</span>
      <div className="purchase-quantity flex items-center overflow-hidden rounded-xl border border-border-hair">
        <button
          type="button"
          aria-label={`Decrease quantity for ${product.name}`}
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          className="grid h-11 w-11 place-items-center text-lg text-text-secondary transition-colors hover:text-red disabled:cursor-not-allowed disabled:opacity-35"
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={99}
          value={qty}
          aria-label={`Quantity for ${product.name}`}
          onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
          className="h-11 w-14 border-x border-border-hair bg-transparent text-center text-sm font-semibold text-text-primary focus:outline-none"
        />
        <button
          type="button"
          aria-label={`Increase quantity for ${product.name}`}
          onClick={() => setQty((q) => Math.min(99, q + 1))}
          disabled={qty >= 99}
          className="grid h-11 w-11 place-items-center text-lg text-text-secondary transition-colors hover:text-red disabled:cursor-not-allowed disabled:opacity-35"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={() => addItem(qty)}
        className={`${base} ${filling ? "is-filling" : ""} flex-1 px-7 text-sm`}
      >
        {label}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

/**
 * Add-to-cart control.
 *
 * Products with no price cannot be ordered online — the API rejects them — so
 * the button says so here rather than letting checkout fail later.
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
  }

  if (size === "sm") {
    return (
      <button
        type="button"
        onClick={() => addItem(1)}
        className={`${base} w-full px-4 text-xs ${className}`}
      >
        Add to cart
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
        className={`${base} flex-1 px-7 text-sm`}
      >
        Add to cart
      </button>
    </div>
  );
}

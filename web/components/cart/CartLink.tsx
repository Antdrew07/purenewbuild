"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

/** Nav cart button. Renders no count until hydrated so SSR and client agree. */
export function CartLink({ className = "" }: { className?: string }) {
  const { count, hydrated } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={hydrated && count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
      className={`cart-link relative grid h-11 w-11 place-items-center rounded-lg border border-border-hair bg-bg-glass text-text-primary backdrop-blur transition-colors hover:border-red/50 hover:text-red ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3h2l.6 3M7 13h10l3-8H5.6M7 13 5.6 6M7 13l-1.5 5h13" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
      </svg>
      {hydrated && count > 0 && (
        <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red px-1 font-mono text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

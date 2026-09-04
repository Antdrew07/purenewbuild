"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { fadeUp } from "@/lib/motion";
import { StatusBadge } from "./Badge";
import { ProductMockup } from "./ProductMockup";
import { AddToCart } from "@/components/cart/AddToCart";

/**
 * The card links to the product, but Add to cart is a real button that must not
 * navigate — so the link wraps only the image and text, and the button sits
 * outside it. Nesting a button inside an anchor is invalid HTML and would fire
 * both actions on one tap.
 */
export function ProductCard({ product }: { product: Product }) {
  return (
    <motion.article variants={fadeUp} className="h-full">
      <div className="product-card group flex h-full flex-col overflow-hidden rounded-2xl border border-border-hair bg-bg-elevated shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red/35">
        <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
          {/* ── product shot on its own clean ground ─────────────────── */}
          <div className="product-card__stage relative flex items-center justify-center bg-white px-4 py-4">
            <ProductMockup
              form={product.form}
              name={product.name}
              dosage={product.dosage}
              className="relative h-52 transition-transform duration-300 group-hover:scale-[1.04]"
            />
            <div className="absolute left-4 top-4">
              <StatusBadge status={product.status} />
            </div>
          </div>

          {/* ── detail ─────────────────────────────────────────────────── */}
          <div className="product-card__body flex flex-1 flex-col border-t border-border-hair p-5 pb-0">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">
              {product.category}
            </p>

            <h3 className="mt-2 font-display text-xl font-bold uppercase leading-tight tracking-tight text-text-primary">
              {product.name}
            </h3>
            {product.dosage && <p className="mt-0.5 text-sm text-text-secondary">{product.dosage}</p>}

            <p className="mt-auto pt-5 font-display text-2xl font-black tabular-nums text-text-primary">
              {formatPrice(product.priceCents)}
            </p>
          </div>
        </Link>

        <div className="product-card__actions space-y-2 p-5 pt-3">
          <AddToCart product={product} size="sm" />
          <Link
            href={`/products/${product.slug}`}
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border-hair px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:border-red/50 hover:text-red"
          >
            View details
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

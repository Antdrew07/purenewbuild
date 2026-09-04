"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { AddToCart } from "@/components/cart/AddToCart";
import { EASE } from "@/lib/motion";

/**
 * Phone-only buy bar. Slides up once the main Add to cart control (marked
 * with data-buy-anchor) has scrolled above the viewport, and slides away when
 * it is back in view. Driven by scroll position rather than an intersection
 * observer so a long jump past the anchor still shows it. Hidden on md+.
 */
export function StickyBuyBar({ product }: { product: Product }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const anchor = document.querySelector("[data-buy-anchor]");
    if (!anchor) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      setShow(anchor.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const orderable = product.status === "active" && product.priceCents !== null;
  if (!orderable) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 84, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 84, opacity: 0 }}
          transition={{ duration: 0.32, ease: EASE }}
          className="sticky-buy md:hidden"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold uppercase leading-tight text-text-primary">
              {product.name}{product.dosage ? <span className="ml-1.5 text-blue">{product.dosage}</span> : null}
            </p>
            <p className="font-display text-lg font-black tabular-nums leading-tight text-text-primary">{formatPrice(product.priceCents)}</p>
          </div>
          <AddToCart product={product} size="sm" className="!w-auto shrink-0 px-5" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/ui/ProductCard";
import { EASE, stagger } from "@/lib/motion";

type Sort = "name" | "price_asc" | "price_desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "name", label: "A–Z" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

export function CatalogGrid({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("name");
  const [inStockOnly, setInStockOnly] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const out = products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (inStockOnly && p.status !== "active") return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.dosage.toLowerCase().includes(needle) ||
        (p.note ?? "").toLowerCase().includes(needle)
      );
    });

    return out.sort((a, b) => {
      if (sort === "price_asc") return (a.priceCents ?? 1e9) - (b.priceCents ?? 1e9);
      if (sort === "price_desc") return (b.priceCents ?? -1) - (a.priceCents ?? -1);
      return a.name.localeCompare(b.name) || a.dosage.localeCompare(b.dosage);
    });
  }, [products, category, query, sort, inStockOnly]);

  const chips = [{ slug: "all", name: "All", count: products.length }, ...categories];

  return (
    <div>
      <div className="brushed glass relative overflow-hidden rounded-2xl p-5">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search products</span>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-text-dim stroke-2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search peptides, dosages…"
                className="min-h-11 w-full rounded-xl border border-border-hair bg-bg-base/60 py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-dim focus:border-red/60 focus:outline-none"
              />
            </label>

            <div className="flex gap-2">
              <label className="sr-only" htmlFor="sort">Sort by</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="min-h-11 rounded-xl border border-border-hair bg-bg-base/60 px-3 py-2.5 text-sm text-text-primary focus:border-red/60 focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setInStockOnly((v) => !v)}
                aria-pressed={inStockOnly}
                className={`min-h-11 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  inStockOnly
                    ? "border-red/60 bg-red/12 text-red"
                    : "border-border-hair bg-bg-base/60 text-text-secondary hover:text-text-primary"
                }`}
              >
                In stock
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {chips.map((c) => {
              const active = category === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  aria-pressed={active}
                  className={`inline-flex min-h-11 items-center rounded-full border px-3.5 py-1.5 text-xs font-medium uppercase tracking-wide transition-all ${
                    active
                      ? "border-red bg-red text-white shadow-md shadow-red/30"
                      : "border-border-hair bg-bg-base/50 text-text-secondary hover:border-red/45 hover:text-text-primary"
                  }`}
                >
                  {c.name}
                  <span className={`ml-1.5 font-mono text-[10px] ${active ? "text-white/70" : "text-text-dim"}`}>
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-6 font-mono text-xs uppercase tracking-widest text-text-dim">
        {filtered.length} {filtered.length === 1 ? "product" : "products"}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border-hair bg-bg-glass p-14 text-center backdrop-blur">
          <p className="font-display text-2xl font-bold uppercase text-text-primary">
            Nothing matches that
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            Try a shorter search term, or clear the filters.
          </p>
          <button
            type="button"
            onClick={() => { setQuery(""); setCategory("all"); setInStockOnly(false); }}
            className="mt-6 min-h-11 rounded-xl border border-border-hair px-5 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-red/60 hover:text-red"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <motion.div
          key={`${category}-${sort}-${inStockOnly}`}
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <motion.div key={p.slug} layout transition={{ duration: 0.3, ease: EASE }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

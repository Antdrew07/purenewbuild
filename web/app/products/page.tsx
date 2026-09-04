import type { Metadata } from "next";
import { CatalogGrid } from "@/components/products/CatalogGrid";
import { Reveal } from "@/components/fx/Reveal";
import { StarDivider } from "@/components/ui/Chrome";
import { RuoBadge } from "@/components/ui/Badge";
import { getCategories, getProducts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Research Peptide Catalog",
  description:
    "Browse the full Pure Peptide catalog — third-party tested research peptides, blends, and laboratory supplies. Research use only.",
};

export const revalidate = 300;

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <div className="relative pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[26rem] w-[52rem] -translate-x-1/2 rounded-full bg-red/[0.06] blur-[130px]" />
        <div className="stars-strip absolute inset-0 opacity-[0.04]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <Reveal className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">
            Quality products · Fast shipping
          </p>
          <h1 className="mt-4 font-display text-6xl font-black uppercase leading-none sm:text-7xl">
            <span className="chrome-text chrome-shine">The</span> <span className="text-red red-chrome">catalog</span>
          </h1>
          <div className="mt-6"><StarDivider /></div>
          <div className="mt-6 flex justify-center">
            <RuoBadge />
          </div>
        </Reveal>

        <div className="mt-14">
          <CatalogGrid products={products} categories={categories} />
        </div>
      </div>
    </div>
  );
}

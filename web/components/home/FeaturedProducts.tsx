import { RevealGroup, Reveal } from "@/components/fx/Reveal";
import { ProductCard } from "@/components/ui/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { getFeaturedProducts } from "@/lib/api";

export async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  return (
    <section className="section-stage relative py-28">
      {/* Section wash */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[70rem] -translate-x-1/2 rounded-full bg-navy/[0.06] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">
            Most requested
          </p>
          <h2 className="mt-4 font-display text-5xl font-black uppercase leading-none sm:text-6xl">
            <span className="chrome-text">Top tier</span>{" "}
            <span className="text-red">peptides</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-text-secondary">
            The compounds our researchers reorder most. Every one third-party
            tested, sealed, and documented.
          </p>
        </Reveal>

        {products.length === 0 ? (
          <p className="mt-16 text-center text-text-secondary">
            Featured products are being restocked — browse the full catalog below.
          </p>
        ) : (
          <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </RevealGroup>
        )}

        <Reveal className="mt-14 text-center">
          <ButtonLink href="/products" variant="steel">
            View all products
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}

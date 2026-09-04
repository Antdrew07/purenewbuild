import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { RuoBadge, StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { NeonRule } from "@/components/ui/Chrome";
import { ProductMockup } from "@/components/ui/ProductMockup";
import { AddToCart } from "@/components/cart/AddToCart";
import { Panel } from "@/components/ui/Panel";
import { ProductCard } from "@/components/ui/ProductCard";
import { RevealGroup } from "@/components/fx/Reveal";

export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };

  const title = `${product.name}${product.dosage ? ` ${product.dosage}` : ""}`;
  return {
    title,
    description: `${title} — research-grade, third-party tested, COA on request. Research use only, not for human consumption.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const all = await getProducts();
  const related = all
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, 4);

  const orderable = product.status === "active";

  return (
    <div className="relative pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-red/12 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <nav aria-label="Breadcrumb" className="font-mono text-[11px] uppercase tracking-widest text-text-dim">
          <Link href="/products" className="inline-block py-3.5 -my-3.5 transition-colors hover:text-red">Catalog</Link>
          <span className="mx-2">/</span>
          <span className="text-text-secondary">{product.name}</span>
        </nav>

        <div className="product-detail-grid mt-8 grid gap-12 lg:grid-cols-2">
          {/* --- vial mockup --- */}
          <div className="product-launch-stage relative overflow-hidden rounded-2xl border border-border-hair bg-white p-8">
                                                <NeonRule className="absolute inset-x-0 top-0" />
            <NeonRule className="absolute inset-x-0 bottom-0" />

            <div className="relative z-10 flex min-h-[26rem] items-center justify-center py-2">
              <ProductMockup
                form={product.form}
                name={product.name}
                dosage={product.dosage}
                className="h-[26rem]"
                priority
              />
            </div>

            <p className="relative z-10 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-chrome-400">
              Representative image · labelling varies by lot
            </p>
          </div>

          {/* --- detail --- */}
          <div className="product-purchase-panel">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={product.status} />
              <RuoBadge />
            </div>

            <h1 className="mt-5 font-display text-4xl font-black uppercase leading-none text-text-primary sm:text-5xl">
              {product.name}
              {product.dosage && <span className="ml-3 text-blue">{product.dosage}</span>}
            </h1>

            <p className="mt-6 font-display text-5xl font-black tabular-nums text-text-primary">
              {formatPrice(product.priceCents)}
            </p>

            <p className="mt-6 leading-relaxed text-text-secondary">{product.description}</p>

            {product.note && (
              <Panel className="mt-6" glow="blue">
                <p className="font-mono text-[10px] uppercase tracking-widest text-blue">Composition</p>
                <p className="mt-2 text-sm leading-relaxed text-text-primary">{product.note}</p>
              </Panel>
            )}

            <AddToCart product={product} className="mt-8" />

            <div className="mt-4 flex flex-wrap gap-4">
              <ButtonLink href={`/contact?product=${encodeURIComponent(product.slug)}`} variant="outline">
                {orderable ? "Ask a question" : "Ask about availability"}
              </ButtonLink>
              <ButtonLink href="/products" variant="outline">Back to catalog</ButtonLink>
            </div>

            <p className="mt-4 text-sm text-text-secondary">
              Every order comes with reconstitution liquid. COAs available —
              email{" "}
              <a href="mailto:support@purepeptide.us" className="inline-block py-2.5 -my-2.5 text-red hover:underline">
                support@purepeptide.us
              </a>
              .
            </p>

            <dl className="evidence-grid mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border-hair bg-border-hair">
              {[
                ["Form", "Lyophilised powder"],
                ["Purity", "≥ 99% (HPLC)"],
                ["Testing", "Third-party — email for COA"],
                ["Storage", "-20 °C, protect from light"],
              ].map(([k, v]) => (
                <div key={k} className="bg-bg-elevated p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-text-dim">{k}</dt>
                  <dd className="mt-1 text-sm text-text-primary">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="font-display text-3xl font-black uppercase text-text-primary">
              <span className="chrome-text">Related</span> <span className="text-red">compounds</span>
            </h2>
            <RevealGroup className="related-rail mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </RevealGroup>
          </section>
        )}
      </div>
    </div>
  );
}

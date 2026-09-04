import { Reveal } from "@/components/fx/Reveal";
import { CountUp } from "@/components/fx/CountUp";
import { getCategories, getProducts } from "@/lib/api";

const STANDARDS = [
  { value: "01", label: "Veteran owned", detail: "American operated" },
  { value: "02", label: "Third-party tested", detail: "Identity & purity" },
  { value: "03", label: "Lot traceable", detail: "Documentation available" },
  { value: "04", label: "U.S. dispatch", detail: "Fast domestic shipping" },
];

/** A compact proof rail that uses claims already made elsewhere on the site, plus live catalog numbers. */
export async function AmericanStandardRail() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  const STATS = [
    { value: products.length, label: "Products in catalog" },
    { value: categories.length, label: "Research categories" },
    { value: 99, prefix: "≥", suffix: "%", label: "Purity by HPLC" },
    { value: 48, suffix: "h", label: "Dispatch window" },
  ];

  return (
    <section aria-label="Pure Peptide standards" className="american-standard">
      <Reveal>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="american-standard__frame">
            <div className="american-standard__lead">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-blue">American standard</span>
              <span className="mt-1 block font-display text-xl font-black uppercase tracking-wide text-text-primary">Built for the bench</span>
            </div>
            <div className="american-standard__items">
              {STANDARDS.map((standard, i) => (
                <Reveal key={standard.value} delay={0.08 + i * 0.07} className="american-standard__item">
                  <span className="font-mono text-[10px] text-red">{standard.value}</span>
                  <div>
                    <p className="font-display text-sm font-bold uppercase tracking-wide text-text-primary">{standard.label}</p>
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-text-dim">{standard.detail}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="american-standard__stats">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={0.2 + i * 0.07} className="american-standard__stat">
                <span className="american-standard__stat-value chrome-text">
                  <CountUp to={s.value} prefix={s.prefix} suffix={s.suffix} />
                </span>
                <span className="american-standard__stat-label">{s.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

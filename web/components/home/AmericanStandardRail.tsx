import { Reveal } from "@/components/fx/Reveal";

const STANDARDS = [
  { value: "01", label: "Veteran owned", detail: "American operated" },
  { value: "02", label: "Third-party tested", detail: "Identity & purity" },
  { value: "03", label: "Lot traceable", detail: "Documentation available" },
  { value: "04", label: "U.S. dispatch", detail: "Fast domestic shipping" },
];

/** A compact proof rail that uses claims already made elsewhere on the site. */
export function AmericanStandardRail() {
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
              {STANDARDS.map((standard) => (
                <div key={standard.value} className="american-standard__item">
                  <span className="font-mono text-[10px] text-red">{standard.value}</span>
                  <div>
                    <p className="font-display text-sm font-bold uppercase tracking-wide text-text-primary">{standard.label}</p>
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-text-dim">{standard.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

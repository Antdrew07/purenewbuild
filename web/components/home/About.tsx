import { Reveal, RevealGroup } from "@/components/fx/Reveal";
import { Parallax } from "@/components/fx/Parallax";
import { Panel } from "@/components/ui/Panel";
import { VialMockup } from "@/components/ui/VialMockup";
import { fadeUp } from "@/lib/motion";

const PILLARS = [
  {
    k: "01",
    title: "Third-party tested",
    body: "Independent HPLC and mass-spec verification on every lot. Certificates of Analysis available on request — no exceptions, no marketing-grade claims.",
  },
  {
    k: "02",
    title: "Sealed and traceable",
    body: "Lyophilised, individually sealed vials with lot-level traceability from synthesis through to the box on your bench.",
  },
  {
    k: "03",
    title: "Shipped from the USA",
    body: "Domestic fulfilment with cold-pack options and dispatch within 48 hours. Friday cut-off is 2pm CT.",
  },
];

export function About() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">
                Who we are
              </p>
              <h2 className="mt-4 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl">
                <span className="chrome-text">Built by</span>
                <br />
                <span className="text-red">researchers</span>
              </h2>
              <p className="mt-6 max-w-xl leading-relaxed text-text-secondary">
                Pure Peptide is a veteran-owned American supplier of research-grade
                peptides and laboratory materials. We started because sourcing
                reliable compounds meant choosing between opaque overseas vendors
                and prices that made real research impossible.
              </p>
              <p className="mt-4 max-w-xl leading-relaxed text-text-secondary">
                So we built the alternative: verified purity, honest pricing, and
                documentation that stands up to scrutiny. Every order ships with
                the paperwork to back it up.
              </p>
            </Reveal>
          </div>

          <Parallax strength={40}>
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl border border-border-hair bg-white p-4 sm:p-8">
                                                                <span aria-hidden="true" className="neon-rule absolute inset-x-0 top-0 h-px" />
                <span aria-hidden="true" className="neon-rule absolute inset-x-0 bottom-0 h-px" />

                <div className="relative z-10 flex items-end justify-center gap-3 py-4 sm:gap-6 md:gap-10">
                  <VialMockup
                    name="Retatrutide"
                    dosage="15mg"
                    className="h-40 sm:h-64 md:h-80"
                  />
                  <VialMockup
                    name="NAD+"
                    dosage="1000mg"
                    className="h-36 sm:h-56 md:h-72"
                  />
                </div>

                <p className="relative z-10 mt-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-chrome-400">
                  Sealed · lot-traceable · COA on request
                </p>
              </div>
            </Reveal>
          </Parallax>
        </div>

        <RevealGroup className="mt-24 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p) => (
            <Reveal key={p.k} variants={fadeUp}>
              <Panel glow="red" framed className="h-full">
                <span className="font-mono text-xs tracking-widest text-red">{p.k}</span>
                <h3 className="mt-3 font-display text-2xl font-extrabold uppercase tracking-tight">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{p.body}</p>
              </Panel>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

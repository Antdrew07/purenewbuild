import type { Metadata } from "next";
import Image from "next/image";
import { Reveal, RevealGroup } from "@/components/fx/Reveal";
import { Parallax } from "@/components/fx/Parallax";
import { Panel } from "@/components/ui/Panel";
import { StarDivider } from "@/components/ui/Chrome";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Pure Peptide is a veteran-owned American supplier of third-party tested research peptides. Research use only.",
};

const VALUES = [
  {
    title: "Verify, don't claim",
    body: "Purity is a number on a chromatogram, not an adjective in marketing copy. Every lot gets independent HPLC and mass-spec analysis, and the Certificate of Analysis is yours on request.",
  },
  {
    title: "Price without theatre",
    body: "No inflated list prices marked down to look like a deal. What you see is what the compound costs, every day, for every customer.",
  },
  {
    title: "Ship like it matters",
    body: "Dispatch within 48 hours, cold-pack options, and packaging that survives the last mile. Orders placed Friday ship Monday.",
  },
  {
    title: "Stay in our lane",
    body: "We supply research materials to qualified researchers. We do not give dosing advice, medical guidance, or protocols — and we never will.",
  },
];

const STATS = [
  { value: "70+", label: "Compounds in catalog" },
  { value: "100%", label: "Lots third-party tested" },
  { value: "48h", label: "Typical dispatch time" },
  { value: "USA", label: "Veteran owned & operated" },
];

export default function AboutPage() {
  return (
    <div className="relative pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[30rem] w-[62rem] -translate-x-1/2 rounded-full bg-navy/[0.07] blur-[130px]" />
        <div className="stars-strip absolute inset-0 opacity-[0.04]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">
            Veteran owned · American made
          </p>
          <h1 className="mt-4 font-display text-6xl font-black uppercase leading-[0.9] sm:text-8xl">
            <span className="chrome-text">About</span> <span className="text-red">us</span>
          </h1>
          <div className="mt-8"><StarDivider count={7} /></div>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-text-secondary">
            We supply the research community with peptides we would be willing to
            put our own name on — because we do, on every single vial.
          </p>
        </Reveal>

        <RevealGroup className="mt-20 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s) => (
            <Reveal key={s.label}>
              <div className="relative overflow-hidden rounded-2xl border border-border-hair bg-bg-glass p-6 backdrop-blur">
                <div aria-hidden="true" className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red/15 blur-2xl" />
                <p className="relative font-display text-4xl font-black tabular-nums text-text-primary">
                  {s.value}
                </p>
                <p className="relative mt-1 font-mono text-[10px] uppercase leading-tight tracking-widest text-text-dim">
                  {s.label}
                </p>
              </div>
            </Reveal>
          ))}
        </RevealGroup>

        <div className="mt-24 grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-4xl font-black uppercase leading-[0.9] sm:text-5xl">
              <span className="chrome-text">Our</span> <span className="text-red">story</span>
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-text-secondary">
              <p>
                Pure Peptide started the way most useful things do — out of
                frustration. Sourcing research compounds meant choosing between
                overseas suppliers with no verifiable documentation and domestic
                resellers charging a premium for the same unverified material.
              </p>
              <p>
                We thought a third option should exist: American-held inventory,
                independent testing on every lot, and pricing that lets a lab
                actually run the experiment it planned. So we built it.
              </p>
              <p>
                Today we supply independent labs, universities, and research
                groups across the country. The promise has not changed — if we
                cannot document it, we do not sell it.
              </p>
            </div>
            <div className="mt-8">
              <ButtonLink href="/products">See what we stock</ButtonLink>
            </div>
          </Reveal>

          <Parallax strength={44}>
            <Reveal>
              <div className="relative overflow-hidden rounded-2xl border border-border-hair">
                <Image
                  src="/brand/logo-pure-peptide.jpeg"
                  alt="Pure Peptide emblem"
                  width={1254}
                  height={1254}
                  className="w-full"
                />
              </div>
            </Reveal>
          </Parallax>
        </div>

        <RevealGroup className="mt-24 grid gap-6 md:grid-cols-2">
          {VALUES.map((v, i) => (
            <Reveal key={v.title}>
              <Panel glow={i % 2 === 0 ? "red" : "blue"} framed className="h-full">
                <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-text-primary">
                  {v.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{v.body}</p>
              </Panel>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </div>
  );
}

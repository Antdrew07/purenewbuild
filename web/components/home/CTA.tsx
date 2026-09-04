import { Reveal } from "@/components/fx/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { StarDivider } from "@/components/ui/Chrome";

export function CTA() {
  return (
    <section className="section-stage relative overflow-hidden py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[64rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red/[0.07] blur-[130px]" />
        <div className="stars-strip absolute inset-0 opacity-[0.04]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
        <Reveal>
          <StarDivider count={7} />
          <h2 className="mt-8 font-display text-5xl font-black uppercase leading-[0.9] sm:text-7xl">
            <span className="chrome-text chrome-shine">Every order</span>
            <br />
            <span className="text-red">includes reconstitution liquid</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-text-secondary">
            Reconstitution liquid ships with every order. Ready-use pens
            available at $50 — three cartridges and ten needles.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <ButtonLink href="/products">Shop the catalog</ButtonLink>
            <ButtonLink href="/contact" variant="outline">Talk to us</ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

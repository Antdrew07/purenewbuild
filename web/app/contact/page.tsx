import type { Metadata } from "next";
import { ContactForm } from "@/components/site/ContactForm";
import { Reveal } from "@/components/fx/Reveal";
import { Panel } from "@/components/ui/Panel";
import { StarDivider } from "@/components/ui/Chrome";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about availability, lot documentation, or bulk pricing? Contact the Pure Peptide team.",
};

const CHANNELS = [
  { label: "Email", value: "support@purepeptide.us", href: "mailto:support@purepeptide.us" },
  { label: "Hours", value: "Mon–Fri · 9am–5pm CT", href: null },
  { label: "Dispatch", value: "Within 48 hours · Fri 2pm CT cut-off", href: null },
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  const defaultSubject = product ? `Enquiry: ${product}` : "";

  return (
    <div className="relative pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[26rem] w-[56rem] -translate-x-1/2 rounded-full bg-red/[0.06] blur-[130px]" />
        <div className="stars-strip absolute inset-0 opacity-[0.04]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Reveal className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">
            We reply within one business day
          </p>
          <h1 className="mt-4 font-display text-6xl font-black uppercase leading-none sm:text-8xl">
            <span className="chrome-text">Get in</span> <span className="text-red">touch</span>
          </h1>
          <div className="mt-8"><StarDivider /></div>
        </Reveal>

        <div className="mt-16 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Panel framed>
              <ContactForm defaultSubject={defaultSubject} />
            </Panel>
          </div>

          <div className="space-y-4 lg:col-span-2">
            {CHANNELS.map((c) => (
              <Panel key={c.label} glow="blue">
                <p className="font-mono text-[10px] uppercase tracking-widest text-blue">{c.label}</p>
                {c.href ? (
                  <a
                    href={c.href}
                    className="mt-2 flex min-h-11 items-center font-display text-xl font-bold uppercase tracking-tight text-text-primary transition-colors hover:text-red"
                  >
                    {c.value}
                  </a>
                ) : (
                  <p className="mt-2 font-display text-xl font-bold uppercase tracking-tight text-text-primary">
                    {c.value}
                  </p>
                )}
              </Panel>
            ))}

            <Panel glow="red">
              <p className="font-mono text-[10px] uppercase tracking-widest text-red">
                Before you write
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Our products are research materials only. We cannot advise on
                dosing, administration, or any human or animal use, and enquiries
                asking for that guidance will not receive an answer.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

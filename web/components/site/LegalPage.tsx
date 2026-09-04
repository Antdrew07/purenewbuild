import type { ReactNode } from "react";
import { Reveal } from "@/components/fx/Reveal";
import { StarDivider } from "@/components/ui/Chrome";

export function LegalPage({
  title,
  accent,
  updated,
  children,
}: {
  title: string;
  accent: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="relative pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-navy/14 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <Reveal className="text-center">
          <h1 className="font-display text-5xl font-black uppercase leading-none sm:text-6xl">
            <span className="chrome-text chrome-shine">{title}</span>{" "}
            <span className="text-red">{accent}</span>
          </h1>
          <div className="mt-6"><StarDivider /></div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-text-dim">
            Last updated {updated}
          </p>
        </Reveal>

        <div className="mt-14 space-y-8 leading-relaxed text-text-secondary [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-text-primary [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}

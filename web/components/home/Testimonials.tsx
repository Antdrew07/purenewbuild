"use client";

import { motion } from "framer-motion";
import { Reveal, RevealGroup } from "@/components/fx/Reveal";
import { Panel } from "@/components/ui/Panel";
import { fadeUp } from "@/lib/motion";

/**
 * Placeholder copy attributed to roles, not invented named people — swap for
 * real, consented reviews before launch.
 */
const REVIEWS = [
  {
    quote:
      "The COA actually matches the vial. That sounds like a low bar until you have sourced from four other suppliers in a year.",
    role: "Independent research lab",
    location: "Austin, TX",
  },
  {
    quote:
      "Ordered Monday morning, on the bench Wednesday. Cold pack intact, seals intact, labelling unambiguous.",
    role: "University postdoc",
    location: "Columbus, OH",
  },
  {
    quote:
      "Pricing is transparent and the lot documentation is filed properly. It has made our procurement paperwork dramatically simpler.",
    role: "Procurement lead",
    location: "Tampa, FL",
  },
];

function Stars() {
  return (
    <div className="flex gap-1" aria-label="5 out of 5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-red" aria-hidden="true">
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">
            From the bench
          </p>
          <h2 className="mt-4 font-display text-5xl font-black uppercase leading-none sm:text-6xl">
            <span className="chrome-text">What labs</span>{" "}
            <span className="text-red">say</span>
          </h2>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <motion.div key={r.quote} variants={fadeUp}>
              <Panel glow="blue" className="h-full">
                <Stars />
                <blockquote className="mt-4 text-sm leading-relaxed text-text-primary">
                  “{r.quote}”
                </blockquote>
                <footer className="mt-5 border-t border-border-hair pt-4">
                  <p className="font-display text-sm font-bold uppercase tracking-wide text-text-primary">
                    {r.role}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-text-dim">
                    {r.location}
                  </p>
                </footer>
              </Panel>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

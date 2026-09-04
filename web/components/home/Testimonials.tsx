"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/fx/Reveal";
import { FlagRipple } from "@/components/fx/FlagRipple";
import { NeonRule } from "@/components/ui/Chrome";
import { Panel } from "@/components/ui/Panel";
import { EASE } from "@/lib/motion";

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

/** Five stars that draw in one after another whenever they mount. */
function Stars({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex gap-1" aria-label="5 out of 5">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 fill-red"
          aria-hidden="true"
          initial={reduce ? false : { scale: 0, opacity: 0, rotate: -40 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.38, ease: EASE, delay: 0.15 + i * 0.09 }}
        >
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
        </motion.svg>
      ))}
    </div>
  );
}

/**
 * The deck rotates every few seconds: the lead card slides to the back and
 * the next one takes the front. Pauses while hovered or focused, and stays
 * put entirely under reduced motion.
 */
export function Testimonials() {
  const reduce = useReducedMotion() ?? false;
  const [order, setOrder] = useState(() => REVIEWS.map((_, i) => i));
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reduce) return;
    const id = window.setInterval(() => setOrder((o) => [...o.slice(1), o[0]]), 5200);
    return () => window.clearInterval(id);
  }, [paused, reduce]);

  return (
    <section className="section-stage relative overflow-hidden py-28">
      <FlagRipple />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">
            From the bench
          </p>
          <h2 className="mt-4 font-display text-5xl font-black uppercase leading-none sm:text-6xl">
            <span className="chrome-text">What labs</span>{" "}
            <span className="text-red">say</span>
          </h2>
          <NeonRule className="mx-auto mt-6 !w-40" />
        </Reveal>

        <LayoutGroup id="testimonials">
          <motion.div
            layout
            className="mt-14 grid gap-6 md:grid-cols-3"
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <AnimatePresence initial={false}>
              {order.map((idx, pos) => {
                const r = REVIEWS[idx];
                const lead = pos === 0;
                return (
                  <motion.div
                    key={idx}
                    layout
                    initial={{ opacity: 0, y: 18, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: lead ? 1.02 : 1 }}
                    transition={{ layout: { duration: 0.7, ease: EASE }, duration: 0.5, ease: EASE }}
                    className={lead ? "testimonial-lead" : ""}
                  >
                    <Panel glow="blue" className="testimonial-card h-full">
                      <Stars key={`${idx}-${pos}`} reduce={reduce} />
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
                );
              })}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
    </section>
  );
}

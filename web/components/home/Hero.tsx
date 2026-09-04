"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { StarDivider } from "@/components/ui/Chrome";
import { ParticleField } from "@/components/fx/ParticleField";
import { AmericanFlagBackdrop } from "@/components/fx/AmericanFlagBackdrop";
import { GlowOrbs } from "@/components/fx/GlowOrbs";
import { EASE, fadeUp, stagger, trackIn } from "@/lib/motion";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Parallax: the background and content drift at different rates. Content stays
  // opaque so it remains dependable in short/mobile viewports and assistive modes.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);

  return (
    <section
      ref={ref}
      className="flag-hero relative overflow-hidden pt-20"
    >
      <AmericanFlagBackdrop />

      {/* The film gets its own plane so the logo and words stay legible. */}
      <motion.div aria-hidden="true" style={{ y: bgY }} className="absolute inset-0">
        <div className="flag-hero__content-wash" />
        <div className="flag-hero__stars stars-strip" />
      </motion.div>

      {/* Layer 2 — drifting particles */}
      <ParticleField />

      {/* Layer 3 - slow drifting colour, the ambient life under the copy */}
      <GlowOrbs />

      {/* The reading path is content first, then the existing circular identity mark. */}
      <motion.div
        variants={stagger}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        style={reduceMotion ? undefined : { y: contentY }}
        className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-10 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.72fr)] lg:gap-6 lg:py-24"
      >
        <div className="flag-hero__copy text-center lg:text-left">
          <motion.p
            variants={fadeUp}
            className="flag-hero__kicker font-mono text-[10px] uppercase tracking-[0.36em] sm:text-[11px]"
          >
            Veteran Owned <span aria-hidden="true">·</span> American Made
          </motion.p>

          <motion.h1
            variants={trackIn}
            className="mt-5 font-display text-6xl font-black uppercase leading-[0.82] sm:text-8xl lg:text-9xl"
          >
            <span className="chrome-text chrome-shine block">Pure</span>
            <span className="flag-hero__red-word red-chrome block">Peptide</span>
          </motion.h1>

          <motion.div variants={fadeUp} className="mt-7 lg:flex lg:justify-start">
            <StarDivider />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="flag-hero__body mx-auto mt-7 max-w-xl text-base leading-relaxed sm:text-lg lg:mx-0"
          >
            Research-grade peptides held to a standard you can verify. Every lot is
            third-party tested for identity and purity, sealed in the USA, and
            shipped with a Certificate of Analysis on request.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <ButtonLink href="/products">Browse the catalog</ButtonLink>
            <ButtonLink href="/about" variant="outline">Why researchers choose us</ButtonLink>
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="flag-hero__disclaimer mt-9 font-mono text-[10px] uppercase tracking-[0.25em] sm:text-[11px]"
          >
            Research use only · Not for human consumption
          </motion.p>
        </div>

        <motion.div variants={fadeUp} className="flex justify-center lg:justify-end">
          <div className="flag-hero__seal flag-hero__seal--float">
            <div className="flag-hero__seal-inner">
              <Image
                src="/brand/logo-pure-peptide.jpeg"
                alt="Pure Peptide"
                width={310}
                height={310}
                priority
                className="h-48 w-48 rounded-full object-cover sm:h-64 sm:w-64 lg:h-72 lg:w-72"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6, ease: EASE }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, 9, 0] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-9 w-6 items-start justify-center rounded-full border border-border-hair pt-2"
        >
          <span className="h-1.5 w-1 rounded-full bg-red" />
        </motion.div>
      </motion.div>

      {/* Bottom fade into the next section */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-[1] h-32 bg-gradient-to-t from-bg-base to-transparent" />
    </section>
  );
}

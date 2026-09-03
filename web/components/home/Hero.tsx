"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { StarDivider } from "@/components/ui/Chrome";
import { ParticleField } from "@/components/fx/ParticleField";
import { EASE, fadeUp, stagger, trackIn } from "@/lib/motion";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Parallax: background drifts slower than content, content fades as it leaves.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden pt-20"
    >
      {/* Layer 1 — flag-toned radial wash */}
      <motion.div aria-hidden="true" style={{ y: bgY }} className="absolute inset-0">
        <div className="absolute inset-0 bg-bg-base" />
        <div className="absolute left-1/2 top-1/3 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red/18 blur-[130px]" />
        <div className="absolute right-[8%] top-[18%] h-[30rem] w-[30rem] rounded-full bg-navy/25 blur-[120px]" />
        <div className="absolute bottom-[6%] left-[4%] h-[24rem] w-[24rem] rounded-full bg-blue/12 blur-[110px]" />
        <div className="stars-strip absolute inset-0 opacity-[0.14]" />
      </motion.div>

      {/* Layer 2 — drifting particles */}
      <ParticleField />

      {/* Layer 3 — content */}
      <motion.div
        style={{ y: contentY, opacity }}
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-5xl px-5 py-20 text-center sm:px-8"
      >
        <motion.div variants={fadeUp} className="flex justify-center">
          <Image
            src="/brand/logo-pure-peptide.jpeg"
            alt="Pure Peptide"
            width={190}
            height={190}
            priority
            className="h-32 w-32 rounded-full shadow-2xl shadow-red/30 ring-1 ring-border-hair sm:h-44 sm:w-44"
          />
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mt-8 font-mono text-[11px] uppercase tracking-[0.42em] text-blue"
        >
          Veteran Owned · American Made
        </motion.p>

        <motion.h1
          variants={trackIn}
          className="mt-4 font-display text-6xl font-black uppercase leading-[0.86] sm:text-8xl lg:text-9xl"
        >
          <span className="chrome-text block">Pure</span>
          <span className="block text-red drop-shadow-[0_0_28px_rgba(232,18,28,0.45)]">
            Peptide
          </span>
        </motion.h1>

        <motion.div variants={fadeUp} className="mt-8">
          <StarDivider />
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg"
        >
          Research-grade peptides held to a standard you can verify. Every lot is
          third-party tested for identity and purity, sealed in the USA, and
          shipped with a Certificate of Analysis on request.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <ButtonLink href="/products">Browse the catalog</ButtonLink>
          <ButtonLink href="/about" variant="outline">Why researchers choose us</ButtonLink>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mt-10 font-mono text-[11px] uppercase tracking-[0.3em] text-text-secondary"
        >
          Research use only · Not for human consumption
        </motion.p>
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
          animate={{ y: [0, 9, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-9 w-6 items-start justify-center rounded-full border border-border-hair pt-2"
        >
          <span className="h-1.5 w-1 rounded-full bg-red" />
        </motion.div>
      </motion.div>

      {/* Bottom fade into the next section */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg-base to-transparent" />
    </section>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { VialMockup } from "@/components/ui/VialMockup";

/**
 * Hero product stage: the seal and a branded vial on a floating product tile.
 * The tile tilts toward the pointer (or sways on its own on touch devices)
 * while a light band and red/blue edge glow track the same motion, so the
 * product looks lit by the same source the user is moving.
 */
export function HeroStage() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rx = useSpring(useTransform(my, [-1, 1], [8, -8]), { stiffness: 110, damping: 18, mass: 0.8 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-13, 13]), { stiffness: 110, damping: 18, mass: 0.8 });
  const sealX = useSpring(useTransform(mx, [-1, 1], [14, -14]), { stiffness: 90, damping: 20 });
  const sealY = useSpring(useTransform(my, [-1, 1], [10, -10]), { stiffness: 90, damping: 20 });
  const sheenX = useTransform(mx, [-1, 1], ["120%", "-20%"]);
  const edgeGlow = useTransform(
    mx,
    [-1, 0, 1],
    [
      "-34px 0 70px -22px rgb(7 144 255 / 0.75), 18px 0 50px -30px rgb(232 18 28 / 0.25), 0 40px 80px -40px rgb(0 0 0 / 0.9)",
      "-20px 0 60px -28px rgb(7 144 255 / 0.5), 20px 0 60px -28px rgb(232 18 28 / 0.5), 0 40px 80px -40px rgb(0 0 0 / 0.9)",
      "-18px 0 50px -30px rgb(7 144 255 / 0.25), 34px 0 70px -22px rgb(232 18 28 / 0.75), 0 40px 80px -40px rgb(0 0 0 / 0.9)",
    ],
  );

  useEffect(() => {
    if (reduce) return;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    if (!finePointer) {
      // No cursor to follow: a slow, breathing sway keeps the product alive.
      const a = animate(mx, [0, 0.65, 0, -0.65, 0], { duration: 10, repeat: Infinity, ease: "easeInOut" });
      const b = animate(my, [0, -0.35, 0, 0.35, 0], { duration: 13, repeat: Infinity, ease: "easeInOut" });
      return () => { a.stop(); b.stop(); };
    }

    const host = (ref.current?.closest(".flag-hero") as HTMLElement | null) ?? ref.current;
    if (!host) return;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const move = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      mx.set(clamp((e.clientX - (r.left + r.width / 2)) / r.width));
      my.set(clamp((e.clientY - (r.top + r.height / 2)) / r.height));
    };
    const leave = () => { mx.set(0); my.set(0); };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, [reduce, mx, my]);

  return (
    <div ref={ref} className="hero-stage">
      <motion.div style={{ x: sealX, y: sealY }} className="hero-stage__seal">
        <div className="flag-hero__seal flag-hero__seal--float">
          <div className="flag-hero__seal-inner">
            <Image
              src="/brand/logo-pure-peptide.jpeg"
              alt="Pure Peptide"
              width={310}
              height={310}
              priority
              className="h-36 w-36 rounded-full object-cover sm:h-44 sm:w-44 lg:h-48 lg:w-48"
            />
          </div>
        </div>
      </motion.div>

      <motion.div style={{ rotateX: rx, rotateY: ry, boxShadow: edgeGlow }} className="hero-stage__tile">
        <span aria-hidden="true" className="neon-rule absolute inset-x-6 top-0 h-px" />
        <span aria-hidden="true" className="neon-rule absolute inset-x-6 bottom-0 h-px" />
        <VialMockup name="RT3" dosage="15mg" priority className="hero-stage__vial" />
        <motion.div aria-hidden="true" style={{ backgroundPositionX: sheenX }} className="hero-stage__sheen" />
        <p className="hero-stage__caption">Sealed · lot-traceable · COA on request</p>
      </motion.div>
    </div>
  );
}

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EASE } from "@/lib/motion";

/**
 * Route transition: a red-to-chrome-to-blue wipe sweeps across on every
 * navigation while the new page fades up beneath it. First paint gets no
 * wipe, and reduced-motion users get neither.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [wipe, setWipe] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setWipe((n) => n + 1);
  }, [pathname]);

  return (
    <>
      <AnimatePresence>
        {wipe > 0 && !reduceMotion && (
          <motion.div
            key={wipe}
            aria-hidden="true"
            className="route-wipe"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: [0, 1, 1, 0], originX: [0, 0, 1, 1] }}
            transition={{ duration: 0.72, times: [0, 0.42, 0.55, 1], ease: EASE }}
            onAnimationComplete={() => setWipe(0)}
          />
        )}
      </AnimatePresence>
      <motion.div
        key={pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE, delay: reduceMotion || wipe === 0 ? 0 : 0.28 }}
      >
        {children}
      </motion.div>
    </>
  );
}

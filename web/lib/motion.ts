import type { Variants } from "framer-motion";

/** Shared easing — matches the weight of the brand's chrome/beveled artwork. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE } },
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

/** Wide letter-spacing collapse — used for display headings. */
export const trackIn: Variants = {
  hidden: { opacity: 0, letterSpacing: "0.35em", filter: "blur(6px)" },
  visible: {
    opacity: 1,
    letterSpacing: "0.02em",
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: EASE },
  },
};

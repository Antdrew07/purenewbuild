import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const BASE =
  "brand-button relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const VARIANTS = {
  primary:
    "[--glow:rgb(232_18_28/0.62)] [--glow-hover:rgb(255_42_52/0.95)] bg-[linear-gradient(135deg,#ff2530_0%,var(--pp-red)_48%,#a70710_100%)] text-white shadow-lg shadow-red/35 ring-1 ring-inset ring-white/20 hover:brightness-110 hover:shadow-red/50",
  outline:
    "[--glow:rgb(7_144_255/0.62)] [--glow-hover:rgb(7_144_255/0.95)] border border-border-hair bg-bg-glass text-text-primary backdrop-blur-md hover:border-red/60 hover:text-red",
  steel:
    "[--glow:rgb(214_217_219/0.45)] [--glow-hover:rgb(255_255_255/0.85)] bg-gradient-to-b from-chrome-50 via-chrome-200 to-chrome-500 text-chrome-900 shadow-lg shadow-black/30 ring-1 ring-inset ring-white/35 hover:brightness-105",
} as const;

type Variant = keyof typeof VARIANTS;

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; children: ReactNode }) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; children: ReactNode }) {
  return (
    <Link className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

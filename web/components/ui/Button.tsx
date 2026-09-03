import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const BASE =
  "relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50";

const VARIANTS = {
  primary:
    "bg-red text-white shadow-lg shadow-red/35 hover:brightness-110 hover:shadow-red/50",
  outline:
    "border border-border-hair bg-bg-glass text-text-primary backdrop-blur-md hover:border-red/60 hover:text-red",
  steel:
    "bg-gradient-to-b from-chrome-100 to-chrome-400 text-chrome-900 shadow-lg shadow-black/30 hover:brightness-105",
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

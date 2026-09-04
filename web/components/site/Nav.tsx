"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CartLink } from "@/components/cart/CartLink";
import { ThemeToggle } from "./ThemeToggle";
import { EASE } from "@/lib/motion";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Catalog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet on navigation and lock scroll while it is open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      className={`site-nav fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-border-hair bg-bg-base/90 shadow-[0_12px_30px_-22px_rgba(0,0,0,0.9)] backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="neon-rule absolute inset-x-0 top-0 h-px opacity-70" />
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Pure Peptide — home">
          <Image
            src="/brand/logo-pure-peptide.jpeg"
            alt=""
            width={48}
            height={48}
            priority
            className="h-11 w-11 rounded-full ring-1 ring-border-hair"
          />
          <span className="hidden font-display text-xl font-black uppercase tracking-wide sm:block">
            <span className="chrome-text">Pure</span>{" "}
            <span className="text-red">Peptide</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                  className={`relative rounded-lg px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors ${
                  active ? "text-red" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {l.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-px bg-red shadow-[0_0_8px_var(--pp-red)]"
                    transition={{ duration: 0.3, ease: EASE }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <CartLink />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-11 w-11 place-items-center rounded-lg border border-border-hair bg-bg-glass text-text-primary shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)] backdrop-blur md:hidden"
          >
            <span className="relative block h-3.5 w-4">
              <span className={`absolute left-0 block h-0.5 w-4 bg-current transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.5 block h-0.5 w-4 bg-current transition-all duration-200 ${open ? "opacity-0" : "opacity-100"}`} />
              <span className={`absolute left-0 block h-0.5 w-4 bg-current transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="border-t border-border-hair bg-bg-base/97 shadow-2xl shadow-black/50 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-5 py-6">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-lg px-4 py-3 font-display text-2xl font-bold uppercase tracking-wide text-text-primary transition-colors hover:bg-bg-glass hover:text-red"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

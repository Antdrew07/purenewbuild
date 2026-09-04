import Image from "next/image";
import Link from "next/link";
import { NeonRule } from "@/components/ui/Chrome";

const TRUST = [
  { label: "Quality Products", icon: "M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z" },
  { label: "Fast Shipping", icon: "M3 7h11v8H3zM14 10h4l3 3v2h-7z" },
  { label: "Veteran Owned", icon: "M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" },
  { label: "Third-Party Tested", icon: "M9 2h6v6l4 10a2 2 0 01-1.8 3H6.8A2 2 0 015 17L9 8z" },
];

export function Footer() {
  return (
    <footer className="site-footer relative mt-24 border-t border-border-hair bg-bg-elevated">
      <NeonRule className="absolute inset-x-0 top-0" />

      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/brand/logo-pure-peptide.jpeg"
                alt="Pure Peptide"
                width={56}
                height={56}
                className="h-14 w-14 rounded-full ring-1 ring-border-hair"
              />
              <span className="font-display text-2xl font-black uppercase tracking-wide">
                <span className="chrome-text">Pure</span> <span className="text-red">Peptide</span>
              </span>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-text-secondary">
              American-owned supplier of research-grade peptides and laboratory
              materials. Every lot is third-party tested for identity and purity,
              with a Certificate of Analysis available on request.
            </p>
            <div className="footer-trust mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TRUST.map((t) => (
                <div key={t.label} className="flex flex-col items-start gap-2">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-red" aria-hidden="true">
                    <path d={t.icon} />
                  </svg>
                  <span className="font-mono text-[10px] uppercase leading-tight tracking-widest text-text-dim">
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-text-primary">
              Explore
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                ["/products", "Full Catalog"],
                ["/about", "About Us"],
                ["/contact", "Contact"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="inline-block py-3.5 -my-3.5 text-text-secondary transition-colors hover:text-red">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-text-primary">
              Contact
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-text-secondary">
              <li>
                <a href="mailto:support@purepeptide.us" className="inline-block py-3.5 -my-3.5 transition-colors hover:text-red">
                  support@purepeptide.us
                </a>
              </li>
              <li>
                <a href="https://www.purepeptide.us" className="inline-block py-3.5 -my-3.5 transition-colors hover:text-red">
                  www.purepeptide.us
                </a>
              </li>
              <li className="pt-1 font-mono text-[11px] uppercase tracking-widest text-text-dim">
                Mon–Fri · 9am–5pm CT
              </li>
            </ul>
          </div>
        </div>

        {/* Compliance block — must stay on every page. */}
        <div className="footer-compliance mt-14 rounded-xl border border-red/25 bg-red/5 p-5">
          <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-red">
            Research use only — not for human consumption
          </p>
          <p className="mt-2 text-xs leading-relaxed text-text-secondary">
            All products sold by Pure Peptide are intended strictly for
            laboratory research and <em>in vitro</em> experimental use by qualified
            professionals. They are not drugs, foods, cosmetics, or supplements,
            and are not intended to diagnose, treat, cure, or prevent any disease.
            They may not be administered to humans or animals under any
            circumstances. By ordering you confirm you are a qualified researcher
            purchasing for lawful research purposes.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border-hair pt-6 text-xs text-text-dim sm:flex-row sm:items-center sm:justify-between">
          <p>© {2026} Pure Peptide LLC. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/terms" className="inline-block py-3.5 -my-3.5 transition-colors hover:text-text-secondary">Terms</Link>
            <Link href="/privacy" className="inline-block py-3.5 -my-3.5 transition-colors hover:text-text-secondary">Privacy</Link>
            <Link href="/shipping" className="inline-block py-3.5 -my-3.5 transition-colors hover:text-text-secondary">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

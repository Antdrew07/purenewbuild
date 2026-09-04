import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Saira_Condensed } from "next/font/google";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { ReturnToTop } from "@/components/site/ReturnToTop";
import { PageTransition } from "@/components/fx/PageTransition";
import { MemberAccessGate } from "@/components/site/MemberAccessGate";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });
const saira = Saira_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-saira",
  display: "swap",
});

/**
 * Absolute base for og:/twitter: URLs. Must be THIS deployment's own origin —
 * pointing it at another host makes every preview image resolve off-site.
 * Railway supplies RAILWAY_PUBLIC_DOMAIN; override with NEXT_PUBLIC_SITE_URL
 * once a custom domain is attached.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : "http://localhost:3200");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pure Peptide — American Research Peptides",
    template: "%s · Pure Peptide",
  },
  description:
    "Veteran-owned supplier of research-grade peptides. Third-party tested, COA on request, fast US shipping. Research use only — not for human consumption.",
  openGraph: {
    type: "website",
    siteName: "Pure Peptide",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#eceef1" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable} ${saira.variable}`}
    >
      <body>
        <Providers>
          <MemberAccessGate>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-red focus:px-4 focus:py-2 focus:text-white"
            >
              Skip to content
            </a>
            <Nav />
            <main id="main"><PageTransition>{children}</PageTransition></main>
            <Footer />
            <ReturnToTop />
          </MemberAccessGate>
        </Providers>
      </body>
    </html>
  );
}

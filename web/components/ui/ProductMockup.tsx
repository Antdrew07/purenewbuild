import Image from "next/image";
import type { CSSProperties } from "react";
import type { ProductForm } from "@/lib/types";
import { VialMockup, vialLabelName } from "./VialMockup";

/**
 * Product imagery, dispatched by physical form.
 *
 * Every labelled form follows the same rule as the vial: ONE generated master
 * photo carrying the real Pure Peptide label art, with its name panel left
 * deliberately BLANK, and the product name drawn over it as crisp SVG. No text
 * is ever baked into a master — image models garble small label copy (earlier
 * rolls produced "PUREPEPTIDDE.US" and "CONSUATION").
 *
 *   vial     /vial/vial-master-v3.png     lyophilised powder
 *   dropper  /mockup/dropper-master-v2.png   Methylene Blue
 *   spray    /mockup/spray-master.png     the 30ml sprays
 *   pen      /mockup/pen-master.png       Ready-Use Pen kit (no label surface)
 */

const IMG_W = 1024;
const IMG_H = 1536;

/**
 * Blank-panel geometry, measured off each master by canvas pixel scan in
 * 1024x1536 space. RE-MEASURE any entry whose master is regenerated — the
 * panel never lands in the same place twice.
 */
const PANELS: Record<
  "dropper" | "spray",
  { src: string; alt: string; cx: number; top: number; bottom: number; maxW: number; maxSize: number }
> = {
  dropper: {
    src: "/mockup/dropper-master-v2.png",
    alt: "dropper bottle",
    cx: 510,
    top: 1048,
    bottom: 1116,
    maxW: 285,
    maxSize: 34,
  },
  spray: {
    src: "/mockup/spray-master.png",
    alt: "spray bottle",
    cx: 510,
    top: 1132,
    bottom: 1212,
    maxW: 320,
    maxSize: 38,
  },
};

interface MockupProps {
  form: ProductForm;
  name: string;
  dosage?: string | null;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
}

export function ProductMockup({ form, ...rest }: MockupProps) {
  if (form === "dropper") return <LabelledBottle panel={PANELS.dropper} {...rest} />;
  if (form === "spray") return <LabelledBottle panel={PANELS.spray} {...rest} />;
  if (form === "pen") return <PenMockup {...rest} />;
  return <VialMockup {...rest} />;
}

/* ─────────────────── labelled bottles (dropper / spray) ─────────────────── */

function emWidth(ch: string): number {
  if (/[MW]/.test(ch)) return 0.78;
  if (/[A-Z]/.test(ch)) return 0.52;
  if (/[0-9]/.test(ch)) return 0.52;
  if (/[ijlI!.,']/.test(ch)) return 0.24;
  if (/\s/.test(ch)) return 0.22;
  if (/[-/+]/.test(ch)) return 0.3;
  return 0.52;
}
const emLen = (t: string) => t.split("").reduce((a, c) => a + emWidth(c), 0);
const fit = (t: string, maxW: number, cap: number) =>
  Math.min(cap, maxW / Math.max(emLen(t), 0.001));

type Panel = (typeof PANELS)[keyof typeof PANELS];

function layout(name: string, dosage: string | null | undefined, p: Panel) {
  const one = [name, dosage].filter(Boolean).join(" ").toUpperCase();
  const oneSize = fit(one, p.maxW, p.maxSize);
  // Long "KPV SPRAY 10MG / 30ML" style names stack rather than shrink to mush.
  if (oneSize >= p.maxSize * 0.62 || !dosage) {
    return [{ text: one, size: Math.max(oneSize, 14) }];
  }
  const nm = name.toUpperCase();
  const ds = dosage.toUpperCase();
  return [
    { text: nm, size: Math.max(fit(nm, p.maxW, p.maxSize * 0.8), 13) },
    { text: ds, size: Math.max(fit(ds, p.maxW, p.maxSize * 0.62), 12) },
  ];
}

function LabelledBottle({
  panel,
  name,
  dosage,
  className = "",
  style,
  priority,
}: Omit<MockupProps, "form"> & { panel: Panel }) {
  const printed = vialLabelName(name);
  const lines = layout(printed, dosage, panel);
  const boxCy = (panel.top + panel.bottom) / 2;
  const totalH = lines.reduce((a, l) => a + l.size * 1.1, 0);
  let cursor = boxCy - totalH / 2;

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: "1024 / 1536", ...style }}>
      <Image
        src={panel.src}
        alt=""
        width={IMG_W}
        height={IMG_H}
        priority={priority}
        sizes="(max-width: 640px) 45vw, 340px"
        className="h-full w-full object-contain"
      />
      <svg
        viewBox={`0 0 ${IMG_W} ${IMG_H}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
        role="img"
        aria-label={`${printed}${dosage ? ` ${dosage}` : ""} ${panel.alt}`}
      >
        {lines.map((l) => {
          cursor += l.size * 1.1;
          const over = emLen(l.text) * l.size > panel.maxW;
          return (
            <text
              key={l.text}
              x={panel.cx}
              y={cursor - l.size * 0.2}
              textAnchor="middle"
              fill="#151a24"
              fontFamily="var(--font-saira), 'Arial Narrow', sans-serif"
              fontWeight="800"
              fontSize={l.size}
              letterSpacing="1"
              textLength={over ? panel.maxW : undefined}
              lengthAdjust={over ? "spacingAndGlyphs" : undefined}
            >
              {l.text}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ──────────────────────────── pen kit ──────────────────────────── */

/** Flat-lay of hardware with no label surface, so nothing is overlaid. */
function PenMockup({ name, dosage, className = "", style, priority }: Omit<MockupProps, "form">) {
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: "1024 / 1536", ...style }}>
      <Image
        src="/mockup/pen-master.png"
        alt={`${name}${dosage ? ` — ${dosage}` : ""}`}
        width={IMG_W}
        height={IMG_H}
        priority={priority}
        sizes="(max-width: 640px) 45vw, 340px"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

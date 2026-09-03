import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * Photoreal vial mockup.
 *
 * Base image is an AI-composited product photograph: the real Pure Peptide
 * vial photo with the patriotic label artwork wrapped onto it (gpt-image-1,
 * high input fidelity), generated ONCE with wrapped-label curvature (arced edges, rounded corners,
 * glass highlights over the label) and its name box and footer left blank. The model garbles small text (it produced "PUREPEPTIDDE.US"), so
 * every piece of variable or critical text is overlaid as crisp SVG instead:
 *
 *   name box   x 352..696, y 1013..1096   (measured off master v3)
 *   fixed copy y 1114..1235 — erased from the image, overlaid below
 *
 * One generated master serves all 76 products with perfect text.
 */

/**
 * Label aliases — what the VIAL prints, which is not always the catalog name.
 * Ordered longest-first so "Retatrutide" is matched before the bare "Reta"
 * in blends like "Reta / Cagri Mix".
 * Catalog data is untouched; this affects the printed label only.
 */
const LABEL_ALIASES: [RegExp, string][] = [
  [/\bRetatrutide\b/gi, "RT3"],
  [/\bReta\b/gi, "RT3"],
  [/\bTirzepatide\b/gi, "TR3"],
  [/\bTirz\b/gi, "TR3"],
];

export function vialLabelName(name: string): string {
  return LABEL_ALIASES.reduce((out, [re, to]) => out.replace(re, to), name);
}

const IMG_W = 1024;
const IMG_H = 1536;

const BOX = { cx: 524, top: 1013, bottom: 1096, maxW: 315 };
/** All fixed label copy is overlaid too — the model misspelled it in one roll. */
const LINES = { cx: 523, white: 1146, red: 1183, domain: 1218 };

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
const fitSize = (t: string, max: number) => Math.min(max, BOX.maxW / Math.max(emLen(t), 0.001));

interface TextLayout {
  lines: { text: string; size: number }[];
}

/**
 * Lay the product title into the white box: "NAME DOSAGE" on one line when it
 * fits, otherwise name and dosage stacked.
 */
function layoutTitle(name: string, dosage?: string | null): TextLayout {
  const one = [name, dosage].filter(Boolean).join(" ").toUpperCase();
  const oneSize = fitSize(one, 46);
  if (oneSize >= 27 || !dosage) {
    return { lines: [{ text: one, size: Math.max(oneSize, 16) }] };
  }
  return {
    lines: [
      { text: name.toUpperCase(), size: Math.max(fitSize(name.toUpperCase(), 32), 15) },
      { text: dosage.toUpperCase(), size: Math.max(fitSize(dosage.toUpperCase(), 24), 14) },
    ],
  };
}

interface VialMockupProps {
  name: string;
  dosage?: string | null;
  className?: string;
  style?: CSSProperties;
  /** Higher fetch priority — use for the product detail hero only. */
  priority?: boolean;
}

export function VialMockup({ name, dosage, className = "", style, priority }: VialMockupProps) {
  const printed = vialLabelName(name);
  const { lines } = layoutTitle(printed, dosage);
  const boxCy = (BOX.top + BOX.bottom) / 2;

  // Vertically centre the stack of lines in the box (baseline ≈ cy + 0.36em).
  const totalH = lines.reduce((a, l) => a + l.size * 1.08, 0);
  let cursor = boxCy - totalH / 2;

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: "1024 / 1536", ...style }}>
      <Image
        src="/vial/vial-master-v3.png"
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
        aria-label={`${printed}${dosage ? ` ${dosage}` : ""} research vial`}
      >
        {/* Product title in the label's white box */}
        {lines.map((l) => {
          cursor += l.size * 1.08;
          const w = emLen(l.text) * l.size;
          const over = w > BOX.maxW;
          return (
            <text
              key={l.text}
              x={BOX.cx}
              y={cursor - l.size * 0.18}
              textAnchor="middle"
              fill="#151a24"
              fontFamily="var(--font-saira), 'Arial Narrow', sans-serif"
              fontWeight="800"
              fontSize={l.size}
              letterSpacing="1"
              textLength={over ? BOX.maxW : undefined}
              lengthAdjust={over ? "spacingAndGlyphs" : undefined}
            >
              {l.text}
            </text>
          );
        })}

        {/* Fixed label copy — always overlaid, never left to the image model
            (one generation produced "CONSUATION", another "PUREPEPTIDDE"). */}
        <text x={LINES.cx} y={LINES.white} textAnchor="middle" fill="#f2f4f6"
              fontFamily="var(--font-saira), 'Arial Narrow', sans-serif"
              fontWeight="700" fontSize="23" letterSpacing="4">
          NOT FOR HUMAN CONSUMPTION
        </text>
        <text x={LINES.cx} y={LINES.red} textAnchor="middle" fill="#e8121c"
              fontFamily="var(--font-saira), 'Arial Narrow', sans-serif"
              fontWeight="800" fontSize="27" letterSpacing="5">
          RESEARCH USE ONLY
        </text>
        <text x={LINES.cx} y={LINES.domain} textAnchor="middle" fill="#b9bec6"
              fontFamily="var(--font-saira), 'Arial Narrow', sans-serif"
              fontWeight="700" fontSize="19" letterSpacing="4">
          WWW.PUREPEPTIDE.US
        </text>
      </svg>
    </div>
  );
}

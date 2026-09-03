import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Pure Peptide — American Research Peptides";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Link-preview card (iMessage, Slack, X, Facebook).
 *
 * Generated rather than hand-exported so the logo always sits on the brand
 * background at the 1.91:1 ratio those clients crop to. Previously the site
 * advertised a square JPEG on a DIFFERENT domain, which 404'd to HTML — so
 * clients ignored it and scraped the largest image on the page (a vial).
 */
export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/brand/logo-pure-peptide.jpeg"));
  const logoSrc = `data:image/jpeg;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          position: "relative",
        }}
      >
        {/* brand wash */}
        <div style={{ position: "absolute", top: -220, left: 210, width: 700, height: 700, borderRadius: 9999, background: "rgba(232,18,28,0.22)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -260, right: 170, width: 640, height: 640, borderRadius: 9999, background: "rgba(11,58,168,0.28)", display: "flex" }} />

        {/* top rule */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, display: "flex" }}>
          <div style={{ flex: 1, background: "#E8121C", display: "flex" }} />
          <div style={{ flex: 1, background: "#f2f4f6", display: "flex" }} />
          <div style={{ flex: 1, background: "#0790FF", display: "flex" }} />
        </div>

        <img src={logoSrc} width={300} height={300} style={{ borderRadius: 9999 }} />

        <div style={{ display: "flex", marginTop: 36, fontSize: 72, fontWeight: 900, letterSpacing: -1 }}>
          <span style={{ color: "#f2f4f6" }}>PURE</span>
          <span style={{ color: "#E8121C", marginLeft: 20 }}>PEPTIDE</span>
        </div>

        <div style={{ display: "flex", marginTop: 20, fontSize: 27, letterSpacing: 8, color: "#9aa3ad" }}>
          RESEARCH USE ONLY
        </div>
      </div>
    ),
    { ...size },
  );
}

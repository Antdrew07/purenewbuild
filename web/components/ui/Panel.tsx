import type { ReactNode } from "react";

/**
 * Glass panel with the neon frame and brushed-metal tint from the label art.
 * `glow` paints a radial accent bloom behind the content.
 */
export function Panel({
  children,
  className = "",
  glow = "none",
  framed = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: "none" | "red" | "blue";
  framed?: boolean;
}) {
  const glowColor =
    glow === "red" ? "rgb(232 18 28 / 0.18)" : glow === "blue" ? "rgb(7 144 255 / 0.16)" : null;

  return (
    <div
      className={`brushed glass relative overflow-hidden rounded-2xl p-6 shadow-xl shadow-black/40 transition-all duration-200 ${className}`}
    >
      {glowColor && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full blur-3xl"
          style={{ background: glowColor }}
        />
      )}
      {framed && (
        <>
          <span aria-hidden="true" className="neon-rule absolute inset-x-0 top-0 h-px" />
          <span aria-hidden="true" className="neon-rule absolute inset-x-0 bottom-0 h-px" />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

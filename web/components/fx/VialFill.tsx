"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * Liquid-fill feedback for Add to Cart. Listens for the `pp:cart-add` event
 * (dispatched by AddToCart with the product slug) and, when it matches, runs a
 * red-to-blue fill up the vial body plus a soft burst. Positioned over the
 * vial region of a mockup that is `mockH` tall inside a stage with `pad`
 * padding; only rendered for the vial form.
 */
export function VialFill({ slug, mockH, pad = "1rem" }: { slug: string; mockH: string; pad?: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let timer = 0;
    function handle(e: Event) {
      const detail = (e as CustomEvent<{ slug?: string }>).detail;
      if (detail?.slug !== slug) return;
      setOn(false);
      requestAnimationFrame(() => setOn(true));
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setOn(false), 1600);
    }
    window.addEventListener("pp:cart-add", handle);
    return () => { window.removeEventListener("pp:cart-add", handle); window.clearTimeout(timer); };
  }, [slug]);

  const style = { "--mock-h": mockH, "--stage-pad": pad } as CSSProperties;
  return (
    <div aria-hidden="true" style={style} className={`vial-fill ${on ? "is-on" : ""}`}>
      <span className="vial-fill__liquid" />
      <span className="vial-fill__burst" />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type ConnectionInfo = {
  saveData?: boolean;
  effectiveType?: string;
};

/**
 * Keeps the hero visually complete at first paint with a compact poster, then
 * starts the decorative film once the page is settled on a suitable connection.
 */
export function AmericanFlagBackdrop() {
  const [loadFilm, setLoadFilm] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const constrainedConnection = connection?.saveData || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "");
    if (reducedMotion || constrainedConnection) return;

    const timer = window.setTimeout(() => setLoadFilm(true), 350);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div aria-hidden="true" className="flag-film">
      <video
        className="flag-film__video"
        autoPlay={loadFilm}
        muted
        loop
        playsInline
        preload="none"
        poster="/media/american-flag-brand-film-v2-poster.webp"
        tabIndex={-1}
      >
        {loadFilm && (
          <source src="/media/american-flag-brand-film-v2.mp4" type="video/mp4" />
        )}
      </video>
      <div className="flag-film__wash" />
      <div className="flag-film__edge" />
    </div>
  );
}

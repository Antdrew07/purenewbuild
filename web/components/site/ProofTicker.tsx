const ITEMS = [
  "Third-party tested",
  "COA on request",
  "Veteran owned",
  "Sealed in the USA",
  "Lot traceable",
  "Ships from the USA",
  "Reconstitution liquid included",
  "Research use only",
];

/**
 * Slow proof marquee. The track holds two copies of the list and scrolls by
 * exactly half its width, so the loop is seamless. Pauses on hover; the
 * reduced-motion rule in globals.css turns it into a static wrapped row.
 */
export function ProofTicker({ className = "" }: { className?: string }) {
  const row = (hidden: boolean) =>
    ITEMS.map((text, i) => (
      <span key={`${hidden ? "b" : "a"}-${i}`} className="proof-ticker__item" aria-hidden={hidden || undefined}>
        <span aria-hidden="true" className="proof-ticker__star">★</span>
        <span className="chrome-text">{text}</span>
      </span>
    ));

  return (
    <div className={`proof-ticker ${className}`} aria-label="Pure Peptide standards">
      <div className="proof-ticker__track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

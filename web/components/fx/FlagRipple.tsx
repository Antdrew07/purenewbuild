/**
 * A faint, slowly drifting flag behind a section heading. Masked to a soft
 * ellipse so it reads as texture rather than a picture. Pure CSS motion.
 */
export function FlagRipple({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flag-ripple ${className}`}>
      <div className="flag-ripple__img" />
    </div>
  );
}

/**
 * Ambient background life: three soft brand-coloured orbs that drift on slow,
 * offset loops. Pure CSS, aria-hidden, and frozen under reduced motion.
 * Drop it inside any `relative overflow-hidden` section.
 */
export function GlowOrbs({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`glow-orbs ${className}`}>
      <span className="glow-orb glow-orb--red" />
      <span className="glow-orb glow-orb--blue" />
      <span className="glow-orb glow-orb--chrome" />
    </div>
  );
}

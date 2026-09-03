import type { ElementType, ReactNode } from "react";

/** Beveled chrome lettering — the logo/vial-label treatment, as live text. */
export function ChromeText({
  as: Tag = "span",
  children,
  className = "",
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
}) {
  return <Tag className={`chrome-text ${className}`}>{children}</Tag>;
}

/** The red/blue neon hairline that frames every product label. */
export function NeonRule({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`neon-rule h-px w-full ${className}`} />;
}

/** Star divider lifted from the label artwork's five-star strip. */
export function StarDivider({ count = 5 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="flex items-center justify-center gap-2">
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-red" />
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="h-3 w-3 fill-chrome-200"
          style={{ opacity: i === Math.floor(count / 2) ? 1 : 0.55 }}
        >
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
        </svg>
      ))}
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-blue" />
    </div>
  );
}

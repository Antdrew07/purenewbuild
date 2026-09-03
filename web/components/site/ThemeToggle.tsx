"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle colour theme"}
      className="grid h-11 w-11 place-items-center rounded-lg border border-border-hair bg-bg-glass text-text-secondary backdrop-blur transition-colors hover:border-red/50 hover:text-red"
    >
      {/* Both icons render server-side; visibility swaps after mount so there is
          no hydration mismatch and no icon flash. */}
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${mounted && isDark ? "hidden" : ""}`} fill="currentColor">
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
      </svg>
      <svg viewBox="0 0 24 24" className={`h-4 w-4 ${mounted && isDark ? "" : "hidden"}`} fill="currentColor">
        <path d="M12 17a5 5 0 100-10 5 5 0 000 10zm0 2.5a1 1 0 011 1V22a1 1 0 11-2 0v-1.5a1 1 0 011-1zm0-19a1 1 0 011 1V3a1 1 0 11-2 0V1.5a1 1 0 011-1zM3.5 11h-2a1 1 0 100 2h2a1 1 0 100-2zm19 0h-2a1 1 0 100 2h2a1 1 0 100-2zM5.6 4.2l1.1 1.1A1 1 0 015.3 6.7L4.2 5.6a1 1 0 011.4-1.4zm12.7 12.7l1.1 1.1a1 1 0 01-1.4 1.4l-1.1-1.1a1 1 0 011.4-1.4zm1.1-12.7a1 1 0 010 1.4l-1.1 1.1a1 1 0 11-1.4-1.4l1.1-1.1a1 1 0 011.4 0zM6.7 17.3a1 1 0 010 1.4l-1.1 1.1a1 1 0 01-1.4-1.4l1.1-1.1a1 1 0 011.4 0z" />
      </svg>
    </button>
  );
}

"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { CartProvider } from "@/lib/cart";
import { MemberProvider } from "@/lib/member";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem disableTransitionOnChange>
      <MemberProvider><CartProvider>{children}</CartProvider></MemberProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--pp-bg-elevated)",
            border: "1px solid var(--pp-border)",
            color: "var(--pp-text-primary)",
          },
        }}
      />
    </ThemeProvider>
  );
}

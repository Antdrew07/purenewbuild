"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { CartProvider } from "@/lib/cart";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem disableTransitionOnChange>
      <CartProvider>{children}</CartProvider>
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

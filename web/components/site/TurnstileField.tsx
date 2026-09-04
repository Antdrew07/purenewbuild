"use client";

import { useEffect, useRef, useState } from "react";

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window { turnstile?: TurnstileApi }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT_ID = "cloudflare-turnstile-api";

export function TurnstileField({
  action,
  onToken,
  disabled = false,
}: {
  action: "member_register" | "member_login";
  onToken: (token: string | null) => void;
  disabled?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!SITE_KEY || !container.current || disabled) return;
    let active = true;

    const render = () => {
      if (!active || !container.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: SITE_KEY,
        theme: "auto",
        size: "flexible",
        action,
        callback: (token: string) => { setError(""); onToken(token); },
        "error-callback": () => { onToken(null); setError("Verification could not load. Please refresh and try again."); },
        "expired-callback": () => { onToken(null); setError("Verification expired. Complete it again before continuing."); },
      });
    };

    if (window.turnstile) render();
    else {
      const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      const script = existing ?? document.createElement("script");
      if (!existing) {
        script.id = SCRIPT_ID;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render, { once: true });
    }

    return () => {
      active = false;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
    };
  }, [action, disabled, onToken]);

  if (!SITE_KEY) {
    return <p className="turnstile-message" role="status">Bot verification is being configured. Member access will open once it is active.</p>;
  }

  return (
    <div className="turnstile-field">
      <div ref={container} />
      {error && <p role="alert" className="turnstile-message text-red">{error}</p>}
    </div>
  );
}

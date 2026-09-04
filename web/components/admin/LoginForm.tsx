"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { adminApi, adminApiConfigured, setToken } from "@/lib/admin-client";

export function LoginForm({ onSignedIn }: { onSignedIn: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const { token, email: signedInAs } = await adminApi.login(email, password);
      setToken(token);
      onSignedIn(signedInAs);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="admin-login brushed glass relative overflow-hidden rounded-2xl p-8">
        <span aria-hidden="true" className="neon-rule absolute inset-x-0 top-0 h-px" />
        <div className="relative z-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-blue">Pure Peptide operations</p>
          <h1 className="font-display text-3xl font-black uppercase text-text-primary">
            <span className="chrome-text">Admin</span> <span className="text-red">sign in</span>
          </h1>

          {!adminApiConfigured && (
            <p className="mt-4 rounded-lg border border-blue/40 bg-blue/10 p-3 text-xs leading-relaxed text-text-secondary">
              <strong className="text-blue">Demo mode.</strong> Set{" "}
              <code className="font-mono">NEXT_PUBLIC_API_URL</code> and run the API with a
              database to enable the admin panel.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-text-dim">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border-hair bg-bg-base/60 px-4 py-3 text-sm text-text-primary focus:border-red/60 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-text-dim">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border-hair bg-bg-base/60 px-4 py-3 text-sm text-text-primary focus:border-red/60 focus:outline-none"
              />
            </div>
            <Button type="submit" disabled={pending || !adminApiConfigured} className="w-full">
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

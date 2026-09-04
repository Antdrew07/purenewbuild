"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { TurnstileField } from "./TurnstileField";
import { StarDivider } from "@/components/ui/Chrome";
import { useMember } from "@/lib/member";
import { membersApiConfigured, registerMember, signInMember, turnstileConfigured, MemberAuthError } from "@/lib/members-client";

type Mode = "register" | "login";

/** The same four claims the home page makes in its American Standard rail. */
const PROOF = [
  { n: "01", label: "Veteran owned", detail: "American operated" },
  { n: "02", label: "Third-party tested", detail: "Identity & purity" },
  { n: "03", label: "Lot traceable", detail: "Documentation available" },
  { n: "04", label: "U.S. dispatch", detail: "Fast domestic shipping" },
];

/**
 * The storefront only renders after an adult member has verified the research
 * disclaimer and established a local member session. The API repeats all
 * meaningful checks—this UI is not treated as a security boundary.
 */
export function MemberAccessGate({ children }: { children: ReactNode }) {
  const { member, hydrated, signIn } = useMember();
  const pathname = usePathname();
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const gateOpen = hydrated && !member;

  useEffect(() => {
    if (!gateOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [gateOpen]);

  const onTurnstileToken = useCallback((token: string | null) => {
    setTurnstileToken(token);
    if (token) setError("");
  }, []);

  function changeMode(next: Mode) {
    setMode(next);
    setError("");
    setTurnstileToken(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (mode === "register" && !ageConfirmed) {
      setError("Confirm that you are at least 18 years old to continue.");
      return;
    }
    if (mode === "register" && password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    if (!turnstileToken) {
      setError(turnstileConfigured ? "Complete bot verification before continuing." : "Bot verification is being configured. Please return shortly.");
      return;
    }

    setPending(true);
    try {
      const session = mode === "register"
        ? await registerMember({ email, password, turnstileToken })
        : await signInMember({ email, password, turnstileToken });
      signIn(session);
    } catch (cause) {
      setError(cause instanceof MemberAuthError ? cause.message : "Could not complete member access.");
    } finally {
      setPending(false);
    }
  }

  if (!hydrated) {
    return <div className="member-gate member-gate--loading" aria-busy="true"><span className="member-gate__loader" /></div>;
  }
  if (member || ["/terms", "/privacy", "/shipping"].includes(pathname)) return <>{children}</>;

  const unavailable = !membersApiConfigured || !turnstileConfigured;
  const title = mode === "register" ? "Join the research portal" : "Member sign in";

  return (
    <main className="member-gate" aria-labelledby="member-gate-title">
      <div aria-hidden="true" className="member-gate__ground" />
      <div aria-hidden="true" className="member-gate__stars stars-strip" />
      <div className="member-gate__frame">
        <div className="member-gate__brand">
          <div aria-hidden="true" className="member-gate__film" />
          <div aria-hidden="true" className="member-gate__wash" />
          <div aria-hidden="true" className="member-gate__edge" />
          <div className="relative flex items-center gap-4 md:block">
            <div className="flag-hero__seal member-gate__seal w-fit flex-none">
              <div className="flag-hero__seal-inner">
                <Image src="/brand/logo-pure-peptide.jpeg" alt="Pure Peptide" width={240} height={240} priority className="h-11 w-11 rounded-full object-cover md:h-28 md:w-28 xl:h-32 xl:w-32" />
              </div>
            </div>
            <div className="min-w-0 md:mt-9">
              <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-blue md:text-[10px] md:tracking-[0.34em]">Veteran owned <span aria-hidden="true" className="text-red">·</span> American made</p>
              <h1 id="member-gate-title" className="mt-1.5 font-display text-[1.85rem] font-black uppercase leading-[0.86] text-white md:mt-3 md:text-5xl xl:text-6xl">
                <span className="chrome-text chrome-shine">Member</span> <span className="text-red red-chrome">access</span>
              </h1>
            </div>
          </div>
          <div className="relative hidden w-fit md:block"><StarDivider /></div>
          <p className="relative hidden max-w-md text-sm leading-relaxed text-text-secondary md:block xl:text-[15px]">
            Research-grade peptides held to a standard you can verify. Members get the full catalog, lot documentation on request, and fast dispatch from the USA.
          </p>
          <ul className="member-gate__proof relative hidden md:grid" aria-label="Pure Peptide standards">
            {PROOF.map((item) => (
              <li key={item.n} className="member-gate__proof-item">
                <span className="font-mono text-[10px] text-red">{item.n}</span>
                <div>
                  <p className="member-gate__proof-label">{item.label}</p>
                  <p className="member-gate__proof-detail">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="relative hidden font-mono text-[10px] uppercase tracking-[0.25em] text-text-dim md:block">Research use only <span aria-hidden="true" className="text-red">·</span> Not for human consumption</p>
        </div>

        <div className="member-gate__panel">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-blue">Restricted research portal</p>
          <h2 className="mt-2 font-display text-2xl font-black uppercase text-text-primary">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Pure Peptide products are supplied only for lawful laboratory research. You must be at least 18 and hold an account to enter this site.
          </p>

          <div className="member-gate__notice mt-4">
            <p className="font-display text-xs font-bold uppercase tracking-[0.15em] text-red">Research use only — not for human consumption</p>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">Products are not drugs, foods, cosmetics, or supplements and are not intended to diagnose, treat, cure, or prevent any disease. They may not be administered to humans or animals.</p>
          </div>

          <div className="member-gate__tabs mt-4" role="tablist" aria-label="Member access">
            <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => changeMode("register")} className={mode === "register" ? "is-active" : ""}>Create account</button>
            <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => changeMode("login")} className={mode === "login" ? "is-active" : ""}>Sign in</button>
          </div>

          {unavailable && (
            <p role="status" className="member-gate__status">Member access is being configured. Please return once account verification is active.</p>
          )}

          <form onSubmit={submit} className="mt-4 space-y-3.5" noValidate>
            <label className="block">
              <span className="member-gate__label">Email address</span>
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="member-gate__input" />
            </label>
            <label className="block">
              <span className="member-gate__label">Password</span>
              <input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required className="member-gate__input" />
              {mode === "register" && <span className="mt-1 block text-xs text-text-dim">Use 12 or more characters.</span>}
            </label>
            {mode === "register" && (
              <>
                <label className="block">
                  <span className="member-gate__label">Confirm password</span>
                  <input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} required className="member-gate__input" />
                </label>
                <label className="member-gate__check">
                  <input type="checkbox" checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} />
                  <span>I am at least 18 years old and understand that all products are for laboratory research use only and are not for human or animal consumption.</span>
                </label>
              </>
            )}

            <TurnstileField action={mode === "register" ? "member_register" : "member_login"} onToken={onTurnstileToken} disabled={pending || unavailable} />
            {error && <p role="alert" className="member-gate__error">{error}</p>}
            <button type="submit" disabled={pending || unavailable} className="member-gate__submit brand-button">
              {pending ? "Verifying…" : mode === "register" ? "Create account and enter" : "Sign in and enter"}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-text-dim">
            By continuing, you agree to our <Link href="/terms" className="text-text-secondary underline underline-offset-2">Terms</Link> and <Link href="/privacy" className="text-text-secondary underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}

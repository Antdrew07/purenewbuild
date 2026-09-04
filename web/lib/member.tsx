"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Member = { id: number; email: string };
type MemberSession = { token: string; member: Member };

type MemberContextValue = {
  member: Member | null;
  token: string | null;
  hydrated: boolean;
  signIn: (session: MemberSession) => void;
  signOut: () => void;
};

const STORAGE_KEY = "pp_member_session_v1";
const MemberContext = createContext<MemberContextValue | null>(null);

function validSession(value: unknown): value is MemberSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<MemberSession>;
  if (!session.token || !session.member || typeof session.member.id !== "number" || !session.member.email) return false;
  try {
    const payload = JSON.parse(atob(session.token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") ?? "")) as { exp?: number };
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function MemberProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MemberSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (validSession(parsed)) setSession(parsed);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  const signIn = useCallback((next: MemberSession) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo<MemberContextValue>(() => ({
    member: session?.member ?? null,
    token: session?.token ?? null,
    hydrated,
    signIn,
    signOut,
  }), [hydrated, session, signIn, signOut]);

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

export function useMember() {
  const value = useContext(MemberContext);
  if (!value) throw new Error("useMember must be used inside MemberProvider");
  return value;
}

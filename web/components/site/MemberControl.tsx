"use client";

import { useMember } from "@/lib/member";

export function MemberControl() {
  const { member, signOut } = useMember();
  if (!member) return null;

  return (
    <button
      type="button"
      onClick={signOut}
      className="member-control hidden min-h-11 items-center gap-2 rounded-lg border border-border-hair bg-bg-glass px-3 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-red/50 hover:text-red lg:inline-flex"
      aria-label={`Sign out ${member.email}`}
      title={`Signed in as ${member.email}. Select to sign out.`}
    >
      <span className="max-w-20 truncate">Member</span>
      <span aria-hidden="true" className="text-red">Sign out</span>
    </button>
  );
}

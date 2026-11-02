"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMember } from "@/lib/member";
import { myOrders, OrderError, type MemberOrder } from "@/lib/orders-client";
import { OrderSummaryCard } from "@/components/site/OrderSummaryCard";

export default function AccountPage() {
  const { member, token, hydrated, signOut } = useMember();
  const [orders, setOrders] = useState<MemberOrder[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hydrated || !token) return;
    myOrders(token)
      .then(setOrders)
      .catch((cause) => setError(cause instanceof OrderError ? cause.message : "Could not load your orders."));
  }, [hydrated, token]);

  return (
    <section className="commerce-page mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">Your account</p>
      <h1 className="mt-3 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl">
        <span className="chrome-text chrome-shine">My</span> <span className="text-red red-chrome">Orders</span>
      </h1>

      {member ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-hair bg-bg-elevated px-5 py-4">
          <p className="text-sm text-text-secondary">
            Signed in as <span className="font-semibold text-text-primary">{member.email}</span>
          </p>
          <div className="flex gap-2">
            <Link href="/track" className="inline-flex min-h-11 items-center rounded-xl border border-border-hair px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:border-red/50 hover:text-red">
              Track an order
            </Link>
            <button type="button" onClick={signOut} className="inline-flex min-h-11 items-center rounded-xl border border-border-hair px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:border-red/50 hover:text-red">
              Sign out
            </button>
          </div>
        </div>
      ) : (
        hydrated && (
          <p className="mt-8 rounded-2xl border border-border-hair bg-bg-elevated p-8 text-text-secondary">
            Sign in with a member account to see your order history.
          </p>
        )
      )}

      {error && <p role="alert" className="mt-6 text-sm text-red">{error}</p>}

      {member && orders === null && !error && (
        <div className="mt-8 space-y-3" aria-busy="true">
          {[0, 1].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl border border-border-hair bg-bg-elevated" />)}
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="commerce-empty mt-8 rounded-2xl border border-border-hair bg-bg-elevated p-12 text-center">
          <p className="text-lg font-semibold text-text-primary">No orders yet.</p>
          <Link href="/products" className="mt-4 inline-block text-sm text-red underline underline-offset-2">Browse the catalog</Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-8 space-y-4">
          {orders.map((o) => <OrderSummaryCard key={o.orderNumber} order={o} />)}
        </div>
      )}
    </section>
  );
}

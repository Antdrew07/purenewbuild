"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMember } from "@/lib/member";
import { myOrders, OrderError, type MemberOrder } from "@/lib/orders-client";
import { OrderSummaryCard } from "@/components/site/OrderSummaryCard";
import { myLoyalty, nextTierFor, tierFor, type LoyaltySummary } from "@/lib/loyalty-client";
import { formatCents } from "@/lib/cart";

export default function AccountPage() {
  const { member, token, hydrated, signOut } = useMember();
  const [orders, setOrders] = useState<MemberOrder[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"orders" | "points">("orders");
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);

  useEffect(() => {
    if (!hydrated || !token) return;
    myOrders(token)
      .then(setOrders)
      .catch((cause) => setError(cause instanceof OrderError ? cause.message : "Could not load your orders."));
    myLoyalty(token).then(setLoyalty).catch(() => setLoyalty(null));
  }, [hydrated, token]);

  return (
    <section className="commerce-page mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">Your account</p>
      <h1 className="mt-3 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl">
        <span className="chrome-text chrome-shine">My</span> <span className="text-red red-chrome">Account</span>
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

      {member && (
        <>
          <PointsOverview loyalty={loyalty} />
          <div className="mt-8 inline-flex rounded-xl border border-border-hair bg-bg-elevated p-1" role="tablist">
            {(["orders", "points"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`min-h-10 rounded-lg px-5 text-xs font-bold uppercase tracking-wider transition-colors ${tab === t ? "bg-text-primary text-bg-base" : "text-text-secondary hover:text-text-primary"}`}
              >
                {t === "orders" ? "Orders" : "Points history"}
              </button>
            ))}
          </div>
        </>
      )}

      {member && tab === "points" && <PointsHistory loyalty={loyalty} />}

      {error && tab === "orders" && <p role="alert" className="mt-6 text-sm text-red">{error}</p>}

      {member && tab === "orders" && orders === null && !error && (
        <div className="mt-8 space-y-3" aria-busy="true">
          {[0, 1].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl border border-border-hair bg-bg-elevated" />)}
        </div>
      )}

      {tab === "orders" && orders && orders.length === 0 && (
        <div className="commerce-empty mt-8 rounded-2xl border border-border-hair bg-bg-elevated p-12 text-center">
          <p className="text-lg font-semibold text-text-primary">No orders yet.</p>
          <Link href="/products" className="mt-4 inline-block text-sm text-red underline underline-offset-2">Browse the catalog</Link>
        </div>
      )}

      {tab === "orders" && orders && orders.length > 0 && (
        <div className="mt-8 space-y-4">
          {orders.map((o) => <OrderSummaryCard key={o.orderNumber} order={o} />)}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────── loyalty points ─────────────────────────── */

function PointsOverview({ loyalty }: { loyalty: LoyaltySummary | null }) {
  const balance = loyalty?.balance ?? 0;
  const lifetime = loyalty?.lifetime ?? 0;
  const tier = tierFor(lifetime);
  const next = nextTierFor(lifetime);
  const progress = next ? Math.min(100, ((lifetime - tier.min) / (next.min - tier.min)) * 100) : 100;

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border-hair bg-bg-elevated p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Points balance</p>
        <p className="mt-2 font-display text-4xl font-black tabular-nums text-text-primary">{balance.toLocaleString()}</p>
        <p className="mt-1 text-sm text-text-secondary">
          Worth <span className="font-semibold text-emerald-600">{formatCents(balance)}</span> in store credit
        </p>
        <p className="mt-3 rounded-lg bg-bg-base/60 px-3 py-2 text-[11px] text-text-secondary">
          Earn <strong className="text-text-primary">2 points</strong> for every <strong className="text-text-primary">$100</strong> spent. Redeem them at checkout.
        </p>
      </div>
      <div className="rounded-2xl border border-border-hair bg-bg-elevated p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Member tier</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-red/40 bg-red/10 font-display text-lg font-black text-red">{tier.name[0]}</span>
          <div>
            <p className="font-display text-xl font-black text-text-primary">{tier.name}</p>
            <p className="text-xs text-text-secondary">{lifetime.toLocaleString()} lifetime points</p>
          </div>
        </div>
        {next ? (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-text-dim">
              <span>{lifetime.toLocaleString()} pts</span>
              <span>{next.min.toLocaleString()} pts → {next.name}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-base/80">
              <div className="h-full rounded-full bg-red transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-text-dim">{(next.min - lifetime).toLocaleString()} points to {next.name}</p>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-red/30 bg-red/5 px-3 py-2 text-[11px] font-semibold text-red">Highest tier achieved</p>
        )}
      </div>
    </div>
  );
}

function PointsHistory({ loyalty }: { loyalty: LoyaltySummary | null }) {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const history = loyalty?.history ?? [];
  if (!loyalty) {
    return <p className="mt-6 rounded-2xl border border-border-hair bg-bg-elevated p-8 text-sm text-text-secondary">Points are not available right now.</p>;
  }
  if (history.length === 0) {
    return (
      <div className="commerce-empty mt-6 rounded-2xl border border-border-hair bg-bg-elevated p-12 text-center">
        <p className="text-lg font-semibold text-text-primary">No points activity yet.</p>
        <p className="mt-1 text-sm text-text-secondary">Points are earned automatically with every order.</p>
      </div>
    );
  }
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border-hair bg-bg-elevated">
      <p className="border-b border-border-hair px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-text-dim">Transaction history</p>
      <ul className="divide-y divide-border-hair">
        {history.map((t) => {
          const earn = t.points > 0;
          return (
            <li key={t.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{t.description || (earn ? "Points earned" : "Points redeemed")}</p>
                <p className="text-xs text-text-dim">{fmt(t.createdAt)}{t.orderNumber ? ` · ${t.orderNumber}` : ""}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`font-display text-base font-black tabular-nums ${earn ? "text-emerald-600" : "text-violet-600"}`}>{earn ? "+" : ""}{t.points.toLocaleString()} pts</p>
                <p className="text-[11px] text-text-dim">Balance {t.balanceAfter.toLocaleString()}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

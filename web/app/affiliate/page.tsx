"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMember } from "@/lib/member";
import { formatCents } from "@/lib/cart";
import { linkAffiliateCode, myAffiliate, type AffiliateMe } from "@/lib/affiliate-client";
import { OrderStatusPill } from "@/components/site/OrderStatusPill";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export default function AffiliatePage() {
  const { member, token, hydrated } = useMember();
  const [data, setData] = useState<AffiliateMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState("");
  const [linking, setLinking] = useState(false);

  async function load(t: string) {
    setLoading(true);
    try { setData(await myAffiliate(t)); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not load affiliate data"); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    if (!hydrated) return;
    if (!token) { setLoading(false); return; }
    void load(token);
  }, [hydrated, token]);

  async function link() {
    if (!token || !codeInput.trim()) { toast.error("Enter your promo code"); return; }
    setLinking(true);
    try {
      const r = await linkAffiliateCode(token, codeInput.trim());
      toast.success(`Linked! Your affiliate code is ${r.code}`);
      setCodeInput("");
      await load(token);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link code");
    } finally {
      setLinking(false);
    }
  }

  const stats = data?.stats ?? null;

  return (
    <section className="commerce-page mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">Affiliate portal</p>
      <h1 className="mt-3 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl">
        <span className="chrome-text chrome-shine">Your</span> <span className="text-red red-chrome">Dashboard</span>
      </h1>
      <p className="mt-3 text-sm text-text-secondary">Track orders, revenue and commission from your promo code.</p>

      {hydrated && !member && (
        <p className="mt-8 rounded-2xl border border-border-hair bg-bg-elevated p-8 text-text-secondary">Sign in with a member account to see your affiliate dashboard.</p>
      )}

      {member && loading && <div className="mt-8 h-40 animate-pulse rounded-2xl border border-border-hair bg-bg-elevated" aria-busy="true" />}

      {member && !loading && data && (
        <div className="mt-8 space-y-6">
          {/* Spendable credit — shown to anyone with a balance, even without a linked code */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border-hair bg-bg-elevated p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Store credit available</p>
              <p className="mt-2 font-display text-4xl font-black tabular-nums text-emerald-600">{formatCents(data.balanceCents)}</p>
              <p className="mt-1 text-sm text-text-secondary">Commission lands here once an order is paid. Apply it at checkout.</p>
            </div>
            {stats && (
              <div className="rounded-2xl border border-border-hair bg-bg-elevated p-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Your promo code</p>
                <p className="mt-2 font-display text-3xl font-black tracking-[0.1em] text-text-primary">{stats.code}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Customers get <span className="font-semibold text-emerald-600">{stats.discountRate}% off</span> · you earn <span className="font-semibold text-red">{stats.commissionRate}%</span>
                  {!stats.isActive && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">Inactive</span>}
                </p>
              </div>
            )}
          </div>

          {!stats && (
            <div className="rounded-2xl border border-border-hair bg-bg-elevated p-8 text-center">
              <p className="font-display text-xl font-black uppercase text-text-primary">Link your promo code</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">Enter your affiliate promo code to connect it to your account and start tracking your performance.</p>
              <div className="mx-auto mt-5 flex max-w-md gap-2">
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void link(); } }}
                  placeholder="e.g. SARAH20"
                  className="commerce-input min-h-11 w-full rounded-xl border border-border-hair bg-bg-base/60 px-4 font-mono text-sm uppercase text-text-primary placeholder:normal-case placeholder:text-text-dim focus:border-red/60 focus:outline-none"
                />
                <button type="button" onClick={() => void link()} disabled={linking} className="min-h-11 shrink-0 rounded-xl bg-red px-5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50">
                  {linking ? "Linking…" : "Link code"}
                </button>
              </div>
              <p className="mt-3 text-xs text-text-dim">Don&apos;t have a code? <Link href="/contact" className="text-red underline underline-offset-2">Contact us</Link> to become an affiliate.</p>
            </div>
          )}

          {stats && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["Total orders", String(stats.totalOrders), "orders using your code"],
                  ["Revenue generated", formatCents(stats.totalRevenueCents), "total order value"],
                  ["Commission earned", formatCents(stats.totalCommissionCents), `at ${stats.commissionRate}% commission`],
                ].map(([label, value, note]) => (
                  <div key={label} className="rounded-2xl border border-border-hair bg-bg-elevated p-5">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">{label}</p>
                    <p className="mt-2 font-display text-3xl font-black tabular-nums text-text-primary">{value}</p>
                    <p className="mt-1 text-xs text-text-dim">{note}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-border-hair bg-bg-elevated">
                <div className="flex items-center justify-between border-b border-border-hair px-5 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Orders using your code</p>
                  <span className="text-xs text-text-dim">{stats.orders.length} total</span>
                </div>
                {stats.orders.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-text-secondary">No orders yet. Share your code to start earning!</p>
                ) : (
                  <ul className="divide-y divide-border-hair">
                    {stats.orders.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                        <span className="font-mono text-xs font-bold text-text-primary">{o.orderNumber}</span>
                        <span className="text-xs text-text-dim">{fmtDate(o.createdAt)}</span>
                        <OrderStatusPill status={o.status} />
                        <span className="text-right">
                          <span className="block font-semibold tabular-nums text-text-primary">{formatCents(o.totalCents)}</span>
                          {o.status !== "cancelled" && !o.isSelf && (
                            <span className="block text-[11px] font-semibold text-red">+{formatCents(Math.round((o.totalCents * stats.commissionRate) / 100))} commission</span>
                          )}
                          {o.isSelf && <span className="block text-[11px] text-text-dim">your own order — no commission</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-border-hair bg-text-primary p-6 text-bg-base sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="font-display text-sm font-black uppercase tracking-wider">Share your code</p>
                  <p className="mt-1 text-xs opacity-70">Send customers to www.purepeptide.us and tell them to use code <span className="font-mono font-bold text-red">{stats.code}</span> for {stats.discountRate}% off.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(`Use code ${stats.code} for ${stats.discountRate}% off at www.purepeptide.us`).then(() => toast.success("Copied to clipboard")); }}
                  className="min-h-11 shrink-0 rounded-xl border border-bg-base/30 px-4 text-xs font-bold uppercase tracking-wider transition-colors hover:border-bg-base"
                >
                  Copy share message
                </button>
              </div>
            </>
          )}

          {data.history.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border-hair bg-bg-elevated">
              <p className="border-b border-border-hair px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-text-dim">Credit history</p>
              <ul className="divide-y divide-border-hair">
                {data.history.map((t) => (
                  <li key={t.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-text-primary">{t.description}</p>
                      <p className="text-xs text-text-dim">{fmtDate(t.createdAt)}{t.orderNumber ? ` · ${t.orderNumber}` : ""}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`font-display text-base font-black tabular-nums ${t.amountCents >= 0 ? "text-emerald-600" : "text-text-secondary"}`}>{t.amountCents >= 0 ? "+" : "−"}{formatCents(Math.abs(t.amountCents))}</p>
                      <p className="text-[11px] text-text-dim">Balance {formatCents(t.balanceAfterCents)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

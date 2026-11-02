"use client";

import { useState } from "react";
import { toast } from "sonner";
import { adminApi, type AffiliateStat, type PromoInput } from "@/lib/admin-client";
import { formatCents } from "@/lib/cart";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

const INPUT =
  "admin-input w-full rounded-xl border border-border-hair bg-bg-base/60 px-4 py-2.5 text-sm text-text-primary focus:border-red/60 focus:outline-none";

const EMPTY: PromoInput = { code: "", affiliateName: "", affiliateEmail: "", discountPercent: 10, commissionPercent: 20, exclusive: false };

/** Promo / affiliate codes with their order stats; create, edit and toggle. */
export function AffiliatesPanel({ promos, onChanged }: { promos: AffiliateStat[]; onChanged: () => void }) {
  const [form, setForm] = useState<PromoInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const [confirmClear, setConfirmClear] = useState<AffiliateStat | null>(null);
  const totals = promos.reduce(
    (t, p) => ({ orders: t.orders + p.totalOrders, revenue: t.revenue + p.revenueCents, commission: t.commission + p.commissionCents, owed: t.owed + p.creditBalanceCents }),
    { orders: 0, revenue: 0, commission: 0, owed: 0 },
  );

  async function clearCredit(p: AffiliateStat) {
    try {
      const r = await adminApi.clearPromoCredit(p.id);
      toast.success(`Cleared ${formatCents(r.clearedCents)} of commission credit`);
      setConfirmClear(null);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not clear credit");
    }
  }

  async function save() {
    if (!form.code.trim() || !form.affiliateName.trim()) { toast.error("Code and affiliate name are required"); return; }
    setSaving(true);
    try {
      await adminApi.savePromo({ ...form, code: form.code.trim(), affiliateEmail: form.affiliateEmail?.trim() || null });
      toast.success(`${form.code.toUpperCase()} saved`);
      setForm(EMPTY);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the code");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(p: AffiliateStat) {
    try {
      await adminApi.togglePromo(p.id, !p.isActive);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the code");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Affiliate orders", String(totals.orders)],
          ["Revenue via codes", formatCents(totals.revenue)],
          ["Commission earned", formatCents(totals.commission)],
          ["Credit owed (unpaid)", formatCents(totals.owed)],
        ].map(([label, value]) => (
          <div key={label} className="admin-stat admin-stat--neutral">
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">{label}</p>
            <p className="mt-1 font-display text-3xl font-black tabular-nums text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      <Panel>
        <p className="font-display text-lg font-bold uppercase text-text-primary">New or updated code</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-text-dim">Code</span>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="KYLE20" className={`${INPUT} uppercase`} />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-text-dim">Affiliate name</span>
            <input value={form.affiliateName} onChange={(e) => setForm({ ...form, affiliateName: e.target.value })} placeholder="Kyle" className={INPUT} />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-text-dim">Affiliate email (credit)</span>
            <input type="email" value={form.affiliateEmail ?? ""} onChange={(e) => setForm({ ...form, affiliateEmail: e.target.value })} placeholder="Optional — house codes earn nothing" className={INPUT} />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-text-dim">Customer discount %</span>
            <input type="number" min={0} max={100} step={0.5} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} className={INPUT} />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-text-dim">Commission %</span>
            <input type="number" min={0} max={100} step={0.5} value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: Number(e.target.value) })} className={INPUT} />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
          <input type="checkbox" checked={Boolean(form.exclusive)} onChange={(e) => setForm({ ...form, exclusive: e.target.checked })} />
          Store-wide sale code — cannot be combined with points or affiliate credit
        </label>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save code"}</Button>
          <Button variant="outline" onClick={() => setForm(EMPTY)}>Clear</Button>
        </div>
      </Panel>

      {promos.length === 0 ? (
        <Panel className="text-center"><p className="text-text-secondary">No promo codes yet.</p></Panel>
      ) : (
        <div className="space-y-3">
          {promos.map((p) => (
            <Panel key={p.id} className={p.isActive ? "" : "opacity-70"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-text-primary px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-bg-base">{p.code}</span>
                    <span className="font-display text-lg font-bold text-text-primary">{p.affiliateName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${p.isActive ? "bg-emerald-500/15 text-emerald-600" : "bg-text-dim/20 text-text-secondary"}`}>{p.isActive ? "Active" : "Inactive"}</span>
                    {p.exclusive && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">Sale · no stacking</span>}
                    {p.creditBalanceCents > 0 && <span className="rounded-full bg-red/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red">Owed {formatCents(p.creditBalanceCents)}</span>}
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    {p.discountPercent}% customer discount · <span className="text-amber-600">{p.commissionPercent}% commission</span>
                    {p.affiliateEmail ? <> · credits <span className="text-text-primary">{p.affiliateEmail}</span></> : <> · house code (no commission)</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  {p.creditBalanceCents > 0 && <Button variant="outline" onClick={() => setConfirmClear(p)}>Clear credit</Button>}
                  <Button variant="outline" onClick={() => setForm({ code: p.code, affiliateName: p.affiliateName, affiliateEmail: p.affiliateEmail ?? "", discountPercent: p.discountPercent, commissionPercent: p.commissionPercent, exclusive: p.exclusive })}>Edit</Button>
                  <Button variant="outline" onClick={() => void toggle(p)}>{p.isActive ? "Deactivate" : "Activate"}</Button>
                </div>
              </div>
              {confirmClear?.id === p.id && (
                <div className="mt-3 rounded-xl border border-red/40 bg-red/5 px-4 py-3 text-sm text-text-primary">
                  Clear <strong>{formatCents(p.creditBalanceCents)}</strong> of spendable credit for <strong>{p.affiliateName}</strong>? This sets their balance to $0 and is recorded in the ledger. Do this after you have paid them out.
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" onClick={() => setConfirmClear(null)}>Cancel</Button>
                    <Button onClick={() => void clearCredit(p)}>Yes, clear it</Button>
                  </div>
                </div>
              )}
              <div className="mt-4 grid gap-3 sm:grid-cols-5">
                {[
                  ["Orders", `${p.totalOrders}${p.selfOrders ? ` (${p.selfOrders} own)` : ""}`, ""],
                  ["Revenue", formatCents(p.revenueCents), ""],
                  ["Discounts given", formatCents(p.discountCents), ""],
                  ["Commission earned", formatCents(p.commissionCents), "text-amber-600"],
                  ["Credit owed", formatCents(p.creditBalanceCents), "text-red"],
                ].map(([label, value, tone]) => (
                  <div key={label} className="rounded-xl border border-border-hair bg-bg-base/60 px-3 py-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">{label}</p>
                    <p className={`mt-0.5 font-display text-xl font-black tabular-nums ${tone || "text-text-primary"}`}>{value}</p>
                  </div>
                ))}
              </div>
              {p.orders.length > 0 && (
                <div className="mt-3">
                  <button type="button" onClick={() => setOpen(open === p.id ? null : p.id)} className="text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-red">
                    {open === p.id ? "Hide orders" : `Show ${p.orders.length} order${p.orders.length === 1 ? "" : "s"}`}
                  </button>
                  {open === p.id && (
                    <ul className="mt-2 divide-y divide-border-hair border-t border-border-hair text-sm">
                      {p.orders.map((o) => (
                        <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                          <span className="font-mono text-xs text-text-primary">{o.orderNumber}</span>
                          <span className="text-text-secondary">{o.name}</span>
                          <span className="text-[10px] uppercase tracking-wider text-text-dim">{o.status.replace("_", " ")}{o.isSelf ? " · self" : ""}</span>
                          <span className="tabular-nums text-text-primary">{formatCents(o.totalCents)} <span className="text-emerald-600">(−{formatCents(o.discountCents)})</span></span>
                          <span className="text-xs text-text-dim">{new Date(o.createdAt).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

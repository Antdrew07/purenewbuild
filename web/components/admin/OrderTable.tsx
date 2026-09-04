"use client";

import { useState } from "react";
import { toast } from "sonner";
import { adminApi, type AdminOrder, type AdminOrderDetail } from "@/lib/admin-client";

const STATUS_STYLE: Record<AdminOrder["status"], string> = {
  awaiting_payment: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  paid: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  shipped: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400",
};

const STATUS_LABEL: Record<AdminOrder["status"], string> = {
  awaiting_payment: "Awaiting payment",
  paid: "Paid — no label",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

/**
 * Order queue.
 *
 * Approving is the money-touching action here: it marks a transfer as verified
 * and buys a real shipping label. It therefore asks for confirmation and names
 * the order number, rather than acting on a single stray click.
 */
export function OrderTable({
  orders,
  onChanged,
}: {
  orders: AdminOrder[];
  onChanged: () => void | Promise<void>;
}) {
  const [filter, setFilter] = useState<"all" | AdminOrder["status"]>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const counts = orders.reduce<Record<string, number>>((a, o) => {
    a[o.status] = (a[o.status] ?? 0) + 1;
    return a;
  }, {});

  async function approve(o: AdminOrder) {
    const ok = window.confirm(
      `Approve ${o.orderNumber} for ${o.totalFormatted}?\n\n` +
        `Only do this once you have SEEN the payment land with "${o.orderNumber}" in the note.\n\n` +
        `This buys a real shipping label and emails the customer.`,
    );
    if (!ok) return;

    setBusyId(o.id);
    try {
      const res = await adminApi.approveOrder(o.id);
      if (res.meta.labelPurchased) {
        toast.success(`${o.orderNumber} approved — tracking ${res.data.tracking?.number}`);
      } else {
        // Partial success is the dangerous case: money is marked received but
        // nothing is shipping. Say so loudly instead of showing a green tick.
        toast.warning(`${o.orderNumber} approved, but the label failed`, {
          description: res.meta.labelError ?? "Retry the label from this row.",
          duration: 10000,
        });
      }
      if (!res.meta.emailed) toast.warning("Customer email was not sent (Resend not configured)");
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function retryLabel(o: AdminOrder) {
    setBusyId(o.id);
    try {
      const r = await adminApi.buyLabel(o.id);
      toast.success(`Label bought — tracking ${r.tracking.number}`);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Label purchase failed");
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(o: AdminOrder) {
    if (!window.confirm(`Cancel ${o.orderNumber}? This cannot be undone.`)) return;
    setBusyId(o.id);
    try {
      await adminApi.cancelOrder(o.id);
      toast.success(`${o.orderNumber} cancelled`);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="admin-filters flex flex-wrap gap-2">
        {(["all", "awaiting_payment", "paid", "shipped", "cancelled"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-xs font-medium uppercase tracking-wide transition-colors ${
              filter === f ? "border-red bg-red text-white" : "border-border-hair text-text-secondary hover:border-red/50"
            }`}
          >
            {f === "all" ? "All" : STATUS_LABEL[f]}
            <span className="ml-1.5 font-mono text-[10px] opacity-70">
              {f === "all" ? orders.length : counts[f] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border-hair p-8 text-center text-sm text-text-secondary">
          No orders here yet.
        </p>
      ) : (
        <div className="admin-table mt-5 overflow-x-auto rounded-2xl border border-border-hair">
          <table className="w-full min-w-[54rem] text-left text-sm">
            <thead className="bg-bg-base/50 text-xs uppercase tracking-wider text-text-dim">
              <tr>
                <th className="p-3 font-medium">Order</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Tracking</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.id} className="border-t border-border-hair align-middle transition-colors hover:bg-bg-glass">
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={async () => {
                        try { setDetail(await adminApi.getOrder(o.id)); }
                        catch { toast.error("Could not load order"); }
                      }}
                      className="font-mono font-bold text-text-primary underline-offset-2 hover:text-red hover:underline"
                    >
                      {o.orderNumber}
                    </button>
                    <p className="mt-0.5 text-[11px] text-text-dim">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="p-3">
                    <p className="text-text-primary">{o.name}</p>
                    <p className="text-[11px] text-text-dim">{o.email}</p>
                  </td>
                  <td className="p-3 font-semibold tabular-nums text-text-primary">{o.totalFormatted}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="p-3">
                    {o.trackingNumber ? (
                      <a href={o.trackingUrl ?? "#"} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-blue hover:underline">
                        {o.trackingNumber}
                      </a>
                    ) : (
                      <span className="text-xs text-text-dim">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {o.status === "awaiting_payment" && (
                        <button type="button" disabled={busyId === o.id} onClick={() => approve(o)}
                          className="min-h-11 rounded-lg bg-green-600 px-3 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50">
                          {busyId === o.id ? "Working…" : "Approve payment"}
                        </button>
                      )}
                      {o.status === "paid" && !o.trackingNumber && (
                        <button type="button" disabled={busyId === o.id} onClick={() => retryLabel(o)}
                          className="min-h-11 rounded-lg bg-blue px-3 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50">
                          {busyId === o.id ? "Working…" : "Retry label"}
                        </button>
                      )}
                      {o.labelUrl && (
                        <a href={o.labelUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center rounded-lg border border-border-hair px-3 text-xs font-semibold text-text-primary hover:border-red/50">
                          Label
                        </a>
                      )}
                      {o.status !== "shipped" && o.status !== "cancelled" && (
                        <button type="button" disabled={busyId === o.id} onClick={() => cancel(o)}
                          className="min-h-11 rounded-lg border border-border-hair px-3 text-xs font-semibold text-text-secondary hover:border-red/60 hover:text-red disabled:opacity-50">
                          Cancel
                        </button>
                      )}
                    </div>
                    {o.adminNote && <p className="mt-1 text-right text-[11px] text-amber-600">{o.adminNote}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setDetail(null)}>
          <div
            className="admin-dialog max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-hair bg-bg-elevated p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-black text-text-primary">{detail.orderNumber}</h3>
                <p className="text-sm text-text-secondary">{detail.totalFormatted}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} aria-label="Close"
                className="grid h-11 w-11 place-items-center rounded-lg border border-border-hair text-text-secondary">×</button>
            </div>

            <h4 className="mt-6 font-mono text-[10px] uppercase tracking-widest text-text-dim">Ship to</h4>
            <address className="mt-1 not-italic text-sm leading-relaxed text-text-primary">
              {detail.name}<br />
              {detail.address1}{detail.address2 ? <><br />{detail.address2}</> : null}<br />
              {detail.city}, {detail.state} {detail.postalCode}<br />
              {detail.country}
              {detail.phone ? <><br />{detail.phone}</> : null}
            </address>
            <p className="mt-1 text-sm text-text-secondary">{detail.email}</p>

            <h4 className="mt-6 font-mono text-[10px] uppercase tracking-widest text-text-dim">Items</h4>
            <ul className="mt-1 space-y-1 text-sm">
              {detail.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="text-text-secondary">{i.name} {i.dosage} × {i.quantity}</span>
                  <span className="tabular-nums text-text-primary">${(i.lineTotalCents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            {detail.customerNote && (
              <>
                <h4 className="mt-6 font-mono text-[10px] uppercase tracking-widest text-text-dim">Customer note</h4>
                <p className="mt-1 text-sm text-text-secondary">{detail.customerNote}</p>
              </>
            )}
            {detail.adminNote && (
              <>
                <h4 className="mt-6 font-mono text-[10px] uppercase tracking-widest text-text-dim">Admin note</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-amber-600">{detail.adminNote}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

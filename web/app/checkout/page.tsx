"use client";

import Link from "next/link";
import { validatePromo, type PromoInfo } from "@/lib/promo-client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCents, useCart } from "@/lib/cart";
import { OrderError, ordersApiConfigured, placeOrder, shippingCentsFor, type PlacedOrder, type ShippingMethod } from "@/lib/orders-client";
import { myLoyalty, pointsEarnedFor } from "@/lib/loyalty-client";
import { PaymentPanel } from "@/components/cart/PaymentPanel";
import { useMember } from "@/lib/member";

type Field =
  | "name" | "email" | "phone" | "address1" | "address2"
  | "city" | "state" | "postalCode" | "customerNote";

const REQUIRED: Field[] = ["name", "email", "address1", "city", "state", "postalCode"];

const LABELS: Record<Field, string> = {
  name: "Full name",
  email: "Email",
  phone: "Phone (optional)",
  address1: "Address",
  address2: "Apt, suite (optional)",
  city: "City",
  state: "State",
  postalCode: "ZIP",
  customerNote: "Order notes (optional)",
};

export default function CheckoutPage() {
  const { lines, subtotalCents, clear, hydrated } = useCart();
  const { member, token } = useMember();
  const [form, setForm] = useState<Record<Field, string>>({
    name: "", email: "", phone: "", address1: "", address2: "",
    city: "", state: "", postalCode: "", customerNote: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [pending, setPending] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoInfo | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");
  const discountCents = promo?.valid && promo.discountPercent
    ? Math.min(subtotalCents, Math.max(0, Math.round((subtotalCents * promo.discountPercent) / 100)))
    : 0;

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const shippingCents = shippingCentsFor(subtotalCents, shippingMethod);
  const afterPromoCents = Math.max(0, subtotalCents - discountCents + shippingCents);

  // Loyalty points: 1 point = 1¢, capped at the balance and at the amount due.
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsInput, setPointsInput] = useState("");
  const [appliedPoints, setAppliedPoints] = useState(0);
  useEffect(() => {
    if (!token) { setPointsBalance(0); return; }
    myLoyalty(token).then((l) => setPointsBalance(l.balance)).catch(() => setPointsBalance(0));
  }, [token]);
  const pointsRedeemed = Math.min(appliedPoints, pointsBalance, afterPromoCents);
  const totalCents = Math.max(0, afterPromoCents - pointsRedeemed);
  const pointsToEarn = pointsEarnedFor(totalCents);

  function applyPoints() {
    const pts = parseInt(pointsInput, 10);
    if (!Number.isFinite(pts) || pts <= 0) { toast.error("Enter a number of points to redeem"); return; }
    if (pts > pointsBalance) { toast.error(`You have ${pointsBalance.toLocaleString()} points available`); return; }
    const capped = Math.min(pts, afterPromoCents);
    setAppliedPoints(capped);
    setPointsInput("");
    toast.success(capped < pts ? `Applied ${capped.toLocaleString()} points (the most this order can use)` : `${capped.toLocaleString()} points applied — saving ${formatCents(capped)}`);
  }

  async function applyPromo() {
    const code = promoInput.trim();
    if (!code) return;
    setPromoBusy(true);
    setPromoMessage("");
    try {
      const info = await validatePromo(code);
      setPromo(info.valid ? info : null);
      setPromoMessage(info.message);
    } catch (err) {
      setPromo(null);
      setPromoMessage(err instanceof Error ? err.message : "Could not check that code right now.");
    } finally {
      setPromoBusy(false);
    }
  }

  useEffect(() => {
    if (member?.email) setForm((current) => ({ ...current, email: member.email }));
  }, [member?.email]);

  const set = (f: Field, v: string) => {
    setForm((s) => ({ ...s, [f]: v }));
    if (errors[f]) setErrors((e) => ({ ...e, [f]: undefined }));
  };

  // Once the order exists the cart is gone, so this view owns the payment step.
  if (placed) return <PaymentPanel order={placed} />;

  if (hydrated && lines.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
        <h1 className="font-display text-4xl font-black uppercase text-text-primary">Nothing to check out</h1>
        <p className="mt-3 text-text-secondary">Your cart is empty.</p>
        <Link href="/products" className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-red px-7 text-sm font-bold uppercase tracking-wide text-white">
          Shop the catalog
        </Link>
      </section>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const next: Partial<Record<Field, string>> = {};
    for (const f of REQUIRED) if (!form[f].trim()) next[f] = `${LABELS[f]} is required`;
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address";
    }
    if (Object.keys(next).length) {
      setErrors(next);
      toast.error("Check the highlighted fields");
      window.requestAnimationFrame(() => document.getElementById(Object.keys(next)[0])?.focus());
      return;
    }

    setPending(true);
    try {
      if (!member || !token) {
        toast.error("Member sign-in is required");
        return;
      }
      const order = await placeOrder({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        address1: form.address1.trim(),
        address2: form.address2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        customerNote: form.customerNote.trim() || undefined,
        promoCode: promo?.valid && promo.code ? promo.code : undefined,
        shippingMethod,
        redeemPoints: pointsRedeemed > 0 ? pointsRedeemed : undefined,
        items: lines.map((l) => ({ slug: l.slug, quantity: l.quantity })),
      }, token);
      // Only clear once the server has the order — a failed request must not
      // silently destroy someone's cart.
      clear();
      setPlaced(order);
    } catch (err) {
      const msg = err instanceof OrderError ? err.message : "Something went wrong placing the order.";
      toast.error(msg);
    } finally {
      setPending(false);
    }
  }

  const inputCls = (f: Field) =>
    `commerce-input min-h-11 w-full rounded-xl border bg-bg-base/60 px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:outline-none ${
      errors[f] ? "border-red" : "border-border-hair focus:border-red/60"
    }`;

  return (
    <section className="commerce-page mx-auto max-w-5xl px-5 pb-20 pt-32 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">Almost there</p>
      <h1 className="mt-3 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl">
        <span className="chrome-text chrome-shine">Check</span><span className="text-red red-chrome">out</span>
      </h1>

      {Object.keys(errors).length > 0 && (
        <div role="alert" className="mt-6 rounded-xl border border-red/50 bg-red/10 px-4 py-3 text-sm text-text-primary">
          Check the highlighted fields
        </div>
      )}

      {!ordersApiConfigured && (
        <p className="mt-6 rounded-xl border border-red/40 bg-red/5 p-4 text-sm text-text-primary">
          Checkout is not connected yet — <code className="font-mono">NEXT_PUBLIC_API_URL</code> is not set,
          so orders cannot be submitted from this deployment.
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="checkout-layout mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="checkout-fields space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {(["name", "email"] as Field[]).map((f) => (
              <FieldBox key={f} f={f} form={form} set={set} errors={errors} cls={inputCls(f)} />
            ))}
          </div>
          <FieldBox f="phone" form={form} set={set} errors={errors} cls={inputCls("phone")} />
          <FieldBox f="address1" form={form} set={set} errors={errors} cls={inputCls("address1")} />
          <FieldBox f="address2" form={form} set={set} errors={errors} cls={inputCls("address2")} />
          <div className="grid gap-4 sm:grid-cols-3">
            {(["city", "state", "postalCode"] as Field[]).map((f) => (
              <FieldBox key={f} f={f} form={form} set={set} errors={errors} cls={inputCls(f)} />
            ))}
          </div>
          <fieldset className="rounded-2xl border border-border-hair bg-bg-elevated p-4">
            <legend className="px-1 font-mono text-[10px] uppercase tracking-widest text-text-dim">Shipping method</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {([
                { value: "standard", label: "Standard", note: "2–5 business days", price: subtotalCents >= 20_000 ? "Free" : "$15.00", hint: "Free on orders $200+" },
                { value: "next_day", label: "Next-day", note: "Order by 2pm ET", price: "$65.00", hint: "Overnight within the US" },
              ] as const).map((opt) => {
                const active = shippingMethod === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${active ? "border-red bg-red/5" : "border-border-hair hover:border-red/40"}`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={opt.value}
                      checked={active}
                      onChange={() => setShippingMethod(opt.value)}
                      className="mt-1 accent-[var(--red,#E8121C)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-text-primary">{opt.label}</span>
                        <span className="text-sm font-bold tabular-nums text-text-primary">{opt.price}</span>
                      </span>
                      <span className="block text-xs text-text-secondary">{opt.note}</span>
                      <span className="block text-[11px] text-text-dim">{opt.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div>
            <label htmlFor="customerNote" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-text-dim">
              {LABELS.customerNote}
            </label>
            <textarea
              id="customerNote" rows={3} value={form.customerNote}
              onChange={(e) => set("customerNote", e.target.value)}
              className="commerce-input w-full rounded-xl border border-border-hair bg-bg-base/60 px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:border-red/60 focus:outline-none"
            />
          </div>
          <p className="checkout-note text-xs leading-relaxed text-text-dim">
            United States only. All products are supplied for laboratory research use only and are not
            for human consumption.
          </p>
        </div>

        <aside className="order-ticket h-fit rounded-2xl border border-border-hair bg-bg-elevated p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-black uppercase tracking-wide text-text-primary">Order</h2>
          <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto text-sm">
            {lines.map((l) => (
              <li key={l.slug} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-text-secondary">
                  {l.name} {l.dosage} × {l.quantity}
                </span>
                <span className="shrink-0 tabular-nums text-text-primary">
                  {formatCents(l.priceCents * l.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border-hair pt-4">
            <label htmlFor="promoCode" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-text-dim">
              Promo code
            </label>
            <div className="flex gap-2">
              <input
                id="promoCode"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void applyPromo(); } }}
                placeholder="Optional"
                autoComplete="off"
                className="commerce-input min-h-11 w-full rounded-xl border border-border-hair bg-bg-base/60 px-4 py-2.5 text-sm uppercase text-text-primary placeholder:normal-case placeholder:text-text-dim focus:border-red/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void applyPromo()}
                disabled={promoBusy || !promoInput.trim()}
                className="min-h-11 shrink-0 rounded-xl border border-border-hair px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:border-red/50 hover:text-red disabled:opacity-50"
              >
                {promoBusy ? "Checking…" : "Apply"}
              </button>
            </div>
            {promoMessage && (
              <p role="status" className={`mt-2 text-xs ${promo?.valid ? "text-emerald-600" : "text-red"}`}>{promoMessage}</p>
            )}
          </div>

          {member && pointsBalance > 0 && (
            <div className="mt-4 rounded-xl border border-border-hair bg-bg-base/60 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-dim">Redeem points</span>
                <span className="text-[11px] text-text-secondary">{pointsBalance.toLocaleString()} available</span>
              </div>
              {pointsRedeemed > 0 ? (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-violet-300/60 bg-violet-500/10 px-3 py-2">
                  <div>
                    <p className="text-xs font-bold text-violet-600">{pointsRedeemed.toLocaleString()} points applied</p>
                    <p className="text-[11px] text-violet-500">Saving {formatCents(pointsRedeemed)}</p>
                  </div>
                  <button type="button" onClick={() => setAppliedPoints(0)} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-violet-600 hover:bg-violet-500/10">Remove</button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={pointsBalance}
                    inputMode="numeric"
                    value={pointsInput}
                    onChange={(e) => setPointsInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPoints(); } }}
                    placeholder={`Max ${Math.min(pointsBalance, afterPromoCents).toLocaleString()}`}
                    aria-label="Points to redeem"
                    className="commerce-input min-h-11 w-full rounded-xl border border-border-hair bg-bg-base/60 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:border-red/60 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyPoints}
                    disabled={!pointsInput}
                    className="min-h-11 shrink-0 rounded-xl border border-border-hair px-4 text-xs font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:border-red/50 hover:text-red disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              )}
              <p className="mt-2 text-[10px] text-text-dim">200 pts = $2.00 off</p>
            </div>
          )}

          <dl className="mt-4 space-y-1.5 border-t border-border-hair pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Subtotal</dt>
              <dd className="tabular-nums text-text-primary">{formatCents(subtotalCents)}</dd>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-emerald-600">Promo {promo?.code}</dt>
                <dd className="tabular-nums text-emerald-600">−{formatCents(discountCents)}</dd>
              </div>
            )}
            {pointsRedeemed > 0 && (
              <div className="flex justify-between">
                <dt className="text-violet-600">Loyalty points</dt>
                <dd className="tabular-nums text-violet-600">−{formatCents(pointsRedeemed)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-text-secondary">Shipping{shippingMethod === "next_day" ? " (next-day)" : ""}</dt>
              <dd className="tabular-nums text-text-primary">{shippingCents > 0 ? formatCents(shippingCents) : "Free"}</dd>
            </div>
          </dl>
          <div className="mt-3 flex justify-between border-t border-border-hair pt-4">
            <span className="font-bold text-text-primary">Total</span>
            <span className="font-display text-2xl font-black tabular-nums text-text-primary">
              {formatCents(totalCents)}
            </span>
          </div>
          {member && pointsToEarn > 0 && (
            <p className="mt-2 rounded-lg border border-emerald-300/60 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-700">
              You&apos;ll earn +{pointsToEarn} points on this order
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !ordersApiConfigured}
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-red text-sm font-bold uppercase tracking-wide text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Placing order…" : "Place order"}
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-text-dim">
            No payment is taken now. You will get Cash App and Venmo details on the next screen.
          </p>
        </aside>
      </form>
    </section>
  );
}

function FieldBox({
  f, form, set, errors, cls,
}: {
  f: Field;
  form: Record<Field, string>;
  set: (f: Field, v: string) => void;
  errors: Partial<Record<Field, string>>;
  cls: string;
}) {
  return (
    <div>
      <label htmlFor={f} className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-text-dim">
        {LABELS[f]}
      </label>
      <input
        id={f}
        value={form[f]}
        onChange={(e) => set(f, e.target.value)}
        aria-invalid={Boolean(errors[f])}
        aria-describedby={errors[f] ? `${f}-error` : undefined}
        autoComplete={
          f === "name" ? "name" : f === "email" ? "email" : f === "phone" ? "tel"
          : f === "address1" ? "address-line1" : f === "address2" ? "address-line2"
          : f === "city" ? "address-level2" : f === "state" ? "address-level1"
          : f === "postalCode" ? "postal-code" : "off"
        }
        className={cls}
      />
      {errors[f] && (
        <p id={`${f}-error`} className="mt-1 text-xs text-red">{errors[f]}</p>
      )}
    </div>
  );
}

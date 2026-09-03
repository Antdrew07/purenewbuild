"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { formatCents, useCart } from "@/lib/cart";
import { OrderError, ordersApiConfigured, placeOrder, type PlacedOrder } from "@/lib/orders-client";
import { PaymentPanel } from "@/components/cart/PaymentPanel";

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
  const [form, setForm] = useState<Record<Field, string>>({
    name: "", email: "", phone: "", address1: "", address2: "",
    city: "", state: "", postalCode: "", customerNote: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [pending, setPending] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

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
      return;
    }

    setPending(true);
    try {
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
        items: lines.map((l) => ({ slug: l.slug, quantity: l.quantity })),
      });
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
    `min-h-11 w-full rounded-xl border bg-bg-base/60 px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:outline-none ${
      errors[f] ? "border-red" : "border-border-hair focus:border-red/60"
    }`;

  return (
    <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-blue">Almost there</p>
      <h1 className="mt-3 font-display text-5xl font-black uppercase leading-[0.9] sm:text-6xl">
        <span className="chrome-text">Check</span><span className="text-red">out</span>
      </h1>

      {!ordersApiConfigured && (
        <p className="mt-6 rounded-xl border border-red/40 bg-red/5 p-4 text-sm text-text-primary">
          Checkout is not connected yet — <code className="font-mono">NEXT_PUBLIC_API_URL</code> is not set,
          so orders cannot be submitted from this deployment.
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
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
          <div>
            <label htmlFor="customerNote" className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-text-dim">
              {LABELS.customerNote}
            </label>
            <textarea
              id="customerNote" rows={3} value={form.customerNote}
              onChange={(e) => set("customerNote", e.target.value)}
              className="w-full rounded-xl border border-border-hair bg-bg-base/60 px-4 py-3 text-sm text-text-primary placeholder:text-text-dim focus:border-red/60 focus:outline-none"
            />
          </div>
          <p className="text-xs leading-relaxed text-text-dim">
            United States only. All products are supplied for laboratory research use only and are not
            for human consumption.
          </p>
        </div>

        <aside className="h-fit rounded-2xl border border-border-hair bg-bg-elevated p-6 lg:sticky lg:top-28">
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
          <div className="mt-4 flex justify-between border-t border-border-hair pt-4">
            <span className="font-bold text-text-primary">Total</span>
            <span className="font-display text-2xl font-black tabular-nums text-text-primary">
              {formatCents(subtotalCents)}
            </span>
          </div>

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

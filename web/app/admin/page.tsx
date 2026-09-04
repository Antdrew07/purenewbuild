"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { adminApi, getToken, setToken, type AdminOrder } from "@/lib/admin-client";
import { LoginForm } from "@/components/admin/LoginForm";
import { ProductTable } from "@/components/admin/ProductTable";
import { OrderTable } from "@/components/admin/OrderTable";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

type Message = Awaited<ReturnType<typeof adminApi.listMessages>>[number];
type Tab = "orders" | "products" | "messages";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  // Orders lead — the queue is the thing that needs acting on.
  const [tab, setTab] = useState<Tab>("orders");
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m, o] = await Promise.all([
        adminApi.listProducts(),
        adminApi.listMessages(),
        // Orders need a database; on a demo deployment this 503s rather than
        // taking the whole panel down with it.
        adminApi.listOrders().catch(() => [] as AdminOrder[]),
      ]);
      setProducts(p);
      setMessages(m);
      setOrders(o);
    } catch (err) {
      // A 401 clears the token in the client, so drop back to the login screen.
      if (!getToken()) setAuthed(false);
      toast.error(err instanceof Error ? err.message : "Could not load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hasToken = Boolean(getToken());
    setAuthed(hasToken);
    setChecking(false);
    if (hasToken) void load();
  }, [load]);

  function signOut() {
    setToken(null);
    setAuthed(false);
    setProducts([]);
    setMessages([]);
    setOrders([]);
  }

  const awaitingCount = orders.filter((o) => o.status === "awaiting_payment").length;
  const paidCount = orders.filter((o) => o.status === "paid").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center pt-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-hair border-t-red" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-40 sm:px-8">
        <LoginForm
          onSignedIn={() => {
            setAuthed(true);
            void load();
          }}
        />
      </div>
    );
  }

  return (
    <div className="admin-workspace mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8">
      <div className="admin-workspace__header flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-black uppercase leading-none">
          <span className="chrome-text">Control</span> <span className="text-red">panel</span>
        </h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </div>
      </div>

      <div className="admin-stats mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Awaiting payment", awaitingCount, "attention"],
          ["Paid — label needed", paidCount, "information"],
          ["Shipped", shippedCount, "complete"],
          ["Catalog products", products.length, "neutral"],
        ].map(([label, value, tone]) => (
          <div key={label as string} className={`admin-stat admin-stat--${tone}`}>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">{label}</p>
            <p className="mt-1 font-display text-3xl font-black tabular-nums text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="admin-tabs mt-8 flex gap-2" role="tablist">
        {(["orders", "products", "messages"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-xl border px-5 py-2.5 text-sm font-medium uppercase tracking-wide transition-colors ${
              tab === t
                ? "border-red bg-red/12 text-red"
                : "border-border-hair text-text-secondary hover:text-text-primary"
            }`}
          >
            {t}
            {t === "messages" && messages.length > 0 && (
              <span className="ml-2 font-mono text-[10px]">{messages.length}</span>
            )}
            {t === "orders" && awaitingCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-500 px-1.5 font-mono text-[10px] text-white">
                {awaitingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "orders" ? (
          <OrderTable orders={orders} onChanged={() => void load()} />
        ) : tab === "products" ? (
          <ProductTable products={products} onChanged={() => void load()} />
        ) : messages.length === 0 ? (
          <Panel className="text-center">
            <p className="text-text-secondary">No contact messages yet.</p>
          </Panel>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <Panel key={m.id} glow="blue">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-lg font-bold uppercase text-text-primary">{m.subject}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-text-dim">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  {m.name} ·{" "}
                  <a href={`mailto:${m.email}`} className="text-blue hover:underline">{m.email}</a>
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                  {m.message}
                </p>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

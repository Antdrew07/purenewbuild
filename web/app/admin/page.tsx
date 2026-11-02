"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { adminApi, getToken, setToken, type AdminOrder, type AdminMessage, type AffiliateStat } from "@/lib/admin-client";
import { AffiliatesPanel } from "@/components/admin/AffiliatesPanel";
import { MessagesPanel } from "@/components/admin/MessagesPanel";
import { LoginForm } from "@/components/admin/LoginForm";
import { ProductTable } from "@/components/admin/ProductTable";
import { OrderTable } from "@/components/admin/OrderTable";
import { Button } from "@/components/ui/Button";

type Message = AdminMessage;
type Tab = "orders" | "products" | "messages" | "affiliates";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  // Orders lead — the queue is the thing that needs acting on.
  const [tab, setTab] = useState<Tab>("orders");
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [promos, setPromos] = useState<AffiliateStat[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m, o, a] = await Promise.all([
        adminApi.listProducts(),
        adminApi.listMessages(),
        // Orders need a database; on a demo deployment this 503s rather than
        // taking the whole panel down with it.
        adminApi.listOrders().catch(() => [] as AdminOrder[]),
        adminApi.listPromos().catch(() => [] as AffiliateStat[]),
      ]);
      setProducts(p);
      setMessages(m);
      setOrders(o);
      setPromos(a);
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
    setPromos([]);
  }

  const awaitingCount = orders.filter((o) => o.status === "awaiting_payment").length;
  const paidCount = orders.filter((o) => o.status === "paid").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const unreadCount = messages.filter((m) => !m.handled).length;

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
        {(["orders", "products", "messages", "affiliates"] as Tab[]).map((t) => (
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
            {t === "messages" && unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-blue px-1.5 font-mono text-[10px] text-white">{unreadCount}</span>
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
        ) : tab === "affiliates" ? (
          <AffiliatesPanel promos={promos} onChanged={() => void load()} />
        ) : (
          <MessagesPanel messages={messages} onChanged={() => void load()} />
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { adminApi, type ProductInput } from "@/lib/admin-client";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";

const CATEGORIES = [
  "metabolic", "recovery", "growth", "cognitive",
  "longevity", "wellness", "sexual", "blends", "accessories",
];

const STATUSES: Product["status"][] = ["active", "out_of_stock", "coming_soon", "unavailable"];

const EMPTY: ProductInput = {
  name: "", dosage: "", price: null, categorySlug: "metabolic",
  status: "active", featured: false, note: null,
};

export function ProductTable({
  products,
  onChanged,
}: {
  products: Product[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<{ id: number | null; input: ProductInput } | null>(null);
  const [saving, setSaving] = useState(false);

  function startCreate() {
    setEditing({ id: null, input: { ...EMPTY } });
  }

  function startEdit(p: Product) {
    setEditing({
      id: p.id,
      input: {
        name: p.name,
        dosage: p.dosage,
        price: p.priceCents === null ? null : p.priceCents / 100,
        categorySlug: p.category || "metabolic",
        status: p.status,
        featured: p.featured,
        note: p.note,
      },
    });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id === null) await adminApi.createProduct(editing.input);
      else await adminApi.updateProduct(editing.id, editing.input);
      toast.success(editing.id === null ? "Product created" : "Product updated");
      setEditing(null);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Product) {
    // Deleting is irreversible — confirm with the product named explicitly.
    if (!window.confirm(`Permanently delete "${p.name} ${p.dosage}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteProduct(p.id);
      toast.success("Product deleted");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const set = (patch: Partial<ProductInput>) =>
    setEditing((e) => (e ? { ...e, input: { ...e.input, ...patch } } : e));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-black uppercase text-text-primary">
          Products <span className="font-mono text-sm text-text-dim">({products.length})</span>
        </h2>
        <Button onClick={startCreate}>New product</Button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-border-hair">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="bg-bg-elevated">
            <tr className="font-mono text-[10px] uppercase tracking-widest text-text-dim">
              <th scope="col" className="px-4 py-3">Product</th>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3">Price</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border-hair">
                <td className="px-4 py-3">
                  <span className="font-medium text-text-primary">{p.name}</span>
                  {p.dosage && <span className="ml-2 font-mono text-xs text-blue">{p.dosage}</span>}
                  {p.featured && <span className="ml-2 font-mono text-[10px] uppercase text-red">★</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">{p.category}</td>
                <td className="px-4 py-3 tabular-nums text-text-primary">{formatPrice(p.priceCents)}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(p)} className="text-xs uppercase tracking-wide text-text-secondary transition-colors hover:text-red">
                    Edit
                  </button>
                  <button onClick={() => remove(p)} className="ml-4 text-xs uppercase tracking-wide text-text-secondary transition-colors hover:text-red">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-label={editing.id === null ? "New product" : "Edit product"}
               className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-hair bg-bg-elevated p-6">
            <h3 className="font-display text-2xl font-black uppercase text-text-primary">
              {editing.id === null ? "New product" : "Edit product"}
            </h3>

            <div className="mt-5 space-y-4">
              <Field label="Name">
                <input value={editing.input.name} onChange={(e) => set({ name: e.target.value })} className={INPUT} />
              </Field>
              <Field label="Dosage">
                <input value={editing.input.dosage} onChange={(e) => set({ dosage: e.target.value })} className={INPUT} />
              </Field>
              <Field label="Price (USD, blank = enquire)">
                <input
                  type="number" min={0} step={1}
                  value={editing.input.price ?? ""}
                  onChange={(e) => set({ price: e.target.value === "" ? null : Number(e.target.value) })}
                  className={INPUT}
                />
              </Field>
              <Field label="Category">
                <select value={editing.input.categorySlug} onChange={(e) => set({ categorySlug: e.target.value })} className={INPUT}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={editing.input.status} onChange={(e) => set({ status: e.target.value as Product["status"] })} className={INPUT}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Note (composition, optional)">
                <textarea rows={3} value={editing.input.note ?? ""} onChange={(e) => set({ note: e.target.value || null })} className={INPUT} />
              </Field>
              <label className="flex items-center gap-2.5 text-sm text-text-primary">
                <input type="checkbox" checked={editing.input.featured} onChange={(e) => set({ featured: e.target.checked })} className="h-4 w-4 accent-red" />
                Feature on the homepage
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={save} disabled={saving || !editing.input.name.trim()} className="flex-1">
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const INPUT =
  "w-full rounded-xl border border-border-hair bg-bg-base/60 px-4 py-2.5 text-sm text-text-primary focus:border-red/60 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-text-dim">{label}</span>
      {children}
    </label>
  );
}

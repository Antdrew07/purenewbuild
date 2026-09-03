"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode,
} from "react";
import type { Product } from "./types";

/**
 * Cart state.
 *
 * The cart stores slug + quantity and a display snapshot only. The price shown
 * here is for the shopper's benefit — the server re-prices every line from the
 * catalog when the order is placed, so editing localStorage changes nothing
 * about what you are actually charged.
 */

export interface CartLine {
  slug: string;
  name: string;
  dosage: string;
  /** Display only. Authoritative price is computed server-side at checkout. */
  priceCents: number;
  form: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  /** False until the stored cart has been read, so SSR and first paint agree. */
  hydrated: boolean;
}

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: CartLine }
  | { type: "setQty"; slug: string; quantity: number }
  | { type: "remove"; slug: string }
  | { type: "clear" };

const STORAGE_KEY = "pp_cart_v1";
const MAX_QTY = 99;

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines, hydrated: true };
    case "add": {
      const existing = state.lines.find((l) => l.slug === action.line.slug);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.slug === action.line.slug
              ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + action.line.quantity) }
              : l,
          ),
        };
      }
      return { ...state, lines: [...state.lines, action.line] };
    }
    case "setQty": {
      const q = Math.max(0, Math.min(MAX_QTY, Math.floor(action.quantity)));
      if (q === 0) return { ...state, lines: state.lines.filter((l) => l.slug !== action.slug) };
      return { ...state, lines: state.lines.map((l) => (l.slug === action.slug ? { ...l, quantity: q } : l)) };
    }
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.slug !== action.slug) };
    case "clear":
      return { ...state, lines: [] };
  }
}

interface CartApi extends CartState {
  add: (p: Product, quantity?: number) => void;
  setQty: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  count: number;
  subtotalCents: number;
}

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [], hydrated: false });

  // Read once on mount. Anything malformed is discarded rather than crashing.
  useEffect(() => {
    let lines: CartLine[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          lines = parsed.filter(
            (l): l is CartLine =>
              typeof l === "object" && l !== null &&
              typeof (l as CartLine).slug === "string" &&
              Number.isFinite((l as CartLine).quantity),
          );
        }
      }
    } catch {
      // Private mode, cleared storage, or corrupt JSON — start empty.
    }
    dispatch({ type: "hydrate", lines });
  }, []);

  // Persist after hydration only, so an empty initial state never clobbers a saved cart.
  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // Storage full or blocked — the in-memory cart still works for this session.
    }
  }, [state.lines, state.hydrated]);

  const add = useCallback((p: Product, quantity = 1) => {
    if (p.priceCents === null) return;
    dispatch({
      type: "add",
      line: {
        slug: p.slug, name: p.name, dosage: p.dosage,
        priceCents: p.priceCents, form: p.form, quantity,
      },
    });
  }, []);

  const value = useMemo<CartApi>(() => {
    const count = state.lines.reduce((a, l) => a + l.quantity, 0);
    const subtotalCents = state.lines.reduce((a, l) => a + l.priceCents * l.quantity, 0);
    return {
      ...state,
      add,
      setQty: (slug, quantity) => dispatch({ type: "setQty", slug, quantity }),
      remove: (slug) => dispatch({ type: "remove", slug }),
      clear: () => dispatch({ type: "clear" }),
      count,
      subtotalCents,
    };
  }, [state, add]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

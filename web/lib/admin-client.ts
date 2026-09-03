import type { Product } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * The admin token lives in sessionStorage: cleared when the tab closes, never
 * shared across tabs, and paired with a 12h server-side expiry.
 * Hardening path for production: have the API set an httpOnly, Secure,
 * SameSite=Lax cookie on a shared parent domain and drop this entirely.
 */
const TOKEN_KEY = "pp_admin_token";

export const adminApiConfigured = Boolean(API_URL);

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
  else window.sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError(503, "NEXT_PUBLIC_API_URL is not set");

  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401) {
    setToken(null);
    throw new ApiError(401, "Session expired — sign in again");
  }
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }
  const json = (await res.json()) as { data: T };
  return json.data;
}

/**
 * Same as request(), but returns the whole envelope.
 *
 * Order approval reports partial success — the payment can be approved while
 * the label purchase fails — and that lives in `meta`, so it must not be
 * discarded the way request() discards it.
 */
async function requestFull<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError(503, "NEXT_PUBLIC_API_URL is not set");
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401) {
    setToken(null);
    throw new ApiError(401, "Session expired — sign in again");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export interface ProductInput {
  name: string;
  dosage: string;
  price: number | null;
  categorySlug: string;
  status: Product["status"];
  featured: boolean;
  note: string | null;
}

export interface AdminOrder {
  id: number;
  orderNumber: string;
  name: string;
  email: string;
  status: "awaiting_payment" | "paid" | "shipped" | "cancelled";
  totalCents: number;
  totalFormatted: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  adminNote: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export interface AdminOrderDetail extends AdminOrder {
  phone: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  customerNote: string | null;
  paymentMethod: "cashapp" | "venmo" | null;
  items: { id: number; name: string; dosage: string; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
}

export interface ApproveResult {
  data: { orderNumber: string; status: string; tracking: { number?: string; url?: string; labelUrl?: string } | null };
  meta: { approved: boolean; labelPurchased: boolean; labelError: string | null; emailed: boolean };
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ token: string; email: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  listProducts: () => request<Product[]>("/api/admin/products"),
  createProduct: (input: ProductInput) =>
    request<Product>("/api/admin/products", { method: "POST", body: JSON.stringify(input) }),
  updateProduct: (id: number, input: Partial<ProductInput>) =>
    request<Product>(`/api/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteProduct: (id: number) =>
    request<void>(`/api/admin/products/${id}`, { method: "DELETE" }),
  listMessages: () =>
    request<{ id: number; name: string; email: string; subject: string; message: string; createdAt: string }[]>(
      "/api/admin/messages",
    ),

  listOrders: (status?: string) =>
    request<AdminOrder[]>(`/api/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  getOrder: (id: number) => request<AdminOrderDetail>(`/api/admin/orders/${id}`),

  /** Marks payment verified, then buys a label and emails the customer. */
  approveOrder: (id: number, body: { paymentMethod?: "cashapp" | "venmo"; adminNote?: string; skipLabel?: boolean; weightOz?: number } = {}) =>
    requestFull<ApproveResult>(`/api/admin/orders/${id}/approve`, { method: "POST", body: JSON.stringify(body) }),

  /** Retry a label that failed during approval. */
  buyLabel: (id: number, weightOz?: number) =>
    request<{ tracking: { number: string; url: string; labelUrl: string } }>(
      `/api/admin/orders/${id}/label`, { method: "POST", body: JSON.stringify({ weightOz }) },
    ),

  cancelOrder: (id: number, adminNote?: string) =>
    request<{ orderNumber: string; status: string }>(
      `/api/admin/orders/${id}/cancel`, { method: "POST", body: JSON.stringify({ adminNote }) },
    ),
};

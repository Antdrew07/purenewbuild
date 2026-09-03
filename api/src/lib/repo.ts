import { and, asc, eq, ilike, inArray, or, sql as raw } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { CATALOG, toRecord, type ProductRecord } from "./catalog.js";

export interface ProductQuery {
  category?: string;
  q?: string;
  status?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "name" | "price_asc" | "price_desc";
  limit: number;
  offset: number;
}

export interface Repo {
  mode: "live" | "demo";
  listCategories(): Promise<{ slug: string; name: string; blurb: string | null; count: number }[]>;
  listProducts(q: ProductQuery): Promise<{ items: ProductRecord[]; total: number }>;
  getProduct(slug: string): Promise<ProductRecord | null>;
}

// ---------------------------------------------------------------- demo repo

const DEMO_PRODUCTS: ProductRecord[] = CATALOG.products.map(toRecord);

function sortProducts(items: ProductRecord[], sort: ProductQuery["sort"]) {
  const copy = [...items];
  if (sort === "price_asc") return copy.sort((a, b) => (a.priceCents ?? 1e9) - (b.priceCents ?? 1e9));
  if (sort === "price_desc") return copy.sort((a, b) => (b.priceCents ?? -1) - (a.priceCents ?? -1));
  return copy.sort((a, b) => a.name.localeCompare(b.name) || a.dosage.localeCompare(b.dosage));
}

const demoRepo: Repo = {
  mode: "demo",
  async listCategories() {
    return CATALOG.categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      blurb: c.blurb,
      count: DEMO_PRODUCTS.filter((p) => p.category === c.slug).length,
    }));
  },
  async listProducts(q) {
    let items = DEMO_PRODUCTS;
    if (q.category) items = items.filter((p) => p.category === q.category);
    if (q.status) items = items.filter((p) => p.status === q.status);
    if (q.featured !== undefined) items = items.filter((p) => p.featured === q.featured);
    if (q.minPrice !== undefined) items = items.filter((p) => (p.priceCents ?? 0) >= q.minPrice! * 100);
    if (q.maxPrice !== undefined) items = items.filter((p) => (p.priceCents ?? 0) <= q.maxPrice! * 100);
    if (q.q) {
      const needle = q.q.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.dosage.toLowerCase().includes(needle) ||
          (p.note ?? "").toLowerCase().includes(needle),
      );
    }
    const sorted = sortProducts(items, q.sort);
    return { items: sorted.slice(q.offset, q.offset + q.limit), total: sorted.length };
  },
  async getProduct(slug) {
    return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
  },
};

// ---------------------------------------------------------------- live repo

const liveRepo: Repo = {
  mode: "live",
  async listCategories() {
    const rows = await db!
      .select({
        slug: schema.categories.slug,
        name: schema.categories.name,
        blurb: schema.categories.blurb,
        count: raw<number>`count(${schema.products.id})::int`,
      })
      .from(schema.categories)
      .leftJoin(schema.products, eq(schema.products.categoryId, schema.categories.id))
      .groupBy(schema.categories.id)
      .orderBy(asc(schema.categories.sortOrder));
    return rows;
  },

  async listProducts(q) {
    const where = [];
    if (q.category) {
      const cat = await db!.select({ id: schema.categories.id })
        .from(schema.categories).where(eq(schema.categories.slug, q.category)).limit(1);
      // Unknown category yields no rows rather than silently ignoring the filter.
      where.push(eq(schema.products.categoryId, cat[0]?.id ?? -1));
    }
    if (q.status) where.push(eq(schema.products.status, q.status as never));
    if (q.featured !== undefined) where.push(eq(schema.products.featured, q.featured));
    if (q.minPrice !== undefined) where.push(raw`${schema.products.priceCents} >= ${q.minPrice * 100}`);
    if (q.maxPrice !== undefined) where.push(raw`${schema.products.priceCents} <= ${q.maxPrice * 100}`);
    if (q.q) {
      where.push(
        or(
          ilike(schema.products.name, `%${q.q}%`),
          ilike(schema.products.dosage, `%${q.q}%`),
        )!,
      );
    }
    const clause = where.length ? and(...where) : undefined;

    const orderBy =
      q.sort === "price_asc" ? raw`${schema.products.priceCents} asc nulls last`
      : q.sort === "price_desc" ? raw`${schema.products.priceCents} desc nulls last`
      : raw`${schema.products.name} asc`;

    const [items, totalRow] = await Promise.all([
      db!.select().from(schema.products).where(clause).orderBy(orderBy).limit(q.limit).offset(q.offset),
      db!.select({ n: raw<number>`count(*)::int` }).from(schema.products).where(clause),
    ]);

    const catRows = await db!.select().from(schema.categories);
    const catById = new Map(catRows.map((c) => [c.id, c.slug]));

    return {
      total: totalRow[0]?.n ?? 0,
      items: items.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        dosage: p.dosage,
        priceCents: p.priceCents,
        category: catById.get(p.categoryId ?? -1) ?? "",
        status: p.status,
        featured: p.featured,
        note: p.note,
        description: p.description,
        imageUrl: p.imageUrl,
        coaUrl: p.coaUrl,
      })),
    };
  },

  async getProduct(slug) {
    const rows = await db!.select().from(schema.products).where(eq(schema.products.slug, slug)).limit(1);
    const p = rows[0];
    if (!p) return null;
    const cat = p.categoryId
      ? await db!.select().from(schema.categories).where(eq(schema.categories.id, p.categoryId)).limit(1)
      : [];
    return {
      id: p.id, slug: p.slug, name: p.name, dosage: p.dosage, priceCents: p.priceCents,
      category: cat[0]?.slug ?? "", status: p.status, featured: p.featured, note: p.note,
      description: p.description, imageUrl: p.imageUrl, coaUrl: p.coaUrl,
    };
  },
};

export const repo: Repo = db ? liveRepo : demoRepo;

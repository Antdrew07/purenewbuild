import { Router } from "express";
import { z } from "zod";
import { repo } from "../lib/repo.js";
import { CATALOG } from "../lib/catalog.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { validateQuery } from "../middleware/validate.js";

export const productsRouter = Router();

const ListQuery = z.object({
  category: z.string().trim().min(1).optional(),
  q: z.string().trim().max(120).optional(),
  status: z.enum(["active", "out_of_stock", "coming_soon", "unavailable"]).optional(),
  featured: z.enum(["true", "false"]).optional().transform((v) => (v === undefined ? undefined : v === "true")),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["name", "price_asc", "price_desc"]).default("name"),
  limit: z.coerce.number().int().min(1).max(100).default(48),
  offset: z.coerce.number().int().min(0).default(0),
});

/** GET /api/products */
productsRouter.get(
  "/",
  validateQuery(ListQuery),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery as z.infer<typeof ListQuery>;
    const { items, total } = await repo.listProducts(q);
    res.json({
      data: items,
      meta: { total, limit: q.limit, offset: q.offset, mode: repo.mode },
    });
  }),
);

/** GET /api/products/meta — filter facets and order-gift tiers for the storefront. */
productsRouter.get(
  "/meta",
  asyncHandler(async (_req, res) => {
    const categories = await repo.listCategories();
    res.json({
      data: {
        categories,
        freeGifts: CATALOG.freeGifts,
        disclaimer: CATALOG.disclaimer,
        sorts: ["name", "price_asc", "price_desc"],
      },
      meta: { mode: repo.mode },
    });
  }),
);

/** GET /api/products/:slug */
productsRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const product = await repo.getProduct(req.params.slug);
    if (!product) throw new HttpError(404, "Product not found");
    res.json({ data: product, meta: { mode: repo.mode } });
  }),
);

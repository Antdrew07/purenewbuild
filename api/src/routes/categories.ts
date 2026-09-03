import { Router } from "express";
import { repo } from "../lib/repo.js";
import { asyncHandler } from "../middleware/error.js";

export const categoriesRouter = Router();

/** GET /api/categories */
categoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const data = await repo.listCategories();
    res.json({ data, meta: { mode: repo.mode } });
  }),
);

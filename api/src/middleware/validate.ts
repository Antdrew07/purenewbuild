import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { HttpError } from "./error.js";

export const validateBody =
  (schema: ZodSchema): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return next(new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input"));
    }
    req.body = parsed.data;
    next();
  };

/**
 * Express 4 exposes req.query as a getter on some setups, so the coerced result
 * is stashed on req.validatedQuery rather than assigned back over req.query.
 */
export const validateQuery =
  (schema: ZodSchema): RequestHandler =>
  (req, _res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return next(new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query"));
    }
    req.validatedQuery = parsed.data;
    next();
  };

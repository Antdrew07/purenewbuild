import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env, isAuthConfigured } from "../env.js";
import { HttpError } from "./error.js";

export interface AdminClaims {
  sub: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminClaims;
      validatedQuery?: unknown;
    }
  }
}

export function signAdminToken(claims: AdminClaims): string {
  if (!isAuthConfigured) throw new HttpError(503, "Auth is not configured");
  return jwt.sign(claims, env.JWT_SECRET, { expiresIn: "12h" });
}

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!isAuthConfigured) return next(new HttpError(503, "Auth is not configured"));

  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "Missing bearer token"));

  try {
    req.admin = jwt.verify(token, env.JWT_SECRET) as AdminClaims;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
};

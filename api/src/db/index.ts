import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env, isDbConfigured } from "../env.js";
import * as schema from "./schema.js";

/**
 * Null when DATABASE_URL is absent — callers fall back to the demo repository
 * so the API is fully usable with zero credentials.
 */
export const sql = isDbConfigured
  ? postgres(env.DATABASE_URL, { max: 10, prepare: false })
  : null;

export const db = sql ? drizzle(sql, { schema }) : null;
export { schema };

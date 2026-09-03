import "dotenv/config";

/**
 * Every service flips from demo to live independently when its own key appears.
 * A missing key degrades that one service — it never breaks boot.
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  OWNER_EMAIL: process.env.OWNER_EMAIL ?? "",
  CORS_ORIGIN: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(","),

  /* Manual payment destinations. Not secrets, but configurable so they can be
     changed without a deploy — and so the wrong business's handle can never be
     baked into a build. */
  CASHAPP_PAYMENT_URL: process.env.CASHAPP_PAYMENT_URL ?? "https://cash.app/$purepep26",
  VENMO_PAYMENT_URL: process.env.VENMO_PAYMENT_URL ?? "https://venmo.com/u/Adrianza-Walker",

  /* Shippo */
  SHIPPO_API_KEY: process.env.SHIPPO_API_KEY ?? "",
  SHIP_FROM_NAME: process.env.SHIP_FROM_NAME ?? "",
  SHIP_FROM_COMPANY: process.env.SHIP_FROM_COMPANY ?? "Pure Peptide LLC",
  SHIP_FROM_STREET1: process.env.SHIP_FROM_STREET1 ?? "",
  SHIP_FROM_STREET2: process.env.SHIP_FROM_STREET2 ?? "",
  SHIP_FROM_CITY: process.env.SHIP_FROM_CITY ?? "",
  SHIP_FROM_STATE: process.env.SHIP_FROM_STATE ?? "",
  SHIP_FROM_ZIP: process.env.SHIP_FROM_ZIP ?? "",
  SHIP_FROM_COUNTRY: process.env.SHIP_FROM_COUNTRY ?? "US",
  SHIP_FROM_PHONE: process.env.SHIP_FROM_PHONE ?? "",
};

export const isDbConfigured = Boolean(env.DATABASE_URL);
export const isEmailConfigured = Boolean(env.RESEND_API_KEY && env.OWNER_EMAIL);
export const isAuthConfigured = Boolean(env.JWT_SECRET);
export const isShippoConfigured = Boolean(env.SHIPPO_API_KEY);

if (!isAuthConfigured && env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is required in production");
}

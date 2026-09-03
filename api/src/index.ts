import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { env, isDbConfigured, isEmailConfigured, isShippoConfigured } from "./env.js";
import { repo } from "./lib/repo.js";
import { productsRouter } from "./routes/products.js";
import { categoriesRouter } from "./routes/categories.js";
import { contactRouter } from "./routes/contact.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { ordersRouter } from "./routes/orders.js";
import { adminOrdersRouter } from "./routes/adminOrders.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 240, standardHeaders: true, legacyHeaders: false }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    mode: repo.mode,
    services: { database: isDbConfigured, email: isEmailConfigured, shipping: isShippoConfigured },
  });
});

app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/contact", contactRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin", adminOrdersRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`[api] listening on :${env.PORT} (${repo.mode} mode)`);
  if (repo.mode === "demo") {
    console.log("[api] no DATABASE_URL — serving the seed catalog read-only");
  }
});

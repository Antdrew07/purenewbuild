import bcrypt from "bcryptjs";
import { db, schema } from "./index.js";
import { CATALOG, describe, slugify } from "../lib/catalog.js";

if (!db) {
  console.error("DATABASE_URL is required to seed. Set it in api/.env and retry.");
  process.exit(1);
}

const catIds = new Map<string, number>();

console.log("Seeding categories…");
for (const [i, c] of CATALOG.categories.entries()) {
  const row = await db
    .insert(schema.categories)
    .values({ slug: c.slug, name: c.name, blurb: c.blurb, sortOrder: i })
    .onConflictDoUpdate({
      target: schema.categories.slug,
      set: { name: c.name, blurb: c.blurb, sortOrder: i },
    })
    .returning();
  catIds.set(c.slug, row[0].id);
}
console.log(`  ${catIds.size} categories`);

console.log("Seeding products…");
let n = 0;
for (const p of CATALOG.products) {
  const slug = slugify(p.name, p.dosage);
  await db
    .insert(schema.products)
    .values({
      slug,
      name: p.name,
      dosage: p.dosage,
      priceCents: p.price === null ? null : Math.round(p.price * 100),
      categoryId: catIds.get(p.category) ?? null,
      status: p.status,
      featured: Boolean(p.featured),
      form: p.form ?? "vial",
      note: p.note ?? null,
      description: describe(p),
    })
    .onConflictDoUpdate({
      target: schema.products.slug,
      set: {
        name: p.name,
        priceCents: p.price === null ? null : Math.round(p.price * 100),
        status: p.status,
        featured: Boolean(p.featured),
        form: p.form ?? "vial",
        updatedAt: new Date(),
      },
    });
  n++;
}
console.log(`  ${n} products`);

// Optional first admin — only when both vars are present.
const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
if (adminEmail && adminPassword) {
  if (adminPassword.length < 12) {
    console.error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db
    .insert(schema.adminUsers)
    .values({ email: adminEmail, passwordHash })
    .onConflictDoUpdate({ target: schema.adminUsers.email, set: { passwordHash } });
  console.log(`Admin user ready: ${adminEmail}`);
} else {
  console.log("Skipped admin user (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one).");
}

process.exit(0);

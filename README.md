# Pure Peptide — purepeptide.us

Full-stack site for Pure Peptide LLC. Next.js frontend, Express REST API,
PostgreSQL, and an admin panel for managing the catalog.

Design derived from the supplied brand artwork — the palette below was sampled
from the logo, vial labels, and price sheet rather than chosen by eye.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Framer Motion |
| Backend | Node.js · Express 4 · Zod validation · JWT auth · Helmet · rate limiting |
| Database | PostgreSQL via Drizzle ORM |
| Email | Resend (optional) |

## Layout

```
purepeptide-us/
├── data/catalog.json          Source of truth for the seed catalog (76 products)
├── api/                       Express REST API
│   ├── src/db/                Drizzle schema, client, seeder
│   ├── src/lib/               catalog helpers + repository (live | demo)
│   ├── src/middleware/        auth, validation, error handling
│   └── src/routes/            products, categories, contact, auth, admin
└── web/                       Next.js app
    ├── app/                   routes: /, /products, /products/[slug], /about,
    │                          /contact, /admin, /terms, /privacy, /shipping
    ├── components/
    │   ├── fx/                ParticleField, Reveal, Parallax
    │   ├── ui/                Chrome, Panel, Button, Badge, ProductCard
    │   ├── site/              Nav, Footer, ThemeToggle, ContactForm, LegalPage
    │   ├── home/              Hero, About, FeaturedProducts, Testimonials, CTA
    │   ├── products/          CatalogGrid (filter + search + sort)
    │   └── admin/             LoginForm, ProductTable
    ├── lib/                   api client, demo data, motion presets, types
    └── public/brand/          logo + label artwork
```

---

## Running it

The site boots with **zero credentials** on deterministic seed data. Add keys to
flip each service to live, independently.

```bash
npm install

# Frontend only — full site on seed data, no API or database needed
npm run dev --workspace=web        # http://localhost:3000

# With the API (also demo mode until DATABASE_URL is set)
cp api/.env.example api/.env
cp web/.env.example web/.env.local  # set NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                         # both together
```

### Going live

```bash
# 1. Point at a Postgres instance
echo 'DATABASE_URL=postgres://…' >> api/.env

# 2. Create the schema and load the catalog
npm run db:push
npm run db:seed

# 3. Create the first admin (12+ char password)
SEED_ADMIN_EMAIL=you@purepeptide.us SEED_ADMIN_PASSWORD='…' npm run db:seed

# 4. Generate an auth secret
echo "JWT_SECRET=$(openssl rand -base64 48)" >> api/.env
```

`GET /health` reports which services are live:

```json
{"ok":true,"mode":"demo","services":{"database":false,"email":false}}
```

---

## API

Public:

| Method | Path | Notes |
|---|---|---|
| GET | `/api/products` | `category` `q` `status` `featured` `minPrice` `maxPrice` `sort` `limit` `offset` |
| GET | `/api/products/meta` | categories, gift tiers, disclaimer |
| GET | `/api/products/:slug` | single product |
| GET | `/api/categories` | with product counts |
| POST | `/api/contact` | validated, honeypot-protected, rate limited |

Admin — all require `Authorization: Bearer <token>`:

| Method | Path |
|---|---|
| POST | `/api/admin/login` |
| GET | `/api/admin/products` |
| POST | `/api/admin/products` |
| PATCH | `/api/admin/products/:id` |
| DELETE | `/api/admin/products/:id` |
| GET | `/api/admin/messages` |

---

## Design system

Every colour was sampled programmatically from the supplied artwork:

| Token | Value | Sampled from |
|---|---|---|
| `--pp-bg-base` | `#000000` | 20–52% of every reference image |
| `--pp-red` | `#E8121C` | `#F6000E` `#F01C19` `#FF0001` `#E00101` `#FC0715` |
| `--pp-blue` | `#0790FF` | neon label edge — `#04AAFF` `#0583F1` `#0790FF` |
| `--pp-navy` | `#0B3AA8` | flag field — `#1A55D7` `#0134BB` |
| chrome ramp | `#FDFDFD → #010101` | 9-stop bevel from the logo lettering |

Type: **Saira Condensed** (display, matching the squared condensed label
lettering), **Inter** (UI), **JetBrains Mono** (data/labels).

Both dark and light themes ship, dark-first, with a toggle. `light:` is a custom
Tailwind variant covering both the explicit toggle and the pre-hydration system
preference.

Brand primitives live in `globals.css`: `.chrome-text` (beveled lettering),
`.neon-rule` (red/blue label frame), `.glass`, `.brushed`, `.sheen`,
`.stars-strip`. All decorative motion is disabled under
`prefers-reduced-motion`.

---

## Deployment

- **web** → Vercel. Set `NEXT_PUBLIC_API_URL` to the API's public URL.
- **api** → Railway, Fly, or Render. Set `DATABASE_URL`, `JWT_SECRET`,
  `CORS_ORIGIN` (your Vercel domain), and optionally `RESEND_API_KEY` +
  `OWNER_EMAIL`.

---

## Known gaps

These are deliberate, not oversights:

- **No checkout.** The catalog is browse-and-enquire; product CTAs route to the
  contact form. Payments were not in scope.
- **Admin token in `sessionStorage`.** Cleared on tab close, paired with a 12h
  server expiry. For production, move to an httpOnly `Secure` `SameSite=Lax`
  cookie set by the API on a shared parent domain.
- **Testimonials are placeholder copy** attributed to roles, not invented named
  people. Replace with real consented reviews before launch.
- **Product photography** is not wired up — `imageUrl` exists on the schema and
  the admin form, but no images have been uploaded. Cards render a typographic
  treatment instead.
- **Compliance copy is a starting point,** not legal advice. Have counsel review
  `/terms`, `/privacy`, and `/shipping` before launch.

## Compliance

Every product surface carries "Research use only — not for human consumption".
The footer disclaimer renders on every page. The contact form states that dosing
and medical guidance will not be provided. Keep all of this in place.

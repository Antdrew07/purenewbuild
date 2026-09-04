# Pure Peptide — purepeptide.us (rebuild)

Next.js 15 storefront rebuild for Pure Peptide LLC. **This is one of three
Pure Peptide codebases on this machine — read "Not this project" below before
changing anything.**

- GitHub: `Antdrew07/purenewbuild` (public). The older private
  `Antdrew07/purepeptide-us` is a separate history; do not push there.
- Railway: project `purenewbuild` — services `web`
  (https://web-production-b3ad7.up.railway.app), `api`
  (https://api-production-298d.up.railway.app) and `Postgres`. Pushes to
  `main` deploy both app services. Per-service build/start commands live in
  the Railway dashboard: there is deliberately NO `railway.json` in the repo
  (a root config file applies to every service and broke the api build).
- Local dev: **http://127.0.0.1:3200**

## Run it

This is an npm **workspace** monorepo — `web/` has no `node_modules` of its own,
the binaries are hoisted to the repo root. `npx next dev` inside `web/` will
download a second copy of Next; use the hoisted binary instead:

```bash
cd web && ../node_modules/.bin/next dev -p 3200
# or from the repo root:
npm run dev --workspace=web
```

Requires **Node >= 20** (Tailwind v4's oxide binary). See `.nvmrc`.

## Architecture

| Layer | Choice |
|---|---|
| web | Next.js 15 App Router · React 19 · Tailwind v4 · Framer Motion |
| api | Express 4 · Drizzle · **Postgres** · Zod · JWT |
| data | catalog JSON — 96 products, 10 categories (see warning below) |

**Zero-credential boot.** With no env vars set the whole site renders from the
seed catalog. `NEXT_PUBLIC_API_URL` unset ⇒ `lib/api.ts` falls back to seed
data and the contact form / admin degrade gracefully. On Railway the api runs
live against Postgres (schema via `npm run db:push`, data via `npm run db:seed`;
re-seeding upserts by slug and updates name, price, status, form, category).

The site is gated: `MemberAccessGate` wraps every page and renders a loader
until hydration, so SSR HTML never contains page content — verify pages with a
real browser (Playwright), not `curl`. Cart, checkout (manual payment) and an
order admin exist here.

## The catalog is duplicated THREE times — read this first

`data/catalog.json`, `web/lib/demo/catalog.json` and `api/src/db/catalog.json`
are three copies of the same file. **Only `web/lib/demo/catalog.json` is read by
the site.** Editing `data/catalog.json` alone changes nothing and the build will
still look clean — this has already caused one silent no-op. Edit all three, or
collapse them to one source.

## Product imagery — read before touching

Products render by **form** (`vial` | `dropper` | `spray` | `pen`), set per
product in the catalog and dispatched by `web/components/ui/ProductMockup.tsx`.

Each labelled form is ONE master photo carrying the real Pure Peptide label with
its name panel left BLANK; the product name is drawn over it as SVG. Never bake
text into a master — image models garble small label copy (`PUREPEPTIDDE.US`,
`CONSUATION`).

| form | master | blank panel (1024x1536) |
|---|---|---|
| vial | `public/vial/vial-master-v3.png` | name box `x 352..696, y 1013..1096`; fixed copy baselines `y 1146 / 1183 / 1218` |
| dropper | `public/mockup/dropper-master-v2.png` | `cx 510, y 1048..1116, maxW 285` |
| spray | `public/mockup/spray-master.png` | `cx 510, y 1132..1212, maxW 320` |
| pen | `public/mockup/pen-master.png` | none — flat-lay, no label surface |

**If a master is regenerated, re-measure its panel** (canvas pixel scan) and
**rename the file**. Overwriting a master in place leaves Next's image optimiser
and the CDN serving the old bytes — that is why the dropper is `-v2`.

Catalog names ARE the vial names: **RT3** and **TR3** (renamed 2026-09-04; the
old compound names must not appear anywhere on the site). `vialLabelName` in
`VialMockup.tsx` still maps the old names as a safety net.

The label artwork reads "PURE PEPTIDES" (plural) but the correct domain is
`purepeptide.us` (singular) — the SVG footer overlay renders the singular form.

## Not this project

- `~/Pure Pep/purepeptide_bio` — **the LIVE store** at www.purepeptide.us
  (React+Vite+tRPC+MySQL on Railway, branch `railway-migration`). Real orders,
  real customers. Payment-handle and checkout changes belong there, not here.
- `~/purepeptide_bio` — stale, orphaned, unrelated git lineage. 23 unpushed
  commits. Do not build on it.
- `~/peptides4power` — a **different business** (David Furka). Never move
  payment handles between it and Pure Peptide.

## Open items

- **Cagrilintide 10mg has no price** — marked in stock but `price: null`, so it
  is the only product still rendering the "Enquire" state. Needs a price.
- Homepage `/` throws a client-side `[object Event]` in dev; `/products` is clean.
  Suspected HMR cross-origin on 127.0.0.1 — `allowedDevOrigins` added, verify.
- `CATALOG-AUDIT.md` holds unresolved price conflicts and product-legality
  questions carried over from the price sheet.

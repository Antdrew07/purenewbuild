# Catalog audit — price sheet vs. live database

**Date:** 22 August 2026
**Source:** Pure Peptides price sheet (supplied reference image)
**Target:** `purepeptide_bio` product table (68 products, MySQL/TiDB)
**Status:** Sheet transcribed and validated. DB-side diff **blocked** — see §7.

---

## 1. What was transcribed

77 rows read off the sheet, reconciled to **76 products** in
`data/catalog.json`. All 76 produce unique slugs; no collisions.

| | Count |
|---|---|
| Active | 69 |
| Out of stock | 1 |
| Coming soon | 1 |
| Unavailable (no price listed) | 5 |
| **Total** | **76** |

Assigned to 9 categories: Metabolic & GLP-1 (17), Longevity & Cellular (14),
Repair & Recovery (12), Growth & Performance (9), Blends & Stacks (8),
Cognitive & Neuro (5), Wellness & Vitamins (5), Hormone & Sexual Health (5),
Supplies & Accessories (1).

---

## 2. Conflicts inside the sheet itself

These need your decision — I made a call on each so the seed data is usable, but
each one is a guess:

| # | Conflict | What the sheet says | What I did |
|---|---|---|---|
| 1 | **SS-31 10mg listed twice at different prices** | Col 3 row 3 = **$50**; col 3 row 21 = **$45** | Kept one row at **$45**. One of these is wrong. |
| 2 | **HGH 100iu listed twice, $35 apart** | Col 1 "HGH 100IUS KIT" = **$150**; col 3 "HGH 100 IUs" = **$185** | Kept **both** as separate SKUs, assuming "KIT" is a different pack. If they're the same product, one price is an error. |
| 3 | **Korean Multivitamin listed twice** | Col 2 "Korean Multivitam 10mls" $60; col 3 "Korean Multivitamin 10mls" $60 | Merged to one row (same price, spelling differs). |
| 4 | **Glutathione vs Korean Glutathione** | Col 1 "Glutathione 1200mg" $60; col 3 "Korean Glutathione 1200mg" $45 | Kept both. Confirm these are genuinely different products — same dose, 25% price gap. |
| 5 | **Methylene Blue pricing inverts** | 60ml = $60; "Methyl Blue" 30ml = $50 | Kept both. Half the volume for 83% of the price. |
| 6 | **Eloralintide is "coming soon" but priced** | $115, marked coming soon | Status `coming_soon`, price retained for display. Not orderable. |

---

## 3. Products with no price (6)

Listed on the sheet with a dash instead of a price:

- Cagrilintide 10mg — explicitly marked *out of stock*
- Dichloroacetate 200mg
- NAD+ / ATP 150mg + 50mg
- AMP 5mg
- Ligandrol 10mg
- Winnie 50mg / 50 tabs

These render as **"Enquire"** rather than being hidden, so they stay discoverable
without implying they're purchasable.

---

## 4. Regulatory flag — two items are not peptides

**Ligandrol** (LGD-4033) is a SARM and **Winnie** (stanozolol) is an anabolic
steroid. Both sit in a materially different regulatory category from the rest of
the catalog, and both carry heightened enforcement risk for a research-chemical
supplier — separate from the peptide RUO posture the rest of the site rests on.

Neither currently has a price on the sheet. **Recommend confirming with counsel
whether these should be listed at all.** They are in the seed data as
`unavailable`; say the word and I'll remove them.

---

## 5. Naming normalised

The sheet uses shorthand and has some typos. Applied on transcription:

| Sheet | Normalised | Why |
|---|---|---|
| `5 amino 1 mg 50mg` | 5-Amino-1MQ 50mg | "1 mg" reads as a typo for **1MQ** |
| `AHKCU 100mg` | AHK-Cu 100mg | standard notation |
| `cjc/ipa 5mg/5mg` | CJC-1295 / Ipamorelin | expanded |
| `Eloralntide` | Eloralintide | spelling |
| `Melanotan2` | Melanotan II | consistency with Melanotan I |
| `TIRZ 15mg` | Tirzepatide 15mg | full compound name |
| `Reta 15mg` | Retatrutide 15mg | full compound name |
| `Tesa/ipa/cjc 6/3/3mg` | Tesa / Ipa / CJC 6mg/3mg/3mg | spacing |
| `HCG 5000IUS` | HCG 5000iu | unit casing |
| `IGF-LR3 1MG` | IGF-1 LR3 1mg | standard notation |

---

## 6. Two things on the artwork itself

**6.1 — The free-gift tiers don't make sense as written.** The sheet says:

- Under $150 → free PBS solution
- $150–$250 → free acetic water
- Over $250 → free PBS solution

The **highest** tier gives the same gift as the **lowest**. Transcribed verbatim
and rendered as-is on the site, but the $250+ tier is probably meant to be
"both", or something better than the entry tier.

**6.2 — The artwork carries the wrong domain.** The vial labels and the price
sheet all read **www.purepeptides.us** (plural). The round logo reads
**www.purepeptide.us** (singular), which you confirmed is correct and which the
site uses throughout. The label and price-sheet files should be re-exported with
the singular domain before they go to print or on the site as product imagery.

---

## 7. DB-side diff — blocked

**I could not run this.** `DATABASE_URL` is not present in any local `.env`
(`~/Pure Pep/.env` has `NODE_ENV`, `PORT`, and `JWT_SECRET` only), so there is no
way to reach the live MySQL/TiDB instance from here.

Give me `DATABASE_URL` and I'll produce the three lists that matter:

1. **In DB, not on sheet** → discontinue or restock
2. **On sheet, not in DB** → add
3. **Price deltas** → sheet price vs. stored price, per SKU

### One thing I can flag without the DB

Your project notes record **8 members-only/restricted products** in the live
database: Tirzepatide, Semaglutide, Retatrutide, Tesamorelin, Sermorelin,
Thymosin Alpha-1, Semax, GHRP-2.

Cross-referencing against the new sheet:

| Restricted product | On the new sheet? |
|---|---|
| Tirzepatide | ✅ yes — 15/20/30/60mg |
| Retatrutide | ✅ yes — 10/15/20/30/60mg |
| Tesamorelin | ✅ yes — 10mg |
| Semax | ✅ yes — 10mg |
| **Semaglutide** | ❌ **absent** |
| **Sermorelin** | ❌ **absent** |
| **Thymosin Alpha-1** | ❌ **absent** |
| **GHRP-2** | ❌ **absent** |

Four restricted products in your database have **no row on the new price sheet**.
Either they've been discontinued and should be deactivated, or the sheet is
incomplete. Worth resolving before the sheet drives any pricing update.

Separately: four of the products the DB gates behind members-only access are
listed openly on the sheet. If that gating still reflects your intent, the new
site needs the same restriction — it currently has none.

---

## 8. Recommendation

Do **not** push this to the live database yet. Resolve §2 (six conflicts), §4
(two regulatory items), and §7 (four missing restricted products) first. The
seed data is safe to run against a fresh Postgres instance for the new site,
where nothing is at stake.

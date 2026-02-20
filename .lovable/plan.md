
## SEO Landing Page Expansion Plan

### Audit Summary: What Already Exists vs. What Needs Building

Before detailing the plan, here is the exact current state of each requested URL:

| # | Requested URL | Current Status | Action Needed |
|---|---|---|---|
| 1 | `/filaments/high-speed-pla` | ✅ **Exists with full SEO** — `CATEGORY_META` + `MATERIAL_SLUG_CONFIG` entries, intro, FAQ, related links | Verify only — no change |
| 2 | `/best-3d-printer-filament` | ❌ **Does not exist** | Build new standalone page |
| 3 | `/pla-vs-petg` | ✅ **Exists as standalone page** at `/pla-vs-petg` with ArticleSchema + BreadcrumbSchema + FAQPage. Also duplicated in `guideConfigs.ts` at `/guides/pla-vs-petg`. | Add canonical redirect `/guides/pla-vs-petg` → `/pla-vs-petg` to consolidate authority |
| 4 | `/filaments/wood` | ❌ **Does not exist** — `MATERIAL_SLUG_CONFIG` has no `wood` entry, so `FilamentCategoryPage` redirects it to `/` | Add `MATERIAL_SLUG_CONFIG` + `CATEGORY_META` + `MATERIAL_KNOWLEDGE` + `RELATED_PROSE` entries |
| 5 | `/filaments/carbon-fiber` | ❌ **Does not exist** — same situation | Add entries |
| 6 | `/filaments/glow-in-the-dark` | ❌ **Does not exist** | Add entries |
| 7 | `/3d-printer-compatibility` | ❌ **Does not exist** (note: `/compatibility-matrix` exists as a Coming Soon stub) | Build new standalone page |
| 8 | `/hueforge-filament-guide` | ❌ **Does not exist** as this URL. `/best-filaments-for-hueforge` exists (good content), `/guides/hueforge-filaments` exists via `BuyingGuide` template. `/guides/hueforge-beginners-guide` also exists. | Create `/hueforge-filament-guide` route redirecting to the canonical at `/best-filaments-for-hueforge`, then strengthen that page's SEO for "hueforge filament" keywords |
| 9 | `/cheapest-filament` | ❌ **Does not exist** — `/guides/best-budget-filaments` exists but `/cheapest-filament` does not | Build new standalone page |
| 10 | `/filament-types` | ❌ **Does not exist** | Build new standalone page |

---

### Architecture Decision: Three Approaches Used

**Approach A — New Material Category Slugs (items 4, 5, 6):**
`FilamentCategoryPage` already handles all slug-based routes at `/filaments/:slug`. It reads config from `MATERIAL_SLUG_CONFIG` (in `MaterialHub.tsx`) and `CATEGORY_META` + `MATERIAL_KNOWLEDGE` + `RELATED_PROSE` (in `FilamentCategoryPage.tsx`). Adding a new slug requires entries in **all four** of these data structures — then the route works automatically because `<Route path="/filaments/:slug" element={<FilamentCategoryPage />} />` is already registered.

**Approach B — New Standalone Pages (items 2, 7, 9, 10):**
Build dedicated React page files following the pattern established by `BestFilamentsForBeginners.tsx` and `PLAVsPETG.tsx`: query Supabase for live data, compose editorial content, add schemas. Register new `<Route>` entries in `App.tsx`.

**Approach C — Redirects (items 3, 8):**
Add `<Navigate>` route entries in `App.tsx` to consolidate duplicate/alternative URL patterns to canonical destinations.

---

### Detailed Changes

#### Group 1: New Material Category Pages (Approach A)
**Files changed:** `src/pages/MaterialHub.tsx` (MATERIAL_SLUG_CONFIG), `src/pages/FilamentCategoryPage.tsx` (CATEGORY_META + MATERIAL_KNOWLEDGE + RELATED_PROSE)

**Three new slugs added:**

**`wood`** — Wood PLA:
- `MATERIAL_SLUG_CONFIG`: label "Wood PLA", materials `["Wood PLA", "Wood Fill", "Wood Filled PLA", "PLA-Wood", "Woodfill"]`, relatedSlugs `["pla", "silk-pla", "pla-plus"]`, guides `[{ label: "Best Wood Filaments", href: "/guides/best-wood-pla-filaments" }]`
- `CATEGORY_META`: title "Wood PLA Filaments — Realistic Wood Texture | FilaScope", h1 "Wood PLA Filaments", 300+ word intro about wood powder additive (typically 10–30%), sanding/staining capability, print temp 190–220°C (standard PLA settings), popular for cosplay props, furniture models, realistic decor
- `MATERIAL_KNOWLEDGE`: nozzle "190–220°C", bed "25–60°C", beginner false (clogs finer nozzles), enclosure false
- `RELATED_PROSE`: "Want standard PLA or specialty finishes?" → links to PLA, Silk PLA, PLA+

**`carbon-fiber`** — Carbon Fiber Filaments (multi-material):
- `MATERIAL_SLUG_CONFIG`: label "Carbon Fiber", materials `["PLA-CF", "PETG-CF", "ABS-CF", "ASA-CF", "PA-CF", "Nylon-CF", "Carbon Fiber PLA", "Carbon Fiber PETG", "Carbon Fiber Nylon"]`, relatedSlugs `["petg-cf", "nylon", "petg", "abs"]`, guides `[{ label: "Best Carbon Fiber Filaments", href: "/guides/best-carbon-fiber-filaments" }]`
- `CATEGORY_META`: title "Carbon Fiber Filaments — Lightweight & Stiff | FilaScope", h1 "Carbon Fiber 3D Printing Filaments", intro explaining short-strand CF reinforcement, stiffness-to-weight ratio, hardened steel nozzle requirement, applications in drones, RC cars, structural parts
- `MATERIAL_KNOWLEDGE`: nozzle "230–270°C (varies by base material)", bed "60–100°C", beginner false (requires hardened nozzle), enclosure false (varies)
- `RELATED_PROSE`: "Need a softer or easier base material?" → links to PETG, Nylon, PLA+

**`glow-in-the-dark`** — Glow in the Dark:
- `MATERIAL_SLUG_CONFIG`: label "Glow in the Dark", materials `["Glow in the Dark PLA", "Glow PLA", "Photoluminescent PLA", "Glow in Dark"]`, ilike `"%glow%"`, relatedSlugs `["silk-pla", "pla", "pla-plus"]`, colorSlugs `["green", "blue", "yellow"]`, guides `[]`
- `CATEGORY_META`: title "Glow in the Dark Filaments — Photoluminescent PLA | FilaScope", h1 "Glow in the Dark 3D Printer Filaments", intro covering strontium aluminate phosphor additive, glow duration (6–12 hours), recommended layer height (0.15mm+ for best glow), print settings same as standard PLA, use cases for safety markers/cosplay/night prints
- `MATERIAL_KNOWLEDGE`: nozzle "190–220°C", bed "25–60°C", beginner true (same settings as PLA), enclosure false
- `RELATED_PROSE`: "Interested in other specialty finishes?" → links to Silk PLA, PLA

---

#### Group 2: New Standalone Pages (Approach B)

**Item 2: `/best-3d-printer-filament`**
**New file:** `src/pages/BestFilament.tsx`
**New route in App.tsx:** `<Route path="/best-3d-printer-filament" element={<BestFilament />} />`
**Lazy import added:** `const BestFilament = lazy(() => import("./pages/BestFilament"));`

Page content structure (following `BestFilamentsForBeginners.tsx` pattern):
- `DocumentHead`: title "Best 3D Printer Filament 2026 — Top Picks Across All Materials | FilaScope", description targeting "best 3d printer filament" (very high volume keyword)
- `ArticleSchema`: datePublished 2026-01-01
- `BreadcrumbSchema` + visible `<Breadcrumbs>`: Home > Best 3D Printer Filament
- `ItemListSchema`: populated with top-scored filaments from DB
- **H1**: "Best 3D Printer Filament in 2026 — Every Material Ranked"
- **300+ word intro** covering: why filament choice matters, how FilaScope ranks (FilaScore algorithm), overview of major material tiers (PLA/PETG/ABS/ASA/TPU), quick decision guide
- **Supabase query**: top 12 filaments by `filascope_score` DESC, not null, with `variant_price` and `product_handle`
- **Ranked list UI** similar to `BestFilamentsForBeginners` using `FilamentCard`/rank display
- **Material category grid**: 6 clickable cards linking to `/filaments/pla`, `/filaments/petg`, etc. with brief one-liner per material
- **Internal links section**: links to `/best-filaments-for-beginners`, `/guides/best-pla-filaments`, `/pla-vs-petg`, `/filament-types`, `/deals`
- **FAQSection** with 5 targeted questions: "What is the best 3d printer filament overall?", "What is the best filament for beginners?", "Is PLA or PETG better?", "What filament is the strongest?", "What is the cheapest good filament?"
- **FAQPage JSON-LD** via `FAQSection`

---

**Item 7: `/3d-printer-compatibility`**
**New file:** `src/pages/FilamentPrinterCompatibility.tsx`
**New route:** `<Route path="/3d-printer-compatibility" element={<FilamentPrinterCompatibility />} />`
**Lazy import added**

Page content structure:
- `DocumentHead`: title "3D Printer Filament Compatibility — Which Filaments Work With Your Printer | FilaScope", description targeting "3d printer compatibility", "which filaments work with", etc.
- `ArticleSchema` + `BreadcrumbSchema` + `Breadcrumbs`
- **H1**: "3D Printer Filament Compatibility — Which Filaments Work With Your Printer?"
- **300+ word intro** explaining: why compatibility matters (max nozzle temp, heated bed, enclosure requirement, direct vs Bowden drive, hardened nozzle for CF), why different printers have different capabilities
- **Static compatibility table** (no DB query needed — this is reference content):

```text
| Printer | Max Temp | Enclosure | PLA | PETG | ABS | ASA | TPU | CF | Nylon | PC |
|---|---|---|---|---|---|---|---|---|---|---|
| Bambu Lab A1 Mini | 300°C | No | ✓ | ✓ | Limited | Limited | ✓ | ✓* | Limited | — |
| Bambu Lab X1C | 300°C | Yes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bambu Lab P1S | 300°C | Yes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Creality Ender 3 V3 | 260°C | No | ✓ | ✓ | Limited | Limited | ✓ | — | — | — |
| Creality K1 / K1 Max | 300°C | Yes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* | ✓ | Limited |
| Prusa MK4 | 290°C | Optional | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Limited |
| Prusa XL | 290°C | No | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Limited |
| Bambu Lab A1 | 300°C | No | ✓ | ✓ | Limited | Limited | ✓ | ✓* | — | — |
```
(* = requires hardened nozzle)

- **Material requirements section**: H2 for each major material explaining what printer specs are required
- **Internal links**: to `/printers`, `/guides/best-filament-for-bambu-lab-p1s`, `/guides/best-filament-for-ender-3`, `/filament-types`
- **FAQSection** with questions: "What filaments work on the Bambu Lab A1 Mini?", "Can an Ender 3 print PETG?", "What is the most compatible 3D printing filament?", etc.
- **Schema**: `Table` entity (no specific Table schema type; the Article + FAQ combination is sufficient)

---

**Item 9: `/cheapest-filament`**
**New file:** `src/pages/CheapestFilament.tsx`
**New route:** `<Route path="/cheapest-filament" element={<CheapestFilament />} />`
**Lazy import added**

Page content structure:
- `DocumentHead`: title "Cheapest 3D Printer Filament 2026 — Best Budget PLA & PETG | FilaScope", description targeting "cheap 3d printer filament", "cheapest PLA", "best budget filament"
- `ArticleSchema` + `BreadcrumbSchema` + `Breadcrumbs`
- `ItemListSchema` populated from DB query
- **H1**: "Cheapest 3D Printer Filament in 2026 — Budget Picks That Don't Sacrifice Quality"
- **300+ word intro**: covers how the filament market has matured (budget ≠ bad), what to watch for in cheap filament (diameter tolerance, tangle reports, brand history), which materials have the most competitive pricing (PLA most competitive, PETG second), regional pricing note
- **Supabase query**: filaments sorted by `variant_price` ASC where `variant_price IS NOT NULL`, limit 15. Secondary query for "best budget PLA" — PLA only, sorted by `filascope_score` DESC, limit 8
- Two ranked lists:
  - "Cheapest 3D Printer Filaments Right Now" (by raw price)
  - "Best Cheap PLA Filaments by Quality Score" (budget PLA ranked by FilaScore)
- **"When to spend more" section**: brief editorial on when cheap filament is risky (specialty materials, CF, engineering grade)
- **Internal links**: `/deals`, `/guides/best-budget-filaments`, `/filaments/pla`, `/best-filaments-for-beginners`
- **FAQSection**: "What is the cheapest PLA filament?", "Is cheap filament bad for your printer?", "How much should 3D printer filament cost?", "Where can I get the cheapest filament?", "Is eSUN good filament?"

---

**Item 10: `/filament-types`**
**New file:** `src/pages/FilamentTypes.tsx`
**New route:** `<Route path="/filament-types" element={<FilamentTypes />} />`
**Lazy import added**

Page content structure:
- `DocumentHead`: title "3D Printer Filament Types — Complete Guide to All Materials | FilaScope", description targeting "3d printer filament types", "types of 3d printing filament", "different filament materials"
- `ArticleSchema` + `BreadcrumbSchema` + `Breadcrumbs`
- `ItemListSchema` (pointing to each material category page)
- **H1**: "3D Printer Filament Types — Complete Guide to Every Material"
- **300+ word intro**: why material choice is the most important printer setting, the difference between the big three categories (easy/engineering/specialty), how to use this guide
- **Big comparison table** (static reference):

```text
| Material | Nozzle Temp | Enclosure | Strength | Difficulty | Best For | Price |
|---|---|---|---|---|---|---|
| PLA | 190–220°C | No | Medium | Beginner | Prototypes, decor | $ |
| PLA+ | 195–230°C | No | Medium+ | Beginner | Stronger PLA prints | $ |
| PETG | 220–250°C | No | High | Intermediate | Functional parts | $$ |
| ABS | 230–260°C | Required | High | Intermediate | Heat resistant parts | $$ |
| ASA | 230–260°C | Required | High | Intermediate | Outdoor/UV | $$ |
| TPU | 220–240°C | No | Flexible | Intermediate | Flexible parts | $$ |
| Nylon/PA | 240–270°C | Recommended | Very High | Advanced | Gears, engineering | $$$ |
| PC | 260–310°C | Required | Extreme | Advanced | Maximum strength | $$$ |
| Carbon Fiber | 230–270°C | Varies | Stiff | Advanced | Lightweight structural | $$$ |
| Wood PLA | 190–220°C | No | Medium | Beginner | Realistic textures | $$ |
| Silk PLA | 200–230°C | No | Medium | Beginner | Decorative, HueForge | $$ |
| Glow in Dark | 190–220°C | No | Medium | Beginner | Specialty/cosplay | $$ |
```

- **Individual material sections** (H2 per material): one paragraph per major type with link to its category page and material knowledge base page
- **"Which filament should I start with?"** decision guide section (quick 3-question flowchart in prose)
- **Internal links**: All `/filaments/:slug` pages, `/materials/:slug` pages, `/pla-vs-petg`, `/best-filaments-for-beginners`
- **FAQSection** + **FAQPage schema**: "What are the main types of 3D printer filament?", "What is the difference between PLA and PETG?", "What is the strongest 3D printing filament?", "Is 1.75mm or 2.85mm filament better?", "What filament type is best for outdoor use?"
- **HowToSchema** NOT added here — this is a reference/comparison page, not procedural. Article + FAQ is correct.

---

#### Group 3: Canonical Redirects (Approach C)

**Item 3: `/guides/pla-vs-petg`**
Currently, `guideConfigs.ts` has a `pla-vs-petg` entry but the canonical standalone page is `/pla-vs-petg` (PLAVsPETG.tsx — richer, bespoke page).
`/guides/:slug` renders `BuyingGuide` which uses the template — thin duplicate of the richer standalone.

**Change:** In `App.tsx`, add before the `/guides/:slug` wildcard:
```tsx
<Route path="/guides/pla-vs-petg" element={<Navigate to="/pla-vs-petg" replace />} />
```
This prevents the thin `BuyingGuideTemplate` version from competing with the richer standalone for the "pla vs petg" keyword.

**Item 8: `/hueforge-filament-guide`**
The canonical HueForge content is at `/best-filaments-for-hueforge` (standalone BestFilamentsForHueForge.tsx — richer than the guide template). The `/guides/hueforge-filaments` template version should also redirect.

**Changes in App.tsx:**
```tsx
<Route path="/hueforge-filament-guide" element={<Navigate to="/best-filaments-for-hueforge" replace />} />
<Route path="/guides/hueforge-filaments" element={<Navigate to="/best-filaments-for-hueforge" replace />} />
```

Additionally, strengthen `/best-filaments-for-hueforge` SEO by updating its `DocumentHead` title and description to explicitly target "hueforge filament" and "best filament for hueforge" — the page content already covers these topics well but the meta title doesn't fully capture the primary keywords.

---

### Files Changed Summary

| File | Type | Changes |
|---|---|---|
| `src/pages/MaterialHub.tsx` | Edit | Add `wood`, `carbon-fiber`, `glow-in-the-dark` entries to `MATERIAL_SLUG_CONFIG` |
| `src/pages/FilamentCategoryPage.tsx` | Edit | Add `wood`, `carbon-fiber`, `glow-in-the-dark` entries to `CATEGORY_META`, `MATERIAL_KNOWLEDGE`, `RELATED_PROSE` |
| `src/pages/BestFilament.tsx` | Create | New mega-comparison page for `/best-3d-printer-filament` |
| `src/pages/FilamentPrinterCompatibility.tsx` | Create | New compatibility guide for `/3d-printer-compatibility` |
| `src/pages/CheapestFilament.tsx` | Create | New budget-focused page for `/cheapest-filament` |
| `src/pages/FilamentTypes.tsx` | Create | New educational overview for `/filament-types` |
| `src/pages/BestFilamentsForHueForge.tsx` | Edit | Strengthen `DocumentHead` meta targeting "hueforge filament" keywords |
| `src/App.tsx` | Edit | 6 new `<Route>` entries + 4 new `lazy()` imports |

### What is Intentionally NOT Changed

- `/filaments/high-speed-pla` — already complete with intro, FAQ, MaterialKnowledge entries, and RELATED_PROSE. No changes needed.
- `PLAVsPETG.tsx` — `/pla-vs-petg` is already excellent. A redirect from `/guides/pla-vs-petg` consolidates it without rebuilding.
- All existing guide configs in `guideConfigs.ts` — no modifications. The BuyingGuideTemplate pages for comparison guides (`pla-vs-petg`, `hueforge-filaments`) will redirect to richer standalone pages instead.
- The `CompatibilityMatrix.tsx` page at `/compatibility-matrix` — kept as-is (different from `/3d-printer-compatibility`; the former is a planned data feature, the latter is the new editorial page).

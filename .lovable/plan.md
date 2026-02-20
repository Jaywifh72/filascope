
## Content SEO: Expand the Guide Library

### What Already Exists (Do Not Re-implement)

The guide infrastructure is **complete and production-quality**. There is no need to build a new template system.

| Component | Status |
|---|---|
| `BuyingGuideTemplate.tsx` | Full template with ToC, product cards, FAQ schema, Article schema, breadcrumbs, timestamps, related guides sidebar |
| `guideConfigs.ts` | 13 configs already written: PLA, PETG, ABS, PLA vs PETG, Beginner, HueForge, HueForge Lithophanes, PLA+ vs PLA Pro, Bambu P1S, Silk PLA, ASA vs ABS, Ender 3, Bambu A1 |
| `/guides/:slug` route | Already wired to `BuyingGuideTemplate` |
| `useGuideFilaments` hook | Pulls live ranked filaments from DB by material, TD, and score |
| SEO fields | `seoTitle`, `seoDescription`, `keywords`, `canonical`, Article + FAQ + Breadcrumb JSON-LD all already emit |

**The real gap:** 20+ requested guide slugs have no config entry. Additionally, several existing configs are not listed in the `LearningCenter` `GUIDES` array, so they're unreachable from the `/learn` index.

---

### Gaps to Fill

#### Gap 1 — Missing `BUYING_GUIDE_CONFIGS` entries (new guides to add to `guideConfigs.ts`)

These slugs appear in `relatedSlugs` of existing guides or are requested in the brief but have no config:

**Material "Best Of" guides:**
- `best-tpu-filaments` — Best TPU Filaments in 2026
- `best-asa-filaments` — Best ASA Filaments in 2026
- `best-nylon-filaments` — Best Nylon (PA) Filaments in 2026
- `best-pc-filaments` — Best Polycarbonate Filaments in 2026
- `best-silk-pla-filaments` — redirect alias for `silk-pla-comparison` (already exists — just need GUIDES entry)

**Material vs guides:**
- `abs-vs-asa` — alias/redirect covered by `asa-vs-abs-outdoor-printing` ✅ (already exists)
- `petg-vs-abs` — PETG vs ABS: Which Should You Choose?
- `tpu-vs-petg` — TPU vs PETG: Flexible vs Rigid

**Buyer intent guides:**
- `best-budget-filaments` — Best Budget Filaments Under $15/kg
- `best-filaments-for-miniatures` — Best Filaments for Miniatures & Detailed Prints
- `best-filaments-for-functional-parts` — Best Filaments for Functional Parts
- `best-filaments-for-outdoor-use` — Best Filaments for Outdoor Use
- `best-high-speed-pla-filaments` — Best High-Speed PLA Filaments

**HueForge guides:**
- `hueforge-beginners-guide` — Complete HueForge Guide for Beginners
- `understanding-td-values` — Understanding TD Values: What They Mean
- `hueforge-color-selection` — HueForge Color Selection Guide

**Printer-specific:**
- `best-filament-for-prusa-mk4` — Best Filaments for Prusa MK4
- `best-filament-for-creality-k1` — Best Filaments for Creality K1

That is **16 new configs** to add to `guideConfigs.ts`.

#### Gap 2 — LearningCenter `GUIDES` array is missing several existing configs

These configs exist in `guideConfigs.ts` but are absent from the `GUIDES` metadata array in `LearningCenter.tsx` (so they don't appear on the `/learn` index page):
- `asa-vs-abs-outdoor-printing`
- `silk-pla-comparison`
- `pla-plus-vs-pla-pro`
- `best-filament-for-bambu-lab-p1s` ✅ (present)
- `best-filaments-for-hueforge-lithophanes`
- `best-filament-for-ender-3`
- `best-filament-for-bambu-lab-a1`

These need to be added to the `GUIDES` array.

#### Gap 3 — LearningCenter category taxonomy needs "hueforge" and "printer-specific" categories

Currently `CATEGORIES` only has: `all`, `buying-guide`, `beginner`, `materials`, `troubleshooting`, `advanced`. The HueForge-specific and printer-specific guides deserve their own category so users can filter to them.

---

### Implementation Plan

#### File 1: `src/components/guides/guideConfigs.ts` — EDIT

Add 16 new `GuideConfig` entries to `BUYING_GUIDE_CONFIGS`. Each follows the identical structure:

```typescript
{
  slug: 'best-tpu-filaments',
  title: 'Best TPU Filaments in 2026',
  seoTitle: 'Best TPU Filaments 2026 — Flexible 3D Printing Picks | FilaScope',
  seoDescription: '...140-160 chars...',
  description: '...',
  category: 'buying-guide',
  readTime: 11,
  publishedAt: '2026-02-20',
  updatedAt: '2026-02-20',
  keywords: [...],
  filters: { material: 'TPU', sortBy: 'score', limit: 10 },
  layout: 'ranked-list',
  editorialSections: [
    { heading: '...', content: '...', position: 'before' },
    { heading: '...', content: '...', position: 'after' },
  ],
  faqs: [
    { question: '...', answer: '...' },
    ...3 FAQs each
  ],
  relatedSlugs: [...],
}
```

The 16 new configs to add, grouped:

**Material best-of (6):** `best-tpu-filaments`, `best-asa-filaments`, `best-nylon-filaments`, `best-pc-filaments`, `best-budget-filaments`, `best-high-speed-pla-filaments`

**VS comparisons (2):** `petg-vs-abs`, `tpu-vs-petg`

**Use-case guides (3):** `best-filaments-for-miniatures`, `best-filaments-for-functional-parts`, `best-filaments-for-outdoor-use`

**HueForge guides (3):** `hueforge-beginners-guide`, `understanding-td-values`, `hueforge-color-selection`

**Printer-specific (2):** `best-filament-for-prusa-mk4`, `best-filament-for-creality-k1`

Filters for each:
- TPU → `{ material: 'TPU', sortBy: 'score', limit: 10 }`
- ASA → `{ material: 'ASA', sortBy: 'score', limit: 10 }`
- Nylon → `{ material: 'Nylon', sortBy: 'score', limit: 10 }`
- PC → `{ material: 'PC', sortBy: 'score', limit: 10 }`
- Budget → `{ materials: ['PLA', 'PETG', 'ABS'], sortBy: 'price', limit: 10 }`
- High-speed PLA → `{ material: 'PLA', sortBy: 'score', limit: 10 }` + `high_speed_capable: true` (add filter support)
- PETG vs ABS → `{ materials: ['PETG', 'ABS'], sortBy: 'score', limit: 6, layout: 'vs-comparison' }`
- TPU vs PETG → `{ materials: ['TPU', 'PETG'], sortBy: 'score', limit: 6, layout: 'vs-comparison' }`
- Miniatures → `{ materials: ['PLA', 'Resin'], sortBy: 'score', limit: 10 }`
- Functional parts → `{ materials: ['PETG', 'ABS', 'Nylon', 'ASA'], sortBy: 'score', limit: 10 }`
- Outdoor → `{ materials: ['ASA', 'PETG', 'ABS'], sortBy: 'score', limit: 10 }`
- HueForge guides → `{ requireTD: true, sortBy: 'td', limit: 15 }` (reuse TD filter)
- Prusa MK4 → `{ materials: ['PLA', 'PETG', 'ASA', 'ABS'], sortBy: 'score', limit: 10 }`
- Creality K1 → `{ materials: ['PLA', 'PETG', 'TPU'], sortBy: 'score', limit: 10 }`

#### File 2: `src/pages/LearningCenter.tsx` — EDIT

**Part A:** Add 16 new entries to the `GUIDES` metadata array:

```typescript
{
  slug: 'best-tpu-filaments',
  title: 'Best TPU Filaments in 2026',
  description: 'Flexible filament ranked by Shore hardness, print quality, and compatibility with Bambu Lab, Ender 3, and Prusa printers.',
  category: 'buying-guide',
  readTime: 11,
  publishedAt: '2026-02-20',
  isBuyingGuide: true,
},
```

**Part B:** Add previously-missing existing guides to the `GUIDES` array:
- `asa-vs-abs-outdoor-printing`
- `silk-pla-comparison`
- `pla-plus-vs-pla-pro`
- `best-filaments-for-hueforge-lithophanes`
- `best-filament-for-ender-3`
- `best-filament-for-bambu-lab-a1`

**Part C:** Add two new categories to `CATEGORIES`:
```typescript
{ id: 'hueforge', label: 'HueForge', icon: Layers },
{ id: 'printer-specific', label: 'Printer Guides', icon: Printer },
```

And update `getCategoryConfig` to handle these two new values.

**Part D:** Tag all new guide metadata entries with the appropriate category (HueForge guides get `category: 'hueforge'`, printer guides get `category: 'printer-specific'`).

**Part E:** Update the `GuideConfig['category']` type in both `guideConfigs.ts` and `LearningCenter.tsx` to include `'hueforge' | 'printer-specific'`.

---

### Summary of Changes

| File | Change |
|---|---|
| `src/components/guides/guideConfigs.ts` | Add 16 new `GuideConfig` entries, update `category` union type |
| `src/pages/LearningCenter.tsx` | Add 22 entries to `GUIDES` array, 2 new categories, update `getCategoryConfig` |

### No New Routes Needed

All new guides automatically work under `/guides/:slug` via the existing `BuyingGuide.tsx` page, which calls `getBuyingGuideConfig(slug)` and renders `BuyingGuideTemplate`. No routing changes are needed.

### Content Quality

Each new config will include:
- Keyword-targeted `seoTitle` (≤60 chars) and `seoDescription` (140–160 chars)
- 2 `editorialSections` (one `before`, one `after`) with practical technical content (~300–400 words combined)
- 3 FAQs targeting question-intent search queries (`what is the best X for Y?`)
- Relevant `relatedSlugs` pointing to existing configs for internal link equity
- `publishedAt` and `updatedAt` dates for `Article` schema freshness signals

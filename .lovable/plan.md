
## New SEO Landing Pages — Implementation Plan

### What Exists vs. What's Needed

The codebase has two distinct page patterns for content pages:
1. **`BuyingGuide` template** (`/guides/:slug`): Data-driven, pulls live filaments from the database via `useGuideFilaments`. Configured via `BUYING_GUIDE_CONFIGS` in `guideConfigs.ts`. This is the system to extend.
2. **Standalone pages** (`/pla-vs-petg`, `/best-filaments-for-hueforge`, etc.): Custom React pages with bespoke UI, registered directly in `App.tsx`.

**Request #2 (`/pla-vs-petg`)**: This page already exists as both a standalone page (`src/pages/PLAVsPETG.tsx`) and in the guide system (`guideConfigs.ts` has `pla-vs-petg` config, `App.tsx` has route `/guides/:slug` that would render a BuyingGuide version). The standalone page at `/pla-vs-petg` already has its own full comparison table, FAQs, and schema — it is complete and requires no changes. No `/pla-vs-petg` redirect is needed; the route already works.

### Summary of New Items Required

| # | URL | Approach | Status |
|---|-----|----------|--------|
| 1 | `/best-filaments-for-beginners` | New standalone page (like `PLAVsPETG.tsx`) | New |
| 2 | `/pla-vs-petg` | Already exists | No change |
| 3 | `/best-filament-for-ender-3` | New BuyingGuide config entry → `/guides/best-filament-for-ender-3` + redirect | New |
| 4 | `/best-filament-for-bambu-lab-a1` | New BuyingGuide config entry → `/guides/best-filament-for-bambu-lab-a1` + redirect | New |
| 5 | `/filament-temperature-guide` | New standalone page (rich temperature chart for all materials) | New |
| 6 | `/filament-storage-guide` | New standalone page (storage tips, drying, humidity) | New |

**Rationale for approach split**: Pages #3 and #4 are "best filaments for X printer" guides that naturally fit the BuyingGuide template (live product database, ranked list, editorial sections, FAQs). Pages #1, #5, and #6 need unique non-database content (temperature charts, storage tips) so they follow the standalone page pattern used by `PLAVsPETG.tsx` and `BestFilamentsForHueForge.tsx`.

---

### Detailed Changes

#### 1. New Standalone Page: `/best-filaments-for-beginners`

**File**: `src/pages/BestFilamentsForBeginners.tsx`

- H1: "Best 3D Printer Filaments for Beginners in 2026"
- Meta title: "Best Filaments for Beginners 2026 — Easiest to Print | FilaScope"
- Meta description: "The best 3D printer filaments for beginners in 2026. Start with easy-to-print PLA picks from 48+ brands, with tips, temperature guides, and storage advice."
- Structured data: `ArticleSchema` + `FAQSchema` + `BreadcrumbSchema`
- Content: Intro, "Why PLA for Beginners" section, live query for top 6 PLA filaments by `filascope_score` (same pattern as `PLAVsPETG.tsx`), beginner tips section, FAQ
- Internal links: `/materials/pla`, `/guides/beginners-guide`, `/wizard`, `/filament-temperature-guide`, `/filament-storage-guide`, `/guides/pla-vs-petg`
- Keywords targeted: best filament for beginners, easiest filament to print

#### 2. New BuyingGuide Config Entry: `best-filament-for-ender-3`

**File**: `src/components/guides/guideConfigs.ts`

- Add to `BUYING_GUIDE_CONFIGS`:
  - `slug: 'best-filament-for-ender-3'`
  - Title: "Best Filaments for Creality Ender 3 in 2026"
  - SEO title: "Best Filament for Ender 3 — Compatible Picks 2026 | FilaScope"
  - SEO description: "Top filaments tested and ranked for Creality Ender 3. PLA, PETG, and TPU recommendations with print settings, AMS compatibility notes, and pricing."
  - Category: `'buying-guide'`
  - Filters: `{ materials: ['PLA', 'PETG', 'TPU'], sortBy: 'score', limit: 10 }`
  - Layout: `'ranked-list'`
  - Editorial sections: "Ender 3 Specs Quick Reference" (nozzle 260°C, bed 110°C, direct upgrade path), "Getting the Best Results" (common PLA settings, upgrade tips)
  - FAQs: 3 FAQs about Ender 3 filament compatibility, TPU printing, PETG upgrade
  - Related slugs: `['best-pla-filaments', 'best-petg-filaments', 'beginners-guide', 'best-filament-for-bambu-lab-a1']`

The page will live at `/guides/best-filament-for-ender-3` via the existing `BuyingGuide` template. A short redirect page at `src/pages/BestFilamentEnder3.tsx` maps `/best-filament-for-ender-3` → `/guides/best-filament-for-ender-3` using `<Navigate replace />`.

#### 3. New BuyingGuide Config Entry: `best-filament-for-bambu-lab-a1`

**File**: `src/components/guides/guideConfigs.ts`

- Add to `BUYING_GUIDE_CONFIGS`:
  - `slug: 'best-filament-for-bambu-lab-a1'`
  - Title: "Best Filaments for Bambu Lab A1 Mini & A1"
  - SEO title: "Best Filament for Bambu Lab A1 & A1 Mini — 2026 Guide | FilaScope"
  - SEO description: "Top filaments for Bambu Lab A1 and A1 Mini with AMS Lite compatibility notes. PLA, PETG picks with print settings, brand rankings and pricing."
  - Category: `'buying-guide'`
  - Filters: `{ materials: ['PLA', 'PETG', 'TPU'], sortBy: 'score', limit: 10 }`
  - Layout: `'ranked-list'`
  - Editorial sections: "Bambu Lab A1 & A1 Mini — Quick Specs" (max 300°C nozzle, 100°C bed, AMS Lite), "AMS Lite vs Full AMS" (differences, TPU warning)
  - FAQs: 3 FAQs about A1 vs A1 Mini filament differences, AMS Lite compatibility, third-party brands
  - Related slugs: `['best-pla-filaments', 'best-petg-filaments', 'best-filament-for-bambu-lab-p1s', 'best-filament-for-ender-3']`

Redirect page: `src/pages/BestFilamentBambuA1.tsx` maps `/best-filament-for-bambu-lab-a1` → `/guides/best-filament-for-bambu-lab-a1`.

#### 4. New Standalone Page: `/filament-temperature-guide`

**File**: `src/pages/FilamentTemperatureGuide.tsx`

- H1: "3D Printer Filament Temperature Guide — Every Material"
- Meta title: "Filament Temperature Guide 2026 — PLA, PETG, ABS & More | FilaScope"
- Meta description: "Complete 3D printer filament temperature chart. Nozzle and bed temperatures for PLA, PETG, ABS, ASA, TPU, Nylon, PC and more. Includes print speed and enclosure requirements."
- Structured data: `ArticleSchema` + `FAQSchema` + `BreadcrumbSchema` + `HowToSchema`
- Content: 
  - Intro paragraph
  - Full temperature reference table (static) with columns: Material | Nozzle Temp | Bed Temp | Fan | Enclosure | Difficulty — covering PLA, PLA+, PETG, ABS, ASA, TPU, Nylon, PC, Silk PLA
  - "What happens if temperature is wrong?" callout section
  - Tips for dialing in temperatures (temperature tower, incremental tuning)
  - FAQ section
- Internal links: `/materials/pla`, `/materials/petg`, `/materials/abs`, `/materials/asa`, `/materials/tpu`, `/diagnose`, `/filament-storage-guide`
- Keywords targeted: filament temperature, 3D printer temperature settings, PLA temperature

#### 5. New Standalone Page: `/filament-storage-guide`

**File**: `src/pages/FilamentStorageGuide.tsx`

- H1: "How to Store 3D Printer Filament — Complete Guide"
- Meta title: "Filament Storage Guide — How to Store & Dry Filament | FilaScope"
- Meta description: "Complete guide to storing 3D printer filament. Proper humidity control, drying instructions for PLA, PETG, Nylon & more. Prevent moisture damage and extend filament life."
- Structured data: `ArticleSchema` + `FAQSchema` + `BreadcrumbSchema` + `HowToSchema`
- Content:
  - Intro: why moisture is the enemy
  - Signs of wet filament (popping, stringing, bubbles) — visual card grid
  - Storage recommendations by material (which need airtight containers, desiccant)
  - Drying temperatures table (static) — PLA: 45-50°C for 4-6h, PETG: 65°C for 4-6h, etc.
  - Step-by-step drying instructions (HowTo schema)
  - Product recommendations sidebar linking to `/accessories` (filament dryers)
  - FAQ section
- Internal links: `/accessories`, `/diagnose`, `/materials/nylon`, `/best-filaments-for-beginners`, `/filament-temperature-guide`
- Keywords targeted: filament storage, how to dry filament, filament dryer

---

### LearningCenter Registration

Both BuyingGuide configs (`best-filament-for-ender-3`, `best-filament-for-bambu-lab-a1`) and standalone pages need to appear in the Learning Center guide list.

**File**: `src/pages/LearningCenter.tsx` — add 4 new entries to the `GUIDES` array:

```
{ slug: 'best-filaments-for-beginners', title: 'Best Filaments for Beginners 2026', category: 'beginner', readTime: 8, isBuyingGuide: false (custom URL: /best-filaments-for-beginners) }
{ slug: 'best-filament-for-ender-3', title: 'Best Filaments for Creality Ender 3', category: 'buying-guide', readTime: 10, isBuyingGuide: true }
{ slug: 'best-filament-for-bambu-lab-a1', title: 'Best Filaments for Bambu Lab A1 & A1 Mini', category: 'buying-guide', readTime: 10, isBuyingGuide: true }
{ slug: 'filament-temperature-guide', title: 'Complete Filament Temperature Guide', category: 'materials', readTime: 8, isBuyingGuide: false (custom URL: /filament-temperature-guide) }
{ slug: 'filament-storage-guide', title: 'How to Store 3D Printer Filament', category: 'beginner', readTime: 6, isBuyingGuide: false (custom URL: /filament-storage-guide) }
```

Note: The `LearningCenter` already has a `link` pattern for `isBuyingGuide: true` → `/guides/slug` and non-buying-guide → `/learn/slug`. The 3 standalone pages need a `customUrl` property added to the `GuideMetadata` type, or they link to their direct URL rather than `/learn/:slug`.

---

### App.tsx Routes (6 new)

```tsx
// New landing pages
const BestFilamentsForBeginners = lazy(() => import("./pages/BestFilamentsForBeginners"));
const FilamentTemperatureGuide = lazy(() => import("./pages/FilamentTemperatureGuide"));
const FilamentStorageGuide = lazy(() => import("./pages/FilamentStorageGuide"));

// Redirect shims
<Route path="/best-filaments-for-beginners" element={<BestFilamentsForBeginners />} />
<Route path="/best-filament-for-ender-3" element={<Navigate to="/guides/best-filament-for-ender-3" replace />} />
<Route path="/best-filament-for-bambu-lab-a1" element={<Navigate to="/guides/best-filament-for-bambu-lab-a1" replace />} />
<Route path="/filament-temperature-guide" element={<FilamentTemperatureGuide />} />
<Route path="/filament-storage-guide" element={<FilamentStorageGuide />} />
```

---

### Sitemap Updates

Two files need updating:

**`supabase/functions/prerender/index.ts`** — in `STATIC_PAGES` array and `GUIDE_SLUGS`:
- Add to `STATIC_PAGES` (Tier 4 — 0.7): `/best-filaments-for-beginners`, `/filament-temperature-guide`, `/filament-storage-guide`
- Add to `GUIDE_SLUGS`: `"best-filament-for-ender-3"`, `"best-filament-for-bambu-lab-a1"`
- Add prerender `PageData` handlers for the 3 new standalone pages (following the same pattern as `bestFilamentsForHueforgePage()`, `plaVsPetgPage()` etc.)
- Add to `GUIDE_META` for the 2 new guide slugs

**`supabase/functions/sitemap-xml/index.ts`** (the secondary sitemap function) — also update its `STATIC_PAGES` and `GUIDE_SLUGS` arrays to match.

**Redeploy** `prerender` and `sitemap-xml` edge functions after changes.

---

### Internal Linking Updates

**`src/components/SiteFooter.tsx`** — add 3 new entries to `guideLinks`:
```tsx
{ name: "Best Filaments for Beginners", href: "/best-filaments-for-beginners" },
{ name: "Filament Temperature Guide", href: "/filament-temperature-guide" },
{ name: "Filament Storage Guide", href: "/filament-storage-guide" },
```

**`src/components/guides/content/GuideBestFilamentBeginners.tsx`** — this existing file is a legacy guide served under `/learn/best-filament-for-beginners-2025`. No change needed; the new page is at a separate URL.

---

### Prerender Handlers

For the 3 new standalone pages, add these functions in `prerender/index.ts` (same pattern as existing):

```typescript
function bestFilamentsForBeginnersPage(): PageData { ... }
function filamentTemperatureGuidePage(): PageData { ... }
function filamentStorageGuidePage(): PageData { ... }
```

And wire them into `getPageData()` (the main routing switch) alongside existing entries.

---

### File Change Summary

| File | Action |
|------|--------|
| `src/pages/BestFilamentsForBeginners.tsx` | Create new standalone page |
| `src/pages/FilamentTemperatureGuide.tsx` | Create new standalone page |
| `src/pages/FilamentStorageGuide.tsx` | Create new standalone page |
| `src/components/guides/guideConfigs.ts` | Add 2 new BuyingGuide configs (Ender 3, Bambu A1) |
| `src/pages/LearningCenter.tsx` | Add 5 new GUIDES entries + `customUrl` field to `GuideMetadata` type |
| `src/App.tsx` | Add 5 new routes + lazy imports |
| `src/components/SiteFooter.tsx` | Add 3 links to `guideLinks` |
| `supabase/functions/prerender/index.ts` | Add static pages, guide slugs, prerender handlers + deploy |
| `supabase/functions/sitemap-xml/index.ts` | Add static pages + guide slugs |

No database changes required.

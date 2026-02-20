
## Create 3 New HueForge TD Guide Pages — Topical Authority Cluster

### Overview

Three new dedicated guide pages will be created as standalone React components, each registered as its own explicit route in `App.tsx` (matching the pattern used for `FilamentTemperatureGuide`, `FilamentStorageGuide`, and `BestWhiteFilaments`). Two existing pages will get new "Related Guides" links added to them. The `GUIDE_DATES` map in the prerender edge function will be updated to include all three new URLs in `sitemap-guides.xml`.

---

### Routing Strategy

Looking at `App.tsx`, there are two patterns for guide-style pages:
- **Top-level routes**: `/best-filaments-for-hueforge`, `/filament-temperature-guide` — own dedicated components at a clean URL
- **`/guides/:slug` catchall**: handled by `BuyingGuide.tsx` (for dynamically-loaded CMS-style guides)
- **Explicit `/guides/` routes**: `/guides/print-settings` and `/guides/troubleshooting` — registered before the catchall

The three new pages will follow the **explicit `/guides/`** pattern (registered before the `<Route path="/guides/:slug">` catchall). This matches the requested paths and keeps the URL structure clean.

---

### Files to Create (3 new pages)

#### File 1: `src/pages/guides/HueForgeWhatIsTD.tsx`
Route: `/guides/what-is-hueforge-td`

**Structure:**
- `DocumentHead` with dynamic title/description
- `ArticleSchema` (TechArticle) + `BreadcrumbSchema` + `HowToSchema` + `FAQSection` (FAQPage auto-injected)
- `Breadcrumbs` component: Home › Learn › What Is HueForge TD?
- **Hero section**: Badge "HueForge Guide · Updated Feb 2026", H1, intro paragraph
- **AI snippet zone**: Subtle card with the target paragraph for LLM indexing + `sr-only` copy
- **H2: "What Does TD Mean in HueForge?"** — prose explanation of the metric
- **H2: "How TD Values Affect Your Prints"** — table with 4 TD ranges and effects:

| TD Range | Opacity | Best Use |
|---|---|---|
| 0.5 – 2.0 | Very Opaque | Dark/anchor base layers |
| 2.0 – 4.0 | Opaque | Standard base layers, multicolor |
| 4.0 – 6.0 | Semi-translucent | Lithophanes, detail work |
| 6.0+ | Translucent | Backlit effects, silk highlights |

- **H2: "How to Find Your Filament's TD Value"** — 3 methods with internal link to `/hueforge-td-database`
- **H2: "TD Value Quick Reference Table"** — static reference table with 8 common filament types and typical TD ranges
- **H2: "Best TD Values for Different Projects"** — 3 project type cards (Lithophanes, HueForge multicolor, functional parts)
- **FAQSection** (5 Q&As):
  1. What does TD stand for in HueForge?
  2. What is a good TD value for lithophanes?
  3. Is a lower TD value better?
  4. Can I measure TD without HueForge software?
  5. Why does TD vary by color?
- **RelatedContentBlock** with links to `/hueforge-td-database`, `/best-filaments-for-hueforge`, `/colors`, `/guides/best-white-filaments-for-hueforge`, `/guides/how-to-measure-filament-td`

**Schemas emitted:**
- `TechArticle` (ArticleSchema with `articleType="TechArticle"`, `about={{ '@type': 'Thing', name: 'HueForge Transmissivity Distance' }}`, `proficiencyLevel="Beginner"`)
- `BreadcrumbSchema`
- `HowToSchema` (steps: 1. Identify project type → 2. Pick TD range → 3. Search TD database → 4. Verify)
- `FAQPage` (auto-injected by FAQSection via FAQSchema)

---

#### File 2: `src/pages/guides/BestWhiteFilamentsForHueForge.tsx`
Route: `/guides/best-white-filaments-for-hueforge`

**Structure:**
- `DocumentHead`, `ArticleSchema` (TechArticle), `BreadcrumbSchema`, `FAQSection`
- `Breadcrumbs`: Home › Learn › Best White Filaments for HueForge
- **Hero section**: Badge, H1 "Best White Filaments for HueForge Lithophanes — TD-Ranked", intro paragraph
- **AI snippet zone**: Target paragraph + `sr-only` copy
- **H2: "Why White Filament Matters for Lithophanes"** — explanation of white/natural as base layer, light physics
- **H2: "Top 10 White Filaments for HueForge — Ranked by TD"** — live query from Supabase (same query pattern as `BestWhiteFilaments.tsx`) returning white/natural filaments sorted by `transmission_distance`, rendered as a table with columns: Rank, Brand, Product, Material, TD Value, Price, Link
- **H2: "How to Choose Between White PLA, White PETG, and White Silk"** — 3 comparison cards (matching `FilamentTemperatureGuide.tsx` card style):
  - White PLA: TD 1.5–3.5, most popular, consistent
  - White PETG: TD 2.5–5.0, more translucent, better for backlit
  - White Silk PLA: TD 4.0–7.0, highly translucent, special effects
- **FAQSection** (4 Q&As):
  1. What white filament is best for HueForge lithophanes?
  2. Should I use white or natural PLA for lithophanes?
  3. What TD value should white filament have?
  4. Does the brand of white PLA affect TD?
- **RelatedContentBlock** linking to `/hueforge-td-database`, `/best-filaments-for-hueforge`, `/colors`, `/materials/pla`, `/guides/what-is-hueforge-td`, `/guides/how-to-measure-filament-td`

**Supabase query** (reuses the existing `BestWhiteFilaments.tsx` query pattern):
```typescript
supabase.from('filaments')
  .select('id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, transmission_distance')
  .in('color_family', ['White', 'Natural'])
  .not('transmission_distance', 'is', null)
  .order('transmission_distance', { ascending: true })
  .limit(10)
```

Note: this page uses `transmission_distance` (not `td_value`) to match what the main filament table uses (verified in `HueForgeTDDatabase.tsx`).

---

#### File 3: `src/pages/guides/HowToMeasureFilamentTD.tsx`
Route: `/guides/how-to-measure-filament-td`

**Structure:**
- `DocumentHead`, `ArticleSchema` (TechArticle), `BreadcrumbSchema`, `HowToSchema`, `FAQSection`
- `Breadcrumbs`: Home › Learn › How to Measure Filament TD
- **Hero section**: Badge, H1, intro paragraph
- **AI snippet zone**: Target paragraph + `sr-only`
- **H2: "What You'll Need"** — tools list (printer, calibration file, bright light, ruler)
- **H2: "Method 1: The Calibration Cube Test"** — 5 numbered steps using `HOW_TO_STEPS` pattern from `FilamentTemperatureGuide.tsx`; steps include: print test wall, hold to light, find transition thickness, divide by layer height, record result
- **H2: "Method 2: Using a Light Meter"** — 4 steps for precision measurement
- **H2: "How to Submit TD Values to FilaScope"** — CTA card linking to `/hueforge-td-database`
- **H2: "Common TD Values by Material Type"** — table:

| Material | Typical TD Range | Notes |
|---|---|---|
| White PLA | 1.5 – 4.0 | Most common lithophane base |
| Natural PLA | 4.0 – 8.0 | Unpigmented, highly translucent |
| Black PLA | 0.3 – 1.0 | Strong anchor layer |
| Silk PLA | 5.0 – 9.0 | Metallic sheen, very translucent |
| White PETG | 2.0 – 5.0 | Good alternative base layer |
| ABS | 2.0 – 4.0 | Less common for HueForge |

- **FAQSection** (4 Q&As):
  1. How accurate is the calibration cube method?
  2. Can I use a smartphone flashlight to test TD?
  3. What layer height should I use when measuring TD?
  4. Do I need to measure TD for every color?
- **RelatedContentBlock** linking to `/hueforge-td-database`, `/best-filaments-for-hueforge`, `/guides/what-is-hueforge-td`, `/guides/best-white-filaments-for-hueforge`

**HowToSchema steps:**
1. Print a calibration wall — multiple segments at 1mm, 2mm, 3mm, 4mm, 6mm, 8mm thickness
2. Hold to bright light — identify the thickness where light is fully blocked
3. Divide by layer height — if blocked at 3mm with 0.2mm layers, TD = 15 (HueForge layers)
4. Validate against existing data — compare with FilaScope's database
5. Submit your measurement — add to FilaScope's community TD database

---

### Files to Edit (2 existing pages)

#### Edit 1: `src/pages/HueForgeTDDatabase.tsx`
Add to the existing `RelatedContentBlock` at the bottom (lines 628–637), expanding the `links` array with:
```typescript
{ label: 'What Is HueForge TD?', href: '/guides/what-is-hueforge-td', description: 'Complete beginner guide to Transmissivity Distance' },
{ label: 'How to Measure Filament TD', href: '/guides/how-to-measure-filament-td', description: 'Step-by-step calibration and measurement guide' },
{ label: 'Best White Filaments for HueForge', href: '/guides/best-white-filaments-for-hueforge', description: 'TD-ranked white filament picks for lithophanes' },
```

#### Edit 2: `src/pages/BestFilamentsForHueForge.tsx`
Add to the existing `RelatedContentBlock` at the bottom (lines 278–287), expanding the `links` array with:
```typescript
{ label: 'What Is HueForge TD?', href: '/guides/what-is-hueforge-td', description: 'Complete beginner guide to TD values' },
{ label: 'How to Measure Filament TD', href: '/guides/how-to-measure-filament-td', description: 'Measure your own filament TD values' },
{ label: 'Best White Filaments for HueForge', href: '/guides/best-white-filaments-for-hueforge', description: 'Top white filaments ranked by TD' },
```

---

### Files to Edit (routing and sitemap)

#### Edit 3: `src/App.tsx`
Add 3 lazy imports and 3 route entries **before** the existing `/guides/print-settings` route (to keep explicit routes ahead of the `:slug` catchall):

```tsx
const HueForgeWhatIsTD = lazy(() => import("./pages/guides/HueForgeWhatIsTD"));
const BestWhiteFilamentsForHueForge = lazy(() => import("./pages/guides/BestWhiteFilamentsForHueForge"));
const HowToMeasureFilamentTD = lazy(() => import("./pages/guides/HowToMeasureFilamentTD"));

// Routes — before <Route path="/guides/:slug">
<Route path="/guides/what-is-hueforge-td" element={<HueForgeWhatIsTD />} />
<Route path="/guides/best-white-filaments-for-hueforge" element={<BestWhiteFilamentsForHueForge />} />
<Route path="/guides/how-to-measure-filament-td" element={<HowToMeasureFilamentTD />} />
```

#### Edit 4: `supabase/functions/prerender/index.ts`
Add 3 entries to `GUIDE_DATES` (all using `/guides/` prefix, so `isTopLevel` is omitted):

```typescript
"what-is-hueforge-td":                   { date: "2026-02-20" },
"best-white-filaments-for-hueforge":     { date: "2026-02-20" },
"how-to-measure-filament-td":            { date: "2026-02-20" },
```

These will be emitted as `https://filascope.com/guides/what-is-hueforge-td` etc. in `sitemap-guides.xml` with `priority=0.7` and `changefreq=monthly`.

---

### Component Patterns Used (matching existing codebase)

| Pattern | Source |
|---|---|
| `DocumentHead` + `ArticleSchema` + `BreadcrumbSchema` | `FilamentTemperatureGuide.tsx` |
| `Breadcrumbs` visible trail | `FilamentTemperatureGuide.tsx` |
| Hero with `Badge` + H1 + intro paragraph | `FilamentTemperatureGuide.tsx`, `FilamentStorageGuide.tsx` |
| AI snippet zone (muted card) | to be consistent with `AISummaryBlock` pattern |
| Data table in `Card` with `overflow-x-auto` | `FilamentTemperatureGuide.tsx` |
| Numbered step list | `FilamentTemperatureGuide.tsx` HOW_TO_STEPS |
| `FAQSection` (auto-injects FAQPage schema) | all guide pages |
| `RelatedContentBlock` | `BestFilamentsForHueForge.tsx`, `BestWhiteFilaments.tsx` |
| `useQuery` + Supabase for live data | `BestWhiteFilaments.tsx` |
| `FilamentRankCard` pattern | reused from `BestWhiteFilaments.tsx` |

---

### What Is NOT Changed

- `BestWhiteFilaments.tsx` page (`/best-white-filaments`) — existing page is untouched; the new page at `/guides/best-white-filaments-for-hueforge` is a separate, HueForge-focused companion
- `HueForgeTDDatabase.tsx` content — only the `RelatedContentBlock` links array is extended
- `BestFilamentsForHueForge.tsx` content — only the `RelatedContentBlock` links array is extended
- All other existing pages, routes, schemas, or components
- The `BuyingGuide.tsx` catchall at `/guides/:slug` — the new explicit routes precede it, so they are matched first

---

### Summary of Files

| File | Action |
|---|---|
| `src/pages/guides/HueForgeWhatIsTD.tsx` | CREATE |
| `src/pages/guides/BestWhiteFilamentsForHueForge.tsx` | CREATE |
| `src/pages/guides/HowToMeasureFilamentTD.tsx` | CREATE |
| `src/App.tsx` | EDIT — add 3 lazy imports + 3 routes |
| `src/pages/HueForgeTDDatabase.tsx` | EDIT — extend RelatedContentBlock links |
| `src/pages/BestFilamentsForHueForge.tsx` | EDIT — extend RelatedContentBlock links |
| `supabase/functions/prerender/index.ts` | EDIT — add 3 entries to GUIDE_DATES |

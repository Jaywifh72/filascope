
## SEO Internal Linking Enhancement Plan

### What Already Exists (Do Not Re-implement)

After auditing the codebase thoroughly, here is a precise accounting of what is already built:

**Material Hub Pages (`/materials/:slug`)** — MOSTLY DONE
- 300–500 word knowledge base content per material (print settings, strengths, weaknesses, practical guide) ✅
- Links to all filaments of that material (Top 5 + full 24-product grid) ✅
- Links to related guides (`config.guides`) ✅
- Top brands section linking to `/brands/:slug` ✅
- FAQ section with `FAQPage` schema ✅
- Compare Related Materials section ✅
- Shop by Color section ✅
- Missing: a **brand comparison table** (currently just chip links, not a structured table with columns)
- Missing: a **Related Searches** section at the bottom

**Brand Hub Pages (`/brands/:slug`)** — MOSTLY DONE
- Brand description + history via `BrandAboutTab` + `BrandInfo` ✅
- All products via `BrandProductsTab` ✅
- Brand FAQ section ✅
- Related brands section ✅
- Missing: explicit **brand-specific guides** section (no `RelatedGuidesLinks` equivalent for brands)
- Missing: **price comparison across regions** panel

**Product Detail Pages (`/filament/:slug`)** — MOSTLY DONE
- Similar filaments section ✅
- Guides mentioning this product via `RelatedGuidesLinks` ✅
- Brand quick links via `BrandQuickLinks` ✅
- Compare with alternatives in the performance tab (`ComparisonQuickPicks`) ✅
- Breadcrumb: Home > Filaments > Material > Brand > Product ✅
- Missing: a **"Compatible Printers" links section** below the content (the compatibility tab shows specs but no crawlable links to individual printer pages)

**Footer** — ALREADY COMPREHENSIVE
- Browse by Material (9 links) ✅
- Popular Brands (8 links) ✅
- Guides & Resources (7 links) ✅
- Tools (7 links) ✅
- About (7 links) ✅

**Category Pages (`/filaments/:slug`)** — PARTIALLY DONE
- Material intro paragraph ✅
- Related materials cross-links at the bottom ✅
- Missing: **Related Searches** section

---

### What Needs to Be Built

The genuinely new features, prioritized by SEO impact:

#### 1. `MaterialBrandComparisonTable` — New component for Material Hub
A scannable comparison table on each material hub page showing the top 5–6 brands for that material side-by-side with columns: Brand | Price Range | # Colors | Best For | Link. This is a high-value rich content block that helps with "best X filament" queries.

#### 2. `RelatedSearchesSection` — New component for Category Pages + Material Hub
A "Popular Searches" chip block at the bottom of `/filaments/:slug` and `/materials/:slug` showing 6–8 keyword-rich search intents (e.g., "best PLA for Ender 3", "cheapest PLA filament", "PLA for HueForge"). Uses `<a href>` tags, not React Router `<Link>`, for maximum crawler visibility. Data is statically defined per material slug.

#### 3. `CompatiblePrintersLinks` — New component for Filament Detail
A lightweight crawlable section below the existing `RelatedGuidesLinks` on filament detail pages. Queries the top 5 printers compatible with this filament's temperature range, renders them as `<a href="/printers/:id">` chips. Adds genuine internal links from the most-visited pages (product detail) to the printer section.

#### 4. `BrandGuidesLinks` — New component for Brand Detail
Equivalent to the existing `RelatedGuidesLinks` for filament detail, but targeted at brand pages. Shows guides relevant to the brand (e.g., "Best Bambu Lab Filaments 2026", "Polymaker PolyLite Review"). Statically mapped by brand name, placed in the Brand Overview tab below the product grid.

---

### Technical Implementation Plan

#### File 1: `src/components/filament/CompatiblePrintersLinks.tsx` — NEW

```tsx
// Queries printers.max_nozzle_temp_c >= filament's nozzle max
// Renders top 5 as <a href> chips
// Shows only if at least 2 printers found
```

Props: `nozzleTempMaxC: number | null | undefined`, `material: string | null | undefined`

DB query: `supabase.from('printers').select('id, model_name, brand').gte('max_nozzle_temp_c', nozzleTempMaxC).limit(5)`

#### File 2: `src/pages/FilamentDetail.tsx` — EDIT
Add `<CompatiblePrintersLinks>` between `<RelatedGuidesLinks>` and `<RelatedFilaments>` (lines ~1133–1140).

#### File 3: `src/components/seo/RelatedSearchesSection.tsx` — NEW

```tsx
// Static per-material search intents map
// Renders as <a href="/filaments?search=..."> chips
// Used on both FilamentCategoryPage and MaterialHub
```

Static data example:
```typescript
const MATERIAL_SEARCH_INTENTS: Record<string, string[]> = {
  pla: [
    "best PLA filament for beginners",
    "cheapest PLA filament",
    "PLA filament for HueForge",
    "best PLA for Ender 3",
    "matte PLA filament",
    "silk PLA filament",
  ],
  petg: [
    "best PETG for functional parts",
    "PETG vs PLA strength",
    "clear PETG filament",
    "cheapest PETG filament",
    "PETG for outdoor use",
  ],
  // ... other materials
}
```

#### File 4: `src/pages/FilamentCategoryPage.tsx` — EDIT
Add `<RelatedSearchesSection materialSlug={slug} />` after the "Compare Related Materials" nav block at the bottom (after line 383).

#### File 5: `src/pages/MaterialHub.tsx` — EDIT (two additions)
- Add `<MaterialBrandComparisonTable>` after the "Top Brands" chip section (after line 1002)
- Add `<RelatedSearchesSection materialSlug={slug} />` before the FAQ section (before line 1026)

#### File 6: `src/components/filament/MaterialBrandComparisonTable.tsx` — NEW
Receives `topBrands: { vendor: string; count: number }[]` (already fetched in MaterialHub) and fetches a price range per vendor. Renders as a `<table>` with proper `<thead>` / `<tbody>` semantics.

Columns: **Brand** | **Products** | **Avg Price** | **Best For** | **View**

```tsx
// Static "bestFor" map per brand name
const BRAND_BEST_FOR: Record<string, string> = {
  "Bambu Lab": "High speed, AMS compatibility",
  "Polymaker": "Wide color range, engineering grades",
  "Prusament": "Tight tolerances, verified quality",
  "eSUN": "Budget-friendly, wide material range",
  // ...
}
```

#### File 7: `src/components/brands/BrandGuidesLinks.tsx` — NEW
Static map of brand → guide links. Renders as chip links with `<a href>` tags.

```typescript
const BRAND_GUIDES: Record<string, { href: string; label: string }[]> = {
  "Bambu Lab": [
    { href: "/guides/best-filament-for-bambu-lab-p1s", label: "Best Filament for Bambu Lab P1S" },
    { href: "/guides/best-filament-for-bambu-lab-a1", label: "Best Filament for Bambu Lab A1" },
  ],
  "Polymaker": [
    { href: "/guides/best-petg-filaments", label: "Best PETG Filaments" },
  ],
  // ...
}
```

#### File 8: `src/components/brands/tabs/BrandOverviewTab.tsx` — EDIT
Add `<BrandGuidesLinks brandName={brandName} />` at the bottom of the Overview tab content, below the existing product grid section.

---

### Component Hierarchy

```text
FilamentCategoryPage (/filaments/pla)
  └── [bottom] RelatedSearchesSection (NEW)

MaterialHub (/materials/pla)
  └── [after topBrands] MaterialBrandComparisonTable (NEW)
  └── [before FAQ]       RelatedSearchesSection (NEW)

FilamentDetail (/filament/:slug)
  └── [after RelatedGuidesLinks] CompatiblePrintersLinks (NEW)

BrandDetail (/brands/bambu-lab)
  └── BrandOverviewTab
        └── [bottom] BrandGuidesLinks (NEW)
```

### Files to Create (4 new files)
1. `src/components/filament/CompatiblePrintersLinks.tsx`
2. `src/components/seo/RelatedSearchesSection.tsx`
3. `src/components/filament/MaterialBrandComparisonTable.tsx`
4. `src/components/brands/BrandGuidesLinks.tsx`

### Files to Edit (4 existing files)
1. `src/pages/FilamentDetail.tsx` — add `<CompatiblePrintersLinks>`
2. `src/pages/FilamentCategoryPage.tsx` — add `<RelatedSearchesSection>`
3. `src/pages/MaterialHub.tsx` — add `<MaterialBrandComparisonTable>` + `<RelatedSearchesSection>`
4. `src/components/brands/tabs/BrandOverviewTab.tsx` — add `<BrandGuidesLinks>`

### No Database Changes Required
All data is either already fetched (top brands, printer count) or static (search intents, brand guides map). No new queries need to be added beyond a lightweight printers query for `CompatiblePrintersLinks`.

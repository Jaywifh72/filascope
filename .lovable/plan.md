
## Programmatic SEO: Material Hub Pages, Brand+Material Combos, Color Pages

### Codebase Analysis Summary

**Routing pattern**: All routes lazy-loaded in `src/App.tsx`; catch-all `<Route path="*">` must stay last. New routes go above line 322.

**Prerender pattern**: `getPageData()` in `supabase/functions/prerender/index.ts` dispatches to named functions. DB-backed async functions receive a `SupabaseClient`. Static functions are synchronous. Current dispatch block ends at line 253.

**Sitemap**: `STATIC_PAGES` array (line 842), `sitemapIndex()` (line 944) lists sub-files. A new `sitemap-materials.xml` must be added to that index and a new `sitemapMaterials()` function must be written.

**Material data from DB**:
- PLA: 3,141 products, 38 brands
- PETG: 834, 36 brands
- PLA+: 743, 15 brands (grouped under PLA family for the hub)
- ABS: 501, 25 brands
- ASA: 315, 26 brands
- TPU/TPU-95A: ~293 combined
- PCTG: 150, PC: 48, PA: 46

**Color families in DB**: Black (595), Blue (471), White (432), Green (428), Gray/Grey (426 combined), Red (337), Yellow (263), Orange (262), Brown (216), Purple (197), Natural (143), Pink (120), Clear (92)

**Brand+material combos with 3+ products** (top candidates):
- bambu-lab/pla (132), polymaker/pla (394), esun/pla (244), polymaker/petg, esun/petg, hatchbox/pla, overture/pla, prusament/pla, etc.

**`materialHierarchy.ts`** uses `id` values like `'pla-family'`, `'petg-family'`, `'abs-family'`, etc. for categories — these are already slug-ready.

**`color_family` column** is well-populated (White: 432, Black: 595, etc.) — reliable for filtering.

**Existing route conflicts to avoid**: `/materials/compare` (line 216) already exists — our new `/materials/:slug` must NOT conflict. The catch-all pattern in React Router means `/materials/compare` must be registered **before** `/materials/:slug` (it already is for the existing route).

**No existing `/brands/:brand/:material` route** — safe to add.

**No existing `/colors/:family` route** — safe to add.

---

### Files to Create (7 new pages)

| File | Route |
|---|---|
| `src/pages/MaterialHub.tsx` | `/materials/:slug` |
| `src/pages/BrandMaterialPage.tsx` | `/brands/:brand/:material` |
| `src/pages/ColorFamilyPage.tsx` | `/colors/:family` |

The above 3 pages handle all programmatic URLs for Tasks 1, 2, and 3.

### Files to Modify (2 existing files)

| File | Change |
|---|---|
| `src/App.tsx` | 3 new lazy imports + 3 new routes (correctly ordered) |
| `supabase/functions/prerender/index.ts` | 3 new async page handlers + dispatch entries + `sitemapMaterials()` + updated `sitemapIndex()` + 9 material entries in `STATIC_PAGES` |

---

### Task 1: `/materials/:slug` — Material Hub Pages

**Slug mapping** (URL slug → DB material query):

```text
pla        → material IN ('PLA', 'PLA+', 'PLA-HS', 'HTPLA', 'Silk PLA+', ...)
petg       → material IN ('PETG', 'PCTG', 'PETG-CF', ...)
abs        → material = 'ABS'
tpu        → material IN ('TPU', 'TPU-95A', 'TPU-98A')
asa        → material = 'ASA'
pla-plus   → material = 'PLA+'
silk-pla   → material ILIKE '%silk%'
nylon      → material IN ('PA', 'PA-CF', 'PA-GF')
pc         → material IN ('PC', 'PCTG', 'PC-CF')
```

A `MATERIAL_SLUG_CONFIG` map (defined once in the page file) handles this, with a fallback for unmapped slugs.

**Page structure (`MaterialHub.tsx`)**:

```tsx
// Queries (all run in parallel via Promise.all):
// 1. Count + avg price + brand count + TD range for the material
// 2. Top 5 filaments by filascope_score DESC (for "Best X Filaments" section)
// 3. All matching filaments (paginated, first 24) for the product grid

// Sections:
// <DocumentHead> — dynamic title/description
// <BreadcrumbSchema> — Home > Materials > {Material}
// <Breadcrumbs> — visible breadcrumb component
// <h1> — "{Material} Filament — Compare {count} Products"
// Aggregate stats bar: avg price, brand count, TD range, total products
// "Best {Material} Filaments" — top 5 cards (same FilamentCard pattern from BestFilamentsForHueForge)
// Product grid — all {material} filaments (link to /filament/{slug})
// "Compare Related Materials" links — cross-links to sibling material pages
// "Relevant Guides" links
// <FAQSection> — material-specific FAQs (reuse getFAQsForMaterial logic from FAQContent.tsx)
// <ItemListSchema> for top 5
```

**noindex logic**: If product count < 3, return noindex via `<DocumentHead robotsNoIndex />`. In prerender, the handler returns `X-Robots-Tag: noindex` via a special field.

**STATIC_PAGES additions** for primary materials (these have enough products to avoid thin content):

```ts
{ path: "/materials/pla", priority: 0.9, changefreq: "weekly" },
{ path: "/materials/petg", priority: 0.8, changefreq: "weekly" },
{ path: "/materials/abs", priority: 0.8, changefreq: "weekly" },
{ path: "/materials/tpu", priority: 0.7, changefreq: "weekly" },
{ path: "/materials/asa", priority: 0.7, changefreq: "weekly" },
{ path: "/materials/pla-plus", priority: 0.7, changefreq: "weekly" },
{ path: "/materials/silk-pla", priority: 0.6, changefreq: "weekly" },
{ path: "/materials/nylon", priority: 0.6, changefreq: "weekly" },
{ path: "/materials/pc", priority: 0.6, changefreq: "weekly" },
```

**New `sitemap-materials.xml`**: A `sitemapMaterials()` function that returns XML for the above 9 static entries. Added to `sitemapIndex()`.

**Prerender handler** (`materialPage(slug, supabase)`):
- Query DB for count, avg price, brand count for the resolved material list
- If count < 3: return `fallback()` with noindex flag
- Dynamic title: `"{Material} Filament — Compare {count} Products | FilaScope"` (≤60 chars)
- Dynamic description: `"Browse all {count} {Material} 3D printer filaments from {brandCount}+ brands. Compare specs, prices, and HueForge TD values on FilaScope."` (≤155 chars)
- Schema: `BreadcrumbList` + `ItemList` (top 5)

---

### Task 2: `/brands/:brand/:material` — Brand+Material Combo Pages

**Route ordering**: In `App.tsx`, `/brands/compare` (line 213) must remain before `/brands/:brand` (line 214). The new `/brands/:brand/:material` goes **after** `/brands/:brand` — React Router matches specificity so `/brands/:brand/:material` only matches two-segment paths.

**Page structure (`BrandMaterialPage.tsx`)**:

```tsx
// URL params: { brand: "bambu-lab", material: "pla" }
// Query 1: brand info from automated_brands WHERE brand_slug = brand
// Query 2: filaments WHERE LOWER(vendor) = LOWER(brand_name) AND material = resolvedMaterial
//          only renders if count >= 3 (else redirect to /brands/{brand})
// 
// Sections:
// <DocumentHead> — "{Brand} {Material} Filaments — {count} Products | FilaScope"
// <BreadcrumbSchema> — Home > Brands > {Brand} > {Material}
// <h1> — "{Brand} {Material} Filaments"
// Specs summary: nozzle temp range, bed temp range, diameter options, color count
// Price comparison across variants (min–max price)
// Product grid filtered by brand+material
// "More from {Brand}" → /brands/{brand}
// "All {Material} Filaments" → /materials/{material-slug}
// Short FAQ (2-3 questions specific to brand+material combo)
```

**noindex if count < 3**: query first, if fewer than 3 results redirect to parent brand page (client side) or return noindex prerender.

**No static pages for brand+material** — these are dynamically generated. Prerender handles crawl requests only. No new STATIC_PAGES entries (avoids maintaining a huge list). These pages are discovered via links from brand pages and material pages.

**Prerender handler** (`brandMaterialPage(brandSlug, materialSlug, supabase)`):
- Resolve material name from slug
- Query count from filaments
- If count < 3: return fallback with noindex
- Dynamic title + description
- BreadcrumbList schema

---

### Task 3: `/colors/:family` — Color Family Pages

**Color slug mapping** (URL slug → `color_family` DB value):

```text
white   → 'White'
black   → 'Black'
blue    → 'Blue'
red     → 'Red'
green   → 'Green'
gray    → ['Gray', 'Grey', 'Light Grey']
yellow  → 'Yellow'
orange  → 'Orange'
purple  → 'Purple'
brown   → 'Brown'
natural → 'Natural'
pink    → 'Pink'
clear   → ['Clear', 'Transparent']
gold    → 'Gold'
silver  → 'Silver'
```

**Page structure (`ColorFamilyPage.tsx`)**:

```tsx
// Query: filaments WHERE color_family IN (resolvedFamilies), ordered by filascope_score DESC
// For 'white': additional emphasis on TD values
// 
// Sections:
// <DocumentHead>
// <BreadcrumbSchema> — Home > Colors > {Color}
// <h1> — "{Color} 3D Printer Filaments — {count} Options"
// Color swatch grid (all unique color_hex values for visual variety)
// Product grid (cards with color swatch, brand, name, price, TD if available)
// For white/natural: "HueForge TD Values" callout section
// "Explore Other Colors" — links to sibling color pages
// <FAQSection> — color-specific FAQs
// noindex if count < 3
```

**Prerender handler** (`colorFamilyPage(slug, supabase)`):
- Resolve color family names from slug
- Query count
- If count < 3: fallback with noindex
- Title: `"{Color} 3D Printer Filaments — Compare {count} Options | FilaScope"`
- Description: special-cased for white (`"...ranked by TD value for HueForge lithophanes..."`)

**No static pages for color families** — discovered via internal links from material/filament pages. The `/colors` path already exists as a route to ColorFinder.

---

### Task 4: noindex Logic for Thin Content

**In prerender**: The `fallback()` function already returns `{ type: "notfound" }` which triggers `X-Robots-Tag: noindex`. For material/brand-material/color pages with <3 products, we return `fallback(path)` from the handler.

**On client side**: Each page component checks its query result count. If `count < 3`, it renders a redirect component:

```tsx
if (!isLoading && count < 3) {
  return <Navigate to={parentRoute} replace />;
}
```

This prevents thin content from being indexed even if a bot somehow hits the SPA.

**bodyText minimum length**: Each prerender handler will include a minimum 150-character `bodyText` combining the h1 description + key stats + CTA sentence.

---

### Exact Prerender Metadata

**`/materials/pla`**
- Title: `PLA Filament — Compare 3,141+ Products | FilaScope` (50 chars ✓)
- Description: `Browse 3,141+ PLA 3D printer filaments from 38 brands. Compare PLA and PLA+ specs, prices, TD values and printer compatibility. Find the best PLA filament.` (160 chars ✓)
- Schema: BreadcrumbList + ItemList (top 5 by filascope_score)

**`/materials/petg`**
- Title: `PETG Filament — Compare 834 Products | FilaScope` (48 chars ✓)
- Description: `Browse 834 PETG 3D printer filaments from 36 brands. Compare strength, heat resistance, price, and compatibility. Find the best PETG for your printer.`

**`/brands/bambu-lab/pla`** (example)
- Title: `Bambu Lab PLA Filaments — 132 Products | FilaScope` (50 chars ✓)
- Description: `Browse all 132 Bambu Lab PLA filaments. Compare colors, specs, TD values, and prices. Find the right Bambu Lab PLA for your printer on FilaScope.`

**`/colors/white`**
- Title: `White 3D Printer Filaments — 432 Options | FilaScope` (52 chars ✓)
- Description: `Compare 432 white 3D printer filaments ranked by TD value, brand, and price. Essential for HueForge lithophanes — find your perfect white PLA filament.`

---

### Implementation Sequence

1. Create `src/pages/MaterialHub.tsx`
2. Create `src/pages/BrandMaterialPage.tsx`
3. Create `src/pages/ColorFamilyPage.tsx`
4. Update `src/App.tsx` — add 3 lazy imports + 3 routes (ordered: `/materials/:slug` AFTER `/materials/compare`)
5. Update `supabase/functions/prerender/index.ts`:
   - Add `MATERIAL_SLUG_MAP` and `COLOR_SLUG_MAP` constants at top of file
   - Add `async function materialPage(slug, supabase)` handler
   - Add `async function brandMaterialPage(brandSlug, materialSlug, supabase)` handler
   - Add `async function colorFamilyPage(slug, supabase)` handler
   - Add dispatch entries in `getPageData()`:
     ```ts
     const mm = path.match(/^\/materials\/(.+)$/);
     if (mm) return await materialPage(mm[1], supabase);
     
     const cm = path.match(/^\/colors\/(.+)$/);
     if (cm) return await colorFamilyPage(cm[1], supabase);
     
     // brand+material: /brands/{slug}/{material}
     const bmm = path.match(/^\/brands\/([^\/]+)\/([^\/]+)$/);
     if (bmm) return await brandMaterialPage(bmm[1], bmm[2], supabase);
     ```
     Note: `bmm` dispatch must come BEFORE the existing `bm` handler (currently line 222-223). The existing `/brands/compare` check at line 221 stays first.
   - Add `sitemapMaterials()` function
   - Update `sitemapIndex()` to include `sitemap-materials.xml`
   - Add 9 material entries to `STATIC_PAGES`
   - Add sitemap route handler in the main serve block
6. Deploy prerender edge function

### What Will NOT Change
- `/brands/compare` route and handler — untouched
- `/brands/:brand` route and handler — untouched  
- `/materials/compare` route — untouched
- Existing `/colors` route to `ColorFinder` — untouched (new route is `/colors/:family`)
- All existing filament, printer, guide page handlers — untouched
- No DB schema changes needed

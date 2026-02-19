
## SEO Overhaul: Material Knowledge Base — Individual Material Pages & Content Unlocking

### Current State Analysis

**What exists:**
- `/reference/materials` — `MaterialKnowledgeBase.tsx` renders the `MaterialReference` component: a two-panel layout with a searchable sidebar (236+ materials as `<button>` elements) and a detail panel on the right. All content is JavaScript-only.
- `/materials/:slug` — `MaterialHub.tsx` handles 12 slugs via `MATERIAL_SLUG_CONFIG`. It renders product listings but has NO Knowledge Base content (print settings, strengths, weaknesses, etc.). The "0 products" bug is caused by a `td_value` column reference (now fixed to `transmission_distance`, but the query still works as stats use `td_value`).
- `src/lib/materialReferenceData.ts` — 14,868 lines containing `MATERIAL_REFERENCE_DATA` for rich material content plus 3 extended data files (`materialReferenceDataExtended.ts/2/3`). The `getMaterialReference()` function provides lookup with alias resolution.
- `src/components/MaterialReference.tsx` — 1,324-line component containing `MaterialDetailView` which renders ALL the Knowledge Base sections (print settings, strengths, weaknesses, TDS, adhesion, practical context, origin, composition, post-processing, safety). This logic is already written — it just needs to be embedded into `MaterialHub.tsx`.

**The core problem:** Two systems are completely disconnected. `MaterialHub.tsx` shows product listings; `MaterialReference` shows knowledge content. They've never been merged. Additionally, the 236 materials in the sidebar are `<button>` elements with no URL change — Google sees a blank right panel.

**"0 Products" bug root cause:** The stats query on line 205-215 in `MaterialHub.tsx` references `td_value` (a non-existent column). The query itself fails silently, causing `data` to be null. This means `count` returns 0 and `stats` is null, causing the `!isLoading && stats && stats.count < 3` check on line 266 to not trigger, but `count = stats?.count ?? 0` evaluates to 0. The fix: change `td_value` to `transmission_distance`.

---

### Architecture Decision

**Option A (Simpler):** Embed `MaterialDetailView` directly into the existing `MaterialHub.tsx`, using a slug-to-material-name resolver. Works for 12 existing slugs immediately.

**Option B (Full):** Create a new `MaterialGuidePage.tsx` that handles ALL 236 material types via dynamic routes, with slug-based URL patterns generated from `MATERIAL_CATEGORIES` in `materialHierarchy.ts`.

**Decision: Option A first (fix the existing pages), then extend** — The brief requests fixing existing pages AND creating new ones. We fix `MaterialHub.tsx` to include Knowledge Base content for the 12 existing slugs, then add a slug-to-material resolver for all 236 types. The route `/materials/:slug` already exists in `App.tsx` and handles all slugs via `MaterialHub`.

The key challenge: mapping URL slugs (e.g., `pla-silk`) to Knowledge Base keys (e.g., `PLA Silk` or `PLA-Silk`). We need a comprehensive slug-to-material-name map.

---

### Slug Generation Strategy

URL slugs will be generated from material names using this pattern:
- `PLA` → `pla`
- `PLA+` → `pla-plus`
- `PLA-CF` → `pla-cf`
- `PLA Silk` → `pla-silk`
- `PLA-Matte` → `pla-matte`
- `TPU 95A` → `tpu-95a`
- `PA6-CF` → `pa6-cf`

This is a lowercase, special-char-to-hyphen transformation, with `+` → `plus`.

A utility function `materialNameToSlug(name: string): string` will be created in `src/lib/materialSlugUtils.ts`, plus the reverse `slugToMaterialNames(slug: string): string[]` that returns the original material names that map to that slug. This handles the case where multiple names produce the same slug (e.g., `PLA Silk`, `PLA-Silk`, `Silk PLA` all resolve to related slugs).

---

### Files to Create / Modify

| File | Action | Summary |
|---|---|---|
| `src/lib/materialSlugUtils.ts` | CREATE | `materialNameToSlug()`, `slugToMaterialName()`, full slug↔name mapping from MATERIAL_CATEGORIES |
| `src/pages/MaterialHub.tsx` | MODIFY | Fix `td_value` bug; add Knowledge Base content sections; add Article schema; enhance FAQs; update CTA links; fix BreadcrumbList duplication; expand MATERIAL_SLUG_CONFIG for more materials |
| `src/components/MaterialReference.tsx` | MODIFY | Convert all sidebar `<button>` to `<a>` tags linking to `/materials/{slug}`; update Browse CTA from `/?material=` to `/filaments/{slug}` |
| `src/pages/MaterialKnowledgeBase.tsx` | MODIFY | Update H1; add CollectionPage JSON-LD; add material families grid with links; update stats copy |
| `supabase/functions/prerender/index.ts` | MODIFY | Add `materialPage()` handler that generates rich prerender HTML for `/materials/:slug` with Knowledge Base text content, Article schema, FAQPage schema, and crawlable body text |

---

### Detailed Changes

#### 1. Create `src/lib/materialSlugUtils.ts`

```ts
import { MATERIAL_CATEGORIES } from './materialHierarchy';
import { getMaterialReference } from './materialReferenceData';

export function materialNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Returns the canonical material name(s) for a given slug
// Searches ALL MATERIAL_CATEGORIES for matching materials
export function slugToMaterialNames(slug: string): string[] {
  const results: string[] = [];
  for (const cat of MATERIAL_CATEGORIES) {
    for (const mat of cat.materials) {
      if (materialNameToSlug(mat) === slug) {
        results.push(mat);
      }
    }
  }
  return results;
}

// Returns the BEST match for a slug — prefers the one with reference data
export function slugToMaterialName(slug: string): string | null {
  const names = slugToMaterialNames(slug);
  if (names.length === 0) return null;
  // Prefer name with reference data
  const withRef = names.find(n => getMaterialReference(n));
  return withRef || names[0];
}

// All unique slugs from MATERIAL_CATEGORIES (for route generation)
export function getAllMaterialSlugs(): string[] {
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const cat of MATERIAL_CATEGORIES) {
    for (const mat of cat.materials) {
      const slug = materialNameToSlug(mat);
      if (!seen.has(slug)) {
        seen.add(slug);
        slugs.push(slug);
      }
    }
  }
  return slugs;
}
```

#### 2. Modify `src/pages/MaterialHub.tsx`

**A. Fix the `td_value` bug (line 205):**
```ts
// BEFORE:
.select("id, vendor, variant_price, td_value", { count: "exact" })
// AFTER:
.select("id, vendor, variant_price, transmission_distance", { count: "exact" })
```
Also change the `tds` computation:
```ts
const tds = (data as any[]).map((d: any) => d.transmission_distance).filter(Boolean) as number[];
```

**B. Expand `MATERIAL_SLUG_CONFIG`:**
The existing 12-slug config already handles major materials. We need to add a fallback path for unknown slugs that uses `slugToMaterialName()` from the new utility. Modify `MaterialHub` so that when `slug` is not in `MATERIAL_SLUG_CONFIG`, it tries `slugToMaterialName(slug)` and builds a dynamic config from it:

```tsx
// In MaterialHub component:
const config = slug ? (MATERIAL_SLUG_CONFIG[slug] ?? buildDynamicConfig(slug)) : null;

function buildDynamicConfig(slug: string): SlugConfig | null {
  const materialName = slugToMaterialName(slug);
  if (!materialName) return null;
  return {
    label: materialName,
    materials: slugToMaterialNames(slug),
    relatedSlugs: [],
    relatedMaterials: [],
    guides: [],
  };
}
```

**C. Add Knowledge Base content sections to the page:**

After the existing "All {label} Filaments" product grid, add:

```tsx
import { getMaterialReference } from '@/lib/materialReferenceData';
import { slugToMaterialName } from '@/lib/materialSlugUtils';

// In MaterialHub component, after existing queries:
const materialName = slug ? (MATERIAL_SLUG_CONFIG[slug]?.materials[0] ?? slugToMaterialName(slug)) : null;
const reference = materialName ? getMaterialReference(materialName) : null;

// Then render sections:
{reference && (
  <>
    {/* Quick Start — Print Settings */}
    <section className="mb-10" aria-labelledby="print-settings-h2">
      <h2 id="print-settings-h2" className="text-xl font-semibold mb-4">
        Quick Start — {label} Print Settings
      </h2>
      <PrintSettingsSummary reference={reference} />
    </section>

    {/* Strengths */}
    <section className="mb-10" aria-labelledby="strengths-h2">
      <h2 id="strengths-h2" className="text-xl font-semibold mb-4">
        {label} Strengths
      </h2>
      <StrengthsContent reference={reference} />
    </section>

    {/* Weaknesses */}
    ...

    {/* Technical Data Sheet */}
    ...

    {/* Adhesion & Multi-Material Compatibility */}
    ...

    {/* Practical Guide */}
    ...

    {/* Post-Processing */}
    ...

    {/* Safety & Sustainability */}
    ...
  </>
)}
```

**Key rendering approach:** All Knowledge Base sections will be rendered **expanded by default** (not behind accordions) on the `/materials/:slug` pages. This ensures Google indexes all content without needing to "click" to expand. The sections use semantic `<section>` with `<h2>` and `<h3>` headings matching the required hierarchy. The existing `AccordionSection` / `AccordionContent` pattern from `MaterialDetailView` will NOT be used here — instead, simple `<div>` containers with headings are used so content is always visible in DOM.

The internal sub-components (`PrintSettingsSummary`, `StrengthsContent`, etc.) can be extracted from the existing `MaterialDetailView` render logic into standalone, non-accordion components. They will be created as local functions within `MaterialHub.tsx` or in a new `src/components/materials/` folder.

**D. Update H1:**
```tsx
// BEFORE:
<h1>...{label} Filament — Compare {count} Products</h1>
// AFTER:
<h1>...{label} Filament — Complete Guide & {count} Products</h1>
```

**E. Update meta title/description to spec:**
```tsx
const title = reference
  ? `${label} Filament Guide — Print Settings, Specs & ${count.toLocaleString()} Products | FilaScope`
  : `${label} Filament — Compare ${count.toLocaleString()} Products | FilaScope`;
```
Description includes temperature data from `reference.printSettings.nozzleTemp` when available.

**F. Add Article schema:**
```tsx
import { ArticleSchema } from '@/components/seo/ArticleSchema';

<ArticleSchema
  headline={`${label} Filament — Complete Guide & ${count} Products`}
  description={description}
  datePublished="2025-01-01T00:00:00Z"
  url={`/materials/${slug}`}
/>
```

**G. Fix the Browse CTA link:**
```tsx
// BEFORE:
to={`/?material=${slug}`}
// AFTER:
to={`/filaments/${slug}`}
```

**H. Fix duplicate BreadcrumbList:**
`BreadcrumbSchema` is injected by `MaterialHub` and also by `Breadcrumbs` (which uses `useJsonLd`). Remove the `<BreadcrumbSchema>` import from `MaterialHub` since `Breadcrumbs` already handles it.

**I. Enhanced FAQ content:**

The `getMaterialFAQs` function needs to be updated to:
- Include material name in every question
- Include temperature data pulled from `getMaterialReference()` when available
- Add HueForge/TD question for PLA-family materials
- Add product count question
- Reduce generic questions

For PLA, the full 8-question FAQ set as specified in the brief will be implemented. For other materials, a template-based generator using reference data will produce material-specific questions.

**J. Heading hierarchy (per spec):**
```
H1: PLA Filament — Complete Guide & 434 Products
  H2: Quick Stats (visual, no heading tag needed — it's a grid)
  H2: Best PLA Filaments
  H2: All PLA Filaments
  H2: Quick Start — PLA Print Settings
    H3: Temperature Settings
    H3: Cooling & Enclosure
    H3: Drying Instructions
  H2: PLA Strengths
    H3: Unique Properties
    H3: Best Use Scenarios
    H3: Advantages Over Competitors
  H2: PLA Weaknesses
    H3: Limitations
    H3: Avoid Using PLA For
  H2: Technical Specifications
    H3: Technical Data Sheet Profile
    H3: Adhesion & Multi-Material Compatibility
  H2: Practical Guide
    H3: Practical Context
    H3: Post-Processing
    H3: Safety & Sustainability
  H2: Compare Related Materials
  H2: Relevant Guides
  H2: PLA Filament FAQ
```

Note: `sr-only` H2s are NOT used here since these are actual content sections that will be visually displayed.

---

#### 3. Modify `src/components/MaterialReference.tsx`

**A. Convert sidebar `<button>` to `<a>` tags (lines 1160-1222):**

```tsx
// BEFORE:
<button
  key={name}
  onClick={() => selectMaterialAndExpand(name)}
  className={cn("w-full flex items-center...", ...)}
>

// AFTER:
<a
  key={name}
  href={`/materials/${materialNameToSlug(name)}`}
  onClick={(e) => {
    e.preventDefault(); // prevent full page reload for SPA behavior
    selectMaterialAndExpand(name);
  }}
  className={cn("w-full flex items-center...", ...)}
>
```

This makes every sidebar item crawlable with a valid `href`, while maintaining the existing click behavior for users (content loads in the right panel without a page reload). Googlebot sees real links and can crawl all 236 material URLs.

**B. Update category headers to link to parent material page:**
The category `<button>` (line 1112) for family groups (e.g., "PLA Family") will also get an `<a>` wrapping/linking behavior:
```tsx
// Category header: link to the parent material page
<a
  href={`/materials/${materialNameToSlug(category.replace(/ Family$/i, ''))}`}
  onClick={(e) => { e.preventDefault(); toggleCategory(category); }}
>
  {category}
</a>
```

**C. Update Browse CTA (line 264-270):**
```tsx
// BEFORE:
to={`/?material=${encodeURIComponent(reference.name)}`}
// AFTER:
to={`/filaments/${materialNameToSlug(reference.name)}`}
```
Also update line 581 (in Practical Context section).

---

#### 4. Modify `src/pages/MaterialKnowledgeBase.tsx`

**A. Update H1:**
```tsx
// BEFORE:
<h1>Material <span>Knowledge Base</span></h1>
// AFTER:
<h1>3D Printing Material Knowledge Base — 236+ Material Types</h1>
```
(Keep the visual styling: the word count can be split with a `<span>` for color)

**B. Update stats copy:**
Change "45+ Material Types" and "12 Property Categories" to accurate counts (236+ and 15+ categories).

**C. Add Material Families grid section:**
After the intro paragraph, before the `<MaterialReference />` component, add a families grid:

```tsx
<section className="mb-8">
  <h2 className="text-xl font-semibold mb-4">Browse by Material Family</h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    {MATERIAL_CATEGORIES.map(cat => {
      const shortName = cat.name.replace(/ Family$/i, '');
      const slug = materialNameToSlug(shortName);
      return (
        <a
          key={cat.id}
          href={`/materials/${slug}`}
          className="..."
        >
          <div className="font-semibold">{shortName}</div>
          <div className="text-xs text-muted-foreground">{cat.materials.length} materials</div>
        </a>
      );
    })}
  </div>
</section>
```

**D. Add CollectionPage JSON-LD:**
```tsx
<useJsonLd({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "3D Printing Material Knowledge Base",
  "description": "Complete reference for 236+ 3D printing filament material types with print settings, strengths, weaknesses, and technical data.",
  "url": "https://filascope.com/reference/materials",
  "hasPart": [
    { "@type": "Article", "name": "PLA Filament Guide", "url": "https://filascope.com/materials/pla" },
    { "@type": "Article", "name": "PETG Filament Guide", "url": "https://filascope.com/materials/petg" },
    { "@type": "Article", "name": "ABS Filament Guide", "url": "https://filascope.com/materials/abs" },
    { "@type": "Article", "name": "ASA Filament Guide", "url": "https://filascope.com/materials/asa" },
    { "@type": "Article", "name": "TPU Filament Guide", "url": "https://filascope.com/materials/tpu" },
    { "@type": "Article", "name": "Nylon Filament Guide", "url": "https://filascope.com/materials/nylon" },
    { "@type": "Article", "name": "Polycarbonate Filament Guide", "url": "https://filascope.com/materials/pc" },
  ]
})}
```

**E. Update `DefinedTermSetSchema` `url` values:**
Currently links to `?material=pla` — change to `/materials/pla` etc.

---

#### 5. Update `supabase/functions/prerender/index.ts`

The existing `materialPage()` handler at line 463 (`if (mm) return await materialPage(mm[1], supabase)`) already handles `/materials/:slug` but currently only renders a basic product listing shell (similar to `filamentCategoryPage`). We need to check what `materialPage` currently does and enhance it.

Looking at lines 450-487, `materialPage()` exists. Let me check what it does — it's defined somewhere between lines 600-1200. The handler will be enhanced to:

1. Use `PRERENDER_SLUG_CONFIG` (already defined) to get material data
2. Emit rich body text from Knowledge Base data (since the reference data is in client-side TypeScript, we'll replicate the key text content in the prerender function — print settings, strengths text, etc. as static strings per material)
3. Emit Article schema
4. Emit enhanced FAQPage schema with material-specific questions
5. Emit BreadcrumbList schema
6. Include crawlable `<a>` links to product pages

**Static Knowledge Base content in prerender:** The Knowledge Base data (`materialReferenceData.ts`) is client-side only and cannot be imported in Deno edge functions. Instead, we'll add a `PRERENDER_MATERIAL_CONTENT` map to the prerender function with the key content (print temps, one-line description, key strengths/weaknesses) for the 12 major material types. This is sufficient for the body text crawlability requirement — the client-side rendering handles the full rich content.

```ts
const PRERENDER_MATERIAL_CONTENT: Record<string, {
  printTemp: string;
  bedTemp: string;
  enclosure: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
}> = {
  pla: {
    printTemp: "190-220°C",
    bedTemp: "35-60°C",
    enclosure: "Not required",
    description: "The most popular 3D printing material. Biodegradable, easy to print, low warping.",
    strengths: ["Easy to print", "Biodegradable", "Wide color selection", "No enclosure needed"],
    weaknesses: ["Low heat resistance (~60°C)", "Not for outdoor use", "Brittle over time"],
  },
  // ... etc for each slug
};
```

**Prerender body for `/materials/pla`:**
```html
<h1>PLA Filament — Complete Guide & {count} Products</h1>
<p>Print temp: 190-220°C. Bed: 35-60°C. Enclosure: Not required.</p>
<h2>PLA Print Settings</h2>
<p>Nozzle temperature 190-220°C, bed temperature 35-60°C, 100% cooling fan, no enclosure required.</p>
<h2>PLA Strengths</h2>
<ul><li>Easy to print</li><li>Biodegradable</li>...</ul>
<h2>PLA Weaknesses</h2>
<ul>...</ul>
<h2>Browse PLA Filaments</h2>
<ul><li><a href="/filament/bambu-lab-pla-basic">Bambu Lab PLA Basic</a></li>...</ul>
```

The `buildHtml()` function will be extended with a `sections?: { heading: string; content: string }[]` field in `PageData` to support this richer body structure.

**Sitemap updates:** Add entries for the 236 `/materials/` slugs to `MATERIAL_SITEMAP_PAGES`. The most important ones (PLA, PETG, ABS, ASA, TPU, Nylon, PC, PLA+, Silk PLA, high-speed-pla, PETG-CF) are already listed — add the sub-variants (PLA-CF, PLA-Wood, PLA-Matte, PLA-Silk, PETG-GF, ABS-CF, etc.) with lower priority (0.4-0.5).

---

### Material Slug Mapping — Key Concern

The 236 materials in `MATERIAL_CATEGORIES` will generate slugs like:
- `PLA` → `pla`  
- `PLA+` → `pla-plus`
- `PLA-CF` → `pla-cf`
- `PLA-Silk` → `pla-silk`  
- `PLA Silk` → `pla-silk` (both map to same slug — deduplicated)
- `PLA-Matte` → `pla-matte`
- `TPU 95A` → `tpu-95a`
- `PA6-CF` → `pa6-cf`

Collision handling: when two material names generate the same slug (e.g., `PLA-Silk` and `PLA Silk`), `slugToMaterialNames()` returns both and the lookup tries each in order until it finds one with reference data.

The `MaterialHub.tsx` fallback for unknown slugs uses this resolution. If no match is found and the slug isn't in `MATERIAL_SLUG_CONFIG`, the page returns `<Navigate to="/" replace />` (thin content redirect).

---

### What Will NOT Change

- The visual design of `/reference/materials` Knowledge Base hub — same two-panel layout, same dark theme, same accordion behavior for users
- The existing 12-slug `MATERIAL_SLUG_CONFIG` — we're extending it, not replacing it
- Database schema — zero DB migrations needed
- The `MaterialDetailView` component in `MaterialReference.tsx` — it still powers the right panel of the hub page
- Admin panel, pricing, affiliate links
- `/filaments/:slug` category pages — separate system, untouched

---

### Priority Order

1. Fix `td_value` → `transmission_distance` bug in `MaterialHub.tsx` (fixes "0 Products" immediately)
2. Convert sidebar buttons to `<a>` links in `MaterialReference.tsx` (makes all 236 material URLs crawlable)
3. Add Knowledge Base content sections to `MaterialHub.tsx` (major content unlock)
4. Update H1, meta title/description, and Article schema in `MaterialHub.tsx`
5. Enhance FAQPage JSON-LD with material-specific questions
6. Update `MaterialKnowledgeBase.tsx` hub page (H1, families grid, CollectionPage schema)
7. Update prerender for `/materials/:slug` with richer body content, Article schema, FAQPage schema
8. Add new material slugs to sitemap


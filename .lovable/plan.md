
# SEO Content & Internal Linking Plan

## Current State Analysis

After reviewing all key page types:

- **Homepage (Finder.tsx):** Has `WhyFilaScope` value prop section and a "Trending" section before the catalog. No SEO content block with "What is FilaScope?" or "Popular Searches" chips above the footer.
- **Material Pages (MaterialHub.tsx):** Already has related material links and guide links. Missing: brand-specific links, color-specific page links.
- **Brand Pages (BrandDetail.tsx):** Has breadcrumb (`DetailBreadcrumb`) + full SEO. Missing: "Related Brands" section.
- **Brand Listing (Brands.tsx):** Has `BreadcrumbSchema` (schema only, no visible breadcrumb trail rendered).
- **Product Pages (FilamentDetail.tsx):** Has `RelatedFilaments` (same brand/material/color) and `RelatedGuidesLinks`. The existing `RelatedFilaments` does NOT show cross-brand alternatives — this needs a dedicated "Similar from Other Brands" section.
- **Guide Pages (GuideDetail.tsx):** Has `GuideReadNext` (3 related guides). Missing: visible breadcrumb and "Products Mentioned" section.
- **Guide Listing (LearningCenter.tsx):** Has `BreadcrumbSchema` only.

## What Already Exists (Do NOT Duplicate)

- `RelatedFilaments` component — handles same-brand + similar-TD + same-color cross-brand results (already in FilamentDetail)
- `RelatedGuidesLinks` — contextual guide pills on product pages
- `DetailBreadcrumb` — visible breadcrumb on brand detail + filament detail pages
- `Breadcrumbs` — visible breadcrumb on Material Hub, FilamentCategoryPage, ColorFamilyPage
- `GuideReadNext` in guide detail page

## Changes Planned

### 1. Homepage — SEO Content Block (new component)

**File:** Create `src/components/HomeSEOContent.tsx`

A new section placed just before the `<SiteFooter>` in `Finder.tsx` (after the filament grid, above the footer). It will contain:

- **"What is FilaScope?" paragraph** with target keywords naturally embedded: 3D printer filament comparison, filament database, HueForge TD values, filament prices
- **"Popular Searches" chip row** — 6 linked pills using `<a>` tags (not React Router `<Link>`) for crawler discoverability:
  - "Best PLA for beginners" → `/guides/best-filament-for-beginners-2025`
  - "PETG vs ABS" → `/materials/compare?a=petg&b=abs`
  - "Cheapest filament" → `/filaments?sort=price_asc`
  - "HueForge compatible filaments" → `/best-filaments-for-hueforge`
  - "High speed PLA" → `/filaments/pla?q=high+speed`
  - "Best filament for Bambu Lab" → `/guides/best-pla-filaments`

### 2. Material Pages — Add Brand & Color Links

**File:** `src/pages/MaterialHub.tsx`

Add two new content sections after the existing "Compare Related Materials" and "Relevant Guides" sections:

**a) Top Brands for This Material** — query the top 5 brands by product count for the current material (using existing `filaments` table), render as linked pills to `/brands/{brandSlug}`.

**b) Color-Specific Pages** — add a static map inside `MATERIAL_SLUG_CONFIG` for popular colors per material (e.g., PLA → White, Black, Grey, Transparent), linking to `/colors/{color}?material={slug}` or the `ColorFamilyPage` route at `/colors/{color}`.

### 3. Brand Pages — "Related Brands" Section

**File:** Create `src/components/brands/RelatedBrandsSection.tsx`

A small component that:
- Accepts `brandName: string`, `availableMaterials: string[]`
- Queries `automated_brands` table for brands that share similar top materials (or uses a hardcoded similar-brands map for the main brands)
- Renders 4-6 brand name chips with links to `/brands/{brandSlug}` and brand logos (using `getBrandLogo`)

**Integration:** Add `<RelatedBrandsSection>` inside `BrandDetail.tsx` at the very bottom of the page (after the FAQ section, inside the main `max-w-7xl` div).

### 4. Product Pages — Cross-Brand "Similar from Other Brands" Section

The existing `RelatedFilaments` already shows cross-brand results via the 3-bucket system. However, the request asks for a clearer **dedicated section** showing same-material alternatives from competing brands. 

**Assessment:** The existing `RelatedFilaments` already covers "same material, different brand" in bucket 2 and 3. Instead of duplicating, we will:
- Ensure the section heading clearly says "Similar [Material] from Other Brands" for the cross-brand buckets (already labeled correctly)
- The `RelatedFilaments` component already shows 6 cross-brand cards — this requirement is **already implemented**

No new file needed here, but we verify the existing component is correctly wired (it is, at line 1100–1106 of FilamentDetail.tsx).

### 5. Guide Pages — Breadcrumb + "Products Mentioned" Section

**File:** `src/pages/GuideDetail.tsx`

Two additions:

**a) Visible Breadcrumb** — Add `<DetailBreadcrumb>` just above the guide header (after the sticky `<header>` block), with segments: `[{label:"Guides", href:"/learn"}, {label: guide.title, href: `/learn/${slug}`}]`

**b) Products Mentioned** — Add a new `GuideProductsMentioned` component in `src/components/guides/GuideComponents.tsx`. Since guide content is JSX (not markdown), we'll create a `productsMentioned` optional field in `GuideMetadata` with an array of filament slugs/IDs. For the 5 existing guides that have content, we add curated product mentions from the guide content. The component fetches those filaments by slug and renders linked cards.

### 6. Visible Breadcrumb on Brands Listing & Guide Listing

**Brands listing (Brands.tsx):** Currently only has `BreadcrumbSchema` (schema only). Add a visible `<Breadcrumbs>` component after the `BrandsHeroSection` with items: `[{name:"Home", url:"/"}, {name:"Brands", url:"/brands"}]` — but since this is a top-level page with only 2 items, and the `Breadcrumbs` component returns `null` for chains ≤1 item after home, we need the component to render this. The `Breadcrumbs` component shows breadcrumb only when `chain.length > 1` — this chain has 2 items so it will render.

**Guide listing (LearningCenter.tsx):** Add a visible `<Breadcrumbs>` with items `[{name:"Home", url:"/"}, {name:"Guides", url:"/learn"}]`.

## Technical Implementation Details

### Files to Create
1. `src/components/HomeSEOContent.tsx` — homepage SEO block
2. `src/components/brands/RelatedBrandsSection.tsx` — related brands for brand detail page

### Files to Modify
1. `src/pages/Finder.tsx` — import and add `<HomeSEOContent>` before footer close
2. `src/pages/MaterialHub.tsx` — add top-brands query + color links sections; extend `MATERIAL_SLUG_CONFIG` with `colorSlugs` data
3. `src/pages/BrandDetail.tsx` — import and add `<RelatedBrandsSection>` at the bottom
4. `src/pages/GuideDetail.tsx` — add `<DetailBreadcrumb>` + `productsMentioned` rendering
5. `src/pages/LearningCenter.tsx` — add visible `<Breadcrumbs>`
6. `src/pages/Brands.tsx` — add visible `<Breadcrumbs>` below hero
7. `src/components/guides/GuideComponents.tsx` — add `GuideProductsMentioned` component
8. `src/pages/LearningCenter.tsx` — extend `GuideMetadata` with optional `productsMentioned: string[]`

### Data Strategy for Related Brands
Rather than a runtime query (which could be slow), we'll use a lightweight static adjacency map for the major brands and a live query fallback for the rest. The static map covers ~12 major brands with 4–6 curated competitors. For unknown brands, we fall back to querying the `automated_brands` table for brands that share at least one material.

### Popular Color Slugs per Material
We'll add a `colorSlugs` array to each `MATERIAL_SLUG_CONFIG` entry, pointing to `/colors/{slug}` routes that are already registered via `ColorFamilyPage`:
- PLA: `["white", "black", "grey", "blue", "red", "transparent"]`
- PETG: `["white", "black", "clear", "blue"]`
- ABS: `["black", "white", "grey"]`
- etc.

### Breadcrumb Consistency
All page types will have both visible breadcrumbs and JSON-LD `BreadcrumbList` schema:

```text
Page Type              Visible?    Schema?    Component
──────────────────────────────────────────────────────
Homepage (/)           No          Yes        BreadcrumbSchema
Brands (/brands)       Yes (new)   Yes        Breadcrumbs
Brand Detail           Yes         Yes        DetailBreadcrumb
Filaments (/filaments) Yes         Yes        Breadcrumbs
Filament Detail        Yes         Yes        DetailBreadcrumb
Material Hub           Yes         Yes        Breadcrumbs
Guide List (/learn)    Yes (new)   Yes        Breadcrumbs
Guide Detail           Yes (new)   No*        DetailBreadcrumb
Compare                No          Yes        BreadcrumbSchema
```
*Guide detail currently has no schema breadcrumb — we'll add via `BreadcrumbSchema` when we add `DetailBreadcrumb`.



# Add WebApplication Schema to Compare and Color Finder Pages

## Current State

- **/compare**: Has Helmet, BreadcrumbSchema, and conditional DefinedTermSet/FAQ schemas. Missing WebApplication schema.
- **/color-finder**: Has Helmet and BreadcrumbSchema. Missing WebApplication schema.
- **/hueforge-td-database**: Already has BreadcrumbSchema, DatasetSchema, and FAQSchema. No changes needed.

## Changes Required

### 1. Create a reusable `WebApplicationSchema` component

**New file: `src/components/seo/WebApplicationSchema.tsx`**

A small JSON-LD component (following the pattern of `SoftwareApplicationSchema`) that outputs a `WebApplication` schema block. Props: `name`, `url`, `applicationCategory`, `description`, optional `offers`.

Also export it from `src/components/seo/index.ts`.

### 2. Add WebApplication schema to `/compare` page

**File: `src/pages/Compare.tsx` (around line 447)**

Insert `<WebApplicationSchema>` after the existing `BreadcrumbSchema`:
- name: "FilaScope Filament Comparison Tool"
- url: "https://filascope.com/compare"
- applicationCategory: "Utility"
- description: "Compare 3D printer filaments side by side. Specs, prices, TD values, and printer compatibility."
- offers: { price: "0", priceCurrency: "USD" }

### 3. Add WebApplication schema to `/color-finder` page

**File: `src/pages/ColorFinder.tsx` (after line 74)**

Insert `<WebApplicationSchema>` after the existing `BreadcrumbSchema`:
- name: "FilaScope Color Finder"
- url: "https://filascope.com/color-finder"
- applicationCategory: "Utility"
- description: "Match any color to 3D printer filaments. Search by hex code, color name, or visual match."

### 4. No changes to `/hueforge-td-database`

Already has all three requested schemas (Dataset, FAQPage, BreadcrumbList).

## Files Modified

1. `src/components/seo/WebApplicationSchema.tsx` -- new component
2. `src/components/seo/index.ts` -- add export
3. `src/pages/Compare.tsx` -- add WebApplicationSchema
4. `src/pages/ColorFinder.tsx` -- add WebApplicationSchema

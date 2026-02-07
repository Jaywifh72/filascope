
# SEO Overhaul: Unique Meta Descriptions, Canonical URLs, and Structured Data

## Overview

Audit and upgrade SEO elements across all FilaScope pages. The project already has significant SEO infrastructure in place -- this plan fills the gaps and upgrades generic descriptions to dynamic, data-driven ones.

## Current State (What Already Exists)

The project is NOT starting from zero. Here is what is already implemented:

- **Canonical URLs (Phase 2)**: DONE. The `CanonicalLink` component is rendered globally in `App.tsx` and strips query parameters (including `?region=`). No changes needed.
- **Product detail pages**: Both FilamentDetail and PrinterDetail already use `ProductSEO` and `ProductJsonLd` components with dynamic data (brand, price, specs, availability).
- **Brand detail pages**: Use `BrandSEO` with dynamic descriptions.
- **Homepage**: Has `WebSiteSchema` (with SearchAction) and `OrganizationSchema` JSON-LD, but NO `<Helmet>` tag for title/description (falls back to generic `index.html` defaults).
- **Brands listing**: Has `Helmet` and `ItemListSchema`.
- **Printers listing, Deals, Compare, Wizard, Slicer Guide, Repos**: All have `Helmet` with titles and descriptions, but descriptions are static/generic.
- **Legal pages** (About, Methodology, Privacy, Terms): Handled by `LegalPageLayout` which sets Helmet.
- **MaterialCompare**: Has NO Helmet at all.

## Phase 1: Unique Meta Descriptions

### Files to Modify

**1. `src/pages/Finder.tsx` (Homepage)**
- Add `Helmet` import and insert `<Helmet>` block with:
  - Title: "FilaScope -- Compare 3D Printer Filaments, Specs & Prices"
  - Description: "Compare 960+ 3D printer filaments with specs, pricing from 15+ retailers, and transmissivity data. Find the perfect material for your project."
- The `WebSiteSchema` and `OrganizationSchema` already render here -- no changes to those.

**2. `src/pages/Printers.tsx`**
- Update the existing `<Helmet>` description from generic to: "Compare 118 FDM and resin 3D printers with specs, prices, and build volumes. Find your next printer at the best price."

**3. `src/pages/Brands.tsx`**
- Update the existing `<Helmet>` description to: "Explore 48 3D printing filament brands. Compare product lines, pricing, and availability across regions."

**4. `src/pages/Deals.tsx`**
- Make the description dynamic using `totalDeals` and computed max discount from `groupedDeals`:
  - Description: "{totalDeals} active filament deals with discounts up to {maxDiscount}% off from top 3D printing brands. Updated daily."

**5. `src/pages/ReferenceSlicers.tsx`**
- Update the existing description to: "Compare 20 3D printing slicers with expert ratings, features, and pricing. Find your perfect slicer software."

**6. `src/pages/MaterialCompare.tsx`**
- Add `Helmet` import and `<Helmet>` block (currently has NONE):
  - Title: "Material Knowledge Base -- Filament Reference & Comparison | FilaScope"
  - Description: "Compare 3D printing material properties side by side. Explore strength, flexibility, temperature resistance, and printability across PLA, PETG, ABS, TPU, and more."

**7. `src/pages/Compare.tsx`**
- Update existing description to be more specific: "Compare 3D printing filaments side by side. Analyze material properties, pricing, scores, and specifications with our interactive comparison tool."

**8. `src/pages/Wizard.tsx`**
- Current description is already good. No change needed.

### No Changes Needed (already correct)
- FilamentDetail: Dynamic via `ProductSEO`
- PrinterDetail: Dynamic via `ProductSEO`
- BrandDetail: Dynamic via `BrandSEO`
- About, Methodology: Via `LegalPageLayout`
- HueForgeFinder, TDDatabase: Already have specific descriptions

## Phase 2: Canonical URLs

**No work needed.** The `CanonicalLink` component already:
- Renders globally in `App.tsx` inside `<BrowserRouter>`
- Uses `useLocation().pathname` (strips all query params including `?region=`)
- Removes trailing slashes
- Sets both `<link rel="canonical">` and `<meta property="og:url">`

Some individual pages (HueForgeFinder, TDDatabase, BrandComparePage) also set their own canonical -- those will be left as-is since Helmet merges and the page-specific ones take precedence.

## Phase 3: Structured Data (JSON-LD)

### Already Implemented (no changes)
- **Homepage**: `WebSiteSchema` with SearchAction + `OrganizationSchema`
- **FilamentDetail**: `ProductJsonLd` with full product data, offers, additionalProperty for TD values, temperature ranges, weight, diameter
- **PrinterDetail**: `ProductJsonLd` with build volume, print speed, printer type
- **Brands listing**: `ItemListSchema`
- **BrandDetail**: `BreadcrumbSchema` (via DetailBreadcrumb)
- **HueForgeFinder**: `ItemListSchema`
- **TDDatabase**: `DatasetSchema`

### New Schemas to Add

**1. `src/components/seo/SoftwareApplicationSchema.tsx` (NEW FILE)**
- New component for SoftwareApplication schema
- Props: `name`, `description`, `operatingSystem`, `applicationCategory`, `offers` (price), `aggregateRating`, `url`
- Will output valid Schema.org SoftwareApplication JSON-LD

**2. `src/pages/ReferenceSlicers.tsx`**
- Import and render `SoftwareApplicationSchema` for each slicer in the `slicerTierData` array
- Data mapping from existing `SlicerTierInfo`:
  - `name` from slicer name
  - `operatingSystem` from `platforms` array (joined)
  - `applicationCategory` = "DesignApplication"
  - `offers.price` from `priceType` (free = "0", freemium = "0", paid = `priceValue`)
  - `aggregateRating.ratingValue` from `overallScore`

**3. `src/components/seo/BrandOrganizationSchema.tsx` (NEW FILE)**
- New component for Organization schema specific to brands
- Props: `name`, `url`, `logo`, `description`, `productCount`
- Extends the existing `OrganizationSchema` pattern with brand-specific fields
- Used on BrandDetail page

**4. `src/pages/BrandDetail.tsx`**
- Import and render `BrandOrganizationSchema` with brand data (name, logo from `getBrandLogo()`, product count)

**5. `src/pages/Deals.tsx`**
- Add `ItemListSchema` for the active deals, listing top deals as Product items with price specification
- Each deal item includes: name, url (to filament detail page), image, description with discount

### Updated `src/components/seo/index.ts`
- Export the two new components: `SoftwareApplicationSchema`, `BrandOrganizationSchema`

## Summary of Changes

| File | Change Type | What |
|------|------------|------|
| `src/pages/Finder.tsx` | Add | Helmet with title + description |
| `src/pages/Printers.tsx` | Update | Meta description text |
| `src/pages/Brands.tsx` | Update | Meta description text |
| `src/pages/Deals.tsx` | Update | Dynamic meta description + ItemListSchema |
| `src/pages/ReferenceSlicers.tsx` | Update | Meta description + SoftwareApplicationSchema |
| `src/pages/MaterialCompare.tsx` | Add | Helmet (title + description) |
| `src/pages/Compare.tsx` | Update | Meta description text |
| `src/pages/BrandDetail.tsx` | Add | BrandOrganizationSchema |
| `src/components/seo/SoftwareApplicationSchema.tsx` | Create | New component |
| `src/components/seo/BrandOrganizationSchema.tsx` | Create | New component |
| `src/components/seo/index.ts` | Update | Export new components |

## Technical Notes

- All Helmet changes use `react-helmet-async` which is already in use throughout the project
- The `HelmetProvider` wraps the entire app in `App.tsx`
- Helmet supports tag deduplication -- page-level tags override `index.html` defaults
- The `CanonicalLink` component renders once at the router level, and page-specific canonicals (e.g., in `ProductSEO`) override it via Helmet's last-wins behavior
- No database migrations needed -- all data comes from existing queries and static configuration
- Schema validation can be tested using Google's Rich Results Test at `https://search.google.com/test/rich-results`

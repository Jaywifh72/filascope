
## Add 5 New Structured Data Schemas

### Current State Analysis

After reading all relevant files, here is exactly what already exists and what is truly missing:

**Already implemented:**
- `Finder.tsx` (homepage): Has `WebSiteSchema`, `OrganizationSchema`, and a generic `ItemListSchema` for displayed filaments (first 20 from the current filter result, unordered). This is NOT the "Trending Filaments" ItemList requested.
- `Deals.tsx`: Already has both `OfferCatalogSchema` AND `ItemListSchema` — the deal count is correctly wired. **No change needed here.** The request is already done.
- `Printers.tsx`: Has a generic `ItemListSchema` (name/url only). No `Product` schema per printer.
- `Compare.tsx`: Has `WebApplicationSchema` and `CompareActionSchema`. No `HowTo` schema.
- `MaterialHub.tsx`: Has `ArticleSchema` and `ItemListSchema` for top filaments. No `DefinedTerm` schema.

---

### Changes Required (4 pages, not 5 — Deals is already done)

**1. Homepage (`Finder.tsx`) — Replace generic ItemList with "Trending 3D Printer Filaments" ItemList**

The `TrendingSection` component already fetches trending filaments via its own `useTrendingFilaments()` hook with key `["trending-filaments", regionCode]`. The cleanest approach is to also consume this same query inside `Finder.tsx` using `useQueryClient` or a shared hook, but since `Finder.tsx` is already enormous (1,649 lines), the least invasive approach is to create a small `TrendingItemListSchema` component that calls `useTrendingFilaments` internally, mirroring exactly what `TrendingSection` already does — the data is already cached by React Query so there's no double-fetching.

Changes to `Finder.tsx`:
- Import a new `TrendingItemListSchema` component (created in `src/components/seo/`)
- Replace the existing generic `ItemListSchema` block (lines 1008–1019) with `<TrendingItemListSchema />` that emits the correct "Trending 3D Printer Filaments" name with `itemListOrder="Descending"` and up to 10 items

New file: `src/components/seo/TrendingItemListSchema.tsx`
- Imports `useTrendingFilaments` hook (extracted from `TrendingSection.tsx` or duplicated since the hook is defined inline)
- Imports `useRegion` for the region code
- Uses `ItemListSchema` to emit the correct JSON-LD

**2. Printers Page (`Printers.tsx`) — Add per-printer Product schema**

The existing `ItemListSchema` gives search engines a list of printer names and URLs but no rich `Product` data (price, brand, description, specs). The requested schema adds `Product` with `additionalProperty` for build volume, speed, and features.

Create a new component: `src/components/seo/PrinterListProductSchema.tsx`
- Accepts the first 10 filtered/displayed printers
- Emits a single JSON-LD array using `useJsonLdMultiple` with `@type: Product` for each printer
- Each Product includes: `name`, `brand` (Brand entity), `description`, `image`, `offers` (if price available), and `additionalProperty` array for build volume, max speed, enclosure, AMS

In `Printers.tsx`:
- Import `PrinterListProductSchema`
- Add it after the existing `ItemListSchema` (lines 625–633), passing the first 10 `filteredPrinters`

**3. Compare Page (`Compare.tsx`) — Add HowTo schema**

The `HowTo` schema is static — it describes how to use the comparison tool in general, not the specific filaments being compared. It should always render on this page regardless of what's loaded.

In `Compare.tsx`:
- Import `HowToSchema` from `@/components/seo`
- Add it alongside the existing `WebApplicationSchema` (after line 466) with the 3 static steps as specified in the request

**4. Material Hub (`MaterialHub.tsx`) — Add DefinedTerm schema**

The `DefinedTermSetSchema` component already exists but is not used on the material hub page. The hub has a `reference` object from `getMaterialReference()` that contains `fullName` (e.g., "Polylactic Acid") and rich description data in `strengths.whyChooseThis` and `strengths.uniqueProperties`.

In `MaterialHub.tsx`:
- Import `DefinedTermSetSchema` from `@/components/seo`
- Add it in the JSX after the existing `ArticleSchema` (line 846), wrapped with `{reference && ...}`
- Build the `DefinedTerm` from:
  - `name`: `${label} (${reference.fullName})` — e.g., "PLA (Polylactic Acid)"
  - `description`: `reference.strengths.whyChooseThis` or a fallback built from `strengths.uniqueProperties`
  - `url`: `https://filascope.com/materials/${slug}`
- Emit as a single-term `DefinedTermSet` with `name="3D Printing Materials"`

---

### Technical Details

**New file: `src/components/seo/TrendingItemListSchema.tsx`**

```text
- Uses useTrendingFilaments hook (requires extracting or re-declaring it)
- React Query key: ["trending-filaments", regionCode] — same key as TrendingSection, so data is cache-shared
- Maps to ItemListSchema with name="Trending 3D Printer Filaments", itemListOrder="Descending", up to 10 items
- Each item: { position, name, url: "https://filascope.com/filament/{product_handle || id}" }
```

**New file: `src/components/seo/PrinterListProductSchema.tsx`**

```text
- Accepts printers: Printer[] (the first 10 of filteredPrinters)
- Uses useJsonLdMultiple to emit multiple @type:Product schemas
- Product schema per printer:
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "{brand} {model_name}",
    "brand": { "@type": "Brand", "name": brand.brand },
    "description": "...",
    "image": scraped_data.images.product_images[0] || null,
    "offers": { "@type": "Offer", "price": current_price_usd_store, "priceCurrency": "USD", "availability": "InStock" },
    "additionalProperty": [
      { "@type": "PropertyValue", "name": "Build Volume", "value": "..." },
      { "@type": "PropertyValue", "name": "Max Print Speed", "value": "..." },
      ...
    ]
  }
```

**HowTo Steps in `Compare.tsx` (static, always rendered):**
```text
Step 1: "Select Filaments to Compare" — "Browse the FilaScope catalog and add 2 to 4 filaments using the Compare button on each product card."
Step 2: "Review Specs Side-by-Side" — "Compare temperature settings, TD values, tensile strength, price, and 20+ other specifications across all selected filaments."
Step 3: "Choose the Best Option" — "Click the buy button to purchase from the best retailer for your region, with affiliate-linked pricing."
```

---

### File Change Summary

| File | Action | Lines Affected |
|---|---|---|
| `src/components/seo/TrendingItemListSchema.tsx` | Create new | — |
| `src/components/seo/PrinterListProductSchema.tsx` | Create new | — |
| `src/pages/Finder.tsx` | Edit: replace ItemListSchema block, import new component | ~3 lines |
| `src/pages/Printers.tsx` | Edit: import + add PrinterListProductSchema | ~5 lines |
| `src/pages/Compare.tsx` | Edit: import HowToSchema + add 3 static steps | ~15 lines |
| `src/pages/MaterialHub.tsx` | Edit: import DefinedTermSetSchema + add DefinedTerm block | ~15 lines |

No database changes, no edge function changes, no new secrets required.

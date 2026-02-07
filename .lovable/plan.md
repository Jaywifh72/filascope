
# Upgrade Quick Match Wizard to Real FilaScope Product Data

## Overview

Replace the wizard's static material recommendations (hardcoded brand links, price ranges like "$18-30") with live product cards from the FilaScope database showing real images, regional prices, FilaScope scores, and affiliate purchase links.

## Current State

The wizard results page (lines 405-531 of `Wizard.tsx`) currently:
- Shows 3 material types scored by a `getRecommendations()` function (lines 191-398)
- Uses hardcoded price ranges ("$15-25", "$18-30") and static brand arrays linking to Finder URLs
- Has no awareness of actual product availability, pricing, or regional data
- "Refine Results" resets to Step 1 but preserves answers (already works)
- "Browse All" navigates to `/finder` with no material context

## Architecture

```text
+------------------+       +---------------------------+      +------------------+
|  Wizard Answers  | ----> |  useWizardRecommendations | ---> | WizardResults    |
|  (use_case,      |       |  (new custom hook)        |      | (new component)  |
|   printer,       |       |                           |      |                  |
|   priority,      |       |  - Ports material scoring |      | Per material:    |
|   budget,        |       |  - Queries filaments DB   |      |  - Match % badge |
|   special)       |       |  - Resolves regional price|      |  - 3-5 product   |
+------------------+       |  - Computes FilaScore     |      |    mini-cards    |
                           |  - Builds affiliate URLs  |      |  - Real price    |
                           +---------------------------+      |    range         |
                                                              |  - Buy CTA      |
                                                              +------------------+
```

## Files to Create (3 new files)

### 1. `src/hooks/useWizardRecommendations.ts`

Custom hook encapsulating all data-fetching and scoring logic.

**Material scoring**: Ports the existing `getRecommendations()` scoring logic (use case, priority, budget, special requirements, printer compatibility bonuses) into a `scoreMaterials()` function. Returns top 3 material types with match percentages, descriptions, and reasons.

**Material-to-database mapping**: Maps each wizard material type to actual `material` column values:
- PLA: `getMaterialsInCategory('pla-family')` -- covers PLA, PLA-Basic, PLA-Matte, PLA-Silk, etc.
- PETG: `getMaterialsInCategory('petg-family')`
- ABS: `getMaterialsInCategory('abs-family')`
- ASA: `getMaterialsInCategory('asa-family')`
- TPU: `getMaterialsInCategory('flexible')` -- covers TPU, TPU-95A, etc.
- PLA+: Direct match to `['PLA+', 'PLA+ 2.0', 'Standard PLA+']`

**Database query**: Single React Query call to `supabase.from('filaments').select(...)`:
- Filters: `material IN (all mapped values)`, `variant_available = true`, `net_weight_g >= 300`
- Budget filter on `variant_price` (USD column): budget < $20, mid $15-$40, premium > $30, any = no filter
- Abrasive filter: excludes `is_nozzle_abrasive = true` for Creality/Other printers
- Order by `variant_price ASC NULLS LAST`, limit 60 rows
- 5-minute React Query stale time for caching

**Client-side processing** per material group:
- Resolves regional prices via `resolveFilamentPrice()` using the `useRegion()` context
- Computes FilaScore via `calculateUnifiedScore()`
- Ranks by relevance: price source quality (30%), brand verification (25%), has image (20%), regional URL availability (15%), priority alignment (10%)
- Deduplicates by `product_line_id` (keeps best variant per product line)
- Takes top 5 per material type
- Computes actual min/max price range from resolved regional prices

**Affiliate URL generation**: Uses `useAffiliateLinks().getAffiliateUrl()` to tag the best regional product URL. Regional URL selected using the same `CURRENCY_TO_URL_COLUMN` mapping from `useRegionalPrice.ts`. Store name: "Amazon" if URL contains amazon, else "{Vendor} Store".

**Output shape**:
```text
WizardMaterialResult {
  material: string              -- "PLA", "PETG", etc.
  matchPercent: number          -- 98, 85, 63 etc.
  description: string           -- Material description
  whyRecommended: string[]      -- Scoring reasons
  difficulty: Easy/Moderate/Advanced
  priceRange: {min, max} | null -- From actual resolved prices
  formattedPriceRange: string   -- "C$21 - C$38"
  products: WizardProduct[]     -- 3-5 real products
  finderUrl: string             -- "/finder?material=PLA"
}

WizardProduct {
  id: string
  productTitle: string
  vendor: string
  material: string
  featuredImage: string | null
  colorHex: string | null
  formattedPrice: string | null       -- "C$28.99"
  formattedPricePerKg: string | null  -- "C$28.99/kg"
  isConverted: boolean                -- Show tilde prefix
  score: number | null                -- FilaScore 0-10
  detailUrl: string                   -- "/filament/{slug}"
  buyUrl: string | null               -- Affiliate link
  buyStoreName: string | null         -- "Amazon" or "Polymaker Store"
}
```

### 2. `src/components/wizard/WizardProductCard.tsx`

Compact product card component for the wizard results grid.

**Layout per card**:
```text
+------------------------------+
|  [Product Image / Swatch]    |
|  128px, fallback chain:      |
|  image -> color swatch ->    |
|  Package icon                |
+------------------------------+
|  Brand Logo + Brand Name     |
|  Product Title (2-line clamp)|
+------------------------------+
|  C$28.99     FilaScore 7.2   |
|  C$28.99/kg                  |
+------------------------------+
|  [View Details]  [Buy at X]  |
+------------------------------+
```

- Image: `OptimizedImage` from `src/components/ui/optimized-image.tsx` with `color_hex` swatch fallback, then Package icon
- Brand logo: `getBrandLogo()` from `src/lib/brandLogos.ts`
- Product title: cleaned via `cleanFilamentDisplayName()` from `src/lib/productNameUtils.ts`
- Price: formatted price with `~` prefix for converted prices
- FilaScore: colored via `getScoreNumberColor()` from `src/lib/unifiedFilamentScore.ts`
- "View Details": internal Link to `/filament/{slug}` using `generateFilamentSlug()`
- "Buy at X": external affiliate link, opens in new tab with `rel="noopener noreferrer"`

### 3. `src/components/wizard/WizardResults.tsx`

Dedicated results page component, extracted from `Wizard.tsx`.

**Props**: `answers` (wizard answer state) + `onRefine` callback

**Behavior**:
- Calls `useWizardRecommendations(answers)` internally
- Shows loading skeleton (3 groups x 3 shimmer cards) while data fetches
- Shows error state with retry button if query fails
- For each material recommendation:
  - Match badge (percentage in colored rounded square, same visual as current)
  - "Best Match" label on first result
  - Material name, description, computed price range (e.g., "C$21 - C$38 per spool")
  - "Why we recommend this" section with checkmark reasons
  - Horizontally scrollable row of 3-5 `WizardProductCard` components
  - Empty state per material if no products found
  - Per-material "Browse all {Material} filaments" link to `/finder?material={material}`
- Bottom actions:
  - "Refine Results" calls `onRefine()` -- sets `showResults = false`, preserves answers
  - "Browse All Filaments" navigates to `/finder`

## File to Modify (1 file)

### 4. `src/pages/Wizard.tsx`

- Remove `Recommendation` interface (lines 86-94)
- Remove `getRecommendations()` function (lines 191-398)
- Remove inline results rendering block (lines 405-531)
- Replace with: `if (showResults) return <WizardResults answers={answers} onRefine={handleRefine} />`
- Add import for `WizardResults`
- Remove unused imports moved to new components: `ExternalLink`, `Filter`, `Trophy`, `Lightbulb`, `Check`
- Keep: scroll-to-top logic, budget regionalization, question navigation, answer state

## No Changes Needed

- **Database schema**: Uses existing `filaments` table with existing columns
- **Existing utilities**: `resolveFilamentPrice.ts`, `useAffiliateLinks.tsx`, `materialHierarchy.ts`, `unifiedFilamentScore.ts`, `brandLogos.ts`, `productNameUtils.ts`, `seoSlugUtils.ts` -- all used as-is
- **No migrations required**

## Edge Cases

1. **No products found for a material**: Shows fallback message with link to Finder
2. **Exchange rates not loaded**: Hook waits for `hasRates` from RegionContext; shows skeleton until ready
3. **Missing images**: 3-tier fallback (featured_image -> color_hex swatch -> Package icon)
4. **Budget filtering with conversion**: DB query filters on USD `variant_price` column (always available); display uses regionalized prices via `resolveFilamentPrice`
5. **Performance**: Single Supabase query returning up to 60 rows, cached via React Query. Client-side grouping and ranking is lightweight

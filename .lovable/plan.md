

## Add Brand Page Answer Block

### What Changes

Add a single `<p>` element (40-60 words) in `src/pages/BrandDetail.tsx` immediately after the `<BrandHeroSection>` component and before the `<BrandBadgesDisplay>` section. This paragraph dynamically assembles all 7 requested data points from existing page data.

### Data Mapping

All data is already available in `BrandDetail.tsx`:

| Data Point | Source |
|---|---|
| Brand name | `displayName` |
| Products + variants | `groupedProducts.length` / `filaments.length` |
| Materials list | `availableMaterials` |
| Price range | `brandPriceRange` (already computed, line 556) + `formatPrice` from region context |
| Location | `brandInfo?.location` |
| Year founded | `brandInfo?.founded` |
| Live pricing | Always true (static statement) |

### Implementation

**File:** `src/pages/BrandDetail.tsx` (single change, ~20 lines inserted around line 705)

Insert a `<p>` element between `BrandHeroSection` and `BrandBadgesDisplay` that renders a flowing paragraph like:

> "Bambu Lab is a 3D printer filament manufacturer founded in 2021 and headquartered in Shenzhen, China. FilaScope indexes 40 Bambu Lab filament products (227 color variants) across 12 material types including PLA, PETG, ABS, ASA, TPU, and Nylon. Prices range from $14 to $149 with real-time pricing tracked from multiple retailers."

The paragraph conditionally includes founded/location clauses only when the data exists, and formats the price range using the existing `formatPrice` helper from the region context. Materials list shows up to 6 names with the total count.

### No other files modified


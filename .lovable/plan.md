

## Add "Product Prioritization" Tab to Affiliate Hub

### Overview
Add a 4th tab to the Affiliate Hub admin page with global prioritization controls, a brand-by-region priority matrix, and affiliate coverage gap analysis. This requires one schema migration, one data seed, and four new components.

### Database Changes

**Migration: Add `affiliate_priority_boost` column to `brand_regional_stores`**
- `ALTER TABLE brand_regional_stores ADD COLUMN affiliate_priority_boost integer NOT NULL DEFAULT 0;`
- This column stores 0-100 boost values per brand-region pair.

**Data Insert: Seed `site_settings` with `affiliate_prioritization` key**
- Insert a row with key `affiliate_prioritization` and JSON value:
  ```json
  { "enabled": false, "default_boost": 25, "max_boost": 100, "boost_deals_active": false }
  ```

### Schema Adaptation Notes
The user's description references columns/tables that don't exist as described. Here's how the plan maps to actual schema:
- **Affiliate status per brand/region**: Derived from `affiliate_programs` table (has `brand_id`, `region_code`, `is_active`) -- NOT from a `stores.affiliate_enabled` column.
- **Active deals with affiliate links**: Derived from `deals` table joining to `filaments` to get vendor/brand, checking `affiliate_link IS NOT NULL` and `end_date >= now()`.
- The `stores` table has `affiliate_tag`/`affiliate_network` but NOT `affiliate_enabled` or `priority` -- these won't be used.

### New Components

#### 1. `src/components/admin/affiliate-hub/ProductPrioritizationTab.tsx`
Main tab wrapper that composes the three sub-components below. Fetches data only when the tab is active (lazy via TabsContent).

#### 2. `src/components/admin/affiliate-hub/PrioritySettingsCard.tsx`
- Reads `site_settings` where key = `affiliate_prioritization`
- Master toggle: "Enable Affiliate Prioritization" with warning banner when off
- Numeric inputs for `default_boost` (0-100) and `max_boost` (0-100)
- Checkbox for `boost_deals_active`
- "Save Settings" button that updates the `site_settings` row via Supabase client
- Success toast on save

#### 3. `src/components/admin/affiliate-hub/BrandPriorityMatrix.tsx`
- Queries `brand_regional_stores` joined with `automated_brands` to get brand names and current `affiliate_priority_boost` values
- Queries `affiliate_programs` to determine affiliate status per brand/region
- Region columns derived from distinct `region_code` values in `brand_regional_stores` (currently: US, CA, EU, UK, AU, JP, CN)
- Each cell: editable compact number input + colored dot (green = has active affiliate program, gray = no affiliate, amber = has active deal but no affiliate)
- Dot tooltips show affiliate status details
- Filter buttons: "All Brands" / "Affiliated Only" / "No Affiliate"
- "Quick Set" dropdown with presets (set affiliated to 75, 50, reset all to 0, etc.) -- applies locally, requires explicit save
- "Save All Changes" button: batch-updates modified `affiliate_priority_boost` values via individual Supabase update calls; shows change count + success toast

#### 4. `src/components/admin/affiliate-hub/CoverageGapAnalysis.tsx`
- Queries `automated_brands` and cross-references with `affiliate_programs` to find:
  - Brands with zero affiliate programs (shown as amber warning cards)
  - Brands with partial regional coverage (shown as blue info cards listing missing regions)
- Summary row: "X of Y brands have affiliate programs" with a progress bar
- "Set Up Affiliate" links on gap cards (link to Brand Programs tab)

### Integration

**File: `src/pages/AdminAffiliateHub.tsx`**
- Import `ProductPrioritizationTab` and `TrendingUp` icon
- Add 4th `TabsTrigger` with value `prioritization` and label "Product Prioritization"
- Add corresponding `TabsContent` rendering `<ProductPrioritizationTab />`

### Data Flow
```text
site_settings (affiliate_prioritization)
       |
       v
PrioritySettingsCard (read/write global config)

brand_regional_stores + automated_brands + affiliate_programs
       |
       v
BrandPriorityMatrix (read stores, show affiliate status, edit boost values)

automated_brands + affiliate_programs
       |
       v
CoverageGapAnalysis (read-only gap report)
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/admin/affiliate-hub/ProductPrioritizationTab.tsx` | Tab wrapper |
| `src/components/admin/affiliate-hub/PrioritySettingsCard.tsx` | Global settings card |
| `src/components/admin/affiliate-hub/BrandPriorityMatrix.tsx` | Brand x region grid |
| `src/components/admin/affiliate-hub/CoverageGapAnalysis.tsx` | Gap analysis |

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/AdminAffiliateHub.tsx` | Add 4th tab trigger + content |

### Database Operations
| Type | Detail |
|------|--------|
| Migration | Add `affiliate_priority_boost` integer column to `brand_regional_stores` |
| Data insert | Seed `affiliate_prioritization` row in `site_settings` |


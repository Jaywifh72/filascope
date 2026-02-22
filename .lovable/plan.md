

## Refactor Pricing Data into Multi-Product Architecture

### Overview
Extract the 2,495-line `PricingData.tsx` into 12 focused files under `src/pages/admin/pricing/`, creating a product-type-agnostic architecture that supports filaments, printers, and accessories from a single UI.

### Files to Create

**1. `src/pages/admin/pricing/types.ts`**
- `ProductType` union: `'filament' | 'printer' | 'accessory'`
- `ProductTypeConfig` interface with all abstraction fields (tableName, brandField, nameField, typeField, urlField, regionalUrlFields, priceField, compareAtPriceField, hasColorSwatches, colorHexField, handleField, groupByStrategy, selectColumns, icon)
- `PRODUCT_TYPE_CONFIGS` constant mapping each product type to its config
- Existing interfaces moved here: `LinkStatus`, `TestResult`, `SyncResult`, `StoreRow` (renamed `allFilamentIds` to `allProductIds`), `ProductGroup` (renamed `vendor` to `brand`, `material` to `productSubtype`, `allFilamentIds` to `allProductIds`), `DiagnosisItem`, `DiagnosisResult`
- `REGION_FIELD_MAP` generalized: filaments keep per-currency price columns (`price_cad`, `price_eur`, etc.), printers/accessories use only `variant_price` for all regions (no per-currency columns)

**2. `src/pages/admin/pricing/constants.ts`**
- `REGION_CONFIG` (flag, currency, symbol, label)
- `BRAND_REGIONAL_CONFIGS` with `SubdomainConfig`/`PathConfig` types
- `deriveRegionalUrl()` function
- `COLOR_SUFFIXES_RE` regex and `cleanProductName()` function
- `REGION_URL_COLUMN_MAP`
- `computeLinkStatus()` function
- `formatCurrency()` function
- `generateLovablePrompt()` function

**3. `src/pages/admin/pricing/hooks/usePricingData.ts`**
- Takes `productType: ProductType` parameter
- Uses `PRODUCT_TYPE_CONFIGS[productType]` to dynamically query the correct table
- For filaments: paginated fetch with `product_line_id` grouping, per-currency price columns
- For printers: fetch with `brand_id` join to `printer_brands` for brand name, group by brand+model
- For accessories: fetch with `brand` field, group by brand+name
- Also fetches `activeStoreRegions`, `urlCache`, `priceChanges`, and `allBrands` (using config.brandField from config.tableName)
- Returns `{ productGroups, filtered, stats, isLoading, vendors }`

**4. `src/pages/admin/pricing/hooks/usePricingActions.ts`**
- Takes `productType`, `storeKeyMap`, `filtered`, `queryClient`
- Contains: `testSingleUrl`, `testBatch`, `syncSinglePrice`, `syncBatch`, `handleDiagnoseFailures`, `handleRetryTransient`, `handlePopulateRegionalUrls`, `handleClearInactiveStoreCache`, `handleSearchStore`, `handleSearchAllBroken`, `handleApplyAllFixes`
- For sync: calls `update_filament_price_after_refresh` RPC for filaments; for printers/accessories, does direct table update + price_history insert
- For fan-out: uses `config.tableName` to update other variants
- CSV export functions: `handleExportPricing`, `handleExportChanges`

**5. `src/pages/admin/pricing/hooks/usePricingFilters.ts`**
- Takes `productGroups` and returns `{ search, setSearch, vendorFilter, setVendorFilter, statusFilter, setStatusFilter, filtered }`
- Search placeholder text varies by product type

**6. `src/pages/admin/pricing/components/helpers.tsx`**
- `getLinkStatusBadge(status)`
- `getSyncMethodBadge(source)`
- `getTestResultBadge(result)`
- `getBypassMethodLabel(result)`
- `PriceChangeIndicator` component
- `SyncChangeIndicator` component
- `StatusSummary` component
- `ColorSwatches` component

**7. `src/pages/admin/pricing/components/PricingStatsBar.tsx`**
- Renders the 7 stat cards (total products, total stores, active, stale, broken, alerts, multi-region)
- Receives `stats` object and `onStatusFilter` callback

**8. `src/pages/admin/pricing/components/PricingToolbar.tsx`**
- Search input (placeholder varies by product type via config)
- Brand filter dropdown
- Status filter dropdown
- Bulk action buttons (test, sync, diagnose, export, clear inactive, populate URLs)
- Progress bars for bulk operations
- Expand/collapse all buttons
- Cancel button

**9. `src/pages/admin/pricing/components/PricingProductRow.tsx`**
- Parent row: shows product name, brand, subtype badge (material for filaments, category for accessories, nothing for printers)
- Color swatches only when `config.hasColorSwatches` is true
- Variant/color count badge
- Price range display
- Status summary

**10. `src/pages/admin/pricing/components/PricingStoreRow.tsx`**
- Child store row: region flag, brand+region label, price, compare-at, change indicator, currency, status badge, test result badge, sync method badge, last checked, action buttons (sync, test, external link)
- Product-type-agnostic -- same for all types

**11. `src/pages/admin/pricing/components/PricingTable.tsx`**
- Wraps the Table with header and maps over product groups
- Renders `PricingProductRow` + `PricingStoreRow` for expanded groups
- Shows "200 of N" truncation message

**12. `src/pages/admin/pricing/components/DiagnosisModal.tsx`**
- Extracted diagnosis Dialog with all its collapsible sections, search/apply-fix logic, copy-prompt buttons
- Receives `diagnosisResult`, `showModal`, `onClose`, search results state, and action callbacks

### Key Design Decisions

- **Printers brand lookup**: The `printers` table uses `brand_id` (FK to `printer_brands`), not a `brand` text field. The `usePricingData` hook will join `printer_brands` to get the brand name for display and filtering.
- **Printers have no per-currency price columns** (no `price_cad`, `price_gbp`, etc.). The `REGION_FIELD_MAP` for printers/accessories will use `variant_price` for all regions, with regional URLs still differentiated.
- **Grouping**: Filaments group by `product_line_id`. Printers group by `brand_id + model_name`. Accessories group by `brand + name`. Each strategy produces the same `ProductGroup` shape.
- **RPC fan-out**: Only filaments use the `update_filament_price_after_refresh` RPC. Printers and accessories will do direct updates via `.from(tableName).update(...)` plus a manual `price_history` insert with the correct `product_type` discriminator.
- **No changes to `PricingData.tsx`** in this step -- all new files only. The replacement happens in the next prompt.

### Technical Notes

- All 12 files import from each other and from existing project utilities (`@/integrations/supabase/client`, `@/lib/csvExport`, `@/hooks/useCurrentPrice`, etc.)
- The `ProductTypeConfig.selectColumns` string is used directly in `.select()` calls
- Lucide icons: `Palette` for filaments, `Printer` for printers, `Wrench` for accessories
- The hooks use React Query with query keys namespaced by product type: `['admin-pricing-data', productType]`


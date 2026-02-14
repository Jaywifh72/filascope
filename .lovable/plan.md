

# Consolidated Admin Data Quality Dashboard

## Overview
Create a unified `/old-admin/data-quality-dashboard` page that consolidates pricing health, broken links, regional coverage, and sync activity into a single view with real-time updates, CSV exports, and quick action sidebar.

## What Already Exists (will be reused, not duplicated)
- `AdminLayout`, `AdminPageHeader` -- standard admin page shell
- `AdminSidebar` -- add new nav entry
- `price_discrepancies` table -- pending review counts
- `brand_sync_logs` table -- recent sync activity
- `orchestration_runs` table -- last orchestrator run
- `OrchestrationControl` component -- manual sync trigger
- `PriceDiscrepancyQueue` component -- discrepancy review
- `BrandRegionMatrix` component -- regional coverage grid
- `get_brand_region_coverage` RPC -- coverage data
- `useBrokenProductUrls` hook -- broken link data
- `usePriceSync` hook -- trigger syncs
- `price_confidence` column on filaments -- freshness tiers
- `last_scraped_at` column on filaments -- staleness calculation
- Recharts already installed

## Implementation Steps

### 1. Create the Dashboard Page

New file: `src/pages/admin/DataQualityDashboard.tsx`

Uses `AdminLayout` + `AdminPageHeader` with icon `ShieldCheck`.

Layout structure:
- Left column (75%): Main content sections A-F
- Right column (25%): Quick action sidebar

### 2. Section A: Overview Metrics (Top Cards Row)

Five stat cards querying existing data:
- **Total Products**: `SELECT COUNT(*) FROM filaments`
- **Fresh Prices (<24h)**: `SELECT COUNT(*) FROM filaments WHERE price_confidence = 'high'`
- **Pending Reviews**: `SELECT COUNT(*) FROM price_discrepancies WHERE status IN ('pending','manual_review')`
- **Broken Links**: `SELECT COUNT(*) FROM broken_product_urls WHERE resolved_at IS NULL`
- **Avg Staleness**: Calculate from `last_scraped_at` distribution

All queries run in parallel on mount.

### 3. Section B: Stale Pricing Table

Reuses the pattern from `AdminPriceFreshness.tsx`:
- Query `filaments` where `last_scraped_at < NOW() - 7 days OR last_scraped_at IS NULL`
- Columns: Product, Brand, Region, Last Checked, Days Old, Action
- "Sync Now" button per row calls `get-current-price` via `usePriceSync`
- Filters: brand dropdown, staleness threshold (7d/14d/30d)
- Sort by days old descending
- Limited to 50 rows with "Show More" pagination

### 4. Section C: Broken Links

Reuses `useBrokenProductUrls` hook directly:
- Table: Product, Retailer URL, Error Date, Status
- Actions: "Re-check" (calls `get-current-price`), "Mark Discontinued" (sets `resolved_at`)
- Shows store breakdown from `stats.storeBreakdown`

### 5. Section D: Regional Coverage Matrix

Embeds existing `BrandRegionMatrix` component directly -- it already has the color-coded grid, click-to-expand, and sync triggers.

### 6. Section E: Price Confidence Distribution

New component using Recharts `PieChart`:
- Query: `SELECT price_confidence, COUNT(*) FROM filaments GROUP BY price_confidence`
- 5 slices: high (green), medium (yellow), low (orange), stale (red), unknown (gray)
- Click slice to filter the stale pricing table to that confidence tier

### 7. Section F: Recent Sync Activity

Query `brand_sync_logs` ordered by `started_at DESC LIMIT 20`:
- Columns: Brand, Type, Status, Duration, Products Updated, Started
- Badge colors: green=completed, red=failed, yellow=running
- Filter by brand, status

### 8. Quick Action Sidebar (Right Column)

Sticky positioned panel:
- "Run Full Sync" button (reuses `OrchestrationControl` trigger logic)
- "Review Price Changes" link to `/old-admin/inventory?tab=sync` (discrepancy queue)
- "Export Weekly Report" button (triggers CSV export)
- Last orchestration run timestamp from `orchestration_runs`
- Pending review count badge

### 9. CSV Export Functions

Utility function `downloadCSV(data, filename)`:
- Export stale products list
- Export price discrepancies
- Export broken links
Each converts query results to CSV blob and triggers browser download.

### 10. Real-time Updates

Subscribe to Supabase Realtime on:
- `filaments` table (price_confidence changes)
- `brand_sync_logs` table (new sync runs)
- `price_discrepancies` table (new discrepancies)

On change events, refetch the relevant stat cards and tables.

### 11. Route and Navigation

- Add route in `App.tsx`: `<Route path="/old-admin/data-quality-dashboard" element={<DataQualityDashboard />} />`
- Add sidebar entry in `AdminSidebar.tsx` under "Data Quality" group: `{ title: 'Quality Dashboard', href: '/old-admin/data-quality-dashboard', icon: ShieldCheck }`

## Files to Create
- `src/pages/admin/DataQualityDashboard.tsx` -- main page (~400 lines)
- `src/lib/csvExport.ts` -- CSV utility (~30 lines)

## Files to Modify
- `src/App.tsx` -- add route
- `src/components/admin/AdminSidebar.tsx` -- add nav item

## No Database Changes Required
All data comes from existing tables and columns.

## Technical Notes
- All queries use the existing Supabase client with RLS (admin-only via `has_role`)
- Recharts `PieChart` + `Cell` for the confidence distribution
- `useEffect` cleanup for Realtime channel subscriptions
- Responsive grid: 3-col on desktop, stacks on mobile
- The page consolidates views currently scattered across 6+ separate admin pages into one unified dashboard

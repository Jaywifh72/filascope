
# Comprehensive Nightly Price Sync Monitor

## Overview

Build a dedicated `/old-admin/sync-monitor` page that serves as the central command center for all price synchronization operations. This consolidates and extends the existing orchestration infrastructure (daily-price-orchestrator, OrchestrationControl, brand_sync_logs, orchestration_runs) into a comprehensive monitoring dashboard.

## What Already Exists (will be reused)

- `daily-price-orchestrator` edge function -- already handles nightly sync with tier-based scheduling
- `orchestration_runs` table -- tracks run status, brands synced/failed, products updated
- `brand_sync_logs` table -- per-brand sync records with detailed stats
- `broken_product_urls` table -- 404 tracking
- `OrchestrationControl` component -- manual trigger + progress bar
- `RecentSyncRuns` component -- paginated sync history with filters
- `BrandHealthGrid` component -- brand health cards
- `BrandRegionMatrix` component -- regional coverage grid
- `usePriceSync` hook -- single product sync trigger
- `useBrokenProductUrls` hook -- broken link queries
- `price_discrepancies` table -- price change review queue
- `get-current-price` edge function -- on-demand scraping
- `downloadCSV` utility -- CSV export

## Why NOT Create New Brand Scrapers

The request asks for a new `supabase/functions/brands/{brand}/` directory structure. However, the project already has 40+ dedicated brand sync functions (e.g., `sync-bambulab-products`, `sync-esun-products`, `sync-polymaker-products`, etc.) plus a multi-platform `scrape-brand-data` framework. Creating duplicate scrapers would conflict with the existing architecture. Instead, the new monitoring page will leverage these existing functions.

## Database Changes

### New Table: `scrape_errors`

Dedicated error tracking table (currently errors are embedded in `brand_sync_logs.error_details` JSON, which makes querying/filtering difficult).

```
scrape_errors
- id (uuid, PK)
- filament_id (uuid, FK to filaments, nullable)
- brand_slug (text, not null)
- region (text)
- error_type (text) -- '404', 'timeout', 'parse_error', 'rate_limit', 'network', 'selector_fail'
- error_message (text)
- url (text)
- sync_run_id (uuid, FK to brand_sync_logs, nullable)
- is_resolved (boolean, default false)
- resolved_at (timestamptz)
- created_at (timestamptz, default now())
```

RLS: Admin-only read/write via `has_role(auth.uid(), 'admin')`.

Enable realtime on this table for live error streaming.

### No Other Schema Changes

All other data needs (sync history, brand health, orchestration tracking) are already served by existing tables.

## Implementation Plan

### 1. Create Database Migration

- Create `scrape_errors` table with indexes on `brand_slug`, `error_type`, `created_at`
- Add RLS policies (admin-only)
- Enable realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE scrape_errors`

### 2. Create Admin Page: `src/pages/admin/SyncMonitor.tsx`

A single large page component with tab-based navigation across 6 sections. Uses `AdminLayout` + `AdminPageHeader` with `Activity` icon.

**Layout**: Full-width with top stats cards, then tabbed sections below.

#### Section A: Overview Dashboard (always visible at top)

Five stat cards in a row:
- **Last Sync Status**: Query `orchestration_runs` latest row; show status badge + timestamp
- **Products Synced Today**: Query `brand_sync_logs` where `started_at > today`, sum `products_updated`
- **Active Errors**: Count from `scrape_errors` where `is_resolved = false`
- **Avg Sync Duration**: Average `duration_seconds` from last 30 `orchestration_runs`
- **Next Scheduled Sync**: Calculate from last completed run + 24h, show countdown using `setInterval`

#### Section B: Sync History Tab

Reuse and extend `RecentSyncRuns` pattern:
- Query last 30 runs from `orchestration_runs` (not just `brand_sync_logs`)
- Expandable rows showing per-brand breakdown from `summary.brand_results` JSON
- Actions: "Re-run" triggers `daily-price-orchestrator` with manual flag; "Download" exports run details as CSV

#### Section C: Live Sync Monitor Tab

- Conditionally renders when latest `orchestration_runs` status = 'running'
- Realtime subscription on `orchestration_runs` for progress updates
- Shows: animated progress bar, current brand count vs total, products updated counter
- Live error feed: realtime subscription on `scrape_errors` filtered by current run, shows new errors as they arrive
- Estimated time remaining: `(elapsed / brands_synced) * brands_remaining`

#### Section D: Brand Health Matrix Tab

Embed existing `BrandRegionMatrix` component directly (already has color-coded cells, click-to-expand, sync triggers). Add a row of aggregate stats at top.

#### Section E: Recent Errors Tab

New component querying `scrape_errors`:
- Table: Time, Product, Brand, Region, Error Type, URL
- Filters: brand dropdown, region dropdown, error type dropdown, date range
- Bulk actions: "Mark Resolved" (sets `is_resolved = true`), "Retry" (calls `get-current-price`)
- Pattern detection: Group by `brand_slug + region` and show alert if >5 errors from same source

#### Section F: Stale Products Tab

Query `filaments` where `last_scraped_at < NOW() - 48h OR last_scraped_at IS NULL`:
- Columns: Product, Brand, Last Checked, Days Stale, Reason
- "Reason" derived from: never synced, repeated failures (join `scrape_errors`), disabled brand
- Actions: "Sync Now" per row (calls `get-current-price`), "Sync Brand" button

#### Section G: Manual Sync Controls (sidebar/panel)

Sticky panel at right side or bottom of page:
- "Run Full Sync" button (reuses `OrchestrationControl` trigger logic)
- "Sync Single Brand" dropdown populated from `automated_brands`
- "Sync Single Product" search input with autocomplete from `filaments`
- Last orchestration timestamp
- "Review Price Changes" link to `/old-admin/inventory?tab=sync`

#### Section H: Performance Charts

Recharts visualizations:
- Line chart: sync duration over last 30 days (from `orchestration_runs`)
- Bar chart: products synced per day (from `brand_sync_logs` aggregated by date)
- Success rate line (successful / total per day)

### 3. Real-time Subscriptions

Subscribe to:
- `orchestration_runs` -- updates overview cards + live monitor
- `scrape_errors` -- live error feed during active sync
- `brand_sync_logs` -- sync history updates

All channels cleaned up on unmount.

### 4. CSV Exports

Using existing `downloadCSV` utility:
- Export sync history
- Export error log
- Export stale products list

### 5. Route and Navigation

- Add lazy import + route in `App.tsx`: `/old-admin/sync-monitor`
- Add sidebar entry in `AdminSidebar.tsx` under "Operations" group: `{ title: 'Sync Monitor', href: '/old-admin/sync-monitor', icon: Activity }`

## Files to Create

| File | Purpose | Approx Size |
|------|---------|-------------|
| `src/pages/admin/SyncMonitor.tsx` | Main page with all 8 sections | ~700 lines |
| Migration SQL | `scrape_errors` table + RLS + realtime | ~40 lines |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add lazy import + route |
| `src/components/admin/AdminSidebar.tsx` | Add "Sync Monitor" nav item |

## Technical Notes

- All queries use existing Supabase client with RLS (admin-only)
- Recharts already installed for charts
- The page is intentionally a single file to keep related sync monitoring logic co-located
- Countdown timer for "Next Sync" uses `setInterval` with cleanup
- Error pattern detection is client-side grouping (no new DB function needed)
- Brand scraper architecture is NOT duplicated -- the monitoring page surfaces data from the 40+ existing sync functions

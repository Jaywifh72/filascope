

# Phase 3: Price Sync and Monitoring for /admin/pricing-data

## Overview

Add price resync capabilities to the existing Pricing Data dashboard, leveraging the already-built `get-current-price` edge function and `useAdminPriceRefresh` hook. No new edge function needed -- the infrastructure exists.

## Scope (Pragmatic Cut)

Given the massive spec, this plan focuses on the high-impact items that can be built reliably with existing infrastructure. Deferred items (scheduling, Web Workers, email notifications) are noted at the end.

---

## 1. Per-Row "Resync Price" Button

Add a refresh/dollar icon button next to the existing Test Link button in the Actions column.

- Calls `get-current-price` edge function via `supabase.functions.invoke`
- Shows spinner while syncing
- On success: updates the price cell inline, shows toast with old/new price
- On failure: shows error toast, does not update price
- Skips if link status is "broken" (no point syncing a dead link)

## 2. Enhanced Price Change Indicator

Upgrade the Change column with richer tooltips:

- Tooltip shows: "Was $25.99, now $29.99 (+$4.00)"
- Rows with >10% change get a subtle background highlight
- Existing arrow indicators (up red / down green / unchanged dash) remain

## 3. Bulk "Resync Selected Prices" Button

Add to the existing bulk toolbar alongside "Test Selected" and "Test All Stale":

- "Resync Selected" button -- syncs all checked products sequentially (batches of 2 to avoid rate limits)
- Reuses the same progress bar infrastructure from link testing
- Progress text: "Syncing prices: 15/50"
- Summary toast: "Updated 12 prices, 8 unchanged, 3 failed"
- Cancel button to abort

## 4. Bulk "Resync Stale Prices" Button

- Targets products where `last_scraped_at` is older than 7 days or null
- Badge showing stale count
- Same batch processing as Resync Selected

## 5. Price Sync State Management

New state alongside `testResults`:

```text
syncResults: Map<string, {
  status: 'syncing' | 'success' | 'failed' | 'unchanged'
  oldPrice?: number
  newPrice?: number
  percentChange?: number
  error?: string
}>
```

- `bulkSyncing` boolean + `bulkSyncProgress` for progress bar
- Separate `abortSyncRef` for cancellation

## 6. Toast Notifications

- No change: "Price confirmed: $29.99"
- Increased: "Price increased: $25.99 -> $29.99 (+15%)"
- Decreased: "Price decreased: $29.99 -> $24.99 (-17%)"
- Error: "Failed to sync price - [error message]"
- Bulk complete: "Synced 50 prices: 12 updated, 35 unchanged, 3 failed"

## 7. CSV Export Buttons

Add two export buttons to the toolbar:

- "Export Pricing Report" -- exports filtered table data as CSV (product, brand, status, all currencies, last sync, change %)
- "Export Price Changes" -- exports only rows with non-zero price changes

Uses existing `src/lib/csvExport.ts` utility.

## 8. Updated Stats Cards

Replace/enhance the existing 6 stat cards:

- Keep: Total Products, Active Links, Stale Links, Broken Links, Price Alerts, Multi-Region
- Make Price Alerts card clickable to filter the table to alert status

---

## Technical Details

### Files Modified

1. **`src/pages/admin/PricingData.tsx`** -- All UI changes:
   - New state for sync results, bulk sync progress
   - `syncSinglePrice` callback invoking `get-current-price`
   - `syncBatch` callback for bulk operations
   - Resync button in Actions column
   - Resync Selected / Resync Stale buttons in toolbar
   - Export buttons
   - Enhanced PriceChangeIndicator tooltips
   - Row highlighting for large changes

### No New Edge Functions

The existing `get-current-price` edge function (2654 lines) already handles:
- Shopify API extraction
- HTML price scraping with Firecrawl fallback
- Currency detection
- Stock status detection
- Rate limiting and retry logic

The existing `useAdminPriceRefresh` hook pattern will be adapted inline (not used directly since it's tied to a single filament lifecycle).

### No Database Changes

The existing schema already has:
- `filaments.last_scraped_at` -- updated on sync
- `filaments.variant_price` / `variant_compare_at_price` -- price storage
- `price_history` table -- tracks all price changes (auto-populated by `auto_log_price_change` trigger)
- `update_filament_price_after_refresh` RPC -- atomic admin price update with history logging

### Price Sync Flow

```text
1. User clicks Resync on row
2. Frontend calls get-current-price with { productUrl, forceRefresh: true }
3. Edge function scrapes price, returns { price, compareAtPrice, currency }
4. Frontend calls update_filament_price_after_refresh RPC to persist
5. UI updates inline with animation
6. Toast shows result
```

---

## Deferred (Not in This Phase)

- Schedule Auto-Sync toggle (requires pg_cron setup, separate admin settings page)
- Expandable price history per row (adds significant complexity to table)
- Price alert "Mark as Reviewed" workflow
- Sync Health dashboard card with success rate
- Out of Stock tracker grouping
- Web Workers for price parsing
- Pause/Resume for bulk operations
- Email notifications

These can be added incrementally in future phases.


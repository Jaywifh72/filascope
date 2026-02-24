

# Add Verbose Sync Log with Copy-to-Clipboard on /admin/pricing-data

## What this does

After any batch sync (selected stores or stale stores) completes on the Pricing Data page, a collapsible "Sync Log" panel appears below the pricing table. It shows a detailed text report of every result -- successes, failures, price changes, and unchanged prices -- with a one-click "Copy Log" button. This works identically across all three tabs (Filament, Printer, Accessory).

## How it will look

Below the `PricingTable`, a new collapsible card appears after any sync completes:
- Header: "Sync Log (N entries)" with a Copy button
- Body: monospace pre-formatted text block with full verbose log
- Auto-expands when there are failures
- Resets when switching tabs

Log format:

```text
=== PRICING DATA SYNC LOG ===
Timestamp: 2026-02-24T17:30:00Z
Product Type: Printers
Summary: 35 synced — 28 updated, 4 unchanged, 3 failed

--- FAILURES ---

[FAILED] Elegoo Neptune 3 Pro — US
  URL: https://us.elegoo.com/products/elegoo-neptune-3-pro-fdm-3d-printer-225x225x280mm
  Error: No valid price extracted

[FAILED] Creality Ender 3 V3 — CA
  URL: https://ca.elegoo.com/products/ender-3-v3
  Error: 404 Not Found

--- PRICE CHANGES ---

[UPDATED] Elegoo Centauri Carbon — CA: $429.00 -> $449.00 (+4.7%)
[UPDATED] Elegoo Neptune 4 Max — UK: £369.00 -> £377.00 (+2.2%)

--- UNCHANGED ---

[OK] Elegoo Centauri Carbon — US: $289.00
[OK] Elegoo Neptune 4 — AU: A$399.00
...
```

## Technical Plan

### 1. New component: `src/pages/admin/pricing/components/SyncLogPanel.tsx`

A self-contained component that:
- Takes `syncResults` (Map), `productGroups`, `productType`, and a `visible` flag
- Generates the verbose log text from the map data
- Renders a Collapsible card with Copy button
- Auto-opens when failures exist

### 2. Modify: `src/pages/admin/PricingData.tsx`

- Import `SyncLogPanel`
- Add state: `syncLogVisible` (boolean) -- set to `true` when a batch sync completes
- Reset `syncLogVisible` on tab change
- Pass `actions.syncResults`, `productGroups`, `activeType`, and `syncLogVisible` to `SyncLogPanel`
- Place `SyncLogPanel` after `PricingTable`

### 3. Modify: `src/pages/admin/pricing/hooks/usePricingActions.ts`

- Add a callback `onSyncBatchComplete` (optional) that fires at the end of `syncBatch`
- Alternatively, expose a `lastSyncBatchTimestamp` state that the parent can watch to know when a batch finishes
- The simplest approach: add a `syncBatchCompleteCount` counter state that increments after each batch, so the parent can use it as a trigger

### No backend changes needed
All data comes from the existing `syncResults` Map and `StoreRow` objects already in memory.


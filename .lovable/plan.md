
# Add Verbose Sync Log with Copy-to-Clipboard

## What this does

After every price sync completes (per-brand or all-brands), a detailed verbose text log is generated and displayed in a collapsible panel. The log includes every failure, skip, anomaly, and error with full context. A "Copy to Clipboard" button lets you grab the entire log instantly.

## How it will look

Below the existing "Price Changes" diff table, a new collapsible card titled "Sync Log" appears (auto-expanded when there are errors). It contains:
- A pre-formatted monospace text block with the full verbose log
- A "Copy Log" button in the card header that copies the entire log text

The log format:

```text
=== PRICE SYNC LOG ===
Timestamp: 2026-02-24T17:30:00Z
Brands synced: All | elegoo
Summary: 42 checked, 35 updated, 3 skipped, 2 errors, 1 anomaly, 1 manual-only

--- FAILURES & ISSUES ---

[ERROR] Elegoo Neptune 3 Pro (elegoo) — US
  Status: extraction_failed
  Method: shopify_json
  Error: No valid price extracted
  URL: https://us.elegoo.com/products/elegoo-neptune-3-pro-fdm-3d-printer-225x225x280mm

[ANOMALY] Creality Ender 3 V3 (creality) — CA
  Status: anomaly_rejected (critical)
  Method: json_ld
  Error: Critical price anomaly detected
  Reason: Cross-region ratio 0.12 vs US price
  Old Price: $199.00 → New Price: $24.99

[SKIPPED] Bambu Lab X1C (bambu-lab)
  Reason: manual_only

[SKIPPED] Prusa MK4S (prusa)
  Reason: No product URL or discontinued

--- ALL RESULTS ---

[OK] Elegoo Centauri Carbon — US: $289.00 (shopify_json, unchanged)
[OK] Elegoo Centauri Carbon — CA: C$449.00 (shopify_json, updated, +3.2%)
[OK] Elegoo Centauri Carbon — UK: £259.00 (shopify_json, new)
...
```

## Technical Plan

### File to modify: `src/pages/admin/PriceSync.tsx`

1. **Add imports**: `Copy`, `Check`, `FileText` from lucide-react

2. **Add `generateVerboseLog` function** that takes a `SyncResponse` and produces a formatted string:
   - Header with timestamp and summary stats
   - "FAILURES & ISSUES" section: all errors, anomalies, skipped items with full detail (status, method, error message, URL, old/new price, anomaly reason)
   - "ALL RESULTS" section: every printer/region result on one line

3. **Add state**: `logOpen` (boolean), `logCopied` (boolean)

4. **Add UI section** after the diff view collapsible:
   - Collapsible card with "Sync Log ({n} entries)" title
   - Copy button in header
   - `<pre>` block with the generated log text, styled with `font-mono text-xs bg-muted p-4 rounded overflow-auto max-h-[600px]`
   - Auto-opens when errors > 0

5. **Wire up copy handler**: uses `navigator.clipboard.writeText()`, shows checkmark for 2s after copy

### No database or edge function changes needed
This is purely a frontend formatting feature using data already returned by the sync endpoint.

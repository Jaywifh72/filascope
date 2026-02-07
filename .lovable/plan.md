
# Fix Sticky Bar and Mobile Bottom Bar Regional Store Alignment

## Problem Analysis

Three components display pricing on the filament detail page, and they currently source their data differently:

| Component | Store Name Source | Price Source | Store/Region Source |
|-----------|------------------|-------------|---------------------|
| **Sidebar** (desktop) | `sidebarBest.name` via `sidebarRegionalPrice` | `sidebarPricePerKg` (from `sidebarBest`) | `sidebarRegionalPrice.store.regionCode` |
| **Mobile Bottom Bar** | `sidebarRetailerName` (correct) | `sidebarPricePerKg` (correct) | `sidebarBest?.storeRegion` (correct) |
| **Sticky Buy Bar** | `filament.vendor` (WRONG - hardcoded) | `sidebarPricePerKg` (correct) | No region awareness at all |

The `sidebarBest` calculation (lines 257-406 in FilamentDetail.tsx) is a well-designed unified best-price resolver that collects candidates from 4 sources (filament_listings, store pricing RPC, brand regional stores, and legacy Amazon), converts them all to the user's currency, and picks the cheapest local store (falling back to international). The sidebar and mobile bottom bar already receive this data. **The sticky buy bar does not.**

### Root Causes

1. **StickyBuyBar hardcodes vendor as store name**: Line 184 shows `{filament.vendor || 'Store'}` in the CTA button. It has no `storeName` prop -- it always displays the filament's brand name, not the actual best-price retailer.

2. **StickyBuyBar has no "from [Store]" display**: Unlike the mobile bottom bar which shows "from Polymaker Canada", the sticky bar shows no store attribution at all.

3. **Mobile bottom bar `isConverted` is wrong**: Line 1107 passes `isConverted={unifiedPricing.isConverted}` which reads from the `useUnifiedRegionalPricing` hook (Source 3 only), ignoring whether `sidebarBest` came from a listing or store pricing source. Should use `sidebarBest?.isConverted`.

4. **"Amazon US us" duplication**: The `retailer_name` from the `retailers` table may already contain "Amazon US". When the mobile bar then appends a region flag for non-local stores, if the regionFlags lookup fails (e.g., region code is lowercase or unexpected), it produces empty text or a raw code like "us" next to the already-suffixed name. The fix is to strip region suffixes from store names before display.

## Changes

### 1. Update `StickyBuyBar` to accept store info props
**File:** `src/components/filament/StickyBuyBar.tsx`

Add new props:
- `storeName?: string` -- the best retailer's display name
- `storeRegion?: string` -- the store's region code (for flag/local detection)

Changes to the component:
- In the desktop CTA button (line 184), replace `{filament.vendor || 'Store'}` with `{storeName || filament.vendor || 'Store'}`
- In the desktop price section (around line 150-155), add a small "from [StoreName]" attribution line below the price, matching the mobile bottom bar's format
- In the mobile CTA button (line 248), add the store name display

### 2. Pass `sidebarBest` data to `StickyBuyBar`
**File:** `src/pages/FilamentDetail.tsx`

Update the `StickyBuyBar` render (lines 1218-1226) to pass:
- `storeName={sidebarRetailerName}` -- already computed at line 860
- `storeRegion={sidebarBest?.storeRegion || unifiedPricing.storeRegion}` -- same pattern used for mobile bar
- `isConverted={sidebarBest?.isConverted ?? unifiedPricing.isConverted}` -- fix to use sidebarBest first

### 3. Fix mobile bottom bar `isConverted` prop
**File:** `src/pages/FilamentDetail.tsx`

Change line 1107 from:
```
isConverted={unifiedPricing.isConverted}
```
to:
```
isConverted={sidebarBest?.isConverted ?? unifiedPricing.isConverted}
```

This ensures the conversion indicator matches the actual price source displayed.

### 4. Clean store name to prevent region code duplication
**File:** `src/components/filament/sidebar/FilamentMobileBottomBar.tsx`

Add a small utility to strip trailing region codes from store names before rendering, since the region is already shown via the flag:
```typescript
// Remove trailing region codes like "Amazon US" -> "Amazon"
// (only when we're already showing the flag separately)
const cleanStoreName = showRegionFlag
  ? storeName.replace(/\s+(US|UK|EU|CA|AU|JP|CN|DE)$/i, '')
  : storeName;
```

Apply the same logic in `StickyBuyBar.tsx` for consistency.

## Files Changed

| File | Change |
|------|--------|
| `src/components/filament/StickyBuyBar.tsx` | Add `storeName`, `storeRegion` props; show store attribution; use store name in CTA |
| `src/pages/FilamentDetail.tsx` | Pass `storeName`, `storeRegion`, fix `isConverted` on both sticky bar and mobile bar |
| `src/components/filament/sidebar/FilamentMobileBottomBar.tsx` | Clean store name to prevent region duplication |

## Verification

After implementation, the following should hold true:
- Desktop sticky bar shows: `$21.26/kg` + "from Polymaker Canada" + CTA "BUY NOW | Polymaker Canada"
- Mobile bottom bar shows: `$21.26/kg` + "from Polymaker Canada" + CTA "Buy at Polymaker Canada"
- Sidebar shows: Same store and price as above
- When region switches to US, all three update together to show the US best price
- No "Amazon US us" duplication -- store names are cleaned when flags are shown separately

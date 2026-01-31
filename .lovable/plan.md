# Plan: Printer Regional Pricing Fix

## Problem
PrinterDetail.tsx uses `useUnifiedRegionalPricing` but doesn't pass regional data to PurchaseSidebar or MobileBottomBar. This means printers don't show "Ships from [Country]" warnings when falling back to non-local stores.

## Files to Modify

### 1. `src/components/printer/PurchaseSidebar.tsx`
**Current state:** Doesn't accept regional props
**Changes needed:**
- Add new props: `isLocalStore`, `storeRegion`, `shipsFromCountry`
- Add "Ships from" warning UI (copy pattern from FilamentPurchaseSidebar lines 300-313)
- Import REGIONS config for flag/name lookup

### 2. `src/components/printer/MobileBottomBar.tsx`  
**Current state:** Doesn't show regional warnings
**Changes needed:**
- Add new props: `isLocalStore`, `storeRegion`, `shipsFromCountry`
- Add compact "Ships from" indicator if space allows

### 3. `src/pages/PrinterDetail.tsx`
**Current state:** Calls useUnifiedRegionalPricing but only uses `storeUrl`
**Changes needed:**
- Extract `isLocalStore`, `storeRegion`, `shipsFromCountry` from unifiedPricing
- Pass these to PurchaseSidebar (lines 975-996)
- Pass these to MobileBottomBar (lines 1006-1016)

## Reference Pattern (FilamentPurchaseSidebar lines 300-313)
```tsx
{!isLocalStore && storeRegionCode && (
  <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-1.5 rounded-md">
    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
    <div className="flex flex-col">
      <span className="font-medium">
        {storeRegionFlag} {REGIONS[storeRegionCode]?.name || storeRegionCode} store
      </span>
      {shipsFromCountry && (
        <span className="text-amber-400/80">
          Ships from {shipsFromCountry}
        </span>
      )}
    </div>
  </div>
)}
```

## Implementation Order
1. Update PurchaseSidebar.tsx props and UI
2. Update MobileBottomBar.tsx props and UI  
3. Update PrinterDetail.tsx to pass the new props

## Testing
- Switch to Canada region
- View a printer from a brand WITHOUT a CA store (e.g., Bambu Lab)
- Verify "Ships from USA" warning appears
- Verify price is still shown in CAD

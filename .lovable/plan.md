
# Fix Printer Regional Pricing to Match Filaments

## Problem Summary
`PrinterDetail.tsx` correctly uses `useUnifiedRegionalPricing` hook but doesn't pass the regional metadata (`isLocalStore`, `storeRegion`, `shipsFromCountry`) to `PurchaseSidebar` or `MobileBottomBar`. This means printers don't show "Ships from [Country]" warnings when falling back to non-local stores, unlike filaments which already have this working.

## Reference Implementation (Filaments)

From `FilamentPurchaseSidebar.tsx` (lines 221-227, 299-313):
```tsx
// Derive store region from regional price result
const storeRegionCode = regionalPriceResult?.store?.regionCode;
const storeRegionFlag = storeRegionCode ? REGIONS[storeRegionCode]?.flag : null;

// Compare to user region
const { region: userRegion } = useRegion();
const isLocalStore = storeRegionCode === userRegion;

// Warning UI
{!isLocalStore && storeRegionCode && (
  <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-1.5 rounded-md">
    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
    <div className="flex flex-col">
      <span className="font-medium">
        {storeRegionFlag} {REGIONS[storeRegionCode]?.name} store
      </span>
      {regionalPriceResult?.store?.shipsFrom && (
        <span className="text-amber-400/80">
          Ships from {regionalPriceResult.store.shipsFrom}
        </span>
      )}
    </div>
  </div>
)}
```

---

## Files to Modify

### 1. `src/components/printer/PurchaseSidebar.tsx`

**Current Interface (lines 8-28):**
```tsx
interface PurchaseSidebarProps {
  printer: { ... };
  brand: string | null;
  displayPrice: number | null | undefined;
  displayMsrp: number | null | undefined;
  // ... other props
  // MISSING: Regional props
}
```

**Changes:**
- Add 3 new optional props: `isLocalStore`, `storeRegion`, `shipsFromCountry`
- Import `Globe` icon and `REGIONS` config
- Add "Ships from [Country]" warning UI between Price Section and CTA Buttons

**New Props:**
```tsx
isLocalStore?: boolean;
storeRegion?: string | null;
shipsFromCountry?: string | null;
```

**New UI (after line 73, before CTA Buttons):**
```tsx
{/* Fallback Region Warning */}
{!isLocalStore && storeRegion && (
  <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-2 rounded-md">
    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
    <div className="flex flex-col gap-0.5">
      <span className="font-medium">
        {REGIONS[storeRegion as RegionCode]?.flag} {REGIONS[storeRegion as RegionCode]?.name || storeRegion} store
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

---

### 2. `src/components/printer/MobileBottomBar.tsx`

**Current Interface (lines 6-15):**
```tsx
interface MobileBottomBarProps {
  price: number | null | undefined;
  msrp?: number | null;
  // ... other props
  // MISSING: Regional props
}
```

**Changes:**
- Add 3 new optional props: `isLocalStore`, `storeRegion`, `shipsFromCountry`
- Import `Globe` icon and `REGIONS` config  
- Add compact "Ships from" indicator in the price section

**New Props:**
```tsx
isLocalStore?: boolean;
storeRegion?: string | null;
shipsFromCountry?: string | null;
```

**New UI (compact indicator below price, inside line 63-84 section):**
```tsx
{/* Fallback region indicator */}
{!isLocalStore && shipsFromCountry && (
  <div className="flex items-center gap-1 text-xs text-amber-400 mt-0.5">
    <Globe className="w-3 h-3" />
    <span>Ships from {shipsFromCountry}</span>
  </div>
)}
```

---

### 3. `src/pages/PrinterDetail.tsx`

**Current Code (lines 971-996):**
```tsx
// Use regional store URL if available, otherwise fall back to original
const regionalStoreUrl = unifiedPricing.storeUrl || printer.official_store_url;

return (
  <PurchaseSidebar
    printer={{...}}
    brand={brand}
    displayPrice={displayPrice}
    // ... other props
    // MISSING: isLocalStore, storeRegion, shipsFromCountry
  />
);
```

**Changes:**
- Pass `unifiedPricing.isLocalStore` as `isLocalStore` prop
- Pass `unifiedPricing.storeRegion` as `storeRegion` prop
- Pass `unifiedPricing.shipsFromCountry` as `shipsFromCountry` prop
- Apply same changes to `MobileBottomBar` (lines 1006-1016)

**Updated PurchaseSidebar call:**
```tsx
<PurchaseSidebar
  printer={{...}}
  brand={brand}
  displayPrice={displayPrice}
  displayMsrp={displayMsrp}
  // ... existing props
  isLocalStore={unifiedPricing.isLocalStore}
  storeRegion={unifiedPricing.storeRegion}
  shipsFromCountry={unifiedPricing.shipsFromCountry}
/>
```

**Updated MobileBottomBar call:**
```tsx
<MobileBottomBar
  price={displayPrice}
  msrp={displayMsrp}
  // ... existing props
  isLocalStore={unifiedPricing.isLocalStore}
  storeRegion={unifiedPricing.storeRegion}
  shipsFromCountry={unifiedPricing.shipsFromCountry}
/>
```

---

## Technical Details

### Data Flow
```text
useUnifiedRegionalPricing hook
         │
         ├── isLocalStore: boolean
         ├── storeRegion: RegionCode
         └── shipsFromCountry: string | null
                    │
    ┌───────────────┴───────────────┐
    ▼                               ▼
PurchaseSidebar               MobileBottomBar
(Desktop)                     (Mobile)
    │                               │
    ▼                               ▼
"Ships from USA"              "Ships from USA"
warning UI                    compact indicator
```

### Imports Required

**PurchaseSidebar.tsx:**
```tsx
import { Globe } from "lucide-react";
import { REGIONS } from "@/config/regions";
import { RegionCode } from "@/types/regional";
```

**MobileBottomBar.tsx:**
```tsx
import { Globe } from "lucide-react";
import { REGIONS } from "@/config/regions";
import { RegionCode } from "@/types/regional";
```

---

## Testing Plan

After implementation:
1. Switch to Canada region in the footer selector
2. Visit a printer from a brand WITHOUT a CA store (e.g., Bambu Lab, Creality)
3. Verify "🇺🇸 United States store / Ships from USA" warning appears in the sidebar
4. Verify compact "Ships from USA" indicator appears on mobile view
5. Verify price still displays in CAD (converted from USD)
6. Test with a brand that HAS a CA store to confirm no warning appears

---

## Implementation Order

1. **PurchaseSidebar.tsx** - Add props and warning UI
2. **MobileBottomBar.tsx** - Add props and compact indicator
3. **PrinterDetail.tsx** - Pass the new props from unifiedPricing hook

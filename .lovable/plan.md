

# Plan: Fix "Local" Badge Consistency on Filament Cards

## Problem Summary

The "Local" badge appears inconsistently across filament cards. When a UK user browses:
- FormFutura shows: "£9.99 /kg 🇬🇧 at FormFutura" (missing "Local" badge)
- Creality shows: "£24.83 /kg 🇬🇧 at Creality Local" (has badge)

**Root cause**: The current logic determines "local" based on whether regional price data exists in the database (`isActualRegionalPrice && !isUsingFallbackRegion`), rather than whether the store's region matches the user's region.

---

## Current vs Correct Logic

### Current (Incorrect)
```typescript
// In LabReadoutCard.tsx
const hasLocalStore = isActualRegionalPrice && !isUsingFallbackRegion;
```

This fails when:
- Store IS in user's region (UK FormFutura store)
- But `price_gbp` column is NULL (no scraped price yet)
- Result: Badge hidden even though store is local

### Correct Logic
```typescript
const isLocalStore = (storeRegion: string | null, userRegion: string): boolean => {
  if (!storeRegion) return false;
  if (storeRegion === userRegion) return true;
  if (storeRegion === 'GLOBAL') return true;  // Global stores are always "local"
  return false;
};
```

---

## Implementation Steps

### Step 1: Add `storeRegion` to `useRegionalPrice` Hook

**File**: `src/hooks/useRegionalPrice.ts`

The hook needs to return which region the store belongs to, not just whether prices exist.

1. **Add `storeRegion` to return interface**:
```typescript
export interface RegionalPriceResult {
  // ... existing fields ...
  /** The region code of the store being used */
  storeRegion: RegionCode | null;
  /** Whether this is a local store for the user */
  isLocalStore: boolean;
}
```

2. **Compute store region** based on:
   - If actual regional URL exists → that region
   - If vendor has regional stores → check user's region
   - If global brand → return 'GLOBAL'
   - If using fallback → return fallback region

3. **Return `isLocalStore`**:
```typescript
const storeRegion = /* computed */;
const isLocalStore = storeRegion === userRegion || storeRegion === 'GLOBAL';
```

### Step 2: Update FilamentCard to Show "Local" Badge

**File**: `src/components/FilamentCard.tsx`

Currently the price section shows:
```
£9.99/kg
🇬🇧 at FormFutura
```

Add badge logic in Element 3 (Price section):

```typescript
// Add to hook destructuring
const {
  regionalPrice,
  isActualRegionalPrice,
  regionalUrl,
  fallbackUrl,
  isLocalStore,      // NEW
  storeRegion,       // NEW  
} = useRegionalPrice(filament as FilamentWithRegionalPrices);

// In the price display section, after the vendor text
{isLocalStore && (
  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
    Local
  </span>
)}
```

### Step 3: Fix LabReadoutCard Logic

**File**: `src/components/LabReadoutCard.tsx`

Replace the incorrect logic:

```typescript
// OLD (incorrect)
const hasLocalStore = isActualRegionalPrice && !isUsingFallbackRegion;

// NEW (correct)
const { 
  regionalPrice, 
  regionalUrl,
  fallbackUrl,
  isActualRegionalPrice,
  isLocalStore,      // Use new field
  storeRegion,       // For flag display
} = useRegionalPrice(filament as FilamentWithRegionalPrices);
```

The badge display already exists:
```typescript
{hasLocalStore && (
  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium bg-primary/20 border border-primary/30 text-primary rounded">
    Local
  </span>
)}
```

Just rename `hasLocalStore` to `isLocalStore` and use the hook value.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useRegionalPrice.ts` | Add `storeRegion` and `isLocalStore` to return interface and compute them |
| `src/components/FilamentCard.tsx` | Add "Local" badge display using `isLocalStore` from hook |
| `src/components/LabReadoutCard.tsx` | Replace `hasLocalStore` computation with `isLocalStore` from hook |

---

## Visual Result

### Before
```
£9.99/kg
🇬🇧 at FormFutura
```

### After  
```
£9.99/kg
🇬🇧 at FormFutura Local
```

Badge styling:
- Background: `bg-emerald-500/10`
- Border: `border border-emerald-500/20`
- Text: `text-emerald-400`
- Font: `text-[9px] font-medium`

---

## Edge Cases

| Scenario | Expected Badge |
|----------|----------------|
| UK user, UK store (FormFutura UK) | ✅ Show "Local" |
| UK user, US store (Polymaker US) | ❌ No badge, show 🇺🇸 flag |
| UK user, EU store (Prusa) | ❌ No badge, show 🇪🇺 flag |
| UK user, GLOBAL brand (eSun) | ✅ Show "Local" (ships globally) |
| UK user, no store data | ❌ No badge, no flag |

---

## Technical Details

### Store Region Detection Logic (in `useRegionalPrice`)

```typescript
// Determine store region based on best available data
let storeRegion: RegionCode | null = null;

// 1. If we have actual regional price for user's currency
if (actualRegionalPrice && actualRegionalPrice > 0) {
  storeRegion = userRegionCode; // e.g., 'UK' for GBP user
}
// 2. If brand has a store configured for user's region
else if (brandHasRegionalStore) {
  storeRegion = userRegionCode;
}
// 3. If using fallback URL from different region
else if (fallbackUrlCurrency) {
  storeRegion = CURRENCY_TO_REGION_CODE[fallbackUrlCurrency];
}
// 4. Global brands
else if (!isRegionalBrand) {
  storeRegion = 'GLOBAL';
}
// 5. Default to USD/US
else if (filament.product_url) {
  storeRegion = 'US';
}

// Compute isLocalStore
const isLocalStore = storeRegion === userRegionCode || 
                     storeRegion === 'GLOBAL' ||
                     (!isRegionalBrand && !!storeRegion);
```

---

## No Database Changes Required

All changes are frontend-only.


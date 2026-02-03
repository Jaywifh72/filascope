

# Plan: Integrate Store Listings into Filament Detail Page

## Summary

Update the filament detail page to display regional prices from the `filament_prices` table (store listings). When a user views a filament, they will see the price from a store in their selected region (if available), or fall back to a converted USD price with an "International shipping" warning.

---

## Current State Analysis

| Component | Status |
|-----------|--------|
| `filament_prices` table | 119 records, 3 with prices > 0 |
| `get_filament_regional_prices` RPC | Already implemented and working |
| `useFilamentRegionalPrices` hook | Already exists in `useFilamentPrices.ts` |
| `useUnifiedRegionalPricing` hook | Uses `brand_regional_stores`, NOT `filament_prices` |
| `FilamentPurchaseSidebar` | Receives pricing via props from parent |

**Key finding**: The RPC function and hook already exist but aren't being used by the detail page. The `useUnifiedRegionalPricing` hook uses a different table (`brand_regional_stores`) for URL generation but doesn't query actual store prices.

---

## Implementation Steps

### Step 1: Create `useFilamentStorePricing` Hook

**File**: `src/hooks/useFilamentStorePricing.ts` (new)

A unified hook that combines store listings with the user's region:

```typescript
interface StorePrice {
  priceCents: number;
  priceDisplay: number;       // price_cents / 100
  currencyCode: string;
  storeName: string;
  storeSlug: string;
  storeType: string;          // marketplace, brand_direct, retailer
  region: string;
  productUrl: string | null;
  shipsFrom: string[] | null;
  shipsToUser: boolean;
  isLocalStore: boolean;
  isConverted: boolean;
  inStock: boolean;
  lastVerifiedAt: string | null;
}

interface UseFilamentStorePricingResult {
  bestPrice: StorePrice | null;
  allPrices: StorePrice[];
  isLoading: boolean;
  error: string | null;
  hasPriceData: boolean;
}
```

**Logic flow**:
1. Call `useFilamentRegionalPrices(filamentId, userRegion)` (already exists)
2. Transform RPC results to `StorePrice[]` format
3. Return best price (first result) and all prices
4. Provide `hasPriceData` flag for fallback detection

### Step 2: Create `StorePricingDisplay` Component

**File**: `src/components/filament/sidebar/StorePricingDisplay.tsx` (new)

A component that displays store-based pricing with:
- Price in user's currency (auto-converted if needed)
- Store name badge with store type indicator
- "Local" badge for same-region stores
- "Ships from [Country]" warning for international
- "Duties may apply" notice for cross-region

```text
┌────────────────────────────────────┐
│  $24.99/kg                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [Amazon US] [Marketplace]         │
│  ──────────────────────────────── │
│  [🇺🇸 US Store] [Local]            │
└────────────────────────────────────┘

OR (for international):

┌────────────────────────────────────┐
│  ~€22.99/kg                        │
│  Converted from $24.99 USD         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [Amazon US] [Marketplace]         │
│  ──────────────────────────────── │
│  ⚠️ Ships from United States       │
│  International shipping • Duties   │
└────────────────────────────────────┘
```

### Step 3: Modify FilamentDetail.tsx

Update the detail page to use the new hook alongside existing unified pricing:

**Current flow** (keep as fallback):
```
useUnifiedRegionalPricing() → brand_regional_stores → URL generation
```

**New flow** (primary):
```
useFilamentStorePricing() → filament_prices + stores → actual store prices
```

**Priority order**:
1. `useFilamentStorePricing` - actual store listings from `filament_prices`
2. `useUnifiedRegionalPricing` - brand store URL patterns (for URL generation when no listing)
3. Filament's `variant_price` column - legacy fallback with conversion

### Step 4: Update FilamentPurchaseSidebar Props

Extend sidebar to receive store pricing data:

```typescript
interface FilamentPurchaseSidebarProps {
  // ... existing props ...
  
  // NEW: Store-based pricing (from filament_prices table)
  storePricing?: {
    priceCents: number;
    currencyCode: string;
    storeName: string;
    storeType: 'marketplace' | 'brand_direct' | 'retailer';
    region: string;
    productUrl: string | null;
    shipsFrom: string[] | null;
    isLocalStore: boolean;
    isConverted: boolean;
    lastVerifiedAt: string | null;
  } | null;
  
  // Flag to indicate if using store pricing vs fallback
  hasStorePricing?: boolean;
}
```

### Step 5: Enhance HonestPriceDisplay for Store Sources

Update the existing `HonestPriceDisplay` component to show store source info:
- Store name and type badge
- "Ships from" country when international
- Clearer conversion indicators

---

## Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FilamentDetail.tsx                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────┐    ┌───────────────────────────┐  │
│  │ useFilamentStorePricing  │    │ useUnifiedRegionalPricing │  │
│  │   (NEW - Primary)        │    │   (Existing - Fallback)   │  │
│  └─────────┬────────────────┘    └─────────────┬─────────────┘  │
│            │                                    │                │
│            ▼                                    ▼                │
│  ┌──────────────────────────┐    ┌───────────────────────────┐  │
│  │ get_filament_regional    │    │ brand_regional_stores     │  │
│  │ _prices RPC              │    │ (URL patterns)            │  │
│  │                          │    │                           │  │
│  │ filament_prices + stores │    │                           │  │
│  └─────────┬────────────────┘    └─────────────┬─────────────┘  │
│            │                                    │                │
│            ▼                                    ▼                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Price Priority Logic                     │  │
│  │  1. Store listing price (from filament_prices)            │  │
│  │  2. Regional URL + conversion (from brand_regional_stores)│  │
│  │  3. Filament variant_price (legacy USD)                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              FilamentPurchaseSidebar                       │  │
│  │  - StorePricingDisplay (if hasStorePricing)               │  │
│  │  - HonestPriceDisplay (fallback)                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useFilamentStorePricing.ts` | Create | New hook using `useFilamentRegionalPrices` |
| `src/components/filament/sidebar/StorePricingDisplay.tsx` | Create | Store pricing display component |
| `src/pages/FilamentDetail.tsx` | Modify | Integrate new hook with priority logic |
| `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx` | Modify | Add store pricing props and display |

---

## Technical Details

### Store Type Badge Colors

| Type | Color | Label |
|------|-------|-------|
| marketplace | blue | Marketplace |
| brand_direct | green | Official Store |
| retailer | purple | Retailer |

### Shipping Warning Logic

```typescript
// Show shipping warning when:
const showShippingWarning = !storePrice.isLocalStore && storePrice.shipsFrom;

// Warning content based on ships_to_user:
if (storePrice.shipsToUser) {
  // "Ships from [Country] • International shipping"
} else {
  // "May not ship to your region"
}
```

### Price Conversion Display

```typescript
// For converted prices (isConverted = true):
// - Show tilde prefix: ~€22.99
// - Show conversion source tooltip: "Converted from $24.99 USD"
// - Show "Exchange rate may vary" disclaimer

// For native prices (isConverted = false):
// - Show direct price: €22.99
// - No conversion notice needed
```

### Fallback Chain

```typescript
// In FilamentDetail.tsx
const { bestPrice, hasPriceData } = useFilamentStorePricing(filamentId, region);
const unifiedPricing = useUnifiedRegionalPricing(product);

// Priority resolution:
const effectivePrice = hasPriceData 
  ? bestPrice 
  : (unifiedPricing.displayPrice ? unifiedPricing : null);

// Final fallback to variant_price if nothing else
const fallbackPrice = !effectivePrice && filament.variant_price
  ? { price: filament.variant_price, currency: 'USD', isConverted: true }
  : null;
```

---

## Component Visibility Logic

**Show StorePricingDisplay when:**
- `useFilamentStorePricing` returns `hasPriceData = true`
- Best price has `priceCents > 0`
- Store is active

**Show existing HonestPriceDisplay when:**
- No store pricing available
- Falling back to unified pricing or variant_price
- Add "~" prefix for converted prices
- Show "Price may vary" badge

---

## No Database Changes Required

All needed infrastructure exists:
- `filament_prices` table with store relationships
- `stores` table with region and shipping info
- `get_filament_regional_prices` RPC function
- `exchange_rates` table for currency conversion

The implementation is purely frontend integration work.


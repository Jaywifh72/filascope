
# Plan: Enhanced Variant-Aware Price Scraping System

## Problem Summary
The current price scraper picks incorrect variant prices for products with multiple spool sizes. For 3DXTECH's 3DXMAX ASA, the database shows `net_weight_g: 1000` (1kg), but when the product page loads, it defaults to the 10kg option ($450). The scraper's "smart selection" guesses at ~1kg variants using hardcoded weight ranges rather than matching the exact weight stored in the database.

---

## Solution Overview
Pass the filament's `net_weight_g` from the database to the Edge Function, enabling **exact weight matching** when selecting Shopify variants. Additionally, add a `variant_id` column to cache the correct variant ID for future requests.

---

## Implementation Steps

### Phase 1: Backend - Accept Target Weight Parameter

**File: `supabase/functions/get-current-price/index.ts`**

1. Update the request body parsing to accept a new optional `targetWeightGrams` parameter:
```typescript
const { 
  productUrl, 
  currency = 'USD', 
  forceRefresh = false,
  targetWeightGrams = null  // NEW: Expected weight from database
} = await req.json();
```

2. Modify `selectBestVariantByWeight` to prioritize **exact matches** when a target weight is provided:
```typescript
function selectBestVariantByWeight(
  variants: ShopifyVariant[], 
  productTitle: string,
  targetWeightGrams: number | null = null  // NEW parameter
): ShopifyVariant {
  // NEW Priority 0: If target weight provided, find exact match first
  if (targetWeightGrams !== null) {
    const tolerance = targetWeightGrams * 0.1; // 10% tolerance (900-1100g for 1kg)
    const exactMatch = variantsWithWeights.find(vw => 
      vw.weightGrams !== null && 
      Math.abs(vw.weightGrams - targetWeightGrams) <= tolerance
    );
    if (exactMatch) {
      console.log(`✓ Exact weight match: "${exactMatch.variant.title}" (${exactMatch.weightGrams}g ≈ ${targetWeightGrams}g target)`);
      return exactMatch.variant;
    }
  }
  // ... existing priority 1, 2, 3 logic as fallback
}
```

3. Pass `targetWeightGrams` to the variant selection in `fetchShopifyPrice`:
```typescript
variant = selectBestVariantByWeight(
  data.product.variants, 
  data.product.title,
  targetWeightGrams  // NEW: pass through
);
```

### Phase 2: Frontend - Pass Weight from Database

**File: `src/hooks/useAdminPriceRefresh.ts`**

1. Update the hook signature to accept `netWeightGrams`:
```typescript
export function useAdminPriceRefresh(
  productUrl: string,
  filamentId: string,
  netWeightGrams: number | null = null  // NEW parameter
): UseAdminPriceRefreshReturn
```

2. Pass the weight to the Edge Function:
```typescript
const result = await supabase.functions.invoke('get-current-price', {
  body: { 
    productUrl, 
    forceRefresh: true,
    targetWeightGrams: netWeightGrams  // NEW
  },
});
```

**File: `src/components/admin/AdminPriceRefreshButton.tsx`**

3. Update props interface to accept `netWeightGrams`:
```typescript
interface AdminPriceRefreshButtonProps {
  productUrl: string;
  filamentId: string;
  netWeightGrams?: number | null;  // NEW
  onRefreshComplete?: (success: boolean, newPrice?: number) => void;
  className?: string;
}
```

4. Pass it to the hook:
```typescript
const { refreshPrice, isRefreshing, lastRefreshError } = useAdminPriceRefresh(
  productUrl,
  filamentId,
  netWeightGrams  // NEW
);
```

**File: `src/components/price/HonestPriceDisplay.tsx`**

5. Update props interface and pass through to AdminPriceRefreshButton:
```typescript
interface HonestPriceDisplayProps {
  // ... existing props
  netWeightGrams?: number | null;  // NEW
}

// In render:
<AdminPriceRefreshButton
  productUrl={productUrl}
  filamentId={filamentId}
  netWeightGrams={netWeightGrams}  // NEW
  onRefreshComplete={...}
/>
```

**File: `src/pages/FilamentDetail.tsx`**

6. Pass `net_weight_g` to HonestPriceDisplay:
```typescript
<HonestPriceDisplay
  // ... existing props
  netWeightGrams={pricingFilament?.net_weight_g}  // NEW
/>
```

### Phase 3: Database - Store Variant IDs (Optional Enhancement)

**Database Migration:**

Add a `shopify_variant_id` column to cache the correct variant ID after successful scraping:
```sql
ALTER TABLE filaments 
ADD COLUMN IF NOT EXISTS shopify_variant_id BIGINT;

COMMENT ON COLUMN filaments.shopify_variant_id IS 
  'Cached Shopify variant ID for the specific spool size tracked by this record';
```

**Backend Enhancement:**

When the Edge Function successfully matches a variant, include the variant ID in the response:
```typescript
return {
  success: true,
  price,
  variantId: variant.id,  // NEW: Return for caching
  // ... other fields
};
```

**Frontend Enhancement:**

Update the `update_filament_price_after_refresh` RPC to optionally store the variant ID:
```sql
-- Update RPC to accept variant_id parameter
ALTER FUNCTION update_filament_price_after_refresh(...)
ADD p_variant_id BIGINT DEFAULT NULL;
```

---

## Data Flow After Implementation

```text
User clicks "Refresh Price"
         │
         ▼
┌────────────────────────────────┐
│  AdminPriceRefreshButton       │
│  netWeightGrams: 1000          │
└────────────────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  useAdminPriceRefresh hook     │
│  body: {                       │
│    productUrl: "...",          │
│    targetWeightGrams: 1000     │
│  }                             │
└────────────────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  get-current-price Edge Fn     │
│  selectBestVariantByWeight()   │
│  Finds variant with ~1000g     │
│  Returns price: $50.00         │
└────────────────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Database updated              │
│  variant_price: 50.00          │
│  shopify_variant_id: 43757238  │
└────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/get-current-price/index.ts` | Accept `targetWeightGrams`, update variant selection logic |
| `src/hooks/useAdminPriceRefresh.ts` | Accept and pass `netWeightGrams` parameter |
| `src/components/admin/AdminPriceRefreshButton.tsx` | Accept `netWeightGrams` prop |
| `src/components/price/HonestPriceDisplay.tsx` | Accept and pass `netWeightGrams` prop |
| `src/pages/FilamentDetail.tsx` | Pass `net_weight_g` to HonestPriceDisplay |
| Database migration | Add `shopify_variant_id` column (optional) |

---

## Technical Details

### Weight Matching Algorithm
- **Exact match tolerance**: 10% of target weight (e.g., 900-1100g for a 1kg target)
- **Fallback behavior**: If no exact match, use existing priority system (750-1500g range)
- **Logging**: Console logs will show whether exact match or fallback was used

### Edge Cases Handled
1. **No weight in database**: Falls back to existing "smart selection" (750-1500g preference)
2. **No matching variant**: Falls back to smallest available consumer size
3. **Product with only bulk sizes**: Selects smallest bulk option with warning log
4. **Variant ID already in URL**: Uses URL variant (existing behavior preserved)

### Existing Data Benefits
Many 3DXTech products already have correct `?variant=` parameters in their URLs. The new logic acts as a safety net when:
- URL has no variant parameter
- URL variant parameter is invalid/outdated
- Product was initially scraped with wrong variant


# Enhancement: Include Stock Status in Live Price Check and Display

## Summary
The core infrastructure for stock status is already implemented. This enhancement will add database updates when live price checks detect out-of-stock status, and add a more granular `stockStatus` field for better reporting.

---

## Current State (Already Implemented)

| Component | Status | Details |
|-----------|--------|---------|
| Edge Function | ✅ Complete | Returns `available: boolean`, has `detectSoldOutStatus()` with 10+ regex patterns |
| useLivePriceFetch Hook | ✅ Complete | Extracts and returns `available` field |
| LivePriceCheckButton UI | ✅ Complete | Shows OUT OF STOCK badge, red styling, disabled Buy button |
| Database Schema | ⚠️ Partial | Has `variant_available` but no auto-update from live checks |

---

## Implementation Plan

### Step 1: Add Stock Status Update to Edge Function
**File:** `supabase/functions/get-current-price/index.ts`

Add a new function to update the database when stock status differs from current value:

```typescript
async function updateFilamentStockStatus(
  productUrl: string,
  available: boolean,
  price: number | null
): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Find the filament by URL
  const { data: filament } = await supabase
    .from('filaments')
    .select('id, variant_available, variant_price')
    .eq('product_url', productUrl)
    .maybeSingle();
  
  if (!filament) return;
  
  // Only update if stock status changed or price differs significantly
  const stockChanged = filament.variant_available !== available;
  const priceDiffersSignificantly = price && filament.variant_price && 
    Math.abs(price - filament.variant_price) > 0.50;
  
  if (stockChanged || priceDiffersSignificantly) {
    await supabase
      .from('filaments')
      .update({
        variant_available: available,
        last_scraped_at: new Date().toISOString(),
        ...(price !== null ? { variant_price: price } : {})
      })
      .eq('id', filament.id);
    
    console.log(`Updated filament ${filament.id}: available=${available}, price=${price}`);
  }
}
```

Call this function after successful price extraction in the main handler (before returning the response).

### Step 2: Add Granular Stock Status to Response
**File:** `supabase/functions/get-current-price/index.ts`

Extend the `PriceResponse` interface:

```typescript
interface PriceResponse {
  // ... existing fields ...
  available: boolean;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'low_stock' | 'preorder' | 'unknown';
}
```

Update `detectSoldOutStatus` to return a more granular status:

```typescript
function detectStockStatus(markdown: string): 'in_stock' | 'out_of_stock' | 'low_stock' | 'preorder' | 'unknown' {
  // Check for preorder patterns first
  const preorderPatterns = [/pre[- ]?order/i, /coming\s*soon/i];
  if (preorderPatterns.some(p => p.test(markdown))) return 'preorder';
  
  // Check for low stock patterns
  const lowStockPatterns = [/only\s*\d+\s*left/i, /low\s*stock/i, /limited\s*quantity/i];
  if (lowStockPatterns.some(p => p.test(markdown))) return 'low_stock';
  
  // Check for sold out patterns (existing logic)
  const soldOutPatterns = [/* existing patterns */];
  if (soldOutPatterns.some(p => p.test(markdown))) return 'out_of_stock';
  
  // If no patterns matched and we got a price, assume in stock
  return 'unknown'; // Let the caller determine based on other factors
}
```

### Step 3: Update Hook Interface
**File:** `src/hooks/useLivePriceFetch.ts`

Add `stockStatus` to the result interface:

```typescript
export interface LivePriceFetchResult {
  // ... existing fields ...
  available?: boolean;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'low_stock' | 'preorder' | 'unknown';
}
```

Extract from response:

```typescript
const result: LivePriceFetchResult = {
  // ... existing fields ...
  available: data.available !== false,
  stockStatus: data.stockStatus || (data.available === false ? 'out_of_stock' : 'in_stock'),
};
```

### Step 4: Enhance UI for Different Stock States
**File:** `src/components/price/LivePriceCheckButton.tsx`

Add support for low_stock and preorder states:

```tsx
const getStockDisplay = (result: LivePriceFetchResult) => {
  const status = result.stockStatus || (result.available === false ? 'out_of_stock' : 'in_stock');
  
  switch (status) {
    case 'out_of_stock':
      return { icon: XCircle, color: 'red', label: 'OUT OF STOCK', canBuy: false };
    case 'low_stock':
      return { icon: AlertTriangle, color: 'amber', label: 'LOW STOCK', canBuy: true };
    case 'preorder':
      return { icon: Clock, color: 'blue', label: 'PRE-ORDER', canBuy: true };
    default:
      return { icon: Check, color: 'emerald', label: null, canBuy: true };
  }
};
```

---

## Technical Flow

```text
User clicks "Check Current Price"
        ↓
Edge Function fetches price + detects stock status
        ↓
Response includes: { price, available, stockStatus }
        ↓
Edge Function updates database if stock changed
        ↓
Hook receives and stores result
        ↓
UI displays appropriate badge + enables/disables Buy button
```

---

## Database Updates (Optional Enhancement)

If we want a dedicated `stock_checked_at` timestamp separate from `last_scraped_at`:

```sql
-- Migration to add stock-specific tracking
ALTER TABLE filaments 
ADD COLUMN IF NOT EXISTS stock_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) DEFAULT 'unknown';
```

This would allow:
- Separate tracking of price vs stock freshness
- More granular stock status in the database
- Admin dashboard filtering by stock status

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/get-current-price/index.ts` | Add `updateFilamentStockStatus()`, add `stockStatus` to response |
| `src/hooks/useLivePriceFetch.ts` | Add `stockStatus` to interface and extraction |
| `src/components/price/LivePriceCheckButton.tsx` | Add low_stock and preorder badge styling |

---

## Testing Checklist

1. **In-stock product**: Green checkmark, "Buy Now" button active
2. **Sold-out product**: Red X, "OUT OF STOCK" badge, "View at Store" button
3. **Low stock product**: Amber warning, "LOW STOCK" badge, "Buy Now" active
4. **Pre-order product**: Blue clock, "PRE-ORDER" badge, "Buy Now" active
5. **Stock change detection**: Database updates when status changes
6. **Region switch**: Resets and requires fresh check (already implemented)

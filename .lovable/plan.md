
# Fix: Hide "Buy Now" Button When Live Price Check Returns Sold-Out Status

## Problem Summary
After a live price check completes, the UI always displays a "Buy Now" button regardless of stock status. The edge function already returns an `available` field, but it's not being passed through to the UI.

## Technical Analysis

### Current Data Flow
```
Edge Function (available: boolean) → Hook (missing field) → UI (ignores stock)
```

### Files to Modify
1. `src/hooks/useLivePriceFetch.ts` - Add `available` to interface and response handling
2. `src/components/price/LivePriceCheckButton.tsx` - Render conditionally based on stock
3. `supabase/functions/get-current-price/index.ts` - Enhance Firecrawl stock detection

---

## Implementation Plan

### Step 1: Update LivePriceFetchResult Interface
**File:** `src/hooks/useLivePriceFetch.ts`

Add the `available` field to track stock status:
- Add `available?: boolean` to the `LivePriceFetchResult` interface
- Add `stockStatus?: 'in_stock' | 'out_of_stock' | 'unknown'` for more granular status

### Step 2: Extract Stock Status in Hook
**File:** `src/hooks/useLivePriceFetch.ts`

Update the response parsing logic to:
- Extract `data.available` from the edge function response
- Map it to the result object
- Default to `true` if not provided (backwards compatibility)

### Step 3: Update LivePriceCheckButton UI
**File:** `src/components/price/LivePriceCheckButton.tsx`

When `lastResult.available === false`:
1. Change the green price display container from `bg-emerald-500/10` to `bg-red-500/10`
2. Replace the check icon with an X or alert icon
3. Show "OUT OF STOCK" badge next to the price
4. Replace "Buy Now at [Store]" button with:
   - A disabled button showing "Out of Stock"
   - OR a secondary "View at Store" button (outline variant)
5. Keep the "Check again" link visible for re-verification

When `lastResult.available === true` (or undefined):
- Keep current behavior (green checkmark, active Buy button)

### Step 4: Enhance Stock Detection in Edge Function
**File:** `supabase/functions/get-current-price/index.ts`

Add a function to detect out-of-stock status from scraped content:
- Search for patterns like "sold out", "out of stock", "unavailable", "notify me"
- Check for missing "Add to Cart" button indicators
- Return `available: false` when sold-out patterns are detected

Common patterns to detect:
- "sold out" / "soldout"
- "out of stock"
- "currently unavailable"
- "notify me when available"
- "back in stock"
- Button text: "Sold Out" instead of "Add to Cart"

---

## UI Mockup: Out of Stock State

Current (broken):
```
+------------------------------------------+
| [checkmark] Live price: €22.99           |  (green)
+------------------------------------------+
| [cart] Buy Now at Bambu Lab [ext]        |  (primary button)
+------------------------------------------+
|           Check again                    |
+------------------------------------------+
```

Fixed (sold out):
```
+------------------------------------------+
| [x] €22.99  [OUT OF STOCK]               |  (red/amber)
+------------------------------------------+
| [x] Out of Stock                         |  (disabled button)
+------------------------------------------+
|           Check again                    |
+------------------------------------------+
```

OR (alternative with view option):
```
+------------------------------------------+
| [alert] €22.99  [SOLD OUT]               |  (amber)
+------------------------------------------+
| View at Store [ext]                      |  (outline button)
+------------------------------------------+
|           Check again                    |
+------------------------------------------+
```

---

## Technical Details

### Interface Changes
```typescript
// useLivePriceFetch.ts
export interface LivePriceFetchResult {
  // ... existing fields
  available?: boolean;  // NEW: stock availability from store
}
```

### Stock Detection Regex
```typescript
// get-current-price/index.ts
function detectSoldOutStatus(markdown: string): boolean {
  const soldOutPatterns = [
    /sold\s*out/i,
    /out\s*of\s*stock/i,
    /currently\s*unavailable/i,
    /notify\s*(me\s*)?(when\s*)?(available|in\s*stock)/i,
    /back\s*in\s*stock\s*soon/i,
    /temporarily\s*out/i,
  ];
  
  return soldOutPatterns.some(pattern => pattern.test(markdown));
}
```

### Conditional UI Logic
```tsx
// LivePriceCheckButton.tsx
const isOutOfStock = lastResult && lastResult.available === false;

{isOutOfStock ? (
  <div className="...bg-red-500/10 border-red-500/30...">
    <XCircle className="text-red-400" />
    <span>Sold Out</span>
    <span className="font-bold">{formatPrice(lastResult.price)}</span>
  </div>
) : (
  // Existing green "Live price" display
)}
```

---

## Testing Scenarios

1. **Shopify store (in stock)**: Should show green price + Buy button
2. **Shopify store (sold out variant)**: Should show red/amber + disabled button
3. **Firecrawl store with "Sold Out" text**: Should detect and show out-of-stock UI
4. **404 error**: Should continue to show existing "Product page has moved" UI
5. **Price not found**: Should continue to show existing error UI

---

## Edge Cases Handled

- Variant-level sold out (Shopify): Uses `variant.available` from API
- Page-level sold out (Firecrawl): Detects text patterns in markdown
- Backwards compatibility: If `available` is undefined, assume in stock
- Pre-order status: Could extend to show "Pre-order" instead of "Out of Stock"

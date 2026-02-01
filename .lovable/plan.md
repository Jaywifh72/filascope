
# Fix: Live Price Display Retains Old Currency Value After Region Switch

## Problem
When a user views a product price in one region (e.g., EU with €31.12), then switches to another region (e.g., US), the displayed price incorrectly shows "$31.12" instead of being cleared or recalculated. The currency symbol updates, but the numeric value from the old region persists.

## Root Cause
The `LivePriceCheckButton` component maintains local state (`buttonState`, `showResult`) and uses `lastResult` from the `useLivePriceFetch` hook. When the region changes:
- Neither the hook nor the component resets their state
- The `formatPrice` function uses the new currency symbol
- But the raw price value (`lastResult.price`) is still the EUR amount (31.12) not the USD amount (37.00)

## Solution: Option A - Clear Cache on Region Change

### File 1: `src/components/price/LivePriceCheckButton.tsx`

Add a `useEffect` that monitors region changes and resets all state when it occurs:

```typescript
// Add at the top of the component, after the useRegion hook
const { formatPrice, region } = useRegion();

// Add new effect to reset on region change
useEffect(() => {
  // Reset all state when region changes
  reset();
  setButtonState('idle');
  setShowResult(false);
}, [region]); // Only trigger on region change
```

**Changes:**
- Line ~28-30: Destructure `region` from `useRegion()` in addition to `formatPrice`
- Add new `useEffect` after line 49 that resets state when `region` changes

### File 2: `src/hooks/useLivePriceFetch.ts` (Optional Enhancement)

Add region awareness to the hook itself as a defensive measure:

```typescript
// Add region to the hook's state awareness
const { currency: userCurrency, region, convertPrice, getConversionRate } = useRegion();

// Add effect to reset when region/currency changes
useEffect(() => {
  reset();
}, [region]);
```

**Changes:**
- Line 68: Also destructure `region` from `useRegion()`
- Add new `useEffect` that calls `reset()` when region changes

---

## Technical Details

### State Reset Flow
```
User changes region → RegionContext updates →
  → useLivePriceFetch effect fires → calls reset() →
  → LivePriceCheckButton effect fires → resets button state →
  → UI shows "Check Current Price" button (idle state)
```

### Why Option A (Clear) vs Option B (Recalculate)
- **Simpler**: No need to store/track original currency and re-convert
- **More accurate**: A fresh live check will get the actual regional price (e.g., €22.99 vs $24.99) rather than a conversion
- **Clearer UX**: User sees "Check Current Price" button again, making it obvious they need to re-check

---

## Files Modified
1. `src/components/price/LivePriceCheckButton.tsx` - Add region-change effect
2. `src/hooks/useLivePriceFetch.ts` - Add defensive reset on region change

## Testing
After implementation:
1. Navigate to a product detail page
2. Set region to EU
3. Click "Check Current Price" - should show €XX.XX
4. Switch region to US via header dropdown
5. **Expected**: UI resets to show "Check Current Price" button (idle state)
6. Click "Check Current Price" again - should show $XX.XX with correct USD value

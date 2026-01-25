

# Integrate AdminPriceRefreshButton into Filament Detail Sidebar

## Overview

Integrate the existing `AdminPriceRefreshButton` component into the filament detail page's price sidebar, positioning it inline with the "Last checked X ago" timestamp. The button will only be visible to admin users and will trigger a cache refresh after successfully updating the price.

---

## Implementation Strategy

There are **two integration points** to consider:

1. **HonestPriceDisplay.tsx** - Where the "Last checked X ago" text is rendered
2. **FilamentPurchaseSidebar.tsx** - Where HonestPriceDisplay is used and has access to filamentId and productUrl

The cleanest approach is to add new optional props to `HonestPriceDisplay` for admin refresh functionality, then pass them from `FilamentPurchaseSidebar`.

---

## Files to Modify

### 1. `src/components/price/HonestPriceDisplay.tsx`

**Changes:**
- Add new optional props: `filamentId`, `productUrl`, `onAdminRefresh`
- Import `AdminPriceRefreshButton`
- Add the button inline next to the freshness indicator (line 197-200)
- Only render button when `filamentId` and `productUrl` are provided

**New Props:**
```typescript
interface HonestPriceDisplayProps {
  // ... existing props
  filamentId?: string;       // NEW: For admin refresh
  productUrl?: string;       // NEW: For admin refresh
  onAdminRefresh?: () => void; // NEW: Callback after refresh
}
```

**Modified JSX (lines 196-200):**
```tsx
{/* Freshness indicator */}
<div className={cn('flex items-center gap-1.5', config.colorClass, sizes.helper)}>
  <Icon className="h-3 w-3" />
  <span>{timeAgoText || displayMode.helperText}</span>
  
  {/* Admin Refresh Button - only shown to admins */}
  {filamentId && productUrl && (
    <AdminPriceRefreshButton
      productUrl={productUrl}
      filamentId={filamentId}
      onRefreshComplete={(success) => {
        if (success) {
          onAdminRefresh?.();
        }
      }}
      className="ml-1"
    />
  )}
</div>
```

---

### 2. `src/components/filament/sidebar/FilamentPurchaseSidebar.tsx`

**Changes:**
- Add state to track refresh count for forcing re-render
- Pass new props to `HonestPriceDisplay`
- Create a handler that invalidates price cache and triggers re-fetch

**New State:**
```typescript
const [priceRefreshKey, setPriceRefreshKey] = useState(0);
```

**Handler:**
```typescript
const handleAdminRefresh = useCallback(() => {
  // Invalidate cache for this product URL
  if (productUrl) {
    invalidatePriceCache(productUrl);
  }
  if (originalUsUrl) {
    invalidatePriceCache(originalUsUrl);
  }
  // Force a re-render by incrementing key
  setPriceRefreshKey(prev => prev + 1);
}, [productUrl, originalUsUrl]);
```

**Updated HonestPriceDisplay usage (lines 234-251):**
```tsx
<HonestPriceDisplay
  price={displayPricePerKg}
  confidence={priceConfidence}
  lastVerifiedAt={lastScrapedAt}
  storeName={regionalPriceResult?.store?.name || finalRetailerName}
  storeUrl={affiliateUrl}
  isConverted={isConvertedPrice}
  conversionTooltip={...}
  size="lg"
  showCTA={false}
  showPerKg={true}
  // NEW: Admin refresh props
  filamentId={filamentId}
  productUrl={productUrl}
  onAdminRefresh={handleAdminRefresh}
/>
```

**Add import:**
```typescript
import { invalidatePriceCache } from '@/hooks/useCurrentPrice';
```

---

## Component Visibility Logic

The `AdminPriceRefreshButton` already handles its own visibility:
- Returns `null` if user is not authenticated
- Returns `null` if user is not an admin
- Only renders the button for admin users

Additionally, we add these guards in `HonestPriceDisplay`:
- Only render button if `filamentId` is provided
- Only render button if `productUrl` is provided

---

## Refresh Flow

```text
1. Admin clicks refresh button
2. AdminPriceRefreshButton calls useAdminPriceRefresh.refreshPrice()
3. Edge function fetches live price
4. Database updated (filaments table + price_history)
5. useAdminPriceRefresh calls invalidatePriceCache(productUrl)
6. onRefreshComplete callback fires with success=true
7. handleAdminRefresh in sidebar:
   - Calls invalidatePriceCache again (belt & suspenders)
   - Increments priceRefreshKey to force useCurrentPrice to re-fetch
8. UI updates to show "Last checked just now"
```

---

## Technical Implementation Details

### Import Changes in HonestPriceDisplay.tsx
```typescript
import { AdminPriceRefreshButton } from '@/components/admin/AdminPriceRefreshButton';
```

### Import Changes in FilamentPurchaseSidebar.tsx
```typescript
import { useCurrentPrice, invalidatePriceCache } from '@/hooks/useCurrentPrice';
// Note: useCurrentPrice is already imported, just add invalidatePriceCache
```

### Key for useCurrentPrice re-fetch
The `priceRefreshKey` state is used as a dependency in useCurrentPrice to trigger a fresh fetch:
```typescript
const { ... } = useCurrentPrice(productUrl, pricePerSpool, originalUsUrl);
```

Since useCurrentPrice uses `productUrl` as its cache key and we call `invalidatePriceCache`, the next render will miss the cache and fetch fresh data.

---

## Layout Considerations

- Button is 24x24px (`h-6 w-6`) - very compact
- Uses `ml-1` margin to separate from timestamp text
- `ghost` variant makes it blend with the text until hovered
- Positioned inline within the flex container - doesn't break layout

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| No productUrl | Button not rendered |
| No filamentId | Button not rendered |
| User not logged in | Button not rendered (handled in AdminPriceRefreshButton) |
| User not admin | Button not rendered (handled in AdminPriceRefreshButton) |
| Refresh fails | Error toast shown, button returns to idle state |
| Product 404 | Graceful error message in toast |

---

## Visual Result

**Before (non-admin or regular view):**
```
✓ Last checked 2 hours ago
```

**After (admin view):**
```
✓ Last checked 2 hours ago [↻]
```

Where `[↻]` is a subtle refresh icon that:
- Spins when refreshing
- Shows green checkmark on success
- Shows red X on error
- Has tooltip with status


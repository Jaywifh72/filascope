

# Fix Three Critical Issues in Pricing Sync System

## Issue 1: Price Validation Rejects Non-USD Currencies (JPY, etc.)

### Problem
`validateFilamentPrice(price, min=10, max=150)` uses USD-hardcoded range. JPY prices like 3400 are rejected because 3400 > 150.

### Solution
Replace the function with a currency-aware version:

**File: `supabase/functions/get-current-price/index.ts`**

Replace `validateFilamentPrice` (line 1265-1268) with:
```typescript
const CURRENCY_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  USD: { min: 3, max: 200 },
  CAD: { min: 3, max: 200 },
  AUD: { min: 3, max: 200 },
  GBP: { min: 3, max: 150 },
  EUR: { min: 3, max: 200 },
  JPY: { min: 100, max: 30000 },
  default: { min: 1, max: 50000 },
};

function validateFilamentPrice(price: number, currency: string = 'USD'): boolean {
  const range = CURRENCY_PRICE_RANGES[currency] || CURRENCY_PRICE_RANGES.default;
  return price >= range.min && price <= range.max;
}
```

Update all ~15 call sites to pass the appropriate currency. The calls fall into these categories:

| Location | Current Call | Currency Source |
|----------|-------------|----------------|
| Creality extraction (~lines 1550, 1590, 1608, 1625, 1639) | `validateFilamentPrice(p)` | Hardcoded `'USD'` (Creality is always USD) -- no change needed since USD is default |
| `extractPriceFromContent` EUR block (~line 1796) | `validateFilamentPrice(p)` | Pass `'EUR'` |
| `extractPriceFromContent` GBP block (~line 1822) | `validateFilamentPrice(p)` | Pass `'GBP'` |
| `extractPriceFromContent` USD/CAD/AUD block (~line 1847) | `validateFilamentPrice(p)` | Pass `preferredCurrency` |
| `extractPriceFromContent` fallback currencies (~line 1884) | `validateFilamentPrice(p)` | Pass `cur` (the loop variable) |
| `extractPriceFromContent` last resort dollar (~line 1899) | `validateFilamentPrice(p)` | `'USD'` (default, no change) |

This is backwards-compatible: existing USD-only calls keep working since `'USD'` is the default.

---

## Issue 2: Firecrawl Routing Confirmation

### Current State (Already Correct)
After inspecting the code, both changes are actually already in place:

- Line 1669: `shouldAlwaysUseFirecrawl` already contains `['amolen.com', 'store.bambulab.com']`
- Lines 2597-2599: The geo-redirect + non-USD Firecrawl-first routing is already implemented

No changes needed for this issue. The previous edits were applied successfully.

---

## Issue 3: Sync Result Feedback in Change Column

### Problem
After syncing, the Change column always shows "---" because `PriceChangeIndicator` reads from `store.priceChange` (historical DB data), not from the just-completed `syncResult`.

### Solution
**File: `src/pages/admin/PricingData.tsx`**

In the store row rendering (line 1579), replace the static `PriceChangeIndicator` with sync-aware logic:

```typescript
{/* Change column - show sync result if available, otherwise historical */}
<TableCell>
  {syncResult && syncResult.status !== 'syncing' ? (
    <SyncChangeIndicator syncResult={syncResult} currencySymbol={store.currencySymbol} />
  ) : (
    <PriceChangeIndicator change={store.priceChange} />
  )}
</TableCell>
```

Add a new `SyncChangeIndicator` component (near `PriceChangeIndicator`, around line 310):

```typescript
function SyncChangeIndicator({ syncResult, currencySymbol }: { syncResult: SyncResult; currencySymbol: string }) {
  if (syncResult.status === 'failed') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-red-400 flex items-center gap-0.5 text-xs cursor-default">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        </TooltipTrigger>
        <TooltipContent>{syncResult.error || 'Sync failed'}</TooltipContent>
      </Tooltip>
    );
  }

  if (syncResult.status === 'unchanged') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-muted-foreground flex items-center gap-1 text-xs cursor-default">
            <Minus className="w-3 h-3" /> =
          </span>
        </TooltipTrigger>
        <TooltipContent>Price unchanged at {currencySymbol}{syncResult.newPrice?.toFixed(2)}</TooltipContent>
      </Tooltip>
    );
  }

  if (syncResult.status === 'success' && syncResult.percentChange != null) {
    const isUp = syncResult.percentChange > 0;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`flex items-center gap-0.5 font-mono text-xs cursor-default ${isUp ? 'text-red-400' : 'text-emerald-400'}`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {isUp ? '↑' : '↓'}{Math.abs(syncResult.percentChange).toFixed(1)}%
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {currencySymbol}{syncResult.oldPrice?.toFixed(2)} -> {currencySymbol}{syncResult.newPrice?.toFixed(2)}
          ({syncResult.percentChange > 0 ? '+' : ''}{syncResult.percentChange.toFixed(1)}%)
        </TooltipContent>
      </Tooltip>
    );
  }

  return <span className="text-muted-foreground">---</span>;
}
```

Also add `'unchanged'` row background highlight (already partially done at line 1507-1510, add yellow for unchanged):
```typescript
syncResult?.status === 'unchanged' ? 'bg-yellow-500/5' : ''
```

## Summary of File Changes

| File | Changes |
|------|---------|
| `supabase/functions/get-current-price/index.ts` | Replace `validateFilamentPrice` with currency-aware version; update ~6 call sites in `extractPriceFromContent` to pass currency |
| `src/pages/admin/PricingData.tsx` | Add `SyncChangeIndicator` component; use it in Change column when sync results exist; add yellow background for unchanged rows |


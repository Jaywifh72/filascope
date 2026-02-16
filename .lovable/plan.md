

# Fix Three Critical Pricing Sync Bugs

## Bug 1: Firecrawl 500 Retry Logic

**File:** `supabase/functions/get-current-price/index.ts`

In `fetchPriceWithFirecrawl` (line ~2114), the Firecrawl API call at line 2115-2128 has no retry logic. When the response is not ok (line 2130), it immediately returns an error.

**Fix:** Wrap the `fetch` call in a retry loop (up to 2 retries for 500/502/503 status codes with exponential backoff starting at 2s). Non-5xx errors return immediately as before.

The change replaces lines 2114-2146 with:
- A `for` loop (attempts 0-2)
- On 5xx: log retry, wait `2000 * (attempt + 1)` ms, continue
- On final failure or 4xx: return the existing error response
- On success: break out and continue to markdown extraction

---

## Bug 2: RPC Currency-Aware Price Column Updates

**Migration:** New SQL migration to replace `update_filament_price_after_refresh`

The current RPC always writes to `variant_price` regardless of currency. When called with JPY price 3400, it overwrites the USD base price.

**Fix:** Replace the function with currency-branched logic:
- USD writes to `variant_price` + `variant_compare_at_price`
- CAD writes to `price_cad`
- GBP writes to `price_gbp`
- EUR writes to `price_eur`
- AUD writes to `price_aud`
- JPY writes to `price_jpy`
- Unknown currencies default to USD behavior

Price history INSERT remains unchanged (always logs with currency).

---

## Bug 3: Detailed RPC Error Messages

**File:** `src/hooks/useAdminPriceRefresh.ts` (line 146-148)

Replace generic "Failed to save price to database" with actual error:
```
Save failed: {rpcError.message}
```

**File:** `src/pages/admin/PricingData.tsx` (line 981)

Replace generic "Failed to save price" with actual error:
```
Save failed: {rpcError.message}
```

---

## Technical Summary

| File | Change |
|------|--------|
| `supabase/functions/get-current-price/index.ts` | Add retry loop around Firecrawl fetch (lines 2114-2146) |
| New SQL migration | Replace `update_filament_price_after_refresh` with currency-branched version |
| `src/hooks/useAdminPriceRefresh.ts` | Line 148: show actual RPC error message |
| `src/pages/admin/PricingData.tsx` | Line 981: show actual RPC error message |


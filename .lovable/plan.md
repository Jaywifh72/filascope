

## Apply Affiliate Prioritization to Printer Listings

### Summary
Add affiliate priority boosting to the printer listings page. Since printers use client-side fetching and sorting (unlike filaments which use a server-side RPC), the boost data will be fetched as a separate lightweight query and applied during the client-side sort step.

### Architecture Difference from Filaments
- **Filaments**: Server-side RPC (`search_filaments_paginated`) with `p_affiliate_boost` parameter -- boost applied in SQL ORDER BY
- **Printers**: All printers fetched at once via `supabase.from("printers").select(...)`, then filtered and sorted client-side in a `useMemo` block in `Printers.tsx`

Because of this, the printer boost must be applied client-side during the sort phase.

### Join Path for Boost Data
```text
printers.brand_id
  -> printer_brands.id (get brand name)
  -> automated_brands (match by LOWER(brand_name) = LOWER(brand))
  -> brand_regional_stores (match by brand_id + region_code)
  -> affiliate_priority_boost (integer, 0-100)
```

### Implementation

#### 1. New Hook: `src/hooks/usePrinterAffiliateBoost.ts`
A lightweight hook that fetches the boost mapping for the current region:
- Queries `brand_regional_stores` joined through `automated_brands` and `printer_brands` to get a map of `printer_brand_id -> boost_value`
- Only fetches when `useAffiliatePrioritization().isEnabled` is true
- Returns a `Map<string, number>` keyed by `printer_brands.id` (the brand_id on the printer row)
- Uses React Query with 30-minute staleTime (same as the settings hook)
- Falls back to empty map on error

#### 2. Modify `src/pages/Printers.tsx`
- Import `useAffiliatePrioritization` and `usePrinterAffiliateBoost`
- Call `usePrinterAffiliateBoost(region)` to get the boost map
- Detect "default sort": the initial `sortBy` state is `"price-asc"` -- boost applies only when `sortBy === "price-asc"` (the default)
- In the sort `useMemo` (around line 471), when boost is enabled AND sort is default:
  - Before the existing price sort, first sort by boost value DESC (printers from boosted brands float to top)
  - Within the same boost tier, preserve the existing price-asc sort
  - Out-of-stock / discontinued printers remain at the bottom (existing behavior preserved)

The sort modification:
```typescript
// Inside the sort callback (line 471-484)
if (affiliateBoostEnabled && sortBy === "price-asc" && boostMap.size > 0) {
  const boostA = boostMap.get(a.brand_id) ?? 0;
  const boostB = boostMap.get(b.brand_id) ?? 0;
  if (boostA !== boostB) return boostB - boostA; // higher boost first
}
// Then fall through to existing sort logic
```

#### 3. No Database Migration Needed
The `brand_regional_stores.affiliate_priority_boost` column already exists. No new views or functions are needed -- a simple client-side query suffices.

### Default Sort Detection
The default sort is `"price-asc"` (set on line 115 of `Printers.tsx`). When a user explicitly changes the sort via the dropdown, `sortBy` changes to another value, and the boost naturally stops applying.

### Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/usePrinterAffiliateBoost.ts` | Fetches brand boost map for current region |

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/Printers.tsx` | Import hooks, apply boost in sort useMemo |

### Edge Cases
- If `brand_regional_stores` has no boost rows for the region, the map is empty and sort is unaffected
- If the prioritization setting is disabled, the boost query is skipped entirely
- If the boost query fails, it silently returns an empty map
- Non-default sorts are completely unaffected
- Discontinued printers remain hidden by default (existing behavior)
- No UI indicators added -- invisible to users


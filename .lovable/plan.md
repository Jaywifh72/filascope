

## Apply Affiliate Prioritization to Filament Sort Order

### Summary
Integrate the affiliate priority boost into the default filament sort order across all public listing pages. When prioritization is enabled and the user hasn't chosen a custom sort, filaments from boosted brands appear higher in results. No visible UI change -- only sort order is affected.

### Approach: Server-Side (RPC Modification)

All filament listing pages use the `search_filaments_paginated` RPC function via the `useFinderQuery` hook. This is the single point where sorting happens. Rather than client-side re-sorting (which would break pagination), the boost is applied inside the RPC itself.

### Database Changes

**Migration: Update `search_filaments_paginated` RPC**

Add a new parameter `p_affiliate_boost` (boolean, default false). When true AND the sort is `scoring-desc` (the default), the `sorted` CTE will:
- LEFT JOIN `brand_regional_stores` on `f.brand_id = brs.brand_id AND brs.region_code = p_region`
- Add `COALESCE(brs.affiliate_priority_boost, 0) DESC` as the FIRST sort criterion (before stock status and score)
- Also check that `site_settings` has prioritization enabled (belt-and-suspenders safety)

This means the boost only applies when:
1. The caller passes `p_affiliate_boost = true`
2. The sort is the default `scoring-desc`

When the user picks any other sort (price, alpha, strength, etc.), the boost column is ignored.

Updated sort clause (within the `sorted` CTE):
```sql
ORDER BY
  -- Affiliate boost: only when default sort AND boost enabled
  CASE WHEN p_affiliate_boost AND p_sort = 'scoring-desc'
    THEN COALESCE(brs.affiliate_priority_boost, 0) ELSE 0
  END DESC,
  -- Existing sort logic unchanged
  CASE WHEN p_sort IN ('scoring-desc','scoring-asc') THEN ... END,
  ...
```

The JOIN is added in the `grouped` CTE since that's where we have `brand_id` context (via the representative filament). Actually, since grouping is by `product_line_id`, the brand_id comes from the representative filament joined in the final SELECT. The cleanest approach: add the JOIN in the `sorted` CTE by looking up the representative filament's brand_id.

Revised approach -- add a subquery in the ORDER BY of `sorted`:
```sql
CASE WHEN p_affiliate_boost AND p_sort = 'scoring-desc' THEN
  COALESCE((
    SELECT brs.affiliate_priority_boost 
    FROM filaments f2
    JOIN brand_regional_stores brs ON brs.brand_id = f2.brand_id AND brs.region_code = p_region
    WHERE f2.id = g.representative_id
  ), 0)
ELSE 0 END DESC,
```

This avoids restructuring the existing CTEs entirely -- just adds a correlated subquery in the sort clause, which is efficient because `representative_id` is already computed and indexed.

### New Hook

**File: `src/hooks/useAffiliatePrioritization.ts`**

A simple hook that reads the `affiliate_prioritization` setting from `site_settings` (using React Query with long staleTime for session-level caching):

```typescript
export function useAffiliatePrioritization() {
  // Returns { isEnabled: boolean, isLoading: boolean }
  // Fetches site_settings where key = 'affiliate_prioritization'
  // Caches for 30 minutes (staleTime)
  // Falls back to false on any error
}
```

### Modified Files

**File: `src/hooks/useFinderQuery.ts`**

- Import `useAffiliatePrioritization`
- Call it to get `isEnabled`
- Pass `p_affiliate_boost: isEnabled && filters.sortBy === 'scoring-desc'` to the RPC
- Add `isEnabled` to the query key for cache correctness
- The `sortBy === 'scoring-desc'` check is the "default sort" detection -- this is the initial sort value from `useURLFilterSync`

### Sort Override Logic

The default sort is `scoring-desc` (set in `useURLFilterSync.ts` line 45). When a user explicitly changes the sort (via the control bar dropdown), `filters.sortBy` changes to something else. The condition `filters.sortBy === 'scoring-desc'` naturally handles this -- boost only applies for the default.

### Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/useAffiliatePrioritization.ts` | Session-cached hook reading enabled flag |

### Files to Modify
| File | Change |
|------|--------|
| `src/hooks/useFinderQuery.ts` | Pass `p_affiliate_boost` param to RPC; add to query key |

### Database Operations
| Type | Detail |
|------|--------|
| Migration | Update `search_filaments_paginated` RPC to accept `p_affiliate_boost` param and apply boost in ORDER BY |

### Edge Cases
- If `brand_regional_stores` has no row for a brand+region pair, COALESCE returns 0 (no boost)
- If `site_settings` row is missing or query fails, hook returns `false` (no boost)
- Non-default sorts are completely unaffected
- Out-of-stock items still sort to bottom (existing behavior preserved)
- No UI indicators are added -- this is invisible to users


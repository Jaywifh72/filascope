

# Engagement and Social Proof Additions

## Current State

- **Recently Viewed** already exists (`RecentlyViewedSection`) and is placed between hero and Material Registry (line 939-941 in Finder.tsx). It uses `useBrowseHistory` with localStorage + database persistence.
- **No trending/popularity data** exists at the card level. The filaments table has no `view_count` or `popularity_score` column. The `user_activity` table tracks views but aggregating per-filament would require a new query or materialized view.
- **No price history** is available at the card level. Price drops cannot be detected without historical price data per filament.
- The filaments table likely has a `created_at` or similar timestamp for detecting "New" products.

## Implementation Plan

### Part 1: Trending Section

**New file**: `src/components/TrendingSection.tsx`

A horizontal carousel section placed between the hero action cards and the RecentlyViewedSection in Finder.tsx.

- **Header**: Uses `regionConfig.name` from `useRegion()` to show "Trending in [Region]" with a "See All" link pointing to `/?sort=popular`
- **Data source**: Query filaments sorted by a popularity proxy. Two options:
  - Option A (simple): Use the existing `useFinderQuery` or a standalone query sorted by `value_score DESC` or a composite of scores, limited to 8 items. This is a proxy for "popular" since we lack actual view counts.
  - Option B (better, requires DB): Create a lightweight database function `get_trending_filaments(region text, limit int)` that aggregates recent `user_activity` views (last 7 days) grouped by `entity_id` where `entity_type = 'filament'`, joined with filament data. This gives real trending data.
- **Recommended approach**: Option A for now (no DB change), with a TODO for Option B. Query 8 filaments with `variant_price IS NOT NULL` sorted by value_score descending, filtered to the user's region where possible.
- **Mini card component**: Inline within the file. ~200px wide, showing color swatch (12px circle), truncated product name, price in cyan, and vendor name. Styled with `bg-slate-800/60 border border-slate-700/40 rounded-lg p-3`. Hover: `border-cyan-500/30 scale-[1.02]`.
- **Scrolling**: Use the existing `ScrollCarousel` component for horizontal scroll with arrow buttons. No auto-scroll animation (adds complexity and can be annoying).

### Part 2: Social Proof Badges on Cards

**Modified file**: `src/components/FilamentCard.tsx`

Add conditional badges in the existing card structure:

1. **"New" badge**: Check if filament has a `created_at` field. If the product was added within the last 30 days, show an emerald "New" badge (`bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full`). Position: inside the badges row (Element 2), before material badge.

2. **"Popular" badge**: Without real view count data, this will be based on a heuristic: filaments with `value_score >= 8` AND community reviews > 0. Badge styled amber (`bg-amber-500/20 text-amber-400`). Position: absolute top-right area, below the compare checkbox.

3. **"Price Drop" badge**: Deferred -- requires price history data that doesn't exist at the card level. Instead, we can show the existing "Budget" badge more prominently near price when `isBudgetFriendly` is true. No fake "Price Drop" labels.

The Filament interface will need `created_at` added. We'll check if the column exists in the query.

### Part 3: Recently Viewed Repositioning

**Modified file**: `src/pages/Finder.tsx`

- **Move** the existing `<RecentlyViewedSection>` from its current position (line 939, between hero and SectionSeparator) to **after the pagination bar** (after `FinderPaginationBar`, before the closing `</section>` tag around line 1473).
- Keep the same props: `limit={6} showClear title="Recently Viewed" filterType="filament" compact`
- This creates the return-visit hook at the bottom of the product grid as specified.

## File Changes Summary

| File | Action | Description |
|---|---|---|
| `src/components/TrendingSection.tsx` | **Create** | New trending carousel with mini-cards, region-aware header |
| `src/components/FilamentCard.tsx` | **Edit** | Add "New" and "Popular" social proof badges |
| `src/pages/Finder.tsx` | **Edit** | Add TrendingSection between hero and registry; move RecentlyViewed to bottom of grid |
| `src/hooks/useFinderQuery.ts` | **Check** | Verify `created_at` is included in filament select queries |

## Technical Details

### Trending Query (standalone)
```text
const { data: trendingFilaments } = useQuery({
  queryKey: ['trending-filaments', regionConfig.code],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('filaments')
      .select('id, product_title, vendor, material, color_hex, variant_price, featured_image, product_url, net_weight_g')
      .not('variant_price', 'is', null)
      .not('color_hex', 'is', null)
      .order('value_score', { ascending: false })
      .limit(8);
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60 * 1000,
});
```

### "New" Badge Logic
```text
// In FilamentCard, after existing badges
const isNew = filament.created_at && 
  (Date.now() - new Date(filament.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000;
```

### Mini Card Component (inline in TrendingSection)
```text
<div className="shrink-0 w-[200px] bg-slate-800/60 border border-slate-700/40 rounded-lg p-3
  hover:border-cyan-500/30 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
  <div className="flex items-center gap-2 mb-2">
    {colorHex && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorHex }} />}
    <span className="text-sm font-medium text-foreground truncate">{name}</span>
  </div>
  <div className="flex items-center justify-between">
    <span className="text-sm font-bold text-cyan-400">{price}</span>
    <span className="text-xs text-slate-500">{vendor}</span>
  </div>
</div>
```

## Scope Decisions

- **No auto-scroll animation** on trending carousel -- manual scroll + arrow buttons via existing ScrollCarousel component
- **No "Price Drop" badge** -- requires price history infrastructure that doesn't exist
- **"Popular" uses heuristic** (high value_score) until real analytics aggregation is built
- **Recently Viewed stays as-is functionally** -- just repositioned to bottom of grid


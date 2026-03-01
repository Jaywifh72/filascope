

# Rebuild TD Management Overview Tab

## Root Cause

The coverage charts show wrong data because `useTdStats` fetches `material` and `transmission_distance` for ALL filaments, but Supabase's default 1000-row limit truncates the results. With 8,166+ filaments, only the first 1000 are analyzed for material/brand breakdowns. The stat cards (Total, With TD) use `count: 'exact', head: true` and are correct, but the chart data is fundamentally broken.

## Solution: Server-Side Stats Function

Create a single database function `get_td_coverage_stats()` that computes ALL stats server-side (no row limit issues), then rebuild the Overview tab UI to consume it.

## Step 1: Database Migration

Create an RPC function `get_td_coverage_stats()` that returns:

```text
{
  total_filaments: int,
  with_td: int,
  missing_td: int,
  coverage_pct: numeric,
  reference_count: int,
  by_material: [{material, total, with_td, pct}],  -- top 15
  by_brand: [{brand, total, with_td, pct}],          -- top 10
  top_gaps_brand: [{brand, total, missing}],          -- top 5 brands with most missing
  top_gaps_material: [{material, total, missing, pct}], -- top 5 materials with lowest coverage
  recent_logs: [{created_at, source, confidence, status, count}]  -- last 5 batched log entries
}
```

This single RPC call replaces 4 separate queries and eliminates the 1000-row truncation problem.

## Step 2: Rewrite `useTdStats` Hook

Replace the current multi-query approach in `src/hooks/useTdManagement.ts` with a single `supabase.rpc('get_td_coverage_stats')` call. Keep the same query key `['td-stats']` so existing invalidation logic works.

## Step 3: Rebuild `TdStatsHeader` Component

Rewrite `src/components/admin/td-management/TdStatsHeader.tsx` with 6 sections:

**Section A - Action Bar Enhancement**: Add a "Last updated: X ago" timestamp and a manual Refresh button to the toolbar area. (Small modification to `TdActionToolbar.tsx` -- add `dataUpdatedAt` from the query and a refresh button.)

**Section B - Stat Cards (6 cards in a grid)**:
- Card 1: Total Filaments
- Card 2: With TD (green arrow + delta tracking via localStorage of last known value)
- Card 3: Missing TD
- Card 4: Coverage % with a circular SVG progress ring (red/amber/cyan/green thresholds)
- Card 5: Reference Values count
- Card 6: Match Rate (With TD / Reference count)

**Section C - Coverage Charts**: Same horizontal bar layout but with:
- Raw counts shown alongside percentage: "PLA 2% (94/4,770)"
- Color-coded bars: red < 5%, amber 5-20%, green > 20%
- Data comes from the RPC, no truncation

**Section D - Recent Activity Feed**: Last 5 log entries from `td_population_log`, grouped by timestamp proximity (within 2 seconds = same batch). Each entry shows source, count of applied values, and confidence breakdown.

**Section E - Priority Gaps**: Two sub-cards:
- "Top 5 brands with most missing TD" (sorted by missing count desc)
- "Top 5 materials with lowest coverage" (sorted by coverage pct asc)

**Section F - Coverage Trend Sparkline**: Query `td_population_log` for daily applied counts over the past 30 days, render as a simple SVG sparkline (reuse the existing `TrendSparkline` pattern).

## Step 4: Action Bar Refresh Integration

In `TdActionToolbar.tsx`, add a small refresh button and "Last updated" text. No other changes needed -- the existing `invalidateQueries(['td-stats'])` calls already trigger re-fetches after actions.

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | Database migration | `get_td_coverage_stats()` RPC function |
| MODIFY | `src/hooks/useTdManagement.ts` | Rewrite `useTdStats` to use new RPC |
| REWRITE | `src/components/admin/td-management/TdStatsHeader.tsx` | Full 6-section Overview dashboard |
| MODIFY | `src/components/admin/td-management/TdActionToolbar.tsx` | Add refresh button + last-updated timestamp |

## Technical Notes

- The RPC function uses `GROUP BY` with `COUNT(transmission_distance)` which correctly counts non-null values without row limits
- Delta tracking ("+ 47 since last run") uses localStorage to persist the previous `with_td` count between page loads
- The circular progress ring is a pure SVG component (no library needed) -- a `circle` with `stroke-dasharray` proportional to coverage percentage
- All existing invalidation calls in the toolbar already target `['td-stats']`, so auto-refresh after actions works without changes
- The recent activity feed query groups logs within 2-second windows using `date_trunc('second', created_at)` in the RPC


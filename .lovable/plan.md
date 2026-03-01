

# Rebuild Population Log as Grouped Audit Trail

## Overview

Replace the flat table in `TdPopulationLog.tsx` with a batch-grouped, expandable audit trail. All grouping and parsing happens client-side from the same `td_population_log` table -- no schema changes needed.

## Architecture

```text
td_population_log (existing table, no changes)
        |
        v
  New hook: useTdPopulationLogBatched()
    - Fetches logs with filament join for product_title/vendor
    - Groups entries within 10-second windows by source
    - Returns: { batches[], stats }
        |
        v
  Rebuilt TdPopulationLog.tsx
    - Stats bar at top
    - Filter bar (date range, action, status, confidence, brand)
    - Batch summary cards (collapsible)
    - Expanded detail table per batch
    - Pagination (20 batches per page)
```

## Files

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `src/hooks/useTdManagement.ts` | Replace `useTdPopulationLog` with `useTdPopulationLogBatched` that fetches logs with filament join, groups into batches |
| REWRITE | `src/components/admin/td-management/TdPopulationLog.tsx` | Full rebuild with batch cards, expandable details, filters, stats bar, pagination |

## Hook: `useTdPopulationLogBatched`

**Query**: Fetch from `td_population_log` with a join to `filaments` to get `product_title` and `vendor`:
```text
supabase.from('td_population_log')
  .select('*, filaments!td_population_log_filament_id_fkey(product_title, vendor, material, color_family)')
  .order('created_at', { ascending: false })
  .limit(2000)
```

Apply filters server-side (status, source, confidence). Date range filter via `.gte('created_at', startDate)`.

**Client-side grouping**: Sort by `created_at` desc, then iterate and group entries where consecutive entries are within 10 seconds of each other AND have the same `source`. Each group becomes a "batch" object:

```text
interface LogBatch {
  id: string;           // first entry's id
  timestamp: string;    // earliest created_at in batch
  source: string;
  entries: LogEntry[];
  summary: {
    applied: number;
    skipped: number;
    errors: number;
    dryRun: number;
    highConf: number;
    medConf: number;
    lowConf: number;
    brands: string[];   // unique vendors from joined filament data
  };
}
```

**Filters interface** (expanded from current):
```text
interface TdLogFilters {
  status: string;       // all | applied | skipped | error | dry-run
  source: string;       // all | reference_match | csv_import | manual | 3dfilamentprofiles_auto
  confidence: string;   // all | high | medium | low
  brand: string;        // all | specific vendor
  dateRange: string;    // 24h | 7d | 30d | all
}
```

## Component: `TdPopulationLog.tsx` (Full Rebuild)

### Stats Bar
Four stat cards at the top:
- Total runs (batch count)
- Total TD values applied (sum of applied across all batches)
- Last run (relative timestamp of most recent batch)
- Most active brand (brand with most applied entries)

### Filter Bar
Row of dropdowns: Date Range, Action/Source, Status, Confidence, Brand. All use the existing `Select` component. Brand options derived from unique vendors in the fetched data.

### Batch List
Each batch renders as a collapsible card using the existing `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent` from Radix. The trigger row shows:
- Formatted timestamp + relative time (using `formatDistanceToNow`)
- Source badge with icon mapping: reference_match -> "Run Matching", csv_import -> "Bulk Import", 3dfilamentprofiles_auto -> "Fetch External", manual -> "Manual Edit"
- Results summary: "X applied, Y skipped, Z errors" with colored text
- Brands affected: first 3 brand names + "+N more" if more
- Confidence pills: small badges "X high / Y med / Z low"
- ChevronDown icon that rotates on expand

### Expanded Detail Table
Standard `Table` showing individual entries within the batch:
- Filament (product_title from join, or filament_id fallback)
- Brand (vendor from join)
- Color + Material (parsed from notes JSON)
- TD Value + Previous Value
- Confidence badge
- Rule (parsed from notes JSON `matchRule` field, e.g., "R1: Exact Match")
- Status badge

The notes JSON is parsed with `JSON.parse(log.notes)` wrapped in try/catch. Fields `refBrand`, `refColor`, `refMaterial`, `matchReason`, `matchRule` are extracted and displayed as structured columns.

### Pagination
Simple "Load More" button that increases the query limit, or page-based with Previous/Next using the existing Pagination components. Show 20 batches at a time.

### Clear Log Button
A "Clear Log" button with an AlertDialog confirmation. Calls `supabase.from('td_population_log').delete().neq('id', '')` -- deletes all log rows. Does NOT touch filaments.transmission_distance values. Invalidates query cache after.

## Technical Notes

- No database migration needed -- all data already exists in `td_population_log`
- The filament join provides product_title/vendor without extra queries
- Notes JSON parsing is defensive (try/catch) since some entries may have plain text notes
- The 10-second grouping window handles the fact that matching runs insert entries sequentially with small delays between them
- Pagination at 2000 rows per fetch is sufficient since the table won't grow beyond that quickly; the "Load More" pattern handles overflow


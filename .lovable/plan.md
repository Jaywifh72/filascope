
# Admin Search Analytics Dashboard

## Overview
Create a new admin page at `/admin/search-analytics` with four tabbed panels that provide deep insight into search behavior, zero-result gaps, conversion rates, and dictionary improvement opportunities. Uses the existing `AdminLayout`, `AdminPageHeader`, and admin auth gating.

## Changes

### 1. New page: `src/pages/admin/SearchAnalytics.tsx`
A tabbed page using the existing `AdminLayout` wrapper with four tabs:

**Tab 1: Zero-Result Queries**
- Fetches from the `search_zero_results` view (already exists), ordered by `search_count DESC`
- Columns: search_term, search_count, unique_sessions, last_searched_at, most_common_region
- Each row has an "Add as Synonym" button that opens a dialog where the admin can pick a target brand or material from `search_dictionaries` view, then inserts into a new `search_synonyms` table

**Tab 2: Top Search Queries**
- Fetches from `search_logs` (last 30 days, limit 1000), aggregates client-side
- Columns: search_term, total searches, % with results (`has_results` true count / total), avg results_count
- Sorted by total searches DESC

**Tab 3: Search-to-Click Conversion**
- Reuses the same session correlation pattern from the existing `SearchPanel.tsx`
- Shows: total search sessions, sessions that also had an affiliate click, conversion rate
- Additionally breaks down top converting search terms (terms where the session also had an affiliate click)

**Tab 4: Suggested Dictionary Additions**
- Fetches zero-result terms from `search_zero_results` view
- Runs each term through `levenshteinDistance()` (imported from `fuzzySearch.ts`) against known brands and materials from `search_dictionaries`
- Shows terms with Levenshtein distance 1-2 from a known brand/material
- Columns: search_term, closest_match, distance, search_count
- Each row has "Add to Typos" button (copies the suggested mapping to clipboard as a code snippet for `COMMON_TYPOS`)

### 2. New database table: `search_synonyms`
For the "Add as Synonym" feature, a simple table to store admin-defined mappings:

```text
search_synonyms
  id          UUID PK
  source_term TEXT NOT NULL (the misspelled/variant term)
  target_term TEXT NOT NULL (the correct brand/material name)
  target_type TEXT NOT NULL ('brand' | 'material')
  created_at  TIMESTAMPTZ DEFAULT now()
  created_by  UUID REFERENCES auth.users(id)

RLS: admin-only read/write via has_role()
```

### 3. Route registration in `App.tsx`
- Add lazy import: `const AdminSearchAnalytics = lazy(() => import("./pages/admin/SearchAnalytics"));`
- Add route: `<Route path="/admin/search-analytics" element={<AdminSearchAnalytics />} />`

### 4. Sidebar link in `AdminSidebar.tsx`
- Add to the "Analytics" nav group: `{ title: 'Search Analytics', href: '/admin/search-analytics', icon: Search }`

### 5. Quick link in `NewAdminPanel.tsx`
- Add a card linking to `/admin/search-analytics` with a Search icon

## Technical Details

### Zero-result query with synonym button
```typescript
const { data: zeroResults } = useQuery({
  queryKey: ["admin-zero-results"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("search_zero_results")
      .select("*")
      .order("search_count", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },
});
```

### Top queries aggregation
```typescript
const { data: topQueries } = useQuery({
  queryKey: ["admin-top-queries"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("search_logs")
      .select("search_term, results_count, has_results")
      .gte("created_at", thirtyDaysAgo)
      .limit(1000);
    if (error) throw error;
    // Group by search_term, compute count, % with results, avg results_count
    const map: Record<string, { total: number; withResults: number; sumResults: number }> = {};
    for (const row of data || []) { ... }
    return Object.entries(map)
      .map(([term, d]) => ({
        term, total: d.total,
        pctWithResults: ((d.withResults / d.total) * 100).toFixed(1),
        avgResults: (d.sumResults / d.total).toFixed(1),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 30);
  },
});
```

### Dictionary suggestions (Levenshtein matching)
```typescript
const suggestions = useMemo(() => {
  if (!zeroResults || !dictionaries) return [];
  const allTerms = [...dictionaries.brands, ...dictionaries.materials];
  return zeroResults
    .map(zr => {
      let bestMatch = "", bestDist = Infinity;
      for (const known of allTerms) {
        const dist = levenshteinDistance(zr.search_term.toLowerCase(), known.toLowerCase());
        if (dist < bestDist) { bestDist = dist; bestMatch = known; }
      }
      return { ...zr, closestMatch: bestMatch, distance: bestDist };
    })
    .filter(s => s.distance >= 1 && s.distance <= 2)
    .sort((a, b) => a.distance - b.distance || b.search_count - a.search_count);
}, [zeroResults, dictionaries]);
```

### Synonym insert
```typescript
const addSynonym = async (sourceTerm: string, targetTerm: string, targetType: string) => {
  await supabase.from("search_synonyms").insert({
    source_term: sourceTerm,
    target_term: targetTerm,
    target_type: targetType,
    created_by: user?.id,
  });
};
```

### Migration SQL
```sql
CREATE TABLE IF NOT EXISTS public.search_synonyms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_term TEXT NOT NULL,
  target_term TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'brand',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_search_synonyms_source ON public.search_synonyms(LOWER(source_term));

ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage search synonyms"
  ON public.search_synonyms FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

## Files Modified
- `src/pages/admin/SearchAnalytics.tsx` -- new page with 4 tabs
- `src/App.tsx` -- add lazy import and route
- `src/components/admin/AdminSidebar.tsx` -- add nav link
- `src/pages/NewAdminPanel.tsx` -- add quick link card
- Database migration -- create `search_synonyms` table

## What Does NOT Change
- Existing `SearchPanel.tsx` in the Analytics dashboard remains untouched
- `fuzzySearch.ts` is only imported (read-only) for the `levenshteinDistance` function
- `search_logs` and `search_zero_results` are read-only, no schema changes

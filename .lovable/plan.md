

# Complete Search Overhaul — Intent-Based Filtering + Property Ranking

## Problem Summary

The current search pipeline has a critical gap: the `smart-search` edge function and `search_filaments_ranked` RPC exist and are wired up, but they rely on `search_vector` (tsvector) matching which only contains actual column values like "TPU" — not descriptive property words like "flexible", "strong", or "heat-resistant". The `search_synonyms` table partially bridges this, but the system lacks a proper client-side intent parser that can decompose queries into structured filters before hitting the database.

## Architecture Overview

```text
User types "flexible red"
        |
        v
[Layer 1: Intent Parser]  (client-side, instant, new file)
  -> materialFilter: "TPU"
  -> propertyHint: { sortCol: "shore_hardness_d", dir: "asc", badge: "Flexibility" }
  -> colorFilter: "Red"
  -> freeText: "flexible red"
        |
        v
[Layer 2: smart-search Edge Function]  (existing, enhanced)
  -> Receives: { query, region, materialFilter, propertySortCol, propertySortDir }
  -> Passes materialFilter as hard WHERE clause to RPC
  -> Passes propertySortCol/Dir for ORDER BY override
        |
        v
[Layer 3: search_filaments_ranked RPC]  (existing, enhanced)
  -> Accepts new params: p_property_sort_col, p_property_sort_dir
  -> When material_hint present: WHERE material ILIKE '%TPU%'
  -> When property sort present: ORDER BY that column instead of ts_rank
  -> Falls back to tsvector ranking when no intent detected
        |
        v
[Frontend Presentation]
  -> Contextual badges on FilamentCard based on active search intent
  -> "Shore 95A" badge when flexibility search active
  -> "45 MPa" badge when strength search active
```

---

## Detailed Implementation Plan

### 1. New File: `src/lib/searchIntentParser.ts`

A pure function that parses a raw search string into structured intent. No API calls — runs instantly on every keystroke.

**Exports:**
- `parseSearchIntent(query: string): SearchIntent`
- `SearchIntent` type: `{ materialFilter: string | null, propertyHints: PropertyHint[], brandFilter: string | null, freeText: string }`
- `PropertyHint` type: `{ sortCol: string, dir: 'asc' | 'desc', badge: string, label: string }`

**Data maps (hardcoded constants):**

- `MATERIAL_ALIASES`: Maps ~30 keywords to canonical material names
  - `tpu`, `flex`, `flexible` -> `TPU`
  - `pla` -> `PLA`, `petg` -> `PETG`, `abs` -> `ABS`, etc.
  - `nylon`, `pa` -> `Nylon` (matches ILIKE)
  - `wood` -> `PLA-Wood`, `silk` -> `PLA Silk`

- `PROPERTY_SORT_MAP`: Maps ~20 descriptive keywords to database columns
  - `flexible`, `soft`, `shore`, `rubber`, `bendy` -> `{ sortCol: "shore_hardness_d", dir: "asc", badge: "Flexibility" }`
  - `strong`, `rigid`, `tough`, `engineering` -> `{ sortCol: "tensile_strength_xy_mpa", dir: "desc", badge: "Strength" }`
  - `heat`, `hot`, `outdoor`, `high-temp` -> `{ sortCol: "hdt_18_mpa_c", dir: "desc", badge: "Heat Resistance" }`
  - `fast`, `hs`, `high-speed`, `rapid` -> `{ sortCol: "print_speed_max_mms", dir: "desc", badge: "Print Speed" }`
  - `lightweight`, `light` -> `{ sortCol: "density_g_cm3", dir: "asc", badge: "Lightweight" }`
  - `stretchy`, `elastic` -> `{ sortCol: "elongation_break_xy_percent", dir: "desc", badge: "Stretch" }`

**Note on column names:** The database has `shore_hardness_d` (not `shore_hardness_a`), `hdt_18_mpa_c` (not `hdt_1_8mpa_c`), `tensile_strength_xy_mpa`, `print_speed_max_mms`, `density_g_cm3`, `elongation_break_xy_percent`. All verified from the schema.

**Logic:**
1. Lowercase + tokenize query
2. For each token, check `MATERIAL_ALIASES` first, then `PROPERTY_SORT_MAP`
3. Extract first material match and first property match
4. Return remaining unmatched tokens as `freeText`

---

### 2. Modify: `src/hooks/useSmartSearch.ts`

- Import and call `parseSearchIntent(searchTerm)` before invoking the edge function
- Pass `materialFilter` and `propertySortCol`/`propertySortDir` in the edge function request body
- Add `searchIntent` to the return value so Finder.tsx can access the active property hints for badge rendering

Updated body sent to edge function:
```text
{
  query: debouncedTerm,
  region: currentRegion,
  limit: pageSize,
  offset: page * pageSize,
  materialFilter: intent.materialFilter,      // NEW
  propertySortCol: intent.propertyHints[0]?.sortCol,  // NEW
  propertySortDir: intent.propertyHints[0]?.dir,      // NEW
}
```

New return fields:
- `searchIntent: SearchIntent` — the parsed intent object

---

### 3. Modify: `supabase/functions/smart-search/index.ts`

Accept 3 new optional fields from the request body: `materialFilter`, `propertySortCol`, `propertySortDir`.

Changes:
- If `materialFilter` is provided from the client, use it as `p_material_hint` (overriding the synonym-based one)
- Pass `propertySortCol` and `propertySortDir` as new params to the RPC
- The existing synonym lookup still runs as a fallback when no client-side intent is detected

Updated RPC call:
```text
supabase.rpc("search_filaments_ranked", {
  p_query: searchQuery,
  p_material_hint: materialFilter || materialHint,
  p_region: region,
  p_limit: limit,
  p_offset: offset,
  p_property_sort_col: propertySortCol || null,    // NEW
  p_property_sort_dir: propertySortDir || null,     // NEW
})
```

---

### 4. Database Migration: Enhance `search_filaments_ranked` RPC

Add two new parameters to the existing function: `p_property_sort_col text DEFAULT NULL` and `p_property_sort_dir text DEFAULT 'desc'`.

Key changes to the function:
- When `p_property_sort_col` is provided AND is one of the whitelisted columns (`shore_hardness_d`, `tensile_strength_xy_mpa`, `hdt_18_mpa_c`, `print_speed_max_mms`, `density_g_cm3`, `elongation_break_xy_percent`), use it as the ORDER BY column instead of `ts_rank_cd`
- NULLs sort last (so filaments without data don't crowd the top)
- The whitelist prevents SQL injection — only these 6 column names are allowed
- When `p_material_hint` is provided, apply it as a hard `WHERE` filter (not just a boost), since the client has explicitly identified the material intent

---

### 5. Modify: `src/pages/Finder.tsx`

- Access `smartSearch.searchIntent` to get the active property hints
- Pass `searchIntent` down to `FilamentCard` as a prop (or via context) so cards can render contextual badges
- When `searchIntent.propertyHints` is non-empty, show a small info bar above results: "Sorted by: [Flexibility — softest first]"

---

### 6. Modify: `src/components/FilamentCard.tsx`

Add a new optional prop: `searchPropertyBadge?: { badge: string, value: string | null }`.

When present, render a small badge on the card:
- For Flexibility: Show "Shore [X]D" if `shore_hardness_d` is available on the filament
- For Strength: Show "[X] MPa" from `tensile_strength_xy_mpa`
- For Heat Resistance: Show "HDT [X]C" from `hdt_18_mpa_c`
- For Print Speed: Show "[X] mm/s" from `print_speed_max_mms`
- For Lightweight: Show "[X] g/cm3" from `density_g_cm3`

Badge styling: Same amber chip style as smart chips (`bg-amber-500/15 text-amber-400 text-xs rounded-full px-2`). Only shown when search intent is active.

---

## Implementation Order

1. Create `src/lib/searchIntentParser.ts` (pure logic, no dependencies)
2. Database migration: enhance `search_filaments_ranked` with property sort params
3. Update `supabase/functions/smart-search/index.ts` to accept and forward new params
4. Update `src/hooks/useSmartSearch.ts` to use intent parser and pass params
5. Update `src/pages/Finder.tsx` to pass intent to cards
6. Update `src/components/FilamentCard.tsx` to render contextual badges

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/lib/searchIntentParser.ts` |
| Modify | `src/hooks/useSmartSearch.ts` |
| Modify | `supabase/functions/smart-search/index.ts` |
| Create | DB migration (enhance `search_filaments_ranked` RPC) |
| Modify | `src/pages/Finder.tsx` |
| Modify | `src/components/FilamentCard.tsx` |

---

## Risks and Mitigations

- **SQL injection in property sort**: Mitigated by strict server-side whitelist of 6 allowed column names. Any other value is ignored and falls back to ts_rank.
- **Sparse data**: Many filaments lack `shore_hardness_d` or mechanical properties. The ORDER BY puts NULLs last, so filaments with data bubble up. Badges only render when the value exists.
- **Backward compatibility**: The intent parser is additive. When no intent is detected, the system behaves exactly as before (tsvector ranking). The new RPC params default to NULL, so existing callers are unaffected.
- **Performance**: The intent parser runs client-side with zero latency. The RPC changes only affect ORDER BY, not the WHERE clause complexity — no performance regression.


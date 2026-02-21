

# Smart Search Overhaul for FilaScope

## Overview

Replace the current ILIKE substring search with a 3-layer intelligent search system: database full-text search (tsvector/tsquery), an edge function for query expansion via synonyms, and updated frontend components for autocomplete, smart chips, and ranked results.

---

## Current Architecture (What Exists Today)

- **Database**: `search_filaments_paginated` RPC uses ILIKE `%term%` matching on `product_title`, `vendor`, `material`, etc.
- **Frontend**: `useFinderQuery` hook calls that RPC with `p_search` param. `useSearchSuggestions` does separate ILIKE queries for brands, materials, and products to power the autocomplete dropdown.
- **Autocomplete**: `SearchInputWithHistory` renders a dropdown with brand/material/product/color/typo suggestions from `useSearchSuggestions`.
- **Dictionaries**: `search_dictionaries` view + `useSearchDictionaries` hook provides known brands/materials/colors for fuzzy matching and typo correction.

---

## Implementation Plan

### Phase 1: Database Layer

#### 1a. Add `search_vector` column + GIN index

Migration SQL:
- Add `search_vector tsvector` column to `filaments`
- Populate it: `UPDATE filaments SET search_vector = to_tsvector('english', coalesce(product_title,'') || ' ' || coalesce(vendor,'') || ' ' || coalesce(material,'') || ' ' || coalesce(finish_type,'') || ' ' || coalesce(color_family,''))`
- Create GIN index: `CREATE INDEX idx_filaments_search_vector ON filaments USING gin(search_vector)`
- Create trigger to auto-update on INSERT/UPDATE

#### 1b. Create `search_synonyms` table

```text
search_synonyms
  id           uuid PK default gen_random_uuid()
  term         text NOT NULL        -- e.g. "flexible", "carbon"
  synonyms     text[] NOT NULL      -- e.g. ["bendy", "flex", "rubbery"]
  maps_to_material text             -- e.g. "TPU"
  maps_to_tag  text                 -- e.g. "carbon_fiber"
  created_at   timestamptz default now()
```

RLS: public read (no auth required), admin write.

Seed with initial data (flexible->TPU, strong->ABS/Nylon, outdoor->ASA/PETG, etc.).

#### 1c. Create `search_filaments_ranked` RPC

PostgreSQL function that:
1. Accepts `p_query text, p_material_hint text, p_region text, p_limit int, p_offset int`
2. Converts `p_query` to a tsquery using `websearch_to_tsquery('english', p_query)`
3. Ranks results using `ts_rank_cd(search_vector, query)`
4. Falls back to ILIKE if tsquery yields zero results (graceful degradation)
5. Applies material hint as a boost (not a filter) when present
6. Returns JSON: `{ items: [...], total: int }`

This function follows the same pattern as the existing `search_filaments_paginated` RPC but with ranking.

---

### Phase 2: Edge Function — `smart-search`

New file: `supabase/functions/smart-search/index.ts`

Request: `POST { query, region, limit, offset }`

Processing pipeline:
1. Sanitize + tokenize the query
2. Look up each token against `search_synonyms` table
3. Expand terms (e.g. "flexible" adds "TPU" as material hint)
4. Build the tsquery string
5. Call `search_filaments_ranked` RPC
6. Return `{ results, expandedQuery, materialHint, totalCount }`

CORS headers included per edge function guidelines. JWT verification disabled in config.toml (public search endpoint).

---

### Phase 3: Frontend Changes

#### 3a. New hook: `src/hooks/useSmartSearch.ts`

- Manages debounced query state (300ms)
- Calls `smart-search` edge function via `supabase.functions.invoke()`
- Returns: `{ results, isLoading, expandedQuery, materialHint, chipFilters, setChipFilters }`
- Provides chip state management (add/remove synonym-expanded filters)

#### 3b. New component: `src/components/search/SearchAutocomplete.tsx`

- Dropdown below the search input showing:
  - Top 3 product matches (from smart-search results preview)
  - Detected brand/material matches
  - Synonym expansions as clickable chips ("flexible" -> "Showing TPU results")
- Replaces the suggestion logic currently embedded in `SearchInputWithHistory`

#### 3c. New component: `src/components/search/SearchSmartChips.tsx`

- Horizontal chip row rendered above the results grid
- Shows active search refinements: expanded synonyms, detected material, detected brand
- Each chip is removable (X button)
- Styled consistently with existing `ActiveFilterTags` component pattern

#### 3d. Modify: `src/components/search/SearchInputWithHistory.tsx`

- When `context === "filaments"`, use `useSmartSearch` instead of `useSearchSuggestions` for the primary suggestion flow
- Keep `useSearchSuggestions` as fallback for printers context
- Render `SearchAutocomplete` dropdown instead of the current inline suggestion UI
- "See all results" still navigates to `/filaments?search=...`

#### 3e. Modify: `src/pages/Finder.tsx`

- When `searchTerm` is present, use `useSmartSearch` results instead of `useFinderQuery`
- When `searchTerm` is empty, continue using `useFinderQuery` (catalog browsing mode)
- Render `SearchSmartChips` between the filter bar and the results grid when in search mode
- Show "expanded search" pill when `expandedQuery` differs from original query

#### 3f. Modify: `src/components/HeroSection.tsx`

- Pass the search submission through to the same `/filaments?search=...` route (no change needed -- already works)
- The smart search activates on the Finder page, not in the hero itself

#### 3g. UX States

- **Loading**: Existing `FilamentCardSkeletonGrid` already handles this
- **Zero results**: Existing `FilamentsEmptyState` component -- add expandedQuery context ("No results for X, also tried Y")
- **Partial match**: Show an "expanded search" info pill above results
- **Active chips**: `SearchSmartChips` component handles display and removal

---

## Implementation Order

1. Database migration (search_vector, GIN index, trigger, search_synonyms table, seed data)
2. `search_filaments_ranked` RPC function
3. `smart-search` edge function
4. `useSmartSearch` hook
5. `SearchAutocomplete` + `SearchSmartChips` components
6. Wire into `SearchInputWithHistory` and `Finder.tsx`
7. Test end-to-end

---

## Files Summary

| Action   | File                                             |
|----------|--------------------------------------------------|
| Create   | DB migration (search_vector, synonyms, RPC)      |
| Create   | `supabase/functions/smart-search/index.ts`        |
| Create   | `src/hooks/useSmartSearch.ts`                      |
| Create   | `src/components/search/SearchAutocomplete.tsx`     |
| Create   | `src/components/search/SearchSmartChips.tsx`        |
| Modify   | `src/components/search/SearchInputWithHistory.tsx` |
| Modify   | `src/pages/Finder.tsx`                             |
| Modify   | `src/components/filament/FilamentsEmptyState.tsx`  |
| Modify   | `supabase/config.toml` (smart-search JWT config)   |

---

## Risks and Mitigations

- **Fallback**: The `search_filaments_ranked` function falls back to ILIKE when tsquery returns 0 results, so existing search behavior is preserved.
- **Performance**: GIN index ensures tsvector search is fast. The edge function adds one network hop but returns ranked results, reducing client-side processing.
- **Backward compatibility**: `useFinderQuery` remains untouched for non-search catalog browsing. Smart search only activates when a search term is present.


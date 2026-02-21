

# Dynamic Search Dictionaries from Database

## Overview
Replace the hardcoded `KNOWN_BRANDS` (42 entries) and `KNOWN_MATERIALS` (29 entries) in `fuzzySearch.ts` with live data fetched from the database (48 brands, 83 materials, 22 color families). A new materialized view aggregates all dictionary terms in one query, a new hook fetches and caches them, and the fuzzy search functions accept optional override arrays.

## Changes

### 1. Create `search_dictionaries` database view (migration)
A simple SQL view (not materialized -- views are simpler and the data is small enough) that unions three queries:

```text
"brand"    -> SELECT brand_name FROM automated_brands WHERE is_visible = true
"material" -> SELECT name FROM materials
"color"    -> SELECT name FROM color_families
```

Each row has two columns: `dict_type` (text) and `term` (text). Grant SELECT to anon and authenticated roles.

### 2. New hook: `src/hooks/useSearchDictionaries.ts`
- Single `useQuery` with key `["search-dictionaries"]`
- Fetches all rows from the `search_dictionaries` view
- Groups results into `{ brands: string[], materials: string[], colors: string[] }`
- Uses `staleTime: 60 * 60 * 1000` (1 hour), `gcTime: 24 * 60 * 60 * 1000` (24 hours)
- Falls back to empty arrays on error (the fuzzy search functions will use hardcoded fallbacks)

### 3. Refactor `src/lib/fuzzySearch.ts`
- Keep `KNOWN_BRANDS` and `KNOWN_MATERIALS` as hardcoded fallbacks (renamed to `FALLBACK_BRANDS` / `FALLBACK_MATERIALS` internally)
- Add module-level `dynamicBrands` / `dynamicMaterials` variables with setter functions `setDynamicBrands()` / `setDynamicMaterials()`
- Update `getKnownBrands()` and `getKnownMaterials()` to return dynamic data when available, falling back to hardcoded arrays
- Update all internal functions (`getTypoSuggestion`, `getSimilarSuggestions`, `needsCorrection`) to call `getKnownBrands()` / `getKnownMaterials()` instead of referencing the hardcoded constants directly

### 4. Update `src/hooks/useSearchSuggestions.ts`
- Import and call `useSearchDictionaries()` at the top
- Add a `useEffect` that calls `setDynamicBrands(brands)` and `setDynamicMaterials(materials)` whenever the dictionary data loads
- No other changes needed -- all downstream functions (`getTypoSuggestion`, `getSimilarSuggestions`, `analyzeSearchQuery` via `getKnownBrands`/`getKnownMaterials`) automatically pick up the dynamic data

## Technical Details

### Database view SQL
```sql
CREATE OR REPLACE VIEW public.search_dictionaries AS
SELECT 'brand' AS dict_type, brand_name AS term
FROM public.automated_brands
WHERE is_visible = true
UNION ALL
SELECT 'material' AS dict_type, name AS term
FROM public.materials
UNION ALL
SELECT 'color' AS dict_type, name AS term
FROM public.color_families;

GRANT SELECT ON public.search_dictionaries TO anon, authenticated;
```

### Hook structure
```typescript
export function useSearchDictionaries() {
  return useQuery({
    queryKey: ["search-dictionaries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_dictionaries")
        .select("dict_type, term");
      if (error) throw error;
      const brands: string[] = [];
      const materials: string[] = [];
      const colors: string[] = [];
      for (const row of data || []) {
        if (row.dict_type === "brand") brands.push(row.term);
        else if (row.dict_type === "material") materials.push(row.term);
        else if (row.dict_type === "color") colors.push(row.term);
      }
      return { brands, materials, colors };
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
```

### fuzzySearch.ts setter pattern
```typescript
let dynamicBrands: string[] | null = null;
let dynamicMaterials: string[] | null = null;

export function setDynamicBrands(b: string[]) { dynamicBrands = b; }
export function setDynamicMaterials(m: string[]) { dynamicMaterials = m; }

export function getKnownBrands(): string[] {
  return dynamicBrands && dynamicBrands.length > 0 ? dynamicBrands : [...FALLBACK_BRANDS];
}
export function getKnownMaterials(): string[] {
  return dynamicMaterials && dynamicMaterials.length > 0 ? dynamicMaterials : [...FALLBACK_MATERIALS];
}
```

### Integration in useSearchSuggestions.ts
```typescript
const { data: dictionaries } = useSearchDictionaries();

useEffect(() => {
  if (dictionaries) {
    setDynamicBrands(dictionaries.brands);
    setDynamicMaterials(dictionaries.materials);
  }
}, [dictionaries]);
```

## What does NOT change
- `COMMON_TYPOS` stays hardcoded (hand-curated corrections)
- `multiTermSearch.ts` needs zero changes (already calls `getKnownBrands`/`getKnownMaterials`)
- `COLOR_FAMILIES` in `colorMatchUtils.ts` stays as-is for hex/swatch data (the view provides the family names for dictionary purposes only)
- All existing search behavior remains identical; dictionaries just grow dynamically

## Files modified
- `src/lib/fuzzySearch.ts` -- add setters, rename constants, use getters internally
- `src/hooks/useSearchDictionaries.ts` -- new file
- `src/hooks/useSearchSuggestions.ts` -- import hook, seed dynamic data via useEffect
- Database migration -- create `search_dictionaries` view with grants

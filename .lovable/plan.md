
# Enhance Search Bar: Multi-Term Queries and Color Suggestions

## Overview
Add two new suggestion categories to the search autocomplete: multi-term product matches (e.g., "bambu lab petg") and color family suggestions (e.g., typing "black" shows "Black filaments"). This improves discovery for compound queries and color-based browsing.

## Changes

### 1. Update `SearchSuggestion` type (useSearchSuggestions.ts)
- Extend the `type` union from `"brand" | "material" | "product" | "typo"` to include `"color"`
- Add optional `colorHex` field to `SearchSuggestion` for the swatch display

### 2. Multi-Term Decomposition (useSearchSuggestions.ts)
- Import `analyzeSearchQuery` from `@/lib/multiTermSearch`
- Add a new `useQuery` hook (`search-suggestions-multiterm`) that activates when `debouncedQuery` contains 2+ words
- Calls `analyzeSearchQuery(debouncedQuery)` to detect brands and materials
- If a brand is detected, runs a Supabase query filtering by both `vendor` (ilike detected brand) AND `material` (ilike remaining terms), selecting `id, product_title, vendor, material, product_handle`, limit 5
- Results are returned as `"product"` type suggestions
- In the combiner `useMemo`, multi-term product results are inserted after brand matches but before generic product suggestions, with priority (they replace some of the generic product slots)

### 3. Color Family Suggestions (useSearchSuggestions.ts)
- Import `COLOR_FAMILIES` from `@/lib/colorMatchUtils`
- Add a `useMemo` called `colorSuggestions` that:
  - Checks the debounced query against all `COLOR_FAMILIES` entries (name and families arrays)
  - For each match, queries a count or uses a static label
  - Creates a `SearchSuggestion` with `type: "color"`, `value: familyName`, `displayText: "{Name} filaments"`, `colorHex` from the COLOR_FAMILIES entry
- Add a `useQuery` for color family counts: query distinct `color_family` values matching the query from `filaments` table, count occurrences, limit 10
- Deduplicate by normalizing to the parent COLOR_FAMILIES name
- In the combiner, add up to 2 color suggestions after materials but before products (only if query matches a color term)

### 4. Handle "color" type in SearchInputWithHistory.tsx
- Update `getIcon` function: for `type === "color"`, render a small colored circle `<div>` using the suggestion's `colorHex` value (passed via a data attribute or by checking the suggestion object directly)
  - Refactor `getIcon` to accept the full suggestion object (not just type) so it can access `colorHex`
- Update `handleSelect`: for `type === "color"`, navigate to `/filaments?colors={value}` (matching the existing `?colors=` URL param that maps to `selectedColorFamilies` in the filter system)
- Close dropdown and blur input after selection

### 5. Finder.tsx Integration (existing, no changes needed)
The existing `?colors=` URL parameter in `useURLFilterSync.ts` already maps to `selectedColorFamilies`, so navigating to `/filaments?colors=Black` will automatically filter the catalog. No Finder.tsx changes required.

## Technical Details

### New Supabase query for multi-term (in useSearchSuggestions.ts)
```typescript
const { data: multiTermSuggestions = [] } = useQuery({
  queryKey: ["search-suggestions-multiterm", debouncedQuery],
  queryFn: async () => {
    const analysis = analyzeSearchQuery(debouncedQuery);
    if (analysis.detectedBrands.length === 0) return [];
    const brand = analysis.detectedBrands[0];
    const remaining = analysis.terms
      .filter(t => !brand.toLowerCase().includes(t))
      .join(" ");
    if (!remaining) return [];
    const { data, error } = await supabase
      .from("filaments")
      .select("id, product_title, vendor, material, product_handle")
      .ilike("vendor", `%${brand}%`)
      .ilike("material", `%${remaining}%`)
      .limit(5);
    if (error) throw error;
    // Map to SearchSuggestion with type "product"
    ...
  },
  enabled: debouncedQuery.split(/\s+/).length >= 2 && debouncedQuery.length >= 4,
  staleTime: 30000,
});
```

### Color suggestion matching (client-side from COLOR_FAMILIES)
```typescript
const colorSuggestions = useMemo((): SearchSuggestion[] => {
  if (!debouncedQuery || debouncedQuery.length < 2) return [];
  const q = debouncedQuery.toLowerCase();
  const matches: SearchSuggestion[] = [];
  for (const family of COLOR_FAMILIES) {
    if (family.hex.includes("gradient")) continue;
    const allNames = [family.name, ...family.families];
    if (allNames.some(n => n.toLowerCase().includes(q))) {
      matches.push({
        type: "color",
        value: family.name,
        displayText: `${family.name} filaments`,
        subtitle: `Browse all ${family.name.toLowerCase()} colors`,
        colorHex: family.hex,
      });
    }
    if (matches.length >= 2) break;
  }
  return matches;
}, [debouncedQuery]);
```

### Suggestion combiner order
1. Typo corrections (existing)
2. Intent suggestions (existing, when few matches)
3. Brand matches (existing, max 2)
4. Material matches (existing, max 1)
5. **Color suggestions (new, max 2)** -- only shown if query matches a color term
6. **Multi-term product matches (new)** -- shown first in product section
7. Generic product matches (existing, reduced to fill remaining slots)
8. Similar suggestions fallback (existing)

### Files modified
- `src/hooks/useSearchSuggestions.ts` -- main logic changes
- `src/components/search/SearchInputWithHistory.tsx` -- handle "color" type in icon and selection

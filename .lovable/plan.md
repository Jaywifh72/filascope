
# Multi-Word Search Implementation Plan

## Problem Analysis

The current search implementation in `Finder.tsx` (line 762) uses a single OR filter that requires the **entire search term** to match within a single field:

```typescript
query = query.or(`product_title.ilike.%${searchTerm}%,vendor.ilike.%${searchTerm}%`);
```

When a user searches for "Bambu Lab PETG", this query looks for the exact string "Bambu Lab PETG" in either `product_title` OR `vendor`. Since no product title contains that exact phrase (Bambu Lab products have titles like "PETG HF" with vendor "Bambu Lab"), the search returns 0 results.

**What should happen:** The search should tokenize "Bambu Lab PETG" into ["Bambu", "Lab", "PETG"] and find products where ALL tokens appear across ANY combination of searchable fields.

---

## Solution Architecture

### 1. New Utility: Multi-Term Search Parser (`src/lib/multiTermSearch.ts`)

Create a utility that:
- Tokenizes the query into individual terms (respecting quoted phrases)
- Normalizes terms (lowercase, trim whitespace)
- Handles special cases like hyphenated terms ("carbon-fiber" = "carbon fiber")
- Provides scoring based on match quality

```text
Input: "Bambu Lab PETG"
Output: ["bambu", "lab", "petg"]

Input: '"carbon fiber" PETG'
Output: ["carbon fiber", "petg"]
```

### 2. Two-Phase Search Strategy

**Phase 1: Database-Level Pre-Filtering (Supabase Query)**

Modify the Supabase query to use the FIRST term only for initial database filtering. This keeps the query performant and avoids full table scans:

```
WHERE product_title ILIKE '%bambu%' 
   OR vendor ILIKE '%bambu%' 
   OR material ILIKE '%bambu%'
```

**Phase 2: Client-Side Multi-Term Matching (Post-Fetch Filter)**

After fetching results, apply a client-side filter that checks ALL terms match across ANY field combination:

```text
For each filament:
  For each search term:
    Check if term appears in: vendor, product_title, material, finish_type, or color_family
  Product passes only if ALL terms are found
```

### 3. Relevance Scoring System

Rank results by how many fields match and match quality:

| Match Type | Score |
|------------|-------|
| Exact field match | +10 |
| Vendor match | +5 |
| Material match | +4 |
| Product title match | +3 |
| Finish type / color | +1 |

Products with higher scores appear first (when sort is "scoring-desc").

### 4. Enhanced Empty State with Smart Suggestions

When no results are found for a multi-term query like "Bambu Lab PETG", the empty state will offer contextual suggestions:

- **"Browse all PETG"** - Material filter applied
- **"View Bambu Lab filaments"** - Brand filter applied
- **"Try: PETG HF"** - Similar product names

---

## Implementation Details

### Files to Create

**`src/lib/multiTermSearch.ts`**
- `tokenizeSearchQuery(query: string): string[]` - Splits query into normalized tokens
- `matchesAllTerms(filament, terms, fields): boolean` - Tests if all terms match
- `calculateRelevanceScore(filament, terms): number` - Scores match quality
- `getSuggestionsFromQuery(query: string): { brands: string[], materials: string[] }` - Extracts filter suggestions

### Files to Modify

**`src/pages/Finder.tsx`**

1. Import the new utility functions
2. Modify `buildQuery()` (lines 749-831) to use first-term filtering for multi-word queries
3. Add a new `useMemo` block after `regionalFilaments` that applies multi-term filtering client-side
4. Pass new props to `FilamentsEmptyState` for smart suggestions

**`src/components/filament/FilamentsEmptyState.tsx`**

1. Add new props: `detectedBrands?: string[]`, `detectedMaterials?: string[]`
2. Render contextual CTAs: "Browse all [material]" and "View [brand] filaments"
3. Make these buttons functional (link to filtered views or trigger filter changes)

**`src/hooks/useSearchSuggestions.ts`**

1. Update product suggestions query to use multi-term matching for autocomplete dropdown
2. Show "Bambu Lab PETG" as a valid suggestion that would return results

---

## Technical Approach: Query Construction

**Current Query (single term only):**
```typescript
query.or(`product_title.ilike.%${searchTerm}%,vendor.ilike.%${searchTerm}%`)
```

**New Query (database pre-filter with first term):**
```typescript
const terms = tokenizeSearchQuery(searchTerm);
const firstTerm = terms[0];

if (firstTerm) {
  query = query.or(
    `product_title.ilike.%${firstTerm}%,` +
    `vendor.ilike.%${firstTerm}%,` +
    `material.ilike.%${firstTerm}%`
  );
}
```

**Client-Side Multi-Term Filter (after fetch):**
```typescript
const multiTermFiltered = useMemo(() => {
  if (!regionalFilaments || !searchTerm) return regionalFilaments;
  
  const terms = tokenizeSearchQuery(searchTerm);
  if (terms.length <= 1) return regionalFilaments; // Single term handled by DB
  
  return regionalFilaments.filter(f => matchesAllTerms(f, terms));
}, [regionalFilaments, searchTerm]);
```

---

## Search Fields Priority

The following fields will be searched (in priority order for scoring):

1. **vendor** - Brand name (e.g., "Bambu Lab", "Polymaker")
2. **material** - Material type (e.g., "PETG", "PLA Carbon Fiber")
3. **product_title** - Product name (e.g., "PETG HF", "PolyLite PLA")
4. **finish_type** - Surface finish (e.g., "Carbon", "Silk", "Matte")
5. **color_family** - Color category (e.g., "Red", "Black")

---

## Performance Considerations

1. **Debouncing**: Already implemented at 300ms in `useSearchSuggestions`
2. **Query Cache**: React Query caches results by search term - multi-term searches get their own cache entry
3. **No Full Table Scans**: Database query still uses ILIKE with first term, limiting initial result set
4. **Client-Side Filtering**: Only runs on already-fetched regional results (typically under 1000 items)
5. **Memoization**: All filtering uses `useMemo` to prevent recalculation on unrelated re-renders

---

## Test Cases

After implementation, these searches should return expected results:

| Query | Expected Result |
|-------|-----------------|
| "Bambu Lab PETG" | All Bambu Lab filaments with PETG material (~30 items) |
| "Polymaker PLA" | All Polymaker PLA products (~430 items) |
| "carbon fiber PETG" | PETG filaments with carbon fiber finish |
| "high speed PLA" | PLA filaments with high-speed designation |
| "silk red" | Red-colored silk finish filaments |
| "Prusament ASA" | Prusament brand ASA material products |

---

## Summary

This approach:
- Tokenizes multi-word queries into individual terms
- Matches ALL terms across ANY field combination
- Maintains database query performance (single-term pre-filter)
- Adds relevance scoring for result ranking
- Enhances empty state with contextual filter suggestions
- Works alongside existing sidebar filters (search narrows, filters narrow further)
- Preserves existing autocomplete functionality

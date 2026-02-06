
# Plan: Fix Filament Detail Page Slug Matching

## Problem Summary
Filament detail pages show "Filament Not Found" for valid products when the URL slug doesn't exactly match the database's `product_handle` or the generated slug. This happens when:
- A user types a URL manually (e.g., `/filament/bambu-lab-pla-basic-black`)
- The slug includes product title components that aren't in `color_family`
- The `product_handle` column is NULL for some products (~25% of catalog)

## Current Behavior
The page correctly shows a "Not Found" UI (not a redirect to "/"), but it fails to find valid products due to overly strict matching logic.

## Solution Overview
Improve the slug matching in `useFilamentBySlug.ts` to be more resilient by:
1. Adding more fallback search strategies
2. Improving color matching to handle partial matches
3. Using best-effort matching when exact matches fail

---

## Implementation Steps

### 1. Enhance Color Matching Logic
The current approach searches for the full parsed color (e.g., "basic black") but should try variations.

**Edit**: `src/hooks/useFilamentBySlug.ts`

- When color search fails, try searching with individual color words
- Add fallback to search with just brand + material (ignoring color)
- Score multiple results by similarity to the slug

### 2. Add Partial Word Matching for Colors
Extract significant color words from the slug and match them independently.

**Changes**:
```typescript
// Instead of just: color_family.ilike.%basic black%
// Try: color_family.ilike.%black% OR product_title.ilike.%black%
// Extract the last word of the color as the primary color term
```

### 3. Add Brand+Material Only Fallback
If color-based search returns no results, try finding products with just brand + material, then use the first result.

**Changes**:
```typescript
// If componentData is empty after color search:
// 1. Remove color filter
// 2. Search by brand + material only
// 3. Return first result as best-effort match
```

### 4. Improve Slug Similarity Scoring
When multiple products match, score them by how closely their generated slug matches the requested URL.

**Changes**:
```typescript
// Use Levenshtein distance or token overlap to find best match
// Even if exact slug doesn't match, pick the closest one
```

### 5. Log and Auto-Heal Missing Handles
Continue the existing behavior of updating `product_handle` when a match is found, but also log cases where fuzzy matching was needed for debugging.

---

## Technical Details

### File to Edit
`src/hooks/useFilamentBySlug.ts`

### Key Logic Changes

1. **Split color search**: 
   - First try full color phrase
   - Then try last word only (primary color)
   - Then try brand+material without color

2. **Best-effort matching**:
   - When no exact slug match found, use token-based similarity
   - Count how many words from the slug appear in the generated slug
   - Pick the result with highest overlap

3. **Fallback chain**:
```
product_handle exact match
  ↓ (not found)
fuzzy product_handle match
  ↓ (not found)  
component search (brand + material + full color)
  ↓ (not found)
component search (brand + material + primary color word)
  ↓ (not found)
component search (brand + material only)
  ↓ (still not found)
Show "Not Found" page
```

### Example Fix for "bambu-lab-pla-basic-black"

**Before** (fails):
- Parses to `{brand: 'bambu-lab', material: 'pla', color: 'basic-black'}`
- Searches `color_family ILIKE '%basic black%'` → 0 results
- Shows "Not Found"

**After** (succeeds):
- Parses to `{brand: 'bambu-lab', material: 'pla', color: 'basic-black'}`
- Searches `color_family ILIKE '%basic black%'` → 0 results
- Fallback: Extract primary color word "black"
- Searches `color_family ILIKE '%black%'` → Multiple results
- Scores by similarity: "bambu-lab-pla-black" has highest overlap with "bambu-lab-pla-basic-black"
- Returns best match

---

## Files Changed
| File | Changes |
|------|---------|
| `src/hooks/useFilamentBySlug.ts` | Add multi-stage fallback search, improve color parsing, add similarity scoring |
| `src/lib/seoSlugUtils.ts` | Add helper function for slug similarity scoring |

## Testing Scenarios
After implementation, verify these URLs resolve correctly:
- `/filament/formfutura-pla-maize-yellow` ✓ (already works)
- `/filament/bambu-lab-pla-basic-black` → Should find PLA Basic Black
- `/filament/bambu-lab-abs` → Should find first Bambu Lab ABS product
- `/filament/nonexistent-brand-xyz` → Should show "Not Found"


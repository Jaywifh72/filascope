

# Fix: TypeError on `.toLowerCase()` of undefined

## Root Cause

Several utility functions in `src/lib/` call `.toLowerCase()` on values that can be `null` or `undefined` (e.g., `product_title`, `material`, `vendor` from filament database records). The primary crash site is `src/lib/smartComparisonService.ts` lines 157-158, where `current.product_title.toLowerCase()` and `candidate.product_title.toLowerCase()` are called without null guards. This function runs during filament/comparison page navigation.

## Changes

### 1. `src/lib/smartComparisonService.ts` -- Primary crash fix

- Line 68: `title.toLowerCase()` -- add fallback: `(title || '').toLowerCase()`
- Lines 107-108: Add `|| ''` fallbacks for `product_title` and `material`
- Line 123: `baseMaterial.toLowerCase()` -- already safe via `getBaseMaterial` fallback, but add guard
- Lines 157-158: `current.product_title.toLowerCase()` and `candidate.product_title.toLowerCase()` -- add `|| ''` fallback
- Line 167: `candidateMaterial.toLowerCase()` -- add optional guard

### 2. `src/lib/filamentSimilarity.ts` -- Secondary crash risk

- Line 93: `filament.finish_type.toLowerCase()` -- already guarded by `if` check, safe
- Line 108: `(filament.product_title || "").toLowerCase()` -- already safe
- Audit remaining `.toLowerCase()` calls in this file for any unguarded ones

### 3. `src/lib/personalizationEngine.ts` -- Audit and guard

- Search for unguarded `.toLowerCase()` calls on nullable filament fields

### 4. `src/lib/fuzzySearch.ts` -- Already safe (takes `string` params)

### 5. `src/components/filament/BrandQuickLinks.tsx`

- Line 25: `material.toLowerCase()` -- already guarded by truthy check on line 22, safe

### 6. `src/lib/analytics.ts`

- Line 118: `params.affiliateProgram?.toLowerCase()` -- already uses optional chaining, safe

### 7. `src/utils/brandSlug.ts`

- `name.toLowerCase()` -- called on required `string` param, safe

## Scope

Only files where `.toLowerCase()` (or `.toUpperCase()`, `.includes()`, `.split()`) is called on a value sourced from a database record field that could be `null` will be changed. The fix adds `|| ''` fallbacks or optional chaining. No UI, styling, or behavioral changes.

## Files to modify

| File | Risk | Fix |
|------|------|-----|
| `src/lib/smartComparisonService.ts` | **High** -- confirmed crash | Add `\|\| ''` to lines 68, 157, 158 |
| `src/lib/filamentSimilarity.ts` | Medium | Audit + guard any unprotected calls |
| `src/lib/personalizationEngine.ts` | Medium | Audit + guard |
| `src/hooks/usePersonalizedRecommendations.ts` | Low | Line 88 already guarded by `if` |
| `src/pages/HueForgeTDDatabase.tsx` | Low | Lines 377-378 sort comparison -- add guards |


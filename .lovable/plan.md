

# Filament Similarity Engine

## Problem
The "Similar filaments" and "Cheaper Alternative" features match purely by base material name (e.g., anything starting with "PLA"). This produces bad recommendations -- a Shiny Silk PLA gets recommended as "similar" to a Matte PLA, even though they are functionally opposite products.

## Solution
Create a shared similarity scoring utility that understands finish type, reinforcement, diameter, temperature compatibility, and high-speed capability -- using data already in the database.

## Architecture

### Step 1: New file `src/lib/filamentSimilarity.ts`

Exports these functions:

- **`getBaseMaterial(material)`** -- Normalizes "PLA-CF" to "PLA", "PA6-GF" to "PA", etc. Consolidates the 5+ scattered implementations already in the codebase.

- **`getFinishType(filament)`** -- Returns normalized finish from the `finish_type` column, falling back to title parsing (reuses logic from existing `filamentHelpers.ts` functions like `isSilkFilament`, `isMatteFilament`, etc.). Returns one of: "standard", "matte", "silk", "gloss", "satin", "galaxy", "marble", "glow", "dual-color", "gradient", "metallic", "sparkle", "wood", "stone", "transparent", "translucent".

- **`isReinforced(filament)`** -- Checks `carbon_fiber_percentage`, `glass_fiber_percentage`, and title patterns for CF/GF.

- **`isDisqualified(source, candidate)`** -- Hard disqualification rules:
  1. Different base material
  2. Different diameter (1.75mm vs 2.85mm)
  3. Reinforcement mismatch (CF vs non-CF)
  4. Nozzle abrasiveness mismatch

- **`computeSimilarityScore(source, candidate)`** -- Scoring (max 100 points):
  - Finish type match: 35 pts (exact match) / 20 pts (same family) / 0 pts (different family)
  - Temperature compatibility: 20 pts
  - High-speed match: 15 pts
  - Price tier (neutral): 15 pts
  - Spool size: 10 pts
  - Has image: 5 pts

- **`buildSimilarityQuery(source, options)`** -- Builds a Supabase query with hard constraints as SQL filters (same base material, same diameter, matching reinforcement), selecting all fields needed for client-side scoring.

### Step 2: Update `src/hooks/useSimilarFilamentsEnhanced.ts`

- Replace the current `.eq("material", currentFilament.material)` query with `buildSimilarityQuery()` which uses `.ilike("material", baseMaterial + "%")` plus reinforcement filters
- After fetching candidates, run `computeSimilarityScore()` on each and sort by score
- Filter out any `disqualified` results
- Keep existing deduplication, brand diversity (max 2 per brand), and sorting logic

### Step 3: Update `src/components/filament/CheaperAlternativeCallout.tsx`

- Import `getBaseMaterial`, `getFinishType`, `isReinforced`, `computeSimilarityScore` from the new utility
- Add `finish_type`, `carbon_fiber_percentage`, `glass_fiber_percentage`, `high_speed_capable`, `is_nozzle_abrasive`, `diameter_nominal_mm`, `nozzle_temp_min_c`, `nozzle_temp_max_c` to the Supabase select
- After fetching candidates, filter out disqualified ones and only recommend alternatives with a similarity score above 50 ("close_match" or better)
- This prevents recommending a Silk PLA as a "cheaper alternative" to a Matte PLA

## Technical Details

**Finish families** (for partial-match scoring):
- "smooth_standard": standard, matte, satin
- "glossy_decorative": silk, gloss, metallic, galaxy, sparkle
- "effect": marble, glow, dual-color, gradient, wood, stone
- "transparent_family": transparent, translucent

**FilamentProfile type** required by scoring functions:
```text
material, finish_type, carbon_fiber_percentage, glass_fiber_percentage,
high_speed_capable, is_nozzle_abrasive, diameter_nominal_mm,
nozzle_temp_min_c, nozzle_temp_max_c, product_title, net_weight_g,
featured_image, variant_price
```

**No database changes needed** -- all required columns already exist in the `filaments` table.

**Performance**: Scoring runs client-side on 60-120 candidate rows (simple arithmetic), adding negligible overhead.

## Files Changed
1. **Created**: `src/lib/filamentSimilarity.ts` -- shared similarity engine
2. **Modified**: `src/hooks/useSimilarFilamentsEnhanced.ts` -- use new query builder and scoring
3. **Modified**: `src/components/filament/CheaperAlternativeCallout.tsx` -- use similarity scoring to filter alternatives
4. **Modified**: `src/hooks/useSimilarFilaments.ts` -- update to use shared utility (used by SuggestionChips in compare tray)


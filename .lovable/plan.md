

## Unify Edge Function Color Maps with Frontend

### Summary
Copy the full `COLOR_NAME_TO_HEX` (~244 entries) and `COLOR_FAMILY_MAP` (~80+ entries) from `src/utils/colorMapping.ts` into `supabase/functions/_shared/filament-utils.ts`, replacing the smaller maps. Add the fallback base-color-word logic to the Deno-side `guessColorHex`.

### Changes (1 file only)

**`supabase/functions/_shared/filament-utils.ts`**

1. **Replace `COLOR_HEX_MAP`** (lines 11–54, 43 entries) with all entries from `COLOR_NAME_TO_HEX` (lines 19–244 of colorMapping.ts, ~225 entries). Keep the name `COLOR_HEX_MAP` and `Record<string, string>` type.

2. **Replace `COLOR_FAMILY_MAP`** (lines 60–77, ~40 keyword entries) with the full map from colorMapping.ts (lines 259–337, ~80+ entries). Adds missing families: gemstone names, neons, nature words, metallics (bronze/copper/rose gold), beige group, multi-color, etc.

3. **Update `guessColorHex`** (lines 180–187): After the existing substring loop (line 185), before `return null`, add a `FALLBACK_COLOR_WORDS` map matching the frontend version (16 entries including cyan, teal, magenta) and loop through it for base-color-word matching.

### What stays unchanged
- All other functions in filament-utils.ts (parseSpecsFromHtml, extractWeightFromText, detectOptionPositions, etc.)
- `src/utils/colorMapping.ts` — no changes
- No other files touched

### Result
- `COLOR_HEX_MAP`: 43 → ~225 entries (+182)
- `COLOR_FAMILY_MAP`: ~40 → ~80+ entries (+40)
- `guessColorHex`: gains fallback base-color-word logic (16 words)


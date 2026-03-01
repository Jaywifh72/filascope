

# Bulk Insert Community TD Reference Values

## Overview

Insert ~150+ community-verified TD values from 3DFilamentProfiles.com for 10 brands (Polymaker, Bambu Lab, eSUN, Hatchbox, Overture, Sunlu, Inland, ColorFabb, Fillamentum, Atomic Filament) into the `td_reference_values` table, respecting existing high-confidence entries.

## Approach

Use the database insert tool to execute an `INSERT ... ON CONFLICT` statement that:
- Inserts new entries with `source: "3dfilamentprofiles_community"` and `confidence: "medium"`
- On conflict (same brand/material/color), only updates if the existing confidence is NOT "high"
- Skips entries where no TD value is provided (e.g., "Yellow (no TD)")

The unique index `idx_td_ref_unique` on `(lower(brand_name), lower(material_type), lower(color_name))` enables clean upsert behavior.

## SQL Logic

```text
INSERT INTO td_reference_values (brand_name, color_name, material_type, td_value, source, confidence)
VALUES (...)
ON CONFLICT (lower(brand_name), lower(material_type), lower(color_name))
DO UPDATE SET
  td_value = EXCLUDED.td_value,
  source = EXCLUDED.source,
  updated_at = NOW()
WHERE td_reference_values.confidence != 'high';
```

This single statement handles all three cases:
- New entry: INSERT
- Existing with "medium"/"low" confidence: UPDATE td_value
- Existing with "high" confidence: skipped by the WHERE clause

## Data Summary

| Brand | Material Lines | Approx Entries |
|-------|---------------|----------------|
| Polymaker | PolyLite ABS, PolyLite ASA, PolyTerra PLA, PolyLite PLA, ASA Basic | ~50 |
| Bambu Lab | ABS Basic, ABS GF, ASA Basic/CF, PC Basic, PLA Basic, PLA Matte, PETG Basic | ~45 |
| eSUN | PLA+ | 8 |
| Hatchbox | PLA, ABS, PETG | ~15 |
| Overture | PLA, PETG | ~11 |
| Sunlu | ABS, PLA | ~8 |
| Inland | PLA | 2 |
| ColorFabb | PLA Economy, PLA Matte | 3 |
| Fillamentum | PLA Extrafill, ABS EasyFil, PETG Sparkle, PLA Crystal | ~7 |
| Atomic Filament | PLA | 2 |

## Conflict Resolution Details

Existing high-confidence entries that will be preserved (not overwritten):
- All 71 Prusament "prusa_official" entries
- Bambu Lab PLA Basic/Matte/PETG Basic (23 entries, "hueforge_community" high)
- eSUN PLA+ (8 entries, high)
- Hatchbox PLA (7 entries, high)
- Polymaker PolyLite PLA and PolyTerra PLA (17 entries, high)
- Fillamentum PLA Extrafill Traffic White/Black (2 entries, high)
- Atomic Filament PLA (2 entries, high)

Entries that will be updated (existing medium confidence):
- ColorFabb PLA Economy Black/White
- Inland PLA Black/White
- Overture PLA Black/White/Red
- Sunlu PLA entries
- Hatchbox Silver

## Technical Steps

1. Execute a single bulk `INSERT ... ON CONFLICT` SQL statement with all ~150 values
2. Verify final row count in td_reference_values after insertion
3. No code changes needed -- the existing `useTdMatching` hook and `match_td_reference_values` RPC already handle case-insensitive brand matching via `ILIKE`

## No Code Changes Required

The existing matching infrastructure already handles:
- Case-insensitive brand matching (`ILIKE '%brand%'`)
- Multi-word product lines in `product_title` (`ILIKE '%PolyTerra%'`)
- Single-word material fallback (`material = 'PLA'`)

This is a data-only operation.


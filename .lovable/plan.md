

# Enhanced TD Matching Algorithm

## Problem Analysis

The current matching engine fails because of three structural mismatches in the data:

1. **Missing color_family**: 1,257 of 8,166 filaments (including all Polymaker and Hatchbox) have `color_family = NULL`. Colors are embedded in `product_title` (e.g., "PolyLite(TM) ABS - Black", "BLACK PLA FILAMENT - 1.75MM, 1KG SPOOL").

2. **Product line naming**: Reference data stores `material_type` as "PolyLite ABS" or "PLA Basic", while filament `product_title` may contain "PolyLite(TM) ABS" (with trademark symbol) or just "ABS".

3. **No fuzzy matching**: Current code requires exact `color_family === ref.color_name`, missing grey/gray variations and compound color names like "Charcoal Black" vs "Black".

## Solution: Rewrite `useTdMatching.ts` with 5-Rule Cascade

### Architecture Change

Instead of querying per-reference-value (234 DB queries), load all candidate filaments in a single query, then match in-memory. This is both faster and enables multi-rule cascading.

```text
1. Load all td_reference_values (single query)
2. Load all filaments WHERE transmission_distance IS NULL (paginated, 1000/page)
3. Build lookup maps: material aliases, color normalizer
4. For each filament, try Rules 1-5 in priority order against all refs
5. Keep best match (highest confidence) per filament
```

### Rule Implementations

**Pre-processing** (runs once before matching):
- Normalize colors: lowercase, strip suffixes (1Kg, 850g, 1.75mm, 2.85mm, Spool, Filament), grey->gray
- Extract color from product_title for filaments with NULL color_family:
  - Pattern: "ProductLine - ColorName" (Polymaker style)
  - Pattern: "COLORNAME MATERIAL FILAMENT" (Hatchbox style)
  - Pattern: plain color_family field (Bambu Lab style)
- Build material family map for alias lookups
- Strip trademark symbols from product_title for matching

**Rule 1 -- Exact Brand + Color + Material (high)**:
- vendor matches brand (case-insensitive)
- Extracted/normalized color matches ref color
- Material matches via alias map (PLA+ -> PLA family, PLA Basic -> PLA family)

**Rule 2 -- Product Line Match (high)**:
- vendor matches brand
- product_title contains the ref's product line (e.g., "PolyTerra" in "PolyTerra(TM) PLA - Sakura Pink")
- Color matches (extracted from title or color_family)

**Rule 3 -- Fuzzy Color Match (medium)**:
- Brand and material match exactly
- Color matching with normalization:
  - "Dark Grey" = "Dark Gray"
  - "Traffic White" fallback to "White"
  - "Jet Black" fallback to "Black"
  - Strip brand prefixes: "Prusa Orange" -> "Orange", "Bambu Green" -> "Green"

**Rule 4 -- Hex Code Proximity (low)**:
- Brand and material match
- Reference has hex_code, filament has color_hex
- RGB Euclidean distance less than 30

**Rule 5 -- Material Family Fallback (low)**:
- Same brand + same color found
- TD exists for base material (PLA) but filament is variant (PLA+, PLA Matte)
- Only within same material family

### Performance Strategy

- Single bulk fetch of filaments (paginated at 1000 rows)
- Single fetch of all reference values
- All matching runs in-memory with pre-built indexes (Maps keyed by normalized vendor)
- Progress updates every 100 filaments
- Expected runtime: 2-5 seconds for 8,166 filaments

## Files to Modify

| Action | File | Description |
|--------|------|-------------|
| REWRITE | `src/hooks/useTdMatching.ts` | New 5-rule cascade engine with color extraction and material aliasing |
| CREATE | `src/lib/tdMatchingUtils.ts` | Pure utility functions: color normalizer, color extractor, material alias map, hex distance |
| MODIFY | `src/components/admin/td-management/TdMatchResultsPanel.tsx` | Add confidence filter buttons, summary stats bar, "Select All High" button |

## UI Enhancements to TdMatchResultsPanel

- **Summary bar**: "423 high, 187 medium, 92 low -- 702 total out of 8,166 missing"
- **Filter buttons**: "All", "High Only", "Medium+Low Only" to toggle visible rows
- **"Select All High Confidence" button** for quick bulk-apply of safe matches
- **Match rule column**: Shows which rule matched (e.g., "R1: exact brand+color+material", "R3: fuzzy color grey->gray")

## Technical Details

### Color Extraction from Product Title

```text
"PolyLite™ ABS - Black"           -> "Black"     (split on " - ", take last part)
"BLACK PLA FILAMENT - 1.75MM"     -> "Black"     (first word(s) before material keyword)
"ABS-GF"                          -> null        (no color in title, skip)
"PLA Basic"                       -> null        (no color, use color_family)
```

### Material Alias Map

```text
Reference "PLA Basic" -> matches filament material "PLA" (strip "Basic")
Reference "PolyLite ABS" -> matches product_title containing "PolyLite" AND material "ABS"
Reference "PLA" -> matches material "PLA", "PLA+", "PLA Pro" (family expansion for Rule 5)
```

### Matching Priority

When multiple references match the same filament, keep the one with highest confidence. If tied, prefer:
1. Exact product line match over base material match
2. Exact color over fuzzy color
3. Higher TD specificity (product-line-specific over generic material)


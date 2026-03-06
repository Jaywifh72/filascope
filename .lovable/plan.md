

# Fix SUNLU Adapter: Smart Option Position Detection

## Problem
The SUNLU adapter hardcodes option positions (`option1`=Region, `option2`=Material, `option3`=Color), but real SUNLU products have inconsistent option names and positions across their catalog.

## Solution

### Add `detectOptionPositions()` function (before line 317)

A new function that inspects the product's `options` array and matches option names against keyword lists:

- **Region**: "ship", "shipment", "country", "region", "destination"
- **Material**: "material", "type", "types", "category" (but NOT if name also contains "color")
- **Color**: "color", "colour", "material/color"
- **Package** (ignored): "pack", "package", "specifications"

Logic:
1. Iterate `product.options` (each has `name` and `position`)
2. Normalize name to lowercase, match against keyword lists
3. Handle compound names: "Material/Color" → treat as Color
4. Return `{ regionKey, materialKey, colorKey }` as `"option1"`, `"option2"`, or `"option3"`
5. Fall back to config's `variant_mapping` values if no match found
6. Log warnings for undetected fields

### Modify `adaptSunlu()` (lines 331-334)

Replace the static config reads:
```typescript
const regionOption = config.variant_mapping?.region_option || "option1";
const materialOption = config.variant_mapping?.material_option || "option2";
const colorOption = config.variant_mapping?.color_option || "option3";
```

With:
```typescript
const detected = detectOptionPositions(product, config);
const regionOption = detected.regionKey;
const materialOption = detected.materialKey;
const colorOption = detected.colorKey;
```

### File changed
| File | Change |
|------|--------|
| `supabase/functions/extract-filament-data/index.ts` | Add `detectOptionPositions()` ~20 lines before line 317; update lines 331-334 to use it |


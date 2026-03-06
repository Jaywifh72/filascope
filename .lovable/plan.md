

## Plan: Fix Extraction Quality in sync-brand-catalog

This plan focuses on two files: the Edge Function `supabase/functions/sync-brand-catalog/index.ts` (primary) and the shared utils `supabase/functions/_shared/filament-utils.ts` (new helpers). No UI, DB, or routing changes.

---

### 1. Enhanced `classifyProduct()` — Better Filtering (sync-brand-catalog ~lines 47-100)

Add these exclusion rules before existing logic:

- Title contains "clearance" (case-insensitive) → skip
- Title starts with `[` and contains `Only]` → skip (catches `[Canada Only]`, `[Europe Only]`, etc.)
- Title contains both "combo" and "mix" → skip (multi-material samplers)
- Title contains "bundle" and a quantity pattern like `\d+g\*\d+` or "pack" → skip
- Product has an option named "Price" or "Note" → skip (warranty/service products)
- Product options don't include any color/material/region-like option AND don't include filament keywords in title → skip

### 2. Fix Core Variant Grouping — Group by COLOR, Not COLOR+REGION (sync-brand-catalog ~lines 214-332)

**Root cause fix.** Currently `colorKey` groups by the raw option value which includes region info for multi-region products. The fix:

- Add `mapRegionToCode()` helper (inline in the Edge Function)
- When grouping variants, extract the **color** value using `detected.colorKey` and group by that alone
- Within each color group, iterate variants to extract per-region prices using `detected.regionKey` + `mapRegionToCode()`
- Also group by **material** within each color group if `detected.materialKey` exists (so "PLA / Black" and "PETG / Black" stay separate)
- The grouping key becomes `{material}|{color}` — region is never part of the key

### 3. Robust `getMaterial()` — Aggressive Cleaning (sync-brand-catalog ~lines 198-212)

Replace the simple `cleanMaterial()` call with aggressive cleaning:

- Remove weight patterns: `\d+(\.\d+)?\s*[kK][gG]`, `\d+[gG]\b`
- Split on `|` and take first part
- Remove parenthetical content: `\(.*?\)`
- Remove quantity patterns: `\d+\*[A-Z]\d+`
- Strip known color names (BLACK, WHITE, RED, etc.) from material string
- Apply known mappings: "PLA Neon Series" → "PLA", "High Speed PLA" → "HSPLA", "Matte PLA" → "Matte PLA", "PLA Meta" → "PLA Meta", "PLA Transparent Series" → "PLA"
- Fallback: parse from product title using ordered material keywords (most specific first: "Silk PLA" before "PLA", "PLA+" before "PLA")
- Final fallback: `config.default_material_type || "PLA"`

This will be a new `cleanMaterialAggressive()` function in the Edge Function (not shared utils, to avoid breaking `extract-filament-data`).

### 4. Clean Color Name Extraction (sync-brand-catalog, after color grouping)

After getting the raw color option value, apply cleaning pipeline:

1. Strip material prefix (existing `stripMaterialPrefix`)
2. Strip weight patterns: `\d+(\.\d+)?\s*[kK][gG]`, `\d+[gG]\b`
3. Strip region markers: `\(AU PLUG\)`, `\(EU PLUG\)`, `\(US PLUG\)`
4. Strip product codes: `\d+\*[A-Z]\d+`, `DLZ-\w+`
5. If contains `|`, take the part that best matches a color (contains a COLOR_HEX_MAP key, or is shortest)
6. Title-case: "BLACK" → "Black", "SKY BLUE" → "Sky Blue"
7. If empty after cleaning → "Default"

New function `cleanColorName()` inline in the Edge Function.

### 5. Display Name Generation (sync-brand-catalog ~line 285)

Replace current `displayName = \`${material} - ${colorName}\`` with:
- If cleaned color is "Default" or empty → just material name
- Otherwise → `"{Material} - {Color}"` with both properly cased

### 6. Price Change Detection — Ignore Null→Value (sync-brand-catalog ~lines 399-403)

In `diffAgainstDatabase()`, change the comparison:
```
// OLD: if (newVal !== null && oldVal !== newVal)
// NEW: if (newVal !== null && oldVal !== null && oldVal > 0 && Math.abs(oldVal - newVal) > 0.01)
```
When old is null/0 and new has a value → treat as "matched" (data enrichment, not a price change).

### 7. Variant Image Resolution (sync-brand-catalog ~lines 270-276)

Improve image matching per color group:
- Check each variant in the color group for `featured_image.src`
- Check `product.images[]` for images whose `variant_ids` include any variant ID from this color group
- `featured_image` = product's first image (hero shot)
- `variant_image` = color-specific image from variant or variant_ids match

### 8. `mapRegionToCode()` Helper (sync-brand-catalog, new function)

```typescript
function mapRegionToCode(regionValue: string | null, regionMap: Record<string, string>): string | null {
  if (!regionValue) return null;
  // Config region_map exact match first
  for (const [mapKey, code] of Object.entries(regionMap)) {
    if (regionValue.includes(mapKey)) return code;
  }
  // Fallback keyword matching
  const rv = regionValue.toLowerCase();
  if (rv.includes('usa') || rv.includes('united states')) return 'US';
  if (rv.includes('europe') || rv.includes('eu')) return 'EU';
  if (rv.includes('canada')) return 'CA';
  if (rv.includes('australia')) return 'AU';
  if (rv.includes('uk') || rv.includes('united kingdom')) return 'UK';
  return null;
}
```

### 9. Import Flow Verification

The existing code in `BrandCatalogSync.tsx`, `NewFilamentsTable.tsx`, and `import-synced-filaments/index.ts` is correctly wired:
- Checkboxes work (select/deselect/all)
- Sticky import bar appears when items selected
- Import button calls `import-synced-filaments` with correct `item_ids`
- Import function reads from `brand_sync_items`, inserts into `filaments`, sets `auto_created: true`, handles `admin_override_data` merge

No UI changes needed.

---

### Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/sync-brand-catalog/index.ts` | Rewrite `classifyProduct()`, `extractFilamentsFromProduct()`, `getMaterial()`, `diffAgainstDatabase()`. Add `mapRegionToCode()`, `cleanMaterialAggressive()`, `cleanColorName()`, `titleCase()`. |

### Files NOT Modified
- `_shared/filament-utils.ts` — no changes to avoid breaking other consumers
- `import-synced-filaments/index.ts` — already correct
- All UI components — already correct


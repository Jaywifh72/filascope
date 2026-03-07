

## Generic Enrichment Fallback for Brand Sync

### What this does
Creates a reusable `enrichGenericProduct()` function that any brand sync can use as a fallback when no custom brand-specific defaults file exists. This eliminates the placeholder enrichment logic in the TEMPLATE.

### Changes

**File 1: `supabase/functions/_shared/generic-brand-defaults.ts`** (new)

Exports `enrichGenericProduct(productTitle, material, tdsUrl, nozzleTempMin, nozzleTempMax, bedTempMin, bedTempMax, colorName, brandSlug)` returning:

```typescript
interface GenericEnrichmentResult {
  tdsUrl: string | null;
  material: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  finishType: string;
  productLineId: string;
  highSpeedCapable: boolean | null;
  isAbrasive: boolean | null;
}
```

- **Temperatures**: `MATERIAL_DEFAULTS` map with PLA, PETG, ABS, TPU, ASA, PC, PA/Nylon, PVB, HIPS (exact values from request). Only applied when existing temp fields are null.
- **finish_type**: Calls `guessFinishType(material, title)` from `filament-utils.ts`
- **product_line_id**: `{brandSlug}-{material.toLowerCase()}` (or `{brandSlug}-unknown` if no material)
- **high_speed_capable**: `true` if title matches `/high.?speed|\\bhs\\b|\\bfast\\b/i`, otherwise `null`
- **is_nozzle_abrasive**: `true` if material contains "CF", "GF", or title matches carbon/glass fiber patterns, otherwise `null`

**File 2: `supabase/functions/sync-brand-products/index.ts`** (edit)

This file doesn't have an enrichment step — it's a base sync engine. No changes needed here per the actual code structure. The enrichment step exists in the per-brand TEMPLATE-based functions.

**File 3: `supabase/functions/sync-TEMPLATE-products/index.ts`** (edit, lines 352-378)

Replace the placeholder enrichment block with a call to `enrichGenericProduct()`. The commented-out brand-specific import block stays as-is. Add import for `enrichGenericProduct` from `'../_shared/generic-brand-defaults.ts'`. The placeholder object (lines 367-378) becomes:

```typescript
const enrichment = enrichGenericProduct(
  product.product_title,
  product.material,
  product.tds_url,
  product.nozzle_temp_min_c,
  product.nozzle_temp_max_c,
  product.bed_temp_min_c,
  product.bed_temp_max_c,
  null, // color name
  BRAND_CONFIG.slug,
);
```

### What stays unchanged
- All existing brand-specific defaults files (anycubic, amolen, etc.)
- All enrichment logic in brand-specific sync functions
- The commented-out brand-specific import block in the TEMPLATE
- sync-brand-products/index.ts (no enrichment step exists there)


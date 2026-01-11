# Brand Integration Prompt Template

> **Purpose**: This document provides the ideal prompt format for adding new CSV-seeded brands to the Brand Sync Manager, along with reference implementations and validation checklists.

---

## Ideal Prompt Template

When adding a new brand with CSV data, use this format:

```markdown
## [Brand Name] Integration Request

### Platform Context
- **Website URL**: https://[brand].com
- **Platform**: [Shopify/BigCommerce/WooCommerce/OpenCart/Odoo/IdoSell/Custom]
- **Region**: [US/EU/Global]
- **Currency**: [USD/EUR/GBP]
- **Database Slug**: [brand-slug] (lowercase, hyphenated)

### Attached CSV Data
- **CSV Uploaded**: ✅ [filename.csv]
- **Total Products**: [X] color variants
- **Product Lines**: [Y] material groups

### Product Line Structure
| Material | Count | Finish Type | Notes |
|----------|-------|-------------|-------|
| PLA | 26 | Standard | |
| PLA Silk | 12 | Silk | |
| PETG | 15 | Standard | |
| TPU | 8 | Standard | 95A Shore |
| PLA-CF | 4 | Standard | Abrasive |

### Brand Characteristics
- **Specialty Finishes**: [Silk, Matte, Galaxy, Glow, Marble, etc.]
- **High-Speed Variants**: [Yes/No - if yes, max speed mm/s]
- **Abrasive Materials**: [Yes/No - list CF/GF/Metal variants]
- **TDS Documents**: [Available/Not Available - URL pattern if known]
- **Image Architecture**: [Shared per product line / Unique per color variant]
- **Spool Weight**: [1kg standard / varies]
- **Diameter**: [1.75mm / 2.85mm / both]

### Known Limitations
- [Any scraping issues or platform quirks]
- [Missing data fields]
- [Price availability]

### Required Implementation
1. Create `[brand]-seed.ts` with CSV data
2. Create/Update `[brand]-defaults.ts` with enrichment logic
3. Update `sync-[brand]-products/index.ts` to use CSV seed
4. Update `src/lib/brand-sync-config.ts` with brand slug
5. Add Post Sync Check customizations:
   - AI Role definition
   - Add to `IMAGE_SWATCH_BRANDS` if applicable
   - Add single-variant product line exceptions
   - Create `generate[Brand]FixPrompt()` function
```

---

## Ideal CSV Format

### Required Columns

| Column | Description | Example |
|--------|-------------|---------|
| `material` | Base material type | PLA, PETG, ABS, TPU |
| `title` or `filament` | Product display name | PLA Silk Filament |
| `color` | Color variant name | Deep Purple |
| `productUrl` | Full URL to product page | https://brand.com/product?variant=123 |
| `imageUrl` | CDN URL for product image | https://cdn.brand.com/image.jpg |

### Recommended Columns

| Column | Description | Example |
|--------|-------------|---------|
| `hexCode` | Color hex code | #6A0DAD |
| `price` | Product price (numeric) | 23.99 |
| `finish` | Finish type | Silk, Matte, Glow |
| `sku` or `mpn` | Manufacturer part number | PLA-SILK-PURPLE-1KG |

### Optional Columns

| Column | Description | Example |
|--------|-------------|---------|
| `spool_weight` | Weight in grams | 1000 |
| `diameter` | Filament diameter | 1.75 |
| `nozzle_temp_min` | Min nozzle temp °C | 200 |
| `nozzle_temp_max` | Max nozzle temp °C | 230 |
| `bed_temp_min` | Min bed temp °C | 50 |
| `bed_temp_max` | Max bed temp °C | 70 |
| `tds_url` | Technical data sheet URL | https://brand.com/tds/pla.pdf |

### CSV Best Practices

1. **One row per color variant** - Essential for color swatches and variant URLs
2. **Include hex codes** - Reduces reliance on name-to-hex mapping
3. **Consistent naming** - Use identical material/finish names throughout
4. **Full product URLs** - Include variant IDs/SKUs where applicable
5. **CDN image URLs** - Use absolute URLs, not relative paths
6. **Clean color names** - Remove brand prefixes (not "Brand Blue", just "Blue")
7. **Normalized materials** - Use standard names (PLA, PETG, not "PolyLactic Acid")

### Example CSV Structure

```csv
material,title,color,hexCode,productUrl,imageUrl,price,finish,sku
PLA,PLA Standard,White,#FFFFFF,https://brand.com/pla?color=white,https://cdn.brand.com/pla-white.jpg,19.99,Standard,PLA-WHT-1KG
PLA,PLA Standard,Black,#000000,https://brand.com/pla?color=black,https://cdn.brand.com/pla-black.jpg,19.99,Standard,PLA-BLK-1KG
PLA Silk,PLA Silk,Gold,#FFD700,https://brand.com/pla-silk?color=gold,https://cdn.brand.com/silk-gold.jpg,24.99,Silk,PLA-SILK-GLD-1KG
PETG,PETG,Clear,#F0F0F0,https://brand.com/petg?color=clear,https://cdn.brand.com/petg-clear.jpg,22.99,Standard,PETG-CLR-1KG
```

---

## Current CSV-Seeded Brands

| Brand | Slug | Products | Lines | Platform | Seed File |
|-------|------|----------|-------|----------|-----------|
| Eryone | `eryone` | 420 | 54 | Shopify | `eryone-defaults.ts` |
| FormFutura | `formfutura` | 460+ | 80+ | Odoo 16 | `formfutura-seed.ts` |
| Fiberlogy | `fiberlogy` | 274 | 19 | ShopArena | `fiberlogy-seed.ts` |
| Fillamentum | `fillamentum` | 194 | 22 | Shopify | `fillamentum-seed.ts` |
| Geeetech | `geeetech` | 168 | 18 | OpenCart | `geeetech-seed.ts` |
| Gizmo Dorks | `gizmo-dorks` | 131 | 17 | BigCommerce | `gizmodorks-seed.ts` |
| Extrudr | `extrudr` | 131 | 18 | Custom | `extrudr-seed.ts` |
| Fusion Filaments | `fusion-filaments` | 123 | 8 | Odoo | `fusion-filaments-seed.ts` |
| eSUN | `esun` | ~300 | 25+ | WooCommerce | `esun-seed.ts` |

---

## Reference Implementation: Eryone

Eryone serves as the **gold standard** for CSV-seeded brand integrations.

### Why Eryone is the Best Reference

1. **Comprehensive Catalog**: 420 products across 54 product lines
2. **Single-File Architecture**: Seed embedded in `eryone-defaults.ts`
3. **Complete Enrichment Pipeline**: All helper functions in one place
4. **Post Sync Check Integration**: Full specialist role and customizations
5. **Battle-Tested**: Successfully syncs with zero false positives

### Eryone Seed Structure

```typescript
// In eryone-defaults.ts
export const ERYONE_PRODUCT_SEED: EryoneProduct[] = [
  {
    title: 'PLA Silk',
    material: 'PLA',
    color: 'Gold',
    hexCode: '#FFD700',
    productUrl: 'https://eryone3d.com/products/pla-silk?variant=gold',
    imageUrl: 'https://cdn.shopify.com/...',
    finish: 'Silk',
    price: 24.99
  },
  // ... 419 more products
];
```

### Eryone Enrichment Functions

```typescript
// TDS Pattern Matching
export const ERYONE_TDS_PATTERNS: Record<string, string> = {
  'PLA+': 'https://eryone3d.com/tds/pla-plus.pdf',
  'PETG': 'https://eryone3d.com/tds/petg.pdf',
  // ...
};

// Print Settings by Material
export const ERYONE_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 25, bedTempMax: 60 },
  'PETG': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 60, bedTempMax: 80 },
  // ...
};

// Finish Type Detection (11 types)
export function extractEryoneFinishType(title: string): FinishType {
  if (/silk/i.test(title)) return 'Silk';
  if (/matte/i.test(title)) return 'Matte';
  if (/glow|luminous/i.test(title)) return 'Glow';
  if (/galaxy|sparkle/i.test(title)) return 'Galaxy';
  if (/marble/i.test(title)) return 'Marble';
  if (/rainbow|gradient/i.test(title)) return 'Rainbow';
  if (/dual|tri[- ]?color/i.test(title)) return 'Multicolor';
  if (/wood/i.test(title)) return 'Wood';
  if (/metal/i.test(title)) return 'Metallic';
  if (/cf|carbon/i.test(title)) return 'Carbon Fiber';
  return 'Standard';
}

// Product Line ID Generation
export function generateEryoneProductLineId(title: string, material: string): string {
  const finish = extractEryoneFinishType(title);
  const base = `eryone-${material.toLowerCase()}`;
  return finish !== 'Standard' ? `${base}-${finish.toLowerCase().replace(/\s+/g, '-')}` : base;
}

// Main Enrichment Function
export function enrichEryoneProduct(product: EryoneProduct): EnrichedProduct {
  const finish = extractEryoneFinishType(product.title);
  const settings = getEryonePrintSettings(product.material);
  const tds = matchEryoneTds(product.title);
  
  return {
    ...product,
    finishType: finish,
    productLineId: generateEryoneProductLineId(product.title, product.material),
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    tdsUrl: tds?.url || null,
  };
}
```

### Eryone Sync Function Features

```typescript
// In sync-eryone-products/index.ts

// 1. Ignores UI limit - always processes full seed
const products = ERYONE_PRODUCT_SEED; // No .slice(0, limit)

// 2. Safe Delete Pattern
if (cleanSlate && products.length >= 50) {
  await supabase.from('filaments').delete().eq('vendor', 'Eryone');
}

// 3. Batch Inserts (50 per batch)
for (let i = 0; i < enrichedProducts.length; i += 50) {
  const batch = enrichedProducts.slice(i, i + 50);
  await supabase.from('filaments').upsert(batch, { onConflict: 'vendor,product_id' });
}

// 4. Duplicate Hex Fix
await supabase.rpc('find_duplicate_hexes');

// 5. Update Brand Status
await supabase.from('automated_brands')
  .update({ 
    scraping_active: false, 
    last_scrape_at: new Date().toISOString(),
    products_created: stats.created 
  })
  .eq('brand_slug', 'eryone');
```

### Eryone Post Sync Check Integration

```typescript
// In run-post-sync-check/index.ts

// 1. Skip Lists
const skipHexColorCheckBrands = ['eryone', ...]; // CSV has curated hex codes
const skipPriceCheckBrands = ['eryone', ...];    // Prices in seed

// 2. AI Specialist Role
const eryoneCsvSpecialist = {
  role: 'Eryone CSV Sync Specialist',
  capabilities: [
    'CSV seed architecture understanding',
    'Shopify product/variant structure',
    'Dual-color hex blending logic',
  ],
  constraints: [
    'Never fetch from live API - CSV is authoritative',
    'Title format: "${title} - ${color}" is intentional',
  ],
};

// 3. Single-Variant Product Exceptions
const singleVariantExpected = {
  'eryone': ['eryone-pla-marble', 'eryone-pa-cf', 'eryone-petg-cf'],
};

// 4. Fix Prompt Generator
function generateEryoneFixPrompt(issue: string): string {
  return `As an Eryone CSV Sync Specialist...`;
}
```

---

## File Structure Template

### Required Files for a New CSV-Seeded Brand

```
supabase/functions/
├── _shared/
│   ├── [brand]-seed.ts          # Product seed data (if separate)
│   └── [brand]-defaults.ts      # Enrichment logic + color mapping
├── sync-[brand]-products/
│   └── index.ts                 # Sync function

src/lib/
└── brand-sync-config.ts         # Add to BRAND_SPECIFIC_FUNCTIONS

supabase/functions/
└── run-post-sync-check/
    └── index.ts                 # Add specialist role + skip lists
```

### 1. Seed File Template (`[brand]-seed.ts`)

```typescript
/**
 * [BRAND] PRODUCT SEED
 * 
 * Source: [URL or method used to create seed]
 * Last Updated: [Date]
 * Products: [X] variants across [Y] product lines
 */

export interface BrandProduct {
  title: string;
  material: string;
  color: string;
  hexCode?: string;
  productUrl: string;
  imageUrl?: string;
  price?: number;
  finish?: string;
  sku?: string;
}

export const BRAND_PRODUCT_SEED: BrandProduct[] = [
  // Products here
];
```

### 2. Defaults File Template (`[brand]-defaults.ts`)

```typescript
/**
 * [BRAND] ENRICHMENT DEFAULTS
 * 
 * Contains: TDS patterns, print settings, color mapping, 
 * finish detection, product line ID generation
 */

// TDS URL Patterns
export const BRAND_TDS_PATTERNS: Record<string, string> = {
  'PLA': 'https://brand.com/tds/pla.pdf',
};

export function matchBrandTds(title: string): { url: string; pattern: string } | null {
  // Implementation
}

// Print Settings
export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
}

export const BRAND_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 25, bedTempMax: 60 },
  'PETG': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 60, bedTempMax: 80 },
};

export function getBrandPrintSettings(material: string): PrintSettings | null {
  return BRAND_PRINT_SETTINGS[material.toUpperCase()] || null;
}

// Finish Type Detection
export type FinishType = 'Silk' | 'Matte' | 'Glow' | 'Galaxy' | 'Marble' | 'Standard';

export function extractBrandFinishType(title: string): FinishType {
  if (/silk/i.test(title)) return 'Silk';
  if (/matte/i.test(title)) return 'Matte';
  if (/glow|luminous/i.test(title)) return 'Glow';
  if (/galaxy|sparkle/i.test(title)) return 'Galaxy';
  if (/marble/i.test(title)) return 'Marble';
  return 'Standard';
}

// Color Mapping (if hex not in CSV)
export const BRAND_COLOR_MAPPING: Record<string, string> = {
  'white': 'FFFFFF',
  'black': '000000',
  // Add 50-100 color mappings
};

export function getBrandColorHex(colorName: string): string | null {
  return BRAND_COLOR_MAPPING[colorName.toLowerCase()] || null;
}

// Product Line ID Generation
export function generateBrandProductLineId(title: string, material: string): string {
  const finish = extractBrandFinishType(title);
  const base = `brand-${material.toLowerCase()}`;
  return finish !== 'Standard' ? `${base}-${finish.toLowerCase()}` : base;
}

// Main Enrichment Function
export interface BrandEnrichmentResult {
  tdsUrl: string | null;
  finishType: FinishType;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  productLineId: string;
}

export function enrichBrandProduct(
  title: string, 
  material: string,
  colorName?: string
): BrandEnrichmentResult {
  const settings = getBrandPrintSettings(material);
  const tds = matchBrandTds(title);
  
  return {
    tdsUrl: tds?.url || null,
    finishType: extractBrandFinishType(title),
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    productLineId: generateBrandProductLineId(title, material),
  };
}
```

### 3. Sync Function Template (`sync-[brand]-products/index.ts`)

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { BRAND_PRODUCT_SEED } from '../_shared/[brand]-seed.ts';
import { enrichBrandProduct, getBrandColorHex } from '../_shared/[brand]-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  deleted: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = { discovered: 0, created: 0, updated: 0, skipped: 0, errors: 0, deleted: 0 };

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse options (ignore limit for CSV-seeded brands)
    const { cleanSlate = false } = await req.json().catch(() => ({}));

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', '[brand-slug]')
      .single();

    if (!brand) throw new Error('Brand not found');

    // Mark as syncing
    await supabase
      .from('automated_brands')
      .update({ scraping_active: true })
      .eq('id', brand.id);

    // Process full seed (ignore limit)
    const products = BRAND_PRODUCT_SEED;
    stats.discovered = products.length;

    // Safe Delete Pattern
    if (cleanSlate && products.length >= 50) {
      const { count } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', '[Brand Name]')
        .select('*', { count: 'exact', head: true });
      stats.deleted = count || 0;
    }

    // Enrich and prepare products
    const enrichedProducts = products.map(product => {
      const enrichment = enrichBrandProduct(product.title, product.material, product.color);
      const hexCode = product.hexCode || getBrandColorHex(product.color);
      
      return {
        vendor: '[Brand Name]',
        product_title: `${product.title} - ${product.color}`,
        product_url: product.productUrl,
        featured_image: product.imageUrl || null,
        material: product.material,
        color_hex: hexCode ? hexCode.replace('#', '') : null,
        finish_type: enrichment.finishType,
        product_line_id: enrichment.productLineId,
        nozzle_temp_min_c: enrichment.nozzleTempMin,
        nozzle_temp_max_c: enrichment.nozzleTempMax,
        bed_temp_min_c: enrichment.bedTempMin,
        bed_temp_max_c: enrichment.bedTempMax,
        tds_url: enrichment.tdsUrl,
        variant_price: product.price || null,
        variant_sku: product.sku || null,
        brand_id: brand.id,
        auto_created: true,
        auto_updated: true,
      };
    });

    // Batch insert (50 per batch)
    for (let i = 0; i < enrichedProducts.length; i += 50) {
      const batch = enrichedProducts.slice(i, i + 50);
      const { error } = await supabase.from('filaments').insert(batch);
      if (error) {
        console.error(`Batch ${i / 50 + 1} error:`, error);
        stats.errors += batch.length;
      } else {
        stats.created += batch.length;
      }
    }

    // Fix duplicate hex codes
    await supabase.rpc('find_duplicate_hexes');

    // Update brand status
    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
        products_created: stats.created,
        last_error: null,
      })
      .eq('id', brand.id);

    // Update product counts
    await supabase.rpc('update_brand_product_counts');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${stats.created} products in ${duration}s`,
        stats,
        duration: `${duration}s`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, stats }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 4. Brand Config Update (`brand-sync-config.ts`)

```typescript
// Add to BRAND_SPECIFIC_FUNCTIONS array
export const BRAND_SPECIFIC_FUNCTIONS = [
  // ... existing brands
  '[brand-slug]',  // Add new brand
] as const;

// Add to SLUG_TO_FUNCTION_MAP if slug differs from function name
export const SLUG_TO_FUNCTION_MAP: Record<string, string> = {
  // ... existing mappings
  '[brand-slug]': '[functionname]',  // Only if different
};
```

---

## Post Sync Check Customizations

### Add to Skip Lists (as appropriate)

```typescript
// Brands with CSV-seeded hex codes - skip hex accuracy check
const skipHexColorCheckBrands = ['eryone', 'geeetech', '[new-brand]'];

// Brands without live price scraping
const skipPriceCheckBrands = ['eryone', 'fiberlogy', '[new-brand]'];

// Brands with cross-product swatch architecture
const URL_CONSISTENCY_SKIP_BRANDS = ['fillamentum', 'formfutura', '[new-brand]'];

// Brands that use shared images per product line
const IMAGE_SWATCH_BRANDS = ['atomic-filament', 'azurefilm', '[new-brand]'];

// Brands with intentionally limited images
const NO_IMAGE_BRANDS_FOR_QUALITY = ['fiberlogy', 'extrudr', '[new-brand]'];
```

### Add AI Specialist Role

```typescript
const brandSpecialist = {
  role: '[Brand] CSV Sync Specialist',
  capabilities: [
    '[Platform] product structure understanding',
    'CSV seed architecture',
    '[Unique capability 1]',
    '[Unique capability 2]',
  ],
  constraints: [
    'Never fetch from live API - CSV is authoritative',
    '[Specific constraint 1]',
    '[Specific constraint 2]',
  ],
};
```

### Add to determineAIRole()

```typescript
if (brandSlug === '[brand-slug]') {
  return brandSpecialist;
}
```

### Add Single-Variant Exceptions

```typescript
const singleVariantExpected = {
  '[brand-slug]': ['[brand]-pla-marble', '[brand]-petg-cf'],
};
```

---

## Validation Checklist

Before marking a CSV-seeded brand integration complete:

### Seed Data
- [ ] One row per color variant
- [ ] All product URLs are valid and unique
- [ ] Hex codes included (or comprehensive color mapping)
- [ ] Material names are normalized (PLA, PETG, not variants)
- [ ] No duplicate entries

### Defaults File
- [ ] `extractFinishType()` handles all finish variations
- [ ] `generateProductLineId()` creates correct groupings
- [ ] Print settings cover all materials
- [ ] Color mapping is comprehensive (if hex not in CSV)
- [ ] TDS patterns mapped (if available)

### Sync Function
- [ ] Ignores UI limit parameter
- [ ] Implements Safe Delete (50+ product threshold)
- [ ] Uses batch inserts (50 per batch)
- [ ] Calls `find_duplicate_hexes` RPC
- [ ] Updates brand status correctly
- [ ] Handles errors gracefully

### Post Sync Check
- [ ] Added to appropriate skip lists
- [ ] AI Specialist role defined
- [ ] Single-variant exceptions listed
- [ ] Fix prompt generator implemented

### Testing
- [ ] Clean slate sync completes without errors
- [ ] Product count matches seed
- [ ] Product lines display correctly in UI
- [ ] Color swatches render properly
- [ ] Post Sync Check passes all applicable tasks

---

## Troubleshooting Common Issues

### "Duplicate key" errors
- Check for duplicate product URLs in seed
- Ensure `product_id` generation is unique per variant

### Missing color swatches
- Verify hex codes in seed or color mapping
- Check that `color_hex` is being set (without # prefix)

### Incorrect product line grouping
- Review `generateProductLineId()` logic
- Check finish type detection patterns

### Post Sync Check failures
- Add brand to appropriate skip lists
- Define single-variant exceptions
- Create specialist role for context

---

## Quick Reference: Edge Function Patterns

### Background Task Pattern (for long syncs)
```typescript
EdgeRuntime.waitUntil((async () => {
  // Long-running sync logic
})());

return new Response(JSON.stringify({ 
  status: 'started', 
  message: 'Sync started in background' 
}));
```

### Parallel Fetching (if live scraping needed)
```typescript
const batchSize = 5;
for (let i = 0; i < urls.length; i += batchSize) {
  const batch = urls.slice(i, i + batchSize);
  await Promise.all(batch.map(url => fetchProduct(url)));
}
```

### EUR to USD Conversion
```typescript
const EUR_TO_USD_RATE = 1.08;
const priceUsd = priceEur * EUR_TO_USD_RATE;
```

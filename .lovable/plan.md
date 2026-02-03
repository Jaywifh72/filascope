
# Plan: Admin Price Import Page

## Summary

This plan implements a comprehensive admin page at `/admin/price-import` for uploading scraped price data in JSON format. The page will validate uploaded files, display a preview of products, support dry-run testing, import data to `filament_prices` table, and show import history.

---

## Current State Analysis

| Component | Status |
|-----------|--------|
| `AdminPriceImport.tsx` | Exists as placeholder with "Coming soon..." |
| `stores` table | 17 stores seeded (Amazon regions + brand stores) |
| `filament_prices` table | 119 records from Amazon migration |
| `sync_logs` table | Tracks import operations |
| `react-dropzone` | NOT installed - will use native input file handling |

---

## Implementation Steps

### Step 1: Create Type Definitions for Import

**File**: `src/types/priceImport.ts`

Define types for the scraped product JSON format and import results:

```typescript
// Expected JSON format from local scraper
export interface ScrapedProduct {
  brand: string;
  region: string;
  currency: string;
  shopify_product_id?: string;
  shopify_variant_id?: string;
  sku?: string;
  product_title: string;
  variant_title?: string;
  full_title: string;
  price: number;
  compare_at_price?: number;
  available: boolean;
  product_url: string;
  variant_url?: string;
  image_url?: string;
  scraped_at: string;
  source_type: string;
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  matched: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportError {
  product: string;
  reason: string;
}

export interface ParsedFile {
  filename: string;
  fileSize: number;
  products: ScrapedProduct[];
  brands: string[];
  regions: string[];
  currencies: string[];
  isValid: boolean;
  parseError?: string;
}

export interface ImportHistoryEntry {
  id: string;
  started_at: string;
  completed_at: string | null;
  sync_type: string;
  data_source: string;
  status: string;
  records_updated: number;
  records_failed: number;
  error_message: string | null;
  success_details: {
    filename?: string;
    brands?: string[];
    regions?: string[];
    created?: number;
    updated?: number;
    skipped?: number;
    errors?: ImportError[];
  } | null;
}
```

### Step 2: Create usePriceImport Hook

**File**: `src/hooks/usePriceImport.ts`

A hook that handles the import logic:

```text
Key functions:
- parseFile(file: File) → ParsedFile
- validateProducts(products: ScrapedProduct[]) → validation errors
- importPrices(products, dryRun: boolean) → ImportResult
- matchFilament(brand, title, sku) → filament_id or null
- findStore(brand, region) → store_id or null
```

Import process for each product:
1. Find store by brand slug + region (e.g., "polymaker-us")
2. If no store found, try region-only (e.g., "amazon-us")
3. Convert price to cents: `Math.round(price * 100)`
4. Try to match filament by: 
   - First: SKU match against `variant_sku` or `mpn`
   - Second: vendor + product_title fuzzy match
5. Upsert into `filament_prices` table
6. Track counts: created, updated, skipped, errors

### Step 3: Create Import History Hook

**File**: `src/hooks/usePriceImportHistory.ts`

Hook for fetching and displaying past imports:

```typescript
// Query sync_logs where sync_type = 'price_import'
export function usePriceImportHistory(limit = 20)
```

### Step 4: Create UI Components

**Components to create**:

| Component | Purpose |
|-----------|---------|
| `FileDropzone.tsx` | Drag & drop zone for JSON files |
| `ImportFileSummary.tsx` | Shows parsed file stats (brands, regions, count) |
| `ImportPreviewTable.tsx` | Table showing first 50 products |
| `ImportProgressBar.tsx` | Progress indicator during import |
| `ImportHistoryTable.tsx` | Shows past imports with expandable errors |

### Step 5: Update AdminPriceImport Page

**File**: `src/pages/AdminPriceImport.tsx`

Complete rewrite with:
- File upload zone at top
- File summary card when file is loaded
- Preview table with sorting
- Dry Run + Import buttons
- Progress bar during import
- Import history section at bottom

---

## File Structure

```text
src/
├── types/
│   └── priceImport.ts                    # New - Type definitions
├── hooks/
│   ├── usePriceImport.ts                 # New - Import logic hook
│   └── usePriceImportHistory.ts          # New - History query hook
├── components/
│   └── admin/
│       └── price-import/
│           ├── FileDropzone.tsx          # New - Drag & drop zone
│           ├── ImportFileSummary.tsx     # New - File stats display
│           ├── ImportPreviewTable.tsx    # New - Preview table
│           ├── ImportProgressBar.tsx     # New - Progress indicator
│           └── ImportHistoryTable.tsx    # New - History table
└── pages/
    └── AdminPriceImport.tsx              # Modify - Full implementation
```

---

## UI Layout

```text
┌─────────────────────────────────────────────────────────────────┐
│  [Upload] Price Import                                          │
│  Upload scraped price data to update product prices             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │        [📁 icon]                                          │  │
│  │        Drag & drop a JSON file here, or click to browse  │  │
│  │        Accepts .json files only                          │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ File Summary ─────────────────────────────────────────────┐ │
│  │  polymaker-us-2026-02-03.json (2.4 MB)                    │ │
│  │                                                           │ │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │ │
│  │  │ 1,234  │  │   3    │  │   2    │  │  USD   │          │ │
│  │  │Products│  │ Brands │  │Regions │  │Currency│          │ │
│  │  └────────┘  └────────┘  └────────┘  └────────┘          │ │
│  │                                                           │ │
│  │  Brands: Polymaker, Bambu Lab, Elegoo                     │ │
│  │  Regions: 🇺🇸 US  🇨🇦 CA                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Preview (showing 50 of 1,234) ────────────────────────────┐ │
│  │ Brand    │ Region │ Product Title       │ Price  │ Stock  │ │
│  ├──────────┼────────┼─────────────────────┼────────┼────────┤ │
│  │ Polymaker│ 🇺🇸 US  │ PolyLite PLA Black  │ $24.99 │   ●    │ │
│  │ Polymaker│ 🇺🇸 US  │ PolyLite PLA White  │ $24.99 │   ●    │ │
│  │ ...      │ ...    │ ...                 │ ...    │  ...   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│          [Dry Run]  [Import 1,234 Prices]                       │
│                                                                 │
│  ┌─ Import Progress ──────────────────────────────────────────┐ │
│  │  ████████████████░░░░░░░░░░  Processing 634 of 1,234...    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Import History ───────────────────────────────────────────┐ │
│  │ Date       │ Filename          │ Total │ Updated │ Status  │ │
│  ├────────────┼───────────────────┼───────┼─────────┼─────────┤ │
│  │ Feb 3, 26  │ polymaker-us.json │ 1,234 │   892   │ ✓ Done  │ │
│  │ Feb 2, 26  │ bambulab-all.json │   456 │   456   │ ✓ Done  │ │
│  │ Feb 1, 26  │ elegoo-us.json    │   234 │    12   │ ⚠ Partial│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Details

### Store Matching Logic

The scraper provides `brand` and `region`. We need to map this to a `store_id`:

```typescript
async function findStore(brand: string, region: string): Promise<string | null> {
  // 1. Try exact match: brand-slug + region
  const brandSlug = brand.toLowerCase().replace(/\s+/g, '-');
  const exactSlug = `${brandSlug}-${region.toLowerCase()}`;
  
  const { data: exactMatch } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', exactSlug)
    .eq('is_active', true)
    .single();
  
  if (exactMatch) return exactMatch.id;
  
  // 2. Try region's Amazon store as fallback
  const amazonSlug = `amazon-${region.toLowerCase()}`;
  const { data: amazonMatch } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', amazonSlug)
    .eq('is_active', true)
    .single();
  
  return amazonMatch?.id || null;
}
```

### Filament Matching Logic

Match scraped products to existing filaments:

```typescript
async function matchFilament(
  brand: string, 
  title: string, 
  sku?: string
): Promise<string | null> {
  // 1. Try SKU match first (most reliable)
  if (sku) {
    const { data: skuMatch } = await supabase
      .from('filaments')
      .select('id')
      .or(`variant_sku.eq.${sku},mpn.eq.${sku}`)
      .single();
    
    if (skuMatch) return skuMatch.id;
  }
  
  // 2. Try vendor + title match
  const { data: titleMatch } = await supabase
    .from('filaments')
    .select('id, product_title')
    .eq('vendor', brand)
    .ilike('product_title', `%${title.substring(0, 30)}%`)
    .limit(1)
    .single();
  
  return titleMatch?.id || null;
}
```

### Batch Processing

For large imports (1000+ products), process in batches:

```typescript
const BATCH_SIZE = 50;

for (let i = 0; i < products.length; i += BATCH_SIZE) {
  const batch = products.slice(i, i + BATCH_SIZE);
  
  // Process batch in parallel
  await Promise.all(batch.map(async (product) => {
    const storeId = await findStore(product.brand, product.region);
    const filamentId = await matchFilament(product.brand, product.product_title, product.sku);
    
    if (!storeId) {
      errors.push({ product: product.full_title, reason: 'Store not found' });
      return;
    }
    
    if (!filamentId) {
      skipped++;
      return;
    }
    
    // Upsert to filament_prices
    await supabase.from('filament_prices').upsert({
      filament_id: filamentId,
      store_id: storeId,
      price_cents: Math.round(product.price * 100),
      currency_code: product.currency,
      product_url: product.product_url,
      in_stock: product.available,
      last_verified_at: product.scraped_at,
    }, {
      onConflict: 'filament_id,store_id'
    });
  }));
  
  // Update progress
  setProgress({ current: i + batch.length, total: products.length });
}
```

### Sync Log Entry

After import completes:

```typescript
await supabase.from('sync_logs').insert({
  sync_type: 'price_import',
  data_source: filename,
  status: errors.length > 0 ? 'partial' : 'completed',
  records_updated: updated + created,
  records_failed: errors.length,
  success_details: {
    filename,
    brands: [...new Set(products.map(p => p.brand))],
    regions: [...new Set(products.map(p => p.region))],
    created,
    updated,
    skipped,
    errors: errors.slice(0, 50), // Limit error storage
  },
});
```

---

## Region Badge Colors

For consistent region display:

| Region | Color | Emoji |
|--------|-------|-------|
| US | blue | 🇺🇸 |
| CA | red | 🇨🇦 |
| UK | purple | 🇬🇧 |
| EU | yellow | 🇪🇺 |
| AU | green | 🇦🇺 |
| JP | pink | 🇯🇵 |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/priceImport.ts` | Create | Type definitions for import |
| `src/hooks/usePriceImport.ts` | Create | Import logic and processing |
| `src/hooks/usePriceImportHistory.ts` | Create | Query past imports |
| `src/components/admin/price-import/FileDropzone.tsx` | Create | Drag & drop file upload |
| `src/components/admin/price-import/ImportFileSummary.tsx` | Create | Parsed file statistics |
| `src/components/admin/price-import/ImportPreviewTable.tsx` | Create | Preview table with sorting |
| `src/components/admin/price-import/ImportProgressBar.tsx` | Create | Progress during import |
| `src/components/admin/price-import/ImportHistoryTable.tsx` | Create | Past imports display |
| `src/pages/AdminPriceImport.tsx` | Modify | Complete page implementation |

---

## Validation Rules

The JSON file must:
1. Be valid JSON (parseable)
2. Be an array at the root level
3. Each object must have: `brand`, `region`, `currency`, `product_title`, `full_title`, `price`, `available`, `product_url`
4. `price` must be a positive number
5. `currency` must be a known currency code (USD, CAD, EUR, GBP, etc.)
6. `region` must be a known region code (US, CA, UK, EU, AU, JP)

Invalid files show an error message in the dropzone area.

---

## No Database Changes Required

All needed tables exist:
- `stores` - For store lookups
- `filament_prices` - For upserting prices
- `sync_logs` - For logging import runs
- `filaments` - For matching products

The `filament_prices` table already has a unique constraint on `(filament_id, store_id)` which supports upsert operations.

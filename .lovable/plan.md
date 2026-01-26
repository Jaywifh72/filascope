
# Admin Inventory Management - Part 7: Price Sync Edge Function

## Pre-Check Verification

Based on my exploration, the filament and printer wizards from Parts 5 & 6 have been successfully implemented:
- `AddFilamentWizard.tsx` with 5 steps and `useCreateFilament` hook
- `AddPrinterWizard.tsx` with 6 steps and `useCreatePrinter` hook
- Both integrated into `InventoryManagement.tsx` via `GlobalActionsBar.tsx`

## Overview

Create a new `sync-prices` Edge Function that handles price syncing for both filaments and printers. This function will:
1. Support three sync modes: all, brand, single
2. Use brand-specific extraction strategies from `automated_brands` table
3. Track sync runs in `brand_sync_logs` table
4. Log individual extractions to `price_extraction_logs` table
5. Handle rate limiting and graceful error recovery

## Architecture

The function leverages the existing `get-current-price` Edge Function for the actual price extraction logic, reusing its:
- Shopify JSON endpoint extraction
- Firecrawl-based HTML scraping
- Brand config lookup from `automated_brands`
- Extraction logging to `price_extraction_logs`

```text
sync-prices/index.ts
├── Creates sync run record (brand_sync_logs)
├── Queries products based on syncType
├── For each product:
│   ├── Calls get-current-price or inline extraction
│   ├── Updates filaments/printers table with new price
│   └── Logs to price_extraction_logs
└── Updates sync run with final counts
```

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/sync-prices/index.ts` | Main price sync Edge Function |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add `[functions.sync-prices]` config with `verify_jwt = false` |

---

## Edge Function Specification

### Request Interface

```typescript
interface SyncRequest {
  syncType: 'all' | 'brand' | 'single';
  productType: 'filament' | 'printer';
  targetId?: string;      // For 'single' - the product ID
  brandSlug?: string;     // For 'brand' - the vendor/brand slug
  triggeredBy?: 'admin' | 'scheduled' | 'api';
  dryRun?: boolean;       // If true, don't update prices, just log what would happen
}
```

### Response Interface

```typescript
interface SyncResponse {
  success: boolean;
  syncRunId: string;
  syncType: string;
  productType: string;
  dryRun: boolean;
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  priceChanges: number;
  duration_ms: number;
  errors?: Array<{ productId: string; error: string }>;
}
```

---

## Extraction Strategy Selection

The function will determine extraction strategy based on `automated_brands.extraction_method` and `platform_type`:

| Platform Type | Extraction Method |
|---------------|-------------------|
| `shopify` | Try Shopify `.json` endpoint first, fallback to Firecrawl |
| `woocommerce` | Use Firecrawl HTML scraping |
| `firecrawl` | Direct Firecrawl scraping |
| `amazon` | Skip (Amazon prices require different API) |
| `custom` | Skip or manual-only |

### Extraction Logic

```typescript
async function extractPrice(
  productUrl: string,
  brandConfig: BrandConfig
): Promise<{ price: number | null; compareAtPrice: number | null; error?: string }> {
  
  // Strategy 1: Shopify JSON (fastest, most reliable for Shopify stores)
  if (brandConfig.platform_type === 'shopify') {
    const jsonResult = await tryShopifyJson(productUrl);
    if (jsonResult.success) return jsonResult;
  }
  
  // Strategy 2: Firecrawl HTML scraping (fallback)
  if (['shopify', 'woocommerce', 'firecrawl'].includes(brandConfig.platform_type)) {
    return await tryFirecrawlScrape(productUrl, brandConfig.price_extraction_config);
  }
  
  // Strategy 3: Manual-only (skip)
  return { price: null, compareAtPrice: null, error: 'Manual extraction only' };
}
```

---

## Sync Flow

### 1. Initialize Sync Run

```typescript
// Create brand_sync_logs record
const { data: syncLog } = await supabase
  .from('brand_sync_logs')
  .insert({
    brand_slug: brandSlug || 'all',
    sync_type: 'prices',
    status: 'running',
    triggered_by: triggeredBy,
    products_processed: { progress: { stage: 'initializing' } }
  })
  .select('id')
  .single();
```

### 2. Query Products

```typescript
// Build query based on syncType
let query = supabase
  .from(productType === 'filament' ? 'filaments' : 'printers')
  .select('id, product_title, product_url, vendor, variant_price, msrp')
  .eq('sync_enabled', true)
  .not('product_url', 'is', null);

if (syncType === 'single' && targetId) {
  query = query.eq('id', targetId);
} else if (syncType === 'brand' && brandSlug) {
  query = query.eq('vendor', brandSlug);
}

// Apply limit to prevent timeouts
query = query.limit(100);
```

### 3. Process Products with Rate Limiting

```typescript
const results = [];
for (const product of products) {
  // Get brand config for rate limit
  const brandConfig = await getBrandConfig(product.vendor);
  const rateLimitMs = brandConfig?.rate_limit_ms || 2000;
  
  // Extract price
  const startTime = Date.now();
  const extraction = await extractPrice(product.product_url, brandConfig);
  const responseTime = Date.now() - startTime;
  
  // Log extraction attempt
  await logExtraction(product, extraction, responseTime);
  
  // Update product if price changed and not dry run
  if (!dryRun && extraction.price !== null) {
    await updateProductPrice(product, extraction);
  }
  
  results.push({ productId: product.id, ...extraction });
  
  // Rate limit
  await sleep(rateLimitMs);
}
```

### 4. Update Sync Run Record

```typescript
await supabase
  .from('brand_sync_logs')
  .update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    duration_seconds: (Date.now() - startTime) / 1000,
    products_discovered: products.length,
    products_updated: successCount,
    products_failed: failCount,
    price_changes: priceChangeCount,
  })
  .eq('id', syncLog.id);
```

---

## Error Handling

### Individual Product Errors

- Catch and log errors per product
- Continue to next product (don't abort entire sync)
- Update product's `last_sync_error` column
- Include error in response's `errors` array

### Global Timeout

- Set maximum runtime of 5 minutes
- Use `AbortController` with timeout
- Mark sync as 'failed' if timeout reached
- Return partial results

### Rate Limit Handling

- Read `rate_limit_ms` from brand config (default 2000ms)
- Wait between each product extraction
- Respect per-brand limits

---

## Database Column Usage

### Filaments Table

| Column | Purpose |
|--------|---------|
| `variant_price` | Current price (updated by sync) |
| `msrp` | MSRP for comparison |
| `last_scraped_at` | Timestamp of last successful sync |
| `last_sync_error` | Error message if sync failed |
| `sync_enabled` | Whether to include in syncs |

### Printers Table

| Column | Purpose |
|--------|---------|
| `current_price_usd_store` | Current price (updated by sync) |
| `msrp_usd` | MSRP for comparison |
| `last_sync_status` | 'success' or 'failed' |
| `last_sync_error` | Error message if sync failed |
| `sync_enabled` | Whether to include in syncs |

---

## Reusing Existing Code

The function will import and reuse extraction logic from `get-current-price`:

```typescript
// Import Shopify JSON extraction
async function tryShopifyJson(url: string) {
  const jsonUrl = url.replace(/\/?$/, '.json');
  const response = await fetch(jsonUrl);
  if (!response.ok) return { success: false };
  
  const data = await response.json();
  const variant = data.product?.variants?.[0];
  return {
    success: true,
    price: parseFloat(variant?.price),
    compareAtPrice: parseFloat(variant?.compare_at_price) || null
  };
}
```

For Firecrawl scraping, the function will call the existing `get-current-price` Edge Function internally:

```typescript
async function callGetCurrentPrice(productUrl: string) {
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/get-current-price`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ productUrl })
    }
  );
  return response.json();
}
```

---

## Config.toml Addition

```toml
[functions.sync-prices]
verify_jwt = false
```

Setting `verify_jwt = false` allows the function to be called by scheduled jobs and internal services.

---

## Testing

### Test Single Product Sync

```bash
curl -X POST \
  'https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/sync-prices' \
  -H 'Content-Type: application/json' \
  -d '{
    "syncType": "single",
    "productType": "filament",
    "targetId": "<filament-uuid>",
    "triggeredBy": "admin"
  }'
```

### Test Brand Sync

```bash
curl -X POST \
  'https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/sync-prices' \
  -H 'Content-Type: application/json' \
  -d '{
    "syncType": "brand",
    "productType": "filament",
    "brandSlug": "bambu-lab",
    "triggeredBy": "admin",
    "dryRun": true
  }'
```

---

## Verification Checklist

After implementation:
- [ ] Edge Function deploys without errors
- [ ] Single product sync returns expected response with price data
- [ ] Brand sync processes all products of that brand with rate limiting
- [ ] `brand_sync_logs` table has new record with correct counts
- [ ] Product `last_scraped_at` / `last_sync_status` updated after sync
- [ ] `price_extraction_logs` has entries for each extraction attempt
- [ ] Individual errors are logged but don't crash entire sync
- [ ] Dry run mode logs actions without updating prices
- [ ] Function respects 5-minute timeout

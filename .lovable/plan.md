

# Regional Price Sync Implementation Plan

## Overview

Update the `sync-prices` Edge Function to support region-aware synchronization. This enables syncing prices from region-specific store URLs in the `product_regional_urls` table and updating the corresponding entries in `product_regional_prices`.

---

## Pre-Check Results

| Check | Status |
|-------|--------|
| Both wizards create products with regional URLs | Verified (Parts 5 & 6 completed) |
| product_regional_urls table has data | Verified (schema exists with proper columns) |
| product_regional_prices table has MSRP data | Verified (schema includes msrp, current_price, last_sync_at, last_sync_status) |

---

## Architecture Overview

```text
                    ┌─────────────────────────┐
                    │   Admin Dashboard       │
                    │   RegionalPriceCell     │
                    │   [Sync] button         │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   usePriceSync hook     │
                    │   (updated for regions) │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   sync-prices Edge Fn   │
                    │   (region-aware)        │
                    └───────────┬─────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
   ┌──────▼──────┐       ┌──────▼──────┐       ┌──────▼──────┐
   │ product_    │       │ product_    │       │ brand_      │
   │ regional_   │       │ regional_   │       │ sync_logs   │
   │ urls        │       │ prices      │       │ (regional)  │
   └─────────────┘       └─────────────┘       └─────────────┘
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/sync-prices/index.ts` | Update | Add regional sync support |
| `src/hooks/usePriceSync.ts` | Update | Add regionCodes parameter and per-region tracking |
| `src/hooks/useRegionalPriceSync.ts` | Create | Dedicated hook for single-region sync from UI |
| `src/components/admin/inventory/RegionalPriceCell.tsx` | Update | Add per-region sync button functionality |
| `src/components/admin/inventory/sync-status/CurrentSyncStatus.tsx` | Update | Show regional sync progress |

---

## Implementation Details

### 1. Update sync-prices Edge Function

**Updated SyncRequest Interface:**
```typescript
interface SyncRequest {
  syncType: 'all' | 'brand' | 'single';
  productType: 'filament' | 'printer';
  targetId?: string;
  brandSlug?: string;
  triggeredBy?: 'admin' | 'scheduled' | 'api';
  dryRun?: boolean;
  limit?: number;
  
  // NEW: Regional options
  regionCodes?: string[];      // Which regions to sync (null = all configured)
  skipRegions?: string[];      // Regions to exclude
  useRegionalUrls?: boolean;   // Use product_regional_urls table (default: true)
}
```

**Updated Sync Flow:**

```text
1. Parse request with regionCodes filter
         │
         ▼
2. Get products to sync (based on syncType)
         │
         ▼
3. For each product:
   a. Query product_regional_urls for this product
   b. Filter by regionCodes if specified
   c. For each regional URL:
      i.   Get brand config for extraction settings
      ii.  Execute price extraction for this URL
      iii. Update product_regional_prices with result
      iv.  Log to price_extraction_logs with region_code
         │
         ▼
4. Update brand_sync_logs with:
   - regions_synced array
   - Per-region stats in success_details
         │
         ▼
5. Return response with regionStats breakdown
```

**Updated SyncResponse:**
```typescript
interface SyncResponse {
  success: boolean;
  syncRunId: string;
  syncType: string;
  productType: string;
  dryRun: boolean;
  
  // Overall stats
  totalProducts: number;
  totalRegionalUrls: number;
  successful: number;
  failed: number;
  skipped: number;
  priceChanges: number;
  
  // Per-region stats (NEW)
  regionStats: {
    [region: string]: {
      attempted: number;
      successful: number;
      failed: number;
      priceChanges: number;
    };
  };
  
  duration_ms: number;
  errors?: Array<{
    productId: string;
    regionCode: string;
    error: string;
  }>;
}
```

**Core Logic Changes:**

```typescript
// Fetch regional URLs for a product
async function getProductRegionalUrls(
  supabase: any,
  productId: string,
  productType: string,
  regionCodes?: string[]
): Promise<RegionalUrl[]> {
  let query = supabase
    .from('product_regional_urls')
    .select('*')
    .eq('product_id', productId)
    .eq('product_type', productType);
  
  if (regionCodes && regionCodes.length > 0) {
    query = query.in('region_code', regionCodes);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Update regional price after extraction
async function updateRegionalPrice(
  supabase: any,
  productId: string,
  productType: string,
  regionCode: string,
  currencyCode: string,
  extractedPrice: number | null,
  compareAtPrice: number | null,
  storeUrlId: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  await supabase
    .from('product_regional_prices')
    .upsert({
      product_id: productId,
      product_type: productType,
      region_code: regionCode,
      currency_code: currencyCode,
      current_price: extractedPrice,
      compare_at_price: compareAtPrice,
      store_url_id: storeUrlId,
      last_sync_at: new Date().toISOString(),
      last_sync_status: success ? 'success' : 'failed',
      last_sync_error: errorMessage || null,
      price_source: 'sync',
    }, {
      onConflict: 'product_id,product_type,region_code',
    });
}
```

---

### 2. Update usePriceSync Hook

Add regional sync capabilities to the existing hook:

```typescript
interface SyncRequest {
  // ... existing fields
  regionCodes?: string[];
  skipRegions?: string[];
}

// New helper for single-region sync
const syncRegion = useCallback((
  productId: string,
  productType: 'filament' | 'printer',
  regionCode: string
) => {
  syncMutation.mutate({
    syncType: 'single',
    productType,
    targetId: productId,
    triggeredBy: 'admin',
    regionCodes: [regionCode],
  });
}, [syncMutation]);

// New helper to check if a specific region is syncing
const isRegionSyncing = useCallback((
  productId: string,
  regionCode: string
): boolean => {
  const key = `${productId}-${regionCode}`;
  return activeSyncs.has(key);
}, [activeSyncs]);
```

---

### 3. Create useRegionalPriceSync Hook

A focused hook for per-region sync operations from the RegionalPriceCell:

```typescript
// src/hooks/useRegionalPriceSync.ts

interface RegionalSyncRequest {
  productId: string;
  productType: 'filament' | 'printer';
  regionCode: string;
  storeUrl: string;
}

export function useRegionalPriceSync() {
  const queryClient = useQueryClient();
  const [syncingRegions, setSyncingRegions] = useState<Set<string>>(new Set());
  
  const syncRegion = useMutation({
    mutationFn: async (request: RegionalSyncRequest) => {
      const { data, error } = await supabase.functions.invoke('sync-prices', {
        body: {
          syncType: 'single',
          productType: request.productType,
          targetId: request.productId,
          regionCodes: [request.regionCode],
          triggeredBy: 'admin',
        },
      });
      
      if (error) throw error;
      return data;
    },
    onMutate: (variables) => {
      const key = `${variables.productId}-${variables.regionCode}`;
      setSyncingRegions(prev => new Set(prev).add(key));
    },
    onSettled: (data, error, variables) => {
      const key = `${variables.productId}-${variables.regionCode}`;
      setSyncingRegions(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ 
        queryKey: ['product-regional-prices', variables.productId] 
      });
    },
  });
  
  const isSyncing = (productId: string, regionCode: string) => {
    return syncingRegions.has(`${productId}-${regionCode}`);
  };
  
  return { syncRegion, isSyncing };
}
```

---

### 4. Update RegionalPriceCell Component

Add working sync button that triggers per-region sync:

```typescript
// Add to RegionalPriceCell.tsx

import { useRegionalPriceSync } from '@/hooks/useRegionalPriceSync';

// Inside component:
const { syncRegion, isSyncing } = useRegionalPriceSync();

const handleSync = () => {
  if (!storeUrl) {
    toast.error('No URL configured for this region');
    return;
  }
  
  syncRegion.mutate({
    productId,
    productType,
    regionCode,
    storeUrl,
  });
};

// Sync button:
<Button
  variant="ghost"
  size="icon"
  onClick={handleSync}
  disabled={isSyncing(productId, regionCode) || !storeUrl}
  className="h-6 w-6"
>
  <RefreshCw className={cn(
    "h-3 w-3",
    isSyncing(productId, regionCode) && "animate-spin"
  )} />
</Button>
```

---

### 5. Update CurrentSyncStatus Component

Show regional breakdown for running syncs:

```typescript
// Add to RunningSyncLog interface:
interface RunningSyncLog {
  // ... existing fields
  region_code: string | null;
  regions_synced: string[] | null;
}

// Update query to include regional fields:
const { data: runningSyncs } = useQuery({
  queryKey: ['running-syncs'],
  queryFn: async () => {
    const { data } = await supabase
      .from('brand_sync_logs')
      .select(`
        id, brand_slug, sync_type, status, started_at,
        products_discovered, products_updated, products_failed,
        region_code, regions_synced
      `)
      .eq('status', 'running')
      .order('started_at', { ascending: false });
    return data;
  },
  refetchInterval: 2000,
});

// Add regional badge display:
{sync.regions_synced && sync.regions_synced.length > 0 && (
  <div className="flex gap-1 mt-1">
    {sync.regions_synced.map(region => (
      <Badge key={region} variant="outline" className="text-xs">
        {REGION_CONFIGS[region]?.flag} {region}
      </Badge>
    ))}
  </div>
)}
```

---

## Database Updates After Sync

The Edge Function will execute these updates:

```sql
-- 1. Update product_regional_prices with extracted data
UPDATE product_regional_prices
SET 
  current_price = $extracted_price,
  compare_at_price = $extracted_compare_at,
  last_sync_at = NOW(),
  last_sync_status = 'success',
  last_sync_error = NULL,
  price_source = 'sync'
WHERE product_id = $product_id 
  AND product_type = $product_type
  AND region_code = $region_code;

-- 2. Update brand_sync_logs with regional metadata
UPDATE brand_sync_logs
SET 
  regions_synced = $regions_array,
  success_details = jsonb_build_object(
    'regionStats', $region_stats,
    'dryRun', $dry_run
  )
WHERE id = $sync_run_id;
```

---

## Error Handling

The sync function will handle various error scenarios:

| Error Type | Handling |
|------------|----------|
| No regional URLs configured | Skip product, log as "skipped" |
| URL returns 404 | Mark region as "failed", set last_sync_error |
| Price extraction fails | Mark region as "failed", preserve previous price |
| Rate limit hit | Pause and retry with exponential backoff |
| Timeout (5min) | Complete current product, return partial results |

---

## Technical Considerations

### Currency Handling
Each regional URL has an associated `currency_code` in `product_regional_urls`. The extracted price is stored as-is in the region's native currency (no conversion during sync).

### Legacy Support
The function will continue to support the legacy flow (syncing `filaments.product_url` → `filaments.variant_price`) when `useRegionalUrls: false` is specified, ensuring backward compatibility.

### Rate Limiting
Per-brand rate limits from `automated_brands.rate_limit_ms` will be respected. Regional URLs from the same brand will share the rate limit.

---

## Verification Checklist

After implementation:
- [ ] Sync function accepts `regionCodes` parameter
- [ ] Syncing with `regionCodes=['US']` only syncs US URLs
- [ ] Each regional URL is synced independently
- [ ] `product_regional_prices` updated with correct region/currency
- [ ] Sync response includes per-region stats in `regionStats`
- [ ] RegionalPriceCell sync button triggers single-region sync
- [ ] CurrentSyncStatus shows regional badges for running syncs
- [ ] `brand_sync_logs.regions_synced` array populated after sync
- [ ] Failed syncs update `last_sync_error` in `product_regional_prices`


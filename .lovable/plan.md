
# Modify `get-current-price` Edge Function for `forceRefresh` Support

## Overview

Add a `forceRefresh` parameter to the `get-current-price` Edge Function that allows admin users to force a fresh price fetch, bypassing any caching logic, while implementing rate limiting to prevent API credit abuse.

---

## Key Findings

After examining the codebase:

1. **No edge function caching exists** - The Edge Function itself has no in-memory cache. Caching is handled by the frontend in `useCurrentPrice.ts`.
2. **The `forceRefresh` parameter** is already being passed from `useAdminPriceRefresh.ts` in the request body.
3. **The `price_extraction_logs` table** has all necessary fields for logging and rate limiting.
4. **The `logExtractionAttempt` function** (lines 107-136) can be reused for logging manual refreshes.

---

## Implementation

### File to Modify

`supabase/functions/get-current-price/index.ts`

---

### Changes Required

#### 1. Add Rate Limit Check Function (New Function ~Line 137)

Create a function to check if a manual refresh was performed for a URL in the last minute:

```typescript
// Rate limit manual refreshes: 1 per URL per minute
async function canForceRefresh(productUrl: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('price_extraction_logs')
    .select('id')
    .eq('product_url', productUrl)
    .eq('extraction_method', 'manual_refresh')
    .gte('created_at', oneMinuteAgo)
    .limit(1);
  
  // Allow if no recent manual refresh
  return !data || data.length === 0;
}
```

---

#### 2. Update PriceResponse Interface (Line 26-39)

Add optional `refreshedAt` field to the response interface:

```typescript
interface PriceResponse {
  success: boolean;
  price: number | null;
  compareAtPrice: number | null;
  weightGrams: number | null;
  diameterMm: number | null;
  variantTitle: string | null;
  currency: string;
  available: boolean;
  source: 'shopify' | 'firecrawl' | 'html' | 'cached';
  fetchedAt: string;
  error?: string;
  is404?: boolean;
  refreshedAt?: string; // NEW: ISO timestamp when forceRefresh was used
}
```

---

#### 3. Modify Serve Handler (Line 1767-1856)

Update the main handler to:

1. Parse `forceRefresh` from the request body
2. Check rate limit when `forceRefresh` is true
3. Log to `price_extraction_logs` with `method: 'manual_refresh'`
4. Add `refreshedAt` to successful responses

```typescript
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productUrl, currency = 'USD', forceRefresh = false } = await req.json();
    
    if (!productUrl) {
      return new Response(
        JSON.stringify({ error: 'productUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Getting current price for: ${productUrl} (preferred currency: ${currency}${forceRefresh ? ', FORCE REFRESH' : ''})`);
    
    // Rate limit check for manual refresh
    if (forceRefresh) {
      const canRefresh = await canForceRefresh(productUrl);
      if (!canRefresh) {
        console.log('Rate limited: manual refresh already performed for this URL in last minute');
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Rate limited: Please wait at least 1 minute between manual refreshes for this product',
            price: null,
            compareAtPrice: null,
            weightGrams: null,
            diameterMm: null,
            variantTitle: null,
            currency,
            available: false,
            source: 'firecrawl',
            fetchedAt: new Date().toISOString(),
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Manual refresh rate limit check passed');
    }
    
    // Look up brand config from database
    const brandConfig = await findBrandConfigByUrl(productUrl);
    // ... existing brand config logging ...
    
    const startTime = Date.now();
    
    // ... existing extraction pipeline (unchanged) ...
    
    // After getting result, log manual refresh and add refreshedAt
    if (forceRefresh) {
      const responseTimeMs = Date.now() - startTime;
      await logExtractionAttempt(
        brandConfig?.id || null,
        brandConfig?.brand_slug || null,
        productUrl,
        'manual_refresh',
        result.success,
        result.price,
        result.currency,
        result.error || null,
        null, // rawSample not needed for manual refresh
        responseTimeMs
      );
      
      // Add refreshedAt to response
      if (result.success) {
        result.refreshedAt = new Date().toISOString();
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // ... existing error handling ...
  }
});
```

---

## Technical Details

### Rate Limiting Logic

| Condition | Behavior |
|-----------|----------|
| `forceRefresh: false` or undefined | Normal execution, no rate limiting |
| `forceRefresh: true`, no recent refresh | Execute extraction, log as `manual_refresh` |
| `forceRefresh: true`, refresh within 1 min | Return 429 with rate limit error |

### Response Fields

| Field | When Present | Value |
|-------|--------------|-------|
| `refreshedAt` | Only when `forceRefresh: true` and successful | ISO timestamp string |
| All other fields | Always | Same as current behavior |

### Logging

When `forceRefresh: true`, insert into `price_extraction_logs`:
- `extraction_method`: `'manual_refresh'`
- `product_url`: The URL being refreshed
- `success`: Whether extraction succeeded
- `extracted_price`: The price if successful
- `currency`: The detected/preferred currency
- `response_time_ms`: Time taken for extraction

---

## Code Flow Diagram

```text
Request with forceRefresh=true
         │
         ▼
┌─────────────────────────┐
│ Check rate limit        │
│ (query price_extraction_│
│  logs for manual_refresh│
│  within last 1 minute)  │
└─────────────────────────┘
         │
    ┌────┴────┐
    │         │
 Allowed   Rate Limited
    │         │
    ▼         ▼
 Execute   Return 429
 Pipeline  with error
    │
    ▼
┌─────────────────────────┐
│ Log to price_extraction_│
│ logs with method:       │
│ 'manual_refresh'        │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ Add refreshedAt to      │
│ response if successful  │
└─────────────────────────┘
    │
    ▼
Return result
```

---

## Backward Compatibility

- **No breaking changes**: `forceRefresh` is optional and defaults to `false`
- **Existing behavior preserved**: When `forceRefresh` is absent/false, execution is identical to current implementation
- **New field is additive**: `refreshedAt` only appears when `forceRefresh` is used successfully

---

## Summary of Changes

1. **Add** `canForceRefresh()` function for rate limiting (~15 lines)
2. **Update** `PriceResponse` interface to include optional `refreshedAt` field
3. **Modify** serve handler to:
   - Parse `forceRefresh` from request body
   - Check rate limit and return 429 if limited
   - Track `startTime` for response timing
   - Log to `price_extraction_logs` with `'manual_refresh'` method
   - Add `refreshedAt` to successful responses

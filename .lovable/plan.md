

# Create `useAdminPriceRefresh` Hook

## Overview

Create a new admin hook that provides functionality to manually refresh filament prices by calling the `get-current-price` Edge Function and persisting results to the database. The hook will also support cache invalidation for the `useCurrentPrice` hook.

---

## Files to Create/Modify

### 1. **Modify** `src/hooks/useCurrentPrice.ts`

Export a cache invalidation function to allow external clearing of the price cache.

**Changes:**
- Export a new `invalidatePriceCache(url: string)` function
- Export the `priceCache` Map for direct access if needed

```typescript
// Add export for cache invalidation
export function invalidatePriceCache(productUrl: string): boolean {
  return priceCache.delete(productUrl);
}
```

---

### 2. **Create** `src/hooks/useAdminPriceRefresh.ts`

New hook with the following structure:

**Parameters:**
- `productUrl: string` - The URL to fetch the price from
- `filamentId: string` - The database ID to update

**Exported Interface:**
```typescript
interface AdminPriceRefreshResult {
  success: boolean;
  newPrice?: number;
  compareAtPrice?: number;
  currency?: string;
  error?: string;
}

interface UseAdminPriceRefreshReturn {
  refreshPrice: () => Promise<AdminPriceRefreshResult>;
  isRefreshing: boolean;
  lastRefreshError: string | null;
}
```

**Implementation Details:**

1. **State Management:**
   - `isRefreshing: boolean` - Loading state during refresh
   - `lastRefreshError: string | null` - Most recent error message

2. **`refreshPrice()` Function:**
   - Calls `get-current-price` Edge Function with `forceRefresh: true` parameter
   - Handles retry logic for transient errors (BOOT_ERROR, 503)
   - On success:
     - Updates `filaments` table with: `variant_price`, `variant_compare_at_price`, `last_scraped_at`, `price_source`
     - Optionally inserts into `price_history` table
     - Calls `invalidatePriceCache(productUrl)` from `useCurrentPrice`
     - Returns `{ success: true, newPrice, compareAtPrice, currency }`
   - On 404 error:
     - Returns `{ success: false, error: 'Product page not found (404)' }`
     - Does NOT crash or throw
   - On other errors:
     - Returns `{ success: false, error: <message> }`

3. **Database Update Fields:**
   ```typescript
   {
     variant_price: data.price,
     variant_compare_at_price: data.compareAtPrice,
     last_scraped_at: new Date().toISOString(),
     price_source: 'admin_refresh',
   }
   ```

4. **Price History Insert:**
   ```typescript
   {
     filament_id: filamentId,
     price: data.price,
     currency: data.currency || 'USD',
     source: 'admin_refresh',
     recorded_at: new Date().toISOString(),
     region: currencyToRegion(data.currency),
   }
   ```

---

## Technical Implementation

### Hook Code Structure

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invalidatePriceCache } from './useCurrentPrice';

interface AdminPriceRefreshResult {
  success: boolean;
  newPrice?: number;
  compareAtPrice?: number;
  currency?: string;
  error?: string;
}

interface UseAdminPriceRefreshReturn {
  refreshPrice: () => Promise<AdminPriceRefreshResult>;
  isRefreshing: boolean;
  lastRefreshError: string | null;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

function isTransientError(error: any): boolean {
  if (!error) return false;
  const message = error.message || error.error || String(error);
  return message.includes('BOOT_ERROR') || 
         message.includes('503') || 
         message.includes('Function failed to start');
}

function currencyToRegion(currency: string): string {
  const map: Record<string, string> = {
    'USD': 'US', 'CAD': 'CA', 'EUR': 'EU', 
    'GBP': 'UK', 'AUD': 'AU', 'JPY': 'JP'
  };
  return map[currency] || 'US';
}

export function useAdminPriceRefresh(
  productUrl: string,
  filamentId: string
): UseAdminPriceRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshError, setLastRefreshError] = useState<string | null>(null);

  const refreshPrice = useCallback(async (): Promise<AdminPriceRefreshResult> => {
    setIsRefreshing(true);
    setLastRefreshError(null);

    // Retry logic with exponential backoff
    // Call edge function with forceRefresh: true
    // Handle 404 gracefully
    // Update database on success
    // Invalidate useCurrentPrice cache
    // Return result

    setIsRefreshing(false);
    return { success, ... };
  }, [productUrl, filamentId]);

  return { refreshPrice, isRefreshing, lastRefreshError };
}
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| 404 Page Not Found | Return `{ success: false, error: 'Product page not found (404)' }` |
| Network timeout | Retry up to 2 times, then return error |
| BOOT_ERROR / 503 | Retry with exponential backoff |
| Database update fails | Return `{ success: false, error: 'Failed to save price' }` |
| Invalid price response | Return `{ success: false, error: 'Invalid price data received' }` |

---

## Cache Invalidation Flow

```text
1. Admin clicks "Refresh Price"
2. refreshPrice() is called
3. Edge function fetches fresh price
4. Database is updated
5. invalidatePriceCache(productUrl) clears the in-memory cache
6. Next useCurrentPrice call will fetch fresh from edge function
```

---

## Dependencies

- `@/integrations/supabase/client` - Supabase client
- `./useCurrentPrice` - For `invalidatePriceCache` export

---

## Usage Example

```tsx
function AdminPriceRefreshButton({ productUrl, filamentId }) {
  const { refreshPrice, isRefreshing, lastRefreshError } = useAdminPriceRefresh(
    productUrl,
    filamentId
  );

  const handleClick = async () => {
    const result = await refreshPrice();
    if (result.success) {
      toast.success(`Price updated to $${result.newPrice}`);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Button onClick={handleClick} disabled={isRefreshing}>
      {isRefreshing ? <Loader2 className="animate-spin" /> : 'Refresh Price'}
    </Button>
  );
}
```


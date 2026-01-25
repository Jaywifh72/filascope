
# Database Schema Updates for Manual Price Refresh Tracking

## Overview

Add database support for tracking manual price refreshes by extending the `filaments` table with new columns and creating a secure RPC function that admins can call to update prices.

---

## Current State Assessment

| Component | Status | Notes |
|-----------|--------|-------|
| `filaments.price_source` | ✅ Exists | Stores 'manual', 'scraper', 'api', 'admin_refresh' |
| `filaments.last_scraped_at` | ✅ Exists | Timestamp of last price update |
| `filaments.price_last_manual_refresh` | ❌ Missing | Need to add |
| `filaments.price_refresh_source` | ⚠️ Consider | Already have `price_source` - may be redundant |
| `price_extraction_logs.extraction_method` | ✅ Exists | Already stores 'manual_refresh' |
| `has_role` function | ✅ Exists | Security definer function for admin checks |
| Filaments RLS policies | ✅ Exists | Admins can already update filaments |
| RPC function | ❌ Missing | Need to create |

---

## Schema Decision

**Recommendation**: Instead of adding `price_refresh_source` (which duplicates `price_source`), add only `price_last_manual_refresh` to track the timestamp of the last admin-initiated refresh separately from `last_scraped_at`.

---

## Database Changes

### 1. Add Column to `filaments` Table

```sql
-- Add timestamp for tracking when an admin last manually refreshed the price
ALTER TABLE filaments 
  ADD COLUMN IF NOT EXISTS price_last_manual_refresh timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN filaments.price_last_manual_refresh IS 
  'Timestamp of last admin-initiated manual price refresh';
```

---

### 2. Create RPC Function `update_filament_price_after_refresh`

This function will be called by the frontend after a successful price fetch from the edge function. It provides a single atomic operation with proper security.

```sql
CREATE OR REPLACE FUNCTION update_filament_price_after_refresh(
  p_filament_id uuid,
  p_new_price numeric,
  p_compare_at_price numeric DEFAULT NULL,
  p_currency text DEFAULT 'USD',
  p_source text DEFAULT 'manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_row filaments%ROWTYPE;
  v_region text;
BEGIN
  -- Verify the caller is an admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  -- Map currency to region for price history
  v_region := CASE p_currency
    WHEN 'USD' THEN 'US'
    WHEN 'CAD' THEN 'CA'
    WHEN 'EUR' THEN 'EU'
    WHEN 'GBP' THEN 'UK'
    WHEN 'AUD' THEN 'AU'
    WHEN 'JPY' THEN 'JP'
    ELSE 'US'
  END;
  
  -- Update the filament record
  UPDATE filaments
  SET 
    variant_price = p_new_price,
    variant_compare_at_price = p_compare_at_price,
    last_scraped_at = NOW(),
    price_last_manual_refresh = NOW(),
    price_source = CASE 
      WHEN p_source = 'manual' THEN 'admin_refresh'
      ELSE p_source
    END,
    updated_at = NOW()
  WHERE id = p_filament_id
  RETURNING * INTO v_updated_row;
  
  -- Check if update was successful
  IF v_updated_row.id IS NULL THEN
    RAISE EXCEPTION 'Filament not found: %', p_filament_id;
  END IF;
  
  -- Insert into price history for tracking
  INSERT INTO price_history (
    filament_id,
    price,
    compare_at_price,
    currency,
    source,
    region,
    recorded_at
  ) VALUES (
    p_filament_id,
    p_new_price,
    p_compare_at_price,
    p_currency,
    'admin_refresh',
    v_region,
    NOW()
  );
  
  -- Return the updated filament data
  RETURN jsonb_build_object(
    'success', true,
    'filament_id', v_updated_row.id,
    'product_title', v_updated_row.product_title,
    'variant_price', v_updated_row.variant_price,
    'variant_compare_at_price', v_updated_row.variant_compare_at_price,
    'price_source', v_updated_row.price_source,
    'last_scraped_at', v_updated_row.last_scraped_at,
    'price_last_manual_refresh', v_updated_row.price_last_manual_refresh
  );
END;
$$;
```

**Key Features:**
- Uses `SECURITY DEFINER` to execute with elevated privileges
- Explicitly checks `has_role(auth.uid(), 'admin')` at the start
- Updates both `last_scraped_at` and `price_last_manual_refresh`
- Automatically inserts into `price_history` table
- Maps currency to region for price history
- Returns the updated filament data as JSON

---

### 3. Grant Execute Permission

```sql
-- Grant execute permission to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION update_filament_price_after_refresh TO authenticated;
```

---

## Frontend Integration Update

After the migration is applied, update `useAdminPriceRefresh.ts` to use the new RPC function instead of direct table updates:

```typescript
// Replace lines 129-163 with:
const { data: rpcResult, error: rpcError } = await supabase
  .rpc('update_filament_price_after_refresh', {
    p_filament_id: filamentId,
    p_new_price: price,
    p_compare_at_price: compareAtPrice || null,
    p_currency: currency,
    p_source: 'manual'
  });

if (rpcError) {
  const errorMsg = 'Failed to save price to database';
  console.error('RPC error:', rpcError);
  setLastRefreshError(errorMsg);
  setIsRefreshing(false);
  return { success: false, error: errorMsg };
}
```

This approach:
- Combines filament update and price history insert into one atomic operation
- Moves admin authorization check to the database layer
- Reduces client-side code complexity

---

## Security Considerations

| Layer | Protection |
|-------|------------|
| **RPC Function** | `has_role(auth.uid(), 'admin')` check at function start |
| **Filaments Table RLS** | Existing policies allow admin updates |
| **Price History Table** | Insert allowed via service role / security definer |
| **Edge Function** | Rate limiting via `price_extraction_logs` table |

---

## Summary of Changes

1. **Migration**: Add `price_last_manual_refresh` column to `filaments` table
2. **Migration**: Create `update_filament_price_after_refresh` RPC function with built-in admin check
3. **Migration**: Grant execute permission to authenticated users
4. **Code Update**: Modify `useAdminPriceRefresh.ts` to use the new RPC function

---

## Files to Change

| File | Action |
|------|--------|
| New migration SQL | Create via migration tool |
| `src/hooks/useAdminPriceRefresh.ts` | Update to use RPC function |

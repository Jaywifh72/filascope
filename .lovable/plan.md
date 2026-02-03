
# Plan: Phase 3 - Exchange Rate Updates Infrastructure

## Summary

This plan enhances the existing exchange rate update system to support the new `exchange_rates` table from Phase 1, adds monitoring views, helper functions, and an admin UI button to manually trigger rate refreshes.

---

## Current State Analysis

| Component | Status |
|-----------|--------|
| Edge Function `update-exchange-rates` | Exists, writes to `currency_exchange_rates` only |
| New `exchange_rates` table | Created in Phase 1, has 11 currencies seeded |
| Admin page `AdminExchangeRates.tsx` | Exists, has "Refresh" button that only refetches DB |
| Logging | Not connected to sync_logs table |

---

## Implementation Steps

### Step 1: Update Edge Function

**File**: `supabase/functions/update-exchange-rates/index.ts`

Modify to:
1. Write to BOTH `currency_exchange_rates` (existing) and `exchange_rates` (new Phase 1 table)
2. Log results to `sync_logs` table
3. Maintain CORS headers for web invocation
4. Add support for all currencies in both tables (USD, CAD, EUR, GBP, AUD, JPY, CNY, INR, SEK, PLN, MXN, CHF, CZK, KRW)

**Key changes**:
```text
Existing:  API → currency_exchange_rates
Updated:   API → currency_exchange_rates + exchange_rates + sync_logs
```

### Step 2: Create Database Views and Functions

**Migration**: Add monitoring infrastructure

```sql
-- Status view for monitoring rate freshness
CREATE OR REPLACE VIEW exchange_rate_status AS
SELECT 
  er.currency_code,
  er.currency_name,
  er.currency_symbol,
  er.rate_to_usd,
  er.updated_at,
  CASE 
    WHEN er.updated_at > NOW() - INTERVAL '25 hours' THEN 'fresh'
    WHEN er.updated_at > NOW() - INTERVAL '3 days' THEN 'stale'
    ELSE 'outdated'
  END as status,
  EXTRACT(EPOCH FROM (NOW() - er.updated_at)) / 3600 as hours_since_update
FROM exchange_rates er
ORDER BY er.currency_code;

-- Helper function to check if refresh is needed
CREATE OR REPLACE FUNCTION should_refresh_exchange_rates()
RETURNS BOOLEAN
LANGUAGE sql
AS $$
  SELECT EXISTS (
    SELECT 1 FROM exchange_rates 
    WHERE currency_code != 'USD' 
    AND updated_at < NOW() - INTERVAL '24 hours'
    LIMIT 1
  ) OR NOT EXISTS (
    SELECT 1 FROM exchange_rates WHERE currency_code = 'CAD'
  );
$$;
```

### Step 3: Update Admin Exchange Rates Page

**File**: `src/pages/AdminExchangeRates.tsx`

Add a button to invoke the Edge Function:
- "Fetch Latest Rates" button with loading state
- Success/error toast notifications
- Show last API fetch timestamp
- Invalidate query cache after successful update

**New button behavior**:
```text
Click "Fetch Latest Rates" 
  → Invoke Edge Function
  → Update both database tables
  → Log to sync_logs
  → Refresh UI data
  → Show toast with result
```

### Step 4: Create Exchange Rate Info Component (Optional)

**File**: `src/components/ExchangeRateInfo.tsx`

A lightweight component for displaying rate freshness in other parts of the app (footer, settings, etc.).

---

## Database Changes

### Migration: Exchange Rate Monitoring Infrastructure

```sql
-- 1. Create status view
CREATE OR REPLACE VIEW exchange_rate_status AS
SELECT 
  er.currency_code,
  er.currency_name,
  er.currency_symbol,
  er.rate_to_usd,
  er.updated_at,
  CASE 
    WHEN er.updated_at > NOW() - INTERVAL '25 hours' THEN 'fresh'
    WHEN er.updated_at > NOW() - INTERVAL '3 days' THEN 'stale'
    ELSE 'outdated'
  END as status,
  EXTRACT(EPOCH FROM (NOW() - er.updated_at)) / 3600 as hours_since_update
FROM exchange_rates er
ORDER BY er.currency_code;

-- 2. Grant access to view
GRANT SELECT ON exchange_rate_status TO anon, authenticated;

-- 3. Create refresh check function
CREATE OR REPLACE FUNCTION should_refresh_exchange_rates()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM exchange_rates 
    WHERE currency_code != 'USD' 
    AND updated_at < NOW() - INTERVAL '24 hours'
    LIMIT 1
  ) OR NOT EXISTS (
    SELECT 1 FROM exchange_rates WHERE currency_code = 'CAD'
  );
$$;

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION should_refresh_exchange_rates TO anon, authenticated;
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/update-exchange-rates/index.ts` | Modify | Add dual-table writes + sync logging |
| `src/pages/AdminExchangeRates.tsx` | Modify | Add "Fetch Latest Rates" button |
| `src/components/ExchangeRateInfo.tsx` | Create | Optional display component |
| Database migration | Create | Status view + helper function |

---

## Technical Notes

### Dual Table Strategy

The Edge Function will update both tables to maintain backward compatibility:

| Table | Schema | Purpose |
|-------|--------|---------|
| `currency_exchange_rates` | base_currency, target_currency, rate, inverse_rate | Existing app functionality |
| `exchange_rates` | currency_code (PK), rate_to_usd | New Phase 1 regional pricing |

### Rate Calculation

```text
API returns: 1 USD = 1.36 CAD (rate from USD)
We store in exchange_rates:
  - rate_to_usd = 1 / 1.36 = 0.735294 (how much USD is 1 CAD)

We store in currency_exchange_rates:
  - rate = 1.36 (API rate from USD)
  - inverse_rate = 0.735294 (rate to USD)
```

### Currencies to Update

Combined list from both tables:
- CAD, EUR, GBP, AUD, JPY, CNY, INR, SEK, PLN, MXN (new table)
- CHF, CZK, KRW (existing table only, will be added to new table)

### Error Handling

- API failure → Log to sync_logs with error_message
- Partial failure → Still update successful currencies, report failures
- Network timeout → Return 500 with descriptive error

---

## Testing Plan

After implementation:

1. **Invoke Edge Function manually**:
   ```bash
   curl -X POST https://cfqfavmhdbyjzejipiwa.supabase.co/functions/v1/update-exchange-rates
   ```

2. **Verify both tables updated**:
   ```sql
   SELECT * FROM exchange_rates ORDER BY currency_code;
   SELECT * FROM currency_exchange_rates ORDER BY target_currency;
   ```

3. **Check sync log**:
   ```sql
   SELECT * FROM sync_logs WHERE sync_type = 'exchange_rates' ORDER BY started_at DESC LIMIT 1;
   ```

4. **Test admin button**:
   - Navigate to /admin/exchange-rates
   - Click "Fetch Latest Rates"
   - Verify toast shows success
   - Verify table data refreshes

5. **Test status view**:
   ```sql
   SELECT * FROM exchange_rate_status;
   ```



# Plan: Clean Regional Store Data & Create Exchange Rate Updater

## Overview

This plan addresses two tasks:
1. **Database Cleanup**: Audit and clean fake regional stores that point to the same URL as the US store
2. **Edge Function**: Create an automated exchange rate updater using exchangerate-api.com

---

## Task 1: Clean Regional Store Data

### Problem Identified

The database query revealed multiple "fake" regional stores where the `base_url` is identical to the US store for the same brand. These stores mislead the system into thinking there's a local store when there isn't one.

**Problematic Stores Found:**

| Brand | Region | Issue | Store Name |
|-------|--------|-------|------------|
| eSUN | CA | Same URL as US (esun3dstore.com) | eSun Canada |
| eSUN | UK | Same URL as US (esun3dstore.com) | eSun UK |
| eSUN | AU | Same URL as US (esun3dstore.com) | eSun Australia |
| eSUN | EU | Same URL as US (esun3dstore.com) | eSun EU |
| GEEETECH | EU | Same URL as US (geeetech.com) | GEEETECH EU |
| Polymaker | CA | Same URL as US (us.polymaker.com) | Polymaker CA |
| Polymaker | UK | Same URL as US (us.polymaker.com) | Polymaker UK |
| Sunlu | CA | Same URL as US (sunlu.com) | Sunlu Canada |
| Sunlu | AU | Same URL as US (sunlu.com) | Sunlu Australia |

**Legitimate "Same URL" Cases (ships from different countries):**
- AzureFilm (EU-based, ships from Slovenia)
- ColorFabb (EU-based, ships from Netherlands)
- Extrudr (EU-based, ships from Austria)
- Fiberlogy (EU-based, ships from Poland)
- Fillamentum (EU-based, ships from Czech Republic)
- FormFutura (EU-based, ships from Netherlands)
- Matter3D (CA-based, ships from Canada)
- Prusament (EU-based, ships from Czech Republic)

### Solution Approach

Delete fake regional stores that:
1. Have the same base_url as the US primary store
2. Don't have a legitimate `ships_from_country` that differs from US
3. Are not truly regional (just duplicates to game the system)

### SQL Migration

```sql
-- Delete eSUN fake regional stores (all use esun3dstore.com, all ship from CN like US)
DELETE FROM brand_regional_stores 
WHERE store_name IN ('eSun Canada', 'eSun UK', 'eSun Australia')
AND base_url = 'https://esun3dstore.com';

-- Keep eSun EU - it has ships_from_country = 'NL' (Netherlands warehouse)
-- Update eSun EU to clarify it ships from EU
UPDATE brand_regional_stores 
SET notes = 'Ships from EU warehouse (Netherlands)'
WHERE store_name = 'eSun EU' AND region_code = 'EU';

-- Delete GEEETECH EU (same URL as US, both ship from CN)
DELETE FROM brand_regional_stores 
WHERE store_name = 'GEEETECH EU' 
AND base_url = 'https://www.geeetech.com'
AND ships_from_country = 'CN';

-- Delete Polymaker fake stores (CA, UK point to us.polymaker.com)
DELETE FROM brand_regional_stores 
WHERE store_name IN ('Polymaker CA', 'Polymaker UK')
AND base_url = 'https://us.polymaker.com';

-- Delete Sunlu fake stores (CA, AU point to global sunlu.com, ship from CN)
DELETE FROM brand_regional_stores 
WHERE store_name IN ('Sunlu Canada', 'Sunlu Australia')
AND base_url = 'https://www.sunlu.com'
AND ships_from_country = 'CN';
```

---

## Task 2: Exchange Rate Updater Edge Function

### API Selection

Using **exchangerate-api.com** free tier:
- 1,500 requests/month free
- No API key required for open access endpoint
- Returns rates based on USD

### Target Currencies

Update rates for: CAD, EUR, GBP, AUD, JPY, CNY, KRW, PLN, CZK, SEK, CHF

### Edge Function Design

**File**: `supabase/functions/update-exchange-rates/index.ts`

**Features**:
- Fetches latest rates from exchangerate-api.com
- Updates `currency_exchange_rates` table with new rates
- Calculates inverse rates automatically
- Includes CORS headers for web access
- Error handling with detailed logging
- Can be triggered manually or via cron

**API Endpoint**: `https://open.er-api.com/v6/latest/USD`

### Function Structure

```typescript
// CORS headers (standard pattern)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Target currencies to update
const TARGET_CURRENCIES = [
  'CAD', 'EUR', 'GBP', 'AUD', 'JPY', 
  'CNY', 'KRW', 'PLN', 'CZK', 'SEK', 'CHF'
];

// Fetch from API, update database
Deno.serve(async (req) => {
  // Handle CORS preflight
  // Fetch from exchangerate-api.com
  // Update/upsert currency_exchange_rates table
  // Return success/failure response
});
```

### Database Update Strategy

For each currency:
1. Calculate rate (from API response)
2. Calculate inverse_rate (1 / rate)
3. Upsert into `currency_exchange_rates` table using target_currency as key

---

## Files to Create/Modify

### 1. Database Migration (via migration tool)

**Action**: Delete fake regional stores, keep legitimate ones

```sql
-- Audit and clean fake regional stores

-- 1. Delete eSUN fake stores (CA, UK, AU all use same esun3dstore.com and ship from CN)
DELETE FROM brand_regional_stores 
WHERE id IN (
  '0e1a6438-7af0-4c79-98d5-3b0cb3f00e5e',  -- eSun Canada
  'e3ed783c-07a6-4d7d-a8cb-cd696c8aa261',  -- eSun UK  
  'd328090b-3c16-456b-bd2e-01345c644a57'   -- eSun Australia
);

-- 2. Delete GEEETECH EU (same URL, ships from CN like US)
DELETE FROM brand_regional_stores 
WHERE id = '217e77e4-cd23-4971-a268-92081af986ce';

-- 3. Delete Polymaker fake stores (CA, UK point to US store)
DELETE FROM brand_regional_stores 
WHERE id IN (
  '3f6720ef-c072-4986-a09b-ce2e1f6d...',  -- Need to verify these IDs
  '...'
);

-- 4. Delete Sunlu fake stores (CA, AU use global URL, ship from CN)
DELETE FROM brand_regional_stores 
WHERE id IN (
  '40a64d48-c5a4-4a59-93a8-811382ceac87',  -- Sunlu Canada
  '4d6c523b-4a14-417e-a493-466b0fc22cb9'   -- Sunlu Australia
);
```

### 2. New Edge Function

**File**: `supabase/functions/update-exchange-rates/index.ts`

Full implementation with:
- CORS headers
- API call to exchangerate-api.com
- Database upsert logic
- Error handling
- Response formatting

---

## Technical Details

### Exchange Rate API Response Format

```json
{
  "result": "success",
  "base_code": "USD",
  "rates": {
    "CAD": 1.36,
    "EUR": 0.92,
    "GBP": 0.79,
    ...
  }
}
```

### Database Upsert Logic

```typescript
// For each currency, upsert the rate
for (const currency of TARGET_CURRENCIES) {
  const rate = apiRates[currency];
  if (!rate) continue;
  
  const { error } = await supabase
    .from('currency_exchange_rates')
    .upsert({
      base_currency: 'USD',
      target_currency: currency,
      rate: rate,
      inverse_rate: 1 / rate,
      source: 'exchangerate-api.com',
      fetched_at: new Date().toISOString(),
    }, {
      onConflict: 'target_currency'  // Update existing row
    });
}
```

### config.toml Update

```toml
[functions.update-exchange-rates]
verify_jwt = false
```

---

## Implementation Order

1. **Run database migration** to clean fake regional stores
2. **Create edge function** for exchange rate updates
3. **Deploy and test** the edge function
4. **Verify** cleaned regional stores work correctly

---

## Testing Plan

### Task 1 Testing
1. Query `brand_regional_stores` to confirm fake stores deleted
2. Switch to Canada region in the app
3. Visit eSUN filament - should now show "Ships from USA" warning (no fake CA store)
4. Visit brands with legitimate regional stores - should work normally

### Task 2 Testing
1. Call the edge function: `POST /update-exchange-rates`
2. Query `currency_exchange_rates` to verify rates updated
3. Verify `source` column shows 'exchangerate-api.com'
4. Verify `fetched_at` is recent timestamp


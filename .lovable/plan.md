
# Fix Bambu Lab Printer Pricing: Root Cause Analysis and Repair Plan

## Root Cause Analysis

After tracing through the database, price history, edge function logs, and admin UI code, I identified **5 interconnected bugs** that are corrupting printer pricing data:

### Bug 1: Admin Pricing Dashboard Uses the Wrong Sync Engine for Printers
**Location:** `src/pages/admin/pricing/hooks/usePricingActions.ts` (line 292)

The "Sync" button on the admin pricing dashboard calls `get-current-price` -- a **filament price scraper** that uses Firecrawl markdown parsing. This function was never designed for printers and produces garbage results:
- For the A1, it extracts **$160** (an accessory price on the page) instead of **$299** (the actual printer price)
- The `price_history` table confirms: every `admin_refresh` entry for the A1 shows `price: 160.00` with `compare_at: 559`

The correct function for printers is `sync-printer-prices`, which uses the JSON-LD extraction engine with variant selection logic.

### Bug 2: Geo-Redirect Corrupts All Non-US Regional Prices
**Location:** `supabase/functions/_shared/printer-price-extraction.ts` (line 491-508)

The edge function server is in **Canada**. When it fetches regional store URLs:
- `uk.store.bambulab.com/products/a1` redirects (302) to `ca.store.bambulab.com/products/a1`
- `au.store.bambulab.com/products/a1` redirects to `ca.store.bambulab.com/products/a1`
- `jp.store.bambulab.com/products/a1` redirects to `ca.store.bambulab.com/products/a1`

The `fetchHtml()` function uses the default `redirect: 'follow'` behavior, silently following the redirect. It then extracts **CAD prices from the Canadian store** and stores them as GBP, AUD, or JPY values. This explains:
- UK showing L379 (actually C$379 from CA store)
- AU showing $210 (a random CAD variant price)
- JP showing Y2,210 (a random CAD variant price)

### Bug 3: USD Column Mapping Bug
**Location:** `src/pages/admin/pricing/hooks/usePricingActions.ts` (line 388)

```
USD: 'variant_price'  // WRONG -- should be 'current_price_usd_store'
```

When the admin dashboard syncs a USD price for a printer, it writes to `variant_price` instead of `current_price_usd_store`. This means the main USD price column used by the display component never gets the synced value (which is already wrong from Bug 1, but it's still a mapping error).

### Bug 4: JP Region Missing from Sync Engine
**Location:** `supabase/functions/sync-printer-prices/index.ts` (lines 11-17)

The `REGION_MAP` in `sync-printer-prices` only has US, CA, UK, EU, AU. Japan is completely missing, so JP prices are never synced by the proper engine. The garbage JP values (Y2,210) came from the admin dashboard's `get-current-price` calls (Bug 1 + Bug 2).

### Bug 5: No Price Sanity Validation Per Currency
There is no per-currency range check. A printer price of Y2,210 JPY (~$15 USD) should be immediately rejected as impossible, but it's accepted and stored.

---

## Repair Plan

### Step 1: Fix the Admin Pricing Dashboard's Printer Sync Path
**File:** `src/pages/admin/pricing/hooks/usePricingActions.ts`

For `productType === 'printer'`, change `syncSinglePrice` to call `sync-printer-prices` with `{ printer_id: store.representativeId }` instead of `get-current-price`. This routes all printer syncs through the proper JSON-LD extraction engine with variant filtering.

Also fix the USD column mapping:
```
USD: 'current_price_usd_store'  // was 'variant_price'
```

### Step 2: Fix Geo-Redirect in the Extraction Engine
**File:** `supabase/functions/_shared/printer-price-extraction.ts`

Modify `fetchHtml()` to:
1. Set `redirect: 'manual'` to prevent auto-following redirects
2. If a 3xx response is received, check if the redirect domain differs from the request domain
3. If geo-redirected (e.g., `uk.store.bambulab.com` redirected to `ca.store.bambulab.com`), reject the response and return null
4. Add region-spoofing headers: `Accept-Language`, `CF-IPCountry`, `X-Forwarded-For` with IP addresses appropriate for each region
5. If spoofed headers still get redirected, fall back gracefully (log the error, don't store garbage)

### Step 3: Add JP Region to Sync Engine
**File:** `supabase/functions/sync-printer-prices/index.ts`

Add to `REGION_MAP`:
```
JP: { urlCol: "product_url_jp", priceCol: "current_price_jpy_store", msrpCol: "msrp_jpy", currency: "JPY", configUrlCol: "store_url_jp" }
```

Also add `store_url_jp` to the `brand_sync_config` for Bambu Lab: `https://jp.store.bambulab.com/products/{slug}`

### Step 4: Add Per-Currency Price Validation
**File:** `supabase/functions/_shared/printer-price-extraction.ts`

Add a validation function that rejects clearly impossible printer prices based on currency:

```text
Currency | Min  | Max
---------|------|--------
USD      | $50  | $15,000
CAD      | $60  | $20,000
GBP      | L40  | L12,000
EUR      | E45  | E14,000
AUD      | $70  | $22,000
JPY      | Y5k  | Y2,000k
```

Any extraction outside these ranges gets rejected with `requires_review = true`.

### Step 5: Manually Correct ALL Bambu Lab Prices (Data Fix)

Set verified prices for all 10 Bambu Lab printers via SQL UPDATE. This time, also include AU and JP prices (user-verified) and protect against future overwrites by setting `sync_status = 'manual_verified'`.

Verified prices to set:

```text
Printer     | USD    | CAD     | GBP     | EUR  | AUD    | JPY
------------|--------|---------|---------|------|--------|--------
A1 Mini     | $219   | C$239   | L149    | null | $429*  | Y72,800*
A1          | $299   | C$339   | L209    | null | $429*  | Y72,800*
P1S         | $399   | C$499   | L339    | null | null   | null
P2S         | $549   | C$799   | L479    | null | null   | null
H2S         | $1,249 | C$1,649 | L999    | null | null   | null
H2D         | $1,749 | C$2,269 | L1,449  | null | null   | null
H2C         | $2,399 | C$3,149 | L1,999  | null | null   | null
X1E         | null   | null    | null    | null | null   | null
P1P         | null   | null    | null    | null | null   | null
X1 Carbon   | null   | null    | null    | null | null   | null
```

*AU and JP: User reported A1 should be $429 AUD and Y72,800 JPY. These need verification for other models -- set to null for unverified ones.

EU and AU/JP for most models: Set to null, display "Check store" link.

### Step 6: Add Overwrite Protection
**File:** `src/pages/admin/pricing/hooks/usePricingActions.ts`

Before auto-syncing a printer price, check if `sync_status === 'manual_verified'`. If so, show a confirmation dialog warning that manually verified prices will be overwritten, requiring explicit admin approval.

---

## Technical Details

### Files Modified
1. `src/pages/admin/pricing/hooks/usePricingActions.ts` -- Route printer syncs to `sync-printer-prices`, fix USD column mapping, add overwrite protection
2. `supabase/functions/_shared/printer-price-extraction.ts` -- Fix geo-redirect in `fetchHtml()`, add per-currency price range validation
3. `supabase/functions/sync-printer-prices/index.ts` -- Add JP to REGION_MAP

### Data Updates (via database tool)
- 10 SQL UPDATE statements for all Bambu Lab printers with verified prices
- UPDATE `brand_sync_config` to add `store_url_jp` for Bambu Lab

### Verification Checklist
After implementation:
1. Check `/printers/bambu-lab-a1` -- US=$299, CA=C$339, UK=L209, EU="Check store", AU=$429, JP=Y72,800
2. Check `/printers/bambu-lab-p1s` -- US=$399, CA=C$499, UK=L339
3. Check `/printers/bambu-lab-h2c` -- US=$2,399, UK=L1,999
4. Admin pricing dashboard "Sync" button for printers calls `sync-printer-prices` not `get-current-price`
5. Syncing a UK printer URL does NOT get geo-redirected prices
6. JPY prices in the thousands are rejected (should be tens of thousands for printers)
7. X1E shows "Reseller Only" with no price

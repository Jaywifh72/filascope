

# Fix Elegoo Printer Regional Pricing

## Problem
All 7 Elegoo printers show "Not Tested" for regional prices. No regional syncing happens because:
- `brand_sync_config` has no regional store URL templates (CA/UK/EU/AU all null)
- No regional URLs are set on the printer rows themselves
- JP and CN stores are marked active but aren't functional stores
- Two printers use `www.elegoo.com` instead of `us.elegoo.com` for their US URL

## Solution (3 data updates + 1 config update, no code changes needed)

The existing sync engine already supports everything needed. This is purely a data/configuration fix.

### Step 1: Update brand_sync_config with regional store URLs

Add Shopify JSON URL templates for all 5 functional regions:

| Column | Value |
|--------|-------|
| store_url_us | `https://us.elegoo.com/products/{slug}` (already set) |
| store_url_ca | `https://ca.elegoo.com/products/{slug}` |
| store_url_uk | `https://uk.elegoo.com/products/{slug}` |
| store_url_eu | `https://eu.elegoo.com/products/{slug}` |
| store_url_au | `https://au.elegoo.com/products/{slug}` |
| store_url_jp | null (not a store) |

### Step 2: Mark JP and CN stores inactive

Update `brand_regional_stores` to set `is_active = false` for:
- Elegoo JP (`elegoo.co.jp`) -- WordPress blog, not a store
- Elegoo CN (`www.elegoo.cn`) -- inaccessible outside China

### Step 3: Fix US product URLs

Two printers use `www.elegoo.com` instead of `us.elegoo.com`:
- Neptune 4: `www.elegoo.com/products/...` -> `us.elegoo.com/products/...`
- Neptune 3 Pro: `www.elegoo.com/products/...` -> `us.elegoo.com/products/...`

### Step 4: Populate regional URLs on all 7 printers

Set `product_url_ca`, `product_url_uk`, `product_url_eu`, `product_url_au` for each printer using its verified handle (same handle works on all regions).

## Why no code changes are needed

The sync engine (`sync-printer-prices/index.ts`) already:
- Reads `brand_sync_config` store URL templates and substitutes `{slug}`
- Skips regions where `brand_regional_stores.is_active = false`
- Uses Shopify JSON extraction when `shopify_json_available = true`
- Handles subdomain-per-region Shopify stores (fetches `{domain}/products/{slug}.json`)

## Expected Outcome

- 7 printers x 5 regions (US, CA, UK, EU, AU) = 35 price points syncing
- JP and CN show as "N/A" (inactive store) instead of "Failed"
- Shopify JSON provides reliable structured price data

## Technical Details

### Database updates (using insert/update tool, not migrations)

**1. Update `brand_sync_config`** where `brand_id = 'elegoo'`:
```sql
UPDATE brand_sync_config 
SET store_url_ca = 'https://ca.elegoo.com/products/{slug}',
    store_url_uk = 'https://uk.elegoo.com/products/{slug}',
    store_url_eu = 'https://eu.elegoo.com/products/{slug}',
    store_url_au = 'https://au.elegoo.com/products/{slug}'
WHERE brand_id = 'elegoo';
```

**2. Deactivate JP and CN stores:**
```sql
UPDATE brand_regional_stores SET is_active = false 
WHERE id IN ('cba1ecae-3fab-4fbe-bd39-b5ca0ff07a6e', '2d23a44d-c400-44d8-b690-b241a448fc80');
```

**3. Fix US URLs and populate regional URLs** for all 7 printers using their verified Shopify handles.

**4. Update `brand_regional_stores` `shopify_domain`** for the 5 active regions so the system can use Shopify JSON directly:
- US: `us.elegoo.com`
- CA: `ca.elegoo.com`
- UK: `uk.elegoo.com`
- EU: `eu.elegoo.com`
- AU: `au.elegoo.com`




## Plan: Create `backfill-filament-listings` Edge Function

### Overview
A new Edge Function that populates the `filament_listings` table from existing `filaments` data (8,535 rows with embedded regional prices) and `product_regional_prices` (413 rows). No migration needed — the unique constraint `UNIQUE(filament_id, retailer_id, region)` already exists.

### Retailer Mapping Strategy
The `filament_listings` table requires a `retailer_id` (FK to `retailers`). The function will:
1. Load all retailers from `retailers` table
2. For each filament, match `vendor` name to a retailer by case-insensitive name/slug match
3. If no match found, find or create a retailer for the brand (upsert into `retailers` with slug derived from vendor name)
4. Cache the vendor→retailer mapping to avoid repeated lookups

### File: `supabase/functions/backfill-filament-listings/index.ts`

**Auth**: Same pattern as `import-synced-filaments` — Bearer token → `getUser()` → admin role check via `user_roles`.

**Flow**:

1. Load all retailers into a map (slug → id, name → id)
2. Fetch filaments in batches of 100 using pagination (`.range(offset, offset+99)`)
3. For each filament with at least one non-null price:
   - Resolve `retailer_id` from vendor name → retailers map
   - If no retailer match, upsert a new retailer row with `name=vendor, slug=slugify(vendor)`
   - Generate listing rows for each region where price exists:

     | Region | Price Column | URL Column | Currency |
     |--------|-------------|------------|----------|
     | US | `variant_price` | `product_url` | USD |
     | AU | `price_aud` | `product_url_au` | AUD |
     | CA | `price_cad` | `product_url_ca` | CAD |
     | EU | `price_eur` | `product_url_eu` | EUR |
     | UK | `price_gbp` | `product_url_uk` | GBP |
     | JP | `price_jpy` | `product_url_jp` | JPY |

   - Skip if price is null or URL is null (listings need a product_url — it's NOT NULL)
   - Set `is_primary = (region === filament.primary_region || (region === 'US' && !primary_region))`
   - Set `price_source = 'backfill_from_filaments'`, `available = true`
   - Set `compare_at_price = msrp` if msrp differs from current_price

4. Upsert each batch into `filament_listings` using `onConflict: 'filament_id,retailer_id,region'`
5. After filaments pass, fetch `product_regional_prices` rows and create additional listings for any filament+region combos not already covered (only if there's a matching URL in `product_regional_urls`)
6. Return summary JSON

**Batching**: Process 100 filaments at a time. Upsert listings in chunks of 200 rows.

### Config Addition
Add to `supabase/config.toml`:
```toml
[functions.backfill-filament-listings]
verify_jwt = false
```

### Files Modified
| File | Change |
|------|--------|
| `supabase/functions/backfill-filament-listings/index.ts` | New Edge Function |
| `supabase/config.toml` | Add function entry |




## Execute Multi-Product Support Migration

### Problem
The migration SQL exists conceptually but was never deployed to the database. The printers table has only 28 columns (missing product_url, variant_price, slug, etc.), and the accessories, printer_brands, printer_inventory, and discovery_runs tables do not exist.

### Action
Create a single migration file `supabase/migrations/20260222180000_multi_product_support.sql` containing all the SQL from your original specification:

1. **ALTER printers** -- Add 37 new columns (product_url, regional URLs, variant_price, variant_compare_at_price, variant_id, variant_title, variant_sku, variant_available, image_url, slug, description, tags, all amazon_link_* columns, published_at, current_price_usd_store, current_price_usd_amazon, msrp_usd, printer_technology, sku, series_name, variant_or_bundle_name, is_discontinued, product_page_url) plus indexes on brand and slug.

2. **CREATE accessories** -- Full table with brand, name, slug, category, subcategory, description, sku, image_url, all regional URLs, variant fields, compatibility arrays, specifications jsonb, all amazon links, sync fields, timestamps. RLS enabled with public read + admin write.

3. **CREATE printer_brands** -- id, brand (unique), logo_url, website_url, store_url, amazon_affiliate_tag, regions, is_active, timestamps. RLS enabled.

4. **CREATE printer_inventory** -- id, printer_id (FK to printers), retailer_id, stock_status, stock_quantity, price, currency, product_url, estimated_ship_days, last_checked, retailers jsonb, timestamps. RLS enabled.

5. **CREATE discovery_runs** -- id, printer_brands_id, brand, discovery_models jsonb, status, started_at, completed_at, models_found, models_new, error_log, created_at. RLS enabled.

6. **ALTER price_history** -- Add printer_id (FK), accessory_id (FK), product_type (default 'filament') columns plus indexes.

7. **Conditional ALTER filament_listings / store_listings** -- If either table exists, add printer_id, accessory_id, product_type columns.

8. **Trigger** -- Add updated_at trigger on accessories using existing `update_listing_timestamp()` function.

All statements use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` for idempotency.

### No other files modified
This is a database-only change. No TypeScript/React files will be touched.


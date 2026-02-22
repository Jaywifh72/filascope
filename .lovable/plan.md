

## Multi-Product Database Extension

### What This Does
Extends the database to support pricing data for printers and accessories alongside filaments, by creating 1 new table and adding columns to 3 existing tables.

### Changes

**1. New `accessories` table** with 50+ columns matching the filament pattern: regional URLs, variant pricing, Amazon links, compatibility arrays, flexible specs JSON, sync fields, and timestamps. RLS: public read, admin write (using `has_role()`).

**2. Extend `filament_listings` table** (the actual listings table — note: there is no `store_listings` table):
- Add `printer_id` (FK to printers), `accessory_id` (FK to accessories), `product_type` (text, default 'filament')
- Add a CHECK constraint ensuring at most one product FK is set
- Add indexes on new columns

**3. Extend `price_history` table:**
- Add `printer_id` (FK to printers), `accessory_id` (FK to accessories), `product_type` (text, default 'filament')
- Add indexes on new columns

**4. Add columns to `printers` table:**
- Regional URLs: `product_url`, `product_url_ca/uk/eu/au/jp`
- Display: `image_url`, `slug`, `description`
- Variant pricing: `variant_id`, `variant_title`, `variant_sku`, `variant_price`, `variant_compare_at_price`, `variant_available`
- Amazon links: `amazon_link_us/uk/de/ca/fr/es/it/nl/be/au/jp`
- Other: `tags`, `published_at`
- Note: Printers already has `official_product_url`, `amazon_url_us/ca/uk`, and `msrp_usd`/`current_price_usd_store` — the new columns follow the filament naming pattern for consistency in the pricing tool

### Technical Details

- **RLS**: Accessories uses `public.has_role(auth.uid(), 'admin')` for write policies (matching existing project pattern), not `profiles.role`
- **Trigger**: Reuses existing `update_listing_timestamp()` function for `updated_at` auto-update (there is no `handle_updated_at()` function in this DB)
- **Constraint**: `filament_listings_one_product_check` ensures each listing row links to at most one product type
- **Backward compatibility**: `filament_id` column unchanged; existing rows get `product_type = 'filament'` by default
- **No code changes**: Migration only — no React components modified
- Single migration file with all 4 steps


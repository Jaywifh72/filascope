-- Fix 3: Clean up duplicate filament rows created by failed syncs
-- These rows have a regional price but no variant_price, were auto-created after 2026-03-28
-- Strategy: copy regional prices to the original row, then delete the duplicate

-- Step 1: Copy regional prices from duplicates to their originals
-- Original = same vendor + product_title + material, but has variant_price set
UPDATE filaments AS orig
SET
  price_cad = COALESCE(orig.price_cad, dup.price_cad),
  price_eur = COALESCE(orig.price_eur, dup.price_eur),
  price_gbp = COALESCE(orig.price_gbp, dup.price_gbp),
  price_aud = COALESCE(orig.price_aud, dup.price_aud),
  price_jpy = COALESCE(orig.price_jpy, dup.price_jpy)
FROM filaments AS dup
WHERE dup.auto_created = true
  AND dup.created_at > '2026-03-28'
  AND dup.variant_price IS NULL
  AND (dup.price_jpy IS NOT NULL OR dup.price_eur IS NOT NULL OR dup.price_cad IS NOT NULL OR dup.price_gbp IS NOT NULL OR dup.price_aud IS NOT NULL)
  AND orig.id != dup.id
  AND LOWER(orig.vendor) = LOWER(dup.vendor)
  AND orig.material IS NOT DISTINCT FROM dup.material
  AND LOWER(orig.product_title) = LOWER(dup.product_title)
  AND orig.variant_price IS NOT NULL;

-- Step 2: Delete the duplicate rows (after prices have been merged above)
DELETE FROM filaments
WHERE auto_created = true
  AND created_at > '2026-03-28'
  AND variant_price IS NULL
  AND (price_jpy IS NOT NULL OR price_eur IS NOT NULL OR price_cad IS NOT NULL OR price_gbp IS NOT NULL OR price_aud IS NOT NULL);

-- Verification:
-- SELECT COUNT(*) FROM filaments
-- WHERE auto_created = true AND created_at > '2026-03-28' AND variant_price IS NULL;
-- Should be 0 after cleanup.

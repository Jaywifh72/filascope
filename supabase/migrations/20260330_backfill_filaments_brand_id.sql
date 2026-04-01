-- Fix 1: Backfill filaments.brand_id to use automated_brands.id
-- Root cause: filaments were seeded with legacy brand_ids that don't match automated_brands
-- Join: filaments.vendor (display name) <-> automated_brands.brand_name

-- Preview (verify before running UPDATE):
-- SELECT
--   f.vendor,
--   f.brand_id AS current_brand_id,
--   ab.id AS correct_brand_id,
--   ab.brand_slug,
--   COUNT(*) AS filament_count
-- FROM filaments f
-- JOIN automated_brands ab ON LOWER(f.vendor) = LOWER(ab.brand_name)
-- WHERE f.brand_id != ab.id OR f.brand_id IS NULL
-- GROUP BY f.vendor, f.brand_id, ab.id, ab.brand_slug
-- ORDER BY filament_count DESC;

UPDATE filaments f
SET brand_id = ab.id
FROM automated_brands ab
WHERE LOWER(f.vendor) = LOWER(ab.brand_name)
  AND (f.brand_id != ab.id OR f.brand_id IS NULL);

-- Verification: count filaments that still have no matching brand_id
-- Should be 0 (or only vendors not in automated_brands)
-- SELECT COUNT(*) FROM filaments f
-- LEFT JOIN automated_brands ab ON LOWER(f.vendor) = LOWER(ab.brand_name)
-- WHERE ab.id IS NULL;

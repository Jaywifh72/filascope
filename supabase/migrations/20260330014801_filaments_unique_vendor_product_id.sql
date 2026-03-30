-- Migration: Add unique constraint on filaments(vendor, product_id)
-- Required for ON CONFLICT upserts in brand sync functions (Duramic, eSUN, etc.)

-- Step 1: Remove duplicate (vendor, product_id) rows, keeping most recent
DELETE FROM filaments
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY vendor, product_id
             ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
           ) as rn
    FROM filaments
    WHERE vendor IS NOT NULL AND product_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- Step 2: Add unique constraint (NULLs are excluded automatically in Postgres)
ALTER TABLE filaments
  ADD CONSTRAINT filaments_vendor_product_id_unique UNIQUE (vendor, product_id);

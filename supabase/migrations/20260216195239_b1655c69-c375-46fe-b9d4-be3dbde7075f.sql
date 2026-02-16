-- Fix price constraints for multi-currency support (JPY prices can exceed 10,000)
-- Previous constraint capped at 10,000 which rejects valid JPY prices like ¥12,000

ALTER TABLE filaments DROP CONSTRAINT IF EXISTS chk_filaments_price_positive;
ALTER TABLE filaments ADD CONSTRAINT chk_filaments_price_positive
  CHECK (variant_price IS NULL OR (variant_price > 0 AND variant_price < 100000));

ALTER TABLE filaments DROP CONSTRAINT IF EXISTS chk_filaments_compare_price_positive;
ALTER TABLE filaments ADD CONSTRAINT chk_filaments_compare_price_positive
  CHECK (variant_compare_at_price IS NULL OR (variant_compare_at_price > 0 AND variant_compare_at_price < 100000));

ALTER TABLE price_history DROP CONSTRAINT IF EXISTS chk_price_history_price_positive;
ALTER TABLE price_history ADD CONSTRAINT chk_price_history_price_positive
  CHECK (price > 0 AND price < 100000);

ALTER TABLE price_history DROP CONSTRAINT IF EXISTS chk_price_history_compare_positive;
ALTER TABLE price_history ADD CONSTRAINT chk_price_history_compare_positive
  CHECK (compare_at_price IS NULL OR (compare_at_price > 0 AND compare_at_price < 100000));
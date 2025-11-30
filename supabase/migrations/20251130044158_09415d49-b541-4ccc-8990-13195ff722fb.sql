-- Remove Amazon rating columns from filaments table
ALTER TABLE public.filaments
  DROP COLUMN IF EXISTS amazon_rating_us,
  DROP COLUMN IF EXISTS amazon_rating_uk,
  DROP COLUMN IF EXISTS amazon_rating_de,
  DROP COLUMN IF EXISTS amazon_review_count_us,
  DROP COLUMN IF EXISTS amazon_review_count_uk,
  DROP COLUMN IF EXISTS amazon_review_count_de;
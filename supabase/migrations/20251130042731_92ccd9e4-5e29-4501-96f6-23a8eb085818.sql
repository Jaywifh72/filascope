-- Add Amazon rating fields to filaments table
ALTER TABLE public.filaments 
ADD COLUMN amazon_rating_us NUMERIC CHECK (amazon_rating_us >= 0 AND amazon_rating_us <= 5),
ADD COLUMN amazon_rating_uk NUMERIC CHECK (amazon_rating_uk >= 0 AND amazon_rating_uk <= 5),
ADD COLUMN amazon_rating_de NUMERIC CHECK (amazon_rating_de >= 0 AND amazon_rating_de <= 5),
ADD COLUMN amazon_review_count_us INTEGER CHECK (amazon_review_count_us >= 0),
ADD COLUMN amazon_review_count_uk INTEGER CHECK (amazon_review_count_uk >= 0),
ADD COLUMN amazon_review_count_de INTEGER CHECK (amazon_review_count_de >= 0);
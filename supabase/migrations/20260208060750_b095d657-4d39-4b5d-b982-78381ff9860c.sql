
-- Add deleted_at column for soft-delete of reviews
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Update existing RLS policies to exclude soft-deleted reviews from public view
-- (owner can still see their own deleted reviews for potential recovery)

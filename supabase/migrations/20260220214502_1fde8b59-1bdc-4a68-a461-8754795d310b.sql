
-- Add unique constraint on listing_id so upsert ON CONFLICT works correctly
-- First remove any duplicate rows (keep most recent)
DELETE FROM public.broken_links a
USING public.broken_links b
WHERE a.ctid < b.ctid AND a.listing_id = b.listing_id AND a.listing_id IS NOT NULL;

-- Add unique constraint
ALTER TABLE public.broken_links ADD CONSTRAINT broken_links_listing_id_unique UNIQUE (listing_id);

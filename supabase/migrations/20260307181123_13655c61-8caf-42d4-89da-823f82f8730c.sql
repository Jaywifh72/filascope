
-- Add JPY price column to brand_sync_items (after price_aud for consistency)
ALTER TABLE public.brand_sync_items
ADD COLUMN IF NOT EXISTS price_jpy numeric DEFAULT NULL;

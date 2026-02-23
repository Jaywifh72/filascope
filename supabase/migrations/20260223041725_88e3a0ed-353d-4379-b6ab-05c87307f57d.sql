-- Add shopify_variant_ids JSONB column to printers table
-- Stores {"US": "variant_123", "CA": "variant_456", ...} for tracking Shopify variant IDs per region
ALTER TABLE public.printers
ADD COLUMN shopify_variant_ids JSONB DEFAULT '{}'::jsonb;
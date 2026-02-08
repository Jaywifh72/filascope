
-- Extend user_purchases table with missing columns for full purchase tracking
ALTER TABLE public.user_purchases 
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'filament',
  ADD COLUMN IF NOT EXISTS store_name TEXT,
  ADD COLUMN IF NOT EXISTS price_paid NUMERIC,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create index for product lookups
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON public.user_purchases (user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_purchases_updated_at ON public.user_purchases;
CREATE TRIGGER update_user_purchases_updated_at
  BEFORE UPDATE ON public.user_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add verified_purchase to product_reviews
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT false;

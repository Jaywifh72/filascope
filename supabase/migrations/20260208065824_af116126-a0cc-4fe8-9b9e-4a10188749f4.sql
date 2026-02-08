
-- Add missing columns to user_browse_history
ALTER TABLE public.user_browse_history 
  ADD COLUMN IF NOT EXISTS printer_id uuid REFERENCES public.printers(id),
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'filament',
  ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_browse_history_user_viewed 
  ON public.user_browse_history(user_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_browse_history_product_type 
  ON public.user_browse_history(product_type);

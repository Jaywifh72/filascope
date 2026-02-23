-- Add sync tracking columns to printers table
ALTER TABLE public.printers
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'never_synced',
  ADD COLUMN IF NOT EXISTS sync_method TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS variant_selected TEXT;

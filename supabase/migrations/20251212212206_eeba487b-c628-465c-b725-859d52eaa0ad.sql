-- Add app store URL columns to printer_software table
ALTER TABLE public.printer_software
ADD COLUMN IF NOT EXISTS google_play_url TEXT,
ADD COLUMN IF NOT EXISTS app_store_url TEXT,
ADD COLUMN IF NOT EXISTS is_mobile_app BOOLEAN DEFAULT false;
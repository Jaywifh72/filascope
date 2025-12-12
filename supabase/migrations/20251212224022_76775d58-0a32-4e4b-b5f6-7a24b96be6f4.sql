-- Add OS-specific download URLs and supported platforms to printer_software
ALTER TABLE public.printer_software
ADD COLUMN IF NOT EXISTS download_url_windows TEXT,
ADD COLUMN IF NOT EXISTS download_url_mac TEXT,
ADD COLUMN IF NOT EXISTS download_url_linux TEXT,
ADD COLUMN IF NOT EXISTS supported_platforms TEXT[] DEFAULT ARRAY['windows', 'mac', 'linux'];
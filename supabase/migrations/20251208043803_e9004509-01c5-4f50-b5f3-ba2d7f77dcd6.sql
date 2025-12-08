-- Add new columns to filaments table
ALTER TABLE public.filaments
ADD COLUMN IF NOT EXISTS spool_material text,
ADD COLUMN IF NOT EXISTS transmission_distance numeric,
ADD COLUMN IF NOT EXISTS high_speed_capable boolean DEFAULT false;
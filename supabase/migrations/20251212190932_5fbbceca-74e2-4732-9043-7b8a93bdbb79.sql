-- Add carbon fiber percentage column
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS carbon_fiber_percentage numeric;
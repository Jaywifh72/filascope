-- Add glass fiber percentage column to filaments table
ALTER TABLE public.filaments
ADD COLUMN glass_fiber_percentage numeric;
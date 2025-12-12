-- Add wood-specific specification columns to filaments table
ALTER TABLE public.filaments
ADD COLUMN IF NOT EXISTS wood_powder_percentage numeric,
ADD COLUMN IF NOT EXISTS wood_type text,
ADD COLUMN IF NOT EXISTS wood_particle_size_microns numeric,
ADD COLUMN IF NOT EXISTS wood_fiber_length_mm numeric,
ADD COLUMN IF NOT EXISTS wood_scent_level text;

-- Add comments for clarity
COMMENT ON COLUMN public.filaments.wood_powder_percentage IS 'Percentage of wood powder/fiber content in the filament (0-100)';
COMMENT ON COLUMN public.filaments.wood_type IS 'Type of wood used (e.g., Bamboo, Pine, Walnut, Oak, Cork, Rosewood)';
COMMENT ON COLUMN public.filaments.wood_particle_size_microns IS 'Average wood particle size in microns';
COMMENT ON COLUMN public.filaments.wood_fiber_length_mm IS 'Average wood fiber length in millimeters';
COMMENT ON COLUMN public.filaments.wood_scent_level IS 'Wood scent intensity (None, Light, Moderate, Strong)';
-- Add pack_quantity column to filaments table for multi-pack detection
ALTER TABLE public.filaments 
ADD COLUMN IF NOT EXISTS pack_quantity integer DEFAULT 1;

-- Add comment for clarity
COMMENT ON COLUMN public.filaments.pack_quantity IS 'Number of spools in a pack (1 for single, 2+ for multi-packs)';
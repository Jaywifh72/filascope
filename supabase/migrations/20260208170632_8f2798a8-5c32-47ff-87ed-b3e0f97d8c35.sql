-- Add preferred_region column to profiles for cross-device region sync
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_region TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.preferred_region IS 'User preferred region code (e.g., US, CA, EU) for cross-device sync';
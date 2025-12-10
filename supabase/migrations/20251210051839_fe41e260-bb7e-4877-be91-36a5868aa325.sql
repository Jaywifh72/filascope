-- Add preferred_currency column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN preferred_currency text DEFAULT NULL;

-- Allow users to update their own profile (already exists, but ensure currency is included)
COMMENT ON COLUMN public.profiles.preferred_currency IS 'User preferred currency code (USD, EUR, GBP, etc.)';
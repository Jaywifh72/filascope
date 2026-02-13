-- Drop the SECURITY DEFINER view and recreate without it
DROP VIEW IF EXISTS public.v_public_profiles;

CREATE VIEW public.v_public_profiles
WITH (security_barrier = true)
AS
SELECT
  id,
  display_name,
  avatar_url,
  bio,
  is_public,
  username_slug,
  social_links,
  wishlist_public,
  reviews_public,
  projects_public,
  purchases_public,
  printing_setup,
  skill_level,
  created_at
FROM public.profiles
WHERE is_public = true;

-- Grant read access on the view
GRANT SELECT ON public.v_public_profiles TO anon, authenticated;

-- Add RLS policy allowing anyone to read public profiles (row-level)
-- This lets the view work without SECURITY DEFINER
CREATE POLICY "Anyone can view public profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (is_public = true);
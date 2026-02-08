
-- URGENT: Remove the overly broad policy that exposes email via direct table access
DROP POLICY IF EXISTS "Anyone can read public profiles via view" ON public.profiles;

-- Recreate v_public_profiles as SECURITY DEFINER (intentional for column-level security)
-- This is the correct pattern: the view deliberately bypasses RLS to return ONLY safe columns
DROP VIEW IF EXISTS public.v_public_profiles;

CREATE VIEW public.v_public_profiles
WITH (security_barrier = true) AS
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

-- Ensure the view owner is the superuser (default), making it SECURITY DEFINER by default
-- security_barrier = true prevents optimization leaks
GRANT SELECT ON public.v_public_profiles TO anon, authenticated;

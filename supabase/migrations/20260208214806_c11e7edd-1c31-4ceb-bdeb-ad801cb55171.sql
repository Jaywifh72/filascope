
-- Step 1: Drop the overly permissive public profiles policy
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;

-- Step 2: Create a secure view that only exposes safe public fields
-- Using security_invoker = off (definer) is needed here because anonymous/other users
-- won't have row-level access to profiles. The view itself restricts to is_public = true
-- and only exposes non-sensitive columns.
CREATE OR REPLACE VIEW public.v_public_profiles
WITH (security_invoker = off)
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

-- Step 3: Grant access to the view for both anon and authenticated roles
GRANT SELECT ON public.v_public_profiles TO anon, authenticated;

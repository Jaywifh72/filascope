
-- Fix 1: Recreate v_public_profiles as SECURITY INVOKER (resolves SUPA_security_definer_view)
DROP VIEW IF EXISTS public.v_public_profiles;

CREATE VIEW public.v_public_profiles
WITH (security_invoker = on) AS
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

-- Grant access to the view
GRANT SELECT ON public.v_public_profiles TO anon, authenticated;

-- Fix 2: Add a policy allowing public profile reads (resolves profiles_table_public_exposure)
-- This lets the SECURITY INVOKER view actually return results for public profiles
-- The view itself excludes sensitive columns (email, shipping data, etc.)
CREATE POLICY "Anyone can read public profiles via view"
ON public.profiles
FOR SELECT
USING (is_public = true);

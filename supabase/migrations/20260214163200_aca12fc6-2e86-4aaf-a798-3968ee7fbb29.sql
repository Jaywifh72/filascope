-- Remove the overly permissive policy that exposes email on public profiles
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;

-- Recreate the view WITHOUT security_invoker so it bypasses RLS on the base table
-- This way the base profiles table stays locked down (self + admin only)
-- but public profile data (without email) is accessible through the view
DROP VIEW IF EXISTS public.v_public_profiles;

CREATE VIEW public.v_public_profiles
WITH (security_barrier=true) AS
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

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.v_public_profiles TO anon, authenticated;

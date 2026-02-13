-- Remove the overly permissive public policy that exposes all columns
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;

-- Revoke direct SELECT from anon on the profiles table
-- Authenticated users still get access via their own-profile and admin policies
REVOKE SELECT ON public.profiles FROM anon;

-- Grant anon SELECT only on the safe view
GRANT SELECT ON public.v_public_profiles TO anon, authenticated;

-- For authenticated users viewing OTHER public profiles (not their own, not admin),
-- add a restricted policy that only works via the view
-- They can still see their own profile via "Users can view own profile"
-- and admins via "Admins can view all profiles"
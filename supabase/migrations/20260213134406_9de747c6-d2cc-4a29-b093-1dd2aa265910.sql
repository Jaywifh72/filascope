
-- Fix 1: Recreate v_public_profiles as SECURITY INVOKER instead of SECURITY DEFINER
DROP VIEW IF EXISTS public.v_public_profiles;
CREATE VIEW public.v_public_profiles
WITH (security_barrier=true, security_invoker=true)
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
FROM profiles
WHERE is_public = true;

-- Fix 2: Replace overly broad admin profile SELECT policy with a scoped one
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix 3: Tighten user_activity SELECT policy - remove session_id based access for anonymous
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
CREATE POLICY "Users can view own activity"
ON public.user_activity
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Fix 4: Tighten user_activity INSERT policy - require auth for user_id rows
DROP POLICY IF EXISTS "Users can insert own activity" ON public.user_activity;
CREATE POLICY "Authenticated users can insert own activity"
ON public.user_activity
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous can insert anonymous activity"
ON public.user_activity
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

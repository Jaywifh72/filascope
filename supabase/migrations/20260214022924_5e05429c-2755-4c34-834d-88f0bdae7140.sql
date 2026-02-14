-- Phase 2A: Consolidate user_roles SELECT policies
-- Drop duplicate SELECT policies (keep only the clean ones)
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Recreate clean SELECT policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Phase 2B: Consolidate user_browse_history INSERT policies
-- Drop both overlapping INSERT policies
DROP POLICY IF EXISTS "Anyone can insert browse history" ON public.user_browse_history;
DROP POLICY IF EXISTS "Users can insert own browse history" ON public.user_browse_history;

-- Recreate single clean INSERT policy
CREATE POLICY "Anyone can insert browse history"
ON public.user_browse_history
FOR INSERT
TO public
WITH CHECK ((user_id = auth.uid()) OR (user_id IS NULL AND session_id IS NOT NULL));
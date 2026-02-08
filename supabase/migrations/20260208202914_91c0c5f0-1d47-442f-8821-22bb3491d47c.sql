
-- Drop the two overly permissive SELECT policies
DROP POLICY IF EXISTS "Users can read own browse history by session" ON public.user_browse_history;
DROP POLICY IF EXISTS "Users can view own browse history" ON public.user_browse_history;

-- Create a single, properly scoped SELECT policy:
-- Authenticated users can only read rows where user_id matches their auth.uid()
CREATE POLICY "Users can read own browse history"
ON public.user_browse_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

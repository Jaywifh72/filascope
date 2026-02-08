
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view own settings history" ON public.user_settings_history;

-- Create a strict SELECT policy matching auth.uid() = user_id only
CREATE POLICY "Users can view own settings history"
ON public.user_settings_history
FOR SELECT
USING (auth.uid() = user_id);

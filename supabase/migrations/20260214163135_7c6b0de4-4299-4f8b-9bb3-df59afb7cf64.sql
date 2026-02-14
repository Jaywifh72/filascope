-- Allow anyone to SELECT public profiles (view already restricts columns and filters is_public=true)
CREATE POLICY "Anyone can view public profiles"
ON public.profiles
FOR SELECT
USING (is_public = true);

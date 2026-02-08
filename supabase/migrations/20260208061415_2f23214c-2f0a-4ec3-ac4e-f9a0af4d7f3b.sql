
-- Add public profile columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS username_slug text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS wishlist_public boolean NOT NULL DEFAULT false;

-- Partial unique index on username_slug (allows multiple nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_slug 
  ON public.profiles (username_slug) 
  WHERE username_slug IS NOT NULL;

-- RLS: Anyone can view public profiles (SELECT only)
CREATE POLICY "Anyone can view public profiles"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- RLS: Anyone can view public wishlist items
CREATE POLICY "Anyone can view public wishlist"
  ON public.user_favorites
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_favorites.user_id
        AND p.is_public = true
        AND p.wishlist_public = true
    )
  );

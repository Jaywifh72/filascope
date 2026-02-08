
-- 1. Add is_public and slug columns to wishlist_collections
ALTER TABLE public.wishlist_collections
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on (user_id, slug) for public collection URLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_collections_user_slug 
  ON public.wishlist_collections (user_id, slug) WHERE slug IS NOT NULL;

-- 2. Drop unique constraint on user_favorites(user_id, filament_id) to allow multi-collection
ALTER TABLE public.user_favorites DROP CONSTRAINT IF EXISTS user_favorites_user_id_filament_id_key;

-- Add unique constraint on (user_id, filament_id, collection_id) instead
-- Use COALESCE to handle null collection_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_favorites_user_filament_collection
  ON public.user_favorites (user_id, filament_id, COALESCE(collection_id, '00000000-0000-0000-0000-000000000000'));

-- 3. Function to create default collections for a user
CREATE OR REPLACE FUNCTION public.create_default_collections(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wishlist_collections (user_id, name, icon, color, sort_order, is_default, slug)
  VALUES
    (p_user_id, 'Want to Try', 'star', '#ffd93d', 0, true, 'want-to-try'),
    (p_user_id, 'My Inventory', 'wrench', '#6bcb77', 1, true, 'my-inventory')
  ON CONFLICT DO NOTHING;
END;
$$;

-- 4. Trigger to auto-create default collections on new profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_collections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_default_collections(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_collections ON public.profiles;
CREATE TRIGGER on_profile_created_collections
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_collections();

-- 5. Create default collections for existing users who don't have them
INSERT INTO public.wishlist_collections (user_id, name, icon, color, sort_order, is_default, slug)
SELECT p.id, 'Want to Try', 'star', '#ffd93d', 0, true, 'want-to-try'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.wishlist_collections wc 
  WHERE wc.user_id = p.id AND wc.name = 'Want to Try'
);

INSERT INTO public.wishlist_collections (user_id, name, icon, color, sort_order, is_default, slug)
SELECT p.id, 'My Inventory', 'wrench', '#6bcb77', 1, true, 'my-inventory'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.wishlist_collections wc 
  WHERE wc.user_id = p.id AND wc.name = 'My Inventory'
);

-- 6. RLS policy for public collection viewing
CREATE POLICY "Anyone can view public collections"
  ON public.wishlist_collections
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Drop existing select policy if it's too restrictive
DROP POLICY IF EXISTS "Users can view own collections" ON public.wishlist_collections;

-- Policy for public wishlist items in public collections
CREATE POLICY "Anyone can view items in public collections"
  ON public.user_favorites
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR collection_id IN (
      SELECT id FROM public.wishlist_collections WHERE is_public = true
    )
  );

-- Drop existing select policy if too restrictive
DROP POLICY IF EXISTS "Users can view own favorites" ON public.user_favorites;

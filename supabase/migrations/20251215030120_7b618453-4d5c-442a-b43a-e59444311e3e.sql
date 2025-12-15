-- Wishlist collections/folders
CREATE TABLE public.wishlist_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#00d9ff',
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wishlist_collections ENABLE ROW LEVEL SECURITY;

-- RLS policies for collections
CREATE POLICY "Users can view own collections" ON public.wishlist_collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own collections" ON public.wishlist_collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON public.wishlist_collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON public.wishlist_collections
  FOR DELETE USING (auth.uid() = user_id);

-- Add new columns to user_favorites
ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES public.wishlist_collections(id) ON DELETE SET NULL;
ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.user_favorites ADD COLUMN IF NOT EXISTS price_when_added NUMERIC;

-- Shared wishlists table
CREATE TABLE public.shared_wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  collection_id UUID REFERENCES public.wishlist_collections(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE NOT NULL,
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.shared_wishlists ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared wishlists
CREATE POLICY "Users can view own shared wishlists" ON public.shared_wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active shared wishlists by code" ON public.shared_wishlists
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create shared wishlists" ON public.shared_wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shared wishlists" ON public.shared_wishlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared wishlists" ON public.shared_wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- Add email notification preferences to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wishlist_email_digest BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wishlist_price_alerts BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wishlist_restock_alerts BOOLEAN DEFAULT true;

-- Create trigger for updated_at on wishlist_collections
CREATE TRIGGER update_wishlist_collections_updated_at
  BEFORE UPDATE ON public.wishlist_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
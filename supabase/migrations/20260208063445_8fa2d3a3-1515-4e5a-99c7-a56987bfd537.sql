
-- Create storage bucket for community photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-photos', 'community-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for community photos bucket
CREATE POLICY "Community photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-photos');

CREATE POLICY "Authenticated users can upload community photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'community-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own community photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own community photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'community-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create community_photos table
CREATE TABLE public.community_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'filament',
  caption TEXT,
  printer_id UUID REFERENCES public.printers(id),
  nozzle_temp INTEGER,
  bed_temp INTEGER,
  layer_height NUMERIC,
  infill_pct INTEGER,
  model_source TEXT,
  like_count INTEGER NOT NULL DEFAULT 0,
  is_reported BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_photo_files table
CREATE TABLE public.community_photo_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.community_photos(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_photo_likes table
CREATE TABLE public.community_photo_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.community_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Indexes
CREATE INDEX idx_community_photos_product ON public.community_photos(product_id, product_type);
CREATE INDEX idx_community_photos_user ON public.community_photos(user_id);
CREATE INDEX idx_community_photo_files_photo ON public.community_photo_files(photo_id);
CREATE INDEX idx_community_photo_likes_photo ON public.community_photo_likes(photo_id);
CREATE INDEX idx_community_photo_likes_user ON public.community_photo_likes(user_id);

-- Enable RLS
ALTER TABLE public.community_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_photo_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_photo_likes ENABLE ROW LEVEL SECURITY;

-- RLS: community_photos
CREATE POLICY "Anyone can view community photos"
ON public.community_photos FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create community photos"
ON public.community_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own community photos"
ON public.community_photos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own community photos"
ON public.community_photos FOR DELETE
USING (auth.uid() = user_id);

-- RLS: community_photo_files
CREATE POLICY "Anyone can view community photo files"
ON public.community_photo_files FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create photo files"
ON public.community_photo_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_photos
    WHERE id = photo_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own photo files"
ON public.community_photo_files FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.community_photos
    WHERE id = photo_id AND user_id = auth.uid()
  )
);

-- RLS: community_photo_likes
CREATE POLICY "Anyone can view photo likes"
ON public.community_photo_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like photos"
ON public.community_photo_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike photos"
ON public.community_photo_likes FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update like_count on community_photos
CREATE OR REPLACE FUNCTION public.update_community_photo_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_photos SET like_count = like_count + 1 WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_photos SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_community_photo_like_count
AFTER INSERT OR DELETE ON public.community_photo_likes
FOR EACH ROW EXECUTE FUNCTION public.update_community_photo_like_count();

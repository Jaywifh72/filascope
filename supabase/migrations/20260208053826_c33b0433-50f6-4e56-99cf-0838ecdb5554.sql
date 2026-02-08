
-- =============================================
-- Product Reviews System (avoiding conflict with existing review_helpful_votes)
-- =============================================

-- Main reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'filament' CHECK (product_type IN ('filament', 'printer')),
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  ease_rating INTEGER CHECK (ease_rating >= 1 AND ease_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  headline TEXT NOT NULL CHECK (char_length(headline) <= 100),
  body TEXT NOT NULL CHECK (char_length(body) >= 50 AND char_length(body) <= 2000),
  printer_used_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
  nozzle_temp INTEGER,
  bed_temp INTEGER,
  print_speed INTEGER,
  layer_height NUMERIC(4,2),
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'flagged', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, product_type)
);

-- Review photos
CREATE TABLE public.review_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Helpful votes for product reviews
CREATE TABLE public.product_review_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Indexes
CREATE INDEX idx_product_reviews_product ON public.product_reviews(product_id, product_type);
CREATE INDEX idx_product_reviews_user ON public.product_reviews(user_id);
CREATE INDEX idx_product_reviews_public ON public.product_reviews(product_id, product_type, is_public, status);
CREATE INDEX idx_review_photos_review ON public.review_photos(review_id);
CREATE INDEX idx_product_review_votes_review ON public.product_review_votes(review_id);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_review_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_reviews
CREATE POLICY "Anyone can read public published reviews"
  ON public.product_reviews FOR SELECT
  USING (is_public = true AND status = 'published');

CREATE POLICY "Users can read their own reviews"
  ON public.product_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.product_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for review_photos
CREATE POLICY "Anyone can view photos of public reviews"
  ON public.review_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.product_reviews r
    WHERE r.id = review_id
    AND (r.is_public = true AND r.status = 'published' OR r.user_id = auth.uid())
  ));

CREATE POLICY "Users can add photos to their own reviews"
  ON public.review_photos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.product_reviews r
    WHERE r.id = review_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete photos from their own reviews"
  ON public.review_photos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.product_reviews r
    WHERE r.id = review_id AND r.user_id = auth.uid()
  ));

-- RLS Policies for product_review_votes
CREATE POLICY "Anyone can read vote counts"
  ON public.product_review_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can add votes"
  ON public.product_review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own votes"
  ON public.product_review_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for review photos
INSERT INTO storage.buckets (id, name, public) VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review photos
CREATE POLICY "Review photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-photos');

CREATE POLICY "Authenticated users can upload review photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'review-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own review photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'review-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

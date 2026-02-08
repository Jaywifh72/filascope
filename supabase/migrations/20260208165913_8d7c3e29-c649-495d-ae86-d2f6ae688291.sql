
-- Create review_flags table for review moderation
CREATE TABLE public.review_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate reports from same user
ALTER TABLE public.review_flags
  ADD CONSTRAINT review_flags_unique_per_user UNIQUE (review_id, reporter_id);

-- Index for efficient lookups
CREATE INDEX idx_review_flags_review_id ON public.review_flags(review_id);
CREATE INDEX idx_review_flags_status ON public.review_flags(status);

-- Enable RLS
ALTER TABLE public.review_flags ENABLE ROW LEVEL SECURITY;

-- Users can see their own flags
CREATE POLICY "Users can view their own flags"
  ON public.review_flags
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins can view all flags
CREATE POLICY "Admins can view all flags"
  ON public.review_flags
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can insert their own flags
CREATE POLICY "Users can flag reviews"
  ON public.review_flags
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Admins can update flag status
CREATE POLICY "Admins can update flags"
  ON public.review_flags
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger: auto-flag reviews with 3+ pending flags
CREATE OR REPLACE FUNCTION public.auto_flag_reviewed_reviews()
RETURNS TRIGGER AS $$
DECLARE
  flag_count INT;
BEGIN
  SELECT COUNT(*) INTO flag_count
  FROM public.review_flags
  WHERE review_id = NEW.review_id AND status = 'pending';

  IF flag_count >= 3 THEN
    UPDATE public.product_reviews
    SET status = 'flagged'
    WHERE id = NEW.review_id AND status = 'published';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_auto_flag_review
  AFTER INSERT ON public.review_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_flag_reviewed_reviews();

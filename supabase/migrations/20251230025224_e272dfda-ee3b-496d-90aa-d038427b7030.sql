-- Create TDS Review Queue table for flagging items needing manual review
CREATE TABLE public.tds_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id UUID REFERENCES public.filaments(id) ON DELETE CASCADE,
  tds_url TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('td_missing', 'low_confidence', 'parse_failed', 'manual_flag')),
  extraction_attempt JSONB,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_tds_review_queue_status ON public.tds_review_queue(status);
CREATE INDEX idx_tds_review_queue_reason ON public.tds_review_queue(reason);
CREATE INDEX idx_tds_review_queue_filament ON public.tds_review_queue(filament_id);

-- Enable RLS
ALTER TABLE public.tds_review_queue ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admins can read review queue"
  ON public.tds_review_queue FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage review queue"
  ON public.tds_review_queue FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_tds_review_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_tds_review_queue_timestamp
  BEFORE UPDATE ON public.tds_review_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tds_review_timestamp();
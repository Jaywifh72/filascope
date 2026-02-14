
-- Create price_discrepancies table
CREATE TABLE public.price_discrepancies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filament_id UUID NOT NULL REFERENCES public.filaments(id) ON DELETE CASCADE,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  price_change_percent NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  region TEXT NOT NULL DEFAULT 'US',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'auto_approved', 'manual_review', 'approved', 'rejected', 'broken_link')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  source_url TEXT,
  auto_expire_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days')
);

-- Indexes for common queries
CREATE INDEX idx_price_discrepancies_status ON public.price_discrepancies(status);
CREATE INDEX idx_price_discrepancies_filament ON public.price_discrepancies(filament_id);
CREATE INDEX idx_price_discrepancies_detected ON public.price_discrepancies(detected_at DESC);
CREATE INDEX idx_price_discrepancies_pending ON public.price_discrepancies(status, detected_at DESC) WHERE status IN ('pending', 'manual_review');

-- Enable RLS
ALTER TABLE public.price_discrepancies ENABLE ROW LEVEL SECURITY;

-- Admin read
CREATE POLICY "Admins can read discrepancies"
  ON public.price_discrepancies FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin insert
CREATE POLICY "Admins can insert discrepancies"
  ON public.price_discrepancies FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin update (approve/reject)
CREATE POLICY "Admins can update discrepancies"
  ON public.price_discrepancies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anon insert for edge functions (cron/automated)
CREATE POLICY "Anon can insert discrepancies"
  ON public.price_discrepancies FOR INSERT TO anon
  WITH CHECK (true);

-- Anon select for edge functions
CREATE POLICY "Anon can read discrepancies"
  ON public.price_discrepancies FOR SELECT TO anon
  USING (true);

-- Anon update for auto-expire
CREATE POLICY "Anon can update discrepancies"
  ON public.price_discrepancies FOR UPDATE TO anon
  USING (true);

-- Function to auto-expire old pending reviews
CREATE OR REPLACE FUNCTION public.auto_expire_discrepancies()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Auto-approve pending reviews older than 14 days if change < 15%
  UPDATE price_discrepancies
  SET status = 'auto_approved',
      reviewed_at = NOW(),
      notes = COALESCE(notes, '') || ' [Auto-expired after 14 days]'
  WHERE status IN ('pending', 'manual_review')
    AND auto_expire_at <= NOW()
    AND ABS(price_change_percent) < 15;
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$;

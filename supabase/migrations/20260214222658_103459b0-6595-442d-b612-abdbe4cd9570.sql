
-- Create user_price_reports table for community price corrections
CREATE TABLE public.user_price_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filament_id UUID NOT NULL,
  reported_price NUMERIC NOT NULL,
  source_description TEXT,
  reporter_email TEXT,
  current_db_price NUMERIC,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_price_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a report (no auth required for community reports)
CREATE POLICY "Anyone can submit price reports"
  ON public.user_price_reports
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view/update reports
CREATE POLICY "Admins can view all price reports"
  ON public.user_price_reports
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update price reports"
  ON public.user_price_reports
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for admin review queue
CREATE INDEX idx_user_price_reports_status ON public.user_price_reports(status);
CREATE INDEX idx_user_price_reports_filament ON public.user_price_reports(filament_id);

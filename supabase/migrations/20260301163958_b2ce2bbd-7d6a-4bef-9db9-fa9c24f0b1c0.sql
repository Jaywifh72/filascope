
-- User-submitted TD measurements
CREATE TABLE public.td_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filament_id UUID NOT NULL REFERENCES public.filaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_td_value NUMERIC(5,2) NOT NULL CHECK (submitted_td_value >= 0 AND submitted_td_value <= 20),
  measurement_method TEXT NOT NULL CHECK (measurement_method IN ('hueforge_calibration', 'light_meter', 'visual_estimate', 'manufacturer_spec', 'other')),
  layer_height_mm NUMERIC(4,2),
  nozzle_temp_c INTEGER,
  printer_model TEXT,
  notes TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(filament_id, user_id)
);

-- Verification votes on existing TD values
CREATE TABLE public.td_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filament_id UUID NOT NULL REFERENCES public.filaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('accurate', 'too_high', 'too_low')),
  user_measured_td NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(filament_id, user_id)
);

-- Aggregated community stats view
CREATE OR REPLACE VIEW public.td_community_stats AS
SELECT 
  f.id as filament_id,
  f.transmission_distance as official_td,
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'approved') as submission_count,
  AVG(ts.submitted_td_value) FILTER (WHERE ts.status = 'approved') as community_avg_td,
  STDDEV(ts.submitted_td_value) FILTER (WHERE ts.status = 'approved') as community_td_stddev,
  COUNT(DISTINCT tv.id) as verification_count,
  COUNT(DISTINCT tv.id) FILTER (WHERE tv.vote = 'accurate') as accurate_votes,
  COUNT(DISTINCT tv.id) FILTER (WHERE tv.vote = 'too_high') as too_high_votes,
  COUNT(DISTINCT tv.id) FILTER (WHERE tv.vote = 'too_low') as too_low_votes
FROM public.filaments f
LEFT JOIN public.td_submissions ts ON f.id = ts.filament_id
LEFT JOIN public.td_verifications tv ON f.id = tv.filament_id
GROUP BY f.id, f.transmission_distance;

-- RLS for td_submissions
ALTER TABLE public.td_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved submissions" ON public.td_submissions
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can read own submissions" ON public.td_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit TD values" ON public.td_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending submissions" ON public.td_submissions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all submissions" ON public.td_submissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for td_verifications
ALTER TABLE public.td_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read verifications" ON public.td_verifications
  FOR SELECT USING (true);

CREATE POLICY "Users can submit verifications" ON public.td_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket for calibration photos
INSERT INTO storage.buckets (id, name, public) VALUES ('td-calibration-photos', 'td-calibration-photos', true);

-- Storage RLS: authenticated users can upload to their own path
CREATE POLICY "Users can upload calibration photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'td-calibration-photos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Public can read calibration photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'td-calibration-photos');

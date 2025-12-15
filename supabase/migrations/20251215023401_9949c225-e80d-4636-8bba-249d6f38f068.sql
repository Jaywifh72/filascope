-- Create filament_score_history table for tracking score changes over time
CREATE TABLE public.filament_score_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filament_id UUID REFERENCES public.filaments(id) ON DELETE CASCADE NOT NULL,
  score_type TEXT NOT NULL CHECK (score_type IN ('ease_of_printing', 'strength_index', 'value_score')),
  score NUMERIC NOT NULL,
  change_reason TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_filament_score_history_filament_id ON public.filament_score_history(filament_id);
CREATE INDEX idx_filament_score_history_recorded_at ON public.filament_score_history(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.filament_score_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Score history publicly readable" ON public.filament_score_history
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage score history" ON public.filament_score_history
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create filament_user_ratings table for community scores
CREATE TABLE public.filament_user_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filament_id UUID REFERENCES public.filaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  score_type TEXT NOT NULL CHECK (score_type IN ('ease_of_printing', 'strength_index', 'value_score')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  issues TEXT[],
  printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(filament_id, user_id, score_type)
);

-- Create indexes
CREATE INDEX idx_filament_user_ratings_filament_id ON public.filament_user_ratings(filament_id);
CREATE INDEX idx_filament_user_ratings_user_id ON public.filament_user_ratings(user_id);

-- Enable RLS
ALTER TABLE public.filament_user_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "User ratings publicly readable" ON public.filament_user_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own ratings" ON public.filament_user_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.filament_user_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON public.filament_user_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_filament_user_ratings_updated_at
  BEFORE UPDATE ON public.filament_user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
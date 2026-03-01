CREATE TABLE public.user_hueforge_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Plan',
  project_type TEXT NOT NULL,
  filament_ids UUID[] NOT NULL,
  layer_counts INTEGER[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_hueforge_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plans" ON public.user_hueforge_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
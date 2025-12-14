
-- User activity tracking table
CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  activity_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_session_id ON public.user_activity(session_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- User browse history table
CREATE TABLE public.user_browse_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  filament_id UUID REFERENCES public.filaments(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_browse_history_user ON public.user_browse_history(user_id, viewed_at DESC);
CREATE INDEX idx_browse_history_session ON public.user_browse_history(session_id, viewed_at DESC);

-- User sidebar preferences table
CREATE TABLE public.user_sidebar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_order JSONB DEFAULT '["safety", "watchlist", "trending", "deals", "recent"]',
  hidden_modules TEXT[] DEFAULT '{}',
  module_engagement JSONB DEFAULT '{}',
  price_sensitivity TEXT DEFAULT 'moderate',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- User material interests table
CREATE TABLE public.user_material_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  material TEXT NOT NULL,
  interest_score INTEGER DEFAULT 1,
  last_interaction TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, material)
);

CREATE INDEX idx_material_interests_user ON public.user_material_interests(user_id, interest_score DESC);

-- Enable RLS on all tables
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_browse_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sidebar_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_material_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity
CREATE POLICY "Users can insert own activity"
ON public.user_activity FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own activity"
ON public.user_activity FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

-- RLS Policies for user_browse_history
CREATE POLICY "Users can insert own browse history"
ON public.user_browse_history FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own browse history"
ON public.user_browse_history FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

CREATE POLICY "Users can delete own browse history"
ON public.user_browse_history FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for user_sidebar_preferences
CREATE POLICY "Users can manage own sidebar preferences"
ON public.user_sidebar_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_material_interests
CREATE POLICY "Users can insert own interests"
ON public.user_material_interests FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own interests"
ON public.user_material_interests FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

CREATE POLICY "Users can update own interests"
ON public.user_material_interests FOR UPDATE
USING (auth.uid() = user_id);

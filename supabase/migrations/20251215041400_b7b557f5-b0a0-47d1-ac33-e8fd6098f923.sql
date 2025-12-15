-- Settings history table for tracking user's past settings
CREATE TABLE public.user_settings_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  filament_id UUID NOT NULL,
  printer_id TEXT,
  settings JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view own settings history"
ON public.user_settings_history
FOR SELECT
USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Users can insert their own history
CREATE POLICY "Users can insert own settings history"
ON public.user_settings_history
FOR INSERT
WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND session_id IS NOT NULL));

-- Users can delete their own history
CREATE POLICY "Users can delete own settings history"
ON public.user_settings_history
FOR DELETE
USING (auth.uid() = user_id);

-- Shared settings for persistent shareable links
CREATE TABLE public.shared_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  short_code TEXT UNIQUE NOT NULL,
  filament_id UUID,
  printer_id TEXT,
  settings JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared settings (they're meant to be shared)
CREATE POLICY "Anyone can view shared settings"
ON public.shared_settings
FOR SELECT
USING (expires_at IS NULL OR expires_at > now());

-- Users can create shared settings
CREATE POLICY "Users can create shared settings"
ON public.shared_settings
FOR INSERT
WITH CHECK (true);

-- Users can update view count
CREATE POLICY "Anyone can update view count"
ON public.shared_settings
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_settings_history_user ON public.user_settings_history(user_id);
CREATE INDEX idx_settings_history_filament ON public.user_settings_history(filament_id);
CREATE INDEX idx_shared_settings_code ON public.shared_settings(short_code);
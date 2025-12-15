-- Add skill tracking columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skill_level TEXT DEFAULT 'beginner';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completed_tutorials JSONB DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings_visibility TEXT DEFAULT 'beginner';

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  progress JSONB,
  UNIQUE(user_id, achievement_id)
);

-- Create user printing stats table
CREATE TABLE public.user_printing_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  materials_explored INTEGER DEFAULT 0,
  settings_exported INTEGER DEFAULT 0,
  tutorials_watched INTEGER DEFAULT 0,
  comparisons_made INTEGER DEFAULT 0,
  printers_configured INTEGER DEFAULT 0,
  glossary_lookups INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_printing_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_printing_stats
CREATE POLICY "Users can view their own stats" ON public.user_printing_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.user_printing_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.user_printing_stats
  FOR UPDATE USING (auth.uid() = user_id);
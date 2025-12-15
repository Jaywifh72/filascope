-- Add preferred_slicer to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_slicer TEXT;

-- User saved slicer profiles for cloud sync
CREATE TABLE IF NOT EXISTS user_slicer_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filament_id UUID REFERENCES filaments(id) ON DELETE CASCADE NOT NULL,
  slicer_type TEXT NOT NULL,
  profile_name TEXT NOT NULL,
  profile_data JSONB NOT NULL,
  is_custom BOOLEAN DEFAULT false,
  custom_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, filament_id, slicer_type)
);

-- Enable RLS
ALTER TABLE user_slicer_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own slicer profiles"
  ON user_slicer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own slicer profiles"
  ON user_slicer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own slicer profiles"
  ON user_slicer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own slicer profiles"
  ON user_slicer_profiles FOR DELETE
  USING (auth.uid() = user_id);
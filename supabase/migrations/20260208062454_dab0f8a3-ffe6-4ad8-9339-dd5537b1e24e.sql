-- Add printing_setup, preferences, notification_settings columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS printing_setup jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notification_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reviews_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS projects_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS purchases_public boolean NOT NULL DEFAULT false;

-- Update existing RLS policy for own-profile updates to include new columns
-- (existing policies already allow users to update their own profiles)
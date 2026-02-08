
-- Make user_id nullable for guest alerts
ALTER TABLE public.price_alerts ALTER COLUMN user_id DROP NOT NULL;

-- Add columns for guest and regional support
ALTER TABLE public.price_alerts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.price_alerts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.price_alerts ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'US';

-- Ensure either user_id or email is provided
ALTER TABLE public.price_alerts ADD CONSTRAINT price_alerts_user_or_email 
  CHECK (user_id IS NOT NULL OR email IS NOT NULL);

-- Drop existing unique constraint on (user_id, filament_id) since user_id is now nullable
ALTER TABLE public.price_alerts DROP CONSTRAINT IF EXISTS price_alerts_user_id_filament_id_key;

-- Create partial unique indexes for logged-in users and guests
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_alerts_user_filament 
  ON public.price_alerts (user_id, filament_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_price_alerts_email_filament 
  ON public.price_alerts (email, filament_id) WHERE email IS NOT NULL;

-- RLS policy for anonymous inserts (guest email alerts)
CREATE POLICY "Anyone can create email-based price alerts" 
  ON public.price_alerts FOR INSERT 
  WITH CHECK (user_id IS NULL AND email IS NOT NULL);

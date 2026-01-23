-- Create price_alerts table for email notifications
CREATE TABLE public.price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filament_id UUID NOT NULL REFERENCES public.filaments(id) ON DELETE CASCADE,
  target_price NUMERIC NOT NULL,
  current_price_when_set NUMERIC,
  email_notifications BOOLEAN DEFAULT true,
  triggered_at TIMESTAMP WITH TIME ZONE,
  triggered_price NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, filament_id)
);

-- Enable RLS
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own price alerts"
  ON public.price_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own price alerts"
  ON public.price_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price alerts"
  ON public.price_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price alerts"
  ON public.price_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Create user_printer_preferences table for saved printer profiles
CREATE TABLE public.user_printer_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
  printer_name TEXT,
  auto_filter BOOLEAN DEFAULT true,
  nozzle_temp_max INTEGER,
  bed_temp_max INTEGER,
  has_enclosure BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_printer_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own printer preferences"
  ON public.user_printer_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own printer preferences"
  ON public.user_printer_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own printer preferences"
  ON public.user_printer_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own printer preferences"
  ON public.user_printer_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Add price_when_added tracking to user_favorites if not exists
ALTER TABLE public.user_favorites 
  ADD COLUMN IF NOT EXISTS price_when_added NUMERIC,
  ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient price alert queries
CREATE INDEX idx_price_alerts_active ON public.price_alerts(filament_id, is_active) WHERE is_active = true;
CREATE INDEX idx_price_alerts_user ON public.price_alerts(user_id) WHERE is_active = true;

-- Create index for printer preferences
CREATE INDEX idx_user_printer_preferences_user ON public.user_printer_preferences(user_id);
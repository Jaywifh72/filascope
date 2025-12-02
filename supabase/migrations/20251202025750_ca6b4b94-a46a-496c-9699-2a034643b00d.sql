-- Create accessory_price_history table to track price changes over time
CREATE TABLE public.accessory_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accessory_id UUID REFERENCES public.printer_accessories(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT DEFAULT 'scraper'
);

-- Enable RLS
ALTER TABLE public.accessory_price_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Price history publicly readable"
  ON public.accessory_price_history
  FOR SELECT
  USING (true);

CREATE POLICY "Service can insert price history"
  ON public.accessory_price_history
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_accessory_price_history_accessory_id ON public.accessory_price_history(accessory_id);
CREATE INDEX idx_accessory_price_history_recorded_at ON public.accessory_price_history(recorded_at DESC);

-- Add last_price_check column to printer_accessories
ALTER TABLE public.printer_accessories 
ADD COLUMN last_price_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN price_change_percent NUMERIC;
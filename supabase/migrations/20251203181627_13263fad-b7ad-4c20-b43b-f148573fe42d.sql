-- Create printer price history table
CREATE TABLE public.printer_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  printer_id UUID REFERENCES public.printers(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  price_type TEXT NOT NULL DEFAULT 'store', -- 'store', 'amazon', 'msrp'
  currency TEXT NOT NULL DEFAULT 'USD',
  source TEXT DEFAULT 'scraper',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.printer_price_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Price history publicly readable"
ON public.printer_price_history
FOR SELECT
USING (true);

CREATE POLICY "Service can insert price history"
ON public.printer_price_history
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_printer_price_history_printer_id ON public.printer_price_history(printer_id);
CREATE INDEX idx_printer_price_history_recorded_at ON public.printer_price_history(recorded_at DESC);
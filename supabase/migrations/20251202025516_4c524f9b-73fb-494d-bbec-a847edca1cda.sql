-- Create printer_accessories table for nozzles, build plates, and AMS/MMU systems
CREATE TABLE public.printer_accessories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  printer_id UUID REFERENCES public.printers(id) ON DELETE CASCADE,
  accessory_type TEXT NOT NULL CHECK (accessory_type IN ('nozzle', 'build_plate', 'ams_mmu')),
  name TEXT NOT NULL,
  specs JSONB,
  price NUMERIC,
  currency TEXT DEFAULT 'USD',
  product_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.printer_accessories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Accessories publicly readable"
  ON public.printer_accessories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins manage accessories"
  ON public.printer_accessories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_printer_accessories_updated_at
  BEFORE UPDATE ON public.printer_accessories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_printer_accessories_printer_id ON public.printer_accessories(printer_id);
CREATE INDEX idx_printer_accessories_type ON public.printer_accessories(accessory_type);
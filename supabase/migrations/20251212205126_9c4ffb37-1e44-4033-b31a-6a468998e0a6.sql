-- Create printer_software table to track slicer and app versions
CREATE TABLE public.printer_software (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  printer_id UUID REFERENCES public.printers(id) ON DELETE CASCADE,
  software_name TEXT NOT NULL,
  software_type TEXT NOT NULL, -- 'slicer', 'app', 'plugin', 'studio'
  version TEXT NOT NULL,
  release_date DATE,
  release_notes TEXT,
  changelog TEXT,
  download_url TEXT,
  is_latest BOOLEAN DEFAULT false,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.printer_software ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Software publicly readable" 
ON public.printer_software 
FOR SELECT 
USING (true);

CREATE POLICY "Admins manage software" 
ON public.printer_software 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_printer_software_printer_id ON public.printer_software(printer_id);
CREATE INDEX idx_printer_software_type ON public.printer_software(software_type);
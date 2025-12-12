-- Create printer_firmware table to store all firmware releases
CREATE TABLE public.printer_firmware (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  printer_id UUID REFERENCES public.printers(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  release_date DATE,
  release_notes TEXT,
  changelog TEXT,
  download_url TEXT,
  file_size_mb NUMERIC,
  known_issues TEXT,
  is_latest BOOLEAN DEFAULT false,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(printer_id, version)
);

-- Enable RLS
ALTER TABLE public.printer_firmware ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Firmware publicly readable"
ON public.printer_firmware
FOR SELECT
USING (true);

-- Admin management
CREATE POLICY "Admins manage firmware"
ON public.printer_firmware
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_printer_firmware_printer_id ON public.printer_firmware(printer_id);
CREATE INDEX idx_printer_firmware_release_date ON public.printer_firmware(release_date DESC);

-- Add firmware_url column to printers table for the official firmware page
ALTER TABLE public.printers ADD COLUMN IF NOT EXISTS firmware_url TEXT;

-- Create trigger for updated_at
CREATE TRIGGER update_printer_firmware_updated_at
BEFORE UPDATE ON public.printer_firmware
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
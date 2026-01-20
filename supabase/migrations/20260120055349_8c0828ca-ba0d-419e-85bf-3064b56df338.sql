-- Create printer inventory table for real stock tracking
CREATE TABLE public.printer_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  printer_id UUID NOT NULL REFERENCES public.printers(id) ON DELETE CASCADE,
  retailer_id UUID NOT NULL REFERENCES public.retailers(id) ON DELETE CASCADE,
  stock_status TEXT NOT NULL DEFAULT 'unknown' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'preorder', 'unknown')),
  stock_quantity INTEGER,
  price NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  product_url TEXT,
  estimated_ship_days INTEGER,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(printer_id, retailer_id)
);

-- Enable RLS
ALTER TABLE public.printer_inventory ENABLE ROW LEVEL SECURITY;

-- Public read access for inventory data
CREATE POLICY "Printer inventory is publicly readable"
  ON public.printer_inventory
  FOR SELECT
  USING (true);

-- Admin write access
CREATE POLICY "Admins can manage printer inventory"
  ON public.printer_inventory
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_printer_inventory_printer_id ON public.printer_inventory(printer_id);
CREATE INDEX idx_printer_inventory_stock_status ON public.printer_inventory(stock_status);

-- Add trigger for updated_at
CREATE TRIGGER update_printer_inventory_updated_at
  BEFORE UPDATE ON public.printer_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.printer_inventory IS 'Real-time inventory tracking for printers across multiple retailers';
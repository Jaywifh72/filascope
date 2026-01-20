-- Create printer analytics table for tracking real activity
CREATE TABLE public.printer_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  printer_id UUID NOT NULL REFERENCES public.printers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'comparison', 'click_buy', 'add_favorite')),
  session_id TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.printer_analytics ENABLE ROW LEVEL SECURITY;

-- Public insert access (anyone can log analytics)
CREATE POLICY "Anyone can log printer analytics"
  ON public.printer_analytics
  FOR INSERT
  WITH CHECK (true);

-- Public read for aggregated data (will use functions)
CREATE POLICY "Analytics readable for aggregation"
  ON public.printer_analytics
  FOR SELECT
  USING (true);

-- Create indexes for fast aggregation
CREATE INDEX idx_printer_analytics_printer_id ON public.printer_analytics(printer_id);
CREATE INDEX idx_printer_analytics_event_type ON public.printer_analytics(event_type);
CREATE INDEX idx_printer_analytics_created_at ON public.printer_analytics(created_at);

-- Create function to get printer activity stats
CREATE OR REPLACE FUNCTION public.get_printer_activity_stats(p_printer_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'views_24h', (
      SELECT COUNT(*) FROM printer_analytics 
      WHERE printer_id = p_printer_id 
      AND event_type = 'view' 
      AND created_at > NOW() - INTERVAL '24 hours'
    ),
    'views_7d', (
      SELECT COUNT(*) FROM printer_analytics 
      WHERE printer_id = p_printer_id 
      AND event_type = 'view' 
      AND created_at > NOW() - INTERVAL '7 days'
    ),
    'comparisons_7d', (
      SELECT COUNT(*) FROM printer_analytics 
      WHERE printer_id = p_printer_id 
      AND event_type = 'comparison' 
      AND created_at > NOW() - INTERVAL '7 days'
    ),
    'buy_clicks_7d', (
      SELECT COUNT(*) FROM printer_analytics 
      WHERE printer_id = p_printer_id 
      AND event_type = 'click_buy' 
      AND created_at > NOW() - INTERVAL '7 days'
    ),
    'total_views', (
      SELECT COUNT(*) FROM printer_analytics 
      WHERE printer_id = p_printer_id 
      AND event_type = 'view'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Add trust signal columns to printer_brands (brand-level policies)
ALTER TABLE public.printer_brands 
ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS return_policy_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS warranty_years INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS has_expert_support BOOLEAN DEFAULT true;

COMMENT ON TABLE public.printer_analytics IS 'Tracks real user activity on printer pages for social proof metrics';
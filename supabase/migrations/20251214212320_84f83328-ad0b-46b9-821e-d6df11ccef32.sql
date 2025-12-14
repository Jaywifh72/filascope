-- Safety Alerts table for urgent notifications
CREATE TABLE public.safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  material TEXT NOT NULL,
  batch_info TEXT,
  headline TEXT NOT NULL,
  reason TEXT NOT NULL,
  affected_timeframe TEXT,
  priority TEXT DEFAULT 'warning' CHECK (priority IN ('critical', 'warning', 'info')),
  details_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  filament_id UUID REFERENCES public.filaments(id) ON DELETE SET NULL
);

-- Trending materials table (curated)
CREATE TABLE public.trending_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  material_filter TEXT,
  search_increase_percent INTEGER,
  context TEXT,
  article_url TEXT,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  week_of DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Quick tips table
CREATE TABLE public.quick_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_text TEXT NOT NULL,
  detail_text TEXT,
  related_material TEXT,
  article_url TEXT,
  material_filter TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_tips ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Safety alerts publicly readable" ON public.safety_alerts FOR SELECT USING (true);
CREATE POLICY "Trending materials publicly readable" ON public.trending_materials FOR SELECT USING (true);
CREATE POLICY "Quick tips publicly readable" ON public.quick_tips FOR SELECT USING (true);

-- Admin manage policies
CREATE POLICY "Admins manage safety alerts" ON public.safety_alerts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage trending materials" ON public.trending_materials FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage quick tips" ON public.quick_tips FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed some initial trending data
INSERT INTO public.trending_materials (title, description, material_filter, search_increase_percent, context, position, is_active) VALUES
('ASA-CF for outdoor prints', 'Carbon fiber reinforced ASA gaining popularity for durable outdoor applications', 'ASA', 847, 'for outdoor prints', 1, true),
('Matte PLA finishes', 'Matte finish PLA materials trending for aesthetic prints', 'PLA', 324, 'for miniatures & display pieces', 2, true),
('High-speed PETG', 'PETG formulated for high-speed printing on modern printers', 'PETG', 256, 'for fast functional prints', 3, true);

-- Seed some quick tips
INSERT INTO public.quick_tips (tip_text, detail_text, related_material, material_filter, display_order, is_active) VALUES
('Printing ASA? Always use an enclosure for best results', 'ASA requires 80-100°C chamber temps to prevent warping and improve layer adhesion.', 'ASA', 'ASA', 1, true),
('PETG loves slow first layers', 'Try 15-20mm/s for your first layer with PETG to ensure proper bed adhesion.', 'PETG', 'PETG', 2, true),
('Dry your nylon before printing', 'Nylon absorbs moisture quickly. Dry at 70-80°C for 4-6 hours before use.', 'Nylon', 'Nylon', 3, true),
('TPU prints best with direct drive', 'Flexible materials like TPU work much better with direct drive extruders.', 'TPU', 'TPU', 4, true);

-- Create td_reference_values table
CREATE TABLE public.td_reference_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  material_type text NOT NULL,
  color_name text NOT NULL,
  color_hex text,
  td_value numeric NOT NULL,
  source text NOT NULL,
  confidence text DEFAULT 'medium',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique constraint on lower(brand, material, color)
CREATE UNIQUE INDEX idx_td_ref_unique ON public.td_reference_values (LOWER(brand_name), LOWER(material_type), LOWER(color_name));

-- Index for lookup performance
CREATE INDEX idx_td_ref_brand ON public.td_reference_values (LOWER(brand_name));

-- RLS: public read, service-role write
ALTER TABLE public.td_reference_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.td_reference_values
  FOR SELECT USING (true);

-- Seed data: Bambu Lab PLA Basic
INSERT INTO public.td_reference_values (brand_name, material_type, color_name, td_value, source, confidence) VALUES
('Bambu Lab', 'PLA Basic', 'White', 4.29, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Basic', 'Black', 0.56, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Basic', 'Red', 2.06, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Basic', 'Blue', 1.44, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Basic', 'Green', 1.62, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Basic', 'Yellow', 3.81, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Basic', 'Orange', 2.84, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Basic', 'Purple', 1.08, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Basic', 'Pink', 2.92, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Basic', 'Grey', 1.85, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Basic', 'Jade White', 3.94, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Basic', 'Bambu Green', 1.72, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Basic', 'Lemon Yellow', 3.38, 'hueforge_community', 'high'),
-- Bambu Lab PLA Matte
('Bambu Lab', 'PLA Matte', 'Charcoal', 0.54, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Matte', 'Mandarin Orange', 2.36, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Matte', 'Sakura Pink', 2.45, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Matte', 'Lilac Purple', 1.33, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Matte', 'Dark Green', 0.89, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Matte', 'Red', 1.78, 'hueforge_community', 'high'),
('Bambu Lab', 'PLA Matte', 'White', 3.54, 'hueforge_community', 'high'),
-- Bambu Lab PETG Basic
('Bambu Lab', 'PETG Basic', 'Black', 0.68, 'hueforge_community', 'high'),
('Bambu Lab', 'PETG Basic', 'White', 3.92, 'hueforge_community', 'high'),
('Bambu Lab', 'PETG Basic', 'Red', 1.95, 'hueforge_community', 'high'),
-- Polymaker PolyTerra PLA
('Polymaker', 'PolyTerra PLA', 'Cotton White', 4.10, 'hueforge_community', 'high'),
('Polymaker', 'PolyTerra PLA', 'Charcoal Black', 0.48, 'hueforge_community', 'high'),
('Polymaker', 'PolyTerra PLA', 'Lava Red', 1.72, 'hueforge_community', 'high'),
('Polymaker', 'PolyTerra PLA', 'Sapphire Blue', 1.38, 'hueforge_community', 'high'),
('Polymaker', 'PolyTerra PLA', 'Forest Green', 1.25, 'hueforge_community', 'high'),
('Polymaker', 'PolyTerra PLA', 'Banana', 3.65, 'hueforge_community', 'high'),
('Polymaker', 'PolyTerra PLA', 'Peach', 3.12, 'hueforge_community', 'high'),
('Polymaker', 'PolyTerra PLA', 'Lavender Purple', 1.56, 'hueforge_community', 'high'),
('Polymaker', 'PolyTerra PLA', 'Sakura Pink', 2.78, 'hueforge_community', 'high'),
('Polymaker', 'PolyTerra PLA', 'Fossil Grey', 1.92, 'hueforge_community', 'high'),
('Polymaker', 'PolyTerra PLA', 'Army Dark Green', 0.95, 'hueforge_community', 'high'),
('Polymaker', 'PolyTerra PLA', 'Ice', 3.85, 'hueforge_community', 'high'),
('Polymaker', 'PolyTerra PLA', 'Muted White', 3.42, 'hueforge_community', 'high'),
-- Polymaker PolyLite PLA
('Polymaker', 'PolyLite PLA', 'White', 4.45, 'hueforge_community', 'high'),
('Polymaker', 'PolyLite PLA', 'Black', 0.52, 'hueforge_community', 'high'),
('Polymaker', 'PolyLite PLA', 'Red', 2.15, 'hueforge_community', 'high'),
('Polymaker', 'PolyLite PLA', 'Blue', 1.65, 'hueforge_community', 'high'),
-- eSUN PLA+
('eSUN', 'PLA+', 'White', 4.52, 'hueforge_community', 'high'),
('eSUN', 'PLA+', 'Black', 0.62, 'hueforge_community', 'high'),
('eSUN', 'PLA+', 'Red', 2.18, 'hueforge_community', 'high'),
('eSUN', 'PLA+', 'Blue', 1.55, 'hueforge_community', 'high'),
('eSUN', 'PLA+', 'Yellow', 3.72, 'hueforge_community', 'high'),
('eSUN', 'PLA+', 'Green', 1.48, 'hueforge_community', 'high'),
('eSUN', 'PLA+', 'Orange', 2.95, 'hueforge_community', 'high'),
('eSUN', 'PLA+', 'Grey', 2.05, 'hueforge_community', 'high'),
-- Prusament PLA
('Prusament', 'PLA', 'Galaxy Black', 0.84, 'hueforge_community', 'high'),
('Prusament', 'PLA', 'Pristine White', 4.38, 'hueforge_community', 'high'),
('Prusament', 'PLA', 'Prusa Orange', 2.52, 'hueforge_community', 'high'),
('Prusament', 'PLA', 'Lipstick Red', 1.88, 'hueforge_community', 'high'),
('Prusament', 'PLA', 'Royal Blue', 1.42, 'hueforge_community', 'high'),
('Prusament', 'PLA', 'Jungle Green', 1.35, 'hueforge_community', 'high'),
('Prusament', 'PLA', 'Gentleman Grey', 1.78, 'hueforge_community', 'high'),
-- Hatchbox PLA
('Hatchbox', 'PLA', 'White', 4.15, 'hueforge_community', 'high'),
('Hatchbox', 'PLA', 'Black', 0.58, 'hueforge_community', 'high'),
('Hatchbox', 'PLA', 'Red', 2.02, 'hueforge_community', 'high'),
('Hatchbox', 'PLA', 'Blue', 1.52, 'hueforge_community', 'high'),
('Hatchbox', 'PLA', 'Yellow', 3.68, 'hueforge_community', 'high'),
('Hatchbox', 'PLA', 'Green', 1.45, 'hueforge_community', 'high'),
('Hatchbox', 'PLA', 'Orange', 2.78, 'hueforge_community', 'high'),
('Hatchbox', 'PLA', 'Silver', 2.85, 'hueforge_community', 'medium'),
-- Overture PLA
('Overture', 'PLA', 'White', 4.22, 'hueforge_community', 'medium'),
('Overture', 'PLA', 'Black', 0.55, 'hueforge_community', 'medium'),
('Overture', 'PLA', 'Red', 1.98, 'hueforge_community', 'medium'),
-- Sunlu PLA
('Sunlu', 'PLA', 'White', 4.08, 'hueforge_community', 'medium'),
('Sunlu', 'PLA', 'Black', 0.60, 'hueforge_community', 'medium'),
-- Inland PLA
('Inland', 'PLA', 'White', 4.18, 'hueforge_community', 'medium'),
('Inland', 'PLA', 'Black', 0.54, 'hueforge_community', 'medium'),
-- Atomic Filament PLA
('Atomic Filament', 'PLA', 'Nuclear White', 4.65, 'hueforge_community', 'high'),
('Atomic Filament', 'PLA', 'Jet Black', 0.42, 'hueforge_community', 'high'),
-- Fillamentum PLA
('Fillamentum', 'PLA Extrafill', 'Traffic White', 4.35, 'hueforge_community', 'high'),
('Fillamentum', 'PLA Extrafill', 'Traffic Black', 0.50, 'hueforge_community', 'high'),
-- ColorFabb PLA
('ColorFabb', 'PLA Economy', 'White', 4.12, 'hueforge_community', 'medium'),
('ColorFabb', 'PLA Economy', 'Black', 0.58, 'hueforge_community', 'medium');

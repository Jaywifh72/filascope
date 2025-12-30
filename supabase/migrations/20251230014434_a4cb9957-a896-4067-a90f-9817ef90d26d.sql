
-- =====================================================
-- PHASE 1: CREATE LOOKUP TABLES
-- =====================================================

-- Materials lookup table
CREATE TABLE public.materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  base_type text NOT NULL, -- PLA, PETG, ABS, TPU, etc.
  is_composite boolean DEFAULT false,
  composite_additive text, -- CF, GF, Wood, etc.
  description text,
  typical_nozzle_temp_min integer,
  typical_nozzle_temp_max integer,
  typical_bed_temp_min integer,
  typical_bed_temp_max integer,
  requires_enclosure boolean DEFAULT false,
  requires_hardened_nozzle boolean DEFAULT false,
  display_order integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- Color families lookup table
CREATE TABLE public.color_families (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  hex_default text, -- Representative hex for UI
  aliases text[] DEFAULT '{}', -- Gray/Grey, Multi/Multicolor
  display_order integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- Finish types lookup table
CREATE TABLE public.finish_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  display_order integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- Moisture sensitivity levels lookup table
CREATE TABLE public.moisture_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  severity_rank integer NOT NULL, -- 1=Low, 4=Critical
  description text,
  max_humidity_percent integer,
  drying_recommended boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all lookup tables
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.color_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finish_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moisture_levels ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
CREATE POLICY "Materials publicly readable" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Admins manage materials" ON public.materials FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Color families publicly readable" ON public.color_families FOR SELECT USING (true);
CREATE POLICY "Admins manage color families" ON public.color_families FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Finish types publicly readable" ON public.finish_types FOR SELECT USING (true);
CREATE POLICY "Admins manage finish types" ON public.finish_types FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moisture levels publicly readable" ON public.moisture_levels FOR SELECT USING (true);
CREATE POLICY "Admins manage moisture levels" ON public.moisture_levels FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- PHASE 2: POPULATE LOOKUP TABLES
-- =====================================================

-- Insert materials (70+ types)
INSERT INTO public.materials (name, base_type, is_composite, composite_additive, requires_hardened_nozzle, display_order) VALUES
-- Standard PLA variants
('PLA', 'PLA', false, NULL, false, 1),
('PLA+', 'PLA', false, NULL, false, 2),
('PLA Pro', 'PLA', false, NULL, false, 3),
('PLA Matte', 'PLA', false, NULL, false, 4),
('PLA Silk', 'PLA', false, NULL, false, 5),
('PLA Glow', 'PLA', false, NULL, false, 6),
('PLA Marble', 'PLA', false, NULL, false, 7),
('PLA Galaxy', 'PLA', false, NULL, false, 8),
('PLA Sparkle', 'PLA', false, NULL, false, 9),
('PLA Glitter', 'PLA', false, NULL, false, 10),
('PLA Rainbow', 'PLA', false, NULL, false, 11),
('PLA Gradient', 'PLA', false, NULL, false, 12),
('PLA Tri-Color', 'PLA', false, NULL, false, 13),
('PLA Dual Color', 'PLA', false, NULL, false, 14),
('PLA Translucent', 'PLA', false, NULL, false, 15),
('PLA Transparent', 'PLA', false, NULL, false, 16),
('PLA Metal', 'PLA', false, NULL, false, 17),
('PLA Wood', 'PLA', true, 'Wood', false, 18),
('PLA-CF', 'PLA', true, 'Carbon Fiber', true, 19),
('PLA-GF', 'PLA', true, 'Glass Fiber', true, 20),
('Tough PLA', 'PLA', false, NULL, false, 21),
('Impact PLA', 'PLA', false, NULL, false, 22),
('HS-PLA', 'PLA', false, NULL, false, 23),
('HF-PLA', 'PLA', false, NULL, false, 24),
('PLA Luminous', 'PLA', false, NULL, false, 25),
-- PETG variants
('PETG', 'PETG', false, NULL, false, 30),
('PETG+', 'PETG', false, NULL, false, 31),
('PETG Translucent', 'PETG', false, NULL, false, 32),
('PETG-CF', 'PETG', true, 'Carbon Fiber', true, 33),
('PETG-GF', 'PETG', true, 'Glass Fiber', true, 34),
('PETG HF', 'PETG', false, NULL, false, 35),
-- ABS variants
('ABS', 'ABS', false, NULL, false, 40),
('ABS+', 'ABS', false, NULL, false, 41),
('ABS-CF', 'ABS', true, 'Carbon Fiber', true, 42),
('ABS-GF', 'ABS', true, 'Glass Fiber', true, 43),
-- ASA variants
('ASA', 'ASA', false, NULL, false, 50),
('ASA+', 'ASA', false, NULL, false, 51),
('ASA-CF', 'ASA', true, 'Carbon Fiber', true, 52),
('ASA-GF', 'ASA', true, 'Glass Fiber', true, 53),
('ASA Aero', 'ASA', false, NULL, false, 54),
-- TPU variants
('TPU', 'TPU', false, NULL, false, 60),
('TPU 95A', 'TPU', false, NULL, false, 61),
('TPU 90A', 'TPU', false, NULL, false, 62),
('TPU 85A', 'TPU', false, NULL, false, 63),
('TPE', 'TPU', false, NULL, false, 64),
-- Nylon variants
('Nylon', 'Nylon', false, NULL, false, 70),
('PA6', 'Nylon', false, NULL, false, 71),
('PA12', 'Nylon', false, NULL, false, 72),
('PA6-CF', 'Nylon', true, 'Carbon Fiber', true, 73),
('PA6-GF', 'Nylon', true, 'Glass Fiber', true, 74),
('PA12-CF', 'Nylon', true, 'Carbon Fiber', true, 75),
-- PC variants
('PC', 'PC', false, NULL, false, 80),
('PC+', 'PC', false, NULL, false, 81),
('PC-CF', 'PC', true, 'Carbon Fiber', true, 82),
('PC-ABS', 'PC', true, 'ABS Blend', false, 83),
-- Specialty
('PVA', 'PVA', false, NULL, false, 90),
('HIPS', 'HIPS', false, NULL, false, 91),
('POM', 'POM', false, NULL, false, 92),
('PP', 'PP', false, NULL, false, 93),
('PEEK', 'PEEK', false, NULL, true, 94),
('PEI', 'PEI', false, NULL, true, 95),
('PCTG', 'PCTG', false, NULL, false, 96),
('CPE', 'CPE', false, NULL, false, 97);

-- Insert color families (22 canonical colors)
INSERT INTO public.color_families (name, hex_default, aliases, display_order) VALUES
('Black', '#000000', '{}', 1),
('White', '#FFFFFF', '{Bright White,Pure White}', 2),
('Gray', '#808080', '{Grey,Silver,Charcoal}', 3),
('Red', '#FF0000', '{Crimson,Scarlet,Ruby}', 4),
('Orange', '#FFA500', '{Tangerine}', 5),
('Yellow', '#FFFF00', '{Gold,Golden,Lemon}', 6),
('Green', '#00FF00', '{Lime,Forest,Olive,Mint}', 7),
('Blue', '#0000FF', '{Navy,Sky,Teal,Cyan,Cobalt}', 8),
('Purple', '#800080', '{Violet,Lavender,Plum}', 9),
('Pink', '#FFC0CB', '{Magenta,Rose,Coral}', 10),
('Brown', '#8B4513', '{Tan,Chocolate,Coffee,Wood}', 11),
('Beige', '#F5F5DC', '{Cream,Ivory,Sand}', 12),
('Clear', '#FFFFFF', '{Transparent,Natural,Translucent}', 13),
('Multi', '#RAINBOW', '{Multicolor,Rainbow,Gradient,Tri-Color,Dual Color}', 14),
('Glow', '#7FFF00', '{Luminous,Glow-in-Dark}', 15),
('Metallic', '#C0C0C0', '{Metal,Brass,Bronze,Copper}', 16),
('Marble', '#DEB887', '{Stone,Granite}', 17),
('Galaxy', '#1C1C3C', '{Space,Cosmic}', 18),
('Silk', '#FAF0E6', '{Satin}', 19),
('Glitter', '#FFD700', '{Sparkle}', 20),
('Wood', '#DEB887', '{}', 21),
('Carbon', '#2F4F4F', '{CF,Fiber}', 22);

-- Insert finish types
INSERT INTO public.finish_types (name, description, display_order) VALUES
('Matte', 'Non-reflective, low-gloss surface', 1),
('Silk', 'Smooth, lustrous silk-like sheen', 2),
('Gloss', 'Shiny, reflective surface', 3),
('Metallic', 'Metal-like reflective finish', 4),
('Sparkle', 'Contains glitter particles', 5),
('Marble', 'Streaked, stone-like appearance', 6),
('Galaxy', 'Dark with sparkle inclusions', 7),
('Glow', 'Phosphorescent glow-in-dark', 8),
('Translucent', 'Semi-transparent', 9),
('Transparent', 'Fully transparent/clear', 10),
('Textured', 'Rough or patterned surface', 11),
('Standard', 'Default smooth finish', 12);

-- Insert moisture levels
INSERT INTO public.moisture_levels (name, severity_rank, description, max_humidity_percent, drying_recommended) VALUES
('Low', 1, 'Not very sensitive to moisture', 60, false),
('Moderate', 2, 'Some sensitivity, drying helps', 50, true),
('High', 3, 'Very sensitive, requires drying', 40, true),
('Critical', 4, 'Extremely hygroscopic, must be dried', 30, true);

-- =====================================================
-- PHASE 3: ADD FK COLUMNS TO FILAMENTS
-- =====================================================

ALTER TABLE public.filaments 
  ADD COLUMN IF NOT EXISTS material_id uuid REFERENCES public.materials(id),
  ADD COLUMN IF NOT EXISTS color_family_id uuid REFERENCES public.color_families(id),
  ADD COLUMN IF NOT EXISTS finish_type_id uuid REFERENCES public.finish_types(id),
  ADD COLUMN IF NOT EXISTS moisture_level_id uuid REFERENCES public.moisture_levels(id);

-- Add missing FK constraint for brand_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'filaments_brand_id_fkey' 
    AND table_name = 'filaments'
  ) THEN
    ALTER TABLE public.filaments 
      ADD CONSTRAINT filaments_brand_id_fkey 
      FOREIGN KEY (brand_id) REFERENCES public.automated_brands(id);
  END IF;
END $$;

-- =====================================================
-- PHASE 4: MIGRATE EXISTING DATA
-- =====================================================

-- Link filaments to materials (fuzzy matching)
UPDATE public.filaments f
SET material_id = m.id
FROM public.materials m
WHERE f.material IS NOT NULL 
  AND f.material_id IS NULL
  AND (
    LOWER(TRIM(f.material)) = LOWER(m.name)
    OR LOWER(TRIM(f.material)) = LOWER(REPLACE(m.name, '-', ' '))
    OR LOWER(TRIM(f.material)) = LOWER(REPLACE(m.name, ' ', '-'))
    OR LOWER(TRIM(f.material)) = LOWER(REPLACE(m.name, '+', ' Plus'))
    OR LOWER(TRIM(REPLACE(f.material, ' ', ''))) = LOWER(REPLACE(m.name, ' ', ''))
  );

-- Link filaments to color families (with alias support)
UPDATE public.filaments f
SET color_family_id = cf.id
FROM public.color_families cf
WHERE f.color_family IS NOT NULL 
  AND f.color_family_id IS NULL
  AND (
    LOWER(TRIM(f.color_family)) = LOWER(cf.name)
    OR LOWER(TRIM(f.color_family)) = ANY(SELECT LOWER(unnest(cf.aliases)))
    -- Handle Gray/Grey variations
    OR (LOWER(TRIM(f.color_family)) IN ('gray', 'grey', 'silver', 'charcoal') AND cf.name = 'Gray')
    OR (LOWER(TRIM(f.color_family)) IN ('multi', 'multicolor', 'rainbow', 'gradient') AND cf.name = 'Multi')
    OR (LOWER(TRIM(f.color_family)) IN ('clear', 'transparent', 'natural', 'translucent') AND cf.name = 'Clear')
  );

-- Link filaments to finish types (case-insensitive)
UPDATE public.filaments f
SET finish_type_id = ft.id
FROM public.finish_types ft
WHERE f.finish_type IS NOT NULL 
  AND f.finish_type_id IS NULL
  AND LOWER(TRIM(f.finish_type)) = LOWER(ft.name);

-- Link filaments to moisture levels
UPDATE public.filaments f
SET moisture_level_id = ml.id
FROM public.moisture_levels ml
WHERE f.moisture_sensitivity_level IS NOT NULL 
  AND f.moisture_level_id IS NULL
  AND LOWER(TRIM(f.moisture_sensitivity_level)) = LOWER(ml.name);

-- =====================================================
-- PHASE 5: ADD PERFORMANCE INDEXES
-- =====================================================

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_filaments_material_vendor 
  ON public.filaments(material_id, vendor) 
  WHERE variant_available = true;

CREATE INDEX IF NOT EXISTS idx_filaments_color_family_material 
  ON public.filaments(color_family_id, material_id) 
  WHERE variant_available = true;

CREATE INDEX IF NOT EXISTS idx_filaments_brand_material 
  ON public.filaments(brand_id, material_id) 
  WHERE variant_available = true;

CREATE INDEX IF NOT EXISTS idx_filaments_price_material 
  ON public.filaments(variant_price, material_id) 
  WHERE variant_available = true AND variant_price IS NOT NULL;

-- Functional index for case-insensitive vendor search
CREATE INDEX IF NOT EXISTS idx_filaments_vendor_lower 
  ON public.filaments(LOWER(vendor));

-- Index for product line grouping
CREATE INDEX IF NOT EXISTS idx_filaments_product_line 
  ON public.filaments(product_line_id) 
  WHERE product_line_id IS NOT NULL;

-- Index for color hex lookups
CREATE INDEX IF NOT EXISTS idx_filaments_color_hex 
  ON public.filaments(color_hex) 
  WHERE color_hex IS NOT NULL;

-- Index for sync status queries
CREATE INDEX IF NOT EXISTS idx_filaments_sync_status 
  ON public.filaments(sync_status, last_scraped_at);

-- Remove duplicate index if it exists
DROP INDEX IF EXISTS idx_price_history_filament_recorded;

-- =====================================================
-- PHASE 6: CREATE AUTOMATION TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_link_filament_lookups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-link material
  IF NEW.material IS NOT NULL AND NEW.material_id IS NULL THEN
    SELECT id INTO NEW.material_id
    FROM materials
    WHERE LOWER(TRIM(NEW.material)) = LOWER(name)
       OR LOWER(TRIM(NEW.material)) = LOWER(REPLACE(name, '-', ' '))
       OR LOWER(TRIM(NEW.material)) = LOWER(REPLACE(name, ' ', '-'))
    LIMIT 1;
  END IF;
  
  -- Auto-link color family
  IF NEW.color_family IS NOT NULL AND NEW.color_family_id IS NULL THEN
    SELECT id INTO NEW.color_family_id
    FROM color_families
    WHERE LOWER(TRIM(NEW.color_family)) = LOWER(name)
       OR LOWER(TRIM(NEW.color_family)) = ANY(SELECT LOWER(unnest(aliases)))
    LIMIT 1;
  END IF;
  
  -- Auto-link finish type
  IF NEW.finish_type IS NOT NULL AND NEW.finish_type_id IS NULL THEN
    SELECT id INTO NEW.finish_type_id
    FROM finish_types
    WHERE LOWER(TRIM(NEW.finish_type)) = LOWER(name)
    LIMIT 1;
  END IF;
  
  -- Auto-link moisture level
  IF NEW.moisture_sensitivity_level IS NOT NULL AND NEW.moisture_level_id IS NULL THEN
    SELECT id INTO NEW.moisture_level_id
    FROM moisture_levels
    WHERE LOWER(TRIM(NEW.moisture_sensitivity_level)) = LOWER(name)
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic linking on insert/update
DROP TRIGGER IF EXISTS trg_auto_link_filament_lookups ON public.filaments;
CREATE TRIGGER trg_auto_link_filament_lookups
  BEFORE INSERT OR UPDATE ON public.filaments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_filament_lookups();

-- =====================================================
-- PHASE 7: CREATE NORMALIZED VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.v_filaments_normalized AS
SELECT 
  f.id,
  f.product_id,
  f.product_title,
  f.product_handle,
  f.vendor,
  f.variant_price,
  f.variant_available,
  f.color_hex,
  f.product_url,
  f.featured_image,
  f.tds_url,
  f.net_weight_g,
  f.diameter_nominal_mm,
  f.nozzle_temp_min_c,
  f.nozzle_temp_max_c,
  f.bed_temp_min_c,
  f.bed_temp_max_c,
  f.product_line_id,
  f.created_at,
  f.updated_at,
  -- Joined lookup data
  m.name AS material_name,
  m.base_type AS material_base_type,
  m.is_composite AS material_is_composite,
  m.requires_hardened_nozzle,
  cf.name AS color_family_name,
  cf.hex_default AS color_family_hex,
  ft.name AS finish_type_name,
  ml.name AS moisture_level_name,
  ml.severity_rank AS moisture_severity,
  -- Brand data
  ab.brand_name,
  ab.display_name AS brand_display_name,
  ab.logo_url AS brand_logo
FROM public.filaments f
LEFT JOIN public.materials m ON f.material_id = m.id
LEFT JOIN public.color_families cf ON f.color_family_id = cf.id
LEFT JOIN public.finish_types ft ON f.finish_type_id = ft.id
LEFT JOIN public.moisture_levels ml ON f.moisture_level_id = ml.id
LEFT JOIN public.automated_brands ab ON f.brand_id = ab.id;

-- Grant access to the view
GRANT SELECT ON public.v_filaments_normalized TO anon, authenticated;

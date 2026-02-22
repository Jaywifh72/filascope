
-- ============================================================
-- Intelligent Search Infrastructure
-- ============================================================

-- 1. filament_properties
CREATE TABLE public.filament_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id uuid NOT NULL UNIQUE REFERENCES public.filaments(id) ON DELETE CASCADE,
  heat_resistance_c integer,
  glass_transition_c integer,
  print_temp_min integer,
  print_temp_max integer,
  bed_temp_min integer,
  bed_temp_max integer,
  tensile_strength_mpa numeric(6,2),
  impact_strength_score integer CHECK (impact_strength_score BETWEEN 1 AND 10),
  flexibility_score integer CHECK (flexibility_score BETWEEN 1 AND 10),
  layer_adhesion_score integer CHECK (layer_adhesion_score BETWEEN 1 AND 10),
  uv_resistance_score integer CHECK (uv_resistance_score BETWEEN 1 AND 10),
  moisture_resistance_score integer CHECK (moisture_resistance_score BETWEEN 1 AND 10),
  food_safe boolean DEFAULT false,
  biodegradable boolean DEFAULT false,
  outdoor_suitable boolean DEFAULT false,
  warping_risk text CHECK (warping_risk IN ('low','medium','high')),
  support_removal text CHECK (support_removal IN ('easy','moderate','difficult')),
  enclosure_required boolean DEFAULT false,
  abrasive boolean DEFAULT false,
  drying_required boolean DEFAULT false,
  translucency text CHECK (translucency IN ('opaque','translucent','transparent')),
  surface_finish text CHECK (surface_finish IN ('matte','satin','glossy')),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_filament_properties_filament_id ON public.filament_properties(filament_id);

-- updated_at trigger
CREATE TRIGGER update_filament_properties_updated_at
  BEFORE UPDATE ON public.filament_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_listing_timestamp();

ALTER TABLE public.filament_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read filament_properties"
  ON public.filament_properties FOR SELECT
  USING (true);

CREATE POLICY "Admin insert filament_properties"
  ON public.filament_properties FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update filament_properties"
  ON public.filament_properties FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete filament_properties"
  ON public.filament_properties FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. filament_trait_tags
CREATE TABLE public.filament_trait_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id uuid NOT NULL REFERENCES public.filaments(id) ON DELETE CASCADE,
  trait text NOT NULL,
  trait_category text CHECK (trait_category IN ('strength','weakness','use_case','avoid_if')),
  confidence integer DEFAULT 3 CHECK (confidence BETWEEN 1 AND 5),
  source text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_filament_trait_tags_filament_id ON public.filament_trait_tags(filament_id);

ALTER TABLE public.filament_trait_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read filament_trait_tags"
  ON public.filament_trait_tags FOR SELECT
  USING (true);

CREATE POLICY "Admin insert filament_trait_tags"
  ON public.filament_trait_tags FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update filament_trait_tags"
  ON public.filament_trait_tags FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete filament_trait_tags"
  ON public.filament_trait_tags FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. filament_use_cases
CREATE TABLE public.filament_use_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id uuid NOT NULL REFERENCES public.filaments(id) ON DELETE CASCADE,
  use_case text NOT NULL,
  suitability text CHECK (suitability IN ('ideal','good','acceptable','not_recommended')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_filament_use_cases_filament_id ON public.filament_use_cases(filament_id);

ALTER TABLE public.filament_use_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read filament_use_cases"
  ON public.filament_use_cases FOR SELECT
  USING (true);

CREATE POLICY "Admin insert filament_use_cases"
  ON public.filament_use_cases FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update filament_use_cases"
  ON public.filament_use_cases FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete filament_use_cases"
  ON public.filament_use_cases FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. trait_taxonomy
CREATE TABLE public.trait_taxonomy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trait text UNIQUE NOT NULL,
  category text NOT NULL,
  related_traits text[],
  search_keywords text[]
);

CREATE INDEX idx_trait_taxonomy_trait ON public.trait_taxonomy(trait);

ALTER TABLE public.trait_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read trait_taxonomy"
  ON public.trait_taxonomy FOR SELECT
  USING (true);

-- 5. filament_search_embeddings
CREATE TABLE public.filament_search_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id uuid NOT NULL UNIQUE REFERENCES public.filaments(id) ON DELETE CASCADE,
  embedding_text text,
  embedding_json text,
  generated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_filament_search_embeddings_filament_id ON public.filament_search_embeddings(filament_id);

ALTER TABLE public.filament_search_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read filament_search_embeddings"
  ON public.filament_search_embeddings FOR SELECT
  USING (true);

CREATE POLICY "Admin insert filament_search_embeddings"
  ON public.filament_search_embeddings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update filament_search_embeddings"
  ON public.filament_search_embeddings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete filament_search_embeddings"
  ON public.filament_search_embeddings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. intelligent_search_logs
CREATE TABLE public.intelligent_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  parsed_intent jsonb,
  result_count integer,
  region text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.intelligent_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert search logs"
  ON public.intelligent_search_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin read search logs"
  ON public.intelligent_search_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed trait_taxonomy
INSERT INTO public.trait_taxonomy (trait, category, related_traits, search_keywords) VALUES
  ('high heat resistance', 'strength', '{"thermal resistance","temperature resistant"}', '{"hot","heat","high temp","thermal","summer","car","engine","outdoor heat","heat deflection"}'),
  ('easy to print', 'strength', '{"beginner friendly","forgiving"}', '{"easy","simple","beginner","first","starter","new to","plug and play"}'),
  ('strong layer adhesion', 'strength', '{"good layer bonding","strong interlayer"}', '{"strong","layers","bonding","delaminate","peel","split"}'),
  ('low warping', 'strength', '{"warp resistant","warp-free","stable"}', '{"warp","curl","bed adhesion","lifting","corners","warp free"}'),
  ('food safe', 'use_case', '{"food contact safe","FDA compliant"}', '{"food","kitchen","utensil","cup","plate","safe to eat","cutlery","bowl"}'),
  ('outdoor use', 'use_case', '{"exterior use","weatherproof","UV stable"}', '{"outdoor","outside","garden","weatherproof","sun","rain","UV","weather"}'),
  ('flexible', 'strength', '{"bendable","rubber-like","elastic","soft"}', '{"flex","flexible","bend","rubber","soft","elastic","tpu","squish","give"}'),
  ('brittle', 'weakness', '{"snaps easily","low impact resistance"}', '{"brittle","snap","crack","fragile","breaks","shatter"}'),
  ('moisture sensitive', 'weakness', '{"hygroscopic","absorbs moisture","needs drying"}', '{"moisture","humid","dry","wet","storage","humidity","damp"}'),
  ('requires enclosure', 'weakness', '{"enclosure needed","needs chamber heat"}', '{"enclosure","chamber","no enclosure","open frame","ender","prusa mk"}'),
  ('HueForge compatible', 'use_case', '{"good TD values","transmissivity optimized"}', '{"hueforge","td","transmissivity","photo","litho","lithophane","image"}'),
  ('abrasive', 'weakness', '{"needs hardened nozzle","brass nozzle killer"}', '{"hardened nozzle","brass","carbon","fiber","filled","composite","abrasive"}'),
  ('UV resistant', 'strength', '{"UV stable","sun resistant","photostable"}', '{"UV","sun","sunlight","fade","outdoor","bleach","yellow","discolor"}'),
  ('chemical resistant', 'strength', '{"solvent resistant","acid resistant"}', '{"chemical","solvent","acid","fuel","oil","petrol","acetone"}'),
  ('high strength', 'strength', '{"strong","impact resistant","durable","tough"}', '{"strong","tough","durable","functional","mechanical","load","bearing","structural"}');

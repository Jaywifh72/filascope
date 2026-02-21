
-- Drop old search_synonyms and recreate with correct schema
DROP TABLE IF EXISTS public.search_synonyms;

CREATE TABLE public.search_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL UNIQUE,
  synonyms text[] NOT NULL DEFAULT '{}',
  maps_to_material text,
  maps_to_tag text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read search synonyms"
  ON public.search_synonyms FOR SELECT
  USING (true);

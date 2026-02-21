
CREATE TABLE IF NOT EXISTS public.search_synonyms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_term TEXT NOT NULL,
  target_term TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'brand',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_search_synonyms_source ON public.search_synonyms(LOWER(source_term));

ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage search synonyms"
  ON public.search_synonyms FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

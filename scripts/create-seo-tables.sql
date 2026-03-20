CREATE TABLE IF NOT EXISTS public.seo_citation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  ai_engine TEXT NOT NULL,
  query TEXT NOT NULL,
  cited BOOLEAN DEFAULT false,
  url_cited TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.seo_citation_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seo_citation_log' AND policyname = 'Admins can manage citation log') THEN
    CREATE POLICY "Admins can manage citation log" ON public.seo_citation_log FOR ALL USING (has_role(auth.uid(), 'admin'));
  END IF;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_citation_log TO authenticated;

CREATE TABLE IF NOT EXISTS public.seo_advisor_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  effort TEXT,
  impact TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  source_data JSONB
);

ALTER TABLE public.seo_advisor_actions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'seo_advisor_actions' AND policyname = 'Admins can manage advisor actions') THEN
    CREATE POLICY "Admins can manage advisor actions" ON public.seo_advisor_actions FOR ALL USING (has_role(auth.uid(), 'admin'));
  END IF;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_advisor_actions TO authenticated;

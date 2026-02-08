
-- ============================================================
-- Projects Feature Rebuild Migration
-- ============================================================

-- 1. Add new columns to projects table
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS project_type text NOT NULL DEFAULT 'single_print',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'planning',
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS printer_id uuid REFERENCES public.printers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS budget numeric,
  ADD COLUMN IF NOT EXISTS budget_currency text,
  ADD COLUMN IF NOT EXISTS slug text;

-- Add unique constraint on slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON public.projects (slug) WHERE slug IS NOT NULL;

-- Add public projects SELECT policy
CREATE POLICY "Public projects are viewable by everyone"
  ON public.projects FOR SELECT
  USING (is_public = true);

-- 2. Drop old project_filaments table and create project_materials
DROP TABLE IF EXISTS public.project_filaments;

CREATE TABLE public.project_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  filament_id uuid NOT NULL REFERENCES public.filaments(id) ON DELETE CASCADE,
  quantity_grams integer,
  quantity_spools numeric NOT NULL DEFAULT 1,
  note text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  purchase_status text NOT NULL DEFAULT 'need_to_buy',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project materials"
  ON public.project_materials FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert their own project materials"
  ON public.project_materials FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can update their own project materials"
  ON public.project_materials FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete their own project materials"
  ON public.project_materials FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()));

-- Public project materials are viewable
CREATE POLICY "Public project materials are viewable by everyone"
  ON public.project_materials FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND is_public = true));

-- 3. Create project_accessories table
CREATE TABLE public.project_accessories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text,
  price numeric,
  currency text NOT NULL DEFAULT 'USD',
  purchase_status text NOT NULL DEFAULT 'need_to_buy',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project accessories"
  ON public.project_accessories FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert their own project accessories"
  ON public.project_accessories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can update their own project accessories"
  ON public.project_accessories FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete their own project accessories"
  ON public.project_accessories FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Public project accessories are viewable by everyone"
  ON public.project_accessories FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND is_public = true));

-- 4. Create project_log_entries table
CREATE TABLE public.project_log_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  entry_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project log entries"
  ON public.project_log_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert their own project log entries"
  ON public.project_log_entries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()));

CREATE POLICY "Users can update their own project log entries"
  ON public.project_log_entries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own project log entries"
  ON public.project_log_entries FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Public project log entries are viewable by everyone"
  ON public.project_log_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND is_public = true));

-- 5. Create project_log_photos table
CREATE TABLE public.project_log_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_entry_id uuid NOT NULL REFERENCES public.project_log_entries(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_log_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own project log photos"
  ON public.project_log_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.project_log_entries le
    JOIN public.projects p ON p.id = le.project_id
    WHERE le.id = log_entry_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own project log photos"
  ON public.project_log_photos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.project_log_entries le
    JOIN public.projects p ON p.id = le.project_id
    WHERE le.id = log_entry_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own project log photos"
  ON public.project_log_photos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.project_log_entries le
    JOIN public.projects p ON p.id = le.project_id
    WHERE le.id = log_entry_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Public project log photos are viewable by everyone"
  ON public.project_log_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.project_log_entries le
    JOIN public.projects p ON p.id = le.project_id
    WHERE le.id = log_entry_id AND p.is_public = true
  ));

-- 6. Storage bucket for project images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view project images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can upload project images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own project images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own project images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Add indexes for performance
CREATE INDEX idx_project_materials_project_id ON public.project_materials(project_id);
CREATE INDEX idx_project_accessories_project_id ON public.project_accessories(project_id);
CREATE INDEX idx_project_log_entries_project_id ON public.project_log_entries(project_id);
CREATE INDEX idx_project_log_photos_entry_id ON public.project_log_photos(log_entry_id);
CREATE INDEX idx_projects_user_status ON public.projects(user_id, status);
CREATE INDEX idx_projects_public ON public.projects(is_public) WHERE is_public = true;

-- 8. updated_at trigger for projects (reuse existing function if available)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_purchases table for tracking bought filaments
CREATE TABLE public.user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  filament_id uuid REFERENCES public.filaments(id) ON DELETE CASCADE NOT NULL,
  purchase_date timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, filament_id)
);

-- Create projects table for user-organized filament collections
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_filaments junction table
CREATE TABLE public.project_filaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  filament_id uuid REFERENCES public.filaments(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(project_id, filament_id)
);

-- Create filament_comments table for public and private comments
CREATE TABLE public.filament_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id uuid REFERENCES public.filaments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  comment_text text NOT NULL,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_filaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filament_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_purchases
CREATE POLICY "Users can view own purchases"
  ON public.user_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON public.user_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchases"
  ON public.user_purchases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchases"
  ON public.user_purchases FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for project_filaments
CREATE POLICY "Users can view own project filaments"
  ON public.project_filaments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_filaments.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert into own projects"
  ON public.project_filaments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_filaments.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete from own projects"
  ON public.project_filaments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_filaments.project_id
    AND projects.user_id = auth.uid()
  ));

-- RLS Policies for filament_comments
CREATE POLICY "Users can view own comments and public comments"
  ON public.filament_comments FOR SELECT
  USING (auth.uid() = user_id OR is_private = false);

CREATE POLICY "Users can insert own comments"
  ON public.filament_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.filament_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.filament_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_filament_comments_updated_at
  BEFORE UPDATE ON public.filament_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
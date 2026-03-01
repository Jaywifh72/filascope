
CREATE TABLE public.td_population_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id uuid REFERENCES public.filaments(id) ON DELETE CASCADE,
  td_value numeric NOT NULL,
  previous_value numeric,
  source text NOT NULL,
  confidence text DEFAULT 'medium',
  status text DEFAULT 'applied',
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.td_population_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read td_population_log"
  ON public.td_population_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert td_population_log"
  ON public.td_population_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update td_population_log"
  ON public.td_population_log FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete td_population_log"
  ON public.td_population_log FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

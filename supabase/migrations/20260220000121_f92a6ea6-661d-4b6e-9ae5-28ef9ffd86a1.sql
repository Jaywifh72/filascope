
-- Create search_console_data table for Google Search Console integration
CREATE TABLE public.search_console_data (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date        DATE NOT NULL,
  query       TEXT,
  page        TEXT,
  clicks      INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr         DECIMAL(5,4),
  position    DECIMAL(5,2),
  country     TEXT DEFAULT 'zz',
  device      TEXT DEFAULT 'DESKTOP',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Unique index for idempotent upserts
CREATE UNIQUE INDEX search_console_data_unique
  ON public.search_console_data(date, COALESCE(query, ''), COALESCE(page, ''), COALESCE(country, 'zz'), COALESCE(device, 'DESKTOP'));

-- Enable RLS
ALTER TABLE public.search_console_data ENABLE ROW LEVEL SECURITY;

-- Admins can read
CREATE POLICY "Admin read search_console_data"
  ON public.search_console_data FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can do everything (for edge function writes)
CREATE POLICY "Service role all search_console_data"
  ON public.search_console_data FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

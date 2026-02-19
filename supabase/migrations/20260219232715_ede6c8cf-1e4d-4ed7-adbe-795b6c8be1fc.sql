
CREATE TABLE IF NOT EXISTS public.indexnow_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  url_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  response_code INTEGER,
  error_message TEXT,
  batch_type TEXT DEFAULT 'manual',
  urls_sample TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.indexnow_submissions ENABLE ROW LEVEL SECURITY;

-- No public access — edge functions use service role key
CREATE POLICY "Service role only"
  ON public.indexnow_submissions
  FOR ALL
  USING (false);

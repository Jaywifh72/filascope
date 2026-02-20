-- Create broken_links table for tracking invalid product URLs
CREATE TABLE public.broken_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.filament_listings(id) ON DELETE CASCADE,
  filament_id UUID REFERENCES public.filaments(id) ON DELETE CASCADE,
  retailer_id UUID REFERENCES public.retailers(id) ON DELETE SET NULL,
  product_url TEXT NOT NULL,
  affiliate_url TEXT,
  region TEXT NOT NULL DEFAULT 'US',
  break_type TEXT NOT NULL CHECK (break_type IN ('hard_404', 'soft_404', 'wrong_redirect', 'geo_redirect', 'out_of_stock', 'affiliate_failure', 'timeout', 'ssl_error', 'domain_dead')),
  http_status INTEGER,
  final_url TEXT,
  redirect_chain JSONB DEFAULT '[]',
  error_message TEXT,
  suggested_url TEXT,
  fix_method TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fixed', 'ignored', 'manual_review')),
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fixed_at TIMESTAMPTZ,
  fixed_by UUID,
  scan_batch_id TEXT,
  retailer_name TEXT,
  filament_name TEXT,
  brand_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_broken_links_status ON public.broken_links(status);
CREATE INDEX idx_broken_links_break_type ON public.broken_links(break_type);
CREATE INDEX idx_broken_links_listing_id ON public.broken_links(listing_id);
CREATE INDEX idx_broken_links_region ON public.broken_links(region);
CREATE INDEX idx_broken_links_retailer ON public.broken_links(retailer_name);

ALTER TABLE public.broken_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read broken_links"
  ON public.broken_links FOR SELECT USING (true);

CREATE POLICY "Allow service role broken_links"
  ON public.broken_links FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow admin broken_links"
  ON public.broken_links FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create link_scan_runs table for scan history tracking
CREATE TABLE public.link_scan_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  total_links INTEGER DEFAULT 0,
  checked INTEGER DEFAULT 0,
  broken_found INTEGER DEFAULT 0,
  fixed_auto INTEGER DEFAULT 0,
  scan_type TEXT DEFAULT 'full',
  filters JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  error_message TEXT
);

ALTER TABLE public.link_scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read link_scan_runs"
  ON public.link_scan_runs FOR SELECT USING (true);

CREATE POLICY "Allow service role link_scan_runs"
  ON public.link_scan_runs FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow admin link_scan_runs"
  ON public.link_scan_runs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
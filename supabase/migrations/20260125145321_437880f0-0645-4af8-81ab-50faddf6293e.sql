-- Create table to track auto-fixed URLs
CREATE TABLE IF NOT EXISTS public.url_auto_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id UUID REFERENCES filaments(id) ON DELETE SET NULL,
  original_url TEXT NOT NULL,
  new_url TEXT NOT NULL,
  resolution_method TEXT NOT NULL, -- 'redirect_detection' or 'search_resolution'
  similarity_score NUMERIC(4,3), -- For search resolution matches
  fixed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by filament
CREATE INDEX idx_url_auto_fixes_filament ON url_auto_fixes(filament_id);

-- Index for recent fixes
CREATE INDEX idx_url_auto_fixes_fixed_at ON url_auto_fixes(fixed_at DESC);

-- Enable RLS (admin only)
ALTER TABLE url_auto_fixes ENABLE ROW LEVEL SECURITY;

-- RLS policy for service role only (Edge Functions)
CREATE POLICY "Service role can manage url_auto_fixes"
  ON url_auto_fixes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
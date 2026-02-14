
-- Add regional_breakdown JSONB column to brand_sync_logs for per-region stats
ALTER TABLE public.brand_sync_logs
ADD COLUMN IF NOT EXISTS regional_breakdown JSONB DEFAULT NULL;

-- Add index for querying logs with regional data
CREATE INDEX IF NOT EXISTS idx_brand_sync_logs_regional_breakdown
ON public.brand_sync_logs USING GIN (regional_breakdown)
WHERE regional_breakdown IS NOT NULL;

COMMENT ON COLUMN public.brand_sync_logs.regional_breakdown IS 'Per-region sync stats: {"CA": {"updated": 5, "created": 2, "skipped": 0, "errors": 1, "error_messages": [...]}, ...}';

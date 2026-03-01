
-- Add td_confidence, td_source, td_matched_at columns to filaments
ALTER TABLE public.filaments
  ADD COLUMN IF NOT EXISTS td_confidence text,
  ADD COLUMN IF NOT EXISTS td_source text,
  ADD COLUMN IF NOT EXISTS td_matched_at timestamptz;

-- Backfill from td_population_log
UPDATE public.filaments f
SET 
  td_confidence = sub.confidence,
  td_source = sub.source,
  td_matched_at = sub.created_at
FROM (
  SELECT DISTINCT ON (filament_id) 
    filament_id, confidence, source, created_at
  FROM public.td_population_log
  WHERE status = 'applied'
  ORDER BY filament_id, created_at DESC
) sub
WHERE f.id = sub.filament_id
  AND f.transmission_distance IS NOT NULL;

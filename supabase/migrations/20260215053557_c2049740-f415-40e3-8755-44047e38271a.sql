
-- Add fixed_count column to validation_runs
ALTER TABLE public.validation_runs ADD COLUMN IF NOT EXISTS fixed_count integer DEFAULT 0;

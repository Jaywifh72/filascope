
-- Remove the overly permissive policy (service role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role full access to batches" ON public.orchestration_batches;

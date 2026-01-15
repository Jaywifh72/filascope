-- Fix: Set v_public_brands view to use SECURITY INVOKER
-- This ensures RLS policies are evaluated for the querying user, not the view creator

ALTER VIEW public.v_public_brands SET (security_invoker = on);
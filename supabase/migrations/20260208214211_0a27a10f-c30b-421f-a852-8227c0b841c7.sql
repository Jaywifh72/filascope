
-- Fix Security Definer views by setting security_invoker = on
-- This ensures RLS policies of the querying user are respected

ALTER VIEW public.v_brand_directory SET (security_invoker = on);
ALTER VIEW public.v_product_community_ratings SET (security_invoker = on);

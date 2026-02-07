
-- Fix SECURITY DEFINER views by setting security_invoker = true
-- This ensures views respect the querying user's RLS policies

ALTER VIEW public.exchange_rate_status SET (security_invoker = on);
ALTER VIEW public.filaments_with_regional SET (security_invoker = on);
ALTER VIEW public.printers_with_regional SET (security_invoker = on);
ALTER VIEW public.v_missing_temp_data SET (security_invoker = on);
ALTER VIEW public.v_public_brands SET (security_invoker = on);
ALTER VIEW public.v_suspect_regional_prices SET (security_invoker = on);


-- Fix mutable search_path on 6 public functions
-- Setting search_path = public prevents search_path hijacking attacks

ALTER FUNCTION public.get_brand_region_coverage() SET search_path = public;
ALTER FUNCTION public.get_filament_best_price(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_filament_regional_prices(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_missing_regional_urls(integer) SET search_path = public;
ALTER FUNCTION public.get_regional_failed_syncs() SET search_path = public;
ALTER FUNCTION public.should_refresh_exchange_rates() SET search_path = public;

-- Remove the public SELECT policy from affiliate_configs
DROP POLICY IF EXISTS "Affiliate configs publicly readable" ON public.affiliate_configs;
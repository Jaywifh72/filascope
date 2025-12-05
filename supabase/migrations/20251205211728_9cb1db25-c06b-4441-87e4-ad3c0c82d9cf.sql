-- Allow public read access to affiliate configs so all users can apply affiliate links
CREATE POLICY "Affiliate configs publicly readable" 
ON public.affiliate_configs 
FOR SELECT 
USING (true);
CREATE OR REPLACE VIEW public.search_dictionaries AS
SELECT 'brand' AS dict_type, brand_name AS term
FROM public.automated_brands
WHERE is_visible = true
UNION ALL
SELECT 'material' AS dict_type, name AS term
FROM public.materials
UNION ALL
SELECT 'color' AS dict_type, name AS term
FROM public.color_families;

GRANT SELECT ON public.search_dictionaries TO anon, authenticated;
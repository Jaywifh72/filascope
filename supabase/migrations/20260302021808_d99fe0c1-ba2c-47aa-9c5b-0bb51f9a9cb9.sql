INSERT INTO public.site_settings (key, value, updated_at)
VALUES ('filament_search_public', '{"enabled": true}'::jsonb, now())
ON CONFLICT (key) DO NOTHING;
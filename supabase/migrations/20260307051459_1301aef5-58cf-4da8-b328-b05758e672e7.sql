-- Drop FK on filament_onboarding_items referencing filament_onboarding_jobs
ALTER TABLE IF EXISTS public.filament_onboarding_items
  DROP CONSTRAINT IF EXISTS filament_onboarding_items_job_id_fkey;

-- Drop FK on filament_onboarding_jobs referencing brand_scraping_configs
ALTER TABLE IF EXISTS public.filament_onboarding_jobs
  DROP CONSTRAINT IF EXISTS filament_onboarding_jobs_config_id_fkey;

-- Drop the legacy tables
DROP TABLE IF EXISTS public.filament_onboarding_items;
DROP TABLE IF EXISTS public.filament_onboarding_jobs;
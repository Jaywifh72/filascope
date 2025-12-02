-- Delete duplicates using ctid (internal row identifier)
DELETE FROM public.printer_accessories
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY printer_id, name ORDER BY created_at DESC) as rn
    FROM public.printer_accessories
  ) t WHERE t.rn > 1
);

-- Now add the unique constraint
ALTER TABLE public.printer_accessories 
ADD CONSTRAINT printer_accessories_printer_id_name_key UNIQUE (printer_id, name);

-- Add new columns for richer nozzle data
ALTER TABLE public.printer_accessories
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS compatible_printer_brands text[],
ADD COLUMN IF NOT EXISTS compatible_hotend_types text[];
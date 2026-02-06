-- Corrective migration: Normalize printer_id slugs to use hyphens consistently

-- Step 1: Normalize underscores to hyphens in all printer_id values
UPDATE printers 
SET printer_id = REPLACE(printer_id, '_', '-')
WHERE printer_id LIKE '%\_%';

-- Step 2: Collapse any double hyphens and clean up
UPDATE printers 
SET printer_id = REGEXP_REPLACE(
  REGEXP_REPLACE(printer_id, '-+', '-', 'g'),
  '^-|-$', '', 'g'
)
WHERE printer_id IS NOT NULL;
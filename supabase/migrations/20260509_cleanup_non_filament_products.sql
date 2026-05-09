-- Cleanup: remove non-filament products that were scraped from stores selling mixed products.
-- These products passed through the scraper before the product vetter was in place.
-- Safe to re-run (all conditions are exact title/vendor matches).

BEGIN;

-- ============================================================
-- SainSmart: mass hardware contamination (CNC tools, lasers, power tools, batteries, etc.)
-- Keep only products that contain 'filament', '1.75mm', 'pla', 'petg', 'tpu', 'asa', or 'nylon'
-- ============================================================
DELETE FROM filaments
WHERE vendor ILIKE 'SainSmart'
  AND product_title !~* '\yfilament\y'
  AND product_title !~* '1\.75\s*mm'
  AND product_title !~* '\bpla\b'
  AND product_title !~* '\bpetg\b'
  AND product_title !~* '\btpu\b'
  AND product_title !~* '\basa\b'
  AND product_title !~* '\bnylon\b'
  AND product_title !~* '\babs\b';

-- ============================================================
-- Printed Solid: extended warranty and printer products
-- ============================================================
DELETE FROM filaments
WHERE vendor ILIKE 'Printed Solid'
  AND (
    product_title ILIKE '%warranty%'
    OR product_title ILIKE '%3D printer%'
  );

-- ============================================================
-- Kingroon: printer accessories (nozzles, hotends, heater blocks, pulleys, etc.)
-- ============================================================
DELETE FROM filaments
WHERE vendor ILIKE 'Kingroon'
  AND (
    product_title ILIKE '%nozzle%'
    OR product_title ILIKE '%hotend%'
    OR product_title ILIKE '%hot end%'
    OR product_title ILIKE '%heater block%'
    OR product_title ILIKE '%thermistor%'
    OR product_title ILIKE '%silicone case%'
    OR product_title ILIKE '%pulley%'
    OR product_title ILIKE '%deburr%'
  );

-- ============================================================
-- Creality: non-filament accessories (protective lenses, printer parts)
-- ============================================================
DELETE FROM filaments
WHERE vendor ILIKE 'Creality'
  AND product_title ILIKE '%protective lens%';

-- ============================================================
-- Any vendor: catch-all for obvious protection plans and warranties
-- that weren't caught above
-- ============================================================
DELETE FROM filaments
WHERE product_title ~* 'protect(?:ion)?\s*plan'
   OR product_title ~* 'extended?\s*warrant'
   OR product_title ~* 'service\s*plan'
   OR product_title ~* 'shipping\s*protect';

COMMIT;

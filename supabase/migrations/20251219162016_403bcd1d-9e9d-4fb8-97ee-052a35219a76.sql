-- ============================================================================
-- CLEANUP: Fix Bambu Lab filament titles with duplicated prefixes
-- ============================================================================

-- Fix "Bambu Lab PLA Silk Silk X" → "Bambu Lab PLA Silk X"
UPDATE filaments
SET product_title = REPLACE(product_title, 'PLA Silk Silk ', 'PLA Silk ')
WHERE vendor = 'Bambu Lab' 
AND product_title LIKE 'Bambu Lab PLA Silk Silk %';

-- Fix "Bambu Lab PLA Metal Metal X" → "Bambu Lab PLA Metal X"
UPDATE filaments
SET product_title = REPLACE(product_title, 'PLA Metal Metal ', 'PLA Metal ')
WHERE vendor = 'Bambu Lab' 
AND product_title LIKE 'Bambu Lab PLA Metal Metal %';

-- ============================================================================
-- CLEANUP: Delete garbage multi-color records with marketing text in titles
-- ============================================================================

DELETE FROM filaments
WHERE vendor = 'Bambu Lab'
AND (
  product_title ILIKE '%Captivating Silk Appearance%'
  OR product_title ILIKE '%silk-like gradients%'
  OR product_title ILIKE '%with Dynamic Effects%'
  OR product_title ILIKE '%transformations%'
  OR product_title ILIKE '%lustrous%'
  OR product_title ILIKE '%iridescent%'
  OR product_title ILIKE '%shimmering%'
  OR product_title ILIKE '%Multi-color Captivating%'
);

-- ============================================================================
-- CLEANUP: Delete duplicate old multi-color entries that will be replaced
-- by proper fallback colors (Rainbow, Galaxy, Sunset, Aurora - old names)
-- ============================================================================

DELETE FROM filaments
WHERE vendor = 'Bambu Lab'
AND product_id LIKE 'bambu-pla-silk-multi-color-%'
AND product_title IN (
  'Bambu Lab PLA Silk Multi-color Rainbow',
  'Bambu Lab PLA Silk Multi-color Galaxy',
  'Bambu Lab PLA Silk Multi-color Sunset',
  'Bambu Lab PLA Silk Multi-color Aurora'
);
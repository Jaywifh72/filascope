-- Fix 55 FormFutura products with NULL material
UPDATE filaments SET material = CASE
  WHEN product_title ~* 'apollox[\- ]?cf|athenax[\- ]?cf|asa[\- ]?cf' THEN 'ASA-CF'
  WHEN product_title ~* 'athenax[\- ]?gf|asa[\- ]?gf' THEN 'ASA-GF'
  WHEN product_title ~* 'carbonfil' THEN 'PETG-CF'
  WHEN product_title ~* 'apollox|athenax|rapollo' THEN 'ASA'
  WHEN product_title ~* 'titanx' THEN 'ABS'
  WHEN product_title ~* 'rtitan' THEN 'rABS'
  WHEN product_title ~* 'reform.*rpet' AND product_title !~* 'rpetg' THEN 'rPET'
  WHEN product_title ~* 'metalfil' THEN 'PLA-Metal'
  WHEN product_title ~* 'stonefil' THEN 'PLA-Stone'
  WHEN product_title ~* 'flexifil|tpc' THEN 'TPC'
  WHEN product_title ~* 'bvoh' THEN 'BVOH'
  WHEN product_title ~* 'atlas.*support' THEN 'PVA'
  WHEN product_title ~* 'refill.*system' THEN 'Other'
  ELSE material
END
WHERE vendor ILIKE 'formfutura' AND material IS NULL
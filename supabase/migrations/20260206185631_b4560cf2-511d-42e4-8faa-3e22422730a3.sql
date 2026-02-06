-- Phase 6: Data validation view to flag suspect regional prices
-- Flags products where regional prices appear to be copy-paste errors

CREATE OR REPLACE VIEW public.v_suspect_regional_prices AS
WITH price_analysis AS (
  SELECT
    id,
    product_title,
    vendor,
    variant_price,
    price_cad,
    price_gbp,
    price_eur,
    price_aud,
    price_jpy,
    -- Count how many regional prices are populated
    (CASE WHEN price_cad IS NOT NULL AND price_cad > 0 THEN 1 ELSE 0 END +
     CASE WHEN price_gbp IS NOT NULL AND price_gbp > 0 THEN 1 ELSE 0 END +
     CASE WHEN price_eur IS NOT NULL AND price_eur > 0 THEN 1 ELSE 0 END +
     CASE WHEN price_aud IS NOT NULL AND price_aud > 0 THEN 1 ELSE 0 END +
     CASE WHEN price_jpy IS NOT NULL AND price_jpy > 0 THEN 1 ELSE 0 END
    ) AS populated_regional_count,
    -- Check if all populated regional prices equal variant_price (copy-paste error)
    (CASE WHEN price_cad IS NOT NULL AND price_cad > 0 AND price_cad = variant_price THEN 1 ELSE 0 END +
     CASE WHEN price_gbp IS NOT NULL AND price_gbp > 0 AND price_gbp = variant_price THEN 1 ELSE 0 END +
     CASE WHEN price_eur IS NOT NULL AND price_eur > 0 AND price_eur = variant_price THEN 1 ELSE 0 END +
     CASE WHEN price_aud IS NOT NULL AND price_aud > 0 AND price_aud = variant_price THEN 1 ELSE 0 END +
     CASE WHEN price_jpy IS NOT NULL AND price_jpy > 0 AND price_jpy = variant_price THEN 1 ELSE 0 END
    ) AS identical_to_usd_count,
    -- Flag JPY prices that are implausibly low (JPY should be ~100x USD)
    CASE WHEN price_jpy IS NOT NULL AND price_jpy > 0 AND variant_price IS NOT NULL AND variant_price > 0
         AND price_jpy < variant_price * 50 THEN true ELSE false END AS jpy_suspiciously_low
  FROM filaments
  WHERE variant_price IS NOT NULL AND variant_price > 0
)
SELECT
  id,
  product_title,
  vendor,
  variant_price,
  price_cad,
  price_gbp,
  price_eur,
  price_aud,
  price_jpy,
  populated_regional_count,
  identical_to_usd_count,
  jpy_suspiciously_low,
  CASE
    WHEN populated_regional_count > 0 AND identical_to_usd_count = populated_regional_count
      THEN 'ALL_IDENTICAL'
    WHEN jpy_suspiciously_low
      THEN 'JPY_TOO_LOW'
    WHEN populated_regional_count > 1 AND identical_to_usd_count > 0
      THEN 'SOME_IDENTICAL'
    ELSE 'OK'
  END AS suspect_reason
FROM price_analysis
WHERE
  -- Only show rows that have at least one issue
  (populated_regional_count > 0 AND identical_to_usd_count > 0)
  OR jpy_suspiciously_low;

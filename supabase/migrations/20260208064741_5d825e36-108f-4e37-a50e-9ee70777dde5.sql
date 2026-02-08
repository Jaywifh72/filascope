
-- Create a view that aggregates community ratings from product_reviews
-- This provides avg rating, review count, and sub-rating averages per product
CREATE OR REPLACE VIEW public.v_product_community_ratings AS
SELECT
  product_id,
  product_type,
  COUNT(*)::int AS review_count,
  ROUND(AVG(overall_rating)::numeric, 1) AS avg_rating,
  ROUND(AVG(quality_rating)::numeric, 1) AS avg_quality,
  ROUND(AVG(ease_rating)::numeric, 1) AS avg_ease,
  ROUND(AVG(value_rating)::numeric, 1) AS avg_value
FROM public.product_reviews
WHERE is_public = true
  AND status = 'published'
  AND deleted_at IS NULL
GROUP BY product_id, product_type;

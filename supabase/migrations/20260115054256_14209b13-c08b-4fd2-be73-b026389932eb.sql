-- Fix: Restrict public access to automated_brands table
-- Problem: Current RLS policy exposes sensitive scraping configuration to public

-- Step 1: Drop the existing overly-permissive public read policy
DROP POLICY IF EXISTS "Automated brands publicly readable" ON automated_brands;

-- Step 2: Create a view that only exposes safe, public-facing brand information
-- This excludes all scraping-related columns, API endpoints, and internal stats
CREATE OR REPLACE VIEW public.v_public_brands AS
SELECT 
  id,
  brand_name,
  brand_slug,
  display_name,
  description,
  logo_url,
  website_url,
  color_primary,
  color_secondary,
  featured,
  display_order,
  is_visible,
  product_count,
  active_product_count
FROM automated_brands
WHERE is_visible = true;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.v_public_brands TO anon;
GRANT SELECT ON public.v_public_brands TO authenticated;

-- Step 3: Create new restrictive policy - only admins can read full table
CREATE POLICY "Only admins can read full automated_brands"
ON automated_brands
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 4: Keep existing admin policies for INSERT/UPDATE/DELETE
-- (These should already exist, but ensure they're in place)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'automated_brands' 
    AND policyname = 'Admins can update automated_brands'
  ) THEN
    CREATE POLICY "Admins can update automated_brands"
    ON automated_brands
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'automated_brands' 
    AND policyname = 'Admins can insert automated_brands'
  ) THEN
    CREATE POLICY "Admins can insert automated_brands"
    ON automated_brands
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'automated_brands' 
    AND policyname = 'Admins can delete automated_brands'
  ) THEN
    CREATE POLICY "Admins can delete automated_brands"
    ON automated_brands
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
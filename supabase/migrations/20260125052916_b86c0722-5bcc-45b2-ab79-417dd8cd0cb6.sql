-- Populate missing product_handle from product_url for products with /products/ pattern
-- This fixes regional URL generation for products missing product_handle

UPDATE filaments 
SET product_handle = LOWER(
  REGEXP_REPLACE(
    product_url, 
    '.*/products/([^/?#]+).*', 
    '\1'
  )
)
WHERE product_handle IS NULL 
  AND product_url IS NOT NULL 
  AND product_url ~ '/products/[^/?#]+'
  AND product_url !~ '/products/$';

-- Also update products with empty product_handle
UPDATE filaments 
SET product_handle = LOWER(
  REGEXP_REPLACE(
    product_url, 
    '.*/products/([^/?#]+).*', 
    '\1'
  )
)
WHERE (product_handle = '' OR TRIM(product_handle) = '')
  AND product_url IS NOT NULL 
  AND product_url ~ '/products/[^/?#]+'
  AND product_url !~ '/products/$';


## Database URL Normalization Trigger

### Summary
Create a database trigger that automatically fixes known problematic URLs (like eSUN) on insert and update operations to prevent future issues.

### Database Audit Results
All current URLs in the database are correctly formatted:
- eSUN: 360 products using correct `esun3dstore.com` domain
- No broken `esun3d.com` URLs found
- No other brands with domain issues detected

### Implementation Plan

#### Step 1: Create URL Normalization Function
Create a PostgreSQL function `normalize_product_url()` that:
- Fixes eSUN domain: `esun3d.com` → `esun3dstore.com`
- Removes `www.` prefix from eSUN URLs
- Can be extended for other brand-specific fixes in the future

```sql
CREATE OR REPLACE FUNCTION normalize_product_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip if product_url is null
  IF NEW.product_url IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Fix eSUN domain: esun3d.com → esun3dstore.com
  IF NEW.product_url LIKE '%esun3d.com%' 
     AND NEW.product_url NOT LIKE '%esun3dstore.com%' THEN
    NEW.product_url := REPLACE(
      REPLACE(NEW.product_url, 'www.esun3d.com', 'esun3dstore.com'),
      'esun3d.com', 'esun3dstore.com'
    );
  END IF;
  
  -- Additional brand fixes can be added here
  
  RETURN NEW;
END;
$$;
```

#### Step 2: Create Database Triggers
Attach the function to both INSERT and UPDATE operations:

```sql
CREATE TRIGGER normalize_product_url_on_insert
  BEFORE INSERT ON filaments
  FOR EACH ROW
  EXECUTE FUNCTION normalize_product_url();

CREATE TRIGGER normalize_product_url_on_update
  BEFORE UPDATE ON filaments
  FOR EACH ROW
  WHEN (OLD.product_url IS DISTINCT FROM NEW.product_url)
  EXECUTE FUNCTION normalize_product_url();
```

### Files to Modify
- **Database Migration**: New SQL migration to create function and triggers

### Technical Notes
- Trigger uses `BEFORE INSERT/UPDATE` to fix URLs before they're stored
- The `WHEN` clause on UPDATE prevents unnecessary trigger execution
- Function is extensible for future brand-specific URL fixes
- Matches the runtime fix logic in `src/lib/urlValidation.ts`


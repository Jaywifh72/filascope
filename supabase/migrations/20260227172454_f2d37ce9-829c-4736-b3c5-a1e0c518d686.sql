UPDATE filaments 
SET sync_status = 'active', last_sync_error = NULL 
WHERE vendor ILIKE '%Prusa%' AND sync_status = 'unavailable';
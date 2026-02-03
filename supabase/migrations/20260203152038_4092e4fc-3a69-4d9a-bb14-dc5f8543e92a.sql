-- 1. Create status view for monitoring rate freshness
CREATE OR REPLACE VIEW exchange_rate_status AS
SELECT 
  er.currency_code,
  er.currency_name,
  er.currency_symbol,
  er.rate_to_usd,
  er.updated_at,
  CASE 
    WHEN er.updated_at > NOW() - INTERVAL '25 hours' THEN 'fresh'
    WHEN er.updated_at > NOW() - INTERVAL '3 days' THEN 'stale'
    ELSE 'outdated'
  END as status,
  EXTRACT(EPOCH FROM (NOW() - er.updated_at)) / 3600 as hours_since_update
FROM exchange_rates er
ORDER BY er.currency_code;

-- 2. Grant access to view
GRANT SELECT ON exchange_rate_status TO anon, authenticated;

-- 3. Create refresh check function
CREATE OR REPLACE FUNCTION should_refresh_exchange_rates()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM exchange_rates 
    WHERE currency_code != 'USD' 
    AND updated_at < NOW() - INTERVAL '24 hours'
    LIMIT 1
  ) OR NOT EXISTS (
    SELECT 1 FROM exchange_rates WHERE currency_code = 'CAD'
  );
$$;

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION should_refresh_exchange_rates TO anon, authenticated;
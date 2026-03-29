import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SQL = `
CREATE OR REPLACE FUNCTION public.start_brand_scrape(p_brand_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_already_active boolean;
  v_timed_out boolean;
BEGIN
  SELECT 
    scraping_active,
    (scrape_timeout_at IS NOT NULL AND scrape_timeout_at < NOW())
  INTO v_already_active, v_timed_out
  FROM automated_brands
  WHERE brand_slug = p_brand_slug AND scraping_enabled = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF v_already_active AND NOT COALESCE(v_timed_out, false) THEN
    RETURN false;
  END IF;
  
  UPDATE automated_brands
  SET 
    scraping_active = true,
    scrape_timeout_at = NOW() + INTERVAL '15 minutes'
  WHERE brand_slug = p_brand_slug AND scraping_enabled = true;
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_brand_scrape(
  p_sync_log_id uuid, 
  p_success boolean, 
  p_products_discovered integer DEFAULT 0, 
  p_products_created integer DEFAULT 0, 
  p_products_updated integer DEFAULT 0, 
  p_products_failed integer DEFAULT 0, 
  p_price_changes integer DEFAULT 0, 
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_brand_slug text;
  v_brand_id uuid;
  v_duration numeric;
BEGIN
  SELECT 
    brand_slug, 
    brand_id,
    EXTRACT(EPOCH FROM (NOW() - started_at))
  INTO v_brand_slug, v_brand_id, v_duration
  FROM brand_sync_logs
  WHERE id = p_sync_log_id;
  
  UPDATE brand_sync_logs
  SET 
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    completed_at = NOW(),
    duration_seconds = v_duration,
    products_discovered = p_products_discovered,
    products_created = p_products_created,
    products_updated = p_products_updated,
    products_failed = p_products_failed,
    price_changes = p_price_changes,
    error_details = CASE WHEN p_error_message IS NOT NULL 
                    THEN jsonb_build_object('error', p_error_message)
                    ELSE NULL END
  WHERE id = p_sync_log_id;
  
  UPDATE automated_brands
  SET 
    scraping_active = false,
    scrape_timeout_at = NULL,
    last_scrape_at = NOW(),
    next_scrape_at = NOW() + (scrape_frequency_hours || ' hours')::interval,
    total_scrapes = COALESCE(total_scrapes, 0) + 1,
    successful_scrapes = CASE WHEN p_success THEN COALESCE(successful_scrapes, 0) + 1 ELSE COALESCE(successful_scrapes, 0) END,
    failed_scrapes = CASE WHEN NOT p_success THEN COALESCE(failed_scrapes, 0) + 1 ELSE COALESCE(failed_scrapes, 0) END,
    products_created = COALESCE(products_created, 0) + p_products_created,
    products_updated = COALESCE(products_updated, 0) + p_products_updated,
    last_error = CASE WHEN NOT p_success THEN p_error_message ELSE NULL END,
    last_error_at = CASE WHEN NOT p_success THEN NOW() ELSE last_error_at END,
    avg_scrape_duration_seconds = CASE 
      WHEN avg_scrape_duration_seconds IS NULL THEN v_duration
      ELSE (avg_scrape_duration_seconds + v_duration) / 2
    END
  WHERE brand_slug = v_brand_slug;
  
  PERFORM update_brand_product_counts(v_brand_slug);
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_stuck_scrapes()
RETURNS TABLE(brands_reset integer, logs_fixed integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_brands_reset integer;
  v_logs_fixed integer;
BEGIN
  UPDATE automated_brands 
  SET scraping_active = false, scrape_timeout_at = NULL
  WHERE scraping_active = true
    AND (scrape_timeout_at IS NOT NULL AND scrape_timeout_at < NOW()
      OR last_scrape_at IS NULL
      OR last_scrape_at < NOW() - INTERVAL '2 hours');
  GET DIAGNOSTICS v_brands_reset = ROW_COUNT;

  UPDATE brand_sync_logs
  SET status = 'failed',
      error_details = jsonb_build_object('error', 'Timed out - auto-cleaned'),
      completed_at = NOW()
  WHERE status = 'running' AND started_at < NOW() - INTERVAL '30 minutes';
  GET DIAGNOSTICS v_logs_fixed = ROW_COUNT;

  RETURN QUERY SELECT v_brands_reset, v_logs_fixed;
END;
$function$;
`;

serve(async (req) => {
  // Simple auth check
  const authHeader = req.headers.get("Authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!authHeader.includes(serviceKey.substring(0, 20))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: "No SUPABASE_DB_URL available" }), { status: 500 });
    }

    // Use postgres client
    const { Pool } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    const pool = new Pool(dbUrl, 1);
    const client = await pool.connect();

    try {
      // Run each function definition separately
      const statements = SQL.split(/;\s*\n\nCREATE OR REPLACE/).map((s, i) =>
        i === 0 ? s : "CREATE OR REPLACE" + s
      );

      const results = [];
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (!trimmed) continue;
        await client.queryObject(trimmed + (trimmed.endsWith(";") ? "" : ";"));
        results.push("OK");
      }

      // Verify
      const verify = await client.queryObject(`
        SELECT routine_name FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name IN ('start_brand_scrape', 'complete_brand_scrape', 'cleanup_stuck_scrapes')
        ORDER BY routine_name;
      `);

      return new Response(JSON.stringify({
        success: true,
        deployed: results.length,
        verified: verify.rows,
        message: "Migration applied successfully"
      }), { headers: { "Content-Type": "application/json" } });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

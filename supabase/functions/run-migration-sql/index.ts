import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!authHeader.includes(serviceKey.substring(0, 20))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: "No SUPABASE_DB_URL" }), { status: 500 });
    }

    const { Pool } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    const pool = new Pool(dbUrl, 1);
    const client = await pool.connect();

    try {
      // Step 1: ALTER brand_sync_logs
      await client.queryObject(`
        ALTER TABLE brand_sync_logs
          ADD COLUMN IF NOT EXISTS sync_scope TEXT DEFAULT 'full'
            CHECK (sync_scope IN ('full','price_only','stock_only','regional','discovery')),
          ADD COLUMN IF NOT EXISTS regions_attempted TEXT[],
          ADD COLUMN IF NOT EXISTS regions_succeeded TEXT[],
          ADD COLUMN IF NOT EXISTS regions_failed TEXT[],
          ADD COLUMN IF NOT EXISTS stock_changes INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS price_before_avg NUMERIC(8,2),
          ADD COLUMN IF NOT EXISTS price_after_avg NUMERIC(8,2),
          ADD COLUMN IF NOT EXISTS new_in_stock INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS new_out_of_stock INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS products_skipped INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS error_code TEXT,
          ADD COLUMN IF NOT EXISTS heal_action_taken TEXT;
      `);

      // Step 2: Indexes
      await client.queryObject(`CREATE INDEX IF NOT EXISTS brand_sync_logs_brand_started ON brand_sync_logs(brand_slug, started_at DESC);`);
      await client.queryObject(`CREATE INDEX IF NOT EXISTS brand_sync_logs_started ON brand_sync_logs(started_at DESC);`);

      // Step 3: sync_heal_log table
      await client.queryObject(`
        CREATE TABLE IF NOT EXISTS sync_heal_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          run_at TIMESTAMPTZ DEFAULT NOW(),
          brand_slug TEXT,
          action TEXT NOT NULL,
          detail JSONB,
          brands_checked INTEGER DEFAULT 0,
          brands_affected INTEGER DEFAULT 0,
          fixes_applied INTEGER DEFAULT 0,
          errors INTEGER DEFAULT 0,
          duration_ms INTEGER,
          triggered_by TEXT DEFAULT 'system',
          notes TEXT
        );
      `);
      await client.queryObject(`CREATE INDEX IF NOT EXISTS sync_heal_log_run_at ON sync_heal_log(run_at DESC);`);
      await client.queryObject(`CREATE INDEX IF NOT EXISTS sync_heal_log_brand ON sync_heal_log(brand_slug, run_at DESC);`);

      // Step 4: automated_brands columns (check first)
      const colCheck = await client.queryObject(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'automated_brands' AND column_name = 'last_price_sync_at';
      `);
      if (colCheck.rows.length === 0) {
        await client.queryObject(`
          ALTER TABLE automated_brands
            ADD COLUMN last_price_sync_at TIMESTAMPTZ,
            ADD COLUMN last_stock_sync_at TIMESTAMPTZ,
            ADD COLUMN last_regional_sync_at TIMESTAMPTZ,
            ADD COLUMN price_sync_status TEXT DEFAULT 'unknown',
            ADD COLUMN stock_sync_status TEXT DEFAULT 'unknown',
            ADD COLUMN regional_sync_status TEXT DEFAULT 'unknown',
            ADD COLUMN consecutive_failures INTEGER DEFAULT 0,
            ADD COLUMN last_error_code TEXT,
            ADD COLUMN last_error_message TEXT,
            ADD COLUMN stores_supported TEXT[] DEFAULT ARRAY['US']::TEXT[],
            ADD COLUMN stores_operational TEXT[] DEFAULT ARRAY['US']::TEXT[];
        `);
      }

      // Verify
      const cols = await client.queryObject(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'brand_sync_logs'
        AND column_name IN ('sync_scope','regions_attempted','stock_changes','price_before_avg')
        ORDER BY column_name;
      `);

      const healLog = await client.queryObject(`SELECT 1 FROM sync_heal_log LIMIT 1;`);
      const abCols = await client.queryObject(`SELECT column_name FROM information_schema.columns WHERE table_name = 'automated_brands' AND column_name = 'last_price_sync_at';`);

      return new Response(JSON.stringify({
        success: true,
        brand_sync_logs_columns: cols.rows.length,
        sync_heal_log_exists: healLog.rows.length >= 0,
        automated_brands_migrated: abCols.rows.length > 0
      }), { headers: { "Content-Type": "application/json" } });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});

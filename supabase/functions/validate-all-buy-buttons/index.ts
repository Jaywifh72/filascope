import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateCrealityUrl, parseCrealityUrl } from "../_shared/creality-validator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REGION_URL_COLUMNS: Record<string, string> = {
  US: 'product_url',
  CA: 'product_url_ca',
  UK: 'product_url_uk',
  EU: 'product_url_eu',
  AU: 'product_url_au',
  JP: 'product_url_jp',
};

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 10000;

interface ValidationResult {
  product_id: string;
  product_name: string;
  brand_name: string;
  region: string;
  store_url: string;
  http_status_code: number | null;
  validation_status: string;
  error_message: string | null;
  response_time_ms: number;
  redirect_url: string | null;
}

// ─── Generic URL validator (non-Creality) ─────────────────────────────────────

async function validateUrlGeneric(url: string): Promise<{
  status: string;
  statusCode: number | null;
  errorMessage: string | null;
  responseTimeMs: number;
  redirectUrl: string | null;
}> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'FilaScope BuyButton Validator/1.0' },
    });
    clearTimeout(timeoutId);
    const elapsed = Date.now() - start;

    if (response.status === 200 || response.status === 204) {
      return { status: 'valid', statusCode: response.status, errorMessage: null, responseTimeMs: elapsed, redirectUrl: null };
    } else if (response.status >= 300 && response.status < 400) {
      const loc = response.headers.get('location');
      return { status: 'redirect', statusCode: response.status, errorMessage: null, responseTimeMs: elapsed, redirectUrl: loc };
    } else if (response.status === 404 || response.status === 410) {
      return { status: 'broken', statusCode: response.status, errorMessage: `HTTP ${response.status}`, responseTimeMs: elapsed, redirectUrl: null };
    } else {
      return { status: 'error', statusCode: response.status, errorMessage: `HTTP ${response.status}`, responseTimeMs: elapsed, redirectUrl: null };
    }
  } catch (error: any) {
    const elapsed = Date.now() - start;
    if (error.name === 'AbortError') {
      return { status: 'timeout', statusCode: null, errorMessage: 'Request timed out', responseTimeMs: elapsed, redirectUrl: null };
    }
    return { status: 'error', statusCode: null, errorMessage: error.message?.substring(0, 200), responseTimeMs: elapsed, redirectUrl: null };
  }
}

// ─── Determine if URL is Creality ─────────────────────────────────────────────

function isCrealityUrl(url: string): boolean {
  return url.includes('store.creality.com') || url.includes('creality3dofficial.com') || /\b(ca|uk|eu|au|jp)\.store\.creality\.com\b/.test(url);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { brand_filter, region_filter, product_ids, limit } = body;

    // Create validation run
    const { data: run, error: runErr } = await supabase
      .from('validation_runs')
      .insert({
        status: 'running',
        filter_brand: brand_filter || null,
        filter_region: region_filter || null,
        triggered_by: 'manual',
      })
      .select('id')
      .single();

    if (runErr || !run) {
      throw new Error(`Failed to create validation run: ${runErr?.message}`);
    }

    const runId = run.id;

    // Fetch products
    let query = supabase
      .from('filaments')
      .select('id, product_title, vendor, product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp')
      .order('vendor');

    if (brand_filter) {
      query = query.ilike('vendor', brand_filter);
    }
    if (product_ids && product_ids.length > 0) {
      query = query.in('id', product_ids);
    }
    if (limit) {
      query = query.limit(limit);
    }

    // Fetch products (paginated if no limit set)
    let allProducts: any[] = [];
    if (limit) {
      const { data, error } = await query;
      if (error) throw new Error(`Failed to fetch products: ${error.message}`);
      allProducts = data || [];
    } else {
      let offset = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await query.range(offset, offset + pageSize - 1);
        if (error) throw new Error(`Failed to fetch products: ${error.message}`);
        if (!data || data.length === 0) break;
        allProducts = allProducts.concat(data);
        if (data.length < pageSize) break;
        offset += pageSize;
      }
    }

    // Determine which regions to check
    const regionsToCheck = region_filter 
      ? { [region_filter]: REGION_URL_COLUMNS[region_filter] }
      : REGION_URL_COLUMNS;

    // Build work items
    const workItems: { product: any; region: string; url: string; column: string }[] = [];
    for (const product of allProducts) {
      for (const [region, col] of Object.entries(regionsToCheck)) {
        const url = product[col];
        if (url && url.trim()) {
          workItems.push({ product, region, url: url.trim(), column: col });
        }
      }
    }

    let validCount = 0;
    let brokenCount = 0;
    let redirectCount = 0;
    let errorCount = 0;
    let timeoutCount = 0;
    let fixedCount = 0;

    // Process in batches
    for (let i = 0; i < workItems.length; i += BATCH_SIZE) {
      const batch = workItems.slice(i, i + BATCH_SIZE);

      const results: ValidationResult[] = [];
      const urlFixes: Array<{ product_id: string; column: string; new_url: string }> = [];

      // Process each item — Creality gets intelligent validation, others get generic
      for (const item of batch) {
        if (isCrealityUrl(item.url)) {
          // ── Creality intelligent validation ──
          const crResult = await validateCrealityUrl(item.url, item.region);
          
          let status = 'valid';
          let errorMsg: string | null = null;

          if (!crResult.is_valid) {
            if (crResult.is_soft_404) {
              status = 'broken';
              errorMsg = 'Soft 404: page returns 200 but shows "not found" content';
            } else if (crResult.failure_reason === 'hard_404') {
              status = 'broken';
              errorMsg = `HTTP ${crResult.http_status}`;
            } else if (crResult.failure_reason === 'redirect_homepage') {
              status = 'broken';
              errorMsg = 'Redirects to homepage — product discontinued';
            } else if (crResult.failure_reason === 'timeout') {
              status = 'timeout';
              errorMsg = 'Request timed out';
            } else if (crResult.failure_reason) {
              status = 'error';
              errorMsg = crResult.failure_reason;
            }
          }

          // If Creality validator found a fix, queue it for auto-update
          if (crResult.suggested_fix_url && crResult.fix_validated) {
            urlFixes.push({
              product_id: item.product.id,
              column: item.column,
              new_url: crResult.suggested_fix_url,
            });
            status = 'fixed'; // custom status to indicate auto-repair
            errorMsg = `Auto-fixed: ${crResult.fix_source} → ${crResult.suggested_fix_url}`;
          }

          results.push({
            product_id: item.product.id,
            product_name: item.product.product_title,
            brand_name: item.product.vendor,
            region: item.region,
            store_url: item.url,
            http_status_code: crResult.http_status,
            validation_status: status,
            error_message: errorMsg,
            response_time_ms: crResult.response_time_ms,
            redirect_url: crResult.suggested_fix_url,
          });
        } else {
          // ── Generic validation ──
          let result = await validateUrlGeneric(item.url);

          // Auto-retry once on error/timeout
          if (result.status === 'error' || result.status === 'timeout') {
            await new Promise(r => setTimeout(r, 500));
            result = await validateUrlGeneric(item.url);
          }

          results.push({
            product_id: item.product.id,
            product_name: item.product.product_title,
            brand_name: item.product.vendor,
            region: item.region,
            store_url: item.url,
            http_status_code: result.statusCode,
            validation_status: result.status,
            error_message: result.errorMessage,
            response_time_ms: result.responseTimeMs,
            redirect_url: result.redirectUrl,
          });
        }
      }

      // Count results
      for (const r of results) {
        switch (r.validation_status) {
          case 'valid': validCount++; break;
          case 'broken': brokenCount++; break;
          case 'redirect': redirectCount++; break;
          case 'timeout': timeoutCount++; break;
          case 'fixed': fixedCount++; validCount++; break; // fixed counts as valid
          default: errorCount++; break;
        }
      }

      // Insert batch results into validation log
      const insertData = results.map(r => ({
        validation_run_id: runId,
        product_id: r.product_id,
        product_name: r.product_name,
        brand_name: r.brand_name,
        region: r.region,
        store_url: r.store_url,
        http_status_code: r.http_status_code,
        validation_status: r.validation_status,
        error_message: r.error_message,
        response_time_ms: r.response_time_ms,
        redirect_url: r.redirect_url,
      }));

      await supabase.from('buy_button_validation_log').insert(insertData);

      // Auto-apply URL fixes to the filaments table
      for (const fix of urlFixes) {
        const { error: fixErr } = await supabase
          .from('filaments')
          .update({ [fix.column]: fix.new_url })
          .eq('id', fix.product_id);

        if (fixErr) {
          console.error(`Failed to auto-fix URL for product ${fix.product_id}:`, fixErr);
        } else {
          console.log(`✅ Auto-fixed ${fix.column} for product ${fix.product_id} → ${fix.new_url}`);
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < workItems.length) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    // Complete the run
    await supabase
      .from('validation_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_checks: workItems.length,
        valid_count: validCount,
        broken_count: brokenCount,
        redirect_count: redirectCount,
        error_count: errorCount,
        timeout_count: timeoutCount,
        fixed_count: fixedCount,
      })
      .eq('id', runId);

    return new Response(JSON.stringify({
      run_id: runId,
      total_checks: workItems.length,
      valid_count: validCount,
      broken_count: brokenCount,
      redirect_count: redirectCount,
      error_count: errorCount,
      timeout_count: timeoutCount,
      fixed_count: fixedCount,
      status: 'completed',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Validation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Priority brands with high TDS coverage but potentially unparsed specs
const PRIORITY_BRANDS = [
  'polymaker', 'esun', 'eryone', 'fiberlogy', 'formfutura', 'fillamentum',
  'hatchbox', 'atomic-filament', 'proto-pasta', 'prusament', 'push-plastic',
  'extrudr', 'sunlu', 'ultimaker', 'azurefilm', 'colorfabb', 'recreus',
  'ninjatek', 'matter3d', 'ic3d-printers', 'fusion-filaments', 'yousu',
  'voxelpla', 'spectrum-filaments'
];

// All brands from the Brand Sync Manager (use exact database slugs)
const SYNC_MANAGER_BRANDS = [
  '3d-fuel', '3dhojor', '3dxtech', 'amolen', 'anycubic', 'atomic-filament', 'azurefilm', 'bambu-lab',
  'colorfabb', 'creality', 'duramic-3d', 'elegoo', 'eryone', 'esun', 'extrudr',
  'fiberlogy', 'fillamentum', 'formfutura', 'fusion-filaments',
  'geeetech', 'gizmo-dorks', 'hatchbox', 'ic3d-printers', 'kingroon', 'matter3d',
  'ninjatek', 'numakers', 'overture', 'paramount-3d', 'polymaker',
  'proto-pasta', 'prusament', 'push-plastic', 'recreus', 'siraya-tech',
  'sovol', 'spectrum-filaments', 'sunlu', 'treed-filaments', 'ultimaker', 'voxelpla',
  'yousu', 'ziro'
];

interface BrandStats {
  brandSlug: string;
  brandName: string;
  totalWithTds: number;
  needsParsing: number;
}

interface BatchResult {
  brandSlug: string;
  brandName: string;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  status: 'completed' | 'timeout' | 'error' | 'skipped';
  message?: string;
}

// Safely call parse-filament-tds with timeout and error handling
async function callParseTdsWithTimeout(
  supabaseUrl: string,
  authHeader: string,
  brandSlug: string,
  limit: number,
  dryRun: boolean,
  force: boolean,
  timeoutMs: number = 55000
): Promise<{ success: boolean; data?: any; error?: string; timedOut?: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/parse-filament-tds`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand_slug: brandSlug,
        limit,
        dry_run: dryRun,
        force,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check HTTP status first
    if (!response.ok) {
      console.warn(`Brand ${brandSlug} returned HTTP ${response.status}`);
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };
    }

    // Get response text first to validate
    const text = await response.text();
    
    // Check if response is empty
    if (!text || text.trim() === '') {
      console.warn(`Brand ${brandSlug} returned empty response`);
      return { success: false, error: 'Empty response' };
    }

    // Check if response is HTML (error page)
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html') || text.startsWith('<')) {
      console.warn(`Brand ${brandSlug} returned HTML instead of JSON`);
      return { success: false, error: 'Received HTML error page' };
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (parseErr) {
      console.error(`Brand ${brandSlug} JSON parse failed:`, text.substring(0, 200));
      return { success: false, error: 'Invalid JSON response' };
    }

  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err instanceof Error && err.name === 'AbortError') {
      console.log(`Brand ${brandSlug} timed out after ${timeoutMs}ms`);
      return { success: false, error: 'Request timeout', timedOut: true };
    }
    
    console.error(`Brand ${brandSlug} fetch error:`, err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown fetch error' 
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const { data: isAdmin } = await authClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json();
    const { 
      mode = 'audit', // 'audit' | 'parse' | 'parse-priority' | 'parse-brand' | 'parse-sync-manager' | 'status'
      brandSlug = null,
      brandSlugs = null, // Array of brand slugs to process
      syncLogId = null, // For status checks
      limit = 5, // per brand - reduced to prevent timeouts
      dryRun = true,
      force = false,
    } = body;

    // STATUS MODE: Check progress of a running batch parse
    if (mode === 'status' && syncLogId) {
      const { data: logEntry } = await supabase
        .from('brand_sync_logs')
        .select('*')
        .eq('id', syncLogId)
        .single();
      
      return new Response(JSON.stringify({
        success: true,
        mode: 'status',
        syncLog: logEntry,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // AUDIT MODE: Get stats on what needs parsing
    if (mode === 'audit') {
      console.log('Running TDS parsing audit...');
      
      // Get all brands with TDS coverage
      const { data: brands } = await supabase
        .from('automated_brands')
        .select('id, brand_slug, display_name')
        .eq('is_visible', true);

      if (!brands) {
        return new Response(JSON.stringify({ error: 'Failed to fetch brands' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const brandStats: BrandStats[] = [];

      for (const brand of brands) {
        // Count filaments with TDS URLs
        const { count: totalWithTds } = await supabase
          .from('filaments')
          .select('id', { count: 'exact', head: true })
          .eq('brand_id', brand.id)
          .not('tds_url', 'is', null);

        // Count filaments with TDS but missing key specs
        const { count: needsParsing } = await supabase
          .from('filaments')
          .select('id', { count: 'exact', head: true })
          .eq('brand_id', brand.id)
          .not('tds_url', 'is', null)
          .or('density_g_cm3.is.null,tensile_strength_xy_mpa.is.null,drying_temp_c.is.null');

        if ((totalWithTds || 0) > 0) {
          brandStats.push({
            brandSlug: brand.brand_slug,
            brandName: brand.display_name,
            totalWithTds: totalWithTds || 0,
            needsParsing: needsParsing || 0,
          });
        }
      }

      // Sort by needsParsing descending
      brandStats.sort((a, b) => b.needsParsing - a.needsParsing);

      const totalNeedsParsing = brandStats.reduce((sum, b) => sum + b.needsParsing, 0);
      const totalWithTds = brandStats.reduce((sum, b) => sum + b.totalWithTds, 0);

      return new Response(JSON.stringify({
        success: true,
        mode: 'audit',
        summary: {
          totalBrandsWithTds: brandStats.length,
          totalFilamentsWithTds: totalWithTds,
          totalNeedsParsing,
          parsingCoverage: totalWithTds > 0 
            ? Math.round(((totalWithTds - totalNeedsParsing) / totalWithTds) * 100)
            : 0,
        },
        priorityBrands: brandStats
          .filter(b => PRIORITY_BRANDS.includes(b.brandSlug))
          .slice(0, 15),
        allBrands: brandStats,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PARSE-BRAND MODE: Parse a single brand
    if (mode === 'parse-brand' && brandSlug) {
      console.log(`Parsing TDS for brand: ${brandSlug}, limit: ${limit}`);
      
      const result = await callParseTdsWithTimeout(
        supabaseUrl,
        authHeader,
        brandSlug,
        limit,
        dryRun,
        force,
        55000
      );

      if (!result.success) {
        return new Response(JSON.stringify({
          success: false,
          mode: 'parse-brand',
          brandSlug,
          error: result.error,
          timedOut: result.timedOut,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        mode: 'parse-brand',
        brandSlug,
        ...result.data,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PARSE-PRIORITY, PARSE-SYNC-MANAGER, or PARSE MODE: Parse brands synchronously with robust error handling
    if (mode === 'parse-priority' || mode === 'parse' || mode === 'parse-sync-manager' || (Array.isArray(brandSlugs) && brandSlugs.length > 0)) {
      const modeLabel = mode === 'parse-priority' 
        ? 'priority' 
        : mode === 'parse-sync-manager' 
          ? 'sync-manager' 
          : brandSlugs?.length 
            ? 'custom' 
            : 'all';
      console.log(`Batch parsing TDS for ${modeLabel} brands`);
      
      // Get brands to process
      const { data: brands } = await supabase
        .from('automated_brands')
        .select('id, brand_slug, display_name')
        .eq('is_visible', true);

      if (!brands) {
        return new Response(JSON.stringify({ error: 'Failed to fetch brands' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Filter based on mode
      let brandsToProcess = brands;
      if (Array.isArray(brandSlugs) && brandSlugs.length > 0) {
        brandsToProcess = brands.filter(b => brandSlugs.includes(b.brand_slug));
      } else if (mode === 'parse-sync-manager') {
        brandsToProcess = brands.filter(b => SYNC_MANAGER_BRANDS.includes(b.brand_slug));
      } else if (mode === 'parse-priority') {
        brandsToProcess = brands.filter(b => PRIORITY_BRANDS.includes(b.brand_slug));
      }

      // Create a sync log entry for tracking
      let logId: string | null = null;
      if (!dryRun) {
        const { data: logEntry } = await supabase
          .from('brand_sync_logs')
          .insert({
            brand_slug: `batch-tds-${modeLabel}`,
            sync_type: 'incremental',
            status: 'running',
            started_at: new Date().toISOString(),
            notes: `Batch TDS parsing for ${brandsToProcess.length} brands`,
          })
          .select('id')
          .single();
        if (logEntry) logId = logEntry.id;
      }

      // Process brands synchronously with robust error handling
      const results: BatchResult[] = [];
      let totalProcessed = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;
      let totalTimedOut = 0;
      let currentBrandIndex = 0;

      for (const brand of brandsToProcess) {
        currentBrandIndex++;
        
        // Update progress in sync log
        if (logId && !dryRun) {
          await supabase
            .from('brand_sync_logs')
            .update({
              products_processed: {
                current_brand: brand.brand_slug,
                brands_completed: currentBrandIndex - 1,
                total_brands: brandsToProcess.length,
                total_processed: totalProcessed,
                total_successful: totalSuccessful,
                total_failed: totalFailed,
                total_timed_out: totalTimedOut,
              },
            })
            .eq('id', logId);
        }
        
        // Check if this brand has filaments needing parsing
        const { count: needsParsing } = await supabase
          .from('filaments')
          .select('id', { count: 'exact', head: true })
          .eq('brand_id', brand.id)
          .not('tds_url', 'is', null)
          .or('density_g_cm3.is.null,tensile_strength_xy_mpa.is.null,drying_temp_c.is.null');

        if (!needsParsing || needsParsing === 0) {
          results.push({
            brandSlug: brand.brand_slug,
            brandName: brand.display_name,
            processed: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            status: 'skipped',
            message: 'No filaments need parsing',
          });
          continue;
        }

        console.log(`Processing ${brand.brand_slug} (${needsParsing} need parsing)`);

        // Call parse-filament-tds with timeout and error handling
        const result = await callParseTdsWithTimeout(
          supabaseUrl,
          authHeader,
          brand.brand_slug,
          limit,
          dryRun,
          force,
          55000 // 55 second timeout per brand
        );

        if (!result.success) {
          // Handle failed/timeout case gracefully
          if (result.timedOut) {
            totalTimedOut++;
            results.push({
              brandSlug: brand.brand_slug,
              brandName: brand.display_name,
              processed: 0,
              successful: 0,
              failed: 0,
              skipped: 0,
              status: 'timeout',
              message: result.error,
            });
          } else {
            totalFailed++;
            results.push({
              brandSlug: brand.brand_slug,
              brandName: brand.display_name,
              processed: 0,
              successful: 0,
              failed: 1,
              skipped: 0,
              status: 'error',
              message: result.error,
            });
          }
        } else {
          // Success case
          const data = result.data;
          results.push({
            brandSlug: brand.brand_slug,
            brandName: brand.display_name,
            processed: data.processed || 0,
            successful: data.successful || 0,
            failed: data.failed || 0,
            skipped: (data.processed || 0) - (data.successful || 0) - (data.failed || 0),
            status: 'completed',
          });

          totalProcessed += data.processed || 0;
          totalSuccessful += data.successful || 0;
          totalFailed += data.failed || 0;
        }

        // Rate limit between brands - 2 seconds to be safe
        await new Promise(r => setTimeout(r, 2000));
      }

      // Complete the sync log
      if (logId && !dryRun) {
        await supabase
          .from('brand_sync_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            products_updated: totalSuccessful,
            products_failed: totalFailed,
            products_discovered: totalProcessed,
            success_details: {
              brandsProcessed: results.filter(r => r.status === 'completed').length,
              brandsTimedOut: totalTimedOut,
              totalProcessed,
              totalSuccessful,
              totalFailed,
              results,
            },
          })
          .eq('id', logId);
      }

      console.log(`Batch parse complete: ${totalSuccessful} successful, ${totalFailed} failed, ${totalTimedOut} timed out`);

      return new Response(JSON.stringify({
        success: true,
        mode,
        syncLogId: logId,
        dryRun,
        summary: {
          brandsProcessed: results.filter(r => r.status === 'completed').length,
          brandsTimedOut: totalTimedOut,
          brandsSkipped: results.filter(r => r.status === 'skipped').length,
          brandsErrored: results.filter(r => r.status === 'error').length,
          totalBrands: brandsToProcess.length,
          totalProcessed,
          totalSuccessful,
          totalFailed,
        },
        results,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid mode. Use: audit, parse, parse-priority, parse-brand, or status' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in batch-parse-all-tds:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

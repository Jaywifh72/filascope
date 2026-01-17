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
  syncLogId?: string;
  filamentCount: number;
  status: 'started' | 'skipped' | 'error';
  message?: string;
}

// Fire-and-forget call to parse-filament-tds - returns immediately
async function triggerBrandParsing(
  supabaseUrl: string,
  authHeader: string,
  brandSlug: string,
  limit: number,
  dryRun: boolean,
  force: boolean
): Promise<{ success: boolean; syncLogId?: string; message?: string; filamentCount?: number }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for trigger

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
        background: true, // Enable background processing
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      console.warn(`Brand ${brandSlug} trigger failed with HTTP ${response.status}: ${text.substring(0, 100)}`);
      return { success: false, message: `HTTP ${response.status}` };
    }

    const text = await response.text();
    
    if (!text || text.trim() === '') {
      return { success: false, message: 'Empty response' };
    }

    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html') || text.startsWith('<')) {
      return { success: false, message: 'HTML error response' };
    }

    try {
      const data = JSON.parse(text);
      
      // Check if it's a "no filaments need parsing" response
      if (data.message === 'No filaments need parsing') {
        return { success: true, message: 'No filaments need parsing', filamentCount: 0 };
      }
      
      return { 
        success: true, 
        syncLogId: data.syncLogId,
        message: data.message || 'Background processing started',
        filamentCount: data.processed || 0,
      };
    } catch (parseErr) {
      console.error(`Brand ${brandSlug} JSON parse failed:`, text.substring(0, 100));
      return { success: false, message: 'Invalid JSON' };
    }

  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      // Timeout is OK for fire-and-forget - the background process may still be running
      console.log(`Brand ${brandSlug} trigger timed out - may still be processing in background`);
      return { success: true, message: 'Triggered (response timeout)', filamentCount: -1 };
    }
    
    console.error(`Brand ${brandSlug} trigger error:`, err);
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Unknown error' 
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
      limit = 25, // per brand - higher limit now that we use background processing
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

    // PARSE-BRAND MODE: Trigger parsing for a single brand
    if (mode === 'parse-brand' && brandSlug) {
      console.log(`Triggering TDS parsing for brand: ${brandSlug}, limit: ${limit}`);
      
      const result = await triggerBrandParsing(
        supabaseUrl,
        authHeader,
        brandSlug,
        limit,
        dryRun,
        force
      );

      return new Response(JSON.stringify({
        success: result.success,
        mode: 'parse-brand',
        brandSlug,
        syncLogId: result.syncLogId,
        message: result.message,
        filamentCount: result.filamentCount,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PARSE-PRIORITY, PARSE-SYNC-MANAGER, or PARSE MODE: Trigger all brands in fire-and-forget mode
    if (mode === 'parse-priority' || mode === 'parse' || mode === 'parse-sync-manager' || (Array.isArray(brandSlugs) && brandSlugs.length > 0)) {
      const modeLabel = mode === 'parse-priority' 
        ? 'priority' 
        : mode === 'parse-sync-manager' 
          ? 'sync-manager' 
          : brandSlugs?.length 
            ? 'custom' 
            : 'all';
      console.log(`Batch triggering TDS parsing for ${modeLabel} brands`);
      
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

      // Create a master sync log for tracking the batch
      const { data: masterLog } = await supabase
        .from('brand_sync_logs')
        .insert({
          brand_slug: `batch-tds-${modeLabel}`,
          sync_type: 'batch_tds_parsing',
          status: 'running',
          started_at: new Date().toISOString(),
          notes: `Triggering TDS parsing for ${brandsToProcess.length} brands`,
        })
        .select('id')
        .single();

      const masterLogId = masterLog?.id;

      // Trigger all brands - fire and forget
      const results: BatchResult[] = [];
      let brandsStarted = 0;
      let brandsSkipped = 0;
      let brandsErrored = 0;
      let totalFilaments = 0;

      for (const brand of brandsToProcess) {
        console.log(`Triggering ${brand.brand_slug}...`);
        
        const result = await triggerBrandParsing(
          supabaseUrl,
          authHeader,
          brand.brand_slug,
          limit,
          dryRun,
          force
        );

        if (result.success) {
          if (result.filamentCount === 0) {
            // No filaments need parsing
            results.push({
              brandSlug: brand.brand_slug,
              brandName: brand.display_name,
              filamentCount: 0,
              status: 'skipped',
              message: 'No filaments need parsing',
            });
            brandsSkipped++;
          } else {
            results.push({
              brandSlug: brand.brand_slug,
              brandName: brand.display_name,
              syncLogId: result.syncLogId,
              filamentCount: result.filamentCount || 0,
              status: 'started',
              message: result.message,
            });
            brandsStarted++;
            totalFilaments += result.filamentCount || 0;
          }
        } else {
          results.push({
            brandSlug: brand.brand_slug,
            brandName: brand.display_name,
            filamentCount: 0,
            status: 'error',
            message: result.message,
          });
          brandsErrored++;
        }

        // Small delay between triggers to avoid overwhelming the system
        await new Promise(r => setTimeout(r, 500));
      }

      // Update master sync log
      if (masterLogId) {
        await supabase
          .from('brand_sync_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            products_discovered: totalFilaments,
            success_details: {
              brandsStarted,
              brandsSkipped,
              brandsErrored,
              totalFilaments,
              results,
            },
            notes: `Triggered ${brandsStarted} brands, ${brandsSkipped} skipped, ${brandsErrored} errors`,
          })
          .eq('id', masterLogId);
      }

      console.log(`Batch trigger complete: ${brandsStarted} started, ${brandsSkipped} skipped, ${brandsErrored} errors`);

      return new Response(JSON.stringify({
        success: true,
        mode,
        masterSyncLogId: masterLogId,
        dryRun,
        summary: {
          brandsTriggered: brandsStarted,
          brandsSkipped,
          brandsErrored,
          totalBrands: brandsToProcess.length,
          totalFilaments,
        },
        results,
        message: `Triggered parsing for ${brandsStarted} brands (${totalFilaments} filaments). Check individual sync logs for progress.`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid mode. Use: audit, parse, parse-priority, parse-brand, parse-sync-manager, or status' 
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

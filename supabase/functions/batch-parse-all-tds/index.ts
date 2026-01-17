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
      limit = 10, // per brand
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
      
      // Call the existing parse-filament-tds function with brand_slug
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
      });

      const result = await response.json();

      return new Response(JSON.stringify({
        success: true,
        mode: 'parse-brand',
        brandSlug,
        ...result,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PARSE-PRIORITY, PARSE-SYNC-MANAGER, or PARSE MODE: Parse brands synchronously
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

      // Process brands synchronously (not in background)
      const results: BatchResult[] = [];
      let totalProcessed = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;
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
          });
          continue;
        }

        console.log(`Processing ${brand.brand_slug} (${needsParsing} need parsing)`);

        try {
          // Call parse-filament-tds for this brand
          const response = await fetch(`${supabaseUrl}/functions/v1/parse-filament-tds`, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              brand_slug: brand.brand_slug,
              limit,
              dry_run: dryRun,
              force,
            }),
          });

          const result = await response.json();

          results.push({
            brandSlug: brand.brand_slug,
            brandName: brand.display_name,
            processed: result.processed || 0,
            successful: result.successful || 0,
            failed: result.failed || 0,
            skipped: (result.processed || 0) - (result.successful || 0) - (result.failed || 0),
          });

          totalProcessed += result.processed || 0;
          totalSuccessful += result.successful || 0;
          totalFailed += result.failed || 0;

          // Rate limit between brands
          await new Promise(r => setTimeout(r, 1000));

        } catch (err) {
          console.error(`Error processing ${brand.brand_slug}:`, err);
          results.push({
            brandSlug: brand.brand_slug,
            brandName: brand.display_name,
            processed: 0,
            successful: 0,
            failed: 1,
            skipped: 0,
          });
          totalFailed++;
        }
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
              brandsProcessed: results.filter(r => r.processed > 0).length,
              totalProcessed,
              totalSuccessful,
              totalFailed,
              results,
            },
          })
          .eq('id', logId);
      }

      console.log(`Batch parse complete: ${totalSuccessful} successful, ${totalFailed} failed`);

      return new Response(JSON.stringify({
        success: true,
        mode,
        syncLogId: logId,
        dryRun,
        summary: {
          brandsProcessed: results.filter(r => r.processed > 0).length,
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

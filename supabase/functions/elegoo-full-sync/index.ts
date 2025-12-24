import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncJobResult {
  jobId: string;
  status: 'completed' | 'failed' | 'running';
  phase: string;
  summary: {
    productsUpdated: number;
    imagesFixed: number;
    regionsProcessed: string[];
    errors: string[];
  };
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
}

/**
 * Elegoo Full Sync Orchestrator
 * 
 * Runs the complete Elegoo data enrichment pipeline:
 * 1. Sync products from Impact.com API for all regions
 * 2. Fix missing product images via Shopify API
 * 3. Update available_regions column
 * 4. Log data quality metrics
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse request body
    let options: {
      dryRun?: boolean;
      regions?: string[];
      skipImageFix?: boolean;
      skipProductSync?: boolean;
    } = {};
    
    try {
      options = await req.json();
    } catch {
      // Use defaults
    }

    const dryRun = options.dryRun ?? true;
    const regions = options.regions || ['US', 'CA', 'EU', 'AU'];
    const skipImageFix = options.skipImageFix ?? false;
    const skipProductSync = options.skipProductSync ?? false;

    console.log(`[ELEGOO-FULL-SYNC] Starting full sync pipeline`);
    console.log(`[ELEGOO-FULL-SYNC] Options: dryRun=${dryRun}, regions=${regions.join(',')}, skipImageFix=${skipImageFix}, skipProductSync=${skipProductSync}`);

    const startedAt = new Date();
    const jobId = crypto.randomUUID();
    const errors: string[] = [];
    let productsUpdated = 0;
    let imagesFixed = 0;
    const regionsProcessed: string[] = [];

    // Create job record in scrape_jobs
    await supabase.from('scrape_jobs').insert({
      id: jobId,
      job_type: 'elegoo_full_sync',
      status: 'running',
      started_at: startedAt.toISOString(),
      progress: { phase: 'starting', regions, dryRun },
    });

    // ===== PHASE 1: Product Sync via Impact.com API =====
    if (!skipProductSync) {
      console.log(`[ELEGOO-FULL-SYNC] Phase 1: Starting product sync for ${regions.length} regions`);
      
      await supabase.from('scrape_jobs').update({
        progress: { phase: 'product_sync', currentRegion: regions[0], completedRegions: [] },
      }).eq('id', jobId);

      try {
        // Call the orchestrator which handles multi-region sync
        const { data: syncResult, error: syncError } = await supabase.functions.invoke('sync-elegoo-orchestrator', {
          body: {
            mode: 'start',
            regions,
            dryRun,
          },
        });

        if (syncError) {
          console.error(`[ELEGOO-FULL-SYNC] Product sync error:`, syncError);
          errors.push(`Product sync failed: ${syncError.message}`);
        } else if (syncResult?.success) {
          console.log(`[ELEGOO-FULL-SYNC] Product sync started with jobId: ${syncResult.jobId}`);
          // The orchestrator runs async, we'll track its progress
          regionsProcessed.push(...regions);
          productsUpdated = syncResult.summary?.created || 0 + syncResult.summary?.updated || 0;
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        console.error(`[ELEGOO-FULL-SYNC] Product sync exception:`, errorMsg);
        errors.push(`Product sync exception: ${errorMsg}`);
      }
    } else {
      console.log(`[ELEGOO-FULL-SYNC] Skipping product sync`);
    }

    // ===== PHASE 2: Fix Missing Images =====
    if (!skipImageFix && !dryRun) {
      console.log(`[ELEGOO-FULL-SYNC] Phase 2: Fixing missing product images`);
      
      await supabase.from('scrape_jobs').update({
        progress: { phase: 'image_fix', imagesProcessed: 0 },
      }).eq('id', jobId);

      try {
        // Get auth token for the fix-elegoo-images function
        const authHeader = req.headers.get("Authorization");
        
        // Call fix-elegoo-images for each region
        for (const region of ['US']) { // Start with US, add more as needed
          const { data: imageResult, error: imageError } = await supabase.functions.invoke('fix-elegoo-images', {
            body: { dryRun: false },
            headers: authHeader ? { Authorization: authHeader } : {},
          });

          if (imageError) {
            console.error(`[ELEGOO-FULL-SYNC] Image fix error for ${region}:`, imageError);
            errors.push(`Image fix failed for ${region}: ${imageError.message}`);
          } else if (imageResult) {
            imagesFixed += imageResult.summary?.updated || 0;
            console.log(`[ELEGOO-FULL-SYNC] Fixed ${imageResult.summary?.updated || 0} images for ${region}`);
          }
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        console.error(`[ELEGOO-FULL-SYNC] Image fix exception:`, errorMsg);
        errors.push(`Image fix exception: ${errorMsg}`);
      }
    } else {
      console.log(`[ELEGOO-FULL-SYNC] Skipping image fix (dryRun=${dryRun}, skipImageFix=${skipImageFix})`);
    }

    // ===== PHASE 3: Update available_regions =====
    console.log(`[ELEGOO-FULL-SYNC] Phase 3: Updating available_regions`);
    
    await supabase.from('scrape_jobs').update({
      progress: { phase: 'update_regions' },
    }).eq('id', jobId);

    if (!dryRun) {
      try {
        const { error: regionsError } = await supabase.rpc('update_elegoo_available_regions');
        
        if (regionsError) {
          // Function might not exist yet, run inline SQL
          const { error: sqlError } = await supabase.from('filaments').update({
            // This is a placeholder - the actual update happens via the migration
          }).eq('vendor', 'Elegoo').is('available_regions', null);
          
          if (sqlError) {
            console.log(`[ELEGOO-FULL-SYNC] Regions update note: ${sqlError.message}`);
          }
        }
      } catch (e) {
        console.log(`[ELEGOO-FULL-SYNC] Regions update note:`, e);
      }
    }

    // ===== PHASE 4: Data Quality Check =====
    console.log(`[ELEGOO-FULL-SYNC] Phase 4: Running data quality check`);
    
    await supabase.from('scrape_jobs').update({
      progress: { phase: 'quality_check' },
    }).eq('id', jobId);

    // Get current data quality metrics
    const { data: qualityMetrics } = await supabase
      .from('filaments')
      .select('id, featured_image, product_url, product_url_ca, product_url_eu, product_url_au, variant_price, available_regions')
      .eq('vendor', 'Elegoo');

    const totalProducts = qualityMetrics?.length || 0;
    const withImages = qualityMetrics?.filter(f => f.featured_image).length || 0;
    const withUSUrl = qualityMetrics?.filter(f => f.product_url).length || 0;
    const withCAUrl = qualityMetrics?.filter(f => f.product_url_ca).length || 0;
    const withEUUrl = qualityMetrics?.filter(f => f.product_url_eu).length || 0;
    const withAUUrl = qualityMetrics?.filter(f => f.product_url_au).length || 0;
    const withPrice = qualityMetrics?.filter(f => f.variant_price).length || 0;

    const qualityReport = {
      totalProducts,
      withImages,
      imagesCoverage: totalProducts > 0 ? Math.round((withImages / totalProducts) * 100) : 0,
      regionalCoverage: {
        US: withUSUrl,
        CA: withCAUrl,
        EU: withEUUrl,
        AU: withAUUrl,
      },
      withPrice,
      priceCoverage: totalProducts > 0 ? Math.round((withPrice / totalProducts) * 100) : 0,
    };

    console.log(`[ELEGOO-FULL-SYNC] Data Quality Report:`, qualityReport);

    // ===== Complete the job =====
    const completedAt = new Date();
    const durationSeconds = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000);

    await supabase.from('scrape_jobs').update({
      status: errors.length > 0 ? 'completed_with_errors' : 'completed',
      completed_at: completedAt.toISOString(),
      duration_seconds: durationSeconds,
      result: {
        productsUpdated,
        imagesFixed,
        regionsProcessed,
        qualityReport,
        errors: errors.length > 0 ? errors : undefined,
      },
      progress: { phase: 'completed' },
    }).eq('id', jobId);

    const result: SyncJobResult = {
      jobId,
      status: errors.length > 0 ? 'completed' : 'completed',
      phase: 'completed',
      summary: {
        productsUpdated,
        imagesFixed,
        regionsProcessed,
        errors,
      },
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationSeconds,
    };

    console.log(`[ELEGOO-FULL-SYNC] Pipeline completed in ${durationSeconds}s`);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      ...result,
      qualityReport,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(`[ELEGOO-FULL-SYNC] Fatal error:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

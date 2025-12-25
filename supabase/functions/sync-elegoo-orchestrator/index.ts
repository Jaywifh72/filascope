import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Orchestrator for Elegoo product sync - processes regions sequentially
 * and tracks progress in the scrape_jobs table for live updates.
 * 
 * Enhanced to handle the full pipeline:
 * 1. Sync products from Impact.com for each region
 * 2. Fix missing images via Shopify scraping
 * 3. Run quality check and update job results
 * 
 * This allows the sync to continue even if the browser disconnects,
 * and the progress can be viewed when returning to the page.
 */

interface SyncState {
  jobId: string;
  regions: string[];
  dryRun: boolean;
  materialFilter?: string;
  excludedCatalogIds?: string[];
  currentIndex: number;
  // Enhanced options for full pipeline
  runImageFix: boolean;
  runQualityCheck: boolean;
  jobType: string;
  phase: 'regions' | 'images' | 'quality' | 'completed';
  results: {
    created: number;
    updated: number;
    skipped: number;
    filtered: number;
    errors: number;
    total: number;
    imagesFixed: number;
    imagesFailed: number;
    regionResults: Record<string, { created: number; updated: number; errors: number }>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const mode = body.mode || 'start';

    if (mode === 'start') {
      // Default to ALL regions for comprehensive sync
      const { 
        regions = ['US', 'CA', 'EU', 'UK', 'AU', 'JP'], 
        dryRun = false, 
        materialFilter, 
        excludedCatalogIds,
        // New options for full pipeline
        runImageFix = true,
        runQualityCheck = true,
        jobType = 'elegoo_sync',
      } = body;

      console.log(`[ELEGOO-ORCHESTRATOR] Starting sync for regions: ${regions.join(', ')}`);
      console.log(`[ELEGOO-ORCHESTRATOR] Options: dryRun=${dryRun}, runImageFix=${runImageFix}, runQualityCheck=${runQualityCheck}`);
      console.log(`[ELEGOO-ORCHESTRATOR] Job type: ${jobType}`);

      // Create job record with the specified job type
      const { data: job, error: jobError } = await supabase
        .from('scrape_jobs')
        .insert({
          job_type: jobType,
          status: 'running',
          materials: regions,
          products: [],
          dry_run: dryRun,
          started_at: new Date().toISOString(),
          progress: {
            phase: 'regions',
            currentRegion: regions[0],
            completedRegions: [],
            totalRegions: regions.length,
            allRegions: regions,
            regionsProcessed: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            filtered: 0,
            errors: 0,
            total: 0,
            runImageFix,
            runQualityCheck,
          },
        })
        .select()
        .single();

      if (jobError || !job) {
        throw new Error(`Failed to create job: ${jobError?.message}`);
      }

      console.log(`[ELEGOO-ORCHESTRATOR] Created job ${job.id} for ${regions.length} regions`);

      // Store sync state
      const syncState: SyncState = {
        jobId: job.id,
        regions,
        dryRun,
        materialFilter,
        excludedCatalogIds,
        currentIndex: 0,
        runImageFix: runImageFix && !dryRun,
        runQualityCheck,
        jobType,
        phase: 'regions',
        results: {
          created: 0,
          updated: 0,
          skipped: 0,
          filtered: 0,
          errors: 0,
          total: 0,
          imagesFixed: 0,
          imagesFailed: 0,
          regionResults: {},
        },
      };

      // Start processing regions in background
      EdgeRuntime.waitUntil(processNextRegion(supabase, syncState));

      return new Response(JSON.stringify({
        success: true,
        jobId: job.id,
        message: `Started sync for ${regions.length} region(s): ${regions.join(', ')}`,
        totalRegions: regions.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (mode === 'continue') {
      // Continue processing from a saved state
      const { syncState } = body as { syncState: SyncState };

      if (!syncState) {
        throw new Error('Missing syncState for continue mode');
      }

      console.log(`[ELEGOO-ORCHESTRATOR] Continuing job ${syncState.jobId}, phase: ${syncState.phase}`);

      EdgeRuntime.waitUntil(processNextRegion(supabase, syncState));

      return new Response(JSON.stringify({
        success: true,
        message: 'Continuing sync',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: `Unknown mode: ${mode}`,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ELEGOO-ORCHESTRATOR] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Process a single region and queue the next one, or move to next phase
 */
async function processNextRegion(supabase: any, state: SyncState): Promise<void> {
  const { jobId, regions, currentIndex, dryRun, materialFilter, excludedCatalogIds, phase } = state;

  try {
    // Handle different phases
    if (phase === 'regions') {
      await processRegionPhase(supabase, state);
    } else if (phase === 'images') {
      await processImagePhase(supabase, state);
    } else if (phase === 'quality') {
      await processQualityPhase(supabase, state);
    } else {
      // Completed
      await completeJob(supabase, state);
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[ELEGOO-ORCHESTRATOR] Error in phase ${phase}:`, error);
    state.results.errors++;

    // Try to continue with next phase/region
    if (phase === 'regions' && state.currentIndex < regions.length - 1) {
      state.currentIndex++;
      await queueContinue(supabase, state);
    } else if (phase === 'regions') {
      // Done with regions, move to next phase
      await moveToNextPhase(supabase, state);
    } else {
      // Complete with error
      await completeJob(supabase, state, errorMsg);
    }
  }
}

/**
 * Process a single region
 */
async function processRegionPhase(supabase: any, state: SyncState): Promise<void> {
  const { jobId, regions, currentIndex, dryRun, materialFilter, excludedCatalogIds } = state;

  // Check if we're done with all regions
  if (currentIndex >= regions.length) {
    console.log(`[ELEGOO-ORCHESTRATOR] All ${regions.length} regions processed, moving to next phase`);
    await moveToNextPhase(supabase, state);
    return;
  }

  const region = regions[currentIndex];
  const completedRegions = regions.slice(0, currentIndex);
  
  console.log(`[ELEGOO-ORCHESTRATOR] Processing region ${currentIndex + 1}/${regions.length}: ${region}`);

  // Update job progress - starting region
  await supabase.from('scrape_jobs').update({
    progress: {
      phase: 'regions',
      currentRegion: region,
      completedRegions,
      totalRegions: regions.length,
      allRegions: regions,
      regionsProcessed: currentIndex,
      created: state.results.created,
      updated: state.results.updated,
      skipped: state.results.skipped,
      filtered: state.results.filtered,
      errors: state.results.errors,
      total: state.results.total,
      runImageFix: state.runImageFix,
      runQualityCheck: state.runQualityCheck,
    },
    updated_at: new Date().toISOString(),
  }).eq('id', jobId);

  // Call the sync-elegoo-products function for this region
  const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-elegoo-products`;
  const response = await fetch(syncUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dryRun,
      materialFilter,
      regions: [region],
      excludedCatalogIds,
    }),
  });

  const result = await response.json();

  // Update cumulative results
  if (result.success && result.summary) {
    state.results.created += result.summary.created || 0;
    state.results.updated += result.summary.updated || 0;
    state.results.skipped += result.summary.skipped || 0;
    state.results.filtered += result.summary.filtered || 0;
    state.results.errors += result.summary.errors || 0;
    state.results.total += result.summary.total || 0;
    
    state.results.regionResults[region] = {
      created: result.summary.created || 0,
      updated: result.summary.updated || 0,
      errors: result.summary.errors || 0,
    };
    
    console.log(`[ELEGOO-ORCHESTRATOR] Completed ${region}: created=${result.summary.created}, updated=${result.summary.updated}`);
  } else if (!result.success) {
    state.results.errors++;
    state.results.regionResults[region] = {
      created: 0,
      updated: 0,
      errors: 1,
    };
    console.error(`[ELEGOO-ORCHESTRATOR] Failed to sync ${region}: ${result.error}`);
  }

  // Move to next region
  state.currentIndex++;
  const newCompletedRegions = regions.slice(0, state.currentIndex);

  // Update job progress
  await supabase.from('scrape_jobs').update({
    progress: {
      phase: 'regions',
      currentRegion: state.currentIndex < regions.length ? regions[state.currentIndex] : 'Complete',
      completedRegions: newCompletedRegions,
      totalRegions: regions.length,
      allRegions: regions,
      regionsProcessed: state.currentIndex,
      created: state.results.created,
      updated: state.results.updated,
      skipped: state.results.skipped,
      filtered: state.results.filtered,
      errors: state.results.errors,
      total: state.results.total,
      regionResults: state.results.regionResults,
      runImageFix: state.runImageFix,
      runQualityCheck: state.runQualityCheck,
    },
    updated_at: new Date().toISOString(),
  }).eq('id', jobId);

  // Small delay between regions
  await new Promise(r => setTimeout(r, 500));

  // Queue next region or move to next phase
  if (state.currentIndex < regions.length) {
    await queueContinue(supabase, state);
  } else {
    await moveToNextPhase(supabase, state);
  }
}

/**
 * Process image fix phase
 */
async function processImagePhase(supabase: any, state: SyncState): Promise<void> {
  console.log(`[ELEGOO-ORCHESTRATOR] Starting image fix phase for job ${state.jobId}`);

  // Update progress
  await supabase.from('scrape_jobs').update({
    progress: {
      phase: 'images',
      currentRegion: 'Fixing per-color images...',
      completedRegions: state.regions,
      totalRegions: state.regions.length,
      allRegions: state.regions,
      regionsProcessed: state.regions.length,
      created: state.results.created,
      updated: state.results.updated,
      skipped: state.results.skipped,
      filtered: state.results.filtered,
      errors: state.results.errors,
      total: state.results.total,
      regionResults: state.results.regionResults,
    },
    updated_at: new Date().toISOString(),
  }).eq('id', state.jobId);

  try {
    // Call fix-elegoo-images
    const fixImagesUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/fix-elegoo-images`;
    const response = await fetch(fixImagesUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dryRun: false,
        limit: 500,
      }),
    });

    const result = await response.json();

    if (result.success) {
      state.results.imagesFixed = result.stats?.updated || 0;
      state.results.imagesFailed = result.stats?.failed || 0;
      state.results.regionResults['image_fix'] = {
        created: 0,
        updated: result.stats?.updated || 0,
        errors: result.stats?.failed || 0,
      };
      console.log(`[ELEGOO-ORCHESTRATOR] Image fix completed: ${state.results.imagesFixed} updated, ${state.results.imagesFailed} failed`);
    } else {
      console.error(`[ELEGOO-ORCHESTRATOR] Image fix failed: ${result.error}`);
      state.results.imagesFailed++;
    }
  } catch (err) {
    console.error(`[ELEGOO-ORCHESTRATOR] Image fix error:`, err);
    state.results.imagesFailed++;
  }

  // Move to next phase
  await moveToNextPhase(supabase, state);
}

/**
 * Process quality check phase
 */
async function processQualityPhase(supabase: any, state: SyncState): Promise<void> {
  console.log(`[ELEGOO-ORCHESTRATOR] Starting quality check phase for job ${state.jobId}`);

  // Update progress
  await supabase.from('scrape_jobs').update({
    progress: {
      phase: 'quality',
      currentRegion: 'Running quality check...',
      completedRegions: state.regions,
      totalRegions: state.regions.length,
      allRegions: state.regions,
      regionsProcessed: state.regions.length,
      created: state.results.created,
      updated: state.results.updated,
      imagesFixed: state.results.imagesFixed,
    },
    updated_at: new Date().toISOString(),
  }).eq('id', state.jobId);

  // Gather quality metrics
  const { data: qualityMetrics } = await supabase
    .from('filaments')
    .select('id, featured_image, product_url, product_url_ca, product_url_eu, product_url_au, variant_price, available_regions')
    .eq('vendor', 'Elegoo');

  const totalProducts = qualityMetrics?.length || 0;
  const withImages = qualityMetrics?.filter((f: any) => f.featured_image).length || 0;
  const withUSUrl = qualityMetrics?.filter((f: any) => f.product_url).length || 0;
  const withPrice = qualityMetrics?.filter((f: any) => f.variant_price).length || 0;

  state.results.regionResults['quality_check'] = {
    created: 0,
    updated: 0,
    errors: 0,
  };

  console.log(`[ELEGOO-ORCHESTRATOR] Quality check: ${totalProducts} products, ${withImages} with images, ${withUSUrl} with URLs`);

  // Complete the job
  state.phase = 'completed';
  await completeJob(supabase, state);
}

/**
 * Move to the next phase based on options
 */
async function moveToNextPhase(supabase: any, state: SyncState): Promise<void> {
  console.log(`[ELEGOO-ORCHESTRATOR] Moving from phase ${state.phase} to next phase`);

  if (state.phase === 'regions') {
    if (state.runImageFix) {
      state.phase = 'images';
      await queueContinue(supabase, state);
    } else if (state.runQualityCheck) {
      state.phase = 'quality';
      await queueContinue(supabase, state);
    } else {
      state.phase = 'completed';
      await completeJob(supabase, state);
    }
  } else if (state.phase === 'images') {
    if (state.runQualityCheck) {
      state.phase = 'quality';
      await queueContinue(supabase, state);
    } else {
      state.phase = 'completed';
      await completeJob(supabase, state);
    }
  } else if (state.phase === 'quality') {
    state.phase = 'completed';
    await completeJob(supabase, state);
  }
}

/**
 * Queue continuation via self-invocation
 */
async function queueContinue(supabase: any, state: SyncState): Promise<void> {
  const orchestratorUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-elegoo-orchestrator`;
  
  console.log(`[ELEGOO-ORCHESTRATOR] Queuing continue for phase ${state.phase}`);
  
  await fetch(orchestratorUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'continue',
      syncState: state,
    }),
  });
}

/**
 * Mark job as completed
 */
async function completeJob(supabase: any, state: SyncState, error?: string): Promise<void> {
  const status = error ? 'failed' : 'completed';
  
  console.log(`[ELEGOO-ORCHESTRATOR] Completing job ${state.jobId} with status: ${status}`);
  if (error) console.log(`[ELEGOO-ORCHESTRATOR] Error: ${error}`);
  
  console.log(`[ELEGOO-ORCHESTRATOR] Final results:`);
  console.log(`  - Created: ${state.results.created}`);
  console.log(`  - Updated: ${state.results.updated}`);
  console.log(`  - Errors: ${state.results.errors}`);
  console.log(`  - Images fixed: ${state.results.imagesFixed}`);

  await supabase.from('scrape_jobs').update({
    status,
    completed_at: new Date().toISOString(),
    error: error || null,
    results: {
      created: state.results.created,
      updated: state.results.updated,
      skipped: state.results.skipped,
      filtered: state.results.filtered,
      errors: state.results.errors,
      total: state.results.total,
      imagesFixed: state.results.imagesFixed,
      imagesFailed: state.results.imagesFailed,
      regions: state.regions,
      regionResults: state.results.regionResults,
      dryRun: state.dryRun,
    },
    progress: {
      phase: 'completed',
      currentRegion: null,
      completedRegions: state.regions,
      totalRegions: state.regions.length,
      allRegions: state.regions,
      regionsProcessed: state.regions.length,
      created: state.results.created,
      updated: state.results.updated,
      skipped: state.results.skipped,
      filtered: state.results.filtered,
      errors: state.results.errors,
      total: state.results.total,
      imagesFixed: state.results.imagesFixed,
      imagesFailed: state.results.imagesFailed,
      regionResults: state.results.regionResults,
    },
    updated_at: new Date().toISOString(),
  }).eq('id', state.jobId);
}

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
  results: {
    created: number;
    updated: number;
    skipped: number;
    filtered: number;
    errors: number;
    total: number;
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
      const { regions = ['US'], dryRun = false, materialFilter, excludedCatalogIds } = body;

      console.log(`[ELEGOO-ORCHESTRATOR] Starting sync for regions: ${regions.join(', ')}, dryRun: ${dryRun}`);

      // Create job record
      const { data: job, error: jobError } = await supabase
        .from('scrape_jobs')
        .insert({
          job_type: 'elegoo_sync',
          status: 'running',
          materials: regions,
          products: [],
          dry_run: dryRun,
          started_at: new Date().toISOString(),
          progress: {
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
        results: {
          created: 0,
          updated: 0,
          skipped: 0,
          filtered: 0,
          errors: 0,
          total: 0,
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
 * Process a single region and queue the next one
 */
async function processNextRegion(supabase: any, state: SyncState): Promise<void> {
  const { jobId, regions, currentIndex, dryRun, materialFilter, excludedCatalogIds } = state;

  try {
    // Check if we're done
    if (currentIndex >= regions.length) {
      console.log(`[ELEGOO-ORCHESTRATOR] Job ${jobId} completed - all regions processed`);
      await completeJob(supabase, state);
      return;
    }

    const region = regions[currentIndex];
    const completedRegions = regions.slice(0, currentIndex);
    
    console.log(`[ELEGOO-ORCHESTRATOR] Processing region ${currentIndex + 1}/${regions.length}: ${region}`);

    // Update job progress - starting region
    await supabase.from('scrape_jobs').update({
      progress: {
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
        currentRegion: state.currentIndex < regions.length ? regions[state.currentIndex] : region,
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
      },
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);

    // Small delay between regions
    await new Promise(r => setTimeout(r, 500));

    // Queue next region if there are more
    if (state.currentIndex < regions.length) {
      const orchestratorUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-elegoo-orchestrator`;
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
      console.log(`[ELEGOO-ORCHESTRATOR] Queued next region ${state.currentIndex + 1}/${regions.length}`);
    } else {
      // All regions done
      await completeJob(supabase, state);
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[ELEGOO-ORCHESTRATOR] Error processing region:`, error);
    state.results.errors++;

    // Try to continue with next region
    state.currentIndex++;

    if (state.currentIndex < regions.length) {
      const orchestratorUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-elegoo-orchestrator`;
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
    } else {
      await completeJob(supabase, state, errorMsg);
    }
  }
}

/**
 * Mark job as completed
 */
async function completeJob(supabase: any, state: SyncState, error?: string): Promise<void> {
  const status = error ? 'failed' : 'completed';
  
  console.log(`[ELEGOO-ORCHESTRATOR] Completing job ${state.jobId} with status: ${status}`);
  
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
      regions: state.regions,
      regionResults: state.results.regionResults,
      dryRun: state.dryRun,
    },
    progress: {
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
      regionResults: state.results.regionResults,
    },
    updated_at: new Date().toISOString(),
  }).eq('id', state.jobId);
}

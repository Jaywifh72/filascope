import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Elegoo Full Sync - Thin wrapper that delegates to sync-elegoo-orchestrator
 * 
 * This function simply passes options to the orchestrator and returns its job ID.
 * All actual work (region sync, image fix, quality check) happens in the orchestrator.
 * 
 * This avoids timeout issues by NOT creating a separate job or waiting for phases.
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
    const regions = options.regions || ['US', 'CA', 'EU', 'UK', 'AU', 'JP'];
    const skipImageFix = options.skipImageFix ?? false;
    const skipProductSync = options.skipProductSync ?? false;

    console.log(`[ELEGOO-FULL-SYNC] Starting full sync pipeline (delegating to orchestrator)`);
    console.log(`[ELEGOO-FULL-SYNC] Options: dryRun=${dryRun}, regions=${regions.join(',')}, skipImageFix=${skipImageFix}, skipProductSync=${skipProductSync}`);

    // If only running image fix (skip product sync), handle it directly
    if (skipProductSync && !skipImageFix && !dryRun) {
      console.log(`[ELEGOO-FULL-SYNC] Skip product sync mode - running image fix only`);
      
      // Create a tracking job for image fix only
      const { data: job, error: jobError } = await supabase
        .from('scrape_jobs')
        .insert({
          job_type: 'elegoo_full_sync',
          status: 'running',
          started_at: new Date().toISOString(),
          progress: { 
            phase: 'images',
            currentRegion: 'Fixing images...',
            completedRegions: [],
            totalRegions: 0,
            regionsProcessed: 0,
          },
        })
        .select()
        .single();

      if (jobError) {
        throw new Error(`Failed to create job: ${jobError.message}`);
      }

      // Call image fix function directly
      const { data: imageResult, error: imageError } = await supabase.functions.invoke('fix-elegoo-images', {
        body: { 
          dryRun: false,
          limit: 500,
        },
      });

      // Update job with results
      await supabase.from('scrape_jobs').update({
        status: imageError ? 'failed' : 'completed',
        completed_at: new Date().toISOString(),
        error: imageError?.message || null,
        results: imageResult || null,
        progress: { 
          phase: 'completed',
          imagesUpdated: imageResult?.stats?.updated || 0,
        },
      }).eq('id', job.id);

      return new Response(JSON.stringify({
        success: !imageError,
        jobId: job.id,
        phase: 'completed',
        message: imageError ? `Image fix failed: ${imageError.message}` : 'Image fix completed',
        imagesUpdated: imageResult?.stats?.updated || 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delegate to the orchestrator for full pipeline
    // The orchestrator handles: region sync -> image fix -> quality check
    const { data: orchestratorResult, error: orchestratorError } = await supabase.functions.invoke('sync-elegoo-orchestrator', {
      body: {
        mode: 'start',
        regions,
        dryRun,
        // Pass options for the orchestrator to handle
        runImageFix: !skipImageFix && !dryRun,
        runQualityCheck: true,
        // Use the unified job type so tracking works correctly
        jobType: 'elegoo_full_sync',
      },
    });

    if (orchestratorError) {
      console.error(`[ELEGOO-FULL-SYNC] Orchestrator invocation failed:`, orchestratorError);
      throw new Error(`Failed to start orchestrator: ${orchestratorError.message}`);
    }

    console.log(`[ELEGOO-FULL-SYNC] Orchestrator started successfully`);
    console.log(`[ELEGOO-FULL-SYNC] Job ID: ${orchestratorResult?.jobId}`);
    console.log(`[ELEGOO-FULL-SYNC] Message: ${orchestratorResult?.message}`);

    // Return the orchestrator's job ID for tracking
    return new Response(JSON.stringify({
      success: true,
      jobId: orchestratorResult?.jobId,
      message: orchestratorResult?.message || `Started sync for ${regions.length} regions`,
      phase: 'regions',
      totalRegions: regions.length,
      dryRun,
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

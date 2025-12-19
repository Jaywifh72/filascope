import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration
const STUCK_THRESHOLD_MINUTES = 35; // Jobs with no heartbeat for 35+ minutes are considered stuck
const MAX_JOBS_PER_RUN = 50; // Limit cleanup to prevent timeout

interface CleanupResult {
  jobsChecked: number;
  jobsCleaned: number;
  cleanedJobs: Array<{
    id: string;
    job_type: string;
    lastUpdate: string;
    createdAt: string;
    ageMinutes: number;
  }>;
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`🧹 [CLEANUP] Starting stuck jobs cleanup at ${new Date().toISOString()}`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const result: CleanupResult = {
      jobsChecked: 0,
      jobsCleaned: 0,
      cleanedJobs: [],
      errors: [],
    };

    // Calculate threshold timestamp
    const thresholdTime = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString();
    console.log(`🔍 [CLEANUP] Looking for jobs stuck since before: ${thresholdTime}`);

    // Query for running jobs where updated_at is older than threshold
    const { data: stuckJobs, error: queryError } = await supabase
      .from('scrape_jobs')
      .select('id, job_type, updated_at, created_at, materials, progress')
      .eq('status', 'running')
      .lt('updated_at', thresholdTime)
      .order('updated_at', { ascending: true })
      .limit(MAX_JOBS_PER_RUN);

    if (queryError) {
      console.error(`❌ [CLEANUP] Query error:`, queryError);
      throw new Error(`Failed to query stuck jobs: ${queryError.message}`);
    }

    result.jobsChecked = stuckJobs?.length || 0;
    console.log(`📊 [CLEANUP] Found ${result.jobsChecked} potentially stuck jobs`);

    if (stuckJobs && stuckJobs.length > 0) {
      for (const job of stuckJobs) {
        try {
          const lastUpdate = new Date(job.updated_at);
          const createdAt = new Date(job.created_at);
          const ageMinutes = Math.round((Date.now() - lastUpdate.getTime()) / 60000);
          
          console.log(`🔧 [CLEANUP] Processing stuck job ${job.id}:`);
          console.log(`   - Type: ${job.job_type}`);
          console.log(`   - Materials: ${job.materials?.join(', ') || 'N/A'}`);
          console.log(`   - Last heartbeat: ${ageMinutes} minutes ago`);
          console.log(`   - Progress: ${JSON.stringify(job.progress || {})}`);

          // Mark job as failed with descriptive error
          const { error: updateError } = await supabase
            .from('scrape_jobs')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error: `Auto-cancelled: No heartbeat for ${ageMinutes} minutes (last update: ${job.updated_at}). Job may have been interrupted or timed out.`,
            })
            .eq('id', job.id);

          if (updateError) {
            console.error(`❌ [CLEANUP] Failed to update job ${job.id}:`, updateError);
            result.errors.push(`Failed to update job ${job.id}: ${updateError.message}`);
          } else {
            result.jobsCleaned++;
            result.cleanedJobs.push({
              id: job.id,
              job_type: job.job_type,
              lastUpdate: job.updated_at,
              createdAt: job.created_at,
              ageMinutes,
            });
            console.log(`✅ [CLEANUP] Successfully marked job ${job.id} as failed`);
          }
        } catch (jobError) {
          const errMsg = jobError instanceof Error ? jobError.message : String(jobError);
          console.error(`❌ [CLEANUP] Error processing job ${job.id}:`, errMsg);
          result.errors.push(`Error processing job ${job.id}: ${errMsg}`);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n📊 [CLEANUP] === CLEANUP SUMMARY ===`);
    console.log(`   Jobs checked: ${result.jobsChecked}`);
    console.log(`   Jobs cleaned: ${result.jobsCleaned}`);
    console.log(`   Errors: ${result.errors.length}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`🧹 [CLEANUP] Cleanup completed at ${new Date().toISOString()}`);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      durationMs: duration,
      thresholdMinutes: STUCK_THRESHOLD_MINUTES,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [CLEANUP] Fatal error:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: errMsg,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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

// ============================================================================
// FETCH JOB LOGS FOR AI CONTEXT
// ============================================================================
async function fetchJobLogs(supabase: any, jobId: string, limit: number = 50): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('scrape_job_logs')
      .select('timestamp, level, stage, message, metadata')
      .eq('job_id', jobId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error || !data) return [];
    
    return data.map((log: any) => {
      const meta = log.metadata && Object.keys(log.metadata).length > 0 
        ? ` | ${JSON.stringify(log.metadata)}` 
        : '';
      return `[${log.level.toUpperCase()}][${log.stage || 'general'}] ${log.message}${meta}`;
    }).reverse(); // Return in chronological order
  } catch (e) {
    console.error('[CLEANUP] Failed to fetch logs:', e);
    return [];
  }
}

// ============================================================================
// AI SUMMARY GENERATION FOR STUCK JOBS
// ============================================================================
interface AISummary {
  generatedAt: string;
  model: string;
  summary: {
    headline: string;
    whatWentRight: string[];
    whatWentWrong: string[];
    userImpact: string;
    actionsNeeded: string[];
    healthScore: number;
    lovablePrompt: string | null;
  };
}

async function generateCleanupAISummary(
  supabase: any,
  job: {
    id: string;
    job_type: string;
    materials: string[] | null;
    progress: any;
    updated_at: string;
    created_at: string;
  },
  ageMinutes: number
): Promise<AISummary | null> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

  if (!OPENAI_API_KEY) {
    console.log(`[CLEANUP] OPENAI_API_KEY not configured, skipping AI summary for job ${job.id}`);
    return null;
  }

  try {
    // Fetch debug logs for this job
    const logs = await fetchJobLogs(supabase, job.id, 50);
    const logContext = logs.length > 0 
      ? `\n\nDebug Logs (last ${logs.length} entries from database):\n${logs.join('\n')}`
      : '\n\nNo debug logs available in database for this job.';

    const progress = job.progress || {};
    const prompt = `You are a Senior Web Scraping & Backend Engineering Expert analyzing a STUCK/TIMED-OUT scraping job for a 3D printing filament database (Bambu Lab products).

Job Status: FAILED (Stuck - no heartbeat for ${ageMinutes} minutes)
Job ID: ${job.id}
Job Type: ${job.job_type}
Materials: ${job.materials?.join(', ') || 'Not specified'}
Created At: ${job.created_at}
Last Update: ${job.updated_at}

Progress at time of failure:
- Current Material: ${progress.currentMaterial || 'Unknown'}
- Current Product: ${progress.currentProduct || 'Unknown'}
- Current Region: ${progress.currentRegion || 'Unknown'}
- Current Stage: ${progress.currentStage || 'Unknown'}
- Products Processed: ${progress.productsProcessed || 0}/${progress.totalProducts || '?'}
- Colors Discovered: ${progress.colorsDiscovered || 0}
- Filaments Created: ${progress.filamentsCreated || 0}
- Filaments Updated: ${progress.filamentsUpdated || 0}
- Elapsed Time: ${progress.elapsedMs ? `${Math.round(progress.elapsedMs / 1000)}s` : 'unknown'}
${progress.errors?.length > 0 ? `- Recent Errors: ${progress.errors.slice(-5).join(', ')}` : ''}
${logContext}

This job was stuck during "${progress.currentStage || 'unknown stage'}" while processing "${progress.currentProduct || 'unknown product'}"${progress.currentRegion ? ` in region ${progress.currentRegion}` : ''}.

IMPORTANT: The edge function files are located at:
- supabase/functions/scrape-bambu-pla/index.ts (main scraper)
- supabase/functions/scrape-bambu-orchestrator/index.ts (chunked orchestrator)
- supabase/functions/cleanup-stuck-jobs/index.ts (this cleanup function)

Possible causes of stuck jobs:
1. Firecrawl API hanging (no response timeout)
2. Database connection issues
3. Memory/CPU limits exceeded
4. Network timeouts during regional price scraping
5. Infinite loops in parsing logic
6. Edge function timeout exceeded (max 60s per invocation)
7. Rate limiting from external APIs

Analyze this stuck job and the debug logs to provide:
1. A concise headline summarizing what likely caused the hang
2. What went right (progress made before sticking)
3. What went wrong (analyze the logs for clues about the failure)
4. User impact assessment
5. Generate a detailed "lovablePrompt" for fixing the underlying issue. This prompt MUST:
   - Start with "As a Senior Web Scraping & Backend Expert, I need to fix a job timeout issue in the Bambu Lab scraper."
   - Reference the specific edge function file paths
   - Explain the stuck job context (what stage, what product, what region)
   - Analyze patterns in the debug logs
   - Provide specific code recommendations to prevent future hangs
   - Include timeout handling, heartbeats, error recovery strategies`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a Senior Web Scraping & Backend Engineering Expert. When jobs timeout or get stuck, you analyze the failure and debug logs to provide detailed, actionable prompts to fix the underlying issues. Your prompts should be expert-level, specific, and include code references.' },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_summary',
              description: 'Generate a structured summary of the stuck job with fix prompt',
              parameters: {
                type: 'object',
                properties: {
                  headline: { type: 'string', description: 'One sentence summary of why the job got stuck' },
                  whatWentRight: { type: 'array', items: { type: 'string' }, description: 'Progress made before getting stuck' },
                  whatWentWrong: { type: 'array', items: { type: 'string' }, description: 'Likely causes of the hang based on logs' },
                  userImpact: { type: 'string', description: 'Impact on data freshness and users' },
                  actionsNeeded: { type: 'array', items: { type: 'string' }, description: 'Recommended fixes' },
                  healthScore: { type: 'number', description: 'Score from 0-100 (stuck jobs typically 20-40)' },
                  lovablePrompt: { 
                    type: 'string', 
                    description: 'REQUIRED: Detailed markdown-formatted prompt for Lovable to fix the timeout issue. Include file paths, context about the stuck stage, log analysis, and specific code fixes. Start with "As a Senior Web Scraping & Backend Expert..."'
                  }
                },
                required: ['headline', 'whatWentRight', 'whatWentWrong', 'userImpact', 'actionsNeeded', 'healthScore', 'lovablePrompt'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_summary' } }
      }),
    });

    if (!response.ok) {
      console.error(`[CLEANUP] AI API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error(`[CLEANUP] No tool call in AI response`);
      return null;
    }

    const summary = JSON.parse(toolCall.function.arguments);
    
    console.log(`[CLEANUP] AI summary generated for stuck job ${job.id}: ${summary.headline}`);
    if (summary.lovablePrompt) {
      console.log(`[CLEANUP] Lovable fix prompt generated (${summary.lovablePrompt.length} chars)`);
    }
    
    return {
      generatedAt: new Date().toISOString(),
      model: 'gpt-4o-mini',
      summary: {
        headline: summary.headline,
        whatWentRight: summary.whatWentRight || [],
        whatWentWrong: summary.whatWentWrong || [],
        userImpact: summary.userImpact || '',
        actionsNeeded: summary.actionsNeeded || [],
        healthScore: typeof summary.healthScore === 'number' ? summary.healthScore : 30,
        lovablePrompt: summary.lovablePrompt || null,
      },
    };
  } catch (error) {
    console.error(`[CLEANUP] Failed to generate AI summary for job ${job.id}:`, error);
    return null;
  }
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

          // Generate AI summary for the stuck job (now includes log fetching)
          console.log(`🤖 [CLEANUP] Generating AI summary for stuck job ${job.id}...`);
          const aiSummary = await generateCleanupAISummary(supabase, job, ageMinutes);

          // Mark job as failed with descriptive error and AI summary
          const updateData: Record<string, any> = {
            status: 'failed',
            completed_at: new Date().toISOString(),
            error: `Auto-cancelled: No heartbeat for ${ageMinutes} minutes (last update: ${job.updated_at}). Job may have been interrupted or timed out.`,
          };

          if (aiSummary) {
            updateData.ai_summary = aiSummary;
            console.log(`✅ [CLEANUP] AI summary added for job ${job.id}`);
          }

          const { error: updateError } = await supabase
            .from('scrape_jobs')
            .update(updateData)
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
            console.log(`✅ [CLEANUP] Successfully marked job ${job.id} as failed with AI summary`);
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

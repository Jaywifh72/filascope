import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare EdgeRuntime for Supabase edge functions
declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Orchestrator for Bambu Lab scraping - processes one product at a time
 * to avoid edge function timeouts.
 * 
 * Modes:
 * 1. "start" - Create job, discover products, queue first chunk
 * 2. "chunk" - Process a single product, then queue next chunk
 */

interface ChunkState {
  jobId: string;
  materials: string[];
  dryRun: boolean;
  productQueue: Array<{ material: string; slug: string; name: string }>;
  currentIndex: number;
  results: {
    productsScraped: number;
    colorsDiscovered: number;
    filamentsCreated: number;
    filamentsUpdated: number;
    errors: string[];
    timing: { totalMs: number };
  };
}

// Product definitions - MUST match scrape-bambu-pla
const PRODUCT_CONFIGS: Record<string, Array<{ slug: string; name: string; material: string }>> = {
  'PLA': [
    // Verified from spreadsheet: BAMBUPLA-2.xlsx (15 products)
    { slug: 'pla-basic-filament', name: 'PLA Basic', material: 'PLA' },
    { slug: 'pla-matte', name: 'PLA Matte', material: 'PLA' },
    { slug: 'pla-silk-upgrade', name: 'PLA Silk', material: 'PLA' },
    { slug: 'pla-translucent', name: 'PLA Translucent', material: 'PLA' },
    { slug: 'pla-tough-upgrade', name: 'PLA Tough', material: 'PLA' },
    { slug: 'pla-basic-gradient', name: 'PLA Basic Gradient', material: 'PLA' },
    { slug: 'pla-wood', name: 'PLA Wood', material: 'PLA' },
    { slug: 'pla-marble', name: 'PLA Marble', material: 'PLA' },
    { slug: 'pla-metal', name: 'PLA Metal', material: 'PLA' },
    { slug: 'pla-silk-multi-color', name: 'PLA Silk Multi-color', material: 'PLA' },
    { slug: 'pla-galaxy', name: 'PLA Galaxy', material: 'PLA' },
    { slug: 'pla-glow', name: 'PLA Glow', material: 'PLA' },
    { slug: 'pla-sparkle', name: 'PLA Sparkle', material: 'PLA' },
    { slug: 'pla-cf', name: 'PLA-CF', material: 'PLA-CF' },
    { slug: 'pla-aero', name: 'PLA Aero', material: 'PLA' },
    { slug: 'epla-hs-filament', name: 'ePLA-HS', material: 'PLA' },
    { slug: 'pla-impact-filament', name: 'PLA Impact', material: 'PLA' },
  ],
  'PETG': [
    { slug: 'petg-hf', name: 'PETG HF', material: 'PETG' },
    { slug: 'petg-translucent', name: 'PETG Translucent', material: 'PETG' },
    { slug: 'petg-cf', name: 'PETG-CF', material: 'PETG' },
  ],
  'PET': [
    { slug: 'pet-cf', name: 'PET-CF', material: 'PET' },
  ],
  'ABS': [
    { slug: 'abs-filament', name: 'ABS', material: 'ABS' },  // Fixed: was 'abs'
    { slug: 'abs-gf', name: 'ABS-GF', material: 'ABS' },
  ],
  'ASA': [
    { slug: 'asa-filament', name: 'ASA', material: 'ASA' },  // Fixed: was 'asa'
    { slug: 'asa-aero', name: 'ASA Aero', material: 'ASA' },
    { slug: 'asa-cf', name: 'ASA-CF', material: 'ASA' },
  ],
  'TPU': [
    { slug: 'tpu-95a-hf', name: 'TPU 95A HF', material: 'TPU' },
    { slug: 'tpu-85a-tpu-90a', name: 'TPU 85A / TPU 90A', material: 'TPU' },
    { slug: 'tpu-for-ams', name: 'TPU for AMS', material: 'TPU' },
  ],
  'PC': [
    { slug: 'pc-filament', name: 'PC', material: 'PC' },  // Fixed: was 'pc'
    { slug: 'pc-fr', name: 'PC FR', material: 'PC' },
  ],
  'PA': [
    { slug: 'pa6-cf', name: 'PA6-CF', material: 'PA' },
    { slug: 'pa6-gf', name: 'PA6-GF', material: 'PA' },
    { slug: 'paht-cf', name: 'PAHT-CF', material: 'PA' },
    { slug: 'ppa-cf', name: 'PPA-CF', material: 'PA' },
  ],
  'Support': [
    { slug: 'support-for-pla-new', name: 'Support For PLA', material: 'Support' },  // Fixed: was 'support-for-pla'
    { slug: 'support-for-pla-petg', name: 'Support for PLA/PETG', material: 'Support' },
    { slug: 'support-for-abs', name: 'Support for ABS', material: 'Support' },
    { slug: 'support-for-pa-pet', name: 'Support for PA/PET', material: 'Support' },
    { slug: 'support-g', name: 'Support G', material: 'Support' },
    { slug: 'support-w', name: 'Support W', material: 'Support' },
  ],
  'PVA': [
    { slug: 'pva', name: 'PVA', material: 'PVA' },
  ],
  'PPS': [
    { slug: 'pps-cf', name: 'PPS-CF', material: 'PPS' },
  ],
};

// ============================================================================
// DATABASE LOGGING UTILITIES
// ============================================================================
async function logToDb(
  supabase: any,
  jobId: string,
  level: 'info' | 'warn' | 'error' | 'debug',
  stage: string,
  message: string,
  metadata?: any
): Promise<void> {
  try {
    await supabase.from('scrape_job_logs').insert({
      job_id: jobId,
      level,
      stage,
      message,
      metadata: metadata || {},
    });
  } catch (e) {
    console.error('[ORCHESTRATOR] Failed to log to DB:', e);
  }
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
    console.error('[ORCHESTRATOR] Failed to fetch logs:', e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const mode = body.mode || 'start';

    if (mode === 'start') {
      // =========== START MODE ===========
      // Create job, build product queue, return immediately
      const { materials = ['PLA'], dryRun = false } = body;
      
      // Normalize material names (handle common aliases)
      const materialAliases: Record<string, string> = {
        'NYLON': 'PA',
        'POLYAMIDE': 'PA',
      };
      
      const normalizedMaterials = materials.map((m: string) => 
        materialAliases[m.toUpperCase()] || m
      );
      
      // Build product queue
      const productQueue: Array<{ material: string; slug: string; name: string }> = [];
      for (const material of normalizedMaterials) {
        const products = PRODUCT_CONFIGS[material] || [];
        for (const product of products) {
          productQueue.push({
            material: product.material,
            slug: product.slug,
            name: product.name,
          });
        }
      }

      if (productQueue.length === 0) {
        const validMaterials = Object.keys(PRODUCT_CONFIGS).join(', ');
        return new Response(JSON.stringify({
          success: false,
          error: `No products found for materials: ${materials.join(', ')}. Valid materials are: ${validMaterials}`,
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create job record
      const { data: job, error: jobError } = await supabase
        .from('scrape_jobs')
        .insert({
          job_type: 'bambu_pla_scrape_v2',
          status: 'running',
          materials,
          products: productQueue.map(p => p.slug),
          dry_run: dryRun,
          started_at: new Date().toISOString(),
          progress: {
            currentMaterial: productQueue[0]?.material,
            currentProduct: productQueue[0]?.name,
            currentStage: 'queued',
            productsProcessed: 0,
            totalProducts: productQueue.length,
            colorsDiscovered: 0,
            filamentsCreated: 0,
            filamentsUpdated: 0,
            errors: [],
          },
        })
        .select()
        .single();

      if (jobError || !job) {
        throw new Error(`Failed to create job: ${jobError?.message}`);
      }

      console.log(`[ORCHESTRATOR] Created job ${job.id} with ${productQueue.length} products`);
      
      // Log job start to database
      await logToDb(supabase, job.id, 'info', 'init', 
        `Orchestrated scrape started for ${materials.join(', ')} with ${productQueue.length} products`,
        { materials, dryRun, totalProducts: productQueue.length }
      );

      // Store chunk state for processing
      const chunkState: ChunkState = {
        jobId: job.id,
        materials,
        dryRun,
        productQueue,
        currentIndex: 0,
        results: {
          productsScraped: 0,
          colorsDiscovered: 0,
          filamentsCreated: 0,
          filamentsUpdated: 0,
          errors: [],
          timing: { totalMs: 0 },
        },
      };

      // Queue first chunk immediately using background task
      EdgeRuntime.waitUntil(processNextChunk(supabase, chunkState));

      return new Response(JSON.stringify({
        success: true,
        jobId: job.id,
        message: `Started chunked scrape for ${productQueue.length} products`,
        totalProducts: productQueue.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (mode === 'chunk') {
      // =========== CHUNK MODE ===========
      // Process a single product, then queue next
      const { chunkState } = body as { chunkState: ChunkState };
      
      if (!chunkState) {
        throw new Error('Missing chunkState for chunk mode');
      }

      // Process chunk in background
      EdgeRuntime.waitUntil(processNextChunk(supabase, chunkState));

      return new Response(JSON.stringify({
        success: true,
        message: 'Chunk queued',
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
    console.error('[ORCHESTRATOR] Error:', error);
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
 * Process a single product and queue the next one
 */
async function processNextChunk(supabase: any, state: ChunkState): Promise<void> {
  const { jobId, productQueue, currentIndex, dryRun } = state;
  const startTime = Date.now();

  try {
    // Check if we're done
    if (currentIndex >= productQueue.length) {
      console.log(`[ORCHESTRATOR] Job ${jobId} completed - all products processed`);
      await logToDb(supabase, jobId, 'info', 'complete', 
        `All ${productQueue.length} products processed successfully`
      );
      await completeJob(supabase, state);
      return;
    }

    const product = productQueue[currentIndex];
    console.log(`[ORCHESTRATOR] Processing product ${currentIndex + 1}/${productQueue.length}: ${product.name}`);
    
    // Log product processing start
    await logToDb(supabase, jobId, 'info', 'product_start',
      `Processing product ${currentIndex + 1}/${productQueue.length}: ${product.name}`,
      { product: product.name, material: product.material, slug: product.slug }
    );

    // Update job progress
    await supabase.from('scrape_jobs').update({
      progress: {
        currentMaterial: product.material,
        currentProduct: product.name,
        currentStage: 'scraping',
        productsProcessed: currentIndex,
        totalProducts: productQueue.length,
        colorsDiscovered: state.results.colorsDiscovered,
        filamentsCreated: state.results.filamentsCreated,
        filamentsUpdated: state.results.filamentsUpdated,
        errors: state.results.errors.slice(-10), // Keep last 10 errors
      },
    }).eq('id', jobId);

    // Call the actual scraper for just this product
    const scraperUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/scrape-bambu-pla`;
    const response = await fetch(scraperUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        singleProduct: {
          material: product.material,
          slug: product.slug,
          name: product.name,
        },
        dryRun,
        jobId, // Pass job ID so scraper can update progress
        // Pass current progress context so scraper merges instead of overwrites
        progressContext: {
          productsProcessed: currentIndex,
          totalProducts: productQueue.length,
          colorsDiscovered: state.results.colorsDiscovered,
          filamentsCreated: state.results.filamentsCreated,
          filamentsUpdated: state.results.filamentsUpdated,
          errors: state.results.errors.slice(-10),
        },
      }),
    });

    const result = await response.json();
    const productDuration = Date.now() - startTime;
    
    // Update cumulative results
    if (result.success && result.results) {
      state.results.productsScraped++;
      state.results.colorsDiscovered += result.results.colorsDiscovered || 0;
      state.results.filamentsCreated += result.results.filamentsCreated || 0;
      state.results.filamentsUpdated += result.results.filamentsUpdated || 0;
      if (result.results.errors?.length) {
        state.results.errors.push(...result.results.errors.slice(0, 5));
      }
      
      // Log success
      await logToDb(supabase, jobId, 'info', 'product_complete',
        `Completed ${product.name} in ${productDuration}ms`,
        { 
          product: product.name,
          colors: result.results.colorsDiscovered || 0,
          created: result.results.filamentsCreated || 0,
          updated: result.results.filamentsUpdated || 0,
          durationMs: productDuration
        }
      );
    } else if (!result.success) {
      const errorMsg = `${product.name}: ${result.error || 'Unknown error'}`;
      state.results.errors.push(errorMsg);
      
      // Log error
      await logToDb(supabase, jobId, 'error', 'product_error',
        `Failed processing ${product.name}: ${result.error || 'Unknown error'}`,
        { product: product.name, error: result.error, durationMs: productDuration }
      );
    }

    state.results.timing.totalMs += productDuration;
    console.log(`[ORCHESTRATOR] Completed ${product.name} in ${productDuration}ms`);

    // Move to next product
    state.currentIndex++;

    // Update job with current results
    await supabase.from('scrape_jobs').update({
      progress: {
        currentMaterial: product.material,
        currentProduct: product.name,
        currentStage: 'completed',
        productsProcessed: state.currentIndex,
        totalProducts: productQueue.length,
        colorsDiscovered: state.results.colorsDiscovered,
        filamentsCreated: state.results.filamentsCreated,
        filamentsUpdated: state.results.filamentsUpdated,
        errors: state.results.errors.slice(-10),
      },
    }).eq('id', jobId);

    // Small delay between products (rate limiting)
    await new Promise(r => setTimeout(r, 500));

    // Queue next chunk by calling ourselves
    if (state.currentIndex < productQueue.length) {
      const orchestratorUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/scrape-bambu-orchestrator`;
      await fetch(orchestratorUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'chunk',
          chunkState: state,
        }),
      });
      console.log(`[ORCHESTRATOR] Queued next chunk ${state.currentIndex + 1}/${productQueue.length}`);
    } else {
      // No more products, complete the job
      await completeJob(supabase, state);
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[ORCHESTRATOR] Error processing chunk:`, error);
    state.results.errors.push(`Chunk error: ${errorMsg}`);
    
    // Log chunk error
    await logToDb(supabase, jobId, 'error', 'chunk_error',
      `Error processing chunk at index ${currentIndex}: ${errorMsg}`,
      { error: errorMsg, currentIndex, product: productQueue[currentIndex]?.name }
    );
    
    // Try to continue with next product
    state.currentIndex++;
    
    if (state.currentIndex < productQueue.length) {
      // Queue next chunk despite error
      const orchestratorUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/scrape-bambu-orchestrator`;
      await fetch(orchestratorUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'chunk',
          chunkState: state,
        }),
      });
    } else {
      await completeJob(supabase, state);
    }
  }
}

/**
 * Mark job as completed with final results
 */
async function completeJob(supabase: any, state: ChunkState): Promise<void> {
  const { jobId, materials, dryRun, results } = state;
  
  console.log(`[ORCHESTRATOR] Completing job ${jobId}`);
  console.log(`[ORCHESTRATOR] Results:`, JSON.stringify(results, null, 2));

  // Fetch logs for AI context
  const logs = await fetchJobLogs(supabase, jobId, 50);
  
  // Log final stats
  await logToDb(supabase, jobId, 'info', 'finalize',
    `Job completing with ${results.productsScraped} products, ${results.errors.length} errors`,
    { results }
  );

  // Generate AI summary if available
  let aiSummary = null;
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (OPENAI_API_KEY) {
      aiSummary = await generateAISummary(results, materials, dryRun, OPENAI_API_KEY, logs);
    }
  } catch (e) {
    console.error('[ORCHESTRATOR] Failed to generate AI summary:', e);
    await logToDb(supabase, jobId, 'error', 'ai_summary',
      `Failed to generate AI summary: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  const hasErrors = results.errors.length > 0;
  
  await supabase.from('scrape_jobs').update({
    status: hasErrors && results.productsScraped === 0 ? 'failed' : 'completed',
    completed_at: new Date().toISOString(),
    results: {
      productsScraped: results.productsScraped,
      colorsDiscovered: results.colorsDiscovered,
      filamentsCreated: results.filamentsCreated,
      filamentsUpdated: results.filamentsUpdated,
      errors: results.errors,
      timing: results.timing,
    },
    progress: {
      currentMaterial: null,
      currentProduct: null,
      currentStage: 'completed',
      productsProcessed: results.productsScraped,
      totalProducts: state.productQueue.length,
      colorsDiscovered: results.colorsDiscovered,
      filamentsCreated: results.filamentsCreated,
      filamentsUpdated: results.filamentsUpdated,
      errors: results.errors.slice(-10),
    },
    ai_summary: aiSummary,
  }).eq('id', jobId);

  console.log(`[ORCHESTRATOR] Job ${jobId} marked as completed`);
}

/**
 * Generate AI summary for completed job with log context
 */
async function generateAISummary(
  results: ChunkState['results'],
  materials: string[],
  dryRun: boolean,
  apiKey: string,
  logs: string[]
): Promise<any> {
  const hasErrors = results.errors.length > 0;
  const healthScore = results.productsScraped === 0 ? 10 
    : results.errors.length === 0 ? 95 
    : Math.max(30, 90 - results.errors.length * 5);
  
  const logContext = logs.length > 0 
    ? `\n\nDebug Logs (last ${logs.length} entries):\n${logs.slice(-30).join('\n')}`
    : '';

  const prompt = `You are a Senior Web Scraping & Backend Expert analyzing a chunked scraping job for Bambu Lab filaments.

Materials: ${materials.join(', ')}
Dry Run: ${dryRun}

Results:
- Products Scraped: ${results.productsScraped}
- Colors Discovered: ${results.colorsDiscovered}
- Filaments Created: ${results.filamentsCreated}
- Filaments Updated: ${results.filamentsUpdated}
- Errors: ${results.errors.length}
- Total Time: ${(results.timing.totalMs / 1000).toFixed(1)}s

${results.errors.length > 0 ? `Errors:\n${results.errors.slice(0, 15).join('\n')}` : 'No errors'}
${logContext}

IMPORTANT: The edge functions are located at:
- supabase/functions/scrape-bambu-pla/index.ts (main scraper)
- supabase/functions/scrape-bambu-orchestrator/index.ts (chunked orchestrator)

Provide a brief analysis with:
1. A concise headline summarizing the job outcome
2. What went right (be specific about successes)
3. What went wrong (analyze errors and log patterns)
4. User impact assessment
5. Actions needed to fix issues
6. Health score (0-100)
7. ${hasErrors ? 'A detailed lovablePrompt for fixing the issues - include specific file paths, error analysis, and code recommendations. Start with "As a Senior Web Scraping & Backend Expert..."' : 'null for lovablePrompt since no errors'}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a Senior Web Scraping & Backend Expert. Analyze scrape job results and provide actionable insights. When errors exist, generate detailed fix prompts for Lovable.' },
        { role: 'user', content: prompt }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_summary',
            description: 'Generate structured summary with optional fix prompt',
            parameters: {
              type: 'object',
              properties: {
                headline: { type: 'string', description: 'One sentence summary' },
                whatWentRight: { type: 'array', items: { type: 'string' }, description: 'List of successes' },
                whatWentWrong: { type: 'array', items: { type: 'string' }, description: 'List of issues found' },
                userImpact: { type: 'string', description: 'Impact on end users' },
                actionsNeeded: { type: 'array', items: { type: 'string' }, description: 'Recommended actions' },
                healthScore: { type: 'number', description: 'Score from 0-100' },
                lovablePrompt: { 
                  type: 'string',
                  nullable: true,
                  description: 'If errors exist, provide detailed markdown prompt for Lovable to fix issues. Include file paths and specific code fixes. Return null if no errors.'
                },
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

  if (!response.ok) return null;

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) return null;

  const summary = JSON.parse(toolCall.function.arguments);
  return {
    generatedAt: new Date().toISOString(),
    model: 'gpt-4o-mini',
    summary: {
      headline: summary.headline || 'Scrape completed',
      whatWentRight: summary.whatWentRight || [],
      whatWentWrong: summary.whatWentWrong || [],
      userImpact: summary.userImpact || '',
      actionsNeeded: summary.actionsNeeded || [],
      healthScore: typeof summary.healthScore === 'number' ? summary.healthScore : healthScore,
      lovablePrompt: summary.lovablePrompt || null,
    },
  };
}

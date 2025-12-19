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
    { slug: 'pla-basic', name: 'PLA Basic', material: 'PLA' },
    { slug: 'pla-matte', name: 'PLA Matte', material: 'PLA' },
    { slug: 'pla-silk', name: 'PLA Silk', material: 'PLA' },
    { slug: 'pla-metal', name: 'PLA Metal', material: 'PLA' },
    { slug: 'pla-sparkle', name: 'PLA Sparkle', material: 'PLA' },
    { slug: 'pla-marble', name: 'PLA Marble', material: 'PLA' },
    { slug: 'pla-glow', name: 'PLA Glow', material: 'PLA' },
    { slug: 'pla-tough', name: 'PLA Tough', material: 'PLA' },
    { slug: 'pla-aero', name: 'PLA Aero', material: 'PLA' },
    { slug: 'pla-galaxy', name: 'PLA Galaxy', material: 'PLA' },
    { slug: 'pla-dual-color', name: 'PLA Dual Color', material: 'PLA' },
    { slug: 'pla-impact', name: 'PLA Impact', material: 'PLA' },
    { slug: 'pla-cf', name: 'PLA-CF', material: 'PLA' },
    { slug: 'pla-gf', name: 'PLA-GF', material: 'PLA' },
    { slug: 'pla-luminous', name: 'PLA Luminous', material: 'PLA' },
    { slug: 'pla-gradient', name: 'PLA Gradient', material: 'PLA' },
    { slug: 'pla-wood', name: 'PLA Wood', material: 'PLA' },
  ],
  'PETG': [
    { slug: 'petg-basic', name: 'PETG Basic', material: 'PETG' },
    { slug: 'petg-hf', name: 'PETG HF', material: 'PETG' },
    { slug: 'petg-translucent', name: 'PETG Translucent', material: 'PETG' },
    { slug: 'petg-cf', name: 'PETG-CF', material: 'PETG' },
  ],
  'ABS': [
    { slug: 'abs', name: 'ABS', material: 'ABS' },
    { slug: 'abs-gf', name: 'ABS-GF', material: 'ABS' },
  ],
  'ASA': [
    { slug: 'asa', name: 'ASA', material: 'ASA' },
    { slug: 'asa-aero', name: 'ASA Aero', material: 'ASA' },
  ],
  'TPU': [
    { slug: 'tpu-95a-hf', name: 'TPU 95A HF', material: 'TPU' },
    { slug: 'tpu-90a', name: 'TPU 90A', material: 'TPU' },
  ],
  'PC': [
    { slug: 'pc', name: 'PC', material: 'PC' },
  ],
  'PA': [
    { slug: 'pa6-cf', name: 'PA6-CF', material: 'PA' },
    { slug: 'pa6-gf', name: 'PA6-GF', material: 'PA' },
    { slug: 'paht-cf', name: 'PAHT-CF', material: 'PA' },
  ],
  'Support': [
    { slug: 'support-for-pla', name: 'Support For PLA', material: 'Support' },
    { slug: 'support-for-pa-pc', name: 'Support For PA/PC', material: 'Support' },
    { slug: 'support-g', name: 'Support G', material: 'Support' },
    { slug: 'support-w', name: 'Support W', material: 'Support' },
  ],
  'PVA': [
    { slug: 'pva', name: 'PVA', material: 'PVA' },
  ],
};

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
      
      // Build product queue
      const productQueue: Array<{ material: string; slug: string; name: string }> = [];
      for (const material of materials) {
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
        return new Response(JSON.stringify({
          success: false,
          error: `No products found for materials: ${materials.join(', ')}`,
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
      await completeJob(supabase, state);
      return;
    }

    const product = productQueue[currentIndex];
    console.log(`[ORCHESTRATOR] Processing product ${currentIndex + 1}/${productQueue.length}: ${product.name}`);

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
      }),
    });

    const result = await response.json();
    
    // Update cumulative results
    if (result.success && result.results) {
      state.results.productsScraped++;
      state.results.colorsDiscovered += result.results.colorsDiscovered || 0;
      state.results.filamentsCreated += result.results.filamentsCreated || 0;
      state.results.filamentsUpdated += result.results.filamentsUpdated || 0;
      if (result.results.errors?.length) {
        state.results.errors.push(...result.results.errors.slice(0, 5));
      }
    } else if (!result.success) {
      state.results.errors.push(`${product.name}: ${result.error || 'Unknown error'}`);
    }

    state.results.timing.totalMs += Date.now() - startTime;
    console.log(`[ORCHESTRATOR] Completed ${product.name} in ${Date.now() - startTime}ms`);

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
    console.error(`[ORCHESTRATOR] Error processing chunk:`, error);
    state.results.errors.push(`Chunk error: ${error instanceof Error ? error.message : String(error)}`);
    
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

  // Generate AI summary if available
  let aiSummary = null;
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (LOVABLE_API_KEY) {
      aiSummary = await generateAISummary(results, materials, dryRun, LOVABLE_API_KEY);
    }
  } catch (e) {
    console.error('[ORCHESTRATOR] Failed to generate AI summary:', e);
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
 * Generate AI summary for completed job
 */
async function generateAISummary(
  results: ChunkState['results'],
  materials: string[],
  dryRun: boolean,
  apiKey: string
): Promise<any> {
  const prompt = `You are a Senior Web Scraping Expert analyzing a chunked scraping job for Bambu Lab filaments.

Materials: ${materials.join(', ')}
Dry Run: ${dryRun}

Results:
- Products Scraped: ${results.productsScraped}
- Colors Discovered: ${results.colorsDiscovered}
- Filaments Created: ${results.filamentsCreated}
- Filaments Updated: ${results.filamentsUpdated}
- Errors: ${results.errors.length}
- Total Time: ${(results.timing.totalMs / 1000).toFixed(1)}s

${results.errors.length > 0 ? `Errors:\n${results.errors.slice(0, 10).join('\n')}` : 'No errors'}

Provide a brief analysis with a health score (0-100) and any recommendations.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a Senior Web Scraping Expert.' },
        { role: 'user', content: prompt }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_summary',
            parameters: {
              type: 'object',
              properties: {
                headline: { type: 'string' },
                whatWentRight: { type: 'array', items: { type: 'string' } },
                whatWentWrong: { type: 'array', items: { type: 'string' } },
                healthScore: { type: 'number' },
                recommendations: { type: 'array', items: { type: 'string' } },
              },
              required: ['headline', 'healthScore'],
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
    model: 'google/gemini-2.5-flash',
    summary,
  };
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ═══════════════════════════════════════════════════════════════════════════
// BRAND CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

interface BrandEntry {
  slug: string;
  syncType: 'regional' | 'brand-specific';
  tier: 1 | 2 | 3;
  functionSlug?: string;
}

const SLUG_TO_FUNCTION: Record<string, string> = {
  '3d-fuel': '3dfuel',
  'atomic-filament': 'atomic',
  'bambu-lab': 'bambulab',
  'proto-pasta': 'protopasta',
  'push-plastic': 'pushplastic',
  'siraya-tech': 'sirayatech',
  'duramic-3d': 'duramic',
  'paramount-3d': 'paramount',
  'ic3d-printers': 'ic3d',
  'treed-filaments': 'treed',
  'spectrum-filaments': 'spectrum',
  'gizmo-dorks': 'gizmodorks',
  'elegoo': 'elegoo-ca',
  'fusion-filaments': 'fusion-filaments',
};

function getFunctionSlug(brandSlug: string): string {
  return SLUG_TO_FUNCTION[brandSlug] || brandSlug;
}

const ALL_BRANDS: BrandEntry[] = [
  // ── TIER 1: Daily sync (major brands) ────────────────────────────────
  { slug: 'bambu-lab',    syncType: 'regional', tier: 1 },
  { slug: 'polymaker',    syncType: 'regional', tier: 1 },
  { slug: 'elegoo',       syncType: 'regional', tier: 1 },
  { slug: 'creality',     syncType: 'regional', tier: 1 },
  { slug: 'anycubic',     syncType: 'regional', tier: 1 },
  { slug: 'esun',         syncType: 'brand-specific', tier: 1 },
  { slug: 'prusament',    syncType: 'brand-specific', tier: 1 },
  { slug: 'overture',     syncType: 'brand-specific', tier: 1 },

  // ── TIER 2: Every 3 days ─────────────────────────────────────────────
  { slug: 'sunlu',        syncType: 'regional', tier: 2 },
  { slug: 'eryone',       syncType: 'regional', tier: 2 },
  { slug: 'jayo',         syncType: 'regional', tier: 2 },
  { slug: 'kingroon',     syncType: 'regional', tier: 2 },
  { slug: 'sovol',        syncType: 'regional', tier: 2 },
  { slug: 'hatchbox',     syncType: 'brand-specific', tier: 2 },
  { slug: 'colorfabb',    syncType: 'brand-specific', tier: 2 },
  { slug: 'fillamentum',  syncType: 'brand-specific', tier: 2 },
  { slug: 'atomic-filament', syncType: 'brand-specific', tier: 2 },
  { slug: 'proto-pasta',  syncType: 'brand-specific', tier: 2 },
  { slug: 'ninjatek',     syncType: 'brand-specific', tier: 2 },

  // ── TIER 3: Weekly ───────────────────────────────────────────────────
  { slug: 'qidi',         syncType: 'regional', tier: 3 },
  { slug: 'flashforge',   syncType: 'regional', tier: 3 },
  { slug: 'artillery',    syncType: 'regional', tier: 3 },
  { slug: 'longer',       syncType: 'regional', tier: 3 },
  { slug: 'two-trees',    syncType: 'regional', tier: 3 },
  { slug: 'geeetech',     syncType: 'regional', tier: 3 },
  { slug: 'voxelab',      syncType: 'regional', tier: 3 },
  { slug: '3d-fuel',      syncType: 'brand-specific', tier: 3 },
  { slug: '3dhojor',      syncType: 'brand-specific', tier: 3 },
  { slug: '3dxtech',      syncType: 'brand-specific', tier: 3 },
  { slug: 'amolen',       syncType: 'brand-specific', tier: 3 },
  { slug: 'azurefilm',    syncType: 'brand-specific', tier: 3 },
  { slug: 'duramic-3d',   syncType: 'brand-specific', tier: 3 },
  { slug: 'extrudr',      syncType: 'brand-specific', tier: 3 },
  { slug: 'fiberlogy',    syncType: 'brand-specific', tier: 3 },
  { slug: 'formfutura',   syncType: 'brand-specific', tier: 3 },
  { slug: 'fusion-filaments', syncType: 'brand-specific', tier: 3 },
  { slug: 'gizmo-dorks',  syncType: 'brand-specific', tier: 3 },
  { slug: 'ic3d-printers', syncType: 'brand-specific', tier: 3 },
  { slug: 'matter3d',     syncType: 'brand-specific', tier: 3 },
  { slug: 'numakers',     syncType: 'brand-specific', tier: 3 },
  { slug: 'paramount-3d', syncType: 'brand-specific', tier: 3 },
  { slug: 'push-plastic', syncType: 'brand-specific', tier: 3 },
  { slug: 'recreus',      syncType: 'brand-specific', tier: 3 },
  { slug: 'siraya-tech',  syncType: 'brand-specific', tier: 3 },
  { slug: 'spectrum-filaments', syncType: 'brand-specific', tier: 3 },
  { slug: 'treed-filaments', syncType: 'brand-specific', tier: 3 },
  { slug: 'ultimaker',    syncType: 'brand-specific', tier: 3 },
  { slug: 'voxelpla',     syncType: 'brand-specific', tier: 3 },
  { slug: 'yousu',        syncType: 'brand-specific', tier: 3 },
  { slug: 'ziro',         syncType: 'brand-specific', tier: 3 },
];

const TIER_FREQUENCY_HOURS: Record<number, number> = {
  1: 24,
  2: 72,
  3: 168,
};

const BATCH_SIZE = 12;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED: Process a single brand (used by both orchestrator and continue)
// ═══════════════════════════════════════════════════════════════════════════
export async function processBrand(
  brand: { slug: string; syncType: string },
  supabaseUrl: string,
  anonKey: string,
  serviceRoleKey: string,
  supabase: any,
  runId: string,
): Promise<{ success: boolean; productsUpdated: number; error?: string; regionalData?: Record<string, any> }> {
  const { slug, syncType } = brand;

  try {
    let syncResponse: Response;

    if (syncType === 'regional') {
      const syncUrl = `${supabaseUrl}/functions/v1/sync-regional-prices`;
      syncResponse = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ brandSlug: slug, regions: ['US', 'CA', 'EU', 'UK', 'AU'], dryRun: false }),
      });
    } else {
      const functionSlug = getFunctionSlug(slug);
      const functionName = `sync-${functionSlug}-products`;
      const syncUrl = `${supabaseUrl}/functions/v1/${functionName}`;
      syncResponse = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ dryRun: false, triggeredBy: 'orchestrator' }),
      });
    }

    const syncResult = await syncResponse.json().catch(() => null);

    if (syncResponse.ok) {
      const updated = syncResult?.summary?.totalUpdated
        || syncResult?.totalUpdated
        || syncResult?.stats?.updated
        || syncResult?.updated
        || syncResult?.summary?.totalMatched
        || 0;
      const regionalData = syncResult?.regionBreakdown || syncResult?.regional_breakdown || null;
      console.log(`[ORCHESTRATOR] ✅ ${slug} synced (${updated} updated)`);
      return { success: true, productsUpdated: updated, regionalData };
    } else {
      const errorMsg = syncResult?.error || syncResponse.statusText;
      console.error(`[ORCHESTRATOR] ❌ ${slug} failed: ${errorMsg}`);
      await supabase.from('scrape_errors').insert({
        brand_slug: slug,
        error_type: `http_${syncResponse.status}`,
        error_message: `Sync failed: ${String(errorMsg).slice(0, 500)}`,
        sync_run_id: runId,
      });
      return { success: false, productsUpdated: 0, error: String(errorMsg) };
    }
  } catch (err) {
    console.error(`[ORCHESTRATOR] ❌ ${slug} error: ${err}`);
    await supabase.from('scrape_errors').insert({
      brand_slug: slug,
      error_type: 'network',
      error_message: String(err).slice(0, 500),
      stack_trace: err instanceof Error ? err.stack?.slice(0, 2000) : null,
      sync_run_id: runId,
    });
    return { success: false, productsUpdated: 0, error: String(err) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED: Process a batch of brands
// ═══════════════════════════════════════════════════════════════════════════
export async function processBatch(
  batchId: string,
  brandSlugs: string[],
  supabaseUrl: string,
  anonKey: string,
  serviceRoleKey: string,
  supabase: any,
  runId: string,
): Promise<{ brandsSynced: number; productsSynced: number; errorsCount: number; brandsFailed: string[] }> {
  // Mark batch as running
  await supabase.from('orchestration_batches').update({
    status: 'running',
    started_at: new Date().toISOString(),
  }).eq('id', batchId);

  let brandsSynced = 0;
  let productsSynced = 0;
  let errorsCount = 0;
  const brandsFailed: string[] = [];

  for (const slug of brandSlugs) {
    const brandEntry = ALL_BRANDS.find(b => b.slug === slug) || { slug, syncType: 'brand-specific' };

    // Update live progress on orchestration_runs
    await supabase.from('orchestration_runs').update({
      current_brand_slug: slug,
      current_brand_name: slug,
      current_product_name: null,
      current_product_url: null,
    }).eq('id', runId);

    const result = await processBrand(brandEntry, supabaseUrl, anonKey, serviceRoleKey, supabase, runId);

    if (result.success) {
      brandsSynced++;
      productsSynced += result.productsUpdated;
    } else {
      errorsCount++;
      brandsFailed.push(slug);
    }

    // Update batch progress
    await supabase.from('orchestration_batches').update({
      brands_synced: brandsSynced,
      products_synced: productsSynced,
      errors_count: errorsCount,
    }).eq('id', batchId);

    // Rate limiting between brands
    if (slug !== brandSlugs[brandSlugs.length - 1]) {
      await sleep(3000);
    }
  }

  // Mark batch as completed/failed
  const batchStatus = errorsCount === brandSlugs.length ? 'failed' : 'completed';
  await supabase.from('orchestration_batches').update({
    status: batchStatus,
    completed_at: new Date().toISOString(),
    brands_synced: brandsSynced,
    products_synced: productsSynced,
    errors_count: errorsCount,
    error_details: brandsFailed.length > 0 ? { failed_brands: brandsFailed } : null,
  }).eq('id', batchId);

  return { brandsSynced, productsSynced, errorsCount, brandsFailed };
}

// ═══════════════════════════════════════════════════════════════════════════
// Update orchestration-level totals from all batches
// ═══════════════════════════════════════════════════════════════════════════
async function updateOrchestrationTotals(supabase: any, runId: string) {
  const { data: batches } = await supabase
    .from('orchestration_batches')
    .select('brands_synced, products_synced, errors_count, status, error_details')
    .eq('orchestration_id', runId);

  if (!batches) return;

  const totalBrandsSynced = batches.reduce((s: number, b: any) => s + (b.brands_synced || 0), 0);
  const totalProducts = batches.reduce((s: number, b: any) => s + (b.products_synced || 0), 0);
  const allFailed: string[] = batches.flatMap((b: any) => b.error_details?.failed_brands || []);
  const allComplete = batches.every((b: any) => b.status === 'completed' || b.status === 'failed');
  const anyPending = batches.some((b: any) => b.status === 'pending');

  const update: Record<string, any> = {
    brands_synced: totalBrandsSynced,
    total_products_updated: totalProducts,
    brands_failed: allFailed,
  };

  if (allComplete && !anyPending) {
    update.status = allFailed.length === 0 ? 'completed' : totalBrandsSynced === 0 ? 'failed' : 'partial';
    update.completed_at = new Date().toISOString();
    update.current_brand_slug = null;
    update.current_brand_name = null;
    update.current_product_name = null;
    update.current_product_url = null;
  }

  await supabase.from('orchestration_runs').update(update).eq('id', runId);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json().catch(() => ({}));
    const trigger: 'cron' | 'manual' = body.trigger || 'manual';
    let userId: string | null = null;

    // For manual triggers, validate admin auth
    if (trigger === 'manual') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
      if (claimsError || !claimsData?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      userId = claimsData.user.id;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: 'Admin role required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Check if there's already a running orchestration
    const { data: runningRun } = await supabase
      .from('orchestration_runs')
      .select('id, started_at')
      .eq('status', 'running')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (runningRun) {
      const minutesRunning = (Date.now() - new Date(runningRun.started_at).getTime()) / 60000;
      if (minutesRunning < 30) {
        return new Response(JSON.stringify({
          error: 'Orchestration already running',
          runId: runningRun.id,
          startedAt: runningRun.started_at
        }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      // Stuck for 30+ min, mark as failed
      await supabase.from('orchestration_runs').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: { error: 'Timed out after 30 minutes' },
      }).eq('id', runningRun.id);
    }

    // Determine eligible brands based on tier frequency
    const eligibleBrands: BrandEntry[] = [];
    for (const brand of ALL_BRANDS) {
      const frequencyHours = TIER_FREQUENCY_HOURS[brand.tier];
      const { data: lastSync } = await supabase
        .from('brand_sync_logs')
        .select('completed_at')
        .eq('brand_slug', brand.slug)
        .in('status', ['completed', 'partial'])
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastSync?.completed_at) {
        eligibleBrands.push(brand);
        continue;
      }
      const hoursSinceSync = (Date.now() - new Date(lastSync.completed_at).getTime()) / 3600000;
      if (hoursSinceSync >= frequencyHours) {
        eligibleBrands.push(brand);
      }
    }

    eligibleBrands.sort((a, b) => a.tier - b.tier);
    console.log(`[ORCHESTRATOR] Eligible brands: ${eligibleBrands.length}`);

    // Create orchestration run record
    const { data: run, error: runError } = await supabase
      .from('orchestration_runs')
      .insert({
        status: 'running',
        brands_total: eligibleBrands.length,
        trigger_type: trigger,
        triggered_by_user: userId,
      })
      .select('id')
      .single();

    if (runError || !run) {
      return new Response(JSON.stringify({ error: 'Failed to create orchestration run', details: runError }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const runId = run.id;

    // Split eligible brands into batches of BATCH_SIZE
    const batches: string[][] = [];
    for (let i = 0; i < eligibleBrands.length; i += BATCH_SIZE) {
      batches.push(eligibleBrands.slice(i, i + BATCH_SIZE).map(b => b.slug));
    }

    // Create batch records
    const batchRecords = batches.map((brandSlugs, idx) => ({
      orchestration_id: runId,
      batch_number: idx + 1,
      status: idx === 0 ? 'pending' : 'pending',
      brand_slugs: brandSlugs,
    }));

    const { data: insertedBatches, error: batchInsertError } = await supabase
      .from('orchestration_batches')
      .insert(batchRecords)
      .select('id, batch_number, brand_slugs');

    if (batchInsertError || !insertedBatches?.length) {
      return new Response(JSON.stringify({ error: 'Failed to create batches', details: batchInsertError }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[ORCHESTRATOR] Created ${insertedBatches.length} batches of ${BATCH_SIZE} brands`);

    // Process ONLY the first batch in background, then exit
    const firstBatch = insertedBatches.find((b: any) => b.batch_number === 1)!;

    const backgroundWork = async () => {
      try {
        await processBatch(
          firstBatch.id,
          firstBatch.brand_slugs,
          supabaseUrl,
          anonKey,
          serviceRoleKey,
          supabase,
          runId,
        );

        // Update orchestration totals
        await updateOrchestrationTotals(supabase, runId);

        // Check if there are more batches pending
        const { data: pendingBatches } = await supabase
          .from('orchestration_batches')
          .select('id')
          .eq('orchestration_id', runId)
          .eq('status', 'pending');

        if (pendingBatches?.length > 0) {
          console.log(`[ORCHESTRATOR] Batch 1 complete. ${pendingBatches.length} batches remaining — will be picked up by orchestrator-continue.`);
        } else {
          console.log(`[ORCHESTRATOR] All batches complete.`);
          await updateOrchestrationTotals(supabase, runId);
        }
      } catch (err) {
        console.error(`[ORCHESTRATOR] Batch 1 error:`, err);
        await supabase.from('orchestration_batches').update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_details: { error: String(err) },
        }).eq('id', firstBatch.id);
        await updateOrchestrationTotals(supabase, runId);
      }
    };

    if (typeof (globalThis as any).EdgeRuntime !== 'undefined' && (globalThis as any).EdgeRuntime.waitUntil) {
      (globalThis as any).EdgeRuntime.waitUntil(backgroundWork());
    } else {
      backgroundWork().catch(console.error);
    }

    return new Response(JSON.stringify({
      success: true,
      runId,
      eligibleBrands: eligibleBrands.length,
      totalBatches: batches.length,
      batchSize: BATCH_SIZE,
      firstBatchBrands: firstBatch.brand_slugs,
      message: `Orchestration started. ${eligibleBrands.length} brands split into ${batches.length} batches of ${BATCH_SIZE}. Processing batch 1 now.`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Orchestrator error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

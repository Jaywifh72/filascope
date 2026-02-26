import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ═══════════════════════════════════════════════════════════════════════════
// Brand config (duplicated from orchestrator — shared module not supported)
// ═══════════════════════════════════════════════════════════════════════════

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

// Regional brands list for sync-type detection
const REGIONAL_BRANDS = new Set([
  'bambu-lab', 'polymaker', 'elegoo', 'creality', 'anycubic',
  'sunlu', 'eryone', 'jayo', 'kingroon', 'sovol',
  'qidi', 'flashforge', 'artillery', 'longer', 'two-trees', 'geeetech', 'voxelab',
]);

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT_${ms}ms`)), ms));
}

const BRAND_TIMEOUT_MS = 180_000;
const RETRY_DELAY_MS = 5_000;

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  slug: string,
): Promise<{ response: Response; retried: boolean }> {
  const doFetch = () => Promise.race([fetch(url, init), timeoutPromise(BRAND_TIMEOUT_MS)]);

  let response: Response;
  try {
    response = await doFetch();
  } catch (err) {
    throw err;
  }

  if (response.status === 504) {
    console.warn(`[CONTINUE] ⚠️ ${slug} got 504, retrying in ${RETRY_DELAY_MS / 1000}s...`);
    await sleep(RETRY_DELAY_MS);
    try {
      response = await doFetch();
      return { response, retried: true };
    } catch (err) {
      throw err;
    }
  }

  return { response, retried: false };
}

async function processBrand(
  brand: { slug: string; syncType: string },
  supabaseUrl: string,
  anonKey: string,
  serviceRoleKey: string,
  supabase: any,
  runId: string,
): Promise<{ success: boolean; productsUpdated: number; error?: string }> {
  const { slug, syncType } = brand;

  try {
    let url: string;
    let init: RequestInit;

    if (syncType === 'regional') {
      url = `${supabaseUrl}/functions/v1/sync-regional-prices`;
      init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
        body: JSON.stringify({ brandSlug: slug, regions: ['US', 'CA', 'EU', 'UK', 'AU'], dryRun: false }),
      };
    } else {
      const functionSlug = getFunctionSlug(slug);
      url = `${supabaseUrl}/functions/v1/sync-${functionSlug}-products`;
      init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceRoleKey}` },
        body: JSON.stringify({ dryRun: false, triggeredBy: 'orchestrator' }),
      };
    }

    const { response: syncResponse, retried } = await fetchWithRetry(url, init, slug);
    const syncResult = await syncResponse.json().catch(() => null);

    if (syncResponse.ok) {
      const updated = syncResult?.summary?.totalUpdated
        || syncResult?.totalUpdated
        || syncResult?.stats?.updated
        || syncResult?.updated
        || syncResult?.summary?.totalMatched
        || 0;
      console.log(`[CONTINUE] ✅ ${slug} synced (${updated} updated${retried ? ', after retry' : ''})`);
      return { success: true, productsUpdated: updated };
    } else {
      const errorMsg = syncResult?.error || syncResponse.statusText;
      const region = syncType === 'regional' ? 'MULTI' : (slug === 'azurefilm' ? 'EU' : 'US');
      console.error(`[CONTINUE] ❌ ${slug} failed: HTTP ${syncResponse.status} — ${errorMsg}`);
      await supabase.from('scrape_errors').insert({
        brand_slug: slug,
        error_type: `http_${syncResponse.status}`,
        error_message: `Sync failed: ${String(errorMsg).slice(0, 500)}`,
        http_status: syncResponse.status,
        url_attempted: url,
        region,
        sync_run_id: runId,
      });
      return { success: false, productsUpdated: 0, error: String(errorMsg) };
    }
  } catch (err) {
    const isTimeout = String(err).includes('TIMEOUT_');
    const region = brand.syncType === 'regional' ? 'MULTI' : (slug === 'azurefilm' ? 'EU' : 'US');
    console.error(`[CONTINUE] ❌ ${slug} ${isTimeout ? 'TIMEOUT' : 'error'}: ${err}`);
    await supabase.from('scrape_errors').insert({
      brand_slug: slug,
      error_type: isTimeout ? 'timeout' : 'network',
      error_message: `${isTimeout ? 'Timed out after 180s' : String(err).slice(0, 500)}`,
      region,
      sync_run_id: runId,
    });
    return { success: false, productsUpdated: 0, error: String(err) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Find incomplete orchestrations (running or partial with pending batches)
    const { data: activeRuns } = await supabase
      .from('orchestration_runs')
      .select('id')
      .in('status', ['running', 'partial'])
      .order('started_at', { ascending: false })
      .limit(1);

    if (!activeRuns?.length) {
      return new Response(JSON.stringify({ message: 'No incomplete orchestrations found' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const runId = activeRuns[0].id;

    // Find next pending batch for this orchestration
    const { data: pendingBatch } = await supabase
      .from('orchestration_batches')
      .select('*')
      .eq('orchestration_id', runId)
      .eq('status', 'pending')
      .order('batch_number', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!pendingBatch) {
      // No pending batches — finalize the orchestration
      // Check for any failed batches to determine final status
      const { data: allBatches } = await supabase
        .from('orchestration_batches')
        .select('status, brands_synced, products_synced, errors_count, error_details')
        .eq('orchestration_id', runId);

      const totalSynced = (allBatches || []).reduce((s: number, b: any) => s + (b.brands_synced || 0), 0);
      const totalProducts = (allBatches || []).reduce((s: number, b: any) => s + (b.products_synced || 0), 0);
      const allFailed: string[] = (allBatches || []).flatMap((b: any) => b.error_details?.failed_brands || []);
      const finalStatus = allFailed.length === 0 ? 'completed' : totalSynced === 0 ? 'failed' : 'partial';

      await supabase.from('orchestration_runs').update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        brands_synced: totalSynced,
        total_products_updated: totalProducts,
        brands_failed: allFailed,
        current_brand_slug: null,
        current_brand_name: null,
        current_product_name: null,
        current_product_url: null,
        summary: {
          note: `Finalized by orchestrator-continue. ${totalSynced} brands synced, ${allFailed.length} failed.`,
          duration_seconds: null,
        },
      }).eq('id', runId);

      return new Response(JSON.stringify({
        message: 'Orchestration finalized',
        runId,
        status: finalStatus,
        brandsSynced: totalSynced,
        totalProducts,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process the pending batch
    const batchBrands = pendingBatch.brand_slugs as string[];
    console.log(`[CONTINUE] Processing batch ${pendingBatch.batch_number} with ${batchBrands.length} brands: ${batchBrands.join(', ')}`);

    // Mark batch as running
    await supabase.from('orchestration_batches').update({
      status: 'running',
      started_at: new Date().toISOString(),
    }).eq('id', pendingBatch.id);

    // Ensure orchestration is marked as running
    await supabase.from('orchestration_runs').update({ status: 'running' }).eq('id', runId);

    const backgroundWork = async () => {
      let brandsSynced = 0;
      let productsSynced = 0;
      let errorsCount = 0;
      const brandsFailed: string[] = [];

      for (const slug of batchBrands) {
        const syncType = REGIONAL_BRANDS.has(slug) ? 'regional' : 'brand-specific';

        await supabase.from('orchestration_runs').update({
          current_brand_slug: slug,
          current_brand_name: slug,
          current_product_name: null,
          current_product_url: null,
        }).eq('id', runId);

        const result = await processBrand({ slug, syncType }, supabaseUrl, anonKey, serviceRoleKey, supabase, runId);

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
        }).eq('id', pendingBatch.id);

        // Update orchestration-level totals
        const { data: allBatches } = await supabase
          .from('orchestration_batches')
          .select('brands_synced, products_synced, error_details')
          .eq('orchestration_id', runId);

        if (allBatches) {
          const totalSynced = allBatches.reduce((s: number, b: any) => s + (b.brands_synced || 0), 0);
          const totalProducts = allBatches.reduce((s: number, b: any) => s + (b.products_synced || 0), 0);
          await supabase.from('orchestration_runs').update({
            brands_synced: totalSynced,
            total_products_updated: totalProducts,
          }).eq('id', runId);
        }

        if (slug !== batchBrands[batchBrands.length - 1]) {
          await sleep(3000);
        }
      }

      // Mark batch complete
      const batchStatus = errorsCount === batchBrands.length ? 'failed' : 'completed';
      await supabase.from('orchestration_batches').update({
        status: batchStatus,
        completed_at: new Date().toISOString(),
        brands_synced: brandsSynced,
        products_synced: productsSynced,
        errors_count: errorsCount,
        error_details: brandsFailed.length > 0 ? { failed_brands: brandsFailed } : null,
      }).eq('id', pendingBatch.id);

      // Check remaining batches
      const { data: remaining } = await supabase
        .from('orchestration_batches')
        .select('id')
        .eq('orchestration_id', runId)
        .eq('status', 'pending');

      if (!remaining?.length) {
        // All done — finalize orchestration
        const { data: finalBatches } = await supabase
          .from('orchestration_batches')
          .select('brands_synced, products_synced, error_details')
          .eq('orchestration_id', runId);

        const totalSynced = (finalBatches || []).reduce((s: number, b: any) => s + (b.brands_synced || 0), 0);
        const totalProducts = (finalBatches || []).reduce((s: number, b: any) => s + (b.products_synced || 0), 0);
        const allFailed: string[] = (finalBatches || []).flatMap((b: any) => b.error_details?.failed_brands || []);

        await supabase.from('orchestration_runs').update({
          status: allFailed.length === 0 ? 'completed' : totalSynced === 0 ? 'failed' : 'partial',
          completed_at: new Date().toISOString(),
          brands_synced: totalSynced,
          total_products_updated: totalProducts,
          brands_failed: allFailed,
          current_brand_slug: null,
          current_brand_name: null,
          current_product_name: null,
          current_product_url: null,
        }).eq('id', runId);

        console.log(`[CONTINUE] All batches complete. Orchestration finalized.`);
      } else {
        console.log(`[CONTINUE] Batch ${pendingBatch.batch_number} done. ${remaining.length} batches remaining.`);
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
      batchNumber: pendingBatch.batch_number,
      brands: batchBrands,
      message: `Processing batch ${pendingBatch.batch_number} with ${batchBrands.length} brands.`,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('orchestrator-continue error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

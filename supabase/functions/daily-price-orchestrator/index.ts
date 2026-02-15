import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ═══════════════════════════════════════════════════════════════════════════
// BRAND CONFIGURATION
// Two sync paths:
//   1. Regional brands → calls sync-regional-prices (multi-region price scraping)
//   2. Brand-specific brands → calls sync-{slug}-products (dedicated scraper)
// ═══════════════════════════════════════════════════════════════════════════

interface BrandEntry {
  slug: string;
  syncType: 'regional' | 'brand-specific';
  tier: 1 | 2 | 3;
  // For brand-specific: the edge function slug (may differ from brand slug)
  functionSlug?: string;
}

// Slug → edge function name mapping (when they differ from brand slug)
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

// All brands the orchestrator manages
const ALL_BRANDS: BrandEntry[] = [
  // ── TIER 1: Daily sync (major brands) ────────────────────────────────
  // Regional brands (multi-store, uses sync-regional-prices)
  { slug: 'bambu-lab',    syncType: 'regional', tier: 1 },
  { slug: 'polymaker',    syncType: 'regional', tier: 1 },
  { slug: 'elegoo',       syncType: 'regional', tier: 1 },
  { slug: 'creality',     syncType: 'regional', tier: 1 },
  { slug: 'anycubic',     syncType: 'regional', tier: 1 },
  // Brand-specific Tier 1
  { slug: 'esun',         syncType: 'brand-specific', tier: 1 },
  { slug: 'prusament',    syncType: 'brand-specific', tier: 1 },
  { slug: 'overture',     syncType: 'brand-specific', tier: 1 },

  // ── TIER 2: Every 3 days ─────────────────────────────────────────────
  // Regional brands
  { slug: 'sunlu',        syncType: 'regional', tier: 2 },
  { slug: 'eryone',       syncType: 'regional', tier: 2 },
  { slug: 'jayo',         syncType: 'regional', tier: 2 },
  { slug: 'kingroon',     syncType: 'regional', tier: 2 },
  { slug: 'sovol',        syncType: 'regional', tier: 2 },
  // Brand-specific Tier 2
  { slug: 'hatchbox',     syncType: 'brand-specific', tier: 2 },
  { slug: 'colorfabb',    syncType: 'brand-specific', tier: 2 },
  { slug: 'fillamentum',  syncType: 'brand-specific', tier: 2 },
  { slug: 'atomic-filament', syncType: 'brand-specific', tier: 2 },
  { slug: 'proto-pasta',  syncType: 'brand-specific', tier: 2 },
  { slug: 'ninjatek',     syncType: 'brand-specific', tier: 2 },

  // ── TIER 3: Weekly ───────────────────────────────────────────────────
  // Regional brands
  { slug: 'qidi',         syncType: 'regional', tier: 3 },
  { slug: 'flashforge',   syncType: 'regional', tier: 3 },
  { slug: 'artillery',    syncType: 'regional', tier: 3 },
  { slug: 'longer',       syncType: 'regional', tier: 3 },
  { slug: 'two-trees',    syncType: 'regional', tier: 3 },
  { slug: 'geeetech',     syncType: 'regional', tier: 3 },
  { slug: 'voxelab',      syncType: 'regional', tier: 3 },
  // Brand-specific Tier 3
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
  1: 24,      // daily
  2: 72,      // every 3 days
  3: 168,     // weekly
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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

      // Check admin role
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
      const startedAt = new Date(runningRun.started_at);
      const minutesRunning = (Date.now() - startedAt.getTime()) / 60000;
      
      if (minutesRunning < 30) {
        return new Response(JSON.stringify({ 
          error: 'Orchestration already running', 
          runId: runningRun.id,
          startedAt: runningRun.started_at 
        }), { 
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      // If stuck for 30+ minutes, mark as failed
      await supabase
        .from('orchestration_runs')
        .update({ status: 'failed', completed_at: new Date().toISOString(), error_log: { error: 'Timed out after 30 minutes' } })
        .eq('id', runningRun.id);
    }

    // Determine eligible brands based on tier frequency
    const eligibleBrands: BrandEntry[] = [];
    
    for (const brand of ALL_BRANDS) {
      const frequencyHours = TIER_FREQUENCY_HOURS[brand.tier];
      
      // Determine sync_type filter for brand_sync_logs
      const syncTypeFilter = brand.syncType === 'regional' ? 'regional_prices' : 'clean_slate';
      
      // Check last sync time from brand_sync_logs
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

    // Sort: Tier 1 first, then Tier 2, then Tier 3
    eligibleBrands.sort((a, b) => a.tier - b.tier);

    console.log(`[ORCHESTRATOR] Eligible brands: ${eligibleBrands.length} (${eligibleBrands.filter(b => b.syncType === 'regional').length} regional, ${eligibleBrands.filter(b => b.syncType === 'brand-specific').length} brand-specific)`);

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

    // Return immediately with run ID, process in background
    const backgroundWork = async () => {
      let brandsSynced = 0;
      const brandsFailed: string[] = [];
      let totalProductsUpdated = 0;
      const brandResults: Record<string, unknown> = {};
      // Aggregate regional totals across all brands
      const regionalTotals: Record<string, { brands_synced: number; products_updated: number; errors: number }> = {};

      for (const brand of eligibleBrands) {
        const { slug, syncType } = brand;
        
        // Update live progress: current brand
        await supabase
          .from('orchestration_runs')
          .update({
            current_brand_slug: slug,
            current_brand_name: slug,
            current_product_name: null,
            current_product_url: null,
          })
          .eq('id', runId);
        
        try {
          let syncResponse: Response;
          
          if (syncType === 'regional') {
            // ── Path 1: Regional price sync (multi-store brands) ──────
            const syncUrl = `${supabaseUrl}/functions/v1/sync-regional-prices`;
            console.log(`[ORCHESTRATOR] Syncing ${slug} via sync-regional-prices`);
            syncResponse = await fetch(syncUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`,
              },
              body: JSON.stringify({
                brandSlug: slug,
                regions: ['US', 'CA', 'EU', 'UK', 'AU'],
                dryRun: false,
              }),
            });
          } else {
            // ── Path 2: Brand-specific sync function ──────────────────
            const functionSlug = getFunctionSlug(slug);
            const functionName = `sync-${functionSlug}-products`;
            const syncUrl = `${supabaseUrl}/functions/v1/${functionName}`;
            console.log(`[ORCHESTRATOR] Syncing ${slug} via ${functionName}`);
            syncResponse = await fetch(syncUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                dryRun: false,
                triggeredBy: 'orchestrator',
              }),
            });
          }

          const syncResult = await syncResponse.json().catch(() => null);
          
          if (syncResponse.ok) {
            brandsSynced++;
            const updated = syncResult?.summary?.totalUpdated 
              || syncResult?.totalUpdated 
              || syncResult?.stats?.updated 
              || syncResult?.updated
              || syncResult?.summary?.totalMatched
              || 0;
            totalProductsUpdated += updated;
            brandResults[slug] = { status: 'success', syncType, productsUpdated: updated };
            console.log(`[ORCHESTRATOR] ✅ ${slug} synced (${updated} updated)`);

            // Aggregate regional totals from sync result
            const rb = syncResult?.regionBreakdown || syncResult?.regional_breakdown;
            if (rb && typeof rb === 'object') {
              for (const [region, stats] of Object.entries(rb as Record<string, any>)) {
                if (!regionalTotals[region]) regionalTotals[region] = { brands_synced: 0, products_updated: 0, errors: 0 };
                regionalTotals[region].brands_synced++;
                regionalTotals[region].products_updated += (stats.updated || stats.matched || 0);
                regionalTotals[region].errors += (stats.errors || stats.rejected || 0);
              }
            }
          } else {
            brandsFailed.push(slug);
            const errorMsg = syncResult?.error || syncResponse.statusText;
            brandResults[slug] = { status: 'failed', syncType, error: errorMsg };
            console.error(`[ORCHESTRATOR] ❌ ${slug} failed: ${errorMsg}`);
            
            // Log HTTP failure to scrape_errors
            await supabase.from('scrape_errors').insert({
              brand_slug: slug,
              error_type: `http_${syncResponse.status}`,
              error_message: `Sync failed: ${String(errorMsg).slice(0, 500)}`,
              sync_run_id: runId,
              region: null,
            }).then(() => {});
          }
        } catch (err) {
          brandsFailed.push(slug);
          brandResults[slug] = { status: 'error', syncType, error: String(err) };
          console.error(`[ORCHESTRATOR] ❌ ${slug} error: ${err}`);
          
          // Log error to scrape_errors
          await supabase.from('scrape_errors').insert({
            brand_slug: slug,
            error_type: 'network',
            error_message: String(err).slice(0, 500),
            stack_trace: err instanceof Error ? err.stack?.slice(0, 2000) : null,
            sync_run_id: runId,
            region: null,
          }).then(() => {});
        }

        // Update progress in DB
        await supabase
          .from('orchestration_runs')
          .update({
            brands_synced: brandsSynced,
            brands_failed: brandsFailed,
            total_products_updated: totalProductsUpdated,
          })
          .eq('id', runId);

        // Rate limiting: wait 3 seconds between brands
        if (brand !== eligibleBrands[eligibleBrands.length - 1]) {
          await sleep(3000);
        }
      }

      // Determine final status
      const finalStatus = brandsFailed.length === 0 
        ? 'completed' 
        : brandsSynced === 0 
          ? 'failed' 
          : 'partial';

      const completedAt = new Date().toISOString();
      const runStartTime = run.started_at ? new Date(run.started_at).getTime() : Date.now();
      const actualDuration = (Date.now() - runStartTime) / 1000;

      // Update final status with regional totals, clear live progress
      await supabase
        .from('orchestration_runs')
        .update({
          status: finalStatus,
          completed_at: completedAt,
          brands_synced: brandsSynced,
          brands_failed: brandsFailed,
          total_products_updated: totalProductsUpdated,
          current_brand_slug: null,
          current_brand_name: null,
          current_product_name: null,
          current_product_url: null,
          summary: {
            duration_seconds: Math.round(actualDuration),
            eligible_brands: eligibleBrands.length,
            regional_brands: eligibleBrands.filter(b => b.syncType === 'regional').length,
            brand_specific_brands: eligibleBrands.filter(b => b.syncType === 'brand-specific').length,
            brand_results: brandResults,
            regional_totals: regionalTotals,
            tier_breakdown: {
              tier1: eligibleBrands.filter(b => b.tier === 1).length,
              tier2: eligibleBrands.filter(b => b.tier === 2).length,
              tier3: eligibleBrands.filter(b => b.tier === 3).length,
            }
          },
        })
        .eq('id', runId);
      
      console.log(`[ORCHESTRATOR] ═══ Complete: ${brandsSynced} synced, ${brandsFailed.length} failed, ${totalProductsUpdated} products updated ═══`);
    };

    // Use EdgeRuntime.waitUntil if available, otherwise run inline
    if (typeof (globalThis as any).EdgeRuntime !== 'undefined' && (globalThis as any).EdgeRuntime.waitUntil) {
      (globalThis as any).EdgeRuntime.waitUntil(backgroundWork());
    } else {
      backgroundWork().catch(console.error);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      runId,
      eligibleBrands: eligibleBrands.length,
      regionalBrands: eligibleBrands.filter(b => b.syncType === 'regional').map(b => b.slug),
      brandSpecificBrands: eligibleBrands.filter(b => b.syncType === 'brand-specific').map(b => b.slug),
      message: `Orchestration started. Processing ${eligibleBrands.length} brands (${eligibleBrands.filter(b => b.syncType === 'regional').length} regional, ${eligibleBrands.filter(b => b.syncType === 'brand-specific').length} brand-specific).`
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

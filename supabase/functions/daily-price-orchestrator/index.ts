import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Priority tiers for brand syncing
const TIER_1_BRANDS = ['bambu-lab', 'polymaker', 'prusament', 'esun', 'overture', 'elegoo', 'creality', 'anycubic'];
const TIER_2_BRANDS = ['sunlu', 'eryone', 'hatchbox', 'colorfabb', 'fillamentum'];
// Tier 3 = all remaining brands with regional domains

const TIER_FREQUENCY_HOURS: Record<number, number> = {
  1: 24,      // daily
  2: 72,      // every 3 days
  3: 168,     // weekly
};

// All brands with regional domains (from sync-regional-prices BRAND_REGIONAL_DOMAINS)
const ALL_REGIONAL_BRANDS = [
  'bambu-lab', 'elegoo', 'polymaker', 'creality', 'anycubic', 'qidi', 'flashforge',
  'sunlu', 'eryone', 'jayo', 'kingroon', 'sovol', 'artillery', 'longer',
  'two-trees', 'geeetech', 'voxelab'
];

function getBrandTier(brandSlug: string): number {
  if (TIER_1_BRANDS.includes(brandSlug)) return 1;
  if (TIER_2_BRANDS.includes(brandSlug)) return 2;
  return 3;
}

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
      
      // If running for less than 30 minutes, reject
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
    const eligibleBrands: string[] = [];
    
    for (const brandSlug of ALL_REGIONAL_BRANDS) {
      const tier = getBrandTier(brandSlug);
      const frequencyHours = TIER_FREQUENCY_HOURS[tier];
      
      // Check last sync time from brand_sync_logs
      const { data: lastSync } = await supabase
        .from('brand_sync_logs')
        .select('completed_at')
        .eq('brand_slug', brandSlug)
        .eq('sync_type', 'regional_prices')
        .in('status', ['completed', 'partial'])
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!lastSync?.completed_at) {
        eligibleBrands.push(brandSlug);
        continue;
      }
      
      const hoursSinceSync = (Date.now() - new Date(lastSync.completed_at).getTime()) / 3600000;
      if (hoursSinceSync >= frequencyHours) {
        eligibleBrands.push(brandSlug);
      }
    }

    // Sort: Tier 1 first, then Tier 2, then Tier 3
    eligibleBrands.sort((a, b) => getBrandTier(a) - getBrandTier(b));

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

      for (const brandSlug of eligibleBrands) {
        try {
          // Call sync-regional-prices for this brand
          const syncUrl = `${supabaseUrl}/functions/v1/sync-regional-prices`;
          const syncResponse = await fetch(syncUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              brandSlug,
              regions: ['US', 'CA', 'EU', 'UK', 'AU'],
              dryRun: false,
            }),
          });

          const syncResult = await syncResponse.json().catch(() => null);
          
          if (syncResponse.ok) {
            brandsSynced++;
            const updated = syncResult?.summary?.totalUpdated || syncResult?.totalUpdated || 0;
            totalProductsUpdated += updated;
            brandResults[brandSlug] = { status: 'success', productsUpdated: updated };
          } else {
            brandsFailed.push(brandSlug);
            brandResults[brandSlug] = { status: 'failed', error: syncResult?.error || syncResponse.statusText };
          }
        } catch (err) {
          brandsFailed.push(brandSlug);
          brandResults[brandSlug] = { status: 'error', error: String(err) };
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
        if (brandSlug !== eligibleBrands[eligibleBrands.length - 1]) {
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
      const startedAt = new Date(run.started_at || Date.now());
      const durationSeconds = (Date.now() - startedAt.getTime()) / 1000;

      // Update final status
      await supabase
        .from('orchestration_runs')
        .update({
          status: finalStatus,
          completed_at: completedAt,
          brands_synced: brandsSynced,
          brands_failed: brandsFailed,
          total_products_updated: totalProductsUpdated,
          summary: {
            duration_seconds: Math.round(durationSeconds),
            eligible_brands: eligibleBrands.length,
            brand_results: brandResults,
            tier_breakdown: {
              tier1: eligibleBrands.filter(b => getBrandTier(b) === 1).length,
              tier2: eligibleBrands.filter(b => getBrandTier(b) === 2).length,
              tier3: eligibleBrands.filter(b => getBrandTier(b) === 3).length,
            }
          },
        })
        .eq('id', runId);
    };

    // Use EdgeRuntime.waitUntil if available, otherwise run inline
    if (typeof (globalThis as any).EdgeRuntime !== 'undefined' && (globalThis as any).EdgeRuntime.waitUntil) {
      (globalThis as any).EdgeRuntime.waitUntil(backgroundWork());
    } else {
      // Fallback: run in background without blocking response
      backgroundWork().catch(console.error);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      runId,
      eligibleBrands: eligibleBrands.length,
      brands: eligibleBrands,
      message: `Orchestration started. Processing ${eligibleBrands.length} brands.`
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

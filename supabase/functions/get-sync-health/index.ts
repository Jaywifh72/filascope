/**
 * GET SYNC HEALTH
 *
 * Returns real-time sync health metrics for all brands, including:
 * - Last sync time per brand
 * - Success/failure rates over time
 * - Brands that have missed their scheduled sync windows
 * - Current sync status (running vs idle)
 * - Recent errors and patterns
 *
 * GET  /get-sync-health           → overall summary + brand details
 * GET  /get-sync-health?summary=1 → summary only (for alerts)
 * GET  /get-sync-health?alerts=1  → only brands needing attention
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrandConfig {
  slug: string;
  tier: 1 | 2 | 3;
}

const ALL_BRANDS: BrandConfig[] = [
  // TIER 1: Daily sync (24h)
  { slug: 'bambu-lab', tier: 1 },
  { slug: 'polymaker', tier: 1 },
  { slug: 'elegoo', tier: 1 },
  { slug: 'creality', tier: 1 },
  { slug: 'anycubic', tier: 1 },
  { slug: 'esun', tier: 1 },
  { slug: 'prusament', tier: 1 },
  { slug: 'overture', tier: 1 },

  // TIER 2: Every 3 days (72h)
  { slug: 'sunlu', tier: 2 },
  { slug: 'eryone', tier: 2 },
  { slug: 'jayo', tier: 2 },
  { slug: 'kingroon', tier: 2 },
  { slug: 'sovol', tier: 2 },
  { slug: 'hatchbox', tier: 2 },
  { slug: 'colorfabb', tier: 2 },
  { slug: 'fillamentum', tier: 2 },
  { slug: 'atomic-filament', tier: 2 },
  { slug: 'proto-pasta', tier: 2 },
  { slug: 'ninjatek', tier: 2 },

  // TIER 3: Weekly (168h)
  { slug: 'qidi', tier: 3 },
  { slug: 'flashforge', tier: 3 },
  { slug: 'artillery', tier: 3 },
  { slug: 'geeetech', tier: 3 },
  { slug: '3d-fuel', tier: 3 },
  { slug: '3dhojor', tier: 3 },
  { slug: '3dxtech', tier: 3 },
  { slug: 'amolen', tier: 3 },
  { slug: 'azurefilm', tier: 3 },
  { slug: 'duramic-3d', tier: 3 },
  { slug: 'extrudr', tier: 3 },
  { slug: 'fiberlogy', tier: 3 },
  { slug: 'formfutura', tier: 3 },
  { slug: 'fusion-filaments', tier: 3 },
  { slug: 'gizmo-dorks', tier: 3 },
  { slug: 'ic3d-printers', tier: 3 },
  { slug: 'matter3d', tier: 3 },
  { slug: 'numakers', tier: 3 },
  { slug: 'paramount-3d', tier: 3 },
  { slug: 'push-plastic', tier: 3 },
  { slug: 'recreus', tier: 3 },
  { slug: 'siraya-tech', tier: 3 },
  { slug: 'spectrum-filaments', tier: 3 },
  { slug: 'treed-filaments', tier: 3 },
  { slug: 'ultimaker', tier: 3 },
  { slug: 'voxelpla', tier: 3 },
  { slug: 'yousu', tier: 3 },
  { slug: 'ziro', tier: 3 },
  { slug: 'sainsmart', tier: 3 },
  { slug: 'gst3d', tier: 3 },
  { slug: 'filaments-ca', tier: 3 },
  { slug: 'printed-solid', tier: 3 },
  { slug: 'taulman3d', tier: 3 },
];

const TIER_FREQUENCY_HOURS: Record<number, number> = {
  1: 24,
  2: 72,
  3: 168,
};

const ALERT_THRESHOLD_HOURS: Record<number, number> = {
  1: 30,   // Daily brands: alert if 30h+ since last sync
  2: 84,   // Tier 2: alert if 84h+ (12h past due)
  3: 180,  // Tier 3: alert if 180h+ (12h past due)
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const summaryOnly = url.searchParams.get('summary') === '1';
  const alertsOnly = url.searchParams.get('alerts') === '1';

  try {
    // Get all sync logs from the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: syncLogs, error: logsError } = await supabase
      .from('brand_sync_logs')
      .select('*')
      .gte('started_at', thirtyDaysAgo)
      .order('started_at', { ascending: false });

    if (logsError) throw logsError;

    // Get currently running syncs
    const { data: runningSyncs, error: runningError } = await supabase
      .from('brand_sync_logs')
      .select('*')
      .eq('status', 'running')
      .order('started_at', { ascending: false });

    if (runningError) throw runningError;

    // Get recent scrape errors (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentErrors, error: errorsError } = await supabase
      .from('scrape_errors')
      .select('*')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(100);

    if (errorsError) throw errorsError;

    // Process each brand's health
    const brandHealth: any[] = [];
    let totalSyncs = 0;
    let successfulSyncs = 0;
    let failedSyncs = 0;
    let staleBrands: string[] = [];
    let failedBrands: string[] = [];

    const now = Date.now();

    for (const brand of ALL_BRANDS) {
      const brandLogs = syncLogs?.filter(log => log.brand_slug === brand.slug) || [];
      const lastSync = brandLogs[0]; // Most recent

      let lastSyncTime: string | null = null;
      let hoursSinceSync: number | null = null;
      let isSuccess = false;
      let failureRate = 0;
      let recentFailures = 0;
      let recentSuccesses = 0;

      if (lastSync) {
        lastSyncTime = lastSync.started_at;
        hoursSinceSync = (now - new Date(lastSync.started_at).getTime()) / 3600000;
        isSuccess = lastSync.status === 'completed' || lastSync.status === 'partial';
      }

      // Calculate failure rate over recent attempts (last 10)
      const recentAttempts = brandLogs.slice(0, 10);
      const recentCompleted = recentAttempts.filter(l => l.status === 'completed' || l.status === 'partial').length;
      const recentFailed = recentAttempts.filter(l => l.status === 'failed').length;
      failureRate = recentAttempts.length > 0 ? (recentFailed / recentAttempts.length) * 100 : 0;

      // Count successes and failures in the 30-day window
      const completedCount = brandLogs.filter(l => l.status === 'completed' || l.status === 'partial').length;
      const failedCount = brandLogs.filter(l => l.status === 'failed').length;
      recentSuccesses = completedCount;
      recentFailures = failedCount;

      totalSyncs += completedCount + failedCount;
      successfulSyncs += completedCount;
      failedSyncs += failedCount;

      const frequencyHours = TIER_FREQUENCY_HOURS[brand.tier];
      const alertThreshold = ALERT_THRESHOLD_HOURS[brand.tier];

      // Check if brand is stale (past due)
      const isStale = hoursSinceSync !== null && hoursSinceSync > alertThreshold;
      const isFailed = failureRate >= 50 && recentAttempts.length >= 3;
      const isRunning = runningSyncs?.some(r => r.brand_slug === brand.slug);

      if (isStale) staleBrands.push(brand.slug);
      if (isFailed) failedBrands.push(brand.slug);

      if (!summaryOnly) {
        brandHealth.push({
          slug: brand.slug,
          tier: brand.tier,
          frequencyHours,
          lastSyncTime,
          hoursSinceSync: Math.round(hoursSinceSync || 0),
          isStale,
          lastStatus: lastSync?.status || 'never',
          failureRate: Math.round(failureRate),
          isFailed,
          isRunning,
          recentSuccesses,
          recentFailures,
          recentAttempts: recentAttempts.length,
        });
      }
    }

    const overallFailureRate = totalSyncs > 0 ? (failedSyncs / totalSyncs) * 100 : 0;
    const isHealthy = staleBrands.length === 0 && failedBrands.length === 0;

    // Calculate tier-specific metrics
    const tierMetrics = {
      tier1: { total: 0, stale: 0, failed: 0 },
      tier2: { total: 0, stale: 0, failed: 0 },
      tier3: { total: 0, stale: 0, failed: 0 },
    };

    ALL_BRANDS.forEach(brand => {
      const tier = `tier${brand.tier}` as keyof typeof tierMetrics;
      tierMetrics[tier].total++;
      if (staleBrands.includes(brand.slug)) tierMetrics[tier].stale++;
      if (failedBrands.includes(brand.slug)) tierMetrics[tier].failed++;
    });

    const response: any = {
      summary: {
        isHealthy,
        overallFailureRate: Math.round(overallFailureRate),
        totalBrands: ALL_BRANDS.length,
        staleBrands: staleBrands.length,
        failedBrands: failedBrands.length,
        runningSyncs: runningSyncs?.length || 0,
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        tierMetrics,
      },
      alerts: {
        staleBrands,
        failedBrands,
        recentErrors: recentErrors?.slice(0, 10).map(e => ({
          brandSlug: e.brand_slug,
          errorType: e.error_type,
          errorMessage: e.error_message?.substring(0, 200),
          createdAt: e.created_at,
        })) || [],
      },
    };

    if (!summaryOnly && !alertsOnly) {
      response.brandHealth = brandHealth;
      response.runningSyncs = runningSyncs?.map(r => ({
        slug: r.brand_slug,
        startedAt: r.started_at,
        durationMinutes: Math.round((now - new Date(r.started_at).getTime()) / 60000),
      })) || [];
    }

    if (alertsOnly) {
      return new Response(
        JSON.stringify({
          needsAttention: !isHealthy,
          alerts: response.alerts,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      );
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );

  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});

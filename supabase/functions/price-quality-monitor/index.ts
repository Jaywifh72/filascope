// price-quality-monitor/index.ts
// Daily price quality monitoring — tracks coverage, freshness, and anomalies
// Runs at 04:00 EST after enrichment pipeline

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const report: any = {
      timestamp: new Date().toISOString(),
      checks: {},
    };

    // ── Check 1: Price Coverage ────────────────────────────────────────
    const { count: total } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true });

    const { count: nullPrices } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .is('variant_price', null);

    const priceCoverage = total ? ((total - (nullPrices || 0)) / total * 100) : 0;
    report.checks.price_coverage = {
      total: total || 0,
      with_price: (total || 0) - (nullPrices || 0),
      without_price: nullPrices || 0,
      coverage_pct: Math.round(priceCoverage * 10) / 10,
      status: priceCoverage >= 95 ? 'PASS' : priceCoverage >= 80 ? 'WARNING' : 'FAIL',
      threshold: 95,
    };

    // ── Check 2: Price Freshness ───────────────────────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: staleCount } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .not('variant_price', 'is', null)
      .lt('last_scraped_at', thirtyDaysAgo);

    const freshPct = total ? (((total - (nullPrices || 0)) - (staleCount || 0)) / (total - (nullPrices || 0)) * 100) : 0;
    report.checks.price_freshness = {
      fresh: (total || 0) - (nullPrices || 0) - (staleCount || 0),
      stale: staleCount || 0,
      freshness_pct: Math.round(freshPct * 10) / 10,
      status: freshPct >= 90 ? 'PASS' : freshPct >= 70 ? 'WARNING' : 'FAIL',
      threshold: 90,
    };

    // ── Check 3: Regional Price Coverage ───────────────────────────────
    const { count: withRegional } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .not('variant_price', 'is', null)
      .not('price_eur', 'is', null);

    const regionalPct = total ? (withRegional || 0) / total * 100 : 0;
    report.checks.regional_coverage = {
      with_regional: withRegional || 0,
      total: total || 0,
      coverage_pct: Math.round(regionalPct * 10) / 10,
      status: regionalPct >= 80 ? 'PASS' : regionalPct >= 50 ? 'WARNING' : 'FAIL',
      threshold: 80,
    };

    // ── Check 4: Anomalous Prices ──────────────────────────────────────
    const { data: anomalies } = await supabase
      .from('filaments')
      .select('id, brand_name, product_title, variant_price')
      .or('variant_price.gt.500,variant_price.lt.1')
      .not('variant_price', 'is', null)
      .limit(20);

    report.checks.price_anomalies = {
      count: anomalies?.length || 0,
      status: (anomalies?.length || 0) === 0 ? 'PASS' : (anomalies?.length || 0) <= 5 ? 'WARNING' : 'FAIL',
      samples: anomalies?.slice(0, 5).map(a => ({
        brand: a.brand_name,
        title: a.product_title?.slice(0, 40),
        price: a.variant_price,
      })),
    };

    // ── Check 5: Brand Sync Health ─────────────────────────────────────
    const { data: recentSyncs } = await supabase
      .from('brand_sync_logs')
      .select('brand_slug, status, created_at, products_created, products_updated, products_failed')
      .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    const failedSyncs = recentSyncs?.filter(s => s.status === 'failed') || [];
    const stuckSyncs = recentSyncs?.filter(s => s.status === 'running') || [];
    
    report.checks.brand_sync = {
      recent_syncs: recentSyncs?.length || 0,
      failed: failedSyncs.length,
      stuck_running: stuckSyncs.length,
      failed_brands: failedSyncs.map(s => s.brand_slug),
      stuck_brands: stuckSyncs.map(s => s.brand_slug),
      status: failedSyncs.length === 0 && stuckSyncs.length === 0 ? 'PASS' : 'FAIL',
    };

    // ── Overall Grade ──────────────────────────────────────────────────
    const checks = Object.values(report.checks) as any[];
    const passCount = checks.filter(c => c.status === 'PASS').length;
    const totalChecks = checks.length;
    const score = Math.round((passCount / totalChecks) * 100);

    let grade: string;
    if (score >= 95) grade = 'A+';
    else if (score >= 90) grade = 'A';
    else if (score >= 85) grade = 'B+';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    report.overall = {
      score,
      grade,
      pass_count: passCount,
      total_checks: totalChecks,
    };

    // Store report
    await supabase
      .from('system_config')
      .upsert({
        key: 'price_quality_report',
        value: JSON.stringify(report),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    return new Response(JSON.stringify(report, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // Support GET or POST
    let dateParam = url.searchParams.get('date');
    if (!dateParam) {
      // Default to today in America/Toronto
      const now = new Date();
      const torontoStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Toronto',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(now);
      dateParam = torontoStr; // en-CA gives YYYY-MM-DD
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseKey);

    console.log(`[daily-ops-log] Generating log for date: ${dateParam}`);

    // ── 1. Filaments added on that date ──────────────────────────────────────
    let filamentsAddedDetail: any[] = [];
    let filamentsAddedCount = 0;

    const { data: rawFilamentsAdded } = await sb
      .from('filaments')
      .select('id, vendor, product_title, created_at')
      .gte('created_at', `${dateParam}T00:00:00-05:00`)
      .lt('created_at', getNextDay(dateParam) + 'T00:00:00-05:00');

    if (rawFilamentsAdded && rawFilamentsAdded.length > 0) {
      // Filter by Toronto date
      const filtered = rawFilamentsAdded.filter(f => {
        const d = toTorontoDate(f.created_at);
        return d === dateParam;
      });
      filamentsAddedCount = filtered.length;
      // Group by vendor
      const grouped: Record<string, any> = {};
      for (const f of filtered) {
        const v = f.vendor || 'Unknown';
        if (!grouped[v]) grouped[v] = { vendor: v, count: 0, titles: [] };
        grouped[v].count++;
        grouped[v].titles.push(f.product_title);
      }
      filamentsAddedDetail = Object.values(grouped).sort((a: any, b: any) => b.count - a.count);
    }

    // ── 2. Filaments data completeness (updated on that date) ────────────────
    const { data: rawUpdated } = await sb
      .from('filaments')
      .select('id, color_hex, finish_type, image_url, updated_at')
      .gte('updated_at', `${dateParam}T00:00:00-05:00`)
      .lt('updated_at', getNextDay(dateParam) + 'T00:00:00-05:00');

    let colorHexAdded = 0;
    let finishTypeAdded = 0;
    let imagesAdded = 0;

    if (rawUpdated) {
      const filtered = rawUpdated.filter(f => toTorontoDate(f.updated_at) === dateParam);
      colorHexAdded = filtered.filter(f => f.color_hex != null).length;
      finishTypeAdded = filtered.filter(f => f.finish_type != null).length;
      imagesAdded = filtered.filter(f => f.image_url != null).length;
    }

    const filamentsDataAdded = colorHexAdded + finishTypeAdded;
    const filamentsDataDetail = [
      ...(colorHexAdded > 0 ? [{ field: 'Color Hex', count: colorHexAdded }] : []),
      ...(finishTypeAdded > 0 ? [{ field: 'Finish Type', count: finishTypeAdded }] : []),
    ];

    // Images detail by vendor
    let filamentsImagesDetail: any[] = [];
    if (rawUpdated && imagesAdded > 0) {
      const withImg = rawUpdated.filter(f => f.image_url != null && toTorontoDate(f.updated_at) === dateParam);
      // We need vendor — fetch those IDs
      if (withImg.length > 0) {
        const ids = withImg.map(f => f.id);
        const { data: imgVendors } = await sb
          .from('filaments')
          .select('id, vendor')
          .in('id', ids.slice(0, 500));
        if (imgVendors) {
          const vMap: Record<string, number> = {};
          for (const f of imgVendors) {
            const v = f.vendor || 'Unknown';
            vMap[v] = (vMap[v] || 0) + 1;
          }
          filamentsImagesDetail = Object.entries(vMap)
            .map(([vendor, count]) => ({ vendor, count }))
            .sort((a: any, b: any) => b.count - a.count);
        }
      }
    }

    // ── 3. TD values added ───────────────────────────────────────────────────
    const { data: tdData } = await sb
      .from('td_population_log')
      .select('filament_id, td_value, source, created_at')
      .gte('created_at', `${dateParam}T00:00:00-05:00`)
      .lt('created_at', getNextDay(dateParam) + 'T00:00:00-05:00')
      .order('created_at', { ascending: false })
      .limit(100);

    let tdDetail: any[] = [];
    let tdAdded = 0;

    if (tdData && tdData.length > 0) {
      const filtered = tdData.filter(t => toTorontoDate(t.created_at) === dateParam);
      tdAdded = filtered.length;
      if (filtered.length > 0) {
        const ids = [...new Set(filtered.map(t => t.filament_id))];
        const { data: filDetails } = await sb
          .from('filaments')
          .select('id, vendor, product_title')
          .in('id', ids.slice(0, 100));
        const fMap: Record<string, any> = {};
        if (filDetails) for (const f of filDetails) fMap[f.id] = f;
        tdDetail = filtered.map(t => ({
          vendor: fMap[t.filament_id]?.vendor || 'Unknown',
          product_title: fMap[t.filament_id]?.product_title || t.filament_id,
          td_value: t.td_value,
          source: t.source,
          created_at: t.created_at,
        }));
      }
    }

    // ── 4. Printers added ────────────────────────────────────────────────────
    const { data: printersAdded } = await sb
      .from('printers')
      .select('id, model_name, created_at')
      .gte('created_at', `${dateParam}T00:00:00-05:00`)
      .lt('created_at', getNextDay(dateParam) + 'T00:00:00-05:00')
      .order('created_at', { ascending: false });

    const printersAddedFiltered = (printersAdded || []).filter(p => toTorontoDate(p.created_at) === dateParam);
    const printersAddedDetail = printersAddedFiltered.map(p => ({
      model_name: p.model_name,
      created_at: p.created_at,
    }));

    // Total printers count
    const { count: printersTotal } = await sb
      .from('printers')
      .select('id', { count: 'exact', head: true });

    // Total filaments count
    const { count: filamentsTotal } = await sb
      .from('filaments')
      .select('id', { count: 'exact', head: true });

    // ── 5. Brand syncs ───────────────────────────────────────────────────────
    let brandsSyncedDetail: any[] = [];
    let brandsSynced = 0;
    let brandsFailed: any[] = [];

    const { data: syncLogs } = await sb
      .from('brand_sync_logs')
      .select('brand_slug, products_created, products_updated, products_failed, status, completed_at, duration_seconds, created_at')
      .gte('created_at', `${dateParam}T00:00:00-05:00`)
      .lt('created_at', getNextDay(dateParam) + 'T00:00:00-05:00')
      .order('completed_at', { ascending: false });

    if (syncLogs) {
      const filtered = syncLogs.filter(s => toTorontoDate(s.created_at) === dateParam);
      brandsSyncedDetail = filtered;
      brandsSynced = filtered.filter(s => s.status === 'completed').length;
      brandsFailed = filtered.filter(s => s.status !== 'completed');
    }

    // ── 6. Opportunities (always fresh) ──────────────────────────────────────
    const opportunities: any[] = [];

    // Brands with no prices
    const { data: noPriceBrands } = await sb
      .from('automated_brands')
      .select('brand_slug, product_count')
      .eq('products_with_prices', 0)
      .eq('scraping_enabled', true)
      .gt('product_count', 50)
      .order('product_count', { ascending: false })
      .limit(10);

    if (noPriceBrands) {
      for (const b of noPriceBrands) {
        opportunities.push({
          id: generateUUID(),
          title: `Fix ${b.brand_slug} price coverage`,
          category: 'prices',
          priority: b.product_count > 200 ? 'high' : b.product_count > 100 ? 'medium' : 'low',
          description: `${b.brand_slug} has ${b.product_count} products but 0 prices. Brand sync is working but prices not flowing.`,
          suggested_prompt: `Investigate why ${b.brand_slug} has 0 prices despite having ${b.product_count} products. Check the brand scraper function and variant_price mapping. Fix price extraction for this brand.`,
          status: 'pending',
        });
      }
    }

    // Brands not synced in 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: staleBrands } = await sb
      .from('automated_brands')
      .select('brand_slug, last_scrape_at, product_count')
      .eq('scraping_enabled', true)
      .or(`last_scrape_at.lt.${sevenDaysAgo.toISOString()},last_scrape_at.is.null`)
      .order('product_count', { ascending: false })
      .limit(10);

    if (staleBrands) {
      for (const b of staleBrands) {
        const lastScrape = b.last_scrape_at
          ? `Last scraped ${Math.round((Date.now() - new Date(b.last_scrape_at).getTime()) / 86400000)} days ago`
          : 'Never scraped';
        opportunities.push({
          id: generateUUID(),
          title: `Re-sync ${b.brand_slug} (stale data)`,
          category: 'prices',
          priority: b.product_count > 200 ? 'medium' : 'low',
          description: `${b.brand_slug} has ${b.product_count} products. ${lastScrape}. Prices may be stale.`,
          suggested_prompt: `Trigger a full brand sync for ${b.brand_slug} to refresh all prices and check for new products. This brand hasn't been synced in 7+ days.`,
          status: 'pending',
        });
      }
    }

    // TD coverage gaps — query directly
    {
      const { data: vendorGroups } = await sb
        .from('filaments')
        .select('vendor, td_confidence')
        .limit(10000);

      if (vendorGroups) {
        const vStats: Record<string, { total: number; withTd: number }> = {};
        for (const f of vendorGroups) {
          const v = f.vendor || 'Unknown';
          if (!vStats[v]) vStats[v] = { total: 0, withTd: 0 };
          vStats[v].total++;
          if (f.td_confidence != null) vStats[v].withTd++;
        }
        const gaps = Object.entries(vStats)
          .filter(([, s]) => s.total > 100)
          .map(([vendor, s]) => ({
            vendor,
            total: s.total,
            with_td: s.withTd,
            td_pct: Math.round((s.withTd / s.total) * 100 * 10) / 10,
          }))
          .filter(g => g.td_pct < 5)
          .sort((a, b) => a.td_pct - b.td_pct)
          .slice(0, 10);

        for (const g of gaps) {
          opportunities.push({
            id: generateUUID(),
            title: `Improve TD coverage for ${g.vendor}`,
            category: 'td',
            priority: g.total > 200 ? 'high' : 'medium',
            description: `${g.vendor} has ${g.total} filaments but only ${g.td_pct}% (${g.with_td}) have TD values. Major gap in HueForge moat.`,
            suggested_prompt: `Run TD population for ${g.vendor}: query their ${g.total} filaments without TD values and populate td_confidence from td_reference_values. Check if this brand has entries in td_reference_values table.`,
            status: 'pending',
          });
        }
      }
    }

    // ── Assemble and upsert ──────────────────────────────────────────────────
    const logRecord = {
      log_date: dateParam,
      generated_at: new Date().toISOString(),
      filaments_total: filamentsTotal || 0,
      filaments_added: filamentsAddedCount,
      filaments_added_detail: filamentsAddedDetail,
      filaments_data_added: filamentsDataAdded,
      filaments_data_added_detail: filamentsDataDetail,
      filaments_images_added: imagesAdded,
      filaments_images_detail: filamentsImagesDetail,
      filaments_td_added: tdAdded,
      filaments_td_detail: tdDetail,
      printers_total: printersTotal || 0,
      printers_added: printersAddedFiltered.length,
      printers_added_detail: printersAddedDetail,
      printers_updated: 0,
      printers_updated_detail: [],
      brands_synced: brandsSynced,
      brands_synced_detail: brandsSyncedDetail,
      brands_failed: brandsFailed,
      seo_actions: [],
      seo_metrics: {},
      trending_topics: [],
      opportunities: opportunities,
      pipeline_errors: [],
      pipeline_summary: buildSummary({
        filamentsAddedCount,
        imagesAdded,
        tdAdded,
        brandsSynced,
        printersAdded: printersAddedFiltered.length,
        opportunities: opportunities.length,
      }),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await sb
      .from('daily_ops_log')
      .upsert(logRecord, { onConflict: 'log_date' });

    if (upsertErr) {
      console.error('[daily-ops-log] Upsert error:', upsertErr);
      return new Response(
        JSON.stringify({ success: false, error: upsertErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[daily-ops-log] ✅ Log saved for ${dateParam}`);

    return new Response(
      JSON.stringify({
        success: true,
        date: dateParam,
        summary: {
          filaments_added: filamentsAddedCount,
          images_added: imagesAdded,
          td_added: tdAdded,
          brands_synced: brandsSynced,
          printers_added: printersAddedFiltered.length,
          opportunities: opportunities.length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[daily-ops-log] Fatal error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function toTorontoDate(isoStr: string): string {
  if (!isoStr) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(isoStr));
}

function getNextDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function generateUUID(): string {
  return crypto.randomUUID();
}

function buildSummary(stats: {
  filamentsAddedCount: number;
  imagesAdded: number;
  tdAdded: number;
  brandsSynced: number;
  printersAdded: number;
  opportunities: number;
}): string {
  const parts: string[] = [];
  if (stats.filamentsAddedCount > 0) parts.push(`+${stats.filamentsAddedCount} filaments added`);
  if (stats.imagesAdded > 0) parts.push(`+${stats.imagesAdded} images`);
  if (stats.tdAdded > 0) parts.push(`+${stats.tdAdded} TD values`);
  if (stats.brandsSynced > 0) parts.push(`${stats.brandsSynced} brand syncs`);
  if (stats.printersAdded > 0) parts.push(`+${stats.printersAdded} printers`);
  if (stats.opportunities > 0) parts.push(`${stats.opportunities} opportunities`);
  if (parts.length === 0) return 'Quiet day — no major changes detected.';
  return parts.join(', ') + '.';
}

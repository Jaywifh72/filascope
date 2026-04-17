// enrich-prices-post-sync/index.ts
// Post-sync price enrichment pipeline — fills gaps, enriches regional, validates
// Triggered daily at 03:30 EST after brand syncs complete

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentResult {
  step: string;
  affected: number;
  details: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results: EnrichmentResult[] = [];

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('[EnrichPrices] Starting post-sync enrichment pipeline');

  try {
    // ========================================================================
    // STEP 1: MSRP → Price Backfill
    // For filaments where variant_price IS NULL but msrp IS NOT NULL
    // ========================================================================
    console.log('[EnrichPrices] Step 1: MSRP backfill...');
    
    const { data: msrpData, error: msrpError } = await supabase.rpc('exec_sql', {
      query: `
        UPDATE filaments 
        SET variant_price = msrp,
            price_source = COALESCE(price_source || ',', '') || 'msrp_fallback',
            updated_at = NOW()
        WHERE variant_price IS NULL 
          AND msrp IS NOT NULL 
          AND msrp > 0
        RETURNING id, brand_name, product_title, msrp;
      `
    });

    if (msrpError) {
      // Fallback: use REST API to find and update
      console.log('[EnrichPrices] RPC not available, using REST fallback');
      const { data: nullPriceFilaments, error: fetchError } = await supabase
        .from('filaments')
        .select('id, brand_name, product_title, msrp')
        .is('variant_price', null)
        .not('msrp', 'is', null)
        .gt('msrp', 0)
        .limit(500);

      let msrpBackfilled = 0;
      if (!fetchError && nullPriceFilaments) {
        for (const f of nullPriceFilaments) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update({
              variant_price: f.msrp,
              price_source: 'msrp_fallback',
              updated_at: new Date().toISOString(),
            })
            .eq('id', f.id);
          if (!updateError) msrpBackfilled++;
        }
      }
      results.push({
        step: 'msrp_backfill',
        affected: msrpBackfilled,
        details: `Filled ${msrpBackfilled} null prices from MSRP (REST fallback)`,
      });
    } else {
      const count = msrpData?.length || 0;
      results.push({
        step: 'msrp_backfill',
        affected: count,
        details: `Filled ${count} null prices from MSRP`,
      });
    }

    // ========================================================================
    // STEP 2: Regional Price Enrichment
    // For filaments with US price but no regional prices
    // Uses current exchange rates
    // ========================================================================
    console.log('[EnrichPrices] Step 2: Regional enrichment...');

    // Fetch current exchange rates (or use defaults)
    let rates = { eur: 0.92, gbp: 0.79, cad: 1.37, aud: 1.53 }; // USD-based defaults
    
    try {
      const { data: rateData } = await supabase
        .from('system_config')
        .select('key, value')
        .in('key', ['eur_rate', 'gbp_rate', 'cad_rate', 'aud_rate']);
      
      if (rateData && rateData.length > 0) {
        for (const r of rateData) {
          if (r.key === 'eur_rate') rates.eur = parseFloat(r.value) || rates.eur;
          if (r.key === 'gbp_rate') rates.gbp = parseFloat(r.value) || rates.gbp;
          if (r.key === 'cad_rate') rates.cad = parseFloat(r.value) || rates.cad;
          if (r.key === 'aud_rate') rates.aud = parseFloat(r.value) || rates.aud;
        }
      }
    } catch (e) {
      console.log('[EnrichPrices] Using default exchange rates');
    }

    // Get filaments with US price but no regional prices
    // Skip brands that have native EUR/GBP pricing (AzureFilm, Sovol, Spectrum)
    const nativeEurBrands = ['AzureFilm', 'Sovol', 'Spectrum Filaments', 'FormFutura', 'Fillamentum'];
    
    const { data: noRegional, error: regionalFetchError } = await supabase
      .from('filaments')
      .select('id, variant_price, brand_name')
      .not('variant_price', 'is', null)
      .is('price_eur', null)
      .limit(1000);

    let regionalEnriched = 0;
    if (!regionalFetchError && noRegional) {
      const updates: any[] = [];
      for (const f of noRegional) {
        if (nativeEurBrands.includes(f.brand_name)) continue; // Skip brands with native EUR
        
        updates.push({
          id: f.id,
          price_eur: Math.round(f.variant_price! * rates.eur * 100) / 100,
          price_gbp: Math.round(f.variant_price! * rates.gbp * 100) / 100,
          price_cad: Math.round(f.variant_price! * rates.cad * 100) / 100,
          price_aud: Math.round(f.variant_price! * rates.aud * 100) / 100,
        });
      }

      // Batch update
      for (const u of updates) {
        const { id, ...priceFields } = u;
        const { error: updateError } = await supabase
          .from('filaments')
          .update({
            ...priceFields,
            regional_prices_updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (!updateError) regionalEnriched++;
      }
    }

    results.push({
      step: 'regional_enrichment',
      affected: regionalEnriched,
      details: `Enriched ${regionalEnriched} filaments with regional prices (EUR: ${rates.eur}, GBP: ${rates.gbp}, CAD: ${rates.cad}, AUD: ${rates.aud})`,
    });

    // ========================================================================
    // STEP 3: Price Validation & Anomaly Detection
    // Flag anomalous prices for review
    // ========================================================================
    console.log('[EnrichPrices] Step 3: Price validation...');

    // Flag prices that are clearly wrong
    const { data: anomalousPrices } = await supabase
      .from('filaments')
      .select('id, brand_name, product_title, variant_price')
      .or('variant_price.gt.500,variant_price.lt.1')
      .not('variant_price', 'is', null)
      .limit(100);

    let flaggedCount = 0;
    if (anomalousPrices && anomalousPrices.length > 0) {
      for (const p of anomalousPrices) {
        const { error: flagError } = await supabase
          .from('filaments')
          .update({ price_confidence: 'low' })
          .eq('id', p.id);
        if (!flagError) {
          flaggedCount++;
          console.log(`[EnrichPrices] Flagged: ${p.brand_name} ${p.product_title?.slice(0, 40)} = $${p.variant_price}`);
        }
      }
    }

    results.push({
      step: 'price_validation',
      affected: flaggedCount,
      details: `Flagged ${flaggedCount} anomalous prices (>$500 or <$1)`,
    });

    // ========================================================================
    // STEP 4: Summary Stats
    // ========================================================================
    console.log('[EnrichPrices] Step 4: Computing summary...');

    const { count: totalFilaments } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true });

    const { count: nullPrices } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .is('variant_price', null);

    const { count: withRegional } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .not('variant_price', 'is', null)
      .not('price_eur', 'is', null);

    const duration = Date.now() - startTime;

    const summary = {
      success: true,
      duration_ms: duration,
      duration: `${(duration / 1000).toFixed(1)}s`,
      results,
      stats: {
        total_filaments: totalFilaments || 0,
        null_prices: nullPrices || 0,
        price_coverage_pct: totalFilaments
          ? Math.round(((totalFilaments - (nullPrices || 0)) / totalFilaments) * 1000) / 10
          : 0,
        with_regional: withRegional || 0,
        regional_coverage_pct: totalFilaments
          ? Math.round(((withRegional || 0) / totalFilaments) * 1000) / 10
          : 0,
      },
    };

    console.log('[EnrichPrices] Complete:', JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[EnrichPrices] Pipeline failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        results,
        duration_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

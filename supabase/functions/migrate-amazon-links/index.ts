import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FilamentWithAmazon {
  id: string;
  amazon_link_us: string | null;
  amazon_link_uk: string | null;
  amazon_link_de: string | null;
  amazon_price_usd: number | null;
}

const AMAZON_STORE_MAP: Record<string, { slug: string; currency: string }> = {
  amazon_link_us: { slug: 'amazon-us', currency: 'USD' },
  amazon_link_uk: { slug: 'amazon-uk', currency: 'GBP' },
  amazon_link_de: { slug: 'amazon-de', currency: 'EUR' },
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Get store IDs for Amazon stores
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, slug')
      .in('slug', Object.values(AMAZON_STORE_MAP).map(s => s.slug));
    
    if (storesError) throw storesError;
    
    const storeIdMap = new Map(stores?.map(s => [s.slug, s.id]) || []);
    console.log('Store ID map:', Object.fromEntries(storeIdMap));

    // Get filaments with Amazon links (only US, UK, DE exist in schema)
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, amazon_link_us, amazon_link_uk, amazon_link_de, amazon_price_usd')
      .or('amazon_link_us.not.is.null,amazon_link_uk.not.is.null,amazon_link_de.not.is.null');

    if (fetchError) throw fetchError;

    console.log(`Found ${filaments?.length || 0} filaments with Amazon links`);

    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const filament of filaments || []) {
      for (const [column, config] of Object.entries(AMAZON_STORE_MAP)) {
        const link = filament[column as keyof FilamentWithAmazon] as string | null;
        if (!link) continue;

        const storeId = storeIdMap.get(config.slug);
        if (!storeId) {
          errors.push(`Store not found: ${config.slug}`);
          continue;
        }

        // Use USD price if available (only for US links), otherwise set to 0
        let priceCents = 0;
        if (column === 'amazon_link_us' && filament.amazon_price_usd) {
          priceCents = Math.round(filament.amazon_price_usd * 100);
        }

        const { error: insertError } = await supabase
          .from('filament_prices')
          .upsert({
            filament_id: filament.id,
            store_id: storeId,
            price_cents: priceCents,
            currency_code: config.currency,
            product_url: link,
            in_stock: true,
            last_verified_at: new Date().toISOString()
          }, { onConflict: 'filament_id,store_id' });

        if (insertError) {
          errors.push(`Failed ${filament.id} -> ${config.slug}: ${insertError.message}`);
          skipped++;
        } else {
          inserted++;
        }
      }
    }

    // Log results to sync_logs
    await supabase.from('sync_logs').insert({
      sync_type: 'amazon_link_migration',
      data_source: 'filaments_table',
      status: errors.length > 0 ? 'completed_with_errors' : 'completed',
      records_updated: inserted,
      error_message: errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
      success_details: { 
        inserted, 
        skipped, 
        total_filaments: filaments?.length || 0,
        stores_mapped: Object.fromEntries(storeIdMap)
      }
    });

    return new Response(JSON.stringify({
      success: true,
      inserted,
      skipped,
      total_filaments: filaments?.length || 0,
      errors: errors.slice(0, 10)
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    console.error('Migration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

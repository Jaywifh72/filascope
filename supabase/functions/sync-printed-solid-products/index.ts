/**
 * Printed Solid PRODUCTS SYNC
 *
 * Delegates to the universal sync-brand-products engine which handles:
 * - Paginated Shopify /products.json fetch
 * - Variant explosion (one DB row per color)
 * - Price extraction → variant_price
 * - Image, URL, material, color-hex fields
 *
 * Requires automated_brands record:
 *   brand_slug = 'printed-solid', platform_type = 'shopify',
 *   base_url = 'https://www.printedsolid.com', scraping_enabled = true
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BRAND_SLUG = 'printed-solid';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { dryRun = false, limit = 500, regions = ['US'] } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.functions.invoke('sync-brand-products', {
      body: { brandSlug: BRAND_SLUG, dryRun, limit, regions, tasks: ['products'] },
    });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

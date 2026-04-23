/**
 * FLSUN BRAND-SPECIFIC SYNC
 * 
 * Problem: FLSUN Shopify store has NO product_type tags on products.
 * Also sells printers/bundles that mention "PLA" in title but aren't filaments.
 * Solution: Filter by title keywords (PLA, PETG, ABS, TPU) but EXCLUDE
 * printer parts and printer bundles.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { extractWeightFromText } from '../_shared/variant-filters.ts';
import { getColorHex } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BRAND_NAME = 'FLSUN';
const SHOPIFY_STORE = 'us.store.flsun3d.com';

// Keywords that INDICATE this is a filament (case-insensitive)
const FILAMENT_KWDS = [
  'pla', 'petg', 'abs', 'tpu ', 'tpee', ' nylon',
  'asa', 'polycarbonate', 'pla+', 'pla plus', 'pla pro',
  '1.75mm', '2.85mm', '3d printing filament',
];

// Keywords that indicate this is NOT a filament (printer, parts, accessories)
const NON_FILAMENT_KWDS = [
  '3d printer', 'printer kit', 'hotend', 'nozzle kit', 'thermistor',
  'motherboard', 'stepper motor', 'pulley', 'power supply', 'display screen',
  'adapter board', 'ptfe tube', 'effector', 'heating rod', 'limit switch',
  'glass plate', 'build plate', 'carriage', 'ribbon cable', 'controller',
  'extruder', 'cooling fan', 'lead screw', 'timing belt', 'frame kit',
  'spare part', 'accessory', 'tool kit', 'z-axis', 'y-axis', 'x-axis',
  'bed levelling', 'resin vat', 'fep film', 'lcd screen', 'uv led',
  'laser module', 'grease', 'lubricant', 'silicone sleeve', 'bed sticker',
  'speeder pad', 'filament detector', 'parallel arm', 'cpap turbo fan',
  'blower fan', 'vibration compensation', 'turbo fan',
];

function isFilament(title: string): boolean {
  const t = title.toLowerCase();
  if (NON_FILAMENT_KWDS.some(k => t.includes(k))) return false;
  return FILAMENT_KWDS.some(k => t.includes(k));
}

function extractMaterial(title: string): string {
  const t = title;
  if (/\bPLA[\s\+]*Pro\b/i.test(t) || /\bPLA[\s\+]*Plus\b/i.test(t)) return 'PLA+';
  if (/\bPLA\b/i.test(t)) return 'PLA';
  if (/\bPETG\b/i.test(t)) return 'PETG';
  if (/\bABS\b/i.test(t)) return 'ABS';
  if (/\bTPU\b/i.test(t)) return 'TPU';
  if (/\bTPEE\b/i.test(t)) return 'TPEE';
  if (/\bNylon\b/i.test(t) || /\bPA[- ]?12\b/i.test(t)) return 'Nylon';
  if (/\bPC\b/i.test(t)) return 'PC';
  if (/\bASA\b/i.test(t)) return 'ASA';
  return 'Unknown';
}

function extractDiameter(title: string): number {
  if (/\b2\.85mm\b/i.test(title)) return 2.85;
  return 1.75;
}

function safeExtractColor(title: string): string | null {
  try {
    const colorPatterns = [
      'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
      'pink', 'gray', 'grey', 'silver', 'gold', 'clear', 'transparent',
      'natural', 'beige', 'brown', 'navy', 'coral', 'mint', 'olive',
      'starlight', 'silk', 'glow in the dark', 'galaxy', 'marble',
    ];
    const t = title.toLowerCase();
    for (const c of colorPatterns) {
      if (t.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
    }
  } catch (_) {}
  return null;
}

async function fetchShopifyProducts(): Promise<any[]> {
  const resp = await fetch(`https://${SHOPIFY_STORE}/products.json?limit=250`, {
    headers: { 'User-Agent': 'FilaScope/1.0' },
  });
  if (!resp.ok) throw new Error(`Shopify API ${resp.status}`);
  const data = await resp.json();
  return data.products || [];
}

async function upsertFilament(product: any, supabase: any): Promise<string> {
  const colorName = safeExtractColor(product.title);
  const colorHex = colorName ? getColorHex(colorName) : null;

  // Check if exists by product_url + vendor
  const { data: existing } = await supabase
    .from('filaments')
    .select('id')
    .eq('product_url', product.url)
    .eq('vendor', BRAND_NAME)
    .limit(1);

  const commonData = {
    product_id: String(product.id),
    product_title: product.title,
    variant_price: String(product.price),
    variant_compare_at_price: product.compareAtPrice ? String(product.compareAtPrice) : null,
    variant_available: product.available,
    featured_image: product.imageUrl,
    mpn: product.mpn,
    color_hex: colorHex,
    diameter_nominal_mm: product.diameter,
    net_weight_g: product.weight,
    material: product.material,
    sync_source: 'sync-flsun-products',
    last_scraped_at: new Date().toISOString(),
    sync_status: 'synced',
    auto_updated: true,
  };

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from('filaments')
      .update(commonData)
      .eq('id', existing[0].id);
    if (error) throw new Error(error.message);
    return 'updated';
  } else {
    const { error } = await supabase
      .from('filaments')
      .insert({ ...commonData, vendor: BRAND_NAME, product_url: product.url, auto_created: true });
    if (error) throw new Error(error.message);
    return 'created';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun ?? false;

    console.log(`[FLSUN] Starting sync (dryRun=${dryRun})`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const allProducts = await fetchShopifyProducts();
    const filamentProducts = allProducts.filter(p => isFilament(p.title));

    console.log(`[FLSUN] Total: ${allProducts.length}, filaments: ${filamentProducts.length}`);

    if (filamentProducts.length === 0) {
      return new Response(JSON.stringify({
        success: true, vendor: BRAND_NAME, message: 'No filaments found',
        stats: { discovered: 0, created: 0, updated: 0, errors: 0 },
        duration: Date.now() - startTime,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let created = 0, updated = 0, errors = 0;
    const processed: any[] = [];

    for (const shopifyProduct of filamentProducts) {
      try {
        const variant = shopifyProduct.variants?.[0];
        if (!variant) continue;

        const product = {
          id: shopifyProduct.id,
          title: shopifyProduct.title,
          price: variant ? (parseFloat(variant.price) || 0) : 0,
          compareAtPrice: (variant && variant.compare_at_price) ? parseFloat(variant.compare_at_price) : null,
          available: variant ? (variant.available || false) : false,
          imageUrl: (shopifyProduct.images && shopifyProduct.images[0]) ? shopifyProduct.images[0].src : null,
          url: `https://${SHOPIFY_STORE}/products/${shopifyProduct.handle}`,
          mpn: (variant && variant.sku) ? String(variant.sku) : null,
          material: extractMaterial(shopifyProduct.title),
          diameter: extractDiameter(shopifyProduct.title),
          weight: extractWeightFromText(shopifyProduct.title),
        };

        if (!dryRun) {
          const action = await upsertFilament(product, supabase);
          if (action === 'created') created++;
          else if (action === 'updated') updated++;
        } else {
          created++;
        }
        processed.push({ title: shopifyProduct.title, material: product.material, price: product.price });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[FLSUN] Error: ${shopifyProduct.title}: ${msg}`);
        errors++;
      }
    }

    console.log(`[FLSUN] Done: ${created} created, ${updated} updated, ${errors} errors`);

    return new Response(JSON.stringify({
      success: errors === 0,
      vendor: BRAND_NAME,
      stats: { discovered: filamentProducts.length, created, updated, errors },
      products: processed,
      duration: Date.now() - startTime,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[FLSUN] FATAL: ${errorMsg}`);
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

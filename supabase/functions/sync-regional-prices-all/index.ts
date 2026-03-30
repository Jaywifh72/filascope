import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REGIONAL_BRANDS: Record<string, Partial<Record<string, string>>> = {
  'bambu-lab':  { CA: 'ca.store.bambulab.com', UK: 'uk.store.bambulab.com', EU: 'eu.store.bambulab.com', AU: 'au.store.bambulab.com' },
  'elegoo':     { CA: 'ca.elegoo.com',         UK: 'uk.elegoo.com',         EU: 'eu.elegoo.com',         AU: 'au.elegoo.com' },
  'polymaker':  { CA: 'ca.polymaker.com',       EU: 'eu.polymaker.com' },
  'anycubic':   { CA: 'ca.anycubic.com',        UK: 'uk.anycubic.com',       EU: 'eu.anycubic.com' },
  'creality':   { US: 'store.creality.com',      CA: 'store.creality.com',    UK: 'store.creality.com',   EU: 'store.creality.com' },
  'sunlu':      { CA: 'ca.sunlu.com',            UK: 'uk.sunlu.com' },
  'eryone':     { EU: 'eu.eryone3d.com' },
  'flashforge': { CA: 'ca.flashforge.com',       EU: 'eu.flashforge.com',     UK: 'uk.flashforge.com' },
};

// Which DB price field to write per region
const REGION_PRICE_FIELD: Record<string, string> = {
  US: 'price_us',
  CA: 'price_ca',
  UK: 'price_gbp',
  EU: 'price_eur',
  AU: 'price_aud',
};

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  grams: number;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  variants: ShopifyVariant[];
}

/** Pick the variant closest to 1 kg (1000 g). */
function pick1kgVariant(variants: ShopifyVariant[]): ShopifyVariant | null {
  if (!variants?.length) return null;
  return variants.reduce((best, v) => {
    const diff = Math.abs((v.grams ?? 0) - 1000);
    const bestDiff = Math.abs((best.grams ?? 0) - 1000);
    return diff < bestDiff ? v : best;
  });
}

/** Similarity score between two strings (simple overlap). */
function handleSimilarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2));
  const wb = new Set(b.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2));
  const intersect = [...wa].filter(w => wb.has(w)).length;
  return intersect / Math.max(wa.size, wb.size, 1);
}

async function fetchShopifyPage(domain: string, page: number): Promise<ShopifyProduct[]> {
  const url = `https://${domain}/products.json?limit=250&page=${page}`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: { 'User-Agent': 'FilaScope-bot/1.0' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.products ?? [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    let body: { brands?: string[] } = {};
    try { body = await req.json(); } catch { /* no body */ }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const targetBrands = body.brands
      ? Object.fromEntries(Object.entries(REGIONAL_BRANDS).filter(([k]) => body.brands!.includes(k)))
      : REGIONAL_BRANDS;

    let totalUpdated = 0;
    const report: Record<string, Record<string, number>> = {};

    for (const [brandSlug, regions] of Object.entries(targetBrands)) {
      report[brandSlug] = {};

      // Fetch this brand's filaments from DB (handle + id)
      const { data: dbFilaments } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title')
        .eq('brand_slug', brandSlug)
        .limit(2000);

      if (!dbFilaments?.length) {
        console.log(`[sync-regional-prices-all] ${brandSlug}: no DB records`);
        continue;
      }

      for (const [region, domain] of Object.entries(regions)) {
        const priceField = REGION_PRICE_FIELD[region];
        if (!priceField) continue;

        // Fetch all Shopify products from this regional domain
        const storeProducts: ShopifyProduct[] = [];
        for (let page = 1; page <= 10; page++) {
          const batch = await fetchShopifyPage(domain!, page);
          storeProducts.push(...batch);
          if (batch.length < 250) break;
          await new Promise(r => setTimeout(r, 200));
        }

        if (!storeProducts.length) {
          console.log(`[sync-regional-prices-all] ${brandSlug}/${region}: no products from ${domain}`);
          continue;
        }

        let regionUpdated = 0;
        const patches: { id: string; [key: string]: unknown }[] = [];

        for (const dbF of dbFilaments) {
          // Match by handle similarity
          const handle = dbF.product_handle ?? dbF.product_title?.toLowerCase().replace(/\s+/g, '-') ?? '';
          let best: ShopifyProduct | null = null;
          let bestScore = 0;

          for (const sp of storeProducts) {
            const score = handleSimilarity(handle, sp.handle);
            if (score > bestScore) { bestScore = score; best = sp; }
          }

          if (best && bestScore >= 0.4) {
            const variant = pick1kgVariant(best.variants);
            if (variant) {
              const price = parseFloat(variant.price);
              if (!isNaN(price) && price > 0) {
                patches.push({ id: dbF.id, [priceField]: price });
                regionUpdated++;
              }
            }
          }
        }

        // Also update available_regions (append region)
        for (const p of patches) {
          const { data: existing } = await supabase
            .from('filaments')
            .select('available_regions')
            .eq('id', p.id)
            .single();
          const regions_arr: string[] = existing?.available_regions ?? [];
          if (!regions_arr.includes(region)) regions_arr.push(region);
          p.available_regions = regions_arr;
        }

        // Batch upsert
        for (let i = 0; i < patches.length; i += 500) {
          await supabase.from('filaments').upsert(patches.slice(i, i + 500) as any[], { onConflict: 'id' });
        }

        report[brandSlug][region] = regionUpdated;
        totalUpdated += regionUpdated;
        console.log(`[sync-regional-prices-all] ${brandSlug}/${region}: ${regionUpdated} updated`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, totalUpdated, report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[sync-regional-prices-all] error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

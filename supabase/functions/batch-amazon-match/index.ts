import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Amazon marketplace endpoints
const MARKETPLACE = {
  us: { host: 'webservices.amazon.com',   region: 'us-east-1',   tag: '', domain: 'amazon.com' },
  ca: { host: 'webservices.amazon.ca',    region: 'us-east-1',   tag: '', domain: 'amazon.ca' },
  uk: { host: 'webservices.amazon.co.uk', region: 'eu-west-1',   tag: '', domain: 'amazon.co.uk' },
  de: { host: 'webservices.amazon.de',    region: 'eu-west-1',   tag: '', domain: 'amazon.de' },
};

// DB field for each marketplace link
const REGION_LINK_FIELD: Record<string, string> = {
  us: 'amazon_link_us',
  ca: 'amazon_link_ca',
  uk: 'amazon_link_uk',
  de: 'amazon_link_de',
};

interface FilamentRow {
  id: string;
  product_title: string;
  vendor: string;
  material: string | null;
  variant_price: number | null;
  amazon_link_us: string | null;
}

interface AmazonItem {
  ASIN: string;
  ItemInfo?: { Title?: { DisplayValue?: string } };
  Offers?: {
    Listings?: Array<{ Price?: { Amount?: number } }>;
  };
}

/** Score a PA-API item against a filament record. */
function scoreItem(filament: FilamentRow, item: AmazonItem, marketplace = 'us'): number {
  const title = (item.ItemInfo?.Title?.DisplayValue ?? '').toLowerCase();
  const brand = filament.vendor.toLowerCase();
  let score = 0;

  // Brand name exact match in title: +40
  if (title.includes(brand) || title.includes(brand.replace(/\s+/g, ''))) score += 40;
  else if (brand.split(/\s+/).some(w => w.length > 3 && title.includes(w))) score += 20;

  // Material match: +30
  if (filament.material) {
    const mat = filament.material.toLowerCase();
    if (title.includes(mat)) score += 30;
    else if (mat.includes('pla') && title.includes('pla')) score += 15;
    else if (mat.includes('petg') && title.includes('petg')) score += 15;
  }

  // Weight match 1kg/1000g: +20
  if (/1\s*kg|1000\s*g/.test(title)) score += 20;

  // Color word from title: +10 (rough check)
  const colorWords = filament.product_title.split(/[\s\-]+/).filter(w => w.length > 3).slice(-2);
  if (colorWords.some(w => title.includes(w.toLowerCase()))) score += 10;

  return Math.min(100, score);
}

/** Build PA-API v5 SearchItems request body. */
function buildSearchBody(
  keyword: string,
  partnerTag: string,
): Record<string, unknown> {
  return {
    Keywords: keyword,
    Resources: [
      'ItemInfo.Title',
      'Offers.Listings.Price',
    ],
    SearchIndex: 'Industrial',
    ItemCount: 5,
    PartnerTag: partnerTag,
    PartnerType: 'Associates',
  };
}

/** Sign and send a PA-API SearchItems request. Returns items array. */
async function searchPaApi(
  keyword: string,
  market: { host: string; region: string; tag: string },
  accessKey: string,
  secretKey: string,
): Promise<AmazonItem[]> {
  const endpoint = `https://${market.host}/paapi5/searchitems`;
  const payload = JSON.stringify(buildSearchBody(keyword, market.tag));
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const service = 'ProductAdvertisingAPI';
  const target = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';

  // Headers
  const headers: Record<string, string> = {
    'Content-Encoding': 'amz-1.0',
    'Content-Type': 'application/json; charset=UTF-8',
    'Host': market.host,
    'X-Amz-Date': amzDate,
    'X-Amz-Target': target,
  };

  // Canonical request
  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';
  const encoder = new TextEncoder();

  const payloadHash = await crypto.subtle.digest('SHA-256', encoder.encode(payload))
    .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

  const canonicalRequest = [
    'POST',
    '/paapi5/searchitems',
    '',
    `content-encoding:amz-1.0`,
    `content-type:application/json; charset=UTF-8`,
    `host:${market.host}`,
    `x-amz-date:${amzDate}`,
    `x-amz-target:${target}`,
    '',
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${market.region}/${service}/aws4_request`;
  const canonHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest))
    .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, canonHash].join('\n');

  // HMAC helper
  async function hmac(key: Uint8Array | string, msg: string): Promise<Uint8Array> {
    const k = typeof key === 'string' ? encoder.encode(key) : key;
    const cryptoKey = await crypto.subtle.importKey('raw', k, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(msg)));
  }

  const kDate    = await hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion  = await hmac(kDate, market.region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = (await hmac(kSigning, stringToSign)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

  headers['Authorization'] =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(endpoint, { method: 'POST', headers, body: payload, signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PA-API ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.SearchResult?.Items ?? []) as AmazonItem[];
}

// 1 req/second for PA-API
let lastReqAt = 0;
async function rateLimit() {
  const wait = 1000 - (Date.now() - lastReqAt);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastReqAt = Date.now();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    let body: { brands?: string[]; limit?: number; marketplace?: string } = {};
    try { body = await req.json(); } catch { /* no body */ }

    const requestedMarkets = body.marketplace ? [body.marketplace] : ['us', 'ca', 'uk', 'de'];
    const limitPerBrand = body.limit ?? 20;

    const accessKey = Deno.env.get('AMAZON_ACCESS_KEY');
    const secretKey = Deno.env.get('AMAZON_SECRET_KEY');
    const partnerTag = Deno.env.get('AMAZON_PARTNER_TAG') ?? 'filascope-20';

    if (!accessKey || !secretKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AMAZON_ACCESS_KEY / AMAZON_SECRET_KEY not set in env' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Set partner tags per market
    for (const mk of Object.values(MARKETPLACE)) mk.tag = partnerTag;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get enabled brands
    let brandQuery = supabase
      .from('automated_brands')
      .select('brand_slug, brand_name')
      .eq('scraping_enabled', true);
    if (body.brands?.length) brandQuery = brandQuery.in('brand_slug', body.brands);
    const { data: brands } = await brandQuery;
    if (!brands?.length) {
      return new Response(
        JSON.stringify({ success: true, matched: 0, message: 'No brands to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let totalMatched = 0;
    const brandResults: Record<string, number> = {};

    for (const brand of brands) {
      const { data: filaments } = await supabase
        .from('filaments')
        .select('id, product_title, vendor, material, variant_price, amazon_link_us')
        .ilike('vendor', `%${brand.brand_name}%`)
        .is('amazon_link_us', null)
        .limit(limitPerBrand);

      if (!filaments?.length) continue;

      let brandMatched = 0;

      for (const filament of filaments as FilamentRow[]) {
        const keyword = `${brand.brand_name} ${filament.material ?? 'PLA'} filament 1kg`;

        for (const marketKey of requestedMarkets) {
          const market = MARKETPLACE[marketKey as keyof typeof MARKETPLACE];
          if (!market) continue;

          try {
            await rateLimit();
            const items = await searchPaApi(keyword, market, accessKey, secretKey);
            if (!items.length) continue;

            let bestItem: AmazonItem | null = null;
            let bestScore = 0;
            for (const item of items) {
              const s = scoreItem(filament, item, marketKey);
              if (s > bestScore) { bestScore = s; bestItem = item; }
            }

            if (bestItem && bestScore >= 70) {
              const linkField = REGION_LINK_FIELD[marketKey] ?? `amazon_link_${marketKey}`;
              const asinUrl = `https://www.${market.domain}/dp/${bestItem.ASIN}?tag=${partnerTag}`;
              const price = bestItem.Offers?.Listings?.[0]?.Price?.Amount ?? null;

              const patch: Record<string, unknown> = { id: filament.id, [linkField]: asinUrl };
              if (marketKey === 'us' && price) {
                patch.amazon_price_usd = price;
                patch.amazon_prices_last_updated_at = new Date().toISOString();
              }
              patch.amazon_match_confidence = bestScore;

              await supabase.from('filaments').upsert([patch] as any[], { onConflict: 'id' });
              brandMatched++;
              totalMatched++;
              console.log(`[batch-amazon-match] ${brand.brand_name} → ASIN ${bestItem.ASIN} (score ${bestScore}) [${marketKey}]`);
            }
          } catch (e) {
            console.error(`[batch-amazon-match] error for ${brand.brand_name} [${marketKey}]:`, e);
          }
        }
      }

      brandResults[brand.brand_slug] = brandMatched;
    }

    return new Response(
      JSON.stringify({ success: true, matched: totalMatched, by_brand: brandResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[batch-amazon-match] error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

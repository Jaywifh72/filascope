import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const USER_AGENT = 'Mozilla/5.0 (compatible; FilaScopeBot/1.0; +https://filascope.com/bot)';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const BATCH_SIZE = 50;

// Paths that indicate a "soft 404" landing page
const SOFT_404_PATHS = ['/', '/collections/', '/search', '/search?', '/404', '/not-found', '/products?'];
const HOME_LIKE = (path: string) => path === '/' || path === '';

type BreakType =
  | 'hard_404'
  | 'soft_404'
  | 'wrong_redirect'
  | 'geo_redirect'
  | 'out_of_stock'
  | 'affiliate_failure'
  | 'timeout'
  | 'ssl_error'
  | 'domain_dead';

interface UrlCheckResult {
  productUrl: string;
  breakType: BreakType | null;
  httpStatus: number | null;
  finalUrl: string | null;
  redirectChain: string[];
  errorMessage: string | null;
}

function getHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return ''; }
}

function getPath(url: string): string {
  try { return new URL(url).pathname; } catch { return ''; }
}

function isSoftPath(path: string): boolean {
  return SOFT_404_PATHS.some(p => path === p || path.startsWith(p));
}

/** Follow redirects manually up to MAX_REDIRECTS hops with timeout */
async function fetchWithRedirects(url: string): Promise<{
  finalUrl: string;
  statusCode: number;
  redirectChain: string[];
  error: string | null;
}> {
  const chain: string[] = [];
  let current = url;
  let lastStatus = 0;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    let res: Response;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      res = await fetch(current, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT },
      });
      clearTimeout(timer);
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('aborted') || msg.includes('timeout')) {
        return { finalUrl: current, statusCode: 0, redirectChain: chain, error: 'timeout' };
      }
      if (msg.includes('ssl') || msg.includes('SSL') || msg.includes('certificate') || msg.includes('tls') || msg.includes('TLS')) {
        return { finalUrl: current, statusCode: 0, redirectChain: chain, error: 'ssl_error' };
      }
      return { finalUrl: current, statusCode: 0, redirectChain: chain, error: 'domain_dead' };
    }

    lastStatus = res.status;

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) break;
      chain.push(current);
      // Resolve relative redirects
      try {
        current = new URL(location, current).toString();
      } catch {
        current = location;
      }
    } else {
      break;
    }
  }

  return { finalUrl: current, statusCode: lastStatus, redirectChain: chain, error: null };
}

function classifyResult(
  originalUrl: string,
  finalUrl: string,
  statusCode: number,
  redirectChain: string[],
  error: string | null,
): BreakType | null {
  // Explicit error types
  if (error === 'timeout') return 'timeout';
  if (error === 'ssl_error') return 'ssl_error';
  if (error === 'domain_dead') return 'domain_dead';

  // Hard 404/410
  if (statusCode === 404 || statusCode === 410) return 'hard_404';

  // 5xx server error (affiliate failure)
  if (statusCode >= 500) return 'affiliate_failure';

  // Status 0 means connection-level failure
  if (statusCode === 0) return 'domain_dead';

  const origHost = getHostname(originalUrl);
  const finalHost = getHostname(finalUrl);
  const finalPath = getPath(finalUrl);

  if (statusCode === 200 || statusCode === 0) {
    // Domain changed → wrong redirect
    if (origHost && finalHost && origHost !== finalHost) {
      // Geo redirect heuristic: if new host has a country TLD or CC subdomain
      const geoTlds = ['.co.uk', '.de', '.fr', '.com.au', '.co.jp', '.ca', '.com.br'];
      const ccPrefixes = ['uk.', 'eu.', 'de.', 'fr.', 'au.', 'jp.', 'ca.'];
      const isGeo =
        geoTlds.some(t => finalHost.endsWith(t)) ||
        ccPrefixes.some(p => finalHost.startsWith(p)) ||
        (origHost.includes('.com') && finalHost.includes('.co.'));
      if (isGeo) return 'geo_redirect';
      return 'wrong_redirect';
    }

    // Soft 404: landed on homepage, search, or collection page
    if (finalPath && isSoftPath(finalPath)) return 'soft_404';
  }

  return null; // Link is fine
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { region, retailer, brand, limit = 200, offset = 0, batchId } = body;

    const scanBatchId = batchId || `scan_${Date.now()}`;

    // Create or update the scan run record
    await supabase.from('link_scan_runs').upsert({
      batch_id: scanBatchId,
      status: 'running',
      scan_type: region ? 'regional' : 'full',
      filters: { region, retailer, brand, limit, offset },
    }, { onConflict: 'batch_id' });

    // Build query for filament_listings
    let query = supabase
      .from('filament_listings')
      .select(`
        id,
        product_url,
        affiliate_url,
        region,
        filament_id,
        retailer_id,
        filaments!inner(product_title, vendor),
        retailers!inner(name, slug)
      `)
      .not('product_url', 'is', null)
      .eq('available', true)
      .range(offset, offset + limit - 1);

    if (region) query = query.eq('region', region);
    if (retailer) query = query.eq('retailers.slug', retailer);
    if (brand) query = (query as any).eq('filaments.vendor', brand);

    const { data: listings, error: listingsError } = await query;

    if (listingsError) throw listingsError;
    if (!listings || listings.length === 0) {
      await supabase.from('link_scan_runs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_links: 0,
        checked: 0,
        broken_found: 0,
      }).eq('batch_id', scanBatchId);

      return new Response(JSON.stringify({ total: 0, checked: 0, broken: 0, byType: {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalLinks = listings.length;
    let checked = 0;
    let brokenFound = 0;
    const byType: Record<string, number> = {};

    // Update total count
    await supabase.from('link_scan_runs').update({ total_links: totalLinks })
      .eq('batch_id', scanBatchId);

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < listings.length; i += BATCH_SIZE) {
      const batch = listings.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(batch.map(async (listing: any) => {
        const url = listing.product_url as string;
        const { finalUrl, statusCode, redirectChain, error } = await fetchWithRedirects(url);
        const breakType = classifyResult(url, finalUrl, statusCode, redirectChain, error);

        return {
          listing,
          url,
          finalUrl,
          statusCode,
          redirectChain,
          error,
          breakType,
        };
      }));

      // Upsert broken links and remove resolved ones
      for (const r of results) {
        checked++;
        if (r.breakType) {
          brokenFound++;
          byType[r.breakType] = (byType[r.breakType] || 0) + 1;

          await supabase.from('broken_links').upsert({
            listing_id: r.listing.id,
            filament_id: r.listing.filament_id,
            retailer_id: r.listing.retailer_id,
            product_url: r.url,
            affiliate_url: r.listing.affiliate_url || null,
            region: r.listing.region || 'US',
            break_type: r.breakType,
            http_status: r.statusCode || null,
            final_url: r.finalUrl !== r.url ? r.finalUrl : null,
            redirect_chain: r.redirectChain,
            error_message: r.error,
            status: 'open',
            last_checked_at: new Date().toISOString(),
            scan_batch_id: scanBatchId,
            retailer_name: r.listing.retailers?.name || null,
            filament_name: r.listing.filaments?.product_title || null,
            brand_name: r.listing.filaments?.vendor || null,
          }, { onConflict: 'listing_id' });
        } else {
          // Link is healthy — if previously broken, mark as fixed
          await supabase.from('broken_links')
            .update({ status: 'fixed', fixed_at: new Date().toISOString(), last_checked_at: new Date().toISOString() })
            .eq('listing_id', r.listing.id)
            .eq('status', 'open');
        }
      }

      // Update progress
      await supabase.from('link_scan_runs').update({
        checked,
        broken_found: brokenFound,
      }).eq('batch_id', scanBatchId);
    }

    // Finalize scan run
    await supabase.from('link_scan_runs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      total_links: totalLinks,
      checked,
      broken_found: brokenFound,
    }).eq('batch_id', scanBatchId);

    return new Response(JSON.stringify({ total: totalLinks, checked, broken: brokenFound, byType, batchId: scanBatchId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('validate-product-links error:', err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

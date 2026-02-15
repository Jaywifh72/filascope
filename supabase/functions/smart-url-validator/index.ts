import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Brand URL patterns for intelligent slug mutation ─────────────────────────
interface BrandPattern {
  domain: RegExp;
  extractHandle: (url: string) => string | null;
  buildUrl: (handle: string, region?: string) => string;
  slugVariants: (handle: string) => string[];
}

const BRAND_PATTERNS: Record<string, BrandPattern> = {
  creality: {
    domain: /store\.creality\.com/i,
    extractHandle: (url) => {
      const m = url.match(/store\.creality\.com(?:\/[a-z]{2})?\/products\/([^?#/]+)/i);
      return m?.[1] || null;
    },
    buildUrl: (handle, region) => {
      const prefix = region && region !== 'US' ? `/${region.toLowerCase()}` : '';
      return `https://store.creality.com${prefix}/products/${handle}`;
    },
    slugVariants: (handle) => {
      const variants = [handle];
      // Try with/without "creality-" prefix
      if (handle.startsWith('creality-')) variants.push(handle.replace('creality-', ''));
      else variants.push(`creality-${handle}`);
      // Try with/without "-3d-printer-filament"
      if (!handle.includes('filament')) variants.push(`${handle}-filament`);
      if (!handle.includes('3d-printer')) variants.push(`${handle}-3d-printer-filament`);
      // Remove trailing suffixes
      variants.push(handle.replace(/-filament$/, '').replace(/-3d-printer-filament$/, ''));
      return [...new Set(variants)];
    },
  },
  bambulab: {
    domain: /store\.bambulab\.com/i,
    extractHandle: (url) => {
      const m = url.match(/(?:[a-z]{2}\.)?store\.bambulab\.com\/products\/([^?#/]+)/i);
      return m?.[1] || null;
    },
    buildUrl: (handle, region) => {
      const sub = region && region !== 'US' ? `${region.toLowerCase()}.` : 'us.';
      return `https://${sub}store.bambulab.com/products/${handle}`;
    },
    slugVariants: (handle) => {
      const variants = [handle];
      if (handle.includes('-pla')) {
        variants.push(handle.replace('-pla-', '-pla-basic-'));
        variants.push(handle.replace('-pla-', '-pla-matte-'));
      }
      if (handle.includes('basic')) variants.push(handle.replace('-basic', ''));
      return [...new Set(variants)];
    },
  },
  esun: {
    domain: /esun3dstore\.com|esun3d\.com/i,
    extractHandle: (url) => {
      const m = url.match(/(?:esun3dstore|esun3d)\.com\/products\/([^?#/]+)/i);
      return m?.[1] || null;
    },
    buildUrl: (handle) => `https://esun3dstore.com/products/${handle}`,
    slugVariants: (handle) => {
      const variants = [handle];
      // Try eSUN naming patterns
      if (handle.includes('esun-')) variants.push(handle.replace('esun-', ''));
      else variants.push(`esun-${handle}`);
      // PLA+ vs PLA-Plus
      if (handle.includes('pla-plus')) variants.push(handle.replace('pla-plus', 'pla+'));
      if (handle.includes('pla+')) variants.push(handle.replace('pla+', 'pla-plus'));
      return [...new Set(variants)];
    },
  },
  formfutura: {
    domain: /formfutura\.com/i,
    extractHandle: (url) => {
      const m = url.match(/formfutura\.com\/(?:products\/)?([^?#/]+)/i);
      return m?.[1] || null;
    },
    buildUrl: (handle) => `https://formfutura.com/${handle}`,
    slugVariants: (handle) => {
      const variants = [handle];
      // FormFutura uses root-level slugs
      if (!handle.includes('formfutura')) variants.push(`${handle}-filament`);
      variants.push(handle.replace(/-filament$/, ''));
      return [...new Set(variants)];
    },
  },
  generic_shopify: {
    domain: /\.myshopify\.com|shopify/i,
    extractHandle: (url) => {
      const m = url.match(/\/products\/([^?#/]+)/i);
      return m?.[1] || null;
    },
    buildUrl: (handle) => handle, // needs domain context
    slugVariants: (handle) => {
      const variants = [handle];
      variants.push(handle.replace(/-/g, '_'));
      variants.push(handle.replace(/_/g, '-'));
      return [...new Set(variants)];
    },
  },
};

// ─── URL diagnosis logic ──────────────────────────────────────────────────────

interface DiagnosisResult {
  original_url: string;
  http_status: number | null;
  failure_reason: string;
  diagnosis_details: Record<string, unknown>;
  suggested_url: string | null;
  suggestion_source: string | null;
  suggestion_confidence: number;
  suggestion_validated: boolean;
}

function identifyBrand(url: string): [string, BrandPattern] | null {
  for (const [name, pattern] of Object.entries(BRAND_PATTERNS)) {
    if (pattern.domain.test(url)) return [name, pattern];
  }
  return null;
}

async function checkUrl(url: string, timeout = 8000): Promise<{ status: number | null; redirectUrl: string | null; error: string | null }> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'FilaScope-URLValidator/2.0' },
    });
    clearTimeout(tid);

    if (res.status >= 300 && res.status < 400) {
      return { status: res.status, redirectUrl: res.headers.get('location'), error: null };
    }
    return { status: res.status, redirectUrl: null, error: null };
  } catch (e: any) {
    if (e.name === 'AbortError') return { status: null, redirectUrl: null, error: 'timeout' };
    return { status: null, redirectUrl: null, error: e.message || 'fetch_error' };
  }
}

async function followRedirects(url: string, maxHops = 5): Promise<{ finalUrl: string; statusCode: number | null; hops: string[] }> {
  const hops: string[] = [url];
  let current = url;
  for (let i = 0; i < maxHops; i++) {
    const { status, redirectUrl } = await checkUrl(current);
    if (!redirectUrl || !status || status < 300 || status >= 400) {
      return { finalUrl: current, statusCode: status, hops };
    }
    // Resolve relative redirects
    const next = redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, current).href;
    hops.push(next);
    current = next;
  }
  return { finalUrl: current, statusCode: null, hops };
}

async function diagnoseUrl(url: string, region?: string): Promise<DiagnosisResult> {
  const result: DiagnosisResult = {
    original_url: url,
    http_status: null,
    failure_reason: 'unknown',
    diagnosis_details: {},
    suggested_url: null,
    suggestion_source: null,
    suggestion_confidence: 0,
    suggestion_validated: false,
  };

  // Step 1: Check the URL
  const { status, redirectUrl, error } = await checkUrl(url);
  result.http_status = status;

  if (error === 'timeout') {
    result.failure_reason = 'store_down';
    result.diagnosis_details = { error: 'Connection timed out', hint: 'Store may be temporarily unavailable' };
    return result;
  }

  if (error) {
    result.failure_reason = 'store_down';
    result.diagnosis_details = { error, hint: 'DNS or connectivity issue' };
    return result;
  }

  // Step 2: Handle redirects
  if (status && status >= 300 && status < 400 && redirectUrl) {
    const { finalUrl, statusCode, hops } = await followRedirects(url);
    result.diagnosis_details = { redirect_chain: hops, final_status: statusCode };

    // Check if redirect leads to homepage (soft 404)
    try {
      const finalParsed = new URL(finalUrl);
      const originalParsed = new URL(url);
      if (finalParsed.pathname === '/' || finalParsed.pathname === '') {
        result.failure_reason = 'discontinued';
        result.http_status = status;
        result.diagnosis_details = { ...result.diagnosis_details, note: 'Redirects to homepage — product likely discontinued' };
      } else if (finalParsed.hostname !== originalParsed.hostname) {
        result.failure_reason = 'domain_changed';
        result.suggested_url = finalUrl;
        result.suggestion_source = 'redirect_follow';
        result.suggestion_confidence = 0.9;
        // Validate the final URL
        if (statusCode === 200) result.suggestion_validated = true;
      } else {
        result.failure_reason = 'slug_changed';
        result.suggested_url = finalUrl;
        result.suggestion_source = 'redirect_follow';
        result.suggestion_confidence = 0.95;
        if (statusCode === 200) result.suggestion_validated = true;
      }
    } catch {
      result.failure_reason = 'redirect_chain';
    }
    return result;
  }

  // Step 3: URL is valid
  if (status === 200 || status === 204) {
    result.failure_reason = 'none';
    result.diagnosis_details = { note: 'URL is valid' };
    return result;
  }

  // Step 4: URL is broken — try to find a fix
  if (status === 404 || status === 410) {
    result.failure_reason = status === 410 ? 'discontinued' : 'slug_changed';
    result.diagnosis_details = { http_status: status };

    const brandMatch = identifyBrand(url);
    if (brandMatch) {
      const [brandName, pattern] = brandMatch;
      const handle = pattern.extractHandle(url);

      if (handle) {
        result.diagnosis_details = {
          ...result.diagnosis_details,
          brand: brandName,
          handle,
          attempted_variants: [],
        };

        // Try slug variants
        const variants = pattern.slugVariants(handle);
        for (const variant of variants) {
          if (variant === handle) continue;
          const candidateUrl = pattern.buildUrl(variant, region);
          const check = await checkUrl(candidateUrl, 5000);

          (result.diagnosis_details.attempted_variants as string[]).push(`${variant} → ${check.status}`);

          if (check.status === 200) {
            result.suggested_url = candidateUrl;
            result.suggestion_source = 'slug_variant';
            result.suggestion_confidence = 0.85;
            result.suggestion_validated = true;
            result.failure_reason = 'slug_changed';
            return result;
          }

          // If variant redirects to a valid page
          if (check.status && check.status >= 300 && check.status < 400 && check.redirectUrl) {
            const { finalUrl, statusCode } = await followRedirects(candidateUrl, 3);
            if (statusCode === 200) {
              result.suggested_url = finalUrl;
              result.suggestion_source = 'slug_variant';
              result.suggestion_confidence = 0.8;
              result.suggestion_validated = true;
              result.failure_reason = 'slug_changed';
              return result;
            }
          }
        }

        // Try brand-specific domain fixes
        if (brandName === 'esun') {
          const fixedUrl = url
            .replace(/www\.esun3d\.com/gi, 'esun3dstore.com')
            .replace(/esun3d\.com/gi, 'esun3dstore.com');
          if (fixedUrl !== url) {
            const check = await checkUrl(fixedUrl, 5000);
            if (check.status === 200) {
              result.suggested_url = fixedUrl;
              result.suggestion_source = 'brand_fix';
              result.suggestion_confidence = 0.95;
              result.suggestion_validated = true;
              result.failure_reason = 'domain_changed';
              return result;
            }
          }
        }
      }
    }

    // No fix found
    result.diagnosis_details = {
      ...result.diagnosis_details,
      note: 'Could not auto-discover correct URL',
    };
    return result;
  }

  // Step 5: Other status codes
  if (status && status >= 500) {
    result.failure_reason = 'store_down';
    result.diagnosis_details = { note: 'Server error — likely temporary' };
  }

  return result;
}

// ─── Edge function handler ────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action = 'scan', url, product_id, region, brand_filter, limit = 50 } = body;

    // ── Single URL diagnosis ──
    if (action === 'diagnose' && url) {
      const diagnosis = await diagnoseUrl(url, region);
      return new Response(JSON.stringify({ success: true, diagnosis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Scan products for broken URLs ──
    if (action === 'scan') {
      const regionColumns: Record<string, string> = {
        US: 'product_url',
        CA: 'product_url_ca',
        UK: 'product_url_uk',
        EU: 'product_url_eu',
        AU: 'product_url_au',
        JP: 'product_url_jp',
      };

      // Build query
      let query = supabase
        .from('filaments')
        .select('id, product_title, vendor, product_url, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp')
        .not('product_url', 'is', null)
        .limit(limit);

      if (brand_filter) {
        query = query.ilike('vendor', brand_filter);
      }

      const { data: products, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const results: DiagnosisResult[] = [];
      const repairs: any[] = [];

      // Process in batches of 10
      for (let i = 0; i < (products || []).length; i += 10) {
        const batch = products!.slice(i, i + 10);
        const batchPromises = batch.flatMap((product: any) => {
          const checks: Promise<void>[] = [];
          for (const [regionCode, column] of Object.entries(regionColumns)) {
            const productUrl = product[column];
            if (!productUrl || productUrl === 'DISCONTINUED') continue;

            checks.push(
              diagnoseUrl(productUrl, regionCode).then((diagnosis) => {
                if (diagnosis.failure_reason !== 'none') {
                  results.push(diagnosis);
                  repairs.push({
                    original_url: productUrl,
                    product_id: product.id,
                    product_name: product.product_title,
                    brand_name: product.vendor,
                    region: regionCode,
                    url_column: column,
                    http_status: diagnosis.http_status,
                    failure_reason: diagnosis.failure_reason,
                    diagnosis_details: diagnosis.diagnosis_details,
                    suggested_url: diagnosis.suggested_url,
                    suggestion_source: diagnosis.suggestion_source,
                    suggestion_confidence: diagnosis.suggestion_confidence,
                    suggestion_validated: diagnosis.suggestion_validated,
                    status: 'pending',
                  });
                }
              })
            );
          }
          return checks;
        });

        await Promise.all(batchPromises);

        // Delay between batches
        if (i + 10 < products!.length) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      // Insert repair suggestions into queue
      if (repairs.length > 0) {
        const { error: insertError } = await supabase
          .from('url_repair_queue')
          .upsert(repairs, { onConflict: 'id' });

        if (insertError) {
          console.error('Error inserting repairs:', insertError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          products_scanned: products?.length || 0,
          issues_found: results.length,
          auto_fixable: repairs.filter((r) => r.suggested_url).length,
          repairs_queued: repairs.length,
          summary: {
            discontinued: repairs.filter((r) => r.failure_reason === 'discontinued').length,
            slug_changed: repairs.filter((r) => r.failure_reason === 'slug_changed').length,
            domain_changed: repairs.filter((r) => r.failure_reason === 'domain_changed').length,
            store_down: repairs.filter((r) => r.failure_reason === 'store_down').length,
            soft_404: repairs.filter((r) => r.failure_reason === 'soft_404').length,
            unknown: repairs.filter((r) => r.failure_reason === 'unknown').length,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Apply approved repairs ──
    if (action === 'apply') {
      const { repair_ids } = body;
      if (!repair_ids?.length) {
        return new Response(JSON.stringify({ error: 'No repair_ids provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: repairs, error: fetchErr } = await supabase
        .from('url_repair_queue')
        .select('*')
        .in('id', repair_ids)
        .eq('status', 'approved');

      if (fetchErr) throw fetchErr;

      let applied = 0;
      for (const repair of repairs || []) {
        if (!repair.suggested_url || !repair.product_id || !repair.url_column) continue;

        const { error: updateErr } = await supabase
          .from('filaments')
          .update({ [repair.url_column]: repair.suggested_url })
          .eq('id', repair.product_id);

        if (!updateErr) {
          await supabase
            .from('url_repair_queue')
            .update({ status: 'applied', applied_at: new Date().toISOString() })
            .eq('id', repair.id);
          applied++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, applied }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Smart URL validator error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

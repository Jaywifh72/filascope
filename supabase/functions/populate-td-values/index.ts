import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void };

const TD_REGEX = /(?:TD|transmission\s*distance|transmissivity)\s*[:=]?\s*(\d+\.?\d*)\s*(?:mm)?/gi;
const TD_TABLE_REGEX = /(?:TD|Transmission\s*Distance)\s*\|?\s*(\d+\.?\d*)/gi;
const VALID_MATERIALS = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'PC', 'PLA+', 'Silk PLA', 'PLA Matte'];
const MAX_FIRECRAWL_CALLS = 20;
const FIRECRAWL_DELAY_MS = 500;
const TIME_LIMIT_MS = 120_000;

interface TdResult {
  filament_id: string;
  product_title: string;
  vendor: string;
  td_value: number | null;
  source: string;
  confidence: string;
  status: 'updated' | 'skipped' | 'error' | 'dry-run';
  message?: string;
}

function isValidTd(val: number): boolean {
  return val >= 0.1 && val <= 15.0;
}

function extractTdFromText(text: string): number | null {
  const regexes = [TD_REGEX, TD_TABLE_REGEX];
  for (const regex of regexes) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const val = parseFloat(match[1]);
      if (isValidTd(val)) return val;
    }
  }
  return null;
}

async function scrapeForTd(productUrl: string, firecrawlKey: string): Promise<number | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.log(`Firecrawl error for ${productUrl}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const markdown = data?.data?.markdown || data?.markdown || '';
    return extractTdFromText(markdown);
  } catch (err) {
    console.error(`Scrape error for ${productUrl}:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse params
    let mode = 'discovery';
    let brandSlug: string | null = null;
    let limit = 50;
    let forceRefresh = false;
    let source = 'all';

    try {
      const body = await req.json();
      mode = body.mode || 'discovery';
      brandSlug = body.brand_slug || null;
      limit = Math.min(body.limit || 50, 200);
      forceRefresh = body.force_refresh || false;
      source = body.source || 'all';
    } catch { /* use defaults */ }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query filaments
    let query = supabase
      .from('filaments')
      .select('id, vendor, product_title, display_name, material, color_family, color_hex, product_handle, product_url, transmission_distance')
      .in('material', VALID_MATERIALS)
      .order('vendor')
      .order('product_title')
      .limit(limit);

    if (!forceRefresh) {
      query = query.is('transmission_distance', null);
    }
    if (brandSlug) {
      query = query.ilike('vendor', `%${brandSlug}%`);
    }

    const { data: filaments, error: fetchError } = await query;
    if (fetchError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch filaments', details: fetchError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${filaments?.length || 0} filaments (mode=${mode}, source=${source})`);

    const results: TdResult[] = [];
    let matched = 0, updated = 0, skipped = 0, errors = 0;
    let firecrawlCalls = 0;
    const isDryRun = mode === 'dry-run';

    // Load all reference values once
    const { data: refValues } = await supabase
      .from('td_reference_values')
      .select('brand_name, material_type, color_name, td_value, confidence');

    for (const filament of filaments || []) {
      // Time guard
      if (Date.now() - startTime > TIME_LIMIT_MS) {
        console.log('Time limit reached, stopping early');
        break;
      }

      let tdValue: number | null = null;
      let tdSource = '';
      let tdConfidence = '';

      // Source A: Reference table lookup
      if (source === 'all' || source === 'reference-table') {
        const vendorLower = (filament.vendor || '').toLowerCase();
        const titleLower = (filament.product_title || '').toLowerCase();
        const colorLower = (filament.color_family || '').toLowerCase();
        const materialLower = (filament.material || '').toLowerCase();

        const match = (refValues || []).find(ref => {
          const brandMatch = vendorLower === ref.brand_name.toLowerCase() ||
            vendorLower.includes(ref.brand_name.toLowerCase()) ||
            ref.brand_name.toLowerCase().includes(vendorLower);

          const colorMatch = titleLower.includes(ref.color_name.toLowerCase()) ||
            colorLower === ref.color_name.toLowerCase();

          // Material matching: flexible (PLA matches PLA Basic, PLA+, etc.)
          const refMat = ref.material_type.toLowerCase();
          const matMatch = materialLower === refMat ||
            titleLower.includes(refMat) ||
            refMat.includes(materialLower);

          return brandMatch && colorMatch && matMatch;
        });

        if (match) {
          tdValue = Number(match.td_value);
          tdSource = 'reference_table';
          tdConfidence = match.confidence;
        }
      }

      // Source B: Page scraping fallback
      if (!tdValue && (source === 'all' || source === 'page-scrape') && firecrawlKey && filament.product_url && firecrawlCalls < MAX_FIRECRAWL_CALLS) {
        if (firecrawlCalls > 0) {
          await new Promise(r => setTimeout(r, FIRECRAWL_DELAY_MS));
        }
        firecrawlCalls++;
        const scraped = await scrapeForTd(filament.product_url, firecrawlKey);
        if (scraped !== null) {
          tdValue = scraped;
          tdSource = 'page_scrape';
          tdConfidence = 'medium';
        }
      }

      if (tdValue !== null) {
        matched++;
        if (isDryRun) {
          results.push({
            filament_id: filament.id,
            product_title: filament.product_title,
            vendor: filament.vendor,
            td_value: tdValue,
            source: tdSource,
            confidence: tdConfidence,
            status: 'dry-run',
            message: `Would set TD=${tdValue} (${tdSource}, ${tdConfidence})`,
          });
        } else {
          const { error: updateError } = await supabase
            .from('filaments')
            .update({ transmission_distance: tdValue })
            .eq('id', filament.id);

          if (updateError) {
            errors++;
            results.push({
              filament_id: filament.id,
              product_title: filament.product_title,
              vendor: filament.vendor,
              td_value: tdValue,
              source: tdSource,
              confidence: tdConfidence,
              status: 'error',
              message: updateError.message,
            });
          } else {
            updated++;
            results.push({
              filament_id: filament.id,
              product_title: filament.product_title,
              vendor: filament.vendor,
              td_value: tdValue,
              source: tdSource,
              confidence: tdConfidence,
              status: 'updated',
            });
          }
        }
      } else {
        skipped++;
        results.push({
          filament_id: filament.id,
          product_title: filament.product_title,
          vendor: filament.vendor,
          td_value: null,
          source: 'none',
          confidence: 'none',
          status: 'skipped',
          message: 'No TD value found',
        });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Done: ${matched} matched, ${updated} updated, ${skipped} skipped, ${errors} errors in ${duration}s`);

    return new Response(JSON.stringify({
      success: true,
      mode,
      source,
      duration_seconds: parseFloat(duration),
      summary: { total: filaments?.length || 0, matched, updated, skipped, errors, firecrawl_calls: firecrawlCalls },
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in populate-td-values:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

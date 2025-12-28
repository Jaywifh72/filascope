/**
 * SAINSMART TDS DISCOVERY SCRAPER
 * 
 * SainSmart sells filaments through their Shopify store
 * TDS PDFs are typically in product descriptions or metafields
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeResult {
  id: string;
  title: string;
  status: 'found' | 'not_found' | 'error';
  tdsUrl?: string | null;
  source?: string;
  error?: string;
}

// Known SainSmart TDS patterns - they use Shopify CDN
const SAINSMART_TDS_PATTERNS: Record<string, string> = {
  // TPU variants (their main specialty)
  'tpu 95a': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_TPU_95A_TDS.pdf',
  'tpu': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_TPU_95A_TDS.pdf',
  
  // PLA variants
  'pla': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_PLA_TDS.pdf',
  'pla+': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_PLA_Plus_TDS.pdf',
  'silk pla': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_Silk_PLA_TDS.pdf',
  'matte pla': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_Matte_PLA_TDS.pdf',
  
  // PETG
  'petg': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_PETG_TDS.pdf',
  
  // ABS
  'abs': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_ABS_TDS.pdf',
  
  // Specialty
  'wood': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_Wood_PLA_TDS.pdf',
  'carbon fiber': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_Carbon_Fiber_PLA_TDS.pdf',
  'cf pla': 'https://cdn.shopify.com/s/files/1/0059/8853/6851/files/SainSmart_Carbon_Fiber_PLA_TDS.pdf',
};

function matchKnownTds(title: string): { url: string; pattern: string } | null {
  const titleLower = title.toLowerCase();
  
  const sortedPatterns = Object.entries(SAINSMART_TDS_PATTERNS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sortedPatterns) {
    if (titleLower.includes(pattern)) {
      return { url, pattern };
    }
  }
  
  return null;
}

async function validateTdsUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function scrapeProductForTds(productUrl: string, firecrawlKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['html'],
        onlyMainContent: false,
        waitFor: 2000,
      }),
    });

    if (!response.ok) return null;

    const scrapeData = await response.json();
    const html = scrapeData.data?.html || '';

    const tdsPatterns = [
      /href="([^"]*cdn\.shopify\.com[^"]*TDS[^"]*\.pdf)"/gi,
      /href="([^"]*cdn\.shopify\.com[^"]*datasheet[^"]*\.pdf)"/gi,
      /href="([^"]*sainsmart[^"]*\.pdf)"/gi,
      /href="([^"]*TDS[^"]*\.pdf)"/gi,
    ];

    for (const pattern of tdsPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          let url = match[1];
          if (url.toLowerCase().includes('sds') || url.toLowerCase().includes('safety')) continue;
          if (!url.startsWith('http')) {
            url = url.startsWith('//') ? 'https:' + url : 'https://www.sainsmart.com' + url;
          }
          return url;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`[SAINSMART-TDS] Scrape error:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[SAINSMART-TDS] 🚀 SAINSMART TDS DISCOVERY STARTED');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
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

    let limit = 50, validateUrls = true, scrapePages = true;
    try {
      const body = await req.json();
      limit = body.limit ?? 50;
      validateUrls = body.validateUrls ?? true;
      scrapePages = body.scrapePages ?? true;
    } catch {}

    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url, vendor')
      .ilike('vendor', '%sainsmart%')
      .is('tds_url', null)
      .limit(limit);

    if (fetchError) throw new Error(`Failed to fetch: ${fetchError.message}`);

    console.log(`[SAINSMART-TDS] Found ${filaments?.length || 0} filaments without TDS`);

    const results: ScrapeResult[] = [];
    let found = 0, notFound = 0, errors = 0;

    for (const filament of filaments || []) {
      console.log(`[SAINSMART-TDS] Processing: ${filament.product_title}`);

      let tdsUrl: string | null = null;
      let source = 'unknown';

      const knownMatch = matchKnownTds(filament.product_title);
      if (knownMatch) {
        if (validateUrls) {
          const isValid = await validateTdsUrl(knownMatch.url);
          if (isValid) {
            tdsUrl = knownMatch.url;
            source = `known_pattern:${knownMatch.pattern}`;
          }
        } else {
          tdsUrl = knownMatch.url;
          source = `known_pattern:${knownMatch.pattern}`;
        }
      }

      if (!tdsUrl && scrapePages && firecrawlKey && filament.product_url) {
        const scrapedUrl = await scrapeProductForTds(filament.product_url, firecrawlKey);
        if (scrapedUrl) {
          if (validateUrls) {
            const isValid = await validateTdsUrl(scrapedUrl);
            if (isValid) {
              tdsUrl = scrapedUrl;
              source = 'product_page';
            }
          } else {
            tdsUrl = scrapedUrl;
            source = 'product_page';
          }
        }
        await new Promise(r => setTimeout(r, 1500));
      }

      if (tdsUrl) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ tds_url: tdsUrl, last_scraped_at: new Date().toISOString() })
          .eq('id', filament.id);

        if (updateError) {
          results.push({ id: filament.id, title: filament.product_title, status: 'error', error: updateError.message });
          errors++;
        } else {
          console.log(`[SAINSMART-TDS] ✅ Found: ${tdsUrl}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'found', tdsUrl, source });
          found++;
        }
      } else {
        results.push({ id: filament.id, title: filament.product_title, status: 'not_found' });
        notFound++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[SAINSMART-TDS] ✅ COMPLETED in ${duration}s - Found: ${found}, Not Found: ${notFound}`);

    return new Response(JSON.stringify({
      success: true, processed: results.length, found, notFound, errors, duration, results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SAINSMART-TDS] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

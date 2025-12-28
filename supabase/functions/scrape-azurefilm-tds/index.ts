/**
 * AZUREFILM TDS DISCOVERY SCRAPER
 * 
 * AzureFilm is a European (Slovenian) filament manufacturer using WooCommerce
 * TDS PDFs are in product descriptions or downloadable files tab
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

// Known AzureFilm TDS URLs - hosted on their WP uploads
const AZUREFILM_TDS_PATTERNS: Record<string, string> = {
  // PLA variants
  'pla': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PLA_TDS.pdf',
  'pla+': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PLA_Pro_TDS.pdf',
  'pla pro': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PLA_Pro_TDS.pdf',
  'silk pla': 'https://azurefilm.com/wp-content/uploads/AzureFilm_Silk_PLA_TDS.pdf',
  'matte pla': 'https://azurefilm.com/wp-content/uploads/AzureFilm_Matte_PLA_TDS.pdf',
  'wood pla': 'https://azurefilm.com/wp-content/uploads/AzureFilm_Wood_PLA_TDS.pdf',
  
  // PETG
  'petg': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PETG_TDS.pdf',
  
  // ABS
  'abs': 'https://azurefilm.com/wp-content/uploads/AzureFilm_ABS_TDS.pdf',
  
  // ASA
  'asa': 'https://azurefilm.com/wp-content/uploads/AzureFilm_ASA_TDS.pdf',
  
  // TPU
  'tpu': 'https://azurefilm.com/wp-content/uploads/AzureFilm_TPU_TDS.pdf',
  'tpu 98a': 'https://azurefilm.com/wp-content/uploads/AzureFilm_TPU_TDS.pdf',
  
  // PC (Polycarbonate)
  'pc': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PC_TDS.pdf',
  'polycarbonate': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PC_TDS.pdf',
  
  // PA (Nylon)
  'pa': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PA_TDS.pdf',
  'nylon': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PA_TDS.pdf',
  
  // PAHT-CF
  'paht-cf': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PAHT_CF_TDS.pdf',
  'pa-cf': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PAHT_CF_TDS.pdf',
};

function matchKnownTds(title: string): { url: string; pattern: string } | null {
  const titleLower = title.toLowerCase();
  
  const sortedPatterns = Object.entries(AZUREFILM_TDS_PATTERNS)
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

    // WooCommerce patterns for downloadable files
    const tdsPatterns = [
      /href="([^"]*wp-content\/uploads[^"]*TDS[^"]*\.pdf)"/gi,
      /href="([^"]*wp-content\/uploads[^"]*datasheet[^"]*\.pdf)"/gi,
      /href="([^"]*azurefilm[^"]*\.pdf)"/gi,
      /href="([^"]*downloads[^"]*\.pdf)"/gi,
      /data-file-url="([^"]+\.pdf)"/gi,  // WooCommerce download links
    ];

    for (const pattern of tdsPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          let url = match[1];
          if (url.toLowerCase().includes('sds') || url.toLowerCase().includes('safety')) continue;
          if (!url.startsWith('http')) {
            url = url.startsWith('//') ? 'https:' + url : 'https://azurefilm.com' + url;
          }
          return url;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`[AZUREFILM-TDS] Scrape error:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[AZUREFILM-TDS] 🚀 AZUREFILM TDS DISCOVERY STARTED');

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
      .ilike('vendor', '%azurefilm%')
      .is('tds_url', null)
      .limit(limit);

    if (fetchError) throw new Error(`Failed to fetch: ${fetchError.message}`);

    console.log(`[AZUREFILM-TDS] Found ${filaments?.length || 0} filaments without TDS`);

    const results: ScrapeResult[] = [];
    let found = 0, notFound = 0, errors = 0;

    for (const filament of filaments || []) {
      console.log(`[AZUREFILM-TDS] Processing: ${filament.product_title}`);

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
          console.log(`[AZUREFILM-TDS] ✅ Found: ${tdsUrl}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'found', tdsUrl, source });
          found++;
        }
      } else {
        results.push({ id: filament.id, title: filament.product_title, status: 'not_found' });
        notFound++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[AZUREFILM-TDS] ✅ COMPLETED in ${duration}s - Found: ${found}, Not Found: ${notFound}`);

    return new Response(JSON.stringify({
      success: true, processed: results.length, found, notFound, errors, duration, results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[AZUREFILM-TDS] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

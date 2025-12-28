/**
 * NINJATEK TDS DISCOVERY SCRAPER
 * 
 * NinjaTek is a premium TPU filament manufacturer with well-documented TDS
 * They have a dedicated resources page with all technical documents
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

// Known NinjaTek TDS URLs - NinjaTek hosts TDS on their CDN
const NINJATEK_TDS_PATTERNS: Record<string, string> = {
  // NinjaFlex TPU family
  'ninjaflex': 'https://ninjatek.com/wp-content/uploads/NinjaFlex-TDS.pdf',
  'ninjaflex 85a': 'https://ninjatek.com/wp-content/uploads/NinjaFlex-TDS.pdf',
  
  // Cheetah TPU
  'cheetah': 'https://ninjatek.com/wp-content/uploads/Cheetah-TDS.pdf',
  'cheetah 95a': 'https://ninjatek.com/wp-content/uploads/Cheetah-TDS.pdf',
  
  // Armadillo TPU
  'armadillo': 'https://ninjatek.com/wp-content/uploads/Armadillo-TDS.pdf',
  'armadillo 75d': 'https://ninjatek.com/wp-content/uploads/Armadillo-TDS.pdf',
  
  // Chinchilla TPU
  'chinchilla': 'https://ninjatek.com/wp-content/uploads/Chinchilla-TDS.pdf',
  'chinchilla 75a': 'https://ninjatek.com/wp-content/uploads/Chinchilla-TDS.pdf',
  
  // Eel TPU (conductive)
  'eel': 'https://ninjatek.com/wp-content/uploads/Eel-TDS.pdf',
  
  // NinjaTek specialty filaments
  'sapphire': 'https://ninjatek.com/wp-content/uploads/NinjaTek-Sapphire-TDS.pdf',
  'midnight': 'https://ninjatek.com/wp-content/uploads/NinjaTek-Midnight-TDS.pdf',
  'snow': 'https://ninjatek.com/wp-content/uploads/NinjaTek-Snow-TDS.pdf',
  'water': 'https://ninjatek.com/wp-content/uploads/NinjaTek-Water-TDS.pdf',
  'fire': 'https://ninjatek.com/wp-content/uploads/NinjaTek-Fire-TDS.pdf',
  'grass': 'https://ninjatek.com/wp-content/uploads/NinjaTek-Grass-TDS.pdf',
  'lava': 'https://ninjatek.com/wp-content/uploads/NinjaTek-Lava-TDS.pdf',
};

// Alternative pattern: TDS by product line prefix
const NINJATEK_PRODUCT_LINES: Record<string, string> = {
  'ninjaflex': 'NinjaFlex',
  'cheetah': 'Cheetah',
  'armadillo': 'Armadillo',
  'chinchilla': 'Chinchilla',
  'eel': 'Eel',
};

function matchKnownTds(title: string): { url: string; pattern: string } | null {
  const titleLower = title.toLowerCase();
  
  // Try exact patterns first
  const sortedPatterns = Object.entries(NINJATEK_TDS_PATTERNS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sortedPatterns) {
    if (titleLower.includes(pattern)) {
      return { url, pattern };
    }
  }
  
  // Try product line match
  for (const [keyword, productLine] of Object.entries(NINJATEK_PRODUCT_LINES)) {
    if (titleLower.includes(keyword)) {
      const url = `https://ninjatek.com/wp-content/uploads/${productLine}-TDS.pdf`;
      return { url, pattern: keyword };
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

    if (!response.ok) {
      console.log(`[NINJATEK-TDS] Scrape failed: ${response.status}`);
      return null;
    }

    const scrapeData = await response.json();
    const html = scrapeData.data?.html || '';

    // Look for PDF links
    const tdsPatterns = [
      /href="([^"]*ninjatek[^"]*TDS[^"]*\.pdf)"/gi,
      /href="([^"]*wp-content\/uploads[^"]*\.pdf)"/gi,
      /href="([^"]*TDS[^"]*\.pdf)"/gi,
      /href="([^"]*technical[_-]?data[^"]*\.pdf)"/gi,
    ];

    for (const pattern of tdsPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          let url = match[1];
          if (url.toLowerCase().includes('sds') || url.toLowerCase().includes('safety')) {
            continue;
          }
          if (!url.startsWith('http')) {
            url = url.startsWith('//') ? 'https:' + url : 'https://ninjatek.com' + url;
          }
          console.log(`[NINJATEK-TDS] Found TDS on page: ${url}`);
          return url;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`[NINJATEK-TDS] Scrape error:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[NINJATEK-TDS] ═══════════════════════════════════════════════════════');
  console.log('[NINJATEK-TDS] 🚀 NINJATEK TDS DISCOVERY STARTED');
  console.log('[NINJATEK-TDS] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let limit = 50;
    let validateUrls = true;
    let scrapePages = true;
    try {
      const body = await req.json();
      limit = body.limit ?? 50;
      validateUrls = body.validateUrls ?? true;
      scrapePages = body.scrapePages ?? true;
    } catch {}

    // Fetch NinjaTek filaments without TDS
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url, vendor')
      .ilike('vendor', '%ninjatek%')
      .is('tds_url', null)
      .limit(limit);

    if (fetchError) throw new Error(`Failed to fetch: ${fetchError.message}`);

    console.log(`[NINJATEK-TDS] Found ${filaments?.length || 0} filaments without TDS`);

    const results: ScrapeResult[] = [];
    let found = 0, notFound = 0, errors = 0;

    for (const filament of filaments || []) {
      console.log(`[NINJATEK-TDS] Processing: ${filament.product_title}`);

      let tdsUrl: string | null = null;
      let source = 'unknown';

      // Step 1: Try known patterns
      const knownMatch = matchKnownTds(filament.product_title);
      if (knownMatch) {
        console.log(`[NINJATEK-TDS] Matched pattern "${knownMatch.pattern}"`);
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

      // Step 2: Scrape product page if no match
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
          console.log(`[NINJATEK-TDS] ✅ Found TDS (${source}): ${tdsUrl}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'found', tdsUrl, source });
          found++;
        }
      } else {
        results.push({ id: filament.id, title: filament.product_title, status: 'not_found' });
        notFound++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[NINJATEK-TDS] ✅ COMPLETED in ${duration}s - Found: ${found}, Not Found: ${notFound}, Errors: ${errors}`);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      found, notFound, errors, duration, results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[NINJATEK-TDS] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

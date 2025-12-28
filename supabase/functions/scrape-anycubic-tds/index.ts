/**
 * ANYCUBIC TDS DISCOVERY SCRAPER
 * 
 * Discovers Technical Data Sheet (TDS) PDF URLs for Anycubic filaments
 * Uses known nice-cdn.com URL patterns and product page scraping
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

// Known Anycubic TDS URLs on nice-cdn.com
const ANYCUBIC_TDS_PATTERNS: Record<string, string> = {
  // Standard PLA variants
  'pla basic': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PLA_V3.0.pdf',
  'pla+': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PLA_V3.0.pdf',
  'pla pro': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PLA_V3.0.pdf',
  'pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PLA_V3.0.pdf',
  
  // High Speed PLA
  'high speed pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_High_Speed_PLA.pdf',
  'hs pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_High_Speed_PLA.pdf',
  
  // Specialty PLA
  'silk pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_SILK_PLA.pdf',
  'matte pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_Matte_PLA.pdf',
  'marble pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_Marble_PLA.pdf',
  'glow pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_Glow_PLA.pdf',
  
  // PETG
  'petg': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PETG.pdf',
  'high speed petg': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_High_Speed_PETG.pdf',
  
  // ABS
  'abs': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_ABS.pdf',
  'abs+': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_ABS.pdf',
  
  // TPU
  'tpu': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_TPU.pdf',
  'tpu 95a': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_TPU.pdf',
  
  // ASA
  'asa': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_ASA.pdf',
};

/**
 * Match product title to known TDS URL pattern
 */
function matchKnownTds(title: string): { url: string; pattern: string } | null {
  const titleLower = title.toLowerCase();
  
  // Sort patterns by length (longest first) for most specific match
  const sortedPatterns = Object.entries(ANYCUBIC_TDS_PATTERNS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sortedPatterns) {
    if (titleLower.includes(pattern)) {
      return { url, pattern };
    }
  }
  
  return null;
}

/**
 * Validate TDS URL is accessible
 */
async function validateTdsUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Scrape product page for TDS links using Firecrawl
 */
async function scrapeProductForTds(
  productUrl: string,
  firecrawlKey: string
): Promise<string | null> {
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
      console.log(`[ANYCUBIC-TDS] Scrape failed: ${response.status}`);
      return null;
    }

    const scrapeData = await response.json();
    const html = scrapeData.data?.html || '';

    // Look for nice-cdn.com PDF links (Anycubic's CDN)
    const cdnPatterns = [
      /href="([^"]*nice-cdn\.com[^"]*\.pdf)"/gi,
      /href="([^"]*anycubic[^"]*\.pdf)"/gi,
      /href="([^"]*TDS[^"]*\.pdf)"/gi,
      /href="([^"]*datasheet[^"]*\.pdf)"/gi,
    ];

    for (const pattern of cdnPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          let url = match[1];
          // Skip SDS (Safety Data Sheet) - we want TDS
          if (url.toLowerCase().includes('sds') || url.toLowerCase().includes('safety')) {
            continue;
          }
          if (!url.startsWith('http')) {
            url = url.startsWith('//') ? 'https:' + url : 'https://www.anycubic.com' + url;
          }
          console.log(`[ANYCUBIC-TDS] Found TDS on page: ${url}`);
          return url;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`[ANYCUBIC-TDS] Scrape error:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[ANYCUBIC-TDS] ═══════════════════════════════════════════════════════');
  console.log('[ANYCUBIC-TDS] 🚀 ANYCUBIC TDS DISCOVERY STARTED');
  console.log('[ANYCUBIC-TDS] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
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

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse options
    let limit = 50;
    let validateUrls = true;
    let scrapePages = true;
    try {
      const body = await req.json();
      limit = body.limit ?? 50;
      validateUrls = body.validateUrls ?? true;
      scrapePages = body.scrapePages ?? true;
    } catch {
      // Use defaults
    }

    // Fetch Anycubic filaments without TDS URLs
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url, vendor')
      .ilike('vendor', '%anycubic%')
      .is('tds_url', null)
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`[ANYCUBIC-TDS] Found ${filaments?.length || 0} filaments without TDS`);

    const results: ScrapeResult[] = [];
    let found = 0;
    let notFound = 0;
    let errors = 0;

    for (const filament of filaments || []) {
      console.log(`[ANYCUBIC-TDS] Processing: ${filament.product_title}`);

      let tdsUrl: string | null = null;
      let source = 'unknown';

      // Step 1: Try known TDS patterns first (fast, no API call)
      const knownMatch = matchKnownTds(filament.product_title);
      if (knownMatch) {
        console.log(`[ANYCUBIC-TDS] Matched pattern "${knownMatch.pattern}"`);
        
        // Validate the known URL if requested
        if (validateUrls) {
          const isValid = await validateTdsUrl(knownMatch.url);
          if (isValid) {
            tdsUrl = knownMatch.url;
            source = `known_pattern:${knownMatch.pattern}`;
          } else {
            console.log(`[ANYCUBIC-TDS] Known URL not accessible, will try scraping`);
          }
        } else {
          tdsUrl = knownMatch.url;
          source = `known_pattern:${knownMatch.pattern}`;
        }
      }

      // Step 2: If no known pattern match, try scraping the product page
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
        // Rate limiting for scraping
        await new Promise(r => setTimeout(r, 1500));
      }

      // Update database if TDS found
      if (tdsUrl) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ 
            tds_url: tdsUrl,
            last_scraped_at: new Date().toISOString()
          })
          .eq('id', filament.id);

        if (updateError) {
          console.error(`[ANYCUBIC-TDS] ❌ Update failed: ${updateError.message}`);
          results.push({ 
            id: filament.id, 
            title: filament.product_title, 
            status: 'error', 
            error: updateError.message 
          });
          errors++;
        } else {
          console.log(`[ANYCUBIC-TDS] ✅ Found TDS (${source}): ${tdsUrl}`);
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: 'found',
            tdsUrl,
            source,
          });
          found++;
        }
      } else {
        console.log(`[ANYCUBIC-TDS] ⏭️ No TDS found`);
        results.push({ 
          id: filament.id, 
          title: filament.product_title, 
          status: 'not_found' 
        });
        notFound++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('[ANYCUBIC-TDS] ═══════════════════════════════════════════════════════');
    console.log(`[ANYCUBIC-TDS] ✅ COMPLETED in ${duration}s`);
    console.log(`[ANYCUBIC-TDS] Found: ${found}, Not Found: ${notFound}, Errors: ${errors}`);
    console.log('[ANYCUBIC-TDS] ═══════════════════════════════════════════════════════');

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      found,
      notFound,
      errors,
      duration,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ANYCUBIC-TDS] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

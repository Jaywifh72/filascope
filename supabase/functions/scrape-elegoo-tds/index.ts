/**
 * ELEGOO TDS DISCOVERY SCRAPER
 * 
 * Discovers Technical Data Sheet (TDS) PDF URLs from Elegoo product pages
 * Uses Firecrawl to scrape product descriptions and resource sections
 * 
 * TDS Discovery Strategies:
 * 1. Product page description HTML - look for PDF links
 * 2. Resource/downloads section of product page
 * 3. Elegoo download center page (centralized resources)
 * 4. Common Elegoo TDS URL patterns
 * 
 * After discovery, optionally triggers parse-filament-tds for AI extraction
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const RATE_LIMIT_MS = 1500;
const MAX_RETRIES = 2;

interface ScrapeResult {
  id: string;
  title: string;
  status: 'found' | 'not_found' | 'skipped' | 'error';
  tdsUrl?: string | null;
  error?: string;
}

/**
 * Known TDS URL patterns for Elegoo materials
 * These are centralized TDS documents that apply to multiple products
 */
const ELEGOO_TDS_PATTERNS: Record<string, string> = {
  // Standard PLA
  'pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_PLA_TDS.pdf',
  'pla+': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_PLA_Plus_TDS.pdf',
  'pla plus': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_PLA_Plus_TDS.pdf',
  
  // Specialty PLA
  'rapid pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Rapid_PLA_TDS.pdf',
  'rapid pla+': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Rapid_PLA_Plus_TDS.pdf',
  'silk pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Silk_PLA_TDS.pdf',
  'matte pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Matte_PLA_TDS.pdf',
  'marble pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Marble_PLA_TDS.pdf',
  'glow pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Glow_PLA_TDS.pdf',
  'transparent pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Transparent_PLA_TDS.pdf',
  
  // PETG
  'petg': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_PETG_TDS.pdf',
  
  // ABS
  'abs': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_ABS_TDS.pdf',
  
  // TPU
  'tpu': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_TPU_TDS.pdf',
  
  // ASA
  'asa': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_ASA_TDS.pdf',
};

/**
 * Try to match a product title to a known TDS pattern
 */
function matchKnownTds(title: string): string | null {
  const titleLower = title.toLowerCase();
  
  // Sort patterns by length (longest first) to match most specific first
  const sortedPatterns = Object.entries(ELEGOO_TDS_PATTERNS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sortedPatterns) {
    if (titleLower.includes(pattern)) {
      return url;
    }
  }
  
  return null;
}

/**
 * Extract TDS URLs from product page HTML using Firecrawl
 */
async function scrapeProductForTds(
  productUrl: string,
  productTitle: string,
  firecrawlKey: string
): Promise<string | null> {
  console.log(`[ELEGOO-TDS] Scraping: ${productUrl}`);
  
  let retries = 0;
  while (retries <= MAX_RETRIES) {
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({
          url: productUrl,
          formats: ['markdown', 'html'],
          onlyMainContent: false,
          waitFor: 2000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 && retries < MAX_RETRIES) {
          console.log(`[ELEGOO-TDS] Rate limited, waiting 5s...`);
          await new Promise(r => setTimeout(r, 5000));
          retries++;
          continue;
        }
        throw new Error(`Firecrawl error: ${response.status}`);
      }

      const scrapeData = await response.json();
      const html = scrapeData.data?.html || '';
      const markdown = scrapeData.data?.markdown || '';
      
      // TDS URL patterns in order of priority
      const tdsPatterns = [
        // Direct TDS links
        /href="([^"]*TDS[^"]*\.pdf)"/gi,
        /href="([^"]*technical[_-]?data[_-]?sheet[^"]*\.pdf)"/gi,
        /href="([^"]*_TDS_[^"]*\.pdf)"/gi,
        /href="([^"]*datasheet[^"]*\.pdf)"/gi,
        
        // Shopify CDN PDFs
        /href="(https?:\/\/cdn\.shopify\.com\/[^"]*\.pdf)"/gi,
        
        // General PDF links that might be TDS
        /href="([^"]*specification[^"]*\.pdf)"/gi,
        /href="([^"]*safety[^"]*\.pdf)"/gi,
      ];
      
      for (const pattern of tdsPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            let url = match[1];
            // Skip non-TDS PDFs
            if (url.toLowerCase().includes('manual') || 
                url.toLowerCase().includes('guide') ||
                url.toLowerCase().includes('instruction')) {
              continue;
            }
            // Ensure absolute URL
            if (!url.startsWith('http')) {
              url = url.startsWith('//') ? 'https:' + url : 'https://elegoo.com' + url;
            }
            console.log(`[ELEGOO-TDS] Found TDS URL: ${url}`);
            return url;
          }
        }
      }
      
      // Check markdown for PDF links
      const mdPdfMatch = markdown.match(/\[.*?(?:TDS|Data\s*Sheet).*?\]\((https?:\/\/[^\)]+\.pdf)\)/i);
      if (mdPdfMatch?.[1]) {
        return mdPdfMatch[1];
      }
      
      console.log(`[ELEGOO-TDS] No TDS found on page, trying known patterns...`);
      
      // Fallback to known TDS patterns based on title
      const knownTds = matchKnownTds(productTitle);
      if (knownTds) {
        console.log(`[ELEGOO-TDS] Matched known TDS pattern: ${knownTds}`);
        return knownTds;
      }
      
      return null;
      
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(`[ELEGOO-TDS] Error, retrying: ${error}`);
        retries++;
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.error(`[ELEGOO-TDS] Failed:`, error);
      return null;
    }
  }
  
  return null;
}

/**
 * Validate that a TDS URL is accessible
 */
async function validateTdsUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[ELEGOO-TDS] ═══════════════════════════════════════════════════════');
  console.log('[ELEGOO-TDS] 🚀 ELEGOO TDS DISCOVERY STARTED');
  console.log('[ELEGOO-TDS] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
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
    let limit = 25;
    let validateUrls = false;
    let triggerParsing = false;
    try {
      const body = await req.json();
      limit = body.limit ?? 25;
      validateUrls = body.validateUrls ?? false;
      triggerParsing = body.triggerParsing ?? false;
    } catch {
      // Use defaults
    }

    // Fetch Elegoo filaments without TDS URLs
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url, vendor, tds_url')
      .ilike('vendor', '%elegoo%')
      .is('tds_url', null)
      .not('product_url', 'is', null)
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`[ELEGOO-TDS] Found ${filaments?.length || 0} filaments without TDS (limit: ${limit})`);

    const results: ScrapeResult[] = [];
    let found = 0;
    let notFound = 0;
    let errors = 0;

    for (const filament of filaments || []) {
      if (!filament.product_url) {
        results.push({ id: filament.id, title: filament.product_title, status: 'skipped', error: 'No URL' });
        continue;
      }

      console.log(`[ELEGOO-TDS] Processing: ${filament.product_title}`);

      // First try known TDS patterns (fast, no API call)
      let tdsUrl = matchKnownTds(filament.product_title);
      
      // If no known pattern, scrape the product page
      if (!tdsUrl) {
        tdsUrl = await scrapeProductForTds(
          filament.product_url,
          filament.product_title,
          firecrawlKey
        );
      }

      if (tdsUrl) {
        // Optionally validate the URL is accessible
        if (validateUrls) {
          const isValid = await validateTdsUrl(tdsUrl);
          if (!isValid) {
            console.log(`[ELEGOO-TDS] ⚠️ TDS URL not accessible: ${tdsUrl}`);
            tdsUrl = null;
          }
        }
      }

      if (tdsUrl) {
        // Update the filament with the TDS URL
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ 
            tds_url: tdsUrl,
            last_scraped_at: new Date().toISOString()
          })
          .eq('id', filament.id);

        if (updateError) {
          console.error(`[ELEGOO-TDS] ❌ Update failed: ${updateError.message}`);
          results.push({ 
            id: filament.id, 
            title: filament.product_title, 
            status: 'error', 
            error: updateError.message 
          });
          errors++;
        } else {
          console.log(`[ELEGOO-TDS] ✅ Found TDS: ${tdsUrl}`);
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: 'found',
            tdsUrl,
          });
          found++;
        }
      } else {
        console.log(`[ELEGOO-TDS] ⏭️ No TDS found`);
        results.push({ id: filament.id, title: filament.product_title, status: 'not_found' });
        notFound++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }

    // Optionally trigger TDS parsing for newly discovered URLs
    if (triggerParsing && found > 0) {
      console.log(`[ELEGOO-TDS] Triggering parse-filament-tds for ${found} new TDS URLs...`);
      try {
        await supabase.functions.invoke('parse-filament-tds', {
          body: { limit: found, vendor: 'Elegoo' }
        });
      } catch (parseError) {
        console.error(`[ELEGOO-TDS] Failed to trigger TDS parsing:`, parseError);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('[ELEGOO-TDS] ═══════════════════════════════════════════════════════');
    console.log(`[ELEGOO-TDS] ✅ COMPLETED in ${duration}s`);
    console.log(`[ELEGOO-TDS] Found: ${found}, Not Found: ${notFound}, Errors: ${errors}`);
    console.log('[ELEGOO-TDS] ═══════════════════════════════════════════════════════');

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
    console.error('[ELEGOO-TDS] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

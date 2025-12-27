/**
 * ATOMIC FILAMENT TDS DISCOVERY SCRAPER
 * 
 * Discovers Technical Data Sheet (TDS) PDF URLs from Atomic Filament product pages
 * Atomic Filament uses Shopify - checks metafields and description HTML
 * 
 * TDS Discovery Strategies:
 * 1. Shopify metafields (if available)
 * 2. Product description HTML for PDF links
 * 3. Product tags containing TDS URLs
 * 4. Known Atomic Filament TDS URL patterns
 * 
 * After discovery, optionally triggers parse-filament-tds for AI extraction
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const RATE_LIMIT_MS = 800;
const MAX_RETRIES = 3;

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  tags: string[];
}

interface ScrapeResult {
  id: string;
  title: string;
  status: 'found' | 'not_found' | 'skipped' | 'error';
  tdsUrl?: string | null;
  error?: string;
}

/**
 * Known TDS URL patterns for Atomic Filament materials
 */
const ATOMIC_TDS_PATTERNS: Record<string, string> = {
  // PLA variants
  'pla': 'https://atomicfilament.com/pages/pla-technical-data-sheet',
  'pla+': 'https://atomicfilament.com/pages/pla-plus-technical-data-sheet',
  'pla plus': 'https://atomicfilament.com/pages/pla-plus-technical-data-sheet',
  
  // PETG
  'petg': 'https://atomicfilament.com/pages/petg-technical-data-sheet',
  
  // ABS
  'abs': 'https://atomicfilament.com/pages/abs-technical-data-sheet',
  
  // TPU
  'tpu': 'https://atomicfilament.com/pages/tpu-technical-data-sheet',
  
  // ASA
  'asa': 'https://atomicfilament.com/pages/asa-technical-data-sheet',
  
  // Nylon
  'nylon': 'https://atomicfilament.com/pages/nylon-technical-data-sheet',
  'pa12': 'https://atomicfilament.com/pages/pa12-technical-data-sheet',
  
  // Carbon Fiber
  'carbon fiber': 'https://atomicfilament.com/pages/carbon-fiber-technical-data-sheet',
  'cf pla': 'https://atomicfilament.com/pages/carbon-fiber-pla-technical-data-sheet',
  'cf petg': 'https://atomicfilament.com/pages/carbon-fiber-petg-technical-data-sheet',
};

/**
 * Try to match a product title to a known TDS pattern
 */
function matchKnownTds(title: string): string | null {
  const titleLower = title.toLowerCase();
  
  // Sort patterns by length (longest first) to match most specific first
  const sortedPatterns = Object.entries(ATOMIC_TDS_PATTERNS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sortedPatterns) {
    if (titleLower.includes(pattern)) {
      return url;
    }
  }
  
  return null;
}

/**
 * Extract product handle from URL
 */
function extractHandle(url: string): string | null {
  const match = url.match(/\/products\/([^/?#]+)/);
  return match?.[1] || null;
}

/**
 * Fetch product data from Shopify JSON API and extract TDS URL
 */
async function fetchProductTds(
  productUrl: string,
  productTitle: string
): Promise<string | null> {
  const handle = extractHandle(productUrl);
  if (!handle) {
    console.log(`[ATOMIC-TDS] No handle found for: ${productTitle}`);
    return null;
  }
  
  const jsonUrl = `https://atomicfilament.com/products/${handle}.json`;
  console.log(`[ATOMIC-TDS] Fetching: ${jsonUrl}`);
  
  let retries = 0;
  while (retries <= MAX_RETRIES) {
    try {
      const response = await fetch(jsonUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; FilaScopeBot/1.0)',
        },
      });

      if (!response.ok) {
        if (response.status === 429 && retries < MAX_RETRIES) {
          console.log(`[ATOMIC-TDS] Rate limited, waiting 5s...`);
          await new Promise(r => setTimeout(r, 5000));
          retries++;
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const product: ShopifyProduct = data.product;
      
      if (!product) {
        throw new Error('No product data in response');
      }

      const html = product.body_html || '';
      
      // TDS URL patterns
      const tdsPatterns = [
        /href="([^"]*tds[^"]*\.pdf)"/gi,
        /href="([^"]*technical[_-]?data[_-]?sheet[^"]*\.pdf)"/gi,
        /href="([^"]*datasheet[^"]*\.pdf)"/gi,
        /href="([^"]*_TDS_[^"]*\.pdf)"/gi,
        /href="(https?:\/\/cdn\.shopify\.com\/[^"]*\.pdf)"/gi,
        /href="([^"]*specification[^"]*\.pdf)"/gi,
        // Links to TDS pages
        /href="(\/pages\/[^"]*tds[^"]*)"/gi,
        /href="(\/pages\/[^"]*technical[_-]?data[^"]*)"/gi,
      ];
      
      for (const pattern of tdsPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            let url = match[1];
            // Skip non-TDS links
            if (url.toLowerCase().includes('manual') || 
                url.toLowerCase().includes('guide') ||
                url.toLowerCase().includes('instruction')) {
              continue;
            }
            // Ensure absolute URL
            if (url.startsWith('/')) {
              url = 'https://atomicfilament.com' + url;
            } else if (url.startsWith('//')) {
              url = 'https:' + url;
            }
            console.log(`[ATOMIC-TDS] Found TDS URL in description: ${url}`);
            return url;
          }
        }
      }
      
      // Check tags for TDS URL
      const tdsTag = product.tags.find((tag: string) => 
        tag.toLowerCase().includes('tds:') || 
        tag.toLowerCase().includes('datasheet:')
      );
      if (tdsTag) {
        const urlPart = tdsTag.split(':').slice(1).join(':').trim();
        if (urlPart.startsWith('http') || urlPart.startsWith('/')) {
          const url = urlPart.startsWith('/') ? 'https://atomicfilament.com' + urlPart : urlPart;
          console.log(`[ATOMIC-TDS] Found TDS URL in tags: ${url}`);
          return url;
        }
      }
      
      console.log(`[ATOMIC-TDS] No TDS found on page, trying known patterns...`);
      
      // Fallback to known TDS patterns based on title
      const knownTds = matchKnownTds(productTitle);
      if (knownTds) {
        console.log(`[ATOMIC-TDS] Matched known TDS pattern: ${knownTds}`);
        return knownTds;
      }
      
      return null;
      
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(`[ATOMIC-TDS] Error, retrying: ${error}`);
        retries++;
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.error(`[ATOMIC-TDS] Failed:`, error);
      return null;
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[ATOMIC-TDS] ═══════════════════════════════════════════════════════');
  console.log('[ATOMIC-TDS] 🚀 ATOMIC FILAMENT TDS DISCOVERY STARTED');
  console.log('[ATOMIC-TDS] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
    let triggerParsing = false;
    try {
      const body = await req.json();
      limit = body.limit ?? 25;
      triggerParsing = body.triggerParsing ?? false;
    } catch {
      // Use defaults
    }

    // Fetch Atomic Filament products without TDS URLs
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url, vendor, tds_url')
      .ilike('vendor', '%atomic%')
      .is('tds_url', null)
      .not('product_url', 'is', null)
      .limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`[ATOMIC-TDS] Found ${filaments?.length || 0} filaments without TDS (limit: ${limit})`);

    const results: ScrapeResult[] = [];
    let found = 0;
    let notFound = 0;
    let errors = 0;

    for (const filament of filaments || []) {
      if (!filament.product_url) {
        results.push({ id: filament.id, title: filament.product_title, status: 'skipped', error: 'No URL' });
        continue;
      }

      console.log(`[ATOMIC-TDS] Processing: ${filament.product_title}`);

      // First try known TDS patterns (fast, no API call)
      let tdsUrl = matchKnownTds(filament.product_title);
      
      // If no known pattern, fetch from Shopify API
      if (!tdsUrl) {
        tdsUrl = await fetchProductTds(
          filament.product_url,
          filament.product_title
        );
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
          console.error(`[ATOMIC-TDS] ❌ Update failed: ${updateError.message}`);
          results.push({ 
            id: filament.id, 
            title: filament.product_title, 
            status: 'error', 
            error: updateError.message 
          });
          errors++;
        } else {
          console.log(`[ATOMIC-TDS] ✅ Found TDS: ${tdsUrl}`);
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: 'found',
            tdsUrl,
          });
          found++;
        }
      } else {
        console.log(`[ATOMIC-TDS] ⏭️ No TDS found`);
        results.push({ id: filament.id, title: filament.product_title, status: 'not_found' });
        notFound++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }

    // Optionally trigger TDS parsing for newly discovered URLs
    if (triggerParsing && found > 0) {
      console.log(`[ATOMIC-TDS] Triggering parse-filament-tds for ${found} new TDS URLs...`);
      try {
        await supabase.functions.invoke('parse-filament-tds', {
          body: { limit: found, vendor: 'Atomic Filament' }
        });
      } catch (parseError) {
        console.error(`[ATOMIC-TDS] Failed to trigger TDS parsing:`, parseError);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('[ATOMIC-TDS] ═══════════════════════════════════════════════════════');
    console.log(`[ATOMIC-TDS] ✅ COMPLETED in ${duration}s`);
    console.log(`[ATOMIC-TDS] Found: ${found}, Not Found: ${notFound}, Errors: ${errors}`);
    console.log('[ATOMIC-TDS] ═══════════════════════════════════════════════════════');

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
    console.error('[ATOMIC-TDS] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

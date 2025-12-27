/**
 * NINJATEK IMAGE & DATA SCRAPER
 * 
 * Uses Shopify JSON API (NinjaTek is on WooCommerce, but we use Firecrawl for fallback)
 * Extracts: featured_image, tds_url, variant_price, net_weight_g, color_hex, mpn
 * 
 * Compliant with shared ScrapedProduct schema and validation
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  validateScrapedProduct, 
  sanitizeScrapedProduct,
  type ScrapedProduct 
} from "../_shared/scraper-validation.ts";
import { getColorHex, getColorFamily, extractColorFromTitle } from "../_shared/color-mapping.ts";

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
  status: 'updated' | 'skipped' | 'error' | 'no_data';
  image?: string | null;
  tds?: string | null;
  price?: number | null;
  weight?: number | null;
  colorHex?: string | null;
  mpn?: string | null;
  validationErrors?: string[];
  validationWarnings?: string[];
  error?: string;
}

/**
 * Extract data from NinjaTek WooCommerce product page using Firecrawl
 */
async function scrapeNinjaTekProduct(
  productUrl: string, 
  productTitle: string,
  firecrawlKey: string
): Promise<ScrapedProduct | null> {
  console.log(`[NINJATEK] Scraping: ${productUrl}`);
  
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
          onlyMainContent: false, // Need full page for meta tags
          waitFor: 2000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 && retries < MAX_RETRIES) {
          console.log(`[NINJATEK] Rate limited, waiting 5s and retrying...`);
          await new Promise(r => setTimeout(r, 5000));
          retries++;
          continue;
        }
        throw new Error(`Firecrawl error: ${response.status}`);
      }

      const scrapeData = await response.json();
      const html = scrapeData.data?.html || '';
      const markdown = scrapeData.data?.markdown || '';
      const metadata = scrapeData.data?.metadata || {};

      // Extract image URL using multiple strategies
      let imageUrl: string | null = null;
      
      // Strategy 1: OG image (most reliable)
      const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                          html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
      if (ogImageMatch?.[1]) {
        imageUrl = ogImageMatch[1];
      }
      
      // Strategy 2: WooCommerce data-large_image attribute
      if (!imageUrl) {
        const largeImageMatch = html.match(/data-large_image="([^"]+)"/i);
        if (largeImageMatch?.[1]) {
          imageUrl = largeImageMatch[1];
        }
      }
      
      // Strategy 3: WooCommerce product gallery image
      if (!imageUrl) {
        const galleryMatch = html.match(/class="woocommerce-product-gallery__image"[^>]*>\s*<a[^>]*href="([^"]+)"/i);
        if (galleryMatch?.[1]) {
          imageUrl = galleryMatch[1];
        }
      }
      
      // Strategy 4: First product image in wp-content/uploads
      if (!imageUrl) {
        const wpUploadMatch = html.match(/src="(https:\/\/ninjatek\.com\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))"/i);
        if (wpUploadMatch?.[1] && 
            !wpUploadMatch[1].includes('placeholder') && 
            !wpUploadMatch[1].includes('icon') && 
            !wpUploadMatch[1].includes('logo')) {
          // Remove size suffix to get full-size image
          imageUrl = wpUploadMatch[1].replace(/-\d+x\d+\./, '.');
        }
      }

      // Extract TDS URL
      let tdsUrl: string | null = null;
      const tdsPatterns = [
        /href="([^"]*TDS[^"]*\.pdf)"/i,
        /href="([^"]*technical[_-]?data[_-]?sheet[^"]*\.pdf)"/i,
        /href="([^"]*_TDS_[^"]*\.pdf)"/i,
        /href="([^"]*safety[_-]?data[^"]*\.pdf)"/i,
        /href="([^"]*datasheet[^"]*\.pdf)"/i,
      ];
      for (const pattern of tdsPatterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
          tdsUrl = match[1].startsWith('http') ? match[1] : `https://ninjatek.com${match[1]}`;
          break;
        }
      }

      // Extract price from WooCommerce price element or markdown
      let price: number | null = null;
      
      // Try structured price element first
      const priceMatch = html.match(/<span class="woocommerce-Price-amount[^>]*>.*?(\d+(?:\.\d{2})?)<\/span>/i) ||
                        html.match(/<ins><span class="woocommerce-Price-amount[^>]*>.*?(\d+(?:\.\d{2})?)<\/span><\/ins>/i);
      if (priceMatch?.[1]) {
        price = parseFloat(priceMatch[1]);
      }
      
      // Fallback to markdown price patterns
      if (!price || price < 10 || price > 200) {
        const mdPriceMatch = markdown.match(/\$(\d+(?:\.\d{2})?)/);
        if (mdPriceMatch?.[1]) {
          const parsedPrice = parseFloat(mdPriceMatch[1]);
          if (parsedPrice >= 10 && parsedPrice <= 200) {
            price = parsedPrice;
          }
        }
      }

      // Extract weight
      let weight: number | null = null;
      const weightPatterns = [
        /(\d+(?:\.\d+)?)\s*(?:grams?|g)\b/gi,
        /(\d+(?:\.\d+)?)\s*(?:kg|kilogram)/gi,
        /net\s*weight[:\s]*(\d+(?:\.\d+)?)\s*(?:g|grams?)/gi,
      ];
      for (const pattern of weightPatterns) {
        const match = pattern.exec(markdown) || pattern.exec(html);
        if (match?.[1]) {
          let parsedWeight = parseFloat(match[1]);
          if (pattern.source.includes('kg')) {
            parsedWeight = parsedWeight * 1000;
          }
          if (parsedWeight >= 100 && parsedWeight <= 5000) {
            weight = Math.round(parsedWeight);
            break;
          }
        }
      }

      // Extract MPN/SKU
      let mpn: string | null = null;
      const skuMatch = html.match(/<span class="sku[^"]*">([^<]+)<\/span>/i) ||
                       html.match(/SKU[:\s]*([A-Z0-9\-]+)/i);
      if (skuMatch?.[1]) {
        mpn = skuMatch[1].trim();
      }

      // Extract color from title
      const { colorName, colorHex } = extractColorFromTitle(productTitle);

      // Extract product ID from URL
      const urlParts = productUrl.split('/');
      const productId = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1] || productUrl;

      const scrapedProduct: ScrapedProduct = {
        productId,
        title: productTitle,
        price,
        url: productUrl,
        imageUrl,
        tdsUrl,
        netWeightG: weight,
        mpn,
        colorName,
        colorHex: colorHex ? `#${colorHex}` : null,
        colorFamily: colorName ? getColorFamily(colorName) : null,
        available: true,
        currency: 'USD',
        scrapedAt: new Date(),
        source: 'ninjatek-scraper',
      };

      return scrapedProduct;
      
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(`[NINJATEK] Error, retrying (${retries + 1}/${MAX_RETRIES}): ${error}`);
        retries++;
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.error(`[NINJATEK] Failed after ${MAX_RETRIES} retries:`, error);
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
  console.log('[NINJATEK] ═══════════════════════════════════════════════════════');
  console.log('[NINJATEK] 🚀 NINJATEK SCRAPER STARTED');
  console.log('[NINJATEK] ═══════════════════════════════════════════════════════');

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
    let limit = 50;
    let skipExisting = true;
    try {
      const body = await req.json();
      limit = body.limit ?? 50;
      skipExisting = body.skipExisting ?? true;
    } catch {
      // Use defaults
    }

    // Fetch NinjaTek filaments with product URLs
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, vendor, featured_image, tds_url, variant_price')
      .eq('vendor', 'NinjaTek')
      .not('product_url', 'is', null);
    
    if (skipExisting) {
      query = query.or('featured_image.is.null,featured_image.eq.');
    }
    
    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`[NINJATEK] Found ${filaments?.length || 0} filaments to process (limit: ${limit})`);

    const results: ScrapeResult[] = [];
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const filament of filaments || []) {
      if (!filament.product_url) {
        results.push({ id: filament.id, title: filament.product_title, status: 'skipped', error: 'No URL' });
        skipped++;
        continue;
      }

      console.log(`[NINJATEK] ───────────────────────────────────────────────────────`);
      console.log(`[NINJATEK] Processing: ${filament.product_title}`);

      const scrapedProduct = await scrapeNinjaTekProduct(
        filament.product_url,
        filament.product_title,
        firecrawlKey
      );

      if (!scrapedProduct) {
        results.push({ id: filament.id, title: filament.product_title, status: 'error', error: 'Scrape failed' });
        errors++;
        continue;
      }

      // Validate the scraped product
      const validation = validateScrapedProduct(scrapedProduct);
      
      if (!validation.valid) {
        console.log(`[NINJATEK] ⚠️ Validation errors: ${validation.errors.join(', ')}`);
      }
      if (validation.warnings.length > 0) {
        console.log(`[NINJATEK] ⚠️ Validation warnings: ${validation.warnings.join(', ')}`);
      }

      // Sanitize the product data
      const sanitized = sanitizeScrapedProduct(scrapedProduct as unknown as Record<string, unknown>);

      // Build update payload - only update fields that have new values
      const updateData: Record<string, unknown> = {};
      
      if (sanitized.imageUrl && !filament.featured_image) {
        updateData.featured_image = sanitized.imageUrl;
      }
      if (sanitized.tdsUrl && !filament.tds_url) {
        updateData.tds_url = sanitized.tdsUrl;
      }
      if (sanitized.price && !filament.variant_price) {
        updateData.variant_price = sanitized.price;
      }
      if (sanitized.netWeightG) {
        updateData.net_weight_g = sanitized.netWeightG;
      }
      if (sanitized.colorHex) {
        updateData.color_hex = sanitized.colorHex;
      }
      if (sanitized.mpn) {
        updateData.mpn = sanitized.mpn;
      }
      
      // Always update last_scraped_at
      updateData.last_scraped_at = new Date().toISOString();

      if (Object.keys(updateData).length > 1) { // More than just last_scraped_at
        const { error: updateError } = await supabase
          .from('filaments')
          .update(updateData)
          .eq('id', filament.id);

        if (updateError) {
          console.error(`[NINJATEK] ❌ Update failed: ${updateError.message}`);
          results.push({ 
            id: filament.id, 
            title: filament.product_title, 
            status: 'error', 
            error: updateError.message 
          });
          errors++;
        } else {
          console.log(`[NINJATEK] ✅ Updated: image=${!!sanitized.imageUrl}, tds=${!!sanitized.tdsUrl}, price=${sanitized.price}, weight=${sanitized.netWeightG}`);
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: 'updated',
            image: sanitized.imageUrl as string | null,
            tds: sanitized.tdsUrl as string | null,
            price: sanitized.price as number | null,
            weight: sanitized.netWeightG as number | null,
            colorHex: sanitized.colorHex as string | null,
            mpn: sanitized.mpn as string | null,
            validationWarnings: validation.warnings.length > 0 ? validation.warnings : undefined,
          });
          updated++;
        }
      } else {
        console.log(`[NINJATEK] ⏭️ No new data extracted`);
        results.push({ id: filament.id, title: filament.product_title, status: 'no_data' });
        skipped++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('[NINJATEK] ═══════════════════════════════════════════════════════');
    console.log(`[NINJATEK] ✅ COMPLETED in ${duration}s`);
    console.log(`[NINJATEK] Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
    console.log('[NINJATEK] ═══════════════════════════════════════════════════════');

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      updated,
      skipped,
      errors,
      duration,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[NINJATEK] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

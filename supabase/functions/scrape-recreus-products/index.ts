/**
 * RECREUS PRODUCT SCRAPER (WooCommerce)
 * 
 * Scrapes FilaFlex and other flexible filament data from recreus.com
 * Uses Firecrawl for WooCommerce product page extraction
 * 
 * Extracts:
 * - Product images from WooCommerce gallery
 * - Prices from WooCommerce price elements
 * - TDS links from product descriptions
 * - Color from product titles and variant selectors
 * - Weight from title and specs
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

const RATE_LIMIT_MS = 2000;
const MAX_RETRIES = 3;
const BASE_URL = 'https://recreus.com';

interface ScrapeResult {
  id: string;
  title: string;
  status: 'updated' | 'skipped' | 'error' | 'no_data';
  image?: string | null;
  tds?: string | null;
  price?: number | null;
  colorHex?: string | null;
  error?: string;
}

/**
 * Extract price from WooCommerce HTML
 */
function extractPrice(html: string): { price: number | null; compareAtPrice: number | null } {
  // Sale price pattern
  const saleMatch = html.match(/<del[^>]*>.*?(\d+(?:[.,]\d{2})?)\s*€.*?<\/del>.*?<ins[^>]*>.*?(\d+(?:[.,]\d{2})?)\s*€.*?<\/ins>/is);
  if (saleMatch) {
    const compareAtPrice = parseFloat(saleMatch[1].replace(',', '.'));
    const price = parseFloat(saleMatch[2].replace(',', '.'));
    if (price > 0 && price < 200) {
      return { price, compareAtPrice };
    }
  }
  
  // Regular price
  const priceMatch = html.match(/<span class="woocommerce-Price-amount[^"]*"[^>]*>.*?(\d+(?:[.,]\d{2})?)\s*€/i) ||
                     html.match(/(\d+(?:[.,]\d{2})?)\s*€/);
  if (priceMatch?.[1]) {
    const price = parseFloat(priceMatch[1].replace(',', '.'));
    if (price > 0 && price < 200) {
      return { price, compareAtPrice: null };
    }
  }
  
  return { price: null, compareAtPrice: null };
}

/**
 * Extract image from WooCommerce product page
 */
function extractImage(html: string): string | null {
  // WooCommerce gallery large image
  const largeMatch = html.match(/data-large_image="([^"]+)"/i);
  if (largeMatch?.[1]) return largeMatch[1];
  
  // Gallery wrapper image
  const galleryMatch = html.match(/class="woocommerce-product-gallery__image[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"/i);
  if (galleryMatch?.[1]) return galleryMatch[1];
  
  // OG image
  const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  if (ogMatch?.[1]) return ogMatch[1];
  
  // Product image in content
  const imgMatch = html.match(/src="(https:\/\/recreus\.com\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))"/i);
  if (imgMatch?.[1] && !imgMatch[1].includes('placeholder') && !imgMatch[1].includes('icon')) {
    return imgMatch[1].replace(/-\d+x\d+\./, '.');
  }
  
  return null;
}

/**
 * Extract TDS URL from product page
 */
function extractTds(html: string, markdown: string): string | null {
  const patterns = [
    /href="([^"]*TDS[^"]*\.pdf)"/gi,
    /href="([^"]*technical[_-]?data[^"]*\.pdf)"/gi,
    /href="([^"]*ficha[_-]?tecnica[^"]*\.pdf)"/gi,
    /href="([^"]*datasheet[^"]*\.pdf)"/gi,
    /href="(https?:\/\/[^"]*recreus[^"]*\.pdf)"/gi,
  ];
  
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      let url = match[1];
      if (!url.startsWith('http')) {
        url = url.startsWith('/') ? `${BASE_URL}${url}` : `${BASE_URL}/${url}`;
      }
      return url;
    }
  }
  
  // Check markdown for PDF links
  const mdMatch = markdown.match(/\[.*?\]\((https?:\/\/[^\)]+\.pdf)\)/i);
  if (mdMatch?.[1]) return mdMatch[1];
  
  return null;
}

/**
 * Extract weight from title and HTML
 */
function extractWeight(html: string, title: string): number | null {
  const text = `${title} ${html}`;
  
  // Common weights
  const patterns = [
    /(\d+(?:\.\d+)?)\s*g(?:rams?)?(?:\s|$|<)/gi,
    /(\d+(?:\.\d+)?)\s*kg/gi,
    /Net\s*Weight[:\s]*(\d+(?:\.\d+)?)/gi,
  ];
  
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      let weight = parseFloat(match[1]);
      if (pattern.source.includes('kg')) weight *= 1000;
      if (weight >= 100 && weight <= 5000) {
        return Math.round(weight);
      }
    }
  }
  
  // Check title for common sizes
  const titleLower = title.toLowerCase();
  if (titleLower.includes('500g') || titleLower.includes('0.5kg')) return 500;
  if (titleLower.includes('1kg') || titleLower.includes('1000g')) return 1000;
  if (titleLower.includes('2.5kg') || titleLower.includes('2500g')) return 2500;
  if (titleLower.includes('250g')) return 250;
  
  return null;
}

/**
 * Extract color from title and variant selectors
 */
function extractColor(html: string, title: string): { colorName: string | null; colorHex: string | null } {
  // Try title extraction first
  const { colorName, colorHex } = extractColorFromTitle(title);
  if (colorName && colorHex) {
    return { colorName, colorHex: `#${colorHex}` };
  }
  
  // Check WooCommerce variation selector
  const variationMatch = html.match(/data-attribute_pa_color="([^"]+)"/i) ||
                         html.match(/value="([^"]+)"[^>]*selected[^>]*>/i);
  if (variationMatch?.[1]) {
    const color = variationMatch[1].replace(/-/g, ' ').trim();
    const hex = getColorHex(color);
    return { colorName: color, colorHex: hex ? `#${hex}` : null };
  }
  
  // Fallback to title without hex
  if (colorName) {
    return { colorName, colorHex: null };
  }
  
  return { colorName: null, colorHex: null };
}

/**
 * Scrape a single Recreus product using Firecrawl
 */
async function scrapeRecreusProduct(
  productUrl: string,
  productTitle: string,
  firecrawlKey: string
): Promise<ScrapedProduct | null> {
  console.log(`[RECREUS] Scraping: ${productUrl}`);
  
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
          waitFor: 3000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 && retries < MAX_RETRIES) {
          console.log(`[RECREUS] Rate limited, waiting 10s...`);
          await new Promise(r => setTimeout(r, 10000));
          retries++;
          continue;
        }
        throw new Error(`Firecrawl error: ${response.status}`);
      }

      const data = await response.json();
      const html = data.data?.html || '';
      const markdown = data.data?.markdown || '';

      const imageUrl = extractImage(html);
      const { price, compareAtPrice } = extractPrice(html);
      const tdsUrl = extractTds(html, markdown);
      const weight = extractWeight(html, productTitle);
      const { colorName, colorHex } = extractColor(html, productTitle);
      
      const productId = productUrl.split('/').filter(p => p).pop() || productUrl;

      const scrapedProduct: ScrapedProduct = {
        productId,
        title: productTitle,
        price,
        compareAtPrice,
        url: productUrl,
        imageUrl,
        tdsUrl,
        netWeightG: weight,
        colorName,
        colorHex,
        colorFamily: colorName ? getColorFamily(colorName) : null,
        available: true,
        currency: 'EUR',
        scrapedAt: new Date(),
        source: 'recreus-woocommerce-scraper',
      };

      console.log(`[RECREUS] Extracted: image=${!!imageUrl}, price=${price}, tds=${!!tdsUrl}, color=${colorName}`);
      return scrapedProduct;
      
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(`[RECREUS] Error, retrying (${retries + 1}/${MAX_RETRIES}): ${error}`);
        retries++;
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }
      console.error(`[RECREUS] Failed:`, error);
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
  console.log('[RECREUS] ═══════════════════════════════════════════════════════');
  console.log('[RECREUS] 🚀 RECREUS SCRAPER STARTED');
  console.log('[RECREUS] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }
    
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

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin required' }), {
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
    } catch { /* defaults */ }

    // Fetch Recreus filaments
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, vendor, featured_image, tds_url, variant_price')
      .eq('vendor', 'Recreus')
      .not('product_url', 'is', null);
    
    if (skipExisting) {
      query = query.or('featured_image.is.null,featured_image.eq.');
    }
    
    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);

    console.log(`[RECREUS] Found ${filaments?.length || 0} filaments to process`);

    const results: ScrapeResult[] = [];
    let updated = 0, skipped = 0, errors = 0;

    for (const filament of filaments || []) {
      if (!filament.product_url) {
        results.push({ id: filament.id, title: filament.product_title, status: 'skipped', error: 'No URL' });
        skipped++;
        continue;
      }

      console.log(`[RECREUS] Processing: ${filament.product_title}`);

      const scrapedProduct = await scrapeRecreusProduct(
        filament.product_url,
        filament.product_title,
        firecrawlKey
      );

      if (!scrapedProduct) {
        results.push({ id: filament.id, title: filament.product_title, status: 'error', error: 'Scrape failed' });
        errors++;
        continue;
      }

      const validation = validateScrapedProduct(scrapedProduct);
      const sanitized = sanitizeScrapedProduct(scrapedProduct as unknown as Record<string, unknown>);

      // Build update object
      const updateData: Record<string, unknown> = {
        last_scraped_at: new Date().toISOString(),
      };

      if (scrapedProduct.imageUrl && !filament.featured_image) {
        updateData.featured_image = scrapedProduct.imageUrl;
      }
      if (scrapedProduct.tdsUrl && !filament.tds_url) {
        updateData.tds_url = scrapedProduct.tdsUrl;
      }
      if (scrapedProduct.price && !filament.variant_price) {
        updateData.variant_price = scrapedProduct.price;
      }
      if (scrapedProduct.colorHex) {
        updateData.color_hex = scrapedProduct.colorHex;
      }
      if (scrapedProduct.colorFamily) {
        updateData.color_family = scrapedProduct.colorFamily;
      }
      if (scrapedProduct.netWeightG) {
        updateData.net_weight_g = scrapedProduct.netWeightG;
      }

      if (Object.keys(updateData).length > 1) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update(updateData)
          .eq('id', filament.id);

        if (updateError) {
          console.error(`[RECREUS] Update error for ${filament.id}:`, updateError);
          results.push({ id: filament.id, title: filament.product_title, status: 'error', error: updateError.message });
          errors++;
        } else {
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: 'updated',
            image: scrapedProduct.imageUrl,
            tds: scrapedProduct.tdsUrl,
            price: scrapedProduct.price,
            colorHex: scrapedProduct.colorHex,
          });
          updated++;
        }
      } else {
        results.push({ id: filament.id, title: filament.product_title, status: 'skipped' });
        skipped++;
      }

      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`[RECREUS] ═══════════════════════════════════════════════════════`);
    console.log(`[RECREUS] ✅ COMPLETE: ${updated} updated, ${skipped} skipped, ${errors} errors in ${duration}s`);

    return new Response(JSON.stringify({
      success: true,
      summary: { updated, skipped, errors, duration },
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[RECREUS] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

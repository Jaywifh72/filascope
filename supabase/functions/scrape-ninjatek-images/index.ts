/**
 * NINJATEK IMAGE & DATA SCRAPER (Enhanced WooCommerce)
 * 
 * Uses Firecrawl for WooCommerce product page scraping
 * Enhanced extraction patterns for:
 * - Product images (WooCommerce gallery, data-large_image, OG tags)
 * - Prices (sale/regular from structured price elements)
 * - TDS links (PDF patterns in description)
 * - MPN/SKU from WooCommerce SKU element
 * - Weight from product specs
 * - Color from variant selectors and title
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
import { getColorHex, getColorFamily, extractColorFromTitle, COLOR_HEX_MAP } from "../_shared/color-mapping.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting - NinjaTek can be slow
const RATE_LIMIT_MS = 2000;
const MAX_RETRIES = 3;

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
 * Enhanced WooCommerce price extraction
 * Handles: regular price, sale price, price ranges
 */
function extractWooCommercePrice(html: string, markdown: string): { price: number | null; compareAtPrice: number | null } {
  let price: number | null = null;
  let compareAtPrice: number | null = null;
  
  // Strategy 1: Sale price (in <ins> tag) with original price (in <del> tag)
  const saleMatch = html.match(/<del[^>]*>.*?<bdi>\s*\$\s*(\d+(?:\.\d{2})?)\s*<\/bdi>.*?<\/del>.*?<ins[^>]*>.*?<bdi>\s*\$\s*(\d+(?:\.\d{2})?)\s*<\/bdi>.*?<\/ins>/is);
  if (saleMatch) {
    compareAtPrice = parseFloat(saleMatch[1]);
    price = parseFloat(saleMatch[2]);
    if (price > 0 && price < 200) {
      return { price, compareAtPrice };
    }
  }
  
  // Strategy 2: WooCommerce Price amount with bdi element
  const priceAmountMatch = html.match(/<span class="woocommerce-Price-amount[^"]*"[^>]*>.*?<bdi>\s*\$\s*(\d+(?:\.\d{2})?)\s*<\/bdi>/i);
  if (priceAmountMatch?.[1]) {
    price = parseFloat(priceAmountMatch[1]);
    if (price > 0 && price < 200) {
      return { price, compareAtPrice: null };
    }
  }
  
  // Strategy 3: Simple price span
  const simplePriceMatch = html.match(/<span class="woocommerce-Price-amount[^"]*"[^>]*>\s*\$?\s*(\d+(?:\.\d{2})?)\s*<\/span>/i);
  if (simplePriceMatch?.[1]) {
    price = parseFloat(simplePriceMatch[1]);
    if (price > 0 && price < 200) {
      return { price, compareAtPrice: null };
    }
  }
  
  // Strategy 4: Meta tag price
  const metaPriceMatch = html.match(/<meta[^>]*property="product:price:amount"[^>]*content="(\d+(?:\.\d{2})?)"/i) ||
                         html.match(/<meta[^>]*content="(\d+(?:\.\d{2})?)"[^>]*property="product:price:amount"/i);
  if (metaPriceMatch?.[1]) {
    price = parseFloat(metaPriceMatch[1]);
    if (price > 0 && price < 200) {
      return { price, compareAtPrice: null };
    }
  }
  
  // Strategy 5: Markdown price patterns
  const mdPriceMatch = markdown.match(/\$(\d+(?:\.\d{2})?)/);
  if (mdPriceMatch?.[1]) {
    price = parseFloat(mdPriceMatch[1]);
    if (price >= 15 && price <= 150) {
      return { price, compareAtPrice: null };
    }
  }
  
  return { price: null, compareAtPrice: null };
}

/**
 * Enhanced WooCommerce image extraction
 * Priority: data-large_image > gallery image > og:image > first product image
 */
function extractWooCommerceImage(html: string): string | null {
  // Strategy 1: data-large_image attribute (highest resolution)
  const largeImageMatch = html.match(/data-large_image="([^"]+)"/i);
  if (largeImageMatch?.[1]) {
    return largeImageMatch[1];
  }
  
  // Strategy 2: WooCommerce product gallery main image
  const galleryMatch = html.match(/class="woocommerce-product-gallery__image[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"/i);
  if (galleryMatch?.[1]) {
    return galleryMatch[1];
  }
  
  // Strategy 3: OG image
  const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                      html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
  if (ogImageMatch?.[1]) {
    return ogImageMatch[1];
  }
  
  // Strategy 4: First product image in wp-content/uploads
  const productImageMatch = html.match(/src="(https:\/\/ninjatek\.com\/wp-content\/uploads\/[^"]+\.(?:jpg|jpeg|png|webp))"/i);
  if (productImageMatch?.[1] && 
      !productImageMatch[1].includes('placeholder') && 
      !productImageMatch[1].includes('icon') && 
      !productImageMatch[1].includes('logo')) {
    // Remove size suffix to get full-size image
    return productImageMatch[1].replace(/-\d+x\d+\./, '.');
  }
  
  // Strategy 5: Any attachment image in content
  const attachmentMatch = html.match(/class="attachment-[^"]*"[^>]*src="([^"]+)"/i);
  if (attachmentMatch?.[1] && !attachmentMatch[1].includes('icon')) {
    return attachmentMatch[1];
  }
  
  return null;
}

/**
 * Enhanced TDS URL extraction with NinjaTek-specific patterns
 */
function extractNinjaTekTds(html: string, markdown: string): string | null {
  const tdsPatterns = [
    // NinjaTek uses these patterns
    /href="([^"]*TDS[^"]*\.pdf)"/gi,
    /href="([^"]*technical[_-]?data[_-]?sheet[^"]*\.pdf)"/gi,
    /href="([^"]*_TDS_[^"]*\.pdf)"/gi,
    /href="(https?:\/\/[^"]*ninjatek[^"]*\.pdf)"/gi,
    /href="([^"]*datasheet[^"]*\.pdf)"/gi,
    /href="([^"]*safety[_-]?data[^"]*\.pdf)"/gi,
    // CDN-hosted PDFs
    /href="(https?:\/\/cdn[^"]*\.pdf)"/gi,
  ];
  
  for (const pattern of tdsPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        let url = match[1];
        if (!url.startsWith('http')) {
          url = url.startsWith('/') ? `https://ninjatek.com${url}` : `https://ninjatek.com/${url}`;
        }
        return url;
      }
    }
  }
  
  // Check markdown for PDF links
  const mdPdfMatch = markdown.match(/\[.*?TDS.*?\]\((https?:\/\/[^\)]+\.pdf)\)/i) ||
                     markdown.match(/\((https?:\/\/[^\)]*TDS[^\)]*\.pdf)\)/i);
  if (mdPdfMatch?.[1]) {
    return mdPdfMatch[1];
  }
  
  return null;
}

/**
 * Extract MPN/SKU from WooCommerce product page
 */
function extractWooCommerceMpn(html: string): string | null {
  // WooCommerce SKU element
  const skuMatch = html.match(/<span class="sku[^"]*">([^<]+)<\/span>/i);
  if (skuMatch?.[1]) {
    const sku = skuMatch[1].trim();
    if (sku && sku !== 'N/A' && sku.length > 0) {
      return sku;
    }
  }
  
  // Meta tag SKU
  const metaSkuMatch = html.match(/<meta[^>]*property="product:retailer_item_id"[^>]*content="([^"]+)"/i);
  if (metaSkuMatch?.[1]) {
    return metaSkuMatch[1];
  }
  
  // Product ID from data attribute
  const dataSkuMatch = html.match(/data-product_sku="([^"]+)"/i);
  if (dataSkuMatch?.[1]) {
    return dataSkuMatch[1];
  }
  
  return null;
}

/**
 * Extract weight from product page
 */
function extractNinjaTekWeight(html: string, markdown: string, title: string): number | null {
  const text = `${title} ${markdown} ${html}`;
  
  // Common NinjaTek spool weights
  const weightPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:grams?|g)\b/gi,
    /Net\s*Weight[:\s]*(\d+(?:\.\d+)?)\s*(?:g|grams?)/gi,
    /Weight[:\s]*(\d+(?:\.\d+)?)\s*(?:g|grams?)/gi,
    /(\d+(?:\.\d+)?)\s*kg\b/gi,
  ];
  
  for (const pattern of weightPatterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      let weight = parseFloat(match[1]);
      if (pattern.source.includes('kg')) {
        weight = weight * 1000;
      }
      // Valid filament weights: 100g to 5kg
      if (weight >= 100 && weight <= 5000) {
        return Math.round(weight);
      }
    }
  }
  
  // Default weights based on NinjaTek product lines
  const titleLower = title.toLowerCase();
  if (titleLower.includes('0.5kg') || titleLower.includes('500g')) return 500;
  if (titleLower.includes('1kg') || titleLower.includes('1000g')) return 1000;
  if (titleLower.includes('2kg') || titleLower.includes('2000g')) return 2000;
  
  return null;
}

/**
 * Enhanced color extraction from NinjaTek title and page
 */
function extractNinjaTekColor(html: string, title: string): { colorName: string | null; colorHex: string | null } {
  // First try extracting from title
  const { colorName: titleColor, colorHex: titleHex } = extractColorFromTitle(title);
  if (titleColor && titleHex) {
    return { colorName: titleColor, colorHex: `#${titleHex}` };
  }
  
  // Try WooCommerce variation selector
  const variationMatch = html.match(/data-attribute_pa_color="([^"]+)"/i) ||
                         html.match(/<option[^>]*selected[^>]*value="([^"]+)"[^>]*data-attribute_name="attribute_pa_color"/i);
  if (variationMatch?.[1]) {
    const colorName = variationMatch[1].replace(/-/g, ' ').trim();
    const hex = getColorHex(colorName);
    return { colorName, colorHex: hex ? `#${hex}` : null };
  }
  
  // Try to find color in breadcrumbs or product categories
  const categoryMatch = html.match(/product-cat-([a-z\-]+)/i);
  if (categoryMatch?.[1]) {
    const category = categoryMatch[1].replace(/-/g, ' ');
    const hex = getColorHex(category);
    if (hex) {
      return { colorName: category, colorHex: `#${hex}` };
    }
  }
  
  // Fallback to title extraction without hex
  if (titleColor) {
    return { colorName: titleColor, colorHex: null };
  }
  
  return { colorName: null, colorHex: null };
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
          onlyMainContent: false, // Need full page for meta tags and structured data
          waitFor: 3000, // NinjaTek pages can be slow
        }),
      });

      if (!response.ok) {
        if (response.status === 429 && retries < MAX_RETRIES) {
          console.log(`[NINJATEK] Rate limited, waiting 10s and retrying...`);
          await new Promise(r => setTimeout(r, 10000));
          retries++;
          continue;
        }
        throw new Error(`Firecrawl error: ${response.status}`);
      }

      const scrapeData = await response.json();
      const html = scrapeData.data?.html || '';
      const markdown = scrapeData.data?.markdown || '';

      // Extract all data using enhanced functions
      const imageUrl = extractWooCommerceImage(html);
      const { price, compareAtPrice } = extractWooCommercePrice(html, markdown);
      const tdsUrl = extractNinjaTekTds(html, markdown);
      const mpn = extractWooCommerceMpn(html);
      const weight = extractNinjaTekWeight(html, markdown, productTitle);
      const { colorName, colorHex } = extractNinjaTekColor(html, productTitle);
      
      // Extract product ID from URL
      const urlParts = productUrl.split('/');
      const productId = urlParts.filter(p => p && p !== 'products').pop() || productUrl;

      const scrapedProduct: ScrapedProduct = {
        productId,
        title: productTitle,
        price,
        compareAtPrice,
        url: productUrl,
        imageUrl,
        tdsUrl,
        netWeightG: weight,
        mpn,
        colorName,
        colorHex,
        colorFamily: colorName ? getColorFamily(colorName) : null,
        available: true,
        currency: 'USD',
        scrapedAt: new Date(),
        source: 'ninjatek-woocommerce-scraper',
      };

      console.log(`[NINJATEK] Extracted: image=${!!imageUrl}, price=${price}, tds=${!!tdsUrl}, mpn=${mpn}, color=${colorName}`);
      return scrapedProduct;
      
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(`[NINJATEK] Error, retrying (${retries + 1}/${MAX_RETRIES}): ${error}`);
        retries++;
        await new Promise(r => setTimeout(r, 3000));
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

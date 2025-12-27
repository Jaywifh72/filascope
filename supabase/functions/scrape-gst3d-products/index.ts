/**
 * GST3D PRODUCT SCRAPER (Shopify)
 * 
 * Scrapes filament data from gst3d.com using Shopify JSON API
 * 
 * Extracts:
 * - Product images from Shopify variants
 * - Prices with sale detection
 * - TDS URLs from description
 * - Color from product options and titles
 * - MPN/SKU from variant data
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

const RATE_LIMIT_MS = 600;
const MAX_RETRIES = 3;
const BASE_URL = 'https://gst3d.com';

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  images: Array<{ id: number; src: string; alt: string | null; variant_ids?: number[] }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string;
    barcode: string | null;
    available: boolean;
    weight: number | null;
    weight_unit: string | null;
    featured_image?: { src: string };
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }>;
  options: Array<{ name: string; values: string[] }>;
}

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
 * Extract handle from URL
 */
function extractHandle(url: string): string | null {
  const match = url.match(/\/products\/([^/?#]+)/);
  return match?.[1] || null;
}

/**
 * Find best matching variant
 */
function findMatchingVariant(product: ShopifyProduct, filamentTitle: string): ShopifyProduct['variants'][0] | null {
  const titleLower = filamentTitle.toLowerCase();
  
  // Try color matching
  const { colorName } = extractColorFromTitle(filamentTitle);
  if (colorName) {
    const colorLower = colorName.toLowerCase();
    for (const variant of product.variants) {
      if (variant.title.toLowerCase().includes(colorLower) ||
          variant.option1?.toLowerCase().includes(colorLower) ||
          variant.option2?.toLowerCase().includes(colorLower)) {
        return variant;
      }
    }
  }
  
  // Weight matching
  const weightMatch = titleLower.match(/(\d+)\s*(?:g|kg)/);
  if (weightMatch) {
    for (const variant of product.variants) {
      if (variant.title.toLowerCase().includes(weightMatch[0])) {
        return variant;
      }
    }
  }
  
  // Default variant
  const defaultVariant = product.variants.find(v => 
    v.title.toLowerCase() === 'default title' || v.title.toLowerCase() === 'default'
  );
  if (defaultVariant) return defaultVariant;
  
  // First available
  return product.variants.find(v => v.available) || product.variants[0] || null;
}

/**
 * Extract TDS URL from body_html
 */
function extractTdsUrl(product: ShopifyProduct): string | null {
  const html = product.body_html || '';
  
  const patterns = [
    /href="([^"]*tds[^"]*\.pdf)"/i,
    /href="([^"]*technical[_-]?data[^"]*\.pdf)"/i,
    /href="([^"]*datasheet[^"]*\.pdf)"/i,
    /href="(https?:\/\/cdn\.shopify\.com\/[^"]*\.pdf)"/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      let url = match[1];
      if (url.startsWith('//')) url = 'https:' + url;
      if (url.startsWith('/')) url = BASE_URL + url;
      return url;
    }
  }
  
  // Check tags
  const tdsTag = product.tags.find(t => t.toLowerCase().includes('tds:'));
  if (tdsTag) {
    const url = tdsTag.split(':').slice(1).join(':').trim();
    if (url.startsWith('http')) return url;
  }
  
  return null;
}

/**
 * Extract weight from variant and title
 */
function extractWeight(product: ShopifyProduct, variant: ShopifyProduct['variants'][0] | null, title: string): number | null {
  if (variant?.weight && variant.weight_unit) {
    let weight = variant.weight;
    if (variant.weight_unit.toLowerCase() === 'kg') weight *= 1000;
    else if (variant.weight_unit.toLowerCase() === 'lb') weight *= 453.592;
    if (weight >= 100 && weight <= 5000) return Math.round(weight);
  }
  
  const titleLower = title.toLowerCase();
  if (titleLower.includes('1kg') || titleLower.includes('1000g')) return 1000;
  if (titleLower.includes('500g') || titleLower.includes('0.5kg')) return 500;
  if (titleLower.includes('2kg') || titleLower.includes('2000g')) return 2000;
  
  return null;
}

/**
 * Extract color from variant options
 */
function extractColor(product: ShopifyProduct, variant: ShopifyProduct['variants'][0] | null, title: string): { colorName: string | null; colorHex: string | null } {
  // Check variant options
  if (variant) {
    const colorOption = product.options.find(o => 
      o.name.toLowerCase().includes('color') || o.name.toLowerCase().includes('colour')
    );
    
    if (colorOption) {
      const idx = product.options.indexOf(colorOption) + 1;
      const optValue = variant[`option${idx}` as keyof typeof variant] as string | null;
      if (optValue) {
        const hex = getColorHex(optValue);
        return { colorName: optValue, colorHex: hex ? `#${hex}` : null };
      }
    }
    
    // Variant title
    if (variant.title && variant.title !== 'Default Title') {
      const hex = getColorHex(variant.title);
      if (hex) return { colorName: variant.title, colorHex: `#${hex}` };
    }
  }
  
  // Title extraction
  const { colorName, colorHex } = extractColorFromTitle(title);
  return { colorName, colorHex: colorHex ? `#${colorHex}` : null };
}

/**
 * Scrape GST3D product via Shopify JSON API
 */
async function scrapeGst3dProduct(
  productUrl: string,
  productHandle: string | null,
  filamentTitle: string
): Promise<ScrapedProduct | null> {
  const handle = productHandle || extractHandle(productUrl);
  if (!handle) {
    console.log(`[GST3D] No handle for: ${filamentTitle}`);
    return null;
  }
  
  const jsonUrl = `${BASE_URL}/products/${handle}.json`;
  console.log(`[GST3D] Fetching: ${jsonUrl}`);
  
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
          console.log(`[GST3D] Rate limited, waiting 5s...`);
          await new Promise(r => setTimeout(r, 5000));
          retries++;
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const product: ShopifyProduct = data.product;
      
      if (!product) throw new Error('No product data');

      const variant = findMatchingVariant(product, filamentTitle);
      
      // Get image
      let imageUrl: string | null = null;
      if (variant?.featured_image?.src) {
        imageUrl = variant.featured_image.src;
      } else if (product.images?.[0]?.src) {
        imageUrl = product.images[0].src;
      }
      
      const price = variant?.price ? parseFloat(variant.price) : null;
      const compareAtPrice = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
      const tdsUrl = extractTdsUrl(product);
      const weight = extractWeight(product, variant, filamentTitle);
      const { colorName, colorHex } = extractColor(product, variant, filamentTitle);
      
      const scrapedProduct: ScrapedProduct = {
        productId: String(product.id),
        title: filamentTitle,
        price: price && price > 0 && price < 500 ? price : null,
        compareAtPrice: compareAtPrice && compareAtPrice > 0 ? compareAtPrice : null,
        url: productUrl,
        imageUrl,
        tdsUrl,
        netWeightG: weight,
        mpn: variant?.sku || null,
        barcode: variant?.barcode || null,
        colorName,
        colorHex,
        colorFamily: colorName ? getColorFamily(colorName) : null,
        available: variant?.available ?? true,
        currency: 'USD',
        scrapedAt: new Date(),
        source: 'gst3d-shopify-scraper',
      };
      
      console.log(`[GST3D] Extracted: image=${!!imageUrl}, price=${price}, color=${colorName}`);
      return scrapedProduct;
      
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(`[GST3D] Error, retrying: ${error}`);
        retries++;
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.error(`[GST3D] Failed:`, error);
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
  console.log('[GST3D] ═══════════════════════════════════════════════════════');
  console.log('[GST3D] 🚀 GST3D SCRAPER STARTED');
  console.log('[GST3D] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    // Fetch GST3D filaments
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, product_handle, vendor, featured_image, color_hex, variant_price')
      .eq('vendor', 'GST3D')
      .not('product_url', 'is', null);
    
    if (skipExisting) {
      query = query.or('featured_image.is.null,color_hex.is.null');
    }
    
    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);

    console.log(`[GST3D] Found ${filaments?.length || 0} filaments to process`);

    const results: ScrapeResult[] = [];
    let updated = 0, skipped = 0, errors = 0;

    for (const filament of filaments || []) {
      if (!filament.product_url) {
        results.push({ id: filament.id, title: filament.product_title, status: 'skipped', error: 'No URL' });
        skipped++;
        continue;
      }

      console.log(`[GST3D] Processing: ${filament.product_title}`);

      const scrapedProduct = await scrapeGst3dProduct(
        filament.product_url,
        filament.product_handle,
        filament.product_title
      );

      if (!scrapedProduct) {
        results.push({ id: filament.id, title: filament.product_title, status: 'error', error: 'Scrape failed' });
        errors++;
        continue;
      }

      const validation = validateScrapedProduct(scrapedProduct);

      // Build update object
      const updateData: Record<string, unknown> = {
        last_scraped_at: new Date().toISOString(),
      };

      if (scrapedProduct.imageUrl && !filament.featured_image) {
        updateData.featured_image = scrapedProduct.imageUrl;
      }
      if (scrapedProduct.price && !filament.variant_price) {
        updateData.variant_price = scrapedProduct.price;
      }
      if (scrapedProduct.colorHex && !filament.color_hex) {
        updateData.color_hex = scrapedProduct.colorHex;
      }
      if (scrapedProduct.colorFamily) {
        updateData.color_family = scrapedProduct.colorFamily;
      }
      if (scrapedProduct.mpn) {
        updateData.mpn = scrapedProduct.mpn;
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
          results.push({ id: filament.id, title: filament.product_title, status: 'error', error: updateError.message });
          errors++;
        } else {
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: 'updated',
            image: scrapedProduct.imageUrl,
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
    console.log(`[GST3D] ✅ COMPLETE: ${updated} updated, ${skipped} skipped, ${errors} errors in ${duration}s`);

    return new Response(JSON.stringify({
      success: true,
      summary: { updated, skipped, errors, duration },
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[GST3D] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

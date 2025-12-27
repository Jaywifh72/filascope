/**
 * TREED FILAMENTS TDS & COLOR SCRAPER
 * 
 * Uses Shopify JSON API to extract:
 * - TDS links from product descriptions
 * - Color information from Italian and English names
 * - Images, prices, and weights
 * 
 * TreeD uses both English and Italian color names
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
const BASE_URL = 'https://treed-filaments.com';

// Italian color translations for TreeD products
const ITALIAN_COLOR_MAP: Record<string, string> = {
  'nero': 'black',
  'bianco': 'white',
  'rosso': 'red',
  'blu': 'blue',
  'verde': 'green',
  'giallo': 'yellow',
  'arancione': 'orange',
  'viola': 'purple',
  'rosa': 'pink',
  'marrone': 'brown',
  'grigio': 'grey',
  'argento': 'silver',
  'oro': 'gold',
  'trasparente': 'transparent',
  'naturale': 'natural',
  'beige': 'beige',
  'azzurro': 'light blue',
  'celeste': 'sky blue',
  'fucsia': 'fuchsia',
  'magenta': 'magenta',
  'turchese': 'turquoise',
  'acquamarina': 'aquamarine',
  'corallo': 'coral',
  'bordeaux': 'burgundy',
  'cremisi': 'crimson',
  'indaco': 'indigo',
  'lavanda': 'lavender',
  'lilla': 'lilac',
  'oliva': 'olive',
  'pesca': 'peach',
  'salmone': 'salmon',
  'terracotta': 'terracotta',
  'legno': 'wood',
  'rame': 'copper',
  'bronzo': 'bronze',
};

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
  }>;
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
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }>;
  options: Array<{
    name: string;
    values: string[];
  }>;
}

interface ScrapeResult {
  id: string;
  title: string;
  status: 'updated' | 'skipped' | 'error' | 'no_data';
  tds?: string | null;
  image?: string | null;
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
 * Translate Italian color to English
 */
function translateItalianColor(colorName: string): string {
  const lowerColor = colorName.toLowerCase().trim();
  return ITALIAN_COLOR_MAP[lowerColor] || colorName;
}

/**
 * Enhanced color extraction for TreeD with Italian support
 */
function extractTreeDColor(product: ShopifyProduct, filamentTitle: string): { colorName: string | null; colorHex: string | null } {
  // Check variant options for color
  const colorOption = product.options.find(o => 
    o.name.toLowerCase().includes('color') || 
    o.name.toLowerCase().includes('colore') ||
    o.name.toLowerCase().includes('colour')
  );
  
  if (colorOption && colorOption.values.length > 0) {
    // Get first color value
    let colorName = colorOption.values[0];
    
    // Translate Italian to English if needed
    colorName = translateItalianColor(colorName);
    
    const hex = getColorHex(colorName);
    if (hex) {
      return { colorName, colorHex: `#${hex}` };
    }
  }
  
  // Check product title
  const { colorName: titleColor, colorHex: titleHex } = extractColorFromTitle(filamentTitle);
  if (titleColor) {
    const translated = translateItalianColor(titleColor);
    const hex = titleHex || getColorHex(translated);
    return { colorName: translated, colorHex: hex ? `#${hex}` : null };
  }
  
  // Check tags for color info
  for (const tag of product.tags) {
    const translated = translateItalianColor(tag);
    const hex = getColorHex(translated);
    if (hex) {
      return { colorName: translated, colorHex: `#${hex}` };
    }
  }
  
  return { colorName: null, colorHex: null };
}

/**
 * Extract TDS URL from TreeD product
 */
function extractTdsUrl(product: ShopifyProduct): string | null {
  const html = product.body_html || '';
  
  // Look for PDF links in description
  const pdfPatterns = [
    /href="([^"]*tds[^"]*\.pdf)"/i,
    /href="([^"]*technical[_-]?data[^"]*\.pdf)"/i,
    /href="([^"]*datasheet[^"]*\.pdf)"/i,
    /href="([^"]*scheda[_-]?tecnica[^"]*\.pdf)"/i, // Italian: technical sheet
    /href="([^"]*spec[_-]?sheet[^"]*\.pdf)"/i,
    /href="(https?:\/\/cdn\.shopify\.com\/[^"]*\.pdf)"/i,
    /href="(https?:\/\/[^"]*treed[^"]*\.pdf)"/i,
  ];
  
  for (const pattern of pdfPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      let url = match[1];
      if (url.startsWith('//')) url = 'https:' + url;
      if (url.startsWith('/')) url = BASE_URL + url;
      return url;
    }
  }
  
  // Check for documentation links
  const docMatch = html.match(/href="([^"]*(?:documentation|docs|download)[^"]*\.pdf)"/i);
  if (docMatch?.[1]) {
    let url = docMatch[1];
    if (url.startsWith('/')) url = BASE_URL + url;
    return url;
  }
  
  // Check tags
  const tdsTag = product.tags.find(tag => 
    tag.toLowerCase().includes('tds') || 
    tag.toLowerCase().includes('datasheet') ||
    tag.toLowerCase().includes('scheda')
  );
  if (tdsTag && tdsTag.includes('http')) {
    return tdsTag.split(':').slice(1).join(':').trim();
  }
  
  return null;
}

/**
 * Extract weight from product
 */
function extractWeight(product: ShopifyProduct, filamentTitle: string): number | null {
  const variant = product.variants?.[0];
  if (variant?.weight && variant.weight_unit) {
    let weight = variant.weight;
    if (variant.weight_unit.toLowerCase() === 'kg') {
      weight = weight * 1000;
    } else if (variant.weight_unit.toLowerCase() === 'lb') {
      weight = weight * 453.592;
    }
    if (weight >= 100 && weight <= 5000) {
      return Math.round(weight);
    }
  }
  
  // Check title
  const titleLower = filamentTitle.toLowerCase();
  if (titleLower.includes('1kg') || titleLower.includes('1000g')) return 1000;
  if (titleLower.includes('500g') || titleLower.includes('0.5kg')) return 500;
  if (titleLower.includes('750g') || titleLower.includes('0.75kg')) return 750;
  if (titleLower.includes('2kg') || titleLower.includes('2000g')) return 2000;
  if (titleLower.includes('250g') || titleLower.includes('0.25kg')) return 250;
  
  return null;
}

/**
 * Scrape TreeD product
 */
async function scrapeTreeDProduct(
  productUrl: string,
  productHandle: string | null,
  filamentTitle: string
): Promise<ScrapedProduct | null> {
  const handle = productHandle || extractHandle(productUrl);
  if (!handle) {
    console.log(`[TREED] No handle for: ${filamentTitle}`);
    return null;
  }
  
  const jsonUrl = `${BASE_URL}/products/${handle}.json`;
  console.log(`[TREED] 📡 Fetching: ${jsonUrl}`);
  
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
          console.log(`[TREED] ⏳ Rate limited, waiting 5s...`);
          await new Promise(r => setTimeout(r, 5000));
          retries++;
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const product: ShopifyProduct = data.product;
      
      if (!product) {
        throw new Error('No product data');
      }

      const tdsUrl = extractTdsUrl(product);
      const weight = extractWeight(product, filamentTitle);
      const { colorName, colorHex } = extractTreeDColor(product, filamentTitle);
      
      const variant = product.variants?.[0];
      const imageUrl = product.images?.[0]?.src || null;
      const price = variant?.price ? parseFloat(variant.price) : null;

      console.log(`[TREED] 📄 TDS: ${tdsUrl ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`[TREED] 🎨 Color: ${colorName || 'NOT FOUND'} (${colorHex || 'no hex'})`);
      console.log(`[TREED] 🖼️ Image: ${imageUrl ? 'FOUND' : 'NOT FOUND'}`);
      
      return {
        productId: String(product.id),
        title: filamentTitle,
        price: price && price > 0 && price < 500 ? price : null,
        compareAtPrice: variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null,
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
        currency: 'EUR', // TreeD is EU-based
        scrapedAt: new Date(),
        source: 'treed-products-scraper',
      };
      
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(`[TREED] ❌ Retry ${retries + 1}: ${error}`);
        retries++;
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.error(`[TREED] ❌ Failed: ${error}`);
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
  console.log('[TREED] ═══════════════════════════════════════════════════════');
  console.log('[TREED] 🚀 TREED FILAMENTS TDS & COLOR SCRAPER STARTED');
  console.log(`[TREED] 📅 ${new Date().toISOString()}`);
  console.log('[TREED] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
      return new Response(JSON.stringify({ error: 'Admin required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse options
    let limit = 50;
    let skipExisting = true;
    let focusTds = false;
    let focusColors = false;
    try {
      const body = await req.json();
      limit = body.limit ?? 50;
      skipExisting = body.skipExisting ?? true;
      focusTds = body.focusTds ?? false;
      focusColors = body.focusColors ?? false;
    } catch {
      // Use defaults
    }

    console.log(`[TREED] ⚙️ Options: limit=${limit}, skipExisting=${skipExisting}, focusTds=${focusTds}, focusColors=${focusColors}`);

    // Fetch TreeD filaments
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, product_handle, vendor, featured_image, tds_url, color_hex, variant_price')
      .eq('vendor', 'TreeD Filaments')
      .not('product_url', 'is', null);
    
    if (skipExisting) {
      if (focusTds) {
        query = query.is('tds_url', null);
      } else if (focusColors) {
        query = query.is('color_hex', null);
      } else {
        query = query.or('tds_url.is.null,color_hex.is.null');
      }
    }

    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch: ${fetchError.message}`);
    }

    console.log(`[TREED] 📊 Found ${filaments?.length || 0} filaments to process`);

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

      console.log(`[TREED] ───────────────────────────────────────────────────────`);
      console.log(`[TREED] 📦 Processing: ${filament.product_title}`);

      const scrapedProduct = await scrapeTreeDProduct(
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
      const sanitized = sanitizeScrapedProduct(scrapedProduct as unknown as Record<string, unknown>);

      const updateData: Record<string, unknown> = {};
      
      if (sanitized.tdsUrl && !filament.tds_url) {
        updateData.tds_url = sanitized.tdsUrl;
      }
      if (sanitized.colorHex && !filament.color_hex) {
        updateData.color_hex = sanitized.colorHex;
      }
      if (sanitized.colorName) {
        updateData.color_family = getColorFamily(sanitized.colorName as string);
      }
      if (sanitized.imageUrl && !filament.featured_image) {
        updateData.featured_image = sanitized.imageUrl;
      }
      if (sanitized.price && !filament.variant_price) {
        updateData.variant_price = sanitized.price;
      }
      if (sanitized.netWeightG) {
        updateData.net_weight_g = sanitized.netWeightG;
      }
      if (sanitized.mpn) {
        updateData.mpn = sanitized.mpn;
      }
      
      updateData.last_scraped_at = new Date().toISOString();

      if (Object.keys(updateData).length > 1) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update(updateData)
          .eq('id', filament.id);

        if (updateError) {
          console.error(`[TREED] ❌ Update failed: ${updateError.message}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'error', error: updateError.message });
          errors++;
        } else {
          console.log(`[TREED] ✅ Updated: tds=${!!sanitized.tdsUrl}, color=${!!sanitized.colorHex}, image=${!!sanitized.imageUrl}`);
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: 'updated',
            tds: sanitized.tdsUrl as string | null,
            colorHex: sanitized.colorHex as string | null,
            image: sanitized.imageUrl as string | null,
          });
          updated++;
        }
      } else {
        console.log(`[TREED] ⏭️ No new data`);
        results.push({ id: filament.id, title: filament.product_title, status: 'no_data' });
        skipped++;
      }

      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('[TREED] ═══════════════════════════════════════════════════════');
    console.log(`[TREED] ✅ COMPLETED in ${duration}s`);
    console.log(`[TREED] 📊 Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
    console.log('[TREED] ═══════════════════════════════════════════════════════');

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
    console.error('[TREED] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * PUSH PLASTIC TDS SCRAPER
 * 
 * Uses Shopify JSON API to extract TDS links from Push Plastic products
 * Push Plastic maintains TDS in product descriptions and on a centralized page
 * 
 * Features:
 * - Shopify product JSON extraction
 * - TDS link discovery from body_html
 * - Fallback to centralized /pages/tech-specs
 * - Color and weight extraction
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
const BASE_URL = 'https://www.pushplastic.com';

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
  price?: number | null;
  error?: string;
}

// Known TDS URL mappings for Push Plastic materials
const KNOWN_TDS_URLS: Record<string, string> = {
  'pla': 'https://www.pushplastic.com/pages/pla-technical-data',
  'abs': 'https://www.pushplastic.com/pages/abs-technical-data',
  'petg': 'https://www.pushplastic.com/pages/petg-technical-data',
  'tpu': 'https://www.pushplastic.com/pages/tpu-technical-data',
  'asa': 'https://www.pushplastic.com/pages/asa-technical-data',
  'nylon': 'https://www.pushplastic.com/pages/nylon-technical-data',
  'pc': 'https://www.pushplastic.com/pages/pc-technical-data',
  'polycarbonate': 'https://www.pushplastic.com/pages/pc-technical-data',
};

/**
 * Extract handle from URL
 */
function extractHandle(url: string): string | null {
  const match = url.match(/\/products\/([^/?#]+)/);
  return match?.[1] || null;
}

/**
 * Extract TDS URL from product body HTML and known mappings
 */
function extractTdsUrl(product: ShopifyProduct, filamentTitle: string): string | null {
  const html = product.body_html || '';
  
  // Strategy 1: Look for PDF links in description
  const pdfPatterns = [
    /href="([^"]*tds[^"]*\.pdf)"/i,
    /href="([^"]*technical[_-]?data[^"]*\.pdf)"/i,
    /href="([^"]*datasheet[^"]*\.pdf)"/i,
    /href="([^"]*spec[_-]?sheet[^"]*\.pdf)"/i,
    /href="(https?:\/\/cdn\.shopify\.com\/[^"]*\.pdf)"/i,
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
  
  // Strategy 2: Look for tech-specs page links
  const techSpecMatch = html.match(/href="([^"]*\/pages\/[^"]*(?:tech|spec|data)[^"]*)"/i);
  if (techSpecMatch?.[1]) {
    let url = techSpecMatch[1];
    if (url.startsWith('/')) url = BASE_URL + url;
    return url;
  }
  
  // Strategy 3: Check tags for TDS info
  const tdsTag = product.tags.find(tag => 
    tag.toLowerCase().includes('tds') || 
    tag.toLowerCase().includes('datasheet')
  );
  if (tdsTag && tdsTag.includes('http')) {
    return tdsTag.split(':').slice(1).join(':').trim();
  }
  
  // Strategy 4: Use known material mappings
  const titleLower = filamentTitle.toLowerCase();
  for (const [material, url] of Object.entries(KNOWN_TDS_URLS)) {
    if (titleLower.includes(material)) {
      return url;
    }
  }
  
  // Strategy 5: Check product type
  if (product.product_type) {
    const typeLower = product.product_type.toLowerCase();
    for (const [material, url] of Object.entries(KNOWN_TDS_URLS)) {
      if (typeLower.includes(material)) {
        return url;
      }
    }
  }
  
  return null;
}

/**
 * Extract weight from product
 */
function extractWeight(product: ShopifyProduct, filamentTitle: string): number | null {
  // Check first variant weight
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
  
  // Check title for weight
  const titleLower = filamentTitle.toLowerCase();
  if (titleLower.includes('1kg') || titleLower.includes('1000g')) return 1000;
  if (titleLower.includes('500g') || titleLower.includes('0.5kg')) return 500;
  if (titleLower.includes('2kg') || titleLower.includes('2000g')) return 2000;
  
  return null;
}

/**
 * Find matching variant for filament
 */
function findMatchingVariant(product: ShopifyProduct, filamentTitle: string): ShopifyProduct['variants'][0] | null {
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
  
  return product.variants.find(v => v.available) || product.variants[0] || null;
}

/**
 * Scrape Push Plastic product
 */
async function scrapePushPlasticProduct(
  productUrl: string,
  productHandle: string | null,
  filamentTitle: string
): Promise<ScrapedProduct | null> {
  const handle = productHandle || extractHandle(productUrl);
  if (!handle) {
    console.log(`[PUSHPLASTIC] No handle for: ${filamentTitle}`);
    return null;
  }
  
  const jsonUrl = `${BASE_URL}/products/${handle}.json`;
  console.log(`[PUSHPLASTIC] 📡 Fetching: ${jsonUrl}`);
  
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
          console.log(`[PUSHPLASTIC] ⏳ Rate limited, waiting 5s...`);
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

      const variant = findMatchingVariant(product, filamentTitle);
      const tdsUrl = extractTdsUrl(product, filamentTitle);
      const weight = extractWeight(product, filamentTitle);
      const { colorName, colorHex } = extractColorFromTitle(filamentTitle);
      
      const imageUrl = product.images?.[0]?.src || null;
      const price = variant?.price ? parseFloat(variant.price) : null;

      console.log(`[PUSHPLASTIC] 📄 TDS: ${tdsUrl ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`[PUSHPLASTIC] 🖼️ Image: ${imageUrl ? 'FOUND' : 'NOT FOUND'}`);
      
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
        colorHex: colorHex ? `#${colorHex}` : null,
        colorFamily: colorName ? getColorFamily(colorName) : null,
        available: variant?.available ?? true,
        currency: 'USD',
        scrapedAt: new Date(),
        source: 'pushplastic-tds-scraper',
      };
      
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(`[PUSHPLASTIC] ❌ Retry ${retries + 1}: ${error}`);
        retries++;
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.error(`[PUSHPLASTIC] ❌ Failed: ${error}`);
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
  console.log('[PUSHPLASTIC] ═══════════════════════════════════════════════════════');
  console.log('[PUSHPLASTIC] 🚀 PUSH PLASTIC TDS SCRAPER STARTED');
  console.log(`[PUSHPLASTIC] 📅 ${new Date().toISOString()}`);
  console.log('[PUSHPLASTIC] ═══════════════════════════════════════════════════════');

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
    try {
      const body = await req.json();
      limit = body.limit ?? 50;
      skipExisting = body.skipExisting ?? true;
    } catch {
      // Use defaults
    }

    console.log(`[PUSHPLASTIC] ⚙️ Options: limit=${limit}, skipExisting=${skipExisting}`);

    // Fetch Push Plastic filaments
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, product_handle, vendor, featured_image, tds_url, variant_price')
      .eq('vendor', 'Push Plastic')
      .not('product_url', 'is', null);
    
    if (skipExisting) {
      query = query.is('tds_url', null);
    }

    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch: ${fetchError.message}`);
    }

    console.log(`[PUSHPLASTIC] 📊 Found ${filaments?.length || 0} filaments to process`);

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

      console.log(`[PUSHPLASTIC] ───────────────────────────────────────────────────────`);
      console.log(`[PUSHPLASTIC] 📦 Processing: ${filament.product_title}`);

      const scrapedProduct = await scrapePushPlasticProduct(
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
      if (sanitized.imageUrl && !filament.featured_image) {
        updateData.featured_image = sanitized.imageUrl;
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
      
      updateData.last_scraped_at = new Date().toISOString();

      if (Object.keys(updateData).length > 1) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update(updateData)
          .eq('id', filament.id);

        if (updateError) {
          console.error(`[PUSHPLASTIC] ❌ Update failed: ${updateError.message}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'error', error: updateError.message });
          errors++;
        } else {
          console.log(`[PUSHPLASTIC] ✅ Updated: tds=${!!sanitized.tdsUrl}, image=${!!sanitized.imageUrl}`);
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: 'updated',
            tds: sanitized.tdsUrl as string | null,
            image: sanitized.imageUrl as string | null,
            price: sanitized.price as number | null,
          });
          updated++;
        }
      } else {
        console.log(`[PUSHPLASTIC] ⏭️ No new data`);
        results.push({ id: filament.id, title: filament.product_title, status: 'no_data' });
        skipped++;
      }

      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('[PUSHPLASTIC] ═══════════════════════════════════════════════════════');
    console.log(`[PUSHPLASTIC] ✅ COMPLETED in ${duration}s`);
    console.log(`[PUSHPLASTIC] 📊 Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
    console.log('[PUSHPLASTIC] ═══════════════════════════════════════════════════════');

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
    console.error('[PUSHPLASTIC] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

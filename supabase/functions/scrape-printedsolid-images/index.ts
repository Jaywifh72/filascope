/**
 * PRINTED SOLID IMAGE & DATA SCRAPER (Enhanced Shopify)
 * 
 * Uses Shopify JSON API for reliable product data extraction
 * Enhanced extraction for:
 * - Product images (variant-specific + product-level)
 * - Prices with sale price detection
 * - TDS URLs from description HTML and metafields
 * - MPN/SKU from variant data
 * - Weight from product/variant properties
 * - Color from variant title and product options
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

// Rate limiting - Shopify is generally fast
const RATE_LIMIT_MS = 600;
const MAX_RETRIES = 3;

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
    variant_ids?: number[];
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
    featured_image?: {
      src: string;
    };
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }>;
  options: Array<{
    name: string;
    values: string[];
  }>;
  metafields?: Array<{
    key: string;
    value: string;
    namespace: string;
  }>;
}

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
  error?: string;
  validationWarnings?: string[];
}

/**
 * Extract product handle from URL
 */
function extractHandle(url: string, storedHandle?: string): string | null {
  if (storedHandle) return storedHandle;
  const match = url.match(/\/products\/([^/?#]+)/);
  return match?.[1] || null;
}

/**
 * Find best matching variant for a specific filament title
 * Enhanced to handle color matching across multiple options
 */
function findMatchingVariant(
  product: ShopifyProduct, 
  filamentTitle: string
): ShopifyProduct['variants'][0] | null {
  const titleLower = filamentTitle.toLowerCase();
  
  // Strategy 1: Match by variant title containing color from filament title
  const { colorName } = extractColorFromTitle(filamentTitle);
  if (colorName) {
    const colorLower = colorName.toLowerCase();
    for (const variant of product.variants) {
      const variantTitle = variant.title.toLowerCase();
      if (variantTitle.includes(colorLower)) {
        return variant;
      }
      // Check option values
      if (variant.option1?.toLowerCase().includes(colorLower) ||
          variant.option2?.toLowerCase().includes(colorLower) ||
          variant.option3?.toLowerCase().includes(colorLower)) {
        return variant;
      }
    }
  }
  
  // Strategy 2: Try to match by weight in title
  const weightMatch = titleLower.match(/(\d+)\s*(?:g|kg)/);
  if (weightMatch) {
    for (const variant of product.variants) {
      if (variant.title.toLowerCase().includes(weightMatch[0])) {
        return variant;
      }
    }
  }
  
  // Strategy 3: Match default variants
  for (const variant of product.variants) {
    const variantTitle = variant.title.toLowerCase();
    if (variantTitle === 'default title' || variantTitle === 'default') {
      return variant;
    }
  }
  
  // Strategy 4: Return first available variant
  const availableVariant = product.variants.find(v => v.available);
  return availableVariant || product.variants[0] || null;
}

/**
 * Extract TDS URL from product HTML, tags, and metafields
 */
function extractTdsUrl(product: ShopifyProduct): string | null {
  const html = product.body_html || '';
  
  // Check for TDS link in description
  const tdsPatterns = [
    /href="([^"]*tds[^"]*\.pdf)"/i,
    /href="([^"]*technical[_-]?data[_-]?sheet[^"]*\.pdf)"/i,
    /href="([^"]*datasheet[^"]*\.pdf)"/i,
    /href="([^"]*_TDS_[^"]*\.pdf)"/i,
    /href="([^"]*safety[_-]?data[_-]?sheet[^"]*\.pdf)"/i,
    /href="(https?:\/\/cdn\.shopify\.com\/[^"]*\.pdf)"/i,
    /href="(https?:\/\/[^"]*\.pdf)"/i,
  ];
  
  for (const pattern of tdsPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      let url = match[1];
      if (url.startsWith('//')) url = 'https:' + url;
      if (url.startsWith('/')) url = 'https://www.printedsolid.com' + url;
      return url;
    }
  }
  
  // Check tags for TDS URL
  const tdsTag = product.tags.find(tag => 
    tag.toLowerCase().includes('tds:') || 
    tag.toLowerCase().includes('datasheet:')
  );
  if (tdsTag) {
    const urlPart = tdsTag.split(':').slice(1).join(':').trim();
    if (urlPart.startsWith('http')) {
      return urlPart;
    }
  }
  
  // Check metafields if available
  if (product.metafields) {
    const tdsMetafield = product.metafields.find(m => 
      m.key.toLowerCase().includes('tds') || 
      m.key.toLowerCase().includes('datasheet')
    );
    if (tdsMetafield?.value && tdsMetafield.value.startsWith('http')) {
      return tdsMetafield.value;
    }
  }
  
  return null;
}

/**
 * Extract weight from product variant or title
 */
function extractWeight(product: ShopifyProduct, variant: ShopifyProduct['variants'][0] | null, filamentTitle: string): number | null {
  // First check variant weight
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
  
  // Check body HTML for weight specs
  const html = product.body_html || '';
  const text = `${filamentTitle} ${html}`;
  
  const patterns = [
    /(\d+(?:\.\d+)?)\s*kg/gi,
    /(\d+(?:\.\d+)?)\s*(?:g|gram)/gi,
    /Net\s*Weight[:\s]*(\d+(?:\.\d+)?)\s*(?:g|grams?)/gi,
  ];
  
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      let weight = parseFloat(match[1]);
      if (pattern.source.includes('kg')) {
        weight = weight * 1000;
      }
      if (weight >= 100 && weight <= 5000) {
        return Math.round(weight);
      }
    }
  }
  
  // Check title for common spool sizes
  const titleLower = filamentTitle.toLowerCase();
  if (titleLower.includes('1kg') || titleLower.includes('1000g')) return 1000;
  if (titleLower.includes('500g') || titleLower.includes('0.5kg')) return 500;
  if (titleLower.includes('2kg') || titleLower.includes('2000g')) return 2000;
  if (titleLower.includes('750g') || titleLower.includes('0.75kg')) return 750;
  
  return null;
}

/**
 * Extract color from variant and product options
 */
function extractVariantColor(product: ShopifyProduct, variant: ShopifyProduct['variants'][0] | null, filamentTitle: string): { colorName: string | null; colorHex: string | null } {
  // Check variant options first
  if (variant) {
    const colorOption = product.options.find(o => 
      o.name.toLowerCase().includes('color') || 
      o.name.toLowerCase().includes('colour')
    );
    
    if (colorOption) {
      const optionIndex = product.options.indexOf(colorOption) + 1;
      const optionValue = variant[`option${optionIndex}` as keyof typeof variant] as string | null;
      if (optionValue) {
        const hex = getColorHex(optionValue);
        return { colorName: optionValue, colorHex: hex ? `#${hex}` : null };
      }
    }
    
    // Check variant title for color
    const variantTitle = variant.title;
    if (variantTitle && variantTitle !== 'Default Title') {
      const hex = getColorHex(variantTitle);
      if (hex) {
        return { colorName: variantTitle, colorHex: `#${hex}` };
      }
    }
  }
  
  // Fall back to extracting from filament title
  const { colorName, colorHex } = extractColorFromTitle(filamentTitle);
  return { colorName, colorHex: colorHex ? `#${colorHex}` : null };
}

/**
 * Scrape product data from Printed Solid Shopify store
 */
async function scrapePrintedSolidProduct(
  productUrl: string,
  productHandle: string | null,
  filamentTitle: string
): Promise<ScrapedProduct | null> {
  const handle = productHandle || extractHandle(productUrl);
  if (!handle) {
    console.log(`[PRINTEDSOLID] No handle found for: ${filamentTitle}`);
    return null;
  }
  
  const jsonUrl = `https://www.printedsolid.com/products/${handle}.json`;
  console.log(`[PRINTEDSOLID] Fetching: ${jsonUrl}`);
  
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
          console.log(`[PRINTEDSOLID] Rate limited, waiting 5s and retrying...`);
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

      // Find best matching variant
      const variant = findMatchingVariant(product, filamentTitle);
      
      // Get image - prefer variant image, then first product image
      let imageUrl: string | null = null;
      if (variant?.featured_image?.src) {
        imageUrl = variant.featured_image.src;
      } else if (product.images?.[0]?.src) {
        imageUrl = product.images[0].src;
      }
      
      // Get price
      const price = variant?.price ? parseFloat(variant.price) : null;
      
      // Extract other data using enhanced functions
      const tdsUrl = extractTdsUrl(product);
      const weight = extractWeight(product, variant, filamentTitle);
      const { colorName, colorHex } = extractVariantColor(product, variant, filamentTitle);
      const compareAtPrice = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
      
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
        source: 'printedsolid-enhanced-scraper',
      };
      
      console.log(`[PRINTEDSOLID] Extracted: image=${!!imageUrl}, price=${price}, tds=${!!tdsUrl}, weight=${weight}, color=${colorName}`);

      return scrapedProduct;
      
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.log(`[PRINTEDSOLID] Error, retrying (${retries + 1}/${MAX_RETRIES}): ${error}`);
        retries++;
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      console.error(`[PRINTEDSOLID] Failed after ${MAX_RETRIES} retries:`, error);
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
  console.log('[PRINTEDSOLID] ═══════════════════════════════════════════════════════');
  console.log('[PRINTEDSOLID] 🚀 PRINTED SOLID SCRAPER STARTED');
  console.log('[PRINTEDSOLID] ═══════════════════════════════════════════════════════');

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
    let limit = 50;
    let skipExisting = true;
    try {
      const body = await req.json();
      limit = body.limit ?? 50;
      skipExisting = body.skipExisting ?? true;
    } catch {
      // Use defaults
    }

    // Fetch Printed Solid filaments with product URLs
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, product_handle, vendor, featured_image, tds_url, variant_price')
      .eq('vendor', 'Printed Solid')
      .not('product_url', 'is', null);
    
    if (skipExisting) {
      query = query.or('featured_image.is.null,featured_image.eq.');
    }

    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`[PRINTEDSOLID] Found ${filaments?.length || 0} filaments to process (limit: ${limit})`);

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

      console.log(`[PRINTEDSOLID] ───────────────────────────────────────────────────────`);
      console.log(`[PRINTEDSOLID] Processing: ${filament.product_title}`);

      const scrapedProduct = await scrapePrintedSolidProduct(
        filament.product_url,
        filament.product_handle,
        filament.product_title
      );

      if (!scrapedProduct) {
        results.push({ id: filament.id, title: filament.product_title, status: 'error', error: 'Scrape failed' });
        errors++;
        continue;
      }

      // Validate the scraped product
      const validation = validateScrapedProduct(scrapedProduct);
      
      if (!validation.valid) {
        console.log(`[PRINTEDSOLID] ⚠️ Validation errors: ${validation.errors.join(', ')}`);
      }
      if (validation.warnings.length > 0) {
        console.log(`[PRINTEDSOLID] ⚠️ Validation warnings: ${validation.warnings.join(', ')}`);
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
      if (sanitized.barcode) {
        updateData.upc = sanitized.barcode;
      }
      
      // Always update last_scraped_at
      updateData.last_scraped_at = new Date().toISOString();

      if (Object.keys(updateData).length > 1) { // More than just last_scraped_at
        const { error: updateError } = await supabase
          .from('filaments')
          .update(updateData)
          .eq('id', filament.id);

        if (updateError) {
          console.error(`[PRINTEDSOLID] ❌ Update failed: ${updateError.message}`);
          results.push({ 
            id: filament.id, 
            title: filament.product_title, 
            status: 'error', 
            error: updateError.message 
          });
          errors++;
        } else {
          console.log(`[PRINTEDSOLID] ✅ Updated: image=${!!sanitized.imageUrl}, tds=${!!sanitized.tdsUrl}, price=${sanitized.price}`);
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
        console.log(`[PRINTEDSOLID] ⏭️ No new data extracted`);
        results.push({ id: filament.id, title: filament.product_title, status: 'no_data' });
        skipped++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('[PRINTEDSOLID] ═══════════════════════════════════════════════════════');
    console.log(`[PRINTEDSOLID] ✅ COMPLETED in ${duration}s`);
    console.log(`[PRINTEDSOLID] Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
    console.log('[PRINTEDSOLID] ═══════════════════════════════════════════════════════');

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
    console.error('[PRINTEDSOLID] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

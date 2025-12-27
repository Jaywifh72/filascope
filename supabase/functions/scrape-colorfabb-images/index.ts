/**
 * COLORFABB IMAGE & DATA SCRAPER
 * 
 * Uses Firecrawl for web scraping (ColorFabb is on Magento, not Shopify)
 * Extracts: featured_image, tds_url, variant_price, color_hex
 * 
 * Compliant with shared ScrapedProduct schema and validation
 */
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
const RATE_LIMIT_MS = 800;

interface ScrapeResult {
  id: string;
  title: string;
  status: 'updated' | 'skipped' | 'error' | 'no_data';
  image?: string | null;
  tds?: string | null;
  price?: number | null;
  error?: string;
}

/**
 * Scrape product data from ColorFabb website using Firecrawl
 */
async function scrapeColorfabbProduct(
  productUrl: string,
  filamentTitle: string,
  firecrawlKey: string
): Promise<ScrapedProduct | null> {
  console.log(`[COLORFABB] Scraping: ${productUrl}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['html', 'markdown'],
        onlyMainContent: false,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.error(`[COLORFABB] Firecrawl error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const html = data.data?.html || '';
    const markdown = data.data?.markdown || '';

    // === Extract Image URL ===
    let imageUrl: string | null = null;
    
    // Strategy 1: OpenGraph image
    const ogMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    if (ogMatch?.[1]) {
      imageUrl = ogMatch[1];
    }
    
    // Strategy 2: Product gallery image
    if (!imageUrl) {
      const galleryMatch = html.match(/<img[^>]*class="[^"]*gallery[^"]*"[^>]*src="([^"]+)"/i);
      if (galleryMatch?.[1]) {
        imageUrl = galleryMatch[1];
      }
    }
    
    // Strategy 3: Data-zoom or data-large image
    if (!imageUrl) {
      const zoomMatch = html.match(/<img[^>]*data-(?:zoom|large)-image="([^"]+)"/i);
      if (zoomMatch?.[1]) {
        imageUrl = zoomMatch[1];
      }
    }
    
    // Strategy 4: Main product image
    if (!imageUrl) {
      const productImgMatch = html.match(/src="(https:\/\/[^"]*colorfabb[^"]*\/(?:media|pub)[^"]*\.(?:jpg|jpeg|png|webp))"/i);
      if (productImgMatch?.[1]) {
        imageUrl = productImgMatch[1];
      }
    }
    
    // Clean up image URL
    if (imageUrl) {
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      } else if (imageUrl.startsWith('/')) {
        imageUrl = 'https://colorfabb.com' + imageUrl;
      }
    }

    // === Extract TDS URL ===
    let tdsUrl: string | null = null;
    const tdsPatterns = [
      /href="([^"]*tds[^"]*\.pdf)"/i,
      /href="([^"]*technical[_-]?data[^"]*\.pdf)"/i,
      /href="([^"]*datasheet[^"]*\.pdf)"/i,
    ];
    
    for (const pattern of tdsPatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        let url = match[1];
        if (url.startsWith('//')) url = 'https:' + url;
        else if (url.startsWith('/')) url = 'https://colorfabb.com' + url;
        tdsUrl = url;
        break;
      }
    }

    // === Extract Price ===
    let price: number | null = null;
    const pricePatterns = [
      /€\s*(\d+[.,]\d{2})/,
      /price[^>]*>.*?(\d+[.,]\d{2})/i,
      /"price":\s*"?(\d+\.?\d*)"?/,
    ];
    
    for (const pattern of pricePatterns) {
      const match = (html + markdown).match(pattern);
      if (match?.[1]) {
        price = parseFloat(match[1].replace(',', '.'));
        if (price > 0 && price < 500) break;
        price = null;
      }
    }

    // === Extract Color ===
    const { colorName, colorHex } = extractColorFromTitle(filamentTitle);

    // === Extract Weight ===
    let weight: number | null = null;
    if (filamentTitle.toLowerCase().includes('750g')) weight = 750;
    else if (filamentTitle.toLowerCase().includes('650g')) weight = 650;
    else if (filamentTitle.toLowerCase().includes('1kg') || filamentTitle.toLowerCase().includes('1000g')) weight = 1000;
    else if (filamentTitle.toLowerCase().includes('2.2kg') || filamentTitle.toLowerCase().includes('2200g')) weight = 2200;
    else if (filamentTitle.toLowerCase().includes('500g')) weight = 500;

    // Generate product ID from URL
    const urlParts = productUrl.split('/');
    const productId = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || productUrl;

    const scrapedProduct: ScrapedProduct = {
      productId,
      title: filamentTitle,
      price,
      url: productUrl,
      imageUrl,
      tdsUrl,
      netWeightG: weight,
      colorName,
      colorHex: colorHex ? `#${colorHex}` : null,
      colorFamily: colorName ? getColorFamily(colorName) : null,
      available: true,
      currency: 'EUR',
      scrapedAt: new Date(),
      source: 'colorfabb-scraper',
    };

    return scrapedProduct;
    
  } catch (error) {
    console.error(`[COLORFABB] Error scraping ${productUrl}:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[COLORFABB] ═══════════════════════════════════════════════════════');
  console.log('[COLORFABB] 🚀 COLORFABB SCRAPER STARTED');
  console.log('[COLORFABB] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData } = await authClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Fetch ColorFabb filaments
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, featured_image, tds_url, variant_price')
      .ilike('vendor', '%colorfabb%')
      .not('product_url', 'is', null);
    
    if (skipExisting) {
      query = query.or('featured_image.is.null,featured_image.eq.');
    }

    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`[COLORFABB] Found ${filaments?.length || 0} filaments to process (limit: ${limit})`);

    const results: ScrapeResult[] = [];
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const filament of filaments || []) {
      if (!filament.product_url || !filament.product_url.startsWith('http')) {
        results.push({ id: filament.id, title: filament.product_title, status: 'skipped', error: 'Invalid URL' });
        skipped++;
        continue;
      }

      console.log(`[COLORFABB] Processing: ${filament.product_title}`);

      const scrapedProduct = await scrapeColorfabbProduct(
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
        console.log(`[COLORFABB] ⚠️ Validation errors: ${validation.errors.join(', ')}`);
      }

      // Sanitize the product data
      const sanitized = sanitizeScrapedProduct(scrapedProduct as unknown as Record<string, unknown>);

      // Build update payload
      const updateData: Record<string, unknown> = {};
      
      if (sanitized.imageUrl && !filament.featured_image) {
        updateData.featured_image = sanitized.imageUrl;
      }
      if (sanitized.tdsUrl && !filament.tds_url) {
        updateData.tds_url = sanitized.tdsUrl;
      }
      if (sanitized.price && !filament.variant_price) {
        updateData.variant_price = sanitized.price;
        updateData.price_eur = sanitized.price; // ColorFabb prices are in EUR
      }
      if (sanitized.netWeightG) {
        updateData.net_weight_g = sanitized.netWeightG;
      }
      if (sanitized.colorHex) {
        updateData.color_hex = sanitized.colorHex;
      }
      
      updateData.last_scraped_at = new Date().toISOString();

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
            image: sanitized.imageUrl as string | null,
            tds: sanitized.tdsUrl as string | null,
            price: sanitized.price as number | null,
          });
          updated++;
          console.log(`[COLORFABB] ✅ Updated: ${filament.product_title}`);
        }
      } else {
        results.push({ id: filament.id, title: filament.product_title, status: 'no_data' });
        skipped++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('[COLORFABB] ═══════════════════════════════════════════════════════');
    console.log(`[COLORFABB] ✅ COMPLETED in ${duration}s`);
    console.log(`[COLORFABB] Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
    console.log('[COLORFABB] ═══════════════════════════════════════════════════════');

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
    console.error('[COLORFABB] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

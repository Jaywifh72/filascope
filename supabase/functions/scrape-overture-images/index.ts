/**
 * OVERTURE IMAGE & DATA SCRAPER
 * 
 * Uses Shopify JSON API for reliable product data extraction
 * Extracts: featured_image, variant_price, tds_url, mpn, color_hex
 * 
 * Compliant with shared ScrapedProduct schema and validation
 */
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  validateScrapedProduct, 
  sanitizeScrapedProduct,
  type ScrapedProduct 
} from "../_shared/scraper-validation.ts";
import { getColorHex, getColorFamily, extractColorFromTitle } from "../_shared/color-mapping.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting
const RATE_LIMIT_MS = 300;

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
  }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string;
    barcode: string | null;
    available: boolean;
  }>;
}

interface ScrapeResult {
  id: string;
  title: string;
  status: 'updated' | 'skipped' | 'error' | 'no_data';
  image?: string | null;
  price?: number | null;
  error?: string;
}

/**
 * Extract TDS URL from product HTML/description
 */
function extractTdsUrl(bodyHtml: string): string | null {
  const patterns = [
    /href="([^"]*tds[^"]*\.pdf)"/i,
    /href="([^"]*technical[_-]?data[^"]*\.pdf)"/i,
    /href="([^"]*datasheet[^"]*\.pdf)"/i,
  ];
  
  for (const pattern of patterns) {
    const match = bodyHtml.match(pattern);
    if (match?.[1]) {
      const url = match[1];
      if (url.startsWith('http')) return url;
      if (url.startsWith('//')) return 'https:' + url;
      return 'https://overture3d.com' + url;
    }
  }
  
  return null;
}

/**
 * Extract weight from product title or description
 */
function extractWeight(title: string, bodyHtml: string): number | null {
  const text = `${title} ${bodyHtml}`;
  
  if (text.toLowerCase().includes('1kg') || text.includes('1000g')) return 1000;
  if (text.toLowerCase().includes('2kg') || text.includes('2000g')) return 2000;
  if (text.toLowerCase().includes('500g') || text.includes('0.5kg')) return 500;
  if (text.toLowerCase().includes('250g')) return 250;
  
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|g)/i);
  if (match) {
    const value = parseFloat(match[1]);
    if (text.toLowerCase().includes('kg') && value < 10) return value * 1000;
    if (value >= 100 && value <= 5000) return Math.round(value);
  }
  
  return 1000; // Default to 1kg for Overture products
}

/**
 * Scrape product data from Overture Shopify store
 */
async function scrapeOvertureProduct(
  productUrl: string,
  filamentTitle: string
): Promise<ScrapedProduct | null> {
  // Extract handle from URL
  const urlMatch = productUrl.match(/\/products\/([^/?#]+)/);
  if (!urlMatch) {
    console.log(`[OVERTURE] Invalid URL format: ${productUrl}`);
    return null;
  }
  
  const handle = urlMatch[1];
  const jsonUrl = `https://overture3d.com/products/${handle}.json`;
  
  console.log(`[OVERTURE] Fetching: ${jsonUrl}`);
  
  try {
    const response = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FilaScopeBot/1.0)",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.log(`[OVERTURE] HTTP ${response.status} for ${handle}`);
      return null;
    }

    const data = await response.json();
    const product: ShopifyProduct = data.product;
    
    if (!product) {
      console.log(`[OVERTURE] No product data for ${handle}`);
      return null;
    }

    // Get image - first product image, cleaned up
    let imageUrl: string | null = null;
    if (product.images?.[0]?.src) {
      imageUrl = product.images[0].src.split("?")[0]; // Remove size params
    }
    
    // Get variant data (first available or first)
    const variant = product.variants?.find(v => v.available) || product.variants?.[0];
    const price = variant?.price ? parseFloat(variant.price) : null;
    
    // Extract other data
    const tdsUrl = extractTdsUrl(product.body_html || '');
    const weight = extractWeight(filamentTitle, product.body_html || '');
    const { colorName, colorHex } = extractColorFromTitle(filamentTitle);
    
    const scrapedProduct: ScrapedProduct = {
      productId: String(product.id),
      title: filamentTitle,
      price: price && price > 0 && price < 500 ? price : null,
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
      source: 'overture-scraper',
    };

    return scrapedProduct;
    
  } catch (error) {
    console.error(`[OVERTURE] Error scraping ${handle}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[OVERTURE] ═══════════════════════════════════════════════════════');
  console.log('[OVERTURE] 🚀 OVERTURE SCRAPER STARTED');
  console.log('[OVERTURE] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await authClient.rpc("has_role", { _role: "admin", _user_id: user.id });
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse options
    let limit = 100;
    let skipExisting = true;
    try {
      const body = await req.json();
      limit = body.limit ?? 100;
      skipExisting = body.skipExisting ?? true;
    } catch {
      // Use defaults
    }

    // Fetch Overture filaments
    let query = supabase
      .from("filaments")
      .select("id, product_title, product_url, featured_image, variant_price, tds_url")
      .ilike("vendor", "%overture%")
      .not("product_url", "is", null);
    
    if (skipExisting) {
      query = query.or('featured_image.is.null,featured_image.eq.');
    }

    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`[OVERTURE] Found ${filaments?.length || 0} filaments to process (limit: ${limit})`);

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

      console.log(`[OVERTURE] Processing: ${filament.product_title}`);

      const scrapedProduct = await scrapeOvertureProduct(filament.product_url, filament.product_title);

      if (!scrapedProduct) {
        results.push({ id: filament.id, title: filament.product_title, status: 'error', error: 'Scrape failed' });
        errors++;
        continue;
      }

      // Validate the scraped product
      const validation = validateScrapedProduct(scrapedProduct);
      
      if (!validation.valid) {
        console.log(`[OVERTURE] ⚠️ Validation errors: ${validation.errors.join(', ')}`);
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
      
      updateData.last_scraped_at = new Date().toISOString();

      if (Object.keys(updateData).length > 1) {
        const { error: updateError } = await supabase
          .from("filaments")
          .update(updateData)
          .eq("id", filament.id);

        if (updateError) {
          results.push({ id: filament.id, title: filament.product_title, status: 'error', error: updateError.message });
          errors++;
        } else {
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: 'updated',
            image: sanitized.imageUrl as string | null,
            price: sanitized.price as number | null,
          });
          updated++;
          console.log(`[OVERTURE] ✅ Updated: ${filament.product_title}`);
        }
      } else {
        results.push({ id: filament.id, title: filament.product_title, status: 'no_data' });
        skipped++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('[OVERTURE] ═══════════════════════════════════════════════════════');
    console.log(`[OVERTURE] ✅ COMPLETED in ${duration}s`);
    console.log(`[OVERTURE] Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
    console.log('[OVERTURE] ═══════════════════════════════════════════════════════');

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        updated,
        skipped,
        errors,
        duration,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[OVERTURE] ❌ Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

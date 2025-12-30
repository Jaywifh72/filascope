/**
 * Prusament Full Sync Pipeline
 * 
 * 5-step sync process for Prusament filaments:
 * 1. Fetch products via Firecrawl (category scrape)
 * 2. Process product variants
 * 3. Upsert with brand-specific enrichments
 * 4. Fix TDS URLs
 * 5. Fix duplicate hex codes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichPrusamentProduct,
  isPrusamentFilamentProduct,
  extractPrusamentWeight,
  extractPrusamentDiameter,
  getPrusamentTdsUrl,
  generatePrusamentProductLineId,
  normalizePrusamentMaterial,
} from '../_shared/prusament-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedProduct {
  url: string;
  title: string;
  price: number | null;
  compareAtPrice: number | null;
  imageUrl: string | null;
  available: boolean;
  material?: string;
  colorHex?: string;
  sku?: string;
}

interface SyncResult {
  step: string;
  success: boolean;
  count?: number;
  details?: string;
  error?: string;
}

// ============================================================================
// STEP 1: FETCH PRODUCTS VIA FIRECRAWL
// ============================================================================

async function fetchPrusamentProducts(): Promise<ScrapedProduct[]> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const products: ScrapedProduct[] = [];
  const categoryUrl = 'https://www.prusa3d.com/category/prusament/';
  
  console.log(`[Step 1] Scraping Prusament category: ${categoryUrl}`);

  try {
    // Use Firecrawl to scrape the category page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: categoryUrl,
        formats: ['html', 'links'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const html = data.data?.html || data.html || '';
    const links = data.data?.links || data.links || [];

    console.log(`[Step 1] Found ${links.length} links on category page`);

    // Extract product URLs (Prusament product pages)
    const productUrls = links.filter((link: string) => 
      link.includes('/product/prusament-') && 
      !link.includes('#') &&
      !link.includes('?')
    );

    const uniqueProductUrls = [...new Set(productUrls)] as string[];
    console.log(`[Step 1] Found ${uniqueProductUrls.length} unique product URLs`);

    // Scrape each product page (batch in groups of 5)
    const batchSize = 5;
    for (let i = 0; i < uniqueProductUrls.length; i += batchSize) {
      const batch = uniqueProductUrls.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (productUrl) => {
        try {
          const productResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: productUrl,
              formats: ['markdown', 'html'],
              onlyMainContent: true,
              waitFor: 2000,
            }),
          });

          if (!productResponse.ok) {
            console.error(`Failed to scrape ${productUrl}: ${productResponse.status}`);
            return null;
          }

          const productData = await productResponse.json();
          const productHtml = productData.data?.html || productData.html || '';
          const productMarkdown = productData.data?.markdown || productData.markdown || '';
          const metadata = productData.data?.metadata || productData.metadata || {};

          // Extract product details from HTML/markdown
          const product = parseProductPage(productUrl, productHtml, productMarkdown, metadata);
          
          if (product && isPrusamentFilamentProduct(product.title)) {
            return product;
          }
          return null;
        } catch (err) {
          console.error(`Error scraping ${productUrl}:`, err);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      products.push(...batchResults.filter((p): p is ScrapedProduct => p !== null));
      
      // Rate limiting between batches
      if (i + batchSize < uniqueProductUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

  } catch (error) {
    console.error('[Step 1] Error fetching products:', error);
    throw error;
  }

  console.log(`[Step 1] Scraped ${products.length} filament products`);
  return products;
}

function parseProductPage(
  url: string, 
  html: string, 
  markdown: string,
  metadata: Record<string, unknown>
): ScrapedProduct | null {
  try {
    // Extract title from metadata or HTML
    let title = (metadata.title as string) || '';
    if (!title) {
      const titleMatch = html.match(/<h1[^>]*class="[^"]*product[^"]*title[^"]*"[^>]*>([^<]+)</i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }
    
    // Clean up title
    title = title.replace(/\s*[–-]\s*Prusa.*$/i, '').trim();
    title = title.replace(/\s*\|\s*Prusa.*$/i, '').trim();
    
    if (!title || title.length < 5) {
      return null;
    }

    // Extract price from HTML
    let price: number | null = null;
    let compareAtPrice: number | null = null;
    
    // Look for price patterns
    const priceMatch = html.match(/class="[^"]*price[^"]*"[^>]*>[\s\S]*?(\d+(?:[.,]\d{2})?)\s*(?:€|\$|EUR|USD)/i);
    if (priceMatch) {
      price = parseFloat(priceMatch[1].replace(',', '.'));
    }
    
    // Fallback: look in markdown for price
    if (!price) {
      const mdPriceMatch = markdown.match(/(\d+(?:[.,]\d{2})?)\s*(?:€|\$|EUR|USD)/);
      if (mdPriceMatch) {
        price = parseFloat(mdPriceMatch[1].replace(',', '.'));
      }
    }

    // Extract image URL
    let imageUrl: string | null = (metadata.ogImage as string) || null;
    if (!imageUrl) {
      const imgMatch = html.match(/<img[^>]+class="[^"]*product[^"]*image[^"]*"[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }

    // Extract SKU if available
    let sku: string | null = null;
    const skuMatch = html.match(/data-sku="([^"]+)"/i) || html.match(/sku["\s:]+([A-Z0-9-]+)/i);
    if (skuMatch) {
      sku = skuMatch[1];
    }

    // Check availability
    const available = !html.toLowerCase().includes('out of stock') && 
                      !html.toLowerCase().includes('sold out');

    // Extract color hex if present
    let colorHex: string | null = null;
    const hexMatch = html.match(/#([A-Fa-f0-9]{6})\b/);
    if (hexMatch) {
      colorHex = `#${hexMatch[1].toUpperCase()}`;
    }

    return {
      url,
      title,
      price,
      compareAtPrice,
      imageUrl,
      available,
      sku: sku || undefined,
      colorHex: colorHex || undefined,
    };
  } catch (error) {
    console.error(`Error parsing product page ${url}:`, error);
    return null;
  }
}

// ============================================================================
// STEP 2: PROCESS PRODUCT VARIANTS
// ============================================================================

interface ProcessedVariant {
  productId: string;
  title: string;
  material: string;
  color: string;
  weight: number | null;
  diameter: number;
  price: number | null;
  compareAtPrice: number | null;
  imageUrl: string | null;
  productUrl: string;
  available: boolean;
  sku: string | null;
  colorHex: string | null;
  isRefill: boolean;
  isNfc: boolean;
}

function processVariants(products: ScrapedProduct[]): ProcessedVariant[] {
  console.log(`[Step 2] Processing ${products.length} products into variants`);
  
  const variants: ProcessedVariant[] = [];
  
  for (const product of products) {
    const titleLower = product.title.toLowerCase();
    
    // Extract material from title
    const material = normalizePrusamentMaterial(product.title, product.material);
    
    // Extract color (usually after material name)
    let color = extractColorFromTitle(product.title, material);
    
    // Generate unique product ID from URL slug
    const urlSlug = product.url.split('/').pop()?.replace(/[^a-z0-9-]/gi, '-') || 
                    `prusament-${Date.now()}`;
    const productId = `prusament-${urlSlug}`;
    
    const weight = extractPrusamentWeight(product.title);
    const diameter = extractPrusamentDiameter(product.title);
    const isRefill = titleLower.includes('refill');
    const isNfc = titleLower.includes('nfc');
    
    variants.push({
      productId,
      title: product.title,
      material,
      color,
      weight,
      diameter,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      imageUrl: product.imageUrl,
      productUrl: product.url,
      available: product.available,
      sku: product.sku || null,
      colorHex: product.colorHex || null,
      isRefill,
      isNfc,
    });
  }
  
  console.log(`[Step 2] Created ${variants.length} variants`);
  return variants;
}

function extractColorFromTitle(title: string, material: string): string {
  // Remove common prefixes and material names
  let cleaned = title
    .replace(/Prusament\s*/gi, '')
    .replace(new RegExp(material.replace(/[^a-z0-9]/gi, '\\s*'), 'gi'), '')
    .replace(/Premium\s*/gi, '')
    .replace(/Blend\s*/gi, '')
    .replace(/\s*\(?\d+\s*(?:g|kg)\)?/gi, '')
    .replace(/\s*\(NFC\)/gi, '')
    .replace(/\s*Refill/gi, '')
    .replace(/\s*1\.75\s*mm?/gi, '')
    .replace(/\s*2\.85\s*mm?/gi, '')
    .trim();
  
  // If still too long, try to extract just the color name
  if (cleaned.length > 50) {
    // Common Prusament color patterns
    const colorPatterns = [
      /Galaxy\s+\w+/i,
      /Mystic\s+\w+/i,
      /Opal\s+\w+/i,
      /Viva\s+La\s+\w+/i,
      /Royal\s+\w+/i,
      /Neon\s+\w+/i,
      /Prusa\s+\w+/i,
    ];
    
    for (const pattern of colorPatterns) {
      const match = title.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
  }
  
  return cleaned || 'Standard';
}

// ============================================================================
// STEP 3: UPSERT WITH ENRICHMENTS
// ============================================================================

async function upsertVariants(
  supabase: any,
  variants: ProcessedVariant[],
  brandId: string | null
): Promise<{ created: number; updated: number; errors: number }> {
  console.log(`[Step 3] Upserting ${variants.length} variants with enrichments`);
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const variant of variants) {
    try {
      const enrichment = enrichPrusamentProduct(
        variant.title,
        variant.material,
        variant.colorHex
      );
      
      const filamentData: Record<string, unknown> = {
        product_id: variant.productId,
        product_title: variant.title,
        vendor: 'Prusament',
        brand_id: brandId,
        material: enrichment.material,
        finish_type: enrichment.finishType,
        product_line_id: enrichment.productLineId,
        color_hex: enrichment.colorHex || variant.colorHex,
        variant_price: variant.price,
        variant_compare_at_price: variant.compareAtPrice,
        variant_available: variant.available,
        product_url: variant.productUrl,
        featured_image: variant.imageUrl,
        variant_sku: variant.sku,
        tds_url: enrichment.tdsUrl,
        nozzle_temp_min_c: enrichment.printSettings.nozzleTempMin,
        nozzle_temp_max_c: enrichment.printSettings.nozzleTempMax,
        bed_temp_min_c: enrichment.printSettings.bedTempMin,
        bed_temp_max_c: enrichment.printSettings.bedTempMax,
        fan_min_percent: enrichment.printSettings.fanMin,
        fan_max_percent: enrichment.printSettings.fanMax,
        print_speed_max_mms: enrichment.printSettings.printSpeedMax,
        drying_temp_c: enrichment.printSettings.dryingTemp,
        drying_time_hours: enrichment.printSettings.dryingTime,
        is_nozzle_abrasive: enrichment.isAbrasive,
        net_weight_g: variant.weight,
        diameter_nominal_mm: variant.diameter,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
      
      const { data: existing } = await supabase
        .from('filaments')
        .select('id')
        .eq('product_id', variant.productId)
        .eq('vendor', 'Prusament')
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('filaments')
          .update(filamentData)
          .eq('id', existing.id);
        if (error) throw error;
        updated++;
      } else {
        const { error } = await supabase
          .from('filaments')
          .insert(filamentData);
        if (error) throw error;
        created++;
      }
    } catch (error) {
      console.error(`Error upserting variant ${variant.productId}:`, error);
      errors++;
    }
  }
  
  console.log(`[Step 3] Created: ${created}, Updated: ${updated}, Errors: ${errors}`);
  return { created, updated, errors };
}

// ============================================================================
// STEP 4: VALIDATE TDS URLs
// ============================================================================

async function validateTdsUrls(supabase: any): Promise<{ validated: number; fixed: number }> {
  console.log('[Step 4] Validating TDS URLs');
  
  const { data: products, error } = await supabase
    .from('filaments')
    .select('id, product_line_id, tds_url')
    .ilike('vendor', 'prusament');
  
  if (error) {
    console.error('[Step 4] Error fetching products:', error);
    return { validated: 0, fixed: 0 };
  }
  
  let validated = 0;
  let fixed = 0;
  
  for (const product of (products || []) as any[]) {
    if (product.tds_url && product.tds_url.includes('prusament.com/media/datasheet/')) {
      validated++;
    } else if (product.product_line_id) {
      const parts = product.product_line_id.split('__');
      if (parts.length >= 2) {
        const materialSlug = parts[1];
        const correctTdsUrl = getPrusamentTdsUrl(materialSlug);
        await supabase.from('filaments').update({ tds_url: correctTdsUrl }).eq('id', product.id);
        fixed++;
      }
    }
  }
  
  console.log(`[Step 4] Validated: ${validated}, Fixed: ${fixed}`);
  return { validated, fixed };
}

async function fixDuplicateHexCodes(supabase: any): Promise<{ checked: number; fixed: number }> {
  console.log('[Step 5] Checking for duplicate hex codes');
  
  const { data: duplicates, error } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'Prusament' });
  
  if (error) {
    console.error('[Step 5] Error finding duplicates:', error);
    return { checked: 0, fixed: 0 };
  }
  
  const dupeList = (duplicates || []) as any[];
  const checked = dupeList.length;
  let fixed = 0;
  
  const groups = new Map<string, any[]>();
  for (const dup of dupeList) {
    const key = `${dup.product_line_id}-${dup.color_hex?.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(dup);
  }
  
  for (const [, group] of groups) {
    if (group.length <= 1) continue;
    for (let i = 1; i < group.length; i++) {
      const item = group[i];
      if (!item.color_hex) continue;
      const hex = item.color_hex.toUpperCase();
      const lastChar = hex.charAt(hex.length - 1);
      const newLastChar = String.fromCharCode(((lastChar.charCodeAt(0) - 48 + i) % 16) + 48).replace(/[^0-9A-F]/i, 'A');
      const newHex = hex.slice(0, -1) + newLastChar;
      await supabase.from('filaments').update({ color_hex: newHex }).eq('id', item.id);
      fixed++;
    }
  }
  
  console.log(`[Step 5] Checked: ${checked}, Fixed: ${fixed}`);
  return { checked, fixed };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results: SyncResult[] = [];

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'prusament')
      .maybeSingle();

    const brandId = brand?.id || null;
    console.log(`Brand ID: ${brandId}`);

    // Parse options from request body
    let options = {
      skipFetch: false,
      skipEnrich: false,
      cleanSlate: false,
    };
    
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Clean slate if requested
    if (options.cleanSlate) {
      console.log('[Pre-Step] Deleting existing Prusament filaments...');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'prusament');
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
      } else {
        console.log('Deleted existing Prusament filaments');
      }
    }

    // Step 1: Fetch products
    let products: ScrapedProduct[] = [];
    if (!options.skipFetch) {
      try {
        products = await fetchPrusamentProducts();
        results.push({
          step: '1. Fetch Products',
          success: true,
          count: products.length,
          details: `Scraped ${products.length} filament products from Prusa website`,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.push({
          step: '1. Fetch Products',
          success: false,
          error: errorMsg,
        });
        throw error;
      }
    } else {
      results.push({
        step: '1. Fetch Products',
        success: true,
        details: 'Skipped (skipFetch=true)',
      });
    }

    // Step 2: Process variants
    let variants: ProcessedVariant[] = [];
    if (products.length > 0) {
      variants = processVariants(products);
      results.push({
        step: '2. Process Variants',
        success: true,
        count: variants.length,
        details: `Created ${variants.length} variants from ${products.length} products`,
      });
    }

    // Step 3: Upsert with enrichments
    if (variants.length > 0 && !options.skipEnrich) {
      const upsertResult = await upsertVariants(supabase, variants, brandId);
      results.push({
        step: '3. Upsert with Enrichments',
        success: upsertResult.errors === 0,
        count: upsertResult.created + upsertResult.updated,
        details: `Created: ${upsertResult.created}, Updated: ${upsertResult.updated}, Errors: ${upsertResult.errors}`,
      });
    }

    // Step 4: Validate TDS URLs
    const tdsResult = await validateTdsUrls(supabase);
    results.push({
      step: '4. Validate TDS URLs',
      success: true,
      count: tdsResult.validated + tdsResult.fixed,
      details: `Validated: ${tdsResult.validated}, Fixed: ${tdsResult.fixed}`,
    });

    // Step 5: Fix duplicate hex codes
    const hexResult = await fixDuplicateHexCodes(supabase);
    results.push({
      step: '5. Fix Duplicate Hex Codes',
      success: true,
      count: hexResult.fixed,
      details: `Checked: ${hexResult.checked}, Fixed: ${hexResult.fixed}`,
    });

    // Get final stats
    const { count: totalProducts } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', 'prusament');

    const { count: withProductLine } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', 'prusament')
      .not('product_line_id', 'is', null);

    const { count: withTds } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .ilike('vendor', 'prusament')
      .not('tds_url', 'is', null);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n=== Prusament Sync Complete ===`);
    console.log(`Total products: ${totalProducts}`);
    console.log(`With product_line_id: ${withProductLine}`);
    console.log(`With TDS URL: ${withTds}`);
    console.log(`Duration: ${duration}s`);

    return new Response(
      JSON.stringify({
        success: true,
        vendor: 'Prusament',
        results,
        stats: {
          totalProducts,
          withProductLine,
          withTds,
          productLinePercent: totalProducts ? Math.round((withProductLine || 0) / totalProducts * 100) : 0,
          tdsPercent: totalProducts ? Math.round((withTds || 0) / totalProducts * 100) : 0,
        },
        duration: `${duration}s`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Fatal error:', errorMsg);
    
    return new Response(
      JSON.stringify({
        success: false,
        vendor: 'Prusament',
        results,
        error: errorMsg,
        duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

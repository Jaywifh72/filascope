/**
 * TreeD Filaments Sync Pipeline
 * 
 * 5-step sync using Firecrawl for HTML scraping:
 * 1. Fetch product list from shop page
 * 2. Scrape individual product details
 * 3. Upsert with brand-specific enrichments
 * 4. Discover TDS URLs
 * 5. Fix duplicate hex codes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichTreeDProduct,
  getTreeDColorHex,
  constructTreeDTdsUrl,
  isTreeDFilament,
  extractTreeDWeight,
  extractTreeDDiameter,
} from '../_shared/treed-defaults.ts';

// ============================================================================
// TYPES
// ============================================================================

interface ScrapedProduct {
  sku: string;
  title: string;
  polymer: string;
  price: number | null;
  imageUrl: string | null;
  productUrl: string;
  colors: string[];
  weights: number[];
  diameters: number[];
  description: string | null;
}

interface ProductVariant {
  productId: string;
  title: string;
  color: string | null;
  weight: number | null;
  diameter: number | null;
  price: number | null;
  imageUrl: string | null;
  productUrl: string;
  sku: string;
  polymer: string;
  description: string | null;
}

interface SyncResult {
  step: string;
  success: boolean;
  count?: number;
  created?: number;
  updated?: number;
  errors?: number;
  message?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VENDOR_NAME = 'TreeD';
const SHOP_URL = 'https://treedfilaments.com/shop';
const PRODUCT_BASE_URL = 'https://treedfilaments.com/shop/product/?sku=';

// ============================================================================
// STEP 1: FETCH PRODUCTS FROM SHOP PAGE
// ============================================================================

async function fetchProductList(firecrawlApiKey: string): Promise<ScrapedProduct[]> {
  console.log('Step 1: Fetching product list from TreeD shop...');
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: SHOP_URL,
      formats: ['markdown', 'html'],
      onlyMainContent: false,
      waitFor: 3000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Firecrawl error:', error);
    throw new Error(`Failed to scrape shop page: ${response.status}`);
  }

  const data = await response.json();
  const html = data.data?.html || data.html || '';
  const markdown = data.data?.markdown || data.markdown || '';
  
  console.log('Received shop page, parsing products...');
  
  // Parse products from the shop page
  const products: ScrapedProduct[] = [];
  
  // Extract product links and info from HTML
  // TreeD uses SKU-based URLs like /shop/product/?sku=ECOSIL1.75750N
  const productMatches = html.matchAll(/href="[^"]*\/shop\/product\/\?sku=([^"&]+)"/gi);
  const skus = new Set<string>();
  
  for (const match of productMatches) {
    skus.add(match[1]);
  }
  
  console.log(`Found ${skus.size} unique SKUs on shop page`);
  
  // For each SKU, create a basic product entry (details will be scraped in step 2)
  for (const sku of skus) {
    products.push({
      sku,
      title: sku, // Will be updated in step 2
      polymer: '',
      price: null,
      imageUrl: null,
      productUrl: `${PRODUCT_BASE_URL}${sku}`,
      colors: [],
      weights: [],
      diameters: [],
      description: null,
    });
  }
  
  console.log(`Step 1 complete: Found ${products.length} products`);
  return products;
}

// ============================================================================
// STEP 2: SCRAPE INDIVIDUAL PRODUCT DETAILS
// ============================================================================

async function scrapeProductDetails(
  products: ScrapedProduct[],
  firecrawlApiKey: string,
  maxProducts: number = 100
): Promise<ScrapedProduct[]> {
  console.log(`Step 2: Scraping details for ${Math.min(products.length, maxProducts)} products...`);
  
  const enrichedProducts: ScrapedProduct[] = [];
  const batchSize = 5; // Scrape 5 at a time to avoid rate limits
  
  const productsToScrape = products.slice(0, maxProducts);
  
  for (let i = 0; i < productsToScrape.length; i += batchSize) {
    const batch = productsToScrape.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (product) => {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: product.productUrl,
            formats: ['markdown', 'html'],
            onlyMainContent: true,
            waitFor: 2000,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to scrape ${product.sku}: ${response.status}`);
          return null;
        }

        const data = await response.json();
        const html = data.data?.html || data.html || '';
        const markdown = data.data?.markdown || data.markdown || '';
        
        // Parse product details from HTML/markdown
        const enriched = parseProductDetails(product, html, markdown);
        return enriched;
      } catch (error) {
        console.error(`Error scraping ${product.sku}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(batchPromises);
    enrichedProducts.push(...results.filter((p): p is ScrapedProduct => p !== null));
    
    // Rate limiting delay between batches
    if (i + batchSize < productsToScrape.length) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  console.log(`Step 2 complete: Scraped ${enrichedProducts.length} products with details`);
  return enrichedProducts;
}

function parseProductDetails(product: ScrapedProduct, html: string, markdown: string): ScrapedProduct {
  const enriched = { ...product };
  
  // Extract title from h1 or product-title class
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                     html.match(/class="[^"]*product-title[^"]*"[^>]*>([^<]+)</i) ||
                     markdown.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    enriched.title = titleMatch[1].trim();
  }
  
  // Extract polymer/material from product info
  const polymerMatch = html.match(/polymer[:\s]*([^<]+)/i) ||
                       markdown.match(/polymer[:\s]*(.+)/i);
  if (polymerMatch) {
    enriched.polymer = polymerMatch[1].trim();
  }
  
  // Extract price (EUR)
  const priceMatch = html.match(/€\s*([\d,.]+)/i) ||
                     html.match(/(\d+[,.]\d{2})\s*€/i) ||
                     markdown.match(/€\s*([\d,.]+)/i);
  if (priceMatch) {
    enriched.price = parseFloat(priceMatch[1].replace(',', '.'));
  }
  
  // Extract image URL
  const imgMatch = html.match(/src="([^"]+\.(?:jpg|jpeg|png|webp))[^"]*"/i);
  if (imgMatch && !imgMatch[1].includes('placeholder')) {
    enriched.imageUrl = imgMatch[1].startsWith('http') 
      ? imgMatch[1] 
      : `https://treedfilaments.com${imgMatch[1]}`;
  }
  
  // Extract colors from variant options
  const colorMatches = html.matchAll(/(?:colou?r|nero|bianco|naturale|trasparente|black|white|natural|grey)[:\s]*([^<,]+)/gi);
  for (const match of colorMatches) {
    const color = match[1].trim();
    if (color && !enriched.colors.includes(color)) {
      enriched.colors.push(color);
    }
  }
  
  // If no colors found, try to extract from SKU or title
  if (enriched.colors.length === 0) {
    if (/N$|NAT|NATURAL/i.test(enriched.sku)) {
      enriched.colors.push('Natural');
    } else if (/B$|BLACK|NERO/i.test(enriched.sku)) {
      enriched.colors.push('Black');
    } else if (/W$|WHITE|BIANCO/i.test(enriched.sku)) {
      enriched.colors.push('White');
    }
  }
  
  // Default color if none found
  if (enriched.colors.length === 0) {
    enriched.colors.push('Natural');
  }
  
  // Extract weights
  const weightMatches = html.matchAll(/(\d+(?:\.\d+)?)\s*(?:kg|g)\b/gi);
  for (const match of weightMatches) {
    const weight = extractTreeDWeight(match[0]);
    if (weight && !enriched.weights.includes(weight)) {
      enriched.weights.push(weight);
    }
  }
  
  // Default weight if none found
  if (enriched.weights.length === 0) {
    enriched.weights.push(1000); // Default 1kg
  }
  
  // Extract diameters
  if (/2\.85/i.test(html) || /2\.85/i.test(enriched.sku)) {
    enriched.diameters.push(2.85);
  }
  if (/1\.75/i.test(html) || /1\.75/i.test(enriched.sku)) {
    enriched.diameters.push(1.75);
  }
  
  // Default diameter if none found
  if (enriched.diameters.length === 0) {
    enriched.diameters.push(1.75);
  }
  
  // Extract description
  const descMatch = markdown.match(/(?:description|overview)[:\s]*(.+?)(?=\n\n|\n#|$)/is);
  if (descMatch) {
    enriched.description = descMatch[1].trim().slice(0, 500);
  }
  
  return enriched;
}

// ============================================================================
// STEP 3: UPSERT WITH ENRICHMENTS
// ============================================================================

async function upsertVariants(
  supabase: any,
  products: ScrapedProduct[],
  brandId: string | null
): Promise<SyncResult> {
  console.log('Step 3: Upserting variants with enrichments...');
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const product of products) {
    // Filter: must be a filament product
    if (!isTreeDFilament({ title: product.title, sku: product.sku })) {
      console.log(`Skipping non-filament: ${product.title}`);
      continue;
    }
    
    // Create variants for each color (most TreeD products have limited colors)
    for (const color of product.colors) {
      // Use primary diameter (1.75mm preferred)
      const diameter = product.diameters.includes(1.75) ? 1.75 : product.diameters[0] || 1.75;
      // Use primary weight (1kg preferred)
      const weight = product.weights.includes(1000) ? 1000 : product.weights[0] || 1000;
      
      const productId = `${product.sku}-${color.toLowerCase().replace(/\s+/g, '-')}-${diameter}`;
      
      // Enrich with brand-specific defaults
      const enrichment = enrichTreeDProduct(product.title, color, product.polymer);
      
      const variantData = {
        product_id: productId,
        product_title: enrichment.cleanedTitle || product.title,
        vendor: VENDOR_NAME,
        brand_id: brandId,
        material: enrichment.material || product.polymer || null,
        finish_type: enrichment.finishType,
        product_line_id: enrichment.productLineId,
        color_hex: enrichment.colorHex || getTreeDColorHex(color),
        variant_price: product.price,
        product_url: product.productUrl,
        featured_image: product.imageUrl,
        net_weight_g: weight,
        diameter_nominal_mm: diameter,
        is_nozzle_abrasive: enrichment.isAbrasive,
        nozzle_temp_min_c: enrichment.printSettings?.nozzleTempMin || null,
        nozzle_temp_max_c: enrichment.printSettings?.nozzleTempMax || null,
        bed_temp_min_c: enrichment.printSettings?.bedTempMin || null,
        bed_temp_max_c: enrichment.printSettings?.bedTempMax || null,
        variant_sku: product.sku,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
      
      try {
        // Check if exists
        const { data: existing } = await supabase
          .from('filaments')
          .select('id')
          .eq('product_id', productId)
          .maybeSingle();
        
        if (existing) {
          // Update
          const { error } = await supabase
            .from('filaments')
            .update({
              ...variantData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          
          if (error) {
            console.error(`Update error for ${productId}:`, error.message);
            errors++;
          } else {
            updated++;
          }
        } else {
          // Insert
          const { error } = await supabase
            .from('filaments')
            .insert(variantData);
          
          if (error) {
            console.error(`Insert error for ${productId}:`, error.message);
            errors++;
          } else {
            created++;
          }
        }
      } catch (err) {
        console.error(`Exception for ${productId}:`, err);
        errors++;
      }
    }
  }
  
  console.log(`Step 3 complete: Created ${created}, Updated ${updated}, Errors ${errors}`);
  
  return {
    step: 'upsert',
    success: errors === 0,
    created,
    updated,
    errors,
  };
}

// ============================================================================
// STEP 4: DISCOVER TDS URLs
// ============================================================================

async function discoverTdsUrls(supabase: any): Promise<SyncResult> {
  console.log('Step 4: Discovering TDS URLs...');
  
  // Get TreeD filaments without TDS URLs
  const { data: filaments, error: fetchError } = await supabase
    .from('filaments')
    .select('id, variant_sku, product_title')
    .ilike('vendor', 'treed')
    .is('tds_url', null);
  
  if (fetchError) {
    console.error('Error fetching filaments:', fetchError);
    return { step: 'tds_discovery', success: false, message: fetchError.message };
  }
  
  if (!filaments || filaments.length === 0) {
    console.log('No filaments need TDS URLs');
    return { step: 'tds_discovery', success: true, count: 0 };
  }
  
  console.log(`Checking TDS URLs for ${filaments.length} filaments...`);
  
  let foundCount = 0;
  const processedSkus = new Set<string>();
  
  for (const filament of filaments) {
    const sku = filament.variant_sku;
    if (!sku || processedSkus.has(sku)) continue;
    processedSkus.add(sku);
    
    // Try different TDS URL patterns
    const possibleUrls = constructTreeDTdsUrl(sku);
    
    for (const tdsUrl of possibleUrls) {
      try {
        const response = await fetch(tdsUrl, { method: 'HEAD' });
        if (response.ok && response.headers.get('content-type')?.includes('pdf')) {
          // Found valid TDS!
          const { error: updateError } = await supabase
            .from('filaments')
            .update({ tds_url: tdsUrl })
            .eq('variant_sku', sku)
            .ilike('vendor', 'treed');
          
          if (!updateError) {
            foundCount++;
            console.log(`Found TDS for ${sku}: ${tdsUrl}`);
          }
          break; // Found, no need to try other patterns
        }
      } catch (err) {
        // URL not valid, try next
      }
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`Step 4 complete: Found ${foundCount} TDS URLs`);
  
  return {
    step: 'tds_discovery',
    success: true,
    count: foundCount,
  };
}

// ============================================================================
// STEP 5: FIX DUPLICATE HEX CODES
// ============================================================================

async function fixDuplicateHexCodes(supabase: any): Promise<SyncResult> {
  console.log('Step 5: Fixing duplicate hex codes...');
  
  const { data: duplicates, error: rpcError } = await supabase
    .rpc('find_duplicate_hexes', { p_vendor: VENDOR_NAME });
  
  if (rpcError) {
    console.error('RPC error:', rpcError);
    return { step: 'fix_duplicates', success: false, message: rpcError.message };
  }
  
  if (!duplicates || duplicates.length === 0) {
    console.log('No duplicate hex codes found');
    return { step: 'fix_duplicates', success: true, count: 0 };
  }
  
  console.log(`Found ${duplicates.length} duplicates to fix`);
  
  // Group by product_line_id + hex
  const groups: Record<string, any[]> = {};
  for (const dup of duplicates) {
    const key = `${dup.product_line_id}:${dup.color_hex?.toLowerCase()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(dup);
  }
  
  let fixedCount = 0;
  
  for (const [key, items] of Object.entries(groups)) {
    // Skip the first one (keep original), fix the rest
    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const originalHex = item.color_hex || '#808080';
      
      // Generate a slightly different hex
      const hexNum = parseInt(originalHex.replace('#', ''), 16);
      const newHexNum = (hexNum + i * 17) & 0xFFFFFF;
      const newHex = `#${newHexNum.toString(16).padStart(6, '0').toUpperCase()}`;
      
      const { error: updateError } = await supabase
        .from('filaments')
        .update({ color_hex: newHex })
        .eq('id', item.id);
      
      if (!updateError) {
        fixedCount++;
      }
    }
  }
  
  console.log(`Step 5 complete: Fixed ${fixedCount} duplicate hex codes`);
  
  return {
    step: 'fix_duplicates',
    success: true,
    count: fixedCount,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log('TreeD Filaments Sync Started');
  console.log('='.repeat(60));

  try {
    // Parse options
    let options = { cleanSlate: false, skipTds: false, maxProducts: 100 };
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body, use defaults
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get brand ID
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .ilike('brand_slug', 'treed')
      .maybeSingle();
    
    const brandId = brand?.id || null;
    console.log('Brand ID:', brandId);

    // Clean slate if requested
    if (options.cleanSlate) {
      console.log('Clean slate: Deleting existing TreeD filaments...');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .or('vendor.ilike.treed,vendor.ilike.treed filaments');
      console.log('Deleted existing products');
    }

    const results: SyncResult[] = [];

    // Step 1: Fetch products
    const products = await fetchProductList(firecrawlApiKey);
    results.push({ step: 'fetch', success: true, count: products.length });

    // Step 2: Scrape details
    const enrichedProducts = await scrapeProductDetails(products, firecrawlApiKey, options.maxProducts);
    results.push({ step: 'scrape_details', success: true, count: enrichedProducts.length });

    // Step 3: Upsert variants
    const upsertResult = await upsertVariants(supabase, enrichedProducts, brandId);
    results.push(upsertResult);

    // Step 4: TDS Discovery (unless skipped)
    if (!options.skipTds) {
      const tdsResult = await discoverTdsUrls(supabase);
      results.push(tdsResult);
    }

    // Step 5: Fix duplicates
    const duplicateResult = await fixDuplicateHexCodes(supabase);
    results.push(duplicateResult);

    // Update brand counts
    if (brandId) {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'treed' });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('='.repeat(60));
    console.log(`TreeD Sync Complete in ${duration}s`);
    console.log('Results:', JSON.stringify(results, null, 2));
    console.log('='.repeat(60));

    return new Response(
      JSON.stringify({
        success: true,
        duration: `${duration}s`,
        vendor: VENDOR_NAME,
        results,
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync failed:', message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        vendor: VENDOR_NAME,
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});

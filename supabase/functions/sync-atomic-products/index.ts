/**
 * ATOMIC FILAMENT BRAND-SPECIFIC SYNC
 * 
 * SIMPLIFIED APPROACH (per user requirements):
 * - Uses ONLY 5 whitelisted collection URLs for product discovery
 * - Material is determined by collection source, NOT title parsing
 * - product_line_id is simple: atomic-filament__[material]
 * - Product titles come from H1 tag on individual product pages
 * 
 * Collections:
 * - PLA: https://atomicfilament.com/collections/opaque-pla-filaments-1
 * - PETG: https://atomicfilament.com/collections/petg-3d-printer-filament-us-made-with-free-shipping
 * - ABS: https://atomicfilament.com/collections/abs-3d-filament
 * - ASA: https://atomicfilament.com/collections/asa-free-us-shipping
 * - PLA Silk: https://atomicfilament.com/collections/silky-pla
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  ATOMIC_COLLECTION_WHITELIST,
  getAtomicColorHex,
  getAtomicPrintSettings,
  matchAtomicTds,
  isAtomicNonFilamentProduct,
  isAtomicSampleProduct,
  is285mmDiameter,
} from '../_shared/atomic-defaults.ts';
import { getColorHex, getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  dryRun?: boolean;
  limit?: number;
}

interface DiscoveredProduct {
  productUrl: string;
  material: string;
  productLineId: string;
  displayMaterial: string;
}

/**
 * Generate simple product_line_id from collection material
 * ONLY 5 possible values:
 * - atomic-filament__pla
 * - atomic-filament__petg
 * - atomic-filament__abs
 * - atomic-filament__asa
 * - atomic-filament__pla-silk
 */
function generateProductLineId(collectionMaterial: string): string {
  const materialSlug = collectionMaterial.toLowerCase().replace(/\s+/g, '-');
  return `atomic-filament__${materialSlug}`;
}

/**
 * Scrape product URLs from a collection page using Firecrawl
 */
async function scrapeCollectionProducts(
  collectionUrl: string,
  firecrawlKey: string
): Promise<string[]> {
  console.log(`[ATOMIC-SYNC] Scraping collection: ${collectionUrl}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: collectionUrl,
        formats: ['links'],
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      console.error(`[ATOMIC-SYNC] Firecrawl error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const allLinks = data.data?.links || data.links || [];
    
    // Filter to only product URLs
    // Note: Shopify URLs may be /collections/xxx/products/yyy OR /products/yyy
    const productUrls = allLinks.filter((url: string) => {
      // Must be atomicfilament.com
      if (!url.includes('atomicfilament.com')) return false;
      // Must contain /products/ somewhere
      if (!url.includes('/products/')) return false;
      // Skip variant URLs (we want base product)
      if (url.includes('?variant=')) return false;
      return true;
    });
    
    // Normalize URLs to base /products/xxx format and deduplicate
    const normalizedUrls = productUrls.map((url: string) => {
      const match = url.match(/\/products\/([^?#\/]+)/);
      if (match) {
        return `https://atomicfilament.com/products/${match[1]}`;
      }
      return url;
    });
    
    const uniqueUrls = [...new Set(normalizedUrls)] as string[];
    const collectionName = collectionUrl.split('/').pop() || 'unknown';
    console.log(`[ATOMIC-SYNC] Found ${uniqueUrls.length} products in ${collectionName}`);
    
    return uniqueUrls;
  } catch (err) {
    console.error(`[ATOMIC-SYNC] Error scraping collection:`, err);
    return [];
  }
}

/**
 * Scrape H1 title, price, and details from a product page
 */
async function scrapeProductPage(
  productUrl: string,
  firecrawlKey: string
): Promise<{ 
  h1Title: string | null; 
  colorHex: string | null; 
  imageUrl: string | null;
  price: number | null;
}> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['html'],
        onlyMainContent: false,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      return { h1Title: null, colorHex: null, imageUrl: null, price: null };
    }

    const data = await response.json();
    const html = data.data?.html || data.html || '';
    
    // Extract H1 title
    const h1Patterns = [
      /<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<h1[^>]*class="[^"]*product__title[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i,
    ];
    
    let h1Title: string | null = null;
    for (const pattern of h1Patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        h1Title = match[1].trim()
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        break;
      }
    }
    
    // Extract color swatch hex if present
    let colorHex: string | null = null;
    const swatchMatch = html.match(/background-color:\s*#([A-Fa-f0-9]{6})/i);
    if (swatchMatch) {
      colorHex = swatchMatch[1].toUpperCase();
    }
    
    // Extract main product image
    let imageUrl: string | null = null;
    const imgMatch = html.match(/<img[^>]*class="[^"]*product[^"]*image[^"]*"[^>]*src="([^"]+)"/i);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }
    
    // Extract price - look for sale price first, then regular price
    let price: number | null = null;
    const pricePatterns = [
      // Shopify sale price pattern
      /<span[^>]*class="[^"]*price-item--sale[^"]*"[^>]*>\s*\$?\s*([\d,]+\.?\d*)\s*<\/span>/i,
      /<span[^>]*class="[^"]*price-item--regular[^"]*"[^>]*>\s*\$?\s*([\d,]+\.?\d*)\s*<\/span>/i,
      /<span[^>]*class="[^"]*price-item--last[^"]*"[^>]*>\s*\$?\s*([\d,]+\.?\d*)\s*<\/span>/i,
      // Generic price patterns
      /<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?\s*([\d,]+\.?\d*)\s*<\/span>/i,
      /class="[^"]*price[^"]*"[^>]*>\s*\$?\s*([\d,]+\.?\d*)/i,
      // JSON-LD or metadata
      /"price":\s*"?([\d,]+\.?\d*)"?/i,
      /"full_price":\s*"?\$?\s*([\d,]+\.?\d*)"?/i,
    ];
    
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const parsedPrice = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(parsedPrice) && parsedPrice > 0 && parsedPrice < 500) { // Sanity check
          price = parsedPrice;
          break;
        }
      }
    }
    
    return { h1Title, colorHex, imageUrl, price };
  } catch (err) {
    console.error(`[ATOMIC-SYNC] Error scraping product page:`, err);
    return { h1Title: null, colorHex: null, imageUrl: null, price: null };
  }
}

/**
 * Extract color name from product title
 * Preserves specialty descriptors like "Shade-Shifting", "Translucent", "UV Reactive"
 * E.g., "Groovy Purple PLA Shade-Shifting Filament AMS Compatible" -> "Groovy Purple Shade-Shifting"
 */
function extractColorFromTitle(title: string, material: string): string {
  if (!title) return 'Unknown';
  
  // Remove AMS Compatible suffix first
  let colorName = title
    .replace(/\s*AMS\s*Compatible\s*/gi, '')
    .replace(/\s*Filament\s*/gi, '')
    .replace(/\b1\.75\s*mm\b/gi, '')
    .replace(/\b2\.85\s*mm\b/gi, '')
    .replace(/\b1\s*KG\b/gi, '')
    .replace(/\b-?\s*1\s*KG\b/gi, '');
  
  // Remove material keywords but preserve finish/specialty descriptors
  colorName = colorName
    .replace(/\bPLA\b/gi, '')
    .replace(/\bPETG\b/gi, '')
    .replace(/\bABS\b/gi, '')
    .replace(/\bASA\b/gi, '')
    .replace(/\bPRO\b/gi, '')
    .replace(/\bPLUS\b/gi, '')
    .replace(/\b3D\b/gi, '')
    .replace(/\bPRINTER\b/gi, '')
    .replace(/\bATOMIC\b/gi, '');
  
  // Clean up extra spaces, dashes, and punctuation
  colorName = colorName
    .replace(/\s+/g, ' ')
    .replace(/^[-–,\s]+|[-–,\s]+$/g, '')
    .trim();
  
  return colorName || 'Standard';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[ATOMIC-SYNC] ═══════════════════════════════════════════════════════');
  console.log('[ATOMIC-SYNC] 🚀 ATOMIC FILAMENT SYNC - SIMPLIFIED 5-COLLECTION APPROACH');
  console.log('[ATOMIC-SYNC] ═══════════════════════════════════════════════════════');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('FIRECRAWL_API_KEY_1');
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!firecrawlKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'FIRECRAWL_API_KEY not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    let body: SyncRequest = {};
    try {
      body = await req.json();
    } catch {
      // Use defaults
    }

    const { dryRun = false } = body;
    
    console.log(`[ATOMIC-SYNC] Mode: ${dryRun ? 'DRY RUN' : 'LIVE'} (no limit - all products)`);
    console.log('[ATOMIC-SYNC] Collections to sync:');
    ATOMIC_COLLECTION_WHITELIST.forEach(c => {
      console.log(`  - ${c.displayMaterial}: ${c.collectionUrl}`);
    });

    // =========================================================================
    // STEP 1: CLEAN SLATE - Delete all existing Atomic products
    // =========================================================================
    console.log('[ATOMIC-SYNC] ─────────────────────────────────────────────────────');
    console.log('[ATOMIC-SYNC] STEP 1: Clean slate - removing all existing Atomic products');
    
    if (!dryRun) {
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', '%atomic%');
      
      if (deleteError) {
        console.error('[ATOMIC-SYNC] Delete error:', deleteError.message);
      } else {
        console.log(`[ATOMIC-SYNC] Deleted existing Atomic products`);
      }
    } else {
      console.log('[ATOMIC-SYNC] [DRY-RUN] Would delete all existing Atomic products');
    }

    // =========================================================================
    // STEP 2: DISCOVER products from each collection
    // =========================================================================
    console.log('[ATOMIC-SYNC] ─────────────────────────────────────────────────────');
    console.log('[ATOMIC-SYNC] STEP 2: Discovering products from 5 collections');
    
    const allDiscoveredProducts: DiscoveredProduct[] = [];
    
    for (const collection of ATOMIC_COLLECTION_WHITELIST) {
      console.log(`\n[ATOMIC-SYNC] 📂 ${collection.displayMaterial} collection...`);
      
      const productUrls = await scrapeCollectionProducts(collection.collectionUrl, firecrawlKey);
      const productLineId = generateProductLineId(collection.material);
      
      console.log(`[ATOMIC-SYNC] → product_line_id: ${productLineId}`);
      
      for (const productUrl of productUrls) {
        allDiscoveredProducts.push({
          productUrl,
          material: collection.material,
          productLineId,
          displayMaterial: collection.displayMaterial,
        });
      }
      
      // Small delay between collections
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Deduplicate by URL (a product might appear in multiple collections, use first occurrence)
    const uniqueProducts = new Map<string, DiscoveredProduct>();
    for (const product of allDiscoveredProducts) {
      const baseUrl = product.productUrl.split('?')[0];
      if (!uniqueProducts.has(baseUrl)) {
        uniqueProducts.set(baseUrl, product);
      }
    }
    
    console.log(`\n[ATOMIC-SYNC] Total unique products discovered: ${uniqueProducts.size}`);

    // =========================================================================
    // STEP 3: SCRAPE each product page for H1 title and details
    // =========================================================================
    console.log('[ATOMIC-SYNC] ─────────────────────────────────────────────────────');
    console.log('[ATOMIC-SYNC] STEP 3: Scraping product pages for H1 titles');
    
    const productsToInsert: any[] = [];
    const productEntries = Array.from(uniqueProducts.entries());
    const BATCH_SIZE = 5;
    const totalBatches = Math.ceil(productEntries.length / BATCH_SIZE);
    
    let scraped = 0;
    let filtered = 0;
    
    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      const batchStart = batchIdx * BATCH_SIZE;
      const batch = productEntries.slice(batchStart, batchStart + BATCH_SIZE);
      
      console.log(`[ATOMIC-SYNC] Batch ${batchIdx + 1}/${totalBatches} (${batch.length} products)...`);
      
      // Scrape batch in parallel
      const batchResults = await Promise.all(
        batch.map(async ([productUrl, product]) => {
          const pageData = await scrapeProductPage(productUrl, firecrawlKey);
          return { productUrl, product, pageData };
        })
      );
      
      // Process results
      for (const { productUrl, product, pageData } of batchResults) {
        scraped++;
        
        const title = pageData.h1Title || productUrl.split('/products/')[1]?.replace(/-/g, ' ') || 'Unknown';
        
        // Filter non-filament products
        if (isAtomicNonFilamentProduct(title) || isAtomicSampleProduct(title) || is285mmDiameter(title)) {
          console.log(`[ATOMIC-SYNC] Filtered: ${title.slice(0, 50)}`);
          filtered++;
          continue;
        }
        
        // Extract color from title
        const colorName = extractColorFromTitle(title, product.material);
        
        // Get color hex (from page swatch, Atomic mapping, or generic mapping)
        let colorHex = pageData.colorHex || 
                       getAtomicColorHex(colorName) || 
                       getColorHex(colorName);
        
        // Get color family
        const colorFamily = getColorFamily(colorName) || colorName;
        
        // Get print settings
        const printSettings = getAtomicPrintSettings(product.material);
        
        // Get TDS URL
        const tdsMatch = matchAtomicTds(title);
        
        // Create product record
        const productData = {
          vendor: 'Atomic Filament',
          product_title: title,
          product_url: productUrl,
          material: product.material,
          product_line_id: product.productLineId,
          color_family: colorFamily,
          color_hex: colorHex || null,
          featured_image: pageData.imageUrl || null,
          diameter_nominal_mm: 1.75,
          net_weight_g: 1000,
          variant_price: pageData.price || null,  // Price from page
          retail_price_usd: pageData.price || null,  // Also store in retail_price_usd
          tds_url: tdsMatch?.url || null,
          nozzle_temp_min_c: printSettings?.nozzleTempMin || null,
          nozzle_temp_max_c: printSettings?.nozzleTempMax || null,
          bed_temp_min_c: printSettings?.bedTempMin || null,
          bed_temp_max_c: printSettings?.bedTempMax || null,
          is_nozzle_abrasive: printSettings?.isAbrasive || false,
          auto_created: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        productsToInsert.push(productData);
      }
      
      // Delay between batches
      if (batchIdx < totalBatches - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    console.log(`\n[ATOMIC-SYNC] Scraped: ${scraped}, Filtered: ${filtered}, To insert: ${productsToInsert.length}`);

    // =========================================================================
    // STEP 4: INSERT products into database
    // =========================================================================
    console.log('[ATOMIC-SYNC] ─────────────────────────────────────────────────────');
    console.log('[ATOMIC-SYNC] STEP 4: Inserting products into database');
    
    let inserted = 0;
    let errors = 0;
    
    if (!dryRun && productsToInsert.length > 0) {
      // Insert in batches of 50
      for (let i = 0; i < productsToInsert.length; i += 50) {
        const batch = productsToInsert.slice(i, i + 50);
        
        const { error: insertError } = await supabase
          .from('filaments')
          .insert(batch);
        
        if (insertError) {
          console.error('[ATOMIC-SYNC] Insert error:', insertError.message);
          errors += batch.length;
        } else {
          inserted += batch.length;
        }
      }
      
      console.log(`[ATOMIC-SYNC] Inserted: ${inserted}, Errors: ${errors}`);
    } else if (dryRun) {
      console.log(`[ATOMIC-SYNC] [DRY-RUN] Would insert ${productsToInsert.length} products`);
    }

    // =========================================================================
    // FINAL SUMMARY
    // =========================================================================
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Count products by product_line_id
    const productLineCounts: Record<string, number> = {};
    for (const p of productsToInsert) {
      productLineCounts[p.product_line_id] = (productLineCounts[p.product_line_id] || 0) + 1;
    }
    
    console.log('[ATOMIC-SYNC] ═══════════════════════════════════════════════════════');
    console.log('[ATOMIC-SYNC] ✅ SYNC COMPLETE');
    console.log('[ATOMIC-SYNC] ═══════════════════════════════════════════════════════');
    console.log(`[ATOMIC-SYNC] Duration: ${duration}s`);
    console.log(`[ATOMIC-SYNC] Products inserted: ${inserted}`);
    console.log(`[ATOMIC-SYNC] Products by collection:`);
    for (const [lineId, count] of Object.entries(productLineCounts)) {
      console.log(`  - ${lineId}: ${count}`);
    }

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      summary: {
        collectionsProcessed: ATOMIC_COLLECTION_WHITELIST.length,
        productsDiscovered: uniqueProducts.size,
        productsFiltered: filtered,
        productsInserted: inserted,
        productsByCollection: productLineCounts,
        duration: `${duration}s`,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ATOMIC-SYNC] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

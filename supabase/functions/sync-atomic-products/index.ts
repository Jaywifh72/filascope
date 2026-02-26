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
 * 
 * ROBUSTNESS FEATURES:
 * - Safe delete pattern (delete AFTER successful scraping)
 * - Minimum product threshold safety check
 * - Brand sync log integration for audit trail
 * - JSON-LD priority for price extraction
 * - Correct response structure for frontend
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
  extractFinishType,
} from '../_shared/atomic-defaults.ts';
import { getColorHex, getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Baseline product count for anomaly detection (updated to match current catalog)
const BASELINE_PRODUCT_COUNT = 150;
// Drop >20% from baseline triggers a warning anomaly alert
const CATALOG_DROP_WARN_PERCENT = 0.20;

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
 * Scrape product URLs from a Shopify collection using /products.json pagination
 * Falls back to Firecrawl if Shopify JSON fails
 */
async function scrapeCollectionProducts(
  collectionUrl: string,
  firecrawlKey: string
): Promise<string[]> {
  // Extract collection handle from URL
  const collectionHandle = collectionUrl.split('/collections/')[1]?.split('?')[0];
  if (!collectionHandle) {
    console.error(`[ATOMIC-SYNC] Cannot extract collection handle from: ${collectionUrl}`);
    return [];
  }

  // Try Shopify JSON API with pagination first
  const allProductUrls: string[] = [];
  let page = 1;
  const LIMIT = 250;

  console.log(`[ATOMIC-SYNC] Fetching collection via Shopify JSON: ${collectionHandle}`);
  
  try {
    while (true) {
      const jsonUrl = `https://atomicfilament.com/collections/${collectionHandle}/products.json?limit=${LIMIT}&page=${page}`;
      const response = await fetch(jsonUrl, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        console.warn(`[ATOMIC-SYNC] Shopify JSON failed (${response.status}), falling back to Firecrawl`);
        await response.text().catch(() => {});
        break;
      }

      const data = await response.json();
      const products = data.products || [];
      
      if (products.length === 0) break; // No more pages

      for (const product of products) {
        if (product.handle) {
          allProductUrls.push(`https://atomicfilament.com/products/${product.handle}`);
        }
      }

      console.log(`[ATOMIC-SYNC] Page ${page}: ${products.length} products`);
      if (products.length < LIMIT) break; // Last page
      page++;
    }
  } catch (err) {
    console.warn(`[ATOMIC-SYNC] Shopify JSON error, falling back to Firecrawl:`, err);
  }

  if (allProductUrls.length > 0) {
    console.log(`[ATOMIC-SYNC] Found ${allProductUrls.length} products via Shopify JSON in ${collectionHandle}`);
    return allProductUrls;
  }

  // Fallback: Firecrawl scraping
  console.log(`[ATOMIC-SYNC] Falling back to Firecrawl for collection: ${collectionUrl}`);
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: collectionUrl, formats: ['links'], waitFor: 3000 }),
    });

    if (!response.ok) {
      console.error(`[ATOMIC-SYNC] Firecrawl error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const allLinks = data.data?.links || data.links || [];
    
    const productUrls = allLinks.filter((url: string) => {
      if (!url.includes('atomicfilament.com')) return false;
      if (!url.includes('/products/')) return false;
      if (url.includes('?variant=')) return false;
      return true;
    });
    
    const normalizedUrls = productUrls.map((url: string) => {
      const match = url.match(/\/products\/([^?#\/]+)/);
      return match ? `https://atomicfilament.com/products/${match[1]}` : url;
    });
    
    const uniqueUrls = [...new Set(normalizedUrls)] as string[];
    console.log(`[ATOMIC-SYNC] Found ${uniqueUrls.length} products via Firecrawl in ${collectionHandle}`);
    return uniqueUrls;
  } catch (err) {
    console.error(`[ATOMIC-SYNC] Error scraping collection:`, err);
    return [];
  }
}

/**
 * Scrape H1 title, price, and details from a product page
 * Price extraction prioritizes JSON-LD for reliability
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
    
    // NOTE: Swatch extraction disabled for Atomic Filament
    // The HTML contains brand color (#0E88AD) in CSS variables that incorrectly
    // matches swatch patterns. Atomic uses image-based swatches, not CSS colors.
    // Color hex is determined by getAtomicColorHex() using the color name instead.
    const colorHex: string | null = null;
    
    // Extract main product image - try multiple patterns for Shopify themes
    let imageUrl: string | null = null;
    const imagePatterns = [
      // Pattern 1: Image with image-magnify-lightbox class (Atomic specific)
      /<img[^>]*class="[^"]*image-magnify-lightbox[^"]*"[^>]*src="([^"]+)"/i,
      // Pattern 2: Shopify product__media structure
      /<div[^>]*class="[^"]*product__media[^"]*"[^>]*>\s*<img[^>]*src="([^"]+)"/i,
      // Pattern 3: atomicfilament.com CDN image (reliable fallback)
      /src="(https:\/\/atomicfilament\.com\/cdn\/shop\/(?:files|products)\/[^"]+)"/i,
      // Pattern 4: Generic Shopify CDN image
      /src="(https:\/\/[^"]+\.shopify\.com\/[^"]*\/(?:files|products)\/[^"]+\.(jpg|png|webp)[^"]*)"/i,
      // Pattern 5: Original pattern for other themes
      /<img[^>]*class="[^"]*product[^"]*image[^"]*"[^>]*src="([^"]+)"/i,
    ];
    
    for (const pattern of imagePatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const candidateUrl = match[1]
          .replace(/&amp;/g, '&')
          .replace(/&width=\d+/, '&width=1200');
        
        // Skip loading spinners, icons, or SVGs
        if (!candidateUrl.includes('spinner') && 
            !candidateUrl.includes('icon') && 
            !candidateUrl.endsWith('.svg')) {
          imageUrl = candidateUrl;
          break;
        }
      }
    }
    
    // Extract price - JSON-LD first (most reliable for Shopify)
    let price: number | null = null;
    
    // Try JSON-LD first
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd['@type'] === 'Product' && jsonLd.offers?.price) {
          const parsedPrice = parseFloat(jsonLd.offers.price);
          if (!isNaN(parsedPrice) && parsedPrice > 0 && parsedPrice < 500) {
            price = parsedPrice;
          }
        }
      } catch (e) {
        // Fall through to regex patterns
      }
    }
    
    // If JSON-LD didn't work, use regex patterns
    if (!price) {
      const pricePatterns = [
        // Shopify sale price pattern
        /<span[^>]*class="[^"]*price-item--sale[^"]*"[^>]*>\s*\$?\s*([\d,]+\.?\d*)\s*<\/span>/i,
        /<span[^>]*class="[^"]*price-item--regular[^"]*"[^>]*>\s*\$?\s*([\d,]+\.?\d*)\s*<\/span>/i,
        /<span[^>]*class="[^"]*price-item--last[^"]*"[^>]*>\s*\$?\s*([\d,]+\.?\d*)\s*<\/span>/i,
        // Generic price patterns
        /<span[^>]*class="[^"]*price[^"]*"[^>]*>\s*\$?\s*([\d,]+\.?\d*)\s*<\/span>/i,
        /class="[^"]*price[^"]*"[^>]*>\s*\$?\s*([\d,]+\.?\d*)/i,
        // JSON metadata fallback
        /"price":\s*"?([\d,]+\.?\d*)"?/i,
        /"full_price":\s*"?\$?\s*([\d,]+\.?\d*)"?/i,
      ];
      
      for (const pattern of pricePatterns) {
        const match = html.match(pattern);
        if (match?.[1]) {
          const parsedPrice = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(parsedPrice) && parsedPrice > 0 && parsedPrice < 500) {
            price = parsedPrice;
            break;
          }
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

  let syncLogId: string | null = null;
  let supabase: ReturnType<typeof createClient> | null = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('FIRECRAWL_API_KEY_1');
    supabase = createClient(supabaseUrl, supabaseKey);

    if (!firecrawlKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'FIRECRAWL_API_KEY not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body first
    let body: SyncRequest = {};
    try {
      body = await req.json();
    } catch {
      // Use defaults
    }

    // Verify admin role (skip for service_role/orchestrator calls)
    const authHeader = req.headers.get('Authorization');
    const triggeredBy = body?.triggeredBy;
    const isServiceRole = authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.slice(-20) || '___');
    
    if (!isServiceRole && triggeredBy !== 'orchestrator') {
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
    }

    const { dryRun = false } = body;
    
    console.log(`[ATOMIC-SYNC] Mode: ${dryRun ? 'DRY RUN' : 'LIVE'} (no limit - all products)`);
    console.log('[ATOMIC-SYNC] Collections to sync:');
    ATOMIC_COLLECTION_WHITELIST.forEach(c => {
      console.log(`  - ${c.displayMaterial}: ${c.collectionUrl}`);
    });

    // =========================================================================
    // STEP 0: Create sync log entry for audit trail
    // =========================================================================
    if (!dryRun && supabase) {
      const { data: logEntry } = await supabase
        .from('brand_sync_logs')
        .insert({
          brand_slug: 'atomic-filament',
          sync_type: 'clean_slate',
          status: 'running',
          started_at: new Date().toISOString(),
          triggered_by: 'admin_ui',
        })
        .select('id')
        .single() as { data: { id: string } | null };
      
      syncLogId = logEntry?.id || null;
      console.log(`[ATOMIC-SYNC] Created sync log: ${syncLogId}`);
    }

    // =========================================================================
    // STEP 1: DISCOVER products from each collection (NO DELETE YET)
    // =========================================================================
    console.log('[ATOMIC-SYNC] ─────────────────────────────────────────────────────');
    console.log('[ATOMIC-SYNC] STEP 1: Discovering products from 5 collections');
    
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
    // STEP 2: SCRAPE each product page for H1 title and details
    // =========================================================================
    console.log('[ATOMIC-SYNC] ─────────────────────────────────────────────────────');
    console.log('[ATOMIC-SYNC] STEP 2: Scraping product pages for H1 titles');
    
    const productsToInsert: any[] = [];
    const productEntries = Array.from(uniqueProducts.entries());
    const BATCH_SIZE = 5;
    const totalBatches = Math.ceil(productEntries.length / BATCH_SIZE);
    
    let scraped = 0;
    let filtered = 0;
    
    const TIME_LIMIT_MS = 120_000; // Stop scraping at 120s to leave time for insert/cleanup
    
    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      // Time guard: stop scraping if approaching edge function timeout
      const elapsed = Date.now() - startTime;
      if (elapsed > TIME_LIMIT_MS) {
        console.log(`[ATOMIC-SYNC] ⏱️ Time guard triggered at ${Math.round(elapsed/1000)}s - stopping scrape with ${productsToInsert.length} products collected`);
        break;
      }
      
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
        
        // Override product_line_id for specialty products (title-based detection)
        let productLineId = product.productLineId;
        let material = product.material;
        
        // Hi-Flow Pro is a distinct product line (prevents duplicate hex with regular PLA Black)
        if (title.toLowerCase().includes('hi-flow') || title.toLowerCase().includes('hiflow')) {
          const baseMaterial = product.material.toUpperCase();
          productLineId = `atomic-filament__${baseMaterial.toLowerCase()}-hi-flow-pro`;
          material = `${baseMaterial} Hi-Flow Pro`;
          console.log(`[ATOMIC-SYNC] → Overriding to Hi-Flow Pro: ${title.slice(0, 50)}`);
        }
        // Silky/Silk products are their own product line
        else if (title.toLowerCase().includes('silky') || title.toLowerCase().includes('silk')) {
          productLineId = 'atomic-filament__pla-silk';
          material = 'PLA Silk';
          console.log(`[ATOMIC-SYNC] → Overriding to PLA Silk: ${title.slice(0, 50)}`);
        }
        
        // Filter non-filament products
        if (isAtomicNonFilamentProduct(title) || isAtomicSampleProduct(title) || is285mmDiameter(title)) {
          console.log(`[ATOMIC-SYNC] Filtered: ${title.slice(0, 50)}`);
          filtered++;
          continue;
        }
        
        // Extract color from title
        const colorName = extractColorFromTitle(title, product.material);
        
        // Get color hex - use Atomic mapping first, then generic mapping
        // NOTE: pageData.colorHex is intentionally NOT used - it contains brand color #0E88AD
        const atomicHex = getAtomicColorHex(colorName);
        const genericHex = getColorHex(colorName);
        const colorHex = atomicHex || genericHex;
        
        console.log(`[ATOMIC-COLOR] "${colorName}" -> ${colorHex ? '#' + colorHex : 'UNMAPPED'} (atomic: ${atomicHex || 'null'}, generic: ${genericHex || 'null'})`);
        
        // Get color family
        const colorFamily = getColorFamily(colorName) || colorName;
        
        // Get print settings
        const printSettings = getAtomicPrintSettings(product.material);
        
        // Get TDS URL
        const tdsMatch = matchAtomicTds(title);
        
        // Extract finish type
        const finishType = extractFinishType(title);
        
        // Create product record (NO retail_price_usd - column doesn't exist)
        const productData = {
          vendor: 'Atomic Filament',
          product_title: title,
          product_url: productUrl,
          material: material,
          product_line_id: productLineId,
          color_family: colorFamily,
          color_hex: colorHex || null,
          featured_image: pageData.imageUrl || null,
          diameter_nominal_mm: 1.75,
          net_weight_g: 1000,
          variant_price: pageData.price || null,
          finish_type: finishType || null,
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
    // STEP 3: SAFETY CHECK - Ensure we have enough products before deleting
    // =========================================================================
    console.log('[ATOMIC-SYNC] ─────────────────────────────────────────────────────');
    console.log('[ATOMIC-SYNC] STEP 3: Safety validation');
    
    // Hard-abort only on zero products (clear fetch failure)
    if (productsToInsert.length === 0) {
      const errorMessage = `0 products found — fetch failure. Aborting to preserve existing data.`;
      console.error(`[ATOMIC-SYNC] ❌ Safety check FAILED: ${errorMessage}`);
      
      if (syncLogId && supabase) {
        await supabase.from('brand_sync_logs').update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round((Date.now() - startTime) / 1000),
          products_discovered: uniqueProducts.size,
          products_created: 0,
          products_failed: 0,
          error_details: { error: errorMessage },
        }).eq('id', syncLogId);
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        summary: { totalDiscovered: uniqueProducts.size, created: 0, updated: 0, skipped: filtered, errors: 0 },
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Warn (but continue) if catalog dropped >20% from baseline
    let syncStatus = 'completed';
    const dropPercent = (BASELINE_PRODUCT_COUNT - productsToInsert.length) / BASELINE_PRODUCT_COUNT;
    if (productsToInsert.length < BASELINE_PRODUCT_COUNT && dropPercent > CATALOG_DROP_WARN_PERCENT) {
      syncStatus = 'partial';
      console.warn(`[ATOMIC-SYNC] ⚠️ Catalog drop detected: ${productsToInsert.length} products (baseline ${BASELINE_PRODUCT_COUNT}, -${(dropPercent * 100).toFixed(0)}%). Continuing with partial catalog.`);
      
      // Log a price anomaly alert for admin review
      if (supabase) {
        await supabase.from('price_discrepancies').insert({
          source_url: 'https://atomicfilament.com',
          old_price: BASELINE_PRODUCT_COUNT,
          new_price: productsToInsert.length,
          price_change_percent: -(dropPercent * 100),
          status: 'pending',
          notes: `[Catalog Count Drop] Atomic Filament: ${BASELINE_PRODUCT_COUNT} → ${productsToInsert.length} (-${(dropPercent * 100).toFixed(0)}%). Sync continued with partial catalog.`,
        }).then(({ error }) => {
          if (error) console.warn('[ATOMIC-SYNC] Could not log catalog anomaly:', error.message);
        });
      }
    } else {
      console.log(`[ATOMIC-SYNC] ✓ Safety check passed: ${productsToInsert.length} products ready`);
    }

    // =========================================================================
    // STEP 4: DELETE old products (only AFTER successful scraping)
    // =========================================================================
    console.log('[ATOMIC-SYNC] ─────────────────────────────────────────────────────');
    console.log('[ATOMIC-SYNC] STEP 4: Clean slate - removing existing Atomic products');
    
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
    // STEP 5: INSERT products into database
    // =========================================================================
    console.log('[ATOMIC-SYNC] ─────────────────────────────────────────────────────');
    console.log('[ATOMIC-SYNC] STEP 5: Inserting products into database');
    
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
      inserted = productsToInsert.length; // For dry run response
    }

    // =========================================================================
    // STEP 6: Update sync log with results
    // =========================================================================
    if (syncLogId && supabase) {
      await supabase.from('brand_sync_logs').update({
        status: errors > 0 ? 'partial' : syncStatus,
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round((Date.now() - startTime) / 1000),
        products_discovered: uniqueProducts.size,
        products_created: inserted,
        products_failed: errors,
        regions_synced: ['US'],
        regional_breakdown: {
          US: {
            updated: 0,
            created: inserted,
            skipped: filtered,
            errors: errors,
            products_found: uniqueProducts.size,
            duration_ms: Date.now() - startTime,
          }
        },
      }).eq('id', syncLogId);
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

    // Return response with CORRECT structure for frontend
    return new Response(JSON.stringify({
      success: true,
      dryRun,
      summary: {
        totalDiscovered: uniqueProducts.size,
        created: inserted,
        updated: 0,
        skipped: filtered,
        errors: errors,
      },
      // Legacy fields for backwards compatibility
      collectionsProcessed: ATOMIC_COLLECTION_WHITELIST.length,
      productsByCollection: productLineCounts,
      duration: `${duration}s`,
      duration_ms: Date.now() - startTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ATOMIC-SYNC] Fatal error:', error);
    
    // Update sync log on failure
    if (syncLogId && supabase) {
      await supabase.from('brand_sync_logs').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round((Date.now() - startTime) / 1000),
        error_details: { error: error instanceof Error ? error.message : 'Unknown error' },
      }).eq('id', syncLogId);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      summary: {
        totalDiscovered: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 1,
      },
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

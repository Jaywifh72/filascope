/**
 * BAMBU LAB SYNC FUNCTION
 * 
 * 5-step architecture matching AzureFilm:
 * Step 0: Create sync log entry
 * Step 1: Discover products from collection page (Firecrawl HTML)
 * Step 2: Scrape each product page for H1 title and details
 * Step 3: Safety validation (minimum product threshold)
 * Step 4: Clean slate deletion
 * Step 5: Insert products with enrichment
 * 
 * Source: https://ca.store.bambulab.com/collections/bambu-lab-3d-printer-filament
 * Note: Bambu Lab uses a custom Next.js platform, NOT standard Shopify JSON API
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  BAMBULAB_STORE_INFO,
  BAMBULAB_SAFE_DELETE_THRESHOLD,
  isBambuLabNonFilament,
  generateBambuLabProductLineId,
  getBambuLabProductLineConfig,
  enrichBambuLabProduct,
  getBambuLabColorHex,
  isValidColorName,
} from '../_shared/bambulab-defaults.ts';
import { 
  shouldIncludeVariant, 
  extractWeightFromText,
  is285mmDiameter,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';
import { createDecisionLogger } from '../_shared/decision-logger.ts';
import { getColorHex, getColorFamily } from '../_shared/color-mapping.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USD pricing (store shows USD prices on collection)
const USD_RATE = 1.0;

interface DiscoveredProduct {
  url: string;
  collectionTitle: string;
}

interface ScrapedProduct {
  url: string;
  h1Title: string;
  price: number | null;
  imageUrl: string | null;
  colorOptions: string[];
  weightGrams: number;
  available: boolean;
}

interface SyncResult {
  success: boolean;
  summary: {
    totalDiscovered: number;
    totalScraped: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  duration: string;
  duration_ms: number;
}

// ============================================================================
// STEP 1: DISCOVER PRODUCTS FROM COLLECTION PAGE (FIRECRAWL)
// ============================================================================

async function discoverProductsFromCollection(firecrawlKey: string): Promise<DiscoveredProduct[]> {
  const allProducts: DiscoveredProduct[] = [];
  const seenUrls = new Set<string>();
  
  const collectionUrl = BAMBULAB_STORE_INFO.productsUrl;
  console.log(`[BambuLab] Discovering products from collection: ${collectionUrl}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: collectionUrl,
        formats: ['links', 'markdown'],
        onlyMainContent: false,
        waitFor: 5000, // Wait for JS content to load
      }),
    });
    
    if (!response.ok) {
      console.error(`[BambuLab] Failed to scrape collection: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const links = data.data?.links || [];
    
    console.log(`[BambuLab] Found ${links.length} total links on page`);
    
    // Filter for product links - Bambu Lab uses both ca. and us. subdomains
    // Collection shows us. links but we can use ca. for CAD pricing
    const productLinks = links.filter((link: string) => {
      // Match patterns like:
      // https://us.store.bambulab.com/products/pla-basic-filament
      // https://ca.store.bambulab.com/products/pla-matte
      const isProductLink = /https:\/\/(us|ca|eu|uk|au)\.store\.bambulab\.com\/products\//.test(link);
      
      // Exclude non-product pages
      const isNotCollection = !link.includes('/collections/');
      const isNotCart = !link.includes('/cart');
      const isNotAccount = !link.includes('/account');
      
      return isProductLink && isNotCollection && isNotCart && isNotAccount;
    });
    
    console.log(`[BambuLab] Found ${productLinks.length} product links`);
    
    for (const link of productLinks) {
      // Normalize to CA store for consistent pricing
      const normalizedUrl = link.replace(
        /https:\/\/(us|eu|uk|au)\.store\.bambulab\.com/,
        'https://us.store.bambulab.com'
      );
      
      if (!seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        allProducts.push({
          url: normalizedUrl,
          collectionTitle: 'Filament',
        });
      }
    }
    
  } catch (error) {
    console.error(`[BambuLab] Error scraping collection:`, error);
  }
  
  console.log(`[BambuLab] Total unique products discovered: ${allProducts.length}`);
  return allProducts;
}

// ============================================================================
// STEP 2: SCRAPE PRODUCT PAGES FOR DETAILS
// ============================================================================

// Helper to extract color from "Color : ColorName (SKU)" pattern
function extractColorFromPageContent(markdown: string): string | null {
  // Look for "Color : ColorName (SKU)" pattern (Bambu Lab specific format)
  const colorLabelMatch = markdown.match(/Color\s*:\s*([^(]+)\s*\(/i);
  if (colorLabelMatch) {
    const colorName = colorLabelMatch[1].trim();
    if (isValidColorName(colorName)) {
      return colorName;
    }
  }
  
  // Try "Selected: ColorName" pattern
  const selectedMatch = markdown.match(/Selected\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (selectedMatch && isValidColorName(selectedMatch[1])) {
    return selectedMatch[1];
  }
  
  return null;
}

async function scrapeProductPage(url: string, firecrawlKey: string): Promise<ScrapedProduct | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });
    
    if (!response.ok) {
      console.error(`[BambuLab] Failed to scrape ${url}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const markdown = data.data?.markdown || '';
    const html = data.data?.html || '';
    
    // Extract H1 title (priority for product_title)
    let h1Title = '';
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                    markdown.match(/^#\s+(.+)$/m);
    if (h1Match) {
      h1Title = h1Match[1].trim();
    }
    
    // If no H1, try to extract from markdown headers
    if (!h1Title) {
      const mdHeaderMatch = markdown.match(/^##?\s+(.+)$/m);
      if (mdHeaderMatch) {
        h1Title = mdHeaderMatch[1].trim();
      }
    }
    
    // Extract price (USD)
    let price: number | null = null;
    const priceMatch = markdown.match(/\$(\d+(?:\.\d{2})?)\s*USD/i) ||
                       markdown.match(/From\s+\$(\d+(?:\.\d{2})?)/i) ||
                       markdown.match(/\$(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
    }
    
    // Extract image URL
    let imageUrl: string | null = null;
    const imgMatch = markdown.match(/!\[.*?\]\((https:\/\/store\.bblcdn\.com[^)]+)\)/);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }
    
    // Extract color options using multiple strategies
    const colorOptions: string[] = [];
    
    // Strategy 1: Look for "Color : ColorName" pattern specific to Bambu Lab
    const primaryColor = extractColorFromPageContent(markdown);
    if (primaryColor) {
      colorOptions.push(primaryColor);
    }
    
    // Strategy 2: Extract from color-related HTML/markdown patterns
    // Look for color variant links or buttons
    const colorVariantMatches = markdown.matchAll(/(?:color|variant)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi);
    for (const match of colorVariantMatches) {
      const colorName = match[1].trim();
      if (!colorOptions.includes(colorName) && isValidColorName(colorName)) {
        colorOptions.push(colorName);
      }
    }
    
    // Strategy 3: Parse standalone color words (more permissive but filtered)
    const colorPatterns = [
      /\b(Jade\s*White|Bambu\s*Green|Sky\s*Blue|Cobalt\s*Blue|Indigo\s*Purple|Maroon\s*Red|Hot\s*Pink|Pumpkin\s*Orange|Sunflower\s*Yellow|Bright\s*Green|Cocoa\s*Brown|Light\s*Gray|Dark\s*Gray|Blue\s*Gray|Matte\s*[A-Z][a-z]+|Silk\s*[A-Z][a-z]+|Galaxy\s*[A-Z][a-z]+|Glow\s*[A-Z][a-z]+)\b/g,
      /\b(Black|White|Gray|Grey|Red|Blue|Green|Yellow|Orange|Purple|Pink|Brown|Gold|Silver|Ivory|Beige|Teal|Cyan|Magenta|Coral|Navy|Olive|Turquoise|Jade|Lime|Lavender|Mint|Peach|Rose|Salmon|Charcoal|Natural|Clear|Translucent)\b/g,
    ];
    
    for (const pattern of colorPatterns) {
      const matches = markdown.matchAll(pattern);
      for (const match of matches) {
        const colorName = match[1] || match[0];
        const normalized = colorName.trim();
        if (!colorOptions.includes(normalized) && isValidColorName(normalized)) {
          colorOptions.push(normalized);
        }
      }
    }
    
    // Extract weight (default 1000g for Bambu Lab spools)
    const weightGrams = extractWeightFromText(markdown) || 1000;
    
    // Check availability
    const soldOut = /sold\s*out/i.test(markdown);
    const available = !soldOut;
    
    return {
      url,
      h1Title,
      price,
      imageUrl,
      colorOptions,
      weightGrams,
      available,
    };
    
  } catch (error) {
    console.error(`[BambuLab] Error scraping ${url}:`, error);
    return null;
  }
}

async function scrapeProductPages(
  products: DiscoveredProduct[], 
  firecrawlKey: string
): Promise<ScrapedProduct[]> {
  const scraped: ScrapedProduct[] = [];
  
  console.log(`[BambuLab] Scraping ${products.length} product pages...`);
  
  // Process in batches of 5 for parallel efficiency
  const batchSize = 5;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(p => scrapeProductPage(p.url, firecrawlKey))
    );
    
    for (const result of batchResults) {
      if (result && result.h1Title) {
        scraped.push(result);
      }
    }
    
    // Progress logging
    console.log(`[BambuLab] Scraped ${Math.min(i + batchSize, products.length)}/${products.length} pages`);
    
    // Rate limit: 500ms between batches
    if (i + batchSize < products.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`[BambuLab] Successfully scraped ${scraped.length} products`);
  return scraped;
}

// ============================================================================
// STEP 3: FILTER AND PROCESS PRODUCTS
// ============================================================================

interface ProcessedProduct {
  h1Title: string;
  colorName: string | null;
  price: number | null;
  imageUrl: string | null;
  productUrl: string;
  weightGrams: number;
  available: boolean;
}

function processScrapedProducts(products: ScrapedProduct[], decisionLogger: ReturnType<typeof createDecisionLogger>): ProcessedProduct[] {
  const processed: ProcessedProduct[] = [];
  const filterStats = createFilterStats();
  
  for (const product of products) {
    // Skip non-filament products
    if (isBambuLabNonFilament(product.h1Title)) {
      decisionLogger.logFilter(product.url, product.h1Title, { weight: 0, diameter: 1.75 }, { included: false, reason: 'non-filament detected' });
      console.log(`[BambuLab] Skipping non-filament: ${product.h1Title}`);
      continue;
    }
    
    // Skip 2.85mm diameter products (Bambu Lab only sells 1.75mm but check title anyway)
    if (is285mmDiameter(product.h1Title)) {
      decisionLogger.logFilter(product.url, product.h1Title, { weight: 0, diameter: 2.85 }, { included: false, reason: '2.85mm diameter detected' });
      console.log(`[BambuLab] Skipping 2.85mm product: ${product.h1Title}`);
      continue;
    }
    
    // Determine weight with sample/pack detection
    let weightGrams = extractWeightFromText(product.h1Title) || product.weightGrams;
    
    // If no weight found and "Sample" in title, assume sample weight
    if (!weightGrams && /\bsample\b/i.test(product.h1Title)) {
      weightGrams = 50;
      decisionLogger.logFilter(product.url, product.h1Title, { weight: 50, diameter: 1.75 }, { included: false, reason: 'sample product detected (50g)' });
      console.log(`[BambuLab] Detected sample product (50g): ${product.h1Title}`);
      continue; // Skip samples
    }
    
    // Check for pack count (N-pack = N x 1kg)
    if (!weightGrams) {
      const packMatch = product.h1Title.match(/(\d+)[\s-]*pack/i);
      if (packMatch) {
        weightGrams = parseInt(packMatch[1], 10) * 1000;
        console.log(`[BambuLab] Detected ${packMatch[1]}-pack (${weightGrams}g): ${product.h1Title}`);
      }
    }
    
    // Default to 1kg only for non-sample, non-pack products
    if (!weightGrams) {
      weightGrams = 1000;
    }
    
    // If product has color options, create a variant for each
    // Otherwise, create a single entry
    const colors = product.colorOptions.length > 0 ? product.colorOptions : [null];
    
    for (const colorName of colors) {
      // Apply variant filters
      const filterResult = shouldIncludeVariant(weightGrams, 1.75, product.h1Title);
      updateFilterStats(filterStats, filterResult);
      
      if (!filterResult.include) {
        decisionLogger.logFilter(product.url, product.h1Title, { weight: weightGrams, diameter: 1.75 }, { included: false, reason: filterResult.reason || 'filter failed' });
        console.log(`[BambuLab] Filtering: ${product.h1Title} (${filterResult.reason})`);
        continue;
      }
      
      decisionLogger.logFilter(product.url, product.h1Title, { weight: weightGrams, diameter: 1.75 }, { included: true, reason: 'passed all filters' });
      
      processed.push({
        h1Title: product.h1Title,
        colorName,
        price: product.price,
        imageUrl: product.imageUrl,
        productUrl: product.url,
        weightGrams,
        available: product.available,
      });
    }
  }
  
  logFilterStats('Bambu Lab', filterStats);
  console.log(`[BambuLab] Processed ${processed.length} valid variants`);
  return processed;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  
  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    
    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    const dryRun = body.dryRun === true;
    
    console.log(`[BambuLab] Starting sync (cleanSlate: ${cleanSlate}, dryRun: ${dryRun})`);
    
    // ========================================================================
    // STEP 0: Create sync log entry
    // ========================================================================
    let syncLogId: string | null = null;
    
    if (!dryRun) {
      const { data: syncLog, error: syncLogError } = await supabase
        .from('brand_sync_logs')
        .insert({
          brand_slug: 'bambu-lab',
          sync_type: cleanSlate ? 'clean_slate' : 'incremental',
          status: 'running',
          started_at: new Date().toISOString(),
          triggered_by: 'manual',
        })
        .select('id')
        .single();
      
      if (syncLogError) {
        console.error('[BambuLab] Failed to create sync log:', syncLogError);
      }
      syncLogId = syncLog?.id;
    }
    
    // ========================================================================
    // STEP 1: Discover products from collection page
    // ========================================================================
    const discoveredProducts = await discoverProductsFromCollection(firecrawlKey);
    
    if (discoveredProducts.length === 0) {
      throw new Error('No product links discovered from collection page');
    }
    
    // ========================================================================
    // STEP 2: Scrape each product page
    // ========================================================================
    const scrapedProducts = await scrapeProductPages(discoveredProducts, firecrawlKey);
    
    if (scrapedProducts.length === 0) {
      throw new Error('No products successfully scraped');
    }
    
    // ========================================================================
    // STEP 3: Process and filter products (with decision logging)
    // ========================================================================
    const decisionLogger = createDecisionLogger({ brandSlug: 'bambu-lab', syncLogId: syncLogId || undefined });
    const processedProducts = processScrapedProducts(scrapedProducts, decisionLogger);
    
    // ========================================================================
    // STEP 4: Safety validation (STRICT - throw error if below threshold)
    // ========================================================================
    if (processedProducts.length < BAMBULAB_SAFE_DELETE_THRESHOLD) {
      throw new Error(
        `Safety check failed: Only ${processedProducts.length} products processed, ` +
        `minimum ${BAMBULAB_SAFE_DELETE_THRESHOLD} required for clean slate sync`
      );
    }
    
    console.log(`[BambuLab] Products ready for insertion: ${processedProducts.length}`);
    
    // Dry run - return early with discovery results
    if (dryRun) {
      const duration = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          summary: {
            totalDiscovered: discoveredProducts.length,
            totalScraped: scrapedProducts.length,
            totalVariants: processedProducts.length,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
          },
          sampleProducts: processedProducts.slice(0, 10).map(p => ({
            title: p.h1Title,
            color: p.colorName,
            price: p.price,
            weight: p.weightGrams,
          })),
          duration: `${(duration / 1000).toFixed(1)}s`,
          duration_ms: duration,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ========================================================================
    // STEP 5: Clean slate deletion (if enabled)
    // ========================================================================
    if (cleanSlate) {
      console.log('[BambuLab] Performing clean slate deletion...');
      
      const { error: deleteError, count: deleteCount } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'bambu lab');
      
      if (deleteError) {
        console.error('[BambuLab] Delete error:', deleteError);
        throw new Error(`Failed to delete existing products: ${deleteError.message}`);
      }
      
      console.log(`[BambuLab] Deleted ${deleteCount || 0} existing products`);
    }
    
    // ========================================================================
    // STEP 6: Insert products with enrichment
    // ========================================================================
    const productsToInsert: any[] = [];
    let skipped = 0;
    let errors = 0;
    
    for (const product of processedProducts) {
      try {
        // Enrich product with material info, finish type, etc.
        const config = getBambuLabProductLineConfig(product.h1Title);
        const enrichment = enrichBambuLabProduct(product.h1Title);
        
        // Get color hex - prioritize brand-specific map, then generic
        let colorHex = product.colorName ? getBambuLabColorHex(product.colorName) : null;
        if (!colorHex && product.colorName) {
          colorHex = getColorHex(product.colorName);
        }
        const colorFamily = product.colorName ? getColorFamily(product.colorName) : null;
        
        // Determine material from product line ID
        let material = 'PLA';
        const plId = enrichment.productLineId.toLowerCase();
        if (plId.includes('tpu')) material = 'TPU';
        else if (plId.includes('abs')) material = 'ABS';
        else if (plId.includes('asa')) material = 'ASA';
        else if (plId.includes('petg')) material = 'PETG';
        else if (plId.includes('pc-')) material = 'PC';
        else if (plId.includes('pa-') || plId.includes('pa6')) material = 'PA';
        else if (plId.includes('pet-cf')) material = 'PET-CF';
        else if (plId.includes('pps')) material = 'PPS';
        else if (plId.includes('pva')) material = 'PVA';
        else if (plId.includes('support')) material = 'Support';
        
        // Build product record
        const productRecord = {
          product_title: product.h1Title,
          vendor: BAMBULAB_STORE_INFO.vendor,
          material,
          finish_type: enrichment.finishType,
          product_line_id: enrichment.productLineId,
          color_family: colorFamily || product.colorName,
          color_hex: colorHex,
          variant_price: product.price,
          variant_compare_at_price: null,
          variant_available: product.available,
          featured_image: product.imageUrl,
          product_url: product.productUrl,
          net_weight_g: product.weightGrams,
          diameter_nominal_mm: 1.75,
          is_nozzle_abrasive: config.isAbrasive,
          high_speed_capable: config.highSpeedCapable,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
        };
        
        productsToInsert.push(productRecord);
        
      } catch (error) {
        console.error(`[BambuLab] Error processing ${product.h1Title}:`, error);
        errors++;
      }
    }
    
    // Batch insert
    let created = 0;
    const batchSize = 50;
    
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize);
      
      const { error: insertError, data: insertedData } = await supabase
        .from('filaments')
        .insert(batch)
        .select('id');
      
      if (insertError) {
        console.error(`[BambuLab] Batch insert error (${i}-${i + batch.length}):`, insertError);
        errors += batch.length;
      } else {
        created += insertedData?.length || batch.length;
      }
      
      // Progress logging
      if ((i + batchSize) % 100 === 0 || i + batchSize >= productsToInsert.length) {
        console.log(`[BambuLab] Inserted ${Math.min(i + batchSize, productsToInsert.length)}/${productsToInsert.length} products`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Update sync log
    if (syncLogId) {
      await supabase
        .from('brand_sync_logs')
        .update({
          status: errors > 0 && created === 0 ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: Math.round(duration / 1000),
          products_discovered: discoveredProducts.length,
          products_created: created,
          products_failed: errors,
        })
        .eq('id', syncLogId);
    }
    
    // Update brand product counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'bambu-lab' });
    
    console.log(`[BambuLab] Sync complete: ${created} created, ${skipped} skipped, ${errors} errors`);
    
    const result: SyncResult = {
      success: errors === 0 || created > 0,
      summary: {
        totalDiscovered: discoveredProducts.length,
        totalScraped: scrapedProducts.length,
        created,
        updated: 0,
        skipped,
        errors,
      },
      duration: `${(duration / 1000).toFixed(1)}s`,
      duration_ms: duration,
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[BambuLab] Sync failed:', error);
    const duration = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${(duration / 1000).toFixed(1)}s`,
        duration_ms: duration,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

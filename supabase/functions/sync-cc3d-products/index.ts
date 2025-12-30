/**
 * CC3D Product Sync Edge Function
 * 
 * 5-step WooCommerce/Firecrawl sync pipeline for CC3D filaments:
 * 1. Optional clean slate (delete existing products)
 * 2. Discover product URLs from category pages
 * 3. Scrape individual product pages
 * 4. Apply brand-specific enrichments
 * 5. Upsert to database and fix duplicates
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichCC3DProduct,
  CC3D_CATEGORY_URLS,
  CC3D_STORE_INFO,
} from '../_shared/cc3d-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  success: boolean;
  vendor: string;
  steps: {
    cleanSlate?: { deleted: number };
    discovery?: { categoriesScraped: number; productsFound: number };
    scraping?: { scraped: number; failed: number };
    enrichment?: { enriched: number };
    upsert?: { created: number; updated: number; errors: number };
  };
  totalProducts: number;
  duration: number;
  errors: string[];
}

interface ScrapedProduct {
  url: string;
  title: string;
  price: number | null;
  image: string | null;
  color: string | null;
  category: string | null;
}

// ============================================================================
// STEP 2: DISCOVER PRODUCT URLS
// ============================================================================

async function discoverProductUrls(firecrawlKey: string): Promise<{ urls: string[]; categoriesScraped: number }> {
  const allUrls: Set<string> = new Set();
  let categoriesScraped = 0;
  
  for (const categoryUrl of CC3D_CATEGORY_URLS) {
    try {
      console.log(`Mapping category: ${categoryUrl}`);
      
      const response = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: categoryUrl,
          limit: 100,
        }),
      });
      
      if (!response.ok) {
        console.error(`Failed to map ${categoryUrl}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const links = data.links || [];
      
      // Filter for product URLs
      for (const link of links) {
        if (link.includes('/product/') && !link.includes('/product-category/')) {
          allUrls.add(link);
        }
      }
      
      categoriesScraped++;
      console.log(`Found ${links.length} links in ${categoryUrl}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Error mapping ${categoryUrl}:`, error);
    }
  }
  
  console.log(`Total unique product URLs discovered: ${allUrls.size}`);
  return { urls: Array.from(allUrls), categoriesScraped };
}

// ============================================================================
// STEP 3: SCRAPE PRODUCT PAGES
// ============================================================================

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
        waitFor: 2000,
      }),
    });
    
    if (!response.ok) {
      console.error(`Failed to scrape ${url}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    const metadata = data.data?.metadata || data.metadata || {};
    
    // Extract title
    let title = metadata.title || '';
    const h1Match = html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      title = h1Match[1].trim();
    }
    
    if (!title) {
      console.log(`No title found for ${url}`);
      return null;
    }
    
    // Extract price
    let price: number | null = null;
    const priceMatch = markdown.match(/\$\s*([\d,.]+)/);
    if (priceMatch) {
      price = parseFloat(priceMatch[1].replace(',', ''));
    }
    
    // Extract image
    let image: string | null = null;
    const ogImage = metadata.ogImage || metadata['og:image'];
    if (ogImage) {
      image = ogImage;
    } else {
      const imgMatch = html.match(/<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]+)"/i);
      if (imgMatch) {
        image = imgMatch[1];
      }
    }
    
    // Extract color from title or additional info
    let color: string | null = null;
    // Try to find color in "Additional information" table
    const colorMatch = html.match(/Color[^<]*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i);
    if (colorMatch) {
      color = colorMatch[1].trim();
    } else {
      // Extract from title
      const colorFromTitle = extractColorFromTitle(title);
      if (colorFromTitle) {
        color = colorFromTitle;
      }
    }
    
    // Extract category from URL
    let category: string | null = null;
    for (const catUrl of CC3D_CATEGORY_URLS) {
      const catName = catUrl.split('/product-category/')[1]?.replace('/', '');
      if (catName && url.toLowerCase().includes(catName.toLowerCase())) {
        category = catName;
        break;
      }
    }
    
    // Also try breadcrumb
    if (!category) {
      const breadcrumbMatch = html.match(/product-category\/([^/"]+)/i);
      if (breadcrumbMatch) {
        category = breadcrumbMatch[1];
      }
    }
    
    return {
      url,
      title,
      price,
      image,
      color,
      category,
    };
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

function extractColorFromTitle(title: string): string | null {
  // Common color patterns in CC3D titles
  const colorPatterns = [
    /silk\s+(\w+(?:\s+\w+)?)/i,
    /(\w+)\s+silk/i,
    /(\w+)\s+pla/i,
    /pla\s+(\w+)/i,
    /(\w+)\s+petg/i,
    /(\w+)\s+abs/i,
    /(\w+)\s+tpu/i,
  ];
  
  for (const pattern of colorPatterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      const potentialColor = match[1].toLowerCase();
      // Filter out non-color words
      const nonColors = ['pla', 'petg', 'abs', 'tpu', 'filament', '3d', 'printer', 'max', 'tough', 'normal'];
      if (!nonColors.includes(potentialColor)) {
        return match[1];
      }
    }
  }
  
  return null;
}

function generateProductId(url: string): string {
  // Extract slug from URL
  const match = url.match(/\/product\/([^/]+)\/?$/);
  if (match) {
    return `cc3d-${match[1]}`;
  }
  // Fallback to hash of URL
  return `cc3d-${url.split('/').pop() || Date.now()}`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  const errors: string[] = [];
  
  const result: SyncResult = {
    success: false,
    vendor: 'CC3D',
    steps: {},
    totalProducts: 0,
    duration: 0,
    errors: [],
  };
  
  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    const maxProducts = body.maxProducts || 100;
    
    console.log(`Starting CC3D sync. cleanSlate: ${cleanSlate}, maxProducts: ${maxProducts}`);
    
    // Get brand ID
    const { data: brandData } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'cc3d')
      .single();
    
    const brandId = brandData?.id || null;
    
    // =========================================================================
    // STEP 1: OPTIONAL CLEAN SLATE
    // =========================================================================
    
    if (cleanSlate) {
      console.log('Step 1: Performing clean slate deletion...');
      
      const { data: deletedProducts, error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'cc3d')
        .select('id');
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
        errors.push(`Clean slate failed: ${deleteError.message}`);
      }
      
      const deletedCount = deletedProducts?.length || 0;
      result.steps.cleanSlate = { deleted: deletedCount };
      console.log(`Deleted ${deletedCount} existing CC3D products`);
    }
    
    // =========================================================================
    // STEP 2: DISCOVER PRODUCT URLS
    // =========================================================================
    
    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }
    
    console.log('Step 2: Discovering product URLs...');
    const { urls: productUrls, categoriesScraped } = await discoverProductUrls(firecrawlKey);
    
    result.steps.discovery = {
      categoriesScraped,
      productsFound: productUrls.length,
    };
    
    if (productUrls.length === 0) {
      throw new Error('No product URLs discovered');
    }
    
    // Limit products if specified
    const urlsToScrape = productUrls.slice(0, maxProducts);
    console.log(`Will scrape ${urlsToScrape.length} products`);
    
    // =========================================================================
    // STEP 3: SCRAPE PRODUCT PAGES
    // =========================================================================
    
    console.log('Step 3: Scraping product pages...');
    const scrapedProducts: ScrapedProduct[] = [];
    let scrapeFailed = 0;
    
    for (const url of urlsToScrape) {
      const product = await scrapeProductPage(url, firecrawlKey);
      
      if (product) {
        scrapedProducts.push(product);
      } else {
        scrapeFailed++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    result.steps.scraping = {
      scraped: scrapedProducts.length,
      failed: scrapeFailed,
    };
    
    console.log(`Scraped ${scrapedProducts.length} products, ${scrapeFailed} failed`);
    
    // =========================================================================
    // STEP 4: APPLY ENRICHMENTS
    // =========================================================================
    
    console.log('Step 4: Applying brand-specific enrichments...');
    
    const enrichedProducts = scrapedProducts.map(product => {
      const enrichment = enrichCC3DProduct(
        product.title,
        product.color,
        product.category
      );
      
      const productId = generateProductId(product.url);
      
      return {
        product_id: productId,
        product_title: product.title,
        vendor: 'CC3D',
        brand_id: brandId,
        product_url: product.url,
        featured_image: product.image,
        variant_price: product.price,
        material: enrichment.material,
        finish_type: enrichment.finishType,
        product_line_id: enrichment.productLineId,
        color_hex: enrichment.colorHex,
        color_family: product.color,
        nozzle_temp_min_c: enrichment.printSettings?.nozzleTempMin,
        nozzle_temp_max_c: enrichment.printSettings?.nozzleTempMax,
        bed_temp_min_c: enrichment.printSettings?.bedTempMin,
        bed_temp_max_c: enrichment.printSettings?.bedTempMax,
        diameter_nominal_mm: enrichment.diameterMm,
        net_weight_g: enrichment.spoolWeightGrams,
        is_nozzle_abrasive: enrichment.isAbrasive,
        tds_url: enrichment.tdsUrl,
        auto_created: true,
        auto_updated: true,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'synced',
      };
    });
    
    result.steps.enrichment = { enriched: enrichedProducts.length };
    console.log(`Enriched ${enrichedProducts.length} products`);
    
    // =========================================================================
    // STEP 5: UPSERT TO DATABASE
    // =========================================================================
    
    console.log('Step 5: Upserting to database...');
    
    let created = 0;
    let updated = 0;
    let upsertErrors = 0;
    
    for (const product of enrichedProducts) {
      try {
        // Check if exists
        const { data: existing } = await supabase
          .from('filaments')
          .select('id')
          .eq('product_id', product.product_id)
          .ilike('vendor', 'cc3d')
          .single();
        
        if (existing) {
          // Update
          const { error } = await supabase
            .from('filaments')
            .update(product)
            .eq('id', existing.id);
          
          if (error) {
            console.error(`Update error for ${product.product_id}:`, error);
            upsertErrors++;
          } else {
            updated++;
          }
        } else {
          // Insert
          const { error } = await supabase
            .from('filaments')
            .insert(product);
          
          if (error) {
            console.error(`Insert error for ${product.product_id}:`, error);
            upsertErrors++;
          } else {
            created++;
          }
        }
      } catch (error) {
        console.error(`Upsert error for ${product.product_id}:`, error);
        upsertErrors++;
      }
    }
    
    result.steps.upsert = { created, updated, errors: upsertErrors };
    console.log(`Created: ${created}, Updated: ${updated}, Errors: ${upsertErrors}`);
    
    // Update automated_brands
    await supabase
      .from('automated_brands')
      .update({
        last_scrape_at: new Date().toISOString(),
        platform_type: CC3D_STORE_INFO.platformType,
        base_url: CC3D_STORE_INFO.baseUrl,
        products_url: CC3D_STORE_INFO.productsUrl,
        default_currency: CC3D_STORE_INFO.defaultCurrency,
      })
      .eq('brand_slug', 'cc3d');
    
    // Update product counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'cc3d' });
    
    // Fix duplicate hex codes
    const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'CC3D' });
    if (duplicates && duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate hex codes to fix`);
      
      const groupedByLine: Record<string, typeof duplicates> = {};
      for (const dup of duplicates) {
        const key = `${dup.product_line_id}_${dup.color_hex?.toLowerCase()}`;
        if (!groupedByLine[key]) {
          groupedByLine[key] = [];
        }
        groupedByLine[key].push(dup);
      }
      
      for (const [key, group] of Object.entries(groupedByLine)) {
        for (let i = 1; i < group.length; i++) {
          const item = group[i];
          const baseHex = item.color_hex || '#808080';
          const adjustment = i * 2;
          const newHex = adjustHexColor(baseHex, adjustment);
          
          await supabase
            .from('filaments')
            .update({ color_hex: newHex })
            .eq('id', item.id);
        }
      }
    }
    
    result.success = true;
    result.totalProducts = created + updated;
    result.duration = Date.now() - startTime;
    result.errors = errors;
    
    console.log(`CC3D sync completed in ${result.duration}ms`);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Sync failed:', error);
    result.success = false;
    result.errors = [...errors, error instanceof Error ? error.message : 'Unknown error'];
    result.duration = Date.now() - startTime;
    
    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function adjustHexColor(hex: string, amount: number): string {
  const cleanHex = hex.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(cleanHex.substring(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(cleanHex.substring(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(cleanHex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

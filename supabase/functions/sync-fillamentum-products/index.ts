import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichFillamentumProduct,
  extractFillamentumColor,
  getFillamentumColorHex,
  FILLAMENTUM_STORE_INFO,
  FILLAMENTUM_COLLECTION_SLUGS
} from '../_shared/fillamentum-defaults.ts';
import {
  shouldIncludeVariant,
  createFilterStats,
  updateFilterStats,
  logFilterStats,
} from '../_shared/variant-filters.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

interface ProductData {
  handle: string;
  title: string;
  price: number | null;
  compareAtPrice: number | null;
  imageUrl: string | null;
  productUrl: string;
  colorName: string | null;
  diameter: number;
  weight: number;
  available: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = {
    discovered: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  try {
    const { cleanSlate = false, limit = 500, skipExisting = true } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('=== Fillamentum Sync Starting ===');
    console.log(`Clean slate: ${cleanSlate}, Limit: ${limit}, Skip existing: ${skipExisting}`);

    // =========================================================================
    // STEP 1: Optional Clean Slate
    // =========================================================================
    if (cleanSlate) {
      console.log('Step 1: Deleting existing Fillamentum products...');
      const { data: deleted, error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'fillamentum')
        .select('id');

      if (deleteError) {
        console.error('Delete error:', deleteError);
      } else {
        console.log(`Deleted ${deleted?.length || 0} existing products`);
      }
    }

    // Collect existing product IDs for skip logic
    const existingProductIds = new Set<string>();
    if (skipExisting && !cleanSlate) {
      const { data: existing } = await supabase
        .from('filaments')
        .select('product_id')
        .ilike('vendor', 'fillamentum');
      
      existing?.forEach(p => {
        if (p.product_id) existingProductIds.add(p.product_id);
      });
      console.log(`Found ${existingProductIds.size} existing products to potentially skip`);
    }

    // =========================================================================
    // STEP 2: Discover Product URLs
    // =========================================================================
    console.log('Step 2: Discovering product URLs...');
    const productUrls: string[] = [];

    if (firecrawlKey) {
      // Use Firecrawl to map the site
      try {
        const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${FILLAMENTUM_STORE_INFO.baseUrlUSA}/collections/all`,
            limit: 1000,
            includeSubdomains: false
          }),
        });

        const mapData = await mapResponse.json();
        
        if (mapData.success && mapData.links) {
          const productPattern = /\/products\/[a-z0-9-]+$/i;
          const excludePattern = /sample|accessory|nozzle|tool|plate/i;
          
          for (const link of mapData.links) {
            if (productPattern.test(link) && !excludePattern.test(link)) {
              if (!productUrls.includes(link)) {
                productUrls.push(link);
              }
            }
          }
          console.log(`Firecrawl map discovered ${productUrls.length} product URLs`);
        }
      } catch (err) {
        console.error('Firecrawl map error:', err);
      }
    }

    // Fallback: Build URLs from known collection slugs
    if (productUrls.length === 0) {
      console.log('Using fallback URL generation from collection slugs...');
      for (const slug of FILLAMENTUM_COLLECTION_SLUGS) {
        const collectionUrl = `${FILLAMENTUM_STORE_INFO.baseUrlUSA}/collections/${slug}`;
        productUrls.push(collectionUrl);
      }
    }

    stats.discovered = productUrls.length;
    console.log(`Total URLs to process: ${stats.discovered}`);

    // =========================================================================
    // STEP 3: Scrape Product Pages
    // =========================================================================
    console.log('Step 3: Scraping product pages...');
    const products: ProductData[] = [];
    const urlsToScrape = productUrls.slice(0, limit);

    for (let i = 0; i < urlsToScrape.length; i++) {
      const url = urlsToScrape[i];
      
      // Rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      try {
        // Check if it's a collection URL (fallback mode)
        const isCollection = url.includes('/collections/') && !url.includes('/products/');
        
        if (isCollection && firecrawlKey) {
          // Scrape collection page to find product links
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              formats: ['html'],
              waitFor: 2000
            }),
          });

          const scrapeData = await scrapeResponse.json();
          
          if (scrapeData.success && scrapeData.data?.html) {
            // Extract product URLs from collection page
            const productLinkPattern = /href="(\/products\/[a-z0-9-]+)"/gi;
            let match;
            while ((match = productLinkPattern.exec(scrapeData.data.html)) !== null) {
              const productUrl = `${FILLAMENTUM_STORE_INFO.baseUrlUSA}${match[1]}`;
              if (!productUrls.includes(productUrl)) {
                productUrls.push(productUrl);
              }
            }
          }
          continue; // Skip to next URL after processing collection
        }

        if (!firecrawlKey) {
          console.log('Firecrawl API key not configured, skipping scraping');
          break;
        }

        console.log(`[${i + 1}/${urlsToScrape.length}] Scraping: ${url}`);

        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown', 'html'],
            waitFor: 2000
          }),
        });

        const scrapeData = await scrapeResponse.json();

        if (!scrapeData.success) {
          console.error(`Scrape failed for ${url}:`, scrapeData.error);
          stats.failed++;
          continue;
        }

        const html = scrapeData.data?.html || '';
        const markdown = scrapeData.data?.markdown || '';
        const metadata = scrapeData.data?.metadata || {};

        // Extract handle from URL
        const handleMatch = url.match(/\/products\/([a-z0-9-]+)/i);
        const handle = handleMatch ? handleMatch[1] : null;

        if (!handle) {
          console.log(`No handle found for ${url}`);
          stats.failed++;
          continue;
        }

        // Skip samples and accessories
        if (/sample|6m|15m|accessory|nozzle|tool/i.test(handle)) {
          console.log(`Skipping sample/accessory: ${handle}`);
          stats.skipped++;
          continue;
        }

        // Extract title
        const title = metadata.title?.replace(/\s*[-–|].*$/, '').trim() || 
                     metadata.ogTitle?.replace(/\s*[-–|].*$/, '').trim() ||
                     handle.replace(/-/g, ' ');

        // Extract color from title
        const colorName = extractFillamentumColor(title);

        // Extract price from HTML
        let price: number | null = null;
        let compareAtPrice: number | null = null;
        
        const priceMatch = html.match(/\$(\d+\.?\d*)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1]);
        }
        
        const compareMatch = html.match(/compare[- ]?at[- ]?price[^$]*\$(\d+\.?\d*)/i);
        if (compareMatch) {
          compareAtPrice = parseFloat(compareMatch[1]);
        }

        // Extract image
        let imageUrl = metadata.ogImage || null;
        if (!imageUrl) {
          const imgMatch = html.match(/src="(https:\/\/cdn\.shopify\.com\/[^"]+\.(?:jpg|png|webp)[^"]*)"/i);
          if (imgMatch) {
            imageUrl = imgMatch[1].split('?')[0];
          }
        }

        // Extract diameter and weight from variants or title
        let diameter = FILLAMENTUM_STORE_INFO.defaultDiameter;
        let weight = FILLAMENTUM_STORE_INFO.defaultWeight;

        if (/2\.85/i.test(title) || /2\.85/i.test(html)) {
          diameter = 2.85;
        }
        
        const weightMatch = (title + ' ' + html).match(/(\d+(?:\.\d+)?)\s*(kg|g)/i);
        if (weightMatch) {
          const value = parseFloat(weightMatch[1]);
          const unit = weightMatch[2].toLowerCase();
          weight = unit === 'kg' ? value * 1000 : value;
        }

        // Check availability
        const available = !/sold[- ]?out|out[- ]?of[- ]?stock|unavailable/i.test(html);

        const product: ProductData = {
          handle,
          title,
          price,
          compareAtPrice,
          imageUrl,
          productUrl: url,
          colorName,
          diameter,
          weight,
          available
        };

        products.push(product);
        console.log(`  ✓ Extracted: ${title} - $${price} - ${colorName || 'no color'}`);

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error scraping ${url}:`, error);
        stats.failed++;
        stats.errors.push(`${url}: ${errMsg}`);
      }
    }

    console.log(`Scraped ${products.length} products`);

    // =========================================================================
    // STEP 4: Enrich and Upsert Products
    // =========================================================================
    console.log('Step 4: Enriching and upserting products...');

    for (const product of products) {
      try {
        // Generate product ID
        const productId = product.handle;

        // Skip if already exists and skipExisting is true
        if (skipExisting && existingProductIds.has(productId)) {
          console.log(`  Skipping existing: ${productId}`);
          stats.skipped++;
          continue;
        }

        // Enrich product data
        const enrichment = enrichFillamentumProduct(
          product.title,
          product.colorName,
          null
        );

        // Prepare filament data
        const filamentData = {
          product_id: productId,
          product_title: product.title,
          vendor: FILLAMENTUM_STORE_INFO.vendor,
          material: enrichment.material,
          finish_type: enrichment.finishType,
          product_line_id: enrichment.productLineId,
          color_hex: enrichment.colorHex || getFillamentumColorHex(product.colorName || ''),
          variant_price: product.price,
          variant_compare_at_price: product.compareAtPrice,
          variant_available: product.available,
          product_url: product.productUrl,
          featured_image: product.imageUrl,
          diameter_nominal_mm: product.diameter,
          net_weight_g: product.weight,
          spool_material: FILLAMENTUM_STORE_INFO.spoolMaterial,
          tds_url: enrichment.tdsUrl,
          is_nozzle_abrasive: enrichment.isAbrasive,
          nozzle_temp_min_c: enrichment.printSettings?.nozzleTempMin || null,
          nozzle_temp_max_c: enrichment.printSettings?.nozzleTempMax || null,
          bed_temp_min_c: enrichment.printSettings?.bedTempMin || null,
          bed_temp_max_c: enrichment.printSettings?.bedTempMax || null,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced'
        };

        // Check if product exists
        const { data: existingProduct } = await supabase
          .from('filaments')
          .select('id')
          .eq('product_id', productId)
          .ilike('vendor', 'fillamentum')
          .maybeSingle();

        if (existingProduct) {
          // Update existing
          const { error: updateError } = await supabase
            .from('filaments')
            .update({
              ...filamentData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProduct.id);

          if (updateError) {
            console.error(`Update error for ${productId}:`, updateError);
            stats.failed++;
            stats.errors.push(`Update ${productId}: ${updateError.message}`);
          } else {
            console.log(`  Updated: ${productId}`);
            stats.updated++;
          }
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from('filaments')
            .insert(filamentData);

          if (insertError) {
            console.error(`Insert error for ${productId}:`, insertError);
            stats.failed++;
            stats.errors.push(`Insert ${productId}: ${insertError.message}`);
          } else {
            console.log(`  Created: ${productId}`);
            stats.created++;
          }
        }

      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error processing ${product.handle}:`, error);
        stats.failed++;
        stats.errors.push(`${product.handle}: ${errMsg}`);
      }
    }

    // =========================================================================
    // STEP 5: Finalize
    // =========================================================================
    console.log('Step 5: Finalizing...');

    // Update brand product counts
    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'fillamentum' });
      console.log('Updated brand product counts');
    } catch (err) {
      console.error('Error updating brand counts:', err);
    }

    // Check for duplicate hex codes
    try {
      const { data: dupes } = await supabase.rpc('find_duplicate_hexes', { 
        p_vendor: 'Fillamentum' 
      });
      if (dupes && dupes.length > 0) {
        console.log(`Found ${dupes.length} duplicate hex codes to review`);
      }
    } catch (err) {
      console.error('Error checking duplicates:', err);
    }

    // Mark brand as not actively scraping
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: false,
        last_scrape_at: new Date().toISOString()
      })
      .eq('brand_slug', 'fillamentum');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('=== Fillamentum Sync Complete ===');
    console.log(`Duration: ${duration}s`);
    console.log(`Stats: ${JSON.stringify(stats)}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration: `${duration}s`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errMsg,
        stats
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

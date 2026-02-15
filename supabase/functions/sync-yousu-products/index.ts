import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichYousuProduct,
  YOUSU_STORE_INFO,
  YOUSU_COLLECTION_URLS,
  getYousuProductUrl,
} from '../_shared/yousu-defaults.ts';
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

interface ProductData {
  title: string;
  handle: string;
  url: string;
  price: number | null;
  compareAtPrice: number | null;
  imageUrl: string | null;
  available: boolean;
  variantTitle?: string;
}

interface DuplicateHexRecord {
  id: string;
  product_line_id: string;
  product_title: string;
  color_hex: string;
  duplicate_count: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const startTime = Date.now();
  const results = {
    discovered: 0,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    console.log('=== YOUSU SYNC PIPELINE START ===');

    // Check Firecrawl availability
    if (!firecrawlKey) {
      console.warn('FIRECRAWL_API_KEY not configured - running enrichment-only mode');
    }

    // =========================================================================
    // STEP 1: FETCH EXISTING PRODUCTS OR DISCOVER NEW ONES
    // =========================================================================
    console.log('\n--- STEP 1: Fetch/Discover Products ---');

    // First, check existing products
    const { data: existingProducts, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_id, product_title, product_url, material, color_hex, finish_type, product_line_id')
      .ilike('vendor', 'yousu');

    if (fetchError) {
      throw new Error(`Failed to fetch existing products: ${fetchError.message}`);
    }

    console.log(`Found ${existingProducts?.length || 0} existing Yousu products`);

    let productsToProcess: ProductData[] = [];

    // If no existing products and Firecrawl available, discover via scraping
    if ((!existingProducts || existingProducts.length === 0) && firecrawlKey) {
      console.log('No existing products - attempting Firecrawl discovery...');
      
      try {
        // Use Firecrawl map to discover product URLs
        const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: YOUSU_STORE_INFO.baseUrl,
            search: 'filament',
            limit: 500,
            includeSubdomains: false,
          }),
        });

        if (mapResponse.ok) {
          const mapData = await mapResponse.json();
          const productUrls = (mapData.links || []).filter((url: string) => 
            url.includes('/products/') && 
            !url.includes('/collections/') &&
            !url.includes('resin') &&
            !url.includes('3d-pen')
          );
          
          console.log(`Discovered ${productUrls.length} product URLs via Firecrawl map`);
          results.discovered = productUrls.length;

          // Scrape each product page (with rate limiting)
          for (const productUrl of productUrls.slice(0, 100)) { // Limit to first 100 for safety
            try {
              await new Promise(resolve => setTimeout(resolve, 1500)); // Rate limit

              const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${firecrawlKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: productUrl,
                  formats: ['markdown', 'html'],
                  onlyMainContent: true,
                }),
              });

              if (scrapeResponse.ok) {
                const scrapeData = await scrapeResponse.json();
                const html = scrapeData.data?.html || '';
                const markdown = scrapeData.data?.markdown || '';
                
                // Extract product data from scraped content
                const titleMatch = markdown.match(/^#\s*(.+?)(?:\n|$)/m) || 
                                   html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
                const priceMatch = markdown.match(/\$\s*([\d.]+)/) ||
                                   html.match(/class="[^"]*price[^"]*"[^>]*>\s*\$?\s*([\d.]+)/i);
                const imageMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*class="[^"]*product[^"]*"/i) ||
                                   html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);

                if (titleMatch) {
                  const handle = productUrl.split('/products/').pop()?.split('?')[0] || '';
                  productsToProcess.push({
                    title: titleMatch[1].trim(),
                    handle,
                    url: productUrl,
                    price: priceMatch ? parseFloat(priceMatch[1]) : null,
                    compareAtPrice: null,
                    imageUrl: imageMatch?.[1] || null,
                    available: true,
                  });
                }
              }
            } catch (scrapeError) {
              console.warn(`Failed to scrape ${productUrl}:`, scrapeError);
              results.errors.push(`Scrape failed: ${productUrl}`);
            }
          }
        }
      } catch (mapError) {
        console.error('Firecrawl discovery failed:', mapError);
        results.errors.push(`Firecrawl discovery failed: ${mapError}`);
      }
    }

    // =========================================================================
    // STEP 2: APPLY BRAND-SPECIFIC ENRICHMENTS
    // =========================================================================
    console.log('\n--- STEP 2: Apply Brand-Specific Enrichments ---');

    // Process existing products for enrichment
    if (existingProducts && existingProducts.length > 0) {
      const enrichmentBatch: Array<{
        id: string;
        finish_type: string;
        product_line_id: string;
        material: string | null;
        is_nozzle_abrasive: boolean;
        high_speed_capable: boolean;
        nozzle_temp_min_c: number | null;
        nozzle_temp_max_c: number | null;
        bed_temp_min_c: number | null;
        bed_temp_max_c: number | null;
        color_hex: string | null;
      }> = [];

      for (const product of existingProducts) {
        const enrichment = enrichYousuProduct(
          product.product_title,
          null,
          product.material,
          null
        );

        enrichmentBatch.push({
          id: product.id,
          finish_type: enrichment.finishType,
          product_line_id: enrichment.productLineId,
          material: enrichment.material || product.material,
          is_nozzle_abrasive: enrichment.isAbrasive,
          high_speed_capable: enrichment.highSpeedCapable,
          nozzle_temp_min_c: enrichment.nozzleTempMin,
          nozzle_temp_max_c: enrichment.nozzleTempMax,
          bed_temp_min_c: enrichment.bedTempMin,
          bed_temp_max_c: enrichment.bedTempMax,
          color_hex: enrichment.colorHex ? `#${enrichment.colorHex}` : product.color_hex,
        });
      }

      // Batch update existing products
      for (const item of enrichmentBatch) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update({
            finish_type: item.finish_type,
            product_line_id: item.product_line_id,
            material: item.material,
            is_nozzle_abrasive: item.is_nozzle_abrasive,
            high_speed_capable: item.high_speed_capable,
            nozzle_temp_min_c: item.nozzle_temp_min_c,
            nozzle_temp_max_c: item.nozzle_temp_max_c,
            bed_temp_min_c: item.bed_temp_min_c,
            bed_temp_max_c: item.bed_temp_max_c,
            color_hex: item.color_hex,
            updated_at: new Date().toISOString(),
            auto_updated: true,
          })
          .eq('id', item.id);

        if (updateError) {
          console.error(`Failed to update ${item.id}:`, updateError.message);
          results.failed++;
        } else {
          results.updated++;
        }
      }

      console.log(`Updated ${results.updated} existing products with enrichments`);
    }

    // Process newly discovered products
    if (productsToProcess.length > 0) {
      console.log(`Creating ${productsToProcess.length} newly discovered products...`);

      for (const product of productsToProcess) {
        try {
          const enrichment = enrichYousuProduct(product.title, product.variantTitle);
          const productId = `yousu-${product.handle}`;

          const { error: insertError } = await supabase
            .from('filaments')
            .upsert({
              product_id: productId,
              product_title: product.title,
              product_handle: product.handle,
              product_url: product.url,
              vendor: YOUSU_STORE_INFO.vendor,
              variant_price: product.price,
              variant_compare_at_price: product.compareAtPrice,
              variant_available: product.available,
              featured_image: product.imageUrl,
              material: enrichment.material,
              finish_type: enrichment.finishType,
              product_line_id: enrichment.productLineId,
              diameter_nominal_mm: enrichment.diameterMm,
              nozzle_temp_min_c: enrichment.nozzleTempMin,
              nozzle_temp_max_c: enrichment.nozzleTempMax,
              bed_temp_min_c: enrichment.bedTempMin,
              bed_temp_max_c: enrichment.bedTempMax,
              is_nozzle_abrasive: enrichment.isAbrasive,
              high_speed_capable: enrichment.highSpeedCapable,
              color_hex: enrichment.colorHex ? `#${enrichment.colorHex}` : null,
              auto_created: true,
              auto_updated: true,
              last_scraped_at: new Date().toISOString(),
            }, {
              onConflict: 'vendor,product_id',
            });

          if (insertError) {
            console.error(`Failed to upsert ${productId}:`, insertError.message);
            results.failed++;
            results.errors.push(`Insert failed: ${productId} - ${insertError.message}`);
          } else {
            results.created++;
          }
        } catch (productError) {
          console.error(`Error processing product:`, productError);
          results.failed++;
        }
      }
    }

    // =========================================================================
    // STEP 3: UPDATE AUTOMATED_BRANDS
    // =========================================================================
    console.log('\n--- STEP 3: Update automated_brands ---');

    const { error: brandUpdateError } = await supabase
      .from('automated_brands')
      .update({
        platform_type: 'custom',
        base_url: YOUSU_STORE_INFO.baseUrl,
        products_url: YOUSU_STORE_INFO.productsUrl,
        has_api: false,
        default_currency: 'USD',
        notes: 'Custom e-commerce platform (ysfilament.com) - requires Firecrawl HTML scraping. 25+ material types, dual diameter support, specialty finishes.',
        last_scrape_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('brand_slug', 'yousu');

    if (brandUpdateError) {
      console.warn('Failed to update automated_brands:', brandUpdateError.message);
    } else {
      console.log('Updated automated_brands entry for Yousu');
    }

    // Update product counts
    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'yousu' });
      console.log('Updated product counts');
    } catch (countError) {
      console.warn('Failed to update product counts:', countError);
    }

    // =========================================================================
    // STEP 4: FIX DUPLICATE HEX CODES
    // =========================================================================
    console.log('\n--- STEP 4: Fix Duplicate Hex Codes ---');

    try {
      const { data: duplicates, error: dupeError } = await supabase
        .rpc('find_duplicate_hexes', { p_vendor: 'Yousu' }) as { 
          data: DuplicateHexRecord[] | null; 
          error: Error | null 
        };

      if (dupeError) {
        console.warn('Failed to find duplicates:', dupeError);
      } else if (duplicates && duplicates.length > 0) {
        console.log(`Found ${duplicates.length} products with duplicate hex codes`);
        
        // Group by product_line_id and hex
        const grouped = new Map<string, DuplicateHexRecord[]>();
        for (const dupe of duplicates) {
          const key = `${dupe.product_line_id}:${dupe.color_hex?.toLowerCase()}`;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(dupe);
        }

        let fixedCount = 0;
        for (const [_, group] of grouped) {
          if (group.length <= 1) continue;
          
          // Keep first, modify others slightly
          for (let i = 1; i < group.length; i++) {
            const baseHex = group[i].color_hex?.replace('#', '') || 'CCCCCC';
            const offset = (i * 3) % 256;
            const r = Math.min(255, parseInt(baseHex.slice(0, 2), 16) + offset);
            const newHex = `#${r.toString(16).padStart(2, '0')}${baseHex.slice(2)}`;

            await supabase
              .from('filaments')
              .update({ color_hex: newHex.toUpperCase() })
              .eq('id', group[i].id);
            
            fixedCount++;
          }
        }
        
        console.log(`Fixed ${fixedCount} duplicate hex codes`);
      } else {
        console.log('No duplicate hex codes found');
      }
    } catch (dupeError) {
      console.warn('Duplicate hex fix error:', dupeError);
    }

    // =========================================================================
    // COMPLETE
    // =========================================================================
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n=== YOUSU SYNC COMPLETE ===');
    console.log(`Duration: ${duration}s`);
    console.log(`Discovered: ${results.discovered}`);
    console.log(`Created: ${results.created}`);
    console.log(`Updated: ${results.updated}`);
    console.log(`Failed: ${results.failed}`);

    return new Response(JSON.stringify({
      success: true,
      duration: `${duration}s`,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Yousu sync failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

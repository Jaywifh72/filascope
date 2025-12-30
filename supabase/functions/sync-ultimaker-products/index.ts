import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichUltimakerProduct,
  normalizeUltimakerMaterial,
  getUltimakerProductUrl,
  getUltimakerTdsUrl,
  ULTIMAKER_PLA_COLORS,
  ULTIMAKER_MULTI_COLOR_MATERIALS,
  ULTIMAKER_MATERIAL_DEFAULT_COLORS,
} from '../_shared/ultimaker-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VENDOR_NAME = 'Ultimaker';
const STORE_URL = 'https://store.ultimaker.com/3d-printer-materials/s-series-materials';

// Known Ultimaker S-Series materials
const ULTIMAKER_MATERIALS = [
  'PLA', 'PLA+', 'PETG', 'ABS', 'PET-CF', 'PA', 'PA-CF',
  'CPE', 'CPE+', 'PC', 'PP', 'TPU-95A', 'PPS-CF', 'Breakaway', 'PVA'
];

interface SyncResult {
  success: boolean;
  productsDiscovered: number;
  productsCreated: number;
  productsUpdated: number;
  productsFailed: number;
  errors: string[];
  details: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  const supabase = createClient(supabaseUrl, supabaseKey);

  const result: SyncResult = {
    success: false,
    productsDiscovered: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsFailed: 0,
    errors: [],
    details: {},
  };

  try {
    const body = await req.json().catch(() => ({}));
    const cleanSlate = body.cleanSlate === true;
    const skipScrape = body.skipScrape === true;

    console.log(`[Ultimaker Sync] Starting sync - cleanSlate: ${cleanSlate}, skipScrape: ${skipScrape}`);

    // =========================================================================
    // STEP 0: Clean slate if requested
    // =========================================================================
    if (cleanSlate) {
      console.log('[Ultimaker Sync] Deleting existing Ultimaker products...');
      const { error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'ultimaker');

      if (deleteError) {
        console.error('[Ultimaker Sync] Delete error:', deleteError);
      } else {
        console.log('[Ultimaker Sync] Deleted existing products');
        result.details.deletedCount = 'cleaned';
      }
    }

    // =========================================================================
    // STEP 1: Discover products (from known materials or scrape)
    // =========================================================================
    console.log('[Ultimaker Sync] Step 1: Discovering products...');

    interface DiscoveredProduct {
      material: string;
      title: string;
      url: string;
      colors: Array<{ name: string; hex: string }>;
      price?: number;
    }

    const discoveredProducts: DiscoveredProduct[] = [];

    if (skipScrape || !firecrawlKey) {
      // Use known materials list without scraping
      console.log('[Ultimaker Sync] Using known materials list (skipScrape or no Firecrawl key)');
      
      for (const material of ULTIMAKER_MATERIALS) {
        const url = getUltimakerProductUrl(material);
        const isMultiColor = ULTIMAKER_MULTI_COLOR_MATERIALS.includes(material);
        
        // Get colors for this material
        let colors: Array<{ name: string; hex: string }>;
        if (material === 'PLA') {
          colors = ULTIMAKER_PLA_COLORS;
        } else if (isMultiColor) {
          // Other multi-color materials typically have Black, White, and sometimes Natural
          colors = [
            { name: 'Black', hex: '#1A1A1A' },
            { name: 'White', hex: '#FFFFFF' },
          ];
        } else {
          // Single color materials
          const defaultColor = ULTIMAKER_MATERIAL_DEFAULT_COLORS[material] || '#1A1A1A';
          const colorName = material.includes('CF') ? 'Black' : 
                           ['PVA', 'PP', 'CPE', 'CPE+', 'Breakaway'].includes(material) ? 'Natural' : 'Black';
          colors = [{ name: colorName, hex: defaultColor }];
        }
        
        discoveredProducts.push({
          material,
          title: `UltiMaker ${material}`,
          url: url || `https://store.ultimaker.com/ultimaker-s-series-${material.toLowerCase().replace(/[+]/g, '-plus')}-material`,
          colors,
        });
      }
    } else {
      // Scrape from Magento store
      console.log('[Ultimaker Sync] Scraping from store.ultimaker.com...');
      
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: STORE_URL,
            formats: ['markdown', 'html'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          
          console.log(`[Ultimaker Sync] Scraped ${markdown.length} chars from store`);
          
          // Parse product links from markdown
          // Ultimaker store format: [Product Name](URL)
          const productPattern = /\[([^\]]*(?:PLA|PETG|ABS|Nylon|CPE|PC|PP|TPU|PPS|PVA|Breakaway)[^\]]*)\]\(([^)]+)\)/gi;
          let match;
          
          while ((match = productPattern.exec(markdown)) !== null) {
            const title = match[1].trim();
            const url = match[2].trim();
            const material = normalizeUltimakerMaterial(title);
            
            if (material && !discoveredProducts.find(p => p.material === material)) {
              const isMultiColor = ULTIMAKER_MULTI_COLOR_MATERIALS.includes(material);
              let colors: Array<{ name: string; hex: string }>;
              
              if (material === 'PLA') {
                colors = ULTIMAKER_PLA_COLORS;
              } else if (isMultiColor) {
                colors = [
                  { name: 'Black', hex: '#1A1A1A' },
                  { name: 'White', hex: '#FFFFFF' },
                ];
              } else {
                const defaultColor = ULTIMAKER_MATERIAL_DEFAULT_COLORS[material] || '#1A1A1A';
                const colorName = material.includes('CF') ? 'Black' : 'Natural';
                colors = [{ name: colorName, hex: defaultColor }];
              }
              
              discoveredProducts.push({ material, title, url, colors });
            }
          }
          
          // If scraping didn't find products, fall back to known list
          if (discoveredProducts.length === 0) {
            console.log('[Ultimaker Sync] No products found via scrape, using known materials');
            for (const material of ULTIMAKER_MATERIALS) {
              const url = getUltimakerProductUrl(material);
              const isMultiColor = ULTIMAKER_MULTI_COLOR_MATERIALS.includes(material);
              
              let colors: Array<{ name: string; hex: string }>;
              if (material === 'PLA') {
                colors = ULTIMAKER_PLA_COLORS;
              } else if (isMultiColor) {
                colors = [
                  { name: 'Black', hex: '#1A1A1A' },
                  { name: 'White', hex: '#FFFFFF' },
                ];
              } else {
                const defaultColor = ULTIMAKER_MATERIAL_DEFAULT_COLORS[material] || '#1A1A1A';
                const colorName = material.includes('CF') ? 'Black' : 'Natural';
                colors = [{ name: colorName, hex: defaultColor }];
              }
              
              discoveredProducts.push({
                material,
                title: `UltiMaker ${material}`,
                url: url || '',
                colors,
              });
            }
          }
        } else {
          console.error('[Ultimaker Sync] Firecrawl scrape failed:', scrapeResponse.status);
          // Fall back to known list
          for (const material of ULTIMAKER_MATERIALS) {
            const url = getUltimakerProductUrl(material);
            discoveredProducts.push({
              material,
              title: `UltiMaker ${material}`,
              url: url || '',
              colors: material === 'PLA' ? ULTIMAKER_PLA_COLORS : [{ name: 'Black', hex: '#1A1A1A' }],
            });
          }
        }
      } catch (scrapeError) {
        console.error('[Ultimaker Sync] Scrape error:', scrapeError);
        // Fall back to known list
        for (const material of ULTIMAKER_MATERIALS) {
          const url = getUltimakerProductUrl(material);
          discoveredProducts.push({
            material,
            title: `UltiMaker ${material}`,
            url: url || '',
            colors: material === 'PLA' ? ULTIMAKER_PLA_COLORS : [{ name: 'Black', hex: '#1A1A1A' }],
          });
        }
      }
    }

    console.log(`[Ultimaker Sync] Discovered ${discoveredProducts.length} materials`);
    result.productsDiscovered = discoveredProducts.length;
    result.details.materials = discoveredProducts.map(p => p.material);

    // =========================================================================
    // STEP 2: Process each material and its color variants
    // =========================================================================
    console.log('[Ultimaker Sync] Step 2: Processing products with enrichment...');

    for (const product of discoveredProducts) {
      console.log(`[Ultimaker Sync] Processing ${product.material} with ${product.colors.length} colors`);
      
      for (const color of product.colors) {
        try {
          const enrichment = enrichUltimakerProduct(product.title, color.name, product.material);
          
          // Generate unique product_id per color variant
          const productId = `ultimaker-${product.material.toLowerCase().replace(/[+]/g, '-plus')}-${color.name.toLowerCase().replace(/\s+/g, '-')}`;
          const fullTitle = `UltiMaker ${product.material} - ${color.name}`;
          
          const filamentData = {
            product_id: productId,
            product_title: fullTitle,
            vendor: VENDOR_NAME,
            material: enrichment.material,
            finish_type: enrichment.finishType,
            product_line_id: enrichment.productLineId,
            product_url: product.url,
            tds_url: enrichment.tdsUrl,
            color_hex: color.hex,
            color_family: color.name,
            nozzle_temp_min_c: enrichment.nozzleTempMin,
            nozzle_temp_max_c: enrichment.nozzleTempMax,
            bed_temp_min_c: enrichment.bedTempMin,
            bed_temp_max_c: enrichment.bedTempMax,
            print_speed_max_mms: enrichment.printSpeedMax,
            is_nozzle_abrasive: enrichment.isAbrasive,
            diameter_nominal_mm: enrichment.diameterMm,
            net_weight_g: enrichment.netWeightG,
            auto_created: true,
            auto_updated: true,
            last_scraped_at: new Date().toISOString(),
            sync_status: 'synced',
          };

          // Check if product exists
          const { data: existing } = await supabase
            .from('filaments')
            .select('id')
            .eq('product_id', productId)
            .ilike('vendor', VENDOR_NAME)
            .maybeSingle();

          if (existing) {
            // Update existing
            const { error: updateError } = await supabase
              .from('filaments')
              .update({
                ...filamentData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);

            if (updateError) {
              console.error(`[Ultimaker Sync] Update error for ${productId}:`, updateError);
              result.productsFailed++;
              result.errors.push(`Update failed: ${productId} - ${updateError.message}`);
            } else {
              result.productsUpdated++;
            }
          } else {
            // Insert new
            const { error: insertError } = await supabase
              .from('filaments')
              .insert(filamentData);

            if (insertError) {
              console.error(`[Ultimaker Sync] Insert error for ${productId}:`, insertError);
              result.productsFailed++;
              result.errors.push(`Insert failed: ${productId} - ${insertError.message}`);
            } else {
              result.productsCreated++;
            }
          }
        } catch (processError) {
          console.error(`[Ultimaker Sync] Process error for ${product.material} ${color.name}:`, processError);
          result.productsFailed++;
          result.errors.push(`Process error: ${product.material} ${color.name}`);
        }
      }
    }

    console.log(`[Ultimaker Sync] Step 2 complete: ${result.productsCreated} created, ${result.productsUpdated} updated`);

    // =========================================================================
    // STEP 3: Verify TDS URLs
    // =========================================================================
    console.log('[Ultimaker Sync] Step 3: Verifying TDS URLs...');

    let tdsVerified = 0;
    let tdsFailed = 0;

    for (const material of ULTIMAKER_MATERIALS) {
      const tdsUrl = getUltimakerTdsUrl(material);
      if (tdsUrl) {
        try {
          const headResponse = await fetch(tdsUrl, { method: 'HEAD' });
          if (headResponse.ok) {
            tdsVerified++;
          } else {
            console.log(`[Ultimaker Sync] TDS not found for ${material}: ${headResponse.status}`);
            tdsFailed++;
          }
        } catch (tdsError) {
          console.log(`[Ultimaker Sync] TDS check error for ${material}:`, tdsError);
          tdsFailed++;
        }
      }
    }

    console.log(`[Ultimaker Sync] TDS verification: ${tdsVerified} verified, ${tdsFailed} failed`);
    result.details.tdsVerified = tdsVerified;
    result.details.tdsFailed = tdsFailed;

    // =========================================================================
    // STEP 4: Fix duplicate hex codes
    // =========================================================================
    console.log('[Ultimaker Sync] Step 4: Checking for duplicate hex codes...');

    try {
      const { data: duplicates, error: dupError } = await supabase
        .rpc('find_duplicate_hexes', { p_vendor: VENDOR_NAME });

      if (dupError) {
        console.error('[Ultimaker Sync] Duplicate check error:', dupError);
      } else if (duplicates && duplicates.length > 0) {
        console.log(`[Ultimaker Sync] Found ${duplicates.length} duplicate hex entries`);
        result.details.duplicateHexes = duplicates.length;
        // Duplicates within same product_line_id are expected for different colors
        // Only flag true duplicates (same color)
      } else {
        console.log('[Ultimaker Sync] No duplicate hex codes found');
      }
    } catch (dupCheckError) {
      console.error('[Ultimaker Sync] Duplicate check error:', dupCheckError);
    }

    // =========================================================================
    // STEP 5: Update brand statistics
    // =========================================================================
    console.log('[Ultimaker Sync] Step 5: Updating brand statistics...');

    try {
      // Get brand ID
      const { data: brand } = await supabase
        .from('automated_brands')
        .select('id')
        .eq('brand_slug', 'ultimaker')
        .maybeSingle();

      if (brand) {
        await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'ultimaker' });
        await supabase.rpc('update_brand_enrichment_counts', { p_brand_slug: 'ultimaker' });
        console.log('[Ultimaker Sync] Brand statistics updated');
      }
    } catch (statsError) {
      console.error('[Ultimaker Sync] Stats update error:', statsError);
    }

    // =========================================================================
    // COMPLETE
    // =========================================================================
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    result.success = true;
    result.details.durationSeconds = parseFloat(duration);

    console.log(`[Ultimaker Sync] Complete in ${duration}s:`, {
      discovered: result.productsDiscovered,
      created: result.productsCreated,
      updated: result.productsUpdated,
      failed: result.productsFailed,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Ultimaker Sync] Fatal error:', error);
    result.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    result.details.durationSeconds = ((Date.now() - startTime) / 1000);

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

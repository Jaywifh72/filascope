import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichFormFuturaProduct,
  cleanFormFuturaTitle,
  getFormFuturaColorHex,
  normalizeFormFuturaMaterial,
  extractFormFuturaWeight,
  isFormFuturaRefill,
  isFormFuturaBambuCompatible,
} from '../_shared/formfutura-defaults.ts';

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
  url: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  sku: string | null;
  ean: string | null;
  colors: string[];
  diameters: string[];
  weights: string[];
  formats: string[];
  tdsUrl: string | null;
}

// EUR to USD conversion rate
const EUR_TO_USD = 1.08;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = { discovered: 0, created: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

  try {
    const { cleanSlate = false, limit = 100, skipExisting = false } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('=== FormFutura Sync Started ===');
    console.log(`Options: cleanSlate=${cleanSlate}, limit=${limit}, skipExisting=${skipExisting}`);

    // =========================================================================
    // STEP 1: OPTIONAL CLEAN SLATE
    // =========================================================================
    let existingProductIds: Set<string> = new Set();

    if (cleanSlate) {
      console.log('Step 1: Clean slate - deleting existing FormFutura products...');
      const { data: deleted, error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'formfutura')
        .select('id');

      if (deleteError) {
        console.error('Delete error:', deleteError);
      } else {
        console.log(`Deleted ${deleted?.length || 0} existing products`);
      }
    } else {
      // Collect existing product IDs
      const { data: existing } = await supabase
        .from('filaments')
        .select('product_id')
        .ilike('vendor', 'formfutura');

      if (existing) {
        existingProductIds = new Set(existing.map(p => p.product_id).filter(Boolean));
        console.log(`Found ${existingProductIds.size} existing products`);
      }
    }

    // =========================================================================
    // STEP 2: DISCOVER PRODUCT URLS VIA FIRECRAWL
    // =========================================================================
    console.log('Step 2: Discovering product URLs...');
    let productUrls: string[] = [];

    if (firecrawlKey) {
      try {
        // Use Firecrawl map to discover all product URLs
        const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://www.formfutura.com/shop/category/filaments-1',
            limit: 500,
          }),
        });

        const mapData = await mapResponse.json();
        
        if (mapData.success && mapData.links) {
          // Filter for product URLs
          productUrls = mapData.links.filter((url: string) => 
            url.includes('/filaments/') && 
            !url.includes('/category/') &&
            !url.includes('/shop/category/')
          );
          console.log(`Firecrawl discovered ${productUrls.length} product URLs`);
        }
      } catch (error) {
        console.error('Firecrawl map error:', error);
      }
    }

    // Fallback: use known product slugs
    if (productUrls.length === 0) {
      console.log('Using fallback product slugs...');
      const FORMFUTURA_PRODUCT_SLUGS = [
        'easyfil-epla', 'premium-pla', 'volcano-pla', 'tough-pla',
        'matt-pla', 'high-gloss-pla', 'galaxy-pla', 'glow-in-the-dark-pla',
        'premium-pla-cf03', 'reform-rpla', 'reform-organic-rpla', 'bulk-pla',
        'hdglass', 'hdglass-blinded', 'reform-rpetg', 'bulk-petg',
        'apollox', 'apollox-cf10', 'clearscent-abs',
        'styx-pa6', 'styx-pa6-gf30', 'luvocom-3f-paht-cf-9891',
        'centaur-pp', 'python-flex-90a', 'python-flex-98a',
        'easywood', 'biofil-pcl', 'easyfil-hips', 'helios-pva',
        'colormorph-high-gloss-pla',
      ];
      productUrls = FORMFUTURA_PRODUCT_SLUGS.map(slug => 
        `https://www.formfutura.com/filaments/${slug}`
      );
    }

    // Deduplicate and limit
    productUrls = [...new Set(productUrls)].slice(0, limit);
    stats.discovered = productUrls.length;
    console.log(`Processing ${productUrls.length} product URLs`);

    // =========================================================================
    // STEP 3: SCRAPE INDIVIDUAL PRODUCT PAGES
    // =========================================================================
    console.log('Step 3: Scraping product pages...');
    const products: ProductData[] = [];

    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      const slug = url.split('/filaments/')[1]?.split('?')[0] || '';
      
      console.log(`[${i + 1}/${productUrls.length}] Scraping: ${slug}`);

      try {
        if (!firecrawlKey) {
          console.log('No Firecrawl key, skipping scrape');
          continue;
        }

        // Rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown', 'html'],
            waitFor: 3000,
          }),
        });

        const scrapeData = await scrapeResponse.json();

        if (!scrapeData.success) {
          console.error(`Scrape failed for ${slug}:`, scrapeData.error);
          stats.failed++;
          continue;
        }

        const markdown = scrapeData.data?.markdown || '';
        const html = scrapeData.data?.html || '';
        const metadata = scrapeData.data?.metadata || {};

        // Extract title
        let title = metadata.title || '';
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match) {
          title = h1Match[1].trim();
        }

        // Extract price (EUR format with comma)
        let price: number | null = null;
        const priceMatch = markdown.match(/€\s*([\d,]+(?:\.\d{2})?)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(',', '.'));
        }

        // Extract image
        let imageUrl = metadata.ogImage || null;
        const imgMatch = html.match(/og:image['"]\s*content=['"]([^'"]+)['"]/i);
        if (imgMatch) {
          imageUrl = imgMatch[1];
        }

        // Extract SKU
        let sku: string | null = null;
        const skuMatch = markdown.match(/SKU\s*:?\s*([A-Z0-9-]+)/i);
        if (skuMatch) {
          sku = skuMatch[1];
        }

        // Extract EAN
        let ean: string | null = null;
        const eanMatch = markdown.match(/EAN\s*:?\s*(\d{13})/i);
        if (eanMatch) {
          ean = eanMatch[1];
        }

        // Extract TDS URL
        let tdsUrl: string | null = null;
        const tdsMatch = html.match(/href=['"]([^'"]*(?:tds|datasheet|technical)[^'"]*\.pdf)['"]/i) ||
                        html.match(/href=['"]([^'"]*\/web\/content\/\d+)['"]/i);
        if (tdsMatch) {
          tdsUrl = tdsMatch[1];
          if (tdsUrl && tdsUrl.startsWith('/')) {
            tdsUrl = `https://www.formfutura.com${tdsUrl}`;
          }
        }

        // Extract color options
        const colors: string[] = [];
        const colorMatches = markdown.matchAll(/(?:color|colour)[:\s]*([A-Za-z\s]+?)(?:\n|,|\||$)/gi);
        for (const match of colorMatches) {
          const color = match[1].trim();
          if (color && color.length > 2 && color.length < 30) {
            colors.push(color);
          }
        }

        // Also try to extract from variant selectors in HTML
        const variantMatches = html.matchAll(/data-value-name=['"]([^'"]+)['"]/g);
        for (const match of variantMatches) {
          const value = match[1].trim();
          // Check if it looks like a color (not a number/weight/diameter)
          if (value && !/^\d/.test(value) && !/mm|kg|g\b/i.test(value)) {
            if (!colors.includes(value)) {
              colors.push(value);
            }
          }
        }

        // Extract diameter options
        const diameters: string[] = [];
        if (/1\.75\s*mm/i.test(markdown)) diameters.push('1.75');
        if (/2\.85\s*mm/i.test(markdown)) diameters.push('2.85');
        if (/3\.00?\s*mm/i.test(markdown)) diameters.push('2.85'); // 3mm = 2.85mm

        // Extract weight options
        const weights: string[] = [];
        const weightMatches = markdown.matchAll(/(\d+(?:\.\d+)?)\s*(g|kg)\b/gi);
        for (const match of weightMatches) {
          const value = match[1];
          const unit = match[2].toLowerCase();
          const grams = unit === 'kg' ? parseFloat(value) * 1000 : parseInt(value, 10);
          if (grams >= 100 && grams <= 20000) {
            weights.push(`${grams}g`);
          }
        }

        // Extract format options (Spool, ReFill, Bambu)
        const formats: string[] = ['Spool'];
        if (/refill|coil/i.test(markdown)) formats.push('ReFill');
        if (/bambu/i.test(markdown)) formats.push('Bambu');

        products.push({
          url,
          slug,
          title,
          price,
          currency: 'EUR',
          imageUrl,
          sku,
          ean,
          colors: colors.length > 0 ? colors : ['Standard'],
          diameters: diameters.length > 0 ? diameters : ['1.75'],
          weights: [...new Set(weights)],
          formats,
          tdsUrl,
        });

      } catch (error) {
        console.error(`Error scraping ${slug}:`, error);
        stats.failed++;
        stats.errors.push(`${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Scraped ${products.length} products with data`);

    // =========================================================================
    // STEP 4: ENRICH AND UPSERT PRODUCTS
    // =========================================================================
    console.log('Step 4: Enriching and upserting products...');

    for (const product of products) {
      try {
        // Explode by color (create one row per color)
        const colorsToProcess = product.colors.length > 0 ? product.colors : ['Standard'];

        for (const color of colorsToProcess) {
          const productId = `${product.slug}-${color.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

          // Skip if exists and skipExisting is true
          if (skipExisting && existingProductIds.has(productId)) {
            stats.skipped++;
            continue;
          }

          // Enrich the product
          const enrichment = enrichFormFuturaProduct(product.title);

          // Get color hex
          const colorHex = getFormFuturaColorHex(color);

          // Get weight
          const weightG = extractFormFuturaWeight(product.title, product.weights[0]);

          // Check format flags
          const isRefill = isFormFuturaRefill(product.title);
          const isBambuCompatible = isFormFuturaBambuCompatible(product.title);

          // Convert EUR to USD
          const priceUsd = product.price ? Math.round(product.price * EUR_TO_USD * 100) / 100 : null;

          // Clean title and add color
          let cleanTitle = cleanFormFuturaTitle(product.title);
          if (color !== 'Standard' && !cleanTitle.toLowerCase().includes(color.toLowerCase())) {
            cleanTitle = `${cleanTitle} - ${color}`;
          }

          // Determine diameter
          const diameter = product.diameters.includes('2.85') ? 2.85 : 1.75;

          // Prepare filament data
          const filamentData = {
            product_id: productId,
            product_title: cleanTitle,
            vendor: 'FormFutura',
            product_url: product.url,
            featured_image: product.imageUrl,
            variant_price: priceUsd,
            variant_available: true,
            material: enrichment.material,
            finish_type: enrichment.finishType,
            product_line_id: enrichment.productLineId,
            tds_url: product.tdsUrl || enrichment.tdsUrl,
            color_hex: colorHex,
            color_family: color,
            nozzle_temp_min_c: enrichment.nozzleTempMin,
            nozzle_temp_max_c: enrichment.nozzleTempMax,
            bed_temp_min_c: enrichment.bedTempMin,
            bed_temp_max_c: enrichment.bedTempMax,
            print_speed_max_mms: enrichment.printSpeedMax,
            is_nozzle_abrasive: enrichment.isAbrasive,
            high_speed_capable: enrichment.highSpeedCapable,
            diameter_nominal_mm: diameter,
            net_weight_g: weightG,
            mpn: product.sku,
            ean: product.ean,
            spool_material: isRefill ? 'Cardboard' : 'Plastic',
            spool_ams_fit: isBambuCompatible,
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
            .ilike('vendor', 'formfutura')
            .maybeSingle();

          if (existing) {
            // Update
            const { error: updateError } = await supabase
              .from('filaments')
              .update(filamentData)
              .eq('id', existing.id);

            if (updateError) {
              console.error(`Update error for ${productId}:`, updateError);
              stats.failed++;
            } else {
              stats.updated++;
            }
          } else {
            // Insert
            const { error: insertError } = await supabase
              .from('filaments')
              .insert(filamentData);

            if (insertError) {
              console.error(`Insert error for ${productId}:`, insertError);
              stats.failed++;
            } else {
              stats.created++;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${product.slug}:`, error);
        stats.failed++;
        stats.errors.push(`${product.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // =========================================================================
    // STEP 5: FINALIZE
    // =========================================================================
    console.log('Step 5: Finalizing sync...');

    // Update brand product counts
    try {
      await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'formfutura' });
    } catch (error) {
      console.error('Error updating brand counts:', error);
    }

    // Check for duplicate hex codes
    try {
      const { data: dupes } = await supabase.rpc('find_duplicate_hexes', { p_vendor: 'FormFutura' });
      if (dupes && dupes.length > 0) {
        console.log(`Found ${dupes.length} duplicate hex codes to review`);
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    }

    // Mark brand as not actively scraping
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', 'formfutura');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('=== FormFutura Sync Complete ===');
    console.log(`Duration: ${duration}s`);
    console.log(`Stats: ${JSON.stringify(stats)}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration: `${duration}s`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('FormFutura sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stats,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

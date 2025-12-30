import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichFiberlogyProduct,
  getFiberlogyColorHex,
  cleanFiberlogyTitle,
  normalizeFiberlogyMaterial,
  isDiameter285,
  getWeightVariant,
} from '../_shared/fiberlogy-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncOptions {
  dryRun?: boolean;
  limit?: number;
  skipScrape?: boolean;
  tasks?: string[];
}

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    discovered: number;
    created: number;
    updated: number;
    enriched: number;
    errors: number;
  };
  errors: string[];
}

interface FiberlogyProduct {
  url: string;
  title: string;
  price: number | null;
  image: string | null;
  colors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const options: SyncOptions = await req.json().catch(() => ({}));
    const { dryRun = false, limit, tasks = ['sync', 'scrape', 'enrich', 'hexfix'] } = options;

    const result: SyncResult = {
      success: true,
      message: '',
      stats: { discovered: 0, created: 0, updated: 0, enriched: 0, errors: 0 },
      errors: [],
    };

    console.log(`[Fiberlogy] Starting sync with options:`, { dryRun, limit, tasks });

    // ========== STEP 1: BASE SYNC VIA FIRECRAWL ==========
    if (tasks.includes('sync') && firecrawlKey) {
      console.log('[Fiberlogy] Step 1: Fetching products via Firecrawl...');
      
      const collectionUrl = 'https://fiberlogy.com/en_US/c/Filaments/117';
      const products: FiberlogyProduct[] = [];
      
      try {
        // Scrape the collection page
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: collectionUrl,
            formats: ['html', 'links'],
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          throw new Error(`Firecrawl error: ${scrapeResponse.status}`);
        }

        const scrapeData = await scrapeResponse.json();
        const html = scrapeData.data?.html || scrapeData.html || '';
        const links = scrapeData.data?.links || scrapeData.links || [];

        // Extract product URLs from links
        const productUrls = links.filter((link: string) => 
          link.includes('/p/') && link.includes('fiberlogy.com')
        ).slice(0, limit || 100);

        console.log(`[Fiberlogy] Found ${productUrls.length} product URLs`);

        // Extract basic product info from collection page HTML
        const productMatches = html.matchAll(
          /<a[^>]*href="([^"]*\/p\/[^"]*)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[\s\S]*?<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]*)</gi
        );

        for (const match of productMatches) {
          const [, url, image, title, priceText] = match;
          if (url && title) {
            const price = parseFloat(priceText?.replace(/[^\d.]/g, '') || '0') || null;
            products.push({
              url: url.startsWith('http') ? url : `https://fiberlogy.com${url}`,
              title: title.trim(),
              price,
              image: image?.startsWith('http') ? image : (image ? `https://fiberlogy.com${image}` : null),
              colors: [],
            });
          }
        }

        // If we didn't extract enough from HTML, use the links
        if (products.length < 10) {
          for (const url of productUrls) {
            if (!products.find(p => p.url === url)) {
              products.push({
                url,
                title: extractTitleFromUrl(url),
                price: null,
                image: null,
                colors: [],
              });
            }
          }
        }

        result.stats.discovered = products.length;
        console.log(`[Fiberlogy] Discovered ${products.length} products`);

      } catch (error: unknown) {
        console.error('[Fiberlogy] Error fetching collection:', error);
        result.errors.push(`Collection fetch error: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Process each product
      for (const product of products) {
        try {
          const material = normalizeFiberlogyMaterial(product.title);
          const enrichment = enrichFiberlogyProduct(product.title, material);
          const colorHex = getFiberlogyColorHex(extractColorFromTitle(product.title));
          
          // Determine weight in grams
          const weightVariant = getWeightVariant(product.title);
          let weightGrams = 850; // Default Fiberlogy weight
          if (weightVariant === '2.5kg') weightGrams = 2500;
          else if (weightVariant === '0.5kg') weightGrams = 500;
          else if (weightVariant === '0.75kg') weightGrams = 750;
          
          // Determine diameter
          const diameter = isDiameter285(product.title) ? 2.85 : 1.75;

          const productData = {
            product_id: `fiberlogy-${slugify(product.title)}`,
            product_title: product.title,
            vendor: 'Fiberlogy',
            product_url: product.url,
            featured_image: product.image,
            variant_price: product.price,
            material: enrichment.material,
            finish_type: enrichment.finishType !== 'Standard' ? enrichment.finishType : null,
            product_line_id: enrichment.productLineId,
            color_hex: colorHex ? `#${colorHex}` : null,
            nozzle_temp_min_c: enrichment.nozzleTempMin,
            nozzle_temp_max_c: enrichment.nozzleTempMax,
            bed_temp_min_c: enrichment.bedTempMin,
            bed_temp_max_c: enrichment.bedTempMax,
            tds_url: enrichment.tdsUrl,
            is_nozzle_abrasive: enrichment.isAbrasive || null,
            diameter_nominal_mm: diameter,
            net_weight_g: weightGrams,
            auto_created: true,
            auto_updated: true,
            last_scraped_at: new Date().toISOString(),
            sync_status: 'synced',
          };

          if (dryRun) {
            console.log('[Fiberlogy] DRY RUN - would upsert:', productData.product_title);
            result.stats.created++;
            continue;
          }

          // Check if exists
          const { data: existing } = await supabase
            .from('filaments')
            .select('id')
            .eq('product_id', productData.product_id)
            .maybeSingle();

          if (existing) {
            const { error } = await supabase
              .from('filaments')
              .update(productData)
              .eq('id', existing.id);
            
            if (error) throw error;
            result.stats.updated++;
          } else {
            const { error } = await supabase
              .from('filaments')
              .insert(productData);
            
            if (error) throw error;
            result.stats.created++;
          }

        } catch (error: unknown) {
          console.error(`[Fiberlogy] Error processing ${product.title}:`, error);
          result.errors.push(`${product.title}: ${error instanceof Error ? error.message : String(error)}`);
          result.stats.errors++;
        }
      }
    }

    // ========== STEP 2: FIRECRAWL DETAIL SCRAPING ==========
    if (tasks.includes('scrape') && firecrawlKey && !options.skipScrape) {
      console.log('[Fiberlogy] Step 2: Scraping product details...');
      
      // Get products needing detail scraping
      const { data: toScrape } = await supabase
        .from('filaments')
        .select('id, product_url, product_title')
        .ilike('vendor', 'fiberlogy')
        .is('tds_url', null)
        .limit(limit || 20);

      if (toScrape && toScrape.length > 0) {
        console.log(`[Fiberlogy] Scraping details for ${toScrape.length} products`);
        
        for (const filament of toScrape) {
          if (!filament.product_url) continue;

          try {
            await new Promise(r => setTimeout(r, 1500)); // Rate limit

            const detailResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: filament.product_url,
                formats: ['html'],
                waitFor: 2000,
              }),
            });

            if (!detailResponse.ok) continue;

            const detailData = await detailResponse.json();
            const html = detailData.data?.html || detailData.html || '';

            const specs = extractSpecsFromHtml(html);
            
            if (Object.keys(specs).length > 0 && !dryRun) {
              await supabase
                .from('filaments')
                .update({
                  ...specs,
                  last_scraped_at: new Date().toISOString(),
                })
                .eq('id', filament.id);
              
              result.stats.enriched++;
            }

          } catch (error) {
            console.error(`[Fiberlogy] Detail scrape error for ${filament.product_title}:`, error);
          }
        }
      }
    }

    // ========== STEP 3: BRAND-SPECIFIC ENRICHMENTS ==========
    if (tasks.includes('enrich')) {
      console.log('[Fiberlogy] Step 3: Applying brand-specific enrichments...');

      const { data: toEnrich } = await supabase
        .from('filaments')
        .select('id, product_title, material, tds_url')
        .ilike('vendor', 'fiberlogy')
        .or('product_line_id.is.null,finish_type.is.null,material.is.null')
        .limit(limit || 200);

      if (toEnrich && toEnrich.length > 0) {
        console.log(`[Fiberlogy] Enriching ${toEnrich.length} products`);
        
        for (const filament of toEnrich) {
          const enrichment = enrichFiberlogyProduct(
            filament.product_title,
            filament.material,
            filament.tds_url
          );

          if (!dryRun) {
            await supabase
              .from('filaments')
              .update({
                product_line_id: enrichment.productLineId,
                finish_type: enrichment.finishType !== 'Standard' ? enrichment.finishType : null,
                material: enrichment.material,
                tds_url: enrichment.tdsUrl || filament.tds_url,
                nozzle_temp_min_c: enrichment.nozzleTempMin,
                nozzle_temp_max_c: enrichment.nozzleTempMax,
                bed_temp_min_c: enrichment.bedTempMin,
                bed_temp_max_c: enrichment.bedTempMax,
                is_nozzle_abrasive: enrichment.isAbrasive || null,
              })
              .eq('id', filament.id);
            
            result.stats.enriched++;
          }
        }
      }
    }

    // ========== STEP 4: DUPLICATE HEX FIX ==========
    if (tasks.includes('hexfix')) {
      console.log('[Fiberlogy] Step 4: Fixing duplicate hex codes...');

      const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', {
        p_vendor: 'Fiberlogy'
      });

      if (duplicates && duplicates.length > 0 && !dryRun) {
        console.log(`[Fiberlogy] Found ${duplicates.length} duplicate hex entries`);
        
        const grouped: Record<string, typeof duplicates> = {};
        for (const dup of duplicates) {
          const key = `${dup.product_line_id}:${dup.color_hex?.toLowerCase()}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(dup);
        }

        for (const entries of Object.values(grouped)) {
          if (entries.length <= 1) continue;
          
          for (let i = 1; i < entries.length; i++) {
            const baseHex = entries[i].color_hex?.replace('#', '') || 'CCCCCC';
            const variation = Math.min(255, parseInt(baseHex.slice(0, 2), 16) + i * 3);
            const newHex = `#${variation.toString(16).padStart(2, '0')}${baseHex.slice(2)}`;
            
            await supabase
              .from('filaments')
              .update({ color_hex: newHex.toUpperCase() })
              .eq('id', entries[i].id);
          }
        }
      }
    }

    // ========== STEP 5: TDS PARSING (SKIP - HANDLED SEPARATELY) ==========
    console.log('[Fiberlogy] Step 5: TDS parsing skipped - trigger parse-filament-tds separately');

    result.message = `Fiberlogy sync complete: ${result.stats.created} created, ${result.stats.updated} updated, ${result.stats.enriched} enriched`;
    console.log(`[Fiberlogy] ${result.message}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[Fiberlogy] Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions
function extractColorFromTitle(title: string): string {
  const colorPatterns = [
    /\b(white|black|red|blue|green|yellow|orange|purple|pink|gray|grey|silver|gold|bronze|copper)\b/i,
    /\b(pastel\s+\w+)\b/i,
    /\b(neon\s+\w+)\b/i,
    /\b(ruby|onyx|aurora|vertigo|inox|graphite|midnight\s+sky)\b/i,
    /\b(skintone\s*#?\d+)\b/i,
  ];
  
  for (const pattern of colorPatterns) {
    const match = title.match(pattern);
    if (match) return match[1];
  }
  return '';
}

function extractSpecsFromHtml(html: string): Record<string, unknown> {
  const specs: Record<string, unknown> = {};
  
  // Extract TDS URL
  const tdsMatch = html.match(/href="([^"]*\.pdf[^"]*)"/i);
  if (tdsMatch && tdsMatch[1].toLowerCase().includes('tds')) {
    specs.tds_url = tdsMatch[1].startsWith('http') ? tdsMatch[1] : `https://fiberlogy.com${tdsMatch[1]}`;
  }
  
  // Extract nozzle temperature
  const nozzleMatch = html.match(/nozzle[^:]*:\s*(\d+)\s*[-–]\s*(\d+)\s*°?C/i);
  if (nozzleMatch) {
    specs.nozzle_temp_min_c = parseInt(nozzleMatch[1]);
    specs.nozzle_temp_max_c = parseInt(nozzleMatch[2]);
  }
  
  // Extract bed temperature
  const bedMatch = html.match(/bed[^:]*:\s*(\d+)\s*[-–]\s*(\d+)\s*°?C/i);
  if (bedMatch) {
    specs.bed_temp_min_c = parseInt(bedMatch[1]);
    specs.bed_temp_max_c = parseInt(bedMatch[2]);
  }
  
  // Extract density
  const densityMatch = html.match(/density[^:]*:\s*([\d.]+)\s*g\/?cm/i);
  if (densityMatch) {
    specs.density_g_cm3 = parseFloat(densityMatch[1]);
  }

  return specs;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}

function extractTitleFromUrl(url: string): string {
  const match = url.match(/\/p\/([^\/]+)/);
  if (match) {
    return match[1]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
  return 'Unknown Product';
}

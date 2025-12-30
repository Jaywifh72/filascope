import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  enrichGizmoDocksProduct,
  GIZMODORKS_STORE_INFO,
  getGizmoDocksColorHex,
} from '../_shared/gizmodorks-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncOptions {
  cleanSlate?: boolean;
  limit?: number;
  dryRun?: boolean;
}

interface ProductVariant {
  title: string;
  color: string;
  diameter: number;
  price: number;
  productUrl: string;
  imageUrl: string | null;
  productId: string;
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

  try {
    const options: SyncOptions = await req.json().catch(() => ({}));
    const { cleanSlate = false, limit = 500, dryRun = false } = options;

    console.log(`[Gizmo Dorks Sync] Starting sync with options:`, { cleanSlate, limit, dryRun });

    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    // Step 1: Clean slate if requested
    let deletedCount = 0;
    if (cleanSlate && !dryRun) {
      console.log('[Gizmo Dorks Sync] Clean slate: deleting existing products...');
      const { data: deleted, error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', GIZMODORKS_STORE_INFO.vendor)
        .select('id');

      if (deleteError) {
        console.error('[Gizmo Dorks Sync] Delete error:', deleteError);
      } else {
        deletedCount = deleted?.length || 0;
        console.log(`[Gizmo Dorks Sync] Deleted ${deletedCount} existing products`);
      }
    }

    // Step 2: Discover product URLs via Firecrawl map
    console.log('[Gizmo Dorks Sync] Discovering products via Firecrawl map...');
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: GIZMODORKS_STORE_INFO.productsUrl,
        limit: 200,
      }),
    });

    const mapData = await mapResponse.json();
    if (!mapData.success) {
      throw new Error(`Firecrawl map failed: ${mapData.error || 'Unknown error'}`);
    }

    // Filter for filament product URLs
    const productUrls: string[] = (mapData.links || []).filter((url: string) => {
      return url.includes('gizmodorks.com/') && 
             (url.includes('filament') || url.includes('pla') || url.includes('abs') || 
              url.includes('petg') || url.includes('tpu') || url.includes('nylon')) &&
             !url.includes('/cart') &&
             !url.includes('/account') &&
             !url.includes('/checkout') &&
             !url.includes('?') &&
             !url.endsWith('/');
    });

    console.log(`[Gizmo Dorks Sync] Discovered ${productUrls.length} potential product URLs`);

    // Step 3: Scrape each product page
    const allVariants: ProductVariant[] = [];
    let processedCount = 0;
    let errorCount = 0;

    for (const productUrl of productUrls.slice(0, limit)) {
      try {
        console.log(`[Gizmo Dorks Sync] Scraping: ${productUrl}`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

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

        const scrapeData = await scrapeResponse.json();
        if (!scrapeData.success) {
          console.warn(`[Gizmo Dorks Sync] Failed to scrape ${productUrl}: ${scrapeData.error}`);
          errorCount++;
          continue;
        }

        const content = scrapeData.data?.markdown || '';
        const html = scrapeData.data?.html || '';
        const metadata = scrapeData.data?.metadata || {};

        // Extract product title
        const title = metadata.title || extractTitleFromContent(content);
        if (!title) {
          console.warn(`[Gizmo Dorks Sync] No title found for ${productUrl}`);
          continue;
        }

        // Skip non-filament products
        if (!isFilamentProduct(title)) {
          console.log(`[Gizmo Dorks Sync] Skipping non-filament: ${title}`);
          continue;
        }

        // Extract price
        const price = extractPrice(content, html);

        // Extract image URL
        const imageUrl = extractImageUrl(html, metadata);

        // Extract colors from dropdown/options
        const colors = extractColorOptions(content, html);

        // Extract diameter options
        const diameters = extractDiameterOptions(content, html);

        // Generate slug from URL
        const urlSlug = productUrl.split('/').pop()?.replace(/\/$/, '') || 'unknown';

        // Create variants (color x diameter explosion)
        if (colors.length > 0 && diameters.length > 0) {
          for (const color of colors) {
            for (const diameter of diameters) {
              const variantId = `${urlSlug}_${color.toLowerCase().replace(/\s+/g, '-')}_${diameter}mm`;
              allVariants.push({
                title,
                color,
                diameter,
                price,
                productUrl,
                imageUrl,
                productId: variantId,
              });
            }
          }
        } else if (colors.length > 0) {
          // Only colors, use default diameters
          for (const color of colors) {
            for (const diameter of GIZMODORKS_STORE_INFO.diameters) {
              const variantId = `${urlSlug}_${color.toLowerCase().replace(/\s+/g, '-')}_${diameter}mm`;
              allVariants.push({
                title,
                color,
                diameter,
                price,
                productUrl,
                imageUrl,
                productId: variantId,
              });
            }
          }
        } else {
          // No colors found, extract color from title
          const titleColor = extractColorFromTitle(title);
          for (const diameter of diameters.length > 0 ? diameters : GIZMODORKS_STORE_INFO.diameters) {
            const variantId = `${urlSlug}_${titleColor.toLowerCase().replace(/\s+/g, '-')}_${diameter}mm`;
            allVariants.push({
              title,
              color: titleColor,
              diameter,
              price,
              productUrl,
              imageUrl,
              productId: variantId,
            });
          }
        }

        processedCount++;
      } catch (error) {
        console.error(`[Gizmo Dorks Sync] Error scraping ${productUrl}:`, error);
        errorCount++;
      }
    }

    console.log(`[Gizmo Dorks Sync] Created ${allVariants.length} variants from ${processedCount} products`);

    // Step 4: Enrich and upsert products
    let upsertedCount = 0;
    const upsertErrors: string[] = [];

    if (!dryRun && allVariants.length > 0) {
      // Process in batches
      const batchSize = 50;
      for (let i = 0; i < allVariants.length; i += batchSize) {
        const batch = allVariants.slice(i, i + batchSize);
        
        const filaments = batch.map(variant => {
          const enriched = enrichGizmoDocksProduct(variant.title, variant.color);
          
          return {
            product_id: variant.productId,
            product_title: variant.title,
            vendor: GIZMODORKS_STORE_INFO.vendor,
            material: enriched.material,
            finish_type: enriched.finishType,
            product_line_id: enriched.productLineId,
            color_hex: enriched.colorHex || getGizmoDocksColorHex(variant.color),
            color_family: normalizeColorFamily(variant.color),
            variant_price: variant.price,
            product_url: variant.productUrl,
            featured_image: variant.imageUrl,
            diameter_nominal_mm: variant.diameter,
            net_weight_g: GIZMODORKS_STORE_INFO.defaultWeight,
            nozzle_temp_min_c: enriched.nozzleTempMin,
            nozzle_temp_max_c: enriched.nozzleTempMax,
            bed_temp_min_c: enriched.bedTempMin,
            bed_temp_max_c: enriched.bedTempMax,
            print_speed_max_mms: enriched.printSpeedMax,
            is_nozzle_abrasive: enriched.isAbrasive,
            tds_url: null, // No TDS available
            auto_created: true,
            auto_updated: true,
            last_scraped_at: new Date().toISOString(),
          };
        });

        const { data: upserted, error: upsertError } = await supabase
          .from('filaments')
          .upsert(filaments, { onConflict: 'product_id' })
          .select('id');

        if (upsertError) {
          console.error(`[Gizmo Dorks Sync] Upsert error:`, upsertError);
          upsertErrors.push(upsertError.message);
        } else {
          upsertedCount += upserted?.length || 0;
        }
      }

      console.log(`[Gizmo Dorks Sync] Upserted ${upsertedCount} products`);
    }

    // Step 5: Update automated_brands
    if (!dryRun) {
      const { error: brandError } = await supabase
        .from('automated_brands')
        .update({
          product_count: upsertedCount,
          active_product_count: upsertedCount,
          last_scrape_at: new Date().toISOString(),
          successful_scrapes: 1,
        })
        .eq('brand_slug', 'gizmo-dorks');

      if (brandError) {
        console.warn('[Gizmo Dorks Sync] Failed to update automated_brands:', brandError);
      }

      // Fix duplicate hex codes
      try {
        const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', {
          p_vendor: GIZMODORKS_STORE_INFO.vendor
        });

        if (duplicates && duplicates.length > 0) {
          console.log(`[Gizmo Dorks Sync] Found ${duplicates.length} duplicate hex groups to fix`);
          // The RPC handles the fixing
        }
      } catch (e) {
        console.warn('[Gizmo Dorks Sync] Could not check for duplicate hexes:', e);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    const result = {
      success: true,
      vendor: GIZMODORKS_STORE_INFO.vendor,
      stats: {
        productsDiscovered: productUrls.length,
        productsProcessed: processedCount,
        variantsCreated: allVariants.length,
        productsUpserted: upsertedCount,
        productsDeleted: deletedCount,
        errors: errorCount,
        upsertErrors: upsertErrors.length,
        durationSeconds: duration,
      },
      dryRun,
    };

    console.log(`[Gizmo Dorks Sync] Completed in ${duration}s:`, result.stats);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Gizmo Dorks Sync] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractTitleFromContent(content: string): string | null {
  // Try to find title in markdown
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();

  // Try first line
  const firstLine = content.split('\n')[0];
  if (firstLine && firstLine.length < 200) return firstLine.trim();

  return null;
}

function isFilamentProduct(title: string): boolean {
  const t = title.toLowerCase();
  return (
    (t.includes('filament') || t.includes('pla') || t.includes('abs') || 
     t.includes('petg') || t.includes('tpu') || t.includes('nylon') ||
     t.includes('hips') || t.includes('pva') || t.includes('polycarbonate')) &&
    !t.includes('nozzle') && 
    !t.includes('bed') && 
    !t.includes('extruder') &&
    !t.includes('hotend')
  );
}

function extractPrice(content: string, html: string): number {
  // Try various price patterns
  const patterns = [
    /\$(\d+\.?\d*)/,
    /USD\s*(\d+\.?\d*)/i,
    /price[:\s]*\$?(\d+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern) || html.match(pattern);
    if (match) {
      const price = parseFloat(match[1]);
      if (price > 5 && price < 200) return price;
    }
  }

  return 0;
}

function extractImageUrl(html: string, metadata: any): string | null {
  // Try metadata first
  if (metadata.ogImage) return metadata.ogImage;

  // Try to find product image in HTML
  const imgMatch = html.match(/src=["']([^"']*(?:cdn|product|filament)[^"']*\.(?:jpg|jpeg|png|webp))["']/i);
  if (imgMatch) return imgMatch[1];

  return null;
}

function extractColorOptions(content: string, html: string): string[] {
  const colors: string[] = [];
  
  // Look for color dropdown/select options
  const optionMatches = html.matchAll(/<option[^>]*value=["']([^"']+)["'][^>]*>([^<]+)<\/option>/gi);
  for (const match of optionMatches) {
    const value = match[2].trim();
    if (isLikelyColor(value)) {
      colors.push(value);
    }
  }

  // Look for color swatches or radio buttons
  const swatchMatches = html.matchAll(/data-color=["']([^"']+)["']/gi);
  for (const match of swatchMatches) {
    colors.push(match[1].trim());
  }

  // Look for color mentions in content
  if (colors.length === 0) {
    const colorSection = content.match(/colors?:?\s*([^\n]+)/i);
    if (colorSection) {
      const possibleColors = colorSection[1].split(/[,|]/);
      for (const c of possibleColors) {
        const trimmed = c.trim();
        if (isLikelyColor(trimmed)) {
          colors.push(trimmed);
        }
      }
    }
  }

  return [...new Set(colors)];
}

function extractDiameterOptions(content: string, html: string): number[] {
  const diameters: number[] = [];

  // Look for diameter mentions
  if (/1\.75\s*mm/i.test(content) || /1\.75\s*mm/i.test(html)) {
    diameters.push(1.75);
  }
  if (/3\s*mm|2\.85\s*mm/i.test(content) || /3\s*mm|2\.85\s*mm/i.test(html)) {
    diameters.push(2.85);
  }

  return diameters;
}

function extractColorFromTitle(title: string): string {
  const colorKeywords = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
    'pink', 'grey', 'gray', 'brown', 'gold', 'silver', 'bronze', 'copper',
    'translucent', 'clear', 'natural', 'glow', 'fluorescent', 'silk', 'rainbow'
  ];

  const lowerTitle = title.toLowerCase();
  for (const color of colorKeywords) {
    if (lowerTitle.includes(color)) {
      // Capitalize first letter
      return color.charAt(0).toUpperCase() + color.slice(1);
    }
  }

  return 'Standard';
}

function isLikelyColor(value: string): boolean {
  const colorKeywords = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
    'pink', 'grey', 'gray', 'brown', 'gold', 'silver', 'bronze', 'copper',
    'translucent', 'clear', 'natural', 'glow', 'fluorescent', 'silk',
    'dark', 'light', 'navy', 'sky', 'hot', 'lime', 'grass', 'rainbow',
    'violet', 'beige', 'rose', 'lava', 'frost', 'stainless', 'wood'
  ];

  const lower = value.toLowerCase();
  
  // Skip size/diameter values
  if (/mm|kg|gram|1\.75|2\.85|3mm/i.test(value)) return false;
  
  // Skip if too long (probably not a color)
  if (value.length > 30) return false;

  return colorKeywords.some(kw => lower.includes(kw));
}

function normalizeColorFamily(color: string): string | null {
  const lower = color.toLowerCase();
  
  const families: Record<string, string[]> = {
    'Black': ['black'],
    'White': ['white', 'natural', 'clear'],
    'Red': ['red', 'lava', 'crimson', 'maroon'],
    'Blue': ['blue', 'navy', 'sky', 'azure', 'cobalt', 'teal'],
    'Green': ['green', 'lime', 'grass', 'olive', 'mint', 'forest'],
    'Yellow': ['yellow', 'gold', 'lemon'],
    'Orange': ['orange', 'tangerine', 'coral'],
    'Purple': ['purple', 'violet', 'lavender', 'plum'],
    'Pink': ['pink', 'rose', 'magenta', 'fuchsia'],
    'Brown': ['brown', 'bronze', 'copper', 'tan', 'wood'],
    'Grey': ['grey', 'gray', 'silver', 'charcoal'],
    'Multi': ['rainbow', 'multicolor', 'gradient'],
  };

  for (const [family, keywords] of Object.entries(families)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return family;
    }
  }

  return null;
}

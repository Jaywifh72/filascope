import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { enrichGeeetechProduct } from '../_shared/geeetech-defaults.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncStats {
  discovered: number;
  scraped: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  deleted?: number;
}

interface ProductData {
  product_id: string;
  title: string;
  price: number | null;
  compare_at_price: number | null;
  url: string;
  image_url: string | null;
  material: string | null;
  color: string | null;
  color_hex: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const stats: SyncStats = {
    discovered: 0,
    scraped: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    const { cleanSlate = false, limit } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting GEEETECH sync...', { cleanSlate, limit });

    // ========================================================================
    // Step 1: Optional Clean Slate
    // ========================================================================
    if (cleanSlate) {
      console.log('Clean slate: Deleting existing GEEETECH products...');
      const { data: deleted, error: deleteError } = await supabase
        .from('filaments')
        .delete()
        .ilike('vendor', 'geeetech')
        .select('id');

      if (deleteError) {
        console.error('Error deleting products:', deleteError);
      } else {
        stats.deleted = deleted?.length || 0;
        console.log(`Deleted ${stats.deleted} existing products`);
      }
    }

    // Mark brand as scraping
    await supabase
      .from('automated_brands')
      .update({ scraping_active: true })
      .eq('brand_slug', 'geeetech');

    // ========================================================================
    // Step 2: Discover Product URLs
    // ========================================================================
    console.log('Step 2: Discovering product URLs...');

    const categoryPages = [
      'https://www.geeetech.com/filament-c-83.html',
      'https://www.geeetech.com/filament-pla-c-83_111.html',
      'https://www.geeetech.com/filament-petg-c-83_124.html',
      'https://www.geeetech.com/filament-silksilk-dual-tricolor-c-83_113.html',
      'https://www.geeetech.com/filament-asa-c-83_180.html',
      'https://www.geeetech.com/filament-abs-c-83_175.html',
      'https://www.geeetech.com/filament-matte-pla-c-83_142.html',
      'https://www.geeetech.com/filament-tpu-c-83_130.html',
      'https://www.geeetech.com/filament-like-marble-wood-c-83_157.html',
      'https://www.geeetech.com/filament-luminous-pla-c-83_146.html',
      'https://www.geeetech.com/filament-high-speed-pla-c-83_149.html',
    ];

    const productUrls = new Set<string>();

    for (const categoryUrl of categoryPages) {
      try {
        console.log(`Scraping category: ${categoryUrl}`);
        
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: categoryUrl,
            formats: ['markdown', 'links'],
            waitFor: 2000,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to scrape ${categoryUrl}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const links: string[] = data.data?.links || data.links || [];

        for (const link of links) {
          // Match product URLs: contains "-p-" followed by digits and .html
          if (link.match(/-p-\d+\.html$/)) {
            // Skip bundle sales
            if (link.includes('bundle-sales')) continue;
            productUrls.add(link);
          }
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error scraping category ${categoryUrl}:`, error);
      }
    }

    stats.discovered = productUrls.size;
    console.log(`Discovered ${stats.discovered} product URLs`);

    // Apply limit if specified
    let urlsToScrape = Array.from(productUrls);
    if (limit && limit > 0) {
      urlsToScrape = urlsToScrape.slice(0, limit);
      console.log(`Limited to ${urlsToScrape.length} products`);
    }

    // ========================================================================
    // Step 3: Scrape Individual Product Pages
    // ========================================================================
    console.log('Step 3: Scraping individual product pages...');

    const products: ProductData[] = [];

    for (const productUrl of urlsToScrape) {
      try {
        console.log(`Scraping: ${productUrl}`);

        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: productUrl,
            formats: ['markdown', 'html'],
            waitFor: 2000,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to scrape ${productUrl}: ${response.status}`);
          stats.errors++;
          continue;
        }

        const data = await response.json();
        const markdown = data.data?.markdown || data.markdown || '';
        const html = data.data?.html || data.html || '';

        // Extract product ID from URL
        const productIdMatch = productUrl.match(/-p-(\d+)\.html/);
        const productId = productIdMatch ? productIdMatch[1] : null;

        if (!productId) {
          console.error(`Could not extract product ID from ${productUrl}`);
          stats.errors++;
          continue;
        }

        // Extract title
        let title = '';
        const titleMatch = markdown.match(/^#\s+(.+?)(?:\n|$)/m) || 
                          html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }

        if (!title) {
          console.error(`Could not extract title from ${productUrl}`);
          stats.errors++;
          continue;
        }

        // Extract price
        let price: number | null = null;
        let compareAtPrice: number | null = null;
        
        const priceMatch = markdown.match(/\$(\d+\.?\d*)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1]);
        }

        // Look for strikethrough/compare price
        const compareMatch = markdown.match(/~~\$(\d+\.?\d*)~~/);
        if (compareMatch) {
          compareAtPrice = parseFloat(compareMatch[1]);
        }

        // Extract image
        let imageUrl: string | null = null;
        const imageMatch = html.match(/class="[^"]*product[^"]*"[^>]*src="([^"]+)"/i) ||
                          html.match(/<img[^>]+src="(https:\/\/www\.geeetech\.com\/images\/[^"]+)"/i) ||
                          markdown.match(/!\[.*?\]\((https:\/\/www\.geeetech\.com\/images\/[^)]+)\)/);
        if (imageMatch) {
          imageUrl = imageMatch[1];
        }

        // Extract material from title
        let material: string | null = null;
        const materialPatterns = [
          { pattern: /\bHS-PLA\b/i, material: 'HS-PLA' },
          { pattern: /\bHigh Speed PLA\b/i, material: 'HS-PLA' },
          { pattern: /\bHigh-Speed PLA\b/i, material: 'HS-PLA' },
          { pattern: /\bASA\b/i, material: 'ASA' },
          { pattern: /\bABS\+?\b/i, material: 'ABS' },
          { pattern: /\bTPU\b/i, material: 'TPU' },
          { pattern: /\bPETG\b/i, material: 'PETG' },
          { pattern: /\bPLA\b/i, material: 'PLA' },
        ];

        for (const { pattern, material: mat } of materialPatterns) {
          if (pattern.test(title)) {
            material = mat;
            break;
          }
        }

        // Extract color from title
        let color: string | null = null;
        const colorPatterns = [
          'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple',
          'Pink', 'Grey', 'Gray', 'Brown', 'Silver', 'Gold', 'Transparent', 'Clear',
          'Apple Green', 'Water Blue', 'Sky Blue', 'Light Blue', 'Dark Blue',
          'Light Green', 'Dark Green', 'Army Green', 'Jade Green', 'Mint Green',
          'Bone White', 'Ivory', 'Cream', 'Skin', 'Coffee', 'Chocolate',
          'Brick Red', 'Wine Red', 'Dark Red', 'Light Pink', 'Hot Pink',
          'Magenta', 'Violet', 'Lavender', 'Dark Grey', 'Light Grey', 'Charcoal',
          'Rainbow', 'Dual Color', 'Tri Color', 'Multicolor'
        ];

        for (const colorName of colorPatterns) {
          if (title.toLowerCase().includes(colorName.toLowerCase())) {
            color = colorName;
            break;
          }
        }

        products.push({
          product_id: productId,
          title,
          price,
          compare_at_price: compareAtPrice,
          url: productUrl,
          image_url: imageUrl,
          material,
          color,
          color_hex: null,
        });

        stats.scraped++;

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error scraping ${productUrl}:`, error);
        stats.errors++;
      }
    }

    console.log(`Scraped ${stats.scraped} products`);

    // ========================================================================
    // Step 4: Enrich and Upsert Products
    // ========================================================================
    console.log('Step 4: Enriching and upserting products...');

    for (const product of products) {
      try {
        // Apply brand-specific enrichments
        const enrichment = enrichGeeetechProduct(
          product.title,
          product.material || undefined,
          product.color || undefined,
          product.color_hex || undefined
        );

        // Check if product exists
        const { data: existing } = await supabase
          .from('filaments')
          .select('id, color_hex')
          .eq('product_id', product.product_id)
          .ilike('vendor', 'geeetech')
          .maybeSingle();

        const filamentData = {
          product_id: product.product_id,
          product_title: enrichment.cleaned_title || product.title,
          vendor: 'GEEETECH',
          product_url: product.url,
          featured_image: product.image_url,
          variant_price: product.price,
          variant_compare_at_price: product.compare_at_price,
          variant_available: true,
          material: enrichment.material,
          finish_type: enrichment.finish_type,
          product_line_id: enrichment.product_line_id,
          color_hex: existing?.color_hex || enrichment.color_hex,
          nozzle_temp_min_c: enrichment.nozzle_temp_min_c,
          nozzle_temp_max_c: enrichment.nozzle_temp_max_c,
          bed_temp_min_c: enrichment.bed_temp_min_c,
          bed_temp_max_c: enrichment.bed_temp_max_c,
          print_speed_max_mms: enrichment.print_speed_max_mms,
          high_speed_capable: enrichment.high_speed_capable,
          is_nozzle_abrasive: enrichment.is_nozzle_abrasive,
          diameter_nominal_mm: 1.75,
          net_weight_g: 1000,
          tds_url: null,
          auto_created: !existing,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
        };

        if (existing) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update(filamentData)
            .eq('id', existing.id);

          if (updateError) {
            console.error(`Error updating ${product.product_id}:`, updateError);
            stats.errors++;
          } else {
            stats.updated++;
          }
        } else {
          const { error: insertError } = await supabase
            .from('filaments')
            .insert(filamentData);

          if (insertError) {
            console.error(`Error inserting ${product.product_id}:`, insertError);
            stats.errors++;
          } else {
            stats.created++;
          }
        }
      } catch (error) {
        console.error(`Error processing ${product.product_id}:`, error);
        stats.errors++;
      }
    }

    // ========================================================================
    // Step 5: Finalize
    // ========================================================================
    console.log('Step 5: Finalizing sync...');

    // Update brand product counts
    await supabase.rpc('update_brand_product_counts', { p_brand_slug: 'geeetech' });

    // Mark brand as not scraping
    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        last_scrape_at: new Date().toISOString(),
      })
      .eq('brand_slug', 'geeetech');

    // Check for duplicate hex codes
    const { data: duplicates } = await supabase.rpc('find_duplicate_hexes', {
      p_vendor: 'GEEETECH'
    });

    if (duplicates && duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate hex codes`);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('GEEETECH sync complete:', {
      ...stats,
      duration: `${duration}s`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration: `${duration}s`,
        duplicateHexCount: duplicates?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('GEEETECH sync error:', error);

    // Mark brand as not scraping on error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('automated_brands')
        .update({ scraping_active: false })
        .eq('brand_slug', 'geeetech');
    } catch (e) {
      console.error('Error resetting scraping_active:', e);
    }

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

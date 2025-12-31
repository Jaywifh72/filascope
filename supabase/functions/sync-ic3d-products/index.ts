import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { enrichIC3DProduct } from '../_shared/ic3d-defaults.ts';

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
  deleted: number;
}

interface ProductData {
  url: string;
  title: string;
  price: number | null;
  compareAtPrice: number | null;
  image: string | null;
  colors: string[];
  material: string | null;
  slug: string;
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
    deleted: 0,
  };

  try {
    const { cleanSlate = false, limit } = await req.json().catch(() => ({}));
    
    console.log('Starting IC3D sync...', { cleanSlate, limit });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get brand info
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id, brand_slug')
      .eq('brand_slug', 'ic3d')
      .single();

    if (!brand) {
      throw new Error('IC3D brand not found in automated_brands');
    }

    // Mark as scraping
    await supabase
      .from('automated_brands')
      .update({ 
        scraping_active: true, 
        last_scrape_at: new Date().toISOString(),
        last_error: null 
      })
      .eq('id', brand.id);

    // Clean slate if requested
    if (cleanSlate) {
      console.log('Clean slate requested - deleting existing IC3D products...');
      const { data: deleted } = await supabase
        .from('filaments')
        .delete()
        .eq('vendor', 'IC3D')
        .select('id');
      
      stats.deleted = deleted?.length || 0;
      console.log(`Deleted ${stats.deleted} existing products`);
    }

    // ========================================
    // STEP 1: Discover product URLs
    // ========================================
    console.log('Step 1: Discovering product URLs...');
    
    const shopPages = [
      'https://www.ic3dprinters.com/shop/',
      'https://www.ic3dprinters.com/shop/page/2/',
    ];
    
    const productUrls: Set<string> = new Set();
    
    for (const pageUrl of shopPages) {
      console.log(`Scraping shop page: ${pageUrl}`);
      
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: pageUrl,
            formats: ['html', 'links'],
            waitFor: 2000,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to scrape ${pageUrl}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const links = data.data?.links || data.links || [];
        
        // Filter for product URLs - IC3D products are in /shop/{slug}/
        for (const link of links) {
          if (typeof link === 'string' && 
              link.includes('/shop/') && 
              !link.endsWith('/shop/') &&
              !link.includes('/page/') &&
              !link.includes('/cart/') &&
              !link.includes('/checkout/') &&
              !link.includes('/my-account/') &&
              !link.includes('?add-to-cart=')) {
            
            // Filter for filament products only
            const slug = link.split('/shop/')[1]?.replace(/\/$/, '') || '';
            if (slug && isFilamentProduct(slug)) {
              productUrls.add(link.replace(/\/$/, ''));
            }
          }
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error(`Error scraping ${pageUrl}:`, err);
      }
    }
    
    stats.discovered = productUrls.size;
    console.log(`Discovered ${stats.discovered} product URLs`);

    // ========================================
    // STEP 2: Scrape individual product pages
    // ========================================
    console.log('Step 2: Scraping product pages...');
    
    const products: ProductData[] = [];
    let urlArray = Array.from(productUrls);
    
    if (limit && limit > 0) {
      urlArray = urlArray.slice(0, limit);
    }
    
    for (const productUrl of urlArray) {
      console.log(`Scraping: ${productUrl}`);
      
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: productUrl,
            formats: ['html', 'markdown'],
            waitFor: 2000,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to scrape ${productUrl}: ${response.status}`);
          stats.errors++;
          continue;
        }

        const data = await response.json();
        const html = data.data?.html || data.html || '';
        const markdown = data.data?.markdown || data.markdown || '';
        
        // Extract product data
        const productData = parseIC3DProduct(productUrl, html, markdown);
        
        if (productData) {
          products.push(productData);
          stats.scraped++;
        } else {
          console.log(`Could not parse product: ${productUrl}`);
          stats.skipped++;
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error(`Error scraping ${productUrl}:`, err);
        stats.errors++;
      }
    }
    
    console.log(`Scraped ${stats.scraped} products`);

    // ========================================
    // STEP 3 & 4: Variant explosion and enrichment
    // ========================================
    console.log('Step 3 & 4: Exploding variants and enriching...');
    
    for (const product of products) {
      // If no colors found, create a single entry
      const colors = product.colors.length > 0 ? product.colors : ['Natural'];
      
      for (const color of colors) {
        try {
          // Generate product ID from slug and color
          const colorSlug = color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          const productId = `ic3d-${product.slug}-${colorSlug}`;
          
          // Enrich with brand-specific logic
          const enriched = enrichIC3DProduct(
            product.title,
            product.material || undefined,
            color,
            undefined
          );
          
          // Build filament record
          const filamentData: Record<string, unknown> = {
            product_id: productId,
            product_title: `${enriched.cleanedTitle} - ${color}`.trim(),
            vendor: 'IC3D',
            brand_id: brand.id,
            product_url: product.url,
            featured_image: product.image,
            variant_price: product.price,
            variant_compare_at_price: product.compareAtPrice,
            variant_available: true,
            material: enriched.material,
            finish_type: enriched.finishType,
            product_line_id: enriched.productLineId,
            color_hex: enriched.colorHex,
            tds_url: enriched.tdsUrl,
            diameter_nominal_mm: 1.75,
            net_weight_g: 1000,
            is_nozzle_abrasive: enriched.isNozzleAbrasive,
            auto_created: true,
            auto_updated: true,
            last_scraped_at: new Date().toISOString(),
          };
          
          // Add print settings if available
          if (enriched.printSettings) {
            filamentData.nozzle_temp_min_c = enriched.printSettings.nozzle_temp_min_c;
            filamentData.nozzle_temp_max_c = enriched.printSettings.nozzle_temp_max_c;
            filamentData.bed_temp_min_c = enriched.printSettings.bed_temp_min_c;
            filamentData.bed_temp_max_c = enriched.printSettings.bed_temp_max_c;
          }
          
          // Check if exists
          const { data: existing } = await supabase
            .from('filaments')
            .select('id')
            .eq('product_id', productId)
            .maybeSingle();
          
          if (existing) {
            // Update
            const { error } = await supabase
              .from('filaments')
              .update(filamentData)
              .eq('id', existing.id);
            
            if (error) {
              console.error(`Error updating ${productId}:`, error);
              stats.errors++;
            } else {
              stats.updated++;
            }
          } else {
            // Insert
            const { error } = await supabase
              .from('filaments')
              .insert(filamentData);
            
            if (error) {
              console.error(`Error inserting ${productId}:`, error);
              stats.errors++;
            } else {
              stats.created++;
            }
          }
        } catch (err) {
          console.error(`Error processing ${product.title} - ${color}:`, err);
          stats.errors++;
        }
      }
    }

    // ========================================
    // STEP 5: Finalize
    // ========================================
    console.log('Step 5: Finalizing...');
    
    // Update brand product counts
    const { count: totalProducts } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .eq('vendor', 'IC3D');
    
    const { count: productsWithHex } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .eq('vendor', 'IC3D')
      .not('color_hex', 'is', null);
    
    const { count: productsWithTds } = await supabase
      .from('filaments')
      .select('*', { count: 'exact', head: true })
      .eq('vendor', 'IC3D')
      .not('tds_url', 'is', null);
    
    await supabase
      .from('automated_brands')
      .update({
        scraping_active: false,
        product_count: totalProducts || 0,
        active_product_count: totalProducts || 0,
        products_with_color_hex: productsWithHex || 0,
        products_with_tds: productsWithTds || 0,
        successful_scrapes: (await supabase.from('automated_brands').select('successful_scrapes').eq('id', brand.id).single()).data?.successful_scrapes + 1 || 1,
        total_scrapes: (await supabase.from('automated_brands').select('total_scrapes').eq('id', brand.id).single()).data?.total_scrapes + 1 || 1,
      })
      .eq('id', brand.id);

    // Check for duplicate hex codes
    try {
      await supabase.rpc('find_duplicate_hexes');
    } catch (err) {
      console.log('Duplicate hex check skipped:', err);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('IC3D sync complete:', { ...stats, duration: `${duration}s` });

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        duration: `${duration}s`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('IC3D sync error:', error);
    
    // Reset scraping status
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('automated_brands')
        .update({ 
          scraping_active: false,
          last_error: error instanceof Error ? error.message : 'Unknown error',
          last_error_at: new Date().toISOString(),
          failed_scrapes: (await supabase.from('automated_brands').select('failed_scrapes').eq('brand_slug', 'ic3d').single()).data?.failed_scrapes + 1 || 1,
        })
        .eq('brand_slug', 'ic3d');
    } catch (e) {
      console.error('Error resetting scraping status:', e);
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

// Helper: Check if a slug represents a filament product
function isFilamentProduct(slug: string): boolean {
  const slugLower = slug.toLowerCase();
  
  // Filament product patterns
  const filamentPatterns = [
    'pla',
    'petg',
    'abs',
    'polyhex',
    'filament',
  ];
  
  // Exclusion patterns
  const excludePatterns = [
    'resin',
    'pellet',
    'colorant',
    't-shirt',
    'shirt',
    'spool-holder',
    'printer',
    '3d-model',
    'accessory',
    'nozzle',
    'bed',
    'build-plate',
    'gift',
    'sample',
  ];
  
  // Check exclusions first
  for (const exclude of excludePatterns) {
    if (slugLower.includes(exclude)) {
      return false;
    }
  }
  
  // Check inclusions
  for (const include of filamentPatterns) {
    if (slugLower.includes(include)) {
      return true;
    }
  }
  
  return false;
}

// Helper: Parse IC3D product page
function parseIC3DProduct(url: string, html: string, markdown: string): ProductData | null {
  try {
    // Extract slug from URL
    const urlParts = url.split('/shop/');
    const slug = urlParts[1]?.replace(/\/$/, '') || '';
    
    if (!slug) return null;
    
    // Extract title from markdown or HTML
    let title = '';
    const titleMatch = markdown.match(/^#\s+(.+)$/m) || 
                       html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                       html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    if (!title) {
      // Derive from slug
      title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    
    // Extract price
    let price: number | null = null;
    let compareAtPrice: number | null = null;
    
    const priceMatch = markdown.match(/\$(\d+\.?\d*)/g) || html.match(/\$(\d+\.?\d*)/g);
    if (priceMatch && priceMatch.length > 0) {
      const prices = priceMatch.map(p => parseFloat(p.replace('$', ''))).filter(p => !isNaN(p) && p > 0);
      if (prices.length > 0) {
        // Usually the first reasonable price is the current price
        price = prices.find(p => p >= 10 && p <= 500) || prices[0];
        
        // If there's a higher price, it might be compare-at
        const higherPrices = prices.filter(p => p > (price || 0));
        if (higherPrices.length > 0) {
          compareAtPrice = Math.min(...higherPrices);
        }
      }
    }
    
    // Extract featured image
    let image: string | null = null;
    const imageMatch = html.match(/src="([^"]+ic3d[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i) ||
                       html.match(/src="([^"]+wp-content\/uploads[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
    if (imageMatch) {
      image = imageMatch[1];
    }
    
    // Extract colors from variant options
    const colors: string[] = [];
    
    // WooCommerce color options pattern
    const colorOptionMatches = html.matchAll(/data-value="([^"]+)"[^>]*class="[^"]*color[^"]*"/gi);
    for (const match of colorOptionMatches) {
      colors.push(match[1]);
    }
    
    // Also check select options
    const selectMatches = html.matchAll(/<option[^>]*value="([^"]+)"[^>]*>([^<]+)<\/option>/gi);
    for (const match of selectMatches) {
      const value = match[2].trim();
      // Filter for color-like values
      if (isColorName(value) && !colors.includes(value)) {
        colors.push(value);
      }
    }
    
    // Extract from markdown list items that look like colors
    const listItems = markdown.match(/^\*\s+(.+)$/gm) || [];
    for (const item of listItems) {
      const value = item.replace(/^\*\s+/, '').trim();
      if (isColorName(value) && !colors.includes(value)) {
        colors.push(value);
      }
    }
    
    // Determine material from title
    let material: string | null = null;
    const titleLower = title.toLowerCase();
    if (titleLower.includes('polyhex')) material = 'Copolyester';
    else if (titleLower.includes('cf-petg') || titleLower.includes('carbon fiber petg')) material = 'PETG-CF';
    else if (titleLower.includes('petg')) material = 'PETG';
    else if (titleLower.includes('pla')) material = 'PLA';
    else if (titleLower.includes('abs')) material = 'ABS';
    
    return {
      url,
      title,
      price,
      compareAtPrice,
      image,
      colors: [...new Set(colors)], // Dedupe
      material,
      slug,
    };
  } catch (err) {
    console.error('Error parsing product:', err);
    return null;
  }
}

// Helper: Check if a string looks like a color name
function isColorName(value: string): boolean {
  const valueLower = value.toLowerCase();
  
  // Common color keywords
  const colorKeywords = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'grey', 'gray',
    'natural', 'clear', 'translucent', 'transparent', 'matte', 'silver', 'gold',
    'bronze', 'copper', 'brown', 'tan', 'navy', 'burgundy', 'forest', 'moss',
    'olive', 'lime', 'cherry', 'grape', 'honey', 'watermelon', 'tangerine',
    'sterling', 'razz', 'bright',
  ];
  
  for (const keyword of colorKeywords) {
    if (valueLower.includes(keyword)) {
      return true;
    }
  }
  
  // Exclude non-color values
  const excludePatterns = [
    '1.75', '2.85', '3mm', 'kg', 'size', 'weight', 'diameter', 'choose',
    'select', 'option', 'add', 'cart', 'wishlist', 'compare', 'share',
  ];
  
  for (const exclude of excludePatterns) {
    if (valueLower.includes(exclude)) {
      return false;
    }
  }
  
  // If short and capitalized, might be a color
  if (value.length >= 3 && value.length <= 30 && /^[A-Z]/.test(value)) {
    return true;
  }
  
  return false;
}

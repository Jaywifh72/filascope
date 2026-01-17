import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Firecrawl from 'https://esm.sh/@mendable/firecrawl-js@1.4.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Brand-specific image extraction patterns
const BRAND_IMAGE_PATTERNS: Record<string, {
  platform: 'shopify' | 'woocommerce' | 'custom';
  patterns: RegExp[];
  excludePatterns?: RegExp[];
}> = {
  'ninjatek': {
    platform: 'woocommerce',
    patterns: [
      /data-large_image="([^"]+)"/i,
      /data-src="([^"]+wp-content\/uploads[^"]+)"/i,
      /<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/i,
      /srcset="([^"\s]+)\s+\d+w/i,
    ],
  },
  'elegoo': {
    platform: 'shopify',
    patterns: [
      /"featured_image":"([^"]+)"/,
      /data-srcset="([^"\s]+)"/i,
      /<img[^>]+class="[^"]*product__image[^"]*"[^>]+src="([^"]+)"/i,
    ],
  },
  'fillamentum': {
    platform: 'custom',
    patterns: [
      /src="([^"]+uploads[^"]+\.(jpg|png|webp))"/i,
      /<figure[^>]*>.*?<img[^>]+src="([^"]+)"/is,
    ],
  },
  'matterhackers': {
    platform: 'custom',
    patterns: [
      /src="(https:\/\/[^"]+googleusercontent[^"]+)"/i,
      /src="(https:\/\/[^"]+images\/products[^"]+)"/i,
      /<meta\s+property="og:image"\s+content="([^"]+)"/i,
    ],
  },
  'tecbears': {
    platform: 'shopify',
    patterns: [
      /"featured_image":"([^"]+)"/,
      /src="(https:\/\/[^"]+cdn\.shopify[^"]+)"/i,
    ],
  },
  'eryone': {
    platform: 'shopify',
    patterns: [
      /"featured_image":"([^"]+)"/,
      /data-zoom-image="([^"]+)"/i,
      /<img[^>]+class="[^"]*product-featured-img[^"]*"[^>]+src="([^"]+)"/i,
    ],
  },
  'sunlu': {
    platform: 'shopify',
    patterns: [
      /"featured_image":"([^"]+)"/,
      /src="(https:\/\/[^"]+cdn\.shopify[^"]+)"/i,
    ],
  },
  'polymaker': {
    platform: 'shopify',
    patterns: [
      /"featured_image":"([^"]+)"/,
      /data-master="([^"]+)"/i,
    ],
  },
  'fiberlogy': {
    platform: 'custom',
    patterns: [
      // Fiberlogy uses ShopArena with <picture> elements and storefrontImages
      /<img[^>]+src="(https:\/\/fiberlogy\.com\/environment\/cache\/images\/[^"]+)"/i,
      /src="(\/environment\/cache\/images\/[^"]+\.(jpg|png|webp))"/i,
      /<picture[^>]*>.*?<img[^>]+src="([^"]+storefrontImages[^"]+)"/is,
      /<meta\s+property="og:image"\s+content="([^"]+)"/i,
    ],
  },
  'paramount-3d': {
    platform: 'custom',
    patterns: [
      // Wix platform uses static.wixstatic.com
      /src="(https:\/\/static\.wixstatic\.com\/media\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i,
      /<img[^>]+fetchpriority="high"[^>]+src="(https:\/\/static\.wixstatic\.com[^"]+)"/i,
      /<meta\s+property="og:image"\s+content="([^"]+wixstatic[^"]+)"/i,
    ],
  },
};

// Generic patterns for unknown brands
const GENERIC_PATTERNS = [
  // OG image meta tag
  /<meta\s+property="og:image"\s+content="([^"]+)"/i,
  /<meta\s+content="([^"]+)"\s+property="og:image"/i,
  
  // JSON-LD structured data
  /"image"\s*:\s*"([^"]+)"/,
  /"image"\s*:\s*\["([^"]+)"/,
  
  // Shopify patterns
  /"featured_image":"([^"]+)"/,
  /data-srcset="([^"\s]+)"/i,
  
  // WooCommerce patterns
  /data-large_image="([^"]+)"/i,
  /class="[^"]*woocommerce-product-gallery__image[^"]*"[^>]+data-thumb="([^"]+)"/i,
  
  // Generic product image patterns
  /<img[^>]+class="[^"]*product[^"]*image[^"]*"[^>]+src="([^"]+)"/i,
  /<img[^>]+id="[^"]*product[^"]*image[^"]*"[^>]+src="([^"]+)"/i,
];

// URLs to exclude (logos, icons, placeholders)
const EXCLUDE_PATTERNS = [
  /logo/i,
  /icon/i,
  /placeholder/i,
  /no-image/i,
  /blank\./i,
  /spacer/i,
  /loading/i,
  /spinner/i,
  /favicon/i,
  /avatar/i,
  /badge/i,
  /banner/i,
  /payment/i,
  /visa|mastercard|paypal|amex/i,
  /social/i,
  /facebook|twitter|instagram|youtube/i,
  /\.svg$/i,
  /1x1/i,
  /pixel/i,
];

function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Check for excluded patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(url)) return false;
  }
  
  // Must be a valid URL
  try {
    new URL(url.startsWith('//') ? `https:${url}` : url);
  } catch {
    return false;
  }
  
  // Should end with image extension or be from known CDN
  const hasImageExtension = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url);
  const isFromCDN = /(cdn\.shopify|googleusercontent|cloudinary|imgix|fastly|cloudfront|s3\.amazonaws)/i.test(url);
  
  return hasImageExtension || isFromCDN;
}

function cleanImageUrl(url: string): string {
  let cleanUrl = url;
  
  // Fix protocol-relative URLs
  if (cleanUrl.startsWith('//')) {
    cleanUrl = `https:${cleanUrl}`;
  }
  
  // Fix escaped slashes
  cleanUrl = cleanUrl.replace(/\\\//g, '/');
  
  // Unescape unicode
  try {
    cleanUrl = cleanUrl.replace(/\\u002F/g, '/');
  } catch {}
  
  // Remove Shopify size constraints for larger image
  if (cleanUrl.includes('cdn.shopify.com')) {
    cleanUrl = cleanUrl.replace(/_\d+x\d*(@\d+x)?(\.[a-z]+)/i, '$2');
    cleanUrl = cleanUrl.replace(/\?v=\d+/, '');
  }
  
  return cleanUrl;
}

function extractImageFromHtml(html: string, brandSlug: string): string | null {
  const brandConfig = BRAND_IMAGE_PATTERNS[brandSlug.toLowerCase()];
  const patterns = brandConfig?.patterns || [];
  
  // Try brand-specific patterns first
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const url = cleanImageUrl(match[1]);
      if (isValidImageUrl(url)) {
        console.log(`[${brandSlug}] Found image via brand pattern: ${url.substring(0, 80)}...`);
        return url;
      }
    }
  }
  
  // Fall back to generic patterns
  for (const pattern of GENERIC_PATTERNS) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const url = cleanImageUrl(match[1]);
      if (isValidImageUrl(url)) {
        console.log(`[${brandSlug}] Found image via generic pattern: ${url.substring(0, 80)}...`);
        return url;
      }
    }
  }
  
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify admin role
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: hasAdminRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { brand, dryRun = true, limit = 50 } = await req.json();

    if (!brand) {
      return new Response(JSON.stringify({ error: 'Brand is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[discover-brand-images] Starting for brand: ${brand}, dryRun: ${dryRun}, limit: ${limit}`);

    // Get brand info
    const { data: brandData } = await supabaseAdmin
      .from('automated_brands')
      .select('id, brand_name, brand_slug')
      .eq('brand_slug', brand)
      .single();

    if (!brandData) {
      return new Response(JSON.stringify({ error: `Brand not found: ${brand}` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get filaments missing images
    const { data: filaments, error: filamentsError } = await supabaseAdmin
      .from('filaments')
      .select('id, product_title, product_url, vendor')
      .ilike('vendor', brandData.brand_name)
      .is('featured_image', null)
      .not('product_url', 'is', null)
      .limit(limit);

    if (filamentsError) throw filamentsError;

    if (!filaments || filaments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No products missing images',
        imagesFound: 0,
        imagesUpdated: 0,
        failed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[discover-brand-images] Processing ${filaments.length} products for ${brand}`);

    const firecrawl = firecrawlKey ? new Firecrawl({ apiKey: firecrawlKey }) : null;
    
    const results = {
      imagesFound: 0,
      imagesUpdated: 0,
      failed: 0,
      details: [] as { id: string; title: string; imageUrl?: string; error?: string }[],
    };

    for (const filament of filaments) {
      if (!filament.product_url || filament.product_url.includes('placeholder')) {
        results.failed++;
        results.details.push({ id: filament.id, title: filament.product_title, error: 'Invalid URL' });
        continue;
      }

      try {
        let html = '';
        
        if (firecrawl) {
          const scrapeResult = await firecrawl.scrapeUrl(filament.product_url, { 
            formats: ['html'],
            waitFor: 2000,
          });
          if ('html' in scrapeResult && scrapeResult.html) {
            html = scrapeResult.html;
          }
        } else {
          // Fallback to fetch
          const response = await fetch(filament.product_url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml',
            },
          });
          html = await response.text();
        }

        const imageUrl = extractImageFromHtml(html, brand);

        if (imageUrl) {
          results.imagesFound++;
          
          if (!dryRun) {
            const { error: updateError } = await supabaseAdmin
              .from('filaments')
              .update({ featured_image: imageUrl })
              .eq('id', filament.id);

            if (updateError) {
              console.error(`Failed to update ${filament.id}:`, updateError);
              results.failed++;
              results.details.push({ id: filament.id, title: filament.product_title, error: updateError.message });
            } else {
              results.imagesUpdated++;
              results.details.push({ id: filament.id, title: filament.product_title, imageUrl });
            }
          } else {
            results.details.push({ id: filament.id, title: filament.product_title, imageUrl });
          }
        } else {
          results.failed++;
          results.details.push({ id: filament.id, title: filament.product_title, error: 'No image found' });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`Error processing ${filament.product_url}:`, err);
        results.failed++;
        results.details.push({ 
          id: filament.id, 
          title: filament.product_title, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      }
    }

    console.log(`[discover-brand-images] Completed: found=${results.imagesFound}, updated=${results.imagesUpdated}, failed=${results.failed}`);

    return new Response(JSON.stringify({
      success: true,
      brand: brandData.brand_name,
      dryRun,
      processed: filaments.length,
      ...results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[discover-brand-images] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

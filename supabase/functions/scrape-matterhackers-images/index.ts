/**
 * MATTERHACKERS IMAGE SCRAPER (Enhanced)
 * 
 * MatterHackers uses Google CDN (lh3.googleusercontent.com) for product images
 * Also supports S3 buckets and standard CDN patterns
 * 
 * Enhanced patterns for:
 * - Google CDN images (lh3.googleusercontent.com)
 * - S3 bucket images
 * - Cloudinary images
 * - Standard og:image fallback
 * - Multiple resolution detection
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import FirecrawlApp from "https://esm.sh/@mendable/firecrawl-js@1.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Extract best image from MatterHackers HTML
 */
function extractMatterHackersImage(html: string): { imageUrl: string | null; source: string } {
  // Pattern 1: Google CDN images (lh3.googleusercontent.com) - main product images
  // Look for the largest/best quality version
  const googleCdnMatches = html.matchAll(/["'](https:\/\/lh3\.googleusercontent\.com\/[^"'\s]+)["']/gi);
  let bestGoogleImage: string | null = null;
  for (const match of googleCdnMatches) {
    const url = match[1].replace(/&amp;/g, '&');
    // Prefer larger images (s0 = original, larger numbers = larger)
    if (!bestGoogleImage || url.includes('=s0') || url.includes('=w800') || url.includes('=w1200')) {
      bestGoogleImage = url;
      if (url.includes('=s0')) break; // Original size, best quality
    }
  }
  if (bestGoogleImage) {
    return { imageUrl: bestGoogleImage, source: 'Google CDN' };
  }

  // Pattern 2: data-src with Google CDN (lazy loading)
  const dataSrcMatch = html.match(/data-src=["'](https:\/\/lh3\.googleusercontent\.com\/[^"'\s]+)["']/i);
  if (dataSrcMatch) {
    return { imageUrl: dataSrcMatch[1].replace(/&amp;/g, '&'), source: 'Google CDN (data-src)' };
  }

  // Pattern 3: srcset with Google CDN
  const srcsetMatch = html.match(/srcset="[^"]*?(https:\/\/lh3\.googleusercontent\.com\/[^"\s,]+)[^"]*"/i);
  if (srcsetMatch) {
    return { imageUrl: srcsetMatch[1].replace(/&amp;/g, '&'), source: 'Google CDN (srcset)' };
  }

  // Pattern 4: S3 bucket images (s3.amazonaws.com)
  const s3Match = html.match(/["'](https:\/\/[^"'\s]*s3[^"'\s]*amazonaws\.com[^"'\s]+\.(?:jpg|jpeg|png|webp))["']/i);
  if (s3Match) {
    return { imageUrl: s3Match[1], source: 'S3 Bucket' };
  }

  // Pattern 5: Cloudinary images
  const cloudinaryMatch = html.match(/["'](https:\/\/res\.cloudinary\.com\/[^"'\s]+\.(?:jpg|jpeg|png|webp))["']/i);
  if (cloudinaryMatch) {
    return { imageUrl: cloudinaryMatch[1], source: 'Cloudinary' };
  }

  // Pattern 6: MatterHackers CDN
  const mhCdnMatch = html.match(/["'](https:\/\/(?:cdn\.|static\.)?matterhackers\.com[^"'\s]+\.(?:jpg|jpeg|png|webp))["']/i);
  if (mhCdnMatch) {
    return { imageUrl: mhCdnMatch[1], source: 'MatterHackers CDN' };
  }

  // Pattern 7: og:image meta tag as fallback
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogImageMatch?.[1] && !ogImageMatch[1].includes('placeholder') && !ogImageMatch[1].includes('logo')) {
    return { imageUrl: ogImageMatch[1], source: 'og:image' };
  }

  // Pattern 8: JSON-LD structured data
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const json = JSON.parse(jsonLdMatch[1]);
      if (json.image) {
        const imgUrl = Array.isArray(json.image) ? json.image[0] : json.image;
        if (typeof imgUrl === 'string') {
          return { imageUrl: imgUrl, source: 'JSON-LD' };
        }
      }
    } catch { /* ignore */ }
  }

  // Pattern 9: Any high-quality product image
  const productImgMatch = html.match(/src=["']([^"']+(?:product|sku|item)[^"']*\.(?:jpg|jpeg|png|webp))["']/i);
  if (productImgMatch?.[1]) {
    let url = productImgMatch[1];
    if (url.startsWith('//')) url = 'https:' + url;
    return { imageUrl: url, source: 'Product image pattern' };
  }

  return { imageUrl: null, source: 'none' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[MATTERHACKERS] ═══════════════════════════════════════════════════════');
  console.log('[MATTERHACKERS] 🚀 MATTERHACKERS IMAGE SCRAPER STARTED');
  console.log(`[MATTERHACKERS] 📅 ${new Date().toISOString()}`);
  console.log('[MATTERHACKERS] ═══════════════════════════════════════════════════════');

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    const authClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: hasAdminRole } = await authClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse options
    let limit = 50;
    let forceUpdate = false;
    try {
      const body = await req.json();
      limit = body.limit ?? 50;
      forceUpdate = body.forceUpdate ?? false;
    } catch { /* defaults */ }

    console.log(`[MATTERHACKERS] ⚙️ Options: limit=${limit}, forceUpdate=${forceUpdate}`);

    // Get MatterHackers filaments missing images (or all if forceUpdate)
    let query = supabase
      .from('filaments')
      .select('id, product_title, product_url, featured_image')
      .eq('vendor', 'MatterHackers')
      .not('product_url', 'is', null);
    
    if (!forceUpdate) {
      query = query.is('featured_image', null);
    }

    const { data: filaments, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`[MATTERHACKERS] 📊 Found ${filaments?.length || 0} filaments to process`);

    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ error: 'Firecrawl API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
    const results: Array<{ id: string; title: string; status: string; image?: string; source?: string }> = [];

    for (const filament of filaments || []) {
      try {
        // Skip URLs with placeholder SKUs
        if (filament.product_url?.includes('/sk/MDEFAULT')) {
          console.log(`[MATTERHACKERS] ⏭️ Skipping ${filament.product_title} - placeholder URL`);
          results.push({ id: filament.id, title: filament.product_title, status: 'skipped - placeholder URL' });
          continue;
        }

        console.log(`[MATTERHACKERS] 📦 Scraping: ${filament.product_title}`);

        const scrapeResult = await firecrawl.scrapeUrl(filament.product_url, {
          formats: ['html'],
          waitFor: 3000,
        });

        if (!scrapeResult.success) {
          console.log(`[MATTERHACKERS] ❌ Failed to scrape ${filament.product_title}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'scrape failed' });
          continue;
        }

        const html = scrapeResult.html || '';
        const { imageUrl, source } = extractMatterHackersImage(html);

        if (imageUrl) {
          // Clean up the URL
          let cleanUrl = imageUrl;
          if (cleanUrl.startsWith('//')) {
            cleanUrl = 'https:' + cleanUrl;
          }
          
          // Update the filament record
          const { error: updateError } = await supabase
            .from('filaments')
            .update({ featured_image: cleanUrl })
            .eq('id', filament.id);

          if (updateError) {
            console.log(`[MATTERHACKERS] ❌ Update failed for ${filament.product_title}: ${updateError.message}`);
            results.push({ id: filament.id, title: filament.product_title, status: 'update failed', image: cleanUrl });
          } else {
            console.log(`[MATTERHACKERS] ✅ Updated ${filament.product_title} via ${source}`);
            results.push({ id: filament.id, title: filament.product_title, status: 'success', image: cleanUrl, source });
          }
        } else {
          console.log(`[MATTERHACKERS] ⏭️ No image found for ${filament.product_title}`);
          results.push({ id: filament.id, title: filament.product_title, status: 'no image found' });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[MATTERHACKERS] ❌ Error processing ${filament.product_title}:`, err);
        results.push({ id: filament.id, title: filament.product_title, status: `error: ${errorMsg}` });
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => !['success', 'skipped - placeholder URL'].includes(r.status)).length,
      skipped: results.filter(r => r.status === 'skipped - placeholder URL').length,
      duration,
      results
    };

    console.log('[MATTERHACKERS] ═══════════════════════════════════════════════════════');
    console.log(`[MATTERHACKERS] ✅ COMPLETED in ${duration}s`);
    console.log(`[MATTERHACKERS] 📊 Success: ${summary.success}, Failed: ${summary.failed}, Skipped: ${summary.skipped}`);
    console.log('[MATTERHACKERS] ═══════════════════════════════════════════════════════');

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[MATTERHACKERS] ❌ Fatal error:', error);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

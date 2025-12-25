import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Log an activity entry to the sync_activity_log table
 */
async function logActivity(
  supabase: any,
  jobId: string | null,
  phase: string,
  action: string,
  level: 'info' | 'warning' | 'error' | 'success' = 'info',
  details?: {
    region?: string;
    productId?: string;
    productTitle?: string;
    oldValue?: any;
    newValue?: any;
    count?: number;
    message?: string;
    [key: string]: any;
  }
): Promise<boolean> {
  if (!jobId) {
    console.log(`[FIX-ELEGOO-IMAGES] ⚠️ No jobId provided, skipping activity log`);
    return false;
  }
  
  try {
    const { error } = await supabase.from('sync_activity_log').insert({
      job_id: jobId,
      phase,
      region: details?.region || null,
      action,
      product_id: details?.productId || null,
      product_title: details?.productTitle || null,
      details: details ? JSON.parse(JSON.stringify(details)) : null,
      level,
    });
    
    if (error) {
      console.error(`[FIX-ELEGOO-IMAGES] ❌ Failed to write activity log: ${error.message}`);
      return false;
    }
    
    console.log(`[FIX-ELEGOO-IMAGES] ✓ Logged: [${level}] ${phase}/${action}${details?.message ? ` - ${details.message}` : ''}`);
    return true;
  } catch (err) {
    console.error(`[FIX-ELEGOO-IMAGES] ❌ Exception writing activity log: ${err}`);
    return false;
  }
}

// ============ VARIANT ID APPROACH (from scrape-elegoo-variant-images) ============

// Regional store domains for Elegoo
const REGIONAL_STORES: Record<string, string> = {
  US: "https://us.elegoo.com",
  CA: "https://ca.elegoo.com",
  EU: "https://eu.elegoo.com",
  UK: "https://uk.elegoo.com",
  AU: "https://au.elegoo.com",
  DE: "https://de.elegoo.com",
  FR: "https://fr.elegoo.com",
  IT: "https://it.elegoo.com",
  ES: "https://es.elegoo.com",
};

// Extract product handle and variant ID from Elegoo URL
function extractProductInfo(url: string): { handle: string | null; variantId: string | null } {
  try {
    let variantId: string | null = null;
    
    // Handle Impact affiliate URLs - extract the real URL from 'u' param and prodsku
    if (url.includes("sjv.io") || url.includes("impact.com")) {
      const urlObj = new URL(url);
      // prodsku often contains the Shopify variant ID
      variantId = urlObj.searchParams.get("prodsku");
      const actualUrl = urlObj.searchParams.get("u");
      if (actualUrl) {
        url = decodeURIComponent(actualUrl);
      }
    }

    // Extract variant ID from URL query param (variant=51296906281141)
    const variantMatch = url.match(/[?&]variant=(\d+)/);
    if (variantMatch) {
      variantId = variantMatch[1];
    }

    // Extract handle from URL like /products/abs-filament-1-75mm-colored-1kg
    const handleMatch = url.match(/\/products\/([^?#]+)/);
    const handle = handleMatch ? handleMatch[1] : null;
    
    return { handle, variantId };
  } catch (e) {
    console.error(`Failed to extract info from URL: ${url}`, e);
    return { handle: null, variantId: null };
  }
}

interface ShopifyVariant {
  id: number;
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  featured_image: {
    src: string;
  } | null;
  image_id: number | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  variants: ShopifyVariant[];
  images: Array<{
    id: number;
    src: string;
    variant_ids: number[];
  }>;
}

// Find image by variant ID (most accurate method)
function findImageByVariantId(product: ShopifyProduct, variantId: string): string | null {
  const variantIdNum = parseInt(variantId, 10);
  if (isNaN(variantIdNum)) return null;
  
  // First check if the variant exists and has an image_id
  const variant = product.variants.find(v => v.id === variantIdNum);
  if (variant) {
    // Check featured_image on the variant
    if (variant.featured_image?.src) {
      return variant.featured_image.src;
    }
    
    // Check image_id reference
    if (variant.image_id) {
      const image = product.images.find(img => img.id === variant.image_id);
      if (image) {
        return image.src;
      }
    }
  }
  
  // Look for image with this variant_id in variant_ids array
  const matchedImage = product.images.find(img => img.variant_ids.includes(variantIdNum));
  if (matchedImage) {
    return matchedImage.src;
  }
  
  return null;
}

// Extract color from product title (e.g., "ABS - Red" -> "Red")
function extractColorFromTitle(title: string): string | null {
  // Common patterns: "Material - Color", "Material Color", "Material (Color)"
  const patterns = [
    /\s*-\s*([A-Za-z\s]+)$/,           // "ABS - Red"
    /\s+\(([A-Za-z\s]+)\)$/,           // "ABS (Red)"
    /(?:PLA|ABS|PETG|TPU|ASA)\s+([A-Za-z\s]+)$/i,  // "ABS Red"
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      // Clean up - remove weight specs
      let color = match[1].trim();
      color = color.replace(/\s*\d+(?:\.\d+)?(?:kg|g|mm)\s*/gi, '').trim();
      return color;
    }
  }
  return null;
}

// Normalize color name for matching
function normalizeColor(color: string): string {
  return color.toLowerCase()
    .replace(/gray/g, "grey")
    .replace(/\s+/g, " ")
    .trim();
}

// Find the best image for a variant by color name (fallback method)
function findVariantImageByColor(product: ShopifyProduct, colorName: string): string | null {
  const normalizedColor = normalizeColor(colorName);

  // First, try to find a variant with a matching title that has an image
  for (const variant of product.variants) {
    const variantTitle = variant.title || variant.option1 || "";
    if (normalizeColor(variantTitle) === normalizedColor) {
      // Check if variant has a featured_image
      if (variant.featured_image?.src) {
        return variant.featured_image.src;
      }

      // Look for an image associated with this variant ID
      const variantImage = product.images.find(img => 
        img.variant_ids.includes(variant.id)
      );
      if (variantImage) {
        return variantImage.src;
      }
    }
  }

  // Second pass: partial matching
  for (const variant of product.variants) {
    const variantTitle = normalizeColor(variant.title || variant.option1 || "");
    if (variantTitle.includes(normalizedColor) || normalizedColor.includes(variantTitle)) {
      if (variant.featured_image?.src) {
        return variant.featured_image.src;
      }

      const variantImage = product.images.find(img => 
        img.variant_ids.includes(variant.id)
      );
      if (variantImage) {
        return variantImage.src;
      }
    }
  }

  return null;
}

// Fetch product data from Shopify JSON API
async function fetchShopifyProduct(storeUrl: string, handle: string): Promise<ShopifyProduct | null> {
  const url = `${storeUrl}/products/${handle}.json`;
  console.log(`[FIX-ELEGOO-IMAGES] 🔍 Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FilascopeBot/1.0)",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[FIX-ELEGOO-IMAGES] Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.product as ShopifyProduct;
  } catch (e) {
    console.error(`[FIX-ELEGOO-IMAGES] Error fetching ${url}:`, e);
    return null;
  }
}

// ============ FIRECRAWL FALLBACK ============

// Extract direct Elegoo URL from affiliate link
function extractDirectUrl(productUrl: string): string {
  try {
    if (productUrl.includes("sjv.io") || productUrl.includes("impact.com")) {
      const urlObj = new URL(productUrl);
      const actualUrl = urlObj.searchParams.get("u");
      if (actualUrl) {
        return decodeURIComponent(actualUrl);
      }
    }
    return productUrl;
  } catch {
    return productUrl;
  }
}

// Extract product image from Firecrawl HTML response
function extractImageFromHtml(html: string): string | null {
  // Patterns to find Shopify product images, ordered by priority
  const patterns = [
    // OpenGraph image (most reliable for main product image)
    /<meta\s+property="og:image"\s+content="([^"]+)"/i,
    /<meta\s+content="([^"]+)"\s+property="og:image"/i,
    // Product media images
    /<img[^>]*class="[^"]*product[^"]*media[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*data-product-featured-image[^>]*src="([^"]+)"/i,
    // Shopify CDN images with product keywords
    /(https:\/\/cdn\.shopify\.com\/s\/files\/[^"'\s]+(?:filament|pla|abs|petg|tpu)[^"'\s]*\.(?:jpg|png|webp))/i,
    // Any Shopify CDN product images
    /(https:\/\/cdn\.shopify\.com\/s\/files\/[^"'\s]+\/products\/[^"'\s]+\.(?:jpg|png|webp))/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let imageUrl = match[1];
      // Normalize URL
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      }
      // Skip placeholder/icon images
      if (imageUrl.includes('placeholder') || imageUrl.includes('icon') || imageUrl.length < 50) {
        continue;
      }
      return imageUrl;
    }
  }
  return null;
}

// Scrape product page with Firecrawl to get variant image
async function scrapeImageWithFirecrawl(
  productUrl: string,
  variantId: string | null
): Promise<string | null> {
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('FIRECRAWL_API_KEY_1');
  if (!firecrawlApiKey) {
    console.log('[FIX-ELEGOO-IMAGES] ⚠️ No Firecrawl API key available');
    return null;
  }

  try {
    // Build direct URL with variant parameter
    let directUrl = extractDirectUrl(productUrl);
    if (variantId && !directUrl.includes('variant=')) {
      directUrl += (directUrl.includes('?') ? '&' : '?') + `variant=${variantId}`;
    }

    console.log(`[FIX-ELEGOO-IMAGES] 🔥 Firecrawl scraping: ${directUrl}`);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: directUrl,
        formats: ['html'],
        onlyMainContent: false,
        waitFor: 2000, // Wait for images to load
      }),
    });

    if (!response.ok) {
      console.error(`[FIX-ELEGOO-IMAGES] Firecrawl API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const html = data.data?.html || data.html;
    
    if (!html) {
      console.log('[FIX-ELEGOO-IMAGES] ⚠️ No HTML returned from Firecrawl');
      return null;
    }

    const imageUrl = extractImageFromHtml(html);
    if (imageUrl) {
      console.log(`[FIX-ELEGOO-IMAGES] ✓ Firecrawl found image: ${imageUrl.substring(0, 60)}...`);
    }
    return imageUrl;
  } catch (e) {
    console.error('[FIX-ELEGOO-IMAGES] Firecrawl error:', e);
    return null;
  }
}

// ============ MAIN HANDLER ============

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await authClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse options
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON
    }

    const {
      dryRun = false,
      limit = 500,
      forceUpdate = false, // If true, update even if image already exists
      jobId = null, // Optional: for detailed activity logging
      region = "US", // Which regional store to use
      onlyMissingImages = true, // Only process filaments without images by default
    } = body as { 
      dryRun?: boolean; 
      limit?: number; 
      forceUpdate?: boolean; 
      jobId?: string | null; 
      region?: string;
      onlyMissingImages?: boolean;
    };

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("=== ELEGOO IMAGE FIX (Variant ID Approach) ===");
    console.log(`Options: dryRun=${dryRun}, limit=${limit}, forceUpdate=${forceUpdate}, region=${region}, onlyMissingImages=${onlyMissingImages}, jobId=${jobId}`);

    // Log start event if jobId provided
    if (jobId) {
      await logActivity(supabase, jobId, 'images', 'phase_started', 'info', {
        message: `Starting image fix: dryRun=${dryRun}, limit=${limit}, region=${region}`,
        dryRun,
        limit,
        forceUpdate,
        region,
        onlyMissingImages,
      });
    }

    // Fetch Elegoo filaments with product_url (KEY: we need product_url for variant ID)
    let query = supabase
      .from("filaments")
      .select("id, product_title, featured_image, color_hex, product_url")
      .eq("vendor", "Elegoo")
      .not("product_url", "is", null) // Must have product_url
      .order("product_title")
      .limit(limit);

    // Filter to only those without images if specified
    if (onlyMissingImages && !forceUpdate) {
      query = query.is("featured_image", null);
    }

    const { data: filaments, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`[FIX-ELEGOO-IMAGES] Found ${filaments?.length || 0} Elegoo filaments to process`);

    if (!filaments || filaments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No Elegoo filaments found with missing images",
        stats: { processed: 0, updated: 0, errors: 0, skipped: 0 }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Type for filament with extracted variant info
    type FilamentWithVariant = {
      id: string;
      product_title: string;
      product_url: string;
      featured_image: string | null;
      color_hex: string | null;
      variantId: string | null;
    };

    // Group filaments by product handle for efficient API calls
    const productGroups = new Map<string, FilamentWithVariant[]>();
    let filamentsWithoutUrl = 0;
    
    for (const filament of filaments) {
      if (!filament.product_url) {
        filamentsWithoutUrl++;
        continue;
      }

      const { handle, variantId } = extractProductInfo(filament.product_url);
      if (!handle) {
        console.log(`[FIX-ELEGOO-IMAGES] Could not extract handle from: ${filament.product_url}`);
        continue;
      }

      if (!productGroups.has(handle)) {
        productGroups.set(handle, []);
      }
      productGroups.get(handle)!.push({ 
        id: filament.id,
        product_title: filament.product_title,
        product_url: filament.product_url,
        featured_image: filament.featured_image,
        color_hex: filament.color_hex,
        variantId,
      });
    }

    console.log(`[FIX-ELEGOO-IMAGES] Grouped into ${productGroups.size} product handles (${filamentsWithoutUrl} filaments without URL skipped)`);

    if (jobId) {
      await logActivity(supabase, jobId, 'images', 'processing_started', 'info', {
        message: `Processing ${productGroups.size} product handles for ${filaments.length} filaments`,
        productHandlesCount: productGroups.size,
        filamentsCount: filaments.length,
        filamentsWithoutUrl,
      });
    }

    // Get regional store URL
    const storeUrl = REGIONAL_STORES[region] || REGIONAL_STORES.US;
    console.log(`[FIX-ELEGOO-IMAGES] Using store: ${storeUrl}`);

    // Track results
    let updated = 0;
    let errors = 0;
    let skipped = 0;
    let firecrawlAttempts = 0;
    let firecrawlSuccesses = 0;
    const MAX_FIRECRAWL_ATTEMPTS = 50; // Limit Firecrawl API calls per run
    const FIRECRAWL_DELAY_MS = 1000; // Delay between Firecrawl calls
    
    const results: { 
      id: string; 
      title: string; 
      status: string; 
      newImage?: string | null; 
      oldImage?: string | null; 
      color?: string;
      variantId?: string | null;
      handle?: string;
      matchMethod?: string;
    }[] = [];

    // Process each product group
    for (const [handle, groupFilaments] of productGroups) {
      console.log(`\n[FIX-ELEGOO-IMAGES] 📦 Processing handle: ${handle} (${groupFilaments.length} variants)`);

      // Fetch the Shopify product data
      const product = await fetchShopifyProduct(storeUrl, handle);
      
      if (!product) {
        console.log(`[FIX-ELEGOO-IMAGES] ❌ Could not fetch product: ${handle}`);
        for (const filament of groupFilaments) {
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: "product_not_found",
            handle,
            variantId: filament.variantId,
          });
          errors++;
        }
        continue;
      }

      console.log(`[FIX-ELEGOO-IMAGES] ✓ Product has ${product.variants.length} variants and ${product.images.length} images`);

      // Process each filament in the group
      for (const filament of groupFilaments) {
        let newImage: string | null = null;
        let matchMethod = "";

        // Strategy 1: Try variant ID lookup (most accurate)
        if (filament.variantId) {
          newImage = findImageByVariantId(product, filament.variantId);
          if (newImage) {
            matchMethod = "variant_id";
            console.log(`[FIX-ELEGOO-IMAGES] ✓ Found image by variant ID ${filament.variantId}`);
          }
        }

        // Strategy 2: Fallback to color matching
        if (!newImage) {
          const color = extractColorFromTitle(filament.product_title);
          if (color) {
            newImage = findVariantImageByColor(product, color);
            if (newImage) {
              matchMethod = "color_match";
              console.log(`[FIX-ELEGOO-IMAGES] ✓ Found image by color match: "${color}"`);
            }
          }
        }

        // Strategy 3: Firecrawl fallback (scrape actual product page)
        if (!newImage && filament.product_url && firecrawlAttempts < MAX_FIRECRAWL_ATTEMPTS) {
          firecrawlAttempts++;
          console.log(`[FIX-ELEGOO-IMAGES] 🔥 Trying Firecrawl fallback (attempt ${firecrawlAttempts}/${MAX_FIRECRAWL_ATTEMPTS})`);
          
          newImage = await scrapeImageWithFirecrawl(filament.product_url, filament.variantId);
          if (newImage) {
            matchMethod = "firecrawl";
            firecrawlSuccesses++;
            console.log(`[FIX-ELEGOO-IMAGES] ✓ Found image via Firecrawl`);
            
            if (jobId) {
              await logActivity(supabase, jobId, 'images', 'firecrawl_image_found', 'success', {
                productId: filament.id,
                productTitle: filament.product_title,
                variantId: filament.variantId,
                imageUrl: newImage,
              });
            }
          }
          
          // Rate limit Firecrawl calls
          await new Promise(resolve => setTimeout(resolve, FIRECRAWL_DELAY_MS));
        }

        // No image found
        if (!newImage) {
          console.log(`[FIX-ELEGOO-IMAGES] ✗ No image found for: ${filament.product_title}`);
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: "no_image_found",
            handle,
            variantId: filament.variantId,
          });
          skipped++;
          
          if (jobId) {
            await logActivity(supabase, jobId, 'images', 'no_match', 'warning', {
              productId: filament.id,
              productTitle: filament.product_title,
              message: `No image found for variant`,
              variantId: filament.variantId,
              handle,
            });
          }
          continue;
        }

        // Normalize image URL
        if (newImage.startsWith('//')) {
          newImage = 'https:' + newImage;
        }

        // Check if image is actually different
        if (filament.featured_image === newImage && !forceUpdate) {
          results.push({
            id: filament.id,
            title: filament.product_title,
            status: "already_correct",
            oldImage: filament.featured_image,
            newImage,
            handle,
            variantId: filament.variantId,
          });
          skipped++;
          continue;
        }

        console.log(`[FIX-ELEGOO-IMAGES] ✓ ${matchMethod}: ${filament.product_title} → ${newImage.substring(0, 60)}...`);

        if (!dryRun) {
          const { error: updateError } = await supabase
            .from("filaments")
            .update({
              featured_image: newImage,
              updated_at: new Date().toISOString()
            })
            .eq("id", filament.id);

          if (updateError) {
            console.error(`[FIX-ELEGOO-IMAGES] ❌ Update failed for ${filament.id}: ${updateError.message}`);
            results.push({
              id: filament.id,
              title: filament.product_title,
              status: "update_failed",
              oldImage: filament.featured_image,
              newImage,
              handle,
              variantId: filament.variantId,
            });
            errors++;
            
            if (jobId) {
              await logActivity(supabase, jobId, 'images', 'update_failed', 'error', {
                productId: filament.id,
                productTitle: filament.product_title,
                message: `Failed to update image: ${updateError.message}`,
                error: updateError.message,
              });
            }
            continue;
          }

          // Log successful update
          if (jobId) {
            await logActivity(supabase, jobId, 'images', 'image_updated', 'success', {
              productId: filament.id,
              productTitle: filament.product_title,
              oldValue: filament.featured_image,
              newValue: newImage,
              message: `Image updated via ${matchMethod}`,
              matchMethod,
              handle,
              variantId: filament.variantId,
            });
          }
        }

        results.push({
          id: filament.id,
          title: filament.product_title,
          status: dryRun ? "would_update" : "updated",
          oldImage: filament.featured_image,
          newImage,
          handle,
          variantId: filament.variantId,
          matchMethod,
        });
        updated++;
      }

      // Small delay between products to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Log completion
    if (jobId) {
      await logActivity(supabase, jobId, 'images', 'phase_completed', 'success', {
        message: `Image fix completed: ${updated} updated, ${skipped} skipped, ${errors} errors, Firecrawl: ${firecrawlSuccesses}/${firecrawlAttempts}`,
        updated,
        skipped,
        errors,
        firecrawlAttempts,
        firecrawlSuccesses,
        dryRun,
      });
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log(`Firecrawl attempts: ${firecrawlAttempts} (${firecrawlSuccesses} successful)`);

    return new Response(JSON.stringify({
      success: true,
      message: dryRun 
        ? `Dry run complete. Would update ${updated} images.` 
        : `Updated ${updated} images (${firecrawlSuccesses} via Firecrawl).`,
      stats: {
        processed: filaments.length,
        productHandles: productGroups.size,
        updated,
        skipped,
        errors,
        firecrawlAttempts,
        firecrawlSuccesses,
      },
      results: results.slice(0, 100), // Limit response size
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[FIX-ELEGOO-IMAGES] Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function findBestProductImage(
  productName: string,
  brand: string | null,
  accessoryType: string,
  images: string[],
  lovableApiKey: string
): Promise<string | null> {
  if (!images || images.length === 0) return null;
  
  // Filter out obviously bad images
  const filteredImages = images.filter(img => {
    const lower = img.toLowerCase();
    
    // Exclude small images, icons, logos, etc.
    const badPatterns = [
      'icon', 'logo', 'favicon', 'sprite', 'placeholder', 'loading',
      'avatar', 'badge', 'banner', '/flags/', 'payment', 'social',
      'facebook', 'twitter', 'instagram', 'youtube', '1x1', 'pixel',
      'tracking', 'country', 'flag', 'store.png', 'global_store',
      'height=28', 'width=28', 'height=32', 'width=32', 'height=16', 'width=16',
      'height=24', 'width=24', 'height=48', 'width=48', 'height=64', 'width=64',
      '/flag', 'currency', 'shipping', 'trust', 'secure', 'ssl', 'cart',
      'checkout', 'email', 'newsletter', 'footer', 'header', 'nav',
      'menu', 'button', 'arrow', 'chevron', 'close', 'search', 'user'
    ];
    
    if (badPatterns.some(p => lower.includes(p))) return false;
    
    // Must have valid image extension or be from CDN/product paths
    const goodPatterns = [
      '.jpg', '.jpeg', '.png', '.webp',
      '/products/', '/product/', '/images/product', 'cdn.shopify',
      'media.', 'static.', 'assets.', 'img.', '/gallery/',
      'bambulab', 'prusa', 'creality', 'anycubic', 'elegoo', 'qidi',
      'mosaic', 'sovol', 'snapmaker', 'biqu', 'trianglelab', 'fysetc'
    ];
    
    return goodPatterns.some(p => lower.includes(p));
  });

  // Sort by likelihood of being a product image (larger URLs often indicate larger images)
  const scoredImages = filteredImages.map(img => {
    let score = 0;
    const lower = img.toLowerCase();
    
    // Prefer product-specific paths
    if (lower.includes('/products/') || lower.includes('/product/')) score += 10;
    if (lower.includes('main') || lower.includes('hero') || lower.includes('primary')) score += 5;
    if (lower.includes('_1.') || lower.includes('-1.') || lower.includes('_01.')) score += 3;
    
    // Prefer larger images
    const sizeMatch = lower.match(/(\d{3,4})x(\d{3,4})|width[=:](\d{3,4})|height[=:](\d{3,4})/);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1] || sizeMatch[3] || sizeMatch[4] || '0');
      if (size >= 500) score += 5;
      if (size >= 800) score += 3;
    }
    
    // Prefer CDN images
    if (lower.includes('cdn.')) score += 2;
    
    return { img, score };
  }).sort((a, b) => b.score - a.score);

  const sortedImages = scoredImages.map(s => s.img);
  
  if (sortedImages.length === 0) return null;
  if (sortedImages.length === 1) return sortedImages[0];

  // Use AI to select the best product image from top candidates
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert at identifying product images for 3D printer accessories. Select the URL most likely to be a MAIN PRODUCT IMAGE showing the physical product.

REJECT images that are:
- Country flags, shipping icons, payment logos
- Small thumbnails (look for small dimensions in URL)
- Navigation or UI elements
- Store logos or branding

PREFER images that:
- Show the actual ${accessoryType.replace('_', ' ')} product
- Are from /products/ or /gallery/ paths
- Have large dimensions (500px+)
- Are main/hero/primary images

Return ONLY the URL, nothing else.`
          },
          {
            role: "user",
            content: `Product: ${productName}
Brand: ${brand || 'Unknown'}
Type: ${accessoryType.replace('_', ' ')}

Select the best product image URL:
${sortedImages.slice(0, 10).map((img, i) => `${i + 1}. ${img}`).join('\n')}

Return ONLY the URL:`
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.error("AI API error:", await response.text());
      return sortedImages[0];
    }

    const data = await response.json();
    const selectedUrl = data.choices?.[0]?.message?.content?.trim();
    
    // Validate the response is actually a URL from our list
    if (selectedUrl && sortedImages.some(img => img === selectedUrl || selectedUrl.includes(img) || img.includes(selectedUrl))) {
      return selectedUrl;
    }
    
    // If AI returned something not in list, find closest match
    const match = sortedImages.find(img => selectedUrl?.includes(img) || img.includes(selectedUrl || ''));
    return match || sortedImages[0];
    
  } catch (error) {
    console.error("AI selection error:", error);
    return sortedImages[0];
  }
}

async function scrapeProductImages(
  productUrl: string,
  firecrawlApiKey: string
): Promise<string[]> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ["html"],
        waitFor: 3000,
        onlyMainContent: false,
      })
    });

    if (!response.ok) {
      console.error("Firecrawl scrape failed:", await response.text());
      return [];
    }

    const result = await response.json();
    const html = result.data?.html || '';

    // Extract image URLs from HTML
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const srcsetRegex = /srcset=["']([^"']+)["']/gi;
    const styleRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
    const dataImgRegex = /data-(?:src|image|lazy-src)=["']([^"']+)["']/gi;
    
    const images: Set<string> = new Set();
    
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      images.add(match[1]);
    }
    while ((match = srcsetRegex.exec(html)) !== null) {
      const srcsetParts = match[1].split(',').map(s => s.trim().split(' ')[0]);
      srcsetParts.forEach(src => images.add(src));
    }
    while ((match = styleRegex.exec(html)) !== null) {
      images.add(match[1]);
    }
    while ((match = dataImgRegex.exec(html)) !== null) {
      images.add(match[1]);
    }

    // Convert relative URLs to absolute and decode HTML entities
    const baseUrl = new URL(productUrl);
    const absoluteImages = Array.from(images).map(img => {
      try {
        // Decode HTML entities
        let decoded = img
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        
        // Skip malformed URLs that contain quotes
        if (decoded.includes('"') || decoded.includes("'")) {
          return null;
        }
        
        if (decoded.startsWith('//')) return `https:${decoded}`;
        if (decoded.startsWith('/')) return `${baseUrl.origin}${decoded}`;
        if (!decoded.startsWith('http')) return new URL(decoded, productUrl).href;
        return decoded;
      } catch {
        return null;
      }
    }).filter((img): img is string => img !== null);

    return absoluteImages;
  } catch (error) {
    console.error("Error scraping images:", error);
    return [];
  }
}

async function validateProductUrl(
  productName: string,
  brand: string | null,
  currentUrl: string,
  lovableApiKey: string,
  firecrawlApiKey: string
): Promise<{ isValid: boolean; correctUrl?: string; reason?: string }> {
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: currentUrl,
        formats: ["markdown"],
        waitFor: 2000,
        onlyMainContent: true,
      })
    });

    if (!response.ok) {
      return { isValid: false, reason: "URL not accessible" };
    }

    const result = await response.json();
    const markdown = result.data?.markdown || '';
    
    if (!markdown || markdown.length < 100) {
      return { isValid: false, reason: "Page has no content" };
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Validate if this URL is the correct product page for a 3D printer build plate.
Return JSON: {"isValid": true/false, "reason": "brief explanation"}
Be strict: must be a direct product page for this specific build plate.`
          },
          {
            role: "user",
            content: `Product: ${productName}
Brand: ${brand || 'Unknown'}
URL: ${currentUrl}

Page Content:
${markdown.slice(0, 1500)}

Return JSON only.`
          }
        ],
        max_tokens: 150,
        temperature: 0.1
      })
    });

    if (!aiResponse.ok) {
      return { isValid: true, reason: "AI validation unavailable" };
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content?.trim() || '';
    
    try {
      const parsed = JSON.parse(aiContent.replace(/```json\n?|\n?```/g, ''));
      return { isValid: parsed.isValid === true, reason: parsed.reason };
    } catch {
      return { isValid: true, reason: "Page accessible" };
    }
  } catch (error) {
    console.error("URL validation error:", error);
    return { isValid: false, reason: `Error: ${error}` };
  }
}

async function searchForProductImage(
  productName: string,
  brand: string | null,
  firecrawlApiKey: string
): Promise<string | null> {
  try {
    const searchQuery = `${brand || ''} ${productName} product`;
    
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
      })
    });

    if (!response.ok) {
      console.error("Firecrawl search failed:", await response.text());
      return null;
    }

    const result = await response.json();
    
    if (!result.data || !Array.isArray(result.data)) {
      return null;
    }

    for (const item of result.data) {
      if (item.url && (
        item.url.includes('.jpg') ||
        item.url.includes('.png') ||
        item.url.includes('.webp')
      )) {
        return item.url;
      }
    }

    return null;
  } catch (error) {
    console.error("Search error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY")!;
    const lovableApiKey = Deno.env.get("OPENAI_API_KEY")!;

    // Create client for auth check
    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: hasAdminRole, error: roleError } = await authClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });

    if (roleError || !hasAdminRole) {
      console.log(`Access denied for user ${user.id} - not an admin`);
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    console.log(`Admin ${user.id} starting accessory image scraping...`);

    const body = await req.json();
    const accessoryType = body.accessoryType || body.accessory_type;
    const accessoryId = body.accessoryId || body.accessory_id;
    const forceUpdate = body.forceUpdate || body.force_update;
    const validateUrls = body.validateUrls || body.validate_urls;
    const limit = body.limit || 10;
    const offset = body.offset || 0;

    // Build query based on parameters
    let query = supabase
      .from("printer_accessories")
      .select("id, name, brand, product_url, accessory_type, image_url")
      .order("brand", { ascending: true })
      .order("name", { ascending: true });

    if (accessoryId) {
      query = query.eq("id", accessoryId);
    } else if (accessoryType) {
      query = query.eq("accessory_type", accessoryType);
    }

    // Only get items without images unless forcing update
    if (!forceUpdate) {
      query = query.or("image_url.is.null,image_url.eq.,image_url.ilike.%placeholder%");
    }

    // Apply offset and limit for pagination
    query = query.range(offset, offset + limit - 1);

    const { data: accessories, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch accessories: ${fetchError.message}`);
    }

    if (!accessories || accessories.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No accessories need image updates", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${accessories.length} accessories for image scraping`);

    const results = {
      updated: 0,
      failed: 0,
      skipped: 0,
      urlsValidated: 0,
      urlsInvalid: 0,
      details: [] as { name: string; status: string; image?: string; urlValid?: boolean; urlReason?: string }[]
    };

    for (const accessory of accessories) {
      try {
        console.log(`Processing: ${accessory.name}`);

        let bestImage: string | null = null;
        let urlValidation: { isValid: boolean; reason?: string } | null = null;

        // Validate URL if requested
        if (validateUrls && accessory.product_url && accessory.product_url.startsWith('http')) {
          console.log(`Validating URL: ${accessory.product_url}`);
          urlValidation = await validateProductUrl(
            accessory.name,
            accessory.brand,
            accessory.product_url,
            lovableApiKey,
            firecrawlApiKey
          );
          if (urlValidation.isValid) {
            results.urlsValidated++;
            console.log(`URL valid: ${urlValidation.reason}`);
          } else {
            results.urlsInvalid++;
            console.log(`URL INVALID: ${urlValidation.reason}`);
          }
        }

        // Strategy 1: Scrape product URL if available
        if (accessory.product_url && accessory.product_url.startsWith('http')) {
          const images = await scrapeProductImages(accessory.product_url, firecrawlApiKey);
          console.log(`Found ${images.length} images from product page`);
          
          if (images.length > 0) {
            bestImage = await findBestProductImage(
              accessory.name,
              accessory.brand,
              accessory.accessory_type,
              images,
              lovableApiKey
            );
          }
        }

        // Strategy 2: Search for product image if scraping didn't work
        if (!bestImage) {
          console.log(`Searching for image: ${accessory.name}`);
          bestImage = await searchForProductImage(
            accessory.name,
            accessory.brand,
            firecrawlApiKey
          );
        }

        if (bestImage) {
          // Update the database
          const { error: updateError } = await supabase
            .from("printer_accessories")
            .update({ image_url: bestImage, updated_at: new Date().toISOString() })
            .eq("id", accessory.id);

          if (updateError) {
            console.error(`Failed to update ${accessory.name}:`, updateError);
            results.failed++;
            results.details.push({ name: accessory.name, status: "update_failed", urlValid: urlValidation?.isValid, urlReason: urlValidation?.reason });
          } else {
            console.log(`Updated image for ${accessory.name}: ${bestImage}`);
            results.updated++;
            results.details.push({ name: accessory.name, status: "updated", image: bestImage, urlValid: urlValidation?.isValid, urlReason: urlValidation?.reason });
          }
        } else {
          console.log(`No image found for ${accessory.name}`);
          results.skipped++;
          results.details.push({ name: accessory.name, status: "no_image_found", urlValid: urlValidation?.isValid, urlReason: urlValidation?.reason });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`Error processing ${accessory.name}:`, errorMsg);
        results.failed++;
        results.details.push({ name: accessory.name, status: "error", image: errorMsg });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${accessories.length} accessories`,
        ...results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error in scrape-accessory-images:", errorMsg);
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

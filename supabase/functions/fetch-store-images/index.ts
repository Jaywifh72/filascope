import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function scrapeProductImages(url: string, apiKey: string): Promise<string[]> {
  console.log(`Scraping images from: ${url}`);
  
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["html"],
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl error: ${errorText}`);
      return [];
    }

    const data = await response.json();
    const html = data.data?.html || "";

    // Extract image URLs from HTML
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const srcsetRegex = /srcset=["']([^"']+)["']/gi;
    const ogImageRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
    
    const images: string[] = [];
    let match;

    // Extract og:image first (usually the best product image)
    while ((match = ogImageRegex.exec(html)) !== null) {
      const imgUrl = match[1];
      if (isValidProductImage(imgUrl)) {
        images.push(resolveUrl(imgUrl, url));
      }
    }

    // Extract regular img src
    while ((match = imgRegex.exec(html)) !== null) {
      const imgUrl = match[1];
      if (isValidProductImage(imgUrl)) {
        images.push(resolveUrl(imgUrl, url));
      }
    }

    // Extract from srcset (get highest resolution)
    while ((match = srcsetRegex.exec(html)) !== null) {
      const srcset = match[1];
      const srcUrls = srcset.split(",").map(s => s.trim().split(" ")[0]);
      for (const imgUrl of srcUrls) {
        if (isValidProductImage(imgUrl)) {
          images.push(resolveUrl(imgUrl, url));
        }
      }
    }

    // Dedupe and limit to 5
    const uniqueImages = [...new Set(images)].slice(0, 5);
    console.log(`Found ${uniqueImages.length} product images`);
    return uniqueImages;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return [];
  }
}

function isValidProductImage(url: string): boolean {
  if (!url || url.length < 10) return false;
  
  const lowerUrl = url.toLowerCase();
  
  // Skip common non-product images
  const skipPatterns = [
    "logo", "icon", "favicon", "sprite", "badge", "banner",
    "arrow", "button", "nav", "menu", "social", "facebook",
    "twitter", "instagram", "youtube", "linkedin", "pinterest",
    "cart", "search", "close", "hamburger", "chevron", "flag",
    "payment", "visa", "mastercard", "paypal", "shipping",
    "placeholder", "loading", "spinner", "avatar", "profile",
    "1x1", "pixel", "tracking", "analytics", "ads", "advertisement",
    ".svg", ".gif", "base64", "data:image"
  ];
  
  for (const pattern of skipPatterns) {
    if (lowerUrl.includes(pattern)) return false;
  }
  
  // Must be an image file or CDN URL
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const cdnPatterns = ["cdn.shopify", "cloudinary", "imgix", "cdn.", "media.", "images."];
  
  const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
  const isCdnUrl = cdnPatterns.some(pattern => lowerUrl.includes(pattern));
  
  return hasImageExtension || isCdnUrl;
}

function resolveUrl(imgUrl: string, baseUrl: string): string {
  if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
    return imgUrl;
  }
  if (imgUrl.startsWith("//")) {
    return "https:" + imgUrl;
  }
  try {
    const base = new URL(baseUrl);
    return new URL(imgUrl, base.origin).href;
  } catch {
    return imgUrl;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY")!;

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
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

    const body = await req.json().catch(() => ({}));
    const { url } = body;

    if (!url || !url.startsWith("http")) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin ${user.id} fetching images from: ${url}`);

    const images = await scrapeProductImages(url, firecrawlApiKey);

    return new Response(
      JSON.stringify({
        success: true,
        images,
        count: images.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-store-images:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

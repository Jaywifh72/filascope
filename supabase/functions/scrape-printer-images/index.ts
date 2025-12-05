import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapeResult {
  printerId: string;
  printerName: string;
  status: "success" | "failed" | "skipped";
  imagesFound: number;
  error?: string;
}

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

    // Dedupe and limit
    const uniqueImages = [...new Set(images)].slice(0, 10);
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

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json().catch(() => ({}));
    const { printerIds, limit = 10, forceRescrape = false } = body;

    console.log(`Admin ${user.id} starting printer image scrape. Limit: ${limit}, Force: ${forceRescrape}`);

    console.log(`Starting printer image scrape. Limit: ${limit}, Force: ${forceRescrape}`);

    // Build query for printers needing images
    let query = supabase
      .from("printers")
      .select(`
        id, 
        model_name, 
        official_product_url, 
        scraped_data,
        printer_brands!inner(brand)
      `)
      .eq("status", "active")
      .not("official_product_url", "is", null);

    if (printerIds && printerIds.length > 0) {
      query = query.in("id", printerIds);
    } else if (!forceRescrape) {
      // Only get printers without images
      query = query.or(
        "scraped_data.is.null,scraped_data->images->product_images.is.null,scraped_data->images->product_images.eq.[]"
      );
    }

    query = query.limit(limit);

    const { data: printers, error: printersError } = await query;

    if (printersError) {
      console.error("Error fetching printers:", printersError);
      throw printersError;
    }

    console.log(`Found ${printers?.length || 0} printers to process`);

    const results: ScrapeResult[] = [];

    for (const printer of printers || []) {
      const url = printer.official_product_url;
      
      if (!url || !url.startsWith("http")) {
        results.push({
          printerId: printer.id,
          printerName: printer.model_name,
          status: "skipped",
          imagesFound: 0,
          error: "Invalid or missing URL",
        });
        continue;
      }

      try {
        const images = await scrapeProductImages(url, firecrawlApiKey);
        
        if (images.length === 0) {
          results.push({
            printerId: printer.id,
            printerName: printer.model_name,
            status: "failed",
            imagesFound: 0,
            error: "No product images found",
          });
          continue;
        }

        // Update scraped_data with images
        const existingScrapedData = printer.scraped_data || {};
        const updatedScrapedData = {
          ...existingScrapedData,
          images: {
            ...(existingScrapedData.images || {}),
            product_images: images,
          },
        };

        const { error: updateError } = await supabase
          .from("printers")
          .update({ scraped_data: updatedScrapedData })
          .eq("id", printer.id);

        if (updateError) {
          console.error(`Error updating printer ${printer.id}:`, updateError);
          results.push({
            printerId: printer.id,
            printerName: printer.model_name,
            status: "failed",
            imagesFound: images.length,
            error: updateError.message,
          });
        } else {
          console.log(`Updated ${printer.model_name} with ${images.length} images`);
          results.push({
            printerId: printer.id,
            printerName: printer.model_name,
            status: "success",
            imagesFound: images.length,
          });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing ${printer.model_name}:`, error);
        results.push({
          printerId: printer.id,
          printerName: printer.model_name,
          status: "failed",
          imagesFound: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter(r => r.status === "success").length;
    const failedCount = results.filter(r => r.status === "failed").length;
    const skippedCount = results.filter(r => r.status === "skipped").length;

    console.log(`Completed: ${successCount} success, ${failedCount} failed, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.length,
          success: successCount,
          failed: failedCount,
          skipped: skippedCount,
        },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in scrape-printer-images:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

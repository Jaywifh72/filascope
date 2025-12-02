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
    return !lower.includes('icon') &&
           !lower.includes('logo') &&
           !lower.includes('favicon') &&
           !lower.includes('sprite') &&
           !lower.includes('placeholder') &&
           !lower.includes('loading') &&
           !lower.includes('avatar') &&
           !lower.includes('badge') &&
           !lower.includes('banner') &&
           !lower.includes('/flags/') &&
           !lower.includes('payment') &&
           !lower.includes('social') &&
           !lower.includes('facebook') &&
           !lower.includes('twitter') &&
           !lower.includes('instagram') &&
           !lower.includes('youtube') &&
           !lower.includes('1x1') &&
           !lower.includes('pixel') &&
           !lower.includes('tracking') &&
           (lower.includes('.jpg') || 
            lower.includes('.jpeg') || 
            lower.includes('.png') || 
            lower.includes('.webp') ||
            lower.includes('cdn') ||
            lower.includes('product') ||
            lower.includes('image'));
  });

  if (filteredImages.length === 0) return images[0] || null;
  if (filteredImages.length === 1) return filteredImages[0];

  // Use AI to select the best product image
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at identifying product images. You will be given a list of image URLs and product information. Select the URL that is most likely to be the main product image showing the actual physical product.
            
Prefer images that:
- Show the complete product clearly
- Are high resolution (look for larger dimensions in URL)
- Are from CDN or product image paths
- Have product-related keywords in the URL
- Are PNG, JPG, or WEBP format

Return ONLY the URL, nothing else.`
          },
          {
            role: "user",
            content: `Product: ${productName}
Brand: ${brand || 'Unknown'}
Type: ${accessoryType}

Select the best product image URL from these options:
${filteredImages.slice(0, 15).map((img, i) => `${i + 1}. ${img}`).join('\n')}

Return ONLY the best URL:`
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.error("AI API error:", await response.text());
      return filteredImages[0];
    }

    const data = await response.json();
    const selectedUrl = data.choices?.[0]?.message?.content?.trim();
    
    // Validate the response is actually a URL from our list
    if (selectedUrl && filteredImages.some(img => img === selectedUrl || selectedUrl.includes(img) || img.includes(selectedUrl))) {
      return selectedUrl;
    }
    
    // If AI returned something not in list, find closest match
    const match = filteredImages.find(img => selectedUrl?.includes(img) || img.includes(selectedUrl || ''));
    return match || filteredImages[0];
    
  } catch (error) {
    console.error("AI selection error:", error);
    return filteredImages[0];
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

    // Convert relative URLs to absolute
    const baseUrl = new URL(productUrl);
    const absoluteImages = Array.from(images).map(img => {
      try {
        if (img.startsWith('//')) return `https:${img}`;
        if (img.startsWith('/')) return `${baseUrl.origin}${img}`;
        if (!img.startsWith('http')) return new URL(img, productUrl).href;
        return img;
      } catch {
        return img;
      }
    });

    return absoluteImages;
  } catch (error) {
    console.error("Error scraping images:", error);
    return [];
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

    // Look for image URLs in search results
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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { accessoryType, accessoryId, forceUpdate } = await req.json();

    // Build query based on parameters
    let query = supabase
      .from("printer_accessories")
      .select("id, name, brand, product_url, accessory_type, image_url");

    if (accessoryId) {
      query = query.eq("id", accessoryId);
    } else if (accessoryType) {
      query = query.eq("accessory_type", accessoryType);
    }

    // Only get items without images unless forcing update
    if (!forceUpdate) {
      query = query.or("image_url.is.null,image_url.eq.,image_url.ilike.%placeholder%");
    }

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
      details: [] as { name: string; status: string; image?: string }[]
    };

    for (const accessory of accessories) {
      try {
        console.log(`Processing: ${accessory.name}`);

        let bestImage: string | null = null;

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
            results.details.push({ name: accessory.name, status: "update_failed" });
          } else {
            console.log(`Updated image for ${accessory.name}: ${bestImage}`);
            results.updated++;
            results.details.push({ name: accessory.name, status: "updated", image: bestImage });
          }
        } else {
          console.log(`No image found for ${accessory.name}`);
          results.skipped++;
          results.details.push({ name: accessory.name, status: "no_image_found" });
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

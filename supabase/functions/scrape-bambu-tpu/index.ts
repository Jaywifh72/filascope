import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FirecrawlResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: any;
    json?: any;
  };
  error?: string;
}

interface VariantData {
  id: number;
  title: string;
  price: string;
  available: boolean;
  featured_image?: { src: string } | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  sku: string | null;
}

interface ProductData {
  product: {
    id: number;
    title: string;
    handle: string;
    variants: VariantData[];
    images: Array<{ src: string; alt?: string }>;
  };
}

// TPU product configurations
const TPU_PRODUCTS = [
  {
    name: "TPU 95A HF",
    slug: "tpu-95a-hf",
    tdsUrl: "https://store.bblcdn.com/58df32731eab4c90a7dac9b12e13ba88.pdf",
    nozzleTempMin: 220,
    nozzleTempMax: 240,
    bedTempMin: 30,
    bedTempMax: 35,
    dryingTempC: 70,
    dryingTimeHours: 8,
  },
  {
    name: "TPU 85A / TPU 90A",
    slug: "tpu-85a-tpu-90a",
    tdsUrl: "https://cdn.shopify.com/s/files/1/0645/5876/0155/files/Bambu_TPU_90A_Technical_Data_Sheet_582bf8f6-1f0a-474c-aeda-9e72af3689dc.pdf?v=1741314674",
    nozzleTempMin: 200,
    nozzleTempMax: 250,
    bedTempMin: 30,
    bedTempMax: 35,
    dryingTempC: 70,
    dryingTimeHours: 8,
  },
  {
    name: "TPU for AMS",
    slug: "tpu-for-ams",
    tdsUrl: "https://store.bblcdn.com/s5/default/0a98353dce6d486ca848b21d2b19a207.pdf",
    nozzleTempMin: 220,
    nozzleTempMax: 240,
    bedTempMin: 30,
    bedTempMax: 35,
    dryingTempC: 70,
    dryingTimeHours: 8,
  },
];

// Color name to hex mapping for TPU products
const TPU_COLOR_HEX_MAP: Record<string, string> = {
  // TPU 95A HF colors
  "Black": "#101820",
  "White": "#FFFFFF",
  "Blue": "#0072CE",
  "Red": "#C8102E",
  "Yellow": "#F3E600",
  "Gray": "#898D8D",
  "Grey": "#898D8D",
  
  // TPU 85A/90A colors
  "BLACK": "#101820",
  "Cyan": "#00B5E2",
  "Orange": "#FF6A13",
  "Frozen": "#D1E8EF",
  
  // TPU for AMS colors
  "Neon Green": "#90FF1A",
  "Pink": "#FF69B4",
  "Sakura Pink": "#FFB7C5",
};

function getColorFamily(colorName: string): string {
  const lowerColor = colorName.toLowerCase();
  
  if (lowerColor.includes('black')) return 'Black';
  if (lowerColor.includes('white')) return 'White';
  if (lowerColor.includes('blue') || lowerColor.includes('cyan')) return 'Blue';
  if (lowerColor.includes('red')) return 'Red';
  if (lowerColor.includes('yellow')) return 'Yellow';
  if (lowerColor.includes('gray') || lowerColor.includes('grey')) return 'Gray';
  if (lowerColor.includes('orange')) return 'Orange';
  if (lowerColor.includes('green')) return 'Green';
  if (lowerColor.includes('pink') || lowerColor.includes('sakura')) return 'Pink';
  if (lowerColor.includes('purple')) return 'Purple';
  if (lowerColor.includes('frozen')) return 'Blue';
  
  return 'Other';
}

async function fetchProductJson(slug: string, region: string = 'ca'): Promise<ProductData | null> {
  // Try the regular product page first (not .json) as Firecrawl works better with HTML pages
  const productUrl = `https://${region}.store.bambulab.com/products/${slug}`;
  console.log(`Fetching product page: ${productUrl}`);
  
  // Check for Firecrawl API key
  const apiKey1 = Deno.env.get('FIRECRAWL_API_KEY_1');
  const apiKey2 = Deno.env.get('FIRECRAWL_API_KEY');
  const apiKey = apiKey1 || apiKey2;
  
  if (apiKey) {
    try {
      console.log(`Using Firecrawl for: ${productUrl}`);
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: productUrl,
          formats: ['html'],
          onlyMainContent: false,
          location: { 
            country: region === 'ca' ? 'CA' : region === 'uk' ? 'GB' : region.toUpperCase(), 
            languages: ['en'] 
          },
        }),
      });
      
      console.log(`Firecrawl response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        const html = result.data?.html || result.html || '';
        
        if (html) {
          // Extract product JSON from Shopify's embedded script tag
          const jsonMatch = html.match(/var\s+meta\s*=\s*(\{.*?\});/s) ||
                           html.match(/"product":\s*(\{[^}]+\})/s);
          
          // Try to find product data in the HTML
          // Look for the product JSON that Shopify embeds
          const productJsonMatch = html.match(/<script[^>]*type="application\/json"[^>]*data-product-json[^>]*>([^<]+)<\/script>/i) ||
                                   html.match(/<script[^>]*id="ProductJson[^"]*"[^>]*>([^<]+)<\/script>/i);
          
          if (productJsonMatch) {
            try {
              const productData = JSON.parse(productJsonMatch[1]);
              console.log(`Found embedded product JSON for ${slug}`);
              return { product: productData } as ProductData;
            } catch (e) {
              console.log(`Failed to parse embedded JSON: ${e}`);
            }
          }
          
          // Alternative: Extract from window.__PRELOADED_STATE__ or similar
          const preloadedMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*(\{.*?\});/s);
          if (preloadedMatch) {
            try {
              const preloaded = JSON.parse(preloadedMatch[1]);
              if (preloaded.product) {
                console.log(`Found preloaded product data for ${slug}`);
                return { product: preloaded.product } as ProductData;
              }
            } catch (e) {
              console.log(`Failed to parse preloaded state: ${e}`);
            }
          }
          
          // Try to extract variant data from the page
          console.log(`HTML length: ${html.length}, looking for variant data...`);
          
          // Look for variant selector data
          const variantMatch = html.match(/"variants"\s*:\s*(\[[^\]]+\])/);
          if (variantMatch) {
            try {
              const variants = JSON.parse(variantMatch[1]);
              console.log(`Found ${variants.length} variants in HTML`);
              
              // Extract title
              const titleMatch = html.match(/<h1[^>]*class="[^"]*product[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                                html.match(/<title>([^<]+)<\/title>/i);
              const title = titleMatch ? titleMatch[1].trim() : slug;
              
              return {
                product: {
                  id: 0,
                  title,
                  handle: slug,
                  variants,
                  images: [],
                }
              } as ProductData;
            } catch (e) {
              console.log(`Failed to parse variants: ${e}`);
            }
          }
          
          console.log(`Could not extract product data from HTML for ${slug}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`Firecrawl failed (${response.status}): ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.error(`Firecrawl error for ${slug}:`, error);
    }
  }
  
  // Fallback: Try the .json endpoint directly (might work for some regions)
  const jsonUrl = `https://${region}.store.bambulab.com/products/${slug}.json`;
  console.log(`Trying direct JSON fetch: ${jsonUrl}`);
  try {
    const response = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json,text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      console.error(`Direct JSON fetch failed for ${jsonUrl}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`Direct JSON fetch success for ${slug}`);
    return data as ProductData;
  } catch (error) {
    console.error(`Error fetching ${jsonUrl}:`, error);
    return null;
  }
}

async function fetchWithFirecrawl(url: string): Promise<FirecrawlResult | null> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('FIRECRAWL_API_KEY_1');
  
  if (!apiKey) {
    console.log('FIRECRAWL_API_KEY not configured, using direct fetch');
    return null;
  }
  
  console.log(`Using Firecrawl for: ${url}`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: false,
        location: { country: 'CA', languages: ['en'] },
      }),
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`Firecrawl error: ${response.status} - ${text}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Firecrawl error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dryRun = false, region = 'ca', useFirecrawl = false } = await req.json().catch(() => ({}));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`BAMBU LAB TPU SCRAPER - Region: ${region.toUpperCase()}`);
    console.log(`Dry Run: ${dryRun}, Use Firecrawl: ${useFirecrawl}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const results = {
      products: [] as any[],
      created: 0,
      updated: 0,
      errors: [] as string[],
    };
    
    // Get existing Bambu Lab brand
    const { data: brand } = await supabase
      .from('automated_brands')
      .select('id')
      .eq('brand_slug', 'bambulab')
      .single();
    
    const brandId = brand?.id || null;
    console.log(`Brand ID: ${brandId || 'Not found'}`);
    
    // Process each TPU product
    for (const product of TPU_PRODUCTS) {
      console.log(`\n--- Processing: ${product.name} ---`);
      
      // Fetch product data from Shopify JSON API
      const productData = await fetchProductJson(product.slug, region);
      
      if (!productData?.product) {
        results.errors.push(`Failed to fetch: ${product.name}`);
        continue;
      }
      
      const { product: shopifyProduct } = productData;
      console.log(`Found ${shopifyProduct.variants.length} variants`);
      
      // Process each color variant
      for (const variant of shopifyProduct.variants) {
        // Skip if not available
        // if (!variant.available) continue;
        
        const colorName = variant.option1 || variant.title;
        const cleanColorName = colorName.replace(/\s*\(.*?\)\s*/g, '').trim();
        
        // Determine if this is 85A or 90A based on color name
        let productName = product.name;
        if (product.slug === 'tpu-85a-tpu-90a') {
          // 85A colors: Cyan, Orange
          // 90A colors: Black, White, Frozen
          if (['Cyan', 'Orange'].includes(cleanColorName)) {
            productName = 'TPU 85A';
          } else {
            productName = 'TPU 90A';
          }
        }
        
        const fullTitle = `Bambu Lab ${productName} ${cleanColorName}`;
        const price = parseFloat(variant.price);
        const productUrl = `https://${region}.store.bambulab.com/products/${product.slug}`;
        
        // Get image - prefer variant image, fallback to product images
        let imageUrl = variant.featured_image?.src || null;
        if (!imageUrl && shopifyProduct.images.length > 0) {
          // Try to find matching image by color name in alt text
          const matchingImage = shopifyProduct.images.find(img => 
            img.alt?.toLowerCase().includes(cleanColorName.toLowerCase())
          );
          imageUrl = matchingImage?.src || shopifyProduct.images[0]?.src || null;
        }
        
        // Get color hex
        const colorHex = TPU_COLOR_HEX_MAP[cleanColorName] || 
                         TPU_COLOR_HEX_MAP[cleanColorName.toUpperCase()] || 
                         null;
        
        const variantData = {
          title: fullTitle,
          colorName: cleanColorName,
          price,
          priceField: region === 'ca' ? 'price_cad' : 'variant_price',
          imageUrl,
          productUrl,
          colorHex,
          colorFamily: getColorFamily(cleanColorName),
          available: variant.available,
          sku: variant.sku,
          productConfig: product,
        };
        
        results.products.push(variantData);
        
        console.log(`  ${cleanColorName}: $${price} ${variant.available ? '✓' : '✗'} ${colorHex || '(no hex)'}`);
        
        if (!dryRun) {
          // Check if filament exists
          const { data: existing } = await supabase
            .from('filaments')
            .select('id')
            .eq('product_title', fullTitle)
            .eq('vendor', 'Bambu Lab')
            .single();
          
          const filamentData: any = {
            product_title: fullTitle,
            vendor: 'Bambu Lab',
            material: 'TPU',
            brand_id: brandId,
            featured_image: imageUrl,
            color_hex: colorHex,
            color_family: variantData.colorFamily,
            product_url: productUrl,
            product_url_ca: region === 'ca' ? productUrl : null,
            variant_available: variant.available,
            variant_sku: variant.sku,
            tds_url: product.tdsUrl,
            nozzle_temp_min_c: product.nozzleTempMin,
            nozzle_temp_max_c: product.nozzleTempMax,
            bed_temp_min_c: product.bedTempMin,
            bed_temp_max_c: product.bedTempMax,
            drying_temp_c: product.dryingTempC,
            drying_time_hours: product.dryingTimeHours,
            diameter_nominal_mm: 1.75,
            net_weight_g: 500,
            updated_at: new Date().toISOString(),
          };
          
          // Set price based on region
          if (region === 'ca') {
            filamentData.price_cad = price;
          } else if (region === 'us') {
            filamentData.variant_price = price;
          }
          
          if (existing) {
            // Update existing
            const { error } = await supabase
              .from('filaments')
              .update(filamentData)
              .eq('id', existing.id);
            
            if (error) {
              results.errors.push(`Update failed for ${fullTitle}: ${error.message}`);
            } else {
              results.updated++;
            }
          } else {
            // Create new
            filamentData.created_at = new Date().toISOString();
            
            const { error } = await supabase
              .from('filaments')
              .insert(filamentData);
            
            if (error) {
              results.errors.push(`Insert failed for ${fullTitle}: ${error.message}`);
            } else {
              results.created++;
            }
          }
        }
      }
      
      // Rate limit between products
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total variants found: ${results.products.length}`);
    console.log(`Created: ${results.created}`);
    console.log(`Updated: ${results.updated}`);
    console.log(`Errors: ${results.errors.length}`);
    if (results.errors.length > 0) {
      console.log(`Errors:`, results.errors);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        region,
        summary: {
          totalVariants: results.products.length,
          created: results.created,
          updated: results.updated,
          errors: results.errors.length,
        },
        products: results.products,
        errors: results.errors,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Scraper error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

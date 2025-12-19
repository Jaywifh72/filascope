import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Regional store configuration for Bambu Lab
const BAMBU_REGIONAL_STORES: Record<string, { 
  subdomain: string; 
  currency: string; 
  currencySymbol: string;
  priceField: string;
  urlField: string;
  fallbackPrice: number; // Fallback if Firecrawl scraping fails
}> = {
  US: { subdomain: "us", currency: "USD", currencySymbol: "$", priceField: "variant_price", urlField: "product_url", fallbackPrice: 19.99 },
  CA: { subdomain: "ca", currency: "CAD", currencySymbol: "C$", priceField: "price_cad", urlField: "product_url_ca", fallbackPrice: 25.99 },
  UK: { subdomain: "uk", currency: "GBP", currencySymbol: "£", priceField: "price_gbp", urlField: "product_url_uk", fallbackPrice: 17.99 },
  EU: { subdomain: "eu", currency: "EUR", currencySymbol: "€", priceField: "price_eur", urlField: "product_url_eu", fallbackPrice: 21.99 },
  AU: { subdomain: "au", currency: "AUD", currencySymbol: "A$", priceField: "price_aud", urlField: "product_url_au", fallbackPrice: 29.99 },
  JP: { subdomain: "jp", currency: "JPY", currencySymbol: "¥", priceField: "price_jpy", urlField: "product_url_jp", fallbackPrice: 2980 },
};

// Firecrawl geo-location mapping for each region
const REGION_TO_FIRECRAWL_LOCATION: Record<string, { country: string; languages: string[] }> = {
  US: { country: "US", languages: ["en"] },
  CA: { country: "CA", languages: ["en"] },
  UK: { country: "GB", languages: ["en"] },
  EU: { country: "DE", languages: ["en", "de"] },
  AU: { country: "AU", languages: ["en"] },
  JP: { country: "JP", languages: ["ja", "en"] },
};

// Bambu Lab ABS Color variants with official hex codes, image URLs, and Shopify variant IDs
// Image URLs and variant IDs extracted from: https://us.store.bambulab.com/products/abs-filament
const BAMBU_ABS_COLORS: Record<string, { hex: string; colorFamily: string; imageUrl: string; variantId: string }> = {
  "Silver": { hex: "#87909A", colorFamily: "Gray", imageUrl: "https://store.bblcdn.com/s7/default/69834a7536c540e489913a0f8e707e5e/ABSsilver.png", variantId: "40102" },
  "Black": { hex: "#000000", colorFamily: "Black", imageUrl: "https://store.bblcdn.com/s7/default/cfdefec225e6430c82cbe2f8766b6f70/ABS_Black.png", variantId: "40099" },
  "White": { hex: "#FFFFFF", colorFamily: "White", imageUrl: "https://store.bblcdn.com/s7/default/1ad485ff4a72413b90e944ffde4fa861/ABS_White.png", variantId: "40100" },
  "Bambu Green": { hex: "#00AE42", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s7/default/910be80e4fcf43ddbd66c40773ecce0f/ABSbambugreen.png", variantId: "40103" },
  "Orange": { hex: "#FF6A13", colorFamily: "Orange", imageUrl: "https://store.bblcdn.com/s7/default/25d7b833bf694c70b9ef3cd649f3cf36/ABSorange.png", variantId: "40104" },
  "Red": { hex: "#D32941", colorFamily: "Red", imageUrl: "https://store.bblcdn.com/s7/default/95bd38c6dc604bdab7b3d2fc7b67e0ee/ABS_Red.png", variantId: "40105" },
  "Blue": { hex: "#0A2CA5", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/3b2f526b80734e429d9a424e07f3c36b/ABS_Blue.png", variantId: "40106" },
  "Olive": { hex: "#789D4A", colorFamily: "Green", imageUrl: "https://store.bblcdn.com/s7/default/e45f66c840c7454b860b0ffb17787dda/80cf6768c03d129dfa6a01ac67a5b402.jpg", variantId: "40107" },
  "Tangerine Yellow": { hex: "#FFC72C", colorFamily: "Yellow", imageUrl: "https://store.bblcdn.com/s7/default/599d443346194649beee96e12f32d074/7376d19b161f2a93a4051e47289d0505.jpg", variantId: "40108" },
  "Azure": { hex: "#489FDF", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/1de0e532e21642e1a4a857c6e01fa1d3/0be9a584b30358020d8706f2aa8ec9c2.jpg", variantId: "40109" },
  "Navy Blue": { hex: "#0C2340", colorFamily: "Blue", imageUrl: "https://store.bblcdn.com/s7/default/a840092ea2804025a123e115128c1299/000878ce6144c05ffac949f66b05a18b.jpg", variantId: "40110" },
  "Purple": { hex: "#AF1685", colorFamily: "Purple", imageUrl: "https://store.bblcdn.com/s7/default/a840092ea2804025a123e115128c1299/000878ce6144c05ffac949f66b05a18b.jpg", variantId: "40111" },
};

// Base product data extracted from Bambu Lab's ABS product page
const BAMBU_ABS_BASE_DATA = {
  vendor: "Bambu Lab",
  material: "ABS",
  nozzle_temp_min_c: 240,
  nozzle_temp_max_c: 270,
  bed_temp_min_c: 80,
  bed_temp_max_c: 100,
  print_speed_max_mms: 300,
  density_g_cm3: 1.05,
  tensile_strength_xy_mpa: 33,
  elongation_break_xy_percent: 10.5,
  flexural_strength_mpa: 62,
  tds_url: "https://store.bblcdn.com/s7/default/23b4cf2b83d5470bb96d19970b5f3ae8/Bambu_ABS_Technical_Data_Sheet_V3.pdf",
  drying_temp_c: 80,
  drying_time_hours: 8,
  diameter_nominal_mm: 1.75,
  net_weight_g: 1000,
};

// Helper to get the product URL for a specific region
const getRegionalProductUrl = (region: string, variantId: string): string => {
  const store = BAMBU_REGIONAL_STORES[region] || BAMBU_REGIONAL_STORES.US;
  return `https://${store.subdomain}.store.bambulab.com/products/abs-filament?variant=${variantId}`;
};

// Get fallback prices (used if Firecrawl scraping fails)
function getFallbackPrices(): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const [region, config] of Object.entries(BAMBU_REGIONAL_STORES)) {
    prices[region] = config.fallbackPrice;
  }
  return prices;
}

// Validate that the scraped price matches the expected currency for the region
function validateCurrency(html: string, region: string): boolean {
  const store = BAMBU_REGIONAL_STORES[region];
  if (!store) return false;

  // Check for currency in meta tags
  const metaCurrencyMatch = html.match(/<meta[^>]*property=["']product:price:currency["'][^>]*content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']product:price:currency["']/i);
  if (metaCurrencyMatch) {
    const foundCurrency = metaCurrencyMatch[1].toUpperCase();
    if (foundCurrency === store.currency) {
      console.log(`[${region}] Currency validated via meta tag: ${foundCurrency}`);
      return true;
    } else {
      console.warn(`[${region}] Currency mismatch! Expected ${store.currency}, found ${foundCurrency}`);
      return false;
    }
  }

  // Check for currency in JSON-LD
  const jsonLdMatch = html.match(/"priceCurrency"\s*:\s*"([^"]+)"/i);
  if (jsonLdMatch) {
    const foundCurrency = jsonLdMatch[1].toUpperCase();
    if (foundCurrency === store.currency) {
      console.log(`[${region}] Currency validated via JSON-LD: ${foundCurrency}`);
      return true;
    } else {
      console.warn(`[${region}] Currency mismatch! Expected ${store.currency}, found ${foundCurrency}`);
      return false;
    }
  }

  // Check for regional currency markers in the HTML
  const currencyPatterns: Record<string, RegExp[]> = {
    CAD: [/CA\s*\$/i, /CAD/i, /\$\s*\d+.*CAD/i],
    GBP: [/£/],
    EUR: [/€/, /EUR/i],
    AUD: [/AU\s*\$/i, /AUD/i, /\$\s*\d+.*AUD/i],
    JPY: [/¥/, /JPY/i, /円/],
    USD: [/\$\s*\d+/, /USD/i], // More generic, so check last
  };

  const patterns = currencyPatterns[store.currency];
  if (patterns) {
    for (const pattern of patterns) {
      if (pattern.test(html)) {
        console.log(`[${region}] Currency validated via pattern: ${store.currency}`);
        return true;
      }
    }
  }

  console.warn(`[${region}] Could not validate currency`);
  return false;
}

// Check if the response was redirected to a different regional store
function detectRedirect(sourceUrl: string | undefined, expectedRegion: string): boolean {
  if (!sourceUrl) return false;
  
  const store = BAMBU_REGIONAL_STORES[expectedRegion];
  if (!store) return false;
  
  const expectedDomain = `${store.subdomain}.store.bambulab.com`;
  const isCorrectRegion = sourceUrl.includes(expectedDomain);
  
  if (!isCorrectRegion) {
    console.warn(`[${expectedRegion}] Redirect detected! Expected ${expectedDomain}, got ${sourceUrl}`);
  }
  
  return !isCorrectRegion;
}

// Expected price ranges for Bambu Lab ABS
const BAMBU_LAB_PRICE_RANGES: Record<string, [number, number]> = {
  USD: [18, 40],
  CAD: [22, 50],
  GBP: [16, 35],
  EUR: [18, 40],
  AUD: [25, 55],
  JPY: [2500, 6000],
};

// Keywords that indicate discount/bulk pricing (EXCLUDE these)
const DISCOUNT_EXCLUSION_KEYWORDS = [
  'as low as', 'low as', 'per roll', 'per spool', 'bulk', 'discount',
  '% off', 'save ', 'savings', 'bundle', 'pack of', 'multi-pack',
  'subscribe', 'subscription', 'qty', 'quantity'
];

// Check if text contains discount-related keywords
function containsDiscountKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return DISCOUNT_EXCLUSION_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

// Extract numeric price from a text string
function extractNumericPrice(text: string, currency: string): number | null {
  // Remove currency symbols and clean the string
  const cleaned = text.replace(/[C$A$£€¥,\s]/g, '').replace(/CA|AU|US|JP/gi, '');
  const match = cleaned.match(/(\d+\.?\d*)/);
  if (match) {
    const price = parseFloat(match[1]);
    if (!isNaN(price) && price > 0) {
      return price;
    }
  }
  return null;
}

// Extract price from JSON-LD
function extractFromJsonLd(html: string): number | null {
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
        const jsonData = JSON.parse(jsonContent);
        if (jsonData['@type'] === 'Product' && jsonData.offers) {
          const offers = Array.isArray(jsonData.offers) ? jsonData.offers : [jsonData.offers];
          for (const offer of offers) {
            if (offer.price) {
              const price = parseFloat(offer.price);
              if (!isNaN(price) && price > 0) {
                return price;
              }
            }
          }
        }
      } catch {
        // Invalid JSON, continue
      }
    }
  }
  return null;
}

// Extract price from meta tags
function extractFromMetaTags(html: string): number | null {
  const metaPriceMatch = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']product:price:amount["']/i);
  if (metaPriceMatch) {
    const price = parseFloat(metaPriceMatch[1]);
    if (!isNaN(price) && price > 0) {
      return price;
    }
  }
  return null;
}

// BAMBU LAB SPECIFIC PRICE EXTRACTOR - with validation and discount filtering
function extractBambuLabPrice(html: string, markdown: string, region: string): { price: number; source: string } | null {
  const store = BAMBU_REGIONAL_STORES[region];
  if (!store) return null;

  const [minExpected, maxExpected] = BAMBU_LAB_PRICE_RANGES[store.currency] || [15, 80];
  console.log(`[${region}] Expected price range: ${minExpected}-${maxExpected} ${store.currency}`);

  // Strategy 1: Look for bbl-title-1 class (Bambu Lab's main price element)
  const bblTitleMatch = html.match(/class="[^"]*bbl-title-1[^"]*"[^>]*>([^<]*(?:\$|€|£|¥|C\$|CA\$|A\$)[^<]*)<\/[^>]+>/i);
  if (bblTitleMatch) {
    const priceText = bblTitleMatch[1];
    console.log(`[${region}] Found bbl-title-1 price text: "${priceText}"`);
    
    // Check for discount keywords in surrounding context
    const matchIndex = html.indexOf(bblTitleMatch[0]);
    const context = html.substring(Math.max(0, matchIndex - 200), Math.min(html.length, matchIndex + 200));
    
    if (!containsDiscountKeywords(context)) {
      const price = extractNumericPrice(priceText, store.currency);
      if (price && price >= minExpected && price <= maxExpected) {
        console.log(`[${region}] ✓ bbl-title-1 price VALID: ${price} ${store.currency}`);
        return { price, source: 'bbl-title-1' };
      } else if (price) {
        console.log(`[${region}] REJECTED bbl-title-1 price ${price}: outside range ${minExpected}-${maxExpected}`);
      }
    }
  }

  // Strategy 2: Look for "From $XX.XX" pattern (Bambu's standard format)
  const fromPricePatterns = [
    /From\s+(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
    /Starting\s+(?:at\s+)?(?:\$|€|£|C\$|CA\$|A\$|¥)\s*(\d{1,3}(?:[.,]\d{2})?)/gi,
  ];
  
  for (const pattern of fromPricePatterns) {
    const matches = [...html.matchAll(pattern)];
    for (const match of matches) {
      const fullMatch = match[0];
      const priceStr = match[1].replace(',', '.');
      const price = parseFloat(priceStr);
      
      // Check context for discount keywords
      const matchIndex = html.indexOf(fullMatch);
      const context = html.substring(Math.max(0, matchIndex - 200), Math.min(html.length, matchIndex + 200));
      
      if (containsDiscountKeywords(context)) {
        console.log(`[${region}] REJECTED "From" price ${price}: discount keywords in context`);
        continue;
      }
      
      if (price >= minExpected && price <= maxExpected) {
        console.log(`[${region}] ✓ "From" price VALID: ${price} ${store.currency}`);
        return { price, source: 'from-pattern' };
      } else {
        console.log(`[${region}] REJECTED "From" price ${price}: outside range ${minExpected}-${maxExpected}`);
      }
    }
  }

  // Strategy 3: JSON-LD structured data
  const jsonLdPrice = extractFromJsonLd(html);
  if (jsonLdPrice) {
    console.log(`[${region}] Found JSON-LD price: ${jsonLdPrice}`);
    if (jsonLdPrice >= minExpected && jsonLdPrice <= maxExpected) {
      console.log(`[${region}] ✓ JSON-LD price VALID: ${jsonLdPrice} ${store.currency}`);
      return { price: jsonLdPrice, source: 'json-ld' };
    } else {
      console.log(`[${region}] REJECTED JSON-LD price ${jsonLdPrice}: outside range ${minExpected}-${maxExpected}`);
    }
  }

  // Strategy 4: Meta tags
  const metaPrice = extractFromMetaTags(html);
  if (metaPrice) {
    console.log(`[${region}] Found meta tag price: ${metaPrice}`);
    if (metaPrice >= minExpected && metaPrice <= maxExpected) {
      console.log(`[${region}] ✓ Meta tag price VALID: ${metaPrice} ${store.currency}`);
      return { price: metaPrice, source: 'meta-tag' };
    } else {
      console.log(`[${region}] REJECTED meta price ${metaPrice}: outside range ${minExpected}-${maxExpected}`);
    }
  }

  // Strategy 5: Markdown "From" patterns (cleaner than HTML)
  const mdFromMatch = markdown.match(/From\s+(?:\$|€|£|C\$|CA\$|A\$|¥)?\s*(\d{1,3}(?:[.,]\d{2})?)/i);
  if (mdFromMatch) {
    const price = parseFloat(mdFromMatch[1].replace(',', '.'));
    if (price >= minExpected && price <= maxExpected) {
      console.log(`[${region}] ✓ Markdown "From" price VALID: ${price} ${store.currency}`);
      return { price, source: 'markdown-from' };
    }
  }

  console.warn(`[${region}] Could not extract valid price from any strategy`);
  return null;
}

// Fetch regional price using Firecrawl with geo-located proxy
async function fetchRegionalPriceWithFirecrawl(
  region: string, 
  variantId: string
): Promise<{ price: number | null; source: 'firecrawl' | 'fallback'; error?: string }> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlKey) {
    console.log(`[${region}] No Firecrawl API key, using fallback price`);
    return { 
      price: BAMBU_REGIONAL_STORES[region]?.fallbackPrice || null, 
      source: 'fallback',
      error: 'No Firecrawl API key configured'
    };
  }

  const store = BAMBU_REGIONAL_STORES[region];
  const location = REGION_TO_FIRECRAWL_LOCATION[region];
  
  if (!store || !location) {
    console.warn(`[${region}] Unknown region, using fallback`);
    return { price: store?.fallbackPrice || null, source: 'fallback', error: 'Unknown region' };
  }

  const url = getRegionalProductUrl(region, variantId);
  console.log(`[${region}] Scraping ${url} with geo-location: ${location.country}`);

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'markdown'], // Request both for better extraction
        onlyMainContent: false,
        waitFor: 3000,
        location, // Geo-located proxy!
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${region}] Firecrawl API error: ${response.status} - ${errorText}`);
      return { 
        price: store.fallbackPrice, 
        source: 'fallback',
        error: `Firecrawl API error: ${response.status}`
      };
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error(`[${region}] Firecrawl scrape failed:`, data.error);
      return { 
        price: store.fallbackPrice, 
        source: 'fallback',
        error: data.error || 'Firecrawl scrape failed'
      };
    }

    const html = data.data?.html || data.html || '';
    const markdown = data.data?.markdown || data.markdown || '';
    const sourceUrl = data.data?.metadata?.sourceURL || data.metadata?.sourceURL;

    // Check for redirect to different regional store
    if (detectRedirect(sourceUrl, region)) {
      console.warn(`[${region}] Detected redirect, using fallback price`);
      return { 
        price: store.fallbackPrice, 
        source: 'fallback',
        error: `Redirected from ${store.subdomain}.store to different region`
      };
    }

    // Validate currency
    if (!validateCurrency(html, region)) {
      console.warn(`[${region}] Currency validation failed, using fallback price`);
      return { 
        price: store.fallbackPrice, 
        source: 'fallback',
        error: `Currency validation failed (expected ${store.currency})`
      };
    }

    // Extract price using Bambu Lab-specific extractor with validation
    const priceResult = extractBambuLabPrice(html, markdown, region);
    
    if (priceResult) {
      console.log(`[${region}] Successfully scraped price: ${priceResult.price} ${store.currency} (via ${priceResult.source})`);
      return { price: priceResult.price, source: 'firecrawl' };
    }

    console.warn(`[${region}] Could not extract price, using fallback`);
    return { 
      price: store.fallbackPrice, 
      source: 'fallback',
      error: 'Price extraction failed'
    };

  } catch (error) {
    console.error(`[${region}] Firecrawl error:`, error);
    return { 
      price: store.fallbackPrice, 
      source: 'fallback',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Fetch all regional prices with Firecrawl geo-located scraping
async function fetchAllRegionalPrices(variantId: string): Promise<{
  prices: Record<string, number>;
  sources: Record<string, 'firecrawl' | 'fallback'>;
  errors: Record<string, string>;
}> {
  const prices: Record<string, number> = {};
  const sources: Record<string, 'firecrawl' | 'fallback'> = {};
  const errors: Record<string, string> = {};

  // Fetch all regions in parallel (with slight stagger to avoid rate limits)
  const regions = Object.keys(BAMBU_REGIONAL_STORES);
  
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    
    // Small delay between requests to avoid rate limiting
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const result = await fetchRegionalPriceWithFirecrawl(region, variantId);
    
    if (result.price !== null) {
      prices[region] = result.price;
    }
    sources[region] = result.source;
    if (result.error) {
      errors[region] = result.error;
    }
  }

  return { prices, sources, errors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await authClient.rpc("has_role", { _role: "admin", _user_id: user.id });
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let options: { dryRun?: boolean; material?: string } = {};
    try {
      options = await req.json();
    } catch {
      // No body or invalid JSON, use defaults
    }
    
    const dryRun = options.dryRun ?? false;
    const targetMaterial = options.material ?? "ABS";

    console.log(`Starting Bambu Lab color sync for ${targetMaterial} (dryRun: ${dryRun})`);

    // Get existing Bambu Lab filaments
    const { data: existingFilaments, error: fetchError } = await supabase
      .from("filaments")
      .select("id, product_title, color_hex, color_family, featured_image, product_url, variant_price, price_cad, price_gbp, price_eur, price_aud, price_jpy, product_url_ca, product_url_uk, product_url_eu, product_url_au, product_url_jp")
      .eq("vendor", "Bambu Lab")
      .ilike("product_title", `%${targetMaterial}%`);

    if (fetchError) {
      throw new Error(`Failed to fetch filaments: ${fetchError.message}`);
    }

    console.log(`Found ${existingFilaments?.length || 0} existing Bambu Lab ${targetMaterial} filaments`);

    // Fetch regional prices using Firecrawl geo-located scraping
    // Uses the first variant ID since all colors have the same price
    const firstVariantId = Object.values(BAMBU_ABS_COLORS)[0].variantId;
    console.log("Fetching regional prices with Firecrawl geo-located proxies...");
    
    const { prices: regionalPrices, sources: priceSources, errors: priceErrors } = 
      await fetchAllRegionalPrices(firstVariantId);
    
    console.log("Regional prices fetched:", regionalPrices);
    console.log("Price sources:", priceSources);
    if (Object.keys(priceErrors).length > 0) {
      console.log("Price fetch errors:", priceErrors);
    }

    const results: Array<{
      color: string;
      action: "created" | "updated" | "skipped";
      filamentId?: string;
      title: string;
      prices?: Record<string, number>;
      priceSources?: Record<string, string>;
    }> = [];

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Process each color variant
    for (const [colorName, colorData] of Object.entries(BAMBU_ABS_COLORS)) {
      const productTitle = `Bambu Lab ${targetMaterial} - ${colorName}`;
      
      // Check if this specific color variant already exists
      const existing = existingFilaments?.find(f => 
        f.product_title === productTitle ||
        (f.product_title === `Bambu Lab ${targetMaterial}` && f.color_hex === colorData.hex)
      );

      // Build regional URLs and prices for this variant
      const regionalData: Record<string, unknown> = {
        // US is the default/primary
        product_url: getRegionalProductUrl("US", colorData.variantId),
        variant_price: regionalPrices.US,
        // Other regions
        product_url_ca: getRegionalProductUrl("CA", colorData.variantId),
        price_cad: regionalPrices.CA,
        product_url_uk: getRegionalProductUrl("UK", colorData.variantId),
        price_gbp: regionalPrices.UK,
        product_url_eu: getRegionalProductUrl("EU", colorData.variantId),
        price_eur: regionalPrices.EU,
        product_url_au: getRegionalProductUrl("AU", colorData.variantId),
        price_aud: regionalPrices.AU,
        product_url_jp: getRegionalProductUrl("JP", colorData.variantId),
        price_jpy: regionalPrices.JP,
      };

      if (existing) {
        // Check if we need to update
        const needsUpdate = 
          existing.color_hex !== colorData.hex || 
          existing.color_family !== colorData.colorFamily ||
          existing.featured_image !== colorData.imageUrl ||
          existing.product_url !== regionalData.product_url ||
          existing.variant_price !== regionalData.variant_price ||
          existing.price_cad !== regionalData.price_cad ||
          existing.price_gbp !== regionalData.price_gbp ||
          existing.price_eur !== regionalData.price_eur ||
          existing.price_aud !== regionalData.price_aud ||
          existing.price_jpy !== regionalData.price_jpy ||
          existing.product_url_ca !== regionalData.product_url_ca ||
          existing.product_url_uk !== regionalData.product_url_uk ||
          existing.product_url_eu !== regionalData.product_url_eu ||
          existing.product_url_au !== regionalData.product_url_au ||
          existing.product_url_jp !== regionalData.product_url_jp;

        if (needsUpdate && !dryRun) {
          const updateData: Record<string, unknown> = {
            color_hex: colorData.hex,
            color_family: colorData.colorFamily,
            featured_image: colorData.imageUrl,
            ...regionalData,
          };
          
          const { error: updateError } = await supabase
            .from("filaments")
            .update(updateData)
            .eq("id", existing.id);

          if (updateError) {
            console.error(`Failed to update ${productTitle}:`, updateError.message);
          } else {
            updated++;
            results.push({
              color: colorName,
              action: "updated",
              filamentId: existing.id,
              title: productTitle,
              prices: regionalPrices,
            });
            console.log(`Updated ${productTitle} with regional prices`);
          }
        } else if (needsUpdate && dryRun) {
          results.push({
            color: colorName,
            action: "updated",
            filamentId: existing.id,
            title: productTitle,
            prices: regionalPrices,
          });
        } else {
          skipped++;
          results.push({
            color: colorName,
            action: "skipped",
            filamentId: existing.id,
            title: existing.product_title,
          });
        }
      } else {
        // Create new color variant
        if (!dryRun) {
          const newFilament = {
            product_title: productTitle,
            vendor: BAMBU_ABS_BASE_DATA.vendor,
            material: BAMBU_ABS_BASE_DATA.material,
            color_hex: colorData.hex,
            color_family: colorData.colorFamily,
            nozzle_temp_min_c: BAMBU_ABS_BASE_DATA.nozzle_temp_min_c,
            nozzle_temp_max_c: BAMBU_ABS_BASE_DATA.nozzle_temp_max_c,
            bed_temp_min_c: BAMBU_ABS_BASE_DATA.bed_temp_min_c,
            bed_temp_max_c: BAMBU_ABS_BASE_DATA.bed_temp_max_c,
            print_speed_max_mms: BAMBU_ABS_BASE_DATA.print_speed_max_mms,
            density_g_cm3: BAMBU_ABS_BASE_DATA.density_g_cm3,
            tensile_strength_xy_mpa: BAMBU_ABS_BASE_DATA.tensile_strength_xy_mpa,
            elongation_break_xy_percent: BAMBU_ABS_BASE_DATA.elongation_break_xy_percent,
            flexural_strength_mpa: BAMBU_ABS_BASE_DATA.flexural_strength_mpa,
            tds_url: BAMBU_ABS_BASE_DATA.tds_url,
            drying_temp_c: BAMBU_ABS_BASE_DATA.drying_temp_c,
            drying_time_hours: BAMBU_ABS_BASE_DATA.drying_time_hours,
            diameter_nominal_mm: BAMBU_ABS_BASE_DATA.diameter_nominal_mm,
            net_weight_g: BAMBU_ABS_BASE_DATA.net_weight_g,
            featured_image: colorData.imageUrl,
            auto_created: true,
            variant_available: true,
            ...regionalData,
          };

          const { data: inserted, error: insertError } = await supabase
            .from("filaments")
            .insert(newFilament)
            .select("id")
            .single();

          if (insertError) {
            console.error(`Failed to create ${productTitle}:`, insertError.message);
          } else {
            created++;
            results.push({
              color: colorName,
              action: "created",
              filamentId: inserted.id,
              title: productTitle,
              prices: regionalPrices,
            });
            console.log(`Created ${productTitle} with regional prices`);
          }
        } else {
          results.push({
            color: colorName,
            action: "created",
            title: productTitle,
            prices: regionalPrices,
          });
        }
      }
    }

    const summary = {
      success: true,
      dryRun,
      material: targetMaterial,
      existingCount: existingFilaments?.length || 0,
      colorsProcessed: Object.keys(BAMBU_ABS_COLORS).length,
      created,
      updated,
      skipped,
      regionalPrices,
      priceSources, // Shows which prices came from Firecrawl vs fallback
      priceErrors: Object.keys(priceErrors).length > 0 ? priceErrors : undefined,
      results,
    };

    console.log(`Sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in sync-bambulab-colors:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
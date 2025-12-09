import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceData {
  filament_id: string;
  region: string;
  price: number;
}

interface WeightData {
  weight_g: number;
  source: string;
}

interface PackInfo {
  quantity: number;
  totalPrice: number;
  pricePerSpool: number;
  pricePerKg: number | null;
  weightPerSpool: number | null;
}

// Detect spool weight in kg from product title, URL, or HTML content
function detectSpoolWeightKg(title: string, html: string, url: string = ''): number {
  const combinedText = `${title.toLowerCase()} ${url.toLowerCase()}`;
  
  // Common weight patterns - check for 2kg, 3kg, etc.
  const weightPatterns = [
    /\b(\d+(?:\.\d+)?)\s*kg\b/i,           // "2kg", "2.2kg"
    /\b(\d+(?:\.\d+)?)\s*kilogram/i,       // "2 kilogram"
    /\b(\d+(?:\.\d+)?)-?kg\b/i,            // "2-kg"
    /\b(\d+)\s*(?:kilo|kilos)\b/i,         // "2 kilo", "2 kilos"
  ];
  
  for (const pattern of weightPatterns) {
    const match = combinedText.match(pattern);
    if (match && match[1]) {
      const weight = parseFloat(match[1]);
      // Valid spool weights: 0.25kg to 5kg
      if (weight >= 0.25 && weight <= 5) {
        console.log(`  ⚖️ Spool weight detected: ${weight}kg from pattern "${pattern}"`);
        return weight;
      }
    }
  }
  
  // Check HTML for weight info (often in product specs)
  const htmlWeightPatterns = [
    /net\s*weight[:\s]*(\d+(?:\.\d+)?)\s*kg/i,
    /spool\s*weight[:\s]*(\d+(?:\.\d+)?)\s*kg/i,
    /(\d+(?:\.\d+)?)\s*kg\s*(?:spool|roll|filament)/i,
  ];
  
  for (const pattern of htmlWeightPatterns) {
    const match = html.toLowerCase().match(pattern);
    if (match && match[1]) {
      const weight = parseFloat(match[1]);
      if (weight >= 0.25 && weight <= 5) {
        console.log(`  ⚖️ Spool weight detected from HTML: ${weight}kg`);
        return weight;
      }
    }
  }
  
  // Default to 1kg
  return 1;
}

// Detect pack quantity from product title, URL, or HTML content
function detectPackQuantity(title: string, html: string, url: string = ''): number {
  const titleLower = title.toLowerCase();
  const htmlLower = html.toLowerCase();
  const urlLower = url.toLowerCase();
  
  // Combine title and URL for pattern matching (URL often has "6-pack" etc.)
  const combinedText = `${titleLower} ${urlLower}`;
  
  // Common pack patterns in titles - order matters, most specific first
  const packPatterns = [
    // "6 Spools", "6 Rolls" - MUST be before other patterns
    /\b(\d+)\s+spools?\b/i,
    /\b(\d+)\s+rolls?\b/i,
    // "2-Pack", "3-Pack", "4-Pack", etc.
    /(\d+)\s*[-–]?\s*pack/i,
    // "Pack of 2", "Pack of 3", etc.
    /pack\s+of\s+(\d+)/i,
    // "2 Pack", "3 Pack" (space separated)
    /\b(\d+)\s+pack\b/i,
    // "2x 1kg", "3x 1kg", "6x1kg" - quantity multiplier
    /\b(\d+)\s*x\s*\d+(?:\.\d+)?\s*(?:kg|g)\b/i,
    // "2x", "3x", "6x" at word boundary (e.g., "6x PLA")
    /\b(\d+)x\b/i,
    // Bundle patterns
    /bundle\s+of\s+(\d+)/i,
    // "2-Count", "3-Count"
    /(\d+)\s*[-–]?\s*count/i,
    // "Multipack 2", "Multi-pack 3"
    /multi[-\s]?pack\s*(\d+)?/i,
    // Quantity in parentheses: "(2)", "(6 spools)"
    /\((\d+)\s*(?:pack|spools?|rolls?|pcs?)?\s*\)/i,
    // "Set of 6", "Box of 4"
    /(?:set|box)\s+of\s+(\d+)/i,
    // "6-color", "8-color" often indicates pack quantity
    /(\d+)\s*[-–]?\s*colou?rs?\b/i,
    // Quantity before weight: "6 x 1kg", "4 x 250g"
    /\b(\d+)\s*[xX×]\s*\d+/,
  ];
  
  // Check title and URL combined (URL often has "6-pack" in slug)
  for (const pattern of packPatterns) {
    const match = combinedText.match(pattern);
    if (match && match[1]) {
      const qty = parseInt(match[1], 10);
      if (qty >= 2 && qty <= 20) {
        console.log(`  📦 Pack detected from title/URL pattern "${pattern}": ${qty}x`);
        return qty;
      }
    }
  }
  
  // Check for price-per-unit indicators that suggest multi-pack
  // e.g., "$12.49/spool" when total is $74.99 suggests 6-pack
  const pricePerUnitMatch = titleLower.match(/\$([0-9.]+)\s*\/\s*(?:spool|roll|kg)/i);
  if (pricePerUnitMatch) {
    const pricePerUnit = parseFloat(pricePerUnitMatch[1]);
    // Look for total price in HTML
    const totalPriceMatch = htmlLower.match(/\$([0-9.]+)\s*(?:usd)?/i);
    if (totalPriceMatch) {
      const totalPrice = parseFloat(totalPriceMatch[1]);
      if (totalPrice > pricePerUnit * 1.5) {
        const estimatedQty = Math.round(totalPrice / pricePerUnit);
        if (estimatedQty >= 2 && estimatedQty <= 20) {
          console.log(`  📦 Pack detected from price ratio ($${totalPrice}/$${pricePerUnit}): ${estimatedQty}x`);
          return estimatedQty;
        }
      }
    }
  }
  
  // Check HTML content for additional patterns
  const htmlPatterns = [
    // JSON data: "quantity": 2, "pack_size": 3
    /"(?:quantity|pack_?size|pack_?qty|num_?spools?)":\s*(\d+)/i,
    // Visible text patterns
    /contains?\s+(\d+)\s+(?:spools?|rolls?)/i,
    /includes?\s+(\d+)\s+(?:spools?|rolls?)/i,
    // Product description patterns
    /(\d+)\s+(?:individual\s+)?(?:spools?|rolls?)\s+(?:of|per|in)/i,
    // Variant/option patterns in Shopify
    /"option1":\s*"(\d+)\s*(?:pack|spools?|rolls?)"/i,
  ];
  
  for (const pattern of htmlPatterns) {
    const match = htmlLower.match(pattern);
    if (match && match[1]) {
      const qty = parseInt(match[1], 10);
      if (qty >= 2 && qty <= 20) {
        console.log(`  📦 Pack detected from HTML pattern "${pattern}": ${qty}x`);
        return qty;
      }
    }
  }
  
  return 1; // Default to single spool
}

// Calculate pack pricing info
function calculatePackPricing(
  totalPrice: number, 
  packQuantity: number, 
  weightPerSpoolG: number | null
): PackInfo {
  const pricePerSpool = totalPrice / packQuantity;
  const pricePerKg = weightPerSpoolG && weightPerSpoolG > 0 
    ? (pricePerSpool / weightPerSpoolG) * 1000 
    : null;
  
  return {
    quantity: packQuantity,
    totalPrice,
    pricePerSpool,
    pricePerKg,
    weightPerSpool: weightPerSpoolG,
  };
}

// Extract weight from HTML content (returns grams)
function extractWeight(html: string, url: string): number | null {
  console.log(`Extracting weight from ${url}`);
  
  const weightPatterns = [
    // Match patterns like "1kg", "1000g", "1.75 kg", "2.2 lbs"
    /(?:net\s+)?weight[:\s]+([0-9.]+)\s*(kg|g|lbs?|pounds?)/i,
    /([0-9.]+)\s*(kg|g|lbs?|pounds?)\s+(?:net\s+)?(?:weight|spool)/i,
    /"weight"[:\s"]+([0-9.]+)\s*(kg|g|lbs?|pounds?)/i,
    /data-weight[=:"]+([0-9.]+)\s*(kg|g|lbs?|pounds?)/i,
    /<span[^>]*weight[^>]*>.*?([0-9.]+)\s*(kg|g|lbs?|pounds?)/is,
  ];
  
  for (const pattern of weightPatterns) {
    const match = html.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      
      if (!isNaN(value) && value > 0) {
        let weightInGrams = value;
        
        // Convert to grams
        if (unit.startsWith('kg')) {
          weightInGrams = value * 1000;
        } else if (unit.startsWith('lb') || unit.startsWith('pound')) {
          weightInGrams = value * 453.592;
        }
        
        // Sanity check: filament spools are typically 250g-5000g
        if (weightInGrams >= 100 && weightInGrams <= 10000) {
          console.log(`Found weight: ${weightInGrams}g (original: ${value} ${unit})`);
          return Math.round(weightInGrams);
        }
      }
    }
  }
  
  console.log('No weight found in HTML');
  return null;
}

// Extract price from HTML/markdown content
function extractPrice(html: string, url: string): number | null {
  console.log(`Extracting price from ${url}`);
  
  // Check if this is a Sunlu URL
  const isSunlu = url.toLowerCase().includes('sunlu.com');
  
  if (isSunlu) {
    console.log('Sunlu URL detected - looking for sale price');
    
    // Sunlu-specific patterns - extract sale price from their format
    // Format: "~~$18.99 USD~~Sale price$12.49 USD"
    const sunluSalePriceMatch = html.match(/~~\$[0-9,.]+\s*(?:USD)?~~\s*Sale\s*price\s*\$([0-9,.]+)/i);
    if (sunluSalePriceMatch) {
      const price = parseFloat(sunluSalePriceMatch[1].replace(/,/g, ''));
      if (!isNaN(price) && price >= 5 && price <= 100) {
        console.log(`Found Sunlu sale price: $${price}`);
        return price;
      }
    }
    
    // Fallback: Look for "Sale price$XX.XX"
    const saleMatch = html.match(/Sale\s*price\s*\$([0-9,.]+)/i);
    if (saleMatch) {
      const price = parseFloat(saleMatch[1].replace(/,/g, ''));
      if (!isNaN(price) && price >= 5 && price <= 100) {
        console.log(`Found Sunlu sale price (fallback): $${price}`);
        return price;
      }
    }
    
    // Last fallback: Regular price
    const regularMatch = html.match(/Regular\s*price\s*\$([0-9,.]+)/i);
    if (regularMatch) {
      const price = parseFloat(regularMatch[1].replace(/,/g, ''));
      if (!isNaN(price) && price >= 5 && price <= 100) {
        console.log(`Found Sunlu regular price: $${price}`);
        return price;
      }
    }
  }
  
  // Amazon price patterns
  const amazonPatterns = [
    /<span class="a-price-whole">([0-9,]+)<\/span>/,
    /<span class="a-offscreen">\$([0-9,.]+)<\/span>/,
    /class="a-price"[^>]*>.*?\$([0-9,.]+)/s,
    /"price":\s*"([0-9,.]+)"/,
  ];
  
  // Shopify/brand store patterns - includes markdown format
  // IMPORTANT: Sale price patterns must come FIRST to capture discounted prices
  const brandPatterns = [
    // Sale price format: "Sale price$18.99" - MUST be first to capture current sale price
    /Sale\s*price\s*\$([0-9,.]+)/i,
    // Sunlu format: "~~$24.99 USD~~Sale price$22.99 USD" - extract sale price after strikethrough
    /~~\$[0-9,.]+\s*(?:USD|CAD|EUR|GBP)?~~\s*Sale\s*price\s*\$([0-9,.]+)/i,
    // Regular price (only if no sale price found)
    /Regular\s+price\s*\$([0-9,.]+)\s*(?:USD|CAD|EUR|GBP)?/i,
    // Simple "price$XX.XX" format
    /\bprice\s*\$([0-9,.]+)\s*(?:USD|CAD|EUR|GBP)?/i,
    // JSON price formats
    /"price":\s*"?([0-9,.]+)"?/,
    /"amount":\s*"?([0-9,.]+)"?/,
    // HTML span/class patterns
    /<span class="money">.*?\$([0-9,.]+)<\/span>/,
    /class="price"[^>]*>.*?\$([0-9,.]+)/s,
    /data-product-price="([0-9,.]+)"/,
    /<meta property="product:price:amount" content="([0-9,.]+)"/,
    /class="product-price"[^>]*>.*?([0-9,.]+)/s,
    // Generic dollar amount pattern (fallback)
    /\$([0-9]+\.[0-9]{2})\s*(?:USD)?/,
  ];
  
  // Try Amazon patterns first if it's an Amazon URL
  if (url.includes('amazon.')) {
    for (const pattern of amazonPatterns) {
      const match = html.match(pattern);
      if (match) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(price) && price > 0 && price < 10000) {
          console.log(`Found Amazon price: ${price}`);
          return price;
        }
      }
    }
  }
  
  // Try brand store patterns
  for (const pattern of brandPatterns) {
    const match = html.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      // Filament prices are typically $5-$200
      if (!isNaN(price) && price >= 5 && price <= 500) {
        console.log(`Found brand store price: ${price}`);
        return price;
      }
    }
  }
  
  console.log('No price found in HTML');
  return null;
}

// Validate if a string is a valid URL
function isValidUrl(urlString: string | null): boolean {
  if (!urlString || urlString === 'null' || urlString.length < 10) {
    return false;
  }
  
  // Check if it starts with http:// or https://
  if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
    return false;
  }
  
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

// Fetch price, weight, and HTML from a URL with retry logic
async function fetchDataFromUrl(
  url: string | null, 
  region: string, 
  maxRetries: number = 3
): Promise<{ price: number | null; weight: number | null; html: string }> {
  if (!isValidUrl(url)) {
    if (url && url !== 'null') {
      console.log(`Skipping invalid URL for ${region}: ${url}`);
    }
    return { price: null, weight: null, html: '' };
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`  ↻ Retry attempt ${attempt + 1}/${maxRetries} after ${backoffMs}ms backoff`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
      
      console.log(`✓ Fetching ${region} data from: ${url}${attempt > 0 ? ` (attempt ${attempt + 1})` : ''}`);
      
      const response = await fetch(url!, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      
      if (!response.ok) {
        // Retry on 5xx errors and 429 (rate limit)
        if (response.status >= 500 || response.status === 429) {
          lastError = new Error(`HTTP ${response.status}`);
          console.log(`  ⚠ Temporary error ${response.status}, will retry...`);
          continue;
        }
        
        console.log(`✗ Failed to fetch ${url}: ${response.status}`);
        return { price: null, weight: null, html: '' };
      }
      
      const html = await response.text();
      const price = extractPrice(html, url!);
      const weight = extractWeight(html, url!);
      
      console.log(`✓ Scraped ${region}: price=${price ? '$' + price : 'none'}, weight=${weight ? weight + 'g' : 'none'}`);
      
      return { price, weight, html };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Retry on network errors
      if (attempt < maxRetries - 1) {
        console.log(`  ⚠ Network error, will retry: ${lastError.message}`);
        continue;
      }
    }
  }
  
  console.log(`✗ All ${maxRetries} attempts failed for ${url}: ${lastError?.message || 'Unknown error'}`);
  return { price: null, weight: null, html: '' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the JWT from the request (already validated by platform when verify_jwt = true)
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from JWT (JWT is already validated by platform)
    const jwt = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    const userId = payload.sub;

    if (!userId) {
      console.error('No user ID in JWT payload');
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Request from user: ${userId}`);

    // Check if user has admin role
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin, error: roleError } = await supabaseService.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status', details: roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      console.log(`User ${userId} is not an admin`);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${userId} authorized, proceeding with price fetch`);

    const body = await req.json();
    // Accept both camelCase and snake_case parameter names
    const filament_ids = body.filament_ids || body.filamentIds;
    
    console.log(`Fetching prices for ${filament_ids?.length || 'batch'} filaments`);

    // Fetch filaments that need price updates
    let query = supabaseService
      .from('filaments')
      .select('id, product_url, amazon_link_us, amazon_link_uk, amazon_link_de, variant_price, product_title, net_weight_g, pack_quantity');
    
    if (filament_ids && filament_ids.length > 0) {
      query = query.in('id', filament_ids);
    } else {
      // Fetch filaments in batches to avoid timeout
      // Process 50 at a time, prioritizing those missing weight data
      query = query
        .or('net_weight_g.is.null,net_weight_g.eq.0')
        .not('product_url', 'is', null)
        .limit(50);
    }

    const { data: filaments, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Processing ${filaments?.length || 0} filaments`);

    const results = {
      processed: 0,
      updated: 0,
      failed: 0,
      prices: [] as PriceData[],
      weights_updated: 0,
      packs_detected: 0,
      timeout_reached: false,
      details: [] as Array<{
        filament_id: string;
        product_title: string;
        status: 'success' | 'partial' | 'failed';
        prices_found: number;
        weight_found: boolean;
        sources_checked: number;
        pack_quantity?: number;
        price_per_kg?: number;
      }>,
    };

    // Set a timeout to prevent function from running too long (90 seconds max)
    const startTime = Date.now();
    const MAX_EXECUTION_TIME = 90000; // 90 seconds

    for (const filament of filaments || []) {
      // Check if we're approaching timeout
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        console.log(`\n⏱️  Timeout reached after processing ${results.processed} filaments`);
        results.timeout_reached = true;
        break;
      }

      results.processed++;
      console.log(`\n========== Processing [${results.processed}/${filaments?.length}]: ${filament.product_title} ==========`);
      
      const prices: PriceData[] = [];
      let extractedWeight: number | null = null;
      let sourcesChecked = 0;
      let scrapedHtml = '';
      let detectedPackQuantity = filament.pack_quantity || 1;
      
      // Fetch from all available sources
      const sources = [
        { url: filament.product_url, region: 'US', label: 'Brand Store', isPrimary: true },
        { url: filament.amazon_link_us, region: 'US', label: 'Amazon US', isPrimary: false },
        { url: filament.amazon_link_uk, region: 'UK', label: 'Amazon UK', isPrimary: false },
        { url: filament.amazon_link_de, region: 'DE', label: 'Amazon DE', isPrimary: false },
      ];

      for (const { url, region, label, isPrimary } of sources) {
        if (isValidUrl(url)) {
          sourcesChecked++;
          console.log(`  → Checking ${label}...`);
          const { price, weight, html } = await fetchDataFromUrl(url, region);
          
          // Use primary source (brand store) HTML for pack detection
          if (isPrimary && html) {
            scrapedHtml = html;
          }
          
          if (price !== null) {
            prices.push({
              filament_id: filament.id,
              region,
              price,
            });
            console.log(`  ✓ Price found: $${price}`);
          }
          
          // Store weight from first source that has it (prioritize brand store)
          if (weight !== null && extractedWeight === null) {
            extractedWeight = weight;
            console.log(`  ✓ Weight found: ${weight}g`);
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Detect pack quantity from title, URL, and HTML content
      const packQty = detectPackQuantity(filament.product_title, scrapedHtml, filament.product_url || '');
      if (packQty > 1) {
        detectedPackQuantity = packQty;
        results.packs_detected++;
        console.log(`  📦 Multi-pack detected: ${packQty}x spools`);
      }
      
      // Detect spool weight from title, URL, and HTML content
      const detectedSpoolWeightKg = detectSpoolWeightKg(filament.product_title, scrapedHtml, filament.product_url || '');
      if (detectedSpoolWeightKg !== 1) {
        console.log(`  ⚖️ Non-standard spool weight: ${detectedSpoolWeightKg}kg`);
      }

      // Determine status
      let status: 'success' | 'partial' | 'failed' = 'failed';
      if (prices.length > 0 || extractedWeight !== null) {
        status = (prices.length > 0 && extractedWeight !== null) ? 'success' : 'partial';
      }
      
      console.log(`  Summary: ${prices.length} prices, ${extractedWeight ? 'weight found' : 'no weight'}, ${sourcesChecked} sources checked`);
      
      if (prices.length > 0 || extractedWeight !== null) {
        let hasError = false;
        
        // Store prices in price_history
        if (prices.length > 0) {
          const { error: priceError } = await supabaseService
            .from('price_history')
            .insert(prices);

          if (priceError) {
            console.log(`  ✗ DB Error inserting prices: ${priceError.message}`);
            hasError = true;
          } else {
            results.prices.push(...prices);
            console.log(`  ✓ DB: Saved ${prices.length} price records`);
          }
        }
        
        // Update filament with price, weight, and pack quantity
        // For packs: variant_price should be the PER-KG price (not total price)
        const updates: { variant_price?: number; net_weight_g?: number; pack_quantity?: number } = {};
        
        // Get weight per spool (use extracted weight or existing weight)
        const weightPerSpool = extractedWeight || filament.net_weight_g;
        
        if (prices.length > 0) {
          // Get US price (prefer first US price found)
          const totalPrice = prices.find(p => p.region === 'US')?.price || prices[0]?.price;
          
          if (totalPrice && detectedPackQuantity > 0) {
            // Calculate per-spool price
            const pricePerSpool = totalPrice / detectedPackQuantity;
            
            // Use detected spool weight (in kg) or existing weight from DB/scrape
            // Priority: detected from title/URL (most reliable) > extracted from HTML > existing DB value
            let spoolWeightKg = detectedSpoolWeightKg; // Default from title/URL detection
            
            // Only use extracted/DB weight if we didn't explicitly detect weight from title/URL
            if (detectedSpoolWeightKg === 1) {
              // No explicit weight in title/URL, check other sources
              if (extractedWeight && extractedWeight > 0) {
                const extractedKg = extractedWeight / 1000;
                // Only use extracted weight if it's reasonable (0.25-5kg)
                if (extractedKg >= 0.25 && extractedKg <= 5) {
                  spoolWeightKg = extractedKg;
                }
              } else if (filament.net_weight_g && filament.net_weight_g > 0) {
                // Use existing DB weight as fallback
                spoolWeightKg = filament.net_weight_g / 1000;
              }
            }
            // If title/URL explicitly says 2kg, trust that over HTML scraping
            
            // Calculate per-kg price
            const pricePerKg = pricePerSpool / spoolWeightKg;
            updates.variant_price = Math.round(pricePerKg * 100) / 100; // Round to 2 decimals
            
            console.log(`  💰 Pricing: Total $${totalPrice} / ${detectedPackQuantity} spools = $${pricePerSpool.toFixed(2)}/spool`);
            console.log(`  💰 Per kg: $${pricePerSpool.toFixed(2)} / ${spoolWeightKg}kg = $${updates.variant_price}/kg`);
            
            // Update net_weight_g based on detected spool weight if not already set
            if (!extractedWeight && detectedSpoolWeightKg !== 1) {
              updates.net_weight_g = detectedSpoolWeightKg * 1000;
            }
          }
        }
        
        if (extractedWeight !== null) {
          updates.net_weight_g = extractedWeight;
        }
        
        // Update pack_quantity if it's a multi-pack
        if (detectedPackQuantity > 1) {
          updates.pack_quantity = detectedPackQuantity;
        }
        
        // Calculate the final price per kg for details
        let calculatedPricePerKg: number | undefined = undefined;
        if (updates.variant_price && weightPerSpool) {
          // If variant_price is already per-kg, use it directly
          calculatedPricePerKg = updates.variant_price;
        }
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabaseService
            .from('filaments')
            .update(updates)
            .eq('id', filament.id);
            
          if (updateError) {
            console.log(`  ✗ DB Error updating filament: ${updateError.message}`);
            hasError = true;
          } else {
            console.log(`  ✓ DB: Updated filament (price=${updates.variant_price ? '$' + updates.variant_price + '/kg' : 'no'}, weight=${updates.net_weight_g ? updates.net_weight_g + 'g' : 'no'}, pack=${updates.pack_quantity || 1}x)`);
            if (extractedWeight !== null) {
              results.weights_updated++;
            }
          }
        }
        
        if (!hasError) {
          results.updated++;
        } else {
          results.failed++;
          status = 'failed';
        }
      } else {
        results.failed++;
        console.log(`  ✗ No data extracted from any source`);
      }
      
      // Add to details with pack info
      const weightPerSpool = extractedWeight || filament.net_weight_g;
      let pricePerKgForDetail: number | undefined = undefined;
      if (prices.length > 0 && weightPerSpool) {
        const totalPrice = prices.find(p => p.region === 'US')?.price || prices[0]?.price;
        if (totalPrice) {
          const pricePerSpool = totalPrice / detectedPackQuantity;
          pricePerKgForDetail = Math.round((pricePerSpool / weightPerSpool) * 1000 * 100) / 100;
        }
      }
      
      results.details.push({
        filament_id: filament.id,
        product_title: filament.product_title,
        status,
        prices_found: prices.length,
        weight_found: extractedWeight !== null,
        sources_checked: sourcesChecked,
        pack_quantity: detectedPackQuantity > 1 ? detectedPackQuantity : undefined,
        price_per_kg: pricePerKgForDetail,
      });
    }

    console.log(`\n========== COMPLETE ==========`);
    console.log(`✓ Successfully updated: ${results.updated}`);
    console.log(`✗ Failed: ${results.failed}`);
    console.log(`📊 Total prices found: ${results.prices.length}`);
    console.log(`⚖️  Weights updated: ${results.weights_updated}`);
    console.log(`📦 Packs detected: ${results.packs_detected}`);
    if (results.timeout_reached) {
      console.log(`⏱️  Note: Batch limit reached, more filaments may need processing`);
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-prices function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

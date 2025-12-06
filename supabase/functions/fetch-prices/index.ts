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

// Extract price from HTML content
function extractPrice(html: string, url: string): number | null {
  console.log(`Extracting price from ${url}`);
  
  // Amazon price patterns
  const amazonPatterns = [
    /<span class="a-price-whole">([0-9,]+)<\/span>/,
    /<span class="a-offscreen">\$([0-9,.]+)<\/span>/,
    /class="a-price"[^>]*>.*?\$([0-9,.]+)/s,
    /"price":\s*"([0-9,.]+)"/,
  ];
  
  // Shopify/brand store patterns
  const brandPatterns = [
    /<span class="money">.*?\$([0-9,.]+)<\/span>/,
    /class="price"[^>]*>.*?\$([0-9,.]+)/s,
    /"price":\s*"([0-9,.]+)"/,
    /data-product-price="([0-9,.]+)"/,
    /<meta property="product:price:amount" content="([0-9,.]+)"/,
    /class="product-price"[^>]*>.*?([0-9,.]+)/s,
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
      if (!isNaN(price) && price > 0 && price < 10000) {
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

// Fetch price and weight from a URL with retry logic
async function fetchDataFromUrl(
  url: string | null, 
  region: string, 
  maxRetries: number = 3
): Promise<{ price: number | null; weight: number | null }> {
  if (!isValidUrl(url)) {
    if (url && url !== 'null') {
      console.log(`Skipping invalid URL for ${region}: ${url}`);
    }
    return { price: null, weight: null };
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
        return { price: null, weight: null };
      }
      
      const html = await response.text();
      const price = extractPrice(html, url!);
      const weight = extractWeight(html, url!);
      
      console.log(`✓ Scraped ${region}: price=${price ? '$' + price : 'none'}, weight=${weight ? weight + 'g' : 'none'}`);
      
      return { price, weight };
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
  return { price: null, weight: null };
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

    const { filament_ids } = await req.json();
    
    console.log(`Fetching prices for ${filament_ids?.length || 'batch'} filaments`);

    // Fetch filaments that need price updates
    let query = supabaseService
      .from('filaments')
      .select('id, product_url, amazon_link_us, amazon_link_uk, amazon_link_de, variant_price, product_title');
    
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
      timeout_reached: false,
      details: [] as Array<{
        filament_id: string;
        product_title: string;
        status: 'success' | 'partial' | 'failed';
        prices_found: number;
        weight_found: boolean;
        sources_checked: number;
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
      
      // Fetch from all available sources
      const sources = [
        { url: filament.product_url, region: 'US', label: 'Brand Store' },
        { url: filament.amazon_link_us, region: 'US', label: 'Amazon US' },
        { url: filament.amazon_link_uk, region: 'UK', label: 'Amazon UK' },
        { url: filament.amazon_link_de, region: 'DE', label: 'Amazon DE' },
      ];

      for (const { url, region, label } of sources) {
        if (isValidUrl(url)) {
          sourcesChecked++;
          console.log(`  → Checking ${label}...`);
          const { price, weight } = await fetchDataFromUrl(url, region);
          
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
        
        // Update filament with price and/or weight
        const updates: { variant_price?: number; net_weight_g?: number } = {};
        
        if (prices.length > 0) {
          // Update variant_price with US price (prefer first US price found)
          const usPrice = prices.find(p => p.region === 'US')?.price || prices[0]?.price;
          if (usPrice) {
            updates.variant_price = usPrice;
          }
        }
        
        if (extractedWeight !== null) {
          updates.net_weight_g = extractedWeight;
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
            console.log(`  ✓ DB: Updated filament (price=${updates.variant_price ? '$' + updates.variant_price : 'no'}, weight=${updates.net_weight_g ? updates.net_weight_g + 'g' : 'no'})`);
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
      
      // Add to details
      results.details.push({
        filament_id: filament.id,
        product_title: filament.product_title,
        status,
        prices_found: prices.length,
        weight_found: extractedWeight !== null,
        sources_checked: sourcesChecked,
      });
    }

    console.log(`\n========== COMPLETE ==========`);
    console.log(`✓ Successfully updated: ${results.updated}`);
    console.log(`✗ Failed: ${results.failed}`);
    console.log(`📊 Total prices found: ${results.prices.length}`);
    console.log(`⚖️  Weights updated: ${results.weights_updated}`);
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

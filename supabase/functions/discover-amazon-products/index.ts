import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmazonSearchResult {
  title: string;
  link: string;
  price?: number;
  asin?: string;
  thumbnail?: string;
}

interface FilamentRecord {
  id: string;
  product_title: string;
  vendor: string;
  material: string | null;
  variant_price: number | null;
  amazon_link_us: string | null;
}

interface BrandConfig {
  brand_name: string;
  amazon_store_url: string | null;
  has_amazon_store: boolean;
}

// Build search query for Amazon - prioritizes store-based search if available
function buildSearchQuery(filament: FilamentRecord, brandConfig?: BrandConfig): string {
  const parts = [filament.vendor];
  
  if (filament.material) {
    parts.push(filament.material);
  }
  
  // Extract key words from product title (color, type)
  const titleWords = filament.product_title
    .replace(new RegExp(filament.vendor, 'gi'), '')
    .replace(new RegExp(filament.material || '', 'gi'), '')
    .trim();
  
  if (titleWords) {
    parts.push(titleWords);
  }
  
  parts.push('1.75mm filament');
  
  return parts.join(' ').substring(0, 100); // Limit query length
}

// Calculate match confidence (0-100)
function calculateMatchConfidence(filament: FilamentRecord, amazonResult: AmazonSearchResult): number {
  let score = 0;
  const amazonTitle = amazonResult.title.toLowerCase();
  const vendor = filament.vendor.toLowerCase();
  
  // Brand name match (40 points)
  if (amazonTitle.includes(vendor) || amazonTitle.includes(vendor.replace(' ', ''))) {
    score += 40;
  } else if (amazonTitle.split(' ').some(word => vendor.includes(word) && word.length > 3)) {
    score += 20; // Partial brand match
  }
  
  // Material match (25 points)
  if (filament.material) {
    const material = filament.material.toLowerCase();
    if (amazonTitle.includes(material)) {
      score += 25;
    } else if (material.includes('-') && amazonTitle.includes(material.split('-')[0])) {
      score += 15; // Partial material match (e.g., PLA-CF -> PLA)
    }
  }
  
  // Title word overlap (25 points)
  const filamentWords = filament.product_title.toLowerCase()
    .split(/[\s\-\_]+/)
    .filter(w => w.length > 2);
  const amazonWords = amazonTitle.split(/[\s\-\_]+/).filter(w => w.length > 2);
  
  const overlap = filamentWords.filter(w => 
    amazonWords.some(aw => aw.includes(w) || w.includes(aw))
  ).length;
  
  if (filamentWords.length > 0) {
    score += Math.min(25, Math.round((overlap / filamentWords.length) * 25));
  }
  
  // Price sanity check (10 points) - filament typically $15-60
  if (amazonResult.price && amazonResult.price >= 10 && amazonResult.price <= 100) {
    score += 10;
    
    // Bonus if price is close to store price
    if (filament.variant_price) {
      const priceDiff = Math.abs(amazonResult.price - filament.variant_price);
      if (priceDiff < 5) {
        score += 5;
      }
    }
  }
  
  return Math.min(100, score);
}

// Extract ASIN from Amazon URL
function extractAsin(url: string): string | null {
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/i) || 
                    url.match(/\/gp\/product\/([A-Z0-9]{10})/i) ||
                    url.match(/asin=([A-Z0-9]{10})/i);
  return asinMatch ? asinMatch[1] : null;
}

// Search Amazon via SerpApi
async function searchAmazon(query: string, serpApiKey: string): Promise<AmazonSearchResult[]> {
  const params = new URLSearchParams({
    engine: 'amazon',
    amazon_domain: 'amazon.com',
    k: query,
    api_key: serpApiKey,
  });
  
  console.log(`Searching Amazon for: ${query}`);
  
  const response = await fetch(`https://serpapi.com/search?${params}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('SerpApi error:', errorText);
    throw new Error(`SerpApi request failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.organic_results || !Array.isArray(data.organic_results)) {
    console.log('No organic results found');
    return [];
  }
  
  return data.organic_results.slice(0, 5).map((result: any) => ({
    title: result.title || '',
    link: result.link || '',
    price: result.price?.raw ? parseFloat(result.price.raw.replace(/[^0-9.]/g, '')) : 
           result.price?.extracted ? result.price.extracted : null,
    asin: result.asin || extractAsin(result.link || ''),
    thumbnail: result.thumbnail,
  }));
}

// Search Amazon store products via SerpApi
async function searchAmazonStore(brandName: string, storeUrl: string, serpApiKey: string): Promise<AmazonSearchResult[]> {
  // Extract store name from URL for better search
  const storeMatch = storeUrl.match(/\/stores\/([^\/]+)/);
  const storeName = storeMatch ? storeMatch[1] : brandName;
  
  // Search for brand filament products to find store products
  const params = new URLSearchParams({
    engine: 'amazon',
    amazon_domain: 'amazon.com',
    k: `${brandName} filament 1.75mm`,
    api_key: serpApiKey,
  });
  
  console.log(`Searching Amazon store products for: ${brandName}`);
  
  const response = await fetch(`https://serpapi.com/search?${params}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('SerpApi store search error:', errorText);
    throw new Error(`SerpApi request failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Collect all filament products from results
  const results: AmazonSearchResult[] = [];
  
  if (data.organic_results && Array.isArray(data.organic_results)) {
    for (const result of data.organic_results) {
      // Filter to only include products from this brand
      const title = (result.title || '').toLowerCase();
      if (title.includes(brandName.toLowerCase()) || 
          title.includes(brandName.toLowerCase().replace(' ', ''))) {
        results.push({
          title: result.title || '',
          link: result.link || '',
          price: result.price?.raw ? parseFloat(result.price.raw.replace(/[^0-9.]/g, '')) : 
                 result.price?.extracted ? result.price.extracted : null,
          asin: result.asin || extractAsin(result.link || ''),
          thumbnail: result.thumbnail,
        });
      }
    }
  }
  
  return results;
}

// Rate limiting
const RATE_LIMIT_MS = 1500;
let lastRequestTime = 0;

async function respectRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vendor, limit = 20 } = await req.json();

    if (!vendor) {
      return new Response(
        JSON.stringify({ success: false, error: 'Vendor is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serpApiKey = Deno.env.get('SERPAPI_KEY');
    if (!serpApiKey) {
      console.error('SERPAPI_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'SerpApi key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Discovering Amazon products for vendor: ${vendor}`);

    // Fetch brand config including Amazon store URL
    const { data: brandConfig } = await supabase
      .from('automated_brands')
      .select('brand_name, amazon_store_url, has_amazon_store')
      .ilike('brand_name', vendor)
      .single();

    console.log(`Brand config:`, brandConfig);

    // Fetch filaments without Amazon links (or with low confidence)
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, vendor, material, variant_price, amazon_link_us')
      .ilike('vendor', vendor)
      .or('amazon_link_us.is.null,amazon_match_confidence.lt.70')
      .limit(limit);

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError);
      throw fetchError;
    }

    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No filaments need Amazon link discovery',
          discovered: 0,
          high_confidence: 0,
          low_confidence: 0,
          results: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${filaments.length} filaments to process`);

    const results: any[] = [];
    let discovered = 0;
    let highConfidence = 0;
    let lowConfidence = 0;
    let updated = 0;

    // If brand has Amazon store URL, first get all store products
    let storeProducts: AmazonSearchResult[] = [];
    if (brandConfig?.amazon_store_url) {
      try {
        await respectRateLimit();
        storeProducts = await searchAmazonStore(vendor, brandConfig.amazon_store_url, serpApiKey);
        console.log(`Found ${storeProducts.length} products from store search`);
      } catch (err) {
        console.error('Error fetching store products:', err);
      }
    }

    for (const filament of filaments) {
      try {
        let amazonResults: AmazonSearchResult[] = [];
        
        // First try to match against store products if available
        if (storeProducts.length > 0) {
          // Score each store product against this filament
          const scoredProducts = storeProducts.map(product => ({
            product,
            confidence: calculateMatchConfidence(filament, product)
          })).sort((a, b) => b.confidence - a.confidence);
          
          if (scoredProducts.length > 0 && scoredProducts[0].confidence >= 70) {
            amazonResults = [scoredProducts[0].product];
          }
        }
        
        // If no good match from store, do individual search
        if (amazonResults.length === 0) {
          await respectRateLimit();
          const searchQuery = buildSearchQuery(filament, brandConfig || undefined);
          amazonResults = await searchAmazon(searchQuery, serpApiKey);
        }
        
        if (amazonResults.length === 0) {
          results.push({
            filament_id: filament.id,
            title: filament.product_title,
            status: 'no_results',
            confidence: 0,
          });
          continue;
        }

        // Score all results and find best match
        let bestMatch: AmazonSearchResult | null = null;
        let bestConfidence = 0;

        for (const amazonResult of amazonResults) {
          const confidence = calculateMatchConfidence(filament, amazonResult);
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestMatch = amazonResult;
          }
        }

        discovered++;

        if (bestMatch && bestConfidence >= 70) {
          highConfidence++;
          
          // Update filament with Amazon link
          const amazonUrl = bestMatch.asin 
            ? `https://www.amazon.com/dp/${bestMatch.asin}`
            : bestMatch.link;
          
          const { error: updateError } = await supabase
            .from('filaments')
            .update({
              amazon_link_us: amazonUrl,
              amazon_match_confidence: bestConfidence,
              amazon_price_usd: bestMatch.price || null,
              amazon_prices_last_updated_at: bestMatch.price ? new Date().toISOString() : null,
            })
            .eq('id', filament.id);

          if (!updateError) {
            updated++;
          }

          results.push({
            filament_id: filament.id,
            title: filament.product_title,
            amazon_title: bestMatch.title,
            amazon_url: amazonUrl,
            amazon_price: bestMatch.price,
            confidence: bestConfidence,
            status: 'matched',
          });
        } else {
          lowConfidence++;
          results.push({
            filament_id: filament.id,
            title: filament.product_title,
            amazon_title: bestMatch?.title,
            confidence: bestConfidence,
            status: 'low_confidence',
          });
        }

      } catch (err) {
        console.error(`Error processing filament ${filament.id}:`, err);
        results.push({
          filament_id: filament.id,
          title: filament.product_title,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Update brand stats
    const { data: linkCount } = await supabase
      .from('filaments')
      .select('id', { count: 'exact' })
      .ilike('vendor', vendor)
      .not('amazon_link_us', 'is', null);

    const { data: priceCount } = await supabase
      .from('filaments')
      .select('id', { count: 'exact' })
      .ilike('vendor', vendor)
      .not('amazon_price_usd', 'is', null);

    await supabase
      .from('automated_brands')
      .update({
        products_with_amazon_links: linkCount?.length || 0,
        products_with_amazon_prices: priceCount?.length || 0,
      })
      .ilike('brand_name', vendor);

    console.log(`Discovery complete: ${discovered} found, ${highConfidence} high confidence, ${updated} updated`);

    return new Response(
      JSON.stringify({
        success: true,
        vendor,
        processed: filaments.length,
        discovered,
        high_confidence: highConfidence,
        low_confidence: lowConfidence,
        updated,
        results: results.slice(0, 20), // Limit response size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in discover-amazon-products:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

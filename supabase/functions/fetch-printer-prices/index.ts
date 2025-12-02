import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced price extraction with multiple pattern matching and debugging
function extractPrices(markdown: string): {
  msrp_usd: number | null;
  current_price_usd_store: number | null;
} {
  let msrp_usd: number | null = null;
  let current_price_usd_store: number | null = null;

  // Multiple price regex patterns to catch different formats
  const pricePatterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,  // $1,234.56 or $1234.56
    /\$\s*(\d{1,3}(?:,\d{3})*)/gi,               // $1,234 or $1234 (no decimals)
    /USD\s*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi, // USD $1,234.56
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*USD/gi,  // 1,234.56 USD
    /Price[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi, // Price: $1,234
    /(?:from|starting\s+at)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi, // from $1,234
  ];

  const allPrices: number[] = [];
  const priceContexts: string[] = [];
  
  // Try all patterns
  for (const pattern of pricePatterns) {
    const matches = markdown.matchAll(pattern);
    for (const match of matches) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      
      if (!isNaN(price) && price >= 100 && price <= 50000) {
        allPrices.push(price);
        // Extract context around the price (50 chars before and after)
        const matchIndex = match.index || 0;
        const contextStart = Math.max(0, matchIndex - 50);
        const contextEnd = Math.min(markdown.length, matchIndex + match[0].length + 50);
        priceContexts.push(markdown.substring(contextStart, contextEnd).replace(/\n/g, ' '));
      }
    }
  }

  console.log(`Found ${allPrices.length} prices in range: [${allPrices.slice(0, 10).join(', ')}]`);
  
  if (allPrices.length === 0) {
    // Debug: Show first 500 chars of markdown to understand what we're getting
    console.log('No prices found. Markdown preview:', markdown.substring(0, 500).replace(/\n/g, ' '));
    
    // Try to find any dollar signs or number patterns
    const dollarSigns = (markdown.match(/\$/g) || []).length;
    const numberPatterns = (markdown.match(/\d{3,}/g) || []).length;
    console.log(`Debug: Found ${dollarSigns} dollar signs, ${numberPatterns} number sequences`);
    
    return { msrp_usd: null, current_price_usd_store: null };
  }

  // Log some price contexts for debugging
  if (priceContexts.length > 0) {
    console.log('Price contexts:', priceContexts.slice(0, 3).join(' | '));
  }

  // Look for explicit MSRP/RRP/Retail mentions
  const msrpPatterns = [
    /(?:MSRP|RRP|Retail\s+Price|Original\s+Price)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:was|originally)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];
  
  for (const pattern of msrpPatterns) {
    const msrpMatch = markdown.match(pattern);
    if (msrpMatch) {
      msrp_usd = parseFloat(msrpMatch[1].replace(/,/g, ''));
      console.log(`Found MSRP: $${msrp_usd}`);
      break;
    }
  }

  // Look for current price indicators
  const currentPricePatterns = [
    /(?:current\s+price|now|sale\s+price|special\s+price)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:from|starting\s+at)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:buy\s+for|purchase\s+for)[:\s]*\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];
  
  for (const pattern of currentPricePatterns) {
    const priceMatch = markdown.match(pattern);
    if (priceMatch) {
      current_price_usd_store = parseFloat(priceMatch[1].replace(/,/g, ''));
      console.log(`Found current price via pattern: $${current_price_usd_store}`);
      break;
    }
  }

  // If no current price found yet, use frequency-based approach
  if (!current_price_usd_store && allPrices.length > 0) {
    const priceFrequency = new Map<number, number>();
    for (const price of allPrices) {
      priceFrequency.set(price, (priceFrequency.get(price) || 0) + 1);
    }
    
    // Get the most frequent price
    let maxCount = 0;
    let mostCommonPrice = allPrices[0];
    for (const [price, count] of priceFrequency.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonPrice = price;
      }
    }
    
    current_price_usd_store = mostCommonPrice;
    console.log(`Using most common price: $${current_price_usd_store} (appeared ${maxCount} times)`);
  }

  // If we found MSRP and it's the same as current price, clear MSRP
  if (msrp_usd && current_price_usd_store && msrp_usd === current_price_usd_store) {
    console.log('MSRP equals current price, clearing MSRP');
    msrp_usd = null;
  }

  return { msrp_usd, current_price_usd_store };
}

// Intelligent URL correction: convert marketing pages to store pages
function correctUrlForPricing(url: string, brand: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    // Bambu Lab: convert /products/ to /us/products/ (US store)
    if (hostname.includes('bambulab.com')) {
      if (pathname.startsWith('/products/') && !pathname.startsWith('/us/products/')) {
        return `https://us.store.bambulab.com${pathname}`;
      }
    }

    // Creality: convert /products/ to /collections/fdm-3d-printers/products/
    if (hostname.includes('creality.com') || hostname.includes('creality3d.shop')) {
      if (pathname.includes('/products/') && !pathname.includes('/collections/')) {
        const productSlug = pathname.split('/products/')[1];
        return `https://store.creality.com/collections/fdm-3d-printers/products/${productSlug}`;
      }
    }

    // Prusa Research: ensure it's the shop domain
    if (hostname.includes('prusa3d.com') && !hostname.includes('shop.prusa3d.com')) {
      return url.replace('www.prusa3d.com', 'shop.prusa3d.com').replace('prusa3d.com', 'shop.prusa3d.com');
    }

    // Anycubic: convert /products/ to store subdomain
    if (hostname.includes('anycubic.com') && !hostname.includes('store.anycubic.com')) {
      if (pathname.includes('/products/')) {
        return url.replace(/^https?:\/\/[^\/]+/, 'https://store.anycubic.com');
      }
    }

    // Elegoo: ensure store domain
    if (hostname.includes('elegoo.com') && !hostname.includes('www.elegoo.com')) {
      return url.replace(/^https?:\/\/[^\/]+/, 'https://www.elegoo.com');
    }

    // QIDI: convert to official store
    if (hostname.includes('qidi') && !hostname.includes('qidi3d.com')) {
      if (pathname.includes('/products/')) {
        const productSlug = pathname.split('/products/')[1]?.split('/')[0];
        return `https://qidi3d.com/products/${productSlug}`;
      }
    }

    return null; // No correction needed
  } catch (error) {
    console.error('URL correction error:', error);
    return null;
  }
}

// Direct Firecrawl API call with enhanced options
async function firecrawlScrape(url: string, apiKey: string) {
  console.log('Scraping price from:', url);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      waitFor: 3000, // Wait 3 seconds for dynamic content to load
      skipTlsVerification: false,
      location: {
        country: 'US',
        languages: ['en-US', 'en']
      },
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    }),
  });

  const responseData = await response.json();
  
  if (!response.ok) {
    console.error('Firecrawl error:', responseData);
    throw new Error(`Firecrawl API error: ${response.statusText}`);
  }

  // Check if we got a valid response with actual content
  if (responseData?.data?.markdown) {
    const markdown = responseData.data.markdown;
    
    // Detect if we got a cookie consent page or redirect
    if (markdown.includes('cookie') && markdown.includes('consent') && markdown.length < 1000) {
      console.log('⚠️ Detected cookie consent page, content too short');
      throw new Error('Cookie consent page detected');
    }
    
    // Detect if we got binary/image data
    if (markdown.includes('JFIF') || markdown.includes('ExifMM') || markdown.includes('����')) {
      console.log('⚠️ Detected binary/image data instead of HTML');
      throw new Error('Binary data received instead of HTML');
    }
  }

  return responseData;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { printerIds } = await req.json() as { printerIds?: string[] };

    console.log('Fetching prices for printers:', printerIds?.length || 'all without prices');

    // Get printers without prices
    let query = supabase
      .from('printers')
      .select('id, model_name, official_product_url, amazon_url_us, amazon_url_ca, amazon_url_uk, printer_brands!brand_id(brand)')
      .eq('status', 'active')
      .not('official_product_url', 'is', null);

    if (printerIds && printerIds.length > 0) {
      query = query.in('id', printerIds);
    } else {
      // Only fetch printers without any price data
      query = query
        .is('msrp_usd', null)
        .is('current_price_usd_store', null)
        .is('current_price_usd_amazon', null);
    }

    const { data: printers, error: fetchError } = await query.limit(20);

    if (fetchError) {
      throw fetchError;
    }

    if (!printers || printers.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No printers found needing price updates',
          updated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${printers.length} printers`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const printer of printers) {
      try {
        const brand = (printer as any).printer_brands?.brand || 'Unknown';
        console.log(`\n=== Processing: ${brand} ${printer.model_name} ===`);

        // Skip DIY kit brands (Voron, etc.)
        if (brand.toLowerCase().includes('voron') || 
            brand.toLowerCase().includes('ldo motors')) {
          console.log(`Skipping - ${brand} is a DIY kit brand with no official pricing`);
          results.push({
            printer_id: printer.id,
            model_name: printer.model_name,
            success: false,
            error: 'DIY kit - no official pricing'
          });
          continue;
        }

        if (!printer.official_product_url || 
            !printer.official_product_url.startsWith('http')) {
          console.log(`Skipping - invalid URL: ${printer.official_product_url}`);
          failCount++;
          results.push({
            printer_id: printer.id,
            model_name: printer.model_name,
            success: false,
            error: 'Invalid URL'
          });
          continue;
        }

        // Try URL correction first
        const correctedUrl = correctUrlForPricing(printer.official_product_url, brand);
        const urlToScrape = correctedUrl || printer.official_product_url;
        
        if (correctedUrl) {
          console.log(`URL corrected: ${printer.official_product_url} → ${correctedUrl}`);
        }

        // Scrape the product page with retry logic
        let scrapeResult;
        let scrapeError = null;
        
        try {
          scrapeResult = await firecrawlScrape(urlToScrape, firecrawlApiKey);
          
          if (!scrapeResult?.data?.markdown) {
            throw new Error('No markdown data returned');
          }
        } catch (error) {
          scrapeError = error instanceof Error ? error.message : 'Unknown scrape error';
          console.log(`Failed to scrape ${urlToScrape}: ${scrapeError}`);
          
          // If official URL failed, don't continue - go straight to Amazon fallback
          scrapeResult = null;
        }

        let prices: { msrp_usd: number | null; current_price_usd_store: number | null } = { 
          msrp_usd: null, 
          current_price_usd_store: null 
        };
        
        // Only extract prices if we successfully scraped the official store
        if (scrapeResult?.data?.markdown) {
          const markdown = scrapeResult.data.markdown;
          prices = extractPrices(markdown);
          console.log('Extracted prices from official store:', prices);
        } else {
          console.log('No valid official store data, skipping to Amazon');
        }

        // If no prices found from official store, try Amazon as fallback
        if (!prices.msrp_usd && !prices.current_price_usd_store) {
          console.log('No prices from official store, trying Amazon fallback...');
          
          // Try Amazon URLs in order of preference: US, CA, UK
          const amazonUrls = [
            printer.amazon_url_us,
            printer.amazon_url_ca,
            printer.amazon_url_uk
          ].filter(url => url && url.startsWith('http'));
          
          for (const amazonUrl of amazonUrls) {
            try {
              console.log(`Trying Amazon URL: ${amazonUrl}`);
              const amazonResult = await firecrawlScrape(amazonUrl, firecrawlApiKey);
              
              if (amazonResult?.data?.markdown) {
                const amazonPrices = extractPrices(amazonResult.data.markdown);
                
                if (amazonPrices.current_price_usd_store) {
                  console.log(`✓ Found Amazon price: $${amazonPrices.current_price_usd_store}`);
                  // Use Amazon price as current store price
                  prices.current_price_usd_store = amazonPrices.current_price_usd_store;
                  if (amazonPrices.msrp_usd) {
                    prices.msrp_usd = amazonPrices.msrp_usd;
                  }
                  break;
                }
              }
            } catch (amazonError) {
              console.log(`Amazon scrape failed for ${amazonUrl}:`, amazonError);
            }
          }
        }

        if (prices.msrp_usd || prices.current_price_usd_store) {
          // Update the printer with found prices
          const updateData: any = {};
          if (prices.msrp_usd) updateData.msrp_usd = prices.msrp_usd;
          if (prices.current_price_usd_store) updateData.current_price_usd_store = prices.current_price_usd_store;

          const { error: updateError } = await supabase
            .from('printers')
            .update(updateData)
            .eq('id', printer.id);

          if (updateError) {
            console.error('Update error:', updateError);
            failCount++;
            results.push({
              printer_id: printer.id,
              model_name: printer.model_name,
              success: false,
              error: updateError.message
            });
          } else {
            console.log(`✓ Updated prices for ${printer.model_name}`);
            successCount++;
            results.push({
              printer_id: printer.id,
              model_name: printer.model_name,
              success: true,
              prices: prices
            });
          }
        } else {
          console.log('No prices found in official store or Amazon');
          failCount++;
          results.push({
            printer_id: printer.id,
            model_name: printer.model_name,
            success: false,
            error: 'No prices found'
          });
        }

        // Rate limiting - wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error processing ${printer.model_name}:`, error);
        failCount++;
        results.push({
          printer_id: printer.id,
          model_name: printer.model_name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`\nCompleted: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: `Price fetch completed`,
        total_processed: printers.length,
        successful: successCount,
        failed: failCount,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

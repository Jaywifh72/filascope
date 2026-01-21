import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Expected price ranges by accessory type (USD)
const PRICE_RANGES: Record<string, { min: number; max: number }> = {
  'build_plate': { min: 8, max: 150 },
  'ams_mmu': { min: 100, max: 600 },
  'nozzle': { min: 2, max: 100 },
  'hotend': { min: 15, max: 300 },
  'extruder': { min: 20, max: 400 },
  'default': { min: 5, max: 1000 },
};

// Platform-specific price extraction
function extractPriceForPlatform(content: string, url: string): number | null {
  const lowerUrl = url.toLowerCase();
  
  // Bambu Lab store - look for specific price patterns
  if (lowerUrl.includes('bambulab.com')) {
    // Bambu uses "Sale price$XX.XX" or just "$XX.XX" patterns
    const bambuPatterns = [
      /Sale\s*price\s*\$?\s*(\d+(?:\.\d{2})?)/gi,
      /Regular\s*price\s*\$?\s*(\d+(?:\.\d{2})?)/gi,
      /"price":\s*"?(\d+(?:\.\d{2})?)(?:"|,)/g,
      /\$(\d+(?:\.\d{2})?)\s*(?:USD)?/g,
    ];
    
    for (const pattern of bambuPatterns) {
      const match = pattern.exec(content);
      if (match) {
        const price = parseFloat(match[1]);
        if (price > 0) return price;
      }
    }
  }
  
  // Prusa store - EUR prices, may need special handling
  if (lowerUrl.includes('prusa3d.com')) {
    const prusaPatterns = [
      /\$\s*(\d+(?:\.\d{2})?)/g,  // USD price
      /(\d+(?:\.\d{2})?)\s*(?:€|EUR)/gi, // EUR price (would need conversion)
      /"price":\s*"?(\d+(?:\.\d{2})?)(?:"|,)/g,
    ];
    
    for (const pattern of prusaPatterns) {
      const match = pattern.exec(content);
      if (match) {
        const price = parseFloat(match[1]);
        if (price > 0) return price;
      }
    }
  }
  
  // Creality store
  if (lowerUrl.includes('creality.com')) {
    const crealityPatterns = [
      /\$\s*(\d+(?:\.\d{2})?)\s*USD/gi,
      /Sale\s*price\s*\$?\s*(\d+(?:\.\d{2})?)/gi,
      /"price":\s*"?(\d+(?:\.\d{2})?)(?:"|,)/g,
    ];
    
    for (const pattern of crealityPatterns) {
      const match = pattern.exec(content);
      if (match) {
        const price = parseFloat(match[1]);
        if (price > 0) return price;
      }
    }
  }
  
  // Snapmaker store
  if (lowerUrl.includes('snapmaker.com')) {
    const snapmakerPatterns = [
      /\$\s*(\d+(?:\.\d{2})?)/g,
      /"price":\s*"?(\d+(?:\.\d{2})?)(?:"|,)/g,
    ];
    
    for (const pattern of snapmakerPatterns) {
      const match = pattern.exec(content);
      if (match) {
        const price = parseFloat(match[1]);
        if (price > 0) return price;
      }
    }
  }
  
  return null;
}

// Improved price extraction with validation
function extractPriceFromContent(
  content: string, 
  url: string,
  accessoryType: string,
  currentPrice: number | null
): number | null {
  // First try platform-specific extraction
  const platformPrice = extractPriceForPlatform(content, url);
  if (platformPrice) {
    const range = PRICE_RANGES[accessoryType] || PRICE_RANGES['default'];
    if (platformPrice >= range.min && platformPrice <= range.max) {
      return platformPrice;
    }
  }
  
  // Fallback to generic extraction with improved logic
  const patterns = [
    // Look for "price" context first
    /(?:price|cost)[\s:]*\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD)?/g,
    /USD\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  ];

  const allPrices: number[] = [];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (price > 0) {
        allPrices.push(price);
      }
    }
  }

  if (allPrices.length === 0) return null;
  
  // Get the expected range for this accessory type
  const range = PRICE_RANGES[accessoryType] || PRICE_RANGES['default'];
  
  // Filter to only prices within expected range
  const validPrices = allPrices.filter(p => p >= range.min && p <= range.max);
  
  if (validPrices.length === 0) {
    console.log(`No prices found within expected range ${range.min}-${range.max} for ${accessoryType}`);
    return null;
  }
  
  // If we have a current price, prefer prices close to it (within 40% variance)
  if (currentPrice && currentPrice > 0) {
    const closeToCurrentPrices = validPrices.filter(p => {
      const changePercent = Math.abs((p - currentPrice) / currentPrice) * 100;
      return changePercent <= 40; // Accept up to 40% change as reasonable
    });
    
    if (closeToCurrentPrices.length > 0) {
      // Return the price closest to current
      return closeToCurrentPrices.reduce((closest, p) => 
        Math.abs(p - currentPrice) < Math.abs(closest - currentPrice) ? p : closest
      );
    }
    
    // If no close prices, log a warning and skip update
    console.log(`All extracted prices differ by more than 40% from current price $${currentPrice}. Prices found: ${validPrices.join(', ')}`);
    return null;
  }
  
  // No current price - return the most common price or median
  if (validPrices.length === 1) return validPrices[0];
  
  // Return the median price
  validPrices.sort((a, b) => a - b);
  const mid = Math.floor(validPrices.length / 2);
  return validPrices[mid];
}

// Validate that price change is reasonable
function isReasonablePriceChange(oldPrice: number | null, newPrice: number): boolean {
  if (!oldPrice || oldPrice <= 0) return true;
  
  const changePercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
  
  // Reject changes greater than 40%
  if (changePercent > 40) {
    console.log(`Rejecting price change: ${changePercent.toFixed(1)}% is too large`);
    return false;
  }
  
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get accessories that need price checks (older than 24 hours or never checked)
    // IMPORTANT: Skip DISCONTINUED products
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: accessories, error: fetchError } = await supabase
      .from('printer_accessories')
      .select('*')
      .not('product_url', 'is', null)
      .neq('product_url', 'DISCONTINUED') // Skip discontinued products
      .or(`last_price_check.is.null,last_price_check.lt.${twentyFourHoursAgo}`)
      .limit(50); // Process 50 at a time

    if (fetchError) {
      console.error('Error fetching accessories:', fetchError);
      throw fetchError;
    }

    if (!accessories || accessories.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No accessories need price updates',
          checked: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking prices for ${accessories.length} accessories`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const accessory of accessories) {
      try {
        // Skip invalid URLs
        if (!accessory.product_url || !accessory.product_url.startsWith('http')) {
          console.log(`Skipping ${accessory.name}: Invalid URL`);
          skipped++;
          continue;
        }

        console.log(`Fetching price for: ${accessory.name} (${accessory.accessory_type})`);
        
        let price: number | null = null;

        if (firecrawlApiKey) {
          // Try to scrape the price using Firecrawl
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: accessory.product_url,
              formats: ['markdown'],
              onlyMainContent: true,
            }),
          });

          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            const markdown = scrapeData.data?.markdown || '';
            
            // Use improved extraction with accessory type context
            price = extractPriceFromContent(
              markdown, 
              accessory.product_url,
              accessory.accessory_type || 'default',
              accessory.price
            );
            
            if (price) {
              console.log(`Extracted price for ${accessory.name}: $${price}`);
            } else {
              console.log(`Could not extract valid price for ${accessory.name}`);
            }
          } else {
            console.log(`Firecrawl failed for ${accessory.name}: ${scrapeResponse.status}`);
          }
        }

        // Only update if we got a valid price AND it's a reasonable change
        if (price !== null && isReasonablePriceChange(accessory.price, price)) {
          const oldPrice = accessory.price;
          const priceChangePercent = price && oldPrice 
            ? ((price - oldPrice) / oldPrice) * 100 
            : null;

          // Update accessory with new price
          await supabase
            .from('printer_accessories')
            .update({
              price: price,
              last_price_check: new Date().toISOString(),
              price_change_percent: priceChangePercent,
              updated_at: new Date().toISOString(),
            })
            .eq('id', accessory.id);

          // Record price in history
          await supabase
            .from('accessory_price_history')
            .insert({
              accessory_id: accessory.id,
              price: price,
              currency: accessory.currency || 'USD',
              source: 'automated_scrape',
            });

          updated++;
        } else {
          // Just update the last_price_check to avoid re-checking immediately
          await supabase
            .from('printer_accessories')
            .update({
              last_price_check: new Date().toISOString(),
            })
            .eq('id', accessory.id);
          
          skipped++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error checking price for ${accessory.name}:`, error);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Price check complete`,
        checked: accessories.length,
        updated,
        skipped,
        errors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fetch accessory prices error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Brand regional availability for stores and Amazon
interface RegionalAvailability {
  store: boolean;
  amazon: boolean;
}

interface BrandRegions {
  US: RegionalAvailability;
  CA: RegionalAvailability;
  UK: RegionalAvailability;
  EU: RegionalAvailability;
  AU: RegionalAvailability;
  JP: RegionalAvailability;
}

const BRAND_REGIONAL_AVAILABILITY: Record<string, BrandRegions> = {
  'Creality': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: false, amazon: true },
  },
  'Anycubic': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: false, amazon: true },
  },
  'Bambu Lab': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: true, amazon: true },
  },
  'UltiMaker': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: false },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'FLSUN': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
  },
  'Sovol': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
  },
  'Prusa Research': {
    US: { store: true, amazon: false },
    CA: { store: true, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: true, amazon: false },
    JP: { store: true, amazon: false },
  },
  'Elegoo': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: false, amazon: true },
  },
  'QIDI Tech': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: false, amazon: false },
  },
  'Snapmaker': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: false },
    JP: { store: true, amazon: false },
  },
  'FlashForge': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
  },
  'Raise3D': {
    US: { store: true, amazon: false },
    CA: { store: true, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: true, amazon: false },
    JP: { store: true, amazon: false },
  },
  'Voron Design': {
    US: { store: false, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'AnkerMake': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: true, amazon: true },
  },
  'Markforged': {
    US: { store: true, amazon: false },
    CA: { store: true, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'LDO Motors': {
    US: { store: false, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
};

type RegionCode = 'US' | 'CA' | 'UK' | 'EU' | 'AU' | 'JP';

function getBrandAvailability(brand: string, region: RegionCode): RegionalAvailability | null {
  const brandData = BRAND_REGIONAL_AVAILABILITY[brand];
  if (!brandData) return null;
  return brandData[region] || null;
}

interface RegionalStore {
  region: RegionCode;
  currency: string;
  storeUrlField: string;
  amazonUrlField: string;
  storePriceField: string;
  amazonPriceField: string;
  firecrawlCountry: string;
}

const REGIONAL_CONFIG: RegionalStore[] = [
  { region: 'US', currency: 'USD', storeUrlField: 'official_store_url', amazonUrlField: 'amazon_url_us', storePriceField: 'current_price_usd_store', amazonPriceField: 'current_price_usd_amazon', firecrawlCountry: 'us' },
  { region: 'CA', currency: 'CAD', storeUrlField: 'official_store_url_ca', amazonUrlField: 'amazon_url_ca', storePriceField: 'current_price_cad_store', amazonPriceField: 'current_price_cad_amazon', firecrawlCountry: 'ca' },
  { region: 'UK', currency: 'GBP', storeUrlField: 'official_store_url_uk', amazonUrlField: 'amazon_url_uk', storePriceField: 'current_price_gbp_store', amazonPriceField: 'current_price_gbp_amazon', firecrawlCountry: 'gb' },
  { region: 'EU', currency: 'EUR', storeUrlField: 'official_store_url_eu', amazonUrlField: 'amazon_url_de', storePriceField: 'current_price_eur_store', amazonPriceField: 'current_price_eur_amazon', firecrawlCountry: 'de' },
  { region: 'AU', currency: 'AUD', storeUrlField: 'official_store_url_au', amazonUrlField: 'amazon_url_au', storePriceField: 'current_price_aud_store', amazonPriceField: 'current_price_aud_amazon', firecrawlCountry: 'au' },
  { region: 'JP', currency: 'JPY', storeUrlField: 'official_store_url_jp', amazonUrlField: 'amazon_url_jp', storePriceField: 'current_price_jpy_store', amazonPriceField: 'current_price_jpy_amazon', firecrawlCountry: 'jp' },
];

function isValidPrinterPrice(price: number | null | undefined, currency: string = 'USD'): boolean {
  if (price === null || price === undefined || isNaN(price)) return false;
  
  // Currency-specific minimum thresholds (most printers cost at least this much)
  const minPrices: Record<string, number> = {
    'USD': 150,
    'CAD': 180,
    'GBP': 120,
    'EUR': 140,
    'AUD': 200,
    'JPY': 15000,
  };
  
  const minPrice = minPrices[currency] || 150;
  if (price < minPrice) return false;
  
  // Maximum reasonable printer prices
  const maxPrices: Record<string, number> = {
    'USD': 50000,
    'CAD': 60000,
    'GBP': 40000,
    'EUR': 45000,
    'AUD': 70000,
    'JPY': 5000000,
  };
  
  const maxPrice = maxPrices[currency] || 50000;
  if (price > maxPrice) return false;
  
  // Reject common discount/accessory price patterns
  const suspiciousPatterns = [49.99, 59.99, 69.99, 79.99, 84.99, 89.99, 99.99, 29.99, 39.99];
  if (suspiciousPatterns.some(p => Math.abs(price - p) < 1)) return false;
  
  return true;
}

function extractPriceFromMarkdown(markdown: string, currency: string): number | null {
  const currencySymbols: Record<string, string> = {
    'USD': '\\$',
    'CAD': '(?:C\\$|CAD\\s*\\$?|\\$)',
    'GBP': '£',
    'EUR': '€',
    'AUD': '(?:A\\$|AUD\\s*\\$?|\\$)',
    'JPY': '(?:¥|￥)',
  };

  const symbol = currencySymbols[currency] || '\\$';
  
  // Priority 1: Look for explicit product price patterns (most reliable)
  const productPricePatterns = [
    new RegExp(`(?:regular\\s*price|price|total)[:\\s]*${symbol}\\s*([\\d,]+(?:\\.\\d{2})?)`, 'gi'),
    new RegExp(`${symbol}\\s*([\\d,]+(?:\\.\\d{2})?)\\s*(?:USD|CAD|GBP|EUR|AUD)?(?:\\s|$|<)`, 'gi'),
  ];
  
  // Priority 2: General price patterns
  const generalPatterns = [
    new RegExp(`${symbol}\\s*([\\d,]+(?:\\.\\d{2})?)`, 'gi'),
    new RegExp(`([\\d,]+(?:\\.\\d{2})?)\\s*${symbol}`, 'gi'),
  ];

  const extractPrices = (patterns: RegExp[]): number[] => {
    const prices: number[] = [];
    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex state
      while ((match = pattern.exec(markdown)) !== null) {
        const priceStr = match[1].replace(/,/g, '');
        const price = parseFloat(priceStr);
        if (isValidPrinterPrice(price, currency)) {
          prices.push(price);
        }
      }
    }
    return prices;
  };

  // Try product-specific patterns first
  let prices = extractPrices(productPricePatterns);
  
  // Fall back to general patterns if needed
  if (prices.length === 0) {
    prices = extractPrices(generalPatterns);
  }

  if (prices.length === 0) return null;

  // For JPY, find prices in the expected range (typically 50k-500k for printers)
  if (currency === 'JPY') {
    const jpy = prices.find(p => p >= 50000 && p <= 500000);
    return jpy || prices.find(p => p > 15000) || null;
  }

  // Use statistical approach: find the most common price range
  // Printers typically have a prominent main price that appears multiple times
  const priceOccurrences = new Map<number, number>();
  for (const price of prices) {
    // Round to nearest $10 to group similar prices
    const rounded = Math.round(price / 10) * 10;
    priceOccurrences.set(rounded, (priceOccurrences.get(rounded) || 0) + 1);
  }
  
  // Find the most frequently occurring price range
  let mostCommonPrice = prices[0];
  let maxOccurrences = 0;
  for (const [rounded, count] of priceOccurrences.entries()) {
    if (count > maxOccurrences) {
      maxOccurrences = count;
      mostCommonPrice = prices.find(p => Math.abs(Math.round(p / 10) * 10 - rounded) < 1) || rounded;
    }
  }
  
  // If we found a clear winner, use it
  if (maxOccurrences >= 2) {
    console.log(`  Found frequently occurring price: ${currency} ${mostCommonPrice} (${maxOccurrences}x)`);
    return mostCommonPrice;
  }
  
  // Otherwise, prefer prices in typical printer range (not the cheapest - those are usually accessories)
  const typicalRange = prices.filter(p => {
    if (currency === 'USD' || currency === 'CAD') return p >= 200 && p <= 15000;
    if (currency === 'GBP') return p >= 150 && p <= 12000;
    if (currency === 'EUR') return p >= 180 && p <= 14000;
    if (currency === 'AUD') return p >= 250 && p <= 20000;
    return true;
  });
  
  if (typicalRange.length > 0) {
    // Sort and take median-ish price (avoid extremes)
    typicalRange.sort((a, b) => a - b);
    const idx = Math.floor(typicalRange.length / 2);
    console.log(`  Using median from typical range: ${currency} ${typicalRange[idx]}`);
    return typicalRange[idx];
  }
  
  // Last resort: take the highest valid price (main product usually costs more than accessories)
  prices.sort((a, b) => b - a);
  console.log(`  Using highest valid price: ${currency} ${prices[0]}`);
  return prices[0];
}

async function scrapePrice(url: string, region: RegionalStore, firecrawlApiKey: string): Promise<number | null> {
  if (!url || !url.startsWith('http')) return null;

  try {
    console.log(`  [${region.region}] Scraping: ${url}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
        location: { country: region.firecrawlCountry },
      }),
    });

    if (!response.ok) {
      console.warn(`  [${region.region}] Firecrawl error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.data?.markdown) {
      console.warn(`  [${region.region}] No markdown content`);
      return null;
    }

    const price = extractPriceFromMarkdown(data.data.markdown, region.currency);
    if (price) {
      console.log(`  [${region.region}] ✓ Found ${region.currency} ${price}`);
    } else {
      console.log(`  [${region.region}] ✗ No valid price found`);
    }
    return price;
  } catch (error) {
    console.error(`  [${region.region}] Error:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { brand, regions, limit = 3, getBrandAvailabilityOnly = false } = await req.json();
    
    // If just requesting brand availability data
    if (getBrandAvailabilityOnly) {
      return new Response(JSON.stringify({
        success: true,
        brand_availability: BRAND_REGIONAL_AVAILABILITY,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const selectedRegions = regions && regions.length > 0 
      ? REGIONAL_CONFIG.filter(r => regions.includes(r.region))
      : REGIONAL_CONFIG;

    console.log(`Starting global price update for ${brand || 'all brands'}, regions: ${selectedRegions.map(r => r.region).join(', ')}`);

    // Calculate 24 hours ago for skipping recently updated printers
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch printers to update (skip those updated in last 24 hours)
    let query = supabase
      .from('printers')
      .select('id, printer_id, model_name, brand_id, official_store_url, official_store_url_ca, official_store_url_uk, official_store_url_eu, official_store_url_au, official_store_url_jp, amazon_url_us, amazon_url_ca, amazon_url_uk, amazon_url_de, amazon_url_au, amazon_url_jp, prices_last_updated_at, printer_brands!inner(brand)')
      .eq('status', 'active')
      .or(`prices_last_updated_at.is.null,prices_last_updated_at.lt.${twentyFourHoursAgo}`)
      .order('prices_last_updated_at', { ascending: true, nullsFirst: true })
      .limit(limit);

    if (brand) {
      query = query.eq('printer_brands.brand', brand);
    }

    const { data: printers, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch printers: ${fetchError.message}`);
    }

    if (!printers || printers.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No printers to update',
        updated: 0,
        failed: 0,
        skipped: 0,
        results: [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Processing ${printers.length} printers...`);

    const results: any[] = [];
    let totalUpdated = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    for (const printer of printers) {
      const brandName = (printer.printer_brands as any)?.brand || 'Unknown';
      console.log(`\nProcessing: ${brandName} ${printer.model_name}`);

      const printerResult: any = {
        printer_id: printer.printer_id,
        model_name: printer.model_name,
        brand: brandName,
        prices: {},
        skipped_regions: [],
        success: false,
      };

      const updateData: Record<string, any> = {
        prices_last_updated_at: new Date().toISOString(),
      };

      let pricesFound = 0;

      for (const region of selectedRegions) {
        // Check brand availability for this region
        const availability = getBrandAvailability(brandName, region.region);
        
        if (!availability) {
          console.log(`  [${region.region}] Unknown brand "${brandName}" - skipping`);
          printerResult.skipped_regions.push({ region: region.region, reason: 'unknown_brand' });
          continue;
        }

        // Scrape store price if brand has store in this region
        if (availability.store) {
          const storeUrl = (printer as any)[region.storeUrlField] || (region.region === 'US' ? printer.official_store_url : null);
          if (storeUrl && storeUrl.startsWith('http')) {
            const storePrice = await scrapePrice(storeUrl, region, firecrawlApiKey);
            if (storePrice) {
              updateData[region.storePriceField] = storePrice;
              printerResult.prices[`${region.region}_store`] = { price: storePrice, currency: region.currency };
              pricesFound++;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } else {
          console.log(`  [${region.region}] No store for ${brandName} - skipping store`);
          printerResult.skipped_regions.push({ region: region.region, source: 'store', reason: 'not_available' });
        }

        // Scrape Amazon price if brand sells on Amazon in this region
        if (availability.amazon) {
          const amazonUrl = (printer as any)[region.amazonUrlField];
          if (amazonUrl && amazonUrl.startsWith('http')) {
            const amazonPrice = await scrapePrice(amazonUrl, region, firecrawlApiKey);
            if (amazonPrice) {
              updateData[region.amazonPriceField] = amazonPrice;
              printerResult.prices[`${region.region}_amazon`] = { price: amazonPrice, currency: region.currency };
              pricesFound++;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } else {
          console.log(`  [${region.region}] No Amazon for ${brandName} - skipping amazon`);
          printerResult.skipped_regions.push({ region: region.region, source: 'amazon', reason: 'not_available' });
        }
      }

      // Update the printer record
      if (pricesFound > 0) {
        const { error: updateError } = await supabase
          .from('printers')
          .update(updateData)
          .eq('id', printer.id);

        if (updateError) {
          console.error(`  Failed to update ${printer.model_name}:`, updateError);
          printerResult.success = false;
          printerResult.error = updateError.message;
          totalFailed++;
        } else {
          console.log(`  ✓ Updated ${printer.model_name} with ${pricesFound} prices`);
          printerResult.success = true;
          printerResult.prices_found = pricesFound;
          totalUpdated++;
        }
      } else {
        printerResult.success = false;
        printerResult.error = 'No prices found (regions not available or no URLs)';
        totalSkipped++;
      }

      results.push(printerResult);
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total processed: ${printers.length}`);
    console.log(`Successfully updated: ${totalUpdated}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Skipped: ${totalSkipped}`);

    return new Response(JSON.stringify({
      success: true,
      total_processed: printers.length,
      updated: totalUpdated,
      failed: totalFailed,
      skipped: totalSkipped,
      results,
      brand_availability: BRAND_REGIONAL_AVAILABILITY,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in update-global-prices:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      updated: 0,
      failed: 0,
      skipped: 0,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

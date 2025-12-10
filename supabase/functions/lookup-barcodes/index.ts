import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FilamentIdentifiers {
  id: string;
  product_title: string;
  vendor: string;
  variant_sku: string | null;
  mpn: string | null;
  upc: string | null;
  ean: string | null;
  gtin: string | null;
  product_url: string | null;
}

interface LookupResult {
  filament_id: string;
  product_title: string;
  found: boolean;
  upc?: string | null;
  ean?: string | null;
  gtin?: string | null;
  source?: string;
  error?: string;
  strategy?: string;
}

// Brand-specific lookup configuration
type LookupStrategy = 'shopify_barcode' | 'derive_from_ean' | 'derive_from_gtin' | 'sku_is_upc' | 'amazon_asin' | 'external_lookup';

interface BrandLookupConfig {
  strategies: LookupStrategy[];
  shopifyDomain?: string;
  upcPrefix?: string; // For validating SKU as UPC
  notes?: string;
}

const BRAND_LOOKUP_CONFIG: Record<string, BrandLookupConfig> = {
  'Hatchbox': {
    strategies: ['shopify_barcode', 'external_lookup'],
    shopifyDomain: 'www.hatchbox3d.com',
    notes: 'Shopify store with barcode in variant JSON'
  },
  '3D-Fuel': {
    strategies: ['shopify_barcode', 'external_lookup'],
    shopifyDomain: '3dfuel.com',
    notes: 'Shopify store'
  },
  '3DXTech': {
    strategies: ['shopify_barcode', 'external_lookup'],
    shopifyDomain: 'www.3dxtech.com',
    notes: 'Shopify store'
  },
  'Polymaker': {
    strategies: ['shopify_barcode', 'external_lookup'],
    shopifyDomain: 'us.polymaker.com',
    notes: 'Shopify store with product JSON endpoint'
  },
  'MatterHackers': {
    strategies: ['shopify_barcode', 'external_lookup'],
    shopifyDomain: 'www.matterhackers.com',
    notes: 'Large retailer with product data'
  },
  'Fillamentum': {
    strategies: ['derive_from_ean', 'external_lookup'],
    notes: 'European brand with EAN codes (859 prefix for Czech)'
  },
  'Sunlu': {
    strategies: ['derive_from_ean', 'amazon_asin', 'external_lookup'],
    notes: 'Has EAN codes, also on Amazon'
  },
  'ColorFabb': {
    strategies: ['derive_from_ean', 'external_lookup'],
    notes: 'Dutch brand with EAN codes'
  },
  'Bambu Lab': {
    strategies: ['derive_from_ean', 'shopify_barcode', 'external_lookup'],
    shopifyDomain: 'us.store.bambulab.com',
    notes: 'Has EAN codes in product data'
  },
  'Overture 3D': {
    strategies: ['derive_from_gtin', 'amazon_asin', 'external_lookup'],
    notes: 'Amazon-centric with GTIN codes'
  },
  'Overture': {
    strategies: ['derive_from_gtin', 'amazon_asin', 'external_lookup'],
    notes: 'Amazon-centric with GTIN codes'
  },
  'Paramount 3D': {
    strategies: ['sku_is_upc', 'amazon_asin', 'external_lookup'],
    upcPrefix: '852297',
    notes: '12-digit SKUs starting with 852297 are UPCs'
  },
  'Ziro': {
    strategies: ['amazon_asin', 'external_lookup'],
    notes: 'Amazon-only, use ASIN lookup'
  },
  'eSUN': {
    strategies: ['derive_from_ean', 'shopify_barcode', 'external_lookup'],
    notes: 'Chinese brand with EAN codes'
  },
  'Prusament': {
    strategies: ['derive_from_ean', 'external_lookup'],
    notes: 'Has EAN codes on product pages'
  },
  'Inland': {
    strategies: ['sku_is_upc', 'external_lookup'],
    upcPrefix: '840102',
    notes: 'Micro Center brand, SKUs may be UPCs'
  },
  'Eryone': {
    strategies: ['amazon_asin', 'external_lookup'],
    notes: 'Amazon-centric brand'
  },
  'AMOLEN': {
    strategies: ['amazon_asin', 'external_lookup'],
    notes: 'Amazon-centric brand'
  },
  'Amolen': {
    strategies: ['amazon_asin', 'external_lookup'],
    notes: 'Amazon-centric brand'
  },
  'NinjaTek': {
    strategies: ['shopify_barcode', 'external_lookup'],
    shopifyDomain: 'ninjatek.com',
    notes: 'WooCommerce store with SKU data'
  },
  'Fiberlogy': {
    strategies: ['derive_from_ean', 'external_lookup'],
    notes: 'Polish brand with EAN codes'
  },
  'Atomic Filament': {
    strategies: ['shopify_barcode', 'external_lookup'],
    shopifyDomain: 'atomicfilament.com',
    notes: 'Shopify store'
  },
  'VoxelPLA': {
    strategies: ['shopify_barcode', 'external_lookup'],
    notes: 'Shopify store with variant SKUs'
  }
};

// Normalize vendor name for config lookup
function normalizeVendor(vendor: string): string {
  const aliases: Record<string, string> = {
    'overture 3d': 'Overture 3D',
    'overture': 'Overture',
    'paramount 3d': 'Paramount 3D',
    'paramount': 'Paramount 3D',
    '3d-fuel': '3D-Fuel',
    '3dfuel': '3D-Fuel',
    '3dxtech': '3DXTech',
    'polymaker': 'Polymaker',
    'matterhackers': 'MatterHackers',
    'fillamentum': 'Fillamentum',
    'sunlu': 'Sunlu',
    'colorfabb': 'ColorFabb',
    'bambu lab': 'Bambu Lab',
    'bambulab': 'Bambu Lab',
    'hatchbox': 'Hatchbox',
    'esun': 'eSUN',
    'prusament': 'Prusament',
    'prusa': 'Prusament',
    'inland': 'Inland',
    'eryone': 'Eryone',
    'amolen': 'Amolen',
    'ninjatek': 'NinjaTek',
    'fiberlogy': 'Fiberlogy',
    'atomic filament': 'Atomic Filament',
    'atomic': 'Atomic Filament',
    'ziro': 'Ziro',
    'voxelpla': 'VoxelPLA'
  };
  
  const normalized = vendor.toLowerCase().trim();
  return aliases[normalized] || vendor;
}

// Extract barcode from search results using patterns
function extractBarcodeFromText(text: string): { upc?: string; ean?: string; gtin?: string } {
  const result: { upc?: string; ean?: string; gtin?: string } = {};
  
  // Look for 12-digit UPC
  const upc12Match = text.match(/\b(\d{12})\b/);
  if (upc12Match) {
    result.upc = upc12Match[1];
  }
  
  // Look for 13-digit EAN
  const ean13Match = text.match(/\b(\d{13})\b/);
  if (ean13Match) {
    result.ean = ean13Match[1];
  }
  
  // Look for 14-digit GTIN
  const gtin14Match = text.match(/\b(\d{14})\b/);
  if (gtin14Match) {
    result.gtin = gtin14Match[1];
  }
  
  // Also look for labeled barcodes
  const upcLabelMatch = text.match(/UPC[:\s]*(\d{12,13})/i);
  if (upcLabelMatch) {
    const code = upcLabelMatch[1];
    if (code.length === 12) result.upc = code;
    if (code.length === 13) result.ean = code;
  }
  
  const eanLabelMatch = text.match(/EAN[:\s]*(\d{13})/i);
  if (eanLabelMatch) {
    result.ean = eanLabelMatch[1];
  }
  
  const gtinLabelMatch = text.match(/GTIN[:\s]*(\d{14})/i);
  if (gtinLabelMatch) {
    result.gtin = gtinLabelMatch[1];
  }
  
  return result;
}

// Derive UPC from EAN-13 (strip leading 0)
function deriveUpcFromEan(ean: string): string | null {
  if (!ean || ean.length !== 13) return null;
  // If EAN starts with 0, the remaining 12 digits are the UPC
  if (ean.startsWith('0')) {
    return ean.substring(1);
  }
  return null;
}

// Derive UPC from GTIN-14 (strip leading zeros)
function deriveUpcFromGtin(gtin: string): string | null {
  if (!gtin || gtin.length !== 14) return null;
  // Strip leading zeros to get 12-digit UPC
  const stripped = gtin.replace(/^0+/, '');
  if (stripped.length === 12) {
    return stripped;
  }
  // If stripping gives us more than 12, take the last 12
  if (stripped.length > 12) {
    return stripped.substring(stripped.length - 12);
  }
  return null;
}

// Validate SKU as UPC
function validateSkuAsUpc(sku: string, upcPrefix?: string): string | null {
  if (!sku) return null;
  
  // Remove any non-digit characters
  const digitsOnly = sku.replace(/\D/g, '');
  
  // Must be exactly 12 digits
  if (digitsOnly.length !== 12) return null;
  
  // If prefix specified, validate it
  if (upcPrefix && !digitsOnly.startsWith(upcPrefix)) {
    return null;
  }
  
  return digitsOnly;
}

// Extract ASIN from Amazon URL
function extractAsinFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Match /dp/ASIN or /gp/product/ASIN patterns
  const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})/i);
  if (dpMatch) return dpMatch[1].toUpperCase();
  
  const gpMatch = url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  if (gpMatch) return gpMatch[1].toUpperCase();
  
  // Match /product/ASIN pattern
  const productMatch = url.match(/\/product\/([A-Z0-9]{10})/i);
  if (productMatch) return productMatch[1].toUpperCase();
  
  return null;
}

// Fetch Shopify product JSON to get barcode
async function fetchShopifyBarcode(productUrl: string): Promise<{ upc?: string; ean?: string; gtin?: string; sku?: string } | null> {
  if (!productUrl) return null;
  
  try {
    // Extract product handle from URL
    const urlMatch = productUrl.match(/\/products\/([^/?#]+)/);
    if (!urlMatch) return null;
    
    const handle = urlMatch[1];
    const urlObj = new URL(productUrl);
    const jsonUrl = `${urlObj.origin}/products/${handle}.json`;
    
    console.log(`  Fetching Shopify JSON: ${jsonUrl}`);
    
    const response = await fetch(jsonUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; FilamentLookup/1.0)'
      }
    });
    
    if (!response.ok) {
      console.log(`  Shopify JSON fetch failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const result: { upc?: string; ean?: string; gtin?: string; sku?: string } = {};
    
    if (data.product && data.product.variants) {
      // Get the first variant with barcode
      for (const variant of data.product.variants) {
        if (variant.barcode) {
          const barcode = variant.barcode.toString().trim();
          if (barcode.length === 12) {
            result.upc = barcode;
          } else if (barcode.length === 13) {
            result.ean = barcode;
            // Also derive UPC if possible
            const derivedUpc = deriveUpcFromEan(barcode);
            if (derivedUpc) result.upc = derivedUpc;
          } else if (barcode.length === 14) {
            result.gtin = barcode;
            const derivedUpc = deriveUpcFromGtin(barcode);
            if (derivedUpc) result.upc = derivedUpc;
          }
        }
        if (variant.sku && !result.sku) {
          result.sku = variant.sku;
        }
        // If we found a barcode, stop
        if (result.upc || result.ean || result.gtin) break;
      }
    }
    
    return (result.upc || result.ean || result.gtin || result.sku) ? result : null;
  } catch (error) {
    console.error('Shopify fetch error:', error);
    return null;
  }
}

// Fetch HTML page and extract barcodes from embedded JSON/scripts
async function fetchPageBarcodes(url: string): Promise<{ upc?: string; ean?: string; gtin?: string } | null> {
  if (!url) return null;
  
  try {
    console.log(`  Fetching page for barcodes: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; FilamentLookup/1.0)'
      }
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const result: { upc?: string; ean?: string; gtin?: string } = {};
    
    // Look for JSON-LD product data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const script of jsonLdMatch) {
        const jsonContent = script.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        try {
          const data = JSON.parse(jsonContent);
          if (data.gtin || data.gtin13 || data.gtin12) {
            const gtin = data.gtin || data.gtin13 || data.gtin12;
            if (gtin.length === 12) result.upc = gtin;
            else if (gtin.length === 13) {
              result.ean = gtin;
              const derivedUpc = deriveUpcFromEan(gtin);
              if (derivedUpc) result.upc = derivedUpc;
            }
            else if (gtin.length === 14) {
              result.gtin = gtin;
              const derivedUpc = deriveUpcFromGtin(gtin);
              if (derivedUpc) result.upc = derivedUpc;
            }
          }
          if (data.sku && !result.upc) {
            // Check if SKU is a barcode
            const barcodes = extractBarcodeFromText(data.sku);
            Object.assign(result, barcodes);
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
    }
    
    // Look for barcode in variant JSON embedded in Shopify pages
    const variantJsonMatch = html.match(/"barcode"\s*:\s*"(\d{12,14})"/);
    if (variantJsonMatch) {
      const barcode = variantJsonMatch[1];
      if (barcode.length === 12) result.upc = barcode;
      else if (barcode.length === 13) {
        result.ean = barcode;
        const derivedUpc = deriveUpcFromEan(barcode);
        if (derivedUpc) result.upc = derivedUpc;
      }
      else if (barcode.length === 14) {
        result.gtin = barcode;
        const derivedUpc = deriveUpcFromGtin(barcode);
        if (derivedUpc) result.upc = derivedUpc;
      }
    }
    
    // Look for EAN patterns in HTML (especially Czech EAN prefix 859)
    const eanMatch = html.match(/\b(859\d{10})\b/);
    if (eanMatch && !result.ean) {
      result.ean = eanMatch[1];
      const derivedUpc = deriveUpcFromEan(eanMatch[1]);
      if (derivedUpc) result.upc = derivedUpc;
    }
    
    return (result.upc || result.ean || result.gtin) ? result : null;
  } catch (error) {
    console.error('Page fetch error:', error);
    return null;
  }
}

// Search using SerpAPI
async function searchWithSerpApi(query: string, serpApiKey: string): Promise<{ upc?: string; ean?: string; gtin?: string } | null> {
  try {
    const searchQuery = encodeURIComponent(`${query} UPC barcode`);
    const url = `https://serpapi.com/search.json?q=${searchQuery}&api_key=${serpApiKey}&num=5`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`SerpAPI error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check organic results
    if (data.organic_results) {
      for (const result of data.organic_results) {
        const textToSearch = `${result.title || ''} ${result.snippet || ''}`;
        const barcodes = extractBarcodeFromText(textToSearch);
        if (barcodes.upc || barcodes.ean || barcodes.gtin) {
          return barcodes;
        }
      }
    }
    
    // Check shopping results if available
    if (data.shopping_results) {
      for (const result of data.shopping_results) {
        const textToSearch = `${result.title || ''} ${result.snippet || ''}`;
        const barcodes = extractBarcodeFromText(textToSearch);
        if (barcodes.upc || barcodes.ean || barcodes.gtin) {
          return barcodes;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('SerpAPI search error:', error);
    return null;
  }
}

// Try UPCitemdb.com free lookup (limited but no API key needed)
async function searchUpcItemDb(query: string): Promise<{ upc?: string; ean?: string; gtin?: string } | null> {
  try {
    // UPCitemdb has a free search endpoint
    const searchUrl = `https://api.upcitemdb.com/prod/trial/search?s=${encodeURIComponent(query)}&type=product`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.log(`UPCitemdb error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      const result: { upc?: string; ean?: string; gtin?: string } = {
        upc: item.upc || null,
        ean: item.ean || null,
        gtin: item.gtin || null,
      };
      
      // Derive UPC from EAN/GTIN if not present
      if (!result.upc && result.ean) {
        result.upc = deriveUpcFromEan(result.ean) || undefined;
      }
      if (!result.upc && result.gtin) {
        result.upc = deriveUpcFromGtin(result.gtin) || undefined;
      }
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('UPCitemdb search error:', error);
    return null;
  }
}

// Build optimized search query based on available identifiers
function buildSearchQuery(filament: FilamentIdentifiers, vendor: string): string[] {
  const queries: string[] = [];
  
  // Priority 1: SKU/MPN + brand (most specific)
  const identifier = filament.mpn || filament.variant_sku;
  if (identifier) {
    queries.push(`${vendor} ${identifier}`);
    queries.push(`${identifier} filament UPC`);
  }
  
  // Priority 2: Product title + brand
  if (filament.product_title) {
    queries.push(`${vendor} ${filament.product_title}`);
  }
  
  // Priority 3: Extract key terms (material, color, weight)
  if (filament.product_title) {
    const title = filament.product_title;
    const materials = title.match(/\b(PLA|PETG|ABS|TPU|ASA|Nylon|PC|PVA|HIPS)\b/i);
    const weights = title.match(/\b(\d+(?:\.\d+)?)\s*(?:kg|g)\b/i);
    const colors = title.match(/\b(Black|White|Red|Blue|Green|Yellow|Orange|Purple|Pink|Grey|Gray|Silver|Gold|Clear|Natural)\b/i);
    
    if (materials && colors) {
      queries.push(`${vendor} ${materials[0]} ${colors[0]} filament`);
    }
  }
  
  return queries;
}

async function lookupBarcode(
  filament: FilamentIdentifiers,
  serpApiKey: string
): Promise<LookupResult> {
  const result: LookupResult = {
    filament_id: filament.id,
    product_title: filament.product_title,
    found: false,
  };
  
  const vendor = normalizeVendor(filament.vendor || '');
  const config = BRAND_LOOKUP_CONFIG[vendor];
  
  console.log(`\nLooking up: ${filament.product_title} (${vendor})`);
  console.log(`  Strategies: ${config?.strategies?.join(', ') || 'default external_lookup'}`);
  console.log(`  Existing: UPC=${filament.upc}, EAN=${filament.ean}, GTIN=${filament.gtin}`);
  console.log(`  SKU=${filament.variant_sku}, MPN=${filament.mpn}`);
  
  // Strategy 1: Derive UPC from existing EAN
  if (filament.ean && !filament.upc) {
    const derivedUpc = deriveUpcFromEan(filament.ean);
    if (derivedUpc) {
      console.log(`  Derived UPC from EAN: ${derivedUpc}`);
      result.found = true;
      result.upc = derivedUpc;
      result.ean = filament.ean;
      result.source = 'derived_from_ean';
      result.strategy = 'derive_from_ean';
      return result;
    }
  }
  
  // Strategy 2: Derive UPC from existing GTIN
  if (filament.gtin && !filament.upc) {
    const derivedUpc = deriveUpcFromGtin(filament.gtin);
    if (derivedUpc) {
      console.log(`  Derived UPC from GTIN: ${derivedUpc}`);
      result.found = true;
      result.upc = derivedUpc;
      result.gtin = filament.gtin;
      result.source = 'derived_from_gtin';
      result.strategy = 'derive_from_gtin';
      return result;
    }
  }
  
  // Strategy 3: Validate SKU as UPC (for brands like Paramount 3D, Inland)
  if (config?.strategies?.includes('sku_is_upc') && filament.variant_sku) {
    const validUpc = validateSkuAsUpc(filament.variant_sku, config.upcPrefix);
    if (validUpc) {
      console.log(`  SKU is valid UPC: ${validUpc}`);
      result.found = true;
      result.upc = validUpc;
      result.source = 'sku_is_upc';
      result.strategy = 'sku_is_upc';
      return result;
    }
  }
  
  // Strategy 4: Fetch Shopify product JSON
  if (config?.strategies?.includes('shopify_barcode') && filament.product_url) {
    const shopifyResult = await fetchShopifyBarcode(filament.product_url);
    if (shopifyResult && (shopifyResult.upc || shopifyResult.ean || shopifyResult.gtin)) {
      console.log(`  Shopify barcode found: UPC=${shopifyResult.upc}, EAN=${shopifyResult.ean}`);
      result.found = true;
      result.upc = shopifyResult.upc;
      result.ean = shopifyResult.ean;
      result.gtin = shopifyResult.gtin;
      result.source = 'shopify_json';
      result.strategy = 'shopify_barcode';
      return result;
    }
  }
  
  // Strategy 5: Fetch product page and extract barcodes from HTML/JSON-LD
  if (filament.product_url) {
    const pageBarcodes = await fetchPageBarcodes(filament.product_url);
    if (pageBarcodes && (pageBarcodes.upc || pageBarcodes.ean || pageBarcodes.gtin)) {
      console.log(`  Page barcode found: UPC=${pageBarcodes.upc}, EAN=${pageBarcodes.ean}`);
      result.found = true;
      result.upc = pageBarcodes.upc;
      result.ean = pageBarcodes.ean;
      result.gtin = pageBarcodes.gtin;
      result.source = 'page_scrape';
      result.strategy = 'page_scrape';
      return result;
    }
  }
  
  // Strategy 6: Amazon ASIN lookup (placeholder - would need API key)
  if (config?.strategies?.includes('amazon_asin') && filament.product_url) {
    const asin = extractAsinFromUrl(filament.product_url);
    if (asin) {
      console.log(`  Found ASIN: ${asin} (ASIN->UPC lookup requires additional API)`);
      // For now, use ASIN to build a better search query
      // In future, could use ASINScope API or similar
    }
  }
  
  // Strategy 7: Build optimized search queries and try external lookup
  const searchQueries = buildSearchQuery(filament, vendor);
  
  for (const query of searchQueries) {
    console.log(`  Trying search: ${query}`);
    
    // Try UPCitemdb first
    const upcDbResult = await searchUpcItemDb(query);
    if (upcDbResult && (upcDbResult.upc || upcDbResult.ean || upcDbResult.gtin)) {
      console.log(`  UPCitemdb found: UPC=${upcDbResult.upc}, EAN=${upcDbResult.ean}`);
      result.found = true;
      result.upc = upcDbResult.upc;
      result.ean = upcDbResult.ean;
      result.gtin = upcDbResult.gtin;
      result.source = 'upcitemdb';
      result.strategy = 'external_lookup';
      return result;
    }
    
    // Rate limit between queries
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Final fallback: SerpAPI
  if (serpApiKey && searchQueries.length > 0) {
    const serpResult = await searchWithSerpApi(searchQueries[0], serpApiKey);
    if (serpResult && (serpResult.upc || serpResult.ean || serpResult.gtin)) {
      console.log(`  SerpAPI found: UPC=${serpResult.upc}, EAN=${serpResult.ean}`);
      result.found = true;
      result.upc = serpResult.upc;
      result.ean = serpResult.ean;
      result.gtin = serpResult.gtin;
      result.source = 'serpapi';
      result.strategy = 'external_lookup';
      return result;
    }
  }
  
  console.log(`  No barcodes found for: ${filament.product_title}`);
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serpApiKey = Deno.env.get('SERPAPI_KEY') || '';
    
    // Authentication check - require admin role
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const authClient = createClient(supabaseUrl, authHeader.replace('Bearer ', ''));
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check admin role
    const { data: isAdmin } = await authClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Authenticated admin user: ${user.id}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { filamentIds, vendor, limit = 10, forceUpdate = false, deriveOnly = false } = await req.json();
    
    console.log(`Barcode lookup request: vendor=${vendor}, limit=${limit}, forceUpdate=${forceUpdate}, deriveOnly=${deriveOnly}`);
    
    // Special mode: derive UPCs from existing EAN/GTIN without external lookups
    if (deriveOnly) {
      console.log('Running derive-only mode (no external API calls)');
      
      // Find filaments with EAN or GTIN but no UPC
      let deriveQuery = supabase
        .from('filaments')
        .select('id, product_title, vendor, variant_sku, mpn, upc, ean, gtin, product_url')
        .is('upc', null)
        .or('ean.not.is.null,gtin.not.is.null');
      
      if (vendor) {
        deriveQuery = deriveQuery.ilike('vendor', vendor);
      }
      
      deriveQuery = deriveQuery.limit(limit);
      
      const { data: deriveFilaments, error: deriveError } = await deriveQuery;
      
      if (deriveError) throw deriveError;
      
      if (!deriveFilaments || deriveFilaments.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'No filaments with EAN/GTIN needing UPC derivation',
            results: [],
            stats: { processed: 0, found: 0, updated: 0 }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`Processing ${deriveFilaments.length} filaments for UPC derivation`);
      
      const results: LookupResult[] = [];
      let found = 0;
      let updated = 0;
      
      for (const filament of deriveFilaments) {
        let derivedUpc: string | null = null;
        let source = '';
        
        if (filament.ean) {
          derivedUpc = deriveUpcFromEan(filament.ean);
          source = 'derived_from_ean';
        }
        if (!derivedUpc && filament.gtin) {
          derivedUpc = deriveUpcFromGtin(filament.gtin);
          source = 'derived_from_gtin';
        }
        
        if (derivedUpc) {
          found++;
          results.push({
            filament_id: filament.id,
            product_title: filament.product_title,
            found: true,
            upc: derivedUpc,
            ean: filament.ean,
            gtin: filament.gtin,
            source,
            strategy: source
          });
          
          const { error: updateError } = await supabase
            .from('filaments')
            .update({ upc: derivedUpc })
            .eq('id', filament.id);
          
          if (!updateError) {
            updated++;
            console.log(`  Derived UPC for ${filament.product_title}: ${derivedUpc} (${source})`);
          }
        } else {
          results.push({
            filament_id: filament.id,
            product_title: filament.product_title,
            found: false,
            error: 'Could not derive UPC from EAN/GTIN'
          });
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          results,
          stats: {
            processed: deriveFilaments.length,
            found,
            updated,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Build query for filaments that need barcode lookup
    let query = supabase
      .from('filaments')
      .select('id, product_title, vendor, variant_sku, mpn, upc, ean, gtin, product_url');
    
    if (filamentIds && filamentIds.length > 0) {
      query = query.in('id', filamentIds);
    } else if (vendor) {
      query = query.ilike('vendor', vendor);
    }
    
    // Only get filaments missing UPC unless force update
    if (!forceUpdate) {
      query = query.is('upc', null);
    }
    
    // Prefer filaments with SKU/MPN or product_url for better lookup
    query = query.or('variant_sku.not.is.null,mpn.not.is.null,product_url.not.is.null');
    
    query = query.limit(limit);
    
    const { data: filaments, error: fetchError } = await query;
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!filaments || filaments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No filaments need barcode lookup',
          results: [],
          stats: { processed: 0, found: 0, updated: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing ${filaments.length} filaments for barcode lookup`);
    
    const results: LookupResult[] = [];
    let found = 0;
    let updated = 0;
    
    for (const filament of filaments) {
      const lookupResult = await lookupBarcode(filament as FilamentIdentifiers, serpApiKey);
      results.push(lookupResult);
      
      if (lookupResult.found) {
        found++;
        
        // Update database with found barcodes
        const updates: { upc?: string; ean?: string; gtin?: string } = {};
        
        if (lookupResult.upc && (!filament.upc || forceUpdate)) {
          updates.upc = lookupResult.upc;
        }
        if (lookupResult.ean && (!filament.ean || forceUpdate)) {
          updates.ean = lookupResult.ean;
        }
        if (lookupResult.gtin && (!filament.gtin || forceUpdate)) {
          updates.gtin = lookupResult.gtin;
        }
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update(updates)
            .eq('id', filament.id);
          
          if (!updateError) {
            updated++;
            console.log(`  Updated ${filament.product_title}: ${JSON.stringify(updates)}`);
          } else {
            console.error(`  Update failed for ${filament.id}:`, updateError);
          }
        }
      }
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Barcode lookup complete: processed=${filaments.length}, found=${found}, updated=${updated}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        results,
        stats: {
          processed: filaments.length,
          found,
          updated,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Barcode lookup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

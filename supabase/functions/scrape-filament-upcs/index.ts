import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive brand configuration for UPC scraping
interface BrandConfig {
  shopifyUrl?: string;           // Shopify store URL (for JSON API)
  productsJsonPath?: string;     // Custom products.json path
  upcExtractionMethod: 'shopify' | 'woocommerce' | 'magento' | 'custom' | 'none';
  customExtractor?: (productUrl: string, productTitle: string) => Promise<string | null>;
  notes?: string;
}

const BRAND_CONFIGS: Record<string, BrandConfig> = {
  // === SHOPIFY STORES (most common - use products.json API) ===
  '3D-Fuel': {
    shopifyUrl: 'https://www.3dfuel.com',
    upcExtractionMethod: 'shopify',
  },
  '3DXTech': {
    shopifyUrl: 'https://www.3dxtech.com',
    upcExtractionMethod: 'shopify',
  },
  'Polymaker': {
    shopifyUrl: 'https://us.polymaker.com',
    upcExtractionMethod: 'shopify',
  },
  'Overture': {
    shopifyUrl: 'https://overture3d.com',
    upcExtractionMethod: 'shopify',
  },
  'SUNLU': {
    shopifyUrl: 'https://www.sunlu.com',
    upcExtractionMethod: 'shopify',
  },
  'Amolen': {
    shopifyUrl: 'https://amolen.com',
    upcExtractionMethod: 'shopify',
  },
  'Eryone': {
    shopifyUrl: 'https://eryone3d.com',
    upcExtractionMethod: 'shopify',
  },
  'Atomic Filament': {
    shopifyUrl: 'https://atomicfilament.com',
    upcExtractionMethod: 'shopify',
  },
  'Proto-pasta': {
    shopifyUrl: 'https://www.proto-pasta.com',
    upcExtractionMethod: 'shopify',
  },
  'ColorFabb': {
    shopifyUrl: 'https://colorfabb.com',
    upcExtractionMethod: 'shopify',
  },
  'Fillamentum': {
    shopifyUrl: 'https://shop.fillamentum.com',
    upcExtractionMethod: 'shopify',
  },
  'NinjaTek': {
    shopifyUrl: 'https://ninjatek.com',
    upcExtractionMethod: 'shopify',
  },
  'Taulman3D': {
    shopifyUrl: 'https://taulman3d.com',
    upcExtractionMethod: 'shopify',
  },
  'Fiberlogy': {
    shopifyUrl: 'https://fiberlogy.com',
    upcExtractionMethod: 'shopify',
  },
  'FormFutura': {
    shopifyUrl: 'https://formfutura.com',
    upcExtractionMethod: 'shopify',
  },
  'Inland': {
    shopifyUrl: 'https://inlandfilament.com',
    upcExtractionMethod: 'shopify',
  },
  'ZIRO': {
    shopifyUrl: 'https://ziro3d.com',
    upcExtractionMethod: 'shopify',
  },
  'VoxelPLA': {
    shopifyUrl: 'https://voxelpla.com',
    upcExtractionMethod: 'shopify',
  },
  'GreenGate3D': {
    shopifyUrl: 'https://greengate3d.com',
    upcExtractionMethod: 'shopify',
  },
  'Paramount 3D': {
    shopifyUrl: 'https://paramount-3d.com',
    upcExtractionMethod: 'shopify',
  },
  'Gizmo Dorks': {
    shopifyUrl: 'https://gizmodorks.com',
    upcExtractionMethod: 'shopify',
  },
  'Printed Solid': {
    shopifyUrl: 'https://printedsolid.com',
    upcExtractionMethod: 'shopify',
  },
  'Matter3D': {
    shopifyUrl: 'https://matter3d.com',
    upcExtractionMethod: 'shopify',
  },
  
  // === WOOCOMMERCE STORES ===
  'eSUN': {
    shopifyUrl: 'https://www.esun3d.com',
    upcExtractionMethod: 'woocommerce',
    notes: 'eSUN uses WooCommerce - UPCs in product meta or SKU field',
  },
  
  // === BRANDS WITH CUSTOM STORES ===
  'Prusament': {
    upcExtractionMethod: 'custom',
    notes: 'Prusa uses custom e-commerce - check product page meta tags',
  },
  'MatterHackers': {
    shopifyUrl: 'https://www.matterhackers.com',
    upcExtractionMethod: 'custom',
    notes: 'MatterHackers has custom store - may need HTML scraping',
  },
  'Hatchbox': {
    upcExtractionMethod: 'none',
    notes: 'Hatchbox primarily sold through Amazon - UPCs on Amazon listings',
  },
  'Bambu Lab': {
    upcExtractionMethod: 'custom',
    notes: 'Bambu Lab store - check product page for barcode data',
  },
  'Creality': {
    upcExtractionMethod: 'custom',
    notes: 'Creality store - may have UPCs in product data',
  },
  'Anycubic': {
    upcExtractionMethod: 'custom',
    notes: 'Anycubic store',
  },
  'ELEGOO': {
    upcExtractionMethod: 'none',
    notes: 'ELEGOO primarily sells through Amazon',
  },
  'QIDI': {
    upcExtractionMethod: 'custom',
    notes: 'QIDI store',
  },
  'Siraya Tech': {
    shopifyUrl: 'https://siraya.tech',
    upcExtractionMethod: 'shopify',
  },
};

// Alias mapping for vendor name variations
const VENDOR_ALIASES: Record<string, string> = {
  'esun': 'eSUN',
  'ESUN': 'eSUN',
  'sunlu': 'SUNLU',
  'Sunlu': 'SUNLU',
  'polymaker': 'Polymaker',
  '3dxtech': '3DXTech',
  '3DXTECH': '3DXTech',
  'hatchbox': 'Hatchbox',
  'HATCHBOX': 'Hatchbox',
  'overture': 'Overture',
  'OVERTURE': 'Overture',
  'inland': 'Inland',
  'INLAND': 'Inland',
  'ziro': 'ZIRO',
  'Ziro': 'ZIRO',
  'colorfabb': 'ColorFabb',
  'Colorfabb': 'ColorFabb',
  'fillamentum': 'Fillamentum',
  'fiberlogy': 'Fiberlogy',
  'formfutura': 'FormFutura',
  'Formfutura': 'FormFutura',
  'proto-pasta': 'Proto-pasta',
  'Proto-Pasta': 'Proto-pasta',
  'protopasta': 'Proto-pasta',
  'ninjatek': 'NinjaTek',
  'Ninjatek': 'NinjaTek',
  'taulman3d': 'Taulman3D',
  'Taulman3d': 'Taulman3D',
  'TAULMAN3D': 'Taulman3D',
  'taulman 3d': 'Taulman3D',
  '3d-fuel': '3D-Fuel',
  '3D Fuel': '3D-Fuel',
  '3dfuel': '3D-Fuel',
  'atomic': 'Atomic Filament',
  'Atomic': 'Atomic Filament',
  'atomicfilament': 'Atomic Filament',
  'gizmo dorks': 'Gizmo Dorks',
  'GizmoDorks': 'Gizmo Dorks',
  'matter3d': 'Matter3D',
  'Matter 3D': 'Matter3D',
  'printed solid': 'Printed Solid',
  'printedsolid': 'Printed Solid',
  'paramount': 'Paramount 3D',
  'paramount3d': 'Paramount 3D',
  'siraya': 'Siraya Tech',
  'sirayatech': 'Siraya Tech',
  'greengate': 'GreenGate3D',
  'greengate 3d': 'GreenGate3D',
  'voxel': 'VoxelPLA',
  'voxelpla': 'VoxelPLA',
  'matterhackers': 'MatterHackers',
  'matter hackers': 'MatterHackers',
  'prusament': 'Prusament',
  'prusa': 'Prusament',
  'bambulab': 'Bambu Lab',
  'bambu': 'Bambu Lab',
  'creality': 'Creality',
  'anycubic': 'Anycubic',
  'elegoo': 'ELEGOO',
  'Elegoo': 'ELEGOO',
  'qidi': 'QIDI',
  'Qidi': 'QIDI',
  'qidi tech': 'QIDI',
  'amolen': 'Amolen',
  'AMOLEN': 'Amolen',
  'eryone': 'Eryone',
  'ERYONE': 'Eryone',
};

function normalizeVendorName(vendor: string): string {
  return VENDOR_ALIASES[vendor] || VENDOR_ALIASES[vendor.toLowerCase()] || vendor;
}

function getBrandConfig(vendor: string): BrandConfig | null {
  const normalizedVendor = normalizeVendorName(vendor);
  return BRAND_CONFIGS[normalizedVendor] || null;
}

// Extract product handle from URL
function extractProductHandle(productUrl: string): string | null {
  // Shopify format: /products/product-handle
  const shopifyMatch = productUrl.match(/\/products\/([^?/]+)/);
  if (shopifyMatch) return shopifyMatch[1];
  
  // WooCommerce format: /product/product-slug/
  const wooMatch = productUrl.match(/\/product\/([^?/]+)/);
  if (wooMatch) return wooMatch[1];
  
  // Generic slug at end of URL
  const genericMatch = productUrl.match(/\/([^/?]+)(?:\?|$)/);
  if (genericMatch && genericMatch[1] !== 'products' && genericMatch[1] !== 'product') {
    return genericMatch[1];
  }
  
  return null;
}

// Shopify product identifier extraction
interface ShopifyExtractionResult {
  upc: string | null;
  sku: string | null;
  gtin: string | null;
  ean: string | null;
  note?: string;
}

// Normalize title for matching
function normalizeForMatching(str: string): string {
  return str
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Find product in cache by fuzzy title matching
function findProductByTitle(productTitle: string, productMap: Map<string, any>): any | null {
  const normalizedTitle = normalizeForMatching(productTitle);
  const titleWords = normalizedTitle.split(' ').filter(w => w.length > 2);
  
  let bestMatch: any = null;
  let bestScore = 0;
  
  for (const [handle, product] of productMap) {
    const shopifyTitle = normalizeForMatching(product.title || '');
    
    // Check if titles are similar enough
    let matchingWords = 0;
    for (const word of titleWords) {
      if (shopifyTitle.includes(word)) matchingWords++;
    }
    
    const score = matchingWords / titleWords.length;
    if (score > bestScore && score >= 0.5) { // At least 50% of words match
      bestScore = score;
      bestMatch = product;
    }
  }
  
  return bestMatch;
}

async function extractFromShopify(
  shopifyUrl: string,
  productHandle: string,
  productMap: Map<string, any>,
  productTitle?: string
): Promise<ShopifyExtractionResult> {
  let upc: string | null = null;
  let sku: string | null = null;
  let gtin: string | null = null;
  let ean: string | null = null;
  
  // Helper to classify barcode type based on length
  const classifyBarcode = (barcode: string): { upc: string | null; gtin: string | null; ean: string | null } => {
    const cleanBarcode = barcode.replace(/\D/g, '');
    const length = cleanBarcode.length;
    
    // UPC-A: 12 digits, UPC-E: 8 digits
    if (length === 12 || length === 8) {
      return { upc: cleanBarcode, gtin: null, ean: null };
    }
    // EAN-13: 13 digits, EAN-8: 8 digits (same as UPC-E, context dependent)
    if (length === 13) {
      return { upc: null, gtin: null, ean: cleanBarcode };
    }
    // GTIN-14: 14 digits
    if (length === 14) {
      return { upc: null, gtin: cleanBarcode, ean: null };
    }
    // Default: treat as UPC if 10-12 digits, otherwise GTIN
    if (length >= 10 && length <= 12) {
      return { upc: cleanBarcode, gtin: null, ean: null };
    }
    return { upc: null, gtin: cleanBarcode, ean: null };
  };
  
  // Helper to extract data from variants
  const extractFromVariants = (variants: any[], source: string): boolean => {
    for (const variant of variants || []) {
      // Extract barcode and classify it
      if (variant.barcode && variant.barcode.length >= 8) {
        const classified = classifyBarcode(variant.barcode);
        if (!upc && classified.upc) {
          console.log(`  Found UPC in ${source}: ${classified.upc}`);
          upc = classified.upc;
        }
        if (!ean && classified.ean) {
          console.log(`  Found EAN in ${source}: ${classified.ean}`);
          ean = classified.ean;
        }
        if (!gtin && classified.gtin) {
          console.log(`  Found GTIN in ${source}: ${classified.gtin}`);
          gtin = classified.gtin;
        }
      }
      // Extract SKU
      if (!sku && variant.sku && variant.sku.trim()) {
        console.log(`  Found SKU in ${source}: ${variant.sku}`);
        sku = variant.sku.trim();
      }
      // If we have all, we're done
      if ((upc || ean || gtin) && sku) return true;
    }
    return upc !== null || sku !== null || gtin !== null || ean !== null;
  };
  
  // Try cache first by exact handle match
  const cachedProduct = productMap.get(productHandle.toLowerCase());
  if (cachedProduct) {
    const variantsChecked = cachedProduct.variants?.length || 0;
    const found = extractFromVariants(cachedProduct.variants, 'cache (exact handle)');
    
    if (found) {
      return { upc, sku, gtin, ean };
    }
    
    if (variantsChecked > 0) {
      console.log(`  Product found in cache (${variantsChecked} variants) but no barcode/sku populated`);
      return { upc: null, sku: null, gtin: null, ean: null, note: `Product has ${variantsChecked} variants but none have barcode/sku data` };
    }
  }
  
  // Try individual product JSON first
  try {
    const productJsonUrl = `${shopifyUrl}/products/${productHandle}.json`;
    console.log(`  Trying individual product JSON: ${productJsonUrl}`);
    const response = await fetch(productJsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      const variants = data.product?.variants || [];
      const found = extractFromVariants(variants, 'product JSON');
      
      if (found) {
        return { upc, sku, gtin, ean };
      }
      
      if (variants.length > 0) {
        console.log(`  Individual product JSON has ${variants.length} variants but no barcode/sku data`);
        return { upc: null, sku: null, gtin: null, ean: null, note: `Vendor does not populate barcode/SKU in Shopify` };
      }
    } else {
      console.log(`  Individual product JSON returned ${response.status}`);
    }
  } catch (e) {
    console.log(`  Error fetching Shopify product JSON: ${e}`);
  }
  
  // Try fuzzy title matching as fallback (for stores like 3DXTech with mismatched handles)
  if (productTitle && productMap.size > 0) {
    console.log(`  Trying fuzzy title match for: ${productTitle}`);
    const matchedProduct = findProductByTitle(productTitle, productMap);
    if (matchedProduct) {
      console.log(`  Found fuzzy match: "${matchedProduct.title}" (handle: ${matchedProduct.handle})`);
      const found = extractFromVariants(matchedProduct.variants, 'cache (fuzzy title match)');
      if (found) {
        return { upc, sku, gtin, ean };
      }
      if (matchedProduct.variants?.length > 0) {
        console.log(`  Fuzzy matched product has ${matchedProduct.variants.length} variants but no barcode/sku data`);
        return { upc: null, sku: null, gtin: null, ean: null, note: `Product matched by title but vendor does not populate barcode/SKU in Shopify` };
      }
    } else {
      console.log(`  No fuzzy title match found in ${productMap.size} cached products`);
    }
  }
  
  return { upc: null, sku: null, gtin: null, ean: null, note: 'Product not found in Shopify API' };
}

// Fetch all products from Shopify store
async function fetchShopifyProducts(shopifyUrl: string): Promise<Map<string, any>> {
  const productMap = new Map<string, any>();
  
  try {
    console.log(`Fetching products from ${shopifyUrl}/products.json...`);
    
    // Shopify paginates at 250 products, may need multiple pages
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 10) { // Max 2500 products
      const url = `${shopifyUrl}/products.json?limit=250&page=${page}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.log(`Failed to fetch page ${page}: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      if (products.length === 0) {
        hasMore = false;
      } else {
        for (const product of products) {
          if (product.handle) {
            productMap.set(product.handle.toLowerCase(), product);
          }
        }
        console.log(`Fetched ${products.length} products from page ${page}`);
        page++;
        
        // Small delay between pages
        if (hasMore) await new Promise(r => setTimeout(r, 200));
      }
    }
    
    console.log(`Total products cached: ${productMap.size}`);
  } catch (e) {
    console.error(`Error fetching Shopify products: ${e}`);
  }
  
  return productMap;
}

// Process a single filament
async function processFilament(
  filament: any, 
  brandConfig: BrandConfig | null,
  productMap: Map<string, any>,
  supabase: any
): Promise<{ id: string; title: string; status: 'updated' | 'no_data_found' | 'error' | 'unsupported'; upc?: string; sku?: string; gtin?: string; ean?: string; error?: string; method?: string }> {
  try {
    const productHandle = filament.product_handle || extractProductHandle(filament.product_url || '');
    
    console.log(`Processing: ${filament.product_title} (vendor: ${filament.vendor}, handle: ${productHandle})`);
    
    if (!brandConfig) {
      console.log(`No config for vendor: ${filament.vendor}`);
      return { 
        id: filament.id, 
        title: filament.product_title, 
        status: 'unsupported',
        error: `No scraping configuration for vendor: ${filament.vendor}`
      };
    }
    
    if (brandConfig.upcExtractionMethod === 'none') {
      console.log(`UPC extraction not supported for ${filament.vendor}`);
      return { 
        id: filament.id, 
        title: filament.product_title, 
        status: 'unsupported',
        error: brandConfig.notes || 'UPC extraction not supported for this vendor'
      };
    }
    
    let upc: string | null = null;
    let sku: string | null = null;
    let gtin: string | null = null;
    let ean: string | null = null;
    let method = '';
    let extractionNote = '';
    
    // Shopify extraction (gets UPC, SKU, GTIN, EAN)
    if (brandConfig.upcExtractionMethod === 'shopify' && brandConfig.shopifyUrl) {
      const result = await extractFromShopify(brandConfig.shopifyUrl, productHandle || '', productMap, filament.product_title);
      upc = result.upc;
      sku = result.sku;
      gtin = result.gtin;
      ean = result.ean;
      if (result.note) extractionNote = result.note;
      if (upc || sku || gtin || ean) method = 'shopify';
    }
    
    // WooCommerce extraction (placeholder - would need HTML scraping)
    if (!upc && brandConfig.upcExtractionMethod === 'woocommerce') {
      console.log(`WooCommerce extraction not yet implemented for ${filament.vendor}`);
    }
    
    // Custom extraction (for brands with special logic)
    if (!upc && brandConfig.upcExtractionMethod === 'custom' && brandConfig.customExtractor) {
      upc = await brandConfig.customExtractor(filament.product_url, filament.product_title);
      if (upc) method = 'custom';
    }
    
    // Validate and clean UPC format (8-14 digits)
    let cleanUpc: string | null = null;
    if (upc) {
      cleanUpc = upc.replace(/\D/g, '');
      if (cleanUpc.length < 8 || cleanUpc.length > 14) {
        console.log(`  Invalid UPC format: ${upc}`);
        cleanUpc = null;
      }
    }
    
    // Check if we have anything to update
    const hasNewUpc = cleanUpc && cleanUpc !== filament.upc;
    const hasNewSku = sku && sku !== filament.variant_sku;
    const hasNewGtin = gtin && gtin !== filament.gtin;
    const hasNewEan = ean && ean !== filament.ean;
    
    if (hasNewUpc || hasNewSku || hasNewGtin || hasNewEan) {
      const updateData: Record<string, string> = {};
      if (hasNewUpc) updateData.upc = cleanUpc!;
      if (hasNewSku) updateData.variant_sku = sku!;
      if (hasNewGtin) updateData.gtin = gtin!;
      if (hasNewEan) updateData.ean = ean!;
      
      console.log(`  Found via ${method}: ${hasNewUpc ? `UPC=${cleanUpc}` : ''} ${hasNewSku ? `SKU=${sku}` : ''} ${hasNewGtin ? `GTIN=${gtin}` : ''} ${hasNewEan ? `EAN=${ean}` : ''}`);
      
      const { error: updateError } = await supabase
        .from('filaments')
        .update(updateData)
        .eq('id', filament.id);
      
      if (updateError) {
        return { id: filament.id, title: filament.product_title, status: 'error', error: updateError.message };
      }
      
      console.log(`Updated ${filament.product_title}`);
      return { 
        id: filament.id, 
        title: filament.product_title, 
        status: 'updated', 
        upc: cleanUpc || undefined,
        sku: sku || undefined,
        gtin: gtin || undefined,
        ean: ean || undefined,
        method 
      };
    }
    
    return { 
      id: filament.id, 
      title: filament.product_title, 
      status: 'no_data_found',
      error: extractionNote || 'No UPC, SKU, GTIN or EAN data found'
    };
  } catch (e) {
    console.error(`Error processing filament: ${e}`);
    return { id: filament.id, title: filament.product_title, status: 'error', error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: isAdmin } = await authClient.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { brands = [], filamentIds = [], limit = 100, forceUpdate = false } = await req.json().catch(() => ({}));

    console.log(`Starting UPC scrape - brands: ${brands.join(', ')}, filamentIds: ${filamentIds.length}, limit=${limit}, forceUpdate=${forceUpdate}`);

    if ((!brands || brands.length === 0) && (!filamentIds || filamentIds.length === 0)) {
      return new Response(JSON.stringify({ error: 'No brands or filament IDs specified' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results = {
      total: 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      unsupported: 0,
      brandResults: {} as Record<string, { updated: number; skipped: number; failed: number; unsupported: number }>,
      details: [] as any[],
      supportedBrands: Object.keys(BRAND_CONFIGS).filter(b => BRAND_CONFIGS[b].upcExtractionMethod !== 'none'),
    };

    // Cache for Shopify product maps by brand
    const shopifyProductCaches = new Map<string, Map<string, any>>();

    // Process by filament IDs
    if (filamentIds && filamentIds.length > 0) {
      console.log(`\n=== Processing ${filamentIds.length} specific filaments ===`);
      
      let query = supabase
        .from('filaments')
      .select('id, product_title, product_url, product_handle, vendor, upc, variant_sku, gtin, ean')
      .in('id', filamentIds)
        .not('product_url', 'is', null);

      if (!forceUpdate) {
        query = query.is('upc', null);
      }

      const { data: filaments, error: fetchError } = await query;

      if (fetchError) {
        return new Response(JSON.stringify({ error: fetchError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`Found ${filaments?.length || 0} filaments to process`);
      results.total = filaments?.length || 0;

      // Group by vendor for efficient processing
      const byVendor = new Map<string, any[]>();
      for (const f of filaments || []) {
        const vendor = normalizeVendorName(f.vendor || 'Unknown');
        if (!byVendor.has(vendor)) byVendor.set(vendor, []);
        byVendor.get(vendor)!.push(f);
      }

      for (const [vendor, vendorFilaments] of byVendor) {
        results.brandResults[vendor] = { updated: 0, skipped: 0, failed: 0, unsupported: 0 };
        const brandConfig = getBrandConfig(vendor);
        
        // Pre-fetch Shopify products if needed
        let productMap = new Map<string, any>();
        if (brandConfig?.upcExtractionMethod === 'shopify' && brandConfig.shopifyUrl) {
          if (!shopifyProductCaches.has(vendor)) {
            productMap = await fetchShopifyProducts(brandConfig.shopifyUrl);
            shopifyProductCaches.set(vendor, productMap);
          } else {
            productMap = shopifyProductCaches.get(vendor)!;
          }
        }

        for (const filament of vendorFilaments) {
          const result = await processFilament(filament, brandConfig, productMap, supabase);
          
          if (result.status === 'updated') {
            results.updated++;
            results.brandResults[vendor].updated++;
          } else if (result.status === 'error') {
            results.failed++;
            results.brandResults[vendor].failed++;
          } else if (result.status === 'unsupported') {
            results.unsupported++;
            results.brandResults[vendor].unsupported++;
          } else {
            results.skipped++;
            results.brandResults[vendor].skipped++;
          }
          
          results.details.push({ ...result, brand: vendor });
          
          // Small delay between requests
          await new Promise(r => setTimeout(r, 100));
        }
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process by brands
    for (const brand of brands) {
      const normalizedBrand = normalizeVendorName(brand);
      console.log(`\n=== Processing brand: ${normalizedBrand} ===`);
      
      results.brandResults[normalizedBrand] = { updated: 0, skipped: 0, failed: 0, unsupported: 0 };
      const brandConfig = getBrandConfig(normalizedBrand);

      let query = supabase
        .from('filaments')
      .select('id, product_title, product_url, product_handle, vendor, upc, variant_sku, gtin, ean')
      .eq('vendor', brand)
        .not('product_url', 'is', null);

      if (!forceUpdate) {
        query = query.is('upc', null);
      }

      const { data: filaments, error: fetchError } = await query.limit(limit);

      if (fetchError) {
        console.error(`Error fetching ${brand} filaments:`, fetchError);
        continue;
      }

      console.log(`Found ${filaments?.length || 0} ${normalizedBrand} filaments to process`);
      results.total += filaments?.length || 0;

      // Pre-fetch Shopify products if needed
      let productMap = new Map<string, any>();
      if (brandConfig?.upcExtractionMethod === 'shopify' && brandConfig.shopifyUrl) {
        productMap = await fetchShopifyProducts(brandConfig.shopifyUrl);
      }

      for (const filament of filaments || []) {
        const result = await processFilament(filament, brandConfig, productMap, supabase);
        
        if (result.status === 'updated') {
          results.updated++;
          results.brandResults[normalizedBrand].updated++;
        } else if (result.status === 'error') {
          results.failed++;
          results.brandResults[normalizedBrand].failed++;
        } else if (result.status === 'unsupported') {
          results.unsupported++;
          results.brandResults[normalizedBrand].unsupported++;
        } else {
          results.skipped++;
          results.brandResults[normalizedBrand].skipped++;
        }
        
        results.details.push({ ...result, brand: normalizedBrand });
        
        await new Promise(r => setTimeout(r, 100));
      }

      // Delay between brands
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\nScrape complete: ${results.updated} updated, ${results.skipped} no UPC found, ${results.unsupported} unsupported, ${results.failed} failed`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in scrape-filament-upcs:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

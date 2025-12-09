import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum batch size to prevent timeouts
const MAX_BATCH_SIZE = 25;

// Brand configuration for UPC scraping
interface BrandConfig {
  shopifyUrl?: string;
  upcExtractionMethod: 'shopify' | 'woocommerce' | 'html' | 'none';
  notes?: string;
}

const BRAND_CONFIGS: Record<string, BrandConfig> = {
  // === SHOPIFY STORES ===
  '3D-Fuel': { shopifyUrl: 'https://www.3dfuel.com', upcExtractionMethod: 'shopify' },
  '3DXTech': { shopifyUrl: 'https://www.3dxtech.com', upcExtractionMethod: 'shopify' },
  'Polymaker': { shopifyUrl: 'https://us.polymaker.com', upcExtractionMethod: 'shopify' },
  'Overture': { shopifyUrl: 'https://overture3d.com', upcExtractionMethod: 'shopify' },
  'SUNLU': { shopifyUrl: 'https://www.sunlu.com', upcExtractionMethod: 'shopify' },
  'Amolen': { shopifyUrl: 'https://amolen.com', upcExtractionMethod: 'shopify' },
  'Eryone': { shopifyUrl: 'https://eryone3d.com', upcExtractionMethod: 'shopify' },
  'Atomic Filament': { shopifyUrl: 'https://atomicfilament.com', upcExtractionMethod: 'shopify' },
  'Proto-pasta': { shopifyUrl: 'https://www.proto-pasta.com', upcExtractionMethod: 'shopify' },
  'ColorFabb': { shopifyUrl: 'https://colorfabb.com', upcExtractionMethod: 'shopify' },
  'Fillamentum': { shopifyUrl: 'https://shop.fillamentum.com', upcExtractionMethod: 'shopify' },
  'NinjaTek': { shopifyUrl: 'https://ninjatek.com', upcExtractionMethod: 'shopify' },
  'Taulman3D': { shopifyUrl: 'https://taulman3d.com', upcExtractionMethod: 'shopify' },
  'Fiberlogy': { shopifyUrl: 'https://fiberlogy.com', upcExtractionMethod: 'shopify' },
  'FormFutura': { shopifyUrl: 'https://formfutura.com', upcExtractionMethod: 'shopify' },
  'Inland': { shopifyUrl: 'https://inlandfilament.com', upcExtractionMethod: 'shopify' },
  'ZIRO': { shopifyUrl: 'https://ziro3d.com', upcExtractionMethod: 'shopify' },
  'VoxelPLA': { shopifyUrl: 'https://voxelpla.com', upcExtractionMethod: 'shopify' },
  'GreenGate3D': { shopifyUrl: 'https://greengate3d.com', upcExtractionMethod: 'shopify' },
  'Paramount 3D': { shopifyUrl: 'https://paramount-3d.com', upcExtractionMethod: 'shopify' },
  'Gizmo Dorks': { shopifyUrl: 'https://gizmodorks.com', upcExtractionMethod: 'shopify' },
  'Printed Solid': { shopifyUrl: 'https://printedsolid.com', upcExtractionMethod: 'shopify' },
  'Matter3D': { shopifyUrl: 'https://matter3d.com', upcExtractionMethod: 'shopify' },
  'Siraya Tech': { shopifyUrl: 'https://siraya.tech', upcExtractionMethod: 'shopify' },
  
  // === WOOCOMMERCE STORES ===
  'eSUN': { shopifyUrl: 'https://www.esun3d.com', upcExtractionMethod: 'woocommerce' },
  
  // === HTML SCRAPING (Custom stores) ===
  'Prusament': { upcExtractionMethod: 'html', notes: 'Prusa custom store' },
  'MatterHackers': { shopifyUrl: 'https://www.matterhackers.com', upcExtractionMethod: 'html' },
  'Bambu Lab': { upcExtractionMethod: 'html', notes: 'Bambu Lab store' },
  'Creality': { upcExtractionMethod: 'html', notes: 'Creality store' },
  'Anycubic': { upcExtractionMethod: 'html', notes: 'Anycubic store' },
  'QIDI': { upcExtractionMethod: 'html', notes: 'QIDI store' },
  
  // === NO UPC SUPPORT ===
  'Hatchbox': { upcExtractionMethod: 'none', notes: 'Amazon-only, no direct store' },
  'ELEGOO': { upcExtractionMethod: 'none', notes: 'Amazon-only' },
};

// Vendor alias mapping
const VENDOR_ALIASES: Record<string, string> = {
  'esun': 'eSUN', 'ESUN': 'eSUN',
  'sunlu': 'SUNLU', 'Sunlu': 'SUNLU',
  'polymaker': 'Polymaker',
  '3dxtech': '3DXTech', '3DXTECH': '3DXTech',
  'hatchbox': 'Hatchbox', 'HATCHBOX': 'Hatchbox',
  'overture': 'Overture', 'OVERTURE': 'Overture',
  'inland': 'Inland', 'INLAND': 'Inland',
  'ziro': 'ZIRO', 'Ziro': 'ZIRO',
  'colorfabb': 'ColorFabb', 'Colorfabb': 'ColorFabb',
  'fillamentum': 'Fillamentum',
  'fiberlogy': 'Fiberlogy',
  'formfutura': 'FormFutura', 'Formfutura': 'FormFutura',
  'proto-pasta': 'Proto-pasta', 'Proto-Pasta': 'Proto-pasta', 'protopasta': 'Proto-pasta',
  'ninjatek': 'NinjaTek', 'Ninjatek': 'NinjaTek',
  'taulman3d': 'Taulman3D', 'Taulman3d': 'Taulman3D', 'TAULMAN3D': 'Taulman3D',
  '3d-fuel': '3D-Fuel', '3D Fuel': '3D-Fuel', '3dfuel': '3D-Fuel',
  'atomic': 'Atomic Filament', 'Atomic': 'Atomic Filament', 'atomicfilament': 'Atomic Filament',
  'gizmo dorks': 'Gizmo Dorks', 'GizmoDorks': 'Gizmo Dorks',
  'matter3d': 'Matter3D', 'Matter 3D': 'Matter3D',
  'printed solid': 'Printed Solid', 'printedsolid': 'Printed Solid',
  'paramount': 'Paramount 3D', 'paramount3d': 'Paramount 3D',
  'siraya': 'Siraya Tech', 'sirayatech': 'Siraya Tech',
  'greengate': 'GreenGate3D', 'greengate 3d': 'GreenGate3D',
  'voxel': 'VoxelPLA', 'voxelpla': 'VoxelPLA',
  'matterhackers': 'MatterHackers', 'matter hackers': 'MatterHackers',
  'prusament': 'Prusament', 'prusa': 'Prusament',
  'bambulab': 'Bambu Lab', 'bambu': 'Bambu Lab',
  'creality': 'Creality',
  'anycubic': 'Anycubic',
  'elegoo': 'ELEGOO', 'Elegoo': 'ELEGOO',
  'qidi': 'QIDI', 'Qidi': 'QIDI', 'qidi tech': 'QIDI',
  'amolen': 'Amolen', 'AMOLEN': 'Amolen',
  'eryone': 'Eryone', 'ERYONE': 'Eryone',
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
  const shopifyMatch = productUrl.match(/\/products\/([^?/]+)/);
  if (shopifyMatch) return shopifyMatch[1];
  
  const wooMatch = productUrl.match(/\/product\/([^?/]+)/);
  if (wooMatch) return wooMatch[1];
  
  const genericMatch = productUrl.match(/\/([^/?]+)(?:\?|$)/);
  if (genericMatch && genericMatch[1] !== 'products' && genericMatch[1] !== 'product') {
    return genericMatch[1];
  }
  
  return null;
}

// Extraction result interface
interface ExtractionResult {
  upc: string | null;
  sku: string | null;
  gtin: string | null;
  ean: string | null;
  mpn: string | null;
  method: string;
  note?: string;
}

// Classify barcode by length
function classifyBarcode(barcode: string): { upc: string | null; gtin: string | null; ean: string | null } {
  const cleanBarcode = barcode.replace(/\D/g, '');
  const length = cleanBarcode.length;
  
  if (length === 12 || length === 8) {
    return { upc: cleanBarcode, gtin: null, ean: null };
  }
  if (length === 13) {
    return { upc: null, gtin: null, ean: cleanBarcode };
  }
  if (length === 14) {
    return { upc: null, gtin: cleanBarcode, ean: null };
  }
  if (length >= 10 && length <= 12) {
    return { upc: cleanBarcode, gtin: null, ean: null };
  }
  return { upc: null, gtin: cleanBarcode, ean: null };
}

// Normalize title for fuzzy matching
function normalizeForMatching(str: string): string {
  return str.toLowerCase().replace(/[™®©]/g, '').replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Fuzzy match product by title
function findProductByTitle(productTitle: string, products: any[]): any | null {
  const normalizedTitle = normalizeForMatching(productTitle);
  const titleWords = normalizedTitle.split(' ').filter(w => w.length > 2);
  
  let bestMatch: any = null;
  let bestScore = 0;
  
  for (const product of products) {
    const shopifyTitle = normalizeForMatching(product.title || '');
    let matchingWords = 0;
    for (const word of titleWords) {
      if (shopifyTitle.includes(word)) matchingWords++;
    }
    const score = titleWords.length > 0 ? matchingWords / titleWords.length : 0;
    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestMatch = product;
    }
  }
  
  return bestMatch;
}

// Extract data from Shopify variant
function extractFromVariants(variants: any[], productData?: any): ExtractionResult {
  let upc: string | null = null;
  let sku: string | null = null;
  let gtin: string | null = null;
  let ean: string | null = null;
  let mpn: string | null = null;
  
  for (const variant of variants || []) {
    if (variant.barcode && variant.barcode.length >= 8) {
      const classified = classifyBarcode(variant.barcode);
      if (!upc && classified.upc) upc = classified.upc;
      if (!ean && classified.ean) ean = classified.ean;
      if (!gtin && classified.gtin) gtin = classified.gtin;
    }
    if (!sku && variant.sku && variant.sku.trim()) {
      sku = variant.sku.trim();
    }
    if ((upc || ean || gtin) && sku) break;
  }
  
  // Try to extract MPN from product metafields or vendor data
  if (productData?.vendor && sku) {
    // Some stores use vendor + SKU as MPN
    mpn = sku;
  }
  
  return { upc, sku, gtin, ean, mpn, method: 'shopify_variants' };
}

// Strategy 1: Shopify Individual Product JSON
async function tryShopifyProductJson(shopifyUrl: string, productHandle: string): Promise<ExtractionResult | null> {
  try {
    const url = `${shopifyUrl}/products/${productHandle}.json`;
    console.log(`  [Strategy 1] Individual product JSON: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.log(`    -> HTTP ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const product = data.product;
    const variants = product?.variants || [];
    if (variants.length === 0) return null;
    
    const result = extractFromVariants(variants, product);
    if (result.upc || result.sku || result.gtin || result.ean || result.mpn) {
      result.method = 'shopify_product_json';
      console.log(`    -> Found: UPC=${result.upc}, SKU=${result.sku}, GTIN=${result.gtin}, EAN=${result.ean}, MPN=${result.mpn}`);
      return result;
    }
    
    console.log(`    -> ${variants.length} variants but no barcode/SKU data`);
    return null;
  } catch (e) {
    console.log(`    -> Error: ${e}`);
    return null;
  }
}

// Strategy 2: Shopify Collection JSON (batch all products)
async function fetchShopifyProductsJson(shopifyUrl: string): Promise<any[]> {
  const allProducts: any[] = [];
  
  try {
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 5) {
      const url = `${shopifyUrl}/products.json?limit=250&page=${page}`;
      console.log(`  Fetching ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) break;
      
      const data = await response.json();
      const products = data.products || [];
      
      if (products.length === 0) {
        hasMore = false;
      } else {
        allProducts.push(...products);
        page++;
        if (products.length < 250) hasMore = false;
        if (hasMore) await new Promise(r => setTimeout(r, 200));
      }
    }
    
    console.log(`  Total products fetched: ${allProducts.length}`);
  } catch (e) {
    console.log(`  Error fetching products.json: ${e}`);
  }
  
  return allProducts;
}

// Enhanced matching using existing identifiers
function findProductBySku(products: any[], existingSku: string): any | null {
  if (!existingSku) return null;
  const normalizedSku = existingSku.toLowerCase().trim();
  
  for (const product of products) {
    for (const variant of product.variants || []) {
      if (variant.sku?.toLowerCase().trim() === normalizedSku) {
        console.log(`    -> SKU match found: ${variant.sku}`);
        return product;
      }
    }
  }
  return null;
}

function findProductByBarcode(products: any[], existingUpc: string | null, existingEan: string | null, existingGtin: string | null): any | null {
  const barcodes = [existingUpc, existingEan, existingGtin].filter(Boolean).map(b => b!.replace(/\D/g, ''));
  if (barcodes.length === 0) return null;
  
  for (const product of products) {
    for (const variant of product.variants || []) {
      const variantBarcode = variant.barcode?.replace(/\D/g, '');
      if (variantBarcode && barcodes.includes(variantBarcode)) {
        console.log(`    -> Barcode match found: ${variantBarcode}`);
        return product;
      }
    }
  }
  return null;
}

function findProductInCollection(
  products: any[], 
  productHandle: string, 
  productTitle: string,
  existingData?: { sku?: string; upc?: string; ean?: string; gtin?: string }
): ExtractionResult | null {
  // Priority 1: Try SKU match (most reliable)
  if (existingData?.sku) {
    const skuMatch = findProductBySku(products, existingData.sku);
    if (skuMatch) {
      const result = extractFromVariants(skuMatch.variants, skuMatch);
      if (result.upc || result.sku || result.gtin || result.ean || result.mpn) {
        result.method = 'shopify_collection_sku_match';
        return result;
      }
    }
  }
  
  // Priority 2: Try barcode match
  if (existingData?.upc || existingData?.ean || existingData?.gtin) {
    const barcodeMatch = findProductByBarcode(products, existingData.upc || null, existingData.ean || null, existingData.gtin || null);
    if (barcodeMatch) {
      const result = extractFromVariants(barcodeMatch.variants, barcodeMatch);
      if (result.upc || result.sku || result.gtin || result.ean || result.mpn) {
        result.method = 'shopify_collection_barcode_match';
        return result;
      }
    }
  }
  
  // Priority 3: Try exact handle match
  const exactMatch = products.find(p => p.handle?.toLowerCase() === productHandle.toLowerCase());
  if (exactMatch) {
    const result = extractFromVariants(exactMatch.variants, exactMatch);
    if (result.upc || result.sku || result.gtin || result.ean || result.mpn) {
      result.method = 'shopify_collection_exact';
      return result;
    }
  }
  
  // Priority 4: Try fuzzy title match
  const fuzzyMatch = findProductByTitle(productTitle, products);
  if (fuzzyMatch) {
    const result = extractFromVariants(fuzzyMatch.variants, fuzzyMatch);
    if (result.upc || result.sku || result.gtin || result.ean || result.mpn) {
      result.method = 'shopify_collection_fuzzy';
      return result;
    }
  }
  
  return null;
}

// Strategy 3: HTML Scraping for JSON-LD structured data
async function tryHtmlJsonLd(productUrl: string): Promise<ExtractionResult | null> {
  if (!productUrl || !productUrl.startsWith('http')) return null;
  
  try {
    console.log(`  [Strategy 3] HTML JSON-LD: ${productUrl}`);
    
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });
    
    if (!response.ok) {
      console.log(`    -> HTTP ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    let upc: string | null = null;
    let sku: string | null = null;
    let gtin: string | null = null;
    let ean: string | null = null;
    let mpn: string | null = null;
    
    // Extract JSON-LD structured data
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonContent);
          
          // Handle array or single object
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Product' || item['@type']?.includes('Product')) {
              if (item.gtin && !gtin) {
                const classified = classifyBarcode(item.gtin);
                gtin = classified.gtin;
                ean = classified.ean;
                upc = classified.upc;
              }
              if (item.gtin12 && !upc) upc = item.gtin12;
              if (item.gtin13 && !ean) ean = item.gtin13;
              if (item.gtin14 && !gtin) gtin = item.gtin14;
              if (item.sku && !sku) sku = item.sku;
              if (item.productID && !sku) sku = item.productID;
              if (item.mpn && !mpn) mpn = item.mpn;
              
              // Check offers
              const offers = Array.isArray(item.offers) ? item.offers : [item.offers].filter(Boolean);
              for (const offer of offers) {
                if (offer?.sku && !sku) sku = offer.sku;
                if (offer?.mpn && !mpn) mpn = offer.mpn;
              }
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
    
    // Fallback: Look for meta tags
    if (!sku) {
      const skuMeta = html.match(/<meta[^>]*property=["']product:retailer_item_id["'][^>]*content=["']([^"']+)["']/i);
      if (skuMeta) sku = skuMeta[1];
    }
    
    // Look for MPN in meta tags
    if (!mpn) {
      const mpnMeta = html.match(/<meta[^>]*(?:property|name)=["'](?:product:mpn|og:mpn|mpn)["'][^>]*content=["']([^"']+)["']/i);
      if (mpnMeta) mpn = mpnMeta[1];
    }
    
    if (!gtin && !upc && !ean) {
      const gtinMeta = html.match(/<meta[^>]*property=["']product:gtin["'][^>]*content=["']([^"']+)["']/i);
      if (gtinMeta) {
        const classified = classifyBarcode(gtinMeta[1]);
        gtin = classified.gtin;
        ean = classified.ean;
        upc = classified.upc;
      }
    }
    
    // Look for barcode and MPN in visible text (tables, specs)
    if (!upc && !gtin && !ean) {
      const barcodePatterns = [
        /UPC[:\s]*([0-9]{8,14})/i,
        /GTIN[:\s]*([0-9]{8,14})/i,
        /EAN[:\s]*([0-9]{8,14})/i,
        /Barcode[:\s]*([0-9]{8,14})/i,
      ];
      for (const pattern of barcodePatterns) {
        const match = html.match(pattern);
        if (match) {
          const classified = classifyBarcode(match[1]);
          if (!upc && classified.upc) upc = classified.upc;
          if (!ean && classified.ean) ean = classified.ean;
          if (!gtin && classified.gtin) gtin = classified.gtin;
          break;
        }
      }
    }
    
    // Look for MPN in visible text
    if (!mpn) {
      const mpnPatterns = [
        /MPN[:\s]*([A-Za-z0-9\-_]+)/i,
        /Manufacturer Part Number[:\s]*([A-Za-z0-9\-_]+)/i,
        /Part Number[:\s]*([A-Za-z0-9\-_]+)/i,
      ];
      for (const pattern of mpnPatterns) {
        const match = html.match(pattern);
        if (match && match[1].length >= 3 && match[1].length <= 50) {
          mpn = match[1].trim();
          break;
        }
      }
    }
    
    if (upc || sku || gtin || ean || mpn) {
      console.log(`    -> Found: UPC=${upc}, SKU=${sku}, GTIN=${gtin}, EAN=${ean}, MPN=${mpn}`);
      return { upc, sku, gtin, ean, mpn, method: 'html_jsonld' };
    }
    
    console.log(`    -> No data found in HTML`);
    return null;
  } catch (e) {
    console.log(`    -> Error: ${e}`);
    return null;
  }
}

// Strategy 4: WooCommerce HTML scraping
async function tryWooCommerce(productUrl: string): Promise<ExtractionResult | null> {
  if (!productUrl || !productUrl.startsWith('http')) return null;
  
  try {
    console.log(`  [Strategy 4] WooCommerce HTML: ${productUrl}`);
    
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });
    
    if (!response.ok) {
      console.log(`    -> HTTP ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    let upc: string | null = null;
    let sku: string | null = null;
    let gtin: string | null = null;
    let ean: string | null = null;
    let mpn: string | null = null;
    
    // WooCommerce SKU
    const skuMatch = html.match(/class=["']sku["'][^>]*>([^<]+)</i);
    if (skuMatch) sku = skuMatch[1].trim();
    
    // JSON-LD (same as HTML strategy)
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonContent);
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Product') {
              if (item.gtin) {
                const classified = classifyBarcode(item.gtin);
                gtin = classified.gtin;
                ean = classified.ean;
                upc = classified.upc;
              }
              if (item.sku && !sku) sku = item.sku;
              if (item.mpn && !mpn) mpn = item.mpn;
            }
          }
        } catch (e) {}
      }
    }
    
    // Additional WooCommerce-specific patterns
    const additionalInfoMatch = html.match(/itemprop=["']gtin[0-9]*["'][^>]*content=["']([^"']+)["']/i);
    if (additionalInfoMatch && !gtin && !upc && !ean) {
      const classified = classifyBarcode(additionalInfoMatch[1]);
      gtin = classified.gtin;
      ean = classified.ean;
      upc = classified.upc;
    }
    
    // Look for MPN in WooCommerce product details
    if (!mpn) {
      const mpnMatch = html.match(/itemprop=["']mpn["'][^>]*content=["']([^"']+)["']/i);
      if (mpnMatch) mpn = mpnMatch[1];
    }
    
    if (!mpn) {
      const mpnPatterns = [
        /MPN[:\s]*([A-Za-z0-9\-_]+)/i,
        /Manufacturer Part Number[:\s]*([A-Za-z0-9\-_]+)/i,
      ];
      for (const pattern of mpnPatterns) {
        const match = html.match(pattern);
        if (match && match[1].length >= 3 && match[1].length <= 50) {
          mpn = match[1].trim();
          break;
        }
      }
    }
    
    if (upc || sku || gtin || ean || mpn) {
      console.log(`    -> Found: UPC=${upc}, SKU=${sku}, GTIN=${gtin}, EAN=${ean}, MPN=${mpn}`);
      return { upc, sku, gtin, ean, mpn, method: 'woocommerce' };
    }
    
    console.log(`    -> No data found`);
    return null;
  } catch (e) {
    console.log(`    -> Error: ${e}`);
    return null;
  }
}

// Process a single filament with multi-strategy fallback
async function processFilament(
  filament: any,
  brandConfig: BrandConfig | null,
  shopifyProducts: any[],
  supabase: any
): Promise<{ 
  id: string; 
  title: string; 
  status: 'updated' | 'no_data_found' | 'error' | 'unsupported'; 
  upc?: string; 
  sku?: string; 
  gtin?: string; 
  ean?: string; 
  mpn?: string;
  error?: string; 
  method?: string 
}> {
  try {
    const productHandle = filament.product_handle || extractProductHandle(filament.product_url || '');
    
    console.log(`Processing: ${filament.product_title} (vendor: ${filament.vendor}, handle: ${productHandle})`);
    
    if (!brandConfig) {
      console.log(`  No config for vendor: ${filament.vendor}`);
      return { 
        id: filament.id, 
        title: filament.product_title, 
        status: 'unsupported',
        error: `No scraping configuration for vendor: ${filament.vendor}`
      };
    }
    
    if (brandConfig.upcExtractionMethod === 'none') {
      console.log(`  UPC extraction not supported for ${filament.vendor}`);
      return { 
        id: filament.id, 
        title: filament.product_title, 
        status: 'unsupported',
        error: brandConfig.notes || 'UPC extraction not supported'
      };
    }
    
    let result: ExtractionResult | null = null;
    
    // Prepare existing data for enhanced matching
    const existingData = {
      sku: filament.variant_sku || undefined,
      upc: filament.upc || undefined,
      ean: filament.ean || undefined,
      gtin: filament.gtin || undefined,
    };
    
    console.log(`  Existing identifiers: SKU=${existingData.sku || 'none'}, UPC=${existingData.upc || 'none'}, EAN=${existingData.ean || 'none'}, GTIN=${existingData.gtin || 'none'}`);
    
    // Strategy chain based on brand config
    if (brandConfig.upcExtractionMethod === 'shopify' && brandConfig.shopifyUrl && productHandle) {
      // Try individual product JSON first (faster)
      result = await tryShopifyProductJson(brandConfig.shopifyUrl, productHandle);
      
      // Fallback to collection search with enhanced matching using existing identifiers
      if (!result && shopifyProducts.length > 0) {
        console.log(`  [Strategy 2] Searching collection (${shopifyProducts.length} products) with existing identifiers`);
        result = findProductInCollection(shopifyProducts, productHandle, filament.product_title, existingData);
      }
      
      // Fallback to HTML scraping
      if (!result && filament.product_url) {
        result = await tryHtmlJsonLd(filament.product_url);
      }
    } else if (brandConfig.upcExtractionMethod === 'woocommerce') {
      // Try WooCommerce extraction
      result = await tryWooCommerce(filament.product_url);
      
      // Fallback to generic HTML
      if (!result && filament.product_url) {
        result = await tryHtmlJsonLd(filament.product_url);
      }
    } else if (brandConfig.upcExtractionMethod === 'html') {
      // HTML-only brands
      result = await tryHtmlJsonLd(filament.product_url);
    }
    
    if (!result) {
      return { 
        id: filament.id, 
        title: filament.product_title, 
        status: 'no_data_found',
        error: 'No UPC/SKU/GTIN/EAN found with any extraction method'
      };
    }
    
    // Validate and clean UPC
    let cleanUpc: string | null = null;
    if (result.upc) {
      cleanUpc = result.upc.replace(/\D/g, '');
      if (cleanUpc.length < 8 || cleanUpc.length > 14) {
        console.log(`  Invalid UPC format: ${result.upc}`);
        cleanUpc = null;
      }
    }
    
    // Fallback: Use SKU as MPN if MPN is missing (common pattern for many brands)
    const effectiveSku = result.sku || filament.variant_sku;
    if (!result.mpn && effectiveSku) {
      result.mpn = effectiveSku;
      console.log(`  -> Using SKU as MPN fallback: ${effectiveSku}`);
    }
    
    // Check if we have new data to update
    const hasNewUpc = cleanUpc && cleanUpc !== filament.upc;
    const hasNewSku = result.sku && result.sku !== filament.variant_sku;
    const hasNewGtin = result.gtin && result.gtin !== filament.gtin;
    const hasNewEan = result.ean && result.ean !== filament.ean;
    const hasNewMpn = result.mpn && result.mpn !== filament.mpn;
    
    // Log what was found vs what already exists
    console.log(`  Extraction result via ${result.method}:`);
    console.log(`    UPC: ${result.upc || 'none'} (existing: ${filament.upc || 'none'}) ${hasNewUpc ? '[NEW]' : ''}`);
    console.log(`    SKU: ${result.sku || 'none'} (existing: ${filament.variant_sku || 'none'}) ${hasNewSku ? '[NEW]' : ''}`);
    console.log(`    GTIN: ${result.gtin || 'none'} (existing: ${filament.gtin || 'none'}) ${hasNewGtin ? '[NEW]' : ''}`);
    console.log(`    EAN: ${result.ean || 'none'} (existing: ${filament.ean || 'none'}) ${hasNewEan ? '[NEW]' : ''}`);
    console.log(`    MPN: ${result.mpn || 'none'} (existing: ${filament.mpn || 'none'}) ${hasNewMpn ? '[NEW]' : ''}`);
    
    if (hasNewUpc || hasNewSku || hasNewGtin || hasNewEan || hasNewMpn) {
      const updateData: Record<string, string> = {};
      if (hasNewUpc) updateData.upc = cleanUpc!;
      if (hasNewSku) updateData.variant_sku = result.sku!;
      if (hasNewGtin) updateData.gtin = result.gtin!;
      if (hasNewEan) updateData.ean = result.ean!;
      if (hasNewMpn) updateData.mpn = result.mpn!;
      
      console.log(`  Updating: ${JSON.stringify(updateData)}`);
      
      const { error: updateError } = await supabase
        .from('filaments')
        .update(updateData)
        .eq('id', filament.id);
      
      if (updateError) {
        return { id: filament.id, title: filament.product_title, status: 'error', error: updateError.message };
      }
      
      return { 
        id: filament.id, 
        title: filament.product_title, 
        status: 'updated', 
        upc: cleanUpc || undefined,
        sku: result.sku || undefined,
        gtin: result.gtin || undefined,
        ean: result.ean || undefined,
        mpn: result.mpn || undefined,
        method: result.method 
      };
    }
    
    // Data exists but no new values to update
    const hasAnyData = result.upc || result.sku || result.gtin || result.ean || result.mpn;
    return { 
      id: filament.id, 
      title: filament.product_title, 
      status: 'no_data_found',
      error: hasAnyData ? 'Data already exists (no updates needed)' : 'No UPC/GTIN/EAN/MPN data available from store'
    };
  } catch (e) {
    console.error(`Error processing filament: ${e}`);
    return { 
      id: filament.id, 
      title: filament.product_title, 
      status: 'error', 
      error: e instanceof Error ? e.message : 'Unknown error' 
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body with better error handling
    let requestBody: any = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { brands = [], filamentIds = [], limit = MAX_BATCH_SIZE, forceUpdate = false, scrapeMpnOnly = false } = requestBody;
    
    // Enforce batch size limit
    const effectiveLimit = Math.min(limit, MAX_BATCH_SIZE);
    
    console.log(`Starting UPC scrape - brands: ${brands.length}, filamentIds: ${filamentIds.length}, limit=${effectiveLimit}, forceUpdate=${forceUpdate}, scrapeMpnOnly=${scrapeMpnOnly}`);

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
      batchSize: effectiveLimit,
      brandResults: {} as Record<string, { updated: number; skipped: number; failed: number; unsupported: number }>,
      details: [] as any[],
      supportedBrands: Object.keys(BRAND_CONFIGS).filter(b => BRAND_CONFIGS[b].upcExtractionMethod !== 'none'),
    };

    // Cache for Shopify products by vendor
    const shopifyProductCaches = new Map<string, any[]>();

    // Process by filament IDs
    if (filamentIds && filamentIds.length > 0) {
      // Limit the batch
      const batchIds = filamentIds.slice(0, effectiveLimit);
      console.log(`\n=== Processing ${batchIds.length} filaments (limited from ${filamentIds.length}) ===`);
      
      let query = supabase
        .from('filaments')
        .select('id, product_title, product_url, product_handle, vendor, upc, variant_sku, gtin, ean, mpn')
        .in('id', batchIds)
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

      // Group by vendor
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
        let shopifyProducts: any[] = [];
        if (brandConfig?.upcExtractionMethod === 'shopify' && brandConfig.shopifyUrl) {
          if (!shopifyProductCaches.has(vendor)) {
            shopifyProducts = await fetchShopifyProductsJson(brandConfig.shopifyUrl);
            shopifyProductCaches.set(vendor, shopifyProducts);
          } else {
            shopifyProducts = shopifyProductCaches.get(vendor)!;
          }
        }

        for (const filament of vendorFilaments) {
          const result = await processFilament(filament, brandConfig, shopifyProducts, supabase);
          
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
          await new Promise(r => setTimeout(r, 50));
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
        .select('id, product_title, product_url, product_handle, vendor, upc, variant_sku, gtin, ean, mpn')
        .eq('vendor', brand)
        .not('product_url', 'is', null);

      if (!forceUpdate) {
        if (scrapeMpnOnly) {
          // For MPN-only scraping, filter for filaments missing MPN
          query = query.is('mpn', null);
        } else {
          query = query.is('upc', null);
        }
      }

      const { data: filaments, error: fetchError } = await query.limit(effectiveLimit);

      if (fetchError) {
        console.error(`Error fetching ${brand} filaments:`, fetchError);
        continue;
      }

      console.log(`Found ${filaments?.length || 0} ${normalizedBrand} filaments to process`);
      results.total += filaments?.length || 0;

      // Pre-fetch Shopify products if needed
      let shopifyProducts: any[] = [];
      if (brandConfig?.upcExtractionMethod === 'shopify' && brandConfig.shopifyUrl) {
        shopifyProducts = await fetchShopifyProductsJson(brandConfig.shopifyUrl);
      }

      for (const filament of filaments || []) {
        const result = await processFilament(filament, brandConfig, shopifyProducts, supabase);
        
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
        
        await new Promise(r => setTimeout(r, 50));
      }

      // Delay between brands
      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\nScrape complete: ${results.updated} updated, ${results.skipped} no data, ${results.unsupported} unsupported, ${results.failed} failed`);

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

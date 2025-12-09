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
  upcExtractionMethod: 'shopify' | 'woocommerce' | 'html' | 'none' | 'wix' | 'fiberlogy' | 'ninjatek' | 'matterhackers' | 'microcenter';
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
  'NinjaTek': { upcExtractionMethod: 'ninjatek', notes: 'WooCommerce with data-sku in option elements' },
  'Taulman3D': { shopifyUrl: 'https://taulman3d.com', upcExtractionMethod: 'shopify' },
  'Fiberlogy': { upcExtractionMethod: 'fiberlogy', notes: 'ShopArena platform - extract slug from URL as MPN' },
  'FormFutura': { shopifyUrl: 'https://formfutura.com', upcExtractionMethod: 'shopify' },
  'Inland': { upcExtractionMethod: 'microcenter', notes: 'Sold via Micro Center - extract SKU from product ID' },
  'ZIRO': { shopifyUrl: 'https://ziro3d.com', upcExtractionMethod: 'shopify' },
  'VoxelPLA': { shopifyUrl: 'https://voxelpla.com', upcExtractionMethod: 'shopify' },
  'GreenGate3D': { shopifyUrl: 'https://greengate3d.com', upcExtractionMethod: 'shopify' },
  'Paramount 3D': { upcExtractionMethod: 'wix', notes: 'Wix store - extract SKU from product title brackets' },
  'Gizmo Dorks': { shopifyUrl: 'https://gizmodorks.com', upcExtractionMethod: 'shopify' },
  'Printed Solid': { shopifyUrl: 'https://printedsolid.com', upcExtractionMethod: 'shopify' },
  'Matter3D': { shopifyUrl: 'https://matter3d.com', upcExtractionMethod: 'shopify' },
  'Siraya Tech': { shopifyUrl: 'https://siraya.tech', upcExtractionMethod: 'shopify' },
  
  // === WOOCOMMERCE STORES ===
  'eSUN': { shopifyUrl: 'https://www.esun3d.com', upcExtractionMethod: 'woocommerce' },
  
  // === HTML SCRAPING (Custom stores) ===
  'Prusament': { upcExtractionMethod: 'html', notes: 'Prusa custom store' },
  'MatterHackers': { upcExtractionMethod: 'matterhackers', notes: 'Custom store with SKU in URL path /sk/XXXXX' },
  'Bambu Lab': { upcExtractionMethod: 'html', notes: 'Bambu Lab store' },
  'Creality': { upcExtractionMethod: 'html', notes: 'Creality store' },
  'Anycubic': { upcExtractionMethod: 'html', notes: 'Anycubic store' },
  'QIDI': { upcExtractionMethod: 'html', notes: 'QIDI store' },
  
  // === SHOPIFY STORES (continued) ===
  'Hatchbox': { shopifyUrl: 'https://www.hatchbox3d.com', upcExtractionMethod: 'shopify', notes: 'Official store at hatchbox3d.com' },
  
  // === NO UPC SUPPORT ===
  'ELEGOO': { upcExtractionMethod: 'none', notes: 'Amazon-only' },
};

// Vendor alias mapping
const VENDOR_ALIASES: Record<string, string> = {
  'esun': 'eSUN', 'ESUN': 'eSUN',
  'sunlu': 'SUNLU', 'Sunlu': 'SUNLU',
  'polymaker': 'Polymaker',
  '3dxtech': '3DXTech', '3DXTECH': '3DXTech',
  'hatchbox': 'Hatchbox', 'HATCHBOX': 'Hatchbox',
  'overture': 'Overture', 'OVERTURE': 'Overture', 'Overture 3D': 'Overture', 'overture 3d': 'Overture',
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

// Strategy 5: Wix extraction - Paramount 3D style
// SKU is embedded in product title as [CODE] and sometimes in URL
async function tryWixExtraction(filament: any): Promise<ExtractionResult | null> {
  try {
    console.log(`  [Strategy 5] Wix extraction for: ${filament.product_title}`);
    
    let sku: string | null = null;
    let mpn: string | null = null;
    
    // For Amazon URLs, generate MPN from product title since we can't scrape Paramount SKU codes
    if (filament.product_url && filament.product_url.includes('amazon.com')) {
      console.log(`    -> Amazon URL detected, generating MPN from product title`);
      
      // Generate MPN from product title: "PLA - Black" -> "P3D-PLA-BLACK"
      // or "PETG - Red" -> "P3D-PETG-RED"
      if (filament.product_title) {
        // Extract material and color from title patterns like "PLA - Black" or "PETG - White"
        const titleMatch = filament.product_title.match(/^([A-Z]+)\s*[-–]\s*(.+?)(?:\s+\d|$)/i);
        if (titleMatch) {
          const material = titleMatch[1].toUpperCase().trim();
          const color = titleMatch[2].toUpperCase().trim().replace(/\s+/g, '-');
          mpn = `P3D-${material}-${color}`;
          console.log(`    -> Generated MPN from title: ${mpn}`);
          return { sku: null, upc: null, gtin: null, ean: null, mpn, method: 'wix_amazon_title' };
        }
        
        // Fallback: use entire title, cleaned
        const cleanTitle = filament.product_title
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 40);
        if (cleanTitle.length >= 3) {
          mpn = `P3D-${cleanTitle}`;
          console.log(`    -> Generated MPN from cleaned title: ${mpn}`);
          return { sku: null, upc: null, gtin: null, ean: null, mpn, method: 'wix_amazon_title' };
        }
      }
      
      console.log(`    -> Could not generate MPN from title`);
      return null;
    }
    
    // Extract SKU from product title - pattern: [SKUCODE] or (SKUCODE)
    // Example: "ASA (Military Green) 1.75mm 1kg Filament [OGRL60037764SA] ASA"
    const titleSkuMatch = filament.product_title?.match(/\[([A-Z0-9\-]+)\]/i);
    if (titleSkuMatch) {
      sku = titleSkuMatch[1].trim();
      console.log(`    -> Found SKU in title brackets: ${sku}`);
    }
    
    // Try to extract SKU code from URL patterns
    if (!sku && filament.product_url) {
      // Pattern 1: URL ends with SKU code after "filament-"
      // Example: /pla-military-green-1-75mm-1kg-filament-ogrl60037764c
      const filamentCodeMatch = filament.product_url.match(/filament-([a-z0-9]+)$/i);
      if (filamentCodeMatch && filamentCodeMatch[1].length >= 6) {
        sku = filamentCodeMatch[1].toUpperCase();
        console.log(`    -> Found SKU code in URL (after filament-): ${sku}`);
      }
      
      // Pattern 2: URL ends with alphanumeric code that looks like a SKU
      // Example: /tpu-military-green-1-75mm-1kg-filament-ogrl6003-7764u
      if (!sku) {
        const codeEndMatch = filament.product_url.match(/-([a-z]{2,4}[lr][0-9]+[a-z0-9]*)$/i);
        if (codeEndMatch && codeEndMatch[1].length >= 6) {
          sku = codeEndMatch[1].toUpperCase().replace(/-/g, '');
          console.log(`    -> Found SKU code in URL (code pattern): ${sku}`);
        }
      }
      
      // Pattern 3: For simple product slugs without codes, generate an MPN from the slug
      // Examples: /absblack, /flexpla, /petg-white, /pla-silver-dollar-1-75mm-1kg-filament
      if (!sku) {
        const slugMatch = filament.product_url.match(/\/product-page\/([a-z0-9\-]+)$/i);
        if (slugMatch) {
          const slug = slugMatch[1];
          // Generate MPN from slug: prefix with P3D- and clean up
          // Remove common suffixes like -1-75mm, -1kg, -filament
          let cleanSlug = slug
            .replace(/-?1-75mm/gi, '')
            .replace(/-?3-00mm/gi, '')
            .replace(/-?1kg/gi, '')
            .replace(/-?0-5kg/gi, '')
            .replace(/-?filament$/gi, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          
          if (cleanSlug.length >= 3) {
            mpn = `P3D-${cleanSlug.toUpperCase()}`;
            console.log(`    -> Generated MPN from slug: ${mpn}`);
          }
        }
      }
    }
    
    // If we found a SKU, also use it as MPN
    if (sku) {
      mpn = sku;
    }
    
    // Try to fetch the page to look for additional data (UPC, GTIN, etc.)
    if (filament.product_url && filament.product_url.startsWith('http') && !filament.product_url.includes('amazon.com')) {
      try {
        console.log(`    -> Fetching page: ${filament.product_url}`);
        const response = await fetch(filament.product_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html',
          },
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // Look for SKU in Wix product title on page
          const pageTitleMatch = html.match(/data-hook=["']product-title["'][^>]*>([^<]+)</i);
          if (pageTitleMatch) {
            const pageTitle = pageTitleMatch[1];
            const pageSkuMatch = pageTitle.match(/\[([A-Z0-9\-]+)\]/i);
            if (pageSkuMatch && !sku) {
              sku = pageSkuMatch[1].trim();
              mpn = sku;
              console.log(`    -> Found SKU in page title: ${sku}`);
            }
          }
          
          // Look for SKU in product info/JSON data
          const productInfoMatch = html.match(/"sku"\s*:\s*"([A-Z0-9\-]+)"/i);
          if (productInfoMatch && !sku) {
            sku = productInfoMatch[1].trim();
            mpn = sku;
            console.log(`    -> Found SKU in JSON data: ${sku}`);
          }
          
          // Look for barcode patterns in the HTML
          let upc: string | null = null;
          let gtin: string | null = null;
          let ean: string | null = null;
          
          const barcodePatterns = [
            /UPC[:\s]*([0-9]{8,14})/i,
            /GTIN[:\s]*([0-9]{8,14})/i,
            /EAN[:\s]*([0-9]{8,14})/i,
            /Barcode[:\s]*([0-9]{8,14})/i,
            /"barcode"\s*:\s*"([0-9]{8,14})"/i,
            /"gtin"\s*:\s*"([0-9]{8,14})"/i,
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
          
          if (sku || upc || gtin || ean || mpn) {
            console.log(`    -> Found: SKU=${sku}, UPC=${upc}, GTIN=${gtin}, EAN=${ean}, MPN=${mpn}`);
            return { sku, upc, gtin, ean, mpn, method: 'wix_extraction' };
          }
        } else {
          console.log(`    -> HTTP ${response.status}`);
        }
      } catch (e) {
        console.log(`    -> Error fetching page: ${e}`);
      }
    }
    
    // Return what we found from title/URL even if page fetch failed
    if (sku || mpn) {
      console.log(`    -> Found from title/URL: SKU=${sku}, MPN=${mpn}`);
      return { sku, upc: null, gtin: null, ean: null, mpn, method: 'wix_title_extraction' };
    }
    
    console.log(`    -> No data found`);
    return null;
  } catch (e) {
    console.log(`    -> Error: ${e}`);
    return null;
  }
}

// Strategy 6: Fiberlogy extraction - ShopArena platform
// Fiberlogy doesn't expose SKU/EAN on their website, but we can derive MPN from URL slug
async function tryFiberlogyExtraction(filament: any): Promise<ExtractionResult | null> {
  try {
    console.log(`  [Strategy 6] Fiberlogy extraction for: ${filament.product_title}`);
    
    let mpn: string | null = null;
    let sku: string | null = null;
    
    // Extract product slug from URL
    // Pattern: https://fiberlogy.com/en/products/easy-petg-black
    // We'll use the slug "easy-petg-black" as MPN, formatted as "EASY-PETG-BLACK"
    if (filament.product_url) {
      const urlMatch = filament.product_url.match(/\/products\/([a-z0-9\-]+)$/i);
      if (urlMatch) {
        const slug = urlMatch[1];
        // Convert slug to uppercase MPN style: "easy-petg-black" -> "EASY-PETG-BLACK"
        mpn = slug.toUpperCase();
        sku = mpn;
        console.log(`    -> Extracted slug from URL: ${slug}`);
        console.log(`    -> Generated MPN/SKU: ${mpn}`);
      }
    }
    
    // Also try store URL pattern: https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg
    if (!mpn && filament.product_url) {
      const storeUrlMatch = filament.product_url.match(/fiberlogy\.com\/en\/([A-Za-z0-9\-_]+)$/i);
      if (storeUrlMatch) {
        const slug = storeUrlMatch[1];
        // Convert to standardized format
        mpn = slug.replace(/_/g, '-').toUpperCase();
        sku = mpn;
        console.log(`    -> Extracted store slug from URL: ${slug}`);
        console.log(`    -> Generated MPN/SKU: ${mpn}`);
      }
    }
    
    if (mpn) {
      console.log(`    -> Found: SKU=${sku}, MPN=${mpn}`);
      return { sku, upc: null, gtin: null, ean: null, mpn, method: 'fiberlogy_slug' };
    }
    
    console.log(`    -> No data found`);
    return null;
  } catch (e) {
    console.log(`    -> Error: ${e}`);
    return null;
  }
}

// Strategy 7: NinjaTek extraction - WooCommerce with data-sku in option elements
async function tryNinjaTekExtraction(filament: any): Promise<ExtractionResult | null> {
  try {
    console.log(`  [Strategy 7] NinjaTek extraction for: ${filament.product_title}`);
    
    if (!filament.product_url || !filament.product_url.startsWith('http')) {
      console.log(`    -> No valid product URL`);
      return null;
    }
    
    const response = await fetch(filament.product_url, {
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
    let sku: string | null = null;
    let mpn: string | null = null;
    
    // NinjaTek uses WooCommerce with SKUs in option data-sku attributes
    // Pattern: <option value="440" data-sku="3DNF0317505" ...>
    // Try to match by product title or find first matching SKU
    const productTitle = filament.product_title?.toLowerCase() || '';
    
    // Extract all data-sku values from options
    const optionMatches = html.matchAll(/data-sku=["']([A-Z0-9]+)["'][^>]*data-name=["']([^"']+)["']/gi);
    for (const match of optionMatches) {
      const optionSku = match[1];
      const optionName = match[2].toLowerCase();
      
      // Check if this option matches our product title
      // NinjaTek product naming: "NinjaFlex TPU - Black 1.75mm 1kg"
      // Option naming: "3D Printing Filament TPU NinjaTek NinjaFlex - Midnight Black - 1.75mm - 1kg"
      if (productTitle && optionName) {
        // Extract color and diameter from both
        const colorMatch = productTitle.match(/(?:midnight\s*)?(\w+)\s*(?:1\.75|3)mm/i);
        const optionColorMatch = optionName.match(/(?:midnight\s*)?(\w+)\s*-\s*(?:1\.75|3)mm/i);
        
        if (colorMatch && optionColorMatch && 
            colorMatch[1].toLowerCase() === optionColorMatch[1].toLowerCase()) {
          sku = optionSku;
          mpn = optionSku;
          console.log(`    -> Matched option by color: ${sku}`);
          break;
        }
      }
    }
    
    // If no match, try to find SKU from JSON-LD or simpler pattern
    if (!sku) {
      // Try first data-sku found
      const simpleSkuMatch = html.match(/data-sku=["']([A-Z0-9]+)["']/i);
      if (simpleSkuMatch) {
        sku = simpleSkuMatch[1];
        mpn = sku;
        console.log(`    -> Using first data-sku found: ${sku}`);
      }
    }
    
    // Also check JSON-LD for additional data
    let upc: string | null = null;
    let gtin: string | null = null;
    let ean: string | null = null;
    
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
    
    if (sku || mpn || upc || gtin || ean) {
      console.log(`    -> Found: SKU=${sku}, MPN=${mpn}, UPC=${upc}, GTIN=${gtin}, EAN=${ean}`);
      return { sku, upc, gtin, ean, mpn, method: 'ninjatek_woocommerce' };
    }
    
    console.log(`    -> No data found`);
    return null;
  } catch (e) {
    console.log(`    -> Error: ${e}`);
    return null;
  }
}

// Strategy 8: MatterHackers extraction - SKU in URL path
async function tryMatterHackersExtraction(filament: any): Promise<ExtractionResult | null> {
  try {
    console.log(`  [Strategy 8] MatterHackers extraction for: ${filament.product_title}`);
    
    let sku: string | null = null;
    let mpn: string | null = null;
    
    // MatterHackers URLs contain SKU in /sk/XXXXX format
    // Example: https://www.matterhackers.com/store/l/pla-filament-black-175mm/sk/MEEDKTKU
    if (filament.product_url) {
      const skuMatch = filament.product_url.match(/\/sk\/([A-Z0-9\-]+)/i);
      if (skuMatch) {
        sku = skuMatch[1].toUpperCase();
        mpn = sku;
        console.log(`    -> Found SKU in URL: ${sku}`);
      }
    }
    
    // If we have a URL, also try to fetch the page for additional data
    let upc: string | null = null;
    let gtin: string | null = null;
    let ean: string | null = null;
    
    if (filament.product_url && filament.product_url.startsWith('http')) {
      try {
        const response = await fetch(filament.product_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html',
          },
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // Look for JSON-LD or barcode patterns
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
          
          // Look for barcode patterns in page
          const barcodePatterns = [
            /UPC[:\s]*([0-9]{8,14})/i,
            /GTIN[:\s]*([0-9]{8,14})/i,
            /EAN[:\s]*([0-9]{8,14})/i,
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
      } catch (e) {
        console.log(`    -> Error fetching page: ${e}`);
      }
    }
    
    if (sku || mpn || upc || gtin || ean) {
      console.log(`    -> Found: SKU=${sku}, MPN=${mpn}, UPC=${upc}, GTIN=${gtin}, EAN=${ean}`);
      return { sku, upc, gtin, ean, mpn, method: 'matterhackers_url' };
    }
    
    console.log(`    -> No data found`);
    return null;
  } catch (e) {
    console.log(`    -> Error: ${e}`);
    return null;
  }
}

// Strategy 9: Micro Center extraction - Inland filaments
async function tryMicroCenterExtraction(filament: any): Promise<ExtractionResult | null> {
  try {
    console.log(`  [Strategy 9] Micro Center extraction for: ${filament.product_title}`);
    
    let sku: string | null = null;
    let mpn: string | null = null;
    
    // Micro Center URLs contain product ID in /product/XXXXX/ format
    // Example: https://www.microcenter.com/product/485644/inland-175mm-black-pla-3d-printer-filament-1kg-spool-(22-lbs)
    if (filament.product_url) {
      const productIdMatch = filament.product_url.match(/\/product\/(\d+)\//i);
      if (productIdMatch) {
        // The product ID is the Micro Center SKU
        sku = productIdMatch[1];
        mpn = sku;
        console.log(`    -> Found product ID in URL: ${sku}`);
      }
    }
    
    // If we have a URL, try to fetch for additional data
    let upc: string | null = null;
    let gtin: string | null = null;
    let ean: string | null = null;
    
    if (filament.product_url && filament.product_url.startsWith('http')) {
      try {
        const response = await fetch(filament.product_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html',
          },
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // Look for actual SKU in data attributes
          // Pattern: data-id="485644"
          const dataIdMatch = html.match(/data-id=["'](\d+)["']/);
          if (dataIdMatch && !sku) {
            sku = dataIdMatch[1];
            mpn = sku;
            console.log(`    -> Found data-id: ${sku}`);
          }
          
          // Look for UPC/barcode in page
          const barcodePatterns = [
            /UPC[:\s]*([0-9]{8,14})/i,
            /GTIN[:\s]*([0-9]{8,14})/i,
            /EAN[:\s]*([0-9]{8,14})/i,
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
      } catch (e) {
        console.log(`    -> Error fetching page: ${e}`);
      }
    }
    
    if (sku || mpn || upc || gtin || ean) {
      console.log(`    -> Found: SKU=${sku}, MPN=${mpn}, UPC=${upc}, GTIN=${gtin}, EAN=${ean}`);
      return { sku, upc, gtin, ean, mpn, method: 'microcenter_url' };
    }
    
    console.log(`    -> No data found`);
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
    } else if (brandConfig.upcExtractionMethod === 'wix') {
      // Wix stores (like Paramount 3D) - extract SKU from title/URL
      result = await tryWixExtraction(filament);
      
      // Fallback to HTML scraping
      if (!result && filament.product_url) {
        result = await tryHtmlJsonLd(filament.product_url);
      }
    } else if (brandConfig.upcExtractionMethod === 'fiberlogy') {
      // Fiberlogy (ShopArena platform) - extract slug from URL as MPN
      result = await tryFiberlogyExtraction(filament);
    } else if (brandConfig.upcExtractionMethod === 'ninjatek') {
      // NinjaTek (WooCommerce with data-sku in option elements)
      result = await tryNinjaTekExtraction(filament);
      
      // Fallback to generic HTML
      if (!result && filament.product_url) {
        result = await tryHtmlJsonLd(filament.product_url);
      }
    } else if (brandConfig.upcExtractionMethod === 'matterhackers') {
      // MatterHackers - SKU in URL path /sk/XXXXX
      result = await tryMatterHackersExtraction(filament);
      
      // Fallback to generic HTML
      if (!result && filament.product_url) {
        result = await tryHtmlJsonLd(filament.product_url);
      }
    } else if (brandConfig.upcExtractionMethod === 'microcenter') {
      // Micro Center (Inland) - product ID in URL
      result = await tryMicroCenterExtraction(filament);
      
      // Fallback to generic HTML
      if (!result && filament.product_url) {
        result = await tryHtmlJsonLd(filament.product_url);
      }
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
    
    // Paramount 3D specific: 12-digit numeric SKUs are valid UPCs
    // Skip known placeholder SKU that appears across multiple products
    const PARAMOUNT_PLACEHOLDER_SKUS = ['852297007909'];
    const effectiveSku = result.sku || filament.variant_sku;
    
    if (!cleanUpc && effectiveSku && /^\d{12}$/.test(effectiveSku)) {
      // Check if it's not a known placeholder
      if (!PARAMOUNT_PLACEHOLDER_SKUS.includes(effectiveSku)) {
        cleanUpc = effectiveSku;
        result.upc = effectiveSku;
        console.log(`  -> Detected 12-digit SKU as UPC: ${effectiveSku}`);
      } else {
        console.log(`  -> Skipping placeholder SKU: ${effectiveSku}`);
        // Clear the placeholder SKU so it doesn't get saved
        if (result.sku === effectiveSku) result.sku = null;
      }
    }
    
    // Fallback: Use SKU as MPN if MPN is missing (common pattern for many brands)
    if (!result.mpn && effectiveSku && !PARAMOUNT_PLACEHOLDER_SKUS.includes(effectiveSku)) {
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

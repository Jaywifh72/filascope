import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoveredProduct {
  product_id: string;
  product_title: string;
  product_handle: string;
  product_url: string;
  vendor: string;
  material: string | null;
  color_name: string | null;
  color_hex: string | null;
  color_family: string | null;
  featured_image: string | null;
  variant_sku: string | null;
  variant_price: number | null;
  net_weight_g: number | null;
  diameter_nominal_mm: number | null;
  pack_quantity: number;
  tds_url: string | null;
  upc: string | null;
  ean: string | null;
  gtin: string | null;
  mpn: string | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  is_nozzle_abrasive: boolean | null;
  data_completeness: number;
  existing_id: string | null;
  raw_data: any;
}

interface DiscoveryResult {
  platform: 'shopify' | 'woocommerce' | 'custom' | 'unknown';
  brand_name: string;
  website_url: string;
  products: DiscoveredProduct[];
  total_found: number;
  errors: string[];
}

// Material detection patterns
const MATERIAL_PATTERNS: Record<string, RegExp> = {
  'PLA': /\bPLA\b/i,
  'PETG': /\bPETG\b/i,
  'ABS': /\bABS\b/i,
  'ASA': /\bASA\b/i,
  'TPU': /\bTPU\b/i,
  'TPE': /\bTPE\b/i,
  'Nylon': /\b(Nylon|PA6|PA12|PA66)\b/i,
  'PC': /\bPC\b(?!\+)|\bPolycarbonate\b/i,
  'PEEK': /\bPEEK\b/i,
  'PEI': /\bPEI\b|\bUltem\b/i,
  'PVA': /\bPVA\b/i,
  'HIPS': /\bHIPS\b/i,
  'PP': /\bPP\b|\bPolypropylene\b/i,
  'Carbon Fiber': /\b(CF|Carbon\s*Fiber|Carbon\s*Fibre)\b/i,
  'Wood': /\bWood\b/i,
  'Metal': /\b(Metal|Bronze|Copper|Steel|Iron)\b/i,
};

// Abrasive material indicators
const ABRASIVE_MATERIALS = ['Carbon Fiber', 'Metal', 'Glass', 'GF', 'CF'];

// Color extraction patterns
const COLOR_PATTERNS: Record<string, { hex: string; family: string }> = {
  'black': { hex: '#000000', family: 'Black' },
  'white': { hex: '#FFFFFF', family: 'White' },
  'red': { hex: '#FF0000', family: 'Red' },
  'blue': { hex: '#0000FF', family: 'Blue' },
  'green': { hex: '#00FF00', family: 'Green' },
  'yellow': { hex: '#FFFF00', family: 'Yellow' },
  'orange': { hex: '#FFA500', family: 'Orange' },
  'purple': { hex: '#800080', family: 'Purple' },
  'pink': { hex: '#FFC0CB', family: 'Pink' },
  'grey': { hex: '#808080', family: 'Grey' },
  'gray': { hex: '#808080', family: 'Grey' },
  'silver': { hex: '#C0C0C0', family: 'Grey' },
  'gold': { hex: '#FFD700', family: 'Yellow' },
  'brown': { hex: '#8B4513', family: 'Brown' },
  'natural': { hex: '#F5F5DC', family: 'Natural' },
  'clear': { hex: '#FFFFFF', family: 'Clear' },
  'transparent': { hex: '#FFFFFF', family: 'Clear' },
};

// Suffixes to strip from product titles (compatibility notes, not product descriptors)
const TITLE_CLEANUP_SUFFIXES = [
  /\s*-?\s*Bambu\s+AMS\s+Compatible\s*$/i,
  /\s*-?\s*AMS\s+Compatible\s*$/i,
  /\s*-?\s*Bambu\s+Compatible\s*$/i,
  /\s*\|\s*Matter3D\s*$/i,
  /\s*\|\s*[\w\s]+$/i,  // " | BrandName" suffixes
];

// Normalize product title by removing marketing/compatibility suffixes
function normalizeProductTitle(title: string): string {
  let cleaned = title.trim();
  
  for (const pattern of TITLE_CLEANUP_SUFFIXES) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  
  // Remove duplicate spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

function detectMaterial(title: string, description?: string): string | null {
  const text = `${title} ${description || ''}`;
  
  for (const [material, pattern] of Object.entries(MATERIAL_PATTERNS)) {
    if (pattern.test(text)) {
      return material;
    }
  }
  return null;
}

function extractColorInfo(title: string): { name: string | null; hex: string | null; family: string | null } {
  const lowerTitle = title.toLowerCase();
  
  for (const [colorName, info] of Object.entries(COLOR_PATTERNS)) {
    if (lowerTitle.includes(colorName)) {
      return { name: colorName.charAt(0).toUpperCase() + colorName.slice(1), hex: info.hex, family: info.family };
    }
  }
  
  return { name: null, hex: null, family: null };
}

function isAbrasiveMaterial(material: string | null, title: string): boolean {
  if (!material) return false;
  const text = `${material} ${title}`.toLowerCase();
  return ABRASIVE_MATERIALS.some(m => text.includes(m.toLowerCase()));
}

function extractWeight(title: string, variants?: any[]): number | null {
  // Try to extract from title first
  const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) {
    return Math.round(parseFloat(kgMatch[1]) * 1000);
  }
  
  const gMatch = title.match(/(\d+(?:\.\d+)?)\s*g(?:ram)?s?/i);
  if (gMatch) {
    return Math.round(parseFloat(gMatch[1]));
  }
  
  // Try variants
  if (variants && variants.length > 0) {
    const variant = variants[0];
    if (variant.weight && variant.weight_unit) {
      const weight = parseFloat(variant.weight);
      if (variant.weight_unit.toLowerCase() === 'kg') {
        return Math.round(weight * 1000);
      }
      return Math.round(weight);
    }
  }
  
  return null;
}

function extractDiameter(title: string): number | null {
  const match = title.match(/(\d+\.?\d*)\s*mm/i);
  if (match) {
    const diameter = parseFloat(match[1]);
    if (diameter === 1.75 || diameter === 2.85 || diameter === 3) {
      return diameter;
    }
  }
  return null;
}

// Extract pack quantity from product title (e.g., "10 packs", "5-pack", "3x", "bundle of 4")
function extractPackQuantity(title: string): number {
  const lowerTitle = title.toLowerCase();
  
  // Pattern: "X packs" or "X-pack" or "X pack"
  const packMatch = lowerTitle.match(/(\d+)\s*[-]?\s*packs?/i);
  if (packMatch) {
    const qty = parseInt(packMatch[1], 10);
    if (qty >= 2 && qty <= 100) return qty;
  }
  
  // Pattern: "Xx" or "X x" (e.g., "10x", "5 x")
  const xMatch = lowerTitle.match(/(\d+)\s*x\b/i);
  if (xMatch) {
    const qty = parseInt(xMatch[1], 10);
    if (qty >= 2 && qty <= 100) return qty;
  }
  
  // Pattern: "bundle of X" or "set of X"
  const bundleMatch = lowerTitle.match(/(?:bundle|set|box)\s+of\s+(\d+)/i);
  if (bundleMatch) {
    const qty = parseInt(bundleMatch[1], 10);
    if (qty >= 2 && qty <= 100) return qty;
  }
  
  // Pattern: "X rolls" or "X spools"
  const rollsMatch = lowerTitle.match(/(\d+)\s*(?:rolls?|spools?)/i);
  if (rollsMatch) {
    const qty = parseInt(rollsMatch[1], 10);
    if (qty >= 2 && qty <= 100) return qty;
  }
  
  // Pattern: "multipack" or "multi-pack" with quantity
  const multiMatch = lowerTitle.match(/multi[-]?pack\s*(?:of\s*)?(\d+)?/i);
  if (multiMatch) {
    if (multiMatch[1]) {
      const qty = parseInt(multiMatch[1], 10);
      if (qty >= 2 && qty <= 100) return qty;
    }
    // Generic multipack without number, assume 2
    return 2;
  }
  
  // Default: single spool
  return 1;
}

function calculateDataCompleteness(product: DiscoveredProduct): number {
  const fields = [
    'product_title',
    'product_url',
    'vendor',
    'material',
    'color_name',
    'featured_image',
    'variant_price',
    'net_weight_g',
    'diameter_nominal_mm',
    'variant_sku',
  ];
  
  const filled = fields.filter(f => {
    const value = product[f as keyof DiscoveredProduct];
    return value !== null && value !== undefined && value !== '';
  }).length;
  
  return Math.round((filled / fields.length) * 100);
}

async function detectPlatform(websiteUrl: string, firecrawlApiKey: string): Promise<'shopify' | 'woocommerce' | 'custom'> {
  const baseUrl = websiteUrl.replace(/\/$/, '');
  
  // Try Shopify products.json
  try {
    const shopifyResp = await fetch(`${baseUrl}/products.json?limit=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (shopifyResp.ok) {
      const data = await shopifyResp.json();
      if (data.products) {
        console.log('Detected Shopify platform');
        return 'shopify';
      }
    }
  } catch (e) {
    console.log('Not Shopify:', e);
  }
  
  // Try Shopify collections
  try {
    const collectionsResp = await fetch(`${baseUrl}/collections/all/products.json?limit=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (collectionsResp.ok) {
      const data = await collectionsResp.json();
      if (data.products) {
        console.log('Detected Shopify platform (via collections)');
        return 'shopify';
      }
    }
  } catch (e) {
    console.log('Not Shopify collections:', e);
  }
  
  // Try WooCommerce
  try {
    const wooResp = await fetch(`${baseUrl}/wp-json/wc/v3/products?per_page=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (wooResp.ok) {
      console.log('Detected WooCommerce platform');
      return 'woocommerce';
    }
  } catch (e) {
    console.log('Not WooCommerce:', e);
  }
  
  console.log('Using custom scraping');
  return 'custom';
}

async function fetchShopifyProducts(websiteUrl: string, brandName: string): Promise<DiscoveredProduct[]> {
  const baseUrl = websiteUrl.replace(/\/$/, '');
  const products: DiscoveredProduct[] = [];
  let page = 1;
  const limit = 250;
  
  while (true) {
    let data: any = null;
    
    // Try products.json first
    try {
      const resp = await fetch(`${baseUrl}/products.json?limit=${limit}&page=${page}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (resp.ok) {
        data = await resp.json();
      }
    } catch (e) {
      console.log('products.json failed, trying collections');
    }
    
    // Try collections/all
    if (!data) {
      try {
        const resp = await fetch(`${baseUrl}/collections/all/products.json?limit=${limit}&page=${page}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (resp.ok) {
          data = await resp.json();
        }
      } catch (e) {
        console.log('collections/all failed');
      }
    }
    
    // Try collections/filament
    if (!data) {
      try {
        const resp = await fetch(`${baseUrl}/collections/filament/products.json?limit=${limit}&page=${page}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (resp.ok) {
          data = await resp.json();
        }
      } catch (e) {
        console.log('collections/filament failed');
      }
    }
    
    if (!data?.products || data.products.length === 0) {
      break;
    }
    
    console.log(`Fetched page ${page} with ${data.products.length} products`);
    
    for (const product of data.products) {
      // Filter for filament products
      const title = product.title?.toLowerCase() || '';
      const productType = product.product_type?.toLowerCase() || '';
      const tags = (product.tags || []).join(' ').toLowerCase();
      
      const isFilament = 
        title.includes('filament') || 
        productType.includes('filament') ||
        tags.includes('filament') ||
        title.includes('pla') ||
        title.includes('petg') ||
        title.includes('abs') ||
        title.includes('tpu');
      
      if (!isFilament) continue;
      
      const variant = product.variants?.[0] || {};
      const material = detectMaterial(product.title, product.body_html);
      const colorInfo = extractColorInfo(product.title);
      
      // Normalize the product title to remove marketing suffixes
      const normalizedTitle = normalizeProductTitle(product.title);
      
      const discoveredProduct: DiscoveredProduct = {
        product_id: String(product.id),
        product_title: normalizedTitle,
        product_handle: product.handle,
        product_url: `${baseUrl}/products/${product.handle}`,
        vendor: brandName,
        material,
        color_name: colorInfo.name,
        color_hex: colorInfo.hex,
        color_family: colorInfo.family,
        featured_image: product.images?.[0]?.src || null,
        variant_sku: variant.sku || null,
        variant_price: variant.price ? parseFloat(variant.price) : null,
        net_weight_g: extractWeight(product.title, product.variants),
        diameter_nominal_mm: extractDiameter(product.title) || 1.75,
        pack_quantity: extractPackQuantity(product.title),
        tds_url: null,
        upc: variant.barcode || null,
        ean: null,
        gtin: null,
        mpn: variant.sku || null,
        nozzle_temp_min_c: null,
        nozzle_temp_max_c: null,
        bed_temp_min_c: null,
        bed_temp_max_c: null,
        is_nozzle_abrasive: isAbrasiveMaterial(material, product.title),
        data_completeness: 0,
        existing_id: null,
        raw_data: product,
      };
      
      discoveredProduct.data_completeness = calculateDataCompleteness(discoveredProduct);
      products.push(discoveredProduct);
    }
    
    if (data.products.length < limit) {
      break;
    }
    
    page++;
    
    // Safety limit
    if (page > 20) break;
  }
  
  return products;
}

async function fetchCustomProducts(websiteUrl: string, brandName: string, firecrawlApiKey: string): Promise<DiscoveredProduct[]> {
  const products: DiscoveredProduct[] = [];
  
  // Use Firecrawl to map the site
  try {
    const mapResp = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: websiteUrl,
        search: 'filament product',
        limit: 100,
      }),
    });
    
    if (!mapResp.ok) {
      console.error('Firecrawl map failed:', await mapResp.text());
      return products;
    }
    
    const mapData = await mapResp.json();
    const productUrls = (mapData.links || []).filter((url: string) => 
      url.includes('product') || url.includes('filament')
    ).slice(0, 50);
    
    console.log(`Found ${productUrls.length} potential product URLs`);
    
    // Scrape each product page
    for (const productUrl of productUrls) {
      try {
        const scrapeResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: productUrl,
            formats: ['markdown', 'html'],
            onlyMainContent: true,
          }),
        });
        
        if (!scrapeResp.ok) continue;
        
        const scrapeData = await scrapeResp.json();
        const markdown = scrapeData.data?.markdown || '';
        const title = scrapeData.data?.metadata?.title || '';
        
        // Extract product info from markdown
        const material = detectMaterial(title, markdown);
        const colorInfo = extractColorInfo(title);
        
        // Extract price
        const priceMatch = markdown.match(/\$(\d+(?:\.\d{2})?)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : null;
        
        const discoveredProduct: DiscoveredProduct = {
          product_id: productUrl.split('/').pop() || '',
          product_title: title,
          product_handle: productUrl.split('/').pop() || '',
          product_url: productUrl,
          vendor: brandName,
          material,
          color_name: colorInfo.name,
          color_hex: colorInfo.hex,
          color_family: colorInfo.family,
          featured_image: null,
          variant_sku: null,
          variant_price: price,
          net_weight_g: extractWeight(title + ' ' + markdown),
          diameter_nominal_mm: extractDiameter(title + ' ' + markdown) || 1.75,
          pack_quantity: extractPackQuantity(title),
          tds_url: null,
          upc: null,
          ean: null,
          gtin: null,
          mpn: null,
          nozzle_temp_min_c: null,
          nozzle_temp_max_c: null,
          bed_temp_min_c: null,
          bed_temp_max_c: null,
          is_nozzle_abrasive: isAbrasiveMaterial(material, title),
          data_completeness: 0,
          existing_id: null,
          raw_data: scrapeData.data,
        };
        
        discoveredProduct.data_completeness = calculateDataCompleteness(discoveredProduct);
        products.push(discoveredProduct);
        
      } catch (e) {
        console.error(`Error scraping ${productUrl}:`, e);
      }
    }
  } catch (e) {
    console.error('Firecrawl error:', e);
  }
  
  return products;
}

async function checkExistingProducts(products: DiscoveredProduct[], supabase: any): Promise<DiscoveredProduct[]> {
  // Get all SKUs and titles to check
  const skus = products.filter(p => p.variant_sku).map(p => p.variant_sku);
  const titles = products.map(p => p.product_title);
  
  // Check by SKU first
  if (skus.length > 0) {
    const { data: existingBySku } = await supabase
      .from('filaments')
      .select('id, variant_sku, product_title')
      .in('variant_sku', skus);
    
    if (existingBySku) {
      for (const existing of existingBySku) {
        const product = products.find(p => p.variant_sku === existing.variant_sku);
        if (product) {
          product.existing_id = existing.id;
        }
      }
    }
  }
  
  // Check by title for products without existing_id
  const remainingTitles = products.filter(p => !p.existing_id).map(p => p.product_title);
  if (remainingTitles.length > 0) {
    const { data: existingByTitle } = await supabase
      .from('filaments')
      .select('id, product_title')
      .in('product_title', remainingTitles);
    
    if (existingByTitle) {
      for (const existing of existingByTitle) {
        const product = products.find(p => p.product_title === existing.product_title && !p.existing_id);
        if (product) {
          product.existing_id = existing.id;
        }
      }
    }
  }
  
  return products;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const { data: isAdmin } = await authClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { brand_name, website_url } = await req.json();
    
    if (!brand_name || !website_url) {
      return new Response(JSON.stringify({ error: 'brand_name and website_url are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Discovering filaments for ${brand_name} from ${website_url}`);
    
    const result: DiscoveryResult = {
      platform: 'unknown',
      brand_name,
      website_url,
      products: [],
      total_found: 0,
      errors: [],
    };
    
    // Detect platform
    result.platform = await detectPlatform(website_url, firecrawlApiKey || '');
    console.log(`Platform detected: ${result.platform}`);
    
    // Fetch products based on platform
    if (result.platform === 'shopify') {
      result.products = await fetchShopifyProducts(website_url, brand_name);
    } else if (result.platform === 'custom' && firecrawlApiKey) {
      result.products = await fetchCustomProducts(website_url, brand_name, firecrawlApiKey);
    } else {
      result.errors.push('Could not detect platform or missing Firecrawl API key for custom scraping');
    }
    
    console.log(`Found ${result.products.length} filament products`);
    
    // Check for existing products in database
    if (result.products.length > 0) {
      result.products = await checkExistingProducts(result.products, supabase);
    }
    
    result.total_found = result.products.length;
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in discover-filament-brand:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

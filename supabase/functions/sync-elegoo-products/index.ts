import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback catalog ID if dynamic discovery fails
const DEFAULT_CATALOG_ID = '25495'; // US Elegoo Filaments

// Region to currency mapping
const REGION_CURRENCIES: Record<string, string> = {
  'US': 'USD',
  'AU': 'AUD',
  'CA': 'CAD',
  'EU': 'EUR',
  'UK': 'GBP',
  'JP': 'JPY',
};

// Color name to HEX mapping
const COLOR_HEX_MAP: Record<string, string> = {
  'black': '1A1A1A',
  'white': 'FFFFFF',
  'grey': '808080',
  'gray': '808080',
  'red': 'DC2626',
  'blue': '2563EB',
  'navy': '1E3A5F',
  'green': '16A34A',
  'yellow': 'EAB308',
  'orange': 'EA580C',
  'purple': '9333EA',
  'pink': 'EC4899',
  'brown': '92400E',
  'beige': 'D4C4A8',
  'silver': 'C0C0C0',
  'gold': 'D4AF37',
  'copper': 'B87333',
  'bronze': 'CD7F32',
  'transparent': 'FFFFFF',
  'clear': 'FFFFFF',
  'natural': 'F5F5DC',
  'ivory': 'FFFFF0',
  'cream': 'FFFDD0',
  'tan': 'D2B48C',
  'olive': '808000',
  'teal': '008080',
  'cyan': '00FFFF',
  'magenta': 'FF00FF',
  'lime': '00FF00',
  'mint': '98FF98',
  'coral': 'FF7F50',
  'salmon': 'FA8072',
  'maroon': '800000',
  'burgundy': '800020',
  'navy blue': '000080',
  'sky blue': '87CEEB',
  'royal blue': '4169E1',
  'forest green': '228B22',
  'olive green': '6B8E23',
  'neon green': '39FF14',
  'neon pink': 'FF6EC7',
  'neon orange': 'FF5F1F',
  'neon yellow': 'CCFF00',
  'hot pink': 'FF69B4',
  'light blue': 'ADD8E6',
  'dark blue': '00008B',
  'light green': '90EE90',
  'dark green': '006400',
  'light grey': 'D3D3D3',
  'dark grey': 'A9A9A9',
  'charcoal': '36454F',
  'midnight': '191970',
  'rose': 'FF007F',
  'lavender': 'E6E6FA',
  'violet': 'EE82EE',
  'indigo': '4B0082',
  'peach': 'FFCBA4',
  'aqua': '00FFFF',
  'turquoise': '40E0D0',
};

interface TechSpecs {
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  density_g_cm3: number | null;
}

interface ElegooProduct {
  productId: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  currency: string;
  url: string;
  imageUrl: string;
  manufacturer: string;
  mpn: string;
  upc: string;
  ean: string;
  inStock: boolean;
  stockQuantity: number;
  labels: string[];
  category: string;
  categoryId: string;
  tdsUrl: string | null;
  material: string | null;
  techSpecs: TechSpecs | null;
}

interface ProductFields {
  tds: boolean;
  image: boolean;
  price: boolean;
  salePrice: boolean;
  url: boolean;
  msrp: boolean;
}

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  products: {
    title: string;
    action: 'created' | 'updated' | 'skipped' | 'error';
    reason?: string;
    fields: ProductFields;
    currentPrice?: number;
    msrp?: number;
  }[];
}

interface RegionalData {
  price?: number;
  url?: string;
  currency?: string;
}

interface DiscoveredCatalog {
  id: string;
  name: string;
  currency: string;
  serviceAreas: string[];
  location: string;
  status: string; // From Impact API: "Active", "Inactive", etc.
}

// Discover available catalogs dynamically from Impact API
async function discoverRegionalCatalogs(supabase: SupabaseClient, supabaseUrl: string, supabaseServiceKey: string): Promise<Record<string, string>> {
  console.log('[ELEGOO-SYNC] 🔍 Starting dynamic catalog discovery...');
  
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/list-impact-catalogs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ELEGOO-SYNC] ❌ Catalog discovery failed: ${response.status} - ${errorText}`);
      return { 'US': DEFAULT_CATALOG_ID };
    }

    const data = await response.json();
    console.log(`[ELEGOO-SYNC] 📦 Found ${data.catalogs?.length || 0} total catalogs from Impact API`);

    if (!data.catalogs || data.catalogs.length === 0) {
      console.log('[ELEGOO-SYNC] ⚠️ No catalogs returned, using default US catalog');
      return { 'US': DEFAULT_CATALOG_ID };
    }

    const regionMap: Record<string, string> = {};
    
    for (const catalog of data.catalogs as DiscoveredCatalog[]) {
      console.log(`[ELEGOO-SYNC]   📋 Catalog: ${catalog.name} (ID: ${catalog.id})`);
      console.log(`[ELEGOO-SYNC]      Currency: ${catalog.currency}, Location: ${catalog.location}`);
      console.log(`[ELEGOO-SYNC]      Service Areas: ${catalog.serviceAreas?.join(', ') || 'none'}`);
      console.log(`[ELEGOO-SYNC]      Status: ${catalog.status || 'unknown'}`);

      // Check if catalog is active (status can be "Active", "Approved", or we treat unknown as active)
      const isActive = !catalog.status || 
        catalog.status.toLowerCase() === 'active' || 
        catalog.status.toLowerCase() === 'approved';
      
      if (!isActive) {
        console.log(`[ELEGOO-SYNC]      ⏭️ Skipping inactive catalog (status: ${catalog.status})`);
        continue;
      }

      // Map catalog to region based on currency, location, service areas, or name
      const catalogNameLower = catalog.name.toLowerCase();
      const serviceAreasLower = (catalog.serviceAreas || []).map((s: string) => s.toLowerCase());
      const locationLower = (catalog.location || '').toLowerCase();

      // US detection
      if (catalog.currency === 'USD' || 
          catalogNameLower.includes('us') || 
          serviceAreasLower.some((a: string) => a.includes('us') || a.includes('united states')) ||
          locationLower.includes('us') || locationLower.includes('united states')) {
        if (!regionMap['US']) {
          regionMap['US'] = catalog.id;
          console.log(`[ELEGOO-SYNC]      ✅ Mapped to US region`);
        }
      }
      
      // Canada detection
      if (catalog.currency === 'CAD' || 
          catalogNameLower.includes('canada') || catalogNameLower.includes(' ca ') ||
          serviceAreasLower.some((a: string) => a.includes('canada') || a.includes(' ca ')) ||
          locationLower.includes('canada')) {
        if (!regionMap['CA']) {
          regionMap['CA'] = catalog.id;
          console.log(`[ELEGOO-SYNC]      ✅ Mapped to CA region`);
        }
      }
      
      // Australia detection
      if (catalog.currency === 'AUD' || 
          catalogNameLower.includes('australia') || catalogNameLower.includes(' au ') ||
          serviceAreasLower.some((a: string) => a.includes('australia') || a.includes(' au ')) ||
          locationLower.includes('australia')) {
        if (!regionMap['AU']) {
          regionMap['AU'] = catalog.id;
          console.log(`[ELEGOO-SYNC]      ✅ Mapped to AU region`);
        }
      }
      
      // UK detection
      if (catalog.currency === 'GBP' || 
          catalogNameLower.includes('uk') || catalogNameLower.includes('united kingdom') || catalogNameLower.includes('britain') ||
          serviceAreasLower.some((a: string) => a.includes('uk') || a.includes('united kingdom') || a.includes('britain')) ||
          locationLower.includes('uk') || locationLower.includes('united kingdom')) {
        if (!regionMap['UK']) {
          regionMap['UK'] = catalog.id;
          console.log(`[ELEGOO-SYNC]      ✅ Mapped to UK region`);
        }
      }
      
      // EU detection
      if (catalog.currency === 'EUR' || 
          catalogNameLower.includes('europe') || catalogNameLower.includes(' eu ') ||
          serviceAreasLower.some((a: string) => a.includes('europe') || a.includes(' eu ')) ||
          locationLower.includes('europe')) {
        if (!regionMap['EU']) {
          regionMap['EU'] = catalog.id;
          console.log(`[ELEGOO-SYNC]      ✅ Mapped to EU region`);
        }
      }

      // Japan detection
      if (catalog.currency === 'JPY' || 
          catalogNameLower.includes('japan') || catalogNameLower.includes(' jp ') ||
          serviceAreasLower.some((a: string) => a.includes('japan') || a.includes(' jp ')) ||
          locationLower.includes('japan')) {
        if (!regionMap['JP']) {
          regionMap['JP'] = catalog.id;
          console.log(`[ELEGOO-SYNC]      ✅ Mapped to JP region`);
        }
      }
    }

    console.log(`[ELEGOO-SYNC] 🗺️ Final region mapping: ${JSON.stringify(regionMap)}`);
    
    // Always ensure we have at least the US catalog
    if (Object.keys(regionMap).length === 0) {
      console.log('[ELEGOO-SYNC] ⚠️ No regions mapped, using default US catalog');
      return { 'US': DEFAULT_CATALOG_ID };
    }

    return regionMap;
  } catch (err) {
    console.error('[ELEGOO-SYNC] ❌ Catalog discovery error:', err);
    console.log('[ELEGOO-SYNC] ⚠️ Using fallback US catalog');
    return { 'US': DEFAULT_CATALOG_ID };
  }
}

function extractMaterialFromTitle(title: string): string | null {
  const titleLower = title.toLowerCase();
  
  // Check for specific materials in order of specificity
  if (titleLower.includes('pla-cf') || titleLower.includes('pla cf')) return 'PLA-CF';
  if (titleLower.includes('petg-cf') || titleLower.includes('petg cf')) return 'PETG-CF';
  if (titleLower.includes('pc-cf') || titleLower.includes('pc cf')) return 'PC-CF';
  if (titleLower.includes('petg')) return 'PETG';
  if (titleLower.includes('abs')) return 'ABS';
  if (titleLower.includes('tpu')) return 'TPU';
  if (titleLower.includes('pla+') || titleLower.includes('pla plus')) return 'PLA+';
  if (titleLower.includes('pla')) return 'PLA';
  if (titleLower.includes('asa')) return 'ASA';
  if (titleLower.includes('nylon') || titleLower.includes('pa')) return 'PA';
  if (/^pc\s*[-–]/.test(titleLower) || titleLower.includes('polycarbonate')) return 'PC';
  
  return null;
}

function extractWeightFromTitle(title: string): number | null {
  const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) {
    return parseFloat(kgMatch[1]) * 1000;
  }
  
  const gMatch = title.match(/(\d+)\s*g\b/i);
  if (gMatch) {
    return parseInt(gMatch[1]);
  }
  
  return 1000;
}

function extractDiameterFromTitle(title: string): number {
  if (title.includes('2.85') || title.includes('3mm') || title.includes('3.0mm')) {
    return 2.85;
  }
  return 1.75;
}

function extractColorAndHex(title: string): { colorName: string | null; colorHex: string | null } {
  const titleLower = title.toLowerCase();
  
  const dashMatch = title.match(/\s-\s([^-]+)$/);
  if (dashMatch) {
    const colorPart = dashMatch[1].trim().toLowerCase();
    const cleanColor = colorPart.replace(/\d+(?:\.\d+)?(?:kg|g|mm)/gi, '').trim();
    
    for (const [colorName, hex] of Object.entries(COLOR_HEX_MAP)) {
      if (cleanColor.includes(colorName) || colorName.includes(cleanColor)) {
        return { colorName: cleanColor, colorHex: hex };
      }
    }
    return { colorName: cleanColor, colorHex: null };
  }
  
  for (const [colorName, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (titleLower.includes(colorName)) {
      return { colorName, colorHex: hex };
    }
  }
  
  return { colorName: null, colorHex: null };
}

function normalizeProductTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // === PHASE 1: INITIALIZATION ===
  console.log('[ELEGOO-SYNC] ═══════════════════════════════════════════════════════');
  console.log('[ELEGOO-SYNC] 🚀 ELEGOO SYNC STARTED');
  console.log('[ELEGOO-SYNC] ═══════════════════════════════════════════════════════');
  console.log(`[ELEGOO-SYNC] Timestamp: ${new Date().toISOString()}`);

  try {
    // Validate environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('[ELEGOO-SYNC] 🔧 Validating environment...');
    if (!supabaseUrl) {
      console.error('[ELEGOO-SYNC] ❌ FATAL: Missing SUPABASE_URL');
      throw new Error('Missing SUPABASE_URL environment variable');
    }
    if (!supabaseServiceKey) {
      console.error('[ELEGOO-SYNC] ❌ FATAL: Missing SUPABASE_SERVICE_ROLE_KEY');
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }
    console.log('[ELEGOO-SYNC] ✅ Environment validated');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let dryRun = true;
    let materialFilter: string | undefined;
    let requestedRegions: string[] = ['US'];
    
    try {
      const body = await req.json();
      dryRun = body.dryRun ?? true;
      materialFilter = body.materialFilter;
      requestedRegions = body.regions || ['US'];
      console.log('[ELEGOO-SYNC] 📝 Request parameters:');
      console.log(`[ELEGOO-SYNC]    dryRun: ${dryRun}`);
      console.log(`[ELEGOO-SYNC]    materialFilter: ${materialFilter || 'ALL'}`);
      console.log(`[ELEGOO-SYNC]    requestedRegions: ${requestedRegions.join(', ')}`);
    } catch (parseErr) {
      console.error('[ELEGOO-SYNC] ⚠️ Failed to parse request body, using defaults');
    }

    // === PHASE 2: CREATE SYNC LOG ===
    console.log('[ELEGOO-SYNC] ───────────────────────────────────────────────────────');
    console.log('[ELEGOO-SYNC] 📋 PHASE: Creating sync log');
    
    let syncLogId: string | null = null;
    if (!dryRun) {
      try {
        const { data: logData, error: logError } = await supabase
          .from('brand_sync_logs')
          .insert({
            brand_slug: 'elegoo',
            sync_type: 'impact_catalog_sync',
            status: 'running',
            triggered_by: 'manual',
            started_at: new Date().toISOString(),
            notes: `Regions: ${requestedRegions.join(', ')}, Filter: ${materialFilter || 'ALL'}`,
          })
          .select('id')
          .single();

        if (logError) {
          console.error('[ELEGOO-SYNC] ⚠️ Failed to create sync log:', logError.message);
        } else {
          syncLogId = logData?.id;
          console.log(`[ELEGOO-SYNC] ✅ Created sync log: ${syncLogId}`);
        }
      } catch (logErr) {
        console.error('[ELEGOO-SYNC] ⚠️ Sync log creation error:', logErr);
      }
    } else {
      console.log('[ELEGOO-SYNC] ⏭️ Dry run mode - skipping sync log creation');
    }

    // === PHASE 3: DISCOVER CATALOGS ===
    console.log('[ELEGOO-SYNC] ───────────────────────────────────────────────────────');
    console.log('[ELEGOO-SYNC] 🔍 PHASE: Catalog Discovery');
    
    const availableCatalogs = await discoverRegionalCatalogs(supabase, supabaseUrl, supabaseServiceKey);
    console.log(`[ELEGOO-SYNC] Available catalogs: ${JSON.stringify(availableCatalogs)}`);

    // Filter to only requested regions that have catalogs
    const regionsToSync: string[] = [];
    for (const region of requestedRegions) {
      if (availableCatalogs[region]) {
        regionsToSync.push(region);
        console.log(`[ELEGOO-SYNC] ✅ Region ${region} -> Catalog ${availableCatalogs[region]}`);
      } else {
        console.log(`[ELEGOO-SYNC] ⚠️ Region ${region} has no available catalog, skipping`);
      }
    }

    if (regionsToSync.length === 0) {
      console.error('[ELEGOO-SYNC] ❌ No valid regions to sync!');
      throw new Error(`No catalogs available for requested regions: ${requestedRegions.join(', ')}`);
    }

    console.log(`[ELEGOO-SYNC] 📍 Regions to sync: ${regionsToSync.join(', ')}`);

    const result: SyncResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      products: [],
    };

    // === PHASE 4: FETCH PRODUCTS FROM CATALOGS ===
    console.log('[ELEGOO-SYNC] ───────────────────────────────────────────────────────');
    console.log('[ELEGOO-SYNC] 📦 PHASE: Fetching products from catalogs');

    const productsByNormalizedTitle: Map<string, { 
      baseProduct: ElegooProduct;
      regionalData: Record<string, RegionalData>;
    }> = new Map();

    for (const region of regionsToSync) {
      const catalogId = availableCatalogs[region];
      console.log(`[ELEGOO-SYNC] ───────────────────────────────────────────────────────`);
      console.log(`[ELEGOO-SYNC] 🌍 REGION: ${region} (Catalog: ${catalogId})`);

      let page = 1;
      let hasMore = true;
      let regionProductCount = 0;

      while (hasMore) {
        console.log(`[ELEGOO-SYNC]    📄 Fetching page ${page}...`);
        
        try {
          const catalogResponse = await fetch(
            `${supabaseUrl}/functions/v1/fetch-elegoo-catalog`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                materialFilter, 
                page, 
                pageSize: 100,
                catalogId 
              }),
            }
          );

          if (!catalogResponse.ok) {
            const errorText = await catalogResponse.text();
            console.error(`[ELEGOO-SYNC]    ❌ Catalog fetch failed: ${catalogResponse.status}`);
            console.error(`[ELEGOO-SYNC]    Response: ${errorText.substring(0, 500)}`);
            break;
          }

          const catalogData = await catalogResponse.json();
          
          if (catalogData.error) {
            console.error(`[ELEGOO-SYNC]    ❌ Catalog error: ${catalogData.error}`);
            break;
          }

          const products = catalogData.products as ElegooProduct[];
          console.log(`[ELEGOO-SYNC]    ✅ Page ${page}: ${products.length} products`);
          regionProductCount += products.length;

          for (const product of products) {
            const normalizedTitle = normalizeProductTitle(product.title);
            
            if (!productsByNormalizedTitle.has(normalizedTitle)) {
              productsByNormalizedTitle.set(normalizedTitle, {
                baseProduct: product,
                regionalData: {
                  [region]: {
                    price: product.price,
                    url: product.url,
                    currency: REGION_CURRENCIES[region] || product.currency,
                  }
                }
              });
            } else {
              const existing = productsByNormalizedTitle.get(normalizedTitle)!;
              existing.regionalData[region] = {
                price: product.price,
                url: product.url,
                currency: REGION_CURRENCIES[region] || product.currency,
              };
            }
          }

          hasMore = catalogData.pagination?.hasNextPage || false;
          page++;

          if (page > 50) {
            console.log(`[ELEGOO-SYNC]    ⚠️ Reached page limit (50), stopping pagination`);
            break;
          }
        } catch (fetchErr) {
          console.error(`[ELEGOO-SYNC]    ❌ Fetch error for ${region} page ${page}:`, fetchErr);
          break;
        }
      }

      console.log(`[ELEGOO-SYNC]    📊 Total products from ${region}: ${regionProductCount}`);
    }

    console.log(`[ELEGOO-SYNC] ═══════════════════════════════════════════════════════`);
    console.log(`[ELEGOO-SYNC] 📊 Total unique products across all regions: ${productsByNormalizedTitle.size}`);

    // === PHASE 5: PROCESS PRODUCTS ===
    console.log('[ELEGOO-SYNC] ───────────────────────────────────────────────────────');
    console.log('[ELEGOO-SYNC] ⚙️ PHASE: Processing products');

    let processedCount = 0;
    for (const [normalizedTitle, { baseProduct, regionalData }] of productsByNormalizedTitle) {
      processedCount++;
      const product = baseProduct;
      
      try {
        console.log(`[ELEGOO-SYNC] 📦 Product ${processedCount}/${productsByNormalizedTitle.size}: ${product.title}`);
        
        const material = product.material || extractMaterialFromTitle(product.title);
        const weight = extractWeightFromTitle(product.title);
        const diameter = extractDiameterFromTitle(product.title);
        const techSpecs = product.techSpecs;
        const { colorName, colorHex } = extractColorAndHex(product.title);

        console.log(`[ELEGOO-SYNC]    Material: ${material || 'UNKNOWN'}`);
        console.log(`[ELEGOO-SYNC]    Weight: ${weight}g, Diameter: ${diameter}mm`);
        console.log(`[ELEGOO-SYNC]    Color: ${colorName || 'none'} (HEX: ${colorHex ? '#' + colorHex : 'none'})`);
        console.log(`[ELEGOO-SYNC]    Regions: ${Object.keys(regionalData).join(', ')}`);

        const hasTdsFromApi = Boolean(product.tdsUrl && product.tdsUrl.trim() !== '');
        const msrpValue = product.originalPrice ?? product.price ?? null;
        const hasMsrp = Boolean(msrpValue && msrpValue > 0);
        const isOnSale = Boolean(product.originalPrice && product.price < product.originalPrice);
        
        const fields: ProductFields = {
          tds: hasTdsFromApi,
          image: Boolean(product.imageUrl && product.imageUrl.trim() !== ''),
          price: Boolean(product.price && product.price > 0),
          salePrice: isOnSale,
          url: Boolean(product.url && product.url.trim() !== ''),
          msrp: hasMsrp,
        };
        
        const currentPrice = product.price;
        const msrp = msrpValue || undefined;

        if (!material) {
          console.log(`[ELEGOO-SYNC]    ⏭️ SKIPPED: Could not detect material type`);
          result.skipped++;
          result.products.push({
            title: product.title,
            action: 'skipped',
            reason: 'Could not detect material type',
            fields,
            currentPrice,
            msrp,
          });
          continue;
        }

        // Check if product already exists
        const { data: existing, error: lookupError } = await supabase
          .from('filaments')
          .select('id, variant_price, updated_at, tds_url, color_hex')
          .eq('product_id', product.productId)
          .eq('vendor', 'Elegoo')
          .maybeSingle();

        if (lookupError) {
          console.error(`[ELEGOO-SYNC]    ⚠️ Lookup error: ${lookupError.message}`);
        }

        if (existing?.tds_url) {
          fields.tds = true;
        }

        // Build regional price and URL fields
        const regionalFields: Record<string, unknown> = {};
        
        if (regionalData['AU']) {
          regionalFields.price_aud = regionalData['AU'].price;
          regionalFields.product_url_au = regionalData['AU'].url;
        }
        if (regionalData['CA']) {
          regionalFields.price_cad = regionalData['CA'].price;
          regionalFields.product_url_ca = regionalData['CA'].url;
        }
        if (regionalData['EU']) {
          regionalFields.price_eur = regionalData['EU'].price;
          regionalFields.product_url_eu = regionalData['EU'].url;
        }
        if (regionalData['UK']) {
          regionalFields.price_gbp = regionalData['UK'].price;
          regionalFields.product_url_uk = regionalData['UK'].url;
        }
        if (regionalData['JP']) {
          regionalFields.price_jpy = regionalData['JP'].price;
          regionalFields.product_url_jp = regionalData['JP'].url;
        }

        const filamentData = {
          product_id: product.productId,
          product_title: product.title,
          vendor: 'Elegoo',
          material,
          variant_price: regionalData['US']?.price || product.price,
          variant_compare_at_price: product.compareAtPrice,
          variant_available: product.inStock,
          product_url: regionalData['US']?.url || product.url,
          featured_image: product.imageUrl,
          mpn: product.mpn || null,
          upc: product.upc || null,
          ean: product.ean || null,
          net_weight_g: weight,
          diameter_nominal_mm: diameter,
          auto_created: true,
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
          regional_prices_updated_at: new Date().toISOString(),
          ...(product.tdsUrl ? { tds_url: product.tdsUrl } : {}),
          ...(colorHex ? { color_hex: colorHex } : {}),
          ...(techSpecs?.nozzle_temp_min_c ? { nozzle_temp_min_c: techSpecs.nozzle_temp_min_c } : {}),
          ...(techSpecs?.nozzle_temp_max_c ? { nozzle_temp_max_c: techSpecs.nozzle_temp_max_c } : {}),
          ...(techSpecs?.bed_temp_min_c ? { bed_temp_min_c: techSpecs.bed_temp_min_c } : {}),
          ...(techSpecs?.bed_temp_max_c ? { bed_temp_max_c: techSpecs.bed_temp_max_c } : {}),
          ...(techSpecs?.density_g_cm3 ? { density_g_cm3: techSpecs.density_g_cm3 } : {}),
          ...regionalFields,
        };

        if (dryRun) {
          if (existing) {
            console.log(`[ELEGOO-SYNC]    🔄 DRY RUN: Would UPDATE (current: $${existing.variant_price} -> $${product.price})`);
            result.updated++;
            result.products.push({
              title: product.title,
              action: 'updated',
              reason: `Price: $${existing.variant_price} → $${product.price}, Regions: ${Object.keys(regionalData).join(', ')}`,
              fields,
              currentPrice,
              msrp,
            });
          } else {
            console.log(`[ELEGOO-SYNC]    ➕ DRY RUN: Would CREATE`);
            result.created++;
            result.products.push({
              title: product.title,
              action: 'created',
              fields,
              currentPrice,
              msrp,
            });
          }
        } else {
          if (existing) {
            const { error: updateError } = await supabase
              .from('filaments')
              .update({
                ...filamentData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);

            if (updateError) {
              console.error(`[ELEGOO-SYNC]    ❌ Update error: ${updateError.message}`);
              throw updateError;
            }
            
            console.log(`[ELEGOO-SYNC]    ✅ UPDATED`);
            result.updated++;
            result.products.push({
              title: product.title,
              action: 'updated',
              fields,
              currentPrice,
              msrp,
            });

            // Log price change if different
            if (existing.variant_price !== product.price) {
              console.log(`[ELEGOO-SYNC]    💰 Price changed: $${existing.variant_price} -> $${product.price}`);
              await supabase.from('price_history').insert({
                filament_id: existing.id,
                price: product.price,
                region: 'US',
                source: 'elegoo_api',
              });
            }
          } else {
            const { error: insertError } = await supabase
              .from('filaments')
              .insert(filamentData);

            if (insertError) {
              console.error(`[ELEGOO-SYNC]    ❌ Insert error: ${insertError.message}`);
              throw insertError;
            }
            
            console.log(`[ELEGOO-SYNC]    ✅ CREATED`);
            result.created++;
            result.products.push({
              title: product.title,
              action: 'created',
              fields,
              currentPrice,
              msrp,
            });
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[ELEGOO-SYNC]    ❌ ERROR: ${errorMessage}`);
        result.errors++;
        result.products.push({
          title: baseProduct.title,
          action: 'error',
          reason: errorMessage,
          fields: { tds: false, image: false, price: false, salePrice: false, url: false, msrp: false },
        });
      }
    }

    // === PHASE 6: UPDATE SYNC LOG ===
    const durationMs = Date.now() - startTime;
    const durationSeconds = Math.round(durationMs / 1000);

    console.log('[ELEGOO-SYNC] ───────────────────────────────────────────────────────');
    console.log('[ELEGOO-SYNC] 📋 PHASE: Updating sync log');

    if (syncLogId && !dryRun) {
      try {
        const { error: updateLogError } = await supabase
          .from('brand_sync_logs')
          .update({
            status: result.errors > 0 ? 'completed_with_errors' : 'completed',
            completed_at: new Date().toISOString(),
            duration_seconds: durationSeconds,
            products_discovered: productsByNormalizedTitle.size,
            products_created: result.created,
            products_updated: result.updated,
            products_failed: result.errors,
            success_details: {
              regions_synced: regionsToSync,
              catalogs_used: availableCatalogs,
            },
          })
          .eq('id', syncLogId);

        if (updateLogError) {
          console.error('[ELEGOO-SYNC] ⚠️ Failed to update sync log:', updateLogError.message);
        } else {
          console.log('[ELEGOO-SYNC] ✅ Sync log updated');
        }
      } catch (logErr) {
        console.error('[ELEGOO-SYNC] ⚠️ Sync log update error:', logErr);
      }
    }

    // === PHASE 7: SUMMARY ===
    console.log('[ELEGOO-SYNC] ═══════════════════════════════════════════════════════');
    console.log('[ELEGOO-SYNC] 🎉 SYNC COMPLETE');
    console.log('[ELEGOO-SYNC] ═══════════════════════════════════════════════════════');
    console.log(`[ELEGOO-SYNC] ⏱️ Duration: ${durationMs}ms (${durationSeconds}s)`);
    console.log(`[ELEGOO-SYNC] 📊 Results:`);
    console.log(`[ELEGOO-SYNC]    ➕ Created: ${result.created}`);
    console.log(`[ELEGOO-SYNC]    🔄 Updated: ${result.updated}`);
    console.log(`[ELEGOO-SYNC]    ⏭️ Skipped: ${result.skipped}`);
    console.log(`[ELEGOO-SYNC]    ❌ Errors: ${result.errors}`);
    console.log(`[ELEGOO-SYNC]    📦 Total unique products: ${productsByNormalizedTitle.size}`);
    console.log(`[ELEGOO-SYNC]    🌍 Regions synced: ${regionsToSync.join(', ')}`);
    console.log(`[ELEGOO-SYNC]    🔧 Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        syncLogId: dryRun ? null : syncLogId,
        summary: {
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          errors: result.errors,
          total: productsByNormalizedTitle.size,
          durationMs,
          regionsRequested: requestedRegions,
          regionsSynced: regionsToSync,
          catalogsUsed: availableCatalogs,
        },
        products: result.products,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[ELEGOO-SYNC] ═══════════════════════════════════════════════════════');
    console.error('[ELEGOO-SYNC] ❌ SYNC FAILED');
    console.error('[ELEGOO-SYNC] ═══════════════════════════════════════════════════════');
    console.error(`[ELEGOO-SYNC] Error: ${errorMessage}`);
    console.error(`[ELEGOO-SYNC] Duration: ${durationMs}ms`);
    if (errorStack) {
      console.error(`[ELEGOO-SYNC] Stack: ${errorStack}`);
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        durationMs,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

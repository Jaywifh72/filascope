import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { 
  extractColorFamily as sharedExtractColorFamily,
  extractWeight as sharedExtractWeight,
  extractMaterial as sharedExtractMaterial,
  generateProductLineId as sharedGenerateProductLineId,
  buildAvailableRegions,
  getRegionalFieldMapping,
  REGION_CURRENCIES as SHARED_REGION_CURRENCIES,
  type RegionCode 
} from "../_shared/filament-schema.ts";
import { 
  getColorHex, 
  getColorFamily,
  extractColorFromTitle as sharedExtractColor,
  normalizeColorName,
  getColorVariants
} from "../_shared/color-mapping.ts";
import { validateScrapedProduct } from "../_shared/scraper-validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// KNOWN CATALOG IDs from Impact.com for Elegoo
// These are the authoritative IDs - do NOT rely on dynamic discovery name parsing
// NOTE: JP does NOT have a filament catalog - Elegoo Japan store may not carry filaments
const ELEGOO_CATALOG_IDS: Record<string, string> = {
  'US': '25495',  // Elegoo Filaments Datafeed for US
  'AU': '19909',  // Elegoo Product Datafeed for AU
  'CA': '19910',  // Elegoo Product Datafeed for CA
  'EU': '19908',  // Elegoo Product Datafeed for EU
  'UK': '19907',  // Elegoo Product Datafeed for UK - NOTE: May not have filaments
  'DE': '21454',  // Elegoo Product Datafeed for DE (Germany)
  'IT': '21456',  // Elegoo Product Datafeed for Italy
  'FR': '21457',  // Elegoo Product Datafeed for FR (France)
  'ES': '21458',  // Elegoo Product Datafeed for ES (Spain)
};

// Valid regions with catalogs - JP is excluded because it has no catalog
const VALID_REGIONS = Object.keys(ELEGOO_CATALOG_IDS);

// Default fallback catalog ID
const DEFAULT_CATALOG_ID = '25495';

// Timeout protection: stop processing before edge function timeout (150s limit)
const MAX_EXECUTION_TIME_MS = 130000; // 130s to leave 20s buffer for cleanup
const MAX_PAGES_PER_REGION = 30; // Safety limit to prevent runaway fetching

// Use shared constants directly - no Elegoo-specific overrides needed
// NOTE: Removed local REGION_CURRENCIES merge to prevent redundancy
// Use SHARED_REGION_CURRENCIES directly throughout this file

// NOTE: Color aliases and COLOR_HEX_MAP have been moved to _shared/color-mapping.ts
// Use getColorHex(), getColorFamily(), getColorVariants() from that module

// Region to expected URL domain mapping for validation
const REGION_URL_DOMAINS: Record<string, string> = {
  'US': 'elegoo.com',      // Main domain (no subdomain prefix)
  'AU': 'au.elegoo.com',
  'CA': 'ca.elegoo.com',
  'EU': 'eu.elegoo.com',
  'UK': 'uk.elegoo.com',
  'JP': 'jp.elegoo.com',
  'DE': 'de.elegoo.com',
  'IT': 'it.elegoo.com',
  'FR': 'fr.elegoo.com',
  'ES': 'es.elegoo.com',
};

/**
 * Validates that a URL belongs to the expected regional store
 * Prevents cross-regional contamination (e.g., AU URLs in CA fields)
 * 
 * IMPORTANT: Impact API returns affiliate tracking URLs like:
 * https://elegoo.sjv.io/c/123/456/789?u=https%3A%2F%2Fau.elegoo.com%2Fproducts%2F...
 * We need to extract the actual store URL from the 'u' parameter for validation
 * 
 * UPDATE: We now trust catalog-based region assignment. If a product comes from the US catalog,
 * we trust its URLs are valid for US region without strict domain validation, since the catalog
 * is the authoritative source of regional data.
 */
function validateRegionalUrl(url: string | undefined, expectedRegion: string, trustCatalog: boolean = true): boolean {
  if (!url) return false;
  
  // If we trust the catalog assignment (default), accept any non-empty URL
  // The catalog ID determines the region, not the URL domain
  if (trustCatalog) {
    try {
      new URL(url); // Just validate it's a proper URL
      return true;
    } catch {
      console.warn(`[ELEGOO-SYNC] ⚠️ Invalid URL format: ${url}`);
      return false;
    }
  }
  
  // Strict validation mode (trustCatalog = false)
  const expectedDomain = REGION_URL_DOMAINS[expectedRegion];
  if (!expectedDomain) {
    console.warn(`[ELEGOO-SYNC] ⚠️ Unknown region for URL validation: ${expectedRegion}`);
    return true; // Allow if region unknown
  }
  
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname.toLowerCase();
    
    // Handle Impact affiliate tracking URLs
    // These have the actual store URL in the 'u' query parameter (URL-encoded)
    if (hostname.includes('sjv.io') || hostname.includes('impact.com')) {
      const actualUrlParam = urlObj.searchParams.get('u');
      if (actualUrlParam) {
        try {
          const decodedUrl = decodeURIComponent(actualUrlParam);
          const actualUrlObj = new URL(decodedUrl);
          hostname = actualUrlObj.hostname.toLowerCase();
        } catch {
          console.warn(`[ELEGOO-SYNC] ⚠️ Could not decode affiliate URL parameter: ${actualUrlParam}`);
          return false;
        }
      } else {
        // No 'u' parameter - could be a direct affiliate link, accept it
        console.log(`[ELEGOO-SYNC] ℹ️ Affiliate URL without 'u' parameter - accepting: ${url.substring(0, 50)}...`);
        return true;
      }
    }
    
    // For US, URL should be elegoo.com (not a regional subdomain)
    if (expectedRegion === 'US') {
      // US URLs should NOT have regional subdomains
      const isRegionalSubdomain = ['au.', 'ca.', 'eu.', 'uk.', 'jp.'].some(
        prefix => hostname.startsWith(prefix)
      );
      if (isRegionalSubdomain) {
        console.warn(`[ELEGOO-SYNC] ⚠️ Invalid US URL (has regional subdomain): ${hostname}`);
        return false;
      }
      return hostname.endsWith('elegoo.com');
    }
    
    // For regional stores, URL should have the expected subdomain
    const isValid = hostname === expectedDomain || hostname.endsWith('.' + expectedDomain);
    if (!isValid) {
      console.warn(`[ELEGOO-SYNC] ⚠️ Invalid ${expectedRegion} URL (expected ${expectedDomain}): ${hostname}`);
    }
    return isValid;
  } catch {
    console.warn(`[ELEGOO-SYNC] ⚠️ Invalid URL format: ${url}`);
    return false;
  }
}

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

type ProductType = '3D Printer' | 'Filament' | 'Accessory' | 'Unknown';

interface ProductClassification {
  type: ProductType;
  isFilament: boolean;
  reason: string;
}

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  products: {
    title: string;
    action: 'created' | 'updated' | 'skipped' | 'error' | 'filtered';
    reason?: string;
    productType?: ProductType;
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

// Get the catalog ID for a specific region
// IMPORTANT: We use hardcoded, verified catalog IDs rather than dynamic discovery
// because Impact API catalog names/metadata are unreliable for region detection
function getRegionalCatalogId(region: string): string {
  const catalogId = ELEGOO_CATALOG_IDS[region];
  if (catalogId) {
    console.log(`[ELEGOO-SYNC] 📋 Using catalog ID ${catalogId} for region ${region}`);
    return catalogId;
  }
  console.warn(`[ELEGOO-SYNC] ⚠️ No catalog ID for region ${region}, falling back to US`);
  return DEFAULT_CATALOG_ID;
}

// Get all available region catalog mappings
function getAvailableRegionalCatalogs(): Record<string, string> {
  console.log(`[ELEGOO-SYNC] 🗺️ Available catalogs: ${JSON.stringify(ELEGOO_CATALOG_IDS)}`);
  return { ...ELEGOO_CATALOG_IDS };
}

// NOTE: extractMaterialFromTitle, extractWeightFromTitle, and computeProductLineId
// have been removed - use shared helpers from filament-schema.ts instead:
// - sharedExtractMaterial(title, material)
// - sharedExtractWeight(title, defaultWeight)  
// - sharedGenerateProductLineId(vendor, material, title)

function extractDiameterFromTitle(title: string): number {
  if (title.includes('2.85') || title.includes('3mm') || title.includes('3.0mm')) {
    return 2.85;
  }
  return 1.75;
}

// Use the shared color extraction utility
function extractColorAndHex(title: string): { colorName: string | null; colorHex: string | null } {
  const { colorName, colorHex } = sharedExtractColor(title);
  return { colorName, colorHex };
}

function normalizeProductTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Classify product type: 3D Printer, Filament, Accessory, or Unknown
function classifyProductType(product: ElegooProduct): ProductClassification {
  const titleLower = product.title.toLowerCase();
  const categoryLower = (product.category || '').toLowerCase();
  
  // Check for 3D Printers first (most specific)
  const printerKeywords = [
    'printer', '3d printer',
    'saturn', 'mars', 'neptune', 'centauri', 'orangestorm', 'jupiter',
  ];
  for (const keyword of printerKeywords) {
    if (titleLower.includes(keyword)) {
      return { type: '3D Printer', isFilament: false, reason: `Matched printer keyword: "${keyword}"` };
    }
  }
  
  // Check for Accessories
  const accessoryKeywords = [
    'resin', 'lcd', 'uv resin', 'photopolymer',
    'dryer', 'dry box', 'drybox', 'dehydrator',
    'nozzle', 'hotend', 'hot end', 'extruder',
    'bed', 'build plate', 'pei', 'magnetic sheet',
    'tool', 'spatula', 'scraper', 'tweezers', 'toolkit',
    'upgrade kit', 'accessory', 'accessories',
    'wash', 'cure', 'cleaning', 'cleaner',
    'spare parts', 'replacement', 'repair kit',
    'fan', 'motor', 'cable', 'screen', 'display',
    'enclosure', 'tent', 'cover',
    'fep', 'vat', 'release liner',
    'power supply', 'adapter',
    'starter bundle', 'christmas bundle', 'fbt bundle',
    'frequently bought together',
  ];
  for (const keyword of accessoryKeywords) {
    if (titleLower.includes(keyword)) {
      return { type: 'Accessory', isFilament: false, reason: `Matched accessory keyword: "${keyword}"` };
    }
  }
  
  // Check for Filament
  const filamentKeywords = [
    'filament', 
    'pla', 'petg', 'abs', 'tpu', 'asa', 'nylon', 'pa ', 'pa-', 'pc ',
    'polycarbonate', 'hips', 'pva', 
    '1.75mm', '2.85mm', '1kg', '2kg', '500g', '250g',
    'spool', 'rapid', 'hyper', 'high speed',
  ];
  const hasFilamentKeyword = filamentKeywords.some(kw => 
    titleLower.includes(kw) || categoryLower.includes(kw)
  );
  
  if (hasFilamentKeyword) {
    return { type: 'Filament', isFilament: true, reason: 'Matched filament keywords' };
  }
  
  return { type: 'Unknown', isFilament: false, reason: 'No matching keywords found' };
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
    let excludedCatalogIds: string[] = [];
    
    try {
      const body = await req.json();
      dryRun = body.dryRun ?? true;
      materialFilter = body.materialFilter;
      requestedRegions = body.regions || ['US'];
      excludedCatalogIds = body.excludedCatalogIds || [];
      console.log('[ELEGOO-SYNC] 📝 Request parameters:');
      console.log(`[ELEGOO-SYNC]    dryRun: ${dryRun}`);
      console.log(`[ELEGOO-SYNC]    materialFilter: ${materialFilter || 'ALL'}`);
      console.log(`[ELEGOO-SYNC]    requestedRegions: ${requestedRegions.join(', ')}`);
      console.log(`[ELEGOO-SYNC]    excludedCatalogIds: ${excludedCatalogIds.length > 0 ? excludedCatalogIds.join(', ') : 'none'}`);
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
            sync_type: 'full_scrape',
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

    // === PHASE 2.5: GET ELEGOO BRAND ID ===
    console.log('[ELEGOO-SYNC] ───────────────────────────────────────────────────────');
    console.log('[ELEGOO-SYNC] 🏷️ PHASE: Fetching Elegoo brand ID');
    
    let elegooBrandId: string | null = null;
    try {
      const { data: brandData, error: brandError } = await supabase
        .from('automated_brands')
        .select('id')
        .eq('brand_slug', 'elegoo')
        .single();
      
      if (brandError) {
        console.warn('[ELEGOO-SYNC] ⚠️ Could not fetch Elegoo brand ID:', brandError.message);
      } else if (brandData) {
        elegooBrandId = brandData.id;
        console.log(`[ELEGOO-SYNC] ✅ Elegoo brand ID: ${elegooBrandId}`);
      }
    } catch (brandErr) {
      console.warn('[ELEGOO-SYNC] ⚠️ Error fetching brand ID:', brandErr);
    }

    // === PHASE 3: DISCOVER CATALOGS ===
    console.log('[ELEGOO-SYNC] ───────────────────────────────────────────────────────');
    console.log('[ELEGOO-SYNC] 🔍 PHASE: Catalog Discovery');
    
    const availableCatalogs = getAvailableRegionalCatalogs();
    console.log(`[ELEGOO-SYNC] Available catalogs: ${JSON.stringify(availableCatalogs)}`);

    // Filter to only requested regions that have catalogs (and aren't excluded)
    // IMPORTANT: Only process ONE region per invocation to avoid timeout
    const regionsToSync: string[] = [];
    for (const region of requestedRegions) {
      const catalogId = availableCatalogs[region];
      if (catalogId) {
        if (excludedCatalogIds.includes(catalogId)) {
          console.log(`[ELEGOO-SYNC] ⏭️ Region ${region} -> Catalog ${catalogId} is EXCLUDED, skipping`);
        } else {
          regionsToSync.push(region);
          console.log(`[ELEGOO-SYNC] ✅ Region ${region} -> Catalog ${catalogId}`);
        }
      } else {
        console.log(`[ELEGOO-SYNC] ⚠️ Region ${region} has no available catalog, skipping`);
      }
    }

    if (regionsToSync.length === 0) {
      console.error('[ELEGOO-SYNC] ❌ No valid regions to sync (all excluded or unavailable)!');
      throw new Error(`No catalogs available for requested regions: ${requestedRegions.join(', ')} (excluded: ${excludedCatalogIds.join(', ')})`);
    }

    // Limit to single region per invocation to prevent timeout
    if (regionsToSync.length > 1) {
      console.log(`[ELEGOO-SYNC] ⚠️ Multiple regions requested (${regionsToSync.join(', ')}), but only processing first: ${regionsToSync[0]}`);
      console.log(`[ELEGOO-SYNC] ℹ️  To sync multiple regions, call this function once per region`);
      regionsToSync.length = 1; // Keep only first region
    }

    console.log(`[ELEGOO-SYNC] 📍 Region to sync: ${regionsToSync[0]}`);

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
        // Check for timeout before each page fetch
        const elapsedMs = Date.now() - startTime;
        if (elapsedMs > MAX_EXECUTION_TIME_MS) {
          console.warn(`[ELEGOO-SYNC]    ⏰ Approaching timeout limit (${Math.round(elapsedMs/1000)}s), stopping at page ${page}`);
          console.warn(`[ELEGOO-SYNC]    ⚠️ Processed ${regionProductCount} products so far for ${region}`);
          break;
        }
        
        console.log(`[ELEGOO-SYNC]    📄 Fetching page ${page}... (${Math.round(elapsedMs/1000)}s elapsed)`);
        
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
                    currency: SHARED_REGION_CURRENCIES[region as RegionCode] || product.currency,
                  }
                }
              });
            } else {
              const existing = productsByNormalizedTitle.get(normalizedTitle)!;
              existing.regionalData[region] = {
                price: product.price,
                url: product.url,
                currency: SHARED_REGION_CURRENCIES[region as RegionCode] || product.currency,
              };
            }
          }

          hasMore = catalogData.pagination?.hasNextPage || false;
          page++;

          // Safety limit on pages per region
          if (page > MAX_PAGES_PER_REGION) {
            console.log(`[ELEGOO-SYNC]    ⚠️ Reached page limit (${MAX_PAGES_PER_REGION}), stopping pagination`);
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

    // === PHASE 5: FILTER & PROCESS PRODUCTS ===
    console.log('[ELEGOO-SYNC] ───────────────────────────────────────────────────────');
    console.log('[ELEGOO-SYNC] 🔍 PHASE: Filtering for filament products only');

    let processedCount = 0;
    let filteredCount = 0;
    
    for (const [normalizedTitle, { baseProduct, regionalData }] of productsByNormalizedTitle) {
      processedCount++;
      const product = baseProduct;
      
      // Check for timeout every 50 products during processing phase
      if (processedCount % 50 === 0) {
        const elapsedMs = Date.now() - startTime;
        if (elapsedMs > MAX_EXECUTION_TIME_MS) {
          console.warn(`[ELEGOO-SYNC] ⏰ TIMEOUT: Processed ${processedCount}/${productsByNormalizedTitle.size} products (${Math.round(elapsedMs/1000)}s)`);
          console.warn(`[ELEGOO-SYNC]    Results so far: created=${result.created}, updated=${result.updated}, skipped=${result.skipped}`);
          result.errors++;
          break; // Exit the processing loop
        }
        console.log(`[ELEGOO-SYNC] ⏱️ Progress: ${processedCount}/${productsByNormalizedTitle.size} (${Math.round(elapsedMs/1000)}s elapsed)`);
      }
      
      // Classify product type
      const classification = classifyProductType(product);
      if (!classification.isFilament) {
        filteredCount++;
        // Reduce logging verbosity for filtered products
        if (filteredCount <= 10 || filteredCount % 100 === 0) {
          console.log(`[ELEGOO-SYNC] 🚫 Filtered ${processedCount}/${productsByNormalizedTitle.size}: ${product.title}`);
          console.log(`[ELEGOO-SYNC]    Type: ${classification.type}, Reason: ${classification.reason}`);
        }
        result.products.push({
          title: product.title,
          action: 'filtered',
          productType: classification.type,
          reason: classification.reason,
          fields: { tds: false, image: false, price: false, salePrice: false, url: false, msrp: false },
          currentPrice: product.price,
          msrp: product.originalPrice || undefined,
        });
        continue;
      }
      
      try {
        // Only log details for first 20 products or every 100th to reduce logging overhead
        const shouldLogDetails = processedCount <= 20 || processedCount % 100 === 0;
        
        if (shouldLogDetails) {
          console.log(`[ELEGOO-SYNC] 📦 Filament ${processedCount}/${productsByNormalizedTitle.size}: ${product.title}`);
        }
        
        const material = product.material || sharedExtractMaterial(product.title, '');
        const weight = sharedExtractWeight(product.title, 1000);
        const diameter = extractDiameterFromTitle(product.title);
        const techSpecs = product.techSpecs;
        const { colorName, colorHex } = extractColorAndHex(product.title);
        
        // FIX: Filter out ghost variants - products without a valid color name
        // These are base product entries from Impact.com that shouldn't create DB records
        if (!colorName || colorName.toLowerCase() === 'color' || colorName === product.title.toLowerCase()) {
          console.log(`[ELEGOO-SYNC]    ⏭️ SKIPPED: Ghost variant (no valid color) - "${product.title}"`);
          result.skipped++;
          result.products.push({
            title: product.title,
            action: 'skipped',
            reason: 'Ghost variant - no valid color name',
            fields: { tds: false, image: false, price: false, salePrice: false, url: false, msrp: false },
          });
          continue;
        }
        
        // Compute product line ID early - needed for cross-region matching
        const productLineId = sharedGenerateProductLineId('elegoo', material || '', product.title);

        if (shouldLogDetails) {
          console.log(`[ELEGOO-SYNC]    Material: ${material || 'UNKNOWN'}`);
          console.log(`[ELEGOO-SYNC]    Weight: ${weight}g, Diameter: ${diameter}mm`);
          console.log(`[ELEGOO-SYNC]    Color: ${colorName || 'none'} (HEX: ${colorHex ? '#' + colorHex : 'none'})`);
          console.log(`[ELEGOO-SYNC]    Product Line: ${productLineId}`);
          console.log(`[ELEGOO-SYNC]    Regions: ${Object.keys(regionalData).join(', ')}`);
        }
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

        // Check if product already exists - USE MULTI-STRATEGY MATCHING:
        // 1. By product_id (exact same region's product)
        // 2. By product_line_id + color name (cross-region matching)
        // 3. By title (fallback for legacy data)
        // This ensures regional data is MERGED into existing products, not creating duplicates
        
        let existing: { 
          id: string; 
          product_id: string; 
          variant_price: number | null; 
          product_url: string | null; 
          updated_at: string; 
          tds_url: string | null; 
          color_hex: string | null;
          price_cad: number | null;
          price_eur: number | null;
          price_aud: number | null;
          price_gbp: number | null;
          price_jpy: number | null;
          product_url_ca: string | null;
          product_url_eu: string | null;
          product_url_au: string | null;
          product_url_uk: string | null;
          product_url_jp: string | null;
        } | null = null;
        
        // Strategy 1: First try exact product_id match (same product from same region)
        const { data: exactMatch, error: lookupError } = await supabase
          .from('filaments')
          .select('id, product_id, variant_price, product_url, updated_at, tds_url, color_hex, price_cad, price_eur, price_aud, price_gbp, price_jpy, product_url_ca, product_url_eu, product_url_au, product_url_uk, product_url_jp')
          .eq('product_id', product.productId)
          .eq('vendor', 'Elegoo')
          .maybeSingle();

        if (lookupError) {
          console.error(`[ELEGOO-SYNC]    ⚠️ Lookup error: ${lookupError.message}`);
        }
        
        if (exactMatch) {
          existing = exactMatch;
          console.log(`[ELEGOO-SYNC]    🔗 Found by product_id match (ID: ${existing.id})`);
        } else {
          // Strategy 2: Try to find by product_line_id + color name (cross-region matching)
          // This is the KEY for multi-region sync - products from different regions have different product_ids
          // but the SAME product line + color should be merged
          if (colorName) {
            // Get all color variants for matching (e.g., gray/grey)
            const colorVariants = getColorVariants(colorName);
            console.log(`[ELEGOO-SYNC]    🎨 Color matching: "${colorName}" → variants: [${colorVariants.join(', ')}]`);
            
            // Build search patterns for each color variant
            const colorSearchPatterns: string[] = [];
            for (const variant of colorVariants) {
              colorSearchPatterns.push(`% - ${variant}`);        // Standard format: "PLA - Red"
              colorSearchPatterns.push(`% - ${variant} %`);      // Color with suffix: "PLA - Red 1kg"
            }
            // Also try the original color anywhere in title as fallback
            colorSearchPatterns.push(`%${normalizeColorName(colorName)}%`);
            
            // Try each pattern until we find a match
            for (const pattern of colorSearchPatterns) {
              const { data: lineColorMatch } = await supabase
                .from('filaments')
                .select('id, product_id, variant_price, product_url, updated_at, tds_url, color_hex, price_cad, price_eur, price_aud, price_gbp, price_jpy, product_url_ca, product_url_eu, product_url_au, product_url_uk, product_url_jp, product_title')
                .eq('vendor', 'Elegoo')
                .eq('product_line_id', productLineId)
                .ilike('product_title', pattern)
                .maybeSingle();
              
              if (lineColorMatch) {
                console.log(`[ELEGOO-SYNC]    🔗 Found by product_line_id + color match (ID: ${lineColorMatch.id})`);
                console.log(`[ELEGOO-SYNC]       Line: ${productLineId}, Pattern: ${pattern}`);
                console.log(`[ELEGOO-SYNC]       Matched product: ${lineColorMatch.product_title}`);
                existing = lineColorMatch;
                break;
              }
            }
          }
          
          // Strategy 3: Try to find by normalized title (fallback for legacy data)
          if (!existing) {
            const { data: titleMatch } = await supabase
              .from('filaments')
              .select('id, product_id, variant_price, product_url, updated_at, tds_url, color_hex, price_cad, price_eur, price_aud, price_gbp, price_jpy, product_url_ca, product_url_eu, product_url_au, product_url_uk, product_url_jp')
              .eq('vendor', 'Elegoo')
              .ilike('product_title', product.title)
              .maybeSingle();
            
            if (titleMatch) {
              console.log(`[ELEGOO-SYNC]    🔗 Found existing product by title match (ID: ${titleMatch.id})`);
              existing = titleMatch;
            }
          }
        }

        if (existing?.tds_url) {
          fields.tds = true;
        }

        // Regional data is now handled directly in the filamentData build below
        // This ensures we only set fields for regions we're currently syncing
        // and preserve existing data for other regions
        
        const isCreatingNew = !existing;
        
        // If creating new product AND no regional data at all, skip
        if (isCreatingNew && Object.keys(regionalData).length === 0) {
          console.log(`[ELEGOO-SYNC]    ⏭️ SKIPPED: No valid regional data available to create base product`);
          result.skipped++;
          result.products.push({
            title: product.title,
            action: 'skipped',
            reason: 'No valid regional data available',
            fields,
            currentPrice,
            msrp,
          });
          continue;
        }

        // Build filament data - CRITICAL: Only include fields we want to update
        // For regional syncs, preserve existing data we don't have new values for
        const newImageUrl = product.imageUrl && product.imageUrl.trim() !== '' ? product.imageUrl : null;
        const shouldUpdateImage = newImageUrl && (!existing || !existing.color_hex || 
          // Only update image if we don't have one yet OR if the new image is color-specific (not generic)
          (newImageUrl.toLowerCase().includes(colorName?.toLowerCase() || 'NEVER_MATCH'))
        );
        
        const filamentData: Record<string, unknown> = {
          product_title: product.title,
          vendor: 'Elegoo',
          material,
          product_line_id: productLineId,
          variant_compare_at_price: product.compareAtPrice,
          variant_available: product.inStock,
          net_weight_g: weight,
          diameter_nominal_mm: diameter,
          auto_created: !existing, // Only true for new products
          auto_updated: true,
          last_scraped_at: new Date().toISOString(),
          sync_status: 'synced',
          regional_prices_updated_at: new Date().toISOString(),
          ...(elegooBrandId ? { brand_id: elegooBrandId } : {}),
          // Only update these if we have data - don't overwrite existing with null
          ...(product.tdsUrl ? { tds_url: product.tdsUrl } : {}),
          ...(colorHex && !existing?.color_hex ? { color_hex: colorHex } : {}), // Preserve existing color_hex
          ...(shouldUpdateImage ? { featured_image: newImageUrl } : {}),
          ...(product.mpn ? { mpn: product.mpn } : {}),
          ...(product.upc ? { upc: product.upc } : {}),
          ...(product.ean ? { ean: product.ean } : {}),
          ...(techSpecs?.nozzle_temp_min_c ? { nozzle_temp_min_c: techSpecs.nozzle_temp_min_c } : {}),
          ...(techSpecs?.nozzle_temp_max_c ? { nozzle_temp_max_c: techSpecs.nozzle_temp_max_c } : {}),
          ...(techSpecs?.bed_temp_min_c ? { bed_temp_min_c: techSpecs.bed_temp_min_c } : {}),
          ...(techSpecs?.bed_temp_max_c ? { bed_temp_max_c: techSpecs.bed_temp_max_c } : {}),
          ...(techSpecs?.density_g_cm3 ? { density_g_cm3: techSpecs.density_g_cm3 } : {}),
        };
        
        // Add product_id only for new products (don't change existing product_id)
        if (!existing) {
          filamentData.product_id = product.productId;
        }
        
        // Merge regional fields - only update fields for regions we're syncing, preserve others
        // This is CRITICAL: don't overwrite CA data when syncing EU, etc.
        if (regionalData['US']) {
          filamentData.variant_price = regionalData['US'].price;
          filamentData.product_url = regionalData['US'].url;
          console.log(`[ELEGOO-SYNC]    💵 US data: $${regionalData['US'].price}`);
        } else if (existing && existing.variant_price) {
          // Preserve existing US data when syncing other regions
          console.log(`[ELEGOO-SYNC]    💵 Preserving existing US price: $${existing.variant_price}`);
        }
        
        if (regionalData['CA']) {
          const caPrice = regionalData['CA'].price;
          const caUrl = regionalData['CA'].url;
          
          // Detect bulk products - these legitimately have different pricing ratios
          const titleLower = product.title.toLowerCase();
          const isBulkProduct = titleLower.includes('10 kg') || 
                                titleLower.includes('5 kg') ||
                                titleLower.includes('10kg') ||
                                titleLower.includes('5kg') ||
                                titleLower.includes('10x') ||
                                titleLower.includes('5x');
          
          // SMART price validation for CA:
          // - Individual products: ratio must be 1.0-2.0 (CAD is weaker than USD)
          // - Bulk products: ratio can be 0.7-2.0 (volume discounts vary by region)
          const usPrice = existing?.variant_price || regionalData['US']?.price;
          let shouldUpdateCA = true;
          let priceValidationReason = '';
          
          // Different thresholds for bulk vs individual products
          const minRatio = isBulkProduct ? 0.7 : 1.0;
          const maxRatio = 2.0;
          const productType = isBulkProduct ? 'BULK' : 'INDIVIDUAL';
          
          // Always log CA matching attempt prominently
          console.log(`[ELEGOO-SYNC] ════════════════════════════════════════════════`);
          console.log(`[ELEGOO-SYNC] 🍁 CA MATCHING for: ${product.title}`);
          console.log(`[ELEGOO-SYNC]    Product type: ${productType} (min ratio: ${minRatio})`);
          console.log(`[ELEGOO-SYNC]    Incoming CA price: $${caPrice} CAD`);
          console.log(`[ELEGOO-SYNC]    Incoming CA URL: ${caUrl}`);
          console.log(`[ELEGOO-SYNC]    Existing CA price: $${existing?.price_cad ?? 'none'} CAD`);
          console.log(`[ELEGOO-SYNC]    US reference price: $${usPrice ?? 'none'} USD`);
          
          if (usPrice && caPrice) {
            const ratio = caPrice / usPrice;
            console.log(`[ELEGOO-SYNC]    CA/US ratio: ${ratio.toFixed(3)}`);
            
            if (ratio < minRatio) {
              shouldUpdateCA = false;
              priceValidationReason = `CA price ($${caPrice}) ratio ${ratio.toFixed(2)} < ${minRatio} min for ${productType} - REJECTED`;
            } else if (ratio > maxRatio) {
              shouldUpdateCA = false;
              priceValidationReason = `CA price ($${caPrice}) ratio ${ratio.toFixed(2)} > ${maxRatio} max - REJECTED`;
            } else {
              console.log(`[ELEGOO-SYNC]    ✅ Price ratio ${ratio.toFixed(2)} is within valid range (${minRatio}-${maxRatio}) for ${productType}`);
            }
          } else if (!usPrice) {
            console.log(`[ELEGOO-SYNC]    ⚠️ No US price available for validation - accepting CA price`);
          }
          
          if (shouldUpdateCA) {
            filamentData.price_cad = caPrice;
            filamentData.product_url_ca = caUrl;
            console.log(`[ELEGOO-SYNC]    🍁 CA UPDATE APPLIED: $${caPrice} CAD ✓`);
          } else {
            console.log(`[ELEGOO-SYNC]    🚫 CA UPDATE REJECTED: ${priceValidationReason}`);
          }
          console.log(`[ELEGOO-SYNC] ════════════════════════════════════════════════`);
        }
        
        if (regionalData['AU']) {
          filamentData.price_aud = regionalData['AU'].price;
          filamentData.product_url_au = regionalData['AU'].url;
          console.log(`[ELEGOO-SYNC]    🦘 AU data: $${regionalData['AU'].price} AUD`);
        }
        
        if (regionalData['EU'] || regionalData['DE'] || regionalData['FR'] || regionalData['IT'] || regionalData['ES']) {
          // Prefer EU catalog, fall back to country-specific
          const euData = regionalData['EU'] || regionalData['DE'] || regionalData['FR'] || regionalData['IT'] || regionalData['ES'];
          if (euData) {
            filamentData.price_eur = euData.price;
            filamentData.product_url_eu = euData.url;
            console.log(`[ELEGOO-SYNC]    🇪🇺 EU data: €${euData.price}`);
          }
        }
        
        if (regionalData['UK']) {
          filamentData.price_gbp = regionalData['UK'].price;
          filamentData.product_url_uk = regionalData['UK'].url;
          console.log(`[ELEGOO-SYNC]    🇬🇧 UK data: £${regionalData['UK'].price}`);
        }
        
        if (regionalData['JP']) {
          filamentData.price_jpy = regionalData['JP'].price;
          filamentData.product_url_jp = regionalData['JP'].url;
          console.log(`[ELEGOO-SYNC]    🇯🇵 JP data: ¥${regionalData['JP'].price}`);
        }
        
        // For new products without US data, use first available price for backwards compatibility
        if (!existing && !regionalData['US']) {
          const firstRegion = Object.keys(regionalData)[0];
          if (firstRegion && regionalData[firstRegion]) {
            filamentData.variant_price = regionalData[firstRegion].price;
            console.log(`[ELEGOO-SYNC]    ⚠️ No US data - using ${firstRegion} price for variant_price: ${regionalData[firstRegion].price}`);
          }
        }

        // Build available_regions based on which regional data exists
        filamentData.available_regions = buildAvailableRegions(filamentData);
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

            // Log price change if US price is different from existing
            if (regionalData['US'] && existing.variant_price !== regionalData['US'].price) {
              console.log(`[ELEGOO-SYNC]    💰 US Price changed: ${existing.variant_price} -> ${regionalData['US'].price}`);
              await supabase.from('price_history').insert({
                filament_id: existing.id,
                price: regionalData['US'].price,
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
            status: result.errors > 0 ? 'partial' : 'completed',
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

    // === PHASE 7: TDS DISCOVERY & PARSING (BACKGROUND) ===
    if (!dryRun && (result.created > 0 || result.updated > 0)) {
      console.log('[ELEGOO-SYNC] ───────────────────────────────────────────────────────');
      console.log('[ELEGOO-SYNC] 📄 PHASE: TDS Discovery & Parsing (background)');
      
      // Find Elegoo filaments that need TDS discovery or parsing
      // Priority 1: Missing TDS URL entirely (need to discover)
      // Priority 2: Have TDS URL but missing parsed data
      const { data: needsTdsWork, error: tdsQueryError } = await supabase
        .from('filaments')
        .select('id, product_title, tds_url, product_url')
        .eq('vendor', 'Elegoo')
        .not('product_url', 'is', null)
        .or('tds_url.is.null,nozzle_temp_min_c.is.null,density_g_cm3.is.null,drying_temp_c.is.null')
        .limit(50); // Process 50 per sync - complete coverage in ~4 syncs instead of 20+
      
      if (tdsQueryError) {
        console.error('[ELEGOO-SYNC] ⚠️ Failed to query filaments for TDS work:', tdsQueryError.message);
      } else if (needsTdsWork && needsTdsWork.length > 0) {
        const needsDiscovery = needsTdsWork.filter(f => !f.tds_url);
        const needsParsing = needsTdsWork.filter(f => f.tds_url);
        console.log(`[ELEGOO-SYNC] 📋 Found ${needsTdsWork.length} filaments: ${needsDiscovery.length} need TDS discovery, ${needsParsing.length} need parsing`);
        
        // TDS Discovery and Parsing as background task
        const processTdsInBackground = async () => {
          const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
          const lovableApiKey = Deno.env.get('OPENAI_API_KEY');
          
          if (!firecrawlApiKey || !lovableApiKey) {
            console.log('[ELEGOO-SYNC] ⚠️ Missing API keys for TDS work, skipping');
            return;
          }
          
          let discovered = 0;
          let parsed = 0;
          let failed = 0;
          
          // Helper: Discover TDS URL from Elegoo product page
          const discoverTdsUrl = async (productUrl: string): Promise<string | null> => {
            try {
              // Convert affiliate URL to actual product URL if needed
              let actualUrl = productUrl;
              if (productUrl.includes('sjv.io') || productUrl.includes('impact.com')) {
                const urlObj = new URL(productUrl);
                const encodedUrl = urlObj.searchParams.get('u');
                if (encodedUrl) {
                  actualUrl = decodeURIComponent(encodedUrl);
                }
              }
              
              console.log(`[ELEGOO-SYNC] 🔍 TDS Discovery starting for: ${actualUrl}`);
              
              // First, try the product.json endpoint (faster, more reliable)
              const jsonUrl = actualUrl.replace(/\/?(\?.*)?$/, '.json');
              console.log(`[ELEGOO-SYNC] 📋 Trying product.json: ${jsonUrl}`);
              
              try {
                const jsonResponse = await fetch(jsonUrl, {
                  headers: { 'Accept': 'application/json' }
                });
                
                if (jsonResponse.ok) {
                  const productData = await jsonResponse.json();
                  console.log(`[ELEGOO-SYNC] ✓ Got product.json, checking for TDS links...`);
                  
                  // Check body_html for PDF links
                  const bodyHtml = productData.product?.body_html || '';
                  const descriptionText = productData.product?.description || '';
                  const combinedText = bodyHtml + ' ' + descriptionText;
                  
                  // Look for TDS PDF links
                  const pdfPattern = /https?:\/\/[^\s"'<>]+\.pdf/gi;
                  const pdfMatches = combinedText.match(pdfPattern);
                  
                  if (pdfMatches && pdfMatches.length > 0) {
                    // Prefer TDS-specific PDFs
                    for (const pdf of pdfMatches) {
                      const pdfLower = pdf.toLowerCase();
                      if (pdfLower.includes('tds') || pdfLower.includes('technical') || pdfLower.includes('data-sheet') || pdfLower.includes('datasheet')) {
                        console.log(`[ELEGOO-SYNC] ✅ Found TDS PDF in product.json: ${pdf}`);
                        return pdf;
                      }
                    }
                    // Return first PDF if no TDS-specific one
                    console.log(`[ELEGOO-SYNC] ✅ Found PDF in product.json: ${pdfMatches[0]}`);
                    return pdfMatches[0];
                  } else {
                    console.log(`[ELEGOO-SYNC] ⚠️ No PDF links found in product.json body_html`);
                  }
                } else {
                  console.log(`[ELEGOO-SYNC] ⚠️ product.json returned ${jsonResponse.status}`);
                }
              } catch (jsonErr) {
                console.log(`[ELEGOO-SYNC] ⚠️ product.json fetch failed:`, jsonErr);
              }
              
              // Fallback: Scrape the product page with Firecrawl
              console.log(`[ELEGOO-SYNC] 🔍 Falling back to Firecrawl scrape...`);
              
              const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${firecrawlApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: actualUrl,
                  formats: ['markdown', 'links'],
                  onlyMainContent: false,
                  waitFor: 3000,
                }),
              });
              
              if (!scrapeResponse.ok) {
                const errorText = await scrapeResponse.text();
                console.log(`[ELEGOO-SYNC] ❌ Firecrawl scrape failed: ${scrapeResponse.status} - ${errorText.substring(0, 200)}`);
                return null;
              }
              
              const scrapeData = await scrapeResponse.json();
              const links = scrapeData.data?.links || [];
              const markdown = scrapeData.data?.markdown || '';
              
              console.log(`[ELEGOO-SYNC] 📄 Firecrawl returned ${markdown.length} chars of markdown, ${links.length} links`);
              
              // Look for TDS PDF links in the page
              const tdsPatterns = [
                /https?:\/\/[^\s"'<>]+\.pdf[^\s"'<>]*/gi,
                /https?:\/\/[^\s"'<>]*tds[^\s"'<>]*\.pdf/gi,
                /https?:\/\/[^\s"'<>]*technical[^\s"'<>-]*data[^\s"'<>-]*sheet[^\s"'<>]*\.pdf/gi,
                /https?:\/\/cdn\.shopify\.com\/s\/files\/[^\s"'<>]+\.pdf/gi,
              ];
              
              // Check links array first
              console.log(`[ELEGOO-SYNC] 🔍 Checking ${links.length} links for PDFs...`);
              for (const link of links) {
                const linkUrl = typeof link === 'string' ? link : link.url || link.href;
                if (!linkUrl) continue;
                
                const linkLower = linkUrl.toLowerCase();
                if (linkLower.includes('.pdf')) {
                  console.log(`[ELEGOO-SYNC] 📄 Found PDF link: ${linkUrl}`);
                  if (linkLower.includes('tds') || linkLower.includes('technical') || linkLower.includes('data-sheet') || linkLower.includes('datasheet')) {
                    console.log(`[ELEGOO-SYNC] ✅ Found TDS link: ${linkUrl}`);
                    return linkUrl;
                  }
                }
              }
              
              // Search in markdown content
              console.log(`[ELEGOO-SYNC] 🔍 Searching markdown for PDF patterns...`);
              for (const pattern of tdsPatterns) {
                const matches = markdown.match(pattern);
                if (matches && matches.length > 0) {
                  console.log(`[ELEGOO-SYNC] 📄 Pattern found ${matches.length} PDFs`);
                  // Filter for TDS-related PDFs
                  for (const match of matches) {
                    const matchLower = match.toLowerCase();
                    if (matchLower.includes('tds') || matchLower.includes('technical') || matchLower.includes('data')) {
                      console.log(`[ELEGOO-SYNC] ✅ Found TDS in content: ${match}`);
                      return match;
                    }
                  }
                  // Return first PDF if no TDS-specific one found
                  console.log(`[ELEGOO-SYNC] ✅ Found PDF link: ${matches[0]}`);
                  return matches[0];
                }
              }
              
              console.log(`[ELEGOO-SYNC] ⚠️ No TDS/PDF found on product page`);
              console.log(`[ELEGOO-SYNC] 🔍 DEBUG: First 500 chars of markdown: ${markdown.substring(0, 500)}`);
              return null;
            } catch (err) {
              console.error(`[ELEGOO-SYNC] ❌ TDS discovery error:`, err);
              return null;
            }
          };
          
          // Helper: Parse TDS content
          const parseTdsContent = async (filamentId: string, productTitle: string, tdsUrl: string): Promise<boolean> => {
            try {
              console.log(`[ELEGOO-SYNC] 🔬 Parsing TDS: ${tdsUrl}`);
              
              const tdsResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${firecrawlApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: tdsUrl,
                  formats: ['markdown'],
                  onlyMainContent: false,
                  waitFor: 3000,
                }),
              });
              
              if (!tdsResponse.ok) {
                console.error(`[ELEGOO-SYNC] ❌ Firecrawl error for TDS`);
                return false;
              }
              
              const tdsData = await tdsResponse.json();
              const markdown = tdsData.data?.markdown || '';
              
              if (markdown.length < 100) {
                console.log(`[ELEGOO-SYNC] ⚠️ TDS content too short (${markdown.length} chars)`);
                return false;
              }
              
              // Extract TDS data with AI
              const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${lovableApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'gpt-4o-mini',
                  messages: [{
                    role: 'user',
                    content: `Extract TDS specs from this filament technical data sheet. Return JSON with these fields (null if not found):
nozzle_temp_min_c, nozzle_temp_max_c, bed_temp_min_c, bed_temp_max_c, print_speed_max_mms,
drying_temp_c, drying_time_hours, density_g_cm3, tensile_strength_xy_mpa, elongation_break_xy_percent,
flexural_strength_mpa, tg_c, melt_temp_c, is_nozzle_abrasive (boolean).
Return ONLY valid JSON.

TDS CONTENT:
${markdown.substring(0, 12000)}`
                  }],
                }),
              });
              
              if (!aiResponse.ok) {
                console.error(`[ELEGOO-SYNC] ❌ AI error`);
                return false;
              }
              
              const aiData = await aiResponse.json();
              const content = aiData.choices?.[0]?.message?.content;
              
              if (!content) return false;
              
              // Extract JSON from response
              let jsonStr = content;
              const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
              if (jsonMatch) jsonStr = jsonMatch[1];
              
              const extracted = JSON.parse(jsonStr.trim());
              
              // Update filament with extracted data
              const updateFields: Record<string, unknown> = {};
              if (extracted.nozzle_temp_min_c) updateFields.nozzle_temp_min_c = extracted.nozzle_temp_min_c;
              if (extracted.nozzle_temp_max_c) updateFields.nozzle_temp_max_c = extracted.nozzle_temp_max_c;
              if (extracted.bed_temp_min_c) updateFields.bed_temp_min_c = extracted.bed_temp_min_c;
              if (extracted.bed_temp_max_c) updateFields.bed_temp_max_c = extracted.bed_temp_max_c;
              if (extracted.print_speed_max_mms) updateFields.print_speed_max_mms = extracted.print_speed_max_mms;
              if (extracted.drying_temp_c) updateFields.drying_temp_c = extracted.drying_temp_c;
              if (extracted.drying_time_hours) updateFields.drying_time_hours = extracted.drying_time_hours;
              if (extracted.density_g_cm3) updateFields.density_g_cm3 = extracted.density_g_cm3;
              if (extracted.tensile_strength_xy_mpa) updateFields.tensile_strength_xy_mpa = extracted.tensile_strength_xy_mpa;
              if (extracted.elongation_break_xy_percent) updateFields.elongation_break_xy_percent = extracted.elongation_break_xy_percent;
              if (extracted.flexural_strength_mpa) updateFields.flexural_strength_mpa = extracted.flexural_strength_mpa;
              if (extracted.tg_c) updateFields.tg_c = extracted.tg_c;
              if (extracted.melt_temp_c) updateFields.melt_temp_c = extracted.melt_temp_c;
              if (typeof extracted.is_nozzle_abrasive === 'boolean') updateFields.is_nozzle_abrasive = extracted.is_nozzle_abrasive;
              
              if (Object.keys(updateFields).length > 0) {
                const { error: updateErr } = await supabase
                  .from('filaments')
                  .update(updateFields)
                  .eq('id', filamentId);
                
                if (updateErr) {
                  console.error(`[ELEGOO-SYNC] ❌ Update error: ${updateErr.message}`);
                  return false;
                }
                console.log(`[ELEGOO-SYNC] ✅ Parsed TDS for ${productTitle}: ${Object.keys(updateFields).length} fields`);
                return true;
              }
              return false;
            } catch (err) {
              console.error(`[ELEGOO-SYNC] ❌ TDS parsing error:`, err);
              return false;
            }
          };
          
          // Process filaments
          for (const filament of needsTdsWork) {
            try {
              let tdsUrl = filament.tds_url;
              
              // Step 1: Discover TDS URL if missing
              if (!tdsUrl && filament.product_url) {
                console.log(`[ELEGOO-SYNC] 🔍 Discovering TDS for: ${filament.product_title}`);
                tdsUrl = await discoverTdsUrl(filament.product_url);
                
                if (tdsUrl) {
                  // Save discovered TDS URL
                  const { error: saveErr } = await supabase
                    .from('filaments')
                    .update({ tds_url: tdsUrl })
                    .eq('id', filament.id);
                  
                  if (!saveErr) {
                    discovered++;
                    console.log(`[ELEGOO-SYNC] ✅ Saved TDS URL for ${filament.product_title}`);
                  }
                } else {
                  failed++;
                  continue;
                }
              }
              
              // Step 2: Parse TDS content
              if (tdsUrl) {
                const success = await parseTdsContent(filament.id, filament.product_title, tdsUrl);
                if (success) {
                  parsed++;
                } else {
                  failed++;
                }
              }
              
              // Rate limit between requests
              await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (err) {
              console.error(`[ELEGOO-SYNC] ❌ Error processing ${filament.product_title}:`, err);
              failed++;
            }
          }
          
          console.log(`[ELEGOO-SYNC] 📄 TDS work complete: ${discovered} discovered, ${parsed} parsed, ${failed} failed`);
        };
        
        // Use EdgeRuntime.waitUntil for background execution
        const edgeRuntime = (globalThis as any).EdgeRuntime;
        if (edgeRuntime && typeof edgeRuntime.waitUntil === 'function') {
          edgeRuntime.waitUntil(processTdsInBackground());
          console.log('[ELEGOO-SYNC] ⏳ TDS discovery & parsing started in background');
        } else {
          // Fallback: run async but don't block response
          processTdsInBackground().catch(err => console.error('[ELEGOO-SYNC] Background TDS error:', err));
          console.log('[ELEGOO-SYNC] ⏳ TDS discovery & parsing started (fallback mode)');
        }
      } else {
        console.log('[ELEGOO-SYNC] ✅ No filaments need TDS work');
      }
    }

    // === PHASE 8: SUMMARY ===
    console.log('[ELEGOO-SYNC] ═══════════════════════════════════════════════════════');
    console.log('[ELEGOO-SYNC] 🎉 SYNC COMPLETE');
    console.log('[ELEGOO-SYNC] ═══════════════════════════════════════════════════════');
    console.log(`[ELEGOO-SYNC] ⏱️ Duration: ${durationMs}ms (${durationSeconds}s)`);
    console.log(`[ELEGOO-SYNC] 📊 Results:`);
    console.log(`[ELEGOO-SYNC]    ➕ Created: ${result.created}`);
    console.log(`[ELEGOO-SYNC]    🔄 Updated: ${result.updated}`);
    console.log(`[ELEGOO-SYNC]    ⏭️ Skipped: ${result.skipped}`);
    console.log(`[ELEGOO-SYNC]    🚫 Filtered (non-filament): ${filteredCount}`);
    console.log(`[ELEGOO-SYNC]    ❌ Errors: ${result.errors}`);
    console.log(`[ELEGOO-SYNC]    📦 Total unique products: ${productsByNormalizedTitle.size}`);
    console.log(`[ELEGOO-SYNC]    🌍 Regions synced: ${regionsToSync.join(', ')}`);
    console.log(`[ELEGOO-SYNC]    🔧 Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`[ELEGOO-SYNC]    📄 TDS parsing: ${!dryRun && (result.created > 0 || result.updated > 0) ? 'triggered in background' : 'skipped'}`);

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        syncLogId: dryRun ? null : syncLogId,
        summary: {
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          filtered: filteredCount,
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

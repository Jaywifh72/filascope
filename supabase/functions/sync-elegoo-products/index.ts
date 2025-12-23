import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback catalog ID if dynamic discovery fails
const DEFAULT_CATALOG_ID = '25495'; // US Elegoo Filaments

// Timeout protection: stop processing before edge function timeout (150s limit)
const MAX_EXECUTION_TIME_MS = 130000; // 130s to leave 20s buffer for cleanup
const MAX_PAGES_PER_REGION = 30; // Safety limit to prevent runaway fetching

// Region to currency mapping
const REGION_CURRENCIES: Record<string, string> = {
  'US': 'USD',
  'AU': 'AUD',
  'CA': 'CAD',
  'EU': 'EUR',
  'UK': 'GBP',
  'JP': 'JPY',
};

// Color name to HEX mapping - enhanced with Elegoo-specific colors
const COLOR_HEX_MAP: Record<string, string> = {
  // Basic colors
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
  // Multi-word colors
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
  // Elegoo-specific colors (Matte, Silk, Rapid, etc.)
  'ice blue': 'B0E0E6',
  'earth brown': '5C4033',
  'lavender purple': 'B57EDC',
  'mint green': '98FF98',
  'matte black': '1A1A1A',
  'matte white': 'FAFAFA',
  'matte grey': '808080',
  'matte gray': '808080',
  'matte beige': 'D4C4A8',
  'matte red': 'B91C1C',
  'matte blue': '1D4ED8',
  'matte green': '15803D',
  'burgundy red': '800020',
  'wine red': '722F37',
  'grass green': '7CFC00',
  'army green': '4B5320',
  'lake blue': '4682B4',
  'peacock blue': '005F69',
  'sapphire blue': '0F52BA',
  'cobalt blue': '0047AB',
  'midnight blue': '191970',
  'stone grey': '928E85',
  'space grey': '4F4F4F',
  'space gray': '4F4F4F',
  'cement grey': '8D918D',
  'cement gray': '8D918D',
  'khaki': 'C3B091',
  'camel': 'C19A6B',
  'coffee': '6F4E37',
  'chocolate': 'D2691E',
  'skin': 'FFCBA4',
  'flesh': 'FFCBA4',
  'glow green': '39FF14',
  'glow blue': '00BFFF',
  'glow orange': 'FF4500',
  'rainbow': 'FF0000',
  'multicolor': 'FF0000',
  // Silk colors
  'silk white': 'FFFEF0',
  'silk black': '2D2D2D',
  'silk gold': 'FFD700',
  'silk silver': 'E8E8E8',
  'silk copper': 'DA8A67',
  'silk bronze': 'CD7F32',
  'silk red': 'DC143C',
  'silk blue': '4169E1',
  'silk green': '32CD32',
  'silk purple': '9370DB',
  'silk pink': 'FFB6C1',
  // Transparent/Translucent colors
  'translucent': 'FFFFFF',
  'translucent blue': '87CEEB',
  'translucent green': '90EE90',
  'translucent red': 'FF6B6B',
  'translucent orange': 'FFB347',
  'translucent yellow': 'FFFF99',
  'translucent purple': 'DDA0DD',
};

// Region to expected URL domain mapping for validation
const REGION_URL_DOMAINS: Record<string, string> = {
  'US': 'elegoo.com',      // Main domain (no subdomain prefix)
  'AU': 'au.elegoo.com',
  'CA': 'ca.elegoo.com',
  'EU': 'eu.elegoo.com',
  'UK': 'uk.elegoo.com',
  'JP': 'jp.elegoo.com',
};

/**
 * Validates that a URL belongs to the expected regional store
 * Prevents cross-regional contamination (e.g., AU URLs in CA fields)
 */
function validateRegionalUrl(url: string | undefined, expectedRegion: string): boolean {
  if (!url) return false;
  
  const expectedDomain = REGION_URL_DOMAINS[expectedRegion];
  if (!expectedDomain) {
    console.warn(`[ELEGOO-SYNC] ⚠️ Unknown region for URL validation: ${expectedRegion}`);
    return true; // Allow if region unknown
  }
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // For US, URL should be elegoo.com (not a regional subdomain)
    if (expectedRegion === 'US') {
      // US URLs should NOT have regional subdomains
      const isRegionalSubdomain = ['au.', 'ca.', 'eu.', 'uk.', 'jp.'].some(
        prefix => hostname.startsWith(prefix)
      );
      if (isRegionalSubdomain) {
        console.warn(`[ELEGOO-SYNC] ⚠️ Invalid US URL (has regional subdomain): ${url}`);
        return false;
      }
      return hostname.endsWith('elegoo.com');
    }
    
    // For regional stores, URL should have the expected subdomain
    const isValid = hostname === expectedDomain || hostname.endsWith('.' + expectedDomain);
    if (!isValid) {
      console.warn(`[ELEGOO-SYNC] ⚠️ Invalid ${expectedRegion} URL (expected ${expectedDomain}): ${url}`);
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
  
  // Pattern 1: "Product - Color" format (most common for Elegoo)
  const dashMatch = title.match(/\s-\s([^-]+)$/);
  if (dashMatch) {
    const colorPart = dashMatch[1].trim().toLowerCase();
    // Clean out weight/size specs from color part
    const cleanColor = colorPart.replace(/\d+(?:\.\d+)?(?:kg|g|mm)/gi, '').trim();
    
    // Try exact match first
    if (COLOR_HEX_MAP[cleanColor]) {
      return { colorName: cleanColor, colorHex: COLOR_HEX_MAP[cleanColor] };
    }
    
    // Try multi-word color match (longest first for accuracy)
    const sortedColors = Object.keys(COLOR_HEX_MAP).sort((a, b) => b.length - a.length);
    for (const colorName of sortedColors) {
      if (cleanColor.includes(colorName)) {
        return { colorName: cleanColor, colorHex: COLOR_HEX_MAP[colorName] };
      }
    }
    
    // Return color name even if no HEX match found
    return { colorName: cleanColor, colorHex: null };
  }
  
  // Pattern 2: Check for color words anywhere in title (longest first)
  const sortedColors = Object.keys(COLOR_HEX_MAP).sort((a, b) => b.length - a.length);
  for (const colorName of sortedColors) {
    if (titleLower.includes(colorName)) {
      return { colorName, colorHex: COLOR_HEX_MAP[colorName] };
    }
  }
  
  return { colorName: null, colorHex: null };
}

// Compute a product line ID for grouping color variants
// e.g., "PLA Matte - Beige" and "PLA Matte - Black" -> "elegoo-pla-matte"
function computeProductLineId(vendor: string, title: string, material: string | null): string {
  // Remove color suffix (after last dash)
  let baseName = title.replace(/\s-\s[^-]+$/, '').trim();
  
  // Remove weight specifications
  baseName = baseName.replace(/\s*\d+(?:\.\d+)?(?:kg|g)\s*/gi, '').trim();
  
  // Remove diameter specifications
  baseName = baseName.replace(/\s*\d+(?:\.\d+)?mm\s*/gi, '').trim();
  
  // Remove parenthetical content like "(1kg)" or "(NFC)"
  baseName = baseName.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  
  // Normalize: lowercase, replace spaces with dashes, remove special chars
  const normalized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const vendorSlug = vendor.toLowerCase().replace(/\s+/g, '-');
  
  return `${vendorSlug}-${normalized}`;
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

    // === PHASE 3: DISCOVER CATALOGS ===
    console.log('[ELEGOO-SYNC] ───────────────────────────────────────────────────────');
    console.log('[ELEGOO-SYNC] 🔍 PHASE: Catalog Discovery');
    
    const availableCatalogs = await discoverRegionalCatalogs(supabase, supabaseUrl, supabaseServiceKey);
    console.log(`[ELEGOO-SYNC] Available catalogs: ${JSON.stringify(availableCatalogs)}`);

    // Filter to only requested regions that have catalogs
    // IMPORTANT: Only process ONE region per invocation to avoid timeout
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
        
        const material = product.material || extractMaterialFromTitle(product.title);
        const weight = extractWeightFromTitle(product.title);
        const diameter = extractDiameterFromTitle(product.title);
        const techSpecs = product.techSpecs;
        const { colorName, colorHex } = extractColorAndHex(product.title);

        if (shouldLogDetails) {
          console.log(`[ELEGOO-SYNC]    Material: ${material || 'UNKNOWN'}`);
          console.log(`[ELEGOO-SYNC]    Weight: ${weight}g, Diameter: ${diameter}mm`);
          console.log(`[ELEGOO-SYNC]    Color: ${colorName || 'none'} (HEX: ${colorHex ? '#' + colorHex : 'none'})`);
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

        // Check if product already exists by product_id OR by matching title
        // This helps merge regional data into existing US products
        let existing: { id: string; product_id: string; variant_price: number | null; product_url: string | null; updated_at: string; tds_url: string | null; color_hex: string | null } | null = null;
        
        // First try exact product_id match
        const { data: exactMatch, error: lookupError } = await supabase
          .from('filaments')
          .select('id, product_id, variant_price, product_url, updated_at, tds_url, color_hex')
          .eq('product_id', product.productId)
          .eq('vendor', 'Elegoo')
          .maybeSingle();

        if (lookupError) {
          console.error(`[ELEGOO-SYNC]    ⚠️ Lookup error: ${lookupError.message}`);
        }
        
        if (exactMatch) {
          existing = exactMatch;
        } else {
          // Try to find by normalized title (for cross-region matching)
          const { data: titleMatch } = await supabase
            .from('filaments')
            .select('id, product_id, variant_price, product_url, updated_at, tds_url, color_hex')
            .eq('vendor', 'Elegoo')
            .ilike('product_title', product.title)
            .maybeSingle();
          
          if (titleMatch) {
            console.log(`[ELEGOO-SYNC]    🔗 Found existing product by title match (ID: ${titleMatch.id})`);
            existing = titleMatch;
          }
        }

        if (existing?.tds_url) {
          fields.tds = true;
        }

        // Build regional price and URL fields with validation to prevent cross-contamination
        const regionalFields: Record<string, unknown> = {};
        
        if (regionalData['AU']) {
          if (validateRegionalUrl(regionalData['AU'].url, 'AU')) {
            regionalFields.price_aud = regionalData['AU'].price;
            regionalFields.product_url_au = regionalData['AU'].url;
          } else {
            console.log(`[ELEGOO-SYNC]    ⚠️ Rejected invalid AU URL: ${regionalData['AU'].url}`);
          }
        }
        if (regionalData['CA']) {
          if (validateRegionalUrl(regionalData['CA'].url, 'CA')) {
            regionalFields.price_cad = regionalData['CA'].price;
            regionalFields.product_url_ca = regionalData['CA'].url;
          } else {
            console.log(`[ELEGOO-SYNC]    ⚠️ Rejected invalid CA URL: ${regionalData['CA'].url}`);
          }
        }
        if (regionalData['EU']) {
          if (validateRegionalUrl(regionalData['EU'].url, 'EU')) {
            regionalFields.price_eur = regionalData['EU'].price;
            regionalFields.product_url_eu = regionalData['EU'].url;
          } else {
            console.log(`[ELEGOO-SYNC]    ⚠️ Rejected invalid EU URL: ${regionalData['EU'].url}`);
          }
        }
        if (regionalData['UK']) {
          if (validateRegionalUrl(regionalData['UK'].url, 'UK')) {
            regionalFields.price_gbp = regionalData['UK'].price;
            regionalFields.product_url_uk = regionalData['UK'].url;
          } else {
            console.log(`[ELEGOO-SYNC]    ⚠️ Rejected invalid UK URL: ${regionalData['UK'].url}`);
          }
        }
        if (regionalData['JP']) {
          if (validateRegionalUrl(regionalData['JP'].url, 'JP')) {
            regionalFields.price_jpy = regionalData['JP'].price;
            regionalFields.product_url_jp = regionalData['JP'].url;
          } else {
            console.log(`[ELEGOO-SYNC]    ⚠️ Rejected invalid JP URL: ${regionalData['JP'].url}`);
          }
        }

        // Compute product line ID for grouping color variants
        const productLineId = computeProductLineId('Elegoo', product.title, material);
        console.log(`[ELEGOO-SYNC]    Product Line ID: ${productLineId}`);

        // CRITICAL: Determine if we have US data
        const hasUSData = Boolean(regionalData['US']?.price && regionalData['US']?.url);
        const isCreatingNew = !existing;
        
        // If creating new product AND no US data available, skip
        // This prevents creating products with regional URLs in the base product_url field
        if (isCreatingNew && !hasUSData) {
          console.log(`[ELEGOO-SYNC]    ⏭️ SKIPPED: No US data available, cannot create base product`);
          console.log(`[ELEGOO-SYNC]       To sync this product, run US region sync first to create the base product`);
          result.skipped++;
          result.products.push({
            title: product.title,
            action: 'skipped',
            reason: 'No US data - sync US region first to create base product',
            fields,
            currentPrice,
            msrp,
          });
          continue;
        }

        // Build filament data - ONLY use US data for base price/url fields
        const filamentData: Record<string, unknown> = {
          product_id: product.productId,
          product_title: product.title,
          vendor: 'Elegoo',
          material,
          product_line_id: productLineId,
          variant_compare_at_price: product.compareAtPrice,
          variant_available: product.inStock,
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
        
        // ONLY set base product_url and variant_price from US data
        // Never overwrite with regional data
        if (hasUSData) {
          filamentData.variant_price = regionalData['US']!.price;
          filamentData.product_url = regionalData['US']!.url;
          console.log(`[ELEGOO-SYNC]    💵 US data: $${regionalData['US']!.price}, URL: ${regionalData['US']!.url?.substring(0, 50)}...`);
        } else if (existing) {
          // Updating existing product without US data - preserve existing base values
          console.log(`[ELEGOO-SYNC]    ℹ️ No US data in this sync - preserving existing base price/url`);
          // Don't include variant_price or product_url in the update - they'll be preserved
        }

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

            // Log US price change if different (only when we have US data)
            if (hasUSData && existing.variant_price !== regionalData['US']!.price) {
              console.log(`[ELEGOO-SYNC]    💰 US Price changed: $${existing.variant_price} -> $${regionalData['US']!.price}`);
              await supabase.from('price_history').insert({
                filament_id: existing.id,
                price: regionalData['US']!.price,
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
    console.log(`[ELEGOO-SYNC]    🚫 Filtered (non-filament): ${filteredCount}`);
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

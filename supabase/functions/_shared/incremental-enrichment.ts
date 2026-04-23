/**
 * INCREMENTAL ENRICHMENT PIPELINE v2
 * 
 * Only fills missing fields. Never overwrites existing data (unless --force).
 * Tracks which fields were updated and enrichment sources.
 */

import { 
  detectFilamentGaps, 
  type FilamentGaps, 
  type FieldGap 
} from './field-gap-detector.ts';

import {
  getBrandProfile,
  type BrandProfile,
  type FieldExtractionRule
} from './brand-profile-system.ts';

// Import new extractors
import {
  generateAmazonAffiliateLink,
  extractAsinFromUrl,
  extractAffiliateTag,
  matchFilamentToAmazon,
  generateAllRegionalLinks
} from './amazon-extractor.ts';

import {
  extractTdsProperties
} from './tds-extractor.ts';

import {
  extractRegionalPrices,
  calculateRegionalPrice,
  calculateAllRegionalPrices,
  extractRegionalUrls,
  generateRegionalUrl,
  generateAllRegionalUrls,
  extractRegionalData
} from './regional-extractor.ts';

import {
  calculateFilascopeScore,
  calculateEaseOfPrintingScore,
  calculateDimensionalAccuracyScore,
  calculatePrintabilityIndex,
  calculateValueScore,
  calculateAllScores
} from './scoring-calculator.ts';

// ============================================================================
// ENRICHMENT INTERFACES
// ============================================================================

export interface EnrichmentResult {
  filament_id: string;
  fields_attempted: number;
  fields_updated: number;
  fields_failed: number;
  fields_skipped: number;
  sources_used: Record<string, string>;
  errors: Array<{ field: string; error: string }>;
  timestamp: string;
  duration_ms: number;
}

export interface BatchEnrichmentResult {
  brand_slug: string;
  total_filaments: number;
  filaments_processed: number;
  filaments_skipped: number;
  total_fields_attempted: number;
  total_fields_updated: number;
  total_fields_failed: number;
  average_fields_per_filament: number;
  duration_ms: number;
  timestamp: string;
  results: EnrichmentResult[];
}

export interface EnrichmentOptions {
  mode: 'incremental' | 'refresh' | 'force';
  max_priority: 'P0' | 'P1' | 'P2' | 'P3';
  max_filaments?: number;
  max_fields_per_filament?: number;
  dry_run: boolean;
  force_update: boolean;
  skip_existing: boolean;
  rate_limit_ms: number;
}

// ============================================================================
// ENRICHMENT PIPELINE
// ============================================================================

/**
 * Enrich a single filament
 */
export async function enrichFilament(
  filament: any,
  brandProfile: BrandProfile,
  supabase: any,
  options: EnrichmentOptions
): Promise<EnrichmentResult> {
  const startTime = Date.now();
  const result: EnrichmentResult = {
    filament_id: filament.id,
    fields_attempted: 0,
    fields_updated: 0,
    fields_failed: 0,
    fields_skipped: 0,
    sources_used: {},
    errors: [],
    timestamp: new Date().toISOString(),
    duration_ms: 0
  };
  
  // Detect gaps
  const gaps = detectFilamentGaps(filament);
  
  // Filter gaps by priority
  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const maxPriorityValue = priorityOrder[options.max_priority];
  
  const filteredGaps = gaps.gaps.filter(gap => 
    priorityOrder[gap.priority] <= maxPriorityValue
  );
  
  // Limit fields per filament if specified
  const gapsToProcess = options.max_fields_per_filament
    ? filteredGaps.slice(0, options.max_fields_per_filament)
    : filteredGaps;
  
  // Process each gap
  for (const gap of gapsToProcess) {
    result.fields_attempted++;
    
    // Skip if field already has value (unless force mode)
    if (!options.force_update && filament[gap.field] !== null && filament[gap.field] !== undefined) {
      result.fields_skipped++;
      continue;
    }
    
    // Skip if dry run
    if (options.dry_run) {
      result.fields_skipped++;
      continue;
    }
    
    try {
      // Extract value from appropriate source
      const value = await extractFieldValue(gap, filament, brandProfile, supabase);
      
      if (value !== null && value !== undefined) {
        // Update database
        const updateSuccess = await updateFilamentField(
          filament.id,
          gap.field,
          value,
          supabase
        );
        
        if (updateSuccess) {
          result.fields_updated++;
          result.sources_used[gap.field] = gap.source;
        } else {
          result.fields_failed++;
          result.errors.push({
            field: gap.field,
            error: 'Database update failed'
          });
        }
      } else {
        result.fields_failed++;
        result.errors.push({
          field: gap.field,
          error: 'Extraction returned null'
        });
      }
    } catch (error) {
      result.fields_failed++;
      result.errors.push({
        field: gap.field,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Rate limiting
    if (options.rate_limit_ms > 0) {
      await new Promise(resolve => setTimeout(resolve, options.rate_limit_ms));
    }
  }

  // Calculate and save scores
  if (!options.dry_run) {
    const scores = calculateAllScores(filament);
    
    for (const scoreResult of scores) {
      if (scoreResult.value !== null && scoreResult.value !== undefined) {
        // Update database with score
        const updateSuccess = await updateFilamentField(
          filament.id,
          scoreResult.field,
          scoreResult.value,
          supabase
        );
        
        if (updateSuccess) {
          result.fields_updated++;
          result.sources_used[scoreResult.field] = 'calculated';
        } else {
          result.fields_failed++;
          result.errors.push({
            field: scoreResult.field,
            error: 'Failed to save score to database'
          });
        }
      }
    }
  }
  
  result.duration_ms = Date.now() - startTime;
  return result;
}

/**
 * Enrich multiple filaments for a brand
 */
export async function enrichBrandFilaments(
  brandSlug: string,
  filaments: any[],
  supabase: any,
  options: EnrichmentOptions
): Promise<BatchEnrichmentResult> {
  const startTime = Date.now();
  const brandProfile = getBrandProfile(brandSlug);
  
  const result: BatchEnrichmentResult = {
    brand_slug: brandSlug,
    total_filaments: filaments.length,
    filaments_processed: 0,
    filaments_skipped: 0,
    total_fields_attempted: 0,
    total_fields_updated: 0,
    total_fields_failed: 0,
    average_fields_per_filament: 0,
    duration_ms: 0,
    timestamp: new Date().toISOString(),
    results: []
  };
  
  // Limit filaments if specified
  const filamentsToProcess = options.max_filaments
    ? filaments.slice(0, options.max_filaments)
    : filaments;
  
  // Process each filament
  for (const filament of filamentsToProcess) {
    // Skip if no gaps (unless force mode)
    if (options.skip_existing) {
      const gaps = detectFilamentGaps(filament);
      if (gaps.missing_fields === 0) {
        result.filaments_skipped++;
        continue;
      }
    }
    
    const filamentResult = await enrichFilament(
      filament,
      brandProfile,
      supabase,
      options
    );
    
    result.results.push(filamentResult);
    result.filaments_processed++;
    result.total_fields_attempted += filamentResult.fields_attempted;
    result.total_fields_updated += filamentResult.fields_updated;
    result.total_fields_failed += filamentResult.fields_failed;
    
    // Rate limiting between filaments
    if (options.rate_limit_ms > 0) {
      await new Promise(resolve => setTimeout(resolve, options.rate_limit_ms));
    }
  }
  
  // Calculate average
  result.average_fields_per_filament = result.filaments_processed > 0
    ? Math.round(result.total_fields_attempted / result.filaments_processed * 10) / 10
    : 0;
  
  result.duration_ms = Date.now() - startTime;
  return result;
}

/**
 * Extract field value from appropriate source
 */
async function extractFieldValue(
  gap: FieldGap,
  filament: any,
  brandProfile: BrandProfile,
  supabase: any
): Promise<any> {
  // Get extraction rule for this field
  const rules = brandProfile.field_extraction_rules.filter(r => r.field === gap.field);
  
  if (rules.length === 0) {
    // No extraction rule found, try to use default extraction
    return await extractFieldDefault(gap, filament, brandProfile);
  }
  
  // Use the rule with highest confidence
  const rule = rules.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
  
  // Extract based on source
  switch (rule.source) {
    case 'api':
      return await extractFromApi(rule, filament, brandProfile);
    case 'scrape':
      return await extractFromScrape(rule, filament, brandProfile);
    case 'tds':
      return await extractFromTds(rule, filament, brandProfile);
    case 'amazon':
      return await extractFromAmazon(rule, filament, brandProfile);
    case 'calculate':
      return await extractFromCalculate(rule, filament, brandProfile);
    case 'manual':
      return await extractFromManual(rule, filament, brandProfile);
    case 'amazon':
      return await extractFromAmazon(rule, filament, brandProfile);
    
    case 'tds':
      return await extractFromTds(rule, filament, brandProfile);
    
    case 'regional':
      return await extractFromRegional(rule, filament, brandProfile);
    
    case 'calculate':
      return await extractFromCalculate(rule, filament, brandProfile);
    
    case 'manual':
      return await extractFromManual(rule, filament, brandProfile);
    
    default:
      return null;
  }
}

/**
 * Extract from Shopify API (ACTUAL IMPLEMENTATION)
 */
async function extractFromApi(
  rule: FieldExtractionRule,
  filament: any,
  brandProfile: BrandProfile
): Promise<any> {
  // Get product URL from filament
  const productUrl = filament.product_url;
  if (!productUrl) {
    console.log(`[API] No product URL for filament ${filament.id}`);
    return null;
  }
  
  // Extract handle from URL
  const urlMatch = productUrl.match(/\/products\/([^\/\?]+)/);
  if (!urlMatch) {
    console.log(`[API] Could not extract handle from URL: ${productUrl}`);
    return null;
  }
  
  const handle = urlMatch[1];
  
  try {
    // Fetch product from Shopify API
    const apiUrl = `${brandProfile.base_url}/products/${handle}.json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'FilaScope/1.0 (+https://filascope.com/)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.log(`[API] Failed to fetch product: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    if (!data.product) {
      console.log(`[API] No product data in response`);
      return null;
    }
    
    // Extract field using rule
    const fieldPath = rule.api_field || '';
    if (!fieldPath) {
      console.log(`[API] No api_field specified for ${rule.field}`);
      return null;
    }
    
    // Navigate field path (e.g., "variants[0].price")
    let value = data.product;
    const pathParts = fieldPath.split('.');
    
    for (const part of pathParts) {
      if (part.includes('[')) {
        // Array access
        const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
        if (arrayMatch) {
          const arrayName = arrayMatch[1];
          const index = parseInt(arrayMatch[2], 10);
          value = value?.[arrayName]?.[index];
        }
      } else {
        value = value?.[part];
      }
      
      if (value === undefined || value === null) {
        console.log(`[API] Field path ${fieldPath} not found in product`);
        return null;
      }
    }
    
    // Apply transformation if specified
    if (rule.transform && value !== null) {
      value = applyTransformation(value, rule.transform, data.product);
    }
    
    return value;
    
  } catch (error) {
    console.error(`[API] Error extracting ${rule.field}:`, error);
    return null;
  }
}

/**
 * Apply transformation to extracted value
 */
function applyTransformation(value: any, transform: string, product: any): any {
  switch (transform) {
    case 'extractColor':
      return extractColorFromTags(product.tags || []);
    case 'extractFinish':
      return extractFinishFromTags(product.tags || []);
    case 'weightToGrams':
      return convertWeightToGrams(value, product.variants?.[0]?.weight_unit || 'g');
    case 'extractTempRange':
      return extractTemperatureFromHtml(product.body_html || '', 'nozzle');
    case 'extractNumber':
      return parseFloat(value);
    case 'extractBoolean':
      return value === 'true' || value === true || value === '1' || value === 1;
    default:
      return value;
  }
}

/**
 * Extract from product page scraping (ACTUAL IMPLEMENTATION with Firecrawl)
 */
async function extractFromScrape(
  rule: FieldExtractionRule,
  filament: any,
  brandProfile: BrandProfile
): Promise<any> {
  // Get product URL from filament
  const productUrl = filament.product_url;
  if (!productUrl) {
    console.log(`[SCRAPE] No product URL for filament ${filament.id}`);
    return null;
  }
  
  // Load Firecrawl API key from environment
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlApiKey) {
    console.log(`[SCRAPE] FIRECRAWL_API_KEY not set`);
    return null;
  }
  
  try {
    // Call Firecrawl API
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 5000,
      }),
    });
    
    if (!response.ok) {
      console.log(`[SCRAPE] Firecrawl API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    if (!data.success || !data.data?.markdown) {
      console.log(`[SCRAPE] Failed to extract content from ${productUrl}`);
      return null;
    }
    
    const content = data.data.markdown;
    
    // Extract field using rule
    const selector = rule.selector || '';
    const transform = rule.transform || '';
    
    // Extract based on field type
    switch (rule.field) {
      case 'nozzle_temp_min_c':
      case 'nozzle_temp_max_c':
        return extractTemperatureFromContent(content, 'nozzle');
      
      case 'bed_temp_min_c':
      case 'bed_temp_max_c':
        return extractTemperatureFromContent(content, 'bed');
      
      case 'density_g_cm3':
        return extractDensityFromContent(content);
      
      case 'print_speed_max_mms':
        return extractPrintSpeedFromContent(content);
      
      case 'color_hex':
        return extractColorHexFromContent(content);
      
      case 'spool_ams_fit':
        return extractAmsCompatibilityFromContent(content);
      
      case 'moisture_sensitivity_level':
        return extractMoistureSensitivityFromContent(content);
      
      default:
        // Try generic extraction
        if (selector) {
          return extractBySelectorFromContent(content, selector, transform);
        }
        return null;
    }
    
  } catch (error) {
    console.error(`[SCRAPE] Error extracting ${rule.field}:`, error);
    return null;
  }
}

/**
 * Extract temperature from content
 */
function extractTemperatureFromContent(content: string, type: 'nozzle' | 'bed'): { min: number; max: number } | null {
  const contentLower = content.toLowerCase();
  const typeLower = type.toLowerCase();
  
  const patterns = [
    new RegExp(`${typeLower}[\\s:]*(?:temperature)?[\\s:]*(\\d+)\\s*[-–]\\s*(\\d+)\\s*°?\\s*[Cc]?`, 'i'),
    new RegExp(`${typeLower}[\\s:]*(\\d+)\\s*[-–]\\s*(\\d+)`, 'i'),
    new RegExp(`${typeLower}[\\s:]*(\\d+)\\s*°?\\s*[Cc]?`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      if (match[2]) {
        const min = parseInt(match[1], 10);
        const max = parseInt(match[2], 10);
        if (min >= 0 && max >= min && max <= 400) {
          return { min, max };
        }
      } else {
        const temp = parseInt(match[1], 10);
        if (temp >= 0 && temp <= 400) {
          return { min: temp, max: temp };
        }
      }
    }
  }
  
  return null;
}

/**
 * Extract density from content
 */
function extractDensityFromContent(content: string): number | null {
  const match = content.match(/density[\s:]*(\d+\.?\d*)\s*g\/cm[³3]?/i) ||
                content.match(/(\d+\.?\d*)\s*g\/cm[³3]?/i);
  
  if (match) {
    const density = parseFloat(match[1]);
    if (density >= 0.5 && density <= 3) {
      return density;
    }
  }
  
  return null;
}

/**
 * Extract print speed from content
 */
function extractPrintSpeedFromContent(content: string): number | null {
  const match = content.match(/speed[\s:]*(\d+)\s*mm\/s/i) ||
                content.match(/(\d+)\s*mm\/s/i);
  
  if (match) {
    const speed = parseInt(match[1], 10);
    if (speed >= 10 && speed <= 500) {
      return speed;
    }
  }
  
  return null;
}

/**
 * Extract color hex from content
 */
function extractColorHexFromContent(content: string): string | null {
  const match = content.match(/#([0-9a-f]{6})/i);
  if (match) {
    return `#${match[1].toUpperCase()}`;
  }
  return null;
}

/**
 * Extract AMS compatibility from content
 */
function extractAmsCompatibilityFromContent(content: string): boolean | null {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('ams') || contentLower.includes('automatic material system')) {
    if (contentLower.includes('compatible') || contentLower.includes('works with') || contentLower.includes('supports')) {
      return true;
    }
    if (contentLower.includes('not compatible') || contentLower.includes('does not work') || contentLower.includes('not supported')) {
      return false;
    }
    return true;
  }
  
  return null;
}

/**
 * Extract moisture sensitivity from content
 */
function extractMoistureSensitivityFromContent(content: string): string | null {
  const contentLower = content.toLowerCase();
  
  const match = contentLower.match(/moisture[\s-]*(?:sensitivity)?[\s:]*(\d)/i) ||
                contentLower.match(/msl[\s:]*(\d)/i);
  
  if (match) {
    const level = parseInt(match[1], 10);
    if (level >= 1 && level <= 5) {
      return level.toString();
    }
  }
  
  return null;
}

/**
 * Extract by selector from content (placeholder)
 */
function extractBySelectorFromContent(content: string, selector: string, transform: string): any {
  // This would require HTML parsing
  // For now, return null
  console.log(`[SCRAPE] Selector extraction not implemented: ${selector}`);
  return null;
}

/**
 * Extract from TDS sheets
 */
async function extractFromTds(
  rule: FieldExtractionRule,
  filament: any,
  brandProfile: BrandProfile
): Promise<any> {
  // This is a placeholder - actual implementation would parse TDS PDFs
  console.log(`[TDS] Would extract ${rule.field} from TDS sheet`);
  return null;
}

/**
 * Extract from Amazon PA-API
 */
async function extractFromAmazon(
  rule: FieldExtractionRule,
  filament: any,
  brandProfile: BrandProfile
): Promise<any> {
  // This is a placeholder - actual implementation would call Amazon PA-API
  console.log(`[AMAZON] Would extract ${rule.field} from Amazon`);
  return null;
}

/**
 * Calculate field value
 */
async function extractFromCalculate(
  rule: FieldExtractionRule,
  filament: any,
  brandProfile: BrandProfile
): Promise<any> {
  // This is a placeholder - actual implementation would calculate scores
  console.log(`[CALCULATE] Would calculate ${rule.field}`);
  return null;
}

/**
 * Manual extraction (placeholder)
 */
async function extractFromManual(
  rule: FieldExtractionRule,
  filament: any,
  brandProfile: BrandProfile
): Promise<any> {
  // This is a placeholder - actual implementation would handle manual data
  console.log(`[MANUAL] Would extract ${rule.field} manually`);
  return null;
}

/**
 * Default extraction when no rule exists
 */
/**
 * Extract Amazon affiliate links
 */
async function extractFromRegional(
  rule: FieldExtractionRule,
  filament: any,
  brandProfile: BrandProfile
): Promise<any> {
  const field = rule.field;
  
  // Check if filament has base price
  const basePrice = filament.variant_price;
  if (!basePrice || basePrice <= 0) {
    console.log(`[REGIONAL] No base price for filament ${filament.id}`);
    return null;
  }
  
  // Calculate regional price
  if (field.startsWith('price_')) {
    const region = field.replace('price_', '').toUpperCase();
    const price = calculateRegionalPrice(basePrice, region, filament.vendor);
    return price?.price || null;
  }
  
  // Generate regional URL
  if (field.startsWith('product_url_')) {
    const region = field.replace('product_url_', '').toUpperCase();
    const baseUrl = filament.product_url;
    if (baseUrl) {
      const url = generateRegionalUrl(baseUrl, region, brandProfile.brand_slug);
      return url;
    }
  }
  
  return null;
}

/**
 * Calculate scoring fields
 */
async function extractFieldDefault(
  gap: FieldGap,
  filament: any,
  brandProfile: BrandProfile
): Promise<any> {
  // Try to extract based on field type
  switch (gap.field) {
    case 'color_hex':
      return extractColorHex(filament);
    case 'material':
      return extractMaterial(filament);
    case 'net_weight_g':
      return extractWeight(filament);
    case 'diameter_nominal_mm':
      return 1.75; // Default for most filaments
    case 'amazon':
      return await extractFromAmazon(rule, filament, brandProfile);
    
    case 'tds':
      return await extractFromTds(rule, filament, brandProfile);
    
    case 'regional':
      return await extractFromRegional(rule, filament, brandProfile);
    
    case 'calculate':
      return await extractFromCalculate(rule, filament, brandProfile);
    
    case 'manual':
      return await extractFromManual(rule, filament, brandProfile);
    
    default:
      return null;
  }
}

/**
 * Extract color hex from filament data
 */
function extractColorHex(filament: any): string | null {
  // Try to extract from color_family
  if (filament.color_family) {
    const colorMap: Record<string, string> = {
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#00FF00',
      'yellow': '#FFFF00',
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#808080',
      'grey': '#808080',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'gold': '#FFD700',
      'silver': '#C0C0C0'
    };
    
    const colorLower = filament.color_family.toLowerCase();
    return colorMap[colorLower] || null;
  }
  
  return null;
}

/**
 * Extract material from filament data
 */
function extractMaterial(filament: any): string | null {
  // Try to extract from product title
  if (filament.product_title) {
    const title = filament.product_title.toLowerCase();
    
    if (title.includes('pla')) return 'PLA';
    if (title.includes('petg')) return 'PETG';
    if (title.includes('abs')) return 'ABS';
    if (title.includes('tpu')) return 'TPU';
    if (title.includes('nylon')) return 'Nylon';
    if (title.includes('asa')) return 'ASA';
    if (title.includes('pc')) return 'PC';
    if (title.includes('hips')) return 'HIPS';
  }
  
  return null;
}

/**
 * Extract weight from filament data
 */
function extractWeight(filament: any): number | null {
  // Try to extract from product title
  if (filament.product_title) {
    const title = filament.product_title.toLowerCase();
    
    // Match patterns like "1kg", "1 kg", "1000g", "1000 g"
    const kgMatch = title.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (kgMatch) {
      return Math.round(parseFloat(kgMatch[1]) * 1000);
    }
    
    const gMatch = title.match(/(\d+(?:\.\d+)?)\s*g/i);
    if (gMatch) {
      return Math.round(parseFloat(gMatch[1]));
    }
  }
  
  return null;
}

/**
 * Update filament field in database
 */
async function updateFilamentField(
  filamentId: string,
  field: string,
  value: any,
  supabase: any
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('filaments')
      .update({
        [field]: value,
        last_scraped_at: new Date().toISOString(),
        sync_status: 'enriched'
      })
      .eq('id', filamentId);
    
    return !error;
  } catch (error) {
    console.error(`Error updating filament ${filamentId}.${field}:`, error);
    return false;
  }
}

/**
 * Print enrichment result
 */
export function printEnrichmentResult(result: EnrichmentResult): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`ENRICHMENT RESULT: ${result.filament_id}`);
  console.log(`${'='.repeat(60)}`);
  
  console.log(`\n📊 Summary:`);
  console.log(`  Fields attempted: ${result.fields_attempted}`);
  console.log(`  Fields updated: ${result.fields_updated}`);
  console.log(`  Fields failed: ${result.fields_failed}`);
  console.log(`  Fields skipped: ${result.fields_skipped}`);
  console.log(`  Duration: ${result.duration_ms}ms`);
  
  if (Object.keys(result.sources_used).length > 0) {
    console.log(`\n✅ Sources used:`);
    for (const [field, source] of Object.entries(result.sources_used)) {
      console.log(`  ${field}: ${source}`);
    }
  }
  
  if (result.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    for (const error of result.errors.slice(0, 5)) {
      console.log(`  ${error.field}: ${error.error}`);
    }
    if (result.errors.length > 5) {
      console.log(`  ... and ${result.errors.length - 5} more errors`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}\n`);
}

/**
 * Print batch enrichment result
 */
export function printBatchEnrichmentResult(result: BatchEnrichmentResult): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`BATCH ENRICHMENT RESULT: ${result.brand_slug}`);
  console.log(`${'='.repeat(80)}`);
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total filaments: ${result.total_filaments}`);
  console.log(`  Filaments processed: ${result.filaments_processed}`);
  console.log(`  Filaments skipped: ${result.filaments_skipped}`);
  console.log(`  Total fields attempted: ${result.total_fields_attempted}`);
  console.log(`  Total fields updated: ${result.total_fields_updated}`);
  console.log(`  Total fields failed: ${result.total_fields_failed}`);
  console.log(`  Average fields per filament: ${result.average_fields_per_filament}`);
  console.log(`  Duration: ${result.duration_ms}ms`);
  console.log(`  Timestamp: ${result.timestamp}`);
  
  // Show top updated fields
  const fieldUpdateCounts: Record<string, number> = {};
  for (const r of result.results) {
    for (const field of Object.keys(r.sources_used)) {
      fieldUpdateCounts[field] = (fieldUpdateCounts[field] || 0) + 1;
    }
  }
  
  if (Object.keys(fieldUpdateCounts).length > 0) {
    console.log(`\n✅ Top updated fields:`);
    const sortedFields = Object.entries(fieldUpdateCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    
    for (const [field, count] of sortedFields) {
      console.log(`  ${field}: ${count} filaments`);
    }
  }
  
  console.log(`\n${'='.repeat(80)}\n`);
}

console.log(`✅ Incremental Enrichment Pipeline loaded`);
console.log(`   Modes: incremental, refresh, force`);
console.log(`   Priority levels: P0, P1, P2, P3`);

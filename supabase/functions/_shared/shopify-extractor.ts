/**
 * SHOPIFY API EXTRACTOR v2
 * 
 * Extracts basic product data from Shopify JSON API.
 * Handles pagination, rate limiting, and field mapping.
 */

import { getBrandProfile, type BrandProfile, type DataSource } from './brand-profile-system.ts';

// ============================================================================
// SHOPIFY API INTERFACES
// ============================================================================

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: ShopifyOption[];
  body_html?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price?: string;
  sku?: string;
  available: boolean;
  weight?: number;
  weight_unit?: string;
  image_id?: number;
  image?: ShopifyImage;
  option1?: string;
  option2?: string;
  option3?: string;
}

export interface ShopifyImage {
  id: number;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ShopifyOption {
  id: number;
  name: string;
  values: string[];
}

export interface ShopifyApiResponse {
  products: ShopifyProduct[];
}

export interface ExtractionResult {
  field: string;
  value: any;
  source: string;
  confidence: number;
  raw_value?: any;
}

// ============================================================================
// SHOPIFY API EXTRACTOR
// ============================================================================

/**
 * Extract all available fields from Shopify product
 */
export function extractShopifyFields(product: ShopifyProduct, brandProfile: BrandProfile): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Basic identity fields
  results.push(...extractBasicFields(product, brandProfile));
  
  // Variant fields
  if (product.variants && product.variants.length > 0) {
    results.push(...extractVariantFields(product.variants[0], brandProfile));
  }
  
  // Image fields
  if (product.images && product.images.length > 0) {
    results.push(...extractImageFields(product.images[0], brandProfile));
  }
  
  // Tag-based fields
  results.push(...extractTagFields(product.tags, brandProfile));
  
  // Option-based fields
  if (product.options) {
    results.push(...extractOptionFields(product.options, brandProfile));
  }
  
  // Metafield extraction (if available in body_html)
  if (product.body_html) {
    results.push(...extractMetafieldFields(product.body_html, brandProfile));
  }
  
  return results;
}

/**
 * Extract basic identity fields
 */
function extractBasicFields(product: ShopifyProduct, brandProfile: BrandProfile): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Product ID
  results.push({
    field: 'product_id',
    value: product.id.toString(),
    source: 'shopify_api',
    confidence: 1.0,
    raw_value: product.id
  });
  
  // Product title
  results.push({
    field: 'product_title',
    value: product.title,
    source: 'shopify_api',
    confidence: 1.0,
    raw_value: product.title
  });
  
  // Product handle
  results.push({
    field: 'product_handle',
    value: product.handle,
    source: 'shopify_api',
    confidence: 1.0,
    raw_value: product.handle
  });
  
  // Vendor
  results.push({
    field: 'vendor',
    value: product.vendor,
    source: 'shopify_api',
    confidence: 1.0,
    raw_value: product.vendor
  });
  
  // Material (product type)
  if (product.product_type) {
    results.push({
      field: 'material',
      value: normalizeMaterial(product.product_type),
      source: 'shopify_api',
      confidence: 0.9,
      raw_value: product.product_type
    });
  }
  
  // Product URL
  const baseUrl = brandProfile.base_url.replace(/\/$/, '');
  results.push({
    field: 'product_url',
    value: `${baseUrl}/products/${product.handle}`,
    source: 'shopify_api',
    confidence: 1.0,
    raw_value: `${baseUrl}/products/${product.handle}`
  });
  
  // Display name
  results.push({
    field: 'display_name',
    value: cleanDisplayName(product.title, product.vendor),
    source: 'shopify_api',
    confidence: 0.9,
    raw_value: product.title
  });
  
  return results;
}

/**
 * Extract variant fields
 */
function extractVariantFields(variant: ShopifyVariant, brandProfile: BrandProfile): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Variant price
  if (variant.price) {
    const price = parseFloat(variant.price);
    if (!isNaN(price)) {
      results.push({
        field: 'variant_price',
        value: price,
        source: 'shopify_api',
        confidence: 1.0,
        raw_value: variant.price
      });
    }
  }
  
  // Compare at price
  if (variant.compare_at_price) {
    const comparePrice = parseFloat(variant.compare_at_price);
    if (!isNaN(comparePrice)) {
      results.push({
        field: 'variant_compare_at_price',
        value: comparePrice,
        source: 'shopify_api',
        confidence: 1.0,
        raw_value: variant.compare_at_price
      });
    }
  }
  
  // Variant SKU
  if (variant.sku) {
    results.push({
      field: 'variant_sku',
      value: variant.sku,
      source: 'shopify_api',
      confidence: 1.0,
      raw_value: variant.sku
    });
  }
  
  // Variant available
  results.push({
    field: 'variant_available',
    value: variant.available,
    source: 'shopify_api',
    confidence: 1.0,
    raw_value: variant.available
  });
  
  // Net weight
  if (variant.weight && variant.weight_unit) {
    const weightGrams = convertWeightToGrams(variant.weight, variant.weight_unit);
    if (weightGrams > 0) {
      results.push({
        field: 'net_weight_g',
        value: weightGrams,
        source: 'shopify_api',
        confidence: 0.8,
        raw_value: `${variant.weight} ${variant.weight_unit}`
      });
    }
  }
  
  // Variant image
  if (variant.image) {
    results.push({
      field: 'variant_image',
      value: variant.image.src,
      source: 'shopify_api',
      confidence: 1.0,
      raw_value: variant.image.src
    });
  }
  
  // Extract material from variant title
  const materialFromTitle = extractMaterialFromTitle(variant.title);
  if (materialFromTitle) {
    results.push({
      field: 'material',
      value: materialFromTitle,
      source: 'shopify_api',
      confidence: 0.7,
      raw_value: variant.title
    });
  }
  
  return results;
}

/**
 * Extract image fields
 */
function extractImageFields(image: ShopifyImage, brandProfile: BrandProfile): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Featured image
  results.push({
    field: 'featured_image',
    value: image.src,
    source: 'shopify_api',
    confidence: 1.0,
    raw_value: image.src
  });
  
  // Variant image (if different from featured)
  if (image.id) {
    results.push({
      field: 'variant_image',
      value: image.src,
      source: 'shopify_api',
      confidence: 0.9,
      raw_value: image.src
    });
  }
  
  return results;
}

/**
 * Extract fields from tags
 */
function extractTagFields(tags: string[], brandProfile: BrandProfile): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  if (!tags || tags.length === 0) return results;
  
  // Color family from tags
  const color = extractColorFromTags(tags);
  if (color) {
    results.push({
      field: 'color_family',
      value: color,
      source: 'shopify_api',
      confidence: 0.8,
      raw_value: tags
    });
  }
  
  // Finish type from tags
  const finish = extractFinishFromTags(tags);
  if (finish) {
    results.push({
      field: 'finish_type',
      value: finish,
      source: 'shopify_api',
      confidence: 0.7,
      raw_value: tags
    });
  }
  
  // Material from tags
  const material = extractMaterialFromTags(tags);
  if (material) {
    results.push({
      field: 'material',
      value: material,
      source: 'shopify_api',
      confidence: 0.8,
      raw_value: tags
    });
  }
  
  // Use case tags
  const useCases = extractUseCaseTags(tags);
  if (useCases.length > 0) {
    results.push({
      field: 'use_case_tags',
      value: useCases,
      source: 'shopify_api',
      confidence: 0.6,
      raw_value: tags
    });
  }
  
  // High speed capable
  const highSpeed = extractHighSpeedFromTags(tags);
  if (highSpeed !== null) {
    results.push({
      field: 'high_speed_capable',
      value: highSpeed,
      source: 'shopify_api',
      confidence: 0.7,
      raw_value: tags
    });
  }
  
  // Abrasive nozzle
  const abrasive = extractAbrasiveFromTags(tags);
  if (abrasive !== null) {
    results.push({
      field: 'is_nozzle_abrasive',
      value: abrasive,
      source: 'shopify_api',
      confidence: 0.7,
      raw_value: tags
    });
  }
  
  return results;
}

/**
 * Extract fields from product options
 */
function extractOptionFields(options: ShopifyOption[], brandProfile: BrandProfile): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  for (const option of options) {
    const nameLower = option.name.toLowerCase();
    
    // Diameter from options
    if (nameLower.includes('diameter') || nameLower.includes('size')) {
      const diameter = extractDiameterFromOption(option);
      if (diameter) {
        results.push({
          field: 'diameter_nominal_mm',
          value: diameter,
          source: 'shopify_api',
          confidence: 0.8,
          raw_value: option.values
        });
      }
    }
    
    // Weight from options
    if (nameLower.includes('weight') || nameLower.includes('size')) {
      const weight = extractWeightFromOption(option);
      if (weight) {
        results.push({
          field: 'net_weight_g',
          value: weight,
          source: 'shopify_api',
          confidence: 0.7,
          raw_value: option.values
        });
      }
    }
    
    // Material from options
    if (nameLower.includes('material') || nameLower.includes('type')) {
      const material = extractMaterialFromOption(option);
      if (material) {
        results.push({
          field: 'material',
          value: material,
          source: 'shopify_api',
          confidence: 0.8,
          raw_value: option.values
        });
      }
    }
  }
  
  return results;
}

/**
 * Extract metafields from body_html
 */
function extractMetafieldFields(bodyHtml: string, brandProfile: BrandProfile): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Temperature extraction
  const nozzleTemp = extractTemperatureFromHtml(bodyHtml, 'nozzle');
  if (nozzleTemp) {
    results.push({
      field: 'nozzle_temp_min_c',
      value: nozzleTemp.min,
      source: 'shopify_api',
      confidence: 0.6,
      raw_value: nozzleTemp.raw
    });
    results.push({
      field: 'nozzle_temp_max_c',
      value: nozzleTemp.max,
      source: 'shopify_api',
      confidence: 0.6,
      raw_value: nozzleTemp.raw
    });
  }
  
  const bedTemp = extractTemperatureFromHtml(bodyHtml, 'bed');
  if (bedTemp) {
    results.push({
      field: 'bed_temp_min_c',
      value: bedTemp.min,
      source: 'shopify_api',
      confidence: 0.6,
      raw_value: bedTemp.raw
    });
    results.push({
      field: 'bed_temp_max_c',
      value: bedTemp.max,
      source: 'shopify_api',
      confidence: 0.6,
      raw_value: bedTemp.raw
    });
  }
  
  // Density extraction
  const density = extractDensityFromHtml(bodyHtml);
  if (density) {
    results.push({
      field: 'density_g_cm3',
      value: density,
      source: 'shopify_api',
      confidence: 0.5,
      raw_value: bodyHtml
    });
  }
  
  // Print speed extraction
  const printSpeed = extractPrintSpeedFromHtml(bodyHtml);
  if (printSpeed) {
    results.push({
      field: 'print_speed_max_mms',
      value: printSpeed,
      source: 'shopify_api',
      confidence: 0.5,
      raw_value: bodyHtml
    });
  }
  
  // AMS compatibility
  const amsCompatible = extractAmsCompatibility(bodyHtml);
  if (amsCompatible !== null) {
    results.push({
      field: 'spool_ams_fit',
      value: amsCompatible,
      source: 'shopify_api',
      confidence: 0.7,
      raw_value: bodyHtml
    });
  }
  
  return results;
}

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize material name
 */
function normalizeMaterial(material: string): string {
  if (!material) return '';
  
  const materialLower = material.toLowerCase().trim();
  
  // Common material mappings
  const materialMap: Record<string, string> = {
    'pla': 'PLA',
    'pla+': 'PLA+',
    'pla plus': 'PLA+',
    'petg': 'PETG',
    'pet-g': 'PETG',
    'abs': 'ABS',
    'tpu': 'TPU',
    'nylon': 'Nylon',
    'pa': 'Nylon',
    'pc': 'PC',
    'asa': 'ASA',
    'hips': 'HIPS',
    'pva': 'PVA',
    'peek': 'PEEK',
    'pei': 'PEI',
    'ultem': 'Ultem',
    'pekk': 'PEKK',
    'carbon fiber': 'Carbon Fiber',
    'glass fiber': 'Glass Fiber',
    'wood': 'Wood',
    'metal': 'Metal',
    'silk': 'Silk',
    'matte': 'Matte',
    'glow': 'Glow',
    'magnetic': 'Magnetic',
    'conductive': 'Conductive',
    'flexible': 'Flexible',
    'rigid': 'Rigid',
    'high temp': 'High Temp',
    'engineering': 'Engineering',
    'composite': 'Composite',
    'specialty': 'Specialty'
  };
  
  // Check for exact matches
  for (const [key, value] of Object.entries(materialMap)) {
    if (materialLower === key || materialLower.includes(key)) {
      return value;
    }
  }
  
  // Return original if no match
  return material;
}

/**
 * Clean display name
 */
function cleanDisplayName(title: string, vendor: string): string {
  if (!title) return '';
  
  // Remove vendor from title if it's at the beginning
  let cleaned = title;
  if (vendor && cleaned.toLowerCase().startsWith(vendor.toLowerCase())) {
    cleaned = cleaned.slice(vendor.length).trim();
  }
  
  // Remove common prefixes/suffixes
  cleaned = cleaned
    .replace(/^3d\s*printer\s*/i, '')
    .replace(/filament/i, '')
    .replace(/spool/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned || title;
}

/**
 * Convert weight to grams
 */
function convertWeightToGrams(weight: number, unit: string): number {
  if (!weight || weight <= 0) return 0;
  
  const unitLower = unit.toLowerCase();
  
  if (unitLower === 'kg' || unitLower === 'kilograms') {
    return Math.round(weight * 1000);
  } else if (unitLower === 'g' || unitLower === 'grams') {
    return Math.round(weight);
  } else if (unitLower === 'lb' || unitLower === 'lbs' || unitLower === 'pounds') {
    return Math.round(weight * 453.592);
  } else if (unitLower === 'oz' || unitLower === 'ounces') {
    return Math.round(weight * 28.3495);
  }
  
  // Default: assume grams if <= 10, else assume kg
  return weight <= 10 ? Math.round(weight * 1000) : Math.round(weight);
}

/**
 * Extract material from variant title
 */
function extractMaterialFromTitle(title: string): string | null {
  if (!title) return null;
  
  const titleLower = title.toLowerCase();
  
  // Check for material keywords
  const materialKeywords = [
    'pla', 'petg', 'abs', 'tpu', 'nylon', 'pa', 'pc', 'asa', 'hips',
    'silk', 'matte', 'glow', 'carbon', 'glass', 'wood', 'metal'
  ];
  
  for (const keyword of materialKeywords) {
    if (titleLower.includes(keyword)) {
      return normalizeMaterial(keyword);
    }
  }
  
  return null;
}

/**
 * Extract color from tags
 */
function extractColorFromTags(tags: string[]): string | null {
  if (!tags || tags.length === 0) return null;
  
  const colorKeywords = [
    'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey',
    'orange', 'purple', 'pink', 'brown', 'gold', 'silver', 'bronze',
    'cyan', 'magenta', 'lime', 'teal', 'navy', 'maroon', 'olive',
    'aqua', 'fuchsia', 'coral', 'salmon', 'turquoise', 'violet',
    'indigo', 'crimson', 'burgundy', 'beige', 'ivory', 'cream'
  ];
  
  for (const tag of tags) {
    const tagLower = tag.toLowerCase().trim();
    
    // Check for exact color matches
    for (const color of colorKeywords) {
      if (tagLower === color || tagLower.includes(color)) {
        return color.charAt(0).toUpperCase() + color.slice(1);
      }
    }
    
    // Check for color patterns
    if (tagLower.match(/^[a-z]+$/i) && tagLower.length <= 15) {
      // Might be a color name
      const knownColors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey'];
      if (knownColors.includes(tagLower)) {
        return tagLower.charAt(0).toUpperCase() + tagLower.slice(1);
      }
    }
  }
  
  return null;
}

/**
 * Extract finish type from tags
 */
function extractFinishFromTags(tags: string[]): string | null {
  if (!tags || tags.length === 0) return null;
  
  const finishKeywords = ['matte', 'glossy', 'silk', 'metallic', 'shiny', 'sparkle', 'glitter'];
  
  for (const tag of tags) {
    const tagLower = tag.toLowerCase().trim();
    
    for (const finish of finishKeywords) {
      if (tagLower === finish || tagLower.includes(finish)) {
        return finish.charAt(0).toUpperCase() + finish.slice(1);
      }
    }
  }
  
  return null;
}

/**
 * Extract material from tags
 */
function extractMaterialFromTags(tags: string[]): string | null {
  if (!tags || tags.length === 0) return null;
  
  const materialKeywords = [
    'pla', 'petg', 'abs', 'tpu', 'nylon', 'pa', 'pc', 'asa', 'hips',
    'carbon fiber', 'glass fiber', 'wood', 'metal', 'composite'
  ];
  
  for (const tag of tags) {
    const tagLower = tag.toLowerCase().trim();
    
    for (const material of materialKeywords) {
      if (tagLower === material || tagLower.includes(material)) {
        return normalizeMaterial(material);
      }
    }
  }
  
  return null;
}

/**
 * Extract use case tags
 */
function extractUseCaseTags(tags: string[]): string[] {
  if (!tags || tags.length === 0) return [];
  
  const useCaseKeywords = [
    'outdoor', 'indoor', 'food safe', 'medical', 'automotive', 'aerospace',
    'marine', 'industrial', 'hobby', 'prototype', 'art', 'jewelry',
    'functional', 'decorative', 'educational', 'professional'
  ];
  
  const useCases: string[] = [];
  
  for (const tag of tags) {
    const tagLower = tag.toLowerCase().trim();
    
    for (const useCase of useCaseKeywords) {
      if (tagLower === useCase || tagLower.includes(useCase)) {
        useCases.push(useCase.charAt(0).toUpperCase() + useCase.slice(1));
      }
    }
  }
  
  return [...new Set(useCases)]; // Remove duplicates
}

/**
 * Extract high speed capability from tags
 */
function extractHighSpeedFromTags(tags: string[]): boolean | null {
  if (!tags || tags.length === 0) return null;
  
  const highSpeedKeywords = ['high speed', 'fast', 'rapid', 'speed', 'hs'];
  
  for (const tag of tags) {
    const tagLower = tag.toLowerCase().trim();
    
    for (const keyword of highSpeedKeywords) {
      if (tagLower === keyword || tagLower.includes(keyword)) {
        return true;
      }
    }
  }
  
  return null;
}

/**
 * Extract abrasive nozzle from tags
 */
function extractAbrasiveFromTags(tags: string[]): boolean | null {
  if (!tags || tags.length === 0) return null;
  
  const abrasiveKeywords = ['abrasive', 'carbon', 'glass', 'fiber', 'reinforced', 'filled'];
  
  for (const tag of tags) {
    const tagLower = tag.toLowerCase().trim();
    
    for (const keyword of abrasiveKeywords) {
      if (tagLower === keyword || tagLower.includes(keyword)) {
        return true;
      }
    }
  }
  
  return null;
}

/**
 * Extract diameter from option
 */
function extractDiameterFromOption(option: ShopifyOption): number | null {
  if (!option.values || option.values.length === 0) return null;
  
  for (const value of option.values) {
    const valueLower = value.toLowerCase();
    
    // Match patterns like "1.75mm", "2.85mm", "1.75"
    const diameterMatch = valueLower.match(/(\d+\.?\d*)\s*mm/);
    if (diameterMatch) {
      const diameter = parseFloat(diameterMatch[1]);
      if (diameter >= 0.5 && diameter <= 5) { // Reasonable range
        return diameter;
      }
    }
    
    // Match bare numbers
    const numMatch = valueLower.match(/^(\d+\.?\d*)$/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      if (num >= 0.5 && num <= 5) {
        return num;
      }
    }
  }
  
  return null;
}

/**
 * Extract weight from option
 */
function extractWeightFromOption(option: ShopifyOption): number | null {
  if (!option.values || option.values.length === 0) return null;
  
  for (const value of option.values) {
    const valueLower = value.toLowerCase();
    
    // Match patterns like "1kg", "1 kg", "1000g", "1000 g"
    const kgMatch = valueLower.match(/(\d+\.?\d*)\s*kg/);
    if (kgMatch) {
      return Math.round(parseFloat(kgMatch[1]) * 1000);
    }
    
    const gMatch = valueLower.match(/(\d+\.?\d*)\s*g/);
    if (gMatch) {
      return Math.round(parseFloat(gMatch[1]));
    }
    
    // Match bare numbers (assume grams if <= 10, else kg)
    const numMatch = valueLower.match(/^(\d+\.?\d*)$/);
    if (numMatch) {
      const num = parseFloat(numMatch[1]);
      return num <= 10 ? Math.round(num * 1000) : Math.round(num);
    }
  }
  
  return null;
}

/**
 * Extract material from option
 */
function extractMaterialFromOption(option: ShopifyOption): string | null {
  if (!option.values || option.values.length === 0) return null;
  
  for (const value of option.values) {
    const material = normalizeMaterial(value);
    if (material && material !== value) {
      return material;
    }
  }
  
  return null;
}

/**
 * Extract temperature from HTML
 */
function extractTemperatureFromHtml(html: string, type: 'nozzle' | 'bed'): { min: number; max: number; raw: string } | null {
  if (!html) return null;
  
  const typeLower = type.toLowerCase();
  const patterns = [
    // "Nozzle: 200-220°C" or "Nozzle Temperature: 200-220°C"
    new RegExp(`${typeLower}[\\s:]*(?:temperature)?[\\s:]*(\\d+)\\s*[-–]\\s*(\\d+)\\s*°?\\s*[Cc]?`, 'i'),
    // "Nozzle: 200°C to 220°C"
    new RegExp(`${typeLower}[\\s:]*(?:temperature)?[\\s:]*(\\d+)\\s*(?:°?\\s*[Cc])?\\s+to\\s+(\\d+)\\s*°?\\s*[Cc]?`, 'i'),
    // "Nozzle: 200-220"
    new RegExp(`${typeLower}[\\s:]*(\\d+)\\s*[-–]\\s*(\\d+)`, 'i'),
    // "Nozzle: 200°C"
    new RegExp(`${typeLower}[\\s:]*(\\d+)\\s*°?\\s*[Cc]?`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      if (match[2]) {
        // Range
        const min = parseInt(match[1], 10);
        const max = parseInt(match[2], 10);
        if (min >= 0 && max >= min && max <= 400) {
          return { min, max, raw: match[0] };
        }
      } else {
        // Single value
        const temp = parseInt(match[1], 10);
        if (temp >= 0 && temp <= 400) {
          return { min: temp, max: temp, raw: match[0] };
        }
      }
    }
  }
  
  return null;
}

/**
 * Extract density from HTML
 */
function extractDensityFromHtml(html: string): number | null {
  if (!html) return null;
  
  // Match patterns like "Density: 1.24 g/cm³" or "1.24 g/cm3"
  const densityMatch = html.match(/density[\\s:]*(\d+\.?\d*)\s*g\/cm[³3]/i);
  if (densityMatch) {
    const density = parseFloat(densityMatch[1]);
    if (density >= 0.5 && density <= 3) { // Reasonable range
      return density;
    }
  }
  
  // Match bare numbers near "density" keyword
  const bareMatch = html.match(/density[\\s:]*(\d+\.?\d*)/i);
  if (bareMatch) {
    const density = parseFloat(bareMatch[1]);
    if (density >= 0.5 && density <= 3) {
      return density;
    }
  }
  
  return null;
}

/**
 * Extract print speed from HTML
 */
function extractPrintSpeedFromHtml(html: string): number | null {
  if (!html) return null;
  
  // Match patterns like "Print Speed: 60mm/s" or "Speed: 60 mm/s"
  const speedMatch = html.match(/(?:print[\\s-]?)?speed[\\s:]*(\d+)\s*mm\/s/i);
  if (speedMatch) {
    const speed = parseInt(speedMatch[1], 10);
    if (speed >= 10 && speed <= 500) { // Reasonable range
      return speed;
    }
  }
  
  return null;
}

/**
 * Extract AMS compatibility from HTML
 */
function extractAmsCompatibility(html: string): boolean | null {
  if (!html) return null;
  
  const htmlLower = html.toLowerCase();
  
  // Check for AMS compatibility mentions
  if (htmlLower.includes('ams') || htmlLower.includes('automatic material system')) {
    // Check for positive mentions
    if (htmlLower.includes('compatible') || htmlLower.includes('works with') || htmlLower.includes('supports')) {
      return true;
    }
    // Check for negative mentions
    if (htmlLower.includes('not compatible') || htmlLower.includes('does not work') || htmlLower.includes('not supported')) {
      return false;
    }
    // Default to true if AMS mentioned without negative context
    return true;
  }
  
  return null;
}

/**
 * Fetch products from Shopify API with pagination
 */
export async function fetchShopifyProducts(
  baseUrl: string,
  apiEndpoint: string = '/products.json',
  maxPages: number = 10,
  pageSize: number = 250
): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;
  let hasMore = true;
  
  console.log(`[SHOPIFY] Fetching products from ${baseUrl}${apiEndpoint}`);
  
  while (hasMore && page <= maxPages) {
    const url = `${baseUrl}${apiEndpoint}?limit=${pageSize}&page=${page}`;
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FilaScope/1.0 (+https://filascope.com/)',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        console.warn(`[SHOPIFY] API returned ${response.status} for page ${page}`);
        break;
      }
      
      const data: ShopifyApiResponse = await response.json();
      
      if (!data.products || data.products.length === 0) {
        hasMore = false;
        break;
      }
      
      allProducts.push(...data.products);
      console.log(`[SHOPIFY] Page ${page}: fetched ${data.products.length} products, total: ${allProducts.length}`);
      
      if (data.products.length < pageSize) {
        hasMore = false;
      } else {
        page++;
        // Rate limiting: 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`[SHOPIFY] Error fetching page ${page}:`, error);
      break;
    }
  }
  
  console.log(`[SHOPIFY] Total products fetched: ${allProducts.length}`);
  return allProducts;
}

/**
 * Match Shopify product to existing filament
 */
export function matchShopifyProductToFilament(
  product: ShopifyProduct,
  existingFilaments: any[]
): any | null {
  if (!existingFilaments || existingFilaments.length === 0) return null;
  
  // Try to match by product_id
  const byProductId = existingFilaments.find(f => 
    f.product_id === product.id.toString()
  );
  if (byProductId) return byProductId;
  
  // Try to match by product_handle
  const byHandle = existingFilaments.find(f => 
    f.product_handle === product.handle
  );
  if (byHandle) return byHandle;
  
  // Try to match by title + vendor
  const byTitleVendor = existingFilaments.find(f => 
    f.product_title?.toLowerCase() === product.title.toLowerCase() &&
    f.vendor?.toLowerCase() === product.vendor.toLowerCase()
  );
  if (byTitleVendor) return byTitleVendor;
  
  // Try to match by SKU
  if (product.variants && product.variants.length > 0) {
    const sku = product.variants[0].sku;
    if (sku) {
      const bySku = existingFilaments.find(f => 
        f.variant_sku === sku
      );
      if (bySku) return bySku;
    }
  }
  
  return null;
}

console.log(`✅ Shopify API Extractor loaded`);
console.log(`   Fields extracted: 25+`);
console.log(`   Supports pagination: Yes`);
console.log(`   Rate limiting: 500ms between requests`);

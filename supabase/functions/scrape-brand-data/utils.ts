export const DEFAULT_USER_AGENT = "Mozilla/5.0 (compatible; FilaScope/1.0; +https://filascope.com)";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Attempt ${attempt + 1}/${maxRetries} failed: ${lastError.message}`);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("All retries failed");
}

export function extractPrice(text: string): number | null {
  if (!text) return null;

  // Common price patterns
  const patterns = [
    /\$\s*([\d,]+\.?\d*)/,        // $29.99
    /USD\s*([\d,]+\.?\d*)/i,      // USD 29.99
    /([\d,]+\.?\d*)\s*USD/i,      // 29.99 USD
    /€\s*([\d,]+\.?\d*)/,         // €29.99
    /EUR\s*([\d,]+\.?\d*)/i,      // EUR 29.99
    /([\d,]+\.?\d*)\s*€/,         // 29.99€
    /£\s*([\d,]+\.?\d*)/,         // £29.99
    /price["\s:]+\s*([\d,]+\.?\d*)/i, // price: 29.99
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(price) && price > 0 && price < 10000) {
        return price;
      }
    }
  }

  return null;
}

export function extractAvailability(html: string): boolean {
  const outOfStockPatterns = [
    /out\s*of\s*stock/i,
    /sold\s*out/i,
    /unavailable/i,
    /currently\s*unavailable/i,
    /"availability":\s*"OutOfStock"/i,
    /"inStock":\s*false/i,
  ];

  const inStockPatterns = [
    /in\s*stock/i,
    /add\s*to\s*cart/i,
    /"availability":\s*"InStock"/i,
    /"inStock":\s*true/i,
  ];

  for (const pattern of outOfStockPatterns) {
    if (pattern.test(html)) {
      return false;
    }
  }

  for (const pattern of inStockPatterns) {
    if (pattern.test(html)) {
      return true;
    }
  }

  return true; // Default to available
}

export function convertCurrency(price: number, exchangeRate: number): number {
  return Math.round(price * exchangeRate * 100) / 100;
}

export function calculateHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function cleanProductTitle(title: string): string {
  return title
    .replace(/\s+/g, " ")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .trim();
}

// ============================================================================
// INTELLIGENT TITLE CLEANING - Extract meaningful product names from bloated titles
// ============================================================================

// ============================================================================
// DATA EXTRACTION FROM TITLE - Extract weight/pack info before cleaning
// ============================================================================

export interface ExtractedTitleData {
  netWeightG: number | null;
  packQuantity: number | null;
  cleanedTitle: string;
}

/**
 * Extract intelligent data from product title before cleaning
 * Handles patterns like [MOQ: 6KG], 3KG Large Spool, 10KG Bulk, etc.
 */
export function extractDataFromTitle(title: string): ExtractedTitleData {
  let cleanedTitle = title;
  let netWeightG: number | null = null;
  let packQuantity: number | null = null;
  
  // Pattern 1: [MOQ: XKG] format (Sunlu style)
  const moqMatch = title.match(/\[MOQ:\s*(\d+(?:\.\d+)?)\s*KG\]/i);
  if (moqMatch) {
    netWeightG = Math.round(parseFloat(moqMatch[1]) * 1000);
    cleanedTitle = cleanedTitle.replace(/\[MOQ:\s*\d+(?:\.\d+)?\s*KG\]/gi, '');
  }
  
  // Pattern 2: XKG Large Spool / XKG Spool format  
  const largeSpoolMatch = title.match(/(\d+(?:\.\d+)?)\s*KG\s*(?:Large\s*)?Spool/i);
  if (largeSpoolMatch && !netWeightG) {
    netWeightG = Math.round(parseFloat(largeSpoolMatch[1]) * 1000);
  }
  
  // Pattern 3: Leading weight like "3KG PLA" or "10KG SILK"
  const leadingWeightMatch = title.match(/^(\d+(?:\.\d+)?)\s*KG\s+/i);
  if (leadingWeightMatch && !netWeightG) {
    netWeightG = Math.round(parseFloat(leadingWeightMatch[1]) * 1000);
  }
  
  // Pattern 4: Weight in brackets like (1KG) or [2KG]
  const bracketWeightMatch = title.match(/[\[\(](\d+(?:\.\d+)?)\s*KG[\]\)]/i);
  if (bracketWeightMatch && !netWeightG) {
    netWeightG = Math.round(parseFloat(bracketWeightMatch[1]) * 1000);
  }
  
  // Pattern 5: Pack quantity like "6 Pack" or "Pack of 4"
  const packMatch = title.match(/(?:(\d+)\s*Pack|Pack\s*(?:of\s*)?(\d+))/i);
  if (packMatch) {
    packQuantity = parseInt(packMatch[1] || packMatch[2]);
  }
  
  // Remove common bracket patterns that have been processed
  cleanedTitle = cleanedTitle
    .replace(/\[MOQ:\s*\d+(?:\.\d+)?\s*KG\]/gi, '')
    .replace(/\[Bigger\s*Size[^\]]*\]/gi, '')
    .replace(/\[Get\s*\d+\s*for[^\]]*\]/gi, '')
    .replace(/\[USA\s*Resin[^\]]*\]/gi, '')
    .replace(/\[No\s*Waste[^\]]*\]/gi, '');
  
  return { netWeightG, packQuantity, cleanedTitle };
}

// Patterns to remove from titles
const TITLE_FLUFF_PATTERNS = [
  // Diameter specifications
  /\b1\.75\s*mm\b/gi,
  /\b2\.85\s*mm\b/gi,
  /\b3\.0\s*mm\b/gi,
  /\bfilament\s*diameter[:\s]*[\d.]+\s*mm\b/gi,
  
  // Weight specifications (metric and imperial)
  /\b\d+(?:\.\d+)?\s*(?:kg|kilogram|kilograms)\b/gi,
  /\b\d+(?:\.\d+)?\s*(?:g|gram|grams)\b/gi,
  /\b\d+(?:\.\d+)?\s*(?:lb|lbs|pound|pounds)\b/gi,
  /\b\d+(?:\.\d+)?\s*(?:oz|ounce|ounces)\b/gi,
  
  // Generic product descriptors - EXPANDED
  /\b3d\s*print(?:ing|er)?\s*(?:filament|material|supplies?|consumable)s?\b/gi,
  /\bfilament\s*(?:for\s*)?3d\s*print(?:ing|er)?\b/gi,
  /\b3d\s*filament\b/gi,
  /\bprinter\s*filament\b/gi,
  /\bprinting\s*filament\b/gi,
  /\bprinting\s*material\b/gi,
  /\bfdm\s*filament\b/gi,
  /\bfilament\s*spool\b/gi,
  /\bfilament\s*collection\b/gi,
  /\bfilament\s*series\b/gi,
  
  // Marketing fluff
  /\bmost\s*(?:basic|popular|common|best|top)\b/gi,
  /\bhigh\s*quality\b/gi,
  /\bpremium\s*quality\b/gi,
  /\btop\s*quality\b/gi,
  /\bbest\s*(?:selling|seller|quality|value)\b/gi,
  /\bnew\s*(?:arrival|version|release|design)\b/gi,
  /\bhot\s*sale\b/gi,
  /\bflash\s*(?:sale|deal)\b/gi,
  /\bfree\s*shipping\b/gi,
  /\bfast\s*(?:delivery|shipping)\b/gi,
  /\bquick(?:ly)?\b/gi,
  /\bgradually\b/gi,
  /\brandom(?:ly)?\b/gi,
  /\bvacuum\s*sealed\b/gi,
  /\bsealed\s*(?:bag|package|packaging)\b/gi,
  /\beasy\s*to\s*(?:use|print)\b/gi,
  /\bsmooth\s*(?:printing|surface)\b/gi,
  /\bno\s*(?:clogging|jamming|bubbles?|warping)\b/gi,
  /\blow\s*(?:shrinkage|warping|odor)\b/gi,
  /\b(?:strong|excellent|good|great|super|amazing|perfect)\s*(?:adhesion|layer|quality|strength|finish)\b/gi,
  /\bfor\s*(?:most|all)\s*(?:fdm\s*)?(?:3d\s*)?printers?\b/gi,
  /\bcompatible\s*with\s*(?:most|all)\s*(?:fdm\s*)?(?:3d\s*)?printers?\b/gi,
  /\buniversal\s*(?:fit|compatibility)\b/gi,
  /\bwide\s*compatibility\b/gi,
  /\baccurate\s*diameter\b/gi,
  /\bdimensional\s*accuracy\b/gi,
  /\bconsistent\s*(?:diameter|quality|extrusion)\b/gi,
  /\btangle\s*free\b/gi,
  /\bno\s*tangle\b/gi,
  /\bbubble\s*free\b/gi,
  /\bno\s*bubble\b/gi,
  /\bwarp\s*free\b/gi,
  /\bno\s*warp(?:ing)?\b/gi,
  /\blarge\s*spool\b/gi,
  /\bbigger\s*size\b/gi,
  /\blonger\s*use\b/gi,
  /\bno\s*waste\b/gi,
  
  // Brand suffix patterns (e.g., "by BRANDNAME", "from BRAND")
  /\bby\s+[A-Z][A-Za-z0-9]+(?:\s*3D)?\s*$/i,
  /\bfrom\s+[A-Z][A-Za-z0-9]+(?:\s*3D)?\s*$/i,
  /\b-\s*[A-Z][A-Za-z0-9]+(?:\s*3D)?\s*$/i,
  
  // Pack/quantity descriptors
  /\b\d+\s*(?:pack|pcs|pieces?|rolls?|spools?)\b/gi,
  /\bsingle\s*(?:pack|roll|spool)\b/gi,
  /\bmulti(?:ple)?\s*(?:pack|color|colour)s?\b/gi,
  
  // Temperature specs in title
  /\b(?:nozzle|hotend|extruder)\s*(?:temp(?:erature)?)?[:\s]*\d+\s*[-–]\s*\d+\s*[°]?c?\b/gi,
  /\b(?:bed|platform|plate)\s*(?:temp(?:erature)?)?[:\s]*\d+\s*[-–]\s*\d+\s*[°]?c?\b/gi,
  
  // Parenthetical additions with fluff
  /\([^)]*(?:diameter|weight|kg|lb|mm|pack|pcs|spool)[^)]*\)/gi,
  
  // Parenthetical expansions like "PLA+(PLA Plus)" or "HS_PLA"
  /\((?:PLA|PETG|ABS|ASA|TPU)\s*(?:Plus|\+|Pro)\)/gi,
  /\(HS[_\s]?PLA\)/gi,
  /\(High\s*Speed[^)]*\)/gi,
  /\(Nylon[^)]*Carbon[^)]*\)/gi,
];

// Common color terms to preserve
const PRESERVE_COLOR_TERMS = [
  'rainbow', 'multicolor', 'multi-color', 'gradient', 'dual', 'tri',
  'silk', 'matte', 'glossy', 'metallic', 'marble', 'galaxy', 'sparkle', 'glitter',
  'glow', 'luminous', 'fluorescent', 'neon', 'pastel', 'transparent', 'translucent', 'clear',
  'wood', 'carbon', 'metal', 'copper', 'bronze', 'gold', 'silver', 'chrome',
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey',
  'cyan', 'magenta', 'teal', 'navy', 'olive', 'maroon', 'beige', 'tan', 'brown', 'ivory', 'cream'
];

// Material types to preserve
const PRESERVE_MATERIALS = [
  'PLA', 'PLA+', 'PLA-CF', 'PLA-GF', 'PLA Pro',
  'PETG', 'PETG-CF', 'PETG-GF',
  'ABS', 'ABS+', 'ABS-CF', 'ABS-GF',
  'ASA', 'ASA-CF', 'ASA-GF',
  'TPU', 'TPE', 'Flex',
  'PA', 'PA6', 'PA12', 'PA-CF', 'PA-GF', 'Nylon',
  'PC', 'PC-CF', 'PC-ABS', 'Polycarbonate',
  'PEEK', 'PEKK', 'PEI', 'ULTEM',
  'PVA', 'HIPS', 'PP', 'POM',
  'Wood', 'Carbon Fiber', 'Glass Fiber'
];

// Product line/series identifiers to preserve
const PRESERVE_SERIES = [
  'Pro', 'Plus', 'Ultra', 'Max', 'Mini', 'Lite', 'Basic', 'Premium', 'Elite', 'Advanced',
  'Eco', 'Bio', 'Recycled', 'High Speed', 'High Flow', 'Engineering', 'Industrial',
  'Tough', 'Strong', 'Flexible', 'Rigid', 'Impact', 'Heat Resistant',
  'HS', 'HF', 'CF', 'GF', 'HT', 'FR' // Common suffixes
];

/**
 * Intelligently clean a product title to extract the meaningful product name
 * Removes bloat like diameter, weight, marketing fluff, and generic descriptions
 */
export function intelligentTitleClean(title: string, brandName?: string): string {
  if (!title) return '';
  
  let cleaned = title;
  
  // Step 1: Normalize whitespace and quotes
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .trim();
  
  // Step 2: Remove brand name from start or end (case insensitive)
  if (brandName) {
    const brandPattern = new RegExp(`^${escapeRegex(brandName)}\\s*[-–:]?\\s*`, 'i');
    cleaned = cleaned.replace(brandPattern, '');
    
    const brandEndPattern = new RegExp(`\\s*[-–]?\\s*(?:by\\s+)?${escapeRegex(brandName)}\\s*(?:3D)?\\s*$`, 'i');
    cleaned = cleaned.replace(brandEndPattern, '');
  }
  
  // Step 3: Apply all fluff patterns
  for (const pattern of TITLE_FLUFF_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  
  // Step 4: Remove standalone commas and clean up punctuation
  cleaned = cleaned
    .replace(/,\s*,/g, ',')
    .replace(/\s*,\s*$/g, '')
    .replace(/^\s*,\s*/g, '')
    .replace(/\s*-\s*$/g, '')
    .replace(/^\s*-\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Step 5: If the result is too short or empty, try to extract core components
  if (cleaned.length < 3) {
    cleaned = extractCoreProductName(title, brandName);
  }
  
  // Step 6: Capitalize properly (title case, but preserve material acronyms)
  cleaned = smartTitleCase(cleaned);
  
  // Step 7: Final cleanup
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/^\s*[-–,]\s*/, '')
    .replace(/\s*[-–,]\s*$/, '')
    .trim();
  
  // Step 8: If still too long (>60 chars), truncate intelligently
  if (cleaned.length > 60) {
    cleaned = truncateIntelligently(cleaned, 60);
  }
  
  return cleaned || title.substring(0, 50); // Fallback to truncated original
}

/**
 * Extract core product name by identifying material + finish + color
 */
function extractCoreProductName(title: string, brandName?: string): string {
  const upperTitle = title.toUpperCase();
  const parts: string[] = [];
  
  // Find material
  for (const material of PRESERVE_MATERIALS) {
    const materialPattern = new RegExp(`\\b${escapeRegex(material)}\\b`, 'i');
    if (materialPattern.test(title)) {
      parts.push(material);
      break;
    }
  }
  
  // Find finish/style (silk, matte, etc.)
  const finishTerms = ['silk', 'matte', 'glossy', 'metallic', 'marble', 'galaxy', 'sparkle', 'glitter', 'glow', 'wood', 'carbon'];
  for (const finish of finishTerms) {
    if (upperTitle.includes(finish.toUpperCase())) {
      parts.push(finish.charAt(0).toUpperCase() + finish.slice(1));
      break;
    }
  }
  
  // Find color
  const colorTerms = ['rainbow', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'grey', 
                      'cyan', 'magenta', 'teal', 'gold', 'silver', 'bronze', 'copper', 'multicolor', 'gradient'];
  for (const color of colorTerms) {
    if (upperTitle.includes(color.toUpperCase())) {
      parts.push(color.charAt(0).toUpperCase() + color.slice(1));
      break;
    }
  }
  
  return parts.join(' ') || '';
}

/**
 * Smart title case that preserves material acronyms
 */
function smartTitleCase(text: string): string {
  const acronyms = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'TPE', 'PA', 'PC', 'PEEK', 'PEKK', 'PEI', 'PVA', 'HIPS', 'PP', 'POM', 'CF', 'GF', 'HT', 'HS', 'HF', 'FR', '3D'];
  const lowercase = ['by', 'for', 'with', 'and', 'or', 'the', 'a', 'an', 'in', 'on', 'to', 'of'];
  
  return text.split(' ').map((word, index) => {
    const upper = word.toUpperCase();
    
    // Preserve acronyms
    if (acronyms.includes(upper)) {
      return upper;
    }
    
    // Handle compound materials like PLA-CF
    if (upper.includes('-')) {
      return upper.split('-').map(part => acronyms.includes(part) ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('-');
    }
    
    // Keep lowercase words lowercase (except first word)
    if (index > 0 && lowercase.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    
    // Standard title case
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

/**
 * Truncate intelligently at word boundaries, preserving meaning
 */
function truncateIntelligently(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  // Try to truncate at a word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace).trim();
  }
  
  return truncated.trim();
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractSku(text: string): string | null {
  const patterns = [
    /sku[:\s]+([A-Z0-9-]+)/i,
    /item[:\s#]+([A-Z0-9-]+)/i,
    /model[:\s#]+([A-Z0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// ============================================================================
// AUTO-CREATION EXTRACTION HELPERS
// ============================================================================

const MATERIALS = [
  'PLA+', 'PLA-CF', 'PLA-GF', 'PLA',
  'PETG-CF', 'PETG-GF', 'PETG',
  'ABS-CF', 'ABS-GF', 'ABS',
  'ASA-CF', 'ASA-GF', 'ASA',
  'TPU', 'TPE',
  'PA-CF', 'PA-GF', 'PA12', 'PA6', 'Nylon',
  'PC-CF', 'PC-ABS', 'PC',
  'PEEK', 'PEKK', 'PEI', 'ULTEM',
  'PVA', 'HIPS', 'PP', 'POM',
  'Wood', 'Metal', 'Carbon', 'Glass'
];

export function detectMaterial(title: string): string | null {
  const upperTitle = title.toUpperCase();
  
  // Check composite materials first (longer matches)
  for (const mat of MATERIALS) {
    if (upperTitle.includes(mat.toUpperCase())) {
      return mat;
    }
  }
  
  return null;
}

// Import the intelligent color classifier
import { 
  COLOR_HEX_MAP, 
  COLOR_FAMILY_MAP, 
  classifyVariant, 
  extractColorInfo,
  filterColorVariants,
  type VariantClassification 
} from "./colorClassifier.ts";

// Re-export for use by scrapers
export { classifyVariant, extractColorInfo, filterColorVariants, COLOR_HEX_MAP, COLOR_FAMILY_MAP };
export type { VariantClassification };

export function extractColor(title: string): { name: string; hex: string; family: string } | null {
  const lowerTitle = title.toLowerCase();
  
  for (const [colorName, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lowerTitle.includes(colorName)) {
      return {
        name: colorName.charAt(0).toUpperCase() + colorName.slice(1),
        hex,
        family: COLOR_FAMILY_MAP[colorName] || 'Other',
      };
    }
  }
  
  return null;
}

export function extractWeight(title: string, variants?: string[]): number | null {
  const textToSearch = [title, ...(variants || [])].join(' ');
  
  // Match patterns like "1kg", "1 kg", "1000g", "750g", "2.2lb"
  const kgMatch = textToSearch.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) {
    return Math.round(parseFloat(kgMatch[1]) * 1000);
  }
  
  const gMatch = textToSearch.match(/(\d+)\s*g(?:ram)?/i);
  if (gMatch) {
    return parseInt(gMatch[1]);
  }
  
  const lbMatch = textToSearch.match(/(\d+(?:\.\d+)?)\s*lb/i);
  if (lbMatch) {
    return Math.round(parseFloat(lbMatch[1]) * 453.592);
  }
  
  return null;
}

export function extractDiameter(title: string, variants?: string[]): number | null {
  const textToSearch = [title, ...(variants || [])].join(' ');
  
  // Match patterns like "1.75mm", "2.85mm", "1.75 mm"
  const match = textToSearch.match(/(\d+(?:\.\d+)?)\s*mm/i);
  if (match) {
    const diameter = parseFloat(match[1]);
    // Only return common filament diameters
    if (diameter >= 1.5 && diameter <= 3.0) {
      return diameter;
    }
  }
  
  // Default to 1.75mm if not found (most common)
  return null;
}

// Parse barcode into appropriate fields (UPC, EAN, GTIN)
export function parseBarcodeFields(barcode: string | null): { upc?: string; ean?: string; gtin?: string } {
  if (!barcode) return {};
  
  // Clean the barcode - remove spaces and non-digits
  const cleaned = barcode.replace(/\D/g, '');
  
  if (!cleaned) return {};
  
  const length = cleaned.length;
  
  // UPC-A is 12 digits
  if (length === 12) {
    return { upc: cleaned };
  }
  
  // EAN-13 is 13 digits
  if (length === 13) {
    return { ean: cleaned };
  }
  
  // GTIN-14 is 14 digits
  if (length === 14) {
    return { gtin: cleaned };
  }
  
  // For other lengths, try to classify
  if (length >= 8 && length <= 12) {
    return { upc: cleaned.padStart(12, '0') };
  }
  
  if (length === 13) {
    return { ean: cleaned };
  }
  
  // Default: store as GTIN
  if (length > 0) {
    return { gtin: cleaned };
  }
  
  return {};
}

// ============================================================================
// ENHANCED EXTRACTION HELPERS FOR COMPREHENSIVE SCRAPING
// ============================================================================

// Find TDS/PDF links in HTML content - comprehensive patterns
export function findTdsUrl(html: string): string | null {
  if (!html) return null;
  
  // Normalize HTML for better matching
  const normalizedHtml = html.replace(/\s+/g, ' ').toLowerCase();
  const originalHtml = html; // Keep original for URL extraction
  
  const patterns = [
    // Direct PDF links with TDS keywords (most specific)
    /href=["']([^"']*(?:tds|datasheet|technical[-_]?data|spec[-_]?sheet|specifications)[^"']*\.pdf)["']/gi,
    // PDF links in CDN paths
    /href=["']([^"']*(?:cdn|assets|files|uploads|downloads)[^"']*(?:tds|datasheet|specification)[^"']*\.pdf)["']/gi,
    // PDF links with data sheet in text nearby
    /(?:technical\s*data\s*sheet|tds|datasheet|specifications?|data\s*sheet)[^<]*<a[^>]*href=["']([^"']+\.pdf)["']/gi,
    // Links containing 'tds' in the URL path
    /href=["']([^"']*\/tds\/[^"']+)["']/gi,
    /href=["']([^"']*\/tds[^"']*\.pdf)["']/gi,
    // Links to pages with 'tds' or 'data-sheet' in name
    /href=["']([^"']*(?:\/data[-_]?sheet|\/technical[-_]?data)[^"']*)["']/gi,
    // Shopify file CDN with PDF extensions
    /href=["']([^"']*cdn\.shopify\.com[^"']*\.pdf)["']/gi,
    // Any PDF link in files/downloads section
    /href=["']([^"']*(?:\/files\/|\/downloads\/)[^"']*\.pdf)["']/gi,
    // Links with 'download' attribute containing PDF
    /href=["']([^"']+\.pdf)["'][^>]*download/gi,
    // Button/link with TDS text pointing to PDF
    /<a[^>]*href=["']([^"']+\.pdf)["'][^>]*>(?:[^<]*(?:TDS|Technical Data|Data Sheet|Download PDF))/gi,
  ];
  
  for (const pattern of patterns) {
    pattern.lastIndex = 0; // Reset regex state
    const matches = [...originalHtml.matchAll(pattern)];
    for (const match of matches) {
      let url = match[1];
      if (!url) continue;
      
      // Skip SDS (Safety Data Sheet) - we want TDS only
      if (url.toLowerCase().includes('sds') || 
          url.toLowerCase().includes('safety') || 
          url.toLowerCase().includes('msds')) {
        continue;
      }
      
      // Clean up URL
      if (url.startsWith('//')) url = 'https:' + url;
      if (url.startsWith('/')) continue; // Skip relative URLs without base
      if (!url.startsWith('http')) continue;
      
      // Validate it's actually a file or page URL
      if (url.includes('.pdf') || url.includes('/tds') || url.includes('/datasheet')) {
        return url;
      }
    }
  }
  
  return null;
}

// Extract print settings from HTML/text content
export function extractPrintSettings(text: string): { 
  nozzleTempMin: number | null; 
  nozzleTempMax: number | null; 
  bedTempMin: number | null; 
  bedTempMax: number | null;
} | null {
  if (!text) return null;
  
  const result: { 
    nozzleTempMin: number | null; 
    nozzleTempMax: number | null; 
    bedTempMin: number | null; 
    bedTempMax: number | null;
  } = {
    nozzleTempMin: null,
    nozzleTempMax: null,
    bedTempMin: null,
    bedTempMax: null,
  };
  
  // Nozzle temperature patterns
  const nozzlePatterns = [
    /nozzle[^:]*:\s*(\d{3})\s*[-–—]\s*(\d{3})\s*°?C/gi,
    /(?:printing|print|extrusion|extruder|hotend)\s*temp[^:]*:\s*(\d{3})\s*[-–—]\s*(\d{3})\s*°?C/gi,
    /(\d{3})\s*[-–—]\s*(\d{3})\s*°?C\s*(?:nozzle|print|extrusion)/gi,
    /(?:nozzle|printing)\s*:\s*(\d{3})\s*°?C/gi, // Single temp
  ];
  
  for (const pattern of nozzlePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        result.nozzleTempMin = parseInt(match[1]);
        result.nozzleTempMax = parseInt(match[2]);
      } else if (match[1]) {
        // Single temperature - use as both min and max
        const temp = parseInt(match[1]);
        result.nozzleTempMin = temp - 10;
        result.nozzleTempMax = temp + 10;
      }
      break;
    }
  }
  
  // Bed temperature patterns
  const bedPatterns = [
    /(?:bed|plate|platform|build\s*plate)[^:]*:\s*(\d{2,3})\s*[-–—]\s*(\d{2,3})\s*°?C/gi,
    /(\d{2,3})\s*[-–—]\s*(\d{2,3})\s*°?C\s*(?:bed|plate|platform)/gi,
    /(?:bed|plate)\s*temp[^:]*:\s*(\d{2,3})\s*°?C/gi, // Single temp
  ];
  
  for (const pattern of bedPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        result.bedTempMin = parseInt(match[1]);
        result.bedTempMax = parseInt(match[2]);
      } else if (match[1]) {
        const temp = parseInt(match[1]);
        result.bedTempMin = temp;
        result.bedTempMax = temp + 20;
      }
      break;
    }
  }
  
  // Only return if we found something
  if (result.nozzleTempMin || result.bedTempMin) {
    return result;
  }
  
  return null;
}

// Use comprehensive color hex map from colorClassifier
export function extractColorFromHtml(
  html: string | null, 
  option1: string | null | undefined, 
  option2: string | null | undefined,
  title: string
): { name: string; hex: string } | null {
  // Check options first - use intelligent classification
  const options = [option1, option2].filter(Boolean);
  
  for (const opt of options) {
    if (opt) {
      const classification = classifyVariant(opt);
      if (classification.isColorVariant && classification.colorName) {
        const colorInfo = extractColorInfo(classification.colorName);
        if (colorInfo) {
          return { name: colorInfo.name, hex: colorInfo.hex };
        }
      }
    }
  }
  
  // Try to find a hex color in the HTML content
  const hexMatch = html?.match(/#([A-Fa-f0-9]{6})\b/);
  if (hexMatch) {
    // Try to find associated color name from title
    const titleLower = title.toLowerCase();
    for (const [name, hex] of Object.entries(COLOR_HEX_MAP)) {
      if (titleLower.includes(name)) {
        return { name: name.charAt(0).toUpperCase() + name.slice(1), hex: `#${hexMatch[1]}` };
      }
    }
    return { name: 'Custom', hex: `#${hexMatch[1]}` };
  }
  
  // Try to extract color from title using comprehensive map
  const combined = `${options.join(' ')} ${title}`.toLowerCase();
  for (const [name, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (combined.includes(name)) {
      return { name: name.charAt(0).toUpperCase() + name.slice(1), hex };
    }
  }
  
  return null;
}

// Extract spool specifications from content
export function extractSpoolSpecs(text: string, title: string): {
  material: string | null;
  weightG: number | null;
  diameterMm: number | null;
  outerDiameterMm: number | null;
  widthMm: number | null;
} | null {
  if (!text && !title) return null;
  
  const combined = `${text || ''} ${title}`.toLowerCase();
  
  const result: {
    material: string | null;
    weightG: number | null;
    diameterMm: number | null;
    outerDiameterMm: number | null;
    widthMm: number | null;
  } = {
    material: null,
    weightG: null,
    diameterMm: null,
    outerDiameterMm: null,
    widthMm: null,
  };
  
  // Extract weight
  const kgMatch = combined.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kgMatch) {
    result.weightG = Math.round(parseFloat(kgMatch[1]) * 1000);
  } else {
    const gMatch = combined.match(/(\d+)\s*g(?:ram)?s?(?:\s|$)/);
    if (gMatch) {
      result.weightG = parseInt(gMatch[1]);
    }
  }
  
  // Extract diameter (filament diameter)
  const diamMatch = combined.match(/(\d+(?:\.\d+)?)\s*mm\s*(?:filament|diameter)/);
  if (diamMatch) {
    const diam = parseFloat(diamMatch[1]);
    if (diam >= 1.5 && diam <= 3.0) {
      result.diameterMm = diam;
    }
  } else if (combined.includes('1.75')) {
    result.diameterMm = 1.75;
  } else if (combined.includes('2.85')) {
    result.diameterMm = 2.85;
  }
  
  // Extract spool outer diameter
  const outerMatch = combined.match(/(?:spool|outer)\s*(?:diameter|dia)[:\s]*(\d+)\s*mm/);
  if (outerMatch) {
    result.outerDiameterMm = parseInt(outerMatch[1]);
  }
  
  // Extract spool width
  const widthMatch = combined.match(/(?:spool\s*)?width[:\s]*(\d+)\s*mm/);
  if (widthMatch) {
    result.widthMm = parseInt(widthMatch[1]);
  }
  
  // Spool material detection
  if (combined.includes('cardboard spool') || combined.includes('eco spool') || combined.includes('recyclable spool')) {
    result.material = 'Cardboard';
  } else if (combined.includes('plastic spool')) {
    result.material = 'Plastic';
  } else if (combined.includes('reusable spool') || combined.includes('master spool')) {
    result.material = 'Reusable';
  }
  
  return result;
}

// Extract MPN from HTML content
export function extractMpnFromHtml(html: string): string | null {
  if (!html) return null;
  
  const patterns = [
    /itemprop=["']mpn["'][^>]*content=["']([^"']+)["']/i,
    /"mpn":\s*"([^"]+)"/i,
    /mpn[:\s]+([A-Z0-9-]+)/i,
    /manufacturer\s*part\s*(?:number|#)?[:\s]+([A-Z0-9-]+)/i,
    /part\s*(?:number|#|no\.?)[:\s]+([A-Z0-9-]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].length >= 3) {
      return match[1];
    }
  }
  
  return null;
}

// Extract barcode from HTML (structured data)
export function extractBarcodeFromHtml(html: string): string | null {
  if (!html) return null;
  
  const patterns = [
    /"gtin14":\s*"(\d+)"/i,
    /"gtin13":\s*"(\d+)"/i,
    /"gtin12":\s*"(\d+)"/i,
    /"gtin":\s*"(\d+)"/i,
    /"ean":\s*"(\d+)"/i,
    /"upc":\s*"(\d+)"/i,
    /itemprop=["']gtin["'][^>]*content=["'](\d+)["']/i,
    /data-barcode=["'](\d+)["']/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].length >= 8) {
      return match[1];
    }
  }
  
  return null;
}

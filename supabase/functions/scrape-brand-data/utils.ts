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

const COLOR_MAP: Record<string, { hex: string; family: string }> = {
  'black': { hex: '#000000', family: 'Black' },
  'white': { hex: '#FFFFFF', family: 'White' },
  'red': { hex: '#FF0000', family: 'Red' },
  'blue': { hex: '#0000FF', family: 'Blue' },
  'green': { hex: '#00FF00', family: 'Green' },
  'yellow': { hex: '#FFFF00', family: 'Yellow' },
  'orange': { hex: '#FFA500', family: 'Orange' },
  'purple': { hex: '#800080', family: 'Purple' },
  'pink': { hex: '#FFC0CB', family: 'Pink' },
  'gray': { hex: '#808080', family: 'Gray' },
  'grey': { hex: '#808080', family: 'Gray' },
  'silver': { hex: '#C0C0C0', family: 'Silver' },
  'gold': { hex: '#FFD700', family: 'Gold' },
  'bronze': { hex: '#CD7F32', family: 'Bronze' },
  'brown': { hex: '#8B4513', family: 'Brown' },
  'beige': { hex: '#F5F5DC', family: 'Beige' },
  'natural': { hex: '#F5F5DC', family: 'Natural' },
  'clear': { hex: '#FFFFFF', family: 'Clear' },
  'transparent': { hex: '#FFFFFF', family: 'Clear' },
  'translucent': { hex: '#FFFFFF', family: 'Clear' },
  'cyan': { hex: '#00FFFF', family: 'Blue' },
  'teal': { hex: '#008080', family: 'Blue' },
  'navy': { hex: '#000080', family: 'Blue' },
  'magenta': { hex: '#FF00FF', family: 'Purple' },
  'violet': { hex: '#EE82EE', family: 'Purple' },
  'lime': { hex: '#00FF00', family: 'Green' },
  'olive': { hex: '#808000', family: 'Green' },
  'maroon': { hex: '#800000', family: 'Red' },
  'crimson': { hex: '#DC143C', family: 'Red' },
};

export function extractColor(title: string): { name: string; hex: string; family: string } | null {
  const lowerTitle = title.toLowerCase();
  
  for (const [colorName, colorData] of Object.entries(COLOR_MAP)) {
    if (lowerTitle.includes(colorName)) {
      return {
        name: colorName.charAt(0).toUpperCase() + colorName.slice(1),
        hex: colorData.hex,
        family: colorData.family,
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

// Color hex extraction with lookup table
const HEX_COLORS: Record<string, string> = {
  'black': '#000000',
  'white': '#FFFFFF',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#00FF00',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'gray': '#808080',
  'grey': '#808080',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
  'bronze': '#CD7F32',
  'brown': '#8B4513',
  'beige': '#F5F5DC',
  'natural': '#F5F5DC',
  'clear': '#FFFFFF',
  'transparent': '#FFFFFF',
  'cyan': '#00FFFF',
  'teal': '#008080',
  'navy': '#000080',
  'magenta': '#FF00FF',
  'violet': '#EE82EE',
  'lime': '#00FF00',
  'olive': '#808000',
  'maroon': '#800000',
  'crimson': '#DC143C',
  'sky blue': '#87CEEB',
  'royal blue': '#4169E1',
  'forest green': '#228B22',
  'burgundy': '#800020',
  'champagne': '#F7E7CE',
  'ivory': '#FFFFF0',
  'cream': '#FFFDD0',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'peach': '#FFDAB9',
  'mint': '#98FF98',
  'lavender': '#E6E6FA',
  'copper': '#B87333',
  'rose gold': '#B76E79',
};

export function extractColorFromHtml(
  html: string | null, 
  option1: string | null | undefined, 
  option2: string | null | undefined,
  title: string
): { name: string; hex: string } | null {
  // Check options first (Shopify variant options often contain color)
  const options = [option1, option2].filter(Boolean).join(' ').toLowerCase();
  const combined = `${options} ${title}`.toLowerCase();
  
  // Try to find a hex color in the content
  const hexMatch = html?.match(/#([A-Fa-f0-9]{6})\b/);
  if (hexMatch) {
    // Try to find associated color name
    for (const [name, hex] of Object.entries(HEX_COLORS)) {
      if (combined.includes(name)) {
        return { name: name.charAt(0).toUpperCase() + name.slice(1), hex: `#${hexMatch[1]}` };
      }
    }
    return { name: 'Custom', hex: `#${hexMatch[1]}` };
  }
  
  // Match from color name lookup
  for (const [name, hex] of Object.entries(HEX_COLORS)) {
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

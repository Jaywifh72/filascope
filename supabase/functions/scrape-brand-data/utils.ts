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

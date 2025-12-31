/**
 * 3D-FUEL Brand-Specific Defaults and Enrichment Functions
 * 
 * Used by sync-3dfuel-products to apply consistent enrichment rules
 * for 3D-Fuel filament products from their Shopify store.
 */

// ============================================================================
// 3D-FUEL BRAND CONFIGURATION
// ============================================================================

export const BRAND_CONFIG = {
  vendorName: '3D-Fuel',
  brandSlug: '3d-fuel',
  shopifyDomain: '3dfuel.com',
  shopifyApiUrl: 'https://3dfuel.com/products.json',
  defaultDiameter: 1.75,
  defaultWeight: 1000,
  defaultCurrency: 'USD',
  defaultRegion: 'US',
};

// ============================================================================
// 3D-FUEL PRODUCT LINE PATTERNS
// ============================================================================

// Product line terms that should NEVER be returned as colors
// Used to detect when extractColorName incorrectly returns a product line name
const PRODUCT_LINE_TERMS = new Set([
  'silk pla', 'silk pla+', 'dual color', 'dual-color', 'dual color silk',
  'standard pla', 'standard pla+', 'pro pla', 'tough pro', 'tough pro pla',
  'pro pctg', 'pro petg', 'pro ht', 'workday', 'workday pla', 'workday abs',
  'workday petg', 'biome3d', 'buzzed', 'entwined', 'wound up', 'landfillament',
  'c2renew', 'refuel', 'pet-cf', 'pla-cf', 'pro asa', 'pro abs',
]);

// Used to extract the base product line from product titles/handles (without color)
// CRITICAL: Order matters - more specific patterns must come first
export const PRODUCT_LINE_PATTERNS: Array<{ pattern: RegExp; line: string; handlePattern?: RegExp }> = [
  // Non-filament products (to be filtered out)
  { pattern: /\b3D\s*Clean\b/i, line: '3D Clean', handlePattern: /3d-clean/i },
  
  // Specialty/Composite lines (must match before generic materials)
  { pattern: /\bPET-CF\b|\bPET CF\b/i, line: 'PET-CF', handlePattern: /pet-cf/i },
  { pattern: /\bPLA-CF\b|\bPLA CF\b/i, line: 'PLA-CF', handlePattern: /pla-cf/i },
  { pattern: /\bDual[\s-]*Color[\s-]*Silk/i, line: 'Dual Color Silk PLA', handlePattern: /dual-color-silk/i },
  { pattern: /\bBiome3D/i, line: 'Biome3D', handlePattern: /biome3d/i },
  { pattern: /\bBuzzed/i, line: 'Buzzed', handlePattern: /buzzed/i },
  { pattern: /\bEntwined/i, line: 'Entwined', handlePattern: /entwined/i },
  { pattern: /\bWound\s*Up/i, line: 'Wound Up', handlePattern: /wound-?up/i },
  { pattern: /\bLandfillament/i, line: 'Landfillament', handlePattern: /landfill/i },
  { pattern: /\bc2renew|C2\s*Renew/i, line: 'C2 Renew', handlePattern: /c2renew/i },
  { pattern: /\bReFuel\b/i, line: 'ReFuel PETG', handlePattern: /refuel/i },
  
  // Pro/Advanced lines (specific variants first)
  { pattern: /\bTough Pro PLA\+/i, line: 'Tough Pro PLA+', handlePattern: /tough-pro-pla/i },
  { pattern: /\bTough Pro PLA\b/i, line: 'Tough Pro PLA+', handlePattern: /tough-pro-pla/i },
  { pattern: /\bStandard PLA\+/i, line: 'Standard PLA+', handlePattern: /standard-pla/i },
  { pattern: /\bStandard PLA\b(?!\+)/i, line: 'Standard PLA', handlePattern: /standard-pla/i },
  { pattern: /\bPro PCTG/i, line: 'Pro PCTG', handlePattern: /pro-pctg/i },
  { pattern: /\bPro HT[\s-]*PLA/i, line: 'Pro HT PLA', handlePattern: /pro-ht-pla|htpla/i },
  { pattern: /\bPro PETG/i, line: 'Pro PETG', handlePattern: /pro-petg/i },
  { pattern: /\bPro ABS/i, line: 'Pro ABS', handlePattern: /pro-abs/i },
  { pattern: /\bPro ASA/i, line: 'Pro ASA', handlePattern: /pro-asa/i },
  { pattern: /\bPro PLA/i, line: 'Pro PLA', handlePattern: /pro-pla/i },
  
  // WorkDay lines
  { pattern: /\bWorkDay ABS/i, line: 'WorkDay ABS', handlePattern: /workday-abs/i },
  { pattern: /\bWorkDay PETG/i, line: 'WorkDay PETG', handlePattern: /workday-petg/i },
  { pattern: /\bWorkDay PLA/i, line: 'WorkDay PLA', handlePattern: /workday-pla/i },
  
  // Silk variants
  { pattern: /\bSilk PLA/i, line: 'Silk PLA', handlePattern: /silk-pla/i },
];

// ============================================================================
// 3D-FUEL MATERIAL PATTERNS
// ============================================================================

export const MATERIAL_PATTERNS: Array<{ pattern: RegExp; material: string; finish?: string }> = [
  // Pro/Advanced lines
  { pattern: /\bTough Pro PLA\+/i, material: 'PLA+', finish: 'Matte' },
  { pattern: /\bTough Pro PLA/i, material: 'PLA+', finish: 'Matte' },
  { pattern: /\bStandard PLA\+/i, material: 'PLA+', finish: 'Standard' },
  { pattern: /\bStandard PLA/i, material: 'PLA', finish: 'Standard' },
  { pattern: /\bPro PCTG/i, material: 'PCTG', finish: 'Standard' },
  { pattern: /\bPro PLA/i, material: 'PLA', finish: 'Standard' },
  { pattern: /\bPro HT/i, material: 'PLA-HT', finish: 'Standard' },
  { pattern: /\bPro HTPLA/i, material: 'PLA-HT', finish: 'Standard' },
  { pattern: /\bWorkDay ABS/i, material: 'ABS', finish: 'Standard' },
  { pattern: /\bWorkDay PETG/i, material: 'PETG', finish: 'Standard' },
  
  // Specialty lines
  { pattern: /\bBiome3D/i, material: 'Bioplastic', finish: 'Standard' },
  { pattern: /\bBuzzed/i, material: 'Hemp-PLA', finish: 'Natural' },
  { pattern: /\bEntwined/i, material: 'Hemp-PLA', finish: 'Natural' },
  { pattern: /\bWound Up/i, material: 'Coffee-PLA', finish: 'Natural' },
  { pattern: /\bLandfill/i, material: 'Recycled-PLA', finish: 'Standard' },
  { pattern: /\bc2renew/i, material: 'Recycled-PLA', finish: 'Standard' },
  { pattern: /\bC2 Renew/i, material: 'Recycled-PLA', finish: 'Standard' },
  
  // Generic materials
  { pattern: /\bPLA\+/i, material: 'PLA+' },
  { pattern: /\bPETG/i, material: 'PETG' },
  { pattern: /\bPCTG/i, material: 'PCTG' },
  { pattern: /\bABS/i, material: 'ABS' },
  { pattern: /\bASA/i, material: 'ASA' },
  { pattern: /\bTPU/i, material: 'TPU' },
  { pattern: /\bNylon/i, material: 'Nylon' },
  { pattern: /\bPLA/i, material: 'PLA' },
];

// ============================================================================
// 3D-FUEL COLOR MAPPING (Comprehensive brand-specific colors)
// ============================================================================

export const COLOR_HEX_MAP: Record<string, string> = {
  // Military/Tactical (3D-Fuel specialty line)
  'coyote': '#8B5A2B',
  'coyote brown': '#8B5A2B',
  'coyote tan': '#8B5A2B',
  'desert tan': '#C4A77D',
  'desert': '#C4A77D',
  'ranger green': '#4A5D23',
  'flat dark earth': '#A67B5B',
  'fde': '#A67B5B',
  'od green': '#3D4C2D',
  'olive drab': '#3D4C2D',
  'olive drab green': '#3D4C2D',
  'battleship grey': '#6D6E6A',
  'battleship gray': '#6D6E6A',
  'tactical black': '#1C1C1C',
  'midnight bronze': '#4A3728',
  'foliage green': '#667C4C',
  'wolf grey': '#6B6B6B',
  'wolf gray': '#6B6B6B',
  'gunmetal': '#2C3539',
  'graphite': '#383838',
  
  // Nature-inspired
  'lava': '#FF4500',
  'ocean': '#006994',
  'ocean blue': '#006994',
  'arctic': '#E0FFFF',
  'arctic white': '#F0F8FF',
  'volcano': '#CF1020',
  'volcano red': '#CF1020',
  'glacier': '#DFFFFE',
  'glacier blue': '#DFFFFE',
  'sunshine': '#FFD700',
  'sunshine yellow': '#FFD700',
  'meadow': '#7CFC00',
  'meadow green': '#7CFC00',
  'storm': '#4F5D75',
  'storm grey': '#4F5D75',
  'storm gray': '#4F5D75',
  'snow': '#FFFAFA',
  'snow white': '#FFFAFA',
  'iron': '#48494B',
  'iron grey': '#48494B',
  'iron gray': '#48494B',
  'midnight': '#191970',
  'midnight blue': '#191970',
  'sky': '#87CEEB',
  'sky blue': '#87CEEB',
  'forest': '#228B22',
  'forest green': '#228B22',
  'fire': '#FF4500',
  'fire red': '#B22222',
  'fire engine red': '#CE2029',
  'sunset': '#FA8072',
  'sunset orange': '#FA8072',
  
  // Industrial/Safety
  'safety orange': '#FF6700',
  'safety yellow': '#F0E130',
  'high vis yellow': '#DDFF00',
  'high visibility yellow': '#DDFF00',
  'electric blue': '#0892D0',
  'neon green': '#39FF14',
  'neon pink': '#FF6EC7',
  'neon orange': '#FF5F1F',
  'traffic orange': '#FF5500',
  'traffic yellow': '#FFD800',
  
  // Recycled/Eco line colors
  'coffee brown': '#6F4E37',
  'coffee': '#6F4E37',
  'hemp green': '#7B8B6F',
  'hemp': '#7B8B6F',
  'natural hemp': '#C3B091',
  'recycled grey': '#808080',
  'recycled gray': '#808080',
  'eco natural': '#F5F5DC',
  
  // Standard colors (various names)
  'standard black': '#1A1A1A',
  'standard white': '#FAFAFA',
  'standard grey': '#808080',
  'standard gray': '#808080',
  'tough black': '#1A1A1A',
  'tough white': '#FAFAFA',
  'tough grey': '#808080',
  'tough gray': '#808080',
  'basic black': '#1A1A1A',
  'basic white': '#FAFAFA',
  
  // Primary colors
  'black': '#1A1A1A',
  'jet black': '#0A0A0A',
  'true black': '#000000',
  'white': '#FFFFFF',
  'pure white': '#FFFFFF',
  'pearl white': '#F0EAD6',
  'grey': '#808080',
  'gray': '#808080',
  'silver': '#C0C0C0',
  'silver grey': '#C0C0C0',
  'silver gray': '#C0C0C0',
  
  // Reds
  'red': '#DC2626',
  'bright red': '#FF0000',
  'dark red': '#8B0000',
  'crimson': '#DC143C',
  'maroon': '#800000',
  'burgundy': '#800020',
  'scarlet': '#FF2400',
  'ruby': '#E0115F',
  'blood red': '#660000',
  
  // Oranges
  'orange': '#EA580C',
  'bright orange': '#FF6600',
  'dark orange': '#CC5500',
  'tangerine': '#FF9966',
  'coral': '#FF7F50',
  'peach': '#FFCBA4',
  'apricot': '#FBCEB1',
  'burnt orange': '#CC5500',
  
  // Yellows
  'yellow': '#EAB308',
  'bright yellow': '#FFFF00',
  'gold': '#FFD700',
  'golden': '#FFD700',
  'mustard': '#FFDB58',
  'lemon': '#FFF44F',
  'canary': '#FFEF00',
  'amber': '#FFBF00',
  
  // Greens
  'green': '#16A34A',
  'bright green': '#00FF00',
  'dark green': '#006400',
  'lime': '#00FF00',
  'lime green': '#32CD32',
  'olive': '#808000',
  'olive green': '#6B8E23',
  'mint': '#98FF98',
  'mint green': '#98FF98',
  'teal': '#008080',
  'emerald': '#50C878',
  'jade': '#00A86B',
  'sage': '#9DC183',
  'sage green': '#9DC183',
  'hunter green': '#355E3B',
  'army green': '#4B5320',
  'kelly green': '#4CBB17',
  
  // Blues
  'blue': '#2563EB',
  'bright blue': '#0000FF',
  'dark blue': '#00008B',
  'light blue': '#ADD8E6',
  'navy': '#000080',
  'navy blue': '#000080',
  'royal blue': '#4169E1',
  'cobalt': '#0047AB',
  'cobalt blue': '#0047AB',
  'aqua': '#00FFFF',
  'cyan': '#00FFFF',
  'turquoise': '#40E0D0',
  'sapphire': '#0F52BA',
  'azure': '#007FFF',
  'cerulean': '#007BA7',
  'steel blue': '#4682B4',
  'powder blue': '#B0E0E6',
  'cornflower': '#6495ED',
  'cornflower blue': '#6495ED',
  'pacific blue': '#1CA9C9',
  
  // Purples
  'purple': '#9333EA',
  'bright purple': '#BF00FF',
  'dark purple': '#301934',
  'violet': '#8B00FF',
  'lavender': '#E6E6FA',
  'lilac': '#C8A2C8',
  'magenta': '#FF00FF',
  'fuchsia': '#FF00FF',
  'plum': '#DDA0DD',
  'grape': '#6F2DA8',
  'orchid': '#DA70D6',
  'mauve': '#E0B0FF',
  'indigo': '#4B0082',
  'amethyst': '#9966CC',
  
  // Pinks
  'pink': '#EC4899',
  'bright pink': '#FF69B4',
  'hot pink': '#FF69B4',
  'light pink': '#FFB6C1',
  'salmon': '#FA8072',
  'rose': '#FF007F',
  'blush': '#DE5D83',
  'bubblegum': '#FFC1CC',
  'magenta pink': '#FF00FF',
  
  // Browns
  'brown': '#92400E',
  'dark brown': '#5C4033',
  'light brown': '#C4A484',
  'chocolate': '#7B3F00',
  'tan': '#D2B48C',
  'beige': '#F5F5DC',
  'khaki': '#C3B091',
  'taupe': '#483C32',
  'walnut': '#773F1A',
  'mahogany': '#C04000',
  'chestnut': '#954535',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'mocha': '#967969',
  'espresso': '#4E3524',
  
  // Neutrals and special
  'natural': '#F5F5DC',
  'neutral': '#F5F5DC',
  'translucent': '#FFFFFF',
  'clear': '#FFFFFF',
  'transparent': '#FFFFFF',
  'glow': '#7FFF00',
  'glow green': '#7FFF00',
  'ivory': '#FFFFF0',
  'cream': '#FFFDD0',
  'bone': '#E3DAC9',
  'charcoal': '#36454F',
  'slate': '#708090',
  'ash': '#B2BEB5',
  'ash grey': '#B2BEB5',
  'ash gray': '#B2BEB5',
  
  // Multi-color/Special effects
  'rainbow': '#FF0000',
  'galaxy': '#1B0533',
  'space': '#2D3436',
  'marble': '#E8E4E1',
  'wood': '#DEB887',
  'woodgrain': '#DEB887',
  
  // Dual-Color Silk PLA+ colors (10 dual-tone shimmer variants)
  'silky lagoon': '#2DD4BF',
  'silky blushing violet': '#DDA0DD',
  'silky blue orange theory': '#4169E1',
  'silky lemon lime': '#BFFF00',
  'silky mixed berry': '#8B008B',
  'silky vine leaf green': '#228B22',
  'silky black hills gold': '#FFD700',
  'silky crimson tide': '#DC143C',
  'silky copper canyon': '#B87333',
  'silky purple rain': '#9370DB',
};

// ============================================================================
// 3D-FUEL FINISH TYPE DETECTION
// ============================================================================

export const FINISH_PATTERNS: Array<{ pattern: RegExp; finish: string }> = [
  { pattern: /\bsilk\b/i, finish: 'Silk' },
  { pattern: /\bmatte\b/i, finish: 'Matte' },
  { pattern: /\bgloss(y)?\b/i, finish: 'Glossy' },
  { pattern: /\bmetallic\b/i, finish: 'Metallic' },
  { pattern: /\bglow\b/i, finish: 'Glow' },
  { pattern: /\btranslucent\b/i, finish: 'Translucent' },
  { pattern: /\bclear\b/i, finish: 'Translucent' },
  { pattern: /\bnatural\b/i, finish: 'Natural' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract product line from product title (without color)
 */
export function extractProductLine(title: string): string {
  for (const { pattern, line } of PRODUCT_LINE_PATTERNS) {
    if (pattern.test(title)) {
      return line;
    }
  }
  // Fallback: try to extract something meaningful
  const material = extractMaterial(title);
  return material;
}

/**
 * Extract material type from product title
 */
export function extractMaterial(title: string): string {
  for (const { pattern, material } of MATERIAL_PATTERNS) {
    if (pattern.test(title)) {
      return material;
    }
  }
  return 'PLA'; // Default
}

/**
 * Extract finish type from product title
 */
export function extractFinish(title: string): string {
  // First check material patterns for finish
  for (const { pattern, finish } of MATERIAL_PATTERNS) {
    if (pattern.test(title) && finish) {
      return finish;
    }
  }
  
  // Then check explicit finish patterns
  for (const { pattern, finish } of FINISH_PATTERNS) {
    if (pattern.test(title)) {
      return finish;
    }
  }
  
  return 'Standard';
}

/**
 * Extract color name from Shopify variant
 * 
 * 3D-Fuel uses variant.title format: "Color Name / Weight" or "Color Name"
 * Sometimes uses option1/option2/option3 format
 * 
 * Enhanced to handle edge cases like:
 * - "Desert Tan / 1kg"
 * - "Coyote Brown - 500g"
 * - Single values without separators
 * - Extracting from product handle when variant fails
 */
export function extractColorName(variant: any, productTitle: string, productHandle?: string): string {
  // Method 1: Parse variant.title (e.g., "Desert Tan / 1kg" or "Coyote Brown / 500g")
  if (variant.title && typeof variant.title === 'string') {
    const title = variant.title.trim();
    
    // Skip "Default Title" placeholder
    if (title.toLowerCase() === 'default title') {
      // Fall through to other methods
    } else {
      // Handle "/" separated formats
      if (title.includes('/')) {
        const parts = title.split('/').map((p: string) => p.trim());
        
        // 3-part format: "Material / Size / Color" (e.g., "Silk PLA+ / 1kg 1.75mm Spool / Silky Lagoon")
        if (parts.length >= 3) {
          // Last part is typically the color
          const lastPart = parts[parts.length - 1];
          // Verify it's not a weight/size value
          if (lastPart && !lastPart.match(/^\d/) && 
              !lastPart.toLowerCase().includes('mm') &&
              !lastPart.toLowerCase().match(/\d+\s*(g|kg|spool)/i)) {
            // Also check it's not a product line term
            if (!PRODUCT_LINE_TERMS.has(lastPart.toLowerCase())) {
              console.log(`[Color] Extracted from 3-part variant title: "${lastPart}"`);
              return lastPart;
            }
          }
        }
        
        // 2-part format: "Color / Weight" (e.g., "Desert Tan / 1kg")
        const colorPart = parts[0];
        if (colorPart && !colorPart.match(/^\d/) && !colorPart.toLowerCase().includes('mm')) {
          // Check if first part is a product line term (means color is likely elsewhere)
          if (!PRODUCT_LINE_TERMS.has(colorPart.toLowerCase())) {
            return colorPart;
          }
        }
      }
      
      // Handle "Color - Weight" format (some products use dashes)
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        const colorPart = parts[0].trim();
        if (colorPart && !colorPart.match(/^\d/) && !colorPart.toLowerCase().match(/\d+\s*(g|kg)/i)) {
          return colorPart;
        }
      }
      
      // Handle single value (just color name, no weight)
      if (!title.includes('/') && !title.includes(' - ') && 
          !title.match(/^\d/) && 
          !title.toLowerCase().includes('mm') && 
          !title.toLowerCase().match(/\d+\s*(kg|g|lb)/i)) {
        return title;
      }
    }
  }
  
  // Method 2: Check variant options (option1, option2, option3)
  const options = [variant.option1, variant.option2, variant.option3].filter(Boolean);
  for (const opt of options) {
    const optLower = opt.toLowerCase();
    // Skip diameter, weight values, and "Default Title"
    if (optLower === 'default title' ||
        optLower.includes('mm') || 
        optLower.includes('1.75') || 
        optLower.includes('2.85') || 
        optLower.match(/^\d+\s*(g|kg)/i)) {
      continue;
    }
    return opt;
  }
  
  // Method 3: Extract from product handle (e.g., "standard-pla-1-75mm-desert-tan")
  if (productHandle) {
    const handleLower = productHandle.toLowerCase();
    
    // Special handling for "Silky X" colors in Dual-Color Silk products
    // Pattern: "dual-color-silk-pla-silky-lagoon-1-75mm" or similar
    const silkyMatch = handleLower.match(/silky-([a-z-]+?)(?:-1-75|-1\.75|$)/i);
    if (silkyMatch && silkyMatch[1]) {
      // Convert slug to title case: "lagoon" -> "Silky Lagoon"
      const colorPart = silkyMatch[1]
        .split('-')
        .filter(w => w.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      const silkyColor = `Silky ${colorPart}`;
      console.log(`[Color] Extracted Silky color from handle: ${silkyColor}`);
      return silkyColor;
    }
    
    // Common pattern: material-size-color at the end
    const colorMatch = handleLower.match(/1-75mm-([a-z-]+)$/);
    if (colorMatch && colorMatch[1]) {
      // Convert slug to title case: "desert-tan" -> "Desert Tan"
      const colorSlug = colorMatch[1];
      const colorName = colorSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Check if extracted "color" is actually a product line term
      if (PRODUCT_LINE_TERMS.has(colorName.toLowerCase())) {
        console.log(`[Color] Skipping product line term as color: ${colorName}`);
        // Fall through to title extraction
      } else {
        return colorName;
      }
    }
  }
  
  // Method 4: Extract from product title (last resort)
  // Pattern: "Product Name - Color Name" or "Product Name, Color"
  const dashMatch = productTitle.match(/[-–]\s*([^,\d]+?)(?:\s*,|\s*$)/);
  if (dashMatch && dashMatch[1]) {
    const extracted = dashMatch[1].trim();
    // Make sure it's not a material or weight
    if (!extracted.match(/^(pla|petg|abs|pctg|tpu|nylon|\d)/i)) {
      // Check if extracted is a product line term
      if (!PRODUCT_LINE_TERMS.has(extracted.toLowerCase())) {
        return extracted;
      }
    }
  }
  
  return 'Default';
}

/**
 * Get hex color from color name using brand-specific mapping
 */
export function getColorHex(colorName: string): string | null {
  if (!colorName || colorName === 'Default') return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Check exact match first
  if (COLOR_HEX_MAP[normalized]) {
    return COLOR_HEX_MAP[normalized];
  }
  
  // Check partial matches (color name contains key or key contains color name)
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  // Check word-by-word matching for multi-word colors
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (word.length > 3 && COLOR_HEX_MAP[word]) {
      return COLOR_HEX_MAP[word];
    }
  }
  
  return null;
}

/**
 * Extract diameter from variant or default
 */
export function extractDiameter(variant: any): number {
  const options = [variant.option1, variant.option2, variant.option3, variant.title].filter(Boolean);
  
  for (const opt of options) {
    const lower = opt.toLowerCase();
    if (lower.includes('2.85') || lower.includes('3.0') || lower.includes('3mm')) {
      return 2.85;
    }
    if (lower.includes('1.75') || lower.includes('1.75mm')) {
      return 1.75;
    }
  }
  
  // Check title/sku for diameter hints
  if (variant.sku) {
    if (variant.sku.includes('285') || variant.sku.includes('3.0')) {
      return 2.85;
    }
  }
  
  return BRAND_CONFIG.defaultDiameter;
}

/**
 * Generate product line ID for grouping color variants together
 * 
 * CRITICAL: This must strip the color name to ensure all colors of the same product
 * share the same product_line_id. Uses product HANDLE for accurate product identification.
 */
export function generateProductLineId(productTitle: string, productHandle?: string): string {
  // Method 1: Use product handle for more accurate product identification
  if (productHandle) {
    for (const { handlePattern, line } of PRODUCT_LINE_PATTERNS) {
      if (handlePattern && handlePattern.test(productHandle)) {
        const base = line
          .replace(/\s+/g, '-')
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        return `3dfuel__${base}`;
      }
    }
  }
  
  // Method 2: Fall back to title-based extraction
  const productLine = extractProductLine(productTitle);
  
  // Create clean base ID from product line only (no color)
  let base = productLine
    .replace(/\s+/g, '-')
    .toLowerCase()
    .trim();
  
  // Remove any trailing punctuation
  base = base.replace(/[-,]+$/, '');
  
  // Ensure we have a valid ID
  base = base.replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  
  if (!base || base.length < 2) {
    // Fallback: use material
    const material = extractMaterial(productTitle);
    base = material.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  
  return `3dfuel__${base}`;
}

/**
 * Check if a product is a non-filament product (accessories, cleaning compounds)
 */
export function isNonFilament(productTitle: string, productHandle: string): boolean {
  const handle = productHandle.toLowerCase();
  const title = productTitle.toLowerCase();
  
  // 3D Clean is a cleaning compound, not a filament
  if (handle.includes('3d-clean') || title.includes('3d clean')) {
    return true;
  }
  
  return false;
}

/**
 * Clean product title for display - includes color name
 */
export function cleanProductTitle(title: string, colorName: string): string {
  const productLine = extractProductLine(title);
  const material = extractMaterial(title);
  
  // Format: "3D-Fuel Product Line Material - Color"
  // e.g., "3D-Fuel Standard PLA+ - Desert Tan"
  if (productLine !== material) {
    return `3D-Fuel ${productLine} - ${colorName}`;
  }
  
  return `3D-Fuel ${material} - ${colorName}`;
}

/**
 * Extract weight from variant or product title
 */
export function extractWeight(variant: any, productTitle?: string): number {
  const options = [variant.option1, variant.option2, variant.option3, variant.title].filter(Boolean);
  
  for (const opt of options) {
    const lower = opt.toLowerCase();
    // Match patterns like "500g", "1kg", "2.5kg"
    const gMatch = lower.match(/(\d+(?:\.\d+)?)\s*g\b/);
    if (gMatch) {
      return parseInt(gMatch[1], 10);
    }
    const kgMatch = lower.match(/(\d+(?:\.\d+)?)\s*kg\b/);
    if (kgMatch) {
      return parseFloat(kgMatch[1]) * 1000;
    }
  }
  
  // Check product title for weight (catches "Pro PCTG Sample Coils, 1.75mm, 50g")
  if (productTitle) {
    const titleLower = productTitle.toLowerCase();
    const gMatch = titleLower.match(/(\d+(?:\.\d+)?)\s*g\b/);
    if (gMatch) {
      return parseInt(gMatch[1], 10);
    }
    const kgMatch = titleLower.match(/(\d+(?:\.\d+)?)\s*kg\b/);
    if (kgMatch) {
      return parseFloat(kgMatch[1]) * 1000;
    }
  }
  
  // Check grams in SKU
  if (variant.grams && variant.grams > 100) {
    return variant.grams;
  }
  
  return BRAND_CONFIG.defaultWeight;
}

/**
 * Determine color family from color name
 */
export function getColorFamily(colorName: string): string {
  if (!colorName) return 'Other';
  
  const lower = colorName.toLowerCase();
  
  // Map to standard color families
  if (lower.includes('black') || lower.includes('midnight') || lower.includes('tactical') || lower.includes('charcoal')) return 'Black';
  if (lower.includes('white') || lower.includes('snow') || lower.includes('arctic') || lower.includes('ivory') || lower.includes('cream')) return 'White';
  if (lower.includes('grey') || lower.includes('gray') || lower.includes('silver') || lower.includes('battleship') || lower.includes('gunmetal') || lower.includes('graphite') || lower.includes('slate') || lower.includes('ash')) return 'Gray';
  if (lower.includes('red') || lower.includes('crimson') || lower.includes('maroon') || lower.includes('scarlet') || lower.includes('ruby') || lower.includes('volcano') || lower.includes('fire') || lower.includes('blood')) return 'Red';
  if (lower.includes('orange') || lower.includes('tangerine') || lower.includes('coral') || lower.includes('peach') || lower.includes('apricot') || lower.includes('sunset') || lower.includes('lava')) return 'Orange';
  if (lower.includes('yellow') || lower.includes('gold') || lower.includes('sunshine') || lower.includes('mustard') || lower.includes('lemon') || lower.includes('canary') || lower.includes('amber')) return 'Yellow';
  if (lower.includes('green') || lower.includes('olive') || lower.includes('lime') || lower.includes('mint') || lower.includes('teal') || lower.includes('emerald') || lower.includes('jade') || lower.includes('sage') || lower.includes('forest') || lower.includes('meadow') || lower.includes('ranger') || lower.includes('foliage') || lower.includes('army') || lower.includes('hunter') || lower.includes('kelly') || lower.includes('hemp')) return 'Green';
  if (lower.includes('blue') || lower.includes('navy') || lower.includes('cobalt') || lower.includes('aqua') || lower.includes('cyan') || lower.includes('turquoise') || lower.includes('sapphire') || lower.includes('azure') || lower.includes('ocean') || lower.includes('glacier') || lower.includes('sky') || lower.includes('cerulean') || lower.includes('steel') || lower.includes('powder') || lower.includes('cornflower') || lower.includes('pacific')) return 'Blue';
  if (lower.includes('purple') || lower.includes('violet') || lower.includes('lavender') || lower.includes('lilac') || lower.includes('plum') || lower.includes('grape') || lower.includes('orchid') || lower.includes('mauve') || lower.includes('indigo') || lower.includes('amethyst') || lower.includes('galaxy')) return 'Purple';
  if (lower.includes('pink') || lower.includes('salmon') || lower.includes('rose') || lower.includes('blush') || lower.includes('bubblegum') || lower.includes('magenta') || lower.includes('fuchsia')) return 'Pink';
  if (lower.includes('brown') || lower.includes('tan') || lower.includes('beige') || lower.includes('khaki') || lower.includes('taupe') || lower.includes('walnut') || lower.includes('mahogany') || lower.includes('chestnut') || lower.includes('bronze') || lower.includes('copper') || lower.includes('mocha') || lower.includes('espresso') || lower.includes('chocolate') || lower.includes('coyote') || lower.includes('desert') || lower.includes('coffee') || lower.includes('fde') || lower.includes('flat dark earth')) return 'Brown';
  if (lower.includes('natural') || lower.includes('neutral') || lower.includes('bone')) return 'Natural';
  if (lower.includes('translucent') || lower.includes('clear') || lower.includes('transparent')) return 'Translucent';
  if (lower.includes('glow')) return 'Glow';
  
  return 'Other';
}

/**
 * Build TDS URL based on product handle
 */
export function buildTdsUrl(productHandle: string): string | null {
  // 3D-Fuel typically hosts TDS in their CDN
  // Format: https://cdn.shopify.com/s/files/1/0xxx/xxxx/files/TDS-{product}.pdf
  // We return null here as we need to scrape for actual TDS URLs
  return null;
}

/**
 * Apply all enrichments to a variant
 */
export function enrichVariant(variant: any, product: any): Record<string, any> {
  const colorName = extractColorName(variant, product.title);
  const material = extractMaterial(product.title);
  const finish = extractFinish(product.title);
  const diameter = extractDiameter(variant);
  const weight = extractWeight(variant, product.title);
  const colorHex = getColorHex(colorName);
  const productLineId = generateProductLineId(product.title, colorName);
  const colorFamily = getColorFamily(colorName);
  
  return {
    material,
    finish_type: finish,
    color_family: colorFamily,
    color_name: colorName,
    color_hex: colorHex,
    diameter_nominal_mm: diameter,
    net_weight_g: weight,
    product_line_id: productLineId,
    vendor: BRAND_CONFIG.vendorName,
  };
}

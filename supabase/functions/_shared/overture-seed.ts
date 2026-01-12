/**
 * Overture 3D Filaments - CSV Seed Data
 * 
 * Curated from overture3d.ca Canadian Shopify store
 * Consumer-focused: 1-pack products only (no 2-pack, 4-pack, 6-pack, 2kg variants)
 * 
 * Product Lines (15):
 * - Basic PLA, Matte PLA, Silk PLA, Rock PLA, Easy PLA, Glow PLA, Super PLA+
 * - PLA Professional, Basic PETG, TPU, High Speed TPU
 * - ABS, ASA, Easy Nylon, PLA Refill
 */

export interface OvertureSeedEntry {
  material: string;
  filamentLine: string;
  productUrl: string;
  color: string;
  imageUrl: string;
  colorHex: string | null;
}

/**
 * Comprehensive color-to-hex mapping for Overture products
 * Includes standard colors, creative names, and specialty finishes
 */
export const OVERTURE_EXTENDED_COLOR_MAP: Record<string, string> = {
  // Standard Colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'red': '#CC0000',
  'blue': '#0066CC',
  'green': '#00AA00',
  'yellow': '#FFCC00',
  'orange': '#FF6600',
  'purple': '#8B008B',
  'pink': '#FF69B4',
  'brown': '#8B4513',
  'gray': '#808080',
  'grey': '#808080',
  'transparent': '#E8E8E8',
  'clear': '#E8E8E8',
  
  // Light/Dark Variants
  'light gray': '#D3D3D3',
  'light grey': '#D3D3D3',
  'space gray': '#4A4A4A',
  'space grey': '#4A4A4A',
  'light brown': '#C4A484',
  'light blue': '#87CEEB',
  'light green': '#90EE90',
  'light pink': '#FFB6C1',
  'light orange': '#FFB347',
  'dark orange': '#FF8C00',
  
  // Named Greens
  'grass green': '#7CFC00',
  'army green': '#4B5320',
  'olive green': '#808000',
  'bamboo green': '#7BA05B',
  'neon green': '#39FF14',
  
  // Named Blues
  'digital blue': '#0047AB',
  'navy blue': '#000080',
  'starry blue': '#4A6FA5',
  'sparkle blue': '#5B9BD5',
  'translucent blue': '#87CEEB',
  'gary blue': '#6B8BA4', // Typo in CSV, preserve it
  
  // Named Reds/Pinks
  'rose red': '#C21E56',
  'wine': '#722F37',
  'baby pink': '#F4C2C2',
  'translucent red': '#FF6B6B',
  
  // Named Yellows/Oranges
  'lemon yellow': '#FFF44F',
  'butter yellow': '#FFEF00',
  'marigold yellow': '#FCB624',
  
  // Browns/Neutrals
  'chocolate': '#7B3F00',
  'wood': '#DEB887',
  'beige': '#F5F5DC',
  
  // Metallics
  'gold': '#FFD700',
  'royal gold': '#C9A22C',
  'silver': '#C0C0C0',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'metallic gray': '#A9A9A9',
  'champagne': '#F7E7CE',
  'champagne frost': '#E8D8C8',
  'champaign': '#F7E7CE', // Typo in CSV
  'moonlight silver': '#C0C0C0',
  
  // Specialty Colors
  'magenta': '#FF00FF',
  'turquoise': '#40E0D0',
  'lilac': '#C8A2C8',
  'avocado': '#568203',
  
  // Multi-Color/Rainbow
  'radiant rainbow': '#FF0000',
  'rock rainbow': '#FF4500',
  'aurora berry': '#8E4585',
  'northern lights': '#78FFD6',
  'tequila sunrise': '#FFCC66',
  'rocket pop': '#FF0000',
  'christmas prism': '#C41E3A',
  
  // Sparkle Variants
  'sparkle black': '#2A2A2A',
  'sparkle purple': '#9370DB',
  
  // Glow Colors
  'glow in dark': '#39FF14',
  'glow green': '#39FF14',
  'glow blue': '#00FFFF',
  'glow orange': '#FF6600',
  'glow pink': '#FF69B4',
  
  // Rock PLA Colors
  'glacier blue': '#A5C8E1',
  'mars red': '#B22222',
  'rock white': '#F5F5F5',
  'fossil rock': '#8B8B8B',
  'sedimentary rock': '#A0A0A0',
  'mist gray': '#B0B0B0',
  'moonlight gray': '#C0C0C0',
  'muted gray': '#909090',
  'haze gray': '#9B9B9B',
  'slate gray': '#708090',
  'alpine forest': '#228B22',
  'barrier reef': '#1E90FF',
  'desert bluff': '#D2B48C',
  'burnt sienna': '#E97451',
  'sandstone': '#C2B280',
  'deep ocean': '#003366',
  'ivory coast': '#FFFFF0',
  'midnight slate': '#2F4F4F',
  'thunderstorm': '#4F5D75',
  'dusty rose': '#DCAE96',
  
  // Silk Colors - Standard
  'silk gold': '#FFD700',
  'silk green': '#00AA00',
  'silk blue': '#4169E1',
  'silk gray': '#808080',
  'silk copper': '#B87333',
  'silk red': '#DC143C',
  'silk white': '#FFFAFA',
  
  // Silk Colors - Creative Names
  'silk vaporwave': '#FF77FF',
  'silk purple chrome': '#9370DB',
  'silk lime surge': '#32CD32',
  'silk tropic': '#00CED1',
  'silk glacier flash': '#87CEEB',
  'silk lettuce tomato': '#FFD700',
  'silk copper shore': '#CD853F',
  'silk punch pink': '#FF6B81',
  'silk parakeet': '#03C03C',
  'silk golden ember': '#DAA520',
  'silk evergreen bronze': '#2E8B57',
  'silk caramel': '#FFD59A',
  'silk periwinkle': '#CCCCFF',
  'silk chrome gray': '#A0A0A0',
  'silk tiger eye': '#E08D3C',
  
  // Matte Dual-Color
  'black-white': '#808080',
  'orange-red': '#FF4500',
  'light blue-yellow': '#87CEEB',
  'blue-red': '#800080',
  
  // High Speed TPU Colors
  'translucent': '#E8E8E8',
  
  // PETG Transparent
  'transparent blue': '#87CEEB',
  'transparent green': '#90EE90',
  'transparent red': '#FF6B6B',
  
  // Standard as placeholder
  'standard': '#808080',
  '6-color': '#FF0000',
  
  // Typo corrections
  'pupple': '#8B008B', // Purple typo
};

/**
 * Determine if a product should be excluded from sync
 * Excludes multi-packs, bulk products, and single-variant specialty items
 */
export function shouldExcludeOvertureProduct(
  filamentLine: string,
  color: string
): boolean {
  const lineLower = filamentLine.toLowerCase();
  const colorLower = color.toLowerCase();
  
  // Exclude multi-packs (2-pack, 4-pack, 6-pack)
  if (/\d+-pack/.test(lineLower) && !/1-pack/.test(lineLower)) {
    return true;
  }
  
  // Exclude 2kg variants
  if (lineLower.includes('2kg') || colorLower.includes('2kg')) {
    return true;
  }
  
  // Exclude combo packs (BLACK x 2, WHITE x 2, etc.)
  if (/\s*x\s*\d+$/.test(colorLower) || /×\s*\d+$/.test(colorLower)) {
    return true;
  }
  
  // Exclude combo colors (GREEN & ORANGE, BLACK & WHITE, etc.)
  if (/\s*&\s*/.test(colorLower) && colorLower.split('&').length === 2) {
    return true;
  }
  
  // Exclude Eco PLA (only 1 variant, not useful for swatches)
  if (lineLower.includes('eco pla')) {
    return true;
  }
  
  // Exclude 6-pack
  if (lineLower.includes('6-pack') || colorLower.includes('6-color')) {
    return true;
  }
  
  return false;
}

/**
 * Generate product line ID from material and filament line
 */
export function generateOvertureProductLineId(material: string, filamentLine: string): string {
  const materialSlug = material.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  // Normalize filament line
  let lineSlug = filamentLine.toLowerCase()
    .replace(/1\.75mm\s*/gi, '')
    .replace(/1-pack\s*/gi, '')
    .replace(/filament\s*/gi, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Special handling for different product lines
  if (lineSlug.includes('basic-pla') || lineSlug === 'pla') {
    lineSlug = 'basic';
  } else if (lineSlug.includes('basic-petg') || lineSlug === 'petg') {
    lineSlug = 'basic';
  } else if (lineSlug.includes('matte-pla')) {
    lineSlug = 'matte';
  } else if (lineSlug.includes('silk-pla')) {
    lineSlug = 'silk';
  } else if (lineSlug.includes('rock-pla')) {
    lineSlug = 'rock';
  } else if (lineSlug.includes('easy-pla')) {
    lineSlug = 'easy';
  } else if (lineSlug.includes('glow-pla')) {
    lineSlug = 'glow';
  } else if (lineSlug.includes('super-pla')) {
    lineSlug = 'super-plus';
  } else if (lineSlug.includes('pla-professional')) {
    lineSlug = 'professional';
  } else if (lineSlug.includes('high-speed-tpu')) {
    lineSlug = 'high-speed';
  } else if (lineSlug.includes('easy-nylon')) {
    lineSlug = 'easy-nylon';
  } else if (lineSlug.includes('pla-refill')) {
    lineSlug = 'refill';
  } else if (lineSlug === 'tpu') {
    lineSlug = 'standard';
  } else if (lineSlug === 'abs') {
    lineSlug = 'standard';
  } else if (lineSlug === 'asa') {
    lineSlug = 'standard';
  }
  
  return `overture__${materialSlug}__${lineSlug}`;
}

/**
 * Get hex color from color name using extended mapping
 */
export function getOvertureHexFromColor(color: string): string | null {
  if (!color) return null;
  
  const colorLower = color.toLowerCase().trim();
  
  // Direct match
  if (OVERTURE_EXTENDED_COLOR_MAP[colorLower]) {
    return OVERTURE_EXTENDED_COLOR_MAP[colorLower];
  }
  
  // Try partial matching (prioritize longer matches)
  const sortedKeys = Object.keys(OVERTURE_EXTENDED_COLOR_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (colorLower.includes(key) || key.includes(colorLower)) {
      return OVERTURE_EXTENDED_COLOR_MAP[key];
    }
  }
  
  return null;
}

/**
 * Parse material type from CSV material field
 */
export function normalizeOvertureMaterial(material: string): string {
  const m = material.toLowerCase();
  
  if (m.includes('rock pla')) return 'PLA';
  if (m.includes('matte pla')) return 'PLA';
  if (m.includes('silk pla')) return 'PLA';
  if (m.includes('glow pla')) return 'PLA';
  if (m.includes('easy pla')) return 'PLA';
  if (m.includes('pla professional')) return 'PLA';
  if (m.includes('super pla')) return 'PLA';
  if (m.includes('pla refill')) return 'PLA';
  if (m.includes('pla')) return 'PLA';
  if (m.includes('petg')) return 'PETG';
  if (m.includes('tpu')) return 'TPU-95A';
  if (m.includes('nylon')) return 'PA';
  if (m.includes('abs')) return 'ABS';
  if (m.includes('asa')) return 'ASA';
  
  return 'PLA';
}

/**
 * Detect finish type from filament line and color
 */
export function detectOvertureFinishType(filamentLine: string, color: string): string {
  const combined = `${filamentLine} ${color}`.toLowerCase();
  
  if (combined.includes('silk')) return 'Silk';
  if (combined.includes('matte')) return 'Matte';
  if (combined.includes('glow')) return 'Glow';
  if (combined.includes('sparkle')) return 'Sparkle';
  if (combined.includes('rock')) return 'Matte'; // Rock PLA has matte texture
  if (combined.includes('transparent') || combined.includes('translucent') || combined.includes('clear')) return 'Transparent';
  if (combined.includes('rainbow') || combined.includes('dual') || combined.includes('multicolor')) return 'Multi';
  
  return 'Standard';
}

/**
 * Overture Seed Data - Consumer-focused 1-pack products only
 * Filtered from CSV to exclude multi-packs and bulk variants
 */
export const OVERTURE_SEED_DATA: OvertureSeedEntry[] = [
  // PLA Refill (1 color)
  { material: 'PLA Refill', filamentLine: 'PLA Refill Filament 1.75mm', productUrl: 'https://www.overture3d.ca/products/overture-pla-refill-3d-printer-filament-1-75mm', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-pla-refill-3d-printer-filament-175mm-5842233.jpg', colorHex: '#1A1A1A' },

  // Basic PETG (24 colors)
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#8B4513' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#1A1A1A' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#FFFFFF' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Transparent', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#E8E8E8' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Space Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#4A4A4A' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Light Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#D3D3D3' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#0066CC' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Digital Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#0047AB' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Sparkle Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#5B9BD5' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Clear', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#E8E8E8' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#CC0000' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Grass Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#7CFC00' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Army Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#4B5320' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#00AA00' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#FFCC00' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Magenta', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#FF00FF' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Rock White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#F5F5F5' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#FFD700' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Starry Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#4A6FA5' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#FF6600' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#FF69B4' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#8B008B' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Transparent Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#87CEEB' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Transparent Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#90EE90' },
  { material: 'PETG', filamentLine: 'BASIC PETG 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-petg-1-75mm-1-pack', color: 'Transparent Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03058_Aysmmetric_V3.png', colorHex: '#FF6B6B' },

  // Basic PLA (28 colors)
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FFFFFF' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#1A1A1A' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#CC0000' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#0066CC' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Light Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#D3D3D3' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FF6600' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Space Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#4A4A4A' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FF69B4' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#8B008B' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FFCC00' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#00AA00' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Glow In Dark', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#39FF14' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#8B4513' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Chocolate', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#7B3F00' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Gary Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#6B8BA4' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Olive Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#808000' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Radiant Rainbow', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FF0000' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Aurora Berry', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#8E4585' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Avocado', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#568203' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Lemon Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FFF44F' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Metallic Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#A9A9A9' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Northern Lights', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#78FFD6' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Rocket Pop', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FF0000' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Sparkle Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#2A2A2A' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Sparkle Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#9370DB' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Tequila Sunrise', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FFCC66' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Champagne Frost', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#E8D8C8' },
  { material: 'PLA', filamentLine: 'BASIC PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/basic-pla-1-75-mm-1-pack', color: 'Christmas Prism', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPWTE17511_Basic_PLA_1kg_1pack_1_Main.jpg', colorHex: '#C41E3A' },

  // Matte PLA (28 colors)
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#1A1A1A' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FFFFFF' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FFCC00' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Light Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#C4A484' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FF69B4' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Grass Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#7CFC00' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Light Grey', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#D3D3D3' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Light Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#87CEEB' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FF6600' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#00AA00' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#CC0000' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#8B008B' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Chocolate', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#7B3F00' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#0066CC' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Black-White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#808080' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Orange-Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FF4500' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Light Blue-Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#87CEEB' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Blue-Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#800080' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Navy Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#000080' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Army Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#4B5320' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Wood', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#DEB887' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Dark Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FF8C00' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Butter Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FFEF00' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Baby Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#F4C2C2' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Lilac', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#C8A2C8' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Turquoise', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#40E0D0' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Beige', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#F5F5DC' },
  { material: 'Matte PLA', filamentLine: 'MATTE PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/matte-pla-1-75mm-1-pack', color: 'Bamboo Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFFMBK17511_Matte_PLA_1kg_1pack_1_Main.jpg', colorHex: '#7BA05B' },

  // PLA Professional (16 colors)
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Wine', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#722F37' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Royal Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#C9A22C' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#FFFFFF' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Light Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#D3D3D3' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#CC0000' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Digital Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#0047AB' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#00AA00' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#FF6600' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Pupple', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#8B008B' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#FFCC00' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#FF69B4' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#1A1A1A' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Moonlight Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#C0C0C0' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Copper', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#B87333' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Bronze', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#CD7F32' },
  { material: 'PLA Professional', filamentLine: 'PLA Professional 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/pla-plus-1-75mm-1-pack', color: 'Champaign', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03062_Aysmmetric_V3.png', colorHex: '#F7E7CE' },

  // TPU (12 colors)
  { material: 'TPU', filamentLine: 'TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/tpu-1-75mm-1-pack', color: 'Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03059_Aysmmetric_V3.png', colorHex: '#8B4513' },
  { material: 'TPU', filamentLine: 'TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/tpu-1-75mm-1-pack', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03059_Aysmmetric_V3.png', colorHex: '#1A1A1A' },
  { material: 'TPU', filamentLine: 'TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/tpu-1-75mm-1-pack', color: 'Digital Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03059_Aysmmetric_V3.png', colorHex: '#0047AB' },
  { material: 'TPU', filamentLine: 'TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/tpu-1-75mm-1-pack', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03059_Aysmmetric_V3.png', colorHex: '#FF6600' },
  { material: 'TPU', filamentLine: 'TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/tpu-1-75mm-1-pack', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03059_Aysmmetric_V3.png', colorHex: '#CC0000' },
  { material: 'TPU', filamentLine: 'TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/tpu-1-75mm-1-pack', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03059_Aysmmetric_V3.png', colorHex: '#FFFFFF' },
  { material: 'TPU', filamentLine: 'TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/tpu-1-75mm-1-pack', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03059_Aysmmetric_V3.png', colorHex: '#00AA00' },
  { material: 'TPU', filamentLine: 'TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/tpu-1-75mm-1-pack', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03059_Aysmmetric_V3.png', colorHex: '#0066CC' },
  { material: 'TPU', filamentLine: 'TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/tpu-1-75mm-1-pack', color: 'Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03059_Aysmmetric_V3.png', colorHex: '#8B008B' },
  { material: 'TPU', filamentLine: 'TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/tpu-1-75mm-1-pack', color: 'Space Grey', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03059_Aysmmetric_V3.png', colorHex: '#4A4A4A' },
  { material: 'TPU', filamentLine: 'TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/tpu-1-75mm-1-pack', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03059_Aysmmetric_V3.png', colorHex: '#FFCC00' },
  { material: 'TPU', filamentLine: 'TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/tpu-1-75mm-1-pack', color: 'Transparent', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/PDT-C-OT-03059_Aysmmetric_V3.png', colorHex: '#E8E8E8' },

  // High Speed TPU (10 colors)
  { material: 'TPU', filamentLine: 'HIGH SPEED TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/high-speed-tpu-1-75mm-1-pack-1', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VSTGGN17511_High_Speed_TPU_1kg_1pack_1_Main.jpg', colorHex: '#1A1A1A' },
  { material: 'TPU', filamentLine: 'HIGH SPEED TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/high-speed-tpu-1-75mm-1-pack-1', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VSTGGN17511_High_Speed_TPU_1kg_1pack_1_Main.jpg', colorHex: '#FFFFFF' },
  { material: 'TPU', filamentLine: 'HIGH SPEED TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/high-speed-tpu-1-75mm-1-pack-1', color: 'Clear', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VSTGGN17511_High_Speed_TPU_1kg_1pack_1_Main.jpg', colorHex: '#E8E8E8' },
  { material: 'TPU', filamentLine: 'HIGH SPEED TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/high-speed-tpu-1-75mm-1-pack-1', color: 'Grass Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VSTGGN17511_High_Speed_TPU_1kg_1pack_1_Main.jpg', colorHex: '#7CFC00' },
  { material: 'TPU', filamentLine: 'HIGH SPEED TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/high-speed-tpu-1-75mm-1-pack-1', color: 'Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VSTGGN17511_High_Speed_TPU_1kg_1pack_1_Main.jpg', colorHex: '#808080' },
  { material: 'TPU', filamentLine: 'HIGH SPEED TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/high-speed-tpu-1-75mm-1-pack-1', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VSTGGN17511_High_Speed_TPU_1kg_1pack_1_Main.jpg', colorHex: '#FF6600' },
  { material: 'TPU', filamentLine: 'HIGH SPEED TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/high-speed-tpu-1-75mm-1-pack-1', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VSTGGN17511_High_Speed_TPU_1kg_1pack_1_Main.jpg', colorHex: '#FF69B4' },
  { material: 'TPU', filamentLine: 'HIGH SPEED TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/high-speed-tpu-1-75mm-1-pack-1', color: 'Translucent Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VSTGGN17511_High_Speed_TPU_1kg_1pack_1_Main.jpg', colorHex: '#87CEEB' },
  { material: 'TPU', filamentLine: 'HIGH SPEED TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/high-speed-tpu-1-75mm-1-pack-1', color: 'Translucent Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VSTGGN17511_High_Speed_TPU_1kg_1pack_1_Main.jpg', colorHex: '#FF6B6B' },
  { material: 'TPU', filamentLine: 'HIGH SPEED TPU 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/high-speed-tpu-1-75mm-1-pack-1', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VSTGGN17511_High_Speed_TPU_1kg_1pack_1_Main.jpg', colorHex: '#FFCC00' },

  // Silk PLA (25 colors)
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#00AA00' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Rose Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#C21E56' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Copper', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#B87333' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#4169E1' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#808080' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Neon Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#39FF14' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FFD700' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FFFAFA' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#DC143C' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Vaporwave', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FF77FF' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Purple Chrome', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#9370DB' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Lime Surge', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#32CD32' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Tropic', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#00CED1' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Glacier Flash', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#87CEEB' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Lettuce Tomato', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FFD700' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Copper Shore', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#CD853F' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Punch Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FF6B81' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Parakeet', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#03C03C' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Golden Ember', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#DAA520' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Evergreen Bronze', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#2E8B57' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Caramel', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FFD59A' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Periwinkle', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#CCCCFF' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Chrome Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#A0A0A0' },
  { material: 'PLA', filamentLine: 'SILK PLA 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/silk-pla1-75mm-1-pack', color: 'Silk Tiger Eye', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPSEE17511_Silk_PLA_1kg_1pack_1_Main.jpg', colorHex: '#E08D3C' },

  // Rock PLA (20 colors)
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Glacier Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#A5C8E1' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Mars Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#B22222' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Rock Rainbow', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#FF4500' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Rock White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#F5F5F5' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Fossil Rock', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#8B8B8B' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Sedimentary Rock', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#A0A0A0' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Mist Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#B0B0B0' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Moonlight Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#C0C0C0' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Muted Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#909090' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Haze Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#9B9B9B' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Slate Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#708090' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Marigold Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#FCB624' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Alpine Forest', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#228B22' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Barrier Reef', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#1E90FF' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Desert Bluff', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#D2B48C' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Burnt Sienna', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#E97451' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Sandstone', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#C2B280' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Deep Ocean', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#003366' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Ivory Coast', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#FFFFF0' },
  { material: 'Rock PLA', filamentLine: 'Rock PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/overture-rock-pla-filament-1-75mm', color: 'Midnight Slate', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-rock-pla-3d-printer-filament-175mm-865648_16a1ddcc-681f-4599-8467-eae1a92bbdd9.png', colorHex: '#2F4F4F' },

  // Easy Nylon (1 color)
  { material: 'Nylon', filamentLine: 'Easy Nylon 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/nylon-1-75mm-1-pack', color: 'Natural', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFNBLK17511_EasyNylon_1kg_1pack_1.jpg', colorHex: '#F5F5DC' },

  // ABS (1 color from website)
  { material: 'ABS', filamentLine: 'ABS Filament 1.75mm', productUrl: 'https://www.overture3d.ca/products/overture-abs-filament-1-75mm', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-abs-filament-175mm-1kg-black-1-pack-1540912.png', colorHex: '#1A1A1A' },

  // ASA (1 color from website)  
  { material: 'ASA', filamentLine: 'ASA Filament 1.75mm', productUrl: 'https://www.overture3d.ca/products/overture-asa-filament-1-75mm-white', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-asa-filament-175mm-white-8124652.png', colorHex: '#FFFFFF' },

  // Glow PLA (4 colors)
  { material: 'PLA', filamentLine: 'Glow PLA 1.75mm 1pack', productUrl: 'https://www.overture3d.ca/products/glow-pla-1-75mm-1pack', color: 'Glow Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPGGN17511_GLOW_PLA_1kg_1pack_1_Main.jpg', colorHex: '#39FF14' },
  { material: 'PLA', filamentLine: 'Glow PLA 1.75mm 1pack', productUrl: 'https://www.overture3d.ca/products/glow-pla-1-75mm-1pack', color: 'Glow Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPGGN17511_GLOW_PLA_1kg_1pack_1_Main.jpg', colorHex: '#00FFFF' },
  { material: 'PLA', filamentLine: 'Glow PLA 1.75mm 1pack', productUrl: 'https://www.overture3d.ca/products/glow-pla-1-75mm-1pack', color: 'Glow Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPGGN17511_GLOW_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FF6600' },
  { material: 'PLA', filamentLine: 'Glow PLA 1.75mm 1pack', productUrl: 'https://www.overture3d.ca/products/glow-pla-1-75mm-1pack', color: 'Glow Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/products/VFPGGN17511_GLOW_PLA_1kg_1pack_1_Main.jpg', colorHex: '#FF69B4' },

  // Easy PLA (4 colors)
  { material: 'PLA', filamentLine: 'Easy PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/easy-pla-1-75mm-1-pack', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-easy-pla-1-75mm-1-pack-7523846.png', colorHex: '#1A1A1A' },
  { material: 'PLA', filamentLine: 'Easy PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/easy-pla-1-75mm-1-pack', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-easy-pla-1-75mm-1-pack-7523846.png', colorHex: '#FFFFFF' },
  { material: 'PLA', filamentLine: 'Easy PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/easy-pla-1-75mm-1-pack', color: 'Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-easy-pla-1-75mm-1-pack-7523846.png', colorHex: '#808080' },
  { material: 'PLA', filamentLine: 'Easy PLA 1.75mm 1-Pack', productUrl: 'https://www.overture3d.ca/products/easy-pla-1-75mm-1-pack', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-easy-pla-1-75mm-1-pack-7523846.png', colorHex: '#CC0000' },

  // Super PLA+ (5 colors)
  { material: 'PLA', filamentLine: 'Super PLA+ 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/super-pla-1-75mm-1-pack', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-super-pla-1-75mm-1-pack-4920182.png', colorHex: '#1A1A1A' },
  { material: 'PLA', filamentLine: 'Super PLA+ 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/super-pla-1-75mm-1-pack', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-super-pla-1-75mm-1-pack-4920182.png', colorHex: '#FFFFFF' },
  { material: 'PLA', filamentLine: 'Super PLA+ 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/super-pla-1-75mm-1-pack', color: 'Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-super-pla-1-75mm-1-pack-4920182.png', colorHex: '#808080' },
  { material: 'PLA', filamentLine: 'Super PLA+ 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/super-pla-1-75mm-1-pack', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-super-pla-1-75mm-1-pack-4920182.png', colorHex: '#CC0000' },
  { material: 'PLA', filamentLine: 'Super PLA+ 1.75MM 1-PACK', productUrl: 'https://www.overture3d.ca/products/super-pla-1-75mm-1-pack', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0339/0835/9301/files/overture-super-pla-1-75mm-1-pack-4920182.png', colorHex: '#0066CC' },
];

/**
 * Get default prices by product line (CAD)
 */
export function getOvertureDefaultPrice(material: string, filamentLine: string): number {
  const line = filamentLine.toLowerCase();
  
  // Premium products
  if (line.includes('professional')) return 24.99;
  if (line.includes('super pla')) return 24.99;
  if (line.includes('rock pla')) return 24.99;
  if (line.includes('high speed tpu')) return 29.99;
  if (line.includes('nylon')) return 34.99;
  if (line.includes('abs')) return 24.99;
  if (line.includes('asa')) return 26.99;
  
  // Standard products
  if (line.includes('silk')) return 22.99;
  if (line.includes('matte')) return 21.99;
  if (line.includes('glow')) return 23.99;
  if (line.includes('tpu')) return 26.99;
  if (line.includes('petg')) return 21.99;
  if (line.includes('basic pla')) return 18.99;
  if (line.includes('easy pla')) return 18.99;
  if (line.includes('refill')) return 17.99;
  
  return 19.99; // Default
}

// ELEGOO BRAND-SPECIFIC DEFAULTS
// Platform: Shopify (ca.elegoo.com)
// Source: CSV seed with ~145 valid products (excluding bundles/packs)

export interface ElegooProductSeed {
  material: string;
  filamentLine: string;
  color: string;
  productUrl: string;
  imageUrl: string | null;
}

export const ELEGOO_STORE_INFO = {
  vendor: 'Elegoo',
  defaultDiameter: 1.75,
  defaultWeight: 1000,
  currency: 'CAD',
  baseUrl: 'https://ca.elegoo.com',
};

// Check if product should be excluded (bundles, bulk with "Default" color)
export function shouldExcludeProduct(color: string, filamentLine: string): boolean {
  // Exclude multi-pack bundles (contains "x1" or "x2" patterns like "Blackx1/Greenx1")
  if (/x\d+/.test(color)) return true;
  // Exclude bulk packs with generic "Default" color
  if (color === 'Default') return true;
  // Exclude # prefixes (data issue)
  if (color.startsWith('#')) return false; // Actually keep but clean
  return false;
}

// Clean color name (remove special chars)
export function cleanColorName(color: string): string {
  return color.replace(/^#/, '').trim();
}

// Normalize material types
export function normalizeElegooMaterial(material: string, filamentLine: string): string {
  const mat = material.toUpperCase();
  const line = filamentLine.toLowerCase();
  
  // Carbon fiber composites
  if (line.includes('-cf') || line.includes('cf')) {
    if (mat === 'PLA') return 'PLA-CF';
    if (mat === 'PETG') return 'PETG-CF';
    if (mat === 'PA') return 'PA-CF';
  }
  
  // Glass fiber composites
  if (line.includes('-gf') || line.includes('gf')) {
    if (mat === 'PETG') return 'PETG-GF';
  }
  
  // Wood filled
  if (line.includes('wood')) return 'PLA-Wood';
  
  // Marble
  if (line.includes('marble')) return 'PLA-Marble';
  
  // Standard materials
  if (mat === 'PLA') return 'PLA';
  if (mat === 'PETG') return 'PETG';
  if (mat === 'TPU') return 'TPU';
  if (mat === 'PC') return 'PC';
  if (mat === 'ASA') return 'ASA';
  if (mat === 'ABS') return 'ABS';
  if (mat === 'PA') return 'PA';
  
  return mat;
}

// Extract finish type from filament line
export function extractElegooFinishType(filamentLine: string): string {
  const line = filamentLine.toLowerCase();
  
  if (line.includes('silk')) return 'Silk';
  if (line.includes('matte')) return 'Matte';
  if (line.includes('sparkle')) return 'Sparkle';
  if (line.includes('galaxy')) return 'Galaxy';
  if (line.includes('marble')) return 'Marble';
  if (line.includes('metal') && !line.includes('detectable')) return 'Metallic';
  if (line.includes('wood')) return 'Wood';
  if (line.includes('-cf') || line.includes('cf')) return 'Carbon Fiber';
  if (line.includes('-gf') || line.includes('gf')) return 'Glass Fiber';
  
  return 'Standard';
}

// Generate product line ID for grouping
export function generateElegooProductLineId(material: string, filamentLine: string): string {
  const normalizedMaterial = normalizeElegooMaterial(material, filamentLine);
  const finishType = extractElegooFinishType(filamentLine);
  
  // Create slug from filament line
  let lineSlug = filamentLine
    .toLowerCase()
    .replace(/filament/gi, '')
    .replace(/\d+\s*kg/gi, '')
    .replace(/1\.75mm/gi, '')
    .replace(/colored/gi, '')
    .replace(/value pack/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Normalize to base product line
  if (lineSlug.includes('silk')) lineSlug = 'pla-silk';
  if (lineSlug.includes('matte')) lineSlug = 'pla-matte';
  if (lineSlug.includes('sparkle')) lineSlug = 'pla-sparkle';
  if (lineSlug.includes('galaxy')) lineSlug = 'pla-galaxy';
  if (lineSlug.includes('marble')) lineSlug = 'pla-marble';
  if (lineSlug.includes('metal')) lineSlug = 'pla-metal';
  if (lineSlug.includes('wood')) lineSlug = 'pla-wood';
  if (lineSlug.includes('basic')) lineSlug = 'pla-basic';
  if (lineSlug === 'pla') lineSlug = 'pla-standard';
  if (lineSlug === 'rapid-petg') lineSlug = 'rapid-petg';
  if (lineSlug === 'petg-pro') lineSlug = 'petg-pro';
  if (lineSlug.includes('petg-gf')) lineSlug = 'petg-gf';
  if (lineSlug.includes('petg-cf')) lineSlug = 'petg-cf';
  if (lineSlug === 'tpu-95a') lineSlug = 'tpu-95a';
  if (lineSlug.includes('rapid-tpu')) lineSlug = 'rapid-tpu-95a';
  if (lineSlug === 'pc') lineSlug = 'pc';
  if (lineSlug === 'asa') lineSlug = 'asa';
  if (lineSlug === 'abs') lineSlug = 'abs';
  if (lineSlug.includes('pla-cf')) lineSlug = 'pla-cf';
  if (lineSlug.includes('paht-cf')) lineSlug = 'paht-cf';
  
  const finishSlug = finishType.toLowerCase().replace(/\s+/g, '-');
  
  return `elegoo__${lineSlug}__${finishSlug}`;
}

// Check if material is abrasive (requires hardened nozzle)
export function isAbrasiveMaterial(material: string, filamentLine: string): boolean {
  const line = filamentLine.toLowerCase();
  return line.includes('-cf') || line.includes('-gf') || line.includes('carbon') || line.includes('glass');
}

// Check if high-speed capable
export function isHighSpeedCapable(filamentLine: string): boolean {
  const line = filamentLine.toLowerCase();
  return line.includes('rapid');
}

// Get print settings based on material
export function getElegooPrintSettings(material: string, filamentLine: string): {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
} | null {
  const normalizedMat = normalizeElegooMaterial(material, filamentLine);
  
  const settings: Record<string, { nozzleTempMin: number; nozzleTempMax: number; bedTempMin: number; bedTempMax: number }> = {
    'PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 45, bedTempMax: 60 },
    'PLA-CF': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60 },
    'PLA-Wood': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 45, bedTempMax: 60 },
    'PLA-Marble': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 45, bedTempMax: 60 },
    'PETG': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
    'PETG-CF': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85 },
    'PETG-GF': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85 },
    'TPU': { nozzleTempMin: 210, nozzleTempMax: 230, bedTempMin: 40, bedTempMax: 60 },
    'PC': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 90, bedTempMax: 110 },
    'ASA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110 },
    'ABS': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110 },
    'PA': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90 },
    'PA-CF': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 80, bedTempMax: 100 },
  };
  
  return settings[normalizedMat] || settings['PLA'];
}

// Color to hex mappings for Elegoo colors (~70 colors)
export const ELEGOO_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '1A1A1A',
  'white': 'FFFFFF',
  'grey': '808080',
  'gray': '808080',
  'red': 'CC0000',
  'blue': '0066CC',
  'green': '228B22',
  'yellow': 'FFD700',
  'orange': 'FF6600',
  'pink': 'FF69B4',
  'purple': '6B3FA0',
  'brown': '8B4513',
  'beige': 'F5DEB3',
  'translucent': 'E8E8E8',
  'transparent': 'E8E8E8',
  'clear': 'E8E8E8',
  
  // Special colors
  'neon green': '39FF14',
  'dark blue': '00008B',
  'sky blue': '87CEEB',
  'sea green': '2E8B57',
  'space grey': '52565A',
  'space gray': '52565A',
  'wood color': 'C19A6B',
  'bronze filled': 'CD7F32',
  
  // Silk colors
  'silk gold': 'D4AF37',
  'silk silver grey': 'C0C0C0',
  'silk silver gray': 'C0C0C0',
  'silk white': 'F8F8FF',
  'silk copper': 'B87333',
  'silk holly green': '2E8B57',
  'silk mint green': '98FB98',
  'silk coral pink': 'FF7F7F',
  'silk red': 'DC143C',
  'silk green red': '4CAF50', // dual color - use primary
  'silk black purple': '301934',
  'silk black red': '3D0000',
  'silk blue magenta': '8B008B',
  'silk blue green': '008B8B',
  'silk blue green orange': '00CED1',
  'silk blue purple black': '4B0082',
  'silk blue purple': '6A5ACD',
  'silk yellow purple': 'DA70D6',
  'silk black green': '013220',
  
  // Matte colors
  'matte black': '2B2B2B',
  'matte white': 'F5F5F5',
  'slate grey': '708090',
  'slate gray': '708090',
  'teal green': '008080',
  'navy blue': '000080',
  'ruby red': 'E0115F',
  'sunshine yellow': 'FFFD37',
  'sakura pink': 'FFB7C5',
  'lavender purple': 'B57EDC',
  'ice blue': 'A5F2F3',
  'mint green': '98FB98',
  'earth brown': '5C4033',
  
  // Sparkle colors
  'sparkle black': '1C1C1C',
  'sparkle gold': 'CFB53B',
  'sparkle green': '00A36C',
  'sparkle red': 'CF1020',
  'sparkle dark grey': '3C3C3C',
  'sparkle dark gray': '3C3C3C',
  'sparkle turquoise': '40E0D0',
  'sparkle purplish grey': '7D7D8A',
  'sparkle purplish gray': '7D7D8A',
  
  // Galaxy colors
  'galaxy black': '0D0D0D',
  'galaxy purple': '4A0080',
  'galaxy peacock blue': '006666',
  
  // Marble colors
  'marble': 'E8E8E8',
  'marble brick red': 'CB4154',
  'marble cement grey': 'A8A8A8',
  'marble cement gray': 'A8A8A8',
  
  // Metal colors
  'metal gold': 'CFB53B',
  'metal bronze': 'CD7F32',
  'metal blue': '4A6FA5',
  'metal green': '4A7C59',
  
  // Wood colors
  'wood filled': 'C19A6B',
  
  // Fiber colors
  'carbon fiber black': '1A1A1A',
  'glass fiber black': '2C2C2C',
  'glass fiber grey': '6E6E6E',
  'glass fiber gray': '6E6E6E',
  'glass fiber white': 'D8D8D8',
  'carbon fiber grey': '3D3D3D',
  'carbon fiber gray': '3D3D3D',
  'carbon fiber red': '8B0000',
  'carbon fiber blue': '1C3A6E',
  'carbon fiber green': '2E5A2E',
  'carbon fiber purple': '4B0082',
  
  // PETG Pro colors
  'olive green': '6B8E23',
  'silver': 'C0C0C0',
  'burgundy red': '800020',
  'light blue': 'ADD8E6',
  
  // PC colors
  'clear black': '1A1A1A',
  
  // PLA Basic colors
  'cyan': '00FFFF',
  'cocoa brown': '3D2314',
  'hot pink': 'FF69B4',
  'sunflower yellow': 'FFDA03',
  'cobalt blue': '0047AB',
  'apple green': '8DB600',
  'turquoise green': '00C78C',
};

// Get hex code for a color
export function getElegooColorHex(color: string): string | null {
  const normalized = color.toLowerCase().trim();
  return ELEGOO_COLOR_MAPPING[normalized] || null;
}

// Main enrichment function
export function enrichElegooProduct(material: string, filamentLine: string, color: string): {
  material: string;
  finishType: string;
  productLineId: string;
  colorHex: string | null;
  isAbrasive: boolean;
  isHighSpeed: boolean;
  printSettings: ReturnType<typeof getElegooPrintSettings>;
} {
  return {
    material: normalizeElegooMaterial(material, filamentLine),
    finishType: extractElegooFinishType(filamentLine),
    productLineId: generateElegooProductLineId(material, filamentLine),
    colorHex: getElegooColorHex(color),
    isAbrasive: isAbrasiveMaterial(material, filamentLine),
    isHighSpeed: isHighSpeedCapable(filamentLine),
    printSettings: getElegooPrintSettings(material, filamentLine),
  };
}

// CSV seed data (~145 valid products after filtering bundles/defaults)
export const ELEGOO_PRODUCT_SEED: ElegooProductSeed[] = [
  // PLA Standard (18 colors)
  { material: 'PLA', filamentLine: 'PLA', color: 'Black', productUrl: 'https://ca.elegoo.com/collections/pla-filament/products/pla-filament-1-75mm-colored-1kg', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmBlack1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'White', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033444630', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmWhite1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Grey', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033477398', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmGrey1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Neon Green', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033510166', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmNeonGreen1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Dark Blue', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033542934', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmDarkBlue1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Red', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033575702', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmRed1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Yellow', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033608470', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmYellow1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Orange', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033641238', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmOrange1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Pink', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033706774', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmPink1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Purple', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033739542', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmPurple1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Translucent', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033772310', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmclear1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Sky Blue', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033805078', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmSkyBlue1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Sea Green', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033837846', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmseagreen1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Space Grey', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033870614', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmspacegrey1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Wood Color', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033903382', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmWoodColor1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Brown', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033936150', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmBrown_1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Beige', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=47691033968918', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA1.75mmBeige1kg.jpg' },
  { material: 'PLA', filamentLine: 'PLA', color: 'Bronze Filled', productUrl: 'https://ca.elegoo.com/products/pla-filament-1-75mm-colored-1kg?variant=49339750646038', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_bronze.jpg' },

  // PLA Silk (18 colors)
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Gold', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=47691538202902', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-gold.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Silver Grey', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=47691538301206', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-silver.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk White', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=49612195397910', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-white.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Copper', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=49016258494742', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-bronze.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Holly Green', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=49016258560278', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-holly-green.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Mint Green', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=47691538432278', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-mint-green.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Coral Pink', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=47691538399510', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-coral-pink.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Red', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=49016258527510', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_1.75mm.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Green Red', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=47691538268438', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-green-red.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Black Purple', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=49612195430678', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-black-purple.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Black Red', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=49612195299606', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-black-red.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Blue Magenta', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=47691538366742', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-blue-purple.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Blue Green', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=49612195463446', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-blue-green.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Blue Green Orange', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=49612195365142', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-blue-green-orange.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Blue Purple Black', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=49612195332374', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_-silk-blue-purple-black.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Blue Purple', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=50319903195414', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_Silk_Blue_Purple_1.75mm.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Yellow Purple', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=50606750761238', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_1.75mm_409038d5-8706-4577-a8d6-e015f65995ef.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk', color: 'Silk Black Green', productUrl: 'https://ca.elegoo.com/products/elegoo-silk-pla-filament-1-75mm-colored-1kg?variant=50606750794006', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_1.75mm_f4157c58-cf86-4fcc-b040-bdebe45c09e7.jpg' },

  // PLA Matte (14 colors)
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Matte Black', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=47691626742038', imageUrl: 'https://ca.elegoo.com/cdn/shop/products/PLAMATTE1KGBlack_2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Matte White', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=47691626774806', imageUrl: 'https://ca.elegoo.com/cdn/shop/products/PLAMATTE1KGWhite_2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Slate Grey', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=47691626938646', imageUrl: 'https://ca.elegoo.com/cdn/shop/products/PLAMATTE1KGSlateGrey_1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Teal Green', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=47691626873110', imageUrl: 'https://ca.elegoo.com/cdn/shop/products/PLAMATTE1KGTealGreen_2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Navy Blue', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=47691626840342', imageUrl: 'https://ca.elegoo.com/cdn/shop/products/PLAMATTE1KGNavyBlue_2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Ruby Red', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=47691626807574', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_MATTE_1KG.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Sunshine Yellow', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=47691626905878', imageUrl: 'https://ca.elegoo.com/cdn/shop/products/PLAMATTE1KGSunshineYellow_2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Sakura Pink', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=47691627036950', imageUrl: 'https://ca.elegoo.com/cdn/shop/products/PLAMATTE1KGPink_2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Lavender Purple', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=47691626971414', imageUrl: 'https://ca.elegoo.com/cdn/shop/products/PLAMATTE1KGLavenderPurple_1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Ice Blue', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=47691627069718', imageUrl: 'https://ca.elegoo.com/cdn/shop/products/PLAMATTE1KGIceBlue_2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Mint Green', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=47691627135254', imageUrl: 'https://ca.elegoo.com/cdn/shop/products/PLAMATTE1KGMintGreen_2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Beige', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=47691627102486', imageUrl: 'https://ca.elegoo.com/cdn/shop/products/PLAMATTE1KGBeige_2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Earth Brown', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=50736718381334', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/MATTE.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte', color: 'Orange', productUrl: 'https://ca.elegoo.com/products/pla-matte-filament-1-75mm-colored-1kg?variant=50736719134998', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/MATTE_c9822990-e2bb-4ca8-830a-27fb2ade1fa5.jpg' },

  // PLA Sparkle (7 colors)
  { material: 'PLA', filamentLine: 'PLA Sparkle', color: 'Sparkle Black', productUrl: 'https://ca.elegoo.com/collections/pla-filament/products/pla-sparkle-filament-1-75mm-colored-1-kg', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG.jpg' },
  { material: 'PLA', filamentLine: 'PLA Sparkle', color: 'Sparkle Gold', productUrl: 'https://ca.elegoo.com/products/pla-sparkle-filament-1-75mm-colored-1-kg?variant=50169527533846', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_79cfb179-0112-482e-803d-c5d29d661ef7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Sparkle', color: 'Sparkle Green', productUrl: 'https://ca.elegoo.com/products/pla-sparkle-filament-1-75mm-colored-1-kg?variant=50169527566614', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_fa044136-8c2c-4a4c-8d64-9439b7ba7610.jpg' },
  { material: 'PLA', filamentLine: 'PLA Sparkle', color: 'Sparkle Red', productUrl: 'https://ca.elegoo.com/products/pla-sparkle-filament-1-75mm-colored-1-kg?variant=50169527599382', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_4c463547-1040-4001-88ae-9467241cb035.jpg' },
  { material: 'PLA', filamentLine: 'PLA Sparkle', color: 'Sparkle Dark Grey', productUrl: 'https://ca.elegoo.com/products/pla-sparkle-filament-1-75mm-colored-1-kg?variant=50169527632150', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_b5b5a994-e195-4f57-92c9-dd53196dbd10.jpg' },
  { material: 'PLA', filamentLine: 'PLA Sparkle', color: 'Sparkle Turquoise', productUrl: 'https://ca.elegoo.com/products/pla-sparkle-filament-1-75mm-colored-1-kg?variant=50169527664918', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_e8ef7bc1-9c3c-4da7-a3f8-02780268e14a.jpg' },
  { material: 'PLA', filamentLine: 'PLA Sparkle', color: 'Sparkle Purplish Grey', productUrl: 'https://ca.elegoo.com/products/pla-sparkle-filament-1-75mm-colored-1-kg?variant=50169527697686', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_b6c8d18f-034c-4c2b-a6a5-1b12374172eb.jpg' },

  // PLA Galaxy (3 colors)
  { material: 'PLA', filamentLine: 'PLA Galaxy', color: 'Galaxy Black', productUrl: 'https://ca.elegoo.com/collections/pla-filament/products/galaxy-pla-filament-1-75mm-colored-1kg', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/Galaxy_PLA_1.75mm-Galaxy_Black.jpg' },
  { material: 'PLA', filamentLine: 'PLA Galaxy', color: 'Galaxy Purple', productUrl: 'https://ca.elegoo.com/products/galaxy-pla-filament-1-75mm-colored-1kg?variant=49512841543958', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/Galaxy_PLA_1.75mm-Galaxy_Purple.jpg' },
  { material: 'PLA', filamentLine: 'PLA Galaxy', color: 'Galaxy Peacock Blue', productUrl: 'https://ca.elegoo.com/products/galaxy-pla-filament-1-75mm-colored-1kg?variant=49512841576726', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/Galaxy_PLA_1.75mm-Galaxy_Peacock_Blue.jpg' },

  // PLA Marble (3 colors)
  { material: 'PLA', filamentLine: 'PLA Marble', color: 'Marble', productUrl: 'https://ca.elegoo.com/collections/pla-filament/products/pla-marble', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_5c1ce29a-a662-4bd7-8d85-1a2386878494.jpg' },
  { material: 'PLA', filamentLine: 'PLA Marble', color: 'Marble Brick Red', productUrl: 'https://ca.elegoo.com/products/pla-marble?variant=50541865730326', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_-_.1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Marble', color: 'Marble Cement Grey', productUrl: 'https://ca.elegoo.com/products/pla-marble?variant=50541865763094', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_89caf88c-f539-4b62-8f73-aa32a57bf7fc.jpg' },

  // PLA Metal (4 colors)
  { material: 'PLA', filamentLine: 'PLA Metal', color: 'Metal Gold', productUrl: 'https://ca.elegoo.com/products/pla-metal-filament-1-75-mm-colored-1-kg?variant=50560730071318', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/1024.jpg' },
  { material: 'PLA', filamentLine: 'PLA Metal', color: 'Metal Bronze', productUrl: 'https://ca.elegoo.com/products/pla-metal-filament-1-75-mm-colored-1-kg?variant=50560730104086', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/1024_c66740ba-076d-4a22-991c-01db1697f047.jpg' },
  { material: 'PLA', filamentLine: 'PLA Metal', color: 'Metal Blue', productUrl: 'https://ca.elegoo.com/products/pla-metal-filament-1-75-mm-colored-1-kg?variant=50560730136854', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/1024_a16bde5f-881e-4c9b-bc8c-e440a4befbce.jpg' },
  { material: 'PLA', filamentLine: 'PLA Metal', color: 'Metal Green', productUrl: 'https://ca.elegoo.com/products/pla-metal-filament-1-75-mm-colored-1-kg?variant=50560730169622', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/1024_ebc9dea7-f903-497d-a873-2ccfb8239e80.jpg' },

  // PLA Wood (1 color)
  { material: 'PLA', filamentLine: 'PLA Wood', color: 'Wood filled', productUrl: 'https://ca.elegoo.com/collections/pla-filament/products/pla-wood', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA_1KG_64302e95-6afc-4813-9806-176d1a0a7aab.jpg' },

  // PLA-CF (1 color)
  { material: 'PLA', filamentLine: 'PLA-CF', color: 'Carbon Fiber Black', productUrl: 'https://ca.elegoo.com/collections/pla-filament/products/pla-cf-filament-1-75mm-black-1kg', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PLA-CF_Filament_-_Model.jpg' },

  // Rapid PETG (12 colors)
  { material: 'PETG', filamentLine: 'Rapid PETG', color: 'Black', productUrl: 'https://ca.elegoo.com/collections/petg-filament/products/rapid-petg-filament-1-75mm-colored-1kg', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RAPID_PETG_1KG_black_944d35c9-ccd9-48f8-a029-04468cf93c17.jpg' },
  { material: 'PETG', filamentLine: 'Rapid PETG', color: 'White', productUrl: 'https://ca.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg?variant=47691662393622', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RAPID_PETG_1KG_white_c242b6d0-6fed-4f28-86b9-0625127bead4.jpg' },
  { material: 'PETG', filamentLine: 'Rapid PETG', color: 'Grey', productUrl: 'https://ca.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg?variant=47691662590230', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RAPID_PETG_1KG_grey.jpg' },
  { material: 'PETG', filamentLine: 'Rapid PETG', color: 'Green', productUrl: 'https://ca.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg?variant=47691662524694', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RAPID_PETG_1KG_Green.jpg' },
  { material: 'PETG', filamentLine: 'Rapid PETG', color: 'Blue', productUrl: 'https://ca.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg?variant=47691662491926', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RAPID_PETG_1KG_Blue.jpg' },
  { material: 'PETG', filamentLine: 'Rapid PETG', color: 'Red', productUrl: 'https://ca.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg?variant=47691662426390', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RAPID_PETG_1KG_Red.jpg' },
  { material: 'PETG', filamentLine: 'Rapid PETG', color: 'Yellow', productUrl: 'https://ca.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg?variant=47691662557462', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RAPID_PETG_1KG_Yellow.jpg' },
  { material: 'PETG', filamentLine: 'Rapid PETG', color: 'Orange', productUrl: 'https://ca.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg?variant=47691662622998', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RAPID_PETG_1KG_Orange.jpg' },
  { material: 'PETG', filamentLine: 'Rapid PETG', color: 'Space Grey', productUrl: 'https://ca.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg?variant=48826687717654', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RAPID_PETG_1KG_Space_Gey.jpg' },
  { material: 'PETG', filamentLine: 'Rapid PETG', color: 'Brown', productUrl: 'https://ca.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg?variant=48826687750422', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RAPID_PETG_1KG_Brown.jpg' },
  { material: 'PETG', filamentLine: 'Rapid PETG', color: 'Beige', productUrl: 'https://ca.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg?variant=48826687783190', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RAPID_PETG_1KG_Beige.jpg' },
  { material: 'PETG', filamentLine: 'Rapid PETG', color: 'Transparent', productUrl: 'https://ca.elegoo.com/products/rapid-petg-filament-1-75mm-colored-1kg?variant=48826687815958', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RAPID_PETG_1KG_Transparent.jpg' },

  // PETG Pro (13 colors)
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'Black', productUrl: 'https://ca.elegoo.com/collections/petg-filament/products/petg-pro-filament-1-75mm-colored-1kg', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_42c24a3b-6f84-429e-b090-f87c570a98d1.jpg' },
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'White', productUrl: 'https://ca.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg?variant=47691602985238', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_6c92db88-78d7-4016-a547-40eccf9bfc57.jpg' },
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'Grey', productUrl: 'https://ca.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg?variant=47691603018006', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_e3cd6d38-30d8-4e5e-beed-eacccf8fcc8c.jpg' },
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'Olive Green', productUrl: 'https://ca.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg?variant=48992429670678', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_bb1a6119-054a-4dd7-a407-a5067aa94c71.jpg' },
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'Blue', productUrl: 'https://ca.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg?variant=47691603083542', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_b72036f9-2e58-4e61-94ab-d6923ed35cd2.jpg' },
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'Red', productUrl: 'https://ca.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg?variant=47691603149078', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_254e88b9-a6c3-4bc7-be37-13ad1e94500a.jpg' },
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'Pink', productUrl: 'https://ca.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg?variant=47691603116310', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_e66307c4-3869-490e-8974-1b623b71745d.jpg' },
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'Silver', productUrl: 'https://ca.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg?variant=47691603050774', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_7fb3a5a8-ecc4-4d91-8309-fc8411879885.jpg' },
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'Burgundy Red', productUrl: 'https://ca.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg?variant=50371214344470', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_1KG_67606b27-482b-4568-abd4-3c90e32c2eec.jpg' },
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'Light Blue', productUrl: 'https://ca.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg?variant=50371214377238', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_d0b575e1-386c-457b-8e06-5eebf4083c27.jpg' },
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'Green', productUrl: 'https://ca.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg?variant=50371214410006', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_0a476e13-96c0-4042-b057-bbbbf87e2d0f.jpg' },
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'Yellow', productUrl: 'https://ca.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg?variant=50371214442774', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_ecbb9a59-8299-4fe4-aa42-d182d890d2b6.jpg' },
  { material: 'PETG', filamentLine: 'PETG Pro', color: 'Purple', productUrl: 'https://ca.elegoo.com/products/petg-pro-filament-1-75mm-colored-1kg?variant=50371214475542', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG_PRO_46738334-a340-45b9-b487-54629fbffec0.jpg' },

  // PETG-GF (3 colors)
  { material: 'PETG', filamentLine: 'PETG-GF', color: 'Glass Fiber Black', productUrl: 'https://ca.elegoo.com/products/petg-gf-filament-1-75mm-colored-1kg?variant=50161168449814', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG-GF_1KG_1.75mm_03bc582b-9e96-4ae9-8c1d-b51be0994ea8.jpg' },
  { material: 'PETG', filamentLine: 'PETG-GF', color: 'Glass Fiber Grey', productUrl: 'https://ca.elegoo.com/products/petg-gf-filament-1-75mm-colored-1kg?variant=50161168515350', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG-GF_1KG_1.75mm_8c8d0d4e-f68c-4cb3-93f6-779f086cc7c0.jpg' },
  { material: 'PETG', filamentLine: 'PETG-GF', color: 'Glass Fiber White', productUrl: 'https://ca.elegoo.com/products/petg-gf-filament-1-75mm-colored-1kg?variant=50161168548118', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG-GF_1KG_1.75mm_e8bc5db1-614a-41f1-b979-758325121c2a.jpg' },

  // PETG-CF (6 colors)
  { material: 'PETG', filamentLine: 'PETG-CF', color: 'Carbon Fiber Black', productUrl: 'https://ca.elegoo.com/collections/petg-filament/products/petg-cf-filament-1-75mm-colored-1kg', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG-CF_1KG_1.75mm-1KG_e82b3086-8147-4b19-9b28-74c5c86aa100.jpg' },
  { material: 'PETG', filamentLine: 'PETG-CF', color: 'Carbon Fiber Grey', productUrl: 'https://ca.elegoo.com/products/petg-cf-filament-1-75mm-colored-1kg?variant=50161168417046', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG-CF_1KG_1.75mm-1KG_35bae9f0-114c-4190-a3b6-1568473c7ceb.jpg' },
  { material: 'PETG', filamentLine: 'PETG-CF', color: 'Carbon Fiber Red', productUrl: 'https://ca.elegoo.com/products/petg-cf-filament-1-75mm-colored-1kg?variant=50873566593302', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG-CF_1KG_1.75mm-1KG_fe7e7020-e550-4367-98e1-8b9cabc49c48.jpg' },
  { material: 'PETG', filamentLine: 'PETG-CF', color: 'Carbon Fiber Blue', productUrl: 'https://ca.elegoo.com/products/petg-cf-filament-1-75mm-colored-1kg?variant=50873566626070', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG-CF_1KG_1.75mm-1KG_1ce0e284-ae0e-4cbb-99c8-440206495b71.jpg' },
  { material: 'PETG', filamentLine: 'PETG-CF', color: 'Carbon Fiber Green', productUrl: 'https://ca.elegoo.com/products/petg-cf-filament-1-75mm-colored-1kg?variant=50873566658838', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG-CF_1KG_1.75mm-1KG_f4d18f8b-deab-4db2-bbbb-d2bc058ea326.jpg' },
  { material: 'PETG', filamentLine: 'PETG-CF', color: 'Carbon Fiber Purple', productUrl: 'https://ca.elegoo.com/products/petg-cf-filament-1-75mm-colored-1kg?variant=50873566691606', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PETG-CF_1KG_1.75mm-1KG_2856cf24-d990-43cf-a9d7-be454c4b77f3.jpg' },

  // TPU 95A (7 colors)
  { material: 'TPU', filamentLine: 'TPU 95A', color: 'Black', productUrl: 'https://ca.elegoo.com/collections/tpu-pc-1/products/tpu-filament-1-75mm-colored-1kg', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/TPU_95A-Black-1KG.jpg' },
  { material: 'TPU', filamentLine: 'TPU 95A', color: 'White', productUrl: 'https://ca.elegoo.com/products/tpu-filament-1-75mm-colored-1kg?variant=47691796218134', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/TPU_95A-White-1KG_3c0d63cb-3397-4072-b740-d1fa3912368e.jpg' },
  { material: 'TPU', filamentLine: 'TPU 95A', color: 'Grey', productUrl: 'https://ca.elegoo.com/products/tpu-filament-1-75mm-colored-1kg?variant=50061628244246', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/TPU_95A-Grey-1KG_0749982e-6f4e-44d2-bc96-5c9def6aed5d.jpg' },
  { material: 'TPU', filamentLine: 'TPU 95A', color: 'Red', productUrl: 'https://ca.elegoo.com/products/tpu-filament-1-75mm-colored-1kg?variant=50061628277014', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/TPU_95A-Red-1KG_f1c67741-e1e2-4f9a-94c2-f3535c93f951.jpg' },
  { material: 'TPU', filamentLine: 'TPU 95A', color: 'Blue', productUrl: 'https://ca.elegoo.com/products/tpu-filament-1-75mm-colored-1kg?variant=50061628309782', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/TPU_95A-Blue-1KG_adffdfbf-e90a-4791-ad96-4e24363b78e6.jpg' },
  { material: 'TPU', filamentLine: 'TPU 95A', color: 'Green', productUrl: 'https://ca.elegoo.com/products/tpu-filament-1-75mm-colored-1kg?variant=50061628342550', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/TPU_95A-Green-1KG_68ae67e0-57e8-4c25-8780-f9b36cfbf96b.jpg' },
  { material: 'TPU', filamentLine: 'TPU 95A', color: 'Translucent', productUrl: 'https://ca.elegoo.com/products/tpu-filament-1-75mm-colored-1kg?variant=50061628375318', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/TPU_95A-Translucent-1KG_ff27952f-f03d-45b4-a0b3-98bfdbbdc58b.jpg' },

  // Rapid TPU 95A (3 colors)
  { material: 'TPU', filamentLine: 'Rapid TPU 95A', color: 'Black', productUrl: 'https://ca.elegoo.com/products/rapid-tpu-filament-1-75mm-colored-1kg?variant=50371849322774', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/RapidTPU95A-_-1KG_47f5ece7-a873-4916-9b24-1db424537572.jpg' },
  { material: 'TPU', filamentLine: 'Rapid TPU 95A', color: 'White', productUrl: 'https://ca.elegoo.com/products/rapid-tpu-filament-1-75mm-colored-1kg?variant=50371849388310', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/Rapid_TPU_95A-_-1KG_3f77d999-aeba-474c-b74e-0e5b2a72542c.jpg' },
  { material: 'TPU', filamentLine: 'Rapid TPU 95A', color: 'Red', productUrl: 'https://ca.elegoo.com/products/rapid-tpu-filament-1-75mm-colored-1kg?variant=50371849421078', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/Rapid_TPU_95A-_-1KG_e000a163-e9f3-40e9-84fd-6485d62c1809.jpg' },

  // PC (4 colors)
  { material: 'PC', filamentLine: 'PC', color: 'Black', productUrl: 'https://ca.elegoo.com/collections/tpu-pc-1/products/pc-filament-1-75mm-colored-1kg', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PC_1KG_1.75mm.jpg' },
  { material: 'PC', filamentLine: 'PC', color: 'White', productUrl: 'https://ca.elegoo.com/products/pc-filament-1-75mm-colored-1kg?variant=50161169170710', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PC1KG_1.75mm_219af313-d639-48ea-8948-4ee25d4c2b69.jpg' },
  { material: 'PC', filamentLine: 'PC', color: 'Clear Black', productUrl: 'https://ca.elegoo.com/products/pc-filament-1-75mm-colored-1kg?variant=50161169203478', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PC_1KG_1.75mm_345d4952-ede2-4641-8850-ff1a3d763f88.jpg' },
  { material: 'PC', filamentLine: 'PC', color: 'Transparent', productUrl: 'https://ca.elegoo.com/products/pc-filament-1-75mm-colored-1kg?variant=50161169236246', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PC_1KG_1.75mm_4efed1b0-0a4e-4a6e-ad7a-1e150ecde16b.jpg' },

  // ASA (6 colors)
  { material: 'ASA', filamentLine: 'ASA', color: 'Black', productUrl: 'https://ca.elegoo.com/products/asa-filament-1-75mm-colored-1kg?variant=47691591581974', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/ASA_1KG_1.75mm_fc29bcc9-d07d-4f87-ad65-29eb298fd1fe.jpg' },
  { material: 'ASA', filamentLine: 'ASA', color: 'White', productUrl: 'https://ca.elegoo.com/products/asa-filament-1-75mm-colored-1kg?variant=47691591614742', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/ASA_1KG_1.75mm_5af0b1e0-5320-47c7-b7c1-3bc325f2228b.jpg' },
  { material: 'ASA', filamentLine: 'ASA', color: 'Blue', productUrl: 'https://ca.elegoo.com/products/asa-filament-1-75mm-colored-1kg?variant=50609697095958', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/ASA_1KG_1.75mm_393dcb12-8620-4a53-b7f8-097b508dd359.jpg' },
  { material: 'ASA', filamentLine: 'ASA', color: 'Green', productUrl: 'https://ca.elegoo.com/products/asa-filament-1-75mm-colored-1kg?variant=50609697128726', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/ASA_1KG_1.75mm_b003d00d-93aa-4233-be99-5f2673a5a559.jpg' },
  { material: 'ASA', filamentLine: 'ASA', color: 'Grey', productUrl: 'https://ca.elegoo.com/products/asa-filament-1-75mm-colored-1kg?variant=50609697161494', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/ASA_1KG_1.75mm_56926557-6da6-41cf-a93a-eca336d47fc4.jpg' },
  { material: 'ASA', filamentLine: 'ASA', color: 'Red', productUrl: 'https://ca.elegoo.com/products/asa-filament-1-75mm-colored-1kg?variant=50609697194262', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/ASA_1KG_1.75mm_d8798f2b-924c-41ad-93f1-f3558835f025.jpg' },

  // ABS (6 colors)
  { material: 'ABS', filamentLine: 'ABS', color: 'Black', productUrl: 'https://ca.elegoo.com/products/abs-filament-1-75mm-colored-1kg?variant=50220954157334', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/ABS_-1KG_fd32aa8a-2ffc-4cf7-8c66-ec100dedc222.jpg' },
  { material: 'ABS', filamentLine: 'ABS', color: 'White', productUrl: 'https://ca.elegoo.com/products/abs-filament-1-75mm-colored-1kg?variant=50220954452246', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/ABS_-1KG_f1eec119-546e-4163-9198-1aa6a8adb85d.jpg' },
  { material: 'ABS', filamentLine: 'ABS', color: 'Red', productUrl: 'https://ca.elegoo.com/products/abs-filament-1-75mm-colored-1kg?variant=50220954485014', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/ABS_-1KG_50dba73a-7512-42f2-aeeb-5c5e768f183e.jpg' },
  { material: 'ABS', filamentLine: 'ABS', color: 'Grey', productUrl: 'https://ca.elegoo.com/products/abs-filament-1-75mm-colored-1kg?variant=50220954517782', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/ABS_-1KG_25028214-9fa7-40c3-bacc-f77e1466623e.jpg' },
  { material: 'ABS', filamentLine: 'ABS', color: 'Blue', productUrl: 'https://ca.elegoo.com/products/abs-filament-1-75mm-colored-1kg?variant=50220954550550', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/ABS_-1KG_0f7d4972-7bd9-4014-afe8-9569407efcc1.jpg' },
  { material: 'ABS', filamentLine: 'ABS', color: 'Orange', productUrl: 'https://ca.elegoo.com/products/abs-filament-1-75mm-colored-1kg?variant=50220954583318', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/ABS_-1KG_99154d83-c4e1-4936-8637-550ebb455665.jpg' },

  // PAHT-CF (1 color)
  { material: 'PA', filamentLine: 'PAHT-CF', color: 'Carbon Fiber Black', productUrl: 'https://ca.elegoo.com/collections/fiber-reinforced-1/products/paht-cf-filament-1-75mm-colored-1kg', imageUrl: 'https://ca.elegoo.com/cdn/shop/files/PAHT-CF_1KG_1.75mm_98b6d89c-cca7-4334-afc6-cd5822edbe83.jpg' },
];

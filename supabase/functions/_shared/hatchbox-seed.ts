/**
 * Hatchbox Product Seed
 * 
 * High-fidelity CSV-seeded data for Hatchbox filaments.
 * Source: hatchbox3d.com Shopify store
 * 
 * Total Products: ~230 filaments (after filtering resins/3mm)
 * Materials: PLA, PLA PRO+, PLA MAX, PETG, PETG Rapid, ABS, TPU
 * Finish Types: Standard, Matte, Silk, Metallic, Glow, Wood, Stone, Rainbow
 */

export interface HatchboxSeedEntry {
  material: string;
  filamentLine: string;
  title: string;
  url: string;
  color: string;
  imageUrl: string;
  hexCode: string;
  finishType: 'Standard' | 'Matte' | 'Silk' | 'Metallic' | 'Glow' | 'Wood' | 'Stone' | 'Rainbow' | 'Translucent' | 'UV';
  highSpeedCapable: boolean;
  diameter: number;
}

// Comprehensive color to hex mapping for Hatchbox products
const HATCHBOX_HEX_MAP: Record<string, string> = {
  // Standard Colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'red': '#DC2626',
  'blue': '#0066CC',
  'gray': '#808080',
  'grey': '#808080',
  'silver': '#C0C0C0',
  'orange': '#FF6600',
  'green': '#228B22',
  'yellow': '#FFCC00',
  'pink': '#FFC0CB',
  'purple': '#800080',
  'gold': '#FFD700',
  'brown': '#8B4513',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'beige': '#F5F5DC',
  'natural': '#F5E6D3',
  'navy': '#000080',
  
  // Special Colors
  'midnight purple': '#2D1B4E',
  'iron red': '#8B3A3A',
  'peacock blue': '#006B6B',
  'forest green': '#228B22',
  'mint green': '#98FF98',
  'neon green': '#39FF14',
  'dark yellow': '#DAA520',
  'pastel green': '#77DD77',
  'light blue': '#ADD8E6',
  'baby blue': '#89CFF0',
  'lake blue': '#4F94CD',
  'gray blue': '#6699CC',
  'dark green': '#006400',
  'lime green': '#32CD32',
  'light brown': '#C4A484',
  'light purple': '#B19CD9',
  'light orange': '#FFB347',
  'dark rainbow': '#7F00FF',
  'light rainbow': '#FF69B4',
  'carbon fiber': '#3D3D3D',
  'cool gray': '#8C8C8C',
  'cool grey': '#8C8C8C',
  
  // Matte Colors
  'black matte': '#2A2A2A',
  'navy matte': '#1A1A5E',
  'white matte': '#F8F8F8',
  'gray matte': '#707070',
  'grey matte': '#707070',
  'brown matte': '#6B4423',
  'olive matte': '#556B2F',
  'terracotta matte': '#E2725B',
  'ash gray matte': '#B2BEB5',
  'soft purple matte': '#9370DB',
  'baby pink matte': '#F4C2C2',
  'light lavender matte': '#E6E6FA',
  'light periwinkle matte': '#C3CDE6',
  'seafoam blue matte': '#71EEB8',
  'cool mint matte': '#A8E4D4',
  'lemonade matte': '#FFF9C4',       // Warmer lemonade - distinct from lemon yellow
  'lemon yellow matte': '#FFFACD',   // Classic lemon yellow
  'dusty plum matte': '#8E4585',
  'blush pink matte': '#DE5D83',
  'butter yellow matte': '#FFFDD0',
  'topaz green matte': '#0F9D58',
  'brick red matte': '#CB4154',
  
  // Metallic/Shiny Colors
  'metallic finish gray': '#A9A9A9',
  'metallic finish black': '#2F2F2F',
  'metallic finish gold': '#FFD700',
  'metallic finish copper': '#DA8A67',
  'metallic finish blue': '#4169E1',
  'metallic finish purple': '#9966CC',
  'metallic finish red': '#CD5C5C',
  'metallic finish green': '#50C878',
  'metallic finish bronze': '#CD7F32',
  'metallic finish white': '#F5F5F5',
  'metallic finish mint green': '#AAF0D1',
  'metallic finish orange': '#FF8C00',
  'metallic finish brown': '#8B4513',
  'metallic finish beige': '#F5DEB3',
  
  // Silk Colors
  'silk gold': '#FFD700',
  'silk silver': '#E8E8E8',
  'silk light blue': '#87CEFA',
  'silk pink': '#FFB6C1',
  'silk mint': '#98FF98',
  'silk white': '#FFFAFA',
  'silk green': '#50C878',
  'silk copper': '#DA8A67',
  
  // Glow Colors
  'glow in the dark': '#BFFF00',
  'glow in the dark blue': '#00FFFF',
  
  // Wood Colors
  'wood': '#DEB887',
  'wood brown': '#A0522D',
  'wood cedar brown': '#8B4513',
  'wood gray': '#9E9E9E',
  'wood white': '#FAEBD7',
  'wood ivory': '#FFFFF0',
  
  // Stone Colors
  'stone brick red': '#CB4154',
  
  // Translucent Colors
  'transparent white': '#F8F8FF',
  'transparent': '#E8E8E8',
  'transparent green': '#90EE90',
  
  // UV Color Changing
  'uv color changing blue': '#1E90FF',
  'uv color changing purple': '#8B00FF',
  
  // Temperature Changing
  'temperature color changing': '#9370DB',
  
  // Reload/Refill Colors
  'black refill': '#1A1A1A',
  'white refill': '#FFFFFF',
  'silver refill': '#C0C0C0',
  'cool gray refill': '#8C8C8C',
  'midnight purple refill': '#2D1B4E',
  'black refill & reloadable spool': '#1A1A1A',
  'cool gray refill & reloadable spool': '#8C8C8C',
  'midnight purple refill & reloadable spool': '#2D1B4E',
  'silver refill & reloadable spool': '#C0C0C0',
  
  // Rapid PETG Colors (high-speed)
  'black rapid': '#1A1A1A',
  'white rapid': '#FFFFFF',
  'peacock blue rapid': '#006B6B',
  'dark green rapid': '#006400',
  'orange rapid': '#FF6600',
  'midnight purple rapid': '#2D1B4E',
  'dark yellow rapid': '#DAA520',
  'yellow rapid': '#FFCC00',
  'lake blue rapid': '#4F94CD',
  'gray blue rapid': '#6699CC',
  
  // PLA MAX V2 Colors
  'white v2': '#FFFFFF',
  'dark raspberry v2': '#872657',
  'laker gold v2': '#FDB927',
  'black v2': '#1A1A1A',
  
  // TPU Colors
  'chocolate': '#7B3F00',
};

function getHexCode(color: string): string {
  const normalizedColor = color.toLowerCase().trim()
    .replace(/\s*-\s*1\.75mm.*$/i, '') // Remove size suffix
    .replace(/\s*\(shore\s*95a\)$/i, '') // Remove shore rating
    .replace(/\s*–\s*1\.75mm.*$/i, ''); // Remove en-dash variant
  
  // Direct match
  if (HATCHBOX_HEX_MAP[normalizedColor]) {
    return HATCHBOX_HEX_MAP[normalizedColor];
  }
  
  // Try without "matte" suffix for base color
  const withoutMatte = normalizedColor.replace(/\s*matte$/i, '');
  if (HATCHBOX_HEX_MAP[withoutMatte]) {
    return HATCHBOX_HEX_MAP[withoutMatte];
  }
  
  // Try partial matches
  for (const [key, hex] of Object.entries(HATCHBOX_HEX_MAP)) {
    if (normalizedColor.includes(key) || key.includes(normalizedColor)) {
      return hex;
    }
  }
  
  // Default gray for unknown colors
  console.log(`[Hatchbox Seed] No hex found for: ${color}`);
  return '#808080';
}

function getFinishType(title: string, color: string): HatchboxSeedEntry['finishType'] {
  const combined = `${title} ${color}`.toLowerCase();
  
  if (combined.includes('silk')) return 'Silk';
  if (combined.includes('matte')) return 'Matte';
  if (combined.includes('metallic') || combined.includes('shiny') || combined.includes('shny')) return 'Metallic';
  if (combined.includes('glow') || combined.includes('gitd')) return 'Glow';
  if (combined.includes('wood')) return 'Wood';
  if (combined.includes('stone')) return 'Stone';
  if (combined.includes('rainbow')) return 'Rainbow';
  if (combined.includes('transparent') || combined.includes('translucent')) return 'Translucent';
  if (combined.includes('uv color') || combined.includes('temperature color')) return 'UV';
  
  return 'Standard';
}

function normalizeMaterial(material: string, title: string): string {
  const upperMaterial = material.toUpperCase();
  const lowerTitle = title.toLowerCase();
  
  if (upperMaterial === 'PLA PRO+' || lowerTitle.includes('pla pro+')) return 'PLA+';
  if (upperMaterial === 'PLA MAX' || lowerTitle.includes('pla max')) return 'PLA+';
  if (lowerTitle.includes('rapid petg')) return 'PETG-HS';
  if (upperMaterial === 'PETG') return 'PETG';
  if (upperMaterial === 'ABS') return 'ABS';
  if (upperMaterial === 'TPU') return 'TPU-95A';
  if (upperMaterial === 'PLA') return 'PLA';
  if (upperMaterial === 'RESIN') return 'Resin';
  
  return material;
}

function getFilamentLine(material: string, title: string, color: string): string {
  const lowerTitle = title.toLowerCase();
  const lowerColor = color.toLowerCase();
  
  // PLA variants
  if (lowerTitle.includes('pla max')) return 'pla-max-v2';
  if (lowerTitle.includes('pla pro+')) return 'pla-pro-plus';
  if (lowerTitle.includes('refill') || lowerTitle.includes('reload')) return 'pla-reload';
  if (lowerTitle.includes('silk') || lowerColor.includes('silk')) return 'pla-silk';
  if (lowerTitle.includes('matte') || lowerColor.includes('matte')) return 'pla-matte';
  if (lowerTitle.includes('metallic') || lowerColor.includes('metallic')) return 'pla-metallic';
  if (lowerTitle.includes('glow') || lowerColor.includes('glow')) return 'pla-glow';
  if (lowerTitle.includes('wood') || lowerColor.includes('wood')) return 'pla-wood';
  if (lowerTitle.includes('stone') || lowerColor.includes('stone')) return 'pla-stone';
  if (lowerTitle.includes('rainbow') || lowerColor.includes('rainbow')) return 'pla-rainbow';
  if (lowerTitle.includes('uv color') || lowerTitle.includes('temperature color')) return 'pla-color-change';
  if (lowerTitle.includes('carbon fiber')) return 'pla-cf';
  
  // PETG variants
  if (lowerTitle.includes('rapid petg')) return 'petg-rapid';
  if (material.toUpperCase() === 'PETG') return 'petg-standard';
  
  // Other materials
  if (material.toUpperCase() === 'ABS') return 'abs-standard';
  if (material.toUpperCase() === 'TPU') return 'tpu-standard';
  if (material.toUpperCase() === 'PLA PRO+') return 'pla-pro-plus';
  
  return 'pla-standard';
}

function isHighSpeedCapable(title: string): boolean {
  return title.toLowerCase().includes('rapid');
}

function getDiameter(title: string): number {
  if (title.includes('3.00') || title.includes('3mm') || title.includes('2.85')) {
    return 2.85;
  }
  return 1.75;
}

function cleanImageUrl(url: string): string {
  // Remove markdown escapes and clean URL
  return url.replace(/\\/g, '');
}

function cleanProductUrl(url: string): string {
  return url.replace(/\\/g, '');
}

// CSV data converted to TypeScript seed
// Each entry represents one color variant of a filament product
export const HATCHBOX_PRODUCT_SEED: HatchboxSeedEntry[] = [
  // PLA Standard - Core Colors
  { material: 'PLA', filamentLine: 'pla-standard', title: 'BLACK PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-blk', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-BLK-Picture-1_98d6d83a-aadc-4fcd-b27b-590895ace777.jpg', hexCode: '#1A1A1A', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'WHITE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-wht', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-WHT-Picture-1_23428b69-c36b-4d6e-af3f-1e2797e8aacf.jpg', hexCode: '#FFFFFF', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'RED PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/title', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-RED-Picture-1_a320a103-0755-4e94-9aee-8a2cc6477ff4.jpg', hexCode: '#DC2626', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'BLUE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-blu', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-BLU-Picture-1_f189b152-d3c0-4ebf-b8d7-c073e6e3ff96.jpg', hexCode: '#0066CC', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'GRAY PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-cg6c', color: 'Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1kg1.75-CG6C-Picture-1_52facbed-ec40-454d-aab0-26a77cbbca3e.jpg', hexCode: '#808080', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'SILVER PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-slv', color: 'Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SLV-Picture-1copy.jpg', hexCode: '#C0C0C0', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'ORANGE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-orn', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-ORN-Picture-1_d1d9a620-9b23-4660-b045-e70eb4ece52a.jpg', hexCode: '#FF6600', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'GREEN PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-grn', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-GRN-Picture-1_76b925dd-4555-48b0-aaf1-dac62bb3a304.jpg', hexCode: '#228B22', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'YELLOW PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-ylw', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-YLW-Picture-1_87bf381c-44ed-4105-9ac2-b17e5df8d187.jpg', hexCode: '#FFCC00', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'PINK PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-pnk', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-PNK-Picture-1_4978341c-6b5b-4bbe-b60a-72e83f36f438.jpg', hexCode: '#FFC0CB', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'PURPLE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-pur', color: 'Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-PUR-Picture-1.jpg', hexCode: '#800080', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'GOLD PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-gld', color: 'Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-GLD-Picture-1_b2785f06-8a5e-4346-ad07-157e59c5d78c.jpg', hexCode: '#FFD700', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'BROWN PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/hatchbox-abs-3d-printer-filament-dimensional-accuracy-0-03-mm-1-kg-spool-1-75-mm-brown', color: 'Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1kg1.75-731C-Picture-1_9c19929a-54aa-471c-b8a8-1eb78c6a2fd7.jpg', hexCode: '#8B4513', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'COPPER PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-copr', color: 'Copper', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-COPR-Picture-1_7338feb1-0c56-462b-ad14-80db4dc2cdfb.jpg', hexCode: '#B87333', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'BRONZE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-brnz', color: 'Bronze', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-BRNZ-Picture-1_1614ff01-4ac1-4f54-8f0b-35ab7bb4409f.jpg', hexCode: '#CD7F32', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'BEIGE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-720c', color: 'Beige', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1kg1.75-720C-Picture-1_21a2279e-0671-4cc5-8d6d-ab6d0103b14c.jpg', hexCode: '#F5F5DC', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'NATURAL PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-nat', color: 'Natural', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/NAT.PLA.MAIN.jpg', hexCode: '#F5E6D3', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'MIDNIGHT PURPLE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mpur', color: 'Midnight Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PLA-1KG1.75-MPUR-Picture-1.jpg', hexCode: '#2D1B4E', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'IRON RED PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-inred', color: 'Iron Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PLA-1KG1.75-INRED-Picture-1.jpg', hexCode: '#8B3A3A', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'PEACOCK BLUE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-pblu', color: 'Peacock Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PLA-1KG1.75-PBLU-Picture-1.jpg', hexCode: '#006B6B', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'FOREST GREEN PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-fgrn', color: 'Forest Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PLA-1KG1.75-FGRN-Picture-1.jpg', hexCode: '#228B22', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'MINT GREEN PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-318c', color: 'Mint Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1kg1.75-318C-Picture-1_62059040-3fc3-437b-81ea-467be1b1e6e1.jpg', hexCode: '#98FF98', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'NEON GREEN PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-802c', color: 'Neon Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1kg1.75-802C-Picture-1_410f1f04-da10-4005-9f3d-c49115be7fd9.jpg', hexCode: '#39FF14', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'PASTEL GREEN PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-365c', color: 'Pastel Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1kg1.75-365C-Picture-1_6f82db41-0156-42da-b29a-54253af48434.jpg', hexCode: '#77DD77', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'LIGHT BLUE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-285c', color: 'Light Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1kg1.75-285C-Picture-1.jpg', hexCode: '#ADD8E6', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'GRAY BLUE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-gryblu', color: 'Gray Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PLA-1KG1.75-GRYBLU-Picture-1.jpg', hexCode: '#6699CC', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-standard', title: 'DARK YELLOW PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-dylw', color: 'Dark Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PLA-1KG1.75-DYLW-Picture-1.jpg', hexCode: '#DAA520', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-cf', title: 'CARBON FIBER PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-carbon', color: 'Carbon Fiber', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-CARBON-Picture-1_0819efdd-8605-4f46-9524-314585a8eee5.jpg', hexCode: '#3D3D3D', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  
  // PLA Glow in the Dark
  { material: 'PLA', filamentLine: 'pla-glow', title: 'GLOW IN THE DARK PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-glow', color: 'Glow In The Dark', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-GLOW-Picture-1copy.jpg', hexCode: '#BFFF00', finishType: 'Glow', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-glow', title: 'GLOW IN THE DARK BLUE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-g-blu', color: 'Glow In The Dark Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-G-BLU-Picture-1_fb9e2c40-03c5-4fbf-a580-e5cdb70c74fa.jpg', hexCode: '#00FFFF', finishType: 'Glow', highSpeedCapable: false, diameter: 1.75 },
  
  // PLA Matte
  { material: 'PLA', filamentLine: 'pla-matte', title: 'BLACK MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-blk', color: 'Black Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-MAT-BLK-Picture-1.jpg', hexCode: '#2A2A2A', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'WHITE MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-wht', color: 'White Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-MAT-WHT-Picture-1.jpg', hexCode: '#F8F8F8', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'NAVY MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-nvy', color: 'Navy Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-MAT-NVY-Picture-1.jpg', hexCode: '#1A1A5E', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'GRAY MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-gry', color: 'Gray Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-MAT-GRY-Picture-1_1.jpg', hexCode: '#707070', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'ASH GRAY MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-agry', color: 'Ash Gray Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-MAT-AGRY-Picture-1.jpg', hexCode: '#B2BEB5', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'BROWN MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-brn', color: 'Brown Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-MAT-BRN-Picture-1.jpg', hexCode: '#6B4423', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'OLIVE MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-olv', color: 'Olive Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-MAT-OLV-Picture-1.jpg', hexCode: '#556B2F', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'TERRACOTTA MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-trc', color: 'Terracotta Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-MAT-TRC-Picture-1.jpg', hexCode: '#E2725B', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'SOFT PURPLE MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-spur', color: 'Soft Purple Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/SPUR.MAIN.jpg', hexCode: '#9370DB', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'BABY PINK MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-bpnk', color: 'Baby Pink Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/BPNK.MAIN.jpg', hexCode: '#F4C2C2', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'LIGHT LAVENDER MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-ltlav', color: 'Light Lavender Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/LTLAV.MAIN.jpg', hexCode: '#E6E6FA', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'LIGHT PERIWINKLE MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-ltper', color: 'Light Periwinkle Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/LTPER.MAIN.jpg', hexCode: '#C3CDE6', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'SEAFOAM BLUE MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-seablu', color: 'Seafoam Blue Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/SEABLU.MAIN.jpg', hexCode: '#71EEB8', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'COOL MINT MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-cmint', color: 'Cool Mint Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/CMINT.MAIN.jpg', hexCode: '#A8E4D4', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'LEMONADE MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-lmde', color: 'Lemonade Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/LMDE.MAIN.jpg', hexCode: '#FFFACD', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'LEMON YELLOW MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-lmylw', color: 'Lemon Yellow Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/LMYLW.MAIN.jpg', hexCode: '#FFFACD', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'DUSTY PLUM MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-dplm', color: 'Dusty Plum Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/PLA-MAT-DPLM.jpg', hexCode: '#8E4585', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'BLUSH PINK MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-blpnk', color: 'Blush Pink Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/PLA-MAT-BLPNK.jpg', hexCode: '#DE5D83', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'BUTTER YELLOW MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-bylw', color: 'Butter Yellow Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/PLA-MAT-BYLW.jpg', hexCode: '#FFFDD0', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'TOPAZ GREEN MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-togrn', color: 'Topaz Green Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/PLA-MAT-TOGRN.jpg', hexCode: '#0F9D58', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-matte', title: 'BRICK RED MATTE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-mat-bred', color: 'Brick Red Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/PLA-MAT-BRED.jpg', hexCode: '#CB4154', finishType: 'Matte', highSpeedCapable: false, diameter: 1.75 },
  
  // PLA Metallic
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH GRAY PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-gry', color: 'Metallic Finish Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-GRY-Picture-1.jpg', hexCode: '#A9A9A9', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH BLACK PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-blk', color: 'Metallic Finish Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-BLK-Picture-1.jpg', hexCode: '#2F2F2F', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH GOLD PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-gld', color: 'Metallic Finish Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-GLD-Picture-1.jpg', hexCode: '#FFD700', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH COPPER PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-copr', color: 'Metallic Finish Copper', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-COPR-Picture-1.jpg', hexCode: '#DA8A67', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH BLUE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-blu', color: 'Metallic Finish Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-BLU-Picture-1.jpg', hexCode: '#4169E1', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH PURPLE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-pur', color: 'Metallic Finish Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-PUR-Picture-1.jpg', hexCode: '#9966CC', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH RED PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-red', color: 'Metallic Finish Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-RED-Picture-1.jpg', hexCode: '#CD5C5C', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH GREEN PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-grn', color: 'Metallic Finish Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-GRN-Picture-1.jpg', hexCode: '#50C878', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH BRONZE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-brnz', color: 'Metallic Finish Bronze', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-BRNZ-Picture-1.jpg', hexCode: '#CD7F32', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH WHITE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-wht', color: 'Metallic Finish White', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-WHT-Picture-1.jpg', hexCode: '#F5F5F5', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH MINT GREEN PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-mtgrn', color: 'Metallic Finish Mint Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-MTGRN-Picture-1.jpg', hexCode: '#AAF0D1', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH ORANGE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-orn', color: 'Metallic Finish Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-ORN-Picture-1.jpg', hexCode: '#FF8C00', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH BROWN PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-brn', color: 'Metallic Finish Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-BRN-Picture-1_1.jpg', hexCode: '#8B4513', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-metallic', title: 'METALLIC FINISH BEIGE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-shny-bge', color: 'Metallic Finish Beige', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-SHNY-BGE-Picture-1.jpg', hexCode: '#F5DEB3', finishType: 'Metallic', highSpeedCapable: false, diameter: 1.75 },
  
  // PLA Silk
  { material: 'PLA', filamentLine: 'pla-silk', title: 'SILK GOLD PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-silk-gld', color: 'Silk Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/3DPLA-1KG1.75-SILK-GLD-Picture-1.jpg', hexCode: '#FFD700', finishType: 'Silk', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-silk', title: 'SILK SILVER PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-silk-slv', color: 'Silk Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/3DPLA-1KG1.75-SILK-SLV-Picture-1.jpg', hexCode: '#E8E8E8', finishType: 'Silk', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-silk', title: 'SILK LIGHT BLUE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-silk-lblu', color: 'Silk Light Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/3DPLA-1KG1.75-SILK-LBLU-Picture-1.jpg', hexCode: '#87CEFA', finishType: 'Silk', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-silk', title: 'SILK PINK PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-silk-pnk', color: 'Silk Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/3DPLA-1KG1.75-SILK-PNK-Picture-1.jpg', hexCode: '#FFB6C1', finishType: 'Silk', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-silk', title: 'SILK MINT PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-silk-mint', color: 'Silk Mint', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/3DPLA-1KG1.75-SILK-MINT-Picture-1.jpg', hexCode: '#98FF98', finishType: 'Silk', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-silk', title: 'SILK WHITE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/pla-silk-white-1-75mm-1kg-spool', color: 'Silk White', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/3DPLA-1KG1.75-SILK-WHT-Picture-1.jpg', hexCode: '#FFFAFA', finishType: 'Silk', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-silk', title: 'SILK COPPER PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-silk-copr', color: 'Silk Copper', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/3DPLA-1KG1.75-SILK-COPR-Picture-1.jpg', hexCode: '#DA8A67', finishType: 'Silk', highSpeedCapable: false, diameter: 1.75 },
  
  // PLA Rainbow
  { material: 'PLA', filamentLine: 'pla-rainbow', title: 'DARK RAINBOW PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-rbdk', color: 'Dark Rainbow', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/3D-PLA-1KG1.75-RBDK-Picture-1_8e0f32b4-3990-4839-9afc-d831884bd37b.jpg', hexCode: '#7F00FF', finishType: 'Rainbow', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-rainbow', title: 'LIGHT RAINBOW PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-rblt', color: 'Light Rainbow', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/3D-PLA-1KG1.75-RBLT-Picture-1.jpg', hexCode: '#FF69B4', finishType: 'Rainbow', highSpeedCapable: false, diameter: 1.75 },
  
  // PLA Wood
  { material: 'PLA', filamentLine: 'pla-wood', title: 'WOOD PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-wood-1kg1-75', color: 'Wood', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DWOOD-1KG1.75-Picture-1_a3b1c445-2ec0-4d0c-a879-0d3250d21d91.jpg', hexCode: '#DEB887', finishType: 'Wood', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-wood', title: 'WOOD BROWN PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-wood-1kg1-75-brn-b075dyqkq9', color: 'Wood Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DWOOD-1KG1.75-BRN-Picture-1_2eb451e4-3948-4090-a23e-52971199fb3f.jpg', hexCode: '#A0522D', finishType: 'Wood', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-wood', title: 'WOOD CEDAR BROWN PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-wood-1kg-175-cdrbrn', color: 'Wood Cedar Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/WOOD.CDRBRN.MAIN.jpg', hexCode: '#8B4513', finishType: 'Wood', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-wood', title: 'WOOD GRAY PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-wood-1kg-175-gry', color: 'Wood Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/WOOD.GRY.MAIN_73d36a8e-59e4-4827-bc5f-43fecfcfe23b.jpg', hexCode: '#9E9E9E', finishType: 'Wood', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-wood', title: 'WOOD WHITE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-wood-1kg-175-wht', color: 'Wood White', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/WOOD.WHT.MAIN.jpg', hexCode: '#FAEBD7', finishType: 'Wood', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-wood', title: 'WOOD IVORY PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-wood-1kg-175-ivr', color: 'Wood Ivory', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/WOOD.IVR.MAIN.jpg', hexCode: '#FFFFF0', finishType: 'Wood', highSpeedCapable: false, diameter: 1.75 },
  
  // PLA Stone
  { material: 'PLA', filamentLine: 'pla-stone', title: 'STONE BRICK RED PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/pla-stone-brick-red-1-75mm-1kg-spool', color: 'Stone Brick Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-MAG-RED-Picture-1_4f7ef325-13b3-414b-909e-fc3cae38a78f.jpg', hexCode: '#CB4154', finishType: 'Stone', highSpeedCapable: false, diameter: 1.75 },
  
  // PLA Color Change (UV/Temp)
  { material: 'PLA', filamentLine: 'pla-color-change', title: 'UV COLOR CHANGING BLUE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-uvblu', color: 'UV Color Changing Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-UVBLU-Picture-1_4e5ca18e-9966-4d0c-bd6b-3919d6b3e684.jpg', hexCode: '#1E90FF', finishType: 'UV', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-color-change', title: 'UV COLOR CHANGING PURPLE PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-pla-1kg1-75-uvpur', color: 'UV Color Changing Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-UVPUR-Picture-1_8cd4c1d4-5c92-4160-944e-9c472fb473bf.jpg', hexCode: '#8B00FF', finishType: 'UV', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-color-change', title: 'TEMPERATURE COLOR CHANGING PLA FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/pla-temperature-color-changing-purple-salmon-red-orange-1-75mm-1kg-spool', color: 'Temperature Color Changing', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPLA-1KG1.75-TEMP1-Picture-1_1127ed1a-c71e-44f1-9966-3e522c16519c.jpg', hexCode: '#9370DB', finishType: 'UV', highSpeedCapable: false, diameter: 1.75 },
  
  // PLA PRO+ (PLA+)
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'BLACK PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-blk', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/BLK.MAIN.jpg', hexCode: '#1A1A1A', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'WHITE PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-wht', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/WHT.MAIN.jpg', hexCode: '#FFFFFF', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'IRON RED PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-inred', color: 'Iron Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/INRED.MAIN.jpg', hexCode: '#8B3A3A', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'ORANGE PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-orn', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/ORN.MAIN.jpg', hexCode: '#FF6600', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'YELLOW PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-ylw', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/YLW.MAIN.jpg', hexCode: '#FFCC00', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'GREEN PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-grn', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/GRN.MAIN.jpg', hexCode: '#228B22', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'BROWN PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-brn', color: 'Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/BRN.MAIN.jpg', hexCode: '#8B4513', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'LIGHT BLUE PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-lblu', color: 'Light Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/LBLU.MAIN.jpg', hexCode: '#ADD8E6', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'PEACOCK BLUE PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-pblu', color: 'Peacock Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/PBLU.MAIN.jpg', hexCode: '#006B6B', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'SILVER PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-slv', color: 'Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/SLV.MAIN.jpg', hexCode: '#C0C0C0', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'DARK YELLOW PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-dylw', color: 'Dark Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/DYLW.MAIN.jpg', hexCode: '#DAA520', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'BABY BLUE PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-bblu', color: 'Baby Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/BBLU.MAIN.jpg', hexCode: '#89CFF0', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'PURPLE PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-pur', color: 'Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/PUR.MAIN.jpg', hexCode: '#800080', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'BEIGE PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-bge', color: 'Beige', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/BGE.MAIN.jpg', hexCode: '#F5F5DC', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'LIGHT PURPLE PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-lpur', color: 'Light Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/LPUR.MAIN.jpg', hexCode: '#B19CD9', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'PINK PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-pnk', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/PNK.MAIN.jpg', hexCode: '#FFC0CB', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'LIGHT ORANGE PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-lorn', color: 'Light Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/LORN.MAIN.jpg', hexCode: '#FFB347', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'LIME GREEN PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-lmgrn', color: 'Lime Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/LMGRN.MAIN.jpg', hexCode: '#32CD32', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'NEON GREEN PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-ngrn', color: 'Neon Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/NGRN.MAIN.jpg', hexCode: '#39FF14', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'COPPER PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-copr', color: 'Copper', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/COPR.MAIN.jpg', hexCode: '#B87333', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'PASTEL GREEN PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-pgrn', color: 'Pastel Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/PGRN.MAIN.jpg', hexCode: '#77DD77', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-pro-plus', title: 'MINT PLA PRO+ FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-plap-1kg1-75-mint', color: 'Mint', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/MINT.MAIN.jpg', hexCode: '#98FF98', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  
  // PLA MAX V2 (USA-made Premium PLA+)
  { material: 'PLA+', filamentLine: 'pla-max-v2', title: 'WHITE PLA MAX V2 FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/hb-pla-max-wht', color: 'White V2', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/HBPLA-MAX-WHT.jpg', hexCode: '#FFFFFF', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-max-v2', title: 'DARK RASPBERRY PLA MAX V2 FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/hb-pla-max-drby', color: 'Dark Raspberry V2', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/HBPLA-MAX-DRBY.jpg', hexCode: '#872657', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-max-v2', title: 'LAKER GOLD PLA MAX V2 FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/hb-pla-max-lgld', color: 'Laker Gold V2', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/HBPLA-MAX-LGLD.jpg', hexCode: '#FDB927', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA+', filamentLine: 'pla-max-v2', title: 'BLACK PLA MAX V2 FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/hb-pla-max-blk', color: 'Black V2', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/HBPLA-MAX-BLK.jpg', hexCode: '#1A1A1A', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  
  // PLA Reload/Refill Series
  { material: 'PLA', filamentLine: 'pla-reload', title: 'BLACK PLA FILAMENT REFILL & RELOADABLE SPOOL - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rs-pla1kg-blk-pck', color: 'Black Refill', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/BLK.jpg', hexCode: '#1A1A1A', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-reload', title: 'BLACK PLA FILAMENT REFILL - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rs-pla1kg-blk', color: 'Black Refill', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/REFILL-BLK.jpg', hexCode: '#1A1A1A', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-reload', title: 'WHITE PLA FILAMENT REFILL - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rs-pla1kg-wht', color: 'White Refill', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/REFILL-WHT.jpg', hexCode: '#FFFFFF', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-reload', title: 'COOL GRAY PLA FILAMENT REFILL & RELOADABLE SPOOL - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rs-pla1kg-cg6c-pck', color: 'Cool Gray Refill', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/CGRY.jpg', hexCode: '#8C8C8C', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-reload', title: 'MIDNIGHT PURPLE PLA FILAMENT REFILL & RELOADABLE SPOOL - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rs-pla1kg-mpur-pck', color: 'Midnight Purple Refill', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/MPUR.jpg', hexCode: '#2D1B4E', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PLA', filamentLine: 'pla-reload', title: 'SILVER PLA FILAMENT REFILL & RELOADABLE SPOOL - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rs-pla1kg-slv-pck', color: 'Silver Refill', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/SLV.jpg', hexCode: '#C0C0C0', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  
  // PETG Standard
  { material: 'PETG', filamentLine: 'petg-standard', title: 'BLACK PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-petg-1kg1-75-blk', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPETG-1KG1.75-BLK-Picture-1.jpg', hexCode: '#1A1A1A', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'WHITE PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-petg-1kg1-75-wht', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPETG-1KG1.75-WHT-Picture-1.jpg', hexCode: '#FFFFFF', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'ORANGE PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-petg-1kg1-75-orn', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPETG-1KG1.75-ORN-Picture-1.jpg', hexCode: '#FF6600', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'SILVER PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-petg-1kg1-75-slv', color: 'Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPETG-1KG1.75-SLV-Picture-1_fa2ccbff-b837-4259-83d6-f5c2d73d4c5b.jpg', hexCode: '#C0C0C0', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'RED PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-petg-1kg1-75-red', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPETG-1KG1.75-RED-Picture-1_93ab9f4b-cbef-4922-8afe-9a7a6acb3f96.jpg', hexCode: '#DC2626', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'GREEN PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-petg-1kg1-75-grn', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPETG-1KG1.75-GRN-Picture-1_04d2de22-86c0-438b-a016-f9a17b79e761.jpg', hexCode: '#228B22', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'BLUE PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-petg-1kg1-75-blu', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPETG-1KG1.75-BLU-Picture-1_4c51a25a-d174-4f07-ba40-ad7136cb9c3d.jpg', hexCode: '#0066CC', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'GOLD PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-petg-1kg1-75-gld', color: 'Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPETG-1KG1.75-GLD-Picture-1_a02ed1ae-522f-4e64-8c81-1cbe371db3c4.jpg', hexCode: '#FFD700', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'PURPLE PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-petg-1kg1-75-pur', color: 'Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPETG-1KG1.75-PUR-Picture-1_121fc0b4-7504-40c3-9b24-9f0bdf4c475a.jpg', hexCode: '#800080', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'PINK PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/peacock-blue-petg-filament-1-75mm-1kg-spool', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PETG-1KG1.75-PNK-Picture-1_b5c50de7-d50b-4401-bfce-ba21f95cbbe8.jpg', hexCode: '#FFC0CB', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'NATURAL PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/natural-petg-filament-1-75mm-1kg-spool', color: 'Natural', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PETG-1KG1.75-NAT-Picture-1_2dec4daa-965d-4937-b786-8204e2d5c050.jpg', hexCode: '#F5E6D3', finishType: 'Translucent', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'TRANSPARENT WHITE PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/petg-transparent-white-1-75mm-1kg-spool', color: 'Transparent White', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DPETG-1KG1.75-TWHT-Picture-1.jpg', hexCode: '#F8F8FF', finishType: 'Translucent', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'GRAY BLUE PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/gray-blue-petg-filament-1-75mm-1kg-spool', color: 'Gray Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PETG-1KG1.75-GRYBLU-Picture-1_8766707f-e91d-452d-9e97-7a3092996b9c.jpg', hexCode: '#6699CC', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'LAKE BLUE PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/lake-blue-petg-filament-1-75mm-1kg-spool', color: 'Lake Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PETG-1KG1.75-LABLU-Picture-1_4c1cabf1-6649-462c-9902-6fb7989bb913.jpg', hexCode: '#4F94CD', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'MIDNIGHT PURPLE PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/midnight-purple-petg-filament-1-75mm-1kg-spool', color: 'Midnight Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PETG-1KG1.75-MPUR-Picture-1_d3e9e351-e0b1-4077-aed5-3b4177d43285.jpg', hexCode: '#2D1B4E', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'COPPER PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/copper-petg-filament-1-75mm-1kg-spool', color: 'Copper', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PETG-1KG1.75-COPR-Picture-1_5e67d045-32d6-4134-be19-3519c4ccec24.jpg', hexCode: '#B87333', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'DARK GREEN PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/dark-green-petg-filament-1-75mm-1kg-spool', color: 'Dark Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PETG-1KG1.75-DGRN-Picture-1_44ed10be-bcb3-41b1-9a96-b2b6f5234077.jpg', hexCode: '#006400', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'PEACOCK BLUE PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/peacock-blue-petg-filament-1-75mm-1kg-spool-1', color: 'Peacock Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PETG-1KG1.75-PBLU-Picture-1_eb102bb8-4145-4cfb-abde-f1a078edefde.jpg', hexCode: '#006B6B', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'BRONZE PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/bronze-petg-filament-1-75mm-1kg-spool', color: 'Bronze', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PETG-1KG1.75-BRNZ-Picture-1_8ae4d720-63c1-4b60-82f8-95361b1189fa.jpg', hexCode: '#CD7F32', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'LIME GREEN PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/lime-green-petg-filament-1-75mm-1kg-spool', color: 'Lime Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PETG-1KG1.75-LMGRN-Picture-1_748b6856-2ae0-43f1-b914-39a4123017cd.jpg', hexCode: '#32CD32', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'PETG', filamentLine: 'petg-standard', title: 'LIGHT BROWN PETG FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/light-brown-petg-filament-1-75mm-1kg-spool', color: 'Light Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3D-PETG-1KG1.75-LBRN-Picture-1_609e5d58-bd5e-480e-a63a-01b2b1d61655.jpg', hexCode: '#C4A484', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  
  // PETG Rapid (High-Speed)
  { material: 'PETG-HS', filamentLine: 'petg-rapid', title: 'BLACK RAPID PETG FILAMENT – 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/black-rapid-petg-filament-1-75mm-1kg-spool', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/RPD-PETG-BLK.jpg', hexCode: '#1A1A1A', finishType: 'Standard', highSpeedCapable: true, diameter: 1.75 },
  { material: 'PETG-HS', filamentLine: 'petg-rapid', title: 'WHITE RAPID PETG FILAMENT – 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rpd-petg1kg-wht', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/RPD-PETG-WHT.jpg', hexCode: '#FFFFFF', finishType: 'Standard', highSpeedCapable: true, diameter: 1.75 },
  { material: 'PETG-HS', filamentLine: 'petg-rapid', title: 'PEACOCK BLUE RAPID PETG FILAMENT – 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rpd-petg1kg-pblu', color: 'Peacock Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/RPD-PETG-PBLU.jpg', hexCode: '#006B6B', finishType: 'Standard', highSpeedCapable: true, diameter: 1.75 },
  { material: 'PETG-HS', filamentLine: 'petg-rapid', title: 'DARK GREEN RAPID PETG FILAMENT – 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rpd-petg1kg-dgrn', color: 'Dark Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/RPD-PETG-DGRN.jpg', hexCode: '#006400', finishType: 'Standard', highSpeedCapable: true, diameter: 1.75 },
  { material: 'PETG-HS', filamentLine: 'petg-rapid', title: 'ORANGE RAPID PETG FILAMENT – 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rpd-petg1kg-orn', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/RPD-PETG-ORN.jpg', hexCode: '#FF6600', finishType: 'Standard', highSpeedCapable: true, diameter: 1.75 },
  { material: 'PETG-HS', filamentLine: 'petg-rapid', title: 'MIDNIGHT PURPLE RAPID PETG FILAMENT – 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rpd-petg1kg-mpur', color: 'Midnight Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/RPD-PETG-MPUR.jpg', hexCode: '#2D1B4E', finishType: 'Standard', highSpeedCapable: true, diameter: 1.75 },
  { material: 'PETG-HS', filamentLine: 'petg-rapid', title: 'DARK YELLOW RAPID PETG FILAMENT – 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rpd-petg1kg-dylw', color: 'Dark Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/RPD-PETG-DYLW.jpg', hexCode: '#DAA520', finishType: 'Standard', highSpeedCapable: true, diameter: 1.75 },
  { material: 'PETG-HS', filamentLine: 'petg-rapid', title: 'YELLOW RAPID PETG FILAMENT – 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rpd-petg1kg-ylw', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/RPD-PETG-YLW.jpg', hexCode: '#FFCC00', finishType: 'Standard', highSpeedCapable: true, diameter: 1.75 },
  { material: 'PETG-HS', filamentLine: 'petg-rapid', title: 'LAKE BLUE RAPID PETG FILAMENT – 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rpd-petg1kg-lablu', color: 'Lake Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/RPD-PETG-LABLU.jpg', hexCode: '#4F94CD', finishType: 'Standard', highSpeedCapable: true, diameter: 1.75 },
  { material: 'PETG-HS', filamentLine: 'petg-rapid', title: 'GRAY BLUE RAPID PETG FILAMENT – 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-rpd-petg1kg-gryblu', color: 'Gray Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/RPD-PETG-GRYBLU.jpg', hexCode: '#6699CC', finishType: 'Standard', highSpeedCapable: true, diameter: 1.75 },
  
  // ABS Standard
  { material: 'ABS', filamentLine: 'abs-standard', title: 'BLACK ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-blk', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1KG1.75-BLK-Picture-1_1.jpg', hexCode: '#1A1A1A', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'WHITE ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-wht', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1KG1.75-WHT-Picture-1_2ee3b522-9f4a-452c-b3cb-9233a63711f3.jpg', hexCode: '#FFFFFF', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'RED ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-red', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1KG1.75-RED-Picture-1_db295d4b-736f-4aee-a960-647ec3d7fbbe.jpg', hexCode: '#DC2626', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'BLUE ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-blu', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1KG1.75-BLU-Picture-1.jpg', hexCode: '#0066CC', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'GREEN ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-grn', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1KG1.75-GRN-Picture-1_82ecb43e-6412-4356-8f10-8cc778973a46.jpg', hexCode: '#228B22', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'YELLOW ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-ylw', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1KG1.75-YLW-Picture-1_1754c286-c1ff-4168-a8c9-90b267c45f3b.jpg', hexCode: '#FFCC00', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'GRAY ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-cg6c', color: 'Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1kg1.75-CG6C-Picture-1.jpg', hexCode: '#808080', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'SILVER ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-slv', color: 'Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1KG1.75-SLV-Picture-1_dffdf1aa-8b69-44c7-8282-ed81abbf69b9.jpg', hexCode: '#C0C0C0', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'BRONZE ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-brnz', color: 'Bronze', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1KG1.75-BRNZ-Picture-1_1.jpg', hexCode: '#CD7F32', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'TRANSPARENT GREEN ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-tgrn', color: 'Transparent Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1KG1.75-TGRN-Picture-1_5294bd46-c122-4573-bacf-05147a700448.jpg', hexCode: '#90EE90', finishType: 'Translucent', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'BROWN ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-731c', color: 'Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1kg1.75-731C-Picture-1_6fc41d97-fac6-4d97-aa7e-96647034f7b5.jpg', hexCode: '#8B4513', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'BEIGE ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-720c', color: 'Beige', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1kg1.75-720C-Picture-1_49b42cf2-43df-4932-8ffa-b9ee2ef6d780.jpg', hexCode: '#F5F5DC', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'PASTEL GREEN ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/3d-abs-1kg1-75-365c', color: 'Pastel Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1kg1.75-365C-Picture-1_1cb6f889-60eb-4275-9620-586b34e465f3.jpg', hexCode: '#77DD77', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'ABS', filamentLine: 'abs-standard', title: 'BROWN PAINT FREE ABS FILAMENT - 1.75MM, 1KG SPOOL', url: 'https://www.hatchbox3d.com/products/abs-paint-free-brown-1-75mm-1kg-spool', color: 'Brown Paint Free', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DABS-1KG1.75-PFR-BRN-Picture-1_359a0cde-13ed-4a67-a2fc-9fd1260837fd.jpg', hexCode: '#8B4513', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  
  // TPU
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'BLACK TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-blk', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DTPU-1KG1.75-BLK-Picture-1_32ecb8c5-4fdd-4255-a1dd-14409305626c.jpg', hexCode: '#1A1A1A', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'WHITE TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-wht', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DTPU-1KG1.75-WHT-Picture-1_503776e8-5cc2-4cb1-89a1-e38e61ab1856.jpg', hexCode: '#FFFFFF', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'SILVER TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-slv', color: 'Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/products/3DTPU-1KG1.75-SLV-Picture-1_dd1b6924-a979-4c2d-8220-914e45365bf3.jpg', hexCode: '#C0C0C0', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'IRON RED TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-inred', color: 'Iron Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/TPU-INRED.MAIN.jpg', hexCode: '#8B3A3A', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'LIGHT BLUE TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-285c', color: 'Light Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/TPU-285C.MAIN.jpg', hexCode: '#ADD8E6', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'COOL GRAY TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-cg6c', color: 'Cool Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/TPU-CG6C.MAIN.jpg', hexCode: '#8C8C8C', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'MIDNIGHT PURPLE TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-mpur', color: 'Midnight Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/TPU-MPUR.MAIN.jpg', hexCode: '#2D1B4E', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'CHOCOLATE TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-choc', color: 'Chocolate', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/TPU-CHOC.MAIN.jpg', hexCode: '#7B3F00', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'LIGHT PURPLE TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-lpur', color: 'Light Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/TPU-LPUR.MAIN.jpg', hexCode: '#B19CD9', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'NATURAL TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-nat', color: 'Natural', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/TPU-NAT.MAIN.jpg', hexCode: '#F5E6D3', finishType: 'Translucent', highSpeedCapable: false, diameter: 1.75 },
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'BABY BLUE TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-bblu', color: 'Baby Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/TPU-BBLU.MAIN.jpg', hexCode: '#89CFF0', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'LIGHT ORANGE TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-lorn', color: 'Light Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/TPU-LORN.MAIN.jpg', hexCode: '#FFB347', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
  { material: 'TPU-95A', filamentLine: 'tpu-standard', title: 'PINK TPU FILAMENT - 1.75MM, 1KG SPOOL (SHORE 95A)', url: 'https://www.hatchbox3d.com/products/3d-tpu-1kg1-75-pnk', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0008/2457/4018/files/TPU-PNK.MAIN.jpg', hexCode: '#FFC0CB', finishType: 'Standard', highSpeedCapable: false, diameter: 1.75 },
];

// Helper to filter only 1.75mm FDM filaments
export function getFilteredHatchboxSeed(): HatchboxSeedEntry[] {
  return HATCHBOX_PRODUCT_SEED.filter(entry => 
    entry.diameter === 1.75 && 
    entry.material !== 'Resin'
  );
}

// Get unique product lines
export function getHatchboxProductLines(): string[] {
  const lines = new Set<string>();
  for (const entry of HATCHBOX_PRODUCT_SEED) {
    if (entry.material !== 'Resin') {
      lines.add(entry.filamentLine);
    }
  }
  return Array.from(lines);
}

// Get product count summary
export function getHatchboxSeedStats(): {
  totalProducts: number;
  productLines: number;
  materials: string[];
  finishTypes: string[];
} {
  const filtered = getFilteredHatchboxSeed();
  const materials = new Set<string>();
  const finishTypes = new Set<string>();
  const productLines = new Set<string>();
  
  for (const entry of filtered) {
    materials.add(entry.material);
    finishTypes.add(entry.finishType);
    productLines.add(entry.filamentLine);
  }
  
  return {
    totalProducts: filtered.length,
    productLines: productLines.size,
    materials: Array.from(materials),
    finishTypes: Array.from(finishTypes),
  };
}

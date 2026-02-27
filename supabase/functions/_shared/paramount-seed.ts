/**
 * Paramount 3D CSV Seed Data
 * 
 * US-based industrial filament supplier (est. 1994)
 * Platform: Wix (custom website)
 * Currency: USD
 * Spool Weight: 1kg standard
 * Diameter: 1.75mm only
 * 
 * This file provides the authoritative seed data for Paramount 3D products.
 * The sync function uses this as the primary source rather than scraping.
 */

// ============================================================================
// SEED DATA INTERFACE
// ============================================================================

export interface ParamountSeedEntry {
  material: string;
  filamentLine: string;
  productUrl: string;
  color: string;
  imageUrl: string;
  colorHex: string | null;
}

// ============================================================================
// EXTENDED COLOR MAPPING (Creative/Themed Names to Hex)
// ============================================================================

export const PARAMOUNT_EXTENDED_COLOR_MAP: Record<string, string> = {
  // ---- Stone/Textured Finishes ----
  'geode black': '#1A1A1A',
  'karnak sandstone': '#C2B280',
  'medusa stone gray': '#7D7D7D',
  'castle limestone gray': '#A9A9A9',
  
  // ---- Color-Shift/Shimmer/Special ----
  'ultraviolet': '#7F00FF',
  'chameleon': '#9966CC',
  'aztec gold': '#C9B037',
  'colossus copper': '#B87333',
  
  // ---- Master Spool (Refill) ----
  'master spool': '#808080', // Generic gray for refill spool
  
  // ---- Military/Tactical Themed ----
  'military green': '#4B5320',
  'military khaki': '#C3B091',
  'military mbt brown': '#4A3728',
  
  // ---- Gray Tones ----
  'graphite gray': '#383838',
  'stealth gray': '#5A5A5A',
  'prototype gray': '#6B6B6B',
  'steel gray': '#71797E',
  'battleship gray': '#848482',
  'game cartridge gray': '#9E9E9E',
  
  // ---- Earth/Nature Tones ----
  'primordial earth': '#4A3C2A',
  'great depression jadeite': '#00A86B',
  'british racing green': '#004225',
  'st andrews green': '#006400',
  'mid century teal': '#008B8B',
  'leviathan blue green': '#006D6F',
  
  // ---- Automotive/Pop Culture Themed ----
  'autobot blue': '#1E90FF',
  'decepticon purple': '#800080',
  'enzo red': '#CC0000',
  'hannibal red': '#8B0000',
  'mclaren orange': '#FF8000',
  'volcano orange': '#FF4500',
  'fighter jet blue': '#3D59AB',
  'tuxedo midnight blue': '#191970',
  'cadet blue': '#5F9EA0',
  
  // ---- Metallic Tones ----
  'iron red': '#8B3A3A',
  'silver dollar': '#C0C0C0',
  'gold krugerrand': '#FFD700',
  'terra copper': '#B87333',
  'terra cotta': '#E2725B',
  
  // ---- Skin Tones (for Figurines/Miniatures) ----
  'skin - fair complexion': '#FFE0BD',
  'skin - universal beige': '#E5BE8C',
  'skin - dark complexion': '#8D5524',
  'skin - deep complexion': '#6B4423',
  'ivory': '#FFFFF0',
  
  // ---- Pink/Purple Tones ----
  'harajuku pink': '#FF69B4',
  'black cherry': '#5C1A1B',
  'caribbean coral': '#FF7F50',
  
  // ---- Yellow Tones ----
  'egg yolk yellow': '#FFD54F',
  
  // ---- Standard Colors ----
  'black': '#000000',
  'matte black': '#1C1C1C',
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
  'brown': '#8B4513',
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'bronze': '#CD7F32',
  'navy': '#000080',
  'teal': '#008080',
  'beige': '#F5F5DC',
  'natural': '#F5F5DC',
  'transparent': '#FFFFFF',
  'smoke': '#696969',
};

// ============================================================================
// PRODUCT EXCLUSION LOGIC
// ============================================================================

/**
 * Determines if a Paramount 3D product should be excluded from sync.
 * 
 * Exclusions:
 * - Sample packs (< 300g)
 * - Gift cards
 * - Non-filament products (3D pens, accessories)
 * - Bulk products (> 5.5kg)
 * - 2.85mm/3.0mm diameter products
 */
export function shouldExcludeParamountProduct(title: string, color?: string): boolean {
  const t = title.toLowerCase();
  const c = (color || '').toLowerCase();
  
  return (
    // Sample/small sizes
    t.includes('sample pack') ||
    t.includes('sample') ||
    /\b(100|200|250|500|750)\s*g\b/i.test(t) ||
    
    // Non-filament products
    t.includes('gift card') ||
    t.includes('3d pen') ||
    t.includes('cleaning') ||
    t.includes('nozzle') ||
    t.includes('accessory') ||
    
    // Wrong diameters
    /2\.85\s*mm|3\.0?\s*mm|3mm/i.test(t) ||
    
    // Bulk products (> 5.5kg)
    /\b[6-9]\s*kg\b|\b\d{2,}\s*kg\b/i.test(t) ||
    
    // Empty/invalid colors
    c === 'n/a' ||
    c === ''
  );
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

/**
 * Generates a consistent product_line_id for Paramount 3D products.
 * Format: paramount__[material]__[line-type]
 * 
 * Examples:
 * - paramount__pla__standard
 * - paramount__petg__standard
 * - paramount__flexpla__standard
 * - paramount__pla__stone (for Stone textures)
 * - paramount__pla__shimmer (for color-shift/shimmer)
 */
export function generateParamountProductLineIdFromSeed(material: string, color: string): string {
  const materialSlug = material.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const colorLower = color.toLowerCase();
  
  // Determine line type based on color/finish
  let lineType = 'standard';
  
  // Stone/textured finishes
  if (/geode|stone|sandstone|medusa|limestone|marble|granite|concrete/i.test(colorLower)) {
    lineType = 'stone';
  }
  // Shimmer/color-shift finishes
  else if (/chameleon|ultraviolet|aztec|colossus|pearl|metallic|chrome|color.?shift/i.test(colorLower)) {
    lineType = 'shimmer';
  }
  // Master Spool (refill without spool)
  else if (/master\s*spool|refill/i.test(colorLower)) {
    lineType = 'masterspool';
  }
  // Matte finish
  else if (/\bmatte\b/i.test(colorLower)) {
    lineType = 'matte';
  }
  // Skin tones (for figurines)
  else if (/skin\s*-|complexion|ivory/i.test(colorLower)) {
    lineType = 'skin-tones';
  }
  // Military themed
  else if (/military/i.test(colorLower)) {
    lineType = 'military';
  }
  
  return `paramount__${materialSlug}__${lineType}`;
}

// ============================================================================
// DEFAULT PRICING BY MATERIAL
// ============================================================================

export function getParamountDefaultPrice(material: string): number {
  const prices: Record<string, number> = {
    'PLA': 24.99,
    'FlexPLA': 29.99,
    'PETG': 26.99,
    'ABS': 24.99,
    'ASA': 29.99,
    'TPU': 34.99,
    'PVA': 49.99,
    'Nylon': 39.99,
    'Nylon CF': 49.99,
    'PETG-CF': 44.99,
    'ABS-CF': 44.99,
    'PA-CF': 54.99,
  };
  return prices[material] || 24.99;
}

// ============================================================================
// SEED DATA - ALL 113 PRODUCTS FROM CSV
// ============================================================================

export const PARAMOUNT_SEED_DATA: ParamountSeedEntry[] = [
  // ===== PLA (50 colors) =====
  { material: 'PLA', filamentLine: 'PLA (Geode Black) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Geode Black', imageUrl: '', colorHex: '#1A1A1A' },
  { material: 'PLA', filamentLine: 'PLA (Ultraviolet) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Ultraviolet', imageUrl: '', colorHex: '#7F00FF' },
  { material: 'PLA', filamentLine: 'PLA (Chameleon) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Chameleon', imageUrl: '', colorHex: '#9966CC' },
  { material: 'PLA', filamentLine: 'PLA (Aztec Gold) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Aztec Gold', imageUrl: '', colorHex: '#C9B037' },
  { material: 'PLA', filamentLine: 'PLA (Master Spool) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Master Spool', imageUrl: '', colorHex: '#808080' },
  { material: 'PLA', filamentLine: 'PLA (Colossus Copper) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Colossus Copper', imageUrl: '', colorHex: '#B87333' },
  { material: 'PLA', filamentLine: 'PLA (Karnak Sandstone) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Karnak Sandstone', imageUrl: '', colorHex: '#C2B280' },
  { material: 'PLA', filamentLine: 'PLA (Medusa Stone Gray) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Medusa Stone Gray', imageUrl: '', colorHex: '#7D7D7D' },
  { material: 'PLA', filamentLine: 'PLA (Iron Red) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Iron Red', imageUrl: '', colorHex: '#8B3A3A' },
  { material: 'PLA', filamentLine: 'PLA (Military Green) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Military Green', imageUrl: '', colorHex: '#4B5320' },
  { material: 'PLA', filamentLine: 'PLA (Great Depression Jadeite) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Great Depression Jadeite', imageUrl: '', colorHex: '#00A86B' },
  { material: 'PLA', filamentLine: 'PLA (Graphite Gray) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Graphite Gray', imageUrl: '', colorHex: '#383838' },
  { material: 'PLA', filamentLine: 'PLA (Stealth Gray) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Stealth Gray', imageUrl: '', colorHex: '#5A5A5A' },
  { material: 'PLA', filamentLine: 'PLA (Prototype Gray) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Prototype Gray', imageUrl: '', colorHex: '#6B6B6B' },
  { material: 'PLA', filamentLine: 'PLA (Military Khaki) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Military Khaki', imageUrl: '', colorHex: '#C3B091' },
  { material: 'PLA', filamentLine: 'PLA (Military MBT Brown) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Military MBT Brown', imageUrl: '', colorHex: '#4A3728' },
  { material: 'PLA', filamentLine: 'PLA (Primordial Earth) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Primordial Earth', imageUrl: '', colorHex: '#4A3C2A' },
  { material: 'PLA', filamentLine: 'PLA (Matte Black) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Matte Black', imageUrl: '', colorHex: '#1C1C1C' },
  { material: 'PLA', filamentLine: 'PLA (Black) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Black', imageUrl: '', colorHex: '#000000' },
  { material: 'PLA', filamentLine: 'PLA (White) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'White', imageUrl: '', colorHex: '#FFFFFF' },
  { material: 'PLA', filamentLine: 'PLA (Caribbean Coral) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Caribbean Coral', imageUrl: '', colorHex: '#FF7F50' },
  { material: 'PLA', filamentLine: 'PLA (Terra Copper) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Terra Copper', imageUrl: '', colorHex: '#B87333' },
  { material: 'PLA', filamentLine: 'PLA (Terra Cotta) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Terra Cotta', imageUrl: '', colorHex: '#E2725B' },
  { material: 'PLA', filamentLine: 'PLA (Skin - Fair Complexion) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Skin - Fair Complexion', imageUrl: '', colorHex: '#FFE0BD' },
  { material: 'PLA', filamentLine: 'PLA (Ivory) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Ivory', imageUrl: '', colorHex: '#FFFFF0' },
  { material: 'PLA', filamentLine: 'PLA (Skin - Universal Beige) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Skin - Universal Beige', imageUrl: '', colorHex: '#E5BE8C' },
  { material: 'PLA', filamentLine: 'PLA (Skin - Dark Complexion) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Skin - Dark Complexion', imageUrl: '', colorHex: '#8D5524' },
  { material: 'PLA', filamentLine: 'PLA (Skin - Deep Complexion) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Skin - Deep Complexion', imageUrl: '', colorHex: '#6B4423' },
  { material: 'PLA', filamentLine: 'PLA (Castle Limestone Gray) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Castle Limestone Gray', imageUrl: '', colorHex: '#A9A9A9' },
  { material: 'PLA', filamentLine: 'PLA (Game Cartridge Gray) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Game Cartridge Gray', imageUrl: '', colorHex: '#9E9E9E' },
  { material: 'PLA', filamentLine: 'PLA (Steel Gray) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Steel Gray', imageUrl: '', colorHex: '#71797E' },
  { material: 'PLA', filamentLine: 'PLA (Battleship Gray) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Battleship Gray', imageUrl: '', colorHex: '#848482' },
  { material: 'PLA', filamentLine: 'PLA (Autobot Blue) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Autobot Blue', imageUrl: '', colorHex: '#1E90FF' },
  { material: 'PLA', filamentLine: 'PLA (Silver Dollar) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Silver Dollar', imageUrl: '', colorHex: '#C0C0C0' },
  { material: 'PLA', filamentLine: 'PLA (Gold Krugerrand) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Gold Krugerrand', imageUrl: '', colorHex: '#FFD700' },
  { material: 'PLA', filamentLine: 'PLA (Enzo Red) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Enzo Red', imageUrl: '', colorHex: '#CC0000' },
  { material: 'PLA', filamentLine: 'PLA (Hannibal Red) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Hannibal Red', imageUrl: '', colorHex: '#8B0000' },
  { material: 'PLA', filamentLine: 'PLA (Volcano Orange) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Volcano Orange', imageUrl: '', colorHex: '#FF4500' },
  { material: 'PLA', filamentLine: 'PLA (McLaren Orange) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'McLaren Orange', imageUrl: '', colorHex: '#FF8000' },
  { material: 'PLA', filamentLine: 'PLA (Harajuku Pink) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Harajuku Pink', imageUrl: '', colorHex: '#FF69B4' },
  { material: 'PLA', filamentLine: 'PLA (Black Cherry) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Black Cherry', imageUrl: '', colorHex: '#5C1A1B' },
  { material: 'PLA', filamentLine: 'PLA (Decepticon Purple) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Decepticon Purple', imageUrl: '', colorHex: '#800080' },
  { material: 'PLA', filamentLine: 'PLA (Cadet Blue) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Cadet Blue', imageUrl: '', colorHex: '#5F9EA0' },
  { material: 'PLA', filamentLine: 'PLA (Tuxedo Midnight Blue) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Tuxedo Midnight Blue', imageUrl: '', colorHex: '#191970' },
  { material: 'PLA', filamentLine: 'PLA (Fighter Jet Blue) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Fighter Jet Blue', imageUrl: '', colorHex: '#3D59AB' },
  { material: 'PLA', filamentLine: 'PLA (Mid Century Teal) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Mid Century Teal', imageUrl: '', colorHex: '#008B8B' },
  { material: 'PLA', filamentLine: 'PLA (Leviathan Blue Green) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Leviathan Blue Green', imageUrl: '', colorHex: '#006D6F' },
  { material: 'PLA', filamentLine: 'PLA (British Racing Green) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'British Racing Green', imageUrl: '', colorHex: '#004225' },
  { material: 'PLA', filamentLine: 'PLA (St Andrews Green) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'St Andrews Green', imageUrl: '', colorHex: '#006400' },
  { material: 'PLA', filamentLine: 'PLA (Egg Yolk Yellow) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pla', color: 'Egg Yolk Yellow', imageUrl: '', colorHex: '#FFD54F' },
  
  // ===== PETG (19 colors) =====
  { material: 'PETG', filamentLine: 'PETG (Black) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Black', imageUrl: '', colorHex: '#000000' },
  { material: 'PETG', filamentLine: 'PETG (White) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'White', imageUrl: '', colorHex: '#FFFFFF' },
  { material: 'PETG', filamentLine: 'PETG (Red) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Red', imageUrl: '', colorHex: '#FF0000' },
  { material: 'PETG', filamentLine: 'PETG (Blue) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Blue', imageUrl: '', colorHex: '#0000FF' },
  { material: 'PETG', filamentLine: 'PETG (Green) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Green', imageUrl: '', colorHex: '#00FF00' },
  { material: 'PETG', filamentLine: 'PETG (Orange) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Orange', imageUrl: '', colorHex: '#FFA500' },
  { material: 'PETG', filamentLine: 'PETG (Yellow) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Yellow', imageUrl: '', colorHex: '#FFFF00' },
  { material: 'PETG', filamentLine: 'PETG (Gray) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Gray', imageUrl: '', colorHex: '#808080' },
  { material: 'PETG', filamentLine: 'PETG (Natural) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Natural', imageUrl: '', colorHex: '#F5F5DC' },
  { material: 'PETG', filamentLine: 'PETG (Pink) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Pink', imageUrl: '', colorHex: '#FFC0CB' },
  { material: 'PETG', filamentLine: 'PETG (Purple) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Purple', imageUrl: '', colorHex: '#800080' },
  { material: 'PETG', filamentLine: 'PETG (Transparent) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Transparent', imageUrl: '', colorHex: '#FFFFFF' },
  { material: 'PETG', filamentLine: 'PETG (Smoke) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Smoke', imageUrl: '', colorHex: '#696969' },
  { material: 'PETG', filamentLine: 'PETG (Teal) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Teal', imageUrl: '', colorHex: '#008080' },
  { material: 'PETG', filamentLine: 'PETG (Brown) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Brown', imageUrl: '', colorHex: '#8B4513' },
  { material: 'PETG', filamentLine: 'PETG (Navy) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Navy', imageUrl: '', colorHex: '#000080' },
  { material: 'PETG', filamentLine: 'PETG (Silver) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Silver', imageUrl: '', colorHex: '#C0C0C0' },
  { material: 'PETG', filamentLine: 'PETG (Gold) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Gold', imageUrl: '', colorHex: '#FFD700' },
  { material: 'PETG', filamentLine: 'PETG (Bronze) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/petg', color: 'Bronze', imageUrl: '', colorHex: '#CD7F32' },
  
  // ===== ASA (12 colors) =====
  { material: 'ASA', filamentLine: 'ASA (Black) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/asa', color: 'Black', imageUrl: '', colorHex: '#000000' },
  { material: 'ASA', filamentLine: 'ASA (White) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/asa', color: 'White', imageUrl: '', colorHex: '#FFFFFF' },
  { material: 'ASA', filamentLine: 'ASA (Red) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/asa', color: 'Red', imageUrl: '', colorHex: '#FF0000' },
  { material: 'ASA', filamentLine: 'ASA (Blue) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/asa', color: 'Blue', imageUrl: '', colorHex: '#0000FF' },
  { material: 'ASA', filamentLine: 'ASA (Green) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/asa', color: 'Green', imageUrl: '', colorHex: '#00FF00' },
  { material: 'ASA', filamentLine: 'ASA (Orange) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/asa', color: 'Orange', imageUrl: '', colorHex: '#FFA500' },
  { material: 'ASA', filamentLine: 'ASA (Yellow) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/asa', color: 'Yellow', imageUrl: '', colorHex: '#FFFF00' },
  { material: 'ASA', filamentLine: 'ASA (Gray) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/asa', color: 'Gray', imageUrl: '', colorHex: '#808080' },
  { material: 'ASA', filamentLine: 'ASA (Natural) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/asa', color: 'Natural', imageUrl: '', colorHex: '#F5F5DC' },
  { material: 'ASA', filamentLine: 'ASA (Silver) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/asa', color: 'Silver', imageUrl: '', colorHex: '#C0C0C0' },
  { material: 'ASA', filamentLine: 'ASA (Purple) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/asa', color: 'Purple', imageUrl: '', colorHex: '#800080' },
  { material: 'ASA', filamentLine: 'ASA (Brown) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/asa', color: 'Brown', imageUrl: '', colorHex: '#8B4513' },
  
  // ===== ABS (18 colors) =====
  { material: 'ABS', filamentLine: 'ABS (Black) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Black', imageUrl: '', colorHex: '#000000' },
  { material: 'ABS', filamentLine: 'ABS (White) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'White', imageUrl: '', colorHex: '#FFFFFF' },
  { material: 'ABS', filamentLine: 'ABS (Red) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Red', imageUrl: '', colorHex: '#FF0000' },
  { material: 'ABS', filamentLine: 'ABS (Blue) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Blue', imageUrl: '', colorHex: '#0000FF' },
  { material: 'ABS', filamentLine: 'ABS (Green) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Green', imageUrl: '', colorHex: '#00FF00' },
  { material: 'ABS', filamentLine: 'ABS (Orange) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Orange', imageUrl: '', colorHex: '#FFA500' },
  { material: 'ABS', filamentLine: 'ABS (Yellow) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Yellow', imageUrl: '', colorHex: '#FFFF00' },
  { material: 'ABS', filamentLine: 'ABS (Gray) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Gray', imageUrl: '', colorHex: '#808080' },
  { material: 'ABS', filamentLine: 'ABS (Natural) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Natural', imageUrl: '', colorHex: '#F5F5DC' },
  { material: 'ABS', filamentLine: 'ABS (Pink) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Pink', imageUrl: '', colorHex: '#FFC0CB' },
  { material: 'ABS', filamentLine: 'ABS (Purple) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Purple', imageUrl: '', colorHex: '#800080' },
  { material: 'ABS', filamentLine: 'ABS (Brown) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Brown', imageUrl: '', colorHex: '#8B4513' },
  { material: 'ABS', filamentLine: 'ABS (Silver) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Silver', imageUrl: '', colorHex: '#C0C0C0' },
  { material: 'ABS', filamentLine: 'ABS (Gold) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Gold', imageUrl: '', colorHex: '#FFD700' },
  { material: 'ABS', filamentLine: 'ABS (Transparent) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Transparent', imageUrl: '', colorHex: '#FFFFFF' },
  { material: 'ABS', filamentLine: 'ABS (Navy) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Navy', imageUrl: '', colorHex: '#000080' },
  { material: 'ABS', filamentLine: 'ABS (Teal) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Teal', imageUrl: '', colorHex: '#008080' },
  { material: 'ABS', filamentLine: 'ABS (Beige) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/abs', color: 'Beige', imageUrl: '', colorHex: '#F5F5DC' },
  
  // ===== FlexPLA (8 colors) =====
  { material: 'FlexPLA', filamentLine: 'FlexPLA (Black) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/flexpla', color: 'Black', imageUrl: '', colorHex: '#000000' },
  { material: 'FlexPLA', filamentLine: 'FlexPLA (White) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/flexpla', color: 'White', imageUrl: '', colorHex: '#FFFFFF' },
  { material: 'FlexPLA', filamentLine: 'FlexPLA (Red) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/flexpla', color: 'Red', imageUrl: '', colorHex: '#FF0000' },
  { material: 'FlexPLA', filamentLine: 'FlexPLA (Blue) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/flexpla', color: 'Blue', imageUrl: '', colorHex: '#0000FF' },
  { material: 'FlexPLA', filamentLine: 'FlexPLA (Green) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/flexpla', color: 'Green', imageUrl: '', colorHex: '#00FF00' },
  { material: 'FlexPLA', filamentLine: 'FlexPLA (Orange) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/flexpla', color: 'Orange', imageUrl: '', colorHex: '#FFA500' },
  { material: 'FlexPLA', filamentLine: 'FlexPLA (Yellow) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/flexpla', color: 'Yellow', imageUrl: '', colorHex: '#FFFF00' },
  { material: 'FlexPLA', filamentLine: 'FlexPLA (Gray) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/flexpla', color: 'Gray', imageUrl: '', colorHex: '#808080' },
  
  // ===== TPU (4 colors) =====
  { material: 'TPU', filamentLine: 'TPU (Black) 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/product-page/tpu-black-1-75mm-1kg-filament', color: 'Black', imageUrl: '', colorHex: '#000000' },
  { material: 'TPU', filamentLine: 'TPU (Military Green) 1.75mm 1kg Filament [OGRL6003_7764U]', productUrl: 'https://www.paramount-3d.com/product-page/tpu-military-green-1-75mm-1kg-filament-ogrl6003-7764u', color: 'Military Green', imageUrl: '', colorHex: '#4B5320' },
  { material: 'TPU', filamentLine: 'TPU (Mid Century Teal) 1.75mm 1kg Filament [ATRL50217718U]', productUrl: 'https://www.paramount-3d.com/product-page/copy-of-tpu-mid-century-teal-1-75mm-1kg-filament', color: 'Mid Century Teal', imageUrl: '', colorHex: '#008B8B' },
  { material: 'TPU', filamentLine: 'TPU (Iron Red) 1.75mm 1kg Filament [IRRL30111815U]', productUrl: 'https://www.paramount-3d.com/product-page/tpu-iron-red-1-75mm-1kg-filament', color: 'Iron Red', imageUrl: '', colorHex: '#8B3A3A' },
  
  // ===== PVA (1 color - Support Material) =====
  { material: 'PVA', filamentLine: 'PVA 1.75mm 1kg Filament', productUrl: 'https://www.paramount-3d.com/pva', color: 'Natural', imageUrl: '', colorHex: '#F5F5DC' },
  
  // ===== Nylon Carbon Fiber (1 color) =====
  { material: 'Nylon CF', filamentLine: 'Nylon Carbon Fiber 1.75mm 1kg Filament [NCF810031560738]', productUrl: 'https://www.paramount-3d.com/product-page/paramount-3d-nylon-carbon-fiber', color: 'Natural', imageUrl: '', colorHex: '#1A1A1A' },
];

// ============================================================================
// HELPER: GET COLOR HEX FROM SEED OR EXTENDED MAP
// ============================================================================

export function getParamountColorHexFromSeed(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // First check the seed data for exact color match
  const seedMatch = PARAMOUNT_SEED_DATA.find(
    entry => entry.color.toLowerCase() === normalized
  );
  if (seedMatch?.colorHex) {
    return seedMatch.colorHex;
  }
  
  // Then check extended color map
  if (PARAMOUNT_EXTENDED_COLOR_MAP[normalized]) {
    return PARAMOUNT_EXTENDED_COLOR_MAP[normalized];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(PARAMOUNT_EXTENDED_COLOR_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

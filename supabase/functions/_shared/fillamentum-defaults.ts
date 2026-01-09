/**
 * Fillamentum Brand Defaults
 * Premium Czech filament manufacturer known for exceptional color consistency,
 * unique color names, and engineering materials including CPE, Nylon, and Flexfill lines.
 */

// Version constant to force module cache refresh on deployment
export const FILLAMENTUM_DEFAULTS_VERSION = '2026-01-09-v4';

// ============================================================================
// PRODUCT LINE DEFINITIONS
// ============================================================================

export const FILLAMENTUM_PRODUCT_LINES: Record<string, {
  material: string;
  productLine: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  highSpeedCapable: boolean;
  tdsUrl: string | null;
}> = {
  // PLA Family
  'pla-extrafill': {
    material: 'PLA',
    productLine: 'Extrafill',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_PLA-Extrafill_26082019.pdf'
  },
  'pla-crystal-clear': {
    material: 'PLA',
    productLine: 'Crystal Clear',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_PLA-Crystal-Clear_26082019.pdf'
  },
  'pla-lightweight': {
    material: 'LW-PLA',
    productLine: 'Extrafill LW',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2021/06/TDS_PLA-Extrafill-LW.pdf'
  },
  
  // ABS/ASA Family
  'abs-extrafill': {
    material: 'ABS',
    productLine: 'Extrafill',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_ABS-Extrafill_26082019.pdf'
  },
  'asa-extrafill': {
    material: 'ASA',
    productLine: 'Extrafill',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_ASA-Extrafill_26082019.pdf'
  },
  'asa-cf10': {
    material: 'ASA-CF',
    productLine: 'CF10 Carbon',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2022/01/TDS_ASA-CF10-Carbon.pdf'
  },
  
  // PETG Family
  'petg': {
    material: 'PETG',
    productLine: 'PETG',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_PETG_26082019.pdf'
  },
  
  // CPE Family (Copolyester)
  'cpe-hg100': {
    material: 'CPE',
    productLine: 'HG100',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_CPE-HG100_26082019.pdf'
  },
  'cpe-cf112': {
    material: 'CPE-CF',
    productLine: 'CF112 Carbon',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/TDS_CPE-CF112-Carbon.pdf'
  },
  
  // Flexfill TPU/TPE/PEBA Family
  'flexfill-tpu-98a': {
    material: 'TPU-98A',
    productLine: 'Flexfill 98A',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Flexfill-TPU-98A_26082019.pdf'
  },
  'flexfill-tpu-92a': {
    material: 'TPU-92A',
    productLine: 'Flexfill 92A',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Flexfill-TPU-92A_26082019.pdf'
  },
  'flexfill-tpe-90a': {
    material: 'TPE-90A',
    productLine: 'Flexfill TPE 90A',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Flexfill-TPE_26082019.pdf'
  },
  'flexfill-tpe-96a': {
    material: 'TPE-96A',
    productLine: 'Flexfill TPE 96A',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Flexfill-TPE_26082019.pdf'
  },
  'flexfill-peba-90a': {
    material: 'PEBA-90A',
    productLine: 'Flexfill PEBA',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Flexfill-PEBA-90A_26082019.pdf'
  },
  
  // Nylon Family
  'nylon-fx256': {
    material: 'PA',
    productLine: 'FX256',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Nylon-FX256_26082019.pdf'
  },
  'nylon-cf15': {
    material: 'PA-CF',
    productLine: 'CF15 Carbon',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/TDS_Nylon-CF15-Carbon.pdf'
  },
  'nylon-af80': {
    material: 'PA-AF',
    productLine: 'AF80 Aramid',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/TDS_Nylon-AF80-Aramid.pdf'
  },
  
  // Specialty Materials
  'timberfill': {
    material: 'PLA-Wood',
    productLine: 'Timberfill',
    isAbrasive: true,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Timberfill_03012019.pdf'
  },
  'hips-extrafill': {
    material: 'HIPS',
    productLine: 'Extrafill',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_HIPS-Extrafill_26082019.pdf'
  },
  'vinyl-303': {
    material: 'PVC',
    productLine: 'Vinyl 303',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Vinyl-303_26082019.pdf'
  },
  'pp-2320': {
    material: 'PP',
    productLine: 'PP 2320',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2021/03/TDS_PP-2320.pdf'
  },
  'nonoilen': {
    material: 'Bio-PLA',
    productLine: 'NonOilen',
    isAbrasive: false,
    enclosureRequired: false,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_NonOilen_26082019.pdf'
  },
  
  // Fishy Filaments Collaboration
  'orca': {
    material: 'PA-CF',
    productLine: '0rCA',
    isAbrasive: true,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2023/07/TDS_Fishy-filament-OrCA_EN_20072023.pdf'
  },
  'porthcurno': {
    material: 'PA',
    productLine: 'Porthcurno',
    isAbrasive: false,
    enclosureRequired: true,
    highSpeedCapable: false,
    tdsUrl: 'https://fillamentum.com/wp-content/uploads/2023/04/TDS_Fishy-filament-Porthcurno_EN_06042023.pdf'
  }
};

// ============================================================================
// PRINT SETTINGS
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
}

export const FILLAMENTUM_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 210, bedTempMin: 55, bedTempMax: 60 },
  'LW-PLA': { nozzleTempMin: 200, nozzleTempMax: 250, bedTempMin: 45, bedTempMax: 60 },
  'ABS': { nozzleTempMin: 240, nozzleTempMax: 255, bedTempMin: 100, bedTempMax: 105 },
  'ASA': { nozzleTempMin: 240, nozzleTempMax: 255, bedTempMin: 100, bedTempMax: 105 },
  'ASA-CF': { nozzleTempMin: 245, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110 },
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 90 },
  'CPE': { nozzleTempMin: 255, nozzleTempMax: 275, bedTempMin: 80, bedTempMax: 100 },
  'CPE-CF': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 85, bedTempMax: 105 },
  'TPU-98A': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 50, bedTempMax: 60 },
  'TPU-92A': { nozzleTempMin: 215, nozzleTempMax: 235, bedTempMin: 50, bedTempMax: 60 },
  'TPE-90A': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 70 },
  'TPE-96A': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 50, bedTempMax: 70 },
  'PEBA-90A': { nozzleTempMin: 245, nozzleTempMax: 265, bedTempMin: 80, bedTempMax: 100 },
  'PA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 95 },
  'PA-CF': { nozzleTempMin: 250, nozzleTempMax: 270, bedTempMin: 85, bedTempMax: 100 },
  'PA-AF': { nozzleTempMin: 250, nozzleTempMax: 270, bedTempMin: 85, bedTempMax: 100 },
  'PLA-Wood': { nozzleTempMin: 175, nozzleTempMax: 195, bedTempMin: 50, bedTempMax: 70 },
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 100, bedTempMax: 110 },
  'PVC': { nozzleTempMin: 195, nozzleTempMax: 210, bedTempMin: 75, bedTempMax: 90 },
  'PP': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 85, bedTempMax: 100 },
  'Bio-PLA': { nozzleTempMin: 185, nozzleTempMax: 205, bedTempMin: 50, bedTempMax: 60 }
};

// ============================================================================
// COLOR MAPPING
// ============================================================================

export const FILLAMENTUM_COLOR_MAPPING: Record<string, string> = {
  // Blacks & Grays
  'traffic black': '#1A1A1A',
  'traffic grey': '#6B6B6B',
  'metallic grey': '#A8A8A8',
  'vertigo grey': '#4A4A4A',
  'vertigo starlight': '#303030',
  'vertigo galaxy': '#1F1F3D',
  'concrete grey': '#808080',
  'anthracite grey': '#383838',
  'electric grey': '#607D8B',
  'signal black': '#0A0A0A',
  'iron grey': '#424242',
  'koala grey': '#9E9E9E',
  'black soul': '#1A1A1A',
  'grey mouse transparent': '#9E9E9E80',
  
  // Whites & Naturals
  'traffic white': '#F5F5F5',
  'signal white': '#FFFFFF',
  'natural': '#F0E6D3',
  'ivory white': '#FFFFF0',
  'pearl white': '#F8F6F0',
  'ghost white': '#FAFAFA',
  'snow white': '#FFFFFF',
  'white aluminium': '#E8E8E8',
  
  // Blues
  'cobalt blue': '#0047AB',
  'sky blue': '#87CEEB',
  'iceland blue': '#87CEEB80',        // Transparent version for Crystal Clear
  'iceland blue opaque': '#5BC0EB',   // Opaque version
  'gentlemen blue': '#1E3A5F',
  'prussian blue': '#003153',
  'steel blue': '#4682B4',
  'vertigo blue': '#1E3A8A',
  'signal blue': '#0033A0',
  'pearl blue': '#4A90D9',
  'pearl night blue': '#4A6FA5',
  'noble blue': '#1A237E',
  'turquoise blue': '#40E0D0',
  'ultramarine blue': '#4169E1',
  'azure blue': '#007FFF',
  'grey blue': '#546E7A',
  'sea wave': '#00ACC1',
  'ufo blue metallic': '#1976D2',
  'mistake blue metallic': '#283593',
  'bunny blue transparent': '#81D4FA80',
  'bunny blue': '#81D4FA80',
  'lagoon transparent': '#00BCD480',
  'lagoon': '#00BCD480',
  'deep sea transparent': '#00487880',
  'deep sea': '#00487880',
  'blue transparent': '#2196F380',
  
  // Reds & Pinks
  'traffic red': '#CC0000',
  'signal red': '#FF0000',
  'carmine red': '#960018',
  'ruby red': '#9B111E',
  'pearl ruby red': '#9B111E',
  'purple red': '#800020',
  'extrafill red': '#E31E24',
  'terracotta red': '#CB4335',
  'vertigo red': '#8B0000',
  'luminous red': '#FF2400',
  'pink': '#FFC0CB',
  'traffic magenta': '#CC0066',
  'marrakesh red': '#C62828',
  'red hood transparent': '#D32F2F80',
  'vivid pink': '#FF4081',
  'everybody\'s magenta': '#AD1457',
  'flirty plum': '#7B1FA2',
  'neon pink transparent': '#FF148080',
  'pink lollipop transparent': '#F48FB180',
  'pink blush transparent': '#F8BBD080',
  
  // Oranges & Yellows
  'traffic yellow': '#FFEA00',  // Distinct from gold happens
  'signal yellow': '#FFE135',
  'melon yellow': '#FEDF00',
  'luminous orange': '#FF6600',
  'traffic orange': '#FF5500',
  'signal orange': '#FF8C00',
  'tangerine orange': '#FF9966',
  'calendula orange': '#FF9800',
  'carrot orange': '#FF5722',
  'neon orange transparent': '#FF570080',
  'neon yellow transparent': '#FFFF0080',
  'morning sun transparent': '#FFE08280',
  'lemonade translucent': '#FFF17680',
  'lemon yellow transparent': '#FFEB3B80',
  'dijon mustard': '#C6A600',
  'flash yellow metallic': '#FBC02D',
  
  // Greens
  'luminous green': '#50FF50',
  'pistachio green': '#93C572',
  'signal green': '#00FF00',
  'crystal clear green': '#98FB98',
  'vertigo jade': '#00A86B',
  'jungle green': '#29AB87',
  'jungle green metallic': '#1B5E20',
  'leaf green': '#4CBB17',
  'turquoise green': '#00CED1',
  'mint': '#98FF98',
  'concrete green': '#708238',
  'abu dhabi green': '#2E7D32',
  'aloe green': '#8BC34A',
  'green grass': '#7CB342',
  'greedy dragon': '#388E3C',
  'army green': '#4B5320',
  'iced green transparent': '#69F0AE80',
  'fresh poison transparent': '#76FF0380',
  
  // Purples & Violets
  'vertigo mystique': '#663399',
  'traffic violet': '#8B008B',
  'traffic purple': '#800080',
  'signal violet': '#8B00FF',
  'purple rain': '#483D8B',
  'purple': '#800080',
  'witch please!': '#6B2D5B',
  'wizard\'s voodoo': '#673AB7',
  
  // Browns & Beiges
  'signal brown': '#8B4513',
  'chocolate brown': '#3D2B1F',
  'cinnamon': '#D2691E',
  'leather brown': '#9A7B4F',
  'beige': '#F5DEB3',
  'mukha': '#8D6E63',
  'turkey egg': '#B0BEC5',
  'powder beige': '#D7CCC8',
  'caramel brown metallic': '#795548',
  
  // Metallics
  'gold happens': '#FFD700',
  'vertigo gold': '#D4AF37',
  'aluminium': '#A9A9A9',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'cairo gold': '#D4AF37',
  'gold cloud': '#FFD54F',
  'copper with me': '#B87333',
  'rapunzel silver': '#9E9E9E',
  
  // Transparents (used across PETG, ABS, CPE, PLA Crystal Clear)
  'transparent': '#F0F0F080',
  'crystal clear': '#FFFFFF00',
  'crystal clear iceland blue': '#87CEEB80',
  'crystal clear aquamarine': '#7FFFD480',
  'crystal clear smaragd green': '#50C87880',
  'crystal clear kiwi green': '#8EE53F80',
  'crystal clear amethyst purple': '#9966CC80',
  'amethyst purple': '#9966CC80',
  'amethyst purple transparent': '#9966CC80',
  'kiwi green': '#8EE53F80',
  'kiwi green transparent': '#8EE53F80',
  'smaragd green': '#50C87880',
  'smaragd green transparent': '#50C87880',
  'light grey': '#BDBDBD80',
  'light grey transparent': '#BDBDBD80',
  'baby blue': '#89CFF080',
  'baby blue transparent': '#89CFF080',
  'light ivory': '#FFFFF080',
  'light ivory transparent': '#FFFFF080',
  'orange orange': '#FF660080',
  'orange orange transparent': '#FF660080',
  'peppered mustard': '#E1AD0180',
  'volcanic dust': '#38383880',
  'volcanic dust transparent': '#38383880',
  'lilac': '#C8A2C880',
  'lilac transparent': '#C8A2C880',
  
  // Additional PETG/CPE transparent colors
  'iced coffee transparent': '#A1887F80',
  'apple green transparent': '#8BC34A80',
  'limeade transparent': '#CDDC3980',
  'bottle green transparent': '#00695C80',
  'grass green transparent': '#43A04780',
  'pastel green transparent': '#B2DFDB80',
  'champagne transparent': '#F7E7CE80',
  'beer transparent': '#F5DEB380',
  'mandarin orange transparent': '#FF980080',
  'cobalt blue transparent': '#0047AB80',
  'voodoo black transparent': '#1A1A1A80',
  
  // Single-variant product colors
  'carbon': '#2D2D2D',
  'nonoilen natural': '#C9D6B8',
  'porthcurno blue': '#1E3A5F',
  'polypropylene natural': '#F5F5F5',
  'aramid gold': '#D4A017',
  'orca black': '#1A1A1A',
  
  // Timberfill (Wood)
  'light wood tone': '#DEB887',
  'rosewood': '#65000B',
  'southern pine': '#FFE082',
  'redheart': '#C62828',
  'terracotta': '#CB4335',
  'charcoal': '#424242',
  'champagne': '#F7E7CE',
  
  // Special Effects
  'luminous': '#7FFF00',
  'luminous yellow': '#FFFF00',
  
  // Vertigo Special Effects
  'vertigo cherry': '#8B0000',
  
  // ==== MISSING COLORS ADDED FOR POST SYNC CHECK FIXES ====
  
  // Missing PLA Crystal Clear transparent colors (without existing keys)
  'aquamarine': '#7FFFD480',
  
  // Missing PETG transparent colors (without "transparent" suffix)
  'iced coffee': '#A1887F80',
  'limeade': '#CDDC3980',
  'bottle green': '#00695C80',
  'grass green': '#43A04780',
  'pastel green': '#B2DFDB80',
  'beer': '#F5DEB380',
  'mandarin orange': '#FF980080',
  'voodoo black': '#1A1A1A80',
  
  // Missing CPE HG100 colors
  'misty pink transparent': '#FFD1DC80',
  'sky blue transparent': '#87CEEB80',
  'desert grey': '#9E9E9E',
  'pearl green': '#88D8C0',
  'pearl pink': '#E8B4B8',
  'egypt blue': '#1034A6',
  'urban grey': '#5A5A5A',
  
  // Single-variant product defaults (Bio-PLA, PP, specialty)
  'nonoilen': '#C9D6B8',           // Bio-PLA natural green-beige
  'cf10': '#2D2D2D',                // ASA Carbon Fiber black
  'cf15': '#2D2D2D',                // Nylon Carbon Fiber black
  'cf112': '#2D2D2D',               // CPE Carbon Fiber black
  'af80': '#D4A017',                // Aramid Fiber gold
  'pp 2320': '#F5F5F5',             // Polypropylene natural
  'porthcurno': '#1E3A5F',          // Ocean blue (Fishy Filaments)
  '0rca': '#1A1A1A',                // Carbon black (Fishy Filaments)
  'orca': '#1A1A1A',                // Carbon black (alias)
};

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

interface MaterialPattern {
  patterns: RegExp[];
  material: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
}

const MATERIAL_PATTERNS: MaterialPattern[] = [
  // Carbon Fiber variants (must check before base materials)
  { patterns: [/asa[- ]?cf/i, /cf10/i], material: 'ASA-CF', isAbrasive: true, enclosureRequired: true },
  { patterns: [/cpe[- ]?cf/i, /cf112/i], material: 'CPE-CF', isAbrasive: true, enclosureRequired: true },
  { patterns: [/nylon[- ]?cf/i, /cf15/i, /\bpa[- ]?cf\b/i], material: 'PA-CF', isAbrasive: true, enclosureRequired: true },
  
  // Aramid Fiber
  { patterns: [/af80/i, /aramid/i, /\bpa[- ]?af\b/i], material: 'PA-AF', isAbrasive: true, enclosureRequired: true },
  
  // TPU/TPE/PEBA with Shore grades (check TPE-96A before generic TPE)
  { patterns: [/tpu[- ]?98a/i, /flexfill[- ]?98/i], material: 'TPU-98A', isAbrasive: false, enclosureRequired: false },
  { patterns: [/tpu[- ]?92a/i, /flexfill[- ]?92/i], material: 'TPU-92A', isAbrasive: false, enclosureRequired: false },
  { patterns: [/tpe[- ]?96a/i, /flexfill[- ]?tpe[- ]?96/i], material: 'TPE-96A', isAbrasive: false, enclosureRequired: false },
  { patterns: [/tpe[- ]?90a/i, /flexfill[- ]?tpe/i], material: 'TPE-90A', isAbrasive: false, enclosureRequired: false },
  { patterns: [/peba[- ]?90a/i, /flexfill[- ]?peba/i], material: 'PEBA-90A', isAbrasive: false, enclosureRequired: true },
  
  // Specialty materials
  { patterns: [/vinyl[- ]?303/i, /pvc/i], material: 'PVC', isAbrasive: false, enclosureRequired: true },
  { patterns: [/nonoilen/i, /bio[- ]?pla/i], material: 'Bio-PLA', isAbrasive: false, enclosureRequired: false },
  { patterns: [/timberfill/i, /wood/i], material: 'PLA-Wood', isAbrasive: true, enclosureRequired: false },
  { patterns: [/pp[- ]?2320/i, /polypropylene/i], material: 'PP', isAbrasive: false, enclosureRequired: false },
  { patterns: [/lw[- ]?pla/i, /lightweight/i], material: 'LW-PLA', isAbrasive: false, enclosureRequired: false },
  
  // Engineering plastics (CPE, HIPS)
  { patterns: [/cpe[- ]?hg100/i, /\bcpe\b(?![- ]?cf)/i], material: 'CPE', isAbrasive: false, enclosureRequired: true },
  { patterns: [/\bhips\b/i], material: 'HIPS', isAbrasive: false, enclosureRequired: true },
  
  // CRITICAL: Standard materials BEFORE PA to prevent "transparent" matching "/pa/"
  { patterns: [/\bpetg\b/i], material: 'PETG', isAbrasive: false, enclosureRequired: false },
  { patterns: [/\babs[- ]?extrafill\b/i, /\babs\b/i], material: 'ABS', isAbrasive: false, enclosureRequired: true },
  { patterns: [/\basa(?![- ]?cf)\b/i], material: 'ASA', isAbrasive: false, enclosureRequired: true },
  
  // PA/Nylon - FIXED: use word boundary \b to prevent matching "transparent"
  { patterns: [/nylon[- ]?fx256/i, /\bnylon\b(?![- ]?cf|[- ]?af)/i, /\bpa\b(?![- ]?cf|[- ]?af)/i], material: 'PA', isAbrasive: false, enclosureRequired: true },
  
  // PLA as last fallback
  { patterns: [/pla(?![- ]?wood|[- ]?cf)/i, /extrafill/i], material: 'PLA', isAbrasive: false, enclosureRequired: false }
];

export function normalizeFillamentumMaterial(title: string): {
  material: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
} {
  const normalizedTitle = title.toLowerCase();
  
  for (const pattern of MATERIAL_PATTERNS) {
    if (pattern.patterns.some(p => p.test(normalizedTitle))) {
      return {
        material: pattern.material,
        isAbrasive: pattern.isAbrasive,
        enclosureRequired: pattern.enclosureRequired
      };
    }
  }
  
  // Default to PLA for unmatched Extrafill products
  if (normalizedTitle.includes('extrafill')) {
    return { material: 'PLA', isAbrasive: false, enclosureRequired: false };
  }
  
  return { material: 'Other', isAbrasive: false, enclosureRequired: false };
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'metallic' | 'transparent' | 'translucent' | 'glow' | 'pearl' | 'matte' | 'standard';

export function extractFillamentumFinishType(title: string, colorName: string): FinishType {
  const combined = `${title} ${colorName}`.toLowerCase();
  
  if (/metallic|aluminium|gold happens|bronze|copper/i.test(combined)) return 'metallic';
  if (/crystal[- ]?clear|transparent/i.test(combined)) return 'transparent';
  if (/translucent/i.test(combined)) return 'translucent';
  if (/luminous|glow/i.test(combined)) return 'glow';
  if (/vertigo.*starlight|pearl|galaxy/i.test(combined)) return 'pearl';
  
  // Extrafill standard finish is matte
  if (/extrafill/i.test(title)) return 'matte';
  
  return 'standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateFillamentumProductLineId(title: string, material: string): string {
  const normalizedTitle = title.toLowerCase();
  
  // Priority matches - detect specific products before general patterns
  // PETG products (must check before PA which matches "petg" incorrectly)
  if (/\bpetg\b/i.test(normalizedTitle)) {
    return 'fillamentum__petg__petg';
  }
  
  // ABS products (before PA check)
  if (/abs[- ]?extrafill/i.test(normalizedTitle)) {
    return 'fillamentum__abs__abs-extrafill';
  }
  
  // Flexfill TPE-96A (missing from product lines)
  if (/flexfill[- ]?tpe[- ]?96a/i.test(normalizedTitle)) {
    return 'fillamentum__tpe-96a__flexfill-tpe-96a';
  }
  
  // Match against known product lines
  for (const [slug, config] of Object.entries(FILLAMENTUM_PRODUCT_LINES)) {
    const linePattern = new RegExp(slug.replace(/-/g, '[- ]?'), 'i');
    if (linePattern.test(normalizedTitle) || 
        (normalizedTitle.includes(config.productLine.toLowerCase()) && material === config.material)) {
      return `fillamentum__${material.toLowerCase().replace(/-/g, '-')}__${slug}`;
    }
  }
  
  // Fallback: generate from material
  const cleanTitle = normalizedTitle
    .replace(/fillamentum/gi, '')
    .replace(/made in usa/gi, '')
    .replace(/[""]/g, '')
    .trim();
  
  const productLine = cleanTitle.split(/\s+/).slice(0, 2).join('-').replace(/[^a-z0-9-]/g, '');
  return `fillamentum__${material.toLowerCase()}__${productLine || 'standard'}`;
}

// ============================================================================
// COLOR EXTRACTION
// ============================================================================

export function extractFillamentumColor(title: string): string | null {
  // Fillamentum uses quoted color names: PLA Extrafill "Traffic Black"
  const quotedMatch = title.match(/["""]([^"""]+)["""]/);
  if (quotedMatch) {
    return quotedMatch[1].trim();
  }
  
  // Fallback: extract after material name
  const afterMaterial = title.replace(/^.*?(pla|abs|asa|petg|cpe|nylon|flexfill|tpu|tpe|peba|timberfill|hips|vinyl|nonoilen|pp)/i, '').trim();
  if (afterMaterial && afterMaterial.length > 0) {
    // Remove common suffixes
    return afterMaterial
      .replace(/\|.*$/g, '')
      .replace(/made in usa/gi, '')
      .replace(/\d+\.?\d*\s*mm/gi, '')
      .replace(/\d+\s*(g|kg)/gi, '')
      .trim() || null;
  }
  
  return null;
}

export function getFillamentumColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  // Normalize: lowercase, trim, normalize unicode, collapse whitespace
  const normalized = colorName
    .toLowerCase()
    .trim()
    .normalize('NFKC')
    .replace(/\s+/g, ' ');
  
  // Direct match
  if (FILLAMENTUM_COLOR_MAPPING[normalized]) {
    return FILLAMENTUM_COLOR_MAPPING[normalized];
  }
  
  // Partial match (bidirectional)
  for (const [key, hex] of Object.entries(FILLAMENTUM_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  // Try stripping "transparent" suffix and retry
  const withoutTransparent = normalized.replace(/\s+transparent$/i, '').trim();
  if (withoutTransparent !== normalized) {
    if (FILLAMENTUM_COLOR_MAPPING[withoutTransparent]) {
      return FILLAMENTUM_COLOR_MAPPING[withoutTransparent];
    }
    // Also try with "transparent" appended to handle reverse case
    const withTransparent = `${withoutTransparent} transparent`;
    if (FILLAMENTUM_COLOR_MAPPING[withTransparent]) {
      return FILLAMENTUM_COLOR_MAPPING[withTransparent];
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanFillamentumTitle(title: string): string {
  return title
    .replace(/\s*\|\s*Made in USA/gi, '')
    .replace(/\s*\|\s*\d+\.?\d*\s*mm/gi, '')
    .replace(/\s*\|\s*\d+\s*(g|kg)/gi, '')
    .replace(/fillamentum\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface FillamentumEnrichmentResult {
  material: string;
  finishType: FinishType;
  productLineId: string;
  tdsUrl: string | null;
  printSettings: PrintSettings | null;
  colorHex: string | null;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  cleanedTitle: string;
}

export function enrichFillamentumProduct(
  title: string,
  colorName?: string | null,
  existingMaterial?: string | null
): FillamentumEnrichmentResult {
  // Normalize material
  const materialInfo = normalizeFillamentumMaterial(title);
  const material = existingMaterial && existingMaterial !== 'Other' 
    ? existingMaterial 
    : materialInfo.material;
  
  // Extract color if not provided
  const extractedColor = colorName || extractFillamentumColor(title);
  
  // Detect finish type
  const finishType = extractFillamentumFinishType(title, extractedColor || '');
  
  // Generate product line ID
  const productLineId = generateFillamentumProductLineId(title, material);
  
  // Find TDS URL from product line config
  let tdsUrl: string | null = null;
  for (const [slug, config] of Object.entries(FILLAMENTUM_PRODUCT_LINES)) {
    if (productLineId.includes(slug) || config.material === material) {
      tdsUrl = config.tdsUrl;
      break;
    }
  }
  
  // Get print settings
  const printSettings = FILLAMENTUM_PRINT_SETTINGS[material] || null;
  
  // Get color hex
  const colorHex = extractedColor ? getFillamentumColorHex(extractedColor) : null;
  
  // Clean title
  const cleanedTitle = cleanFillamentumTitle(title);
  
  return {
    material,
    finishType,
    productLineId,
    tdsUrl,
    printSettings,
    colorHex,
    isAbrasive: materialInfo.isAbrasive,
    enclosureRequired: materialInfo.enclosureRequired,
    cleanedTitle
  };
}

// ============================================================================
// STORE CONFIGURATION
// ============================================================================

export const FILLAMENTUM_STORE_INFO = {
  vendor: 'Fillamentum',
  baseUrlEU: 'https://shop.fillamentum.com',
  baseUrlUSA: 'https://fillamentumusa.com',
  defaultDiameter: 1.75,
  defaultWeight: 750, // Fillamentum uses 750g as standard
  spoolMaterial: 'Plastic',
  currency: 'USD'
};

// ============================================================================
// COLLECTION SLUGS FOR DISCOVERY
// ============================================================================

export const FILLAMENTUM_COLLECTION_SLUGS = [
  'pla-extrafill-filament',
  'pla-crystal-clear-filament',
  'abs-extrafill-filament',
  'asa-extrafill',
  'petg',
  'cpe-filament',
  'flexfill',
  'nylon-fx256',
  'nylon-cf15-carbon',
  'nylon-af80-aramid',
  'timberfill',
  'hips-extrafill-filament',
  'vinyl-303',
  'nonoilen',
  'fishy-filaments-by-fillamentum',
  'pla-extrafill-lw'
];

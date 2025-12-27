/**
 * UNIFIED COLOR MAPPING FOR ALL SCRAPERS
 * 
 * This module provides a single source of truth for color name to hex code mappings
 * across all brand scrapers (Elegoo, Bambu Lab, generic, etc.)
 * 
 * Usage:
 * import { getColorHex, COLOR_HEX_MAP } from '../_shared/color-mapping.ts';
 * const hex = getColorHex('Matte Black'); // Returns '1A1A1A'
 */

// ============================================================================
// COMPREHENSIVE COLOR HEX MAPPING
// ============================================================================

/**
 * Master color hex mapping - consolidated from all scrapers
 * Keys are lowercase for case-insensitive matching
 * Values are 6-character hex codes WITHOUT the # prefix
 */
export const COLOR_HEX_MAP: Record<string, string> = {
  // ==================== BASIC COLORS ====================
  'black': '1A1A1A',
  'white': 'FFFFFF',
  'grey': '808080',
  'gray': '808080',
  'red': 'DC2626',
  'blue': '2563EB',
  'green': '16A34A',
  'yellow': 'EAB308',
  'orange': 'EA580C',
  'purple': '9333EA',
  'pink': 'EC4899',
  'brown': '92400E',
  'beige': 'D4C4A8',
  'silver': 'C0C0C0',
  'gold': 'D4AF37',
  'copper': 'B87333',
  'bronze': 'CD7F32',
  'transparent': 'FFFFFF',
  'clear': 'FFFFFF',
  'natural': 'F5F5DC',
  'ivory': 'FFFFF0',
  'cream': 'FFFDD0',
  'tan': 'D2B48C',
  'olive': '808000',
  'teal': '008080',
  'cyan': '00FFFF',
  'magenta': 'FF00FF',
  'lime': '00FF00',
  'mint': '98FF98',
  'coral': 'FF7F50',
  'salmon': 'FA8072',
  'maroon': '800000',
  'burgundy': '800020',
  'navy': '1E3A5F',
  'charcoal': '36454F',
  'midnight': '191970',
  'rose': 'FF007F',
  'lavender': 'E6E6FA',
  'violet': 'EE82EE',
  'indigo': '4B0082',
  'peach': 'FFCBA4',
  'aqua': '00FFFF',
  'turquoise': '40E0D0',
  'khaki': 'C3B091',
  'camel': 'C19A6B',
  'coffee': '6F4E37',
  'chocolate': 'D2691E',
  'skin': 'FFCBA4',
  'flesh': 'FFCBA4',

  // ==================== BLUE VARIANTS ====================
  'navy blue': '000080',
  'sky blue': '87CEEB',
  'royal blue': '4169E1',
  'light blue': 'ADD8E6',
  'dark blue': '00008B',
  'lake blue': '4682B4',
  'peacock blue': '005F69',
  'sapphire blue': '0F52BA',
  'cobalt blue': '0047AB',
  'midnight blue': '191970',
  'ice blue': 'B0E0E6',
  'azure': '489FDF',
  'ocean blue': '006994',
  'steel blue': '4682B4',

  // ==================== GREEN VARIANTS ====================
  'forest green': '228B22',
  'olive green': '6B8E23',
  'light green': '90EE90',
  'dark green': '006400',
  'mint green': '98FF98',
  'grass green': '7CFC00',
  'army green': '4B5320',
  'bambu green': '00AE42',
  'forest': '228B22',
  'hunter green': '355E3B',
  'sage': '9DC183',
  'emerald': '50C878',

  // ==================== GREY VARIANTS ====================
  'light grey': 'D3D3D3',
  'light gray': 'D3D3D3',
  'dark grey': 'A9A9A9',
  'dark gray': 'A9A9A9',
  'stone grey': '928E85',
  'stone gray': '928E85',
  'space grey': '4F4F4F',
  'space gray': '4F4F4F',
  'cement grey': '8D918D',
  'cement gray': '8D918D',
  'gunmetal': '2A3439',
  'slate': '708090',
  'ash': 'B2BEB5',

  // ==================== RED VARIANTS ====================
  'burgundy red': '800020',
  'wine red': '722F37',
  'scarlet': 'FF2400',
  'crimson': 'DC143C',
  'cherry': 'DE3163',
  'ruby': 'E0115F',
  'blood red': '660000',
  'fire red': 'CE2029',

  // ==================== YELLOW/ORANGE VARIANTS ====================
  'tangerine': 'FF9966',
  'tangerine yellow': 'FFC72C',
  'mustard': 'FFDB58',
  'lemon': 'FFF44F',
  'amber': 'FFBF00',
  'apricot': 'FBCEB1',
  'sunset': 'FAD6A5',
  'pumpkin': 'FF7518',

  // ==================== NEON COLORS ====================
  'neon green': '39FF14',
  'neon pink': 'FF6EC7',
  'neon orange': 'FF5F1F',
  'neon yellow': 'CCFF00',
  'hot pink': 'FF69B4',
  'neon blue': '1B03A3',
  'neon purple': 'BC13FE',

  // ==================== GLOW COLORS ====================
  'glow green': '39FF14',
  'glow blue': '00BFFF',
  'glow orange': 'FF4500',
  'glow yellow': 'FFFF00',
  'glow pink': 'FF1493',

  // ==================== MATTE FINISH ====================
  'matte black': '1A1A1A',
  'matte white': 'FAFAFA',
  'matte grey': '808080',
  'matte gray': '808080',
  'matte beige': 'D4C4A8',
  'matte red': 'B91C1C',
  'matte blue': '1D4ED8',
  'matte green': '15803D',
  'matte navy': '1E3A5F',
  'matte brown': '5C4033',

  // ==================== SILK FINISH ====================
  'silk white': 'FFFEF0',
  'silk black': '2D2D2D',
  'silk gold': 'FFD700',
  'silk silver': 'E8E8E8',
  'silk copper': 'DA8A67',
  'silk bronze': 'CD7F32',
  'silk red': 'DC143C',
  'silk blue': '4169E1',
  'silk green': '32CD32',
  'silk purple': '9370DB',
  'silk pink': 'FFB6C1',
  'silk rose gold': 'B76E79',
  'silk champagne': 'F7E7CE',
  'silk teal': '20B2AA',
  'silk orange': 'FF8C00',
  'silk navy': '2C3E50',
  'silk violet': '8B5CF6',
  
  // ==================== GOLD VARIANTS ====================
  'rose gold': 'B76E79',
  'old gold': 'CFB53B',
  'antique gold': 'C9AE5D',
  'champagne gold': 'F7E7CE',
  'pale gold': 'EEE8AA',
  
  // ==================== CLEAR/GLASS VARIANTS ====================
  'crystal clear': 'F5F5F5',
  'ultra clear': 'FAFAFA',
  'water clear': 'F0FFFF',
  'glass clear': 'E8F4F8',

  // ==================== TRANSLUCENT/TRANSPARENT ====================
  'translucent': 'FFFFFF',
  'translucent blue': '87CEEB',
  'translucent green': '90EE90',
  'translucent red': 'FF6B6B',
  'translucent orange': 'FFB347',
  'translucent yellow': 'FFFF99',
  'translucent purple': 'DDA0DD',
  'translucent pink': 'FFB6C1',
  'glass': 'E8F4F8',

  // ==================== SPECIAL/MULTI ====================
  'rainbow': 'FF0000',
  'multicolor': 'FF0000',
  'earth brown': '5C4033',
  'lavender purple': 'B57EDC',
  'galaxy': '2F1B41',
  'cosmic': '1B1464',
  'nebula': '3D1C56',
  'starry': '1A1A2E',

  // ==================== WOOD TONES ====================
  'maple': 'C19A6B',
  'walnut': '5D432C',
  'oak': 'B8860B',
  'bamboo': 'D4B896',
  'ebony': '3D3635',
  'mahogany': 'C04000',
  'pine': 'C5AE91',
  'cedar': 'A0522D',
  'cherry wood': '7B3F00',
  'driftwood': 'AF8751',

  // ==================== 3D-FUEL SPECIALTY COLORS ====================
  'lava': 'FF4500',
  'ocean': '006994',
  'arctic': 'E0FFFF',
  'volcano': 'CF1020',
  'glacier': 'DFFFFE',
  'sunshine': 'FFD700',
  'meadow': '7CFC00',
  'storm': '4F5D75',
  'snow': 'FFFAFA',
  'iron': '48494B',

  // ==================== TREED ITALIAN COLORS ====================
  'nero': '1A1A1A',
  'bianco': 'FFFFFF',
  'rosso': 'DC2626',
  'blu': '2563EB',
  'verde': '16A34A',
  'giallo': 'EAB308',
  'arancione': 'EA580C',
  'grigio': '808080',
  'marrone': '92400E',
  'rosa': 'EC4899',
  'viola': '9333EA',
  'azzurro': '87CEEB',
  'celeste': '87CEEB',
  'fucsia': 'FF00FF',
  'turchese': '40E0D0',
  'acquamarina': '7FFFD4',
  'corallo': 'FF7F50',
  'bordeaux': '800020',
  'cremisi': 'DC143C',
  'indaco': '4B0082',
  'lavanda': 'E6E6FA',
  'lilla': 'C8A2C8',
  'oliva': '808000',
  'pesca': 'FFCBA4',
  'salmone': 'FA8072',
  'terracotta': 'E2725B',
  'legno': '8B4513',
  'rame': 'B87333',
  'bronzo': 'CD7F32',
  'argento': 'C0C0C0',
  'oro': 'FFD700',
  'trasparente': 'FFFFFF',
  'naturale': 'F5F5DC',

  // ==================== SPANISH COLORS (Recreus/Filaflex) ====================
  'blanco': 'FFFFFF',
  'negro': '1A1A1A',
  'rojo': 'DC2626',
  'azul': '2563EB',
  'azul claro': '87CEEB',
  'azul oscuro': '00008B',
  'azul marino': '000080',
  'amarillo': 'EAB308',
  'naranja': 'EA580C',
  'morado': '9333EA',
  'purpura': '9333EA',
  'púrpura': '9333EA',
  'violeta es': 'EE82EE',  // Spanish violeta
  'gris': '808080',
  'plata': 'C0C0C0',
  'dorado': 'FFD700',
  'marron': '92400E',
  'marrón': '92400E',
  'cafe': '6F4E37',
  'café': '6F4E37',
  'crema': 'FFFDD0',
  'piel': 'FFCBA4',
  'carne': 'FFCBA4',
  'turquesa': '40E0D0',
  'salmón': 'FA8072',
  'lima': '00FF00',
  'menta': '98FF98',
  'olivo': '808000',
  'cobre': 'B87333',
  'bronce': 'CD7F32',
  'burdeos': '800020',
  'granate': '800000',
  'melocoton': 'FFCBA4',
  'melocotón': 'FFCBA4',
  'índigo': '4B0082',

  // ==================== CHINESE COLORS (Anycubic/common brands) ====================
  '黑色': '1A1A1A',
  '白色': 'FFFFFF',
  '红色': 'DC2626',
  '蓝色': '2563EB',
  '绿色': '16A34A',
  '黄色': 'EAB308',
  '橙色': 'EA580C',
  '紫色': '9333EA',
  '粉色': 'EC4899',
  '粉红色': 'EC4899',
  '灰色': '808080',
  '银色': 'C0C0C0',
  '金色': 'FFD700',
  '棕色': '92400E',
  '咖啡色': '6F4E37',
  '褐色': '8B4513',
  '透明': 'FFFFFF',
  '天蓝色': '87CEEB',
  '深蓝色': '00008B',
  '浅蓝色': 'ADD8E6',
  '草绿色': '7CFC00',
  '深绿色': '006400',
  '浅绿色': '90EE90',
  '墨绿色': '006400',
  '酒红色': '722F37',
  '玫红色': 'FF007F',
  '橘色': 'FF8C00',
  '米色': 'F5F5DC',
  '肤色': 'FFCBA4',
  '青色': '00FFFF',

  // ==================== GERMAN COLORS (Recycling Fabrik/EU brands) ====================
  'schwarz': '1A1A1A',
  'weiß': 'FFFFFF',
  'weiss': 'FFFFFF',
  'rot': 'DC2626',
  'dunkelrot': '8B0000',
  'hellrot': 'FF6B6B',
  'blau': '2563EB',
  'dunkelblau': '00008B',
  'hellblau': 'ADD8E6',
  'grün': '16A34A',
  'gruen': '16A34A',
  'dunkelgrün': '006400',
  'dunkelgruen': '006400',
  'hellgrün': '90EE90',
  'hellgruen': '90EE90',
  'gelb': 'EAB308',
  'neongelb': 'CCFF00',
  'braun': '92400E',
  'grau': '808080',
  'hellgrau': 'D3D3D3',
  'dunkelgrau': '696969',
  'lila': '9333EA',
  'violett de': 'EE82EE',
  'rosa de': 'FFC0CB',
  'silber': 'C0C0C0',
  'gold de': 'FFD700',
  'kupfer': 'B87333',
  'bronze de': 'CD7F32',
  'natur': 'F5F5DC',
  'transparent de': 'FFFFFF',
  'beige de': 'D4C4A8',
  'terrakotta': 'E2725B',
  'holz': '8B4513',
  'elfenbein': 'FFFFF0',
  'karamell': 'FFD59A',
  'himmelblau': '87CEEB',
  'türkis': '40E0D0',
  'tuerkis': '40E0D0',
  'magenta de': 'FF00FF',
  'orange de': 'EA580C',
  'petrol': '006E6D',
  'anthrazit': '293133',
  'ocker': 'CC7722',
  'bordeaux de': '800020',
  'apfelgrün': '8DB600',
  'apfelgruen': '8DB600',
  'koralle': 'FF7F50',
  'pfirsich': 'FFCBA4',
  'zitrone': 'FFF44F',
  'tannengrün': '1E5631',
  'tannengruen': '1E5631',

  // ==================== SAINSMART/COMMON BRAND COLORS ====================
  'army': '4B5320',
  'sea': '2E8B57',
  'grass': '7CFC00',
  'wine': '722F37',
  'skin tone': 'FFCBA4',
  'bone': 'E3DAC9',
  'clay': 'B66A50',

  // ==================== RECREUS/FILAFLEX COLORS ====================
  'filaflex': 'FFFFFF',
  'fluor': '39FF14',
  'fluorescent green': '39FF14',
  'fluorescent orange': 'FF5F1F',
  'fluorescent pink': 'FF6EC7',
  'fluorescent yellow': 'CCFF00',
};

// ============================================================================
// COLOR FAMILY DEFINITIONS
// ============================================================================

export const COLOR_FAMILY_MAP: Record<string, string> = {
  // Blacks
  'black': 'Black',
  'matte black': 'Black',
  'silk black': 'Black',
  'charcoal': 'Black',
  'midnight': 'Black',
  
  // Whites
  'white': 'White',
  'matte white': 'White',
  'silk white': 'White',
  'ivory': 'White',
  'cream': 'White',
  
  // Grays
  'grey': 'Gray',
  'gray': 'Gray',
  'silver': 'Gray',
  'light grey': 'Gray',
  'light gray': 'Gray',
  'dark grey': 'Gray',
  'dark gray': 'Gray',
  'stone grey': 'Gray',
  'space grey': 'Gray',
  'cement grey': 'Gray',
  'matte grey': 'Gray',
  'silk silver': 'Gray',
  
  // Reds
  'red': 'Red',
  'matte red': 'Red',
  'silk red': 'Red',
  'burgundy': 'Red',
  'burgundy red': 'Red',
  'wine red': 'Red',
  'maroon': 'Red',
  'scarlet': 'Red',
  'crimson': 'Red',
  
  // Oranges
  'orange': 'Orange',
  'neon orange': 'Orange',
  'glow orange': 'Orange',
  'tangerine': 'Orange',
  'coral': 'Orange',
  'salmon': 'Orange',
  'peach': 'Orange',
  
  // Yellows
  'yellow': 'Yellow',
  'neon yellow': 'Yellow',
  'tangerine yellow': 'Yellow',
  'lemon': 'Yellow',
  
  // Golds
  'gold': 'Gold',
  'silk gold': 'Gold',
  'rose gold': 'Gold',
  'old gold': 'Gold',
  'antique gold': 'Gold',
  'champagne gold': 'Gold',
  'pale gold': 'Gold',
  'mustard': 'Yellow',
  
  // Greens
  'green': 'Green',
  'matte green': 'Green',
  'silk green': 'Green',
  'neon green': 'Green',
  'glow green': 'Green',
  'forest green': 'Green',
  'olive green': 'Green',
  'olive': 'Green',
  'mint': 'Green',
  'mint green': 'Green',
  'lime': 'Green',
  'teal': 'Green',
  'grass green': 'Green',
  'army green': 'Green',
  'bambu green': 'Green',
  
  // Blues
  'blue': 'Blue',
  'matte blue': 'Blue',
  'silk blue': 'Blue',
  'glow blue': 'Blue',
  'navy': 'Blue',
  'navy blue': 'Blue',
  'sky blue': 'Blue',
  'royal blue': 'Blue',
  'light blue': 'Blue',
  'dark blue': 'Blue',
  'lake blue': 'Blue',
  'peacock blue': 'Blue',
  'sapphire blue': 'Blue',
  'cobalt blue': 'Blue',
  'midnight blue': 'Blue',
  'ice blue': 'Blue',
  'azure': 'Blue',
  'cyan': 'Blue',
  'aqua': 'Blue',
  'turquoise': 'Blue',
  
  // Purples
  'purple': 'Purple',
  'silk purple': 'Purple',
  'lavender': 'Purple',
  'lavender purple': 'Purple',
  'violet': 'Purple',
  'indigo': 'Purple',
  'magenta': 'Purple',
  'plum': 'Purple',
  
  // Pinks
  'pink': 'Pink',
  'silk pink': 'Pink',
  'neon pink': 'Pink',
  'hot pink': 'Pink',
  'rose': 'Pink',
  'fuchsia': 'Pink',
  
  // Browns
  'brown': 'Brown',
  'tan': 'Brown',
  'beige': 'Brown',
  'matte beige': 'Brown',
  'khaki': 'Brown',
  'camel': 'Brown',
  'coffee': 'Brown',
  'chocolate': 'Brown',
  'earth brown': 'Brown',
  'copper': 'Brown',
  'silk copper': 'Brown',
  'bronze': 'Brown',
  'silk bronze': 'Brown',
  
  // Transparent/Clear
  'transparent': 'Clear',
  'translucent': 'Clear',
  'clear': 'Clear',
  'crystal clear': 'Clear',
  'ultra clear': 'Clear',
  'water clear': 'Clear',
  'glass clear': 'Clear',
  'glass': 'Clear',
  'translucent blue': 'Clear',
  'translucent green': 'Clear',
  'translucent red': 'Clear',
  'translucent orange': 'Clear',
  'translucent yellow': 'Clear',
  'translucent purple': 'Clear',
  'translucent pink': 'Clear',
  
  // Natural
  'natural': 'Natural',
  'skin': 'Natural',
  'flesh': 'Natural',
  
  // Multi
  'rainbow': 'Multi',
  'multicolor': 'Multi',
  
  // Wood
  'maple': 'Wood',
  'walnut': 'Wood',
  'oak': 'Wood',
  'bamboo': 'Wood',
  
  // German color families
  'schwarz': 'Black',
  'weiß': 'White',
  'weiss': 'White',
  'rot': 'Red',
  'dunkelrot': 'Red',
  'hellrot': 'Red',
  'blau': 'Blue',
  'dunkelblau': 'Blue',
  'hellblau': 'Blue',
  'himmelblau': 'Blue',
  'grün': 'Green',
  'gruen': 'Green',
  'dunkelgrün': 'Green',
  'dunkelgruen': 'Green',
  'hellgrün': 'Green',
  'hellgruen': 'Green',
  'apfelgrün': 'Green',
  'apfelgruen': 'Green',
  'tannengrün': 'Green',
  'tannengruen': 'Green',
  'gelb': 'Yellow',
  'neongelb': 'Yellow',
  'zitrone': 'Yellow',
  'braun': 'Brown',
  'grau': 'Gray',
  'hellgrau': 'Gray',
  'dunkelgrau': 'Gray',
  'anthrazit': 'Gray',
  'lila': 'Purple',
  'violett': 'Purple',
  'violett de': 'Purple',
  'rosa': 'Pink',
  'rosa de': 'Pink',
  'koralle': 'Orange',
  'pfirsich': 'Orange',
  'orange de': 'Orange',
  'silber': 'Gray',
  'gold de': 'Gold',
  'kupfer': 'Brown',
  'bronze de': 'Brown',
  'natur': 'Natural',
  'elfenbein': 'White',
  'beige de': 'Brown',
  'türkis': 'Blue',
  'tuerkis': 'Blue',
  'petrol': 'Blue',
  'terrakotta': 'Brown',
  'holz': 'Wood',
  'transparent de': 'Clear',
  'karamell': 'Brown',
  'ocker': 'Brown',
  'bordeaux de': 'Red',
  'magenta de': 'Purple',
  
  // Spanish color families
  'blanco': 'White',
  'negro': 'Black',
  'rojo': 'Red',
  'azul': 'Blue',
  'azul claro': 'Blue',
  'azul oscuro': 'Blue',
  'azul marino': 'Blue',
  'verde': 'Green',
  'amarillo': 'Yellow',
  'naranja': 'Orange',
  'morado': 'Purple',
  'purpura': 'Purple',
  'púrpura': 'Purple',
  'violeta es': 'Purple',
  'gris': 'Gray',
  'plata': 'Gray',
  'dorado': 'Gold',
  'marron': 'Brown',
  'marrón': 'Brown',
  'cafe': 'Brown',
  'café': 'Brown',
  'crema': 'White',
  'turquesa': 'Blue',
  'cobre': 'Brown',
  'bronce': 'Brown',
  'burdeos': 'Red',
  'granate': 'Red',
  
  // Italian color families
  'nero': 'Black',
  'bianco': 'White',
  'rosso': 'Red',
  'blu': 'Blue',
  'azzurro': 'Blue',
  'celeste': 'Blue',
  'giallo': 'Yellow',
  'arancione': 'Orange',
  'grigio': 'Gray',
  'marrone': 'Brown',
  'viola': 'Purple',
  'fucsia': 'Pink',
  'turchese': 'Blue',
  'corallo': 'Orange',
  'bordeaux': 'Red',
  'indaco': 'Purple',
  'lavanda': 'Purple',
  'lilla': 'Purple',
  'oliva': 'Green',
  'pesca': 'Orange',
  'salmone': 'Orange',
  'terracotta': 'Brown',
  'legno': 'Wood',
  'rame': 'Brown',
  'bronzo': 'Brown',
  'argento': 'Gray',
  'oro': 'Gold',
  'trasparente': 'Clear',
  'naturale': 'Natural',
  
  // Chinese color families
  '黑色': 'Black',
  '白色': 'White',
  '红色': 'Red',
  '蓝色': 'Blue',
  '绿色': 'Green',
  '黄色': 'Yellow',
  '橙色': 'Orange',
  '紫色': 'Purple',
  '粉色': 'Pink',
  '粉红色': 'Pink',
  '灰色': 'Gray',
  '银色': 'Gray',
  '金色': 'Gold',
  '棕色': 'Brown',
  '咖啡色': 'Brown',
  '褐色': 'Brown',
  '透明': 'Clear',
  '天蓝色': 'Blue',
  '深蓝色': 'Blue',
  '浅蓝色': 'Blue',
  '草绿色': 'Green',
  '深绿色': 'Green',
  '浅绿色': 'Green',
  '墨绿色': 'Green',
  '酒红色': 'Red',
  '玫红色': 'Pink',
  '橘色': 'Orange',
  '米色': 'Natural',
  '肤色': 'Natural',
  '青色': 'Blue',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the hex code for a color name (case-insensitive)
 * Returns null if color is not found
 */
export function getColorHex(colorName: string | null | undefined): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct lookup
  if (COLOR_HEX_MAP[normalized]) {
    return COLOR_HEX_MAP[normalized];
  }
  
  // Try removing common prefixes/suffixes
  const cleanedName = normalized
    .replace(/\s*(matte|silk|glossy|metallic|sparkle|galaxy)\s*/g, '')
    .trim();
  
  if (COLOR_HEX_MAP[cleanedName]) {
    return COLOR_HEX_MAP[cleanedName];
  }
  
  // Try partial matching (longest match first)
  const sortedColors = Object.keys(COLOR_HEX_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedColors) {
    if (normalized.includes(key)) {
      return COLOR_HEX_MAP[key];
    }
  }
  
  return null;
}

/**
 * Get the color family for a color name (case-insensitive)
 * Returns null if color family cannot be determined
 */
export function getColorFamily(colorName: string | null | undefined): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct lookup
  if (COLOR_FAMILY_MAP[normalized]) {
    return COLOR_FAMILY_MAP[normalized];
  }
  
  // Try partial matching (longest match first)
  const sortedColors = Object.keys(COLOR_FAMILY_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedColors) {
    if (normalized.includes(key)) {
      return COLOR_FAMILY_MAP[key];
    }
  }
  
  return null;
}

/**
 * Extract color name and hex from a product title
 * Looks for color patterns in the title and returns both the extracted name and hex
 */
export function extractColorFromTitle(title: string): { colorName: string | null; colorHex: string | null; colorFamily: string | null } {
  if (!title) {
    return { colorName: null, colorHex: null, colorFamily: null };
  }
  
  const titleLower = title.toLowerCase();
  
  // Pattern 1: "Product - Color" format (common for many brands)
  const dashMatch = title.match(/\s-\s([^-]+)$/);
  if (dashMatch) {
    const colorPart = dashMatch[1].trim().toLowerCase();
    // Clean out weight/size specs from color part
    const cleanColor = colorPart.replace(/\d+(?:\.\d+)?(?:kg|g|mm)/gi, '').trim();
    
    const hex = getColorHex(cleanColor);
    const family = getColorFamily(cleanColor);
    
    return { colorName: cleanColor, colorHex: hex, colorFamily: family };
  }
  
  // Pattern 2: Check for color words anywhere in title (longest first)
  const sortedColors = Object.keys(COLOR_HEX_MAP).sort((a, b) => b.length - a.length);
  for (const colorName of sortedColors) {
    if (titleLower.includes(colorName)) {
      return { 
        colorName, 
        colorHex: COLOR_HEX_MAP[colorName], 
        colorFamily: getColorFamily(colorName) 
      };
    }
  }
  
  return { colorName: null, colorHex: null, colorFamily: null };
}

/**
 * Normalize grey/gray variants for consistent matching
 */
export function normalizeColorName(colorName: string): string {
  return colorName.toLowerCase().trim().replace(/gray/gi, 'grey');
}

/**
 * Get color variants (aliases) for matching across regions
 * e.g., "grey" and "gray" are equivalent
 */
export function getColorVariants(colorName: string): string[] {
  const normalized = colorName.toLowerCase().trim();
  
  const aliases: Record<string, string[]> = {
    'grey': ['gray', 'grey'],
    'gray': ['gray', 'grey'],
    'light grey': ['light gray', 'light grey'],
    'light gray': ['light gray', 'light grey'],
    'dark grey': ['dark gray', 'dark grey'],
    'dark gray': ['dark gray', 'dark grey'],
    'space grey': ['space gray', 'space grey'],
    'space gray': ['space gray', 'space grey'],
    'cement grey': ['cement gray', 'cement grey'],
    'cement gray': ['cement gray', 'cement grey'],
    'matte grey': ['matte gray', 'matte grey'],
    'matte gray': ['matte gray', 'matte grey'],
    'stone grey': ['stone gray', 'stone grey'],
    'stone gray': ['stone gray', 'stone grey'],
  };
  
  return aliases[normalized] || [normalized];
}

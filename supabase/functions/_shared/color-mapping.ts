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
  'haze blue': '6699CC',
  'phantom blue': '4169E1',
  'crystal blue': '5DADE2',
  
  // ==================== MULTI-COLOR / GRADIENT VARIANTS ====================
  'blue green': '00CED1',
  'blue purple': '8A2BE2',
  'yellow green red': 'FFD700',
  'rainbow nebula glaze': 'FF6B6B',
  
  // ==================== AMOLEN MATTE DUAL COLORS ====================
  // Each dual-color combination needs a unique hex to prevent deduplication
  'green purple': '6B5B95',         // Muted purple-green blend
  'pink purple': 'DA70D6',          // Orchid (pink-purple blend)
  'blue pink': '9370DB',            // Medium purple (blue-pink blend)
  'brown white': 'A0826D',          // Taupe (brown-white blend)
  'cyan chartreuse': '7FFF00',      // Chartreuse
  'peach gold': 'FFDAB9',           // Peach puff
  'red gold': 'CD853F',             // Peru (red-gold blend)
  
  // ==================== AMOLEN SILK DUAL COLORS ====================
  'black gold': 'B8860B',           // Dark goldenrod
  'black & gold': 'B8860B',         // Dark goldenrod (alias)
  'black green': '355E3B',          // Hunter green
  'black & green': '355E3B',        // Hunter green (alias)
  'black orange': 'FF4500',         // Orange red
  'black & orange': 'FF4500',       // Orange red (alias)
  'black pink': 'DB7093',           // Pale violet red
  'black & pink': 'DB7093',         // Pale violet red (alias)
  'black purple': '4B0082',         // Indigo
  'black & purple': '4B0082',       // Indigo (alias)
  'black silver': '708090',         // Slate gray
  'black & silver': '708090',       // Slate gray (alias)
  'black blue': '1E3A5F',           // Dark navy
  'black & blue': '1E3A5F',         // Dark navy (alias)
  'black red': '8B0000',            // Dark red
  'black & red': '8B0000',          // Dark red (alias)
  'red black': '8B0000',            // Dark red (alias)
  'red & black': '8B0000',          // Dark red (alias)
  'blue fuchsia': 'DA1D81',         // Deep fuchsia
  'blue & fuchsia': 'DA1D81',       // Deep fuchsia (alias)
  'blue green coral': '5F9EA0',     // Cadet blue
  'blue green & coral': '5F9EA0',   // Cadet blue (alias)
  'blue green dark violet': '483D8B', // Dark slate blue
  'blue green & dark violet': '483D8B', // Dark slate blue (alias)
  'gold fuchsia': 'FF1493',         // Deep pink
  'gold & fuchsia': 'FF1493',       // Deep pink (alias)
  'gold purple': 'BA55D3',          // Medium orchid
  'gold & purple': 'BA55D3',        // Medium orchid (alias)
  'peach orange': 'FF8C69',         // Salmon
  'purple green': '9ACD32',         // Yellow green
  'purple & green': '9ACD32',       // Yellow green (alias)
  'red blue': '8B008B',             // Dark magenta
  'red & blue': '8B008B',           // Dark magenta (alias)
  'red & gold': 'FF6347',           // Tomato (alias)
  'red green': 'A0522D',            // Sienna (red-green blend)
  'red & green': 'A0522D',          // Sienna (alias)
  'sky blue pink': '87CEEB',        // Sky blue
  'sky blue & pink': 'B0C4DE',      // Light steel blue

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
  'peach fuzz': 'FFBE98',
  'carrot orange': 'ED9121',
  'cream yellow': 'FFFDD0',
  'cheese yellow': 'FFC000',
  'butter yellow': 'FFF5BA',
  'real gold': 'D4AF37',
  
  // ==================== GREEN VARIANTS (SPECIALTY) ====================
  'matcha green': '8DB600',
  'matcha': '8DB600',
  
  // ==================== GREY VARIANTS (SPECIALTY) ====================
  'koala grey': 'A5A5A5',
  'koala gray': 'A5A5A5',

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
  // Amolen Silk variants
  'silk coffee gold': '6F4E37',
  'silk mercury silver': 'C0C0C0',
  'silk baby blue': 'B0E0E6',
  'silk fluoro yellow': 'CCFF00',
  'silk cucumber green': '77DD77',
  'silk neon green': '39FF14',
  'silk sakura pink': 'FFB7C5',
  'silk ice blue': 'B0E0E6',
  'silk black blue': '2563EB',
  'silk bronze green': '16A34A',
  'silk red copper': 'B87333',
  'silk sapphire blue': '0F52BA',
  'silk gradient aged brass': 'D4AF37',
  
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
  
  // ==================== AMOLEN RAINBOW/GRADIENT COLORS ====================
  // Each rainbow variant needs a unique hex to prevent deduplication
  'candy rainbow': 'E91E63',           // Hot Pink
  'lemon mint rainbow': '7CB342',      // Lime Green  
  'multicolor rainbow': 'FF5722',      // Deep Orange
  'pastel berry rainbow': 'CE93D8',    // Lavender
  'rosy rainbow': 'F48FB1',            // Light Pink
  'sunset rainbow': 'FF9800',          // Orange
  'pastel rainbow': 'B2EBF2',          // Light Cyan
  'ocean rainbow': '0097A7',           // Dark Cyan
  'forest rainbow': '4CAF50',          // Green
  'galaxy rainbow': '673AB7',          // Deep Purple
  'neon rainbow': '00E676',            // Bright Green
  'earth rainbow': '8D6E63',           // Brown
  // Silk Rainbow variants
  'silk candy rainbow': 'EC407A',      // Pink
  'silk sunset rainbow': 'FFA726',     // Orange
  'silk pastel rainbow': 'B39DDB',     // Light Purple
  // Matte Rainbow variants
  'matte candy rainbow': 'D81B60',     // Dark Pink
  'matte sunset rainbow': 'E65100',    // Dark Orange
  'matte pastel rainbow': 'AB47BC',    // Medium Purple
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
  'purifier': 'FFFFFF',
  'foamy': 'FFFFFF',
  'balena': '87CEEB',
  'conductive': '1A1A1A',
  'esd': '1A1A1A',
  '82a': 'FFFFFF',
  '60a': 'FFFFFF',
  '70a': 'FFFFFF',
  '95a': 'FFFFFF',
  'filaflex black': '1A1A1A',
  'filaflex white': 'FFFFFF',
  'filaflex red': 'DC2626',
  'filaflex blue': '2563EB',
  'filaflex green': '16A34A',
  'filaflex yellow': 'EAB308',
  'filaflex orange': 'EA580C',
  'filaflex pink': 'EC4899',
  'filaflex grey': '808080',
  'filaflex gray': '808080',
  'filaflex natural': 'F5F5DC',
  'filaflex skin': 'FFCBA4',
  'filaflex transparent': 'FFFFFF',
  'recreus black': '1A1A1A',
  'recreus white': 'FFFFFF',
  'recreus red': 'DC2626',
  'recreus blue': '2563EB',
  'recreus green': '16A34A',
  'recreus yellow': 'EAB308',
  'recreus orange': 'EA580C',
  'recreus pink': 'EC4899',
  'recreus natural': 'F5F5DC',
  'recreus skin': 'FFCBA4',
  'fluor green': '39FF14',
  'fluor orange': 'FF5F1F',
  'fluor pink': 'FF6EC7',
  'fluor yellow': 'CCFF00',
  'fluor blue': '00BFFF',
  'fluor red': 'FF073A',
  'shore 82a': 'FFFFFF',
  'shore 60a': 'FFFFFF',
  'shore 70a': 'FFFFFF',
  'shore 95a': 'FFFFFF',

  // ==================== MATERIAL-BASED DEFAULTS ====================
  'carbon fiber': '1A1A1A',
  'carbon': '1A1A1A',
  'cf': '1A1A1A',
  'carbonfaser': '1A1A1A',
  'fibra de carbono': '1A1A1A',
  'fibra carbonio': '1A1A1A',
  'nat': 'F5F5DC',
  'gf': 'D4C4A8',
  'glass fiber': 'D4C4A8',
  'glass filled': 'D4C4A8',
  'wood': '8B4513',
  'wood fill': '8B4513',
  'wood pla': '8B4513',
  'pp cf': '1A1A1A',
  'polypropylene carbon': '1A1A1A',
  'peek': 'C19A6B',
  'pei': 'C19A6B',
  'ultem': 'C19A6B',
  'recycled': '808080',
  'recycled pla': '808080',
  'regrind': '808080',
  'marble': 'E0E0E0',
  'stone': '808080',
  'granite': '696969',
  'asa cf': '1A1A1A',
  'petg cf': '1A1A1A',
  'pa cf': '1A1A1A',
  'nylon cf': '1A1A1A',
  'abs cf': '1A1A1A',
  'pla cf': '1A1A1A',

  // ==================== PRINTED SOLID JESSIE & PRUSAMENT COLORS ====================
  'abyss': '000080',
  'aquamarine': '7FFFD4',
  'electric lemonade': 'FFFF00',
  'gold rush': 'FFD700',
  'misty green': '90EE90',
  'nightshade': '2F1B41',
  'royal ruby': 'E0115F',
  'elixir': '8B5CF6',
  'fire opal': 'FF4500',
  'obsidian': '1A1A1A',
  'pearl': 'EAE0C8',
  'onyx': '1A1A1A',
  'sapphire': '0F52BA',
  'emerald jessie': '50C878',
  'amethyst': '9966CC',
  'topaz': 'FFC87C',
  'garnet': '733635',
  'opal': 'A8C3BC',
  // Prusament colors
  'azure blue': '489FDF',
  'pristine white': 'FAFAFA',
  'galaxy black': '1A1A2E',
  'urban grey': '6B6B6B',
  'anthracite grey': '3A3A3A',
  'vanilla white': 'F3E5AB',
  'army green prusament': '4B5320',
  'recycled black': '2D2D2D',
  'recycled grey': '6B6B6B',
  'recycled orange': 'D95319',
  'lipstick red': 'E0115F',
  'royal purple': '7851A9',
  'gentleman grey': '5A5A5A',
  'mystic green': '3B5F3B',
  'rusty orange': 'B75F35',
  'oh my gold': 'CFB53B',
  'carmine red': 'C41E3A',
  'signal white': 'FAFAFA',
  'blend black': '1A1A1A',
  'blend grey': '6B6B6B',
  'prusa orange': 'FA6831',
  'prusa galaxy silver': 'A8A9AD',
  'viva la bronze': 'CD7F32',
  'bloody dragon red': '8B0000',
  'aubergine purple': '6B3054',
  'mystic brown': '6B4423',
  'royal blue prusament': '4169E1',
  'pineapple yellow': 'F9E076',
  'lime green prusament': '32CD32',
  'opal green': '7EC850',

  // ==================== ERYONE SPECIALTY COLORS ====================
  'burnt titanium': 'CD7F32',
  'galaxy sparkly': '2F1B41',
  'dual color': 'FF0000',
  'dual-color': 'FF0000',
  'tri color': 'FF0000',
  'tri-color': 'FF0000',
  'triple color': 'FF0000',
  'triple-color': 'FF0000',
  'quad color': 'FF0000',
  'quadruple color': 'FF0000',
  'marble eryone': 'E0E0E0',
  'sparkly': '9370DB',
  'sparkle': '9370DB',
  'glitter': '9370DB',
  'metal': 'C0C0C0',
  'high speed white': 'FAFAFA',
  'high speed black': '1A1A1A',
  'high speed grey': '808080',
  'high speed gray': '808080',
  'high speed red': 'DC2626',
  'high speed blue': '2563EB',
  'matte pla white': 'FAFAFA',
  'matte pla black': '1A1A1A',
  
  // ==================== JAYO COLORS ====================
  'jayo white': 'FAFAFA',
  'jayo black': '1A1A1A',
  'jayo grey': '808080',
  'gradient rainbow': 'FF0000',
  'rainbow gradient': 'FF0000',
  'silk rainbow': 'FF0000',
  'silk gradient': 'FFD700',
  'dual silk': 'FFD700',
  'tri silk': 'FFD700',
  'magic pla': '9370DB',

  // ==================== PUSH PLASTIC & NINJATEK COLORS ====================
  // Custom/Creative names (Push Plastic)
  'nuclear': '39FF14',
  'nuclear green': '39FF14',
  'alien goo': '32CD32',
  'black widow': '1A1A1A',
  'fire engine': 'CE2029',
  'hi-vis orange': 'FF6600',
  'hi vis orange': 'FF6600',
  'blaze orange': 'FF4500',
  'hunter orange': 'FF4500',
  'sunflower': 'FFDA03',
  'sunflower yellow': 'FFDA03',
  'canary': 'FFEF00',
  'canary yellow': 'FFEF00',
  'grape': '6F2DA8',
  'grape purple': '6F2DA8',
  'lavender push': 'E6E6FA',
  'seafoam': '71EEB8',
  'seafoam green': '71EEB8',
  'tiffany': '81D8D0',
  'tiffany blue': '81D8D0',
  'ocean spray': '006994',
  'carolina blue': '8AB4F8',
  'carolina': '8AB4F8',
  'royal': '4169E1',
  'prussian blue': '003153',
  'prussian': '003153',
  'brick': 'CB4154',
  'brick red': 'CB4154',
  'maroon push': '800000',
  'burgundy push': '800020',
  'wine push': '722F37',
  'rust': 'B7410E',
  'terracotta push': 'E2725B',
  'flesh tone': 'FFCBA4',
  'slate gray': '708090',
  'storm gray': '4F5D75',
  'gunmetal push': '2A3439',
  'charcoal push': '36454F',
  'snow white': 'FFFAFA',
  'polar': 'F0F8FF',
  'polar white': 'F0F8FF',
  'jet': '1A1A1A',
  'jet black': '1A1A1A',
  'chocolate push': '7B3F00',
  'coffee push': '6F4E37',
  'tan push': 'D2B48C',
  'khaki push': 'C3B091',
  'translucent amber': 'FFBF00',
  'translucent smoke': '696969',
  'translucent ice': 'E0FFFF',
  'ice clear': 'E0FFFF',
  'smoked': '696969',
  'premium': 'FFFFFF',
  'premium white': 'FFFFFF',
  'premium black': '1A1A1A',
  
  // NinjaTek TPU colors
  'lava orange': 'FF4500',
  'steel gray ninjatek': '71797E',
  'steel grey ninjatek': '71797E',
  'snow ninjatek': 'FFFAFA',
  'water ninjatek': 'F0FFFF',
  'water transparent': 'F0FFFF',
  'midnight black': '1A1A1A',
  'flamingo': 'FC8EAC',
  'flamingo pink': 'FC8EAC',
  'electric eel': '00CED1',

  // ==================== TREED ENGINEERING COLORS ====================
  'carbonio': '1A1A1A',
  'tech': '1A1A1A',
  'industrial': '1A1A1A',
  'ingegneria': 'D4C4A8',
  'engineering': 'D4C4A8',
  'ht': 'F5F5DC',
  'pro': 'F5F5DC',

  // ==================== ANYCUBIC COLORS ====================
  'basic': 'FFFFFF',
  'standard': 'FFFFFF',
  'high speed': 'FFFFFF',
  'ace': 'FFFFFF',
  'mega': 'FFFFFF',

  // ==================== ADDITIONAL SPANISH COLORS ====================
  'rosado': 'EC4899',
  'rosa es': 'FFC0CB',
  'verde claro': '90EE90',
  'verde oscuro': '006400',
  'gris claro': 'D3D3D3',
  'gris oscuro': '696969',
  'celeste es': '87CEEB',
  'fucsia es': 'FF00FF',
  'magenta es': 'FF00FF',
  'beige es': 'D4C4A8',
  'ceniza': 'B2BEB5',
  'plateado': 'C0C0C0',
  'natural es': 'F5F5DC',
  'transparente es': 'FFFFFF',
  'coral es': 'FF7F50',
  'oliva es': '808000',
  'vino': '722F37',
  'cereza': 'DE3163',
  'durazno': 'FFCBA4',
  'lavanda es': 'E6E6FA',
  'perla': 'EAE0C8',
  'hueso': 'E3DAC9',
  'arena': 'C2B280',
  'terracota es': 'E2725B',
  'arcilla': 'B66A50',
  'ocre': 'CC7722',
  'miel': 'EB9605',
  'caoba': 'C04000',
  'caramelo': 'FFD59A',

  // ==================== ADDITIONAL ITALIAN COLORS ====================
  'rosa it': 'FFC0CB',
  'verde chiaro': '90EE90',
  'verde scuro': '006400',
  'grigio chiaro': 'D3D3D3',
  'grigio scuro': '696969',
  'blu chiaro': 'ADD8E6',
  'blu scuro': '00008B',
  'blu marino': '000080',
  'rosso scuro': '8B0000',
  'rosso chiaro': 'FF6B6B',
  'avorio': 'FFFFF0',
  'sabbia': 'C2B280',
  'tortora': 'B4A89A',
  'carta da zucchero': '7CB9E8',
  'perla it': 'EAE0C8',
  'ambra': 'FFBF00',
  'miele': 'EB9605',
  'mogano': 'C04000',
  'cioccolato': 'D2691E',
  'caffe': '6F4E37',
  'caffè': '6F4E37',
  'panna': 'FFFDD0',
  'ghiaccio': 'E0FFFF',
  'petrolio': '006E6D',
  'ottanio': '006E6D',

  // ==================== ADDITIONAL CHINESE COLORS ====================
  '玫瑰色': 'FF007F',
  '珍珠色': 'EAE0C8',
  '象牙色': 'FFFFF0',
  '奶白色': 'FFFDD0',
  '乳白色': 'FFFEF0',
  '亮黑色': '2D2D2D',
  '哑光黑': '1A1A1A',
  '亮白色': 'FAFAFA',
  '雪白色': 'FFFAFA',
  '天空蓝': '87CEEB',
  '海军蓝': '000080',
  '宝蓝色': '4169E1',
  '湖蓝色': '4682B4',
  '孔雀蓝': '005F69',
  '薄荷绿': '98FF98',
  '翠绿色': '50C878',
  '军绿色': '4B5320',
  '橄榄绿': '6B8E23',
  '柠檬黄': 'FFF44F',
  '鲜橙色': 'FF8C00',
  '玫红': 'FF007F',
  '珊瑚色': 'FF7F50',
  '薰衣草': 'E6E6FA',
  '梅红色': 'E0115F',
  '砖红色': 'CB4154',
  '咖色': '6F4E37',
  '卡其色': 'C3B091',
  '驼色': 'C19A6B',
  '焦糖色': 'FFD59A',
  '琥珀色': 'FFBF00',
  '木色': '8B4513',

  // ==================== ADDITIONAL CHINESE COLORS (Anycubic/Creality variants) ====================
  '丝绸': 'E8E8E8',  // Silk
  '丝绸黑': '2D2D2D', // Silk Black
  '丝绸白': 'FFFEF0', // Silk White
  '丝绸金': 'FFD700', // Silk Gold
  '丝绸银': 'E8E8E8', // Silk Silver
  '丝绸红': 'DC143C', // Silk Red
  '丝绸蓝': '4169E1', // Silk Blue
  '丝绸绿': '32CD32', // Silk Green
  '丝绸紫': '9370DB', // Silk Purple
  '丝绸玫瑰金': 'B76E79', // Silk Rose Gold
  '哑光白': 'FAFAFA', // Matte White
  '哑光红': 'B91C1C', // Matte Red
  '哑光蓝': '1D4ED8', // Matte Blue
  '哑光绿': '15803D', // Matte Green
  '夜光绿': '39FF14', // Glow Green
  '夜光蓝': '00BFFF', // Glow Blue
  '荧光绿': '39FF14', // Fluorescent Green
  '荧光橙': 'FF5F1F', // Fluorescent Orange
  '荧光粉': 'FF6EC7', // Fluorescent Pink
  '荧光黄': 'CCFF00', // Fluorescent Yellow
  '碳纤维黑': '1A1A1A', // Carbon Fiber Black
  '木纹': '8B4513', // Wood Grain
  '大理石': 'E0E0E0', // Marble
  '星空蓝': '1A1A2E', // Starry Blue
  '星空紫': '2F1B41', // Starry Purple
  '渐变色': 'FF0000', // Gradient
  '彩虹色': 'FF0000', // Rainbow
  '多色': 'FF0000', // Multicolor
  '双色': 'FF0000', // Dual Color
  '三色': 'FF0000', // Tri Color
  '原色': 'F5F5DC', // Original/Natural
  '本色': 'F5F5DC', // Natural Color
  '无色': 'FFFFFF', // Colorless
  '浅灰色': 'D3D3D3', // Light Gray
  '深灰色': '696969', // Dark Gray
  '炭灰色': '36454F', // Charcoal Gray
  '太空灰': '4F4F4F', // Space Gray
  '水泥灰': '8D918D', // Cement Gray
  '消光灰': '808080', // Matte Gray
  '浅粉色': 'FFB6C1', // Light Pink
  '深粉色': 'FF1493', // Deep Pink
  '荧光色': '39FF14', // Fluorescent
  '纯黑': '000000', // Pure Black
  '纯白': 'FFFFFF', // Pure White
  '墨色': '1A1A1A', // Ink Black
  '烟灰色': '696969', // Smoke Gray
  '钢灰色': '4682B4', // Steel Gray
  '铁灰色': '48494B', // Iron Gray
  '深红色': '8B0000', // Dark Red
  '浅红色': 'FF6B6B', // Light Red
  '大红色': 'FF0000', // Bright Red
  '深蓝': '00008B', // Deep Blue
  '浅蓝': 'ADD8E6', // Light Blue
  '深绿': '006400', // Deep Green
  '浅绿': '90EE90', // Light Green
  '深紫': '4B0082', // Deep Purple
  '浅紫': 'DDA0DD', // Light Purple
  '淡黄色': 'FFFFE0', // Pale Yellow
  '亮黄色': 'FFFF00', // Bright Yellow
  '亮橙色': 'FF8C00', // Bright Orange
  '土黄色': 'D2B48C', // Earth Yellow

  // ==================== PORTUGUESE COLORS (Brazilian brands) ====================
  'preto': '1A1A1A',
  'branco': 'FFFFFF',
  'vermelho': 'DC2626',
  'azul pt': '2563EB',
  'azul claro pt': '87CEEB',
  'azul escuro': '00008B',
  'azul marinho': '000080',
  'verde pt': '16A34A',
  'verde claro pt': '90EE90',
  'verde escuro': '006400',
  'amarelo': 'EAB308',
  'laranja': 'EA580C',
  'rosa pt': 'EC4899',
  'roxo': '9333EA',
  'violeta pt': 'EE82EE',
  'cinza': '808080',
  'cinza claro': 'D3D3D3',
  'cinza escuro': '696969',
  'prata': 'C0C0C0',
  'dourado': 'FFD700',
  'castanho': '92400E',
  'bege': 'D4C4A8',
  'creme pt': 'FFFDD0',
  'marfim': 'FFFFF0',
  'cobre pt': 'B87333',
  'bronze pt': 'CD7F32',
  'turquesa pt': '40E0D0',
  'coral pt': 'FF7F50',
  'bordô': '800020',
  'vinho pt': '722F37',
  'limão': 'FFF44F',
  'caqui': 'C3B091',
  'salmão pt': 'FA8072',
  'pêssego': 'FFCBA4',
  'lavanda pt': 'E6E6FA',
  'caramelo pt': 'FFD59A',
  'terracota pt': 'E2725B',
  'madeira': '8B4513',
  'noz': '5D432C',
  'carvalho': 'B8860B',
  'transparente pt': 'FFFFFF',
  'natural pt': 'F5F5DC',

  // ==================== DUTCH COLORS (EU brands) ====================
  'zwart': '1A1A1A',
  'wit': 'FFFFFF',
  'rood': 'DC2626',
  'blauw': '2563EB',
  'lichtblauw': 'ADD8E6',
  'donkerblauw': '00008B',
  'groen': '16A34A',
  'lichtgroen': '90EE90',
  'donkergroen': '006400',
  'geel': 'EAB308',
  'oranje nl': 'EA580C',
  'roze': 'EC4899',
  'paars': '9333EA',
  'grijs': '808080',
  'lichtgrijs': 'D3D3D3',
  'donkergrijs': '696969',
  'zilver': 'C0C0C0',
  'goud': 'FFD700',
  'bruin': '92400E',
  'beige nl': 'D4C4A8',
  'creme': 'FFFDD0',
  'koper': 'B87333',
  'brons': 'CD7F32',
  'turkoois': '40E0D0',
  'koraal': 'FF7F50',
  'wijn': '722F37',
  'transparant': 'FFFFFF',
  'naturel': 'F5F5DC',

  // ==================== FRENCH COLORS (EU brands) ====================
  'noir': '1A1A1A',
  'blanc': 'FFFFFF',
  'rouge': 'DC2626',
  'rouge foncé': '8B0000',
  'bleu fr': '2563EB',
  'bleu clair': 'ADD8E6',
  'bleu foncé': '00008B',
  'bleu marine': '000080',
  'vert': '16A34A',
  'vert clair': '90EE90',
  'vert foncé': '006400',
  'jaune': 'EAB308',
  'orange fr': 'EA580C',
  'rose fr': 'EC4899',
  'violet fr': '9333EA',
  'gris fr': '808080',
  'gris clair': 'D3D3D3',
  'gris foncé': '696969',
  'argent': 'C0C0C0',
  'or': 'FFD700',
  'doré': 'FFD700',
  'marron fr': '92400E',
  'brun': '92400E',
  'beige fr': 'D4C4A8',
  'crème': 'FFFDD0',
  'ivoire': 'FFFFF0',
  'cuivre': 'B87333',
  'bronze fr': 'CD7F32',
  'turquoise fr': '40E0D0',
  'corail fr': 'FF7F50',
  'bordeaux fr': '800020',
  'bourgogne': '800020',
  'citron': 'FFF44F',
  'lavande': 'E6E6FA',
  'prune': 'DDA0DD',
  'saumon': 'FA8072',
  'pêche fr': 'FFCBA4',
  'caramel': 'FFD59A',
  'bois': '8B4513',
  'noyer': '5D432C',
  'chêne': 'B8860B',
  'transparent fr': 'FFFFFF',
  'naturel fr': 'F5F5DC',

  // ==================== POLISH COLORS (EU brands) ====================
  'czarny': '1A1A1A',
  'biały': 'FFFFFF',
  'czerwony': 'DC2626',
  'niebieski': '2563EB',
  'jasnoniebieski': 'ADD8E6',
  'ciemnoniebieski': '00008B',
  'zielony': '16A34A',
  'jasnozielony': '90EE90',
  'ciemnozielony': '006400',
  'żółty': 'EAB308',
  'pomarańczowy': 'EA580C',
  'różowy': 'EC4899',
  'fioletowy': '9333EA',
  'szary': '808080',
  'jasnoszary': 'D3D3D3',
  'ciemnoszary': '696969',
  'srebrny': 'C0C0C0',
  'złoty': 'FFD700',
  'brązowy': '92400E',
  'beżowy': 'D4C4A8',
  'kremowy': 'FFFDD0',
  'miedziany': 'B87333',
  'turkusowy': '40E0D0',
  'koralowy': 'FF7F50',
  'bordowy': '800020',
  'przezroczysty': 'FFFFFF',
  'naturalny': 'F5F5DC',
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
  'rosado': 'Pink',
  'rosa es': 'Pink',
  'verde claro': 'Green',
  'verde oscuro': 'Green',
  'gris claro': 'Gray',
  'gris oscuro': 'Gray',
  'celeste es': 'Blue',
  'fucsia es': 'Pink',
  'magenta es': 'Purple',
  'beige es': 'Brown',
  'ceniza': 'Gray',
  'plateado': 'Gray',
  'natural es': 'Natural',
  'transparente es': 'Clear',
  'coral es': 'Orange',
  'oliva es': 'Green',
  'vino': 'Red',
  'cereza': 'Red',
  'durazno': 'Orange',
  'lavanda es': 'Purple',
  'perla': 'White',
  'hueso': 'White',
  'arena': 'Brown',
  'terracota es': 'Brown',
  'arcilla': 'Brown',
  'ocre': 'Brown',
  'miel': 'Yellow',
  'caoba': 'Brown',
  'caramelo': 'Brown',
  
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
  'rosa it': 'Pink',
  'verde chiaro': 'Green',
  'verde scuro': 'Green',
  'grigio chiaro': 'Gray',
  'grigio scuro': 'Gray',
  'blu chiaro': 'Blue',
  'blu scuro': 'Blue',
  'blu marino': 'Blue',
  'rosso scuro': 'Red',
  'rosso chiaro': 'Red',
  'avorio': 'White',
  'sabbia': 'Brown',
  'tortora': 'Brown',
  'carta da zucchero': 'Blue',
  'perla it': 'White',
  'ambra': 'Yellow',
  'miele': 'Yellow',
  'mogano': 'Brown',
  'cioccolato': 'Brown',
  'caffe': 'Brown',
  'caffè': 'Brown',
  'panna': 'White',
  'ghiaccio': 'Clear',
  'petrolio': 'Blue',
  'ottanio': 'Blue',
  
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
  '玫瑰色': 'Pink',
  '珍珠色': 'White',
  '象牙色': 'White',
  '奶白色': 'White',
  '乳白色': 'White',
  '亮黑色': 'Black',
  '哑光黑': 'Black',
  '亮白色': 'White',
  '雪白色': 'White',
  '天空蓝': 'Blue',
  '海军蓝': 'Blue',
  '宝蓝色': 'Blue',
  '湖蓝色': 'Blue',
  '孔雀蓝': 'Blue',
  '薄荷绿': 'Green',
  '翠绿色': 'Green',
  '军绿色': 'Green',
  '橄榄绿': 'Green',
  '柠檬黄': 'Yellow',
  '鲜橙色': 'Orange',
  '玫红': 'Pink',
  '珊瑚色': 'Orange',
  '薰衣草': 'Purple',
  '梅红色': 'Red',
  '砖红色': 'Red',
  '咖色': 'Brown',
  '卡其色': 'Brown',
  '驼色': 'Brown',
  '焦糖色': 'Brown',
  '琥珀色': 'Yellow',
  '木色': 'Wood',
  
  // Portuguese color families
  'preto': 'Black',
  'branco': 'White',
  'vermelho': 'Red',
  'azul pt': 'Blue',
  'azul claro pt': 'Blue',
  'azul escuro': 'Blue',
  'azul marinho': 'Blue',
  'verde pt': 'Green',
  'verde claro pt': 'Green',
  'verde escuro': 'Green',
  'amarelo': 'Yellow',
  'laranja': 'Orange',
  'rosa pt': 'Pink',
  'roxo': 'Purple',
  'violeta pt': 'Purple',
  'cinza': 'Gray',
  'cinza claro': 'Gray',
  'cinza escuro': 'Gray',
  'prata': 'Gray',
  'dourado': 'Gold',
  'castanho': 'Brown',
  'bege': 'Brown',
  'creme pt': 'White',
  'marfim': 'White',
  'cobre pt': 'Brown',
  'bronze pt': 'Brown',
  'turquesa pt': 'Blue',
  'coral pt': 'Orange',
  'bordô': 'Red',
  'vinho pt': 'Red',
  'limão': 'Yellow',
  'caqui': 'Brown',
  'salmão pt': 'Orange',
  'pêssego': 'Orange',
  'lavanda pt': 'Purple',
  'caramelo pt': 'Brown',
  'terracota pt': 'Brown',
  'madeira': 'Wood',
  'noz': 'Wood',
  'carvalho': 'Wood',
  'transparente pt': 'Clear',
  'natural pt': 'Natural',
  
  // Dutch color families
  'zwart': 'Black',
  'wit': 'White',
  'rood': 'Red',
  'blauw': 'Blue',
  'lichtblauw': 'Blue',
  'donkerblauw': 'Blue',
  'groen': 'Green',
  'lichtgroen': 'Green',
  'donkergroen': 'Green',
  'geel': 'Yellow',
  'oranje nl': 'Orange',
  'roze': 'Pink',
  'paars': 'Purple',
  'grijs': 'Gray',
  'lichtgrijs': 'Gray',
  'donkergrijs': 'Gray',
  'zilver': 'Gray',
  'goud': 'Gold',
  'bruin': 'Brown',
  'beige nl': 'Brown',
  'creme': 'White',
  'koper': 'Brown',
  'brons': 'Brown',
  'turkoois': 'Blue',
  'koraal': 'Orange',
  'wijn': 'Red',
  'transparant': 'Clear',
  'naturel': 'Natural',
  
  // French color families
  'noir': 'Black',
  'blanc': 'White',
  'rouge': 'Red',
  'rouge foncé': 'Red',
  'bleu fr': 'Blue',
  'bleu clair': 'Blue',
  'bleu foncé': 'Blue',
  'bleu marine': 'Blue',
  'vert': 'Green',
  'vert clair': 'Green',
  'vert foncé': 'Green',
  'jaune': 'Yellow',
  'orange fr': 'Orange',
  'rose fr': 'Pink',
  'violet fr': 'Purple',
  'gris fr': 'Gray',
  'gris clair': 'Gray',
  'gris foncé': 'Gray',
  'argent': 'Gray',
  'or': 'Gold',
  'doré': 'Gold',
  'marron fr': 'Brown',
  'brun': 'Brown',
  'beige fr': 'Brown',
  'crème': 'White',
  'ivoire': 'White',
  'cuivre': 'Brown',
  'bronze fr': 'Brown',
  'turquoise fr': 'Blue',
  'corail fr': 'Orange',
  'bordeaux fr': 'Red',
  'bourgogne': 'Red',
  'citron': 'Yellow',
  'lavande': 'Purple',
  'prune': 'Purple',
  'saumon': 'Orange',
  'pêche fr': 'Orange',
  'caramel': 'Brown',
  'bois': 'Wood',
  'noyer': 'Wood',
  'chêne': 'Wood',
  'transparent fr': 'Clear',
  'naturel fr': 'Natural',
  
  // Polish color families
  'czarny': 'Black',
  'biały': 'White',
  'czerwony': 'Red',
  'niebieski': 'Blue',
  'jasnoniebieski': 'Blue',
  'ciemnoniebieski': 'Blue',
  'zielony': 'Green',
  'jasnozielony': 'Green',
  'ciemnozielony': 'Green',
  'żółty': 'Yellow',
  'pomarańczowy': 'Orange',
  'różowy': 'Pink',
  'fioletowy': 'Purple',
  'szary': 'Gray',
  'jasnoszary': 'Gray',
  'ciemnoszary': 'Gray',
  'srebrny': 'Gray',
  'złoty': 'Gold',
  'brązowy': 'Brown',
  'beżowy': 'Brown',
  'kremowy': 'White',
  'miedziany': 'Brown',
  'turkusowy': 'Blue',
  'koralowy': 'Orange',
  'bordowy': 'Red',
  'przezroczysty': 'Clear',
  'naturalny': 'Natural',
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

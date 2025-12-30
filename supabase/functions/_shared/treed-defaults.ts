/**
 * TreeD Filaments Brand-Specific Defaults
 * 
 * Italian engineering filament manufacturer with extensive polymer range.
 * Custom platform (not Shopify) - requires Firecrawl HTML scraping.
 * 
 * Key characteristics:
 * - Industrial/engineering focus: PEEK, PPS, PA-CF, PC-ABS, PP-GF
 * - Named product lines: Ecogenius, Shogun, Carbonio, Flexmark, etc.
 * - EUR pricing (Italy-based)
 * - Both 1.75mm and 2.85mm diameters
 * - TDS documents hosted at /assets/tds/{SKU}-tds.pdf
 */

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

interface MaterialPattern {
  pattern: RegExp;
  material: string;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  baseType?: string;
}

const TREED_MATERIAL_PATTERNS: MaterialPattern[] = [
  // PEEK Family (highest performance)
  { pattern: /peek\s*cf\s*15/i, material: 'PEEK-CF', isAbrasive: true, requiresEnclosure: true, baseType: 'PEEK' },
  { pattern: /peek\s*nat/i, material: 'PEEK', isAbrasive: false, requiresEnclosure: true, baseType: 'PEEK' },
  { pattern: /\bpeek\b/i, material: 'PEEK', isAbrasive: false, requiresEnclosure: true, baseType: 'PEEK' },
  
  // PPS Family
  { pattern: /pps\s*cf\s*15/i, material: 'PPS-CF', isAbrasive: true, requiresEnclosure: true, baseType: 'PPS' },
  { pattern: /pps\s*gf\s*25/i, material: 'PPS-GF', isAbrasive: true, requiresEnclosure: true, baseType: 'PPS' },
  { pattern: /\bpps\b/i, material: 'PPS', isAbrasive: false, requiresEnclosure: true, baseType: 'PPS' },
  
  // PA (Nylon) Family
  { pattern: /pa\s*hp\s*cf\s*15|carbonio\s*cf\s*15|carbonio\s*fast\s*forward/i, material: 'PA-CF', isAbrasive: true, requiresEnclosure: true, baseType: 'PA' },
  { pattern: /pa\s*cf\s*25|nylon\s*cf/i, material: 'PA-CF', isAbrasive: true, requiresEnclosure: true, baseType: 'PA' },
  { pattern: /pa\s*hp\s*gs\s*10/i, material: 'PA-GF', isAbrasive: true, requiresEnclosure: true, baseType: 'PA' },
  { pattern: /pa\s*hp\s*nat|structura|longchain|lubratech/i, material: 'PA', isAbrasive: false, requiresEnclosure: true, baseType: 'PA' },
  { pattern: /\bpa\b|\bnylon\b/i, material: 'PA', isAbrasive: false, requiresEnclosure: true, baseType: 'PA' },
  
  // PC Family
  { pattern: /pc\s*pbt\s*gf/i, material: 'PC-PBT-GF', isAbrasive: true, requiresEnclosure: true, baseType: 'PC' },
  { pattern: /pc\s*pbt\s*b-mat/i, material: 'PC-PBT', isAbrasive: false, requiresEnclosure: true, baseType: 'PC' },
  { pattern: /pc\s*abs\s*v0|pc\s*abs\s*tenax/i, material: 'PC-ABS', isAbrasive: false, requiresEnclosure: true, baseType: 'PC' },
  { pattern: /pc\s*verum|pc\s*p51/i, material: 'PC', isAbrasive: false, requiresEnclosure: true, baseType: 'PC' },
  { pattern: /\bpc\b|polycarbonate/i, material: 'PC', isAbrasive: false, requiresEnclosure: true, baseType: 'PC' },
  
  // PP Family
  { pattern: /pp\s*gf\s*30|p-lene\s*gf/i, material: 'PP-GF', isAbrasive: true, requiresEnclosure: false, baseType: 'PP' },
  { pattern: /pp\s*cf\s*18/i, material: 'PP-CF', isAbrasive: true, requiresEnclosure: false, baseType: 'PP' },
  { pattern: /pp\s*fortis\s*ll/i, material: 'PP-LL', isAbrasive: false, requiresEnclosure: false, baseType: 'PP' },
  { pattern: /p-lene|polypropylene|\bpp\b/i, material: 'PP', isAbrasive: false, requiresEnclosure: false, baseType: 'PP' },
  
  // ABS Family
  { pattern: /abs\s*cf/i, material: 'ABS-CF', isAbrasive: true, requiresEnclosure: true, baseType: 'ABS' },
  { pattern: /abs\s*esd/i, material: 'ABS-ESD', isAbrasive: false, requiresEnclosure: true, baseType: 'ABS' },
  { pattern: /abs\s*fast\s*forward/i, material: 'ABS-HS', isAbrasive: false, requiresEnclosure: true, baseType: 'ABS' },
  { pattern: /abs\s*food|abs\s*med/i, material: 'ABS', isAbrasive: false, requiresEnclosure: true, baseType: 'ABS' },
  { pattern: /abs\s*t-mat|abs\s*performance|abs\s*zx|abs\s*king/i, material: 'ABS', isAbrasive: false, requiresEnclosure: true, baseType: 'ABS' },
  { pattern: /\babs\b/i, material: 'ABS', isAbrasive: false, requiresEnclosure: true, baseType: 'ABS' },
  
  // ASA Family
  { pattern: /asa\s*uv729|monumental\s*evo|clay\s*evo/i, material: 'ASA', isAbrasive: false, requiresEnclosure: true, baseType: 'ASA' },
  { pattern: /\basa\b/i, material: 'ASA', isAbrasive: false, requiresEnclosure: true, baseType: 'ASA' },
  
  // PLA Family
  { pattern: /pla\s*fast\s*forward/i, material: 'PLA-HS', isAbrasive: false, requiresEnclosure: false, baseType: 'PLA' },
  { pattern: /pla\s*high\s*temperature|pla\s*ht/i, material: 'PLA-HT', isAbrasive: false, requiresEnclosure: false, baseType: 'PLA' },
  { pattern: /pla\s*kyotoflex/i, material: 'PLA-Flex', isAbrasive: false, requiresEnclosure: false, baseType: 'PLA' },
  { pattern: /pla\s*shineless/i, material: 'PLA-Matte', isAbrasive: false, requiresEnclosure: false, baseType: 'PLA' },
  { pattern: /pla\s*xray/i, material: 'PLA', isAbrasive: false, requiresEnclosure: false, baseType: 'PLA' },
  { pattern: /pla\s*ecogenius|pla\s*fusion|pla\s*gonzales|pla\s*levigo|pla\s*shogun/i, material: 'PLA', isAbrasive: false, requiresEnclosure: false, baseType: 'PLA' },
  { pattern: /\bpla\b/i, material: 'PLA', isAbrasive: false, requiresEnclosure: false, baseType: 'PLA' },
  
  // PETG Family
  { pattern: /petg\s*fast\s*forward|g-pet\s*fast\s*forward/i, material: 'PETG-HS', isAbrasive: false, requiresEnclosure: false, baseType: 'PETG' },
  { pattern: /g-pet|\bpetg\b/i, material: 'PETG', isAbrasive: false, requiresEnclosure: false, baseType: 'PETG' },
  
  // HIPS Family
  { pattern: /hips\s*stiron|monumental|sandy|clay|dark\s*stone|heritage\s*brick|caementum/i, material: 'HIPS', isAbrasive: false, requiresEnclosure: false, baseType: 'HIPS' },
  { pattern: /\bhips\b/i, material: 'HIPS', isAbrasive: false, requiresEnclosure: false, baseType: 'HIPS' },
  
  // TPU/TPE Family
  { pattern: /tpe-u\s*flexmark\s*(\d)/i, material: 'TPU', isAbrasive: false, requiresEnclosure: false, baseType: 'TPU' },
  { pattern: /flexmark/i, material: 'TPU', isAbrasive: false, requiresEnclosure: false, baseType: 'TPU' },
  { pattern: /tpe-e\s*ultraflex/i, material: 'TPE-E', isAbrasive: false, requiresEnclosure: false, baseType: 'TPE' },
  { pattern: /ultraflex/i, material: 'TPE-E', isAbrasive: false, requiresEnclosure: false, baseType: 'TPE' },
  { pattern: /tpe-a\s*flexability|flexability/i, material: 'TPA', isAbrasive: false, requiresEnclosure: false, baseType: 'TPA' },
  { pattern: /pneumatique/i, material: 'TPU-FOAM', isAbrasive: false, requiresEnclosure: false, baseType: 'TPU' },
  { pattern: /pure\s*ft/i, material: 'TPU', isAbrasive: false, requiresEnclosure: false, baseType: 'TPU' },
  { pattern: /elasto\s*a/i, material: 'TPA', isAbrasive: false, requiresEnclosure: false, baseType: 'TPA' },
  { pattern: /\btpu\b/i, material: 'TPU', isAbrasive: false, requiresEnclosure: false, baseType: 'TPU' },
  { pattern: /\btpe\b/i, material: 'TPE', isAbrasive: false, requiresEnclosure: false, baseType: 'TPE' },
  
  // Other specialized
  { pattern: /pmma\s*hirma|\bpmma\b/i, material: 'PMMA', isAbrasive: false, requiresEnclosure: false, baseType: 'PMMA' },
  { pattern: /pe\s*e-lene\s*hd|\bhdpe\b/i, material: 'HDPE', isAbrasive: false, requiresEnclosure: false, baseType: 'PE' },
  { pattern: /pet\s*cf\s*15/i, material: 'PET-CF', isAbrasive: true, requiresEnclosure: false, baseType: 'PET' },
];

export function normalizeTreeDMaterial(title: string): { material: string | null; isAbrasive: boolean; requiresEnclosure: boolean; baseType: string | null } {
  const combined = title.toLowerCase();
  
  for (const { pattern, material, isAbrasive, requiresEnclosure, baseType } of TREED_MATERIAL_PATTERNS) {
    if (pattern.test(combined)) {
      return { material, isAbrasive, requiresEnclosure, baseType: baseType || null };
    }
  }
  
  return { material: null, isAbrasive: false, requiresEnclosure: false, baseType: null };
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
}

const TREED_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // High-performance polymers
  'PEEK': { nozzleTempMin: 380, nozzleTempMax: 420, bedTempMin: 120, bedTempMax: 160 },
  'PEEK-CF': { nozzleTempMin: 380, nozzleTempMax: 420, bedTempMin: 120, bedTempMax: 160 },
  'PPS': { nozzleTempMin: 320, nozzleTempMax: 360, bedTempMin: 120, bedTempMax: 150 },
  'PPS-GF': { nozzleTempMin: 320, nozzleTempMax: 360, bedTempMin: 120, bedTempMax: 150 },
  'PPS-CF': { nozzleTempMin: 320, nozzleTempMax: 360, bedTempMin: 120, bedTempMax: 150 },
  
  // PA/Nylon
  'PA': { nozzleTempMin: 240, nozzleTempMax: 280, bedTempMin: 80, bedTempMax: 100 },
  'PA-CF': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 80, bedTempMax: 100 },
  'PA-GF': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 80, bedTempMax: 100 },
  
  // PC Family
  'PC': { nozzleTempMin: 260, nozzleTempMax: 300, bedTempMin: 100, bedTempMax: 120 },
  'PC-ABS': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 95, bedTempMax: 110 },
  'PC-PBT': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 100, bedTempMax: 115 },
  'PC-PBT-GF': { nozzleTempMin: 270, nozzleTempMax: 300, bedTempMin: 100, bedTempMax: 120 },
  
  // ABS Family
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 110 },
  'ABS-CF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 95, bedTempMax: 110 },
  'ABS-ESD': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 110 },
  'ABS-HS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 110 },
  
  // ASA
  'ASA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 95, bedTempMax: 110 },
  
  // PP Family
  'PP': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 100 },
  'PP-GF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 85, bedTempMax: 105 },
  'PP-CF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 85, bedTempMax: 105 },
  'PP-LL': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 75, bedTempMax: 95 },
  
  // PLA Family
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA-HS': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 65 },
  'PLA-HT': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 55, bedTempMax: 70 },
  'PLA-Flex': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 40, bedTempMax: 60 },
  'PLA-Matte': { nozzleTempMin: 190, nozzleTempMax: 215, bedTempMin: 50, bedTempMax: 60 },
  
  // PETG Family
  'PETG': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
  'PETG-HS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85 },
  
  // HIPS
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 95, bedTempMax: 110 },
  
  // TPU/TPE Family
  'TPU': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 30, bedTempMax: 60 },
  'TPU-FOAM': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 50 },
  'TPE': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 30, bedTempMax: 60 },
  'TPE-E': { nozzleTempMin: 200, nozzleTempMax: 235, bedTempMin: 30, bedTempMax: 60 },
  'TPA': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 65 },
  
  // Other
  'PMMA': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 100 },
  'HDPE': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 60, bedTempMax: 80 },
  'PET-CF': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 70, bedTempMax: 90 },
};

export function getTreeDPrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  return TREED_PRINT_SETTINGS[material] || null;
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

type FinishType = 'Standard' | 'Matte' | 'Translucent' | 'Metallic' | 'Carbon' | 'Glass' | 'Foam';

export function extractTreeDFinishType(title: string, material?: string | null): FinishType {
  const lower = title.toLowerCase();
  
  // Check for specific finishes in title
  if (/shineless|matte|matt\b/i.test(lower)) return 'Matte';
  if (/xray|translucent|transparent|clear/i.test(lower)) return 'Translucent';
  if (/metallic|metal\b/i.test(lower)) return 'Metallic';
  
  // Check for composite materials
  if (material) {
    if (/-cf/i.test(material)) return 'Carbon';
    if (/-gf/i.test(material)) return 'Glass';
  }
  
  // Check for foam
  if (/pneumatique|foam/i.test(lower)) return 'Foam';
  
  return 'Standard';
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanTreeDTitle(title: string): string {
  return title
    // Remove weight references
    .replace(/\s*[-–]\s*\d+(?:\.\d+)?\s*(?:kg|g|gr)\b/gi, '')
    .replace(/\s*\d+(?:\.\d+)?\s*(?:kg|g|gr)\b/gi, '')
    // Remove diameter references
    .replace(/\s*[-–]?\s*(?:1\.75|2\.85)\s*mm\b/gi, '')
    // Remove "3D Printer Filament" suffixes
    .replace(/\s*3d\s*(?:printer\s*)?filament\b/gi, '')
    // Remove TreeD prefix
    .replace(/^treed\s*/i, '')
    // Remove color suffixes for title cleaning (keep material/product name)
    .replace(/\s*[-–]\s*(?:nero|bianco|naturale|trasparente|black|white|natural|grey|gray)\s*$/i, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

interface ProductNameMapping {
  pattern: RegExp;
  productName: string;
  material: string;
}

const TREED_PRODUCT_NAMES: ProductNameMapping[] = [
  // PLA variants
  { pattern: /pla\s*ecogenius/i, productName: 'ecogenius', material: 'pla' },
  { pattern: /pla\s*fusion/i, productName: 'fusion', material: 'pla' },
  { pattern: /pla\s*gonzales/i, productName: 'gonzales', material: 'pla' },
  { pattern: /pla\s*levigo/i, productName: 'levigo', material: 'pla' },
  { pattern: /pla\s*shineless/i, productName: 'shineless', material: 'pla-matte' },
  { pattern: /pla\s*shogun/i, productName: 'shogun', material: 'pla' },
  { pattern: /pla\s*fast\s*forward/i, productName: 'fast-forward', material: 'pla-hs' },
  { pattern: /pla\s*xray/i, productName: 'xray', material: 'pla' },
  { pattern: /pla\s*kyotoflex/i, productName: 'kyotoflex', material: 'pla-flex' },
  { pattern: /pla\s*high\s*temperature/i, productName: 'high-temperature', material: 'pla-ht' },
  
  // ABS variants
  { pattern: /abs\s*t-mat/i, productName: 't-mat', material: 'abs' },
  { pattern: /abs\s*performance/i, productName: 'performance', material: 'abs' },
  { pattern: /abs\s*zx/i, productName: 'zx', material: 'abs' },
  { pattern: /abs\s*king/i, productName: 'king', material: 'abs' },
  { pattern: /abs\s*food/i, productName: 'food', material: 'abs' },
  { pattern: /abs\s*med/i, productName: 'med', material: 'abs' },
  { pattern: /abs\s*cf/i, productName: 'standard', material: 'abs-cf' },
  { pattern: /abs\s*esd/i, productName: 'standard', material: 'abs-esd' },
  { pattern: /abs\s*fast\s*forward/i, productName: 'fast-forward', material: 'abs-hs' },
  
  // PC variants
  { pattern: /pc\s*verum\s*t/i, productName: 'verum-t', material: 'pc' },
  { pattern: /pc\s*p51/i, productName: 'p51', material: 'pc' },
  { pattern: /pc\s*abs\s*v0/i, productName: 'v0', material: 'pc-abs' },
  { pattern: /pc\s*abs\s*tenax/i, productName: 'tenax', material: 'pc-abs' },
  { pattern: /pc\s*pbt\s*b-mat/i, productName: 'b-mat', material: 'pc-pbt' },
  { pattern: /pc\s*pbt\s*gf/i, productName: 'standard', material: 'pc-pbt-gf' },
  
  // PA variants
  { pattern: /pa\s*structura\s*ma/i, productName: 'structura-ma', material: 'pa' },
  { pattern: /pa\s*structura\s*kk/i, productName: 'structura-kk', material: 'pa' },
  { pattern: /pa\s*longchain/i, productName: 'longchain', material: 'pa' },
  { pattern: /pa\s*lubratech/i, productName: 'lubratech', material: 'pa' },
  { pattern: /pa\s*hp\s*nat/i, productName: 'hp-nat', material: 'pa' },
  { pattern: /pa\s*hp\s*cf\s*15/i, productName: 'hp-cf15', material: 'pa-cf' },
  { pattern: /pa\s*cf\s*25/i, productName: 'cf25', material: 'pa-cf' },
  { pattern: /pa\s*hp\s*gs\s*10/i, productName: 'hp-gs10', material: 'pa-gf' },
  { pattern: /carbonio\s*cf\s*15/i, productName: 'carbonio-cf15', material: 'pa-cf' },
  { pattern: /carbonio\s*fast\s*forward/i, productName: 'carbonio-ff', material: 'pa-cf' },
  
  // PP variants
  { pattern: /p-lene\s*4/i, productName: 'p-lene-4', material: 'pp' },
  { pattern: /p-lene\s*5/i, productName: 'p-lene-5', material: 'pp' },
  { pattern: /p-lene\s*t15/i, productName: 'p-lene-t15', material: 'pp' },
  { pattern: /pp\s*gf\s*30/i, productName: 'gf30', material: 'pp-gf' },
  { pattern: /pp\s*cf\s*18/i, productName: 'cf18', material: 'pp-cf' },
  { pattern: /pp\s*fortis\s*ll/i, productName: 'fortis-ll', material: 'pp-ll' },
  
  // TPU/TPE variants
  { pattern: /tpe-u\s*flexmark\s*7/i, productName: 'flexmark-7', material: 'tpu' },
  { pattern: /tpe-u\s*flexmark\s*8/i, productName: 'flexmark-8', material: 'tpu' },
  { pattern: /tpe-u\s*flexmark\s*9/i, productName: 'flexmark-9', material: 'tpu' },
  { pattern: /flexmark\s*7/i, productName: 'flexmark-7', material: 'tpu' },
  { pattern: /flexmark\s*8/i, productName: 'flexmark-8', material: 'tpu' },
  { pattern: /flexmark\s*9/i, productName: 'flexmark-9', material: 'tpu' },
  { pattern: /tpe-e\s*ultraflex\+/i, productName: 'ultraflex-plus', material: 'tpe-e' },
  { pattern: /tpe-e\s*ultraflex/i, productName: 'ultraflex', material: 'tpe-e' },
  { pattern: /ultraflex\+/i, productName: 'ultraflex-plus', material: 'tpe-e' },
  { pattern: /ultraflex/i, productName: 'ultraflex', material: 'tpe-e' },
  { pattern: /tpe-a\s*flexability\+/i, productName: 'flexability-plus', material: 'tpa' },
  { pattern: /tpe-a\s*flexability/i, productName: 'flexability', material: 'tpa' },
  { pattern: /flexability\+/i, productName: 'flexability-plus', material: 'tpa' },
  { pattern: /flexability/i, productName: 'flexability', material: 'tpa' },
  { pattern: /pneumatique/i, productName: 'pneumatique', material: 'tpu-foam' },
  { pattern: /pure\s*ft/i, productName: 'pure-ft', material: 'tpu' },
  { pattern: /elasto\s*a/i, productName: 'elasto-a', material: 'tpa' },
  
  // PETG variants
  { pattern: /g-pet\s*fast\s*forward/i, productName: 'fast-forward', material: 'petg-hs' },
  { pattern: /petg\s*fast\s*forward/i, productName: 'fast-forward', material: 'petg-hs' },
  { pattern: /g-pet/i, productName: 'standard', material: 'petg' },
  
  // HIPS variants
  { pattern: /hips\s*stiron/i, productName: 'stiron', material: 'hips' },
  { pattern: /hips\s*monumental/i, productName: 'monumental', material: 'hips' },
  { pattern: /hips\s*sandy/i, productName: 'sandy', material: 'hips' },
  { pattern: /hips\s*clay/i, productName: 'clay', material: 'hips' },
  { pattern: /hips\s*dark\s*stone/i, productName: 'dark-stone', material: 'hips' },
  { pattern: /hips\s*heritage\s*brick/i, productName: 'heritage-brick', material: 'hips' },
  { pattern: /hips\s*caementum/i, productName: 'caementum', material: 'hips' },
  
  // ASA variants
  { pattern: /asa\s*uv729/i, productName: 'uv729', material: 'asa' },
  { pattern: /monumental\s*evo/i, productName: 'monumental-evo', material: 'asa' },
  { pattern: /clay\s*evo/i, productName: 'clay-evo', material: 'asa' },
  
  // High-performance
  { pattern: /peek\s*nat/i, productName: 'nat', material: 'peek' },
  { pattern: /peek\s*cf\s*15/i, productName: 'cf15', material: 'peek-cf' },
  { pattern: /pps\s*gf\s*25/i, productName: 'gf25', material: 'pps-gf' },
  { pattern: /pps\s*cf\s*15/i, productName: 'cf15', material: 'pps-cf' },
  
  // Other
  { pattern: /pmma\s*hirma/i, productName: 'hirma', material: 'pmma' },
  { pattern: /pe\s*e-lene\s*hd/i, productName: 'e-lene-hd', material: 'hdpe' },
  { pattern: /pet\s*cf\s*15/i, productName: 'cf15', material: 'pet-cf' },
];

export function generateTreeDProductLineId(title: string, normalizedMaterial?: string | null): string {
  const lower = title.toLowerCase();
  
  // Try to match specific product names
  for (const { pattern, productName, material } of TREED_PRODUCT_NAMES) {
    if (pattern.test(lower)) {
      return `treed__${material}__${productName}`;
    }
  }
  
  // Fallback: use normalized material
  if (normalizedMaterial) {
    const materialSlug = normalizedMaterial.toLowerCase().replace(/\s+/g, '-');
    return `treed__${materialSlug}__standard`;
  }
  
  return 'treed__unknown__standard';
}

// ============================================================================
// ITALIAN COLOR TRANSLATION
// ============================================================================

const ITALIAN_TO_ENGLISH: Record<string, string> = {
  'nero': 'black',
  'bianco': 'white',
  'naturale': 'natural',
  'trasparente': 'transparent',
  'grigio': 'grey',
  'rosso': 'red',
  'blu': 'blue',
  'verde': 'green',
  'giallo': 'yellow',
  'arancione': 'orange',
  'viola': 'purple',
  'marrone': 'brown',
  'rosa': 'pink',
  'azzurro': 'light blue',
  'oro': 'gold',
  'argento': 'silver',
  'beige': 'beige',
};

export function translateItalianColor(colorName: string): string {
  const lower = colorName.toLowerCase().trim();
  return ITALIAN_TO_ENGLISH[lower] || colorName;
}

// ============================================================================
// COLOR MAPPING
// ============================================================================

const TREED_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '#1A1A1A',
  'nero': '#1A1A1A',
  'white': '#FFFFFF',
  'bianco': '#FFFFFF',
  'natural': '#F5E6D3',
  'naturale': '#F5E6D3',
  'transparent': '#E8E8E8',
  'trasparente': '#E8E8E8',
  'grey': '#808080',
  'gray': '#808080',
  'grigio': '#808080',
  'red': '#DC2626',
  'rosso': '#DC2626',
  'blue': '#2563EB',
  'blu': '#2563EB',
  'green': '#16A34A',
  'verde': '#16A34A',
  'yellow': '#EAB308',
  'giallo': '#EAB308',
  'orange': '#EA580C',
  'arancione': '#EA580C',
  'purple': '#9333EA',
  'viola': '#9333EA',
  'brown': '#78350F',
  'marrone': '#78350F',
  'pink': '#EC4899',
  'rosa': '#EC4899',
  'light blue': '#38BDF8',
  'azzurro': '#38BDF8',
  'gold': '#D4AF37',
  'oro': '#D4AF37',
  'silver': '#C0C0C0',
  'argento': '#C0C0C0',
  'beige': '#F5DEB3',
  
  // HIPS decorative colors
  'sandy': '#C2B280',
  'clay': '#B66A50',
  'dark stone': '#4A4A4A',
  'heritage brick': '#8B4513',
  'caementum': '#9E9E9E',
};

export function getTreeDColorHex(colorName: string): string | null {
  const normalizedColor = colorName.toLowerCase().trim();
  
  // Direct match
  if (TREED_COLOR_MAPPING[normalizedColor]) {
    return TREED_COLOR_MAPPING[normalizedColor];
  }
  
  // Try translating Italian
  const englishColor = translateItalianColor(normalizedColor);
  if (TREED_COLOR_MAPPING[englishColor]) {
    return TREED_COLOR_MAPPING[englishColor];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(TREED_COLOR_MAPPING)) {
    if (normalizedColor.includes(key) || key.includes(normalizedColor)) {
      return hex;
    }
  }
  
  return null;
}

// ============================================================================
// TDS URL CONSTRUCTION
// ============================================================================

const TREED_TDS_BASE = 'https://treedfilaments.com/assets/tds';
const TREED_TDS_ALT = 'https://dlh2hyjriy9yy.cloudfront.net/tds';

export function constructTreeDTdsUrl(sku: string): string[] {
  const skuClean = sku.trim().toUpperCase();
  return [
    `${TREED_TDS_BASE}/${skuClean}-tds.pdf`,
    `${TREED_TDS_BASE}/${skuClean}.pdf`,
    `${TREED_TDS_ALT}/${skuClean}.pdf`,
    `${TREED_TDS_ALT}/${skuClean}-tds.pdf`,
  ];
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface TreeDEnrichmentResult {
  material: string | null;
  baseType: string | null;
  isAbrasive: boolean;
  requiresEnclosure: boolean;
  finishType: FinishType;
  productLineId: string;
  cleanedTitle: string;
  printSettings: PrintSettings | null;
  colorHex: string | null;
}

export function enrichTreeDProduct(
  title: string,
  colorName?: string,
  existingMaterial?: string | null
): TreeDEnrichmentResult {
  // Normalize material
  const { material, isAbrasive, requiresEnclosure, baseType } = normalizeTreeDMaterial(title);
  const finalMaterial = material || existingMaterial || null;
  
  // Get print settings
  const printSettings = getTreeDPrintSettings(finalMaterial);
  
  // Detect finish type
  const finishType = extractTreeDFinishType(title, finalMaterial);
  
  // Clean title
  const cleanedTitle = cleanTreeDTitle(title);
  
  // Generate product line ID
  const productLineId = generateTreeDProductLineId(title, finalMaterial);
  
  // Get color hex
  const colorHex = colorName ? getTreeDColorHex(colorName) : null;
  
  return {
    material: finalMaterial,
    baseType,
    isAbrasive,
    requiresEnclosure,
    finishType,
    productLineId,
    cleanedTitle,
    printSettings,
    colorHex,
  };
}

// ============================================================================
// PRODUCT FILTERING
// ============================================================================

export function isTreeDFilament(product: { title: string; category?: string; sku?: string }): boolean {
  const title = product.title.toLowerCase();
  const category = (product.category || '').toLowerCase();
  
  // Exclude non-filament products
  if (/printer|dryer|spool\s*holder|accessory|nozzle|tool|cleaning/i.test(title)) {
    return false;
  }
  
  // Must be filament or have filament-related category
  if (category.includes('filament')) {
    return true;
  }
  
  // Check for polymer keywords
  const polymerKeywords = [
    'pla', 'abs', 'petg', 'g-pet', 'pa', 'nylon', 'pc', 'pp', 'tpu', 'tpe',
    'hips', 'asa', 'peek', 'pps', 'pmma', 'hdpe', 'pet'
  ];
  
  return polymerKeywords.some(keyword => title.includes(keyword));
}

// ============================================================================
// WEIGHT EXTRACTION
// ============================================================================

export function extractTreeDWeight(variant: string): number | null {
  const match = variant.match(/(\d+(?:\.\d+)?)\s*(?:kg|g)/i);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = variant.toLowerCase().includes('kg') ? 'kg' : 'g';
    return unit === 'kg' ? value * 1000 : value;
  }
  return null;
}

// ============================================================================
// DIAMETER EXTRACTION
// ============================================================================

export function extractTreeDDiameter(variant: string): number | null {
  if (/2\.85\s*mm/i.test(variant)) return 2.85;
  if (/1\.75\s*mm/i.test(variant)) return 1.75;
  return null;
}

/**
 * COLORFABB BRAND-SPECIFIC DEFAULTS
 * 
 * ColorFabb is a premium Dutch filament manufacturer known for innovative materials:
 * - LW-PLA (lightweight foaming PLA)
 * - nGen (Eastman Amphora co-polyester)
 * - varioShore TPU (variable density)
 * - Specialty fills (bronzeFill, woodFill, stoneFill)
 * 
 * Store: colorfabb.com (Magento platform)
 * Currency: EUR (primary), requires conversion
 * Regions: EU-based, ships worldwide
 */

// =============================================================================
// MATERIAL NORMALIZATION
// =============================================================================

export interface MaterialInfo {
  normalized: string;
  baseType: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  isFoaming: boolean;
  isFlexible: boolean;
  highSpeedCapable: boolean;
}

const MATERIAL_PATTERNS: Array<{ pattern: RegExp; info: MaterialInfo }> = [
  // Lightweight/Foaming materials (order matters - check specific before generic)
  { pattern: /\blw[- ]?pla[- ]?ht\b/i, info: { normalized: 'LW-PLA-HT', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: true, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\blw[- ]?pla\b/i, info: { normalized: 'LW-PLA', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: true, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\blw[- ]?asa\b/i, info: { normalized: 'LW-ASA', baseType: 'ASA', isAbrasive: false, enclosureRequired: true, isFoaming: true, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bvarioshore\b/i, info: { normalized: 'varioShore TPU', baseType: 'TPU', isAbrasive: false, enclosureRequired: false, isFoaming: true, isFlexible: true, highSpeedCapable: false } },
  
  // Carbon Fiber composites (abrasive)
  { pattern: /\bngen[- ]?cf\s*10\b/i, info: { normalized: 'nGen-CF10', baseType: 'PETG', isAbrasive: true, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bxt[- ]?cf\s*20\b/i, info: { normalized: 'XT-CF20', baseType: 'PETG', isAbrasive: true, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bpa[- ]?cf\b/i, info: { normalized: 'PA-CF', baseType: 'PA', isAbrasive: true, enclosureRequired: true, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  
  // Metal fills (abrasive)
  { pattern: /\bbronzefill\b/i, info: { normalized: 'bronzeFill', baseType: 'PLA', isAbrasive: true, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bcopperfill\b/i, info: { normalized: 'copperFill', baseType: 'PLA', isAbrasive: true, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bsteelfill\b/i, info: { normalized: 'steelFill', baseType: 'PLA', isAbrasive: true, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bbrassfill\b/i, info: { normalized: 'brassFill', baseType: 'PLA', isAbrasive: true, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  
  // Natural fills (mildly abrasive)
  { pattern: /\bwoodfill\b/i, info: { normalized: 'woodFill', baseType: 'PLA', isAbrasive: true, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bcorkfill\b/i, info: { normalized: 'corkFill', baseType: 'PLA', isAbrasive: true, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bbamboofill\b/i, info: { normalized: 'bambooFill', baseType: 'PLA', isAbrasive: true, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bstonefill\b/i, info: { normalized: 'stoneFill', baseType: 'PLA', isAbrasive: true, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  
  // Glow fill
  { pattern: /\bglowfill\b/i, info: { normalized: 'glowFill', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  
  // Co-polyesters (Eastman Amphora based)
  { pattern: /\bngen[- ]?flex\b/i, info: { normalized: 'nGen-Flex', baseType: 'PETG', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: true, highSpeedCapable: false } },
  { pattern: /\bngen\b/i, info: { normalized: 'nGen', baseType: 'PETG', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bxt\b(?![- ]?cf)/i, info: { normalized: 'XT', baseType: 'PETG', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bht\b(?![- ]?pla)/i, info: { normalized: 'HT', baseType: 'PETG', isAbrasive: false, enclosureRequired: true, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  
  // PLA variants
  { pattern: /\bpla[- ]?hp\b/i, info: { normalized: 'PLA-HP', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: true } },
  { pattern: /\bhigh\s*speed\s*pro\b/i, info: { normalized: 'PLA High Speed Pro', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: true } },
  { pattern: /\bpla[\/]?pha\b/i, info: { normalized: 'PLA/PHA', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\brpla\b/i, info: { normalized: 'rPLA', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bvibers\b/i, info: { normalized: 'Vibers PLA', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bregrind\b/i, info: { normalized: 'PLA Regrind', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\beconomy\s*pla\b|\bpla\s*economy\b/i, info: { normalized: 'PLA Economy', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bsemi[- ]?matte\s*pla\b|\bpla\s*semi[- ]?matte\b/i, info: { normalized: 'PLA Semi-Matte', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  
  // PHA
  { pattern: /\ballpha\b/i, info: { normalized: 'allPHA', baseType: 'PHA', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  
  // TPU variants
  { pattern: /\btpu\s*85\s*a\b/i, info: { normalized: 'TPU 85A', baseType: 'TPU', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: true, highSpeedCapable: false } },
  { pattern: /\btpu\s*95\s*a\b/i, info: { normalized: 'TPU 95A', baseType: 'TPU', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: true, highSpeedCapable: false } },
  { pattern: /\btpu\b/i, info: { normalized: 'TPU', baseType: 'TPU', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: true, highSpeedCapable: false } },
  
  // PA (Nylon)
  { pattern: /\bpa\s*neat\b/i, info: { normalized: 'PA Neat', baseType: 'PA', isAbrasive: false, enclosureRequired: true, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bpa\b(?![- ]?cf)/i, info: { normalized: 'PA', baseType: 'PA', isAbrasive: false, enclosureRequired: true, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  
  // ASA
  { pattern: /\basa\b(?![- ]?lw)/i, info: { normalized: 'ASA', baseType: 'ASA', isAbrasive: false, enclosureRequired: true, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  
  // PETG variants
  { pattern: /\bpetg\s*economy\b|\beconomy\s*petg\b/i, info: { normalized: 'PETG Economy', baseType: 'PETG', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bpetg\s*semi[- ]?matte\b/i, info: { normalized: 'PETG Semi-Matte', baseType: 'PETG', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  { pattern: /\bpetg\b/i, info: { normalized: 'PETG', baseType: 'PETG', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
  
  // Generic PLA (fallback)
  { pattern: /\bpla\b/i, info: { normalized: 'PLA', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
];

export function normalizeColorFabbMaterial(title: string): MaterialInfo {
  const normalized = title.trim();
  
  for (const { pattern, info } of MATERIAL_PATTERNS) {
    if (pattern.test(normalized)) {
      return info;
    }
  }
  
  // Default fallback
  return {
    normalized: 'PLA',
    baseType: 'PLA',
    isAbrasive: false,
    enclosureRequired: false,
    isFoaming: false,
    isFlexible: false,
    highSpeedCapable: false,
  };
}

// =============================================================================
// FINISH TYPE EXTRACTION
// =============================================================================

export type FinishType = 
  | 'Standard' 
  | 'Matte' 
  | 'Semi-Matte'
  | 'Glow' 
  | 'Metal' 
  | 'Wood' 
  | 'Stone' 
  | 'Translucent'
  | 'Silk'
  | 'Sparkle';

export function extractColorFabbFinishType(title: string, material?: string): FinishType {
  const t = (title + ' ' + (material || '')).toLowerCase();
  
  // Metal fills
  if (/bronze\s*fill|copper\s*fill|steel\s*fill|brass\s*fill/i.test(t)) return 'Metal';
  
  // Wood/natural fills
  if (/wood\s*fill|cork\s*fill|bamboo\s*fill/i.test(t)) return 'Wood';
  
  // Stone fill
  if (/stone\s*fill/i.test(t)) return 'Stone';
  
  // Glow
  if (/glow\s*fill|glow/i.test(t)) return 'Glow';
  
  // Semi-Matte (before Matte check)
  if (/semi[- ]?matte/i.test(t)) return 'Semi-Matte';
  
  // Matte
  if (/\bmatte\b/i.test(t)) return 'Matte';
  
  // Translucent
  if (/translucent|transparent|clear/i.test(t)) return 'Translucent';
  
  // Silk
  if (/\bsilk\b/i.test(t)) return 'Silk';
  
  // Sparkle/glitter
  if (/sparkle|glitter|vertigo/i.test(t)) return 'Sparkle';
  
  return 'Standard';
}

// =============================================================================
// PRODUCT LINE ID GENERATION
// =============================================================================

export function generateColorFabbProductLineId(title: string, material: string): string {
  const mat = material.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const t = title.toLowerCase();
  
  // Specialty fills get their own product lines
  if (/bronzefill/i.test(t)) return `colorfabb__pla-metal__bronzefill`;
  if (/copperfill/i.test(t)) return `colorfabb__pla-metal__copperfill`;
  if (/steelfill/i.test(t)) return `colorfabb__pla-metal__steelfill`;
  if (/brassfill/i.test(t)) return `colorfabb__pla-metal__brassfill`;
  if (/woodfill/i.test(t)) return `colorfabb__pla-wood__woodfill`;
  if (/corkfill/i.test(t)) return `colorfabb__pla-wood__corkfill`;
  if (/bamboofill/i.test(t)) return `colorfabb__pla-wood__bamboofill`;
  if (/stonefill/i.test(t)) return `colorfabb__pla-stone__stonefill`;
  if (/glowfill/i.test(t)) return `colorfabb__pla-glow__glowfill`;
  
  // Lightweight/foaming
  if (/lw[- ]?pla[- ]?ht/i.test(t)) return `colorfabb__lw-pla-ht__foaming`;
  if (/lw[- ]?pla/i.test(t)) return `colorfabb__lw-pla__foaming`;
  if (/lw[- ]?asa/i.test(t)) return `colorfabb__lw-asa__foaming`;
  if (/varioshore/i.test(t)) return `colorfabb__varioshore-tpu__foaming`;
  
  // Carbon fiber composites
  if (/ngen[- ]?cf/i.test(t)) return `colorfabb__ngen-cf10__composite`;
  if (/xt[- ]?cf/i.test(t)) return `colorfabb__xt-cf20__composite`;
  if (/pa[- ]?cf/i.test(t)) return `colorfabb__pa-cf__composite`;
  
  // Co-polyesters
  if (/ngen[- ]?flex/i.test(t)) return `colorfabb__ngen-flex__flexible`;
  if (/ngen/i.test(t)) return `colorfabb__ngen__standard`;
  if (/\bxt\b/i.test(t) && !/cf/i.test(t)) return `colorfabb__xt__standard`;
  if (/\bht\b/i.test(t) && !/pla/i.test(t)) return `colorfabb__ht__high-temp`;
  
  // PLA variants
  if (/high\s*speed\s*pro|pla[- ]?hp/i.test(t)) return `colorfabb__pla-hp__high-speed`;
  if (/pla[\/]?pha/i.test(t)) return `colorfabb__pla-pha__standard`;
  if (/rpla/i.test(t)) return `colorfabb__rpla__recycled`;
  if (/vibers/i.test(t)) return `colorfabb__vibers-pla__standard`;
  if (/regrind/i.test(t)) return `colorfabb__pla-regrind__recycled`;
  if (/economy\s*pla|pla\s*economy/i.test(t)) return `colorfabb__pla-economy__standard`;
  if (/semi[- ]?matte\s*pla|pla\s*semi[- ]?matte/i.test(t)) return `colorfabb__pla-semi-matte__matte`;
  
  // PHA
  if (/allpha/i.test(t)) return `colorfabb__allpha__biodegradable`;
  
  // TPU
  if (/tpu\s*85/i.test(t)) return `colorfabb__tpu-85a__flexible`;
  if (/tpu\s*95/i.test(t)) return `colorfabb__tpu-95a__flexible`;
  if (/tpu/i.test(t)) return `colorfabb__tpu__flexible`;
  
  // PA (Nylon)
  if (/pa\s*neat/i.test(t)) return `colorfabb__pa-neat__engineering`;
  if (/pa/i.test(t) && !/cf/i.test(t)) return `colorfabb__pa__engineering`;
  
  // ASA
  if (/asa/i.test(t) && !/lw/i.test(t)) return `colorfabb__asa__standard`;
  
  // PETG variants
  if (/petg\s*economy|economy\s*petg/i.test(t)) return `colorfabb__petg-economy__standard`;
  if (/petg\s*semi[- ]?matte/i.test(t)) return `colorfabb__petg-semi-matte__matte`;
  if (/petg/i.test(t)) return `colorfabb__petg__standard`;
  
  // Default based on material
  return `colorfabb__${mat}__standard`;
}

// =============================================================================
// TDS URL MAPPING
// =============================================================================

const TDS_URL_BASE = 'https://colorfabb.com/media/datasheets/tds/colorfabb';

export const COLORFABB_TDS_PATTERNS: Record<string, string> = {
  // PLA variants
  'PLA/PHA': `${TDS_URL_BASE}/TDS_E_ColorFabb_PLA_PHA.pdf`,
  'PLA Economy': `${TDS_URL_BASE}/TDS_E_ColorFabb_PLA_Economy.pdf`,
  'PLA Semi-Matte': `${TDS_URL_BASE}/TDS_E_ColorFabb_PLA_Semi-Matte.pdf`,
  'PLA High Speed Pro': `${TDS_URL_BASE}/TDS_E_ColorFabb_PLA_High_Speed_Pro.pdf`,
  'PLA-HP': `${TDS_URL_BASE}/TDS_E_ColorFabb_PLA_High_Speed_Pro.pdf`,
  'rPLA': `${TDS_URL_BASE}/TDS_E_ColorFabb_rPLA.pdf`,
  'Vibers PLA': `${TDS_URL_BASE}/TDS_E_ColorFabb_Vibers_PLA.pdf`,
  
  // Lightweight/Foaming
  'LW-PLA': `${TDS_URL_BASE}/TDS_E_ColorFabb_LW-PLA.pdf`,
  'LW-PLA-HT': `${TDS_URL_BASE}/TDS_E_ColorFabb_LW-PLA_HT.pdf`,
  'LW-ASA': `${TDS_URL_BASE}/TDS_E_ColorFabb_LW-ASA.pdf`,
  'varioShore TPU': `${TDS_URL_BASE}/TDS_E_ColorFabb_varioShore_TPU.pdf`,
  
  // Specialty fills
  'bronzeFill': `${TDS_URL_BASE}/TDS_E_ColorFabb_bronzeFill.pdf`,
  'copperFill': `${TDS_URL_BASE}/TDS_E_ColorFabb_copperFill.pdf`,
  'steelFill': `${TDS_URL_BASE}/TDS_E_ColorFabb_steelFill.pdf`,
  'brassFill': `${TDS_URL_BASE}/TDS_E_ColorFabb_brassFill.pdf`,
  'woodFill': `${TDS_URL_BASE}/TDS_E_ColorFabb_woodFill.pdf`,
  'corkFill': `${TDS_URL_BASE}/TDS_E_ColorFabb_corkFill.pdf`,
  'bambooFill': `${TDS_URL_BASE}/TDS_E_ColorFabb_bambooFill.pdf`,
  'glowFill': `${TDS_URL_BASE}/TDS_E_ColorFabb_glowFill.pdf`,
  
  // Co-polyesters
  'nGen': `${TDS_URL_BASE}/TDS_E_ColorFabb_nGen.pdf`,
  'nGen-CF10': `${TDS_URL_BASE}/TDS_E_ColorFabb_nGen_CF10.pdf`,
  'nGen-Flex': `${TDS_URL_BASE}/TDS_E_ColorFabb_nGen_Flex.pdf`,
  'XT': `${TDS_URL_BASE}/TDS_E_ColorFabb_XT.pdf`,
  'XT-CF20': `${TDS_URL_BASE}/TDS_E_ColorFabb_XT-CF20.pdf`,
  'HT': `${TDS_URL_BASE}/TDS_E_ColorFabb_HT.pdf`,
  
  // PETG
  'PETG Economy': `${TDS_URL_BASE}/TDS_E_ColorFabb_PETG_Economy.pdf`,
  'PETG Semi-Matte': `${TDS_URL_BASE}/TDS_E_ColorFabb_PETG_Semi-Matte.pdf`,
  
  // Engineering
  'ASA': `${TDS_URL_BASE}/TDS_E_ColorFabb_ASA.pdf`,
  'PA Neat': `${TDS_URL_BASE}/TDS_E_ColorFabb_PA_Neat.pdf`,
  'PA-CF': `${TDS_URL_BASE}/TDS_E_ColorFabb_PA-CF_Low_Warp.pdf`,
  
  // TPU
  'TPU 85A': `${TDS_URL_BASE}/TDS_E_ColorFabb_TPU_85A.pdf`,
  'TPU 95A': `${TDS_URL_BASE}/TDS_E_ColorFabb_TPU_95A.pdf`,
  
  // PHA
  'allPHA': `${TDS_URL_BASE}/TDS_E_ColorFabb_allPHA.pdf`,
};

export function getColorFabbTdsUrl(material: string): string | null {
  return COLORFABB_TDS_PATTERNS[material] || null;
}

// =============================================================================
// PRINT SETTINGS
// =============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  fanMin?: number;
  fanMax?: number;
}

export const COLORFABB_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Standard PLA
  'PLA': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA/PHA': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA Economy': { nozzleTempMin: 190, nozzleTempMax: 210, bedTempMin: 50, bedTempMax: 60 },
  'PLA Semi-Matte': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'PLA High Speed Pro': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60, printSpeedMax: 300 },
  'PLA-HP': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 60, printSpeedMax: 300 },
  'rPLA': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'Vibers PLA': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  
  // Lightweight/Foaming (higher temps for foaming)
  'LW-PLA': { nozzleTempMin: 200, nozzleTempMax: 260, bedTempMin: 50, bedTempMax: 60 },
  'LW-PLA-HT': { nozzleTempMin: 200, nozzleTempMax: 270, bedTempMin: 50, bedTempMax: 60 },
  'LW-ASA': { nozzleTempMin: 230, nozzleTempMax: 270, bedTempMin: 90, bedTempMax: 110 },
  'varioShore TPU': { nozzleTempMin: 200, nozzleTempMax: 250, bedTempMin: 25, bedTempMax: 50, printSpeedMax: 40 },
  
  // Specialty fills
  'bronzeFill': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'copperFill': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'steelFill': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'brassFill': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'woodFill': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'corkFill': { nozzleTempMin: 190, nozzleTempMax: 210, bedTempMin: 50, bedTempMax: 60 },
  'bambooFill': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  'glowFill': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  
  // Co-polyesters
  'nGen': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 75, bedTempMax: 85 },
  'nGen-CF10': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 75, bedTempMax: 85 },
  'nGen-Flex': { nozzleTempMin: 220, nozzleTempMax: 240, bedTempMin: 75, bedTempMax: 85 },
  'XT': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 60, bedTempMax: 75 },
  'XT-CF20': { nozzleTempMin: 250, nozzleTempMax: 270, bedTempMin: 60, bedTempMax: 75 },
  'HT': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 100, bedTempMax: 120 },
  
  // PETG
  'PETG': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
  'PETG Economy': { nozzleTempMin: 220, nozzleTempMax: 245, bedTempMin: 70, bedTempMax: 85 },
  'PETG Semi-Matte': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
  
  // Engineering
  'ASA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110 },
  'PA Neat': { nozzleTempMin: 245, nozzleTempMax: 265, bedTempMin: 50, bedTempMax: 70 },
  'PA-CF': { nozzleTempMin: 250, nozzleTempMax: 270, bedTempMin: 50, bedTempMax: 70 },
  
  // TPU
  'TPU': { nozzleTempMin: 210, nozzleTempMax: 235, bedTempMin: 25, bedTempMax: 50, printSpeedMax: 40 },
  'TPU 85A': { nozzleTempMin: 210, nozzleTempMax: 235, bedTempMin: 25, bedTempMax: 50, printSpeedMax: 30 },
  'TPU 95A': { nozzleTempMin: 215, nozzleTempMax: 235, bedTempMin: 25, bedTempMax: 50, printSpeedMax: 40 },
  
  // PHA
  'allPHA': { nozzleTempMin: 180, nozzleTempMax: 200, bedTempMin: 50, bedTempMax: 60 },
};

export function getColorFabbPrintSettings(material: string): PrintSettings | null {
  return COLORFABB_PRINT_SETTINGS[material] || COLORFABB_PRINT_SETTINGS[material.split(' ')[0]] || null;
}

// =============================================================================
// COLOR MAPPING
// =============================================================================

export const COLORFABB_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'white': 'FFFFFF',
  'black': '000000',
  'natural': 'F5F5DC',
  'transparent': 'FFFFFF',
  'clear': 'FFFFFF',
  
  // Reds
  'red': 'FF0000',
  'traffic red': 'CC0000',
  'signal red': 'E60000',
  'ruby red': 'A81C07',
  'burgundy': '800020',
  
  // Oranges
  'orange': 'FF6600',
  'traffic orange': 'FF8C00',
  'dutch orange': 'FF7F00',
  
  // Yellows
  'yellow': 'FFFF00',
  'traffic yellow': 'FFD700',
  'signal yellow': 'FFCC00',
  'lemon yellow': 'FFF44F',
  
  // Greens
  'green': '00FF00',
  'leaf green': '228B22',
  'mint green': '98FF98',
  'olive green': '808000',
  'moss green': '8A9A5B',
  'traffic green': '009E60',
  
  // Blues
  'blue': '0000FF',
  'sky blue': '87CEEB',
  'light blue': 'ADD8E6',
  'ocean blue': '4F94CD',
  'traffic blue': '0033A0',
  'signal blue': '003399',
  'ultramarine blue': '3F00FF',
  
  // Purples
  'purple': '800080',
  'violet': 'EE82EE',
  'magenta': 'FF00FF',
  
  // Pinks
  'pink': 'FFC0CB',
  'traffic pink': 'FF69B4',
  
  // Browns
  'brown': '8B4513',
  'chocolate brown': 'D2691E',
  
  // Grays
  'gray': '808080',
  'grey': '808080',
  'silver': 'C0C0C0',
  'light gray': 'D3D3D3',
  'dark gray': '404040',
  'traffic grey': '5A5A5A',
  
  // Metal fills
  'bronze': 'CD7F32',
  'copper': 'B87333',
  'steel': '71797E',
  'brass': 'B5A642',
  
  // Wood/natural tones
  'wood': 'DEB887',
  'cork': 'C4A484',
  'bamboo': 'E3D4AD',
  
  // Special colors
  'glow': 'CCFF00',
  'glow green': '39FF14',
};

export function getColorFabbColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // Direct match
  if (COLORFABB_COLOR_MAPPING[normalized]) {
    return COLORFABB_COLOR_MAPPING[normalized];
  }
  
  // Partial match
  for (const [key, hex] of Object.entries(COLORFABB_COLOR_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }
  
  return null;
}

// =============================================================================
// TITLE CLEANING
// =============================================================================

export function cleanColorFabbTitle(title: string): string {
  if (!title) return '';
  
  return title
    .replace(/colorfabb\s*/gi, '')
    .replace(/filament\s*/gi, '')
    .replace(/\s*-\s*\d+g\b/gi, '')
    .replace(/\s*\d+\s*gram(s)?\b/gi, '')
    .replace(/\s*\d+(\.\d+)?\s*mm\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// =============================================================================
// MAIN ENRICHMENT FUNCTION
// =============================================================================

export interface ColorFabbEnrichmentResult {
  material: string;
  baseType: string;
  finishType: FinishType;
  productLineId: string;
  tdsUrl: string | null;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  isFoaming: boolean;
  isFlexible: boolean;
  highSpeedCapable: boolean;
  colorHex: string | null;
}

export function enrichColorFabbProduct(
  title: string,
  colorName?: string | null
): ColorFabbEnrichmentResult {
  const materialInfo = normalizeColorFabbMaterial(title);
  const finishType = extractColorFabbFinishType(title, materialInfo.normalized);
  const productLineId = generateColorFabbProductLineId(title, materialInfo.normalized);
  const tdsUrl = getColorFabbTdsUrl(materialInfo.normalized);
  const printSettings = getColorFabbPrintSettings(materialInfo.normalized);
  const colorHex = colorName ? getColorFabbColorHex(colorName) : null;
  
  return {
    material: materialInfo.normalized,
    baseType: materialInfo.baseType,
    finishType,
    productLineId,
    tdsUrl,
    nozzleTempMin: printSettings?.nozzleTempMin || null,
    nozzleTempMax: printSettings?.nozzleTempMax || null,
    bedTempMin: printSettings?.bedTempMin || null,
    bedTempMax: printSettings?.bedTempMax || null,
    printSpeedMax: printSettings?.printSpeedMax || null,
    isAbrasive: materialInfo.isAbrasive,
    enclosureRequired: materialInfo.enclosureRequired,
    isFoaming: materialInfo.isFoaming,
    isFlexible: materialInfo.isFlexible,
    highSpeedCapable: materialInfo.highSpeedCapable,
    colorHex,
  };
}

// =============================================================================
// STORE CONFIGURATION
// =============================================================================

export const COLORFABB_STORE_INFO = {
  vendor: 'ColorFabb',
  brandSlug: 'colorfabb',
  baseUrl: 'https://colorfabb.com',
  currency: 'EUR',
  platform: 'magento',
  categoryUrls: [
    'https://colorfabb.com/pla',
    'https://colorfabb.com/tpu',
    'https://colorfabb.com/co-polyester',
    'https://colorfabb.com/asa',
    'https://colorfabb.com/pa',
    'https://colorfabb.com/pha',
  ],
  defaultDiameter: 1.75,
  defaultWeight: 750,
};

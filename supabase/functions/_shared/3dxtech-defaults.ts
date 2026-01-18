// 3DXTech Brand-Specific Defaults and Enrichment Functions
// Premium industrial filament manufacturer specializing in high-performance and ESD materials

// ============================================================================
// TDS URL MAPPINGS - Curated official download URLs (71 products)
// ============================================================================

/** Curated TDS URL patterns from official 3DXtech Shopify CDN */
export const DXTECH_TDS_PATTERNS: Record<string, { url: string; aliases?: string[] }> = {
  // 3DXSTAT ESD Materials
  '3dxstat-esd-pekk': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXSTAT_ESD_PEKK_TDS.pdf', aliases: ['esd-pekk'] },
  '3dxstat-esd-ultem-9085': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3XDSTAT_ESD_Ultem_v3_TDS.pdf', aliases: ['esd-pei-9085', 'esd-ultem-9085'] },
  '3dxstat-esd-ultem-1010': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXSTAT_ESD_Ultem1010_TDS_v3.1.pdf', aliases: ['esd-pei-1010', 'esd-ultem-1010'] },
  '3dxstat-esd-pps': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXSTAT_ESD_PPS_v3_TDS.pdf', aliases: ['esd-pps'] },
  '3dxstat-esd-pvdf': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXSTAT_ESD_PVDF_v3_TDS.pdf', aliases: ['esd-pvdf'] },
  '3dxstat-esd-pc': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXSTAT_ESD_PC_v3_TDS.pdf', aliases: ['esd-pc'] },
  '3dxstat-esd-petg': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXSTAT_ESD-PETG-TDS-v03.pdf', aliases: ['esd-petg'] },
  '3dxstat-esd-abs': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXSTAT_ESD_ABS_TDS_v3.pdf', aliases: ['esd-abs'] },
  '3dxstat-esd-pla': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXSTAT_ESD_PLA_TDS_v3.pdf', aliases: ['esd-pla'] },
  '3dxstat-esd-flex-tpu-90a': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXSTAT_ESD_TPU_90A_TDS_v1.1.pdf', aliases: ['esd-tpu', 'esd-flex-tpu'] },
  '3dxstat-esd-nylon-12': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXSTAT_ESD_PA12_TDS_v1.pdf', aliases: ['esd-pa12', 'esd-nylon'] },

  // CarbonX Line
  'carbonx-cf-pekk': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF20_PEEK_TDS_v1.pdf', aliases: ['cf-pekk', 'pekk-cf'] },
  'carbonx-cf-pekk-a': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF15_PEKK-A__TDS_v1.pdf', aliases: ['cf-pekk-a', 'pekk-a-cf'] },
  'carbonx-cf-peek10': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_PEEK_TDS_v3.pdf', aliases: ['cf-peek10', 'peek10-cf'] },
  'carbonx-cf-peek20': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF20_PEEK_TDS_v1.pdf', aliases: ['cf-peek20', 'peek20-cf'] },
  'carbonx-cf-pei-1010': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_Ultem_TDS_v3.pdf', aliases: ['cf-pei-1010', 'cf-ultem-1010', 'pei-1010-cf'] },
  'carbonx-cf-pei-9085': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_Ultem_9085_TDS.pdf', aliases: ['cf-pei-9085', 'cf-ultem-9085', 'pei-9085-cf'] },
  'carbonx-cf-pc': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_PC_TDSv3.pdf', aliases: ['cf-pc', 'pc-cf'] },
  'carbonx-cf-ezpc': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_ezPC_TDSv1.pdf', aliases: ['cf-ezpc', 'ezpc-cf'] },
  'carbonx-cf-pp': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_PP_TDSv1.pdf', aliases: ['cf-pp', 'pp-cf'] },
  'carbonx-cf-pa6-gen3': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_PA6_G3_TDS_v3.0.pdf', aliases: ['cf-pa6', 'pa6-cf', 'nylon6-cf'] },
  'carbonx-cf-pc-abs': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_PC_ABS_TDS_v1.1.pdf', aliases: ['cf-pc-abs', 'pc-abs-cf'] },
  'carbonx-cf-ht-nylon': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_HTN_TDS_v2.pdf', aliases: ['cf-htn', 'htn-cf', 'ht-nylon-cf'] },
  'carbonx-cf-pa12': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_PA12_TDS_v1.pdf', aliases: ['cf-pa12', 'pa12-cf', 'nylon12-cf'] },
  'carbonx-cf-petg': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_PETG_TDS_v3.pdf', aliases: ['cf-petg', 'petg-cf'] },
  'carbonx-cf-asa': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_ASA_TDS_v1.pdf', aliases: ['cf-asa', 'asa-cf'] },
  'carbonx-cf-abs': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_ABS_TDS_v3.pdf', aliases: ['cf-abs', 'abs-cf'] },
  'carbonx-cf-pla': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/CarbonX_CF_PLA_TDS_v3.pdf', aliases: ['cf-pla', 'pla-cf'] },
  'obsidian-pa6-cf': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/Obsidian-PA6CF-TDS_v1.pdf', aliases: ['obsidian', 'onyx-alternative'] },

  // THERMAX Line
  'thermax-pekk-c': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/Thermax_PEKK-C_TDS_v3.3.pdf', aliases: ['pekk-c'] },
  'thermax-pekk-a': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/Thermax_PEKK-A_TDS_v2.1.pdf', aliases: ['pekk-a'] },
  'thermax-peek': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/Themax_PEEK_TDS_v3.pdf', aliases: ['peek'] },
  'thermax-tpi-extem': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/Thermax_TPI_TDS_TDS_v1.pdf', aliases: ['tpi', 'extem'] },
  'thermax-pei-1010': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/THERMAX_PEI_1010_TDS_v4.pdf', aliases: ['pei-1010', 'ultem-1010'] },
  'thermax-pei-9085': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/THERMAX_PEI_9085_TDS_v4.pdf', aliases: ['pei-9085', 'ultem-9085'] },
  'thermax-ppsu': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/THERMAX_PPSU_TDS_v3.pdf', aliases: ['ppsu'] },
  'thermax-psu': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/THERMAX_PSU_TDS_v3.pdf', aliases: ['psu'] },
  'thermax-pps': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/THERMAX_PPS_TDS_v3.pdf', aliases: ['pps'] },
  'thermax-ppe-ps': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/THERMAX_PPE_PS_TDS_v1.pdf', aliases: ['ppe-ps'] },
  'thermax-hts': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/THERMAX_HTS_SDS_v1.0.pdf', aliases: ['hts', 'high-temp-support'] },
  'thermax-mts': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/THERMAX_MTS1_SDS_v1.0.pdf', aliases: ['mts', 'medium-temp-support'] },
  'thermax-hts1': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/THERMAX_HTS1_TDS_v1.pdf', aliases: ['hts1'] },
  'thermax-hts2': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/THERMAX_HTS2_TDS_v1.pdf', aliases: ['hts2'] },

  // FibreX Glass Fiber Line
  'fibrex-peek-gf20': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/FIBREX_GF20_PEEK_v2.pdf', aliases: ['peek-gf20', 'gf20-peek'] },
  'fibrex-pei-gf30': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/FIBREX_GF30_ULTEM_PEI_v1.pdf', aliases: ['pei-gf30', 'gf30-pei', 'ultem-gf30'] },
  'fibrex-pa6-gf30': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/AMIDEX_Nylon_GF30_TDS_v1.pdf', aliases: ['pa6-gf30', 'gf30-pa6', 'nylon6-gf30'] },
  'fibrex-pa12-gf30': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/FIBREX_PA12_GF30_TDS_v1.0.pdf', aliases: ['pa12-gf30', 'gf30-pa12', 'nylon12-gf30'] },
  'fibrex-abs-gf': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/FIBREX_GF_ABS__TDS_v1.pdf', aliases: ['abs-gf', 'gf-abs'] },
  'fibrex-pp-gf30': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/FIBREX_GF_PP_TDS_v1.pdf', aliases: ['pp-gf30', 'gf30-pp'] },

  // Specialty Materials
  'simubone': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/SimuBone_TDS_v1.pdf', aliases: ['bone-modeling'] },
  'fluorx-pvdf': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/FLUORX_PVDF_TDS_v3.pdf', aliases: ['pvdf'] },
  'evolv3d-obc': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/EVOLV3D_OBC-TDS.pdf', aliases: ['obc'] },
  'hyperlite-pp': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/Hyperlite_PP_TDS_v1.pdf', aliases: ['hyperlite', 'pp'] },
  'amidex-nylon-6-66': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/AMIDEX_PA6_Copolymer_v1.0.pdf', aliases: ['pa6-66', 'nylon-6-66', 'amidex'] },
  'wearx-pa6': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/wearx_tds_FW_PA6_Copolymer_v1.0.pdf', aliases: ['wearx', 'wear-resistant-pa6'] },

  // 3DXMAX Line
  '3dxmax-pc': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXMAX_PC_TDS_v3.pdf', aliases: ['max-pc'] },
  'ezpc': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/ezPC_TDS_v01.pdf', aliases: ['ez-pc'] },
  '3dxmax-pc-asa': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXMAX_PCASA_TDS_v3.pdf', aliases: ['max-pc-asa', 'pc-asa'] },
  '3dxmax-pc-abs': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXMAX_PCABS_TDS_v3.pdf', aliases: ['max-pc-abs', 'pc-abs'] },
  '3dxpro-low-gloss-petg': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXPRO_LG_PETG_TDS_v3.pdf', aliases: ['lg-petg', 'low-gloss-petg'] },
  'max-g-petg': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/MAXG_PCTG_TDS_v1.0.pdf', aliases: ['maxg', 'max-g', 'pctg'] },
  'ecomax-pla': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/ECOMAX_PLA_TDS_v3.pdf', aliases: ['eco-pla'] },
  'ecomax-tough-pla': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/ECOMAX_Tough_PLA_TDS_v1.pdf', aliases: ['tough-pla'] },
  '3dxmax-asa': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXMAX_ASA_TDS_v3.pdf', aliases: ['max-asa', 'asa'] },
  '3dxmax-abs': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXMAX_ABS_TDS_v3.pdf', aliases: ['max-abs', 'abs'] },
  '3dxmax-hips': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXMAX_HIPS_TDS_v3.pdf', aliases: ['max-hips', 'hips'] },
  '3dxmax-lts2': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/3DXMAX_LTS2_TDS_v1.pdf', aliases: ['lts2', 'low-temp-support'] },

  // Firewire Flame Retardant
  'firewire-fr-abs': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/FIREWIRE_FR_ABS_TDS_v3.pdf', aliases: ['fr-abs'] },
  'firewire-fr-pc-abs': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/FIREWIRE_FR_PCABS_TDS_v3.pdf', aliases: ['fr-pc-abs'] },

  // Support Materials
  'aquatek-x1': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/AQUATEK_X1_SDS_v1.0.pdf', aliases: ['aquatek', 'usm', 'water-soluble'] },
  'aquatek-pva': { url: 'https://cdn.shopify.com/s/files/1/0625/4185/6821/files/AQUATEK_PVA_TDS_v1.pdf', aliases: ['pva'] },
};

/**
 * Match a product to its TDS URL using curated patterns
 */
export function match3DXTechTds(
  productLineId: string | null,
  material: string | null,
  productTitle: string | null
): string | null {
  const searchTerms = [
    productLineId?.toLowerCase().trim(),
    material?.toLowerCase().trim(),
    productTitle?.toLowerCase().trim(),
  ].filter(Boolean) as string[];

  // Direct key match
  for (const term of searchTerms) {
    const normalized = term.replace(/[\s_]+/g, '-');
    if (DXTECH_TDS_PATTERNS[normalized]) {
      return DXTECH_TDS_PATTERNS[normalized].url;
    }
  }

  // Alias match
  for (const [key, { url, aliases }] of Object.entries(DXTECH_TDS_PATTERNS)) {
    for (const term of searchTerms) {
      const normalized = term.replace(/[\s_]+/g, '-');
      if (aliases?.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
        return url;
      }
      // Check if key words are in the term
      const keyParts = key.split('-').filter(p => p.length > 2);
      if (keyParts.length >= 2 && keyParts.every(part => normalized.includes(part))) {
        return url;
      }
    }
  }

  return null;
}

/**
 * Get TDS URL for a 3DXtech filament - uses curated patterns first, then falls back to legacy logic
 */
export function get3DXTechTdsUrl(
  productLineId: string | null,
  material: string | null,
  productTitle: string | null
): string | null {
  // Try curated patterns first (71 official URLs)
  const curatedUrl = match3DXTechTds(productLineId, material, productTitle);
  if (curatedUrl) return curatedUrl;

  // Legacy fallback logic for any edge cases
  return null;
}

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

interface MaterialPattern {
  pattern: RegExp;
  material: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  isConductive: boolean;
  hardness?: string;
}

// Material patterns ordered by specificity (most specific first)
// CRITICAL: ESD Materials MUST be checked FIRST to prevent base material patterns from matching
export const DXTECH_MATERIAL_PATTERNS: MaterialPattern[] = [
  // ESD Materials (3DXSTAT line) - Static Dissipative - MUST BE FIRST
  // These patterns must come before their base material equivalents (e.g., ESD-PEI before PEI)
  { pattern: /esd[- ]?pekk/i, material: 'ESD-PEKK', isAbrasive: true, enclosureRequired: true, isConductive: true },
  // ESD-PEI-1010: Match "ESD-PEI 1010", "ESD-PEI Ultem 1010", "Triton ESD-PEI Ultem 1010"
  { pattern: /esd[- ]?pei[- ]?1010|esd[- ]?pei[- ]?ultem[- ]?1010|esd[- ]?ultem[- ]?1010|triton[- ]?esd[- ]?1010/i, material: 'ESD-PEI-1010', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pei[- ]?9085|esd[- ]?ultem[- ]?9085/i, material: 'ESD-PEI-9085', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pei|esd[- ]?ultem/i, material: 'ESD-PEI', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pps/i, material: 'ESD-PPS', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pvdf/i, material: 'ESD-PVDF', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pc[- ]?abs/i, material: 'ESD-PC-ABS', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pc/i, material: 'ESD-PC', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?petg/i, material: 'ESD-PETG', isAbrasive: true, enclosureRequired: false, isConductive: true },
  { pattern: /esd[- ]?abs/i, material: 'ESD-ABS', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pla/i, material: 'ESD-PLA', isAbrasive: true, enclosureRequired: false, isConductive: true },
  { pattern: /esd[- ]?tpu/i, material: 'ESD-TPU', isAbrasive: true, enclosureRequired: false, isConductive: true, hardness: '90A' },
  { pattern: /esd[- ]?pa[- ]?12|esd[- ]?nylon[- ]?12/i, material: 'ESD-PA12', isAbrasive: true, enclosureRequired: false, isConductive: true },

  // High-Performance Polymers (THERMAX line)
  { pattern: /pekk[- ]?[ac]?[- ]?cf/i, material: 'PEKK-CF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /peek[- ]?cf/i, material: 'PEEK-CF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /pei[- ]?1010[- ]?cf|ultem[- ]?1010[- ]?cf/i, material: 'PEI-1010-CF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /pei[- ]?9085[- ]?cf|ultem[- ]?9085[- ]?cf/i, material: 'PEI-9085-CF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /pei[- ]?cf|ultem[- ]?cf/i, material: 'PEI-CF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /pps[- ]?cf/i, material: 'PPS-CF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /ppsu[- ]?cf/i, material: 'PPSU-CF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /pekk[- ]?[ac]?/i, material: 'PEKK', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /peek[- ]?gf/i, material: 'PEEK-GF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /peek/i, material: 'PEEK', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /pei[- ]?1010|ultem[- ]?1010/i, material: 'PEI-1010', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /pei[- ]?9085|ultem[- ]?9085/i, material: 'PEI-9085', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /pei[- ]?gf|ultem[- ]?gf/i, material: 'PEI-GF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /\bpei\b|ultem/i, material: 'PEI', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /tpi|extem/i, material: 'TPI', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /ppsu/i, material: 'PPSU', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /psu/i, material: 'PSU', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /pps/i, material: 'PPS', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /ppe[- ]?ps/i, material: 'PPE-PS', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /pvdf/i, material: 'PVDF', isAbrasive: false, enclosureRequired: true, isConductive: false },

  // Carbon Fiber Reinforced (CarbonX line)
  { pattern: /pc[- ]?abs[- ]?cf|carbonx.*pc[- ]?abs/i, material: 'PC-ABS-CF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /pc[- ]?cf|carbonx.*\bpc\b/i, material: 'PC-CF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /ezpc[- ]?cf/i, material: 'EZPC-CF', isAbrasive: true, enclosureRequired: false, isConductive: false },
  { pattern: /pp[- ]?cf/i, material: 'PP-CF', isAbrasive: true, enclosureRequired: false, isConductive: false },
  { pattern: /pa[- ]?6[- ]?cf|nylon[- ]?6[- ]?cf/i, material: 'PA6-CF', isAbrasive: true, enclosureRequired: false, isConductive: false },
  { pattern: /pa[- ]?12[- ]?cf|nylon[- ]?12[- ]?cf/i, material: 'PA12-CF', isAbrasive: true, enclosureRequired: false, isConductive: false },
  { pattern: /htn[- ]?cf/i, material: 'HTN-CF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /petg[- ]?cf|carbonx.*petg/i, material: 'PETG-CF', isAbrasive: true, enclosureRequired: false, isConductive: false },
  { pattern: /asa[- ]?cf|carbonx.*asa/i, material: 'ASA-CF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /abs[+\- ]?cf|carbonx.*abs/i, material: 'ABS-CF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /pla[- ]?cf|carbonx.*pla/i, material: 'PLA-CF', isAbrasive: true, enclosureRequired: false, isConductive: false },

  // Glass Fiber Reinforced (FibreX line) - Note: pattern includes + for "ABS+GF" and "GF+PA6" formats
  // IMPORTANT: PPA-GF must be detected BEFORE PP-GF to prevent false matches (PPA != PP)
  // IMPORTANT: GF+PA6 (OBSIDIAN GF) must be detected BEFORE PA6-CF patterns
  { pattern: /ppa[+\- ]?gf|fibrex.*ppa/i, material: 'PPA-GF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /gf\+?pa6|obsidian.*gf|pa6[- ]?gf|nylon[- ]?6[- ]?gf|fibrex.*pa[- ]?6/i, material: 'PA6-GF', isAbrasive: true, enclosureRequired: false, isConductive: false },
  { pattern: /pa[- ]?12[- ]?gf|nylon[- ]?12[- ]?gf|fibrex.*pa[- ]?12/i, material: 'PA12-GF', isAbrasive: true, enclosureRequired: false, isConductive: false },
  { pattern: /abs[+\- ]?gf|fibrex.*abs/i, material: 'ABS-GF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /pp[+\- ]?gf|fibrex.*pp(?!a)/i, material: 'PP-GF', isAbrasive: true, enclosureRequired: false, isConductive: false },
  { pattern: /tpu[+\- ]?gf/i, material: 'TPU-GF', isAbrasive: true, enclosureRequired: false, isConductive: false, hardness: '95A' },
  { pattern: /pei[- ]?gf|fibrex.*pei/i, material: 'PEI-GF', isAbrasive: true, enclosureRequired: true, isConductive: false },

  // Flame Retardant (Firewire line)
  { pattern: /fr[- ]?pc[- ]?abs/i, material: 'FR-PC-ABS', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /fr[- ]?pc|firewire.*pc/i, material: 'FR-PC', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /fr[- ]?abs|firewire.*abs/i, material: 'FR-ABS', isAbrasive: false, enclosureRequired: true, isConductive: false },

  // Engineering Polymers (3DXMAX line)
  { pattern: /pc[- ]?asa/i, material: 'PC-ASA', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /pc[- ]?abs/i, material: 'PC-ABS', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /\bpc\b|polycarbonate/i, material: 'PC', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /\basa\b/i, material: 'ASA', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /\babs\b/i, material: 'ABS', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /\bhips\b/i, material: 'HIPS', isAbrasive: false, enclosureRequired: true, isConductive: false },

  // Specialty Materials
  // AmideX Nylon 12 is PA12, NOT PA6-66 - check for "nylon 12" or "nylon12" with amidex
  { pattern: /amidex.*nylon[- ]?12|nylon[- ]?12.*amidex/i, material: 'PA12', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /pa[- ]?6[- ]?66|nylon[- ]?6[- ]?66|amidex/i, material: 'PA6-66', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /pa[- ]?6[- ]?wear|wearx/i, material: 'PA6-Wear', isAbrasive: false, enclosureRequired: false, isConductive: false },
  // Obsidian CF only (GF versions handled above in Glass Fiber section)
  { pattern: /obsidian.*cf|pa[- ]?6[- ]?cf[- ]?v2/i, material: 'PA6-CF', isAbrasive: true, enclosureRequired: false, isConductive: false },
  { pattern: /htn/i, material: 'HTN', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /\bpp\b|polypropylene|hyperlite/i, material: 'PP', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /simubone/i, material: 'SimuBone', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /obc|evolv3d/i, material: 'OBC', isAbrasive: false, enclosureRequired: false, isConductive: false },

  // Support Materials - HTS1/MTS1 patterns (with optional trailing number)
  { pattern: /usm|aquatek/i, material: 'USM', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /\bhts1?\b|high[- ]?temp[- ]?support/i, material: 'HTS', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /\bmts1?\b|mid[- ]?temp[- ]?support/i, material: 'MTS', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /\bpes\b|polyethersulfone/i, material: 'PES', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /\bpva\b/i, material: 'PVA', isAbrasive: false, enclosureRequired: false, isConductive: false },

  // Standard Materials - PCTG must come BEFORE PETG to prevent false matches
  { pattern: /pa[- ]?12|nylon[- ]?12/i, material: 'PA12', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /pa[- ]?6|nylon[- ]?6|\bnylon\b/i, material: 'PA6', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /pctg|max[- ]?g.*pctg/i, material: 'PCTG', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /petg|max[- ]?g/i, material: 'PETG', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /pla[- ]?tough|tough[- ]?pla/i, material: 'PLA-Tough', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /rpetg|recycled[- ]?petg/i, material: 'rPETG', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /\bpla\b/i, material: 'PLA', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /\btpu\b/i, material: 'TPU', isAbrasive: false, enclosureRequired: false, isConductive: false, hardness: '95A' },
];

export function normalize3DXTechMaterial(title: string): {
  material: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  isConductive: boolean;
  hardness?: string;
} {
  const titleLower = title.toLowerCase();

  for (const { pattern, material, isAbrasive, enclosureRequired, isConductive, hardness } of DXTECH_MATERIAL_PATTERNS) {
    if (pattern.test(titleLower)) {
      return { material, isAbrasive, enclosureRequired, isConductive, hardness };
    }
  }

  return { material: 'Unknown', isAbrasive: false, enclosureRequired: false, isConductive: false };
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

export const DXTECH_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // High-Performance Polymers
  'PEEK': { nozzleTempMin: 370, nozzleTempMax: 410, bedTempMin: 120, bedTempMax: 150 },
  'PEEK-CF': { nozzleTempMin: 380, nozzleTempMax: 420, bedTempMin: 120, bedTempMax: 150 },
  'PEEK-GF': { nozzleTempMin: 380, nozzleTempMax: 420, bedTempMin: 120, bedTempMax: 150 },
  'PEKK': { nozzleTempMin: 340, nozzleTempMax: 380, bedTempMin: 120, bedTempMax: 140 },
  'PEKK-CF': { nozzleTempMin: 350, nozzleTempMax: 390, bedTempMin: 120, bedTempMax: 140 },
  'PEI': { nozzleTempMin: 350, nozzleTempMax: 390, bedTempMin: 120, bedTempMax: 160 },
  'PEI-1010': { nozzleTempMin: 350, nozzleTempMax: 390, bedTempMin: 120, bedTempMax: 160 },
  'PEI-9085': { nozzleTempMin: 350, nozzleTempMax: 380, bedTempMin: 120, bedTempMax: 150 },
  'PEI-CF': { nozzleTempMin: 355, nozzleTempMax: 395, bedTempMin: 120, bedTempMax: 160 },
  'PEI-1010-CF': { nozzleTempMin: 355, nozzleTempMax: 395, bedTempMin: 120, bedTempMax: 160 },
  'PEI-9085-CF': { nozzleTempMin: 355, nozzleTempMax: 395, bedTempMin: 120, bedTempMax: 150 },
  'PEI-GF': { nozzleTempMin: 355, nozzleTempMax: 395, bedTempMin: 120, bedTempMax: 160 },
  'TPI': { nozzleTempMin: 380, nozzleTempMax: 420, bedTempMin: 140, bedTempMax: 180 },
  'PPS': { nozzleTempMin: 300, nozzleTempMax: 340, bedTempMin: 120, bedTempMax: 140 },
  'PPS-CF': { nozzleTempMin: 305, nozzleTempMax: 345, bedTempMin: 120, bedTempMax: 140 },
  'PPSU': { nozzleTempMin: 340, nozzleTempMax: 380, bedTempMin: 120, bedTempMax: 150 },
  'PPSU-CF': { nozzleTempMin: 345, nozzleTempMax: 385, bedTempMin: 120, bedTempMax: 150 },
  'PSU': { nozzleTempMin: 320, nozzleTempMax: 360, bedTempMin: 120, bedTempMax: 140 },
  'PPE-PS': { nozzleTempMin: 270, nozzleTempMax: 300, bedTempMin: 100, bedTempMax: 120 },
  'PVDF': { nozzleTempMin: 220, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 100 },
  'HTN': { nozzleTempMin: 320, nozzleTempMax: 360, bedTempMin: 100, bedTempMax: 130 },
  'HTN-CF': { nozzleTempMin: 330, nozzleTempMax: 370, bedTempMin: 100, bedTempMax: 130 },

  // ESD Materials
  'ESD-PEKK': { nozzleTempMin: 340, nozzleTempMax: 380, bedTempMin: 120, bedTempMax: 140 },
  'ESD-PEI': { nozzleTempMin: 350, nozzleTempMax: 390, bedTempMin: 120, bedTempMax: 160 },
  'ESD-PEI-1010': { nozzleTempMin: 350, nozzleTempMax: 390, bedTempMin: 120, bedTempMax: 160 },
  'ESD-PEI-9085': { nozzleTempMin: 350, nozzleTempMax: 380, bedTempMin: 120, bedTempMax: 150 },
  'ESD-PPS': { nozzleTempMin: 300, nozzleTempMax: 340, bedTempMin: 120, bedTempMax: 140 },
  'ESD-PVDF': { nozzleTempMin: 220, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 100 },
  'ESD-PC': { nozzleTempMin: 270, nozzleTempMax: 300, bedTempMin: 100, bedTempMax: 120 },
  'ESD-PC-ABS': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 100, bedTempMax: 115 },
  'ESD-PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
  'ESD-ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110 },
  'ESD-PLA': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 65 },
  'ESD-TPU': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60 },
  'ESD-PA12': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90 },

  // Carbon Fiber Composites
  'PC-CF': { nozzleTempMin: 275, nozzleTempMax: 315, bedTempMin: 110, bedTempMax: 130 },
  'PC-ABS-CF': { nozzleTempMin: 265, nozzleTempMax: 295, bedTempMin: 100, bedTempMax: 115 },
  'EZPC-CF': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 80, bedTempMax: 100 },
  'PP-CF': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60 },
  'PA6-CF': { nozzleTempMin: 255, nozzleTempMax: 285, bedTempMin: 70, bedTempMax: 90 },
  'PA12-CF': { nozzleTempMin: 245, nozzleTempMax: 275, bedTempMin: 70, bedTempMax: 90 },
  'PETG-CF': { nozzleTempMin: 245, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 85 },
  'ASA-CF': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 90, bedTempMax: 110 },
  'ABS-CF': { nozzleTempMin: 245, nozzleTempMax: 275, bedTempMin: 100, bedTempMax: 110 },
  'PLA-CF': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 50, bedTempMax: 65 },

  // Glass Fiber Composites
  'PPA-GF': { nozzleTempMin: 280, nozzleTempMax: 320, bedTempMin: 100, bedTempMax: 120 },
  'PA6-GF': { nozzleTempMin: 255, nozzleTempMax: 285, bedTempMin: 70, bedTempMax: 90 },
  'PA12-GF': { nozzleTempMin: 245, nozzleTempMax: 275, bedTempMin: 70, bedTempMax: 90 },
  'ABS-GF': { nozzleTempMin: 245, nozzleTempMax: 275, bedTempMin: 100, bedTempMax: 110 },
  'PP-GF': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60 },

  // Flame Retardant
  'FR-PC': { nozzleTempMin: 270, nozzleTempMax: 310, bedTempMin: 100, bedTempMax: 120 },
  'FR-PC-ABS': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 100, bedTempMax: 115 },
  'FR-ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110 },

  // Engineering Polymers
  'PC': { nozzleTempMin: 270, nozzleTempMax: 310, bedTempMin: 100, bedTempMax: 120 },
  'PC-ABS': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 100, bedTempMax: 110 },
  'PC-ASA': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 100, bedTempMax: 115 },
  'ASA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110 },
  'ABS': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110 },
  'HIPS': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 90, bedTempMax: 110 },

  // Specialty
  'PA6': { nozzleTempMin: 250, nozzleTempMax: 280, bedTempMin: 70, bedTempMax: 90 },
  'PA12': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90 },
  'PA6-66': { nozzleTempMin: 255, nozzleTempMax: 285, bedTempMin: 70, bedTempMax: 90 },
  'PA6-Wear': { nozzleTempMin: 255, nozzleTempMax: 285, bedTempMin: 70, bedTempMax: 90 },
  'PP': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60 },
  'SimuBone': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 60, bedTempMax: 80 },
  'OBC': { nozzleTempMin: 180, nozzleTempMax: 210, bedTempMin: 30, bedTempMax: 50 },

  // Standard
  'PCTG': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 70, bedTempMax: 85 },
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
  'rPETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 65 },
  'PLA-Tough': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 50, bedTempMax: 65 },
  'TPU': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 40, bedTempMax: 60 },

  // Support Materials
  'USM': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 45, bedTempMax: 60 },
  'PVA': { nozzleTempMin: 180, nozzleTempMax: 210, bedTempMin: 45, bedTempMax: 60 },
  'HTS': { nozzleTempMin: 280, nozzleTempMax: 320, bedTempMin: 100, bedTempMax: 130 },
  'MTS': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 80, bedTempMax: 100 },
  'PES': { nozzleTempMin: 340, nozzleTempMax: 380, bedTempMin: 120, bedTempMax: 150 },
};

export function get3DXTechPrintSettings(material: string): PrintSettings | null {
  return DXTECH_PRINT_SETTINGS[material] || null;
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'ESD' | 'Composite-CF' | 'Composite-GF' | 'FR' | 'Matte' | 'Standard';

export function extract3DXTechFinishType(title: string, material: string): FinishType {
  const combined = `${title} ${material}`.toLowerCase();

  if (/esd|static|dissipative|3dxstat/i.test(combined)) return 'ESD';
  if (/cf|carbon\s*fiber/i.test(combined)) return 'Composite-CF';
  if (/gf|glass\s*fiber/i.test(combined)) return 'Composite-GF';
  if (/fr|flame\s*retard|firewire/i.test(combined)) return 'FR';
  if (/low[- ]?gloss|matte/i.test(combined)) return 'Matte';

  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generate3DXTechProductLineId(title: string, material: string): string {
  const titleLower = title.toLowerCase();
  
  // Determine series/brand line
  let series = 'standard';
  
  // TRITON series = Stratasys-compatible products (separate from standard)
  // Handle Triton ABS-BAS as distinct series from regular Triton ABS
  // BAS = Blend ABS for Stratasys - different formulation
  if (/triton.*\babs\b.*\bbas\b|triton.*\bbas\b/i.test(titleLower)) series = 'triton-bas';
  else if (/triton/i.test(titleLower)) series = 'triton';
  else if (/3dxstat|esd/i.test(titleLower)) series = '3dxstat';
  else if (/carbonx|carbon[- ]?x/i.test(titleLower)) series = 'carbonx';
  else if (/fibrex|fibre[- ]?x/i.test(titleLower)) series = 'fibrex';
  else if (/thermax/i.test(titleLower)) series = 'thermax';
  else if (/3dxmax/i.test(titleLower)) series = '3dxmax';
  else if (/firewire/i.test(titleLower)) series = 'firewire';
  else if (/max[- ]?g/i.test(titleLower)) series = 'maxg';
  else if (/ecomax/i.test(titleLower)) series = 'ecomax';
  else if (/aquatek/i.test(titleLower)) series = 'aquatek';
  else if (/fluorx/i.test(titleLower)) series = 'fluorx';
  else if (/hyperlite/i.test(titleLower)) series = 'hyperlite';
  else if (/amidex/i.test(titleLower)) series = 'amidex';
  else if (/wearx/i.test(titleLower)) series = 'wearx';
  else if (/obsidian/i.test(titleLower)) series = 'obsidian';
  else if (/3dxlabs/i.test(titleLower)) series = '3dxlabs';
  else if (/3dxpro/i.test(titleLower)) series = '3dxpro';
  else if (/evolv3d/i.test(titleLower)) series = 'evolv3d';

  // Normalize material for ID
  let materialSlug = material.toLowerCase()
    .replace(/[- ]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  // TPU: include hardness grade to separate 85A vs 95A into distinct product lines
  const tpuHardnessMatch = titleLower.match(/tpu[- ]?\(?(\d+a)\)?/i);
  if (tpuHardnessMatch && material.toUpperCase() === 'TPU') {
    materialSlug = `tpu-${tpuHardnessMatch[1].toLowerCase()}`;
  }

  return `3dxtech__${materialSlug}__${series}`;
}

// ============================================================================
// COLOR MAPPING (Industrial Focus)
// ============================================================================

export const DXTECH_COLOR_MAPPING: Record<string, string> = {
  // Standard Colors
  'black': '#1A1A1A',
  'dark black': '#0D0D0D',
  'natural': '#F5F5DC',
  'white': '#FFFFFF',
  'grey': '#808080',
  'gray': '#808080',
  'dark grey': '#4A4A4A',
  'dark gray': '#4A4A4A',
  'light grey': '#C0C0C0',
  'light gray': '#C0C0C0',

  // Branded Colors
  'orange': '#FF6B00',
  '3dxtech orange': '#FF6B00',
  'red': '#CC0000',
  'crimson red': '#DC143C',
  'blue': '#003DA5',
  'reflex blue': '#003DA5',
  'mid blue': '#4682B4',
  'blue frost': '#6699CC',
  'glacier grey': '#9EACB6',
  'glacier gray': '#9EACB6',

  // Industrial Colors
  'antique white': '#FAEBD7',
  'tactical tan': '#BFA68D',
  'apple green': '#8DB600',
  'green': '#228B22',
  'yellow': '#FFD700',
  'amber': '#FFBF00',
  'brown': '#8B4513',
  'tan': '#D2B48C',
  'beige': '#F5F5DC',
  'ivory': '#FFFFF0',

  // Transparent/Translucent
  'clear': '#FFFFFF',
  'transparent': '#FFFFFF',
  'translucent': '#F8F8FF',

  // Default fallback
  'default': '#4A4A4A',
};

export function get3DXTechColorHex(colorName: string): string | null {
  if (!colorName) return null;

  const colorLower = colorName.toLowerCase().trim();

  // Direct match
  if (DXTECH_COLOR_MAPPING[colorLower]) {
    return DXTECH_COLOR_MAPPING[colorLower];
  }

  // Partial match
  for (const [key, hex] of Object.entries(DXTECH_COLOR_MAPPING)) {
    if (colorLower.includes(key) || key.includes(colorLower)) {
      return hex;
    }
  }

  // Word-by-word match
  const words = colorLower.split(/\s+/);
  for (const word of words) {
    if (DXTECH_COLOR_MAPPING[word]) {
      return DXTECH_COLOR_MAPPING[word];
    }
  }

  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function clean3DXTechTitle(title: string): string {
  return title
    .replace(/^3DXTech\s*/i, '')
    .replace(/\s*[-–]\s*\d+\.?\d*\s*(mm|kg|g)\b/gi, '')
    .replace(/\s*\d+\.?\d*\s*(mm|kg|g)\b/gi, '')
    .replace(/\s*[-–]\s*Reel\b/gi, '')
    .replace(/\s*Reel\b/gi, '')
    .replace(/\s*Filament\b/gi, '')
    .replace(/™|®|©/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface DXTechEnrichmentResult {
  material: string;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  isConductive: boolean;
  hardness?: string;
  printSettings: PrintSettings | null;
  finishType: FinishType;
  productLineId: string;
  colorHex: string | null;
  cleanedTitle: string;
}

export function enrich3DXTechProduct(
  title: string,
  existingMaterial?: string | null,
  colorName?: string | null
): DXTechEnrichmentResult {
  const materialResult = normalize3DXTechMaterial(title);
  const material = existingMaterial || materialResult.material;
  const printSettings = get3DXTechPrintSettings(material);
  const finishType = extract3DXTechFinishType(title, material);
  const productLineId = generate3DXTechProductLineId(title, material);
  const colorHex = colorName ? get3DXTechColorHex(colorName) : null;
  const cleanedTitle = clean3DXTechTitle(title);

  return {
    material,
    isAbrasive: materialResult.isAbrasive,
    enclosureRequired: materialResult.enclosureRequired,
    isConductive: materialResult.isConductive,
    hardness: materialResult.hardness,
    printSettings,
    finishType,
    productLineId,
    colorHex,
    cleanedTitle,
  };
}

// ============================================================================
// STORE INFORMATION
// ============================================================================

export const DXTECH_STORE_INFO = {
  vendorName: '3DXTech',
  platform: 'shopify',
  baseUrl: 'https://www.3dxtech.com',
  productsUrl: 'https://www.3dxtech.com/products.json',
  tdsBaseUrl: 'https://www.3dxtech.com/pages/technical-data-sheets',
  notes: [
    'Premium industrial manufacturer - high-performance polymers and composites',
    '3DXSTAT line: ESD/static-dissipative materials for electronics',
    'CarbonX line: Carbon fiber reinforced materials',
    'FibreX line: Glass fiber reinforced materials',
    'THERMAX line: High-temperature polymers (PEEK, PEKK, PEI, PPS)',
    'All CF/GF materials require hardened nozzles',
    'Supports both 1.75mm and 2.85mm diameters',
    'US-based manufacturing with extensive TDS library',
  ],
};

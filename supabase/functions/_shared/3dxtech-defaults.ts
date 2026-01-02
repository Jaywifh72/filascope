// 3DXTech Brand-Specific Defaults and Enrichment Functions
// Premium industrial filament manufacturer specializing in high-performance and ESD materials

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
export const DXTECH_MATERIAL_PATTERNS: MaterialPattern[] = [
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

  // ESD Materials (3DXSTAT line) - Static Dissipative
  { pattern: /esd[- ]?pekk/i, material: 'ESD-PEKK', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pei[- ]?1010/i, material: 'ESD-PEI-1010', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pei[- ]?9085/i, material: 'ESD-PEI-9085', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pei/i, material: 'ESD-PEI', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pps/i, material: 'ESD-PPS', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pvdf/i, material: 'ESD-PVDF', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pc[- ]?abs/i, material: 'ESD-PC-ABS', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pc/i, material: 'ESD-PC', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?petg/i, material: 'ESD-PETG', isAbrasive: true, enclosureRequired: false, isConductive: true },
  { pattern: /esd[- ]?abs/i, material: 'ESD-ABS', isAbrasive: true, enclosureRequired: true, isConductive: true },
  { pattern: /esd[- ]?pla/i, material: 'ESD-PLA', isAbrasive: true, enclosureRequired: false, isConductive: true },
  { pattern: /esd[- ]?tpu/i, material: 'ESD-TPU', isAbrasive: true, enclosureRequired: false, isConductive: true, hardness: '90A' },
  { pattern: /esd[- ]?pa[- ]?12|esd[- ]?nylon[- ]?12/i, material: 'ESD-PA12', isAbrasive: true, enclosureRequired: false, isConductive: true },

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
  // IMPORTANT: GF+PA6 (OBSIDIAN GF) must be detected BEFORE PA6-CF patterns
  { pattern: /gf\+?pa6|obsidian.*gf|pa6[- ]?gf|nylon[- ]?6[- ]?gf|fibrex.*pa[- ]?6/i, material: 'PA6-GF', isAbrasive: true, enclosureRequired: false, isConductive: false },
  { pattern: /pa[- ]?12[- ]?gf|nylon[- ]?12[- ]?gf|fibrex.*pa[- ]?12/i, material: 'PA12-GF', isAbrasive: true, enclosureRequired: false, isConductive: false },
  { pattern: /abs[+\- ]?gf|fibrex.*abs/i, material: 'ABS-GF', isAbrasive: true, enclosureRequired: true, isConductive: false },
  { pattern: /pp[+\- ]?gf|fibrex.*pp/i, material: 'PP-GF', isAbrasive: true, enclosureRequired: false, isConductive: false },
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

  // Support Materials
  { pattern: /usm|aquatek/i, material: 'USM', isAbrasive: false, enclosureRequired: false, isConductive: false },
  { pattern: /\bhts\b|high[- ]?temp[- ]?support/i, material: 'HTS', isAbrasive: false, enclosureRequired: true, isConductive: false },
  { pattern: /\bmts\b|mid[- ]?temp[- ]?support/i, material: 'MTS', isAbrasive: false, enclosureRequired: false, isConductive: false },
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

  // Support
  'USM': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 45, bedTempMax: 60 },
  'PVA': { nozzleTempMin: 180, nozzleTempMax: 210, bedTempMin: 45, bedTempMax: 60 },
  'HTS': { nozzleTempMin: 280, nozzleTempMax: 320, bedTempMin: 100, bedTempMax: 130 },
  'MTS': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 80, bedTempMax: 100 },
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
  if (/triton/i.test(titleLower)) series = 'triton';
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

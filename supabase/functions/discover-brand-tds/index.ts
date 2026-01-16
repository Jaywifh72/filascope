import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TdsDiscoveryResult {
  filamentId: string;
  productTitle: string;
  productUrl: string | null;
  tdsUrl: string | null;
  source: string;
  success: boolean;
  error?: string;
}

// Common TDS URL patterns across manufacturers
const TDS_PATTERNS = [
  // Direct PDF links
  /href="([^"]+(?:tds|technical[-_]?data|datasheet|spec(?:ification)?[-_]?sheet)[^"]*\.pdf)"/gi,
  /href="([^"]+\.pdf)"[^>]*>(?:[^<]*(?:TDS|Technical|Datasheet|Specification|Spec\s*Sheet))/gi,
  // CDN-hosted PDFs
  /href="([^"]+cdn[^"]+\.pdf)"/gi,
  // Google Drive/Docs links
  /href="(https:\/\/drive\.google\.com\/[^"]+)"/gi,
  // Dropbox links
  /href="(https:\/\/(?:www\.)?dropbox\.com\/[^"]+\.pdf[^"]*)"/gi,
];

// Known TDS URL patterns by brand with centralized TDS URLs
interface BrandTdsConfig {
  patterns?: RegExp[];
  knownUrls?: Record<string, string>;
  hasDefaultsFile?: boolean;  // Indicates brand has _shared/{slug}-defaults.ts with TDS functions
  noTdsAvailable?: boolean;   // Indicates brand doesn't publish TDS documents
}

// ============================================================================
// COMPLETE TDS CONFIGS FOR ALL 43 SYNC MANAGER BRANDS
// ============================================================================

const BRAND_TDS_CONFIGS: Record<string, BrandTdsConfig> = {
  // === 3D-FUEL (US - Shopify) ===
  '3d-fuel': {
    patterns: [
      /href="([^"]*3dfuel[^"]*\.pdf)"/gi,
      /href="([^"]*cdn\.shopify\.com[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'standard pla': 'https://3dfuel.com/pages/standard-pla-tds',
      'standard pla+': 'https://3dfuel.com/pages/standard-pla-plus-tds',
      'pro pla': 'https://3dfuel.com/pages/pro-pla-tds',
      'tough pro pla': 'https://3dfuel.com/pages/tough-pro-pla-tds',
      'pro petg': 'https://3dfuel.com/pages/pro-petg-tds',
      'pro pctg': 'https://3dfuel.com/pages/pro-pctg-tds',
      'pro abs': 'https://3dfuel.com/pages/pro-abs-tds',
      'pro asa': 'https://3dfuel.com/pages/pro-asa-tds',
      'silk pla': 'https://3dfuel.com/pages/silk-pla-tds',
      'workday pla': 'https://3dfuel.com/pages/workday-pla-tds',
      'workday petg': 'https://3dfuel.com/pages/workday-petg-tds',
      'biome3d': 'https://3dfuel.com/pages/biome3d-tds',
    },
    hasDefaultsFile: true,
  },

  // === 3DHOJOR (CN - Shopify) ===
  '3dhojor': {
    patterns: [
      /href="([^"]*3dhojor[^"]*\.pdf)"/gi,
    ],
    noTdsAvailable: true, // Amazon-focused brand, specs on product pages
    hasDefaultsFile: true,
  },

  // === 3DXTECH (US - Industrial) ===
  '3dxtech': {
    patterns: [
      /href="([^"]*3dxtech[^"]*\.pdf)"/gi,
      /href="([^"]*wp-content\/uploads[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'esd-abs': 'https://www.3dxtech.com/wp-content/uploads/2021/03/ESD_ABS_v3.pdf',
      'esd-petg': 'https://www.3dxtech.com/wp-content/uploads/2021/03/ESD-PETG-TDS-v03.pdf',
      'esd-pla': 'https://www.3dxtech.com/wp-content/uploads/2021/03/ESD_PLA_TDS_v3.pdf',
      'esd-pc': 'https://www.3dxtech.com/wp-content/uploads/2021/03/ESD_PC_v3.pdf',
      'abs-cf': 'https://www.3dxtech.com/wp-content/uploads/2021/03/ABS_CF-TDS-v03.pdf',
      'asa-cf': 'https://www.3dxtech.com/wp-content/uploads/2021/07/CF_ASA_v1.pdf',
      'petg-cf': 'https://www.3dxtech.com/wp-content/uploads/2021/03/PETG_CF-TDS-v03.pdf',
      'pla-cf': 'https://www.3dxtech.com/wp-content/uploads/2021/03/PLA_CF-TDS-v03.pdf',
      'pc-cf': 'https://www.3dxtech.com/wp-content/uploads/2021/03/PC_CF-TDS-v03.pdf',
      'pa12-cf': 'https://www.3dxtech.com/wp-content/uploads/2021/03/PA12_CF-TDS-v03.pdf',
      'asa': 'https://www.3dxtech.com/wp-content/uploads/2021/03/ASA_TDS_v03.pdf',
      'petg': 'https://www.3dxtech.com/wp-content/uploads/2021/03/PETG-TDS-v03.pdf',
      'peek': 'https://www.3dxtech.com/wp-content/uploads/2021/03/PEEK-TDS-v03.pdf',
    },
    hasDefaultsFile: true,
  },

  // === AMOLEN (CN - Amazon) ===
  'amolen': {
    patterns: [
      /href="([^"]*amolen[^"]*\.pdf)"/gi,
    ],
    noTdsAvailable: true, // Amazon seller, no PDFs - specs on product pages
    hasDefaultsFile: true,
  },

  // === ANYCUBIC (CN - Shopify) ===
  'anycubic': {
    patterns: [
      /href="([^"]*nice-cdn\.com[^"]*\.pdf)"/gi,
      /href="([^"]*anycubic[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PLA_V3.0.pdf',
      'pla+': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PLA_V3.0.pdf',
      'high speed pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_High_Speed_PLA.pdf',
      'hs pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_High_Speed_PLA.pdf',
      'silk pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_SILK_PLA.pdf',
      'matte pla': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_Matte_PLA.pdf',
      'petg': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_PETG.pdf',
      'abs': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_ABS.pdf',
      'tpu': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_TPU.pdf',
      'asa': 'https://3d.nice-cdn.com/upload/file/ANYCUBIC_TDS_ASA.pdf',
    },
    hasDefaultsFile: true,
  },

  // === ATOMIC FILAMENT (US - Shopify) ===
  'atomic-filament': {
    patterns: [
      /href="([^"]*atomicfilament[^"]*\.pdf)"/gi,
      /href="([^"]*atomic[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://atomicfilament.com/pages/pla-technical-data',
      'petg': 'https://atomicfilament.com/pages/petg-technical-data',
      'abs': 'https://atomicfilament.com/pages/abs-technical-data',
      'tpu': 'https://atomicfilament.com/pages/tpu-technical-data',
    },
    hasDefaultsFile: true,
  },

  // === AZUREFILM (SI - Shopify) ===
  'azurefilm': {
    patterns: [
      /href="([^"]*azurefilm[^"]*\.pdf)"/gi,
      /href="([^"]*wp-content\/uploads[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PLA_TDS.pdf',
      'pla pro': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PLA_Pro_TDS.pdf',
      'petg': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PETG_TDS.pdf',
      'abs': 'https://azurefilm.com/wp-content/uploads/AzureFilm_ABS_TDS.pdf',
      'asa': 'https://azurefilm.com/wp-content/uploads/AzureFilm_ASA_TDS.pdf',
      'tpu': 'https://azurefilm.com/wp-content/uploads/AzureFilm_TPU_TDS.pdf',
      'pc': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PC_TDS.pdf',
      'pa': 'https://azurefilm.com/wp-content/uploads/AzureFilm_PA_TDS.pdf',
    },
    hasDefaultsFile: true,
  },

  // === BAMBU LAB (CN - Shopify Multi-Region) ===
  'bambu-lab': {
    patterns: [
      /href="([^"]*wiki\.bambulab\.com[^"]*\.pdf)"/gi,
      /href="([^"]*bambulab[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla basic': 'https://wiki.bambulab.com/en/filament/pla-basic',
      'pla matte': 'https://wiki.bambulab.com/en/filament/pla-matte',
      'pla silk': 'https://wiki.bambulab.com/en/filament/pla-silk',
      'pla tough': 'https://wiki.bambulab.com/en/filament/pla-tough',
      'petg basic': 'https://wiki.bambulab.com/en/filament/petg-basic',
      'petg cf': 'https://wiki.bambulab.com/en/filament/petg-cf',
      'abs': 'https://wiki.bambulab.com/en/filament/abs',
      'asa': 'https://wiki.bambulab.com/en/filament/asa',
      'tpu 95a': 'https://wiki.bambulab.com/en/filament/tpu-95a',
      'pa-cf': 'https://wiki.bambulab.com/en/filament/pa-cf',
      'pla-cf': 'https://wiki.bambulab.com/en/filament/pla-cf',
      'pc': 'https://wiki.bambulab.com/en/filament/pc',
      'pps-cf': 'https://wiki.bambulab.com/en/filament/pps-cf',
      'support w': 'https://wiki.bambulab.com/en/filament/support-w',
      'support g': 'https://wiki.bambulab.com/en/filament/support-g',
    },
    hasDefaultsFile: true,
  },

  // === COLORFABB (NL - Magento) ===
  'colorfabb': {
    patterns: [
      /href="([^"]*colorfabb[^"]*\.pdf)"/gi,
      /href="([^"]*\.pdf)"[^>]*>(?:[^<]*(?:TDS|Technical|Datasheet))/gi,
    ],
    knownUrls: {
      'lw-pla': 'https://colorfabb.com/datasheets/lw-pla-tds.pdf',
      'ngen': 'https://colorfabb.com/datasheets/ngen-tds.pdf',
      'ngen-flex': 'https://colorfabb.com/datasheets/ngen-flex-tds.pdf',
      'xt': 'https://colorfabb.com/datasheets/xt-tds.pdf',
      'xt-cf20': 'https://colorfabb.com/datasheets/xt-cf20-tds.pdf',
      'ht': 'https://colorfabb.com/datasheets/ht-tds.pdf',
      'pla economy': 'https://colorfabb.com/datasheets/pla-economy-tds.pdf',
      'pla-pha': 'https://colorfabb.com/datasheets/pla-pha-tds.pdf',
      'varioshore tpu': 'https://colorfabb.com/datasheets/varioshore-tpu-tds.pdf',
      'bronzefill': 'https://colorfabb.com/datasheets/bronzefill-tds.pdf',
      'copperfill': 'https://colorfabb.com/datasheets/copperfill-tds.pdf',
      'steelfill': 'https://colorfabb.com/datasheets/steelfill-tds.pdf',
      'woodfill': 'https://colorfabb.com/datasheets/woodfill-tds.pdf',
      'corkfill': 'https://colorfabb.com/datasheets/corkfill-tds.pdf',
    },
    hasDefaultsFile: true,
  },

  // === CREALITY (CN - Shopify) ===
  'creality': {
    patterns: [
      /href="([^"]*download\.creality\.com[^"]*\.pdf)"/gi,
      /href="([^"]*creality[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://download.creality.com/download/filament/TDS_PLA.pdf',
      'pla+': 'https://download.creality.com/download/filament/TDS_PLA_Plus.pdf',
      'hyper pla': 'https://download.creality.com/download/filament/TDS_Hyper_PLA.pdf',
      'petg': 'https://download.creality.com/download/filament/TDS_PETG.pdf',
      'hyper petg': 'https://download.creality.com/download/filament/TDS_Hyper_PETG.pdf',
      'abs': 'https://download.creality.com/download/filament/TDS_ABS.pdf',
      'tpu': 'https://download.creality.com/download/filament/TDS_TPU.pdf',
      'silk pla': 'https://download.creality.com/download/filament/TDS_Silk_PLA.pdf',
      'matte pla': 'https://download.creality.com/download/filament/TDS_Matte_PLA.pdf',
      'asa': 'https://download.creality.com/download/filament/TDS_ASA.pdf',
    },
    hasDefaultsFile: true,
  },

  // === DURAMIC 3D (CN - Amazon) ===
  'duramic-3d': {
    patterns: [
      /href="([^"]*duramic[^"]*\.pdf)"/gi,
    ],
    noTdsAvailable: true, // Amazon seller, no PDFs available
    hasDefaultsFile: true,
  },

  // === ELEGOO (CN - Shopify) ===
  'elegoo': {
    patterns: [
      /href="([^"]*cdn\.shopify\.com[^"]*elegoo[^"]*\.pdf)"/gi,
      /href="([^"]*elegoo[^"]*\.pdf)"/gi,
      /data-url="([^"]+\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_PLA_TDS.pdf',
      'pla+': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_PLA_Plus_TDS.pdf',
      'rapid pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Rapid_PLA_TDS.pdf',
      'silk pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Silk_PLA_TDS.pdf',
      'matte pla': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_Matte_PLA_TDS.pdf',
      'petg': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_PETG_TDS.pdf',
      'abs': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_ABS_TDS.pdf',
      'tpu': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_TPU_TDS.pdf',
      'asa': 'https://cdn.shopify.com/s/files/1/0533/0523/3813/files/ELEGOO_ASA_TDS.pdf',
    },
    hasDefaultsFile: true,
  },

  // === ERYONE (CN - Shopify) ===
  'eryone': {
    patterns: [
      /href="([^"]*eryone[^"]*\.pdf)"/gi,
      /href="([^"]*cdn\.shopify\.com[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://eryone3d.com/pages/pla-technical-specifications',
      'pla+': 'https://eryone3d.com/pages/pla-plus-technical-specifications',
      'silk pla': 'https://eryone3d.com/pages/silk-pla-technical-specifications',
      'matte pla': 'https://eryone3d.com/pages/matte-pla-technical-specifications',
      'petg': 'https://eryone3d.com/pages/petg-technical-specifications',
      'abs': 'https://eryone3d.com/pages/abs-technical-specifications',
      'tpu': 'https://eryone3d.com/pages/tpu-technical-specifications',
    },
    hasDefaultsFile: true,
  },

  // === ESUN (CN - Shopify) ===
  'esun': {
    patterns: [
      /href="([^"]*esun3d\.com[^"]*\.pdf)"/gi,
      /href="([^"]*esun[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla+': 'https://www.esun3d.com/uploads/eSUN_PLA+-Filament_TDS_V4.0.pdf',
      'pla': 'https://www.esun3d.com/uploads/eSUN_PLA-Basic_TDS_V1.0.pdf',
      'pla-matte': 'https://www.esun3d.com/uploads/eSUN_ePLA-Matte_TDS_V1.0.pdf',
      'pla-silk': 'https://www.esun3d.com/uploads/eSUN_ePLA-Silk_TDS_V1.0.pdf',
      'pla-lw': 'https://www.esun3d.com/uploads/eSUN_ePLA-LW_TDS_V1.0.pdf',
      'pla-cf': 'https://www.esun3d.com/uploads/eSUN_ePLA-CF_TDS_V1.0.pdf',
      'pla+hs': 'https://www.esun3d.com/uploads/eSUN_PLA+HS_TDS_V1.0.pdf',
      'petg': 'https://www.esun3d.com/uploads/eSUN_PETG_TDS_V4.0.pdf',
      'petg-cf': 'https://www.esun3d.com/uploads/eSUN_ePETG-CF_TDS_V1.0.pdf',
      'abs+': 'https://www.esun3d.com/uploads/eSUN_ABS+_TDS_V4.0.pdf',
      'abs-cf': 'https://www.esun3d.com/uploads/eSUN_eABS-CF_TDS_V1.0.pdf',
      'asa': 'https://www.esun3d.com/uploads/eSUN_eASA_TDS_V1.0.pdf',
      'tpu-95a': 'https://www.esun3d.com/uploads/eSUN_eTPU-95A_TDS_V4.0.pdf',
      'pa-cf': 'https://www.esun3d.com/uploads/eSUN_ePA-CF_TDS_V1.0.pdf',
      'pc': 'https://www.esun3d.com/uploads/eSUN_ePC_TDS_V1.0.pdf',
    },
    hasDefaultsFile: true,
  },

  // === EXTRUDR (AT - Custom Next.js) ===
  'extrudr': {
    patterns: [
      /href="([^"]*extrudr[^"]*\.pdf)"/gi,
      /href="([^"]*\.pdf)"[^>]*>(?:[^<]*TDS)/gi,
    ],
    knownUrls: {
      'pla': 'https://www.extrudr.com/media/tds/pla_nx2_tds_en.pdf',
      'pla-basic': 'https://www.extrudr.com/media/tds/pla_basic_tds_en.pdf',
      'biofusion': 'https://www.extrudr.com/media/tds/biofusion_tds_en.pdf',
      'greentec': 'https://www.extrudr.com/media/tds/greentec_tds_en.pdf',
      'greentec-pro': 'https://www.extrudr.com/media/tds/greentec_pro_tds_en.pdf',
      'petg': 'https://www.extrudr.com/media/tds/petg_tds_en.pdf',
      'pctg': 'https://www.extrudr.com/media/tds/pctg_tds_en.pdf',
      'abs': 'https://www.extrudr.com/media/tds/durapro_abs_tds_en.pdf',
      'asa': 'https://www.extrudr.com/media/tds/durapro_asa_tds_en.pdf',
      'pa12': 'https://www.extrudr.com/media/tds/durapro_pa12_tds_en.pdf',
      'tpu-88a': 'https://www.extrudr.com/media/tds/flex_semisoft_tds_en.pdf',
      'tpu-92a': 'https://www.extrudr.com/media/tds/flex_medium_tds_en.pdf',
      'tpu-98a': 'https://www.extrudr.com/media/tds/flex_hard_tds_en.pdf',
    },
    hasDefaultsFile: true,
  },

  // === FIBERLOGY (PL - Shopify) ===
  'fiberlogy': {
    patterns: [
      /href="([^"]*fiberlogy[^"]*\.pdf)"/gi,
      /href="([^"]*wp-content\/uploads[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'easy pla': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_EASY_PLA_TDS.pdf',
      'easy petg': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_EASY_PETG_TDS.pdf',
      'easy abs': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_EASY_ABS_TDS.pdf',
      'abs': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_ABS_TDS.pdf',
      'petg': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_PETG_TDS.pdf',
      'pla': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_PLA_TDS.pdf',
      'fibersilk': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_FIBERSILK_TDS.pdf',
      'matte pla': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_MATTE_PLA_TDS.pdf',
      'pa12+cf15': 'https://fiberlogy.com/wp-content/uploads/2023/01/FIBERLOGY_PA12_CF15_TDS.pdf',
    },
    hasDefaultsFile: true,
  },

  // === FILLAMENTUM (CZ - Shopify) ===
  'fillamentum': {
    patterns: [
      /href="([^"]*fillamentum[^"]*\.pdf)"/gi,
      /href="([^"]*wp-content\/uploads[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla extrafill': 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_PLA-Extrafill_26082019.pdf',
      'pla crystal clear': 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_PLA-Crystal-Clear_26082019.pdf',
      'abs extrafill': 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_ABS-Extrafill_26082019.pdf',
      'asa extrafill': 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_ASA-Extrafill_26082019.pdf',
      'petg': 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_PETG_26082019.pdf',
      'cpe hg100': 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_CPE-HG100_26082019.pdf',
      'flexfill 92a': 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Flexfill-92A_26082019.pdf',
      'flexfill 98a': 'https://fillamentum.com/wp-content/uploads/2020/10/Technical-Data-Sheet_Flexfill-98A_26082019.pdf',
      'nylon cf15': 'https://fillamentum.com/wp-content/uploads/2020/10/TDS_Nylon-CF15.pdf',
      'nylon fo25': 'https://fillamentum.com/wp-content/uploads/2020/10/TDS_Nylon-FO25.pdf',
    },
    hasDefaultsFile: true,
  },

  // === FORMFUTURA (NL - Odoo) ===
  'formfutura': {
    patterns: [
      /href="([^"]*formfutura[^"]*\.pdf)"/gi,
      /href="([^"]*datasheets[^"]*\.pdf)"/gi,
      /href="([^"]*nice-cdn[^"]*formfutura[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'easyfil epla': 'https://www.formfutura.com/web/content/256521',
      'volcano pla': 'https://www.formfutura.com/datasheets/volcano-pla-tds.pdf',
      'premium pla': 'https://www.formfutura.com/datasheets/premium-pla-tds.pdf',
      'tough pla': 'https://www.formfutura.com/datasheets/tough-pla-tds.pdf',
      'hdglass': 'https://www.formfutura.com/datasheets/hdglass-tds.pdf',
      'apollox': 'https://www.formfutura.com/datasheets/apollox-tds.pdf',
      'python flex 90a': 'https://www.formfutura.com/datasheets/python-flex-90a-tds.pdf',
      'python flex 98a': 'https://www.formfutura.com/datasheets/python-flex-98a-tds.pdf',
      'styx pa6': 'https://3d.nice-cdn.com/upload/file/formfutura-tds-styxpa6.pdf',
    },
    hasDefaultsFile: true,
  },

  // === FUSION FILAMENTS (US - Shopify) ===
  'fusion-filaments': {
    patterns: [
      /href="([^"]*fusion[^"]*\.pdf)"/gi,
    ],
    noTdsAvailable: true, // Specs on product pages, no PDFs
    hasDefaultsFile: true,
  },

  // === GEEETECH (CN - Shopify) ===
  'geeetech': {
    patterns: [
      /href="([^"]*geeetech[^"]*\.pdf)"/gi,
    ],
    noTdsAvailable: true, // Chinese brand, specs on product pages
    hasDefaultsFile: true,
  },

  // === GIZMO DORKS (US - BigCommerce) ===
  'gizmo-dorks': {
    patterns: [
      /href="([^"]*gizmodorks[^"]*\.pdf)"/gi,
    ],
    noTdsAvailable: true, // Specs on product pages
    hasDefaultsFile: true,
  },

  // === HATCHBOX (US - Amazon) ===
  'hatchbox': {
    patterns: [
      /href="([^"]*hatchbox[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://www.hatchbox3d.com/pages/pla-specifications',
      'petg': 'https://www.hatchbox3d.com/pages/petg-specifications',
      'abs': 'https://www.hatchbox3d.com/pages/abs-specifications',
      'tpu': 'https://www.hatchbox3d.com/pages/tpu-specifications',
    },
    hasDefaultsFile: true,
  },

  // === IC3D (US - Shopify) ===
  'ic3d-printers': {
    patterns: [
      /href="([^"]*ic3d[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://ic3d.com/pages/pla-technical-data',
      'petg': 'https://ic3d.com/pages/petg-technical-data',
      'abs': 'https://ic3d.com/pages/abs-technical-data',
    },
    hasDefaultsFile: true,
  },

  // === KINGROON (CN - Shopify) ===
  'kingroon': {
    patterns: [
      /href="([^"]*kingroon[^"]*\.pdf)"/gi,
    ],
    noTdsAvailable: true, // Specs embedded in HTML tables
    hasDefaultsFile: true,
  },

  // === MATTER3D (CA - Shopify) ===
  'matter3d': {
    patterns: [
      /href="([^"]*matter3d[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://matter3d.com/pages/pla-technical-data',
      'petg': 'https://matter3d.com/pages/petg-technical-data',
    },
    hasDefaultsFile: true,
  },

  // === NINJATEK (US - Shopify) ===
  'ninjatek': {
    patterns: [
      /href="([^"]*ninjatek[^"]*\.pdf)"/gi,
      /href="([^"]*wp-content\/uploads[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'ninjaflex': 'https://ninjatek.com/wp-content/uploads/NinjaFlex-TDS.pdf',
      'ninjaflex 85a': 'https://ninjatek.com/wp-content/uploads/NinjaFlex-TDS.pdf',
      'cheetah': 'https://ninjatek.com/wp-content/uploads/Cheetah-TDS.pdf',
      'cheetah 95a': 'https://ninjatek.com/wp-content/uploads/Cheetah-TDS.pdf',
      'armadillo': 'https://ninjatek.com/wp-content/uploads/Armadillo-TDS.pdf',
      'armadillo 75d': 'https://ninjatek.com/wp-content/uploads/Armadillo-TDS.pdf',
      'chinchilla': 'https://ninjatek.com/wp-content/uploads/Chinchilla-TDS.pdf',
      'eel': 'https://ninjatek.com/wp-content/uploads/Eel-TDS.pdf',
    },
    hasDefaultsFile: true,
  },

  // === NUMAKERS (US - Shopify) ===
  'numakers': {
    patterns: [
      /href="([^"]*numakers[^"]*\.pdf)"/gi,
    ],
    noTdsAvailable: true, // Uses "Cheat Sheets" for slicer settings, not TDS
    hasDefaultsFile: true,
  },

  // === OVERTURE (CN - Amazon) ===
  'overture': {
    patterns: [
      /href="([^"]*overture[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://overture3d.com/pages/pla-specifications',
      'petg': 'https://overture3d.com/pages/petg-specifications',
      'abs': 'https://overture3d.com/pages/abs-specifications',
      'tpu': 'https://overture3d.com/pages/tpu-specifications',
    },
    hasDefaultsFile: true,
  },

  // === PARAMOUNT 3D (US - Amazon) ===
  'paramount-3d': {
    patterns: [
      /href="([^"]*paramount[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://paramount3d.com/pages/pla-technical-specifications',
      'petg': 'https://paramount3d.com/pages/petg-technical-specifications',
      'abs': 'https://paramount3d.com/pages/abs-technical-specifications',
    },
    hasDefaultsFile: true,
  },

  // === POLYMAKER (CN/US - Shopify Multi-Region) ===
  'polymaker': {
    patterns: [
      /href="([^"]*cdn\.shopify\.com[^"]*polymaker[^"]*\.pdf)"/gi,
      /href="([^"]*polymaker[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'polyterra pla': 'https://us.polymaker.com/cdn/shop/files/PolyTerra_PLA_TDS.pdf',
      'panchroma matte': 'https://us.polymaker.com/cdn/shop/files/Panchroma_Matte_TDS.pdf',
      'polylite pla': 'https://us.polymaker.com/cdn/shop/files/PolyLite_PLA_TDS.pdf',
      'polymax pla': 'https://us.polymaker.com/cdn/shop/files/PolyMax_PLA_TDS.pdf',
      'polysonic pla': 'https://us.polymaker.com/cdn/shop/files/PolySonic_PLA_TDS.pdf',
      'polylite petg': 'https://us.polymaker.com/cdn/shop/files/PolyLite_PETG_TDS.pdf',
      'polymax petg': 'https://us.polymaker.com/cdn/shop/files/PolyMax_PETG_TDS.pdf',
      'polylite abs': 'https://us.polymaker.com/cdn/shop/files/PolyLite_ABS_TDS.pdf',
      'polylite asa': 'https://us.polymaker.com/cdn/shop/files/PolyLite_ASA_TDS.pdf',
      'polylite pc': 'https://us.polymaker.com/cdn/shop/files/PolyLite_PC_TDS.pdf',
      'polyflex tpu90': 'https://us.polymaker.com/cdn/shop/files/PolyFlex_TPU90_TDS.pdf',
      'polyflex tpu95': 'https://us.polymaker.com/cdn/shop/files/PolyFlex_TPU95_TDS.pdf',
      'fiberon pa12-cf': 'https://us.polymaker.com/cdn/shop/files/Fiberon_PA12-CF_TDS.pdf',
      'fiberon pa6-cf': 'https://us.polymaker.com/cdn/shop/files/Fiberon_PA6-CF_TDS.pdf',
      'ht-pla': 'https://us.polymaker.com/cdn/shop/files/HT-PLA_TDS.pdf',
      'polycast': 'https://us.polymaker.com/cdn/shop/files/PolyCast_TDS.pdf',
      'polysmooth': 'https://us.polymaker.com/cdn/shop/files/PolySmooth_TDS.pdf',
    },
    hasDefaultsFile: true,
  },

  // === PROTO-PASTA (US - Shopify) ===
  'proto-pasta': {
    patterns: [
      /href="([^"]*protopasta[^"]*\.pdf)"/gi,
      /href="([^"]*\.pdf)"[^>]*>(?:[^<]*(?:Technical|Safety|Material))/gi,
    ],
    knownUrls: {
      // All Proto-Pasta products link to consolidated TDS page
      'default': 'https://proto-pasta.com/pages/technical-data-sheets',
    },
    hasDefaultsFile: true,
  },

  // === PRUSAMENT (CZ - WooCommerce) ===
  'prusament': {
    patterns: [
      /href="([^"]*prusament\.com[^"]*\.pdf)"/gi,
      /href="([^"]*prusa3d\.com[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://prusament.com/media/datasheet/Prusament_PLA_TDS_EN.pdf',
      'rpla': 'https://prusament.com/media/datasheet/Prusament_rPLA_TDS_EN.pdf',
      'petg': 'https://prusament.com/media/datasheet/Prusament_PETG_TDS_EN.pdf',
      'petg-cf': 'https://prusament.com/media/datasheet/Prusament_PETG_CF_TDS_EN.pdf',
      'asa': 'https://prusament.com/media/datasheet/Prusament_ASA_TDS_EN.pdf',
      'pc blend': 'https://prusament.com/media/datasheet/Prusament_PC_Blend_TDS_EN.pdf',
      'pa11-cf': 'https://prusament.com/media/datasheet/Prusament_PA11CF_TDS_EN.pdf',
      'pp-cf': 'https://prusament.com/media/datasheet/Prusament_PPCF_TDS_EN.pdf',
      'pp-gf': 'https://prusament.com/media/datasheet/Prusament_PPGF_TDS_EN.pdf',
      'tpu': 'https://prusament.com/media/datasheet/Prusament_TPU_TDS_EN.pdf',
    },
    hasDefaultsFile: true,
  },

  // === PUSH PLASTIC (US - Shopify) ===
  'push-plastic': {
    patterns: [
      /href="([^"]*pushplastic[^"]*\.pdf)"/gi,
      /href="([^"]*\.pdf)"[^>]*>(?:[^<]*TDS)/gi,
    ],
    knownUrls: {
      'pla': 'https://www.pushplastic.com/pages/pla-technical-data-sheet',
      'petg': 'https://www.pushplastic.com/pages/petg-technical-data-sheet',
      'abs': 'https://www.pushplastic.com/pages/abs-technical-data-sheet',
      'asa': 'https://www.pushplastic.com/pages/asa-technical-data-sheet',
      'tpu': 'https://www.pushplastic.com/pages/tpu-technical-data-sheet',
      'nylon': 'https://www.pushplastic.com/pages/nylon-technical-data-sheet',
      'pc': 'https://www.pushplastic.com/pages/polycarbonate-technical-data-sheet',
      'hips': 'https://www.pushplastic.com/pages/hips-technical-data-sheet',
      'pva': 'https://www.pushplastic.com/pages/pva-technical-data-sheet',
      'cf-pla': 'https://www.pushplastic.com/pages/cf-pla-technical-data-sheet',
      'cf-petg': 'https://www.pushplastic.com/pages/cf-petg-technical-data-sheet',
    },
    hasDefaultsFile: true,
  },

  // === RECREUS (ES - Shopify) ===
  'recreus': {
    patterns: [
      /href="([^"]*recreus[^"]*\.pdf)"/gi,
      /href="([^"]*filaflex[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'filaflex': 'https://recreus.com/wp-content/uploads/FilaFlex_TDS.pdf',
      'filaflex 82a': 'https://recreus.com/wp-content/uploads/FilaFlex_82A_TDS.pdf',
      'filaflex 70a': 'https://recreus.com/wp-content/uploads/FilaFlex_70A_TDS.pdf',
      'filaflex 60a': 'https://recreus.com/wp-content/uploads/FilaFlex_60A_TDS.pdf',
    },
    hasDefaultsFile: true,
  },

  // === SIRAYA TECH (US - Shopify) - Resin/Filament ===
  'siraya-tech': {
    patterns: [
      /href="([^"]*sirayatech[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://siraya.tech/pages/pla-filament-specifications',
      'petg': 'https://siraya.tech/pages/petg-filament-specifications',
    },
    hasDefaultsFile: true,
  },

  // === SOVOL (CN - Shopify) ===
  'sovol': {
    patterns: [
      /href="([^"]*sovol[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://sovol3d.com/pages/pla-specifications',
      'petg': 'https://sovol3d.com/pages/petg-specifications',
    },
    hasDefaultsFile: true,
  },

  // === SPECTRUM FILAMENTS (PL - Custom) ===
  'spectrum-filaments': {
    patterns: [
      /href="([^"]*spectrum[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://spectrumfilaments.com/pages/pla-technical-data',
      'petg': 'https://spectrumfilaments.com/pages/petg-technical-data',
      'abs': 'https://spectrumfilaments.com/pages/abs-technical-data',
      'asa': 'https://spectrumfilaments.com/pages/asa-technical-data',
    },
    hasDefaultsFile: true,
  },

  // === SUNLU (CN - Shopify) ===
  'sunlu': {
    patterns: [
      /href="([^"]*sunlu[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://www.sunlu.com/downloads/SUNLU_PLA_TDS.pdf',
      'pla+': 'https://www.sunlu.com/downloads/SUNLU_PLA_Plus_TDS.pdf',
      'petg': 'https://www.sunlu.com/downloads/SUNLU_PETG_TDS.pdf',
      'abs': 'https://www.sunlu.com/downloads/SUNLU_ABS_TDS.pdf',
      'tpu': 'https://www.sunlu.com/downloads/SUNLU_TPU_TDS.pdf',
      'silk pla': 'https://www.sunlu.com/downloads/SUNLU_Silk_PLA_TDS.pdf',
    },
    hasDefaultsFile: true,
  },

  // === TREED FILAMENTS (IT - Custom) ===
  'treed-filaments': {
    patterns: [
      /href="([^"]*treed[^"]*\.pdf)"/gi,
      /href="([^"]*scheda[^"]*tecnica[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://treed-filaments.com/pages/pla-technical-data',
      'petg': 'https://treed-filaments.com/pages/petg-technical-data',
    },
    hasDefaultsFile: true,
  },

  // === ULTIMAKER (NL - Shopify) ===
  'ultimaker': {
    patterns: [
      /href="([^"]*ultimaker[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://ultimaker.com/download/tds/pla',
      'petg': 'https://ultimaker.com/download/tds/petg',
      'abs': 'https://ultimaker.com/download/tds/abs',
      'cpe': 'https://ultimaker.com/download/tds/cpe',
      'tpu 95a': 'https://ultimaker.com/download/tds/tpu-95a',
      'nylon': 'https://ultimaker.com/download/tds/nylon',
      'pc': 'https://ultimaker.com/download/tds/pc',
      'pp': 'https://ultimaker.com/download/tds/pp',
      'pva': 'https://ultimaker.com/download/tds/pva',
    },
    hasDefaultsFile: true,
  },

  // === VOXELPLA (US - Shopify) ===
  'voxelpla': {
    patterns: [
      /href="([^"]*voxelpla[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://voxelpla.com/pages/pla-specifications',
    },
    hasDefaultsFile: true,
  },

  // === YOUSU (CN - Amazon) ===
  'yousu': {
    patterns: [
      /href="([^"]*yousu[^"]*\.pdf)"/gi,
    ],
    noTdsAvailable: true, // Amazon seller, specs on product pages
    hasDefaultsFile: true,
  },

  // === ZIRO (CN - Shopify) ===
  'ziro': {
    patterns: [
      /href="([^"]*ziro[^"]*\.pdf)"/gi,
    ],
    knownUrls: {
      'pla': 'https://ziro3d.com/pages/pla-specifications',
      'petg': 'https://ziro3d.com/pages/petg-specifications',
      'tpu': 'https://ziro3d.com/pages/tpu-specifications',
    },
    hasDefaultsFile: true,
  },
};

// Complete list of all 43 Sync Manager brands for TDS discovery
const PRIORITY_TDS_BRANDS = [
  // All brands from BRAND_SPECIFIC_FUNCTIONS in brand-sync-config.ts
  '3d-fuel', '3dhojor', '3dxtech', 'amolen', 'anycubic', 'atomic-filament', 'azurefilm', 'bambu-lab',
  'colorfabb', 'creality', 'duramic-3d', 'elegoo', 'eryone', 'esun', 'extrudr',
  'fiberlogy', 'fillamentum', 'formfutura', 'fusion-filaments',
  'geeetech', 'gizmo-dorks', 'hatchbox', 'ic3d-printers', 'kingroon', 'matter3d',
  'ninjatek', 'numakers', 'overture', 'paramount-3d', 'polymaker',
  'proto-pasta', 'prusament', 'push-plastic', 'recreus', 'siraya-tech',
  'sovol', 'spectrum-filaments', 'sunlu', 'treed-filaments', 'ultimaker', 'voxelpla',
  'yousu', 'ziro'
];

/**
 * Try to match product title to known TDS URL for a brand
 */
function matchKnownTdsUrl(productTitle: string, brandSlug: string): string | null {
  const config = BRAND_TDS_CONFIGS[brandSlug];
  if (!config?.knownUrls) return null;
  
  const titleLower = productTitle.toLowerCase();
  
  // Sort by pattern length (longest first) for most specific match
  const sortedPatterns = Object.entries(config.knownUrls)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sortedPatterns) {
    if (titleLower.includes(pattern)) {
      return url;
    }
  }
  
  return null;
}

/**
 * Get brand-specific regex patterns
 */
function getBrandPatterns(brandSlug: string): RegExp[] {
  return BRAND_TDS_CONFIGS[brandSlug]?.patterns || [];
}

// Extract TDS URL from HTML content
function extractTdsUrl(html: string, brandSlug: string, baseUrl: string): string | null {
  // First try brand-specific patterns
  const brandPatterns = getBrandPatterns(brandSlug);
  for (const pattern of brandPatterns) {
    const matches = html.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      let url = match[1];
      if (url && !url.startsWith('http')) {
        try {
          url = new URL(url, baseUrl).href;
        } catch {
          continue;
        }
      }
      if (url && isValidTdsUrl(url)) {
        return url;
      }
    }
  }

  // Then try generic patterns
  for (const pattern of TDS_PATTERNS) {
    const matches = html.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      let url = match[1];
      if (url && !url.startsWith('http')) {
        try {
          url = new URL(url, baseUrl).href;
        } catch {
          continue;
        }
      }
      if (url && isValidTdsUrl(url)) {
        return url;
      }
    }
  }

  // Look for JSON-LD structured data with document links
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
        const data = JSON.parse(jsonContent);
        const documentUrl = findDocumentInJsonLd(data);
        if (documentUrl) return documentUrl;
      } catch {}
    }
  }

  return null;
}

// Check if URL looks like a valid TDS PDF
function isValidTdsUrl(url: string): boolean {
  const lower = url.toLowerCase();
  
  // Must be a PDF or document link
  if (!lower.includes('.pdf') && !lower.includes('drive.google') && !lower.includes('dropbox')) {
    return false;
  }
  
  // Exclude common non-TDS PDFs
  const excludePatterns = [
    'invoice', 'order', 'receipt', 'manual', 'guide', 'instruction',
    'warranty', 'terms', 'privacy', 'cookie', 'return', 'sds', 'safety'
  ];
  
  for (const exclude of excludePatterns) {
    if (lower.includes(exclude)) {
      return false;
    }
  }
  
  return true;
}

// Find document URL in JSON-LD data
function findDocumentInJsonLd(data: any): string | null {
  if (!data) return null;
  
  if (typeof data === 'string' && data.includes('.pdf')) {
    return data;
  }
  
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findDocumentInJsonLd(item);
      if (result) return result;
    }
  }
  
  if (typeof data === 'object') {
    for (const key of ['document', 'datasheet', 'technicalDocument', 'specification', 'pdf', 'url']) {
      if (data[key] && typeof data[key] === 'string' && data[key].includes('.pdf')) {
        return data[key];
      }
    }
    for (const value of Object.values(data)) {
      const result = findDocumentInJsonLd(value);
      if (result) return result;
    }
  }
  
  return null;
}

// Validate TDS URL is accessible
async function validateTdsUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { 
      brandSlug, 
      limit = 50, 
      dryRun = true, 
      validateUrls = false,
      all = false,  // Multi-brand discovery mode
      limitPerBrand = 25  // Limit per brand in multi-brand mode
    } = await req.json();

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Multi-brand discovery mode
    if (all) {
      console.log(`[discover-brand-tds] Starting multi-brand TDS discovery for ${PRIORITY_TDS_BRANDS.length} brands`);
      
      const allResults: Record<string, { found: number; failed: number; results: TdsDiscoveryResult[] }> = {};
      let totalFound = 0;
      let totalFailed = 0;
      
      for (const slug of PRIORITY_TDS_BRANDS) {
        console.log(`[discover-brand-tds] Processing brand: ${slug}`);
        
        // Get brand info
        const { data: brand } = await supabase
          .from('automated_brands')
          .select('brand_name, base_url')
          .eq('brand_slug', slug)
          .single();
        
        if (!brand) {
          console.log(`[discover-brand-tds] Brand not found: ${slug}`);
          continue;
        }
        
        // Get filaments missing TDS
        const { data: filaments } = await supabase
          .from('filaments')
          .select('id, product_title, product_url')
          .ilike('vendor', brand.brand_name)
          .is('tds_url', null)
          .not('product_url', 'is', null)
          .limit(limitPerBrand);
        
        if (!filaments?.length) {
          console.log(`[discover-brand-tds] No filaments needing TDS for ${slug}`);
          continue;
        }
        
        const brandResults: TdsDiscoveryResult[] = [];
        let brandFound = 0;
        let brandFailed = 0;
        
        for (const filament of filaments) {
          const result: TdsDiscoveryResult = {
            filamentId: filament.id,
            productTitle: filament.product_title,
            productUrl: filament.product_url,
            tdsUrl: null,
            source: 'none',
            success: false,
          };
          
          // Step 1: Try known TDS URL patterns (no API call needed)
          const knownUrl = matchKnownTdsUrl(filament.product_title, slug);
          if (knownUrl) {
            if (validateUrls) {
              const isValid = await validateTdsUrl(knownUrl);
              if (isValid) {
                result.tdsUrl = knownUrl;
                result.source = 'known_pattern';
              }
            } else {
              result.tdsUrl = knownUrl;
              result.source = 'known_pattern';
            }
          }
          
          // Step 2: Scrape product page if no known URL found
          if (!result.tdsUrl && filament.product_url) {
            try {
              const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${firecrawlKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: filament.product_url,
                  formats: ['html'],
                  onlyMainContent: false,
                }),
              });

              if (scrapeResponse.ok) {
                const scrapeData = await scrapeResponse.json();
                const html = scrapeData.data?.html || '';
                const tdsUrl = extractTdsUrl(html, slug, brand.base_url);
                
                if (tdsUrl) {
                  if (validateUrls) {
                    const isValid = await validateTdsUrl(tdsUrl);
                    if (isValid) {
                      result.tdsUrl = tdsUrl;
                      result.source = 'product_page';
                    }
                  } else {
                    result.tdsUrl = tdsUrl;
                    result.source = 'product_page';
                  }
                }
              }
              
              // Rate limiting
              await new Promise(r => setTimeout(r, 1000));
            } catch (err) {
              result.error = err instanceof Error ? err.message : 'Scrape failed';
            }
          }
          
          if (result.tdsUrl) {
            result.success = true;
            brandFound++;
            totalFound++;
            
            if (!dryRun) {
              await supabase
                .from('filaments')
                .update({ tds_url: result.tdsUrl })
                .eq('id', filament.id);
            }
          } else {
            result.error = result.error || 'No TDS URL found';
            brandFailed++;
            totalFailed++;
          }
          
          brandResults.push(result);
        }
        
        allResults[slug] = { found: brandFound, failed: brandFailed, results: brandResults };
        console.log(`[discover-brand-tds] ${slug}: ${brandFound} found, ${brandFailed} failed`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          mode: 'multi_brand',
          brandsProcessed: Object.keys(allResults).length,
          totalFound,
          totalFailed,
          dryRun,
          results: allResults,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Single brand discovery mode
    if (!brandSlug) {
      return new Response(
        JSON.stringify({ success: false, error: 'brandSlug is required (or use all: true for multi-brand mode)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[discover-brand-tds] Starting TDS discovery for ${brandSlug}, limit: ${limit}, dryRun: ${dryRun}`);

    // Get brand configuration
    const { data: brand, error: brandError } = await supabase
      .from('automated_brands')
      .select('brand_name, base_url')
      .eq('brand_slug', brandSlug)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ success: false, error: `Brand not found: ${brandSlug}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get filaments missing TDS URLs
    const { data: filaments, error: filamentsError } = await supabase
      .from('filaments')
      .select('id, product_title, product_url')
      .ilike('vendor', brand.brand_name)
      .is('tds_url', null)
      .not('product_url', 'is', null)
      .limit(limit);

    if (filamentsError) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch filaments: ${filamentsError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[discover-brand-tds] Found ${filaments?.length || 0} filaments missing TDS`);

    const results: TdsDiscoveryResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const filament of filaments || []) {
      const result: TdsDiscoveryResult = {
        filamentId: filament.id,
        productTitle: filament.product_title,
        productUrl: filament.product_url,
        tdsUrl: null,
        source: 'none',
        success: false,
      };

      if (!filament.product_url) {
        result.error = 'No product URL';
        results.push(result);
        failCount++;
        continue;
      }

      // Step 1: Try known TDS URL patterns first (no API call)
      const knownUrl = matchKnownTdsUrl(filament.product_title, brandSlug);
      if (knownUrl) {
        if (validateUrls) {
          const isValid = await validateTdsUrl(knownUrl);
          if (isValid) {
            result.tdsUrl = knownUrl;
            result.source = 'known_pattern';
          }
        } else {
          result.tdsUrl = knownUrl;
          result.source = 'known_pattern';
        }
      }

      // Step 2: Scrape product page if no known URL
      if (!result.tdsUrl) {
        try {
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: filament.product_url,
              formats: ['html'],
              onlyMainContent: false,
            }),
          });

          if (!scrapeResponse.ok) {
            result.error = `Scrape failed: ${scrapeResponse.status}`;
            results.push(result);
            failCount++;
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }

          const scrapeData = await scrapeResponse.json();
          const html = scrapeData.data?.html || '';
          const tdsUrl = extractTdsUrl(html, brandSlug, brand.base_url);

          if (tdsUrl) {
            result.tdsUrl = tdsUrl;
            result.source = 'product_page';
            
            if (validateUrls) {
              const isValid = await validateTdsUrl(tdsUrl);
              if (!isValid) {
                result.error = 'TDS URL validation failed';
                result.tdsUrl = null;
              }
            }
          }
        } catch (err) {
          result.error = err instanceof Error ? err.message : 'Unknown error';
        }
      }

      if (result.tdsUrl) {
        result.success = true;
        successCount++;

        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update({ tds_url: result.tdsUrl })
            .eq('id', filament.id);

          if (updateError) {
            console.error(`[discover-brand-tds] Failed to update filament ${filament.id}:`, updateError);
          }
        }
      } else {
        result.error = result.error || 'No TDS URL found';
        failCount++;
      }

      results.push(result);
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`[discover-brand-tds] Complete: ${successCount} found, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        brandSlug,
        totalProcessed: results.length,
        tdsFound: successCount,
        tdsFailed: failCount,
        dryRun,
        results: results.slice(0, 100),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[discover-brand-tds] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

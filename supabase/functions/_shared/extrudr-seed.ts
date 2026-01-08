/**
 * Extrudr Product Seed Data
 * Premium Austrian filament manufacturer - eco-friendly cardboard spools
 * 
 * Data sourced from CSV export - curated product catalog
 * Use this as single source of truth instead of Firecrawl scraping
 */

export interface ExtrudrSeedProduct {
  material: string;
  filament: string;
  color: string;
  productUrl: string;
  imageUrl: string;
  colorHex: string | null;
}

/**
 * Parse hex from various formats:
 * - Simple: "#abbc2e"
 * - JSON object: {"hex": "#E3D9C6", ...}
 * - Empty string for transparent
 */
function parseHex(raw: string | null | undefined): string | null {
  if (!raw || raw.trim() === '') return null;
  
  // If it's already a simple hex
  if (raw.startsWith('#') && raw.length <= 7) {
    return raw.toUpperCase();
  }
  
  // If it's a JSON object with hex field
  if (raw.includes('"hex"')) {
    const match = raw.match(/"hex"\s*:\s*"(#[A-Fa-f0-9]{6})"/);
    if (match) return match[1].toUpperCase();
  }
  
  return null;
}

/**
 * Curated product seed from CSV
 * Deduplicated by (filament|color) combination
 */
export const EXTRUDR_PRODUCT_SEED: ExtrudrSeedProduct[] = [
  // ============================================================================
  // BioFusion (PLA Silk) - 11 colors
  // ============================================================================
  { material: 'BioFusion', filament: 'BioFusion', color: 'venom green', productUrl: 'https://www.extrudr.com/en/inlt/products/biofusion/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/09/201907_BioFusion_venom_green.jpg', colorHex: '#ABBC2E' },
  { material: 'BioFusion', filament: 'BioFusion', color: 'epic purple', productUrl: 'https://www.extrudr.com/en/inlt/products/biofusion/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/12/201912_BioFusion_DeepPurple.jpg', colorHex: '#6633CC' },
  { material: 'BioFusion', filament: 'BioFusion', color: 'inca gold', productUrl: 'https://www.extrudr.com/en/inlt/products/biofusion/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/08/201907_BioFusion_IncaGold.jpg', colorHex: '#E3BB33' },
  { material: 'BioFusion', filament: 'BioFusion', color: 'steampunk copper', productUrl: 'https://www.extrudr.com/en/inlt/products/biofusion/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/07/201907_BioFusion_SteampunkCopper.jpg', colorHex: '#DB8447' },
  { material: 'BioFusion', filament: 'BioFusion', color: 'quicksilver', productUrl: 'https://www.extrudr.com/en/inlt/products/biofusion/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/07/201907_BioFusion_Quicksilver.jpg', colorHex: '#B1BBCB' },
  { material: 'BioFusion', filament: 'BioFusion', color: 'cherry red', productUrl: 'https://www.extrudr.com/en/inlt/products/biofusion/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/07/201907_BioFusion_CherryRed.jpg', colorHex: '#DC565E' },
  { material: 'BioFusion', filament: 'BioFusion', color: 'blue fire', productUrl: 'https://www.extrudr.com/en/inlt/products/biofusion/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/07/201907_BioFusion_BlueFire.jpg', colorHex: '#416CD6' },
  { material: 'BioFusion', filament: 'BioFusion', color: 'reptile green', productUrl: 'https://www.extrudr.com/en/inlt/products/biofusion/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/07/201907_BioFusion_ReptileGreen.jpg', colorHex: '#00AA48' },
  { material: 'BioFusion', filament: 'BioFusion', color: 'metallic grey', productUrl: 'https://www.extrudr.com/en/inlt/products/biofusion/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/07/201907_BioFusion_MetallicGrey.jpg', colorHex: '#7A7E89' },
  { material: 'BioFusion', filament: 'BioFusion', color: 'jet black', productUrl: 'https://www.extrudr.com/en/inlt/products/biofusion/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/07/201907_BioFusion_JetBlack.jpg', colorHex: '#000000' },
  { material: 'BioFusion', filament: 'BioFusion', color: 'arctic white', productUrl: 'https://www.extrudr.com/en/inlt/products/biofusion/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/07/201907_BioFusion_ArcticWhite.jpg', colorHex: '#E5F1EC' },

  // ============================================================================
  // DuraPro ABS - 10 colors
  // ============================================================================
  { material: 'DuraPro ABS', filament: 'DuraPro ABS', color: 'white', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-abs/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/09/201905_ABS_DuraPro_white_111br3b.jpg', colorHex: '#FFFFFF' },
  { material: 'DuraPro ABS', filament: 'DuraPro ABS', color: 'silver', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-abs/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ABS_DuraPro_silver.jpg', colorHex: '#C4C5C6' },
  { material: 'DuraPro ABS', filament: 'DuraPro ABS', color: 'nature', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-abs/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ABS_DuraPro_natural.jpg', colorHex: '#E3D9C6' },
  { material: 'DuraPro ABS', filament: 'DuraPro ABS', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-abs/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ABS_DuraPro_black.jpg', colorHex: '#000000' },
  { material: 'DuraPro ABS', filament: 'DuraPro ABS', color: 'anthracite', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-abs/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ABS_DuraPro_anthracite.jpg', colorHex: '#383E42' },
  { material: 'DuraPro ABS', filament: 'DuraPro ABS', color: 'metallic', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-abs/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ABS_DuraPro_metallic.jpg', colorHex: '#4D4C50' },
  { material: 'DuraPro ABS', filament: 'DuraPro ABS', color: 'grey', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-abs/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ABS_DuraPro_grey.jpg', colorHex: '#C6C5BA' },
  { material: 'DuraPro ABS', filament: 'DuraPro ABS', color: 'blue', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-abs/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ABS_DuraPro_blue.jpg', colorHex: '#4B4EA2' },
  { material: 'DuraPro ABS', filament: 'DuraPro ABS', color: 'red', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-abs/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ABS_DuraPro_red.jpg', colorHex: '#B9333B' },

  // ============================================================================
  // DuraPro ABS CF - 1 color (single color specialty)
  // ============================================================================
  { material: 'DuraPro ABS CF', filament: 'DuraPro ABS CF', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-abs-cf/', imageUrl: 'https://s3.extrudr.com/extrudr-media/products/9010241082971-3840px-durapro_abs_cf_black-0027_15a9f139.png', colorHex: '#000000' },

  // ============================================================================
  // DuraPro ASA - 15 colors
  // ============================================================================
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ASA_black.jpg', colorHex: '#000000' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'white', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ASA_white.jpg', colorHex: '#FFFFFF' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'grey', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ASA_grey.jpg', colorHex: '#C6C5BA' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'nature', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ASA_natural.jpg', colorHex: '#E3D9C6' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'silver', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/04/201905_ABS_DuraPro_silver.jpg', colorHex: '#C4C5C6' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'anthracite', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ASA_anthracite.jpg', colorHex: '#383E42' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'metallic', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/06/201905_ASA_metallic.jpg', colorHex: '#4D4C50' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'blue', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/products/9010241202140_DuraPro_ASA__blue_1.75_mm_750_g.jpg.600x521_q75_crop_26e5c329.jpg', colorHex: '#4B4EA2' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'red', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/03/202003_ASA_red.jpg', colorHex: '#B9333B' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'yellow', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/03/202003_ASA_yellow.jpg', colorHex: '#F4D719' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'neon yellow', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/03/202003_ASA_neon_yellow.jpg', colorHex: '#F1F02D' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'neon orange', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/03/202003_ASA_neon_orange.jpg', colorHex: '#FF871A' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'neon green', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/03/202003_ASA_neon_green.jpg', colorHex: '#98FA42' },
  { material: 'DuraPro ASA', filament: 'DuraPro ASA', color: 'emerald green', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-asa/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/03/202003_ASA_green.jpg', colorHex: '#289438' },

  // ============================================================================
  // FLAX (PLA-Wood) - 1 color (single color specialty)
  // ============================================================================
  { material: 'FLAX', filament: 'FLAX', color: 'nature', productUrl: 'https://www.extrudr.com/en/inlt/products/flax/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_FLAX_natural.jpg', colorHex: '#E3D9C6' },

  // ============================================================================
  // GreenTEC (Bio) - 9 colors
  // ============================================================================
  { material: 'GreenTEC', filament: 'GreenTEC', color: 'white', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-white.jpg', colorHex: '#FFFFFF' },
  { material: 'GreenTEC', filament: 'GreenTEC', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-black.jpg', colorHex: '#000000' },
  { material: 'GreenTEC', filament: 'GreenTEC', color: 'nature', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-natural_XUC11Pu.jpg', colorHex: '#E3D9C6' },
  { material: 'GreenTEC', filament: 'GreenTEC', color: 'anthracite', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-anthracite.jpg', colorHex: '#383E42' },
  { material: 'GreenTEC', filament: 'GreenTEC', color: 'silver', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-silver.jpg', colorHex: '#C4C5C6' },
  { material: 'GreenTEC', filament: 'GreenTEC', color: 'navy blue', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-navyblue.jpg', colorHex: '#4B4EA2' },
  { material: 'GreenTEC', filament: 'GreenTEC', color: 'red', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-red.jpg', colorHex: '#B9333B' },

  // ============================================================================
  // GreenTEC Pro (Bio) - 7 colors
  // ============================================================================
  { material: 'GreenTEC Pro', filament: 'GreenTEC Pro', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec-pro/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-Pro_black.jpg', colorHex: '#000000' },
  { material: 'GreenTEC Pro', filament: 'GreenTEC Pro', color: 'white', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec-pro/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20191128_GT-Pro_white.jpg', colorHex: '#FFFFFF' },
  { material: 'GreenTEC Pro', filament: 'GreenTEC Pro', color: 'nature', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec-pro/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-Pro_natural.jpg', colorHex: '#E3D9C6' },
  { material: 'GreenTEC Pro', filament: 'GreenTEC Pro', color: 'anthracite', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec-pro/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-Pro_anthrazit.jpg', colorHex: '#383E42' },
  { material: 'GreenTEC Pro', filament: 'GreenTEC Pro', color: 'silver', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec-pro/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-Pro_silver.jpg', colorHex: '#C4C5C6' },
  { material: 'GreenTEC Pro', filament: 'GreenTEC Pro', color: 'navy blue', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec-pro/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-Pro_navyblue.jpg', colorHex: '#4B4EA2' },
  { material: 'GreenTEC Pro', filament: 'GreenTEC Pro', color: 'hellfire red', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec-pro/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/20190418_GT-Pro_red.jpg', colorHex: '#C05447' },

  // ============================================================================
  // PCTG - 10 colors
  // ============================================================================
  { material: 'PCTG', filament: 'PCTG', color: 'transparent', productUrl: 'https://www.extrudr.com/en/inlt/products/pctg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2022/09/9010241526000_PCTG__transparent_1.75_mm_800_g.jpg', colorHex: '#FFFFFF' },
  { material: 'PCTG', filament: 'PCTG', color: 'white', productUrl: 'https://www.extrudr.com/en/inlt/products/pctg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2022/09/9010241526017_PCTG__white_1.75_mm_800_g.jpg', colorHex: '#FFFFFF' },
  { material: 'PCTG', filament: 'PCTG', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/pctg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2022/09/9010241526024_PCTG__black_1.75_mm_800_g.jpg', colorHex: '#000000' },
  { material: 'PCTG', filament: 'PCTG', color: 'silver', productUrl: 'https://www.extrudr.com/en/inlt/products/pctg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2022/09/9010241526086_PCTG__silver_1.75_mm_800_g.jpg', colorHex: '#C4C5C6' },
  { material: 'PCTG', filament: 'PCTG', color: 'anthracite', productUrl: 'https://www.extrudr.com/en/inlt/products/pctg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2022/09/9010241526062_PCTG__anthracite_1.75_mm_800_g.jpg', colorHex: '#383E42' },
  { material: 'PCTG', filament: 'PCTG', color: 'metallic', productUrl: 'https://www.extrudr.com/en/inlt/products/pctg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2022/09/9010241526055_PCTG__metallic_1.75_mm_800_g.jpg', colorHex: '#4D4C50' },
  { material: 'PCTG', filament: 'PCTG', color: 'navy blue', productUrl: 'https://www.extrudr.com/en/inlt/products/pctg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2022/09/9010241526147_PCTG__navy_blue_1.75_mm_800_g.jpg', colorHex: '#4B4EA2' },
  { material: 'PCTG', filament: 'PCTG', color: 'red', productUrl: 'https://www.extrudr.com/en/inlt/products/pctg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2022/10/9010241526260_PCTG__hellfire_red_1.75_mm_800_g.jpg', colorHex: '#B9333B' },
  { material: 'PCTG', filament: 'PCTG', color: 'hellfire red', productUrl: 'https://www.extrudr.com/en/inlt/products/pctg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2022/10/9010241526260_PCTG__hellfire_red_1.75_mm_800_g.jpg', colorHex: '#C05447' },

  // ============================================================================
  // PETG - 35+ colors
  // ============================================================================
  { material: 'PETG', filament: 'PETG', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_black.jpg', colorHex: '#000000' },
  { material: 'PETG', filament: 'PETG', color: 'white', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_white.jpg', colorHex: '#FFFFFF' },
  { material: 'PETG', filament: 'PETG', color: 'grey', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_grey.jpg', colorHex: '#C6C5BA' },
  { material: 'PETG', filament: 'PETG', color: 'anthracite', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_anthracite.jpg', colorHex: '#383E42' },
  { material: 'PETG', filament: 'PETG', color: 'silver', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_silver.jpg', colorHex: '#C4C5C6' },
  { material: 'PETG', filament: 'PETG', color: 'metallic', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_metallic.jpg', colorHex: '#4D4C50' },
  { material: 'PETG', filament: 'PETG', color: 'transparent', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_transparent.jpg', colorHex: '#FFFFFF' },
  { material: 'PETG', filament: 'PETG', color: 'transparent red', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_transred.jpg', colorHex: '#861A22' },
  { material: 'PETG', filament: 'PETG', color: 'transparent blue', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_transblue.jpg', colorHex: '#21697C' },
  { material: 'PETG', filament: 'PETG', color: 'transparent green', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_transgreen.jpg', colorHex: '#61993B' },
  { material: 'PETG', filament: 'PETG', color: 'transparent yellow', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_transyellow.jpg', colorHex: '#F9A800' },
  { material: 'PETG', filament: 'PETG', color: 'transparent orange', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_transorange.jpg', colorHex: '#D05D28' },
  { material: 'PETG', filament: 'PETG', color: 'red', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_red.jpg', colorHex: '#B9333B' },
  { material: 'PETG', filament: 'PETG', color: 'hellfire red', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_hellfirered.jpg', colorHex: '#C05447' },
  { material: 'PETG', filament: 'PETG', color: 'neon red', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_neonred.jpg', colorHex: '#ED3929' },
  { material: 'PETG', filament: 'PETG', color: 'yellow', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_yellow.jpg', colorHex: '#F4D719' },
  { material: 'PETG', filament: 'PETG', color: 'neon yellow', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_neonyellow.jpg', colorHex: '#F1F02D' },
  { material: 'PETG', filament: 'PETG', color: 'orange', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_orange.jpg', colorHex: '#F6A351' },
  { material: 'PETG', filament: 'PETG', color: 'neon orange', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_neonorange.jpg', colorHex: '#FF871A' },
  { material: 'PETG', filament: 'PETG', color: 'green', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_signalgreen.jpg', colorHex: '#2ECC71' },
  { material: 'PETG', filament: 'PETG', color: 'emerald green', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_emeraldgreen.jpg', colorHex: '#289438' },
  { material: 'PETG', filament: 'PETG', color: 'neon green', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_neongreen.jpg', colorHex: '#98FA42' },
  { material: 'PETG', filament: 'PETG', color: 'signal green', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_signalgreen.jpg', colorHex: '#47DF92' },
  { material: 'PETG', filament: 'PETG', color: 'military green', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_militarygreen.jpg', colorHex: '#5F7059' },
  { material: 'PETG', filament: 'PETG', color: 'turquoise', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_turquoise.jpg', colorHex: '#40B2BE' },
  { material: 'PETG', filament: 'PETG', color: 'light blue', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_cyan.jpg', colorHex: '#008FDF' },
  { material: 'PETG', filament: 'PETG', color: 'navy blue', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_navyblue.jpg', colorHex: '#4B4EA2' },
  { material: 'PETG', filament: 'PETG', color: 'purple', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_purple.jpg', colorHex: '#BC50A6' },
  { material: 'PETG', filament: 'PETG', color: 'magenta', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_magenta.jpg', colorHex: '#EC008C' },
  { material: 'PETG', filament: 'PETG', color: 'gold', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_gold.jpg', colorHex: '#E2B04F' },
  { material: 'PETG', filament: 'PETG', color: 'bronze', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_bronze.jpg', colorHex: '#A18C55' },
  { material: 'PETG', filament: 'PETG', color: 'copper', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_copper.jpg', colorHex: '#A0583F' },
  { material: 'PETG', filament: 'PETG', color: 'glowEx', productUrl: 'https://www.extrudr.com/en/inlt/products/petg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PETG_GlowEX_02.jpg', colorHex: '#33FF33' },

  // ============================================================================
  // FLEX Medium (TPU-92A) - 6 colors
  // ============================================================================
  { material: 'FLEX Medium', filament: 'FLEX Medium', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-medium/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_medium_black.jpg', colorHex: '#000000' },
  { material: 'FLEX Medium', filament: 'FLEX Medium', color: 'white', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-medium/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_medium_white.jpg', colorHex: '#FFFFFF' },
  { material: 'FLEX Medium', filament: 'FLEX Medium', color: 'nature', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-medium/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_medium_natural.jpg', colorHex: '#E3D9C6' },
  { material: 'FLEX Medium', filament: 'FLEX Medium', color: 'grey', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-medium/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_medium_grey.jpg', colorHex: '#C6C5BA' },
  { material: 'FLEX Medium', filament: 'FLEX Medium', color: 'red', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-medium/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_medium_red.jpg', colorHex: '#B9333B' },
  { material: 'FLEX Medium', filament: 'FLEX Medium', color: 'blue', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-medium/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_medium_blue.jpg', colorHex: '#4B4EA2' },

  // ============================================================================
  // FLEX Hard (TPU-98A) - 6 colors
  // ============================================================================
  { material: 'FLEX Hard', filament: 'FLEX Hard', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-hard/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_hard_black.jpg', colorHex: '#000000' },
  { material: 'FLEX Hard', filament: 'FLEX Hard', color: 'white', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-hard/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_hard_white.jpg', colorHex: '#FFFFFF' },
  { material: 'FLEX Hard', filament: 'FLEX Hard', color: 'nature', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-hard/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_hard_natural.jpg', colorHex: '#E3D9C6' },
  { material: 'FLEX Hard', filament: 'FLEX Hard', color: 'grey', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-hard/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_hard_grey.jpg', colorHex: '#C6C5BA' },
  { material: 'FLEX Hard', filament: 'FLEX Hard', color: 'red', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-hard/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_hard_red.jpg', colorHex: '#B9333B' },
  { material: 'FLEX Hard', filament: 'FLEX Hard', color: 'blue', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-hard/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_hard_blue.jpg', colorHex: '#4B4EA2' },

  // ============================================================================
  // FLEX Semisoft (TPU-88A) - 5 colors
  // ============================================================================
  { material: 'FLEX Semisoft', filament: 'FLEX Semisoft', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-semisoft/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_semisoft_black.jpg', colorHex: '#000000' },
  { material: 'FLEX Semisoft', filament: 'FLEX Semisoft', color: 'white', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-semisoft/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_semisoft_white.jpg', colorHex: '#FFFFFF' },
  { material: 'FLEX Semisoft', filament: 'FLEX Semisoft', color: 'nature', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-semisoft/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_semisoft_natural.jpg', colorHex: '#E3D9C6' },
  { material: 'FLEX Semisoft', filament: 'FLEX Semisoft', color: 'grey', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-semisoft/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_semisoft_grey.jpg', colorHex: '#C6C5BA' },
  { material: 'FLEX Semisoft', filament: 'FLEX Semisoft', color: 'red', productUrl: 'https://www.extrudr.com/en/inlt/products/flex-semisoft/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_TPU_flex_semisoft_red.jpg', colorHex: '#B9333B' },

  // ============================================================================
  // PLA NX2 (Matte PLA) - 10+ colors
  // ============================================================================
  { material: 'PLA NX2', filament: 'PLA NX2', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/pla-nx2/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PLA_NX2_black.jpg', colorHex: '#000000' },
  { material: 'PLA NX2', filament: 'PLA NX2', color: 'white', productUrl: 'https://www.extrudr.com/en/inlt/products/pla-nx2/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PLA_NX2_white.jpg', colorHex: '#FFFFFF' },
  { material: 'PLA NX2', filament: 'PLA NX2', color: 'grey', productUrl: 'https://www.extrudr.com/en/inlt/products/pla-nx2/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PLA_NX2_grey.jpg', colorHex: '#C6C5BA' },
  { material: 'PLA NX2', filament: 'PLA NX2', color: 'anthracite', productUrl: 'https://www.extrudr.com/en/inlt/products/pla-nx2/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PLA_NX2_anthracite.jpg', colorHex: '#383E42' },
  { material: 'PLA NX2', filament: 'PLA NX2', color: 'red', productUrl: 'https://www.extrudr.com/en/inlt/products/pla-nx2/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PLA_NX2_red.jpg', colorHex: '#B9333B' },
  { material: 'PLA NX2', filament: 'PLA NX2', color: 'blue', productUrl: 'https://www.extrudr.com/en/inlt/products/pla-nx2/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PLA_NX2_blue.jpg', colorHex: '#4B4EA2' },
  { material: 'PLA NX2', filament: 'PLA NX2', color: 'green', productUrl: 'https://www.extrudr.com/en/inlt/products/pla-nx2/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PLA_NX2_green.jpg', colorHex: '#289438' },
  { material: 'PLA NX2', filament: 'PLA NX2', color: 'yellow', productUrl: 'https://www.extrudr.com/en/inlt/products/pla-nx2/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PLA_NX2_yellow.jpg', colorHex: '#F4D719' },
  { material: 'PLA NX2', filament: 'PLA NX2', color: 'orange', productUrl: 'https://www.extrudr.com/en/inlt/products/pla-nx2/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PLA_NX2_orange.jpg', colorHex: '#F6A351' },
  { material: 'PLA NX2', filament: 'PLA NX2', color: 'nature', productUrl: 'https://www.extrudr.com/en/inlt/products/pla-nx2/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2019/11/201905_PLA_NX2_natural.jpg', colorHex: '#E3D9C6' },

  // ============================================================================
  // xPETG - 8 colors
  // ============================================================================
  { material: 'xPETG', filament: 'xPETG', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/xpetg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/11/xPETG_black.jpg', colorHex: '#000000' },
  { material: 'xPETG', filament: 'xPETG', color: 'white', productUrl: 'https://www.extrudr.com/en/inlt/products/xpetg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/11/xPETG_white.jpg', colorHex: '#FFFFFF' },
  { material: 'xPETG', filament: 'xPETG', color: 'grey', productUrl: 'https://www.extrudr.com/en/inlt/products/xpetg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/11/xPETG_grey.jpg', colorHex: '#C6C5BA' },
  { material: 'xPETG', filament: 'xPETG', color: 'nature', productUrl: 'https://www.extrudr.com/en/inlt/products/xpetg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/11/xPETG_natural.jpg', colorHex: '#E3D9C6' },
  { material: 'xPETG', filament: 'xPETG', color: 'anthracite', productUrl: 'https://www.extrudr.com/en/inlt/products/xpetg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/11/xPETG_anthracite.jpg', colorHex: '#383E42' },
  { material: 'xPETG', filament: 'xPETG', color: 'silver', productUrl: 'https://www.extrudr.com/en/inlt/products/xpetg/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/11/xPETG_silver.jpg', colorHex: '#C4C5C6' },

  // ============================================================================
  // xPETG CF (Carbon Fiber) - 1 color (single color specialty)
  // ============================================================================
  { material: 'xPETG CF', filament: 'xPETG CF', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/xpetg-cf/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/11/xPETG_CF_black.jpg', colorHex: '#000000' },

  // ============================================================================
  // DuraPro PA12 (Nylon) - 2 colors (specialty)
  // ============================================================================
  { material: 'DuraPro PA12', filament: 'DuraPro PA12', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-pa12/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/01/DuraPro_PA12_black.jpg', colorHex: '#000000' },
  { material: 'DuraPro PA12', filament: 'DuraPro PA12', color: 'nature', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-pa12/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/01/DuraPro_PA12_natural.jpg', colorHex: '#E3D9C6' },

  // ============================================================================
  // DuraPro PC/PBT - 2 colors (specialty)
  // ============================================================================
  { material: 'DuraPro PC/PBT', filament: 'DuraPro PC/PBT', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-pc-pbt/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/01/DuraPro_PC_PBT_black.jpg', colorHex: '#000000' },
  { material: 'DuraPro PC/PBT', filament: 'DuraPro PC/PBT', color: 'nature', productUrl: 'https://www.extrudr.com/en/inlt/products/durapro-pc-pbt/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/01/DuraPro_PC_PBT_natural.jpg', colorHex: '#E3D9C6' },

  // ============================================================================
  // GreenTEC Pro Carbon (Bio-CF) - 1 color (single color specialty)
  // ============================================================================
  { material: 'GreenTEC Pro Carbon', filament: 'GreenTEC Pro Carbon', color: 'black', productUrl: 'https://www.extrudr.com/en/inlt/products/greentec-pro-carbon/', imageUrl: 'https://s3.extrudr.com/extrudr-media/images/products/2020/01/GreenTEC_Pro_Carbon_black.jpg', colorHex: '#000000' },
];

/**
 * Get unique product lines from the seed data
 */
export function getExtrudrProductLines(): string[] {
  const lines = new Set<string>();
  for (const product of EXTRUDR_PRODUCT_SEED) {
    lines.add(product.filament);
  }
  return Array.from(lines).sort();
}

/**
 * Get products for a specific product line
 */
export function getProductsByLine(lineName: string): ExtrudrSeedProduct[] {
  return EXTRUDR_PRODUCT_SEED.filter(p => p.filament === lineName);
}

/**
 * Get unique color count for a product line
 */
export function getColorCountForLine(lineName: string): number {
  const colors = new Set<string>();
  for (const product of EXTRUDR_PRODUCT_SEED) {
    if (product.filament === lineName) {
      colors.add(product.color.toLowerCase());
    }
  }
  return colors.size;
}

// Export stats for debugging
export const EXTRUDR_SEED_STATS = {
  totalProducts: EXTRUDR_PRODUCT_SEED.length,
  productLines: getExtrudrProductLines().length,
  productsWithHex: EXTRUDR_PRODUCT_SEED.filter(p => p.colorHex !== null).length,
  productsWithImages: EXTRUDR_PRODUCT_SEED.filter(p => p.imageUrl && p.imageUrl.length > 0).length,
};

/**
 * COLORFABB BRAND-SPECIFIC DEFAULTS
 * 
 * ColorFabb is a premium Dutch filament manufacturer known for innovative materials:
 * - LW-PLA (lightweight foaming PLA)
 * - nGen (Eastman Amphora co-polyester)
 * - varioShore TPU (variable density)
 * - Specialty fills (bronzeFill, woodFill, stoneFill)
 * 
 * Store: colorfabb.us (US store, Magento platform)
 * Currency: USD
 * Regions: US-based, ships worldwide
 */

// =============================================================================
// CSV PRODUCT SEED DATA (75 products from colorfabb.us)
// =============================================================================

export interface ColorFabbProductSeed {
  material: string;
  filamentLine: string;
  color: string;
  productName: string;
  productUrl: string;
  imageUrl: string | null;
  sku: string | null;
  priceUsd: number | null;
}

export const COLORFABB_PRODUCT_SEED: ColorFabbProductSeed[] = [
  // varioShore TPU
  { material: 'varioShore TPU', filamentLine: 'varioShore TPU', color: 'BLACK', productName: 'VARIOSHORE TPU BLACK', productUrl: 'https://colorfabb.us/varioshore-tpu-black', imageUrl: 'https://colorfabb.us/media/catalog/product/v/a/varioshore_tpu_black.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '060004', priceUsd: 59.70 },
  { material: 'varioShore TPU', filamentLine: 'varioShore TPU', color: 'NATURAL', productName: 'VARIOSHORE TPU NATURAL', productUrl: 'https://colorfabb.us/varioshore-tpu-natural', imageUrl: 'https://colorfabb.us/media/catalog/product/v/a/varioshore_tpu_natural.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '060003', priceUsd: 59.70 },
  { material: 'varioShore TPU', filamentLine: 'varioShore TPU', color: 'RED', productName: 'VARIOSHORE TPU RED', productUrl: 'https://colorfabb.us/varioshore-tpu-red', imageUrl: 'https://colorfabb.us/media/catalog/product/v/a/varioshore_tpu_red.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '060006', priceUsd: 59.70 },
  { material: 'varioShore TPU', filamentLine: 'varioShore TPU', color: 'GREEN', productName: 'VARIOSHORE TPU GREEN', productUrl: 'https://colorfabb.us/varioshore-tpu-green', imageUrl: 'https://colorfabb.us/media/catalog/product/v/a/varioshore_tpu_green.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '060008', priceUsd: 59.70 },
  { material: 'varioShore TPU', filamentLine: 'varioShore TPU', color: 'BLUE', productName: 'VARIOSHORE TPU BLUE', productUrl: 'https://colorfabb.us/varioshore-tpu-blue', imageUrl: 'https://colorfabb.us/media/catalog/product/v/a/varioshore_tpu_blue.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '060007', priceUsd: 59.70 },
  { material: 'varioShore TPU', filamentLine: 'varioShore Prosthetic', color: 'NATURAL', productName: 'VARIOSHORE PROSTHETIC NATURAL', productUrl: 'https://colorfabb.us/varioshore-prosthetic', imageUrl: 'https://colorfabb.us/media/catalog/product/v/a/varioshore_tpu_prosthetic_natural.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '060009', priceUsd: 59.70 },
  { material: 'varioShore TPU', filamentLine: 'varioShore Prosthetic', color: 'DARK BROWN', productName: 'VARIOSHORE PROSTHETIC DARK BROWN', productUrl: 'https://colorfabb.us/varioshore-tpu-dark-brown', imageUrl: 'https://colorfabb.us/media/catalog/product/v/a/varioshore_tpu_prosthetic_dark-brown.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '060010', priceUsd: 59.70 },
  { material: 'varioShore TPU', filamentLine: 'varioShore Prosthetic', color: 'MEDIUM BROWN', productName: 'VARIOSHORE PROSTHETIC MEDIUM BROWN', productUrl: 'https://colorfabb.us/varioshore-tpu-medium-brown', imageUrl: 'https://colorfabb.us/media/catalog/product/v/a/varioshore_tpu_prosthetic_medium-brown.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '060011', priceUsd: 59.70 },
  { material: 'varioShore TPU', filamentLine: 'varioShore Prosthetic', color: 'PALE PINK', productName: 'VARIOSHORE PROSTHETIC PALE PINK', productUrl: 'https://colorfabb.us/varioshore-prosthetic-pale-pink', imageUrl: 'https://colorfabb.us/media/catalog/product/v/a/varioshore_tpu_prosthetic_pale-pink.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '060012', priceUsd: 59.70 },
  
  // LW-PLA
  { material: 'LW-PLA', filamentLine: 'LW-PLA', color: 'BLACK', productName: 'LW-PLA BLACK', productUrl: 'https://colorfabb.us/lw-pla-black', imageUrl: 'https://colorfabb.us/media/catalog/product/l/w/lw-pla_black.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030010', priceUsd: 37.50 },
  { material: 'LW-PLA', filamentLine: 'LW-PLA', color: 'NATURAL', productName: 'LW-PLA NATURAL', productUrl: 'https://colorfabb.us/lw-pla-natural', imageUrl: 'https://colorfabb.us/media/catalog/product/l/w/lw-pla_naturel.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030011', priceUsd: 37.50 },
  { material: 'LW-PLA', filamentLine: 'LW-PLA', color: 'RED', productName: 'LW-PLA RED', productUrl: 'https://colorfabb.us/lw-pla-red', imageUrl: 'https://colorfabb.us/media/catalog/product/l/w/lw-pla_red.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030020', priceUsd: 37.50 },
  { material: 'LW-PLA', filamentLine: 'LW-PLA', color: 'YELLOW', productName: 'LW-PLA YELLOW', productUrl: 'https://colorfabb.us/lw-pla-yellow', imageUrl: 'https://colorfabb.us/media/catalog/product/l/w/lw-pla_yellow.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030021', priceUsd: 37.50 },
  { material: 'LW-PLA', filamentLine: 'LW-PLA', color: 'GRAY SILVER', productName: 'LW-PLA GRAY SILVER', productUrl: 'https://colorfabb.us/lw-pla-gray-silver', imageUrl: 'https://colorfabb.us/media/catalog/product/l/w/lw-pla_gray-silver.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030019', priceUsd: 37.50 },
  
  // LW-PLA-HT
  { material: 'LW-PLA-HT', filamentLine: 'LW-PLA-HT', color: 'WHITE', productName: 'LW-PLA-HT WHITE', productUrl: 'https://colorfabb.us/lw-pla-ht-white', imageUrl: 'https://colorfabb.us/media/catalog/product/l/w/lw-pla-ht_white.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030030', priceUsd: 51.74 },
  { material: 'LW-PLA-HT', filamentLine: 'LW-PLA-HT', color: 'BLACK', productName: 'LW-PLA-HT BLACK', productUrl: 'https://colorfabb.us/lw-pla-ht-black', imageUrl: 'https://colorfabb.us/media/catalog/product/l/w/lw-pla-ht_black.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030031', priceUsd: 51.74 },
  { material: 'LW-PLA-HT', filamentLine: 'LW-PLA-HT', color: 'OLIVE GREEN', productName: 'LW-PLA-HT OLIVE GREEN', productUrl: 'https://colorfabb.us/lw-pla-ht-olive', imageUrl: 'https://colorfabb.us/media/catalog/product/l/w/lw-pla-ht_olive-green.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030032', priceUsd: 51.74 },
  { material: 'LW-PLA-HT', filamentLine: 'LW-PLA-HT', color: 'DARK GRAY', productName: 'LW-PLA-HT DARK GRAY', productUrl: 'https://colorfabb.us/lw-pla-ht-dark-gray', imageUrl: 'https://colorfabb.us/media/catalog/product/l/w/lw-pla-ht_dark-gray.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030033', priceUsd: 51.74 },
  
  // LW-ASA
  { material: 'LW-ASA', filamentLine: 'LW-ASA', color: 'BLACK', productName: 'LW-ASA BLACK', productUrl: 'https://colorfabb.us/lw-asa-black', imageUrl: 'https://colorfabb.us/media/catalog/product/a/s/asa-lw_black.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '05004', priceUsd: 37.50 },
  { material: 'LW-ASA', filamentLine: 'LW-ASA', color: 'NATURAL', productName: 'LW-ASA NATURAL', productUrl: 'https://colorfabb.us/lw-asa-naturel', imageUrl: 'https://colorfabb.us/media/catalog/product/a/s/asa-lw_natural.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '05003', priceUsd: 37.50 },
  
  // PLA High Speed Pro
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'SEMI-MATTE TRAFFIC WHITE', productName: 'PLA HIGH SPEED PRO SEMI-MATTE TRAFFIC WHITE', productUrl: 'https://colorfabb.us/pla-high-speed-pro-semi-matte-traffic-white', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla-high-speed-pro_semi-matte-white_1.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010073', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'SEMI-MATTE BLACK', productName: 'PLA HIGH SPEED PRO SEMI-MATTE BLACK', productUrl: 'https://colorfabb.us/pla-high-speed-pro-semi-matte-black', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla-high-speed-pro_semi-matte-black_1.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010072', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'LIGHT GREY', productName: 'PLA HIGH SPEED PRO LIGHT GREY', productUrl: 'https://colorfabb.us/pla-high-speed-pro-light-grey', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_light-grey-ral-7035.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010069', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'TELEGREY 2', productName: 'PLA HIGH SPEED PRO TELEGREY 2', productUrl: 'https://colorfabb.us/pla-high-speed-pro-telegrey-2', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_telegrey-2-ral-7046.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010068', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'IRON GREY', productName: 'PLA HIGH SPEED PRO IRON GREY', productUrl: 'https://colorfabb.us/pla-high-speed-pro-iron-grey', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_iron-grey-ral-7011.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010067', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'AGATE GREY', productName: 'PLA HIGH SPEED PRO AGATE GREY', productUrl: 'https://colorfabb.us/pla-high-speed-pro-agatge-grey', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_agate-grey-ral-7038.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010066', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'SIGNAL GREEN', productName: 'PLA HIGH SPEED PRO SIGNAL GREEN', productUrl: 'https://colorfabb.us/pla-high-speed-pro-signal-green', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_signal-green-ral-6032.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010065', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'YELLOW GREEN', productName: 'PLA HIGH SPEED PRO YELLOW GREEN', productUrl: 'https://colorfabb.us/pla-high-speed-pro-yellow-green', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_yellow-green-ral-6018.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010064', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'TURQUOISE GREEN', productName: 'PLA HIGH SPEED PRO TURQOISE GREEN', productUrl: 'https://colorfabb.us/pla-high-speed-pro-turqoise-green', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_turquoise-green-ral-6016.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010063', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'MOSS GREEN', productName: 'PLA HIGH SPEED PRO MOSS GREEN', productUrl: 'https://colorfabb.us/pla-high-speed-pro-moss-green', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_moss-green-ral-6005.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010062', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'PASTEL BLUE', productName: 'PLA HIGH SPEED PRO PASTEL BLUE', productUrl: 'https://colorfabb.us/pla-high-speed-pro-pastel-blue', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_pastel-blue-ral-5024.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010061', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'ULTRA MARINE BLUE', productName: 'PLA HIGH SPEED PRO ULTRA MARINE BLUE', productUrl: 'https://colorfabb.us/pla-high-speed-pro-ultra-marine-blue', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_ultra-marine-blue-ral-5002.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010060', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'GREY BLUE', productName: 'PLA HIGH SPEED PRO GREY BLUE', productUrl: 'https://colorfabb.us/pla-high-speed-pro-grey-blue', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_grey-blue-ral-5008.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010059', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'AZURE BLUE', productName: 'PLA HIGH SPEED PRO AZURE BLUE', productUrl: 'https://colorfabb.us/pla-high-speed-pro-azure-blue', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_azure-blue-ral-5009.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010058', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'SAPPHIRE BLUE', productName: 'PLA HIGH SPEED PRO SAPPHIRE BLUE', productUrl: 'https://colorfabb.us/pla-high-speed-pro-sapphire-blue', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_sapphire-blue-ral-5003.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010057', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'ANTIQUE PINK', productName: 'PLA HIGH SPEED PRO ANTIQUE PINK', productUrl: 'https://colorfabb.us/pla-high-speed-pro-antique-pink', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_antique-pink-ral-3014.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010056', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'DEEP ORANGE', productName: 'PLA HIGH SPEED PRO DEEP ORANGE', productUrl: 'https://colorfabb.us/pla-high-speed-pro-deep-orange', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_deep-orange-ral-2011.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010055', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'TRAFFIC YELLOW', productName: 'PLA HIGH SPEED PRO TRAFFIC YELLOW', productUrl: 'https://colorfabb.us/pla-high-speed-pro-traffic-yellow', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_traffic-yellow-ral-1023.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010054', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'NATURAL', productName: 'PLA HIGH SPEED PRO NATURAL', productUrl: 'https://colorfabb.us/pla-high-speed-pro-natural', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla-high-speed-pro_natural.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010053', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'SKY BLUE', productName: 'PLA HIGH SPEED PRO SKY BLUE', productUrl: 'https://colorfabb.us/pla-high-speed-pro-sky-blue', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_sky-blue-ral-5015.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010052', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'TRAFFIC RED', productName: 'PLA HIGH SPEED PRO TRAFFIC RED', productUrl: 'https://colorfabb.us/pla-high-speed-pro-traffic-red', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_traffic-red-ral-3020.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010051', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'PEARL DARK GREY', productName: 'PLA HIGH SPEED PRO PEARL DARK GREY', productUrl: 'https://colorfabb.us/pla-high-speed-pro-pearl-dark-grey', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_pearl-dark-grey-ral-9023.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010050', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'TRAFFIC WHITE', productName: 'PLA HIGH SPEED PRO TRAFFIC WHITE', productUrl: 'https://colorfabb.us/pla-high-speed-pro-traffic-white', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_traffic-white-ral-9016.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010049', priceUsd: 29.00 },
  { material: 'PLA High Speed Pro', filamentLine: 'PLA High Speed Pro', color: 'JET BLACK', productName: 'PLA HIGH SPEED PRO JET BLACK', productUrl: 'https://colorfabb.us/pla-high-speed-pro-jet-black', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_high_speed_jet-black-ral-9005.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010048', priceUsd: 29.00 },
  
  // PLA-HP
  { material: 'PLA-HP', filamentLine: 'PLA-HP', color: 'SILVER', productName: 'PLA-HP SILVER', productUrl: 'https://colorfabb.us/pla-hp-silver', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla-hp_silver.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030036', priceUsd: 31.32 },
  { material: 'PLA-HP', filamentLine: 'PLA-HP', color: 'BLACK', productName: 'PLA-HP BLACK', productUrl: 'https://colorfabb.us/pla-hp-black', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla-hp_black.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030035', priceUsd: 31.32 },
  
  // PLA Silk
  { material: 'PLA Silk', filamentLine: 'PLA Silk', color: 'RED', productName: 'PLA SILK RED', productUrl: 'https://colorfabb.us/pla-silk-red', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_silk_red.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '010039', priceUsd: 34.04 },
  
  // Vibers PLA
  { material: 'Vibers PLA', filamentLine: 'Vibers PLA', color: 'PASTEL ORANGE', productName: 'VIBERS PLA PASTEL ORANGE', productUrl: 'https://colorfabb.us/vibers-pla-pastel-orange', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_vibers_pastel-orange.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030027', priceUsd: 43.56 },
  { material: 'Vibers PLA', filamentLine: 'Vibers PLA', color: 'PASTEL PURPLE', productName: 'VIBERS PLA PASTEL PURPLE', productUrl: 'https://colorfabb.us/vibers-pla-pastel-purple', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_vibers_pastel-purple.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030028', priceUsd: 43.56 },
  { material: 'Vibers PLA', filamentLine: 'Vibers PLA', color: 'PASTEL GREEN', productName: 'VIBERS PLA PASTEL GREEN', productUrl: 'https://colorfabb.us/vibers-pla-pastel-green', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_vibers_pastel-green.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030029', priceUsd: 43.56 },
  
  // PLA Economy
  { material: 'PLA Economy', filamentLine: 'PLA Economy', color: 'BLACK', productName: 'PLA ECONOMY BLACK', productUrl: 'https://colorfabb.us/pla-economy-black', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_economy_black.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: null, priceUsd: null },
  
  // ASA
  { material: 'ASA', filamentLine: 'ASA', color: 'BLACK', productName: 'ASA BLACK', productUrl: 'https://colorfabb.us/asa-black', imageUrl: 'https://colorfabb.us/media/catalog/product/a/s/asa_black.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: null, priceUsd: 37.50 },
  
  // PETG Economy
  { material: 'PETG Economy', filamentLine: 'PETG Economy', color: 'CLEAR', productName: 'PETG ECONOMY CLEAR', productUrl: 'https://colorfabb.us/petg-economy-clear', imageUrl: 'https://colorfabb.us/media/catalog/product/p/e/petg-economy_clear.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: null, priceUsd: null },
  
  // nGen (Copolyester - Eastman Amphora based)
  { material: 'Copolyester', filamentLine: 'nGen', color: 'BLACK', productName: 'NGEN BLACK', productUrl: 'https://colorfabb.us/ngen-black', imageUrl: 'https://colorfabb.us/media/catalog/product/n/g/ngen_black.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '020014', priceUsd: 32.98 },
  
  // HT
  { material: 'HT', filamentLine: 'HT', color: 'BLACK', productName: 'HT BLACK', productUrl: 'https://colorfabb.us/ht-black', imageUrl: 'https://colorfabb.us/media/catalog/product/c/o/colorfabb_ht_black.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '020034', priceUsd: 39.21 },
  { material: 'HT', filamentLine: 'HT', color: 'CLEAR', productName: 'HT CLEAR', productUrl: 'https://colorfabb.us/ht-clear', imageUrl: 'https://colorfabb.us/media/catalog/product/c/o/colorfabb_ht_clear.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '020032', priceUsd: 39.21 },
  
  // XT (Copolyester - Eastman Amphora based)
  { material: 'Copolyester', filamentLine: 'XT', color: 'LIGHT BLUE', productName: 'XT LIGHT-BLUE', productUrl: 'https://colorfabb.us/xt-light-blue', imageUrl: 'https://colorfabb.us/media/catalog/product/x/t/xt_light-blue.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '020008', priceUsd: 35.71 },
  { material: 'Copolyester', filamentLine: 'XT', color: 'WHITE', productName: 'XT WHITE', productUrl: 'https://colorfabb.us/xt-white', imageUrl: 'https://colorfabb.us/media/catalog/product/x/t/xt_white.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '020002', priceUsd: 35.71 },
  { material: 'Copolyester', filamentLine: 'XT', color: 'BLACK', productName: 'XT BLACK', productUrl: 'https://colorfabb.us/xt-black', imageUrl: 'https://colorfabb.us/media/catalog/product/x/t/xt_black.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '020010', priceUsd: 35.71 },
  { material: 'Copolyester', filamentLine: 'XT', color: 'LIGHT GRAY', productName: 'XT LIGHT GRAY', productUrl: 'https://colorfabb.us/xt-light-gray', imageUrl: 'https://colorfabb.us/media/catalog/product/x/t/xt_light-gray.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '020030', priceUsd: 35.73 },
  { material: 'Copolyester', filamentLine: 'XT', color: 'DARK GRAY', productName: 'XT DARK GRAY', productUrl: 'https://colorfabb.us/xt-dark-gray', imageUrl: 'https://colorfabb.us/media/catalog/product/x/t/xt_dark-gray.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: null, priceUsd: null },
  
  // XT-CF20 (Copolyester + Carbon Fiber)
  { material: 'Copolyester', filamentLine: 'XT-CF20', color: 'BLACK', productName: 'XT-CF20', productUrl: 'https://colorfabb.us/xt-cf20', imageUrl: 'https://colorfabb.us/media/catalog/product/x/t/xt_cf20.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: null, priceUsd: null },
  
  // Specialty Fills
  { material: 'steelFill', filamentLine: 'steelFill', color: 'STEEL', productName: 'STEELFILL', productUrl: 'https://colorfabb.us/steelfill', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_steelfill.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030008', priceUsd: 62.97 },
  { material: 'copperFill', filamentLine: 'copperFill', color: 'COPPER', productName: 'COPPERFILL', productUrl: 'https://colorfabb.us/copperfill', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_copperfill.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030004', priceUsd: 62.97 },
  { material: 'bronzeFill', filamentLine: 'bronzeFill', color: 'BRONZE', productName: 'BRONZEFILL', productUrl: 'https://colorfabb.us/bronzefill', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_bronzefill.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030001', priceUsd: 62.97 },
  { material: 'glowFill', filamentLine: 'glowFill', color: 'GLOW', productName: 'GLOWFILL', productUrl: 'https://colorfabb.us/glowfill', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_glowfill_1_day-night.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030005', priceUsd: 42.34 },
  { material: 'woodFill', filamentLine: 'woodFill', color: 'WOOD', productName: 'WOODFILL', productUrl: 'https://colorfabb.us/woodfill', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla-woodfill.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030002', priceUsd: 45.84 },
  { material: 'corkFill', filamentLine: 'corkFill', color: 'CORK', productName: 'CORKFILL', productUrl: 'https://colorfabb.us/corkfill', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_corkfill.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030007', priceUsd: 37.21 },
  { material: 'stoneFill', filamentLine: 'stoneFill', color: 'RED BRICK', productName: 'STONEFILL RED BRICK', productUrl: 'https://colorfabb.us/stonefill-red-brick', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_stonefill_red-brick.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030025', priceUsd: 43.84 },
  { material: 'stoneFill', filamentLine: 'stoneFill', color: 'MOSS GREEN', productName: 'STONEFILL MOSS GREEN', productUrl: 'https://colorfabb.us/stonefill-moss-green', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_stonefill_moss-green.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030026', priceUsd: 43.84 },
  { material: 'stoneFill', filamentLine: 'stoneFill', color: 'LIGHT GRAY', productName: 'STONEFILL LIGHT GRAY', productUrl: 'https://colorfabb.us/stonefill-light-gray', imageUrl: 'https://colorfabb.us/media/catalog/product/p/l/pla_stonefill_light-gray.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '030023', priceUsd: 43.84 },
  
  // allPHA
  { material: 'allPHA', filamentLine: 'allPHA', color: 'NATURAL', productName: 'ALLPHA NATURAL', productUrl: 'https://colorfabb.us/allpha-natural', imageUrl: null, sku: null, priceUsd: null },
  { material: 'allPHA', filamentLine: 'allPHA', color: 'BLACK', productName: 'ALLPHA BLACK', productUrl: 'https://colorfabb.us/allpha-black', imageUrl: 'https://colorfabb.us/media/catalog/product/a/l/allpha_black.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '070002', priceUsd: 38.07 },
  { material: 'allPHA', filamentLine: 'allPHA', color: 'WHITE', productName: 'ALLPHA WHITE', productUrl: 'https://colorfabb.us/allpha-white', imageUrl: 'https://colorfabb.us/media/catalog/product/a/l/allpha_white.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '070003', priceUsd: 38.07 },
  
  // PA
  { material: 'PA', filamentLine: 'PA', color: 'BLUE METAL DETECTABLE', productName: 'PA BLUE METAL DETECTABLE', productUrl: 'https://colorfabb.us/pa-blue-metal-detectable', imageUrl: 'https://colorfabb.us/media/catalog/product/p/a/pa_blue-metal-detectable.png?optimize=medium&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', sku: '060013', priceUsd: 42.50 },
];

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
  { pattern: /\bpla\s*silk\b/i, info: { normalized: 'PLA Silk', baseType: 'PLA', isAbrasive: false, enclosureRequired: false, isFoaming: false, isFlexible: false, highSpeedCapable: false } },
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
  if (/varioshore\s*prosthetic/i.test(t)) return `colorfabb__varioshore-tpu__prosthetic`;
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
  
  // PLA High Speed variants - KEEP SEPARATE (different formulations)
  if (/pla[- ]?hp\b/i.test(t)) return `colorfabb__pla-hp__high-speed`;
  if (/high\s*speed\s*pro/i.test(t)) return `colorfabb__pla-high-speed-pro__high-speed`;
  if (/pla\s*silk/i.test(t)) return `colorfabb__pla-silk__silk`;
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
  if (/pa\s*blue\s*metal/i.test(t)) return `colorfabb__pa__metal-detectable`;
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
  'PLA Silk': `${TDS_URL_BASE}/TDS_E_ColorFabb_PLA_Silk.pdf`,
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
  'stoneFill': `${TDS_URL_BASE}/TDS_E_ColorFabb_stoneFill.pdf`,
  
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
  'PA': `${TDS_URL_BASE}/TDS_E_ColorFabb_PA.pdf`,
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
  'PLA Silk': { nozzleTempMin: 200, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
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
  'stoneFill': { nozzleTempMin: 195, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 60 },
  
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
  'PA': { nozzleTempMin: 245, nozzleTempMax: 265, bedTempMin: 50, bedTempMax: 70 },
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
  'red brick': 'B33B24',
  
  // Oranges
  'orange': 'FF6600',
  'traffic orange': 'FF8C00',
  'dutch orange': 'FF7F00',
  'deep orange': 'FF6600',
  'pastel orange': 'FFAB76',
  
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
  'signal green': '009B77',
  'yellow green': '9ACD32',
  'turquoise green': '00A693',
  'pastel green': '77DD77',
  
  // Blues
  'blue': '0000FF',
  'sky blue': '87CEEB',
  'light blue': 'ADD8E6',
  'ocean blue': '4F94CD',
  'traffic blue': '0033A0',
  'signal blue': '003399',
  'ultramarine blue': '3F00FF',
  'ultra marine blue': '3F00FF',
  'pastel blue': 'AEC6CF',
  'azure blue': '007FFF',
  'sapphire blue': '0F52BA',
  'grey blue': '6699CC',
  
  // Purples
  'purple': '800080',
  'violet': 'EE82EE',
  'magenta': 'FF00FF',
  'pastel purple': 'B19CD9',
  
  // Pinks
  'pink': 'FFC0CB',
  'traffic pink': 'FF69B4',
  'antique pink': 'E8A09A',
  'pale pink': 'FADADD',
  
  // Browns
  'brown': '8B4513',
  'chocolate brown': 'D2691E',
  'dark brown': '654321',
  'medium brown': '8B5A2B',
  
  // Grays
  'gray': '808080',
  'grey': '808080',
  'silver': 'C0C0C0',
  'light gray': 'D3D3D3',
  'light grey': 'D3D3D3',
  'dark gray': '404040',
  'dark grey': '404040',
  'traffic grey': '5A5A5A',
  'gray silver': 'A8A8A8',
  'telegrey 2': '7B8388',
  'iron grey': '48494B',
  'agate grey': 'B5B5B5',
  'pearl dark grey': '333333',
  'jet black': '0A0A0A',
  
  // Semi-Matte variants
  'semi-matte traffic white': 'F5F5F5',
  'semi-matte black': '1A1A1A',
  'traffic white': 'FAFAFA',
  
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
  
  // Blue Metal Detectable (special PA)
  'blue metal detectable': '3D6EAE',
  'detectable': '3D6EAE',
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
  baseUrl: 'https://colorfabb.us',
  currency: 'USD',
  platform: 'magento',
  defaultDiameter: 1.75,
  defaultWeight: 750,
};

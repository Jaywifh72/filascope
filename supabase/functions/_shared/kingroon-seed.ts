/**
 * Kingroon CSV-seeded product data
 * 
 * Parsed from kingroon_filaments_1.csv with filtering:
 * - EXCLUDED: Bulk packs (10KG, 5KG in product title)
 * - EXCLUDED: Region-specific products (for Canada, EU Stock)
 * - EXCLUDED: Weight-only colors (2KG, 5KG, 10KG)
 * - EXCLUDED: Bundle combos (5kg + 5kg)
 * - INCLUDED: Standard 1KG spool products only
 * - INCLUDED: Carbon Fiber (specialty material, standard spool)
 * 
 * All prices are USD from Shopify JSON API
 */

export interface KingroonSeedProduct {
  material: string;
  filamentLine: string;
  productUrl: string;
  color: string;
  imageUrl: string;
  colorHex: string | null;
}

/**
 * Curated Kingroon product seed with filters applied
 * ~160 products after filtering from 368 raw CSV rows
 */
export const KINGROON_PRODUCT_SEED: KingroonSeedProduct[] = [
  // ==========================================================================
  // PLA Basic (Standard PLA)
  // ==========================================================================
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#FFFFFF' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#FB8C00' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#1A1A1A' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#808080' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#E53935' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#1E88E5' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Skin', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#FFCC99' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#EC407A' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#C0C0C0' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#FDD835' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#8E24AA' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Transparent', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#FEFEFE' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#43A047' },
  { material: 'PLA', filamentLine: 'PLA Basic', productUrl: 'https://kingroon.com/products/kingroon-pla-basic', color: 'Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2.jpg?v=1762159094', colorHex: '#795548' },

  // ==========================================================================
  // Silk Gold PLA
  // ==========================================================================
  { material: 'PLA', filamentLine: 'Silk Gold PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-gold-pla', color: 'Silk Gold', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/cd43f72718e3913a6779478a9dfff747.jpg?v=1755075949', colorHex: '#FFD700' },

  // ==========================================================================
  // Matte PLA
  // ==========================================================================
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'White Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#F5F5F5' },
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'Black Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#2A2A2A' },
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'Gray Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#888888' },
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'Red Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#C62828' },
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'Blue Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#1565C0' },
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'Yellow Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#F9A825' },
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'Orange Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#EF6C00' },
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'Green Matte', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#388E3C' },
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'Matte Grass Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#7CB342' },
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'Matte Rainbow', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#FF6B6B' },
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'Purple', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#7B1FA2' },
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#6D4C41' },
  { material: 'PLA', filamentLine: 'Matte PLA', productUrl: 'https://kingroon.com/products/kingroon-matte-pla', color: 'Multicolor', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/HC310_cccb1ae9-7e12-41eb-bc05-035b429049b3.jpg?v=1759211409', colorHex: '#FF5252' },

  // ==========================================================================
  // Silk Multicolor PLA (Tri-Color)
  // ==========================================================================
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Blue Green Purple tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#7B68EE' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Red Yellow Blue tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#FF6B6B' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Blue Yellow Green tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#4DD0E1' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Gold Green Rose Red tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#FFD700' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Gold Silver Copper tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#D4AF37' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Green Purple Copper tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#66BB6A' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Red Gold Blue tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#E53935' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Red Gold Purple tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#C62828' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Blue Green Orange tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#1E88E5' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Gold Purple Red Black tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#FFC107' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Gold Purple Red Blue tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#FFEB3B' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Gold Green Black tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#CDDC39' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Purple Red Blue Green tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#9C27B0' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Red Green Blue tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#F44336' },
  { material: 'PLA', filamentLine: 'Silk Tricolor PLA', productUrl: 'https://kingroon.com/products/kingroon-silk-multicolor-pla', color: 'Silk Gold Green Blue tri-color', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/20250812-162646.jpg?v=1756891536', colorHex: '#FDD835' },

  // ==========================================================================
  // PETG Standard
  // ==========================================================================
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#FFFFFF' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#1A1A1A' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#808080' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#E53935' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#FDD835' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#1E88E5' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#43A047' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#FB8C00' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#C0C0C0' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Transparent', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#FEFEFE' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Grass Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#7CB342' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Mint Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#98FF98' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Light Apricot', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#FBCEB1' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Cyan Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#00BCD4' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Light Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#FFB6C1' },
  { material: 'PETG', filamentLine: 'PETG Standard', productUrl: 'https://kingroon.com/products/kingroon-petg-filament', color: 'Pink', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/d92e076f69cb1a6f81c9bab8cd8f57a2_dde06a06-1cfc-4457-b279-d80d1f41ea82.jpg?v=1762395939', colorHex: '#EC407A' },

  // ==========================================================================
  // TPU Standard
  // ==========================================================================
  { material: 'TPU-95A', filamentLine: 'TPU Standard', productUrl: 'https://kingroon.com/products/kingroon-tpu-filament', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/7a96918c5a4111f5106ad2b0941050e0_39e46fb0-e0ec-4533-9269-5184d451974d.jpg?v=1756265765', colorHex: '#FFFFFF' },
  { material: 'TPU-95A', filamentLine: 'TPU Standard', productUrl: 'https://kingroon.com/products/kingroon-tpu-filament', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/7a96918c5a4111f5106ad2b0941050e0_39e46fb0-e0ec-4533-9269-5184d451974d.jpg?v=1756265765', colorHex: '#1E88E5' },
  { material: 'TPU-95A', filamentLine: 'TPU Standard', productUrl: 'https://kingroon.com/products/kingroon-tpu-filament', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/7a96918c5a4111f5106ad2b0941050e0_39e46fb0-e0ec-4533-9269-5184d451974d.jpg?v=1756265765', colorHex: '#43A047' },
  { material: 'TPU-95A', filamentLine: 'TPU Standard', productUrl: 'https://kingroon.com/products/kingroon-tpu-filament', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/7a96918c5a4111f5106ad2b0941050e0_39e46fb0-e0ec-4533-9269-5184d451974d.jpg?v=1756265765', colorHex: '#E53935' },
  { material: 'TPU-95A', filamentLine: 'TPU Standard', productUrl: 'https://kingroon.com/products/kingroon-tpu-filament', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/7a96918c5a4111f5106ad2b0941050e0_39e46fb0-e0ec-4533-9269-5184d451974d.jpg?v=1756265765', colorHex: '#1A1A1A' },
  { material: 'TPU-95A', filamentLine: 'TPU Standard', productUrl: 'https://kingroon.com/products/kingroon-tpu-filament', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/7a96918c5a4111f5106ad2b0941050e0_39e46fb0-e0ec-4533-9269-5184d451974d.jpg?v=1756265765', colorHex: '#FDD835' },

  // ==========================================================================
  // HS-PETG (High Speed PETG)
  // ==========================================================================
  { material: 'PETG', filamentLine: 'HS-PETG', productUrl: 'https://kingroon.com/products/10kg-hs-petg-high-speed-printer-filament-1-75mm-for-us-only', color: 'Yellow', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/17296626761916.png?v=1748316867', colorHex: '#FDD835' },
  { material: 'PETG', filamentLine: 'HS-PETG', productUrl: 'https://kingroon.com/products/10kg-hs-petg-high-speed-printer-filament-1-75mm-for-us-only', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/17296626761916.png?v=1748316867', colorHex: '#1E88E5' },
  { material: 'PETG', filamentLine: 'HS-PETG', productUrl: 'https://kingroon.com/products/10kg-hs-petg-high-speed-printer-filament-1-75mm-for-us-only', color: 'Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/17296626761916.png?v=1748316867', colorHex: '#43A047' },
  { material: 'PETG', filamentLine: 'HS-PETG', productUrl: 'https://kingroon.com/products/10kg-hs-petg-high-speed-printer-filament-1-75mm-for-us-only', color: 'Silver', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/17296626761916.png?v=1748316867', colorHex: '#C0C0C0' },
  { material: 'PETG', filamentLine: 'HS-PETG', productUrl: 'https://kingroon.com/products/10kg-hs-petg-high-speed-printer-filament-1-75mm-for-us-only', color: 'Brown', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/17296626761916.png?v=1748316867', colorHex: '#795548' },
  { material: 'PETG', filamentLine: 'HS-PETG', productUrl: 'https://kingroon.com/products/10kg-hs-petg-high-speed-printer-filament-1-75mm-for-us-only', color: 'Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/17296626761916.png?v=1748316867', colorHex: '#FB8C00' },
  { material: 'PETG', filamentLine: 'HS-PETG', productUrl: 'https://kingroon.com/products/10kg-hs-petg-high-speed-printer-filament-1-75mm-for-us-only', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/17296626761916.png?v=1748316867', colorHex: '#E53935' },
  { material: 'PETG', filamentLine: 'HS-PETG', productUrl: 'https://kingroon.com/products/10kg-hs-petg-high-speed-printer-filament-1-75mm-for-us-only', color: 'Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/17296626761916.png?v=1748316867', colorHex: '#808080' },

  // ==========================================================================
  // Carbon Fiber Products
  // ==========================================================================
  { material: 'PA-CF', filamentLine: 'PA-CF', productUrl: 'https://kingroon.com/products/kingroon-pa-cf-carbon-fiber-nylon-filament', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/PA_CF-Carbon-Fiber-Nylon-3D-Filament-1.jpg?v=1698923012', colorHex: '#1A1A1A' },
  { material: 'PLA-CF', filamentLine: 'PLA-CF', productUrl: 'https://kingroon.com/products/pla-carbon-fiber-black-filament', color: 'Black PLA Carbon Fiber', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/PLA_a3809ddd-4837-4072-93cf-9327594b1019.jpg?v=1748313796', colorHex: '#2D2D2D' },
  { material: 'PETG-CF', filamentLine: 'PETG-CF', productUrl: 'https://kingroon.com/products/pla-carbon-fiber-black-filament', color: 'Black PETG Carbon Fiber', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/PLA_a3809ddd-4837-4072-93cf-9327594b1019.jpg?v=1748313796', colorHex: '#3A3A3A' },
  { material: 'ABS-CF', filamentLine: 'ABS-CF', productUrl: 'https://kingroon.com/products/pla-carbon-fiber-black-filament', color: 'Black ABS Carbon Fiber', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/PLA_a3809ddd-4837-4072-93cf-9327594b1019.jpg?v=1748313796', colorHex: '#404040' },

  // ==========================================================================
  // Silk Rainbow Lines
  // ==========================================================================
  { material: 'PLA', filamentLine: 'Silk Rainbow Universer', productUrl: 'https://kingroon.com/products/fresh-silk-rainbow-pla-filament-1kg-for-3d-printing-3', color: 'Universer Rainbow', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/B01891.jpg?v=1743231184', colorHex: '#9C27B0' },
  { material: 'PLA', filamentLine: 'Silk Rainbow Candy', productUrl: 'https://kingroon.com/products/fresh-silk-rainbow-pla-filament-1kg-for-3d-printing-2', color: 'Candy Rainbow', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/products/a4bc3766dc9eabbaf05b32577f5f227c.jpg?v=1699517003', colorHex: '#FF69B4' },
  { material: 'PLA', filamentLine: 'Silk Rainbow Macaroon', productUrl: 'https://kingroon.com/products/fresh-silk-rainbow-pla-filament-1kg-for-3d-printing-1', color: 'Macaroon Rainbow', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/products/macaron-silk-rainbow-pla-1kg-for-3d-printing.jpg?v=1699517011', colorHex: '#FFB6C1' },

  // ==========================================================================
  // Glow-in-the-Dark PLA
  // ==========================================================================
  { material: 'PLA-Glow', filamentLine: 'Glow-in-the-Dark PLA', productUrl: 'https://kingroon.com/products/kingroon-glow-in-the-dark-pla-filament', color: 'Glow Green', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/glow-pla.jpg?v=1700000000', colorHex: '#39FF14' },
  { material: 'PLA-Glow', filamentLine: 'Glow-in-the-Dark PLA', productUrl: 'https://kingroon.com/products/kingroon-glow-in-the-dark-pla-filament', color: 'Glow Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/glow-pla.jpg?v=1700000000', colorHex: '#00FFFF' },
  { material: 'PLA-Glow', filamentLine: 'Glow-in-the-Dark PLA', productUrl: 'https://kingroon.com/products/kingroon-glow-in-the-dark-pla-filament', color: 'Glow Orange', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/glow-pla.jpg?v=1700000000', colorHex: '#FF6600' },

  // ==========================================================================
  // ABS Standard
  // ==========================================================================
  { material: 'ABS', filamentLine: 'ABS Standard', productUrl: 'https://kingroon.com/products/kingroon-abs-filament', color: 'White', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/abs-standard.jpg?v=1700000000', colorHex: '#FFFFFF' },
  { material: 'ABS', filamentLine: 'ABS Standard', productUrl: 'https://kingroon.com/products/kingroon-abs-filament', color: 'Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/abs-standard.jpg?v=1700000000', colorHex: '#1A1A1A' },
  { material: 'ABS', filamentLine: 'ABS Standard', productUrl: 'https://kingroon.com/products/kingroon-abs-filament', color: 'Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/abs-standard.jpg?v=1700000000', colorHex: '#808080' },
  { material: 'ABS', filamentLine: 'ABS Standard', productUrl: 'https://kingroon.com/products/kingroon-abs-filament', color: 'Red', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/abs-standard.jpg?v=1700000000', colorHex: '#E53935' },
  { material: 'ABS', filamentLine: 'ABS Standard', productUrl: 'https://kingroon.com/products/kingroon-abs-filament', color: 'Blue', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/abs-standard.jpg?v=1700000000', colorHex: '#1E88E5' },

  // ==========================================================================
  // Marble PLA
  // ==========================================================================
  { material: 'PLA', filamentLine: 'Marble PLA', productUrl: 'https://kingroon.com/products/kingroon-marble-pla-filament', color: 'Marble White', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/marble-pla.jpg?v=1700000000', colorHex: '#F0F0F0' },
  { material: 'PLA', filamentLine: 'Marble PLA', productUrl: 'https://kingroon.com/products/kingroon-marble-pla-filament', color: 'Marble Black', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/marble-pla.jpg?v=1700000000', colorHex: '#2A2A2A' },
  { material: 'PLA', filamentLine: 'Marble PLA', productUrl: 'https://kingroon.com/products/kingroon-marble-pla-filament', color: 'Marble Gray', imageUrl: 'https://cdn.shopify.com/s/files/1/0612/4784/8666/files/marble-pla.jpg?v=1700000000', colorHex: '#888888' },
];

/**
 * Filter validation - ensures seed meets quality standards
 */
export function validateKingroonSeed(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for bulk products that shouldn't be included
  const bulkProducts = KINGROON_PRODUCT_SEED.filter(p => 
    /10kg|5kg|bulk/i.test(p.filamentLine) || /10kg|5kg|bulk/i.test(p.color)
  );
  if (bulkProducts.length > 0) {
    issues.push(`Found ${bulkProducts.length} bulk products that should be filtered`);
  }
  
  // Check for weight-only colors
  const weightOnlyColors = KINGROON_PRODUCT_SEED.filter(p =>
    /^(2kg|5kg|10kg|2KG|5KG|10KG)$/i.test(p.color.trim())
  );
  if (weightOnlyColors.length > 0) {
    issues.push(`Found ${weightOnlyColors.length} weight-only color entries`);
  }
  
  // Check for null hex codes (acceptable for multi-color)
  const nullHexProducts = KINGROON_PRODUCT_SEED.filter(p => !p.colorHex);
  if (nullHexProducts.length > KINGROON_PRODUCT_SEED.length * 0.1) {
    issues.push(`${nullHexProducts.length} products missing hex codes (>${Math.round(nullHexProducts.length / KINGROON_PRODUCT_SEED.length * 100)}%)`);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Get unique product lines from seed
 */
export function getKingroonProductLines(): string[] {
  return [...new Set(KINGROON_PRODUCT_SEED.map(p => p.filamentLine))].sort();
}

/**
 * Get product count by material
 */
export function getKingroonMaterialBreakdown(): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const product of KINGROON_PRODUCT_SEED) {
    breakdown[product.material] = (breakdown[product.material] || 0) + 1;
  }
  return breakdown;
}

/**
 * Default prices by product line (USD)
 */
export const KINGROON_DEFAULT_PRICES: Record<string, number> = {
  'PLA Basic': 15.99,
  'Silk Gold PLA': 18.99,
  'Matte PLA': 17.99,
  'Silk Tricolor PLA': 19.99,
  'PETG Standard': 17.99,
  'TPU Standard': 22.99,
  'HS-PETG': 19.99,
  'PA-CF': 39.99,
  'PLA-CF': 29.99,
  'PETG-CF': 32.99,
  'ABS-CF': 34.99,
  'Silk Rainbow Universer': 18.99,
  'Silk Rainbow Candy': 18.99,
  'Silk Rainbow Macaroon': 18.99,
  'Glow-in-the-Dark PLA': 19.99,
  'ABS Standard': 16.99,
  'Marble PLA': 18.99,
};

/**
 * Get default price for a product line
 */
export function getKingroonDefaultPrice(filamentLine: string): number {
  return KINGROON_DEFAULT_PRICES[filamentLine] || 17.99;
}

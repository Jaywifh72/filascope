/**
 * VoxelPLA CSV-Seeded Product Data
 * 
 * 38 filament variants across 3 product lines:
 * - PLA+ HS (Pro): 23 colors
 * - PETG+ HS (Pro): 11 colors  
 * - Galaxy PETG+ HS (Pro): 4 colors
 * 
 * All products are 1.75mm diameter, 1kg spools, high-speed capable.
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface VoxelPLASeedProduct {
  title: string;
  material: 'PLA+ HS' | 'PETG+ HS' | 'Galaxy PETG+ HS';
  color: string;
  productUrl: string;
  imageUrl: string;
  tdsUrl: string;
  handle: string;
}

// ============================================================================
// SEED DATA (38 variants from CSV)
// ============================================================================

export const VOXELPLA_PRODUCT_SEED: VoxelPLASeedProduct[] = [
  // PLA+ HS (Pro) - 23 colors
  { title: 'VOXELPLA PLA+ HS (Pro) Voxel Black 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Voxel Black', productUrl: 'https://voxelpla.com/products/voxel-pla-pro-1-75mm-black-filament', imageUrl: 'https://voxelpla.com/cdn/shop/products/IMG_0065-Edit.png', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxel-pla-pro-1-75mm-black-filament' },
  { title: 'VOXELPLA PLA+ HS (Pro) Cool White 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Cool White', productUrl: 'https://voxelpla.com/products/voxel-pla-pro-1-75mm-white-filament', imageUrl: 'https://voxelpla.com/cdn/shop/products/IMG_0153.png', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxel-pla-pro-1-75mm-white-filament' },
  { title: 'VOXELPLA PLA+ HS (Pro) Voxel Grey 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Voxel Grey', productUrl: 'https://voxelpla.com/products/voxel-pla-pro-1-75mm-grey-filament', imageUrl: 'https://voxelpla.com/cdn/shop/products/IMG_9883-Edit.png', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxel-pla-pro-1-75mm-grey-filament' },
  { title: 'VOXELPLA PLA+ HS (Pro) Fire Engine Red 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Fire Engine Red', productUrl: 'https://voxelpla.com/products/voxel-pla-pro-1-75mm-red-filament', imageUrl: 'https://voxelpla.com/cdn/shop/products/IMG_9816-Edit.png', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxel-pla-pro-1-75mm-red-filament' },
  { title: 'VOXELPLA PLA+ HS (Pro) Voxel Royal Blue 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Voxel Royal Blue', productUrl: 'https://voxelpla.com/products/voxel-pla-pro-1-75mm-blue-filament', imageUrl: 'https://voxelpla.com/cdn/shop/products/Blue2.png', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxel-pla-pro-1-75mm-blue-filament' },
  { title: 'VOXELPLA PLA+ HS (Pro) Fire Orange 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Fire Orange', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-fire-orange-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/products/IMG_0004-Edit.png', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-fire-orange-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Ice Clear 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Ice Clear', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-ice-clear-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/products/IMG_9980.png', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-ice-clear-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Forest Green 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Forest Green', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-forest-green-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/products/IMG_0032.png', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-forest-green-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Lavender Purple 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Lavender Purple', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-lavender-purple-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/products/IMG_0047-Edit.png', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-lavender-purple-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Yellow 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Yellow', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-yellow-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_1016-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-yellow-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Brown 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Brown', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-brown-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_0980-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-brown-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Silver 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Silver', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-silver-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_0959-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-silver-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) VOXEL Phantom Blue 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'VOXEL Phantom Blue', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-voxel-blue-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXELPLA_PLA_PLUS_VOXEL_Blue_2.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-voxel-blue-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Dark Purple 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Dark Purple', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-royal-purple-1-75mm-filament-1kg-3kg-and-5kg-copy', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_1698-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-royal-purple-1-75mm-filament-1kg-3kg-and-5kg-copy' },
  { title: 'VOXELPLA PLA+ HS (Pro) Army Green 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Army Green', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-army-green-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXELPLA_PLA_Plus_Pro_Army_Green_1.75mm_Filament_1kg_2.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-army-green-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Pink 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Pink', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-pink-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXELPLA_PLA_PLUS_Pink.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-pink-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Sky Blue 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Sky Blue', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-sky-blue-1-75mm-filament-1kg-3kg-and-5kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_1694-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-sky-blue-1-75mm-filament-1kg-3kg-and-5kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Witch Green 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Witch Green', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-witch-green-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXELPLA_PLA_Plus_Pro_Witch_Green_1.75mm_Filament_1kg_2.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-witch-green-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Wood 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Wood', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-wood-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_1688-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-wood-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Gold 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Gold', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-gold-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXELPLA_PLA_PLUS_Gold.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-gold-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Magenta 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Magenta', productUrl: 'https://voxelpla.com/products/voxelpla-pla-plus-pro-magenta-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXELPLA_PLA_Plus_Pro_Magenta_1.75mm_Filament_1kg_2.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-plus-pro-magenta-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Gunmetal Blue 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Gunmetal Blue', productUrl: 'https://voxelpla.com/products/voxelpla-pla-hs-pro-gunmetal-blue-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_7262-Edit_e3c716ef-ef77-49e9-8331-12b885de6bf1.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-hs-pro-gunmetal-blue-1-75mm-filament-1kg' },
  { title: 'VOXELPLA PLA+ HS (Pro) Champagne Beige 1.75mm Filament (1kg)', material: 'PLA+ HS', color: 'Champagne Beige', productUrl: 'https://voxelpla.com/products/voxelpla-pla-hs-pro-champagne-beige-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_7256-Edit_851eef13-4fd6-4cfc-a5ee-86e5e28726e2.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf', handle: 'voxelpla-pla-hs-pro-champagne-beige-1-75mm-filament-1kg' },
  
  // PETG+ HS (Pro) - 11 colors
  { title: 'VOXELPETG+ HS (Pro) Black 1.75mm Filament (1kg) (PETG+)', material: 'PETG+ HS', color: 'Black', productUrl: 'https://voxelpla.com/products/voxelpetg-pro-black-1-75mm-filament-1kg-petg', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXEL_BLACK_PETG.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxelpetg-pro-black-1-75mm-filament-1kg-petg' },
  { title: 'VOXELPETG+ HS (Pro) White 1.75mm Filament (1kg) (PETG+)', material: 'PETG+ HS', color: 'White', productUrl: 'https://voxelpla.com/products/voxelpetg-pro-white-1-75mm-filament-1kg-petg', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXELPETG_PETG_PLUS_White_2.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxelpetg-pro-white-1-75mm-filament-1kg-petg' },
  { title: 'VOXELPETG+ HS (Pro) Grey 1.75mm Filament (1kg) (PETG+)', material: 'PETG+ HS', color: 'Grey', productUrl: 'https://voxelpla.com/products/voxelpetg-pro-grey-1-75mm-filament-1kg-petg', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXEL_GREY_PETG.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxelpetg-pro-grey-1-75mm-filament-1kg-petg' },
  { title: 'VOXELPETG+ HS (Pro) Blue 1.75mm Filament (1kg) (PETG+)', material: 'PETG+ HS', color: 'Blue', productUrl: 'https://voxelpla.com/products/voxelpetg-pro-blue-1-75mm-filament-1kg-petg', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXELPETG_PETG_PLUS_Blue_1.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxelpetg-pro-blue-1-75mm-filament-1kg-petg' },
  { title: 'VOXELPETG+ HS (Pro) Red 1.75mm Filament (1kg) (PETG+)', material: 'PETG+ HS', color: 'Red', productUrl: 'https://voxelpla.com/products/voxelpetg-pro-red-1-75mm-filament-1kg-petg', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXEL_PETG_RED.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxelpetg-pro-red-1-75mm-filament-1kg-petg' },
  { title: 'VOXELPETG+ HS (Pro) Crystal Clear 1.75mm Filament (1kg) (PETG+)', material: 'PETG+ HS', color: 'Crystal Clear', productUrl: 'https://voxelpla.com/products/voxelpetg-pro-crystal-clear-1-75mm-filament-1kg-petg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_1689-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxelpetg-pro-crystal-clear-1-75mm-filament-1kg-petg' },
  { title: 'VOXELPETG+ HS (Pro) Silver 1.75mm Filament (1kg) (PETG+)', material: 'PETG+ HS', color: 'Silver', productUrl: 'https://voxelpla.com/products/voxelpetg-pro-silver-1-75mm-filament-1kg-petg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_1702-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxelpetg-pro-silver-1-75mm-filament-1kg-petg' },
  { title: 'VOXELPETG+ HS (Pro) Green 1.75mm Filament (1kg) (PETG+)', material: 'PETG+ HS', color: 'Green', productUrl: 'https://voxelpla.com/products/voxelpetg-pro-green-1-75mm-filament-1kg-petg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_1687-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxelpetg-pro-green-1-75mm-filament-1kg-petg' },
  { title: 'VOXELPETG+ HS (Pro) Yellow 1.75mm Filament (1kg) (PETG+)', material: 'PETG+ HS', color: 'Yellow', productUrl: 'https://voxelpla.com/products/voxelpetg-hs-pro-yellow', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXELPETG_HS_Pro_Yellow_1.75mm_Filament_1kg_PETG.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxelpetg-hs-pro-yellow' },
  { title: 'VOXELPETG+ HS (Pro) Orange 1.75mm Filament (1kg) (PETG+)', material: 'PETG+ HS', color: 'Orange', productUrl: 'https://voxelpla.com/products/voxelpetg-hs-pro-orange', imageUrl: 'https://voxelpla.com/cdn/shop/files/VOXELPETG_HS_Pro_Orange_1.75mm_Filament_1kg_PETG_3.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxelpetg-hs-pro-orange' },
  { title: 'VOXELPETG+ HS (Pro) Dark Purple 1.75mm Filament (1kg) (PETG+)', material: 'PETG+ HS', color: 'Dark Purple', productUrl: 'https://voxelpla.com/products/voxelpetg-hs-pro-dark-purple-1-75mm-filament-1kg-petg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_6715-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxelpetg-hs-pro-dark-purple-1-75mm-filament-1kg-petg' },
  
  // Galaxy PETG+ HS (Pro) - 4 colors (Shimmer finish)
  { title: 'VOXEL GALAXY PETG+ HS (Pro) Midnight Blue 1.75mm Filament (1kg)', material: 'Galaxy PETG+ HS', color: 'Midnight Blue', productUrl: 'https://voxelpla.com/products/voxel-galaxy-petg-hs-pro-midnight-blue-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_7318-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxel-galaxy-petg-hs-pro-midnight-blue-1-75mm-filament-1kg' },
  { title: 'VOXEL GALAXY PETG+ HS (Pro) Emerald Gold 1.75mm Filament (1kg)', material: 'Galaxy PETG+ HS', color: 'Emerald Gold', productUrl: 'https://voxelpla.com/products/voxel-galaxy-petg-hs-pro-emerald-gold-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_7332-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxel-galaxy-petg-hs-pro-emerald-gold-1-75mm-filament-1kg' },
  { title: 'VOXEL GALAXY PETG+ HS (Pro) Gioiello Purple 1.75mm Filament (1kg)', material: 'Galaxy PETG+ HS', color: 'Gioiello Purple', productUrl: 'https://voxelpla.com/products/voxel-galaxy-petg-hs-pro-gioiello-purple-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_7357-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxel-galaxy-petg-hs-pro-gioiello-purple-1-75mm-filament-1kg' },
  { title: 'VOXEL GALAXY PETG+ HS (Pro) Aurora Green 1.75mm Filament (1kg)', material: 'Galaxy PETG+ HS', color: 'Aurora Green', productUrl: 'https://voxelpla.com/products/voxel-galaxy-petg-hs-pro-aurora-green-1-75mm-filament-1kg', imageUrl: 'https://voxelpla.com/cdn/shop/files/IMG_7343-Edit.jpg', tdsUrl: 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf', handle: 'voxel-galaxy-petg-hs-pro-aurora-green-1-75mm-filament-1kg' },
];

// ============================================================================
// COLOR HEX MAPPING (curated for all seed colors)
// ============================================================================

export const VOXELPLA_COLOR_HEX_MAP: Record<string, string> = {
  // PLA+ HS colors
  'voxel black': '#1A1A1A',
  'cool white': '#F5F5F5',
  'voxel grey': '#808080',
  'fire engine red': '#DC2626',
  'voxel royal blue': '#4169E1',
  'fire orange': '#FF6B35',
  'ice clear': '#E8E8E8',
  'forest green': '#228B22',
  'lavender purple': '#E6E6FA',
  'yellow': '#FACC15',
  'brown': '#8B4513',
  'silver': '#C0C0C0',
  'voxel phantom blue': '#1E3A5F',
  'dark purple': '#4B0082',
  'army green': '#4B5320',
  'pink': '#EC4899',
  'sky blue': '#87CEEB',
  'witch green': '#2D5A27',
  'wood': '#DEB887',
  'gold': '#FFD700',
  'magenta': '#FF00FF',
  'gunmetal blue': '#2C3E50',
  'champagne beige': '#F7E7CE',
  
  // PETG+ HS colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'grey': '#808080',
  'blue': '#2563EB',
  'red': '#DC2626',
  'crystal clear': '#F0F0F0',
  'green': '#16A34A',
  'orange': '#EA580C',
  
  // Galaxy PETG+ HS colors (Shimmer)
  'midnight blue': '#191970',
  'emerald gold': '#50C878',
  'gioiello purple': '#9932CC',
  'aurora green': '#00FF7F',
};

// ============================================================================
// COLOR FAMILY RESOLUTION (from hex codes and color names)
// ============================================================================

const COLOR_FAMILY_HUE_RANGES: Array<{ family: string; hueMin: number; hueMax: number }> = [
  { family: 'Red', hueMin: 0, hueMax: 15 },
  { family: 'Red', hueMin: 345, hueMax: 360 },
  { family: 'Orange', hueMin: 15, hueMax: 45 },
  { family: 'Yellow', hueMin: 45, hueMax: 65 },
  { family: 'Green', hueMin: 65, hueMax: 170 },
  { family: 'Blue', hueMin: 170, hueMax: 260 },
  { family: 'Purple', hueMin: 260, hueMax: 290 },
  { family: 'Pink', hueMin: 290, hueMax: 345 },
];

// Helper: hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Helper: RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Resolve color_family from hex codes using HSL/name-based analysis
 */
export function getVoxelPLAColorFamily(hexCode: string | null, colorName: string): string {
  const lowerColor = colorName.toLowerCase();
  
  // Direct name matching for special cases
  if (lowerColor.includes('black') || lowerColor.includes('gunmetal')) return 'Black';
  if (lowerColor.includes('white') || lowerColor.includes('cool white')) return 'White';
  if (lowerColor.includes('grey') || lowerColor.includes('gray')) return 'Gray';
  if (lowerColor.includes('silver') || lowerColor.includes('champagne')) return 'Silver';
  if (lowerColor.includes('gold')) return 'Gold';
  if (lowerColor.includes('wood') || lowerColor.includes('brown') || lowerColor.includes('beige')) return 'Brown';
  if (lowerColor.includes('clear') || lowerColor.includes('ice') || lowerColor.includes('crystal')) return 'Clear';
  
  // Color name matching
  if (lowerColor.includes('red') || lowerColor.includes('fire engine')) return 'Red';
  if (lowerColor.includes('orange') || lowerColor.includes('fire orange')) return 'Orange';
  if (lowerColor.includes('yellow')) return 'Yellow';
  if (lowerColor.includes('green') || lowerColor.includes('forest') || lowerColor.includes('witch') || lowerColor.includes('army') || lowerColor.includes('aurora') || lowerColor.includes('emerald')) return 'Green';
  if (lowerColor.includes('blue') || lowerColor.includes('phantom') || lowerColor.includes('royal') || lowerColor.includes('sky') || lowerColor.includes('midnight')) return 'Blue';
  if (lowerColor.includes('purple') || lowerColor.includes('lavender') || lowerColor.includes('gioiello')) return 'Purple';
  if (lowerColor.includes('pink') || lowerColor.includes('magenta')) return 'Pink';
  
  // Fallback to hex-based analysis if hex is available
  if (hexCode) {
    const rgb = hexToRgb(hexCode);
    if (rgb) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      
      // Check for achromatic colors (low saturation)
      if (hsl.s < 15) {
        if (hsl.l < 20) return 'Black';
        if (hsl.l > 85) return 'White';
        return 'Gray';
      }
      
      // Find matching hue range
      for (const range of COLOR_FAMILY_HUE_RANGES) {
        if (hsl.h >= range.hueMin && hsl.h < range.hueMax) {
          return range.family;
        }
      }
    }
  }
  
  return 'Other';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function getVoxelPLAProductLineId(material: string): string {
  switch (material) {
    case 'PLA+ HS': return 'voxelpla__pla-plus__hs-pro';
    case 'PETG+ HS': return 'voxelpla__petg__hs-pro';
    case 'Galaxy PETG+ HS': return 'voxelpla__petg__galaxy';
    default: return 'voxelpla__unknown';
  }
}

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

export function normalizeVoxelPLASeedMaterial(material: string): string {
  if (material.includes('PLA')) return 'PLA+';
  if (material.includes('PETG')) return 'PETG';
  return material;
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

export interface VoxelPLAPrintSettings {
  nozzle_temp_min_c: number;
  nozzle_temp_max_c: number;
  bed_temp_min_c: number;
  bed_temp_max_c: number;
  print_speed_max_mms: number;
  high_speed_capable: boolean;
}

export const VOXELPLA_PRINT_SETTINGS: Record<string, VoxelPLAPrintSettings> = {
  'PLA+': {
    nozzle_temp_min_c: 200,
    nozzle_temp_max_c: 220,
    bed_temp_min_c: 45,
    bed_temp_max_c: 60,
    print_speed_max_mms: 300,
    high_speed_capable: true,
  },
  'PETG': {
    nozzle_temp_min_c: 230,
    nozzle_temp_max_c: 250,
    bed_temp_min_c: 60,
    bed_temp_max_c: 80,
    print_speed_max_mms: 250,
    high_speed_capable: true,
  },
};

export function getVoxelPLASeedPrintSettings(material: string): VoxelPLAPrintSettings | null {
  const normalized = normalizeVoxelPLASeedMaterial(material);
  return VOXELPLA_PRINT_SETTINGS[normalized] || null;
}

// ============================================================================
// FINISH TYPE
// ============================================================================

export function getVoxelPLAFinishType(material: string): string {
  if (material.includes('Galaxy')) return 'Shimmer';
  return 'Standard';
}

// ============================================================================
// TDS URLS
// ============================================================================

export function getVoxelPLASeedTdsUrl(material: string): string {
  if (material.includes('PLA')) {
    return 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PLA_pro_Technical_Data_Sheet.pdf';
  }
  return 'https://cdn.shopify.com/s/files/1/0632/8614/9338/files/PETG_pro_Technical_Data_Sheet.pdf';
}

// ============================================================================
// PRODUCT ID GENERATION
// ============================================================================

export function generateVoxelPLAProductId(material: string, color: string): string {
  const materialSlug = material.toLowerCase()
    .replace(/\s*\+\s*/g, '-plus-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const colorSlug = color.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  return `voxelpla-${materialSlug}-${colorSlug}`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getVoxelPLAColorHex(colorName: string): string | null {
  const normalized = colorName.toLowerCase().trim();
  return VOXELPLA_COLOR_HEX_MAP[normalized] || null;
}

// Clean title for display
export function cleanVoxelPLASeedTitle(color: string, material: string): string {
  // Format: "VoxelPLA PLA+ HS - Color"
  return `VoxelPLA ${material} - ${color}`;
}

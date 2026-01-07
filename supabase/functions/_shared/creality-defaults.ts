/**
 * Creality Brand Defaults
 * 
 * CSV-seeded configuration for Creality filament products from store.creality.com
 * Complete catalog of 122 color variants across 18 product lines
 * 
 * Product Lines:
 * - Hyper Series (PLA, PETG, ABS, PC) - High-speed flagship up to 600mm/s
 * - Hyper RFID - For CFS (Color Filament System)
 * - Hyper RFID Stardust - Sparkle finish with RFID
 * - Hyper Rainbow PLA - Multi-color gradient
 * - Hyper Luminous PLA - Glow in the dark
 * - Hyper Lightweight PLA - Foaming lightweight
 * - Hyper PLA CF / PETG CF - Carbon fiber reinforced
 * - Soleyin Ultra PLA - Budget-friendly line
 * - Soleyin Basic PETG - Budget PETG line
 * - CR-Silk PLA - Consumer silk finish
 * - CR-Wood / CR-PLA Carbon - Specialty materials
 * - Ender Fast PLA - Budget high-speed
 * - HP Series (ASA, TPU) - High-performance engineering
 * - PPA-CF - Engineering grade composite
 */

// ============================================================================
// PRODUCT SEED (122 color variants from CSV)
// ============================================================================

export interface CrealityProductSeed {
  material: string;
  filamentLine: string;
  color: string;
  productUrl: string;
  imageUrl: string;
}

export const CREALITY_PRODUCT_SEED: CrealityProductSeed[] = [
  // PLA - Hyper PLA RFID Stardust (9 colors)
  { material: 'PLA', filamentLine: 'Hyper PLA RFID Stardust', color: 'Stardust Blue', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-stardust-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_fa964dfb-8aa0-4184-a89a-62d2d539f0fd.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID Stardust', color: 'Stardust Green', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-stardust-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_14221415-7f5d-413c-87ea-00fb0cbae902.jpg' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID Stardust', color: 'Stardust Yellow', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-stardust-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_b8b4e53f-de36-48cf-a5a8-881c02c74665.jpg' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID Stardust', color: 'Stardust Orange', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-stardust-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_d4a74596-a5cb-4237-828f-3abbcde0f1d2.jpg' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID Stardust', color: 'Stardust Brown', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-stardust-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_1eb4c536-08f7-4458-afd6-c545019fe592.jpg' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID Stardust', color: 'Stardust Pink', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-stardust-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_743e8582-0461-4a41-8c7a-adf946c14201.jpg' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID Stardust', color: 'Stardust Gray', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-stardust-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_c8ba019b-d3fe-4ee8-8623-1adc7db8946c.jpg' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID Stardust', color: 'Stardust Coffee', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-stardust-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_6789f946-d312-4210-ba82-bef5c65b6d6b.jpg' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID Stardust', color: 'Stardust Purple', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-stardust-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_1ab2bdf5-e8da-40ec-9b6f-882574a5a0ac.jpg' },

  // PLA - Hyper PLA RFID (15 colors)
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Red', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/100.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Blue', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/9daa178847f4f34f3676e4cc8fb58cb8_2fcd9c3a-2948-412d-afbc-49ed8c2ac2b8.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'White', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/cc913d4cf32dab214a03c7cdd17bef1e.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Black', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/b2bb4c85c87a5e52bf6869aa70a7da90.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Gold', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/b920523a8066460be1f89075f1f23cfe.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Purple', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/19e1250514f46076edfe414fa3b2423d.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Viva Magenta', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/2d0e6230f7c4c08d697be896c903b804.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Peach Fuzz', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/f6c4217f0c97d1d177ae21e690e7d156.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Very Peri', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/fd992eff3b156db337342c42451b9649.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Skin', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/6d842e0a36d62e8479601c381306ccf6.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Brown', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/05039df1a17c63f037770bc69cb67683.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Grey', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/ec22f0ceafbce9d5bad763aed173c3a8.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Orange', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/455d859a33635437f167be4637fc1936_c518824c-5823-4be2-a1ad-6c474f65e092.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Green', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/daacd607e13cb01483393855bd5d37dc_45865529-d9f0-4435-beb4-3ab55e01c218.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA RFID', color: 'Yellow', productUrl: 'https://store.creality.com/products/hyper-pla-rfid-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/ac680fff3895a3f0dabfcbb57a51df55.png' },

  // PLA - Soleyin Ultra PLA (16 colors)
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Matte Rose Stone', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/070173fe6635dfd90d862b064326913f.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Matte Fluonte', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/fe277f3e01b8c2e891d4991a701dfbb1.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Matte Moonstone', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/ca890e32e81ab5c2f52c797dbb1db27e.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Strawberry Milk', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/4f543b8c9b90738d0a999fa22b73c9e1.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Rosehip', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/3d20cc69bea9ad3f0a994958e87c240f.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Light Green', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/d28cf5c1bc32fb29647811999097657e.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Almond Purple', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/7017c88a4dcdb87167f8c942d80f800b.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Pineapple Yellow', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Soleyin_Ultra_PLA.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'White', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/101.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Greenery', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Soleyin_Ultra_PLA_502b4986-bd9f-4019-850d-a9059da16c4b.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Ocean Blue', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/b188710dbc98ad4ee94520a1633ab675.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Gray', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/ee8af7c6b161cabe177597ef8b3451cf.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Black', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/16df83e859fa871f5c879e6f1b835664.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Matte White', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Soleyin_PLA_Matte.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Matte Black', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/16df83e859fa871f5c879e6f1b835664.png' },
  { material: 'PLA', filamentLine: 'Soleyin Ultra PLA', color: 'Matte Gray', productUrl: 'https://store.creality.com/products/soleyin-ultra-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/ee8af7c6b161cabe177597ef8b3451cf.png' },

  // PLA - Hyper PLA (16 colors)
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'White', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/102.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Black', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_4_4699a893-e569-4752-b983-ce6c8ec9ba09.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Grey', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_7.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Red', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_5.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Blue', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_9.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Green', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_10.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Skin', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_3.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Orange', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_15.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Brown', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_14.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Yellow', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_6.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Purple', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_13.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Peach Fuzz', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_12.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Viva Magenta', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_2.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Gold', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_6.png' },
  { material: 'PLA', filamentLine: 'Hyper PLA', color: 'Very Peri', productUrl: 'https://store.creality.com/products/hyper-series-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_11.png' },

  // PETG - Hyper PETG (8 colors)
  { material: 'PETG', filamentLine: 'Hyper PETG', color: 'Black', productUrl: 'https://store.creality.com/products/hyper-series-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PETG_5.png' },
  { material: 'PETG', filamentLine: 'Hyper PETG', color: 'White', productUrl: 'https://store.creality.com/products/hyper-series-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PETG_1.png' },
  { material: 'PETG', filamentLine: 'Hyper PETG', color: 'Grey', productUrl: 'https://store.creality.com/products/hyper-series-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PETG_3.png' },
  { material: 'PETG', filamentLine: 'Hyper PETG', color: 'Transparent', productUrl: 'https://store.creality.com/products/hyper-series-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PETG_4.png' },
  { material: 'PETG', filamentLine: 'Hyper PETG', color: 'Red', productUrl: 'https://store.creality.com/products/hyper-series-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PETG_2.png' },
  { material: 'PETG', filamentLine: 'Hyper PETG', color: 'Yellow', productUrl: 'https://store.creality.com/products/hyper-series-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/99_21de56d8-af24-4543-96ad-dfd935d0d0dc.png' },
  { material: 'PETG', filamentLine: 'Hyper PETG', color: 'Green', productUrl: 'https://store.creality.com/products/hyper-series-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PETG_8.png' },
  { material: 'PETG', filamentLine: 'Hyper PETG', color: 'Blue', productUrl: 'https://store.creality.com/products/hyper-series-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PETG_7.png' },

  // PLA - Hyper Rainbow PLA (3 colors)
  { material: 'PLA', filamentLine: 'Hyper Rainbow PLA', color: 'Wild Blossom-Long', productUrl: 'https://store.creality.com/products/hyper-rainbow-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Rainbow_PLA_2.png' },
  { material: 'PLA', filamentLine: 'Hyper Rainbow PLA', color: 'Spring Lake', productUrl: 'https://store.creality.com/products/hyper-rainbow-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Rainbow_PLA_1.png' },
  { material: 'PLA', filamentLine: 'Hyper Rainbow PLA', color: 'Wild Blossom-Short', productUrl: 'https://store.creality.com/products/hyper-rainbow-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Rainbow_PLA_3.png' },

  // ABS - Hyper ABS (3 colors)
  { material: 'ABS', filamentLine: 'Hyper ABS', color: 'Black', productUrl: 'https://store.creality.com/products/hyper-abs', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_ABS_2.png' },
  { material: 'ABS', filamentLine: 'Hyper ABS', color: 'White', productUrl: 'https://store.creality.com/products/hyper-abs', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_ABS_1.png' },
  { material: 'ABS', filamentLine: 'Hyper ABS', color: 'Grey', productUrl: 'https://store.creality.com/products/hyper-abs', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_ABS_3.png' },

  // PLA-CF - Hyper PLA CF (5 colors)
  { material: 'PLA-CF', filamentLine: 'Hyper PLA CF', color: 'Black', productUrl: 'https://store.creality.com/products/hyper-pla-cf', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_Carbon_Fibre_1.png' },
  { material: 'PLA-CF', filamentLine: 'Hyper PLA CF', color: 'Ochre', productUrl: 'https://store.creality.com/products/hyper-pla-cf', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_Carbon_Fibre_4.png' },
  { material: 'PLA-CF', filamentLine: 'Hyper PLA CF', color: 'Greyish Yellow', productUrl: 'https://store.creality.com/products/hyper-pla-cf', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_Carbon_Fibre_2.png' },
  { material: 'PLA-CF', filamentLine: 'Hyper PLA CF', color: 'Purple', productUrl: 'https://store.creality.com/products/hyper-pla-cf', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_Carbon_Fibre_3.png' },
  { material: 'PLA-CF', filamentLine: 'Hyper PLA CF', color: 'Dark Green', productUrl: 'https://store.creality.com/products/hyper-pla-cf', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Hyper_Series_PLA_Carbon_Fibre_5.png' },

  // ASA - HP ASA (1 color)
  { material: 'ASA', filamentLine: 'HP ASA', color: 'Black', productUrl: 'https://store.creality.com/products/creality-hp-asa-3d-printing-filament', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/ASA.png' },

  // PLA - CR-Silk PLA (12 colors)
  { material: 'PLA', filamentLine: 'CR-Silk PLA', color: 'White', productUrl: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-Silk_1.png' },
  { material: 'PLA', filamentLine: 'CR-Silk PLA', color: 'Rainbow', productUrl: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-Silk_2.png' },
  { material: 'PLA', filamentLine: 'CR-Silk PLA', color: 'Red Copper', productUrl: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-Silk_3.png' },
  { material: 'PLA', filamentLine: 'CR-Silk PLA', color: 'Blue', productUrl: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-Silk_9.png' },
  { material: 'PLA', filamentLine: 'CR-Silk PLA', color: 'Purple', productUrl: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-Silk_11.png' },
  { material: 'PLA', filamentLine: 'CR-Silk PLA', color: 'Gold', productUrl: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-Silk_6.png' },
  { material: 'PLA', filamentLine: 'CR-Silk PLA', color: 'Silver', productUrl: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-Silk_10.png' },
  { material: 'PLA', filamentLine: 'CR-Silk PLA', color: 'Yellow-Blue', productUrl: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-Silk_4.png' },
  { material: 'PLA', filamentLine: 'CR-Silk PLA', color: 'Pink-Purple', productUrl: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-Silk_11.png' },
  { material: 'PLA', filamentLine: 'CR-Silk PLA', color: 'Golden-Silver', productUrl: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-Silk_7.png' },
  { material: 'PLA', filamentLine: 'CR-Silk PLA', color: 'Blue-Green', productUrl: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-Silk_8.png' },
  { material: 'PLA', filamentLine: 'CR-Silk PLA', color: 'Golden Red', productUrl: 'https://store.creality.com/products/cr-silk-1-75mm-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-Silk_3.png' },

  // TPU - HP-TPU (2 colors)
  { material: 'TPU', filamentLine: 'HP-TPU', color: 'Transparent', productUrl: 'https://store.creality.com/products/hp-tpu-fdm-3d-printer-filament-1-75mm-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/HP-TPU_2.png' },
  { material: 'TPU', filamentLine: 'HP-TPU', color: 'White', productUrl: 'https://store.creality.com/products/hp-tpu-fdm-3d-printer-filament-1-75mm-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/HP-TPU_1.png' },

  // PC - Hyper PC (1 color)
  { material: 'PC', filamentLine: 'Hyper PC', color: 'Transparent', productUrl: 'https://store.creality.com/products/hyper-pc-filament-1-75mm-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/PC.png' },

  // PLA-Wood - CR-Wood (1 color)
  { material: 'PLA-Wood', filamentLine: 'CR-Wood', color: 'Wood', productUrl: 'https://store.creality.com/products/cr-wood-printing-filament-1-75mm-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/wood.png' },

  // PLA - Ender Fast PLA (3 colors)
  { material: 'PLA', filamentLine: 'Ender Fast PLA', color: 'White', productUrl: 'https://store.creality.com/products/ender-fast-1-75mm-pla-3d-printing-filament', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Ender_Fast_1.png' },
  { material: 'PLA', filamentLine: 'Ender Fast PLA', color: 'Black', productUrl: 'https://store.creality.com/products/ender-fast-1-75mm-pla-3d-printing-filament', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Ender_Fast_2.png' },
  { material: 'PLA', filamentLine: 'Ender Fast PLA', color: 'Red', productUrl: 'https://store.creality.com/products/ender-fast-1-75mm-pla-3d-printing-filament', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/Ender_Fast_11.png' },

  // PLA-CF - CR-PLA Carbon (1 color)
  { material: 'PLA-CF', filamentLine: 'CR-PLA Carbon', color: 'Black', productUrl: 'https://store.creality.com/products/cr-pla-carbon-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/CR-PLA_Carbon.png' },

  // PPA-CF - PPA-CF Filament (1 color)
  { material: 'PPA-CF', filamentLine: 'PPA-CF', color: 'Black', productUrl: 'https://store.creality.com/products/ppa-cf-filament-1-75mm-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/ppa-cf.png' },

  // PETG-CF - Hyper PETG-CF (8 colors)
  { material: 'PETG-CF', filamentLine: 'Hyper PETG-CF', color: 'Black', productUrl: 'https://store.creality.com/products/hyper-petg-cf-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/5_f8016438-258d-49e6-8020-21b27a422531.png' },
  { material: 'PETG-CF', filamentLine: 'Hyper PETG-CF', color: 'Danxia Red', productUrl: 'https://store.creality.com/products/hyper-petg-cf-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/bc7ffc460156a920a3e568845e0c50aa.jpg' },
  { material: 'PETG-CF', filamentLine: 'Hyper PETG-CF', color: 'Ancient Wood Green', productUrl: 'https://store.creality.com/products/hyper-petg-cf-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/6_f155bb82-80ef-4fbd-8199-567bd86770e2.png' },
  { material: 'PETG-CF', filamentLine: 'Hyper PETG-CF', color: 'Caramel Brown Coffee', productUrl: 'https://store.creality.com/products/hyper-petg-cf-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/279db9620e7f8fb6d31db21be3be4050.jpg' },
  { material: 'PETG-CF', filamentLine: 'Hyper PETG-CF', color: 'Phantom Purple', productUrl: 'https://store.creality.com/products/hyper-petg-cf-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/08c494c4325948cac1c49a67073178b7.jpg' },
  { material: 'PETG-CF', filamentLine: 'Hyper PETG-CF', color: 'Dusk Blue', productUrl: 'https://store.creality.com/products/hyper-petg-cf-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/59e23958fc845a11631f931c1a5a2571.jpg' },
  { material: 'PETG-CF', filamentLine: 'Hyper PETG-CF', color: 'Tea Brown', productUrl: 'https://store.creality.com/products/hyper-petg-cf-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/a812beb19d7f2a226d08c1ab04f7dcd6.jpg' },
  { material: 'PETG-CF', filamentLine: 'Hyper PETG-CF', color: 'Night Gray', productUrl: 'https://store.creality.com/products/hyper-petg-cf-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1de24505c1d00054e18d9d8589fa2c84.jpg' },

  // PLA - Hyper Luminous PLA (4 colors)
  { material: 'PLA', filamentLine: 'Hyper Luminous PLA', color: 'Luminous Yellow', productUrl: 'https://store.creality.com/products/hyper-luminous-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/7_c8e43de5-53b5-48da-8c08-2deafdc5939c.png' },
  { material: 'PLA', filamentLine: 'Hyper Luminous PLA', color: 'Luminous Green', productUrl: 'https://store.creality.com/products/hyper-luminous-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/8_ac629a70-80f6-4218-bfde-69a3fe467094.png' },
  { material: 'PLA', filamentLine: 'Hyper Luminous PLA', color: 'Luminous Pink', productUrl: 'https://store.creality.com/products/hyper-luminous-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/9_157c7b09-20e2-4a09-b513-bda952332daf.png' },
  { material: 'PLA', filamentLine: 'Hyper Luminous PLA', color: 'Luminous Blue', productUrl: 'https://store.creality.com/products/hyper-luminous-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/10_a7db9dbc-c64a-4225-9eaf-16b70f9dcc6a.png' },

  // PLA - Hyper Lightweight PLA (2 colors)
  { material: 'PLA', filamentLine: 'Hyper Lightweight PLA', color: 'White', productUrl: 'https://store.creality.com/products/hyper-lightweight-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_f46cd962-6a73-43c7-af0e-be7776265bf4.png' },
  { material: 'PLA', filamentLine: 'Hyper Lightweight PLA', color: 'Black', productUrl: 'https://store.creality.com/products/hyper-lightweight-pla-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_db1fb376-fb15-4cd6-9dfb-884ffbe585cd.png' },

  // PETG - Soleyin Basic PETG (12 colors)
  { material: 'PETG', filamentLine: 'Soleyin Basic PETG', color: 'Fern Green', productUrl: 'https://store.creality.com/products/soleyin-basic-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_241b0ebc-82aa-46b5-874c-a9cf278add9c.jpg' },
  { material: 'PETG', filamentLine: 'Soleyin Basic PETG', color: 'White', productUrl: 'https://store.creality.com/products/soleyin-basic-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/33ffae0206d3c7cd1aadac09875e5e96.jpg' },
  { material: 'PETG', filamentLine: 'Soleyin Basic PETG', color: 'Black', productUrl: 'https://store.creality.com/products/soleyin-basic-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_e2ef1fdf-65cf-4cb3-9350-447e13bb003f.jpg' },
  { material: 'PETG', filamentLine: 'Soleyin Basic PETG', color: 'Brick Red', productUrl: 'https://store.creality.com/products/soleyin-basic-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_15fc3ef2-b2aa-488b-a21e-f22e0d0d8456.jpg' },
  { material: 'PETG', filamentLine: 'Soleyin Basic PETG', color: 'Milk Tea Brown', productUrl: 'https://store.creality.com/products/soleyin-basic-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_47c8f2d8-fb93-4af7-af00-34e671a3c4cd.jpg' },
  { material: 'PETG', filamentLine: 'Soleyin Basic PETG', color: 'Sunset Blue', productUrl: 'https://store.creality.com/products/soleyin-basic-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_ae7e3f9c-cf40-40e8-abc9-a9087065939a.jpg' },
  { material: 'PETG', filamentLine: 'Soleyin Basic PETG', color: 'Snow Mountain Blue', productUrl: 'https://store.creality.com/products/soleyin-basic-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_74d70e7b-79bd-404c-8e67-24ba3c1135d9.jpg' },
  { material: 'PETG', filamentLine: 'Soleyin Basic PETG', color: 'Ginkgo Yellow', productUrl: 'https://store.creality.com/products/soleyin-basic-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_777f5685-171a-41f3-985e-afdd0565bb8a.jpg' },
  { material: 'PETG', filamentLine: 'Soleyin Basic PETG', color: 'Lavender', productUrl: 'https://store.creality.com/products/soleyin-basic-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_806f3540-57a8-4941-b796-d6b5844c24cb.jpg' },
  { material: 'PETG', filamentLine: 'Soleyin Basic PETG', color: 'Glacier Gray', productUrl: 'https://store.creality.com/products/soleyin-basic-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_787d6e44-d805-4b27-8809-378d33198d75.jpg' },
  { material: 'PETG', filamentLine: 'Soleyin Basic PETG', color: 'Mangosteen Purple', productUrl: 'https://store.creality.com/products/soleyin-basic-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_81167e6f-fc1d-4c8d-aa7e-5c0719e1058c.jpg' },
  { material: 'PETG', filamentLine: 'Soleyin Basic PETG', color: 'Chamomile', productUrl: 'https://store.creality.com/products/soleyin-basic-petg-3d-printing-filament-1kg', imageUrl: 'https://cdn.shopify.com/s/files/1/0893/0603/8637/files/1_0608faed-b893-4883-8e0d-73efdbf6d497.jpg' },
];

// ============================================================================
// MATERIAL NORMALIZATION
// ============================================================================

interface MaterialPattern {
  pattern: RegExp;
  material: string;
  highSpeedCapable?: boolean;
  isAbrasive?: boolean;
  enclosureRequired?: boolean;
}

const CREALITY_MATERIAL_PATTERNS: MaterialPattern[] = [
  // Carbon Fiber variants (must check first)
  { pattern: /pla[- ]?cf|hyper.*pla.*cf|carbon\s*fiber\s*pla|cf[- ]?pla|cr[- ]?pla\s*carbon/i, material: 'PLA-CF', isAbrasive: true, highSpeedCapable: true },
  { pattern: /petg[- ]?cf|hyper.*petg.*cf|carbon\s*fiber\s*petg/i, material: 'PETG-CF', isAbrasive: true, highSpeedCapable: true },
  { pattern: /ppa[- ]?cf/i, material: 'PPA-CF', isAbrasive: true, enclosureRequired: true },
  
  // Specialty PLA
  { pattern: /cr[- ]?wood|wood[- ]?pla|pla[- ]?wood/i, material: 'PLA-Wood' },
  { pattern: /silk|silky/i, material: 'PLA' }, // Silk is a finish, not material
  { pattern: /lightweight/i, material: 'PLA', highSpeedCapable: true }, // Foaming PLA
  { pattern: /luminous|glow/i, material: 'PLA', highSpeedCapable: true },
  
  // High-speed variants
  { pattern: /hyper.*pla|pla.*hyper|ender\s*fast.*pla/i, material: 'PLA', highSpeedCapable: true },
  { pattern: /hyper.*petg|petg.*hyper/i, material: 'PETG', highSpeedCapable: true },
  { pattern: /hyper.*abs|abs.*hyper/i, material: 'ABS', highSpeedCapable: true, enclosureRequired: true },
  { pattern: /hyper.*pc|pc.*hyper/i, material: 'PC', highSpeedCapable: true, enclosureRequired: true },
  { pattern: /soleyin/i, material: 'PLA', highSpeedCapable: true }, // Soleyin is high-speed budget line
  
  // Standard materials
  { pattern: /\bpla\+?\b/i, material: 'PLA' },
  { pattern: /\bpetg\b/i, material: 'PETG' },
  { pattern: /\babs\b/i, material: 'ABS', enclosureRequired: true },
  { pattern: /\basa\b|hp[- ]?asa/i, material: 'ASA', enclosureRequired: true },
  { pattern: /\btpu\b|hp[- ]?tpu/i, material: 'TPU' },
  { pattern: /\bpc\b/i, material: 'PC', enclosureRequired: true },
  { pattern: /\bpvb\b/i, material: 'PVB' },
];

export function normalizeCrealityMaterial(title: string): {
  material: string;
  highSpeedCapable: boolean;
  isAbrasive: boolean;
  enclosureRequired: boolean;
} {
  const normalizedTitle = title.toLowerCase();
  
  for (const { pattern, material, highSpeedCapable, isAbrasive, enclosureRequired } of CREALITY_MATERIAL_PATTERNS) {
    if (pattern.test(normalizedTitle)) {
      // Check for Hyper/Ender Fast/Soleyin keywords for high-speed flag
      const isHighSpeed = highSpeedCapable || /hyper|ender\s*fast|soleyin/i.test(normalizedTitle);
      
      return {
        material,
        highSpeedCapable: isHighSpeed,
        isAbrasive: isAbrasive || false,
        enclosureRequired: enclosureRequired || false,
      };
    }
  }
  
  return {
    material: 'PLA', // Default
    highSpeedCapable: /hyper|ender\s*fast|soleyin/i.test(normalizedTitle),
    isAbrasive: false,
    enclosureRequired: false,
  };
}

// ============================================================================
// FINISH TYPE DETECTION
// ============================================================================

export type FinishType = 'Standard' | 'Silk' | 'Matte' | 'Multi' | 'Sparkle' | 'Translucent' | 'Glow';

export function extractCrealityFinishType(title: string): FinishType {
  const t = title.toLowerCase();
  
  if (/silk|silky|cr[- ]?silk/i.test(t)) return 'Silk';
  if (/matte/i.test(t)) return 'Matte';
  if (/rainbow|gradient|dual[- ]?color|tri[- ]?color/i.test(t)) return 'Multi';
  if (/stardust|sparkle|glitter|shimmer/i.test(t)) return 'Sparkle';
  if (/translucent|transparent|clear/i.test(t)) return 'Translucent';
  if (/glow|luminous/i.test(t)) return 'Glow';
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateCrealityProductLineId(filamentLine: string, material: string): string {
  const line = filamentLine.toLowerCase();
  const mat = material.toLowerCase().replace(/[- ]/g, '-');
  
  // Map filament line names to product line IDs
  if (/hyper.*rfid.*stardust/i.test(line)) return `creality__${mat}__hyper-rfid-stardust`;
  if (/hyper.*rfid/i.test(line) && !/stardust/i.test(line)) return `creality__${mat}__hyper-rfid`;
  if (/hyper.*rainbow/i.test(line)) return `creality__${mat}__hyper-rainbow`;
  if (/hyper.*luminous/i.test(line)) return `creality__${mat}__hyper-luminous`;
  if (/hyper.*lightweight/i.test(line)) return `creality__${mat}__hyper-lightweight`;
  if (/hyper.*pla.*cf/i.test(line)) return `creality__${mat}__hyper-pla-cf`;
  if (/hyper.*petg.*cf/i.test(line)) return `creality__${mat}__hyper-petg-cf`;
  if (/hyper.*pla/i.test(line) && !/cf/i.test(line)) return `creality__${mat}__hyper`;
  if (/hyper.*petg/i.test(line) && !/cf/i.test(line)) return `creality__${mat}__hyper`;
  if (/hyper.*abs/i.test(line)) return `creality__${mat}__hyper`;
  if (/hyper.*pc/i.test(line)) return `creality__${mat}__hyper`;
  
  // Ender Fast
  if (/ender\s*fast/i.test(line)) return `creality__${mat}__ender-fast`;
  
  // Soleyin lines
  if (/soleyin.*ultra/i.test(line)) return `creality__${mat}__soleyin-ultra`;
  if (/soleyin.*basic.*petg/i.test(line)) return `creality__petg__soleyin-basic`;
  if (/soleyin/i.test(line)) return `creality__${mat}__soleyin`;
  
  // CR Series
  if (/cr[- ]?silk/i.test(line)) return `creality__${mat}__cr-silk`;
  if (/cr[- ]?wood/i.test(line)) return `creality__pla-wood__cr-wood`;
  if (/cr[- ]?pla\s*carbon/i.test(line)) return `creality__pla-cf__cr-carbon`;
  
  // HP Series
  if (/hp[- ]?asa/i.test(line)) return `creality__asa__hp`;
  if (/hp[- ]?tpu/i.test(line)) return `creality__tpu__hp`;
  
  // Engineering materials
  if (/ppa[- ]?cf/i.test(line)) return `creality__ppa-cf__standard`;
  
  // Default
  return `creality__${mat}__standard`;
}

// ============================================================================
// TDS URL MAPPING
// ============================================================================

const CREALITY_TDS_URLS: Record<string, string> = {
  // Hyper Series
  'hyper-pla': 'https://download.creality.com/download/filament/TDS_Hyper_PLA.pdf',
  'hyper-petg': 'https://download.creality.com/download/filament/TDS_Hyper_PETG.pdf',
  'hyper-abs': 'https://download.creality.com/download/filament/TDS_ABS.pdf',
  'hyper-pc': 'https://download.creality.com/download/filament/TDS_PC.pdf',
  
  // Standard materials
  'pla': 'https://download.creality.com/download/filament/TDS_PLA.pdf',
  'silk-pla': 'https://download.creality.com/download/filament/TDS_Silk_PLA.pdf',
  'petg': 'https://download.creality.com/download/filament/TDS_PETG.pdf',
  'abs': 'https://download.creality.com/download/filament/TDS_ABS.pdf',
  'tpu': 'https://download.creality.com/download/filament/TDS_TPU.pdf',
  'asa': 'https://download.creality.com/download/filament/TDS_ASA.pdf',
  'pc': 'https://download.creality.com/download/filament/TDS_PC.pdf',
  'pla-wood': 'https://download.creality.com/download/filament/TDS_Wood_PLA.pdf',
  'pla-cf': 'https://download.creality.com/download/filament/TDS_Carbon_Fiber_PLA.pdf',
  'petg-cf': 'https://download.creality.com/download/filament/TDS_PETG_CF.pdf',
};

export function getCrealityTdsUrl(filamentLine: string, material: string): string | null {
  const line = filamentLine.toLowerCase();
  const mat = material.toLowerCase();
  
  // Hyper Series specific
  if (/hyper/i.test(line)) {
    if (mat === 'pla' || mat === 'pla-cf') return CREALITY_TDS_URLS['hyper-pla'];
    if (mat === 'petg' || mat === 'petg-cf') return CREALITY_TDS_URLS['hyper-petg'];
    if (mat === 'abs') return CREALITY_TDS_URLS['hyper-abs'];
    if (mat === 'pc') return CREALITY_TDS_URLS['hyper-pc'];
  }
  
  // Silk PLA
  if (/silk/i.test(line) && mat === 'pla') return CREALITY_TDS_URLS['silk-pla'];
  
  // Material-based lookup
  const matKey = mat.replace(' ', '-');
  return CREALITY_TDS_URLS[matKey] || null;
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
}

const CREALITY_PRINT_SETTINGS: Record<string, PrintSettings> = {
  // Hyper Series (high-speed optimized)
  'hyper-pla': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 25, bedTempMax: 60, printSpeedMax: 600 },
  'hyper-petg': { nozzleTempMin: 220, nozzleTempMax: 260, bedTempMin: 60, bedTempMax: 80, printSpeedMax: 300 },
  'hyper-abs': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, printSpeedMax: 300 },
  'hyper-pc': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 90, bedTempMax: 110, printSpeedMax: 200 },
  
  // Standard materials
  'pla': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 40, bedTempMax: 60 },
  'silk-pla': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 40, bedTempMax: 60 },
  'petg': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 60, bedTempMax: 80 },
  'abs': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110 },
  'asa': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 90, bedTempMax: 110 },
  'tpu': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 20, bedTempMax: 50 },
  'pc': { nozzleTempMin: 260, nozzleTempMax: 280, bedTempMin: 90, bedTempMax: 110 },
  'pla-wood': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 40, bedTempMax: 60 },
  'pla-cf': { nozzleTempMin: 200, nozzleTempMax: 230, bedTempMin: 40, bedTempMax: 60 },
  'petg-cf': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 90 },
  'ppa-cf': { nozzleTempMin: 280, nozzleTempMax: 310, bedTempMin: 100, bedTempMax: 120 },
};

export function getCrealityPrintSettings(filamentLine: string, material: string): PrintSettings | null {
  const line = filamentLine.toLowerCase();
  const mat = material.toLowerCase().replace(' ', '-');
  
  // Hyper Series specific
  if (/hyper/i.test(line)) {
    const hyperKey = `hyper-${mat.replace('-cf', '')}`;
    if (CREALITY_PRINT_SETTINGS[hyperKey]) return CREALITY_PRINT_SETTINGS[hyperKey];
  }
  
  // Silk PLA
  if (/silk/i.test(line) && mat === 'pla') return CREALITY_PRINT_SETTINGS['silk-pla'];
  
  // Material-based lookup
  return CREALITY_PRINT_SETTINGS[mat] || CREALITY_PRINT_SETTINGS['pla'];
}

// ============================================================================
// COLOR MAPPING (90+ colors)
// ============================================================================

const CREALITY_COLOR_MAPPING: Record<string, string> = {
  // Standard colors
  'black': '#1A1A1A',
  'white': '#FFFFFF',
  'grey': '#808080',
  'gray': '#808080',
  'red': '#E53935',
  'blue': '#1E88E5',
  'green': '#43A047',
  'yellow': '#FDD835',
  'orange': '#FB8C00',
  'purple': '#8E24AA',
  'pink': '#EC407A',
  'brown': '#795548',
  'skin': '#FFCC99',
  'beige': '#F5DEB3',
  'cream': '#FFFDD0',
  
  // Silk/Metallic colors
  'gold': '#FFD700',
  'silver': '#C0C0C0',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'rose gold': '#B76E79',
  'red copper': '#B87333',
  'golden red': '#B8860B',
  
  // Translucent
  'transparent': '#F0F0F0',
  'clear': '#F0F0F0',
  'translucent': '#F0F0F0',
  
  // Rainbow/Multi
  'rainbow': '#FF6B6B',
  'wild blossom-long': '#FF69B4',
  'wild blossom-short': '#FF69B4',
  'spring lake': '#87CEEB',
  
  // Stardust Series (Sparkle finish)
  'stardust blue': '#4A7BB7',
  'stardust green': '#5D9B5D',
  'stardust yellow': '#E5C84C',
  'stardust orange': '#E58C4C',
  'stardust brown': '#8B6914',
  'stardust pink': '#E57CB5',
  'stardust gray': '#7A7A7A',
  'stardust grey': '#7A7A7A',
  'stardust coffee': '#6F4E37',
  'stardust purple': '#9370DB',
  
  // Pantone Colors of the Year
  'viva magenta': '#BB2649',
  'peach fuzz': '#FFBE98',
  'very peri': '#6667AB',
  
  // Soleyin/Fancy colors
  'matte rose stone': '#C4A4A4',
  'matte fluonte': '#E0E0E0',
  'matte moonstone': '#D4D4D4',
  'strawberry milk': '#FFCDD2',
  'rosehip': '#FF6B6B',
  'light green': '#90EE90',
  'almond purple': '#DDA0DD',
  'pineapple yellow': '#FFEB3B',
  'greenery': '#6B8E23',
  'ocean blue': '#1E90FF',
  'matte white': '#F5F5F5',
  'matte black': '#2A2A2A',
  'matte gray': '#6A6A6A',
  'matte grey': '#6A6A6A',
  
  // Dual-color silk
  'yellow-blue': '#7EC8E3',
  'pink-purple': '#DA70D6',
  'golden-silver': '#D4AF37',
  'blue-green': '#20B2AA',
  
  // CF special colors
  'ochre': '#CC7722',
  'greyish yellow': '#BDB76B',
  'dark green': '#006400',
  'danxia red': '#C04536',
  'ancient wood green': '#4A5D23',
  'caramel brown coffee': '#6F4E37',
  'phantom purple': '#4B0082',
  'dusk blue': '#2C3E50',
  'tea brown': '#9B7653',
  'night gray': '#3D3D3D',
  'night grey': '#3D3D3D',
  
  // Luminous (Glow in the dark)
  'luminous yellow': '#FFFF00',
  'luminous green': '#00FF00',
  'luminous pink': '#FF69B4',
  'luminous blue': '#00BFFF',
  
  // Soleyin Basic PETG colors
  'fern green': '#4F7942',
  'brick red': '#CB4154',
  'milk tea brown': '#C4A484',
  'sunset blue': '#4A6FA5',
  'snow mountain blue': '#B0C4DE',
  'ginkgo yellow': '#F0C420',
  'glacier gray': '#9CA9B3',
  'glacier grey': '#9CA9B3',
  'mangosteen purple': '#7B3F61',
  'chamomile': '#F4E285',
  'lavender': '#E6E6FA',
  
  // Wood
  'wood': '#C19A6B',
  
  // Additional shades
  'navy': '#000080',
  'cyan': '#00FFFF',
  'magenta': '#FF00FF',
  'teal': '#008080',
  'olive': '#808000',
  'maroon': '#800000',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'turquoise': '#40E0D0',
  'ivory': '#FFFFF0',
  'charcoal': '#36454F',
  'slate': '#708090',
  'midnight blue': '#191970',
  'forest green': '#228B22',
  'wine red': '#722F37',
  'light blue': '#87CEEB',
  'dark blue': '#00008B',
  'light grey': '#D3D3D3',
  'light gray': '#D3D3D3',
  'dark grey': '#404040',
  'dark gray': '#404040',
  'space grey': '#5F5F5F',
  'space gray': '#5F5F5F',
};

export function getCrealityColorHex(colorName: string): string | null {
  if (!colorName) return null;
  
  const normalized = colorName.toLowerCase().trim();
  
  // 1. Direct exact match (highest priority)
  if (CREALITY_COLOR_MAPPING[normalized]) {
    return '#' + CREALITY_COLOR_MAPPING[normalized].replace('#', '');
  }
  
  // 2. Check if colorName contains a mapping key (longest match first)
  // e.g., "Stardust Blue" contains "stardust blue"
  // IMPORTANT: Only match if colorName CONTAINS the key, not vice versa
  // This prevents "yellow" from matching "yellow-blue"
  const sortedKeys = Object.keys(CREALITY_COLOR_MAPPING).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (normalized.includes(key)) {
      return '#' + CREALITY_COLOR_MAPPING[key].replace('#', '');
    }
  }
  
  return null;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanCrealityTitle(title: string): string {
  return title
    .replace(/creality\s*/gi, '')
    .replace(/3d\s*print(ing|er)?\s*filament/gi, '')
    .replace(/filament/gi, '')
    .replace(/1\.75\s*mm/gi, '')
    .replace(/2\.85\s*mm/gi, '')
    .replace(/\d+\s*(kg|g)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface CrealityEnrichmentResult {
  material: string;
  finishType: FinishType;
  productLineId: string;
  tdsUrl: string | null;
  printSettings: PrintSettings | null;
  colorHex: string | null;
  colorName: string | null;
  cleanedTitle: string;
  highSpeedCapable: boolean;
  isAbrasive: boolean;
  enclosureRequired: boolean;
  diameterMm: number;
  spoolWeightGrams: number;
}

export function enrichCrealityProduct(
  filamentLine: string,
  color: string,
  material: string
): CrealityEnrichmentResult {
  // Normalize material
  const materialInfo = normalizeCrealityMaterial(filamentLine);
  const finalMaterial = material || materialInfo.material;
  
  // Extract finish type from filament line
  const finishType = extractCrealityFinishType(filamentLine);
  
  // Generate product line ID
  const productLineId = generateCrealityProductLineId(filamentLine, finalMaterial);
  
  // Get TDS URL
  const tdsUrl = getCrealityTdsUrl(filamentLine, finalMaterial);
  
  // Get print settings
  const printSettings = getCrealityPrintSettings(filamentLine, finalMaterial);
  
  // Get color hex
  const colorHex = getCrealityColorHex(color);
  
  // Clean title
  const cleanedTitle = cleanCrealityTitle(filamentLine);
  
  return {
    material: finalMaterial,
    finishType,
    productLineId,
    tdsUrl,
    printSettings,
    colorHex,
    colorName: color,
    cleanedTitle,
    highSpeedCapable: materialInfo.highSpeedCapable,
    isAbrasive: materialInfo.isAbrasive,
    enclosureRequired: materialInfo.enclosureRequired,
    diameterMm: 1.75, // Creality only makes 1.75mm
    spoolWeightGrams: 1000, // Standard 1kg spools
  };
}

// ============================================================================
// STORE INFO
// ============================================================================

export const CREALITY_STORE_INFO = {
  baseUrl: 'https://store.creality.com',
  collectionsUrl: 'https://store.creality.com/collections/filament',
  vendor: 'Creality',
  platformType: 'shopify',
  defaultDiameter: 1.75,
  defaultWeight: 1000,
  defaultCurrency: 'USD',
};

// ============================================================================
// DEFAULT PRICES BY PRODUCT LINE (fallback when Shopify API is blocked)
// Keys match generated product_line_id format: creality__<material>__<line>
// ============================================================================

export const CREALITY_DEFAULT_PRICES: Record<string, number> = {
  // Hyper Series (flagship high-speed)
  'creality__pla__hyper-rfid': 24.99,
  'creality__pla__hyper-rfid-stardust': 26.99,
  'creality__pla__hyper': 21.99,
  'creality__petg__hyper': 25.99,
  'creality__abs__hyper': 24.99,
  'creality__pc__hyper': 29.99,
  'creality__pla-cf__hyper-pla-cf': 34.99,
  'creality__petg-cf__hyper-petg-cf': 39.99,
  'creality__pla__hyper-rainbow': 24.99,
  'creality__pla__hyper-luminous': 26.99,
  'creality__pla__hyper-lightweight': 27.99,
  
  // Soleyin Series (budget-friendly)
  'creality__pla__soleyin-ultra': 18.99,
  'creality__petg__soleyin-basic': 19.99,
  
  // CR Series (consumer)
  'creality__pla__cr-silk': 22.99,
  'creality__pla-wood__cr-wood': 24.99,
  'creality__pla-cf__cr-carbon': 29.99,
  
  // Ender Fast (budget high-speed)
  'creality__pla__ender-fast': 17.99,
  
  // HP Series (engineering)
  'creality__asa__hp': 27.99,
  'creality__tpu__hp': 29.99,
  
  // PPA-CF (engineering composite)
  'creality__ppa-cf__standard': 49.99,
};

/**
 * Get default price for a product line
 */
export function getCrealityDefaultPrice(productLineId: string): number | null {
  return CREALITY_DEFAULT_PRICES[productLineId] || null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get unique base product URLs from seed (strips query params)
 */
export function getUniqueBaseProductUrls(): string[] {
  const urls = new Set<string>();
  for (const item of CREALITY_PRODUCT_SEED) {
    urls.add(item.productUrl.split('?')[0]);
  }
  return Array.from(urls);
}

/**
 * Check if a product should be excluded (bundles, packs, etc.)
 */
export function shouldExcludeCrealityProduct(title: string): boolean {
  const excluded = ['pack', 'bundle', 'set of', 'starter kit', 'combo', 'variety'];
  return excluded.some(term => title.toLowerCase().includes(term));
}

/**
 * Count products by product line
 */
export function getProductLineCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of CREALITY_PRODUCT_SEED) {
    const enrichment = enrichCrealityProduct(item.filamentLine, item.color, item.material);
    counts[enrichment.productLineId] = (counts[enrichment.productLineId] || 0) + 1;
  }
  return counts;
}

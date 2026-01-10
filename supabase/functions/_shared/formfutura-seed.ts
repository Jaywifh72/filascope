/**
 * FORMFUTURA PRODUCT SEED
 * 
 * CSV-seeded data for high-fidelity sync.
 * Source: FormFutura Odoo 16 e-commerce (formfutura.com)
 * 
 * Version: 2026-01-09-v1
 */

export const FORMFUTURA_SEED_VERSION = '2026-01-09-v1';

export interface FormFuturaSeedProduct {
  material: string;           // Material category from CSV
  filamentName: string;       // Product line name
  productUrl: string;         // Product page URL
  imageUrl: string;           // Product image URL
  basePriceEur: number;       // Base price in EUR (will be converted to USD)
}

// 80 product lines from FormFutura CSV with EUR base prices
export const FORMFUTURA_PRODUCT_SEED: FormFuturaSeedProduct[] = [
  // PLA Family
  { material: 'PLA', filamentName: 'Bulk PLA', productUrl: 'https://www.formfutura.com/filaments/bulk-pla', imageUrl: 'https://www.formfutura.com/web/image/product.template/15209/image_512', basePriceEur: 11.56 },
  { material: 'PLA', filamentName: 'EasyFil ePLA', productUrl: 'https://www.formfutura.com/filaments/easyfil-epla', imageUrl: 'https://www.formfutura.com/web/image/product.template/102/image_512', basePriceEur: 16.52 },
  { material: 'PLA', filamentName: 'Volcano PLA 150C', productUrl: 'https://www.formfutura.com/filaments/volcano-pla-150c', imageUrl: 'https://www.formfutura.com/web/image/product.template/15204/image_512', basePriceEur: 22.72 },
  { material: 'PLA', filamentName: 'Volcano PLA', productUrl: 'https://www.formfutura.com/filaments/volcano-pla', imageUrl: 'https://www.formfutura.com/web/image/product.template/145/image_512', basePriceEur: 22.72 },
  { material: 'PLA', filamentName: 'Matt PLA', productUrl: 'https://www.formfutura.com/filaments/matt-pla', imageUrl: 'https://www.formfutura.com/web/image/product.template/123/image_512', basePriceEur: 22.72 },
  { material: 'PLA', filamentName: 'Premium PLA CF03', productUrl: 'https://www.formfutura.com/filaments/premium-pla-cf03', imageUrl: 'https://www.formfutura.com/web/image/product.template/15029/image_512', basePriceEur: 44.62 },
  { material: 'PLA', filamentName: 'Premium PLA', productUrl: 'https://www.formfutura.com/filaments/premium-pla', imageUrl: 'https://www.formfutura.com/web/image/product.template/133/image_512', basePriceEur: 18.18 },
  { material: 'PLA', filamentName: 'EasyFil PLA - Glow in the Dark', productUrl: 'https://www.formfutura.com/filaments/easyfil-pla-glow-in-the-dark', imageUrl: 'https://www.formfutura.com/web/image/product.template/106/image_512', basePriceEur: 28.92 },
  { material: 'PLA', filamentName: 'Galaxy PLA', productUrl: 'https://www.formfutura.com/filaments/galaxy-pla', imageUrl: 'https://www.formfutura.com/web/image/product.template/109/image_512', basePriceEur: 24.79 },
  { material: 'PLA', filamentName: 'High Gloss PLA', productUrl: 'https://www.formfutura.com/filaments/high-gloss-pla', imageUrl: 'https://www.formfutura.com/web/image/product.template/112/image_512', basePriceEur: 22.72 },
  { material: 'PLA', filamentName: 'High Gloss PLA ColorMorph', productUrl: 'https://www.formfutura.com/filaments/high-gloss-pla-colormorph', imageUrl: 'https://www.formfutura.com/web/image/product.template/113/image_512', basePriceEur: 28.92 },
  { material: 'PLA', filamentName: 'ReFill PLA', productUrl: 'https://www.formfutura.com/filaments/refill-pla', imageUrl: 'https://www.formfutura.com/web/image/product.template/136/image_512', basePriceEur: 14.45 },
  { material: 'PLA', filamentName: 'Tough PLA', productUrl: 'https://www.formfutura.com/filaments/tough-pla', imageUrl: 'https://www.formfutura.com/web/image/product.template/144/image_512', basePriceEur: 26.44 },
  { material: 'PLA', filamentName: 'Premium PLA Flame Retardant', productUrl: 'https://www.formfutura.com/premium-pla-flame-retardant', imageUrl: 'https://www.formfutura.com/web/image/product.template/15155/image_512', basePriceEur: 35.53 },
  
  // PETG Family
  { material: 'PETG', filamentName: 'Bulk PETG', productUrl: 'https://www.formfutura.com/filaments/bulk-petg', imageUrl: 'https://www.formfutura.com/web/image/product.template/15210/image_512', basePriceEur: 13.22 },
  { material: 'PETG', filamentName: 'HDglass', productUrl: 'https://www.formfutura.com/hdglass', imageUrl: 'https://www.formfutura.com/web/image/product.template/110/image_512', basePriceEur: 24.79 },
  { material: 'PETG', filamentName: 'EasyFil ePETG', productUrl: 'https://www.formfutura.com/filaments/easyfil-epetg', imageUrl: 'https://www.formfutura.com/web/image/product.template/101/image_512', basePriceEur: 18.18 },
  { material: 'PETG', filamentName: 'ReFill PETG', productUrl: 'https://www.formfutura.com/refill-petg', imageUrl: 'https://www.formfutura.com/web/image/product.template/135/image_512', basePriceEur: 16.52 },
  { material: 'PETG', filamentName: 'Premium PETG Flame Retardant', productUrl: 'https://www.formfutura.com/premium-petg-flame-retardant', imageUrl: 'https://www.formfutura.com/web/image/product.template/15154/image_512', basePriceEur: 35.53 },
  
  // ASA Family
  { material: 'ASA', filamentName: 'ApolloX', productUrl: 'https://www.formfutura.com/filaments/apollox', imageUrl: 'https://www.formfutura.com/web/image/product.template/89/image_512', basePriceEur: 26.44 },
  { material: 'ASA', filamentName: 'AthenaX', productUrl: 'https://www.formfutura.com/athenax', imageUrl: 'https://www.formfutura.com/web/image/product.template/15098/image_512', basePriceEur: 28.92 },
  { material: 'ASA', filamentName: 'AthenaX CF10', productUrl: 'https://www.formfutura.com/athenax-cf10', imageUrl: 'https://www.formfutura.com/web/image/product.template/15100/image_512', basePriceEur: 52.89 },
  { material: 'ASA', filamentName: 'AthenaX GF10', productUrl: 'https://www.formfutura.com/athenax-gf10', imageUrl: 'https://www.formfutura.com/web/image/product.template/15101/image_512', basePriceEur: 39.67 },
  { material: 'ASA', filamentName: 'ReForm - rApollo', productUrl: 'https://www.formfutura.com/reform-rapollo', imageUrl: 'https://www.formfutura.com/web/image/product.template/137/image_512', basePriceEur: 24.79 },
  { material: 'ASA', filamentName: 'ApolloX CF10', productUrl: 'https://www.formfutura.com/apollox-cf10', imageUrl: 'https://www.formfutura.com/web/image/product.template/14836/image_512', basePriceEur: 52.89 },
  { material: 'ASA', filamentName: 'ApolloX Kevlar', productUrl: 'https://www.formfutura.com/apollox-kevlar', imageUrl: 'https://www.formfutura.com/web/image/product.template/14837/image_512', basePriceEur: 44.62 },
  { material: 'ASA', filamentName: 'ApolloX Flame Retardant', productUrl: 'https://www.formfutura.com/apollox-flame-retardant', imageUrl: 'https://www.formfutura.com/web/image/product.template/15153/image_512', basePriceEur: 39.67 },
  { material: 'ASA', filamentName: 'ApolloX Foaming', productUrl: 'https://www.formfutura.com/apollox-foaming', imageUrl: 'https://www.formfutura.com/web/image/product.template/15158/image_512', basePriceEur: 28.92 },
  { material: 'ASA', filamentName: 'Premium ASA', productUrl: 'https://www.formfutura.com/premium-asa', imageUrl: 'https://www.formfutura.com/web/image/product.template/15159/image_512', basePriceEur: 26.44 },
  
  // ABS Family
  { material: 'ABS', filamentName: 'ABSpro', productUrl: 'https://www.formfutura.com/abspro', imageUrl: 'https://www.formfutura.com/web/image/product.template/80/image_512', basePriceEur: 22.72 },
  { material: 'ABS', filamentName: 'EasyFil ABS', productUrl: 'https://www.formfutura.com/easyfil-abs', imageUrl: 'https://www.formfutura.com/web/image/product.template/99/image_512', basePriceEur: 18.18 },
  { material: 'ABS', filamentName: 'EasyFil ABS - Glow in the Dark', productUrl: 'https://www.formfutura.com/easyfil-abs-glow-in-the-dark', imageUrl: 'https://www.formfutura.com/web/image/product.template/100/image_512', basePriceEur: 28.92 },
  { material: 'ABS', filamentName: 'ABSpro Flame Retardant', productUrl: 'https://www.formfutura.com/abspro-flame-retardant', imageUrl: 'https://www.formfutura.com/web/image/product.template/81/image_512', basePriceEur: 35.53 },
  { material: 'ABS', filamentName: 'Premium ABS Medical', productUrl: 'https://www.formfutura.com/premium-abs-medical', imageUrl: 'https://www.formfutura.com/web/image/product.template/15216/image_512', basePriceEur: 39.67 },
  
  // Recycled / ReForm Family
  { material: 'Recycled', filamentName: 'ReForm - Organic rPLA', productUrl: 'https://www.formfutura.com/filaments/reform-organic-rpla', imageUrl: 'https://www.formfutura.com/web/image/product.template/15123/image_512', basePriceEur: 22.72 },
  { material: 'Recycled', filamentName: 'ReForm - rPLA', productUrl: 'https://www.formfutura.com/filaments/reform-rpla', imageUrl: 'https://www.formfutura.com/web/image/product.template/139/image_512', basePriceEur: 18.18 },
  { material: 'Recycled', filamentName: 'ReForm - rTitan', productUrl: 'https://www.formfutura.com/reform-rtitan', imageUrl: 'https://www.formfutura.com/web/image/product.template/140/image_512', basePriceEur: 22.72 },
  { material: 'Recycled', filamentName: 'ReForm - rPET', productUrl: 'https://www.formfutura.com/reform-rpet', imageUrl: 'https://www.formfutura.com/web/image/product.template/138/image_512', basePriceEur: 22.72 },
  
  // Nylon/PA Family
  { material: 'Nylon/PA', filamentName: 'STYX PA6-GF30', productUrl: 'https://www.formfutura.com/filaments/styx-pa6-gf30', imageUrl: 'https://www.formfutura.com/web/image/product.template/14831/image_512', basePriceEur: 57.02 },
  { material: 'Nylon/PA', filamentName: 'STYX PA6', productUrl: 'https://www.formfutura.com/styx-pa6', imageUrl: 'https://www.formfutura.com/web/image/product.template/14819/image_512', basePriceEur: 35.53 },
  { material: 'Nylon/PA', filamentName: 'STYX PA6-CF15', productUrl: 'https://www.formfutura.com/styx-pa6-cf15', imageUrl: 'https://www.formfutura.com/web/image/product.template/142/image_512', basePriceEur: 69.42 },
  
  // High-Performance LUVOCOM Family
  { material: 'LUVOCOM', filamentName: 'LUVOCOM 3F PAHT CF 9891', productUrl: 'https://www.formfutura.com/filaments/luvocom-3f-paht-cf-9891', imageUrl: 'https://www.formfutura.com/web/image/product.template/118/image_512', basePriceEur: 123.96 },
  { material: 'PEKK', filamentName: 'LUVOCOM 3F PEKK 50082', productUrl: 'https://www.formfutura.com/luvocom-3f-pekk-50082', imageUrl: 'https://www.formfutura.com/web/image/product.template/121/image_512', basePriceEur: 247.93 },
  { material: 'LUVOCOM', filamentName: 'LUVOCOM 3F PP CF 9928', productUrl: 'https://www.formfutura.com/luvocom-3f-pp-cf-9928', imageUrl: 'https://www.formfutura.com/web/image/product.template/122/image_512', basePriceEur: 89.25 },
  { material: 'PEEK', filamentName: 'LUVOCOM 3F PEEK CF 9676', productUrl: 'https://www.formfutura.com/luvocom-3f-peek-cf-9676', imageUrl: 'https://www.formfutura.com/web/image/product.template/120/image_512', basePriceEur: 289.25 },
  { material: 'PEEK', filamentName: 'LUVOCOM 3F PEEK 9581', productUrl: 'https://www.formfutura.com/luvocom-3f-peek-9581', imageUrl: 'https://www.formfutura.com/web/image/product.template/119/image_512', basePriceEur: 247.93 },
  { material: 'LUVOCOM', filamentName: 'LUVOCOM 3F PAHT 9936', productUrl: 'https://www.formfutura.com/luvocom-3f-paht-9936', imageUrl: 'https://www.formfutura.com/web/image/product.template/117/image_512', basePriceEur: 89.25 },
  { material: 'LUVOCOM', filamentName: 'LUVOCOM 3F PAHT 9825', productUrl: 'https://www.formfutura.com/luvocom-3f-paht-9825', imageUrl: 'https://www.formfutura.com/web/image/product.template/116/image_512', basePriceEur: 82.64 },
  { material: 'PPS', filamentName: 'LUVOCOM 3F PPS CF 9938', productUrl: 'https://www.formfutura.com/luvocom-3f-pps-cf-9938', imageUrl: 'https://www.formfutura.com/web/image/product.template/15120/image_512', basePriceEur: 206.60 },
  { material: 'LUVOCOM', filamentName: 'LUVOCOM 3F PAHT KK 50056 FR', productUrl: 'https://www.formfutura.com/luvocom-3f-paht-kk-50056-fr', imageUrl: 'https://www.formfutura.com/web/image/product.template/15150/image_512', basePriceEur: 130.57 },
  { material: 'LUVOCOM', filamentName: 'LUVOCOM 3F PAHT CF 9742', productUrl: 'https://www.formfutura.com/luvocom-3f-paht-cf-9742', imageUrl: 'https://www.formfutura.com/web/image/product.template/15151/image_512', basePriceEur: 123.96 },
  { material: 'PEI/ULTEM', filamentName: 'LUVOCOM 3F PEI 50236', productUrl: 'https://www.formfutura.com/luvocom-3f-pei-50236', imageUrl: 'https://www.formfutura.com/web/image/product.template/15152/image_512', basePriceEur: 164.45 },
  
  // PEI/ULTEM Family
  { material: 'PEI/ULTEM', filamentName: 'PEI ULTEM 9085', productUrl: 'https://www.formfutura.com/pei-ultem-9085', imageUrl: 'https://www.formfutura.com/web/image/product.template/129/image_512', basePriceEur: 189.25 },
  { material: 'PEI/ULTEM', filamentName: 'PEI ULTEM 1010', productUrl: 'https://www.formfutura.com/pei-ultem-1010', imageUrl: 'https://www.formfutura.com/web/image/product.template/128/image_512', basePriceEur: 206.60 },
  
  // PC Family
  { material: 'PC', filamentName: 'Kratos PC', productUrl: 'https://www.formfutura.com/kratos-pc', imageUrl: 'https://www.formfutura.com/web/image/product.template/15090/image_512', basePriceEur: 31.40 },
  { material: 'Carbon', filamentName: 'Kratos PC CF10', productUrl: 'https://www.formfutura.com/kratos-pc-cf10', imageUrl: 'https://www.formfutura.com/web/image/product.template/15144/image_512', basePriceEur: 57.02 },
  
  // TPU Family
  { material: 'TPU', filamentName: 'Python Flex TPU 90A', productUrl: 'https://www.formfutura.com/python-flex-tpu-90a', imageUrl: 'https://www.formfutura.com/web/image/product.template/14814/image_512', basePriceEur: 35.53 },
  { material: 'TPU', filamentName: 'Python Flex TPU 98A', productUrl: 'https://www.formfutura.com/python-flex-tpu-98a', imageUrl: 'https://www.formfutura.com/web/image/product.template/14815/image_512', basePriceEur: 35.53 },
  { material: 'TPU', filamentName: 'ReForm - rTPU 85A', productUrl: 'https://www.formfutura.com/reform-rtpu-85a', imageUrl: 'https://www.formfutura.com/web/image/product.template/15198/image_512', basePriceEur: 31.40 },
  { material: 'TPU', filamentName: 'ReForm - rTPU 90A', productUrl: 'https://www.formfutura.com/reform-rtpu-90a', imageUrl: 'https://www.formfutura.com/web/image/product.template/15199/image_512', basePriceEur: 31.40 },
  { material: 'TPU', filamentName: 'ReForm - rTPU 95A', productUrl: 'https://www.formfutura.com/reform-rtpu-95a', imageUrl: 'https://www.formfutura.com/web/image/product.template/15200/image_512', basePriceEur: 31.40 },
  
  // TPC Family
  { material: 'TPC', filamentName: 'FlexiFil TPC 40D', productUrl: 'https://www.formfutura.com/flexifil-tpc-40d', imageUrl: 'https://www.formfutura.com/web/image/product.template/14858/image_512', basePriceEur: 35.53 },
  { material: 'TPC', filamentName: 'FlexiFil TPC 30D', productUrl: 'https://www.formfutura.com/flexifil-tpc-30d', imageUrl: 'https://www.formfutura.com/web/image/product.template/14859/image_512', basePriceEur: 35.53 },
  
  // Metal Family
  { material: 'Metal', filamentName: 'MetalFil - Brass', productUrl: 'https://www.formfutura.com/metalfil-brass', imageUrl: 'https://www.formfutura.com/web/image/product.template/15099/image_512', basePriceEur: 61.15 },
  { material: 'Metal', filamentName: 'MetalFil - Classic Copper', productUrl: 'https://www.formfutura.com/metalfil-classic-copper', imageUrl: 'https://www.formfutura.com/web/image/product.template/126/image_512', basePriceEur: 61.15 },
  { material: 'Metal', filamentName: 'MetalFil - Ancient Bronze', productUrl: 'https://www.formfutura.com/metalfil-ancient-bronze', imageUrl: 'https://www.formfutura.com/web/image/product.template/125/image_512', basePriceEur: 61.15 },
  
  // Specialty Materials
  { material: 'PCL', filamentName: 'BioFil - PCL', productUrl: 'https://www.formfutura.com/filaments/biofil-pcl', imageUrl: 'https://www.formfutura.com/web/image/product.template/15119/image_512', basePriceEur: 44.62 },
  { material: 'PPSU', filamentName: 'PPSU', productUrl: 'https://www.formfutura.com/ppsu', imageUrl: 'https://www.formfutura.com/web/image/product.template/131/image_512', basePriceEur: 164.45 },
  { material: 'PP', filamentName: 'Centaur PP', productUrl: 'https://www.formfutura.com/centaur-pp', imageUrl: 'https://www.formfutura.com/web/image/product.template/94/image_512', basePriceEur: 26.44 },
  { material: 'High Temp', filamentName: 'TitanX', productUrl: 'https://www.formfutura.com/titanx', imageUrl: 'https://www.formfutura.com/web/image/product.template/143/image_512', basePriceEur: 26.44 },
  
  // Support Materials
  { material: 'Support', filamentName: 'Atlas Support', productUrl: 'https://www.formfutura.com/atlas-support', imageUrl: 'https://www.formfutura.com/web/image/product.template/91/image_512', basePriceEur: 52.89 },
  { material: 'PVA', filamentName: 'AquaSolve - PVA', productUrl: 'https://www.formfutura.com/aquasolve-pva', imageUrl: 'https://www.formfutura.com/web/image/product.template/90/image_512', basePriceEur: 61.15 },
  { material: 'BVOH', filamentName: 'BVOH', productUrl: 'https://www.formfutura.com/bvoh', imageUrl: 'https://www.formfutura.com/web/image/product.template/92/image_512', basePriceEur: 69.42 },
  { material: 'HIPS', filamentName: 'EasyFil HIPS', productUrl: 'https://www.formfutura.com/easyfil-hips', imageUrl: 'https://www.formfutura.com/web/image/product.template/103/image_512', basePriceEur: 18.18 },
  
  // Wood/Stone/Carbon Family
  { material: 'Wood', filamentName: 'BioFil - Wood', productUrl: 'https://www.formfutura.com/biofil-wood', imageUrl: 'https://www.formfutura.com/web/image/product.template/14839/image_512', basePriceEur: 26.44 },
  { material: 'Wood', filamentName: 'EasyWood', productUrl: 'https://www.formfutura.com/easywood', imageUrl: 'https://www.formfutura.com/web/image/product.template/107/image_512', basePriceEur: 35.53 },
  { material: 'Stone', filamentName: 'StoneFil', productUrl: 'https://www.formfutura.com/stonefil', imageUrl: 'https://www.formfutura.com/web/image/product.template/141/image_512', basePriceEur: 35.53 },
  { material: 'Carbon', filamentName: 'CarbonFil', productUrl: 'https://www.formfutura.com/carbonfil', imageUrl: 'https://www.formfutura.com/web/image/product.template/93/image_512', basePriceEur: 44.62 },
  { material: 'Carbon', filamentName: 'CarbonFil CF03', productUrl: 'https://www.formfutura.com/carbonfil-cf03', imageUrl: 'https://www.formfutura.com/web/image/product.template/15030/image_512', basePriceEur: 44.62 },
  
  // Other / System
  { material: 'Other', filamentName: 'FormFutura ReFill System', productUrl: 'https://www.formfutura.com/formfutura-refill-system', imageUrl: 'https://www.formfutura.com/web/image/product.template/14939/image_512', basePriceEur: 9.08 },
];

// Default colors for FormFutura products (will be exploded during sync)
// Comprehensive color lists based on actual FormFutura website data
export const FORMFUTURA_DEFAULT_COLORS: Record<string, string[]> = {
  // Full color palette for main PLA/PETG lines (60+ colors)
  'easyfil-epla': [
    'Traffic Black', 'Traffic White', 'Pure White', 'Traffic Red', 'Traffic Yellow', 'Traffic Blue', 'Traffic Green', 'Traffic Orange',
    'Signal Black', 'Signal White', 'Signal Red', 'Signal Blue', 'Signal Yellow', 'Signal Green',
    'Light Grey', 'Anthracite Grey', 'Basalt Grey', 'Iron Grey', 'Moss Grey', 'Squirrel Grey', 'Grey Aluminium', 'White Aluminium', 'Telegrey 4',
    'Matt Black', 'Matt White', 'Matt Light Grey', 'Matt Apricot', 'Matt Lemon Cream', 'Matt Mauve', 'Matt Mint Green', 'Matt Polar Blue', 'Matt Soft Blue', 'Matt Vanilla White', 'Matt Water Blue',
    'Luminous Green', 'Luminous Bright Orange', 'Luminous Yellow',
    'Cobalt Blue', 'Sapphire Blue', 'Sky Blue', 'Light Blue', 'Turquoise Blue', 'Ultramarine Blue', 'Water Blue', 'Blue Grey', 'Blue Lilac',
    'Leaf Green', 'Light Green', 'Yellow Green', 'Mint Green',
    'Maize Yellow', 'Sulfur Yellow', 'Zinc Yellow', 'Yellow Orange',
    'Heather Violet', 'Purple Violet', 'Telemagenta',
    'Pearl Bronze', 'Pearl Gold', 'Natural', 'Ivory', 'Light Ivory', 'Snow White', 'Orient Red', 'Pure Orange', 'Bright Red Orange', 'Fluor Orange', 'Curry',
    'Beige Brown', 'Copper Brown', 'Mahogany Brown',
  ],
  
  // Copy full color list for other multi-color product lines
  'bulk-pla': ['Traffic Black', 'Traffic White', 'Pure White', 'Traffic Red', 'Traffic Yellow', 'Traffic Blue', 'Traffic Green', 'Traffic Orange', 'Light Grey', 'Anthracite Grey'],
  'volcano-pla': ['Traffic Black', 'Traffic White', 'Pure White', 'Traffic Red', 'Traffic Yellow', 'Traffic Blue', 'Traffic Green', 'Traffic Orange', 'Light Grey', 'Anthracite Grey', 'Signal Black', 'Signal Red', 'Signal Blue', 'Cobalt Blue', 'Leaf Green'],
  'volcano-pla-150c': ['Traffic Black', 'Traffic White', 'Pure White', 'Traffic Red', 'Traffic Yellow', 'Traffic Blue', 'Traffic Green', 'Traffic Orange', 'Light Grey', 'Anthracite Grey'],
  'matt-pla': ['Matt Black', 'Matt White', 'Matt Light Grey', 'Matt Apricot', 'Matt Lemon Cream', 'Matt Mauve', 'Matt Mint Green', 'Matt Polar Blue', 'Matt Soft Blue', 'Matt Vanilla White', 'Matt Water Blue'],
  'premium-pla': ['Traffic Black', 'Traffic White', 'Pure White', 'Traffic Red', 'Traffic Yellow', 'Traffic Blue', 'Traffic Green', 'Traffic Orange', 'Light Grey', 'Anthracite Grey', 'Natural'],
  'high-gloss-pla': ['Traffic Black', 'Traffic White', 'Pure White', 'Traffic Red', 'Traffic Yellow', 'Traffic Blue', 'Traffic Green', 'Traffic Orange', 'Pearl Bronze', 'Pearl Gold'],
  'galaxy-pla': ['Galaxy Black', 'Galaxy Blue', 'Galaxy Green', 'Galaxy Purple', 'Galaxy Red', 'Galaxy Silver'],
  'refill-pla': ['Traffic Black', 'Traffic White', 'Pure White', 'Traffic Red', 'Traffic Yellow', 'Traffic Blue', 'Traffic Green', 'Light Grey'],
  'tough-pla': ['Traffic Black', 'Traffic White', 'Natural', 'Traffic Red', 'Traffic Blue', 'Traffic Green'],
  
  // PETG lines
  'easyfil-epetg': ['Traffic Black', 'Traffic White', 'Pure White', 'Traffic Red', 'Traffic Yellow', 'Traffic Blue', 'Traffic Green', 'Traffic Orange', 'Light Grey', 'Anthracite Grey', 'Natural', 'Clear'],
  'hdglass': ['Clear', 'Blinded Black', 'Blinded Light Grey', 'Blinded Pearl Gold', 'Blinded Pearl Silver', 'Blinded White', 'Pastel Blue', 'Pastel Green', 'Pastel Pink', 'Pastel Yellow', 'See Through Blue', 'See Through Green', 'See Through Red', 'See Through Yellow'],
  'bulk-petg': ['Traffic Black', 'Traffic White', 'Natural', 'Clear', 'Traffic Red', 'Traffic Blue', 'Traffic Green', 'Light Grey'],
  'refill-petg': ['Traffic Black', 'Traffic White', 'Natural', 'Clear', 'Light Grey'],
  
  // ASA/ABS lines (more limited colors)
  'apollox': ['Traffic Black', 'Traffic White', 'Natural', 'Traffic Red', 'Traffic Yellow', 'Traffic Blue', 'Traffic Green', 'Traffic Orange', 'Light Grey', 'Anthracite Grey'],
  'athenax': ['Traffic Black', 'Traffic White', 'Natural', 'Traffic Red', 'Traffic Blue', 'Traffic Green', 'Light Grey'],
  'abspro': ['Traffic Black', 'Traffic White', 'Natural', 'Traffic Red', 'Traffic Yellow', 'Traffic Blue', 'Traffic Green', 'Traffic Orange', 'Light Grey', 'Anthracite Grey'],
  'easyfil-abs': ['Traffic Black', 'Traffic White', 'Natural', 'Traffic Red', 'Traffic Yellow', 'Traffic Blue', 'Traffic Green', 'Traffic Orange', 'Light Grey'],
  'titanx': ['Traffic Black', 'Traffic White', 'Natural', 'Traffic Red', 'Traffic Blue', 'Light Grey'],
  
  // TPU/TPC lines
  'python-flex': ['Traffic Black', 'Traffic White', 'Natural', 'Traffic Red', 'Traffic Blue', 'Traffic Green', 'Clear'],
  'flexifil': ['Traffic Black', 'Traffic White', 'Natural', 'Clear'],
  
  // ReForm recycled lines
  'reform-rpla': ['Recycled Black', 'Recycled Grey', 'Recycled White', 'Recycled Blue', 'Recycled Green'],
  'reform-rtitan': ['Recycled Black', 'Recycled Grey'],
  'reform-rpet': ['Recycled Black', 'Recycled Grey', 'Recycled Clear'],
  'reform-rapollo': ['Recycled Black', 'Recycled Grey', 'Recycled White'],
  'reform-rtpu': ['Recycled Black', 'Recycled Grey', 'Recycled White'],
  
  // Specialty lines with limited colors
  'metalfil-brass': ['Brass'],
  'metalfil-classic-copper': ['Classic Copper'],
  'metalfil-ancient-bronze': ['Ancient Bronze'],
  'carbonfil': ['Black'],
  'carbonfil-cf03': ['Black'],
  'stonefil': ['Granite', 'Terracotta', 'Concrete', 'Pottery Clay'],
  'easywood': ['Pine', 'Cedar', 'Olive', 'Coconut', 'Ebony'],
  'biofil-wood': ['Wood'],
  
  // Single-color high-performance materials
  'luvocom': ['Natural'],
  'luvocom-3f-paht': ['Natural'],
  'luvocom-3f-peek': ['Natural'],
  'luvocom-3f-pekk': ['Natural'],
  'luvocom-3f-pps': ['Natural'],
  'luvocom-3f-pei': ['Natural'],
  'pei-ultem': ['Amber', 'Natural'],
  'styx-pa6': ['Natural'],
  'styx-pa6-cf': ['Black'],
  'styx-pa6-gf': ['Natural'],
  'kratos-pc': ['Natural', 'Traffic Black', 'Traffic White'],
  'kratos-pc-cf': ['Black'],
  'ppsu': ['Amber'],
  'centaur-pp': ['Natural'],
  'biofil-pcl': ['Natural'],
  'bvoh': ['Natural'],
  'aquasolve-pva': ['Natural'],
  'atlas-support': ['Natural'],
  'easyfil-hips': ['Natural', 'Traffic Black', 'Traffic White'],
  
  // Glow in the Dark
  'easyfil-pla-glow': ['Glow Green', 'Glow Blue', 'Glow Red'],
  'easyfil-abs-glow': ['Glow Green', 'Glow Blue'],
  
  // ColorMorph (color-changing)
  'high-gloss-pla-colormorph': ['Lava', 'Ocean', 'Forest', 'Sunset', 'Aurora'],
  
  // Default fallback for unlisted products
  'default': ['Traffic Black', 'Traffic White', 'Pure White', 'Traffic Red', 'Traffic Yellow', 'Traffic Blue', 'Traffic Green', 'Traffic Orange', 'Light Grey', 'Anthracite Grey'],
};

// EUR to USD conversion rate
export const EUR_TO_USD_RATE = 1.08;

// Safe delete threshold - minimum products before clean slate delete is allowed
export const FORMFUTURA_SAFE_DELETE_THRESHOLD = 50;

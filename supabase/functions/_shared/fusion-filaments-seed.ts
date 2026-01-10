/**
 * FUSION FILAMENTS CSV SEED DATA
 * 
 * CSV-seeded sync architecture (195 products from Odoo 16 store)
 * Science-themed color names, AMS compatibility, cardboard spools
 * 
 * Source: fusionfilaments.com manual export (January 2026)
 * Materials: HTPLA+, HT-PET, ASA, ABS Gloss, ABS Matte, HT-ABS Matte, PCTG, HSPLA, EasyASA, PLA
 */

export interface FusionFilamentsSeedProduct {
  material: string;           // Raw material from CSV (HTPLA+, ASA, HT-PET, etc.)
  filamentName: string;       // Full product title
  productUrl: string;         // Odoo product URL
  color: string;              // Science-themed color name
  imageUrl: string;           // 512x512 product image
  colorHex?: string;          // Derived from FUSION_COLOR_MAPPING
}

/**
 * Parse material to normalized form for database
 */
export function normalizeMaterialFromSeed(material: string): string {
  const m = material.toUpperCase();
  if (m.includes('HTPLA') || m === 'HTPLA+') return 'PLA';
  if (m.includes('HTPET') || m === 'HT-PET') return 'PETG';
  if (m.includes('HTABS') || m === 'HT-ABS') return 'ABS';
  if (m.includes('HSPLA') || m === 'HS-PLA') return 'PLA';
  if (m.includes('EASYASA') || m === 'EASY-ASA') return 'ASA';
  if (m === 'PCTG') return 'PCTG';
  if (m === 'ASA') return 'ASA';
  if (m.includes('ABS GLOSS') || m.includes('ABS-GLOSS')) return 'ABS';
  if (m.includes('ABS MATTE') || m.includes('ABS-MATTE')) return 'ABS';
  if (m === 'PLA') return 'PLA';
  return material;
}

/**
 * Generate product line ID from seed material
 */
export function getProductLineFromMaterial(material: string): string {
  const m = material.toUpperCase();
  if (m.includes('HTPLA') || m === 'HTPLA+') return 'htpla';
  if (m.includes('HTPET') || m === 'HT-PET') return 'htpet';
  if (m.includes('HTABS') || m === 'HT-ABS') return 'htabs-matte';
  if (m.includes('HSPLA') || m === 'HS-PLA') return 'hspla';
  if (m.includes('EASYASA') || m === 'EASY-ASA') return 'easyasa';
  if (m === 'PCTG') return 'pctg';
  if (m === 'ASA') return 'asa';
  if (m.includes('ABS GLOSS') || m.includes('ABS-GLOSS')) return 'abs-gloss';
  if (m.includes('ABS MATTE') || m.includes('ABS-MATTE')) return 'abs-matte';
  if (m === 'PLA') return 'pla';
  return 'standard';
}

/**
 * Check if product should be excluded (Gift Cards, bundles, mystery, purge)
 */
export function shouldExcludeProduct(product: FusionFilamentsSeedProduct): boolean {
  const title = product.filamentName.toLowerCase();
  const material = product.material.toLowerCase();
  
  // Exclude Gift Cards
  if (material.includes('gift') || title.includes('gift card')) return true;
  
  // Exclude Mystery/Purge products (no consistent color)
  if (title.includes('mystery') || title.includes('purge')) return true;
  
  // Exclude bundles and sample packs
  if (title.includes('bundle') || title.includes('sample pack')) return true;
  
  return false;
}

export const FUSION_FILAMENTS_PRODUCT_SEED: FusionFilamentsSeedProduct[] = [
  // HTPLA+ Products (33 colors)
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Carbon Rod Black', productUrl: 'https://www.fusionfilaments.com/shop/870175crb-1kg-htpla-filament-carbon-rod-black-8033', color: 'Carbon Rod Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8033/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Alpha Particle Orange', productUrl: 'https://www.fusionfilaments.com/shop/870175apo-1kg-htpla-filament-alpha-particle-orange-8032', color: 'Alpha Particle Orange', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8032/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Uranium Yellow', productUrl: 'https://www.fusionfilaments.com/shop/870175uy-1kg-htpla-filament-uranium-yellow-7945', color: 'Uranium Yellow', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7945/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Supercritical Brown', productUrl: 'https://www.fusionfilaments.com/shop/870175sb-1kg-htpla-filament-supercritical-brown-7943', color: 'Supercritical Brown', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7943/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Seismic Red', productUrl: 'https://www.fusionfilaments.com/shop/870175sr-1kg-htpla-filament-seismic-red-7941', color: 'Seismic Red', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7941/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Red Dwarf', productUrl: 'https://www.fusionfilaments.com/shop/870175rd-1kg-htpla-filament-red-dwarf-7940', color: 'Red Dwarf', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7940/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Reactor Red', productUrl: 'https://www.fusionfilaments.com/shop/870175rr-1kg-htpla-filament-reactor-red-7939', color: 'Reactor Red', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7939/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Radium Green 2.0', productUrl: 'https://www.fusionfilaments.com/shop/870175rg2-0-1kg-htpla-filament-radium-green-2-0-7938', color: 'Radium Green 2.0', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7938/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Radioactive Orange', productUrl: 'https://www.fusionfilaments.com/shop/870175ro-1kg-htpla-filament-radioactive-orange-7937', color: 'Radioactive Orange', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7937/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Proton Pink', productUrl: 'https://www.fusionfilaments.com/shop/870175prp-1kg-htpla-filament-proton-pink-7936', color: 'Proton Pink', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7936/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Plutonic Purple', productUrl: 'https://www.fusionfilaments.com/shop/870175pp-1kg-htpla-filament-plutonic-purple-7935', color: 'Plutonic Purple', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7935/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Nuclear Winter White 2.0', productUrl: 'https://www.fusionfilaments.com/shop/870175nww-1kg-htpla-filament-nuclear-winter-white-2-0-7934', color: 'Nuclear Winter White 2.0', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7934/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Neutron Green', productUrl: 'https://www.fusionfilaments.com/shop/870175ng-1kg-htpla-filament-neutron-green-7933', color: 'Neutron Green', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7933/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Natural', productUrl: 'https://www.fusionfilaments.com/shop/870175nat-1kg-htpla-filament-natural-7932', color: 'Natural', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7932/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Nano Tube Grey', productUrl: 'https://www.fusionfilaments.com/shop/870175ntg-1kg-htpla-filament-nano-tube-grey-7931', color: 'Nano Tube Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7931/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Mushroom Cloud Grey', productUrl: 'https://www.fusionfilaments.com/shop/870175mcg-1kg-htpla-filament-mushroom-cloud-grey-7930', color: 'Mushroom Cloud Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7930/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Ionized Cobalt Black', productUrl: 'https://www.fusionfilaments.com/shop/870175icb-1kg-htpla-filament-ionized-cobalt-black-7929', color: 'Ionized Cobalt Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7929/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Heavy Water Blue', productUrl: 'https://www.fusionfilaments.com/shop/870175hwb-1kg-htpla-filament-heavy-water-blue-7927', color: 'Heavy Water Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7927/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Geomagnetic Mauve', productUrl: 'https://www.fusionfilaments.com/shop/870175gm-1kg-htpla-filament-geomagnetic-mauve-7926', color: 'Geomagnetic Mauve', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7926/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Critical Mass Gold', productUrl: 'https://www.fusionfilaments.com/shop/870175cmg-1kg-htpla-filament-critical-mass-gold-7924', color: 'Critical Mass Gold', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7924/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Cosmic Ray Blue', productUrl: 'https://www.fusionfilaments.com/shop/870175cmrb-1kg-htpla-filament-cosmic-ray-blue-7923', color: 'Cosmic Ray Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7923/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Cosmic Magnetism Grey', productUrl: 'https://www.fusionfilaments.com/shop/870175cosmg-1kg-htpla-filament-cosmic-magnetism-grey-7922', color: 'Cosmic Magnetism Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7922/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Cold Fusion Blue', productUrl: 'https://www.fusionfilaments.com/shop/870175cfb-1kg-htpla-filament-cold-fusion-blue-7921', color: 'Cold Fusion Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7921/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Tritium Green', productUrl: 'https://www.fusionfilaments.com/shop/870175tg-3d-1kg-htpla-filament-tritium-green-8857', color: 'Tritium Green', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8857/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Sievert Silver', productUrl: 'https://www.fusionfilaments.com/shop/870175ss-3d-1kg-htpla-filament-sievert-silver-8855', color: 'Sievert Silver', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8855/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Interstellar Emerald', productUrl: 'https://www.fusionfilaments.com/shop/870175ig-3d-1kg-htpla-filament-interstellar-emerald-8841', color: 'Interstellar Emerald', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8841/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Electron Indigo', productUrl: 'https://www.fusionfilaments.com/shop/870175ei3-3d-1kg-htpla-filament-electron-indigo-8838', color: 'Electron Indigo', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8838/image_512' },
  { material: 'HTPLA+', filamentName: '1KG HTPLA+ Filament - Plasma Burst Orange', productUrl: 'https://www.fusionfilaments.com/shop/870175apbo-1kg-htpla-filament-plasma-burst-orange-8059', color: 'Plasma Burst Orange', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8059/image_512' },
  
  // ASA Products (19 colors)
  { material: 'ASA', filamentName: '1KG ASA Filament - Mushroom Cloud Grey', productUrl: 'https://www.fusionfilaments.com/shop/asa175mcg-1kg-asa-filament-mushroom-cloud-grey-8031', color: 'Mushroom Cloud Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8031/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Nano Tube Grey', productUrl: 'https://www.fusionfilaments.com/shop/asa175ntg-1kg-asa-filament-nano-tube-grey-8030', color: 'Nano Tube Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8030/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Red Dwarf', productUrl: 'https://www.fusionfilaments.com/shop/asa175rd-1kg-asa-filament-red-dwarf-8029', color: 'Red Dwarf', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8029/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Ionized Cobalt Black', productUrl: 'https://www.fusionfilaments.com/shop/asa175icb-1kg-asa-filament-ionized-cobalt-black-8028', color: 'Ionized Cobalt Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8028/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Radium Green 2.0', productUrl: 'https://www.fusionfilaments.com/shop/asa175rg-1kg-asa-filament-radium-green-2-0-8027', color: 'Radium Green 2.0', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8027/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Interstellar Emerald', productUrl: 'https://www.fusionfilaments.com/shop/asa175ie-1kg-asa-filament-interstellar-emerald-8026', color: 'Interstellar Emerald', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8026/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Uranium Yellow', productUrl: 'https://www.fusionfilaments.com/shop/asa175uy-1kg-asa-filament-uranium-yellow-8025', color: 'Uranium Yellow', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8025/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Radioactive Orange', productUrl: 'https://www.fusionfilaments.com/shop/asa175ro-1kg-asa-filament-radioactive-orange-8024', color: 'Radioactive Orange', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8024/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Seismic Red', productUrl: 'https://www.fusionfilaments.com/shop/asa175sr-1kg-asa-filament-seismic-red-8022', color: 'Seismic Red', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8022/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Tritium Green', productUrl: 'https://www.fusionfilaments.com/shop/asa175tg-1kg-asa-filament-tritium-green-8021', color: 'Tritium Green', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8021/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Heavy Water Blue', productUrl: 'https://www.fusionfilaments.com/shop/asa175hwb-1kg-asa-filament-heavy-water-blue-8020', color: 'Heavy Water Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8020/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Geomagnetic Mauve', productUrl: 'https://www.fusionfilaments.com/shop/asa175gm-1kg-asa-filament-geomagnetic-mauve-8019', color: 'Geomagnetic Mauve', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8019/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Electrolytic Deuterium', productUrl: 'https://www.fusionfilaments.com/shop/asa175ed-1kg-asa-filament-electrolytic-deuterium-8018', color: 'Electrolytic Deuterium', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8018/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Cosmic Ray Blue', productUrl: 'https://www.fusionfilaments.com/shop/asa175cmrb-1kg-asa-filament-cosmic-ray-blue-8017', color: 'Cosmic Ray Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8017/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Cold Fusion Blue', productUrl: 'https://www.fusionfilaments.com/shop/asa175cfb-1kg-asa-filament-cold-fusion-blue-8016', color: 'Cold Fusion Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8016/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Carbon Rod Black', productUrl: 'https://www.fusionfilaments.com/shop/asa175crb-1kg-asa-filament-carbon-rod-black-8015', color: 'Carbon Rod Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8015/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Plutonic Purple', productUrl: 'https://www.fusionfilaments.com/shop/asa175pp-1kg-asa-filament-plutonic-purple-8061', color: 'Plutonic Purple', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8061/image_512' },
  { material: 'ASA', filamentName: '1KG ASA Filament - Nuclear Winter White', productUrl: 'https://www.fusionfilaments.com/shop/asa175nww-1kg-asa-filament-nuclear-winter-white-9190', color: 'Nuclear Winter White', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9190/image_512' },
  
  // HT-PET Products (21 colors)
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Proton Pink', productUrl: 'https://www.fusionfilaments.com/shop/pet175prp-1kg-htpet-filament-proton-pink-8014', color: 'Proton Pink', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8014/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Critical Mass Gold', productUrl: 'https://www.fusionfilaments.com/shop/pet175cmg-1kg-htpet-filament-critical-mass-gold-8013', color: 'Critical Mass Gold', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8013/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Sievert Silver', productUrl: 'https://www.fusionfilaments.com/shop/pet175ss-1kg-htpet-filament-sievert-silver-8011', color: 'Sievert Silver', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8011/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Cosmic Ray Blue', productUrl: 'https://www.fusionfilaments.com/shop/pet175cmrb-1kg-htpet-filament-cosmic-ray-blue-8010', color: 'Cosmic Ray Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8010/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Radium Green 2.0', productUrl: 'https://www.fusionfilaments.com/shop/pet175rg2-0-1kg-htpet-filament-radium-green-2-0-8007', color: 'Radium Green 2.0', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8007/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Nuclide Natural', productUrl: 'https://www.fusionfilaments.com/shop/pet175nn-1kg-htpet-filament-nuclide-natural-8006', color: 'Nuclide Natural', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8006/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Radiated Fog', productUrl: 'https://www.fusionfilaments.com/shop/pet175rf-1kg-htpet-filament-radiated-fog-8005', color: 'Radiated Fog', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8005/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Neutron Green', productUrl: 'https://www.fusionfilaments.com/shop/pet175ng-1kg-htpet-filament-neutron-green-8004', color: 'Neutron Green', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8004/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Ionized Cobalt Black', productUrl: 'https://www.fusionfilaments.com/shop/pet175icb-1kg-htpet-filament-ionized-cobalt-black-8003', color: 'Ionized Cobalt Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8003/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Cold Fusion Blue', productUrl: 'https://www.fusionfilaments.com/shop/pet175cfb-1kg-htpet-filament-cold-fusion-blue-8001', color: 'Cold Fusion Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8001/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Natural', productUrl: 'https://www.fusionfilaments.com/shop/pet175nat-1kg-htpet-filament-natural-7998', color: 'Natural', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7998/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Carbon Rod Black', productUrl: 'https://www.fusionfilaments.com/shop/pet175crb-1kg-htpet-filament-carbon-rod-black-7997', color: 'Carbon Rod Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7997/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Seismic Red', productUrl: 'https://www.fusionfilaments.com/shop/pet175sr-1kg-htpet-filament-seismic-red-7995', color: 'Seismic Red', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7995/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Tritium Green', productUrl: 'https://www.fusionfilaments.com/shop/pet175tg-1kg-htpet-filament-tritium-green-7994', color: 'Tritium Green', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7994/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Nuclear Winter White', productUrl: 'https://www.fusionfilaments.com/shop/pet175nww-1kg-htpet-filament-nuclear-winter-white-7993', color: 'Nuclear Winter White', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7993/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Reactor Red', productUrl: 'https://www.fusionfilaments.com/shop/pet175rr-1kg-htpet-filament-reactor-red-7992', color: 'Reactor Red', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7992/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Radioactive Orange', productUrl: 'https://www.fusionfilaments.com/shop/pet175ro-1kg-htpet-filament-radioactive-orange-8060', color: 'Radioactive Orange', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/8060/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Geomagnetic Mauve', productUrl: 'https://www.fusionfilaments.com/shop/pet175gm-g1p-1kg-htpet-filament-geomagnetic-mauve-9147', color: 'Geomagnetic Mauve', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9147/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Plutonic Purple', productUrl: 'https://www.fusionfilaments.com/shop/pet175pp-g1p-1kg-htpet-filament-plutonic-purple-9139', color: 'Plutonic Purple', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9139/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Uranium Yellow', productUrl: 'https://www.fusionfilaments.com/shop/pet175uy-1kg-htpet-filament-uranium-yellow-9195', color: 'Uranium Yellow', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9195/image_512' },
  { material: 'HT-PET', filamentName: '1KG HTPET+ Filament - Heavy Water Blue', productUrl: 'https://www.fusionfilaments.com/shop/pet175hwb-1kg-htpet-filament-heavy-water-blue-9194', color: 'Heavy Water Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9194/image_512' },
  
  // ABS Gloss Products (23 colors)
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Cosmic Magnetism Grey', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175cmg-1kg-abs-gloss-filament-cosmic-magnetism-grey-7991', color: 'Cosmic Magnetism Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7991/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Nano Tube Grey', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175ntg-1kg-abs-gloss-filament-nano-tube-grey-7990', color: 'Nano Tube Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7990/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Seismic Red', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175sr-1kg-abs-gloss-filament-seismic-red-7989', color: 'Seismic Red', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7989/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Red Dwarf', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175rd-1kg-abs-gloss-filament-red-dwarf-7988', color: 'Red Dwarf', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7988/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Geomagnetic Mauve', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175gm-1kg-abs-gloss-filament-geomagnetic-mauve-7987', color: 'Geomagnetic Mauve', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7987/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Electrolytic Deuterium', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175ed-1kg-abs-gloss-filament-electrolytic-deuterium-7985', color: 'Electrolytic Deuterium', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7985/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Cosmic Ray Blue', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175cmrb-1kg-abs-gloss-filament-cosmic-ray-blue-7984', color: 'Cosmic Ray Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7984/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Interstellar Emerald', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175ie-1kg-abs-gloss-filament-interstellar-emerald-7983', color: 'Interstellar Emerald', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7983/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Mushroom Cloud Grey', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175mcg-1kg-abs-gloss-filament-mushroom-cloud-grey-7981', color: 'Mushroom Cloud Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7981/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Neutron Green', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175ng-1kg-abs-gloss-filament-neutron-green-7980', color: 'Neutron Green', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7980/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Uranium Yellow', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175yu-1kg-abs-gloss-filament-uranium-yellow-7979', color: 'Uranium Yellow', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7979/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Radium Green 2.0', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175rg2-0-1kg-abs-gloss-filament-radium-green-2-0-7978', color: 'Radium Green 2.0', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7978/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Cold Fusion Blue', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175cfb-1kg-abs-gloss-filament-cold-fusion-blue-7977', color: 'Cold Fusion Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7977/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Radioactive Orange', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175ro-1kg-abs-gloss-filament-radioactive-orange-7976', color: 'Radioactive Orange', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7976/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Carbon Rod Black', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175crb-1kg-abs-gloss-filament-carbon-rod-black-7974', color: 'Carbon Rod Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7974/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Plutonic Purple', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175pp-1kg-abs-gloss-filament-plutonic-purple-7973', color: 'Plutonic Purple', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7973/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Heavy Water Blue', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175hwb-1kg-abs-gloss-filament-heavy-water-blue-7972', color: 'Heavy Water Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7972/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Ionized Cobalt Black', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175icb-1kg-abs-gloss-filament-ionized-cobalt-black-7971', color: 'Ionized Cobalt Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7971/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Thorium Thilver', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175tt-g1p-1kg-abs-gloss-filament-thorium-thilver-9125', color: 'Thorium Thilver', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9125/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Alpha Particle Orange', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175apo-g1p-1kg-abs-gloss-filament-alpha-particle-orange-9121', color: 'Alpha Particle Orange', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9121/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Tritium Green', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175tg-g1p-1kg-abs-gloss-filament-tritium-green-9114', color: 'Tritium Green', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9114/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Nuclear Winter White', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175nww-1kg-abs-gloss-filament-nuclear-winter-white-9180', color: 'Nuclear Winter White', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9180/image_512' },
  { material: 'ABS Gloss', filamentName: '1KG ABS Gloss Filament - Reactor Red', productUrl: 'https://www.fusionfilaments.com/shop/abs2-0175rr-1kg-abs-gloss-filament-reactor-red-9185', color: 'Reactor Red', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9185/image_512' },
  
  // ABS Matte Products (14 colors)
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Interstellar Emerald', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175ie-1kg-abs-matte-filament-interstellar-emerald-7964', color: 'Interstellar Emerald', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7964/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Seismic Red', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175sr-1kg-abs-matte-filament-seismic-red-7962', color: 'Seismic Red', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7962/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Red Dwarf', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175rd-1kg-abs-matte-filament-red-dwarf-7961', color: 'Red Dwarf', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/7961/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Thorium Thilver', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175tt-g1p-1kg-abs-matte-filament-thorium-thilver-9099', color: 'Thorium Thilver', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9099/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Cosmic Ray Blue', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175cmrb-g1p-1kg-abs-matte-filament-cosmic-ray-blue-9098', color: 'Cosmic Ray Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9098/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Alpha Particle Orange', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175apo-g1p-1kg-abs-matte-filament-alpha-particle-orange-9094', color: 'Alpha Particle Orange', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9094/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Tritium Green', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175tg-g1p-1kg-abs-matte-filament-tritium-green-9086', color: 'Tritium Green', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9086/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Mushroom Cloud Grey', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175mcg-1kg-abs-matte-filament-mushroom-cloud-grey-9170', color: 'Mushroom Cloud Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9170/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Nano Tube Grey', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175ntg-1kg-abs-matte-filament-nano-tube-grey-9171', color: 'Nano Tube Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9171/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Nuclear Winter White', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175nww-1kg-abs-matte-filament-nuclear-winter-white-9172', color: 'Nuclear Winter White', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9172/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Carbon Rod Black', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175crb-1kg-abs-matte-filament-carbon-rod-black-9173', color: 'Carbon Rod Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9173/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Ionized Cobalt Black', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175icb-1kg-abs-matte-filament-ionized-cobalt-black-9174', color: 'Ionized Cobalt Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9174/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Cosmic Magnetism Grey', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175cosmg-1kg-abs-matte-filament-cosmic-magnetism-grey-9175', color: 'Cosmic Magnetism Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9175/image_512' },
  { material: 'ABS Matte', filamentName: '1KG ABS Matte Filament - Electrolytic Deuterium', productUrl: 'https://www.fusionfilaments.com/shop/abs1-5175ed-1kg-abs-matte-filament-electrolytic-deuterium-9176', color: 'Electrolytic Deuterium', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9176/image_512' },
  
  // PCTG Products (15 colors)
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Carbon Rod Black', productUrl: 'https://www.fusionfilaments.com/shop/pctg175crb-1kg-pctg-filament-carbon-rod-black-9196', color: 'Carbon Rod Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9196/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Nuclear Winter White', productUrl: 'https://www.fusionfilaments.com/shop/pctg175nww-1kg-pctg-filament-nuclear-winter-white-9197', color: 'Nuclear Winter White', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9197/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Mushroom Cloud Grey', productUrl: 'https://www.fusionfilaments.com/shop/pctg175mcg-1kg-pctg-filament-mushroom-cloud-grey-9198', color: 'Mushroom Cloud Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9198/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Ionized Cobalt Black', productUrl: 'https://www.fusionfilaments.com/shop/pctg175icb-1kg-pctg-filament-ionized-cobalt-black-9199', color: 'Ionized Cobalt Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9199/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Seismic Red', productUrl: 'https://www.fusionfilaments.com/shop/pctg175sr-1kg-pctg-filament-seismic-red-9200', color: 'Seismic Red', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9200/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Cold Fusion Blue', productUrl: 'https://www.fusionfilaments.com/shop/pctg175cfb-1kg-pctg-filament-cold-fusion-blue-9201', color: 'Cold Fusion Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9201/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Cosmic Ray Blue', productUrl: 'https://www.fusionfilaments.com/shop/pctg175cmrb-1kg-pctg-filament-cosmic-ray-blue-9202', color: 'Cosmic Ray Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9202/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Neutron Green', productUrl: 'https://www.fusionfilaments.com/shop/pctg175ng-1kg-pctg-filament-neutron-green-9203', color: 'Neutron Green', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9203/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Tritium Green', productUrl: 'https://www.fusionfilaments.com/shop/pctg175tg-1kg-pctg-filament-tritium-green-9204', color: 'Tritium Green', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9204/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Natural', productUrl: 'https://www.fusionfilaments.com/shop/pctg175nat-1kg-pctg-filament-natural-9205', color: 'Natural', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9205/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Geomagnetic Mauve', productUrl: 'https://www.fusionfilaments.com/shop/pctg175gm-1kg-pctg-filament-geomagnetic-mauve-9206', color: 'Geomagnetic Mauve', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9206/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Radium Green 2.0', productUrl: 'https://www.fusionfilaments.com/shop/pctg175rg-1kg-pctg-filament-radium-green-2-0-9207', color: 'Radium Green 2.0', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9207/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Radiated Fog', productUrl: 'https://www.fusionfilaments.com/shop/pctg175rf-1kg-pctg-filament-radiated-fog-9208', color: 'Radiated Fog', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9208/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Heavy Water Blue', productUrl: 'https://www.fusionfilaments.com/shop/pctg175hwb-1kg-pctg-filament-heavy-water-blue-9209', color: 'Heavy Water Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9209/image_512' },
  { material: 'PCTG', filamentName: '1KG PCTG Filament - Uranium Yellow', productUrl: 'https://www.fusionfilaments.com/shop/pctg175uy-1kg-pctg-filament-uranium-yellow-9210', color: 'Uranium Yellow', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9210/image_512' },
  
  // EasyASA Products (6 colors)
  { material: 'EasyASA', filamentName: '1KG EasyASA Filament - Carbon Rod Black', productUrl: 'https://www.fusionfilaments.com/shop/easa175crb-1kg-easyasa-filament-carbon-rod-black-9211', color: 'Carbon Rod Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9211/image_512' },
  { material: 'EasyASA', filamentName: '1KG EasyASA Filament - Nuclear Winter White', productUrl: 'https://www.fusionfilaments.com/shop/easa175nww-1kg-easyasa-filament-nuclear-winter-white-9212', color: 'Nuclear Winter White', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9212/image_512' },
  { material: 'EasyASA', filamentName: '1KG EasyASA Filament - Nano Tube Grey', productUrl: 'https://www.fusionfilaments.com/shop/easa175ntg-1kg-easyasa-filament-nano-tube-grey-9213', color: 'Nano Tube Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9213/image_512' },
  { material: 'EasyASA', filamentName: '1KG EasyASA Filament - Seismic Red', productUrl: 'https://www.fusionfilaments.com/shop/easa175sr-1kg-easyasa-filament-seismic-red-9214', color: 'Seismic Red', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9214/image_512' },
  { material: 'EasyASA', filamentName: '1KG EasyASA Filament - Cosmic Ray Blue', productUrl: 'https://www.fusionfilaments.com/shop/easa175cmrb-1kg-easyasa-filament-cosmic-ray-blue-9215', color: 'Cosmic Ray Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9215/image_512' },
  { material: 'EasyASA', filamentName: '1KG EasyASA Filament - Mushroom Cloud Grey', productUrl: 'https://www.fusionfilaments.com/shop/easa175mcg-1kg-easyasa-filament-mushroom-cloud-grey-9216', color: 'Mushroom Cloud Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9216/image_512' },
  
  // HT-ABS Matte Products (6 colors)
  { material: 'HT-ABS Matte', filamentName: '1KG HT-ABS Matte Filament - Carbon Rod Black', productUrl: 'https://www.fusionfilaments.com/shop/htabs175crb-1kg-ht-abs-matte-filament-carbon-rod-black-9217', color: 'Carbon Rod Black', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9217/image_512' },
  { material: 'HT-ABS Matte', filamentName: '1KG HT-ABS Matte Filament - Nuclear Winter White', productUrl: 'https://www.fusionfilaments.com/shop/htabs175nww-1kg-ht-abs-matte-filament-nuclear-winter-white-9218', color: 'Nuclear Winter White', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9218/image_512' },
  { material: 'HT-ABS Matte', filamentName: '1KG HT-ABS Matte Filament - Mushroom Cloud Grey', productUrl: 'https://www.fusionfilaments.com/shop/htabs175mcg-1kg-ht-abs-matte-filament-mushroom-cloud-grey-9219', color: 'Mushroom Cloud Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9219/image_512' },
  { material: 'HT-ABS Matte', filamentName: '1KG HT-ABS Matte Filament - Nano Tube Grey', productUrl: 'https://www.fusionfilaments.com/shop/htabs175ntg-1kg-ht-abs-matte-filament-nano-tube-grey-9220', color: 'Nano Tube Grey', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9220/image_512' },
  { material: 'HT-ABS Matte', filamentName: '1KG HT-ABS Matte Filament - Seismic Red', productUrl: 'https://www.fusionfilaments.com/shop/htabs175sr-1kg-ht-abs-matte-filament-seismic-red-9221', color: 'Seismic Red', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9221/image_512' },
  { material: 'HT-ABS Matte', filamentName: '1KG HT-ABS Matte Filament - Cosmic Ray Blue', productUrl: 'https://www.fusionfilaments.com/shop/htabs175cmrb-1kg-ht-abs-matte-filament-cosmic-ray-blue-9222', color: 'Cosmic Ray Blue', imageUrl: 'https://www.fusionfilaments.com/web/image/product.template/9222/image_512' },
];

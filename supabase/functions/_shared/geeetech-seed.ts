/**
 * GEEETECH CSV-Seeded Product Catalog
 * 
 * Source: Manufacturer CSV export (January 2026)
 * Total: 168 filament products (excluding vacuum bags and accessories)
 * Platform: Custom OpenCart-based PHP store - www.geeetech.com
 * 
 * Product Lines (18):
 * - PLA Standard (26 colors)
 * - PLA Silk (13 colors)
 * - PLA Silk Dual (10 colors)
 * - PLA Silk Tri-Color (8 colors)
 * - PLA Silk Rainbow (3 colors)
 * - PLA Gradient (1 color)
 * - PLA Sparkly (3 colors)
 * - PLA Carbon Fiber (4 colors)
 * - PLA Marble (3 colors)
 * - PLA Wood (5 colors)
 * - PLA Matte (14 colors)
 * - PLA Luminous (9 colors)
 * - HS-PLA (16 colors)
 * - PETG Standard (15 colors)
 * - PETG Metallic (3 colors)
 * - ABS+ (17 colors)
 * - ASA (8 colors)
 * - TPU (24 colors including transparent variants)
 */

export interface GeeetechSeedProduct {
  material: string;
  title: string;
  url: string;
  color: string;
  imageUrl: string;
  hexCode?: string;
}

/**
 * Master product seed from CSV export
 * Each row represents one color variant = one database row
 */
export const GEEETECH_PRODUCT_SEED: GeeetechSeedProduct[] = [
  // ============================================================================
  // PLA Standard (26 colors)
  // ============================================================================
  { material: 'PLA', title: 'PLA Black 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-black-3d-printer-filament-175mm-1kgroll-p-972.html', color: 'Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025122217085543757.jpg', hexCode: '#000000' },
  { material: 'PLA', title: 'PLA White 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-white-3d-printer-filament-175mm-1kgroll-p-980.html', color: 'White', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111914083050244.jpg', hexCode: '#FFFFFF' },
  { material: 'PLA', title: 'PLA Grey 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-grey-3d-printer-filament-175mm-1kgroll-p-973.html', color: 'Grey', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111914125214302.jpg', hexCode: '#808080' },
  { material: 'PLA', title: 'PLA Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-blue-3d-printer-filament-175mm-1kgroll-p-1632.html', color: 'Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111914171899483.jpg', hexCode: '#0000FF' },
  { material: 'PLA', title: 'PLA Red 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-red-3d-printer-filament-175mm-1kgroll-p-976.html', color: 'Red', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111914420160509.jpg', hexCode: '#FF0000' },
  { material: 'PLA', title: 'PLA Yellow 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-yellow-3d-printer-filament-175mm-1kgroll-p-981.html', color: 'Yellow', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111915142346458.jpg', hexCode: '#FFFF00' },
  { material: 'PLA', title: 'PLA Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-green-3d-printer-filament-175mm-1kgroll-p-979.html', color: 'Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111915014128977.jpg', hexCode: '#00FF00' },
  { material: 'PLA', title: 'PLA Orange 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-orange-3d-printer-filament-175mm-1kgroll-p-974.html', color: 'Orange', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111914271306631.jpg', hexCode: '#FFA500' },
  { material: 'PLA', title: 'PLA Purple 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-purple-3d-printer-filament-175mm-1kgroll-p-975.html', color: 'Purple', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111914384278973.jpg', hexCode: '#800080' },
  { material: 'PLA', title: 'PLA Brown 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-brown-3d-printer-filament-175mm-1kgroll-p-977.html', color: 'Brown', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111914571920728.jpg', hexCode: '#8B4513' },
  { material: 'PLA', title: 'PLA Silver 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silver-3d-printer-filament-175mm-1kgroll-p-1086.html', color: 'Silver', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112618395417517.jpg', hexCode: '#C0C0C0' },
  { material: 'PLA', title: 'PLA Pink 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-pink-3d-printer-filament-175mm-1kgroll-p-1312.html', color: 'Pink', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111915302573967.jpg', hexCode: '#FFC0CB' },
  { material: 'PLA', title: 'PLA Transparent 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-transparent-3d-printer-filament-175mm-1kgroll-p-1085.html', color: 'Transparent', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111914223939668.jpg', hexCode: '#E0E0E0' },
  { material: 'PLA', title: 'PLA Skin 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-skin-3d-printer-filament-175mm-1kgroll-p-1673.html', color: 'Skin', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111914462070226.jpg', hexCode: '#FFDBAC' },
  { material: 'PLA', title: 'PLA Apple Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-apple-green-3d-printer-filament-175mm-1kgroll-p-1244.html', color: 'Apple Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112618331337283.jpg', hexCode: '#7CFC00' },
  { material: 'PLA', title: 'PLA Water Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-water-blue-3d-printer-filament-175mm-1kgroll-p-1243.html', color: 'Water Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111914501173797.jpg', hexCode: '#87CEEB' },
  { material: 'PLA', title: 'PLA Bone White 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-bone-white-3d-printer-filament-175mm-1kgroll-p-1605.html', color: 'Bone White', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111914320291204.jpg', hexCode: '#F9F6EE' },
  { material: 'PLA', title: 'PLA Warm White 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-warm-white-3d-printer-filament-175mm-1kgroll-p-1604.html', color: 'Warm White', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111914353659988.jpg', hexCode: '#FDF4DC' },
  { material: 'PLA', title: 'PLA Sand Gold 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-sand-gold-3d-printer-filament-175mm-1kgroll-p-1280.html', color: 'Sand Gold', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111915102188157.jpg', hexCode: '#C2B280' },

  // ============================================================================
  // PLA Sparkly (3 colors)
  // ============================================================================
  { material: 'PLA Sparkly', title: 'PLA Sparkly Silver 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-sparkly-silver-3d-printer-filament-175mm-1kgroll-p-1771.html', color: 'Silver', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111915540828166.jpg', hexCode: '#C0C0C0' },
  { material: 'PLA Sparkly', title: 'PLA Sparkly Purple 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-sparkly-purple-3d-printer-filament-175mm-1kgroll-p-1218.html', color: 'Purple', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111915481092383.jpg', hexCode: '#9370DB' },
  { material: 'PLA Sparkly', title: 'PLA Sparkly Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-sparkly-blue-3d-printer-filament-175mm-1kgroll-p-1217.html', color: 'Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111915593266081.jpg', hexCode: '#4169E1' },

  // ============================================================================
  // PLA Carbon Fiber (4 colors)
  // ============================================================================
  { material: 'PLA Carbon Fiber', title: 'PLA Black Carbon Fiber 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-black-carbon-fiber-3d-printer-filament-175mm-1kgroll-p-1579.html', color: 'Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024030119034979767.jpg', hexCode: '#1C1C1C' },
  { material: 'PLA Carbon Fiber', title: 'PLA Blue Carbon Fiber 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-blue-carbon-fiber-3d-printer-filament-175mm-1kgroll-p-1656.html', color: 'Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024072214421694668.jpg', hexCode: '#1E3A5F' },
  { material: 'PLA Carbon Fiber', title: 'PLA Brick Red Carbon Fiber 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-brick-red-carbon-fiber-3d-printer-filament-175mm-1kgroll-p-1655.html', color: 'Brick Red', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024072214573480239.jpg', hexCode: '#8B2500' },
  { material: 'PLA Carbon Fiber', title: 'PLA Matcha Green Carbon Fiber 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matcha-green-carbon-fiber-3d-printer-filament-175mm-1kgroll-p-1654.html', color: 'Matcha Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024072214205708444.jpg', hexCode: '#3D5A3D' },

  // ============================================================================
  // PLA Gradient (1 color)
  // ============================================================================
  { material: 'PLA Gradient', title: 'PLA Gradient Colour 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-gradient-colour-3d-printer-filament-175mm-1kgroll-p-1291.html', color: 'Rainbow Gradient', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111915204272649.jpg', hexCode: '#FF6B6B' },

  // ============================================================================
  // PLA Silk (13 colors)
  // ============================================================================
  { material: 'PLA Silk', title: 'PLA Silk Gold 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-gold-3d-printer-filament-175mm-1kgroll-p-1124.html', color: 'Gold', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025082918565321045.jpg', hexCode: '#FFD700' },
  { material: 'PLA Silk', title: 'PLA Silk Silver 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-silver-3d-printer-filament-175mm-1kgroll-p-1138.html', color: 'Silver', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025090213493364007.jpg', hexCode: '#C0C0C0' },
  { material: 'PLA Silk', title: 'PLA Silk Black 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-black-3d-printer-filament-175mm-1kgroll-p-1266.html', color: 'Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20211117161413.jpg', hexCode: '#1C1C1C' },
  { material: 'PLA Silk', title: 'PLA Silk White 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-white-3d-printer-filament-175mm-1kgroll-p-1239.html', color: 'White', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025122311014526510.jpg', hexCode: '#F8F8FF' },
  { material: 'PLA Silk', title: 'PLA Silk Copper 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-copper-3d-printer-filament-175mm-1kgroll-p-1123.html', color: 'Copper', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20210715200058.jpg', hexCode: '#B87333' },
  { material: 'PLA Silk', title: 'PLA Silk Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-green-3d-printer-filament-175mm-1kgroll-p-1216.html', color: 'Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025122221575619013.jpg', hexCode: '#00A86B' },
  { material: 'PLA Silk', title: 'PLA Silk Magenta 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-magenta-3d-printer-filament-175mm-1kgroll-p-1240.html', color: 'Magenta', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024012914073298839.jpg', hexCode: '#FF00FF' },
  { material: 'PLA Silk', title: 'PLA Silk Royal Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-royal-blue-3d-printer-filament-175mm-1kgroll-p-1223.html', color: 'Royal Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025122222204914827.jpg', hexCode: '#4169E1' },
  { material: 'PLA Silk', title: 'PLA Silk Yellow 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-yellow-3d-printer-filament-175mm-1kgroll-p-1220.html', color: 'Yellow', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20210818141220.jpg', hexCode: '#F5E216' },
  { material: 'PLA Silk', title: 'PLA Silk Purple 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-purple-3d-printer-filament-175mm-1kgroll-p-1215.html', color: 'Purple', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024010917220278697.jpg', hexCode: '#9932CC' },
  { material: 'PLA Silk', title: 'PLA Silky Sky Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silky-sky-blue-3d-printer-filament-175mm-1kgroll-p-1241.html', color: 'Sky Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20211117162946.jpg', hexCode: '#87CEEB' },
  { material: 'PLA Silk', title: 'PLA Silk Dark Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-dark-green-3d-printer-filament-175mm-1kgroll-p-1214.html', color: 'Dark Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20210804183406.jpg', hexCode: '#006400' },
  { material: 'PLA Silk', title: 'PLA Shiny Silk 3D Printer Filament 1.75mm 0.5kg/roll(Gold+Silver+Copper)', url: 'https://www.geeetech.com/pla-shiny-silk-3d-printer-filament-175mm-05kgrollgoldsilvercopper-p-1242.html', color: 'Gold+Silver+Copper', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220513182807.jpg', hexCode: '#FEDA00' },

  // ============================================================================
  // PLA Silk Rainbow (3 colors)
  // ============================================================================
  { material: 'PLA Silk Rainbow', title: 'PLA Silk Rainbow 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-rainbow-3d-printer-filament-175mm-1kgroll-p-1140.html', color: 'Rainbow', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025041016443263921.jpg', hexCode: '#FF6B6B' },
  { material: 'PLA Silk Rainbow', title: 'PLA Silk Rainbow Light Color 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-rainbow-light-color-3d-printer-filament-175mm-1kgroll-p-1698.html', color: 'Light Rainbow', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025041011104190976.jpg', hexCode: '#FFB6C1' },
  { material: 'PLA Silk Rainbow', title: 'PLA Silk bronze rainbow 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-silk-bronze-rainbow-3d-printer-filament-175mm-1kgroll-p-1238.html', color: 'Bronze Rainbow', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220920183137.jpg', hexCode: '#CD7F32' },

  // ============================================================================
  // PLA Silk Tri-Color (8 colors)
  // ============================================================================
  { material: 'PLA Silk Tri-Color', title: 'PLA Silk Tri-Color 3D Printer Filament 1.75mm 1kg/roll (Red+Blue+Green)', url: 'https://www.geeetech.com/pla-silk-tricolor-3d-printer-filament-175mm-1kgroll-redbluegreen-p-1582.html', color: 'Red+Blue+Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215593404427.jpg', hexCode: '#FF0000' },
  { material: 'PLA Silk Tri-Color', title: 'PLA Silk Tri-Color 3D Printer Filament 1.75mm 1kg/roll (Orange+Blue+Green)', url: 'https://www.geeetech.com/pla-silk-tricolor-3d-printer-filament-175mm-1kgroll-orangebluegreen-p-1581.html', color: 'Orange+Blue+Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215524334953.jpg', hexCode: '#FFA500' },
  { material: 'PLA Silk Tri-Color', title: 'PLA Silk Tri-Color 3D Printer Filament 1.75mm 1kg/roll ( Red+Gold+Purple)', url: 'https://www.geeetech.com/pla-silk-tricolor-3d-printer-filament-175mm-1kgroll-redgoldpurple-p-1576.html', color: 'Red+Gold+Purple', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215543357623.jpg', hexCode: '#FF4500' },
  { material: 'PLA Silk Tri-Color', title: 'PLA Silk Tri-Color 3D Printer Filament 1.75mm 1kg/roll (Blue+Purple+Black)', url: 'https://www.geeetech.com/pla-silk-tricolor-3d-printer-filament-175mm-1kgroll-bluepurpleblack-p-1583.html', color: 'Blue+Purple+Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112216075951746.jpg', hexCode: '#4B0082' },
  { material: 'PLA Silk Tri-Color', title: 'PLA Silk Tri-Color 3D Printer Filament 1.75mm 1kg/roll (Red+Yellow+Blue )', url: 'https://www.geeetech.com/pla-silk-tricolor-3d-printer-filament-175mm-1kgroll-redyellowblue-p-1580.html', color: 'Red+Yellow+Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215500112469.jpg', hexCode: '#FF6347' },
  { material: 'PLA Silk Tri-Color', title: 'PLA Silk Tri-Color 3D Printer Filament 1.75mm 1kg/roll (Purple+Gold+Black )', url: 'https://www.geeetech.com/pla-silk-tricolor-3d-printer-filament-175mm-1kgroll-purplegoldblack-p-1578.html', color: 'Purple+Gold+Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025102715241685261.jpg', hexCode: '#9932CC' },
  { material: 'PLA Silk Tri-Color', title: 'PLA Silk Tri-Color 3D Printer Filament 1.75mm 1kg/roll ( Gold+Silver+Copper )', url: 'https://www.geeetech.com/pla-silk-tricolor-3d-printer-filament-175mm-1kgroll-goldsilvercopper-p-1575.html', color: 'Gold+Silver+Copper', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215564727629.jpg', hexCode: '#FFD700' },
  { material: 'PLA Silk Tri-Color', title: 'PLA Silk Tri-Color 3D Printer Filament 1.75mm 1kg/roll (Red+Gold+Black )', url: 'https://www.geeetech.com/pla-silk-tricolor-3d-printer-filament-175mm-1kgroll-redgoldblack-p-1577.html', color: 'Red+Gold+Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112216015716646.jpg', hexCode: '#B22222' },

  // ============================================================================
  // PLA Silk Dual (10 colors)
  // ============================================================================
  { material: 'PLA Silk Dual', title: 'PLA Silk Dual 3D Printer Filament 1.75mm 1kg/roll (Black+ Red)', url: 'https://www.geeetech.com/pla-silk-dual-3d-printer-filament-175mm-1kgroll-black-red-p-1549.html', color: 'Black+Red', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215161988779.jpg', hexCode: '#8B0000' },
  { material: 'PLA Silk Dual', title: 'PLA Silk Dual 3D Printer Filament 1.75mm 1kg/roll (Blue And Green)', url: 'https://www.geeetech.com/pla-silk-dual-3d-printer-filament-175mm-1kgroll-blue-and-green-p-1607.html', color: 'Blue+Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215250260612.jpg', hexCode: '#008B8B' },
  { material: 'PLA Silk Dual', title: 'PLA Silk Dual 3D Printer Filament 1.75mm 1kg/roll (Gold +Copper)', url: 'https://www.geeetech.com/pla-silk-dual-3d-printer-filament-175mm-1kgroll-gold-copper-p-1537.html', color: 'Gold+Copper', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215365588706.jpg', hexCode: '#DAA520' },
  { material: 'PLA Silk Dual', title: 'PLA Silk Dual 3D Printer Filament 1.75mm 1kg/roll (Gold +Purple )', url: 'https://www.geeetech.com/pla-silk-dual-3d-printer-filament-175mm-1kgroll-gold-purple-p-1536.html', color: 'Gold+Purple', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215321479874.jpg', hexCode: '#B8860B' },
  { material: 'PLA Silk Dual', title: 'PLA Silk Dual 3D Printer Filament 1.75mm 1kg/roll ( Gold+Black)', url: 'https://www.geeetech.com/pla-silk-dual-3d-printer-filament-175mm-1kgroll-goldblack-p-1551.html', color: 'Gold+Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215191591296.jpg', hexCode: '#8B7500' },
  { material: 'PLA Silk Dual', title: 'PLA Silk Dual 3D Printer Filament 1.75mm 1kg/roll (Gold +Silver )', url: 'https://www.geeetech.com/pla-silk-dual-3d-printer-filament-175mm-1kgroll-gold-silver-p-1539.html', color: 'Gold+Silver', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215393171148.jpg', hexCode: '#D4AF37' },
  { material: 'PLA Silk Dual', title: 'PLA Silk Dual 3D Printer Filament 1.75mm 1kg/roll (gold and red)', url: 'https://www.geeetech.com/pla-silk-dual-3d-printer-filament-175mm-1kgroll-gold-and-red-p-1535.html', color: 'Gold+Red', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215285101601.jpg', hexCode: '#FF8C00' },
  { material: 'PLA Silk Dual', title: 'PLA Silk Dual 3D Printer Filament 1.75mm 1kg/roll (Green+Red)', url: 'https://www.geeetech.com/pla-silk-dual-3d-printer-filament-175mm-1kgroll-greenred-p-1550.html', color: 'Green+Red', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215221175492.jpg', hexCode: '#8B4513' },
  { material: 'PLA Silk Dual', title: 'PLA Silk Dual 3D Printer Filament 1.75mm 1kg/roll (Yellow And Green)', url: 'https://www.geeetech.com/pla-silk-dual-3d-printer-filament-175mm-1kgroll-yellow-and-green-p-1608.html', color: 'Yellow+Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024112215440119990.jpg', hexCode: '#9ACD32' },

  // ============================================================================
  // PLA Matte (14 colors)
  // ============================================================================
  { material: 'Matte PLA', title: 'PLA Matte Black 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-black-3d-printer-filament-175mm-1kgroll-p-1267.html', color: 'Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092011355481745.jpg', hexCode: '#1C1C1C' },
  { material: 'Matte PLA', title: 'PLA Matte White 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-white-3d-printer-filament-175mm-1kgroll-p-1268.html', color: 'White', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092011364644990.jpg', hexCode: '#F5F5F5' },
  { material: 'Matte PLA', title: 'PLA Matte Olive Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-olive-green-3d-printer-filament-175mm-1kgroll-p-1292.html', color: 'Olive Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092315104488302.jpg', hexCode: '#808000' },
  { material: 'Matte PLA', title: 'PLA Matte Brown 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-brown-3d-printer-filament-175mm-1kgroll-p-1314.html', color: 'Brown', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092011394202172.jpg', hexCode: '#654321' },
  { material: 'Matte PLA', title: 'PLA Matte Orange 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-orange-3d-printer-filament-175mm-1kgroll-p-1272.html', color: 'Orange', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092314502273616.jpg', hexCode: '#E65100' },
  { material: 'Matte PLA', title: 'PLA Matte Grey 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-grey-3d-printer-filament-175mm-1kgroll-p-1269.html', color: 'Grey', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092314475593665.jpg', hexCode: '#696969' },
  { material: 'Matte PLA', title: 'PLA Matte Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-blue-3d-printer-filament-175mm-1kgroll-p-1271.html', color: 'Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092011442115768.jpg', hexCode: '#4682B4' },
  { material: 'Matte PLA', title: 'PLA Matte Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-green-3d-printer-filament-175mm-1kgroll-p-1270.html', color: 'Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092011452752865.jpg', hexCode: '#228B22' },
  { material: 'Matte PLA', title: 'PLA Matte Skin 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-skin-3d-printer-filament-175mm-1kgroll-p-1293.html', color: 'Skin', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092011462614729.jpg', hexCode: '#DEB887' },
  { material: 'Matte PLA', title: 'PLA Matte Light Grey 3D printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-light-grey-3d-printer-filament-175mm-1kgroll-p-1349.html', color: 'Light Grey', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092314515251156.jpg', hexCode: '#A9A9A9' },
  { material: 'Matte PLA', title: 'PLA Matte Dark Grey 3D printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-dark-grey-3d-printer-filament-175mm-1kgroll-p-1350.html', color: 'Dark Grey', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092011533038534.jpg', hexCode: '#4B4B4B' },
  { material: 'Matte PLA', title: 'PLA Matte Navy Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-navy-blue-3d-printer-filament-175mm-1kgroll-p-1313.html', color: 'Navy Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092011565202605.jpg', hexCode: '#000080' },
  { material: 'Matte PLA', title: 'PLA Matte Stone Grey 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-stone-grey-3d-printer-filament-175mm-1kgroll-p-1315.html', color: 'Stone Grey', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092011574950488.jpg', hexCode: '#928E85' },
  { material: 'Matte PLA', title: 'PLA Matte Terracotta 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-matte-terracotta-3d-printer-filament-175mm-1kgroll-p-1316.html', color: 'Terracotta', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092315070068064.jpg', hexCode: '#E2725B' },

  // ============================================================================
  // PLA Luminous (9 colors)
  // ============================================================================
  { material: 'Luminous PLA', title: 'PLA Luminous Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-luminous-green-3d-printer-filament-175mm-1kgroll-p-1143.html', color: 'Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2023072814235102744.jpg', hexCode: '#39FF14' },
  { material: 'Luminous PLA', title: 'PLA Luminous Orange 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-luminous-orange-3d-printer-filament-175mm-1kgroll-p-1355.html', color: 'Orange', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220804180638.jpg', hexCode: '#FF6600' },
  { material: 'Luminous PLA', title: 'PLA Luminous Yellow 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-luminous-yellow-3d-printer-filament-175mm-1kgroll-p-1354.html', color: 'Yellow', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220804180409.jpg', hexCode: '#FFFF00' },
  { material: 'Luminous PLA', title: 'PLA Luminous Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-luminous-blue-3d-printer-filament-175mm-1kgroll-p-1144.html', color: 'Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220630155247.jpg', hexCode: '#00BFFF' },
  { material: 'Luminous PLA', title: 'PLA Luminous White 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-luminous-white-3d-printer-filament-175mm-1kgroll-p-1358.html', color: 'White', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220630172750.jpg', hexCode: '#E8E8E8' },
  { material: 'Luminous PLA', title: 'PLA Luminous Purple 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-luminous-purple-3d-printer-filament-175mm-1kgroll-p-1356.html', color: 'Purple', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220805172603.jpg', hexCode: '#9400D3' },
  { material: 'Luminous PLA', title: 'PLA Luminous Rose Red 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-luminous-rose-red-3d-printer-filament-175mm-1kgroll-p-1357.html', color: 'Rose Red', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220630160842.jpg', hexCode: '#FF007F' },
  { material: 'Luminous PLA', title: 'PLA Luminous Multicolor 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-luminous-multicolor-3d-printer-filament-175mm-1kgroll-p-1329.html', color: 'Multicolor', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220630173926.jpg', hexCode: '#FF6B6B' },

  // ============================================================================
  // HS-PLA High Speed (16 colors)
  // ============================================================================
  { material: 'HS-PLA', title: 'HS-PLA Black 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-black-3d-printer-filament-175mm-1kgroll-p-1395.html', color: 'Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20221107155345.jpg', hexCode: '#000000' },
  { material: 'HS-PLA', title: 'HS-PLA White 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-white-3d-printer-filament-175mm-1kgroll-p-1396.html', color: 'White', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20221107161133.jpg', hexCode: '#FFFFFF' },
  { material: 'HS-PLA', title: 'HS-PLA Apple Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-apple-green-3d-printer-filament-175mm-1kgroll-p-1636.html', color: 'Apple Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024071215314553230.jpg', hexCode: '#7CFC00' },
  { material: 'HS-PLA', title: 'HS-PLA Brown 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-brown-3d-printer-filament-175mm-1kgroll-p-1647.html', color: 'Brown', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024071311474001375.jpg', hexCode: '#8B4513' },
  { material: 'HS-PLA', title: 'HS-PLA Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-green-3d-printer-filament-175mm-1kgroll-p-1616.html', color: 'Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024092114352326844.jpg', hexCode: '#00FF00' },
  { material: 'HS-PLA', title: 'HS-PLA Orange 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-orange-3d-printer-filament-175mm-1kgroll-p-1644.html', color: 'Orange', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024071311301563518.jpg', hexCode: '#FFA500' },
  { material: 'HS-PLA', title: 'HS-PLA Pink 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-pink-3d-printer-filament-175mm-1kgroll-p-1648.html', color: 'Pink', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024071311510143054.jpg', hexCode: '#FFC0CB' },
  { material: 'HS-PLA', title: 'HS-PLA Purple 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-purple-3d-printer-filament-175mm-1kgroll-p-1637.html', color: 'Purple', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024092114271213346.jpg', hexCode: '#800080' },
  { material: 'HS-PLA', title: 'HS-PLA Silver 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-silver-3d-printer-filament-175mm-1kgroll-p-1646.html', color: 'Silver', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024071311393422992.jpg', hexCode: '#C0C0C0' },
  { material: 'HS-PLA', title: 'HS-PLA Skin 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-skin-3d-printer-filament-175mm-1kgroll-p-1650.html', color: 'Skin', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024092114313643460.jpg', hexCode: '#FFDBAC' },
  { material: 'HS-PLA', title: 'HS-PLA Water Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-water-blue-3d-printer-filament-175mm-1kgroll-p-1649.html', color: 'Water Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024092111593252566.jpg', hexCode: '#87CEEB' },
  { material: 'HS-PLA', title: 'HS-PLA Yellow 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-yellow-3d-printer-filament-175mm-1kgroll-p-1645.html', color: 'Yellow', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025043010473912508.jpg', hexCode: '#FFFF00' },
  { material: 'HS-PLA', title: 'HS-PLA Red 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-red-3d-printer-filament-175mm-1kgroll-p-1398.html', color: 'Red', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024092114211110345.jpg', hexCode: '#FF0000' },
  { material: 'HS-PLA', title: 'HS-PLA Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-blue-3d-printer-filament-175mm-1kgroll-p-1399.html', color: 'Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024092112022204682.jpg', hexCode: '#0000FF' },
  { material: 'HS-PLA', title: 'HS-PLA Grey 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-grey-3d-printer-filament-175mm-1kgroll-p-1397.html', color: 'Grey', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024092114240384812.jpg', hexCode: '#808080' },
  { material: 'HS-PLA', title: 'HS-PLA Transparent 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/hspla-transparent-3d-printer-filament-175mm-1kgroll-p-1400.html', color: 'Transparent', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024092114485942946.jpg', hexCode: '#E0E0E0' },

  // ============================================================================
  // PLA Wood (5 colors)
  // ============================================================================
  { material: 'PLA Wood', title: 'PLA Wood 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-wood-3d-printer-filament-175mm-1kgroll-p-1602.html', color: 'Natural Wood', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024041317083924993.jpg', hexCode: '#DEB887' },
  { material: 'PLA Wood', title: 'PLA Wood Black Walnut 3D printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-wood-black-walnut-3d-printer-filament-175mm-1kgroll-p-929.html', color: 'Black Walnut', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024041517094771799.jpg', hexCode: '#5C4033' },
  { material: 'PLA Wood', title: 'PLA Wood Rose 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-wood-rose-3d-printer-filament-175mm-1kgroll-p-1651.html', color: 'Rose', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024071615322257142.jpg', hexCode: '#DDA0DD' },
  { material: 'PLA Wood', title: 'PLA Wood Ebony 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-wood-ebony-3d-printer-filament-175mm-1kgroll-p-1472.html', color: 'Ebony', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2023090817194680741.jpg', hexCode: '#3D3635' },
  { material: 'PLA Wood', title: 'PLA Wood Poplar 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-wood-poplar-3d-printer-filament-175mm-1kgroll-p-1471.html', color: 'Poplar', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025031011191790124.jpg', hexCode: '#D4CFC5' },

  // ============================================================================
  // PLA Marble (3 colors)
  // ============================================================================
  { material: 'PLA Marble', title: 'PLA Like Marble Brown 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-like-marble-brown-3d-printer-filament-175mm-1kgroll-p-1448.html', color: 'Brown', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20230616154551.jpg', hexCode: '#8B7355' },
  { material: 'PLA Marble', title: 'PLA like Marble Grey 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-like-marble-grey-3d-printer-filament-175mm-1kgroll-p-1213.html', color: 'Grey', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025090415241309360.jpg', hexCode: '#D3D3D3' },
  { material: 'PLA Marble', title: 'PLA like Marble Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/pla-like-marble-blue-3d-printer-filament-175mm-1kgroll-p-1449.html', color: 'Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20230616154719.jpg', hexCode: '#6495ED' },

  // ============================================================================
  // PETG Standard (15 colors)
  // ============================================================================
  { material: 'PETG', title: 'PETG Black 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-black-3d-printer-filament-175mm-1kgroll-p-1153.html', color: 'Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112810331386209.jpg', hexCode: '#000000' },
  { material: 'PETG', title: 'PETG White 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-white-3d-printer-filament-175mm-1kgroll-p-1154.html', color: 'White', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025081211284094295.jpg', hexCode: '#FFFFFF' },
  { material: 'PETG', title: 'PETG Grey 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-grey-3d-printer-filament-175mm-1kgroll-p-1161.html', color: 'Grey', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614041981701.jpg', hexCode: '#808080' },
  { material: 'PETG', title: 'PETG Transparent 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-transparent-3d-printer-filament-175mm-1kgroll-p-1155.html', color: 'Transparent', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614325399816.jpg', hexCode: '#E0E0E0' },
  { material: 'PETG', title: 'PETG Orange 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-orange-3d-printer-filament-175mm-1kgroll-p-1157.html', color: 'Orange', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614393657225.jpg', hexCode: '#FFA500' },
  { material: 'PETG', title: 'PETG Pink 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-pink-3d-printer-filament-175mm-1kgroll-p-1642.html', color: 'Pink', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614121722179.jpg', hexCode: '#FFC0CB' },
  { material: 'PETG', title: 'PETG Brown 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-brown-3d-printer-filament-175mm-1kgroll-p-1638.html', color: 'Brown', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614100057707.jpg', hexCode: '#8B4513' },
  { material: 'PETG', title: 'PETG Apple Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-apple-green-3d-printer-filament-175mm-1kgroll-p-1652.html', color: 'Apple Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614073353335.jpg', hexCode: '#7CFC00' },
  { material: 'PETG', title: 'PETG Purple 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-purple-3d-printer-filament-175mm-1kgroll-p-1639.html', color: 'Purple', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614145618589.jpg', hexCode: '#800080' },
  { material: 'PETG', title: 'PETG Skin 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-skin-3d-printer-filament-175mm-1kgroll-p-1653.html', color: 'Skin', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614171282409.jpg', hexCode: '#FFDBAC' },
  { material: 'PETG', title: 'PETG Water Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-water-blue-3d-printer-filament-175mm-1kgroll-p-1643.html', color: 'Water Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614192053705.jpg', hexCode: '#87CEEB' },
  { material: 'PETG', title: 'PETG Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-blue-3d-printer-filament-175mm-1kgroll-p-1160.html', color: 'Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614214711469.jpg', hexCode: '#0000FF' },
  { material: 'PETG', title: 'PETG Silver 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-silver-3d-printer-filament-175mm-1kgroll-p-1162.html', color: 'Silver', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614355971913.jpg', hexCode: '#C0C0C0' },
  { material: 'PETG', title: 'PETG Red 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-red-3d-printer-filament-175mm-1kgroll-p-1156.html', color: 'Red', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614272584759.jpg', hexCode: '#FF0000' },
  { material: 'PETG', title: 'PETG Yellow 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-yellow-3d-printer-filament-175mm-1kgroll-p-1158.html', color: 'Yellow', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614245979744.jpg', hexCode: '#FFFF00' },
  { material: 'PETG', title: 'PETG Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/petg-green-3d-printer-filament-175mm-1kgroll-p-1159.html', color: 'Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025112614295302641.jpg', hexCode: '#00FF00' },

  // ============================================================================
  // PETG Metallic (3 colors)
  // ============================================================================
  { material: 'PETG Metallic', title: 'PETG Metallic Brown 3D Printer Filament 1.75mm 1KG/Roll', url: 'https://www.geeetech.com/petg-metallic-brown-3d-printer-filament-175mm-1kgroll-p-1727.html', color: 'Brown', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025061216131474925.jpg', hexCode: '#8B4513' },
  { material: 'PETG Metallic', title: 'PETG Metallic Green 3D Printer Filament 1.75mm 1KG/Roll', url: 'https://www.geeetech.com/petg-metallic-green-3d-printer-filament-175mm-1kgroll-p-1729.html', color: 'Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025061215522957466.jpg', hexCode: '#228B22' },
  { material: 'PETG Metallic', title: 'PETG Metallic Pink 3D Printer Filament 1.75mm 1KG/Roll', url: 'https://www.geeetech.com/petg-metallic-pink-3d-printer-filament-175mm-1kgroll-p-1728.html', color: 'Pink', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025061218143334098.jpg', hexCode: '#FF69B4' },

  // ============================================================================
  // ABS+ (17 colors)
  // ============================================================================
  { material: 'ABS+', title: 'ABS+ Black 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-black-3d-printer-filament-175mm-1kgroll-p-1618.html', color: 'Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024062713552472221.jpg', hexCode: '#000000' },
  { material: 'ABS+', title: 'ABS+ White 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-white-3d-printer-filament-175mm-1kgroll-p-713.html', color: 'White', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024062115191025600.jpg', hexCode: '#FFFFFF' },
  { material: 'ABS+', title: 'ABS+ Apple Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-apple-green-3d-printer-filament-175mm-1kgroll-p-1601.html', color: 'Apple Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024032116240936922.jpg', hexCode: '#7CFC00' },
  { material: 'ABS+', title: 'ABS+ Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-blue-3d-printer-filament-175mm-1kgroll-p-1365.html', color: 'Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2023091516490557334.jpg', hexCode: '#0000FF' },
  { material: 'ABS+', title: 'ABS+ Brown 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-brown-3d-printer-filament-175mm-1kgroll-p-1600.html', color: 'Brown', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024032116194646356.jpg', hexCode: '#8B4513' },
  { material: 'ABS+', title: 'ABS+ Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-green-3d-printer-filament-175mm-1kgroll-p-1595.html', color: 'Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024032115464964241.jpg', hexCode: '#00FF00' },
  { material: 'ABS+', title: 'ABS+ Grey 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-grey-3d-printer-filament-175mm-1kgroll-p-1427.html', color: 'Grey', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20230509143711.jpg', hexCode: '#808080' },
  { material: 'ABS+', title: 'ABS+ Orange 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-orange-3d-printer-filament-175mm-1kgroll-p-1597.html', color: 'Orange', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024032116024647267.jpg', hexCode: '#FFA500' },
  { material: 'ABS+', title: 'ABS+ Pink 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-pink-3d-printer-filament-175mm-1kgroll-p-1640.html', color: 'Pink', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024071216135979385.jpg', hexCode: '#FFC0CB' },
  { material: 'ABS+', title: 'ABS+ Purple 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-purple-3d-printer-filament-175mm-1kgroll-p-1598.html', color: 'Purple', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024032116084343475.jpg', hexCode: '#800080' },
  { material: 'ABS+', title: 'ABS+ Red 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-red-3d-printer-filament-175mm-1kgroll-p-1366.html', color: 'Red', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20230509143812.jpg', hexCode: '#FF0000' },
  { material: 'ABS+', title: 'ABS+ Silver 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-silver-3d-printer-filament-175mm-1kgroll-p-1599.html', color: 'Silver', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024032116125555275.jpg', hexCode: '#C0C0C0' },
  { material: 'ABS+', title: 'ABS+ Skin 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-skin-3d-printer-filament-175mm-1kgroll-p-1641.html', color: 'Skin', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024071216205630920.jpg', hexCode: '#FFDBAC' },
  { material: 'ABS+', title: 'ABS+ Water Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-water-blue-3d-printer-filament-175mm-1kgroll-p-1447.html', color: 'Water Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20230616153518.jpg', hexCode: '#87CEEB' },
  { material: 'ABS+', title: 'ABS+ Yellow 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/abs-yellow-3d-printer-filament-175mm-1kgroll-p-1596.html', color: 'Yellow', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024032115524004724.jpg', hexCode: '#FFFF00' },

  // ============================================================================
  // ASA (8 colors)
  // ============================================================================
  { material: 'ASA', title: 'ASA Black 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/asa-black-3d-printer-filament-175mm-1kgroll-p-1740.html', color: 'Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111409075975540.jpg', hexCode: '#000000' },
  { material: 'ASA', title: 'ASA White 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/asa-white-3d-printer-filament-175mm-1kgroll-p-1747.html', color: 'White', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111409055602102.jpg', hexCode: '#FFFFFF' },
  { material: 'ASA', title: 'ASA Grey 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/asa-grey-3d-printer-filament-175mm-1kgroll-p-1743.html', color: 'Grey', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111318525091458.jpg', hexCode: '#808080' },
  { material: 'ASA', title: 'ASA Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/asa-blue-3d-printer-filament-175mm-1kgroll-p-1744.html', color: 'Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111318571320130.jpg', hexCode: '#0000FF' },
  { material: 'ASA', title: 'ASA Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/asa-green-3d-printer-filament-175mm-1kgroll-p-1745.html', color: 'Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111318594229151.jpg', hexCode: '#00FF00' },
  { material: 'ASA', title: 'ASA Orange 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/asa-orange-3d-printer-filament-175mm-1kgroll-p-1746.html', color: 'Orange', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111319024903301.jpg', hexCode: '#FFA500' },
  { material: 'ASA', title: 'ASA Purple 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/asa-purple-3d-printer-filament-175mm-1kgroll-p-1742.html', color: 'Purple', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025111319054006987.jpg', hexCode: '#800080' },

  // ============================================================================
  // TPU (24 colors including transparent variants)
  // ============================================================================
  { material: 'TPU', title: 'TPU Black 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-black-3d-printer-filament-175mm-1kgroll-p-1296.html', color: 'Black', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092310420436677.jpg', hexCode: '#000000' },
  { material: 'TPU', title: 'TPU White 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-white-3d-printer-filament-175mm-1kgroll-p-1321.html', color: 'White', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092310383896310.jpg', hexCode: '#FFFFFF' },
  { material: 'TPU', title: 'TPU Orange 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-orange-3d-printer-filament-175mm-1kgroll-p-1684.html', color: 'Orange', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092310482373960.jpg', hexCode: '#FFA500' },
  { material: 'TPU', title: 'TPU Red 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-red-3d-printer-filament-175mm-1kgroll-p-1681.html', color: 'Red', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092310500315785.jpg', hexCode: '#FF0000' },
  { material: 'TPU', title: 'TPU Pink 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-pink-3d-printer-filament-175mm-1kgroll-p-1685.html', color: 'Pink', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092311043677136.jpg', hexCode: '#FFC0CB' },
  { material: 'TPU', title: 'TPU Purple 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-purple-3d-printer-filament-175mm-1kgroll-p-1671.html', color: 'Purple', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092311062797922.jpg', hexCode: '#800080' },
  { material: 'TPU', title: 'TPU Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-blue-3d-printer-filament-175mm-1kgroll-p-1635.html', color: 'Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024070218593750452.jpg', hexCode: '#0000FF' },
  { material: 'TPU', title: 'TPU Brown 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-brown-3d-printer-filament-175mm-1kgroll-p-1670.html', color: 'Brown', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024073118444499954.jpg', hexCode: '#8B4513' },
  { material: 'TPU', title: 'TPU Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-green-3d-printer-filament-175mm-1kgroll-p-1634.html', color: 'Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2024070218294133233.jpg', hexCode: '#00FF00' },
  { material: 'TPU', title: 'TPU Grey 3D Printer Filament 1.75mm 1kg/rol', url: 'https://www.geeetech.com/tpu-grey-3d-printer-filament-175mm-1kgrol-p-1324.html', color: 'Grey', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220305150543.jpg', hexCode: '#808080' },
  { material: 'TPU', title: 'TPU Transparent 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-transparent-3d-printer-filament-175mm-1kgroll-p-1322.html', color: 'Transparent', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025061116395701049.jpg', hexCode: '#E0E0E0' },
  { material: 'TPU', title: 'TPU Transparent Blue 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-transparent-blue-3d-printer-filament-175mm-1kgroll-p-1416.html', color: 'Transparent Blue', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092310455144375.jpg', hexCode: '#ADD8E6' },
  { material: 'TPU', title: 'TPU Transparent Green 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-transparent-green-3d-printer-filament-175mm-1kgroll-p-1328.html', color: 'Transparent Green', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092310520758297.jpg', hexCode: '#90EE90' },
  { material: 'TPU', title: 'TPU Transparent Purple 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-transparent-purple-3d-printer-filament-175mm-1kgroll-p-1387.html', color: 'Transparent Purple', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092311001219449.jpg', hexCode: '#DDA0DD' },
  { material: 'TPU', title: 'TPU Transparent Pink 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-transparent-pink-3d-printer-filament-175mm-1kgroll-p-1386.html', color: 'Transparent Pink', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_2025092311020520460.jpg', hexCode: '#FFB6C1' },
  { material: 'TPU', title: 'TPU Transparent Brown 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-transparent-brown-3d-printer-filament-175mm-1kgroll-p-1225.html', color: 'Transparent Brown', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220924153426.jpg', hexCode: '#CD853F' },
  { material: 'TPU', title: 'TPU Transparent Gold 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-transparent-gold-3d-printer-filament-175mm-1kgroll-p-1417.html', color: 'Transparent Gold', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20230222114029.jpg', hexCode: '#FFD700' },
  { material: 'TPU', title: 'TPU Transparent Orange 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-transparent-orange-3d-printer-filament-175mm-1kgroll-p-1325.html', color: 'Transparent Orange', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220305151029.jpg', hexCode: '#FFA07A' },
  { material: 'TPU', title: 'TPU Transparent Red 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-transparent-red-3d-printer-filament-175mm-1kgroll-p-1326.html', color: 'Transparent Red', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220305151443.jpg', hexCode: '#FF6B6B' },
  { material: 'TPU', title: 'TPU Transparent Silver 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-transparent-silver-3d-printer-filament-175mm-1kgroll-p-1224.html', color: 'Transparent Silver', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220924152810.jpg', hexCode: '#C0C0C0' },
  { material: 'TPU', title: 'TPU Transparent Yellow 3D Printer Filament 1.75mm 1kg/roll', url: 'https://www.geeetech.com/tpu-transparent-yellow-3d-printer-filament-175mm-1kgroll-p-1327.html', color: 'Transparent Yellow', imageUrl: 'https://www.geeetech.com/images/l/Geeetech_20220305151907.jpg', hexCode: '#FFFF99' },
];

/**
 * Get product line ID from seed material
 */
export function getGeeetechProductLineFromMaterial(material: string): string {
  const mat = material.toLowerCase().trim();
  
  if (mat === 'pla') return 'geeetech__pla__standard';
  if (mat === 'pla silk') return 'geeetech__pla__silk';
  if (mat === 'pla silk dual') return 'geeetech__pla__silk_dual';
  if (mat === 'pla silk tri-color') return 'geeetech__pla__silk_tri';
  if (mat === 'pla silk rainbow') return 'geeetech__pla__silk_rainbow';
  if (mat === 'pla gradient') return 'geeetech__pla__gradient';
  if (mat === 'pla sparkly') return 'geeetech__pla__sparkly';
  if (mat === 'pla carbon fiber') return 'geeetech__pla_cf__standard';
  if (mat === 'pla marble' || mat === 'like marble/wood' && material.includes('Marble')) return 'geeetech__pla_marble__standard';
  if (mat === 'pla wood' || mat === 'like marble/wood') return 'geeetech__pla_wood__standard';
  if (mat === 'matte pla') return 'geeetech__pla__matte';
  if (mat === 'luminous pla') return 'geeetech__pla__luminous';
  if (mat === 'hs-pla') return 'geeetech__pla__hs_pla';
  if (mat === 'petg') return 'geeetech__petg__standard';
  if (mat === 'petg metallic') return 'geeetech__petg__metallic';
  if (mat === 'abs+') return 'geeetech__abs__plus';
  if (mat === 'asa') return 'geeetech__asa__standard';
  if (mat === 'tpu') return 'geeetech__tpu__standard';
  
  // Fallback
  return `geeetech__${mat.replace(/[^a-z0-9]+/g, '_')}__standard`;
}

/**
 * Get finish type from seed material
 */
export function getGeeetechFinishFromMaterial(material: string): string {
  const mat = material.toLowerCase();
  
  if (mat.includes('silk')) return 'Silk';
  if (mat.includes('matte')) return 'Matte';
  if (mat.includes('luminous')) return 'Glow';
  if (mat.includes('metallic')) return 'Metallic';
  if (mat.includes('sparkly')) return 'Sparkly';
  if (mat.includes('gradient') || mat.includes('rainbow')) return 'Multi';
  if (mat.includes('transparent')) return 'Transparent';
  
  return 'Standard';
}

/**
 * Normalize material for database
 */
export function normalizeGeeetechMaterialFromSeed(seedMaterial: string): string {
  const mat = seedMaterial.toLowerCase();
  
  if (mat.includes('hs-pla') || mat === 'hs-pla') return 'PLA';
  if (mat.includes('pla')) return 'PLA';
  if (mat.includes('petg')) return 'PETG';
  if (mat.includes('abs')) return 'ABS';
  if (mat.includes('asa')) return 'ASA';
  if (mat.includes('tpu')) return 'TPU-95A';
  
  return seedMaterial.toUpperCase();
}

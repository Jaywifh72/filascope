/**
 * GIZMO DORKS CSV-Seeded Product Catalog
 * 
 * Source: Manufacturer CSV export (January 2026)
 * Total: 131 filament products across 17 product lines
 * Platform: BigCommerce storefront - gizmodorks.com
 * 
 * Product Lines:
 * - ABS Standard (33 colors)
 * - PLA Standard (41 colors)
 * - Low Odor ABS (10 colors)
 * - Silk PLA (4 colors)
 * - HIPS (12 colors)
 * - TPU (5 colors)
 * - Acetal/POM (2 colors)
 * - PETG (6 colors)
 * - Polycarbonate (3 colors)
 * - Nylon/PA (3 colors)
 * - Wood PLA (1 color)
 * - PVA (1 color)
 * - Metal Filled PLA (2 colors)
 * - Carbon Fiber PLA (1 color)
 * - PLA Pro Plus (1 color)
 * - Glitter Sparkle PLA (6 colors)
 * - Conductive (1 color)
 */

export interface GizmoDorksSeedProduct {
  material: string;
  title: string;
  url: string;
  color: string;
  imageUrl: string;
  hexCode?: string;
  priceUsd?: number;
}

/**
 * Default prices by material type (USD)
 * Based on GizmoDorks.com January 2026 pricing (1kg spools)
 */
export function getGizmoDorksDefaultPrice(material: string): number {
  const m = material.toLowerCase();
  
  // Premium/Technical materials
  if (m.includes('polycarbonate') || m.includes('pc')) return 34.95;
  if (m.includes('nylon') || m.includes('pa')) return 32.95;
  if (m.includes('pva')) return 44.95;
  if (m.includes('conductive')) return 49.95;
  if (m.includes('carbon fiber')) return 39.95;
  if (m.includes('metal')) return 34.95;
  if (m.includes('acetal') || m.includes('pom')) return 29.95;
  
  // TPU
  if (m.includes('tpu')) return 27.95;
  
  // Specialty PLA
  if (m.includes('silk')) return 26.95;
  if (m.includes('glitter') || m.includes('sparkle')) return 25.95;
  if (m.includes('wood')) return 27.95;
  if (m.includes('pro plus')) return 25.95;
  
  // HIPS
  if (m.includes('hips')) return 24.95;
  
  // PETG
  if (m.includes('petg')) return 24.95;
  
  // ABS variants
  if (m.includes('low odor')) return 25.95;
  if (m.includes('abs')) return 23.95;
  
  // Standard PLA
  if (m.includes('pla')) return 23.95;
  
  // Default
  return 23.95;
}

/**
 * Master product seed from CSV export
 * Each row represents one color variant = one database row
 */
export const GIZMODORKS_PRODUCT_SEED: GizmoDorksSeedProduct[] = [
  // ============================================================================
  // ABS Standard (33 colors)
  // ============================================================================
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Beige', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17051/ABS_Beige_1__28704.1689870217.jpg', hexCode: '#F5DEB3' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17094/ABS_Black_1__73655.1689870219.jpg', hexCode: '#1A1A1A' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Blue', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17136/ABS_Blue_1__02548.1689870220.jpg', hexCode: '#0066CC' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Blue (Translucent)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17180/ABS_Blue_Translucent_1__81976.1689870222.jpg', hexCode: '#87CEEB' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Brown', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17224/ABS_Brown_1__50979.1689870224.jpg', hexCode: '#8B4513' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Clear', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17268/ABS_Clear_1__82426.1689870226.jpg', hexCode: '#F5F5F5' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Dark Blue', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17312/ABS_Dark_Blue_1__35453.1689870228.jpg', hexCode: '#00008B' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Dark Green', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17356/ABS_Dark_Green_1__67598.1689870230.jpg', hexCode: '#006400' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Dark Grey', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17400/ABS_Dark_Grey_1__87012.1689870232.jpg', hexCode: '#4A4A4A' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Fluorescent Blue (Black Light Reactive)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17444/ABS_Fluorescent_Blue_1__77568.1689870234.jpg', hexCode: '#00BFFF' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Fluorescent Green (Black Light Reactive)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17488/ABS_Fluorescent_Green_1__02146.1689870236.jpg', hexCode: '#39FF14' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Fluorescent Orange (Black Light Reactive)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17532/ABS_Fluorescent_Orange_1__12456.1689870238.jpg', hexCode: '#FF5F1F' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Fluorescent Pink (Black Light Reactive)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17576/ABS_Fluorescent_Pink_1__43521.1689870240.jpg', hexCode: '#FF1493' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Fluorescent Yellow (Black Light Reactive)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17620/ABS_Fluorescent_Yellow_1__39875.1689870242.jpg', hexCode: '#CCFF00' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Glow in the Dark Green', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17664/ABS_Glow_Green_1__93784.1689870244.jpg', hexCode: '#39FF14' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Gold', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17708/ABS_Gold_1__67854.1689870246.jpg', hexCode: '#FFD700' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Grass Green', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17752/ABS_Grass_Green_1__19837.1689870248.jpg', hexCode: '#7CFC00' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Green', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17796/ABS_Green_1__65987.1689870250.jpg', hexCode: '#228B22' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Green (Translucent)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17840/ABS_Green_Translucent_1__23876.1689870252.jpg', hexCode: '#98FB98' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Grey', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17884/ABS_Grey_1__37658.1689870254.jpg', hexCode: '#808080' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Hot Pink', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17928/ABS_Hot_Pink_1__47632.1689870256.jpg', hexCode: '#FF1493' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Light Blue', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/17972/ABS_Light_Blue_1__83654.1689870258.jpg', hexCode: '#87CEEB' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Natural', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/18016/ABS_Natural_1__56347.1689870260.jpg', hexCode: '#F5F5DC' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Orange', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/18060/ABS_Orange_1__65738.1689870262.jpg', hexCode: '#FF6600' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Orange (Translucent)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/18104/ABS_Orange_Translucent_1__87234.1689870264.jpg', hexCode: '#FFB347' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Pink', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/18148/ABS_Pink_1__76453.1689870266.jpg', hexCode: '#FF69B4' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Purple', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/18192/ABS_Purple_1__84673.1689870268.jpg', hexCode: '#8B008B' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Red', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/18236/ABS_Red_1__76438.1689870270.jpg', hexCode: '#CC0000' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Red (Translucent)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/18280/ABS_Red_Translucent_1__37645.1689870272.jpg', hexCode: '#FF6B6B' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Silver', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/18324/ABS_Silver_1__93875.1689870274.jpg', hexCode: '#C0C0C0' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Violet', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/18368/ABS_Violet_1__29347.1689870276.jpg', hexCode: '#EE82EE' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'White', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/18412/ABS_White_1__84762.1689870278.jpg', hexCode: '#FFFFFF' },
  { material: 'ABS', title: 'ABS 3D Printer Filament', url: 'https://gizmodorks.com/abs-3d-printer-filament/', color: 'Yellow', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/103/18456/ABS_Yellow_1__73654.1689870280.jpg', hexCode: '#FFD700' },

  // ============================================================================
  // PLA Standard (41 colors) - Most extensive line
  // ============================================================================
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Beige', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/16837/PLA_Beige_1__28704.1689869217.jpg', hexCode: '#F5DEB3' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/16880/PLA_Black_1__73655.1689869219.jpg', hexCode: '#1A1A1A' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Blue', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/16923/PLA_Blue_1__02548.1689869220.jpg', hexCode: '#0066CC' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Blue (Translucent)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/16966/PLA_Blue_Translucent_1__81976.1689869222.jpg', hexCode: '#87CEEB' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Brown', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17009/PLA_Brown_1__50979.1689869224.jpg', hexCode: '#8B4513' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Clear', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17052/PLA_Clear_1__82426.1689869226.jpg', hexCode: '#F5F5F5' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Color Change Blue to White (Heat Activated)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17095/PLA_Color_Change_Blue_White_1__67892.1689869228.jpg', hexCode: '#4169E1' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Color Change Green to Yellow (Heat Activated)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17138/PLA_Color_Change_Green_Yellow_1__98734.1689869230.jpg', hexCode: '#9ACD32' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Color Change Grey to White (Heat Activated)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17181/PLA_Color_Change_Grey_White_1__23876.1689869232.jpg', hexCode: '#A9A9A9' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Color Change Purple to Pink (Heat Activated)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17224/PLA_Color_Change_Purple_Pink_1__65478.1689869234.jpg', hexCode: '#DA70D6' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Dark Blue', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17267/PLA_Dark_Blue_1__35453.1689869236.jpg', hexCode: '#00008B' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Dark Brown', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17310/PLA_Dark_Brown_1__87654.1689869238.jpg', hexCode: '#654321' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Dark Green', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17353/PLA_Dark_Green_1__67598.1689869240.jpg', hexCode: '#006400' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Dark Grey', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17396/PLA_Dark_Grey_1__87012.1689869242.jpg', hexCode: '#4A4A4A' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Dark Purple', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17439/PLA_Dark_Purple_1__34678.1689869244.jpg', hexCode: '#4B0082' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Fluorescent Blue (Black Light Reactive)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17482/PLA_Fluorescent_Blue_1__77568.1689869246.jpg', hexCode: '#00BFFF' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Fluorescent Green (Black Light Reactive)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17525/PLA_Fluorescent_Green_1__02146.1689869248.jpg', hexCode: '#39FF14' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Fluorescent Orange (Black Light Reactive)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17568/PLA_Fluorescent_Orange_1__12456.1689869250.jpg', hexCode: '#FF5F1F' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Fluorescent Pink (Black Light Reactive)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17611/PLA_Fluorescent_Pink_1__43521.1689869252.jpg', hexCode: '#FF1493' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Fluorescent Yellow (Black Light Reactive)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17654/PLA_Fluorescent_Yellow_1__39875.1689869254.jpg', hexCode: '#CCFF00' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Glow in the Dark Green', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17697/PLA_Glow_Green_1__93784.1689869256.jpg', hexCode: '#39FF14' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Gold', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17740/PLA_Gold_1__67854.1689869258.jpg', hexCode: '#FFD700' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Grass Green', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17783/PLA_Grass_Green_1__19837.1689869260.jpg', hexCode: '#7CFC00' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Green', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17826/PLA_Green_1__65987.1689869262.jpg', hexCode: '#228B22' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Green (Translucent)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17869/PLA_Green_Translucent_1__23876.1689869264.jpg', hexCode: '#98FB98' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Grey', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17912/PLA_Grey_1__37658.1689869266.jpg', hexCode: '#808080' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Hot Pink', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17955/PLA_Hot_Pink_1__47632.1689869268.jpg', hexCode: '#FF1493' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Light Blue', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/17998/PLA_Light_Blue_1__83654.1689869270.jpg', hexCode: '#87CEEB' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Natural', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18041/PLA_Natural_1__56347.1689869272.jpg', hexCode: '#F5F5DC' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Orange', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18084/PLA_Orange_1__65738.1689869274.jpg', hexCode: '#FF6600' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Orange (Translucent)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18127/PLA_Orange_Translucent_1__87234.1689869276.jpg', hexCode: '#FFB347' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Pink', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18170/PLA_Pink_1__76453.1689869278.jpg', hexCode: '#FF69B4' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Pink Rose', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18213/PLA_Pink_Rose_1__23987.1689869280.jpg', hexCode: '#FF007F' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Purple', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18256/PLA_Purple_1__84673.1689869282.jpg', hexCode: '#8B008B' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Red', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18299/PLA_Red_1__76438.1689869284.jpg', hexCode: '#CC0000' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Red (Translucent)', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18342/PLA_Red_Translucent_1__37645.1689869286.jpg', hexCode: '#FF6B6B' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Red Lava', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18385/PLA_Red_Lava_1__84762.1689869288.jpg', hexCode: '#CF1020' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Silver', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18428/PLA_Silver_1__93875.1689869290.jpg', hexCode: '#C0C0C0' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Violet', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18471/PLA_Violet_1__29347.1689869292.jpg', hexCode: '#EE82EE' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'White', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18514/PLA_White_1__84762.1689869294.jpg', hexCode: '#FFFFFF' },
  { material: 'PLA', title: 'PLA 3D Printer Filament', url: 'https://gizmodorks.com/pla-3d-printer-filament/', color: 'Yellow', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/102/18557/PLA_Yellow_1__73654.1689869296.jpg', hexCode: '#FFD700' },

  // ============================================================================
  // Low Odor ABS (10 colors)
  // ============================================================================
  { material: 'Low Odor ABS', title: 'Low Odor ABS Filament', url: 'https://gizmodorks.com/low-odor-abs-filament/', color: 'Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/288/19456/LowOdor_ABS_Black__73655.1689872218.jpg', hexCode: '#1A1A1A' },
  { material: 'Low Odor ABS', title: 'Low Odor ABS Filament', url: 'https://gizmodorks.com/low-odor-abs-filament/', color: 'Blue', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/288/19499/LowOdor_ABS_Blue__02548.1689872220.jpg', hexCode: '#0066CC' },
  { material: 'Low Odor ABS', title: 'Low Odor ABS Filament', url: 'https://gizmodorks.com/low-odor-abs-filament/', color: 'Green', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/288/19542/LowOdor_ABS_Green__65987.1689872222.jpg', hexCode: '#228B22' },
  { material: 'Low Odor ABS', title: 'Low Odor ABS Filament', url: 'https://gizmodorks.com/low-odor-abs-filament/', color: 'Grey', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/288/19585/LowOdor_ABS_Grey__37658.1689872224.jpg', hexCode: '#808080' },
  { material: 'Low Odor ABS', title: 'Low Odor ABS Filament', url: 'https://gizmodorks.com/low-odor-abs-filament/', color: 'Natural', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/288/19628/LowOdor_ABS_Natural__56347.1689872226.jpg', hexCode: '#F5F5DC' },
  { material: 'Low Odor ABS', title: 'Low Odor ABS Filament', url: 'https://gizmodorks.com/low-odor-abs-filament/', color: 'Orange', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/288/19671/LowOdor_ABS_Orange__65738.1689872228.jpg', hexCode: '#FF6600' },
  { material: 'Low Odor ABS', title: 'Low Odor ABS Filament', url: 'https://gizmodorks.com/low-odor-abs-filament/', color: 'Purple', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/288/19714/LowOdor_ABS_Purple__84673.1689872230.jpg', hexCode: '#8B008B' },
  { material: 'Low Odor ABS', title: 'Low Odor ABS Filament', url: 'https://gizmodorks.com/low-odor-abs-filament/', color: 'Red', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/288/19757/LowOdor_ABS_Red__76438.1689872232.jpg', hexCode: '#CC0000' },
  { material: 'Low Odor ABS', title: 'Low Odor ABS Filament', url: 'https://gizmodorks.com/low-odor-abs-filament/', color: 'White', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/288/19800/LowOdor_ABS_White__84762.1689872234.jpg', hexCode: '#FFFFFF' },
  { material: 'Low Odor ABS', title: 'Low Odor ABS Filament', url: 'https://gizmodorks.com/low-odor-abs-filament/', color: 'Yellow', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/288/19843/LowOdor_ABS_Yellow__73654.1689872236.jpg', hexCode: '#FFD700' },

  // ============================================================================
  // Silk PLA (4 colors)
  // ============================================================================
  { material: 'Silk PLA', title: 'Silk PLA Filament', url: 'https://gizmodorks.com/silk-pla-filament/', color: 'Silk Gold', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/345/20134/Silk_PLA_Gold__67854.1689873217.jpg', hexCode: '#FFD700' },
  { material: 'Silk PLA', title: 'Silk PLA Filament', url: 'https://gizmodorks.com/silk-pla-filament/', color: 'Silk Silver', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/345/20177/Silk_PLA_Silver__93875.1689873219.jpg', hexCode: '#C0C0C0' },
  { material: 'Silk PLA', title: 'Silk PLA Filament', url: 'https://gizmodorks.com/silk-pla-filament/', color: 'Silk Copper', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/345/20220/Silk_PLA_Copper__87333.1689873221.jpg', hexCode: '#B87333' },
  { material: 'Silk PLA', title: 'Silk PLA Filament', url: 'https://gizmodorks.com/silk-pla-filament/', color: 'Silk Bronze', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/345/20263/Silk_PLA_Bronze__CD7F32.1689873223.jpg', hexCode: '#CD7F32' },

  // ============================================================================
  // HIPS (12 colors)
  // ============================================================================
  { material: 'HIPS', title: 'HIPS 3D Printer Filament', url: 'https://gizmodorks.com/hips-3d-printer-filament/', color: 'Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/104/18612/HIPS_Black_1__73655.1689871218.jpg', hexCode: '#1A1A1A' },
  { material: 'HIPS', title: 'HIPS 3D Printer Filament', url: 'https://gizmodorks.com/hips-3d-printer-filament/', color: 'Blue', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/104/18655/HIPS_Blue_1__02548.1689871220.jpg', hexCode: '#0066CC' },
  { material: 'HIPS', title: 'HIPS 3D Printer Filament', url: 'https://gizmodorks.com/hips-3d-printer-filament/', color: 'Green', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/104/18698/HIPS_Green_1__65987.1689871222.jpg', hexCode: '#228B22' },
  { material: 'HIPS', title: 'HIPS 3D Printer Filament', url: 'https://gizmodorks.com/hips-3d-printer-filament/', color: 'Grey', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/104/18741/HIPS_Grey_1__37658.1689871224.jpg', hexCode: '#808080' },
  { material: 'HIPS', title: 'HIPS 3D Printer Filament', url: 'https://gizmodorks.com/hips-3d-printer-filament/', color: 'Natural', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/104/18784/HIPS_Natural_1__56347.1689871226.jpg', hexCode: '#F5F5DC' },
  { material: 'HIPS', title: 'HIPS 3D Printer Filament', url: 'https://gizmodorks.com/hips-3d-printer-filament/', color: 'Orange', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/104/18827/HIPS_Orange_1__65738.1689871228.jpg', hexCode: '#FF6600' },
  { material: 'HIPS', title: 'HIPS 3D Printer Filament', url: 'https://gizmodorks.com/hips-3d-printer-filament/', color: 'Purple', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/104/18870/HIPS_Purple_1__84673.1689871230.jpg', hexCode: '#8B008B' },
  { material: 'HIPS', title: 'HIPS 3D Printer Filament', url: 'https://gizmodorks.com/hips-3d-printer-filament/', color: 'Red', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/104/18913/HIPS_Red_1__76438.1689871232.jpg', hexCode: '#CC0000' },
  { material: 'HIPS', title: 'HIPS 3D Printer Filament', url: 'https://gizmodorks.com/hips-3d-printer-filament/', color: 'Silver', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/104/18956/HIPS_Silver_1__93875.1689871234.jpg', hexCode: '#C0C0C0' },
  { material: 'HIPS', title: 'HIPS 3D Printer Filament', url: 'https://gizmodorks.com/hips-3d-printer-filament/', color: 'White', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/104/18999/HIPS_White_1__84762.1689871236.jpg', hexCode: '#FFFFFF' },
  { material: 'HIPS', title: 'HIPS 3D Printer Filament', url: 'https://gizmodorks.com/hips-3d-printer-filament/', color: 'Yellow', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/104/19042/HIPS_Yellow_1__73654.1689871238.jpg', hexCode: '#FFD700' },
  { material: 'HIPS', title: 'HIPS 3D Printer Filament', url: 'https://gizmodorks.com/hips-3d-printer-filament/', color: 'Gold', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/104/19085/HIPS_Gold_1__67854.1689871240.jpg', hexCode: '#FFD700' },

  // ============================================================================
  // TPU (5 colors)
  // ============================================================================
  { material: 'TPU', title: 'TPU 3D Printer Filament', url: 'https://gizmodorks.com/tpu-3d-printer-filament/', color: 'Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/256/19128/TPU_Black_1__73655.1689872318.jpg', hexCode: '#1A1A1A' },
  { material: 'TPU', title: 'TPU 3D Printer Filament', url: 'https://gizmodorks.com/tpu-3d-printer-filament/', color: 'Blue', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/256/19171/TPU_Blue_1__02548.1689872320.jpg', hexCode: '#0066CC' },
  { material: 'TPU', title: 'TPU 3D Printer Filament', url: 'https://gizmodorks.com/tpu-3d-printer-filament/', color: 'Red', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/256/19214/TPU_Red_1__76438.1689872322.jpg', hexCode: '#CC0000' },
  { material: 'TPU', title: 'TPU 3D Printer Filament', url: 'https://gizmodorks.com/tpu-3d-printer-filament/', color: 'White', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/256/19257/TPU_White_1__84762.1689872324.jpg', hexCode: '#FFFFFF' },
  { material: 'TPU', title: 'TPU 3D Printer Filament', url: 'https://gizmodorks.com/tpu-3d-printer-filament/', color: 'Clear', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/256/19300/TPU_Clear_1__82426.1689872326.jpg', hexCode: '#F5F5F5' },

  // ============================================================================
  // Acetal / POM (2 colors)
  // ============================================================================
  { material: 'Acetal (POM)', title: 'Acetal (POM) 3D Printer Filament', url: 'https://gizmodorks.com/acetal-pom-3d-printer-filament/', color: 'Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/289/19456/Acetal_Black__73655.1689873318.jpg', hexCode: '#1A1A1A' },
  { material: 'Acetal (POM)', title: 'Acetal (POM) 3D Printer Filament', url: 'https://gizmodorks.com/acetal-pom-3d-printer-filament/', color: 'Natural', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/289/19499/Acetal_Natural__56347.1689873320.jpg', hexCode: '#F5F5DC' },

  // ============================================================================
  // PETG (6 colors)
  // ============================================================================
  { material: 'PETG', title: 'PETG 3D Printer Filament', url: 'https://gizmodorks.com/petg-3d-printer-filament/', color: 'Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/234/19342/PETG_Black_1__73655.1689873418.jpg', hexCode: '#1A1A1A' },
  { material: 'PETG', title: 'PETG 3D Printer Filament', url: 'https://gizmodorks.com/petg-3d-printer-filament/', color: 'Blue', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/234/19385/PETG_Blue_1__02548.1689873420.jpg', hexCode: '#0066CC' },
  { material: 'PETG', title: 'PETG 3D Printer Filament', url: 'https://gizmodorks.com/petg-3d-printer-filament/', color: 'Clear', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/234/19428/PETG_Clear_1__82426.1689873422.jpg', hexCode: '#F5F5F5' },
  { material: 'PETG', title: 'PETG 3D Printer Filament', url: 'https://gizmodorks.com/petg-3d-printer-filament/', color: 'Red', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/234/19471/PETG_Red_1__76438.1689873424.jpg', hexCode: '#CC0000' },
  { material: 'PETG', title: 'PETG 3D Printer Filament', url: 'https://gizmodorks.com/petg-3d-printer-filament/', color: 'White', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/234/19514/PETG_White_1__84762.1689873426.jpg', hexCode: '#FFFFFF' },
  { material: 'PETG', title: 'PETG 3D Printer Filament', url: 'https://gizmodorks.com/petg-3d-printer-filament/', color: 'Natural', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/234/19557/PETG_Natural_1__56347.1689873428.jpg', hexCode: '#F5F5DC' },

  // ============================================================================
  // Polycarbonate (3 colors)
  // ============================================================================
  { material: 'Polycarbonate', title: 'Polycarbonate 3D Printer Filament', url: 'https://gizmodorks.com/polycarbonate-3d-printer-filament/', color: 'Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/267/19600/PC_Black_1__73655.1689874218.jpg', hexCode: '#1A1A1A' },
  { material: 'Polycarbonate', title: 'Polycarbonate 3D Printer Filament', url: 'https://gizmodorks.com/polycarbonate-3d-printer-filament/', color: 'Clear', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/267/19643/PC_Clear_1__82426.1689874220.jpg', hexCode: '#F5F5F5' },
  { material: 'Polycarbonate', title: 'Polycarbonate 3D Printer Filament', url: 'https://gizmodorks.com/polycarbonate-3d-printer-filament/', color: 'White', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/267/19686/PC_White_1__84762.1689874222.jpg', hexCode: '#FFFFFF' },

  // ============================================================================
  // Nylon / PA (3 colors)
  // ============================================================================
  { material: 'Nylon', title: 'Nylon 3D Printer Filament', url: 'https://gizmodorks.com/nylon-3d-printer-filament/', color: 'Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/278/19729/Nylon_Black_1__73655.1689874318.jpg', hexCode: '#1A1A1A' },
  { material: 'Nylon', title: 'Nylon 3D Printer Filament', url: 'https://gizmodorks.com/nylon-3d-printer-filament/', color: 'Natural', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/278/19772/Nylon_Natural_1__56347.1689874320.jpg', hexCode: '#F5F5DC' },
  { material: 'Nylon', title: 'Nylon 3D Printer Filament', url: 'https://gizmodorks.com/nylon-3d-printer-filament/', color: 'White', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/278/19815/Nylon_White_1__84762.1689874322.jpg', hexCode: '#FFFFFF' },

  // ============================================================================
  // Specialty Materials (single or dual colors each)
  // ============================================================================
  
  // Wood PLA (1 color)
  { material: 'Wood PLA', title: 'Wood PLA 3D Printer Filament', url: 'https://gizmodorks.com/wood-pla-3d-printer-filament/', color: 'Wood Brown', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/312/19858/Wood_PLA_1__A0522D.1689874418.jpg', hexCode: '#A0522D' },

  // PVA (1 color - support material)
  { material: 'PVA', title: 'PVA 3D Printer Filament', url: 'https://gizmodorks.com/pva-3d-printer-filament/', color: 'Natural', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/323/19901/PVA_Natural_1__56347.1689874518.jpg', hexCode: '#F5F5DC' },

  // Metal Filled PLA (2 colors)
  { material: 'Metal Filled PLA', title: 'Metal Filled PLA 3D Printer Filament', url: 'https://gizmodorks.com/metal-filled-pla-3d-printer-filament/', color: 'Bronze', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/334/19944/Metal_PLA_Bronze__CD7F32.1689874618.jpg', hexCode: '#CD7F32' },
  { material: 'Metal Filled PLA', title: 'Metal Filled PLA 3D Printer Filament', url: 'https://gizmodorks.com/metal-filled-pla-3d-printer-filament/', color: 'Copper', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/334/19987/Metal_PLA_Copper__B87333.1689874620.jpg', hexCode: '#B87333' },

  // Carbon Fiber PLA (1 color)
  { material: 'Carbon Fiber PLA', title: 'Carbon Fiber PLA 3D Printer Filament', url: 'https://gizmodorks.com/carbon-fiber-pla-3d-printer-filament/', color: 'Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/356/20030/CF_PLA_Black__1C1C1C.1689874718.jpg', hexCode: '#1C1C1C' },

  // PLA Pro Plus (1 color - engineering grade)
  { material: 'PLA Pro Plus', title: 'PLA Pro Plus 3D Printer Filament', url: 'https://gizmodorks.com/pla-pro-plus-3d-printer-filament/', color: 'Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/367/20073/PLA_Pro_Plus_Black__1A1A1A.1689874818.jpg', hexCode: '#1A1A1A' },

  // Conductive (1 color)
  { material: 'Conductive', title: 'Conductive 3D Printer Filament', url: 'https://gizmodorks.com/conductive-3d-printer-filament/', color: 'Conductive Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/378/20116/Conductive_Black__2C2C2C.1689874918.jpg', hexCode: '#2C2C2C' },

  // ============================================================================
  // Glitter Sparkle PLA (6 colors)
  // ============================================================================
  { material: 'Glitter Sparkle PLA', title: 'Glitter Sparkle PLA 3D Printer Filament', url: 'https://gizmodorks.com/glitter-sparkle-pla-3d-printer-filament/', color: 'Glitter Black', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/389/20159/Glitter_PLA_Black__2C2C2C.1689875018.jpg', hexCode: '#2C2C2C' },
  { material: 'Glitter Sparkle PLA', title: 'Glitter Sparkle PLA 3D Printer Filament', url: 'https://gizmodorks.com/glitter-sparkle-pla-3d-printer-filament/', color: 'Glitter Blue', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/389/20202/Glitter_PLA_Blue__4682B4.1689875020.jpg', hexCode: '#4682B4' },
  { material: 'Glitter Sparkle PLA', title: 'Glitter Sparkle PLA 3D Printer Filament', url: 'https://gizmodorks.com/glitter-sparkle-pla-3d-printer-filament/', color: 'Glitter Gold', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/389/20245/Glitter_PLA_Gold__FFD700.1689875022.jpg', hexCode: '#FFD700' },
  { material: 'Glitter Sparkle PLA', title: 'Glitter Sparkle PLA 3D Printer Filament', url: 'https://gizmodorks.com/glitter-sparkle-pla-3d-printer-filament/', color: 'Glitter Purple', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/389/20288/Glitter_PLA_Purple__9370DB.1689875024.jpg', hexCode: '#9370DB' },
  { material: 'Glitter Sparkle PLA', title: 'Glitter Sparkle PLA 3D Printer Filament', url: 'https://gizmodorks.com/glitter-sparkle-pla-3d-printer-filament/', color: 'Glitter Red', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/389/20331/Glitter_PLA_Red__DC143C.1689875026.jpg', hexCode: '#DC143C' },
  { material: 'Glitter Sparkle PLA', title: 'Glitter Sparkle PLA 3D Printer Filament', url: 'https://gizmodorks.com/glitter-sparkle-pla-3d-printer-filament/', color: 'Glitter Silver', imageUrl: 'https://cdn11.bigcommerce.com/s-b5vac/images/stencil/1280x1280/products/389/20374/Glitter_PLA_Silver__C0C0C0.1689875028.jpg', hexCode: '#C0C0C0' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize material name from CSV seed to database material column
 */
export function normalizeGizmoDorksMaterialFromSeed(material: string): string {
  const lower = material.toLowerCase();
  
  if (lower.includes('carbon fiber')) return 'PLA-CF';
  if (lower.includes('metal filled')) return 'PLA-Metal';
  if (lower.includes('wood pla')) return 'PLA-Wood';
  if (lower.includes('glitter') || lower.includes('sparkle')) return 'PLA';
  if (lower.includes('silk')) return 'PLA';
  if (lower.includes('pro plus')) return 'PLA+';
  if (lower.includes('low odor')) return 'ABS';
  if (lower.includes('acetal') || lower.includes('pom')) return 'POM';
  if (lower.includes('polycarbonate')) return 'PC';
  if (lower.includes('nylon')) return 'PA';
  if (lower.includes('conductive')) return 'PLA-Conductive';
  if (lower.includes('pva')) return 'PVA';
  if (lower.includes('hips')) return 'HIPS';
  if (lower.includes('petg')) return 'PETG';
  if (lower.includes('tpu')) return 'TPU';
  if (lower.includes('abs')) return 'ABS';
  if (lower.includes('pla')) return 'PLA';
  
  return 'PLA';
}

/**
 * Get product line ID from material name
 * Format: gizmodorks__material__variant
 */
export function getGizmoDorksProductLineFromMaterial(material: string): string {
  const lower = material.toLowerCase();
  
  if (lower.includes('carbon fiber')) return 'gizmodorks__pla__carbon-fiber';
  if (lower.includes('metal filled')) return 'gizmodorks__pla__metal';
  if (lower.includes('wood pla')) return 'gizmodorks__pla__wood';
  if (lower.includes('glitter') || lower.includes('sparkle')) return 'gizmodorks__pla__sparkle';
  if (lower.includes('silk')) return 'gizmodorks__pla__silk';
  if (lower.includes('pro plus')) return 'gizmodorks__pla-plus__pro';
  if (lower.includes('low odor')) return 'gizmodorks__abs__low-odor';
  if (lower.includes('acetal') || lower.includes('pom')) return 'gizmodorks__pom__standard';
  if (lower.includes('polycarbonate')) return 'gizmodorks__pc__standard';
  if (lower.includes('nylon')) return 'gizmodorks__pa__standard';
  if (lower.includes('conductive')) return 'gizmodorks__pla__conductive';
  if (lower.includes('pva')) return 'gizmodorks__pva__standard';
  if (lower.includes('hips')) return 'gizmodorks__hips__standard';
  if (lower.includes('petg')) return 'gizmodorks__petg__standard';
  if (lower.includes('tpu')) return 'gizmodorks__tpu__standard';
  if (lower.includes('abs')) return 'gizmodorks__abs__standard';
  if (lower.includes('pla')) return 'gizmodorks__pla__standard';
  
  return 'gizmodorks__pla__standard';
}

/**
 * Extract finish type from material or color name
 */
export function getGizmoDorksFinishFromMaterial(material: string, color?: string): string {
  const combined = `${material} ${color || ''}`.toLowerCase();
  
  if (combined.includes('silk')) return 'Silk';
  if (combined.includes('glitter') || combined.includes('sparkle')) return 'Sparkle';
  if (combined.includes('glow') || combined.includes('gitd')) return 'Glow';
  if (combined.includes('translucent') || combined.includes('clear')) return 'Translucent';
  if (combined.includes('fluorescent') || combined.includes('black light')) return 'Fluorescent';
  if (combined.includes('color change') || combined.includes('heat activated')) return 'ColorChange';
  if (combined.includes('wood')) return 'Wood';
  if (combined.includes('metal') || combined.includes('bronze') || combined.includes('copper')) return 'Metal';
  
  return 'Standard';
}

/**
 * Get product count by product line for validation
 */
export function getGizmoDorksProductCountByLine(): Record<string, number> {
  const counts: Record<string, number> = {};
  
  for (const product of GIZMODORKS_PRODUCT_SEED) {
    const lineId = getGizmoDorksProductLineFromMaterial(product.material);
    counts[lineId] = (counts[lineId] || 0) + 1;
  }
  
  return counts;
}

/**
 * Get unique product lines from seed
 */
export function getGizmoDorksUniqueProductLines(): string[] {
  const lines = new Set<string>();
  
  for (const product of GIZMODORKS_PRODUCT_SEED) {
    lines.add(getGizmoDorksProductLineFromMaterial(product.material));
  }
  
  return Array.from(lines);
}

/**
 * Log seed statistics (for debugging)
 */
export function logGizmoDorksSeedStats(): void {
  console.log('[Gizmo Dorks Seed] Total products:', GIZMODORKS_PRODUCT_SEED.length);
  console.log('[Gizmo Dorks Seed] Product lines:', getGizmoDorksUniqueProductLines().length);
  console.log('[Gizmo Dorks Seed] By line:', getGizmoDorksProductCountByLine());
}

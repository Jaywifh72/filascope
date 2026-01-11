/**
 * IC3D Product Seed Data
 * 
 * Premium USA-based manufacturer (Ohio) - 56 variants across 10 product lines
 * Known for tight tolerances (±0.03mm), Open Source Hardware certification,
 * and sustainability initiatives (spool return program, recycled materials).
 * 
 * Platform: WooCommerce with Avada theme
 * Region: US only
 * Currency: USD
 * 
 * CRITICAL CONSTRAINTS (enforced at CSV level):
 * - Only 1.75mm diameter products (no 2.85mm)
 * - Only 1kg spools (no 2.5kg or 10kg bulk)
 * - No sample products (<300g)
 * - No gift cards or non-filament products
 */

export interface IC3DSeedProduct {
  material: string;           // Material type from CSV (e.g., "PolyHex (HT PETG)")
  productLine: string;        // Clean product line name (e.g., "PolyHex")
  filamentName: string;       // Full filament name from website
  color: string;              // Color name from dropdown option
  url: string;                // Product page URL
  image: string;              // Product image URL
  priceUSD: number;           // Default price in USD
}

// Material-based default pricing (1kg spools)
export const IC3D_DEFAULT_PRICES: Record<string, number> = {
  'PLA': 34.99,
  'PLA+': 33.00,
  'Matte PLA+': 37.00,
  'PETG': 34.99,
  'rPETG': 32.99,
  'Matte rPETG': 35.99,
  'UV-PETG': 34.99,
  'PETG-CF': 53.99,
  'ABS': 34.99,
  'Copolyester': 39.99,  // PolyHex
};

export function getIC3DDefaultPrice(material: string): number {
  return IC3D_DEFAULT_PRICES[material] || 34.99;
}

// Complete seed data - 56 variants across 11 product lines
export const IC3D_PRODUCT_SEED: IC3DSeedProduct[] = [
  // ===============================
  // PolyHex (HT PETG) - 1 variant (Copolyester)
  // ===============================
  {
    material: 'Copolyester',
    productLine: 'PolyHex',
    filamentName: 'PolyHex™ (Hi-Temp PETG) Filament',
    color: 'Black',
    url: 'https://www.ic3dprinters.com/shop/polyhex/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2023/06/Combo.png',
    priceUSD: 39.99,
  },

  // ===============================
  // Matte Recycled PETG - 5 variants (rPETG)
  // ===============================
  {
    material: 'rPETG',
    productLine: 'Matte Recycled PETG',
    filamentName: 'Matte Recycled PETG 3D Printer Filament',
    color: 'Matte Balanced Beige',
    url: 'https://www.ic3dprinters.com/shop/matte-recycled-petg-3d-printer-filament/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2023/03/Combo.jpg',
    priceUSD: 35.99,
  },
  {
    material: 'rPETG',
    productLine: 'Matte Recycled PETG',
    filamentName: 'Matte Recycled PETG 3D Printer Filament',
    color: 'Matte Drifting Fog',
    url: 'https://www.ic3dprinters.com/shop/matte-recycled-petg-3d-printer-filament/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2023/03/Combo.jpg',
    priceUSD: 35.99,
  },
  {
    material: 'rPETG',
    productLine: 'Matte Recycled PETG',
    filamentName: 'Matte Recycled PETG 3D Printer Filament',
    color: 'Matte Graphite Grey',
    url: 'https://www.ic3dprinters.com/shop/matte-recycled-petg-3d-printer-filament/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2023/03/Combo.jpg',
    priceUSD: 35.99,
  },
  {
    material: 'rPETG',
    productLine: 'Matte Recycled PETG',
    filamentName: 'Matte Recycled PETG 3D Printer Filament',
    color: 'White (Matte)',
    url: 'https://www.ic3dprinters.com/shop/matte-recycled-petg-3d-printer-filament/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2023/03/Combo.jpg',
    priceUSD: 35.99,
  },
  {
    material: 'rPETG',
    productLine: 'Matte Recycled PETG',
    filamentName: 'Matte Recycled PETG 3D Printer Filament',
    color: 'Black (Matte)',
    url: 'https://www.ic3dprinters.com/shop/matte-recycled-petg-3d-printer-filament/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2023/03/Combo.jpg',
    priceUSD: 35.99,
  },

  // ===============================
  // Recycled PETG - 9 variants (rPETG)
  // ===============================
  {
    material: 'rPETG',
    productLine: 'Recycled PETG',
    filamentName: 'Recycled PETG 3D Printer Filament',
    color: 'Translucent Blue Razz',
    url: 'https://www.ic3dprinters.com/shop/recycled-petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/03/ProductComboRPETGTrans500.jpg',
    priceUSD: 32.99,
  },
  {
    material: 'rPETG',
    productLine: 'Recycled PETG',
    filamentName: 'Recycled PETG 3D Printer Filament',
    color: 'Translucent Cherry',
    url: 'https://www.ic3dprinters.com/shop/recycled-petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/03/ProductComboRPETGTrans500.jpg',
    priceUSD: 32.99,
  },
  {
    material: 'rPETG',
    productLine: 'Recycled PETG',
    filamentName: 'Recycled PETG 3D Printer Filament',
    color: 'Translucent Grape',
    url: 'https://www.ic3dprinters.com/shop/recycled-petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/03/ProductComboRPETGTrans500.jpg',
    priceUSD: 32.99,
  },
  {
    material: 'rPETG',
    productLine: 'Recycled PETG',
    filamentName: 'Recycled PETG 3D Printer Filament',
    color: 'Translucent Honey',
    url: 'https://www.ic3dprinters.com/shop/recycled-petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/03/ProductComboRPETGTrans500.jpg',
    priceUSD: 32.99,
  },
  {
    material: 'rPETG',
    productLine: 'Recycled PETG',
    filamentName: 'Recycled PETG 3D Printer Filament',
    color: 'Translucent Watermelon',
    url: 'https://www.ic3dprinters.com/shop/recycled-petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/03/ProductComboRPETGTrans500.jpg',
    priceUSD: 32.99,
  },
  {
    material: 'rPETG',
    productLine: 'Recycled PETG',
    filamentName: 'Recycled PETG 3D Printer Filament',
    color: 'Black',
    url: 'https://www.ic3dprinters.com/shop/recycled-petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/03/ProductComboRPETGTrans500.jpg',
    priceUSD: 32.99,
  },
  {
    material: 'rPETG',
    productLine: 'Recycled PETG',
    filamentName: 'Recycled PETG 3D Printer Filament',
    color: 'Natural (Clear)',
    url: 'https://www.ic3dprinters.com/shop/recycled-petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/03/ProductComboRPETGTrans500.jpg',
    priceUSD: 32.99,
  },
  {
    material: 'rPETG',
    productLine: 'Recycled PETG',
    filamentName: 'Recycled PETG 3D Printer Filament',
    color: 'Red',
    url: 'https://www.ic3dprinters.com/shop/recycled-petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/03/ProductComboRPETGTrans500.jpg',
    priceUSD: 32.99,
  },
  {
    material: 'rPETG',
    productLine: 'Recycled PETG',
    filamentName: 'Recycled PETG 3D Printer Filament',
    color: 'White',
    url: 'https://www.ic3dprinters.com/shop/recycled-petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/03/ProductComboRPETGTrans500.jpg',
    priceUSD: 32.99,
  },

  // ===============================
  // Matte Impact Modified PLA - 3 variants (PLA+)
  // ===============================
  {
    material: 'PLA+',
    productLine: 'Matte Impact Modified PLA',
    filamentName: 'Matte Impact Modified PLA',
    color: 'Moss Green (Matte)',
    url: 'https://www.ic3dprinters.com/shop/matte-pla-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2022/11/Matte-PLA.png',
    priceUSD: 37.00,
  },
  {
    material: 'PLA+',
    productLine: 'Matte Impact Modified PLA',
    filamentName: 'Matte Impact Modified PLA',
    color: 'White (Matte)',
    url: 'https://www.ic3dprinters.com/shop/matte-pla-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2022/11/Matte-PLA.png',
    priceUSD: 37.00,
  },
  {
    material: 'PLA+',
    productLine: 'Matte Impact Modified PLA',
    filamentName: 'Matte Impact Modified PLA',
    color: 'Black (Matte)',
    url: 'https://www.ic3dprinters.com/shop/matte-pla-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2022/11/Matte-PLA.png',
    priceUSD: 37.00,
  },

  // ===============================
  // Carbon Fiber PETG - 1 variant (PETG-CF)
  // ===============================
  {
    material: 'PETG-CF',
    productLine: 'Carbon Fiber PETG',
    filamentName: 'Carbon Fiber PETG',
    color: 'Standard',
    url: 'https://www.ic3dprinters.com/shop/cf-petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2022/12/IC3D-CF-PETG-Black.jpg',
    priceUSD: 53.99,
  },

  // ===============================
  // Impact Modified PLA - 6 variants (PLA+)
  // ===============================
  {
    material: 'PLA+',
    productLine: 'Impact Modified PLA',
    filamentName: 'Impact Modified PLA',
    color: 'Black',
    url: 'https://www.ic3dprinters.com/shop/impact-modified-pla/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2022/12/Combo.jpg',
    priceUSD: 33.00,
  },
  {
    material: 'PLA+',
    productLine: 'Impact Modified PLA',
    filamentName: 'Impact Modified PLA',
    color: 'Blue',
    url: 'https://www.ic3dprinters.com/shop/impact-modified-pla/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2022/12/Combo.jpg',
    priceUSD: 33.00,
  },
  {
    material: 'PLA+',
    productLine: 'Impact Modified PLA',
    filamentName: 'Impact Modified PLA',
    color: 'Grey',
    url: 'https://www.ic3dprinters.com/shop/impact-modified-pla/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2022/12/Combo.jpg',
    priceUSD: 33.00,
  },
  {
    material: 'PLA+',
    productLine: 'Impact Modified PLA',
    filamentName: 'Impact Modified PLA',
    color: 'Natural',
    url: 'https://www.ic3dprinters.com/shop/impact-modified-pla/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2022/12/Combo.jpg',
    priceUSD: 33.00,
  },
  {
    material: 'PLA+',
    productLine: 'Impact Modified PLA',
    filamentName: 'Impact Modified PLA',
    color: 'Red',
    url: 'https://www.ic3dprinters.com/shop/impact-modified-pla/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2022/12/Combo.jpg',
    priceUSD: 33.00,
  },
  {
    material: 'PLA+',
    productLine: 'Impact Modified PLA',
    filamentName: 'Impact Modified PLA',
    color: 'White',
    url: 'https://www.ic3dprinters.com/shop/impact-modified-pla/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2022/12/Combo.jpg',
    priceUSD: 33.00,
  },

  // ===============================
  // UV-PETG - 5 variants (PETG)
  // ===============================
  {
    material: 'PETG',
    productLine: 'UV-PETG',
    filamentName: 'UV-PETG 3D Printing Filament',
    color: 'Concrete',
    url: 'https://www.ic3dprinters.com/shop/uv-petg-filament/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/05/IMG_0276.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PETG',
    productLine: 'UV-PETG',
    filamentName: 'UV-PETG 3D Printing Filament',
    color: 'Black',
    url: 'https://www.ic3dprinters.com/shop/uv-petg-filament/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/05/IMG_0276.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PETG',
    productLine: 'UV-PETG',
    filamentName: 'UV-PETG 3D Printing Filament',
    color: 'Charcoal',
    url: 'https://www.ic3dprinters.com/shop/uv-petg-filament/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/05/IMG_0276.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PETG',
    productLine: 'UV-PETG',
    filamentName: 'UV-PETG 3D Printing Filament',
    color: 'Natural (Clear)',
    url: 'https://www.ic3dprinters.com/shop/uv-petg-filament/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/05/IMG_0276.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PETG',
    productLine: 'UV-PETG',
    filamentName: 'UV-PETG 3D Printing Filament',
    color: 'White',
    url: 'https://www.ic3dprinters.com/shop/uv-petg-filament/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2021/05/IMG_0276.jpg',
    priceUSD: 34.99,
  },

  // ===============================
  // ABS - 10 variants
  // ===============================
  {
    material: 'ABS',
    productLine: 'ABS',
    filamentName: 'IC3D ABS 3D Printer Filament',
    color: 'Black',
    url: 'https://www.ic3dprinters.com/shop/abs-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/ABS-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'ABS',
    productLine: 'ABS',
    filamentName: 'IC3D ABS 3D Printer Filament',
    color: 'Blue',
    url: 'https://www.ic3dprinters.com/shop/abs-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/ABS-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'ABS',
    productLine: 'ABS',
    filamentName: 'IC3D ABS 3D Printer Filament',
    color: 'Bright Green',
    url: 'https://www.ic3dprinters.com/shop/abs-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/ABS-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'ABS',
    productLine: 'ABS',
    filamentName: 'IC3D ABS 3D Printer Filament',
    color: 'Green',
    url: 'https://www.ic3dprinters.com/shop/abs-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/ABS-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'ABS',
    productLine: 'ABS',
    filamentName: 'IC3D ABS 3D Printer Filament',
    color: 'Grey',
    url: 'https://www.ic3dprinters.com/shop/abs-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/ABS-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'ABS',
    productLine: 'ABS',
    filamentName: 'IC3D ABS 3D Printer Filament',
    color: 'Natural',
    url: 'https://www.ic3dprinters.com/shop/abs-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/ABS-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'ABS',
    productLine: 'ABS',
    filamentName: 'IC3D ABS 3D Printer Filament',
    color: 'Orange',
    url: 'https://www.ic3dprinters.com/shop/abs-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/ABS-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'ABS',
    productLine: 'ABS',
    filamentName: 'IC3D ABS 3D Printer Filament',
    color: 'Red',
    url: 'https://www.ic3dprinters.com/shop/abs-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/ABS-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'ABS',
    productLine: 'ABS',
    filamentName: 'IC3D ABS 3D Printer Filament',
    color: 'White',
    url: 'https://www.ic3dprinters.com/shop/abs-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/ABS-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'ABS',
    productLine: 'ABS',
    filamentName: 'IC3D ABS 3D Printer Filament',
    color: 'Yellow',
    url: 'https://www.ic3dprinters.com/shop/abs-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/ABS-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },

  // ===============================
  // PETG - 8 variants
  // ===============================
  {
    material: 'PETG',
    productLine: 'PETG',
    filamentName: 'IC3D PETG 3D Printer Filament',
    color: 'Black',
    url: 'https://www.ic3dprinters.com/shop/petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2018/07/PETG-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PETG',
    productLine: 'PETG',
    filamentName: 'IC3D PETG 3D Printer Filament',
    color: 'Blue',
    url: 'https://www.ic3dprinters.com/shop/petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2018/07/PETG-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PETG',
    productLine: 'PETG',
    filamentName: 'IC3D PETG 3D Printer Filament',
    color: 'Green (Bright)',
    url: 'https://www.ic3dprinters.com/shop/petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2018/07/PETG-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PETG',
    productLine: 'PETG',
    filamentName: 'IC3D PETG 3D Printer Filament',
    color: 'Grey',
    url: 'https://www.ic3dprinters.com/shop/petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2018/07/PETG-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PETG',
    productLine: 'PETG',
    filamentName: 'IC3D PETG 3D Printer Filament',
    color: 'Natural (Clear)',
    url: 'https://www.ic3dprinters.com/shop/petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2018/07/PETG-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PETG',
    productLine: 'PETG',
    filamentName: 'IC3D PETG 3D Printer Filament',
    color: 'Red',
    url: 'https://www.ic3dprinters.com/shop/petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2018/07/PETG-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PETG',
    productLine: 'PETG',
    filamentName: 'IC3D PETG 3D Printer Filament',
    color: 'White',
    url: 'https://www.ic3dprinters.com/shop/petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2018/07/PETG-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PETG',
    productLine: 'PETG',
    filamentName: 'IC3D PETG 3D Printer Filament',
    color: 'Yellow',
    url: 'https://www.ic3dprinters.com/shop/petg/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2018/07/PETG-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },

  // ===============================
  // PLA - 8 variants
  // ===============================
  {
    material: 'PLA',
    productLine: 'PLA',
    filamentName: 'IC3D PLA 3D Printer Filament',
    color: 'Black',
    url: 'https://www.ic3dprinters.com/shop/pla-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/PLA-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PLA',
    productLine: 'PLA',
    filamentName: 'IC3D PLA 3D Printer Filament',
    color: 'Blue',
    url: 'https://www.ic3dprinters.com/shop/pla-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/PLA-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PLA',
    productLine: 'PLA',
    filamentName: 'IC3D PLA 3D Printer Filament',
    color: 'Grey',
    url: 'https://www.ic3dprinters.com/shop/pla-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/PLA-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PLA',
    productLine: 'PLA',
    filamentName: 'IC3D PLA 3D Printer Filament',
    color: 'Natural',
    url: 'https://www.ic3dprinters.com/shop/pla-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/PLA-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PLA',
    productLine: 'PLA',
    filamentName: 'IC3D PLA 3D Printer Filament',
    color: 'Orange',
    url: 'https://www.ic3dprinters.com/shop/pla-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/PLA-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PLA',
    productLine: 'PLA',
    filamentName: 'IC3D PLA 3D Printer Filament',
    color: 'Red',
    url: 'https://www.ic3dprinters.com/shop/pla-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/PLA-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PLA',
    productLine: 'PLA',
    filamentName: 'IC3D PLA 3D Printer Filament',
    color: 'White',
    url: 'https://www.ic3dprinters.com/shop/pla-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/PLA-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
  {
    material: 'PLA',
    productLine: 'PLA',
    filamentName: 'IC3D PLA 3D Printer Filament',
    color: 'Yellow',
    url: 'https://www.ic3dprinters.com/shop/pla-filaments/',
    image: 'https://www.ic3dprinters.com/ic3d/wp-content/uploads/2016/11/PLA-Product-Combo-500x500.jpg',
    priceUSD: 34.99,
  },
];

// Seed stats for validation
export const IC3D_SEED_STATS = {
  totalProducts: IC3D_PRODUCT_SEED.length,  // 56
  productLines: [...new Set(IC3D_PRODUCT_SEED.map(p => p.productLine))].length,  // 11
  materials: [...new Set(IC3D_PRODUCT_SEED.map(p => p.material))],
  singleColorLines: ['PolyHex', 'Carbon Fiber PETG'],  // Lines with only 1 variant (expected)
};

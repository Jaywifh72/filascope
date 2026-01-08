/**
 * FIBERLOGY PRODUCT SEED
 * 
 * CSV-seeded product data for Fiberlogy filaments.
 * This is the primary source of truth for all Fiberlogy products.
 * 
 * Total products: 274 color variants across 17 product lines
 * 
 * Product Lines:
 * - ABS (16 colors)
 * - ABS Plus (7 colors)
 * - Easy ABS (6 colors - transparent variants)
 * - ASA (16 colors)
 * - Easy PLA (47 colors)
 * - Easy PETG (26 colors)
 * - FiberFlex 30D (16 colors)
 * - FiberFlex 40D (22 colors)
 * - FiberSilk (12 colors)
 * - FiberWood (6 colors)
 * - HIPS (4 colors)
 * - HS PLA Clear (9 colors)
 * - Impact PLA (14 colors)
 * - Matte PLA (15 colors)
 * - Matte PETG (13 colors)
 * - MattFlex 40D (5 colors)
 * - Nylon PA12 (9 colors)
 * - PCTG (15 colors)
 * - PP (22 colors)
 */

export interface FiberlogySeedProduct {
  material: string;        // Base material category from CSV
  filament: string;        // Full filament name with dimensions
  color: string;           // Color name
  productUrl: string;      // Product page URL
  imageUrl: string | null; // Will be null (CSV images are placeholders)
  colorHex: string | null; // Will be derived from color mapping
}

export const FIBERLOGY_PRODUCT_SEED: FiberlogySeedProduct[] = [
  // ========== ABS ==========
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Gray', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Beige', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Burgundy', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Orange', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Yellow', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Light Green', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Green', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Navy Blue', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Onyx', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Vertigo', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Filament - 1.75 mm - 0.85 kg', color: 'Inox', productUrl: 'https://fiberlogy.com/en/ABS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  
  // ========== Easy PLA ==========
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Gray', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Lithophane White', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Beige', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Brown', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Burgundy', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Red Orange', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Orange', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Yellow', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Light Green', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Green', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Irish Green', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Cyan', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'True Blue', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Navy Blue', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Magenta', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Pink', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Candy', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Pastel Blue', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Pastel Lilac', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Pastel Mint', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Pastel Pink', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Pastel Yellow', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Neon Green', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Neon Orange', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Neon Yellow', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Skin Tone 1', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Skin Tone 2', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Skin Tone 3', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Onyx', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Onyx Gold', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Aurora', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Midnight Sky', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Vertigo', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Alien Green', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Ruby Red', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Spectra Blue', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Inox', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Granite', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Brick', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'Sandstone', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Easy PLA Filament - 1.75 mm - 0.85 kg', color: 'True Gold', productUrl: 'https://fiberlogy.com/en/Easy-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  
  // ========== Easy PETG ==========
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Gray', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Pure Transparent', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Burgundy Transparent', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Scarlet', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Orange Transparent', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Orange', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Yellow', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Light Green', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Light Green Transparent', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Green', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Bottle Green Transparent', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Navy Blue Transparent', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Pastel Blue', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Pastel Lilac', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Pastel Mint', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Pastel Pink', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Pastel Yellow', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Onyx', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Vertigo', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PETG', filament: 'Easy PETG Filament - 1.75 mm - 0.85 kg', color: 'Silver', productUrl: 'https://fiberlogy.com/en/Easy-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  
  // ========== FiberFlex 40D ==========
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Gray', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Beige', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Brown', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Burgundy', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Orange', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Yellow', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Light Green', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Green', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Navy Blue', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Purple', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Pink', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Neon Yellow', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Skin Tone 1', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Skin Tone 2', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Skin Tone 3', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Vertigo', productUrl: 'https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  
  // ========== FiberSilk ==========
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Anthracite', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Pearl', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Orange', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Light Green', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Green', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Navy Blue', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Silver', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Brass', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Bronze', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Copper', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERSILK', filament: 'FiberSilk Filament - 1.75 mm - 0.85 kg', color: 'Gold', productUrl: 'https://fiberlogy.com/en/FiberSilk-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  
  // ========== ASA ==========
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Gray', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Natural', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Orange', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Yellow', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Light Green', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Olive Green', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Onyx', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Vertigo', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ASA', filament: 'ASA Filament - 1.75 mm - 0.75 kg', color: 'Inox', productUrl: 'https://fiberlogy.com/en/ASA-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  
  // ========== PCTG ==========
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Gray', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Pure Transparent', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Burgundy Transparent', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Orange Transparent', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Orange', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Light Green Transparent', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Navy Blue Transparent', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Onyx', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Vertigo', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PCTG', filament: 'PCTG Filament - 1.75 mm - 0.75 kg', color: 'Inox', productUrl: 'https://fiberlogy.com/en/PCTG-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  
  // ========== Nylon PA12 ==========
  { material: 'NYLON', filament: 'Nylon PA12 Filament - 1.75 mm - 0.75 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/Nylon-PA12-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'NYLON', filament: 'Nylon PA12 Filament - 1.75 mm - 0.75 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/Nylon-PA12-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'NYLON', filament: 'Nylon PA12 Filament - 1.75 mm - 0.75 kg', color: 'Natural', productUrl: 'https://fiberlogy.com/en/Nylon-PA12-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'NYLON', filament: 'Nylon PA12 Filament - 1.75 mm - 0.75 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/Nylon-PA12-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'NYLON', filament: 'Nylon PA12 Filament - 1.75 mm - 0.75 kg', color: 'Orange', productUrl: 'https://fiberlogy.com/en/Nylon-PA12-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'NYLON', filament: 'Nylon PA12 Filament - 1.75 mm - 0.75 kg', color: 'Yellow', productUrl: 'https://fiberlogy.com/en/Nylon-PA12-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'NYLON', filament: 'Nylon PA12 Filament - 1.75 mm - 0.75 kg', color: 'Light Green', productUrl: 'https://fiberlogy.com/en/Nylon-PA12-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'NYLON', filament: 'Nylon PA12 Filament - 1.75 mm - 0.75 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/Nylon-PA12-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'NYLON', filament: 'Nylon PA12 Filament - 1.75 mm - 0.75 kg', color: 'Inox', productUrl: 'https://fiberlogy.com/en/Nylon-PA12-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  
  // ========== Impact PLA ==========
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Gray', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Orange', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Yellow', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Light Green', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Khaki', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Olive Green', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Army Green', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Onyx', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'IMPACT', filament: 'Impact PLA Filament - 1.75 mm - 0.85 kg', color: 'Vertigo', productUrl: 'https://fiberlogy.com/en/Impact-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  
  // ========== Matte PETG ==========
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'Gray', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'Light Green', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'Green', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'Pastel Blue', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'Pastel Lilac', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'Pastel Mint', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'Pastel Pink', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTE', filament: 'Matte PETG Filament - 1.75 mm - 0.85 kg', color: 'Pastel Yellow', productUrl: 'https://fiberlogy.com/en/Matte-PETG-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  
  // ========== HIPS ==========
  { material: 'HIPS', filament: 'HIPS Filament - 1.75 mm - 0.85 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/HIPS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'HIPS', filament: 'HIPS Filament - 1.75 mm - 0.85 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/HIPS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'HIPS', filament: 'HIPS Filament - 1.75 mm - 0.85 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/HIPS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'HIPS', filament: 'HIPS Filament - 1.75 mm - 0.85 kg', color: 'Natural', productUrl: 'https://fiberlogy.com/en/HIPS-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  
  // ========== FiberWood ==========
  { material: 'FIBERWOOD', filament: 'FiberWood Filament - 1.75 mm - 0.75 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/FiberWood-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'FIBERWOOD', filament: 'FiberWood Filament - 1.75 mm - 0.75 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/FiberWood-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'FIBERWOOD', filament: 'FiberWood Filament - 1.75 mm - 0.75 kg', color: 'Natural', productUrl: 'https://fiberlogy.com/en/FiberWood-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'FIBERWOOD', filament: 'FiberWood Filament - 1.75 mm - 0.75 kg', color: 'Brown', productUrl: 'https://fiberlogy.com/en/FiberWood-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'FIBERWOOD', filament: 'FiberWood Filament - 1.75 mm - 0.75 kg', color: 'Carmine', productUrl: 'https://fiberlogy.com/en/FiberWood-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'FIBERWOOD', filament: 'FiberWood Filament - 1.75 mm - 0.75 kg', color: 'Green', productUrl: 'https://fiberlogy.com/en/FiberWood-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  
  // ========== ABS Plus ==========
  { material: 'ABS', filament: 'ABS Plus Filament - 1.75 mm - 0.85 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/ABS-Plus-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Plus Filament - 1.75 mm - 0.85 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/ABS-Plus-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Plus Filament - 1.75 mm - 0.85 kg', color: 'Gray', productUrl: 'https://fiberlogy.com/en/ABS-Plus-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Plus Filament - 1.75 mm - 0.85 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/ABS-Plus-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Plus Filament - 1.75 mm - 0.85 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/ABS-Plus-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Plus Filament - 1.75 mm - 0.85 kg', color: 'Yellow', productUrl: 'https://fiberlogy.com/en/ABS-Plus-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'ABS Plus Filament - 1.75 mm - 0.85 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/ABS-Plus-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  
  // ========== Easy ABS (Transparent variants) ==========
  { material: 'ABS', filament: 'Easy ABS Filament - 1.75 mm - 0.75 kg', color: 'Pure Transparent', productUrl: 'https://fiberlogy.com/en/Easy-ABS-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'Easy ABS Filament - 1.75 mm - 0.75 kg', color: 'Burgundy Transparent', productUrl: 'https://fiberlogy.com/en/Easy-ABS-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'Easy ABS Filament - 1.75 mm - 0.75 kg', color: 'Orange Transparent', productUrl: 'https://fiberlogy.com/en/Easy-ABS-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'Easy ABS Filament - 1.75 mm - 0.75 kg', color: 'Light Green Transparent', productUrl: 'https://fiberlogy.com/en/Easy-ABS-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'Easy ABS Filament - 1.75 mm - 0.75 kg', color: 'Blue Transparent', productUrl: 'https://fiberlogy.com/en/Easy-ABS-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'ABS', filament: 'Easy ABS Filament - 1.75 mm - 0.75 kg', color: 'Navy Blue Transparent', productUrl: 'https://fiberlogy.com/en/Easy-ABS-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  
  // ========== FiberFlex 30D ==========
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Gray', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Beige', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Burgundy', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Orange', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Yellow', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Light Green', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Green', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Navy Blue', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Pink', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'FIBERFLEX', filament: 'FiberFlex 30D Filament - 1.75 mm - 0.85 kg', color: 'Neon Yellow', productUrl: 'https://fiberlogy.com/en/FiberFlex-30D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  
  // ========== PP (Polypropylene) ==========
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Gray', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Natural', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Brown', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Orange', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Yellow', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Light Green', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Sage Green', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Steel Blue', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Pastel Blue', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Pastel Lilac', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Pastel Mint', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Pastel Pink', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Pastel Yellow', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Skin Tone 1', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Skin Tone 2', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  { material: 'PP', filament: 'PP Filament - 1.75 mm - 0.75 kg', color: 'Skin Tone 3', productUrl: 'https://fiberlogy.com/en/PP-Filament-1_75mm-0_75kg', imageUrl: null, colorHex: null },
  
  // ========== HS PLA Clear ==========
  { material: 'PLA', filament: 'HS PLA Clear Filament - 1.75 mm - 0.85 kg', color: 'Pure Transparent', productUrl: 'https://fiberlogy.com/en/HS-PLA-Clear-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'HS PLA Clear Filament - 1.75 mm - 0.85 kg', color: 'Burgundy Transparent', productUrl: 'https://fiberlogy.com/en/HS-PLA-Clear-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'HS PLA Clear Filament - 1.75 mm - 0.85 kg', color: 'Orange Transparent', productUrl: 'https://fiberlogy.com/en/HS-PLA-Clear-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'HS PLA Clear Filament - 1.75 mm - 0.85 kg', color: 'Light Green', productUrl: 'https://fiberlogy.com/en/HS-PLA-Clear-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'HS PLA Clear Filament - 1.75 mm - 0.85 kg', color: 'Green', productUrl: 'https://fiberlogy.com/en/HS-PLA-Clear-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'HS PLA Clear Filament - 1.75 mm - 0.85 kg', color: 'Turquoise', productUrl: 'https://fiberlogy.com/en/HS-PLA-Clear-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'HS PLA Clear Filament - 1.75 mm - 0.85 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/HS-PLA-Clear-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'HS PLA Clear Filament - 1.75 mm - 0.85 kg', color: 'Navy Blue', productUrl: 'https://fiberlogy.com/en/HS-PLA-Clear-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'HS PLA Clear Filament - 1.75 mm - 0.85 kg', color: 'Pink', productUrl: 'https://fiberlogy.com/en/HS-PLA-Clear-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  
  // ========== Matte PLA ==========
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Gray', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Beige', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Pastel Blue', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Pastel Lilac', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Pastel Mint', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Pastel Pink', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Pastel Yellow', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Skin Tone 1', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Skin Tone 2', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'PLA', filament: 'Matte PLA Filament - 1.75 mm - 0.85 kg', color: 'Skin Tone 3', productUrl: 'https://fiberlogy.com/en/Matte-PLA-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  
  // ========== MattFlex 40D ==========
  { material: 'MATTFLEX', filament: 'MattFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Black', productUrl: 'https://fiberlogy.com/en/MattFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTFLEX', filament: 'MattFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Graphite', productUrl: 'https://fiberlogy.com/en/MattFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTFLEX', filament: 'MattFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'White', productUrl: 'https://fiberlogy.com/en/MattFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTFLEX', filament: 'MattFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Red', productUrl: 'https://fiberlogy.com/en/MattFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
  { material: 'MATTFLEX', filament: 'MattFlex 40D Filament - 1.75 mm - 0.85 kg', color: 'Blue', productUrl: 'https://fiberlogy.com/en/MattFlex-40D-Filament-1_75mm-0_85kg', imageUrl: null, colorHex: null },
];

// Total products count
export const FIBERLOGY_PRODUCT_COUNT = FIBERLOGY_PRODUCT_SEED.length;

// Product line groupings derived from CSV
export const FIBERLOGY_PRODUCT_LINES = [
  'abs',
  'abs-plus',
  'easy-abs',
  'asa',
  'easy-pla',
  'easy-petg',
  'fiberflex-30d',
  'fiberflex-40d',
  'fibersilk',
  'fiberwood',
  'hips',
  'hs-pla-clear',
  'impact-pla',
  'matte-pla',
  'matte-petg',
  'mattflex-40d',
  'nylon-pa12',
  'pctg',
  'pp',
] as const;

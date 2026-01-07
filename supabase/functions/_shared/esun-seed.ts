/**
 * eSUN Product Seed Data
 * CSV-seeded architecture for 100% reliable sync
 * 
 * This file contains the complete eSUN product catalog (365 products)
 * extracted from the official eSUN store with curated hex codes and image URLs.
 */

export interface EsunProductSeed {
  material: string;      // Base material (PLA, PETG, ABS, etc.)
  filamentLine: string;  // Full product line name from CSV
  color: string;         // Color name
  colorHex: string;      // Curated hex code
  productUrl: string;    // Product URL
  imageUrl: string;      // CDN image URL
}

/**
 * Complete eSUN product seed (365 products)
 * Source: esun_filaments_completebyOpus.csv
 */
export const ESUN_PRODUCT_SEED: EsunProductSeed[] = [
  // PLA-Basic (26 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#393D47', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Cold White', colorHex: '#F8F8FF', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Bone White', colorHex: '#EFE1C8', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Beige', colorHex: '#FFE2CB', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Grey', colorHex: '#6F828E', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Light Grey', colorHex: '#688197', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Silver', colorHex: '#7E7E82', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Blue', colorHex: '#1D57A5', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Light Blue', colorHex: '#489FDF', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Sky Blue', colorHex: '#63D0F9', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Dark Blue', colorHex: '#3A4056', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Fire Engine Red', colorHex: '#912F46', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Red', colorHex: '#DB4437', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Pink', colorHex: '#F65C87', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Barbie Pink', colorHex: '#FD838E', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Purple', colorHex: '#9E007E', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Grape Purple', colorHex: '#9949BE', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Green', colorHex: '#2CC84D', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Peak Green', colorHex: '#B6DE89', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Holly Green', colorHex: '#33726D', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Olive Green', colorHex: '#727661', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Brown', colorHex: '#634432', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Yellow', colorHex: '#FFEB17', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Basic 1.75mm 3D Filament 1KG', color: 'Orange', colorHex: '#FF6A14', productUrl: 'https://esun3dstore.com/products/epla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/ef1458710c.jpg' },

  // PLA-Matte (24 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Deep Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/f26aab4ecc.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Milky White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/31948269f0.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Light Khaki', colorHex: '#F0E68C', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/99663d9cac.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Dark Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/0d62eb6e1c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Lake Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/3fc4a415c7.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Almond Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/3835dbee05.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Mint Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/1c47b912ea.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Peach Pink', colorHex: '#FFC0CB', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/d0f54f2a58.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Rainbow', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/ef028660be.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Lilac', colorHex: '#C8A2C8', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/32b4da1364.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Tangerine', colorHex: '#D2B48C', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/762e8ec49b.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Strawberry Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/a38fbafe36.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Matcha Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/a58d5e82bc.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Morandi Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/a62b54d7e5.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Morandi Purple', colorHex: '#800080', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/b69ddf918f.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Red Blue', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/4fd5fd5af7.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Green Purple', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/d993d8668e.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Green Pink', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/a56dbab861.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Purple Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/4a324ec09f.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Purple Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/e024163a18.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Green Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/12a1090a40.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Red Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/2aa2b2d50c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Black White', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/0511c93993.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Macaron', colorHex: '#F2D7D5', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/28/products/be28c9e619.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Ocean', colorHex: '#006994', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/28/products/e5f8bd11af.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Paddy Field', colorHex: '#7CB518', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/28/products/9a7e770f2f.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Matte 1.75mm 3D Filament 1KG', color: 'Sunrise', colorHex: '#FFCF48', productUrl: 'https://esun3dstore.com/products/epla-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/28/products/65d41ab225.jpg' },

  // PLA-Silk (10 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk 1.75mm 3D Filament 1KG', color: 'Silk White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/epla-silk', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/17f7db17d3.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk 1.75mm 3D Filament 1KG', color: 'Silk Dark Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/epla-silk', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/51784c2b04.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk 1.75mm 3D Filament 1KG', color: 'Silk Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-silk', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/aadaafe7bd.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk 1.75mm 3D Filament 1KG', color: 'Silk Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-silk', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/1e8c3534c1.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk 1.75mm 3D Filament 1KG', color: 'Silk Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-silk', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/0744da6302.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk 1.75mm 3D Filament 1KG', color: 'Silk Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/epla-silk', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/410e924b2b.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk 1.75mm 3D Filament 1KG', color: 'Silk Violet', colorHex: '#EE82EE', productUrl: 'https://esun3dstore.com/products/epla-silk', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/589ddb8174.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk 1.75mm 3D Filament 1KG', color: 'Silk Lime', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-silk', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/ccff536b08.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk 1.75mm 3D Filament 1KG', color: 'Silk Purple', colorHex: '#800080', productUrl: 'https://esun3dstore.com/products/epla-silk', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/92b68e281c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk 1.75mm 3D Filament 1KG', color: 'Silk Cyan', colorHex: '#00FFFF', productUrl: 'https://esun3dstore.com/products/epla-silk', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/fec2a2ec57.jpg' },

  // TPU-95A (13 colors)
  { material: 'TPU', filamentLine: 'eSUN TPU-95A 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/tpu-95a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/25/products/d8f3bcdb95.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-95A 1.75mm 3D Filament 1KG', color: 'Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/tpu-95a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/25/products/ca1d2adae4.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-95A 1.75mm 3D Filament 1KG', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/tpu-95a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/25/products/aa07e35bcc.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-95A 1.75mm 3D Filament 1KG', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://esun3dstore.com/products/tpu-95a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/25/products/4a08d0b9e4.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-95A 1.75mm 3D Filament 1KG', color: 'Rainbow', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/tpu-95a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/25/products/43be18b3eb.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-95A 1.75mm 3D Filament 1KG', color: 'Transparent Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/tpu-95a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/25/products/8b2e73cc21.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-95A 1.75mm 3D Filament 1KG', color: 'Transparent Orange', colorHex: '#FFA500', productUrl: 'https://esun3dstore.com/products/tpu-95a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/25/products/d76dd4c09e.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-95A 1.75mm 3D Filament 1KG', color: 'Transparent Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/tpu-95a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/25/products/c7912b31c5.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-95A 1.75mm 3D Filament 1KG', color: 'Transparent Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/tpu-95a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/25/products/a5e1eabf0b.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-95A 1.75mm 3D Filament 1KG', color: 'Transparent Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/tpu-95a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/25/products/6693b123b8.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-95A 1.75mm 3D Filament 1KG', color: 'Transparent Purple', colorHex: '#800080', productUrl: 'https://esun3dstore.com/products/tpu-95a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/25/products/9506462860.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-95A 1.75mm 3D Filament 1KG', color: 'Transparent Pink', colorHex: '#FFC0CB', productUrl: 'https://esun3dstore.com/products/tpu-95a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/25/products/46efb7a537.jpg' },

  // ABS+ (11 colors)
  { material: 'ABS', filamentLine: 'eSUN ABS+ 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/abs-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/5ee3c1275c.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+ 1.75mm 3D Filament 1KG', color: 'Cold White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/abs-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/73c45f3f0e.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+ 1.75mm 3D Filament 1KG', color: 'Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/abs-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/9c74e14f26.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+ 1.75mm 3D Filament 1KG', color: 'Fire Engine Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/abs-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/dcf3b64033.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+ 1.75mm 3D Filament 1KG', color: 'Silver', colorHex: '#C0C0C0', productUrl: 'https://esun3dstore.com/products/abs-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/5651594e07.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+ 1.75mm 3D Filament 1KG', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://esun3dstore.com/products/abs-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/07532a846c.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+ 1.75mm 3D Filament 1KG', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/abs-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/e3117f0dca.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+ 1.75mm 3D Filament 1KG', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/abs-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/b4cef1e8a6.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+ 1.75mm 3D Filament 1KG', color: 'Orange', colorHex: '#FFA500', productUrl: 'https://esun3dstore.com/products/abs-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/cdae4497bc.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+ 1.75mm 3D Filament 1KG', color: 'Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/abs-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/6610f96804.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+ 1.75mm 3D Filament 1KG', color: 'Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/abs-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/408e45d71a.jpg' },

  // ASA+ (9 colors)
  { material: 'ASA', filamentLine: 'eSUN ASA+ 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/easa', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/9998b220a4.jpg' },
  { material: 'ASA', filamentLine: 'eSUN ASA+ 1.75mm 3D Filament 1KG', color: 'Cold White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/easa', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/2e40c77703.jpg' },
  { material: 'ASA', filamentLine: 'eSUN ASA+ 1.75mm 3D Filament 1KG', color: 'Warm White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/easa', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/6fcd8fa944.jpg' },
  { material: 'ASA', filamentLine: 'eSUN ASA+ 1.75mm 3D Filament 1KG', color: 'Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/easa', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/458ae0fcde.jpg' },
  { material: 'ASA', filamentLine: 'eSUN ASA+ 1.75mm 3D Filament 1KG', color: 'Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/easa', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/1e6f628071.jpg' },
  { material: 'ASA', filamentLine: 'eSUN ASA+ 1.75mm 3D Filament 1KG', color: 'Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/easa', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/338dbae366.jpg' },
  { material: 'ASA', filamentLine: 'eSUN ASA+ 1.75mm 3D Filament 1KG', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/easa', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/d9af628544.jpg' },
  { material: 'ASA', filamentLine: 'eSUN ASA+ 1.75mm 3D Filament 1KG', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/easa', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/d5a4ba4d25.jpg' },
  { material: 'ASA', filamentLine: 'eSUN ASA+ 1.75mm 3D Filament 1KG', color: 'Silver', colorHex: '#C0C0C0', productUrl: 'https://esun3dstore.com/products/easa', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/04/products/d53955ae8f.jpg' },

  // PLA-Silk Metal (3 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Metal 1.75mm 3D Filament 1KG', color: 'Silk Copper', colorHex: '#B87333', productUrl: 'https://esun3dstore.com/products/epla-silk-metal', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/97f36b7b5a.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Metal 1.75mm 3D Filament 1KG', color: 'Silk Gold', colorHex: '#FFD700', productUrl: 'https://esun3dstore.com/products/epla-silk-metal', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/4c79448116.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Metal 1.75mm 3D Filament 1KG', color: 'Silk Silver', colorHex: '#C0C0C0', productUrl: 'https://esun3dstore.com/products/epla-silk-metal', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/931a5eaaa1.jpg' },

  // PLA-Luminous (2 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Luminous 1.75mm 3D Filament 1KG', color: 'Luminous Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-luminous', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/02/products/de2f5d3490.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Luminous 1.75mm 3D Filament 1KG', color: 'Luminous Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-luminous', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/02/products/ff172fbfa6.jpg' },

  // PETG+HS (10 colors)
  { material: 'PETG', filamentLine: 'eSUN PETG+HS 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epetg-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/04/products/f0cf7fd928.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG+HS 1.75mm 3D Filament 1KG', color: 'Solid White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/epetg-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/04/products/c6e0cb19f7.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG+HS 1.75mm 3D Filament 1KG', color: 'Solid Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/epetg-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/04/products/02310b8bdf.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG+HS 1.75mm 3D Filament 1KG', color: 'Solid Silver', colorHex: '#C0C0C0', productUrl: 'https://esun3dstore.com/products/epetg-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/04/products/29b433e342.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG+HS 1.75mm 3D Filament 1KG', color: 'Fire Engine Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epetg-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/04/products/094ce85566.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG+HS 1.75mm 3D Filament 1KG', color: 'Solid Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epetg-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/04/products/3ecfd0c1f4.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG+HS 1.75mm 3D Filament 1KG', color: 'Solid Orange', colorHex: '#FFA500', productUrl: 'https://esun3dstore.com/products/epetg-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/04/products/8f0fd85416.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG+HS 1.75mm 3D Filament 1KG', color: 'Solid Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epetg-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/04/products/feb499b973.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG+HS 1.75mm 3D Filament 1KG', color: 'Solid Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/epetg-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/04/products/f4c2cabaee.jpg' },

  // PLA+HS (19 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/52d7ffe931.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Cold White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/23e5bfca4c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/eff28c793e.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/3bd56e33de.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Silver', colorHex: '#C0C0C0', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/3c3fdf2609.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Orange', colorHex: '#FFA500', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/a93fda9163.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Fire Engine Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/ca85c408dc.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/3ab949c69b.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/891503d73f.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/f9ddf55114.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/9b06ca99b8.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Pink', colorHex: '#FFC0CB', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/7823045047.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Peak Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/bd9dc31ea7.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Pine Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/109bd3458c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Brown', colorHex: '#8B4513', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/a623a7c12e.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Olive Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/2a322616b6.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Bone White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/7ff0d818fc.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Light Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/8dfdd52202.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+HS 1.75mm 3D Filament 1KG', color: 'Purple', colorHex: '#800080', productUrl: 'https://esun3dstore.com/products/epla-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/18/products/8434d7db71.jpg' },

  // PLA-Magic (4 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Magic 1.75mm 3D Filament 1KG', color: 'Dark Twinkling Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/d9a3fc2f4a.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Magic 1.75mm 3D Filament 1KG', color: 'Dark Twinkling Purple', colorHex: '#800080', productUrl: 'https://esun3dstore.com/products/epla-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/953d27a729.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Magic 1.75mm 3D Filament 1KG', color: 'Dark Twinkling Gold', colorHex: '#FFD700', productUrl: 'https://esun3dstore.com/products/epla-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/4e88a52b9b.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Magic 1.75mm 3D Filament 1KG', color: 'Dark Twinkling Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/58838c0b21.jpg' },

  // PLA+ Refilament (27 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/b28b14e8aa.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/bb5a4b0c71.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Cold White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/c1fb147ebe.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Bone White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/b985ac4f71.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Beige', colorHex: '#F5F5DC', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/c1d7fc5beb.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/857a7c68b8.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Silver', colorHex: '#C0C0C0', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/90fe918d75.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Brown', colorHex: '#8B4513', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/099dab9342.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Light Brown', colorHex: '#8B4513', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/11ef591e92.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/d357061d7c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Olive Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/e986ee4d18.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Pine Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/882b16ad0c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Peak Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/b897347c4a.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/44d9d7b516.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Light Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/38819c4ce8.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Dark Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/1a82037760.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Space Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/931e2f39f1.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/d1998f57b9.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Fire Engine Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/94813cf7e4.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Magenta', colorHex: '#FF00FF', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/fcfc2c6bb6.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Pink', colorHex: '#FFC0CB', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/9f475dcc16.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/fb4fbf91dc.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Orange', colorHex: '#FFA500', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/372071c630.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Gold', colorHex: '#FFD700', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/41192c7a3f.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Purple', colorHex: '#800080', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/089ec68d77.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'Very Peri', colorHex: '#6667AB', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/25ae315967.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ Refilament 1.75mm 3D Filament 1KG', color: 'eSPOOL+', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/pla-refilament', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/17/products/d50afdeac0.jpg' },

  // PLA-Silk Magic (22 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Gold+Red+Green', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/14db1923c3.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Bule+Orange+Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/2bf2b606e7.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Gold+Green+Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/50b84a4960.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Brone+Purple+Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/da49f8420c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Blue+Red+Purple', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/109b7e111c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Gold+Silver+Copper', colorHex: '#FFD700', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2511/12/products/35d4cde618.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Red+Yellow+Blue', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/272b25f9fc.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Red+Gold+Purple', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/38e352cae9.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Red+Black+Gold', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/762b14b922.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Red+Green+Blue', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/f36b91c3c2.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Gold+Silver', colorHex: '#FFD700', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/0076068e95.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Red+ Blue', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/98fdf2073f.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Green+Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/8d81a85c41.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Black+Gold', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/a3b5d68681.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Black+Red', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/74b14ccf84.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Black+Green', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/1cfee57ba4.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Black+Purple', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/e777c7e62b.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Red+Gold', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/95e19b7222.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Purple+Gold', colorHex: '#800080', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/df23e17127.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Red+Green', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/edcb9cd9af.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Magic 1.75mm 3D Filament 1KG', color: 'Blue+Silver', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-silk-magic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/a5600e34f8.jpg' },

  // ABS+HS (12 colors)
  { material: 'ABS', filamentLine: 'eSUN ABS+HS 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/eabs-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2502/06/products/295a30a564.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+HS 1.75mm 3D Filament 1KG', color: 'Cold White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/eabs-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2502/06/products/b2e64064a3.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+HS 1.75mm 3D Filament 1KG', color: 'Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/eabs-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2502/06/products/788cba891f.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+HS 1.75mm 3D Filament 1KG', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/eabs-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2502/06/products/d225dcaafb.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+HS 1.75mm 3D Filament 1KG', color: 'Sliver', colorHex: '#C0C0C0', productUrl: 'https://esun3dstore.com/products/eabs-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2502/06/products/58fd4fe490.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+HS 1.75mm 3D Filament 1KG', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://esun3dstore.com/products/eabs-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2502/06/products/e40f50e1d8.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+HS 1.75mm 3D Filament 1KG', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/eabs-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2502/06/products/09dd076fbc.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+HS 1.75mm 3D Filament 1KG', color: 'Fire Engine Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/eabs-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2502/06/products/061847e97c.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+HS 1.75mm 3D Filament 1KG', color: 'Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/eabs-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2502/06/products/42057b4a0b.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+HS 1.75mm 3D Filament 1KG', color: 'Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/eabs-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2502/06/products/e34c28a5a8.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+HS 1.75mm 3D Filament 1KG', color: 'Orange', colorHex: '#FFA500', productUrl: 'https://esun3dstore.com/products/eabs-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2502/06/products/57a7032f54.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS+HS 1.75mm 3D Filament 1KG', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/eabs-pro-hs', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2502/06/products/b4fbeb0220.jpg' },

  // PLA-ST (3 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-ST 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-st', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/ce34c8b73c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-ST 1.75mm 3D Filament 1KG', color: 'Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/epla-st', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/4f543614c9.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-ST 1.75mm 3D Filament 1KG', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://esun3dstore.com/products/epla-st', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/89d2f480df.jpg' },

  // PLA-Silk Rainbow (6 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Rainbow 1.75mm 3D Filament 1KG', color: 'Scorching Sun', colorHex: '#FF8C00', productUrl: 'https://esun3dstore.com/products/epla-silk-rainbow', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/06fa9053ee.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Rainbow 1.75mm 3D Filament 1KG', color: 'Morning Glory', colorHex: '#9ED2E6', productUrl: 'https://esun3dstore.com/products/epla-silk-rainbow', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/13da0a4d62.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Rainbow 1.75mm 3D Filament 1KG', color: 'Universe', colorHex: '#1B1464', productUrl: 'https://esun3dstore.com/products/epla-silk-rainbow', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/3f30f11c44.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Rainbow 1.75mm 3D Filament 1KG', color: 'Forest', colorHex: '#228B22', productUrl: 'https://esun3dstore.com/products/epla-silk-rainbow', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/45f797b07f.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Rainbow 1.75mm 3D Filament 1KG', color: 'Coral', colorHex: '#FF7F50', productUrl: 'https://esun3dstore.com/products/epla-silk-rainbow', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/20/products/98c47b267c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Rainbow 1.75mm 3D Filament 1KG', color: 'Rainbow', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-silk-rainbow', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/eb030d6fbc.jpg' },

  // PLA-LW (2 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-LW 1.75mm 3D Filament 1KG', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://esun3dstore.com/products/epla-lw', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/25/products/21ac18c230.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-LW 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-lw', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/25/products/618f948a11.jpg' },

  // PLA-Silk Candy (6 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Candy 1.75mm 3D Filament 1KG', color: 'Red+Gold+Blue', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-silk-candy', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/f65e35e213.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Candy 1.75mm 3D Filament 1KG', color: 'Gold+Blue+Green', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-silk-candy', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/755a03680f.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Candy 1.75mm 3D Filament 1KG', color: 'Silver+Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-silk-candy', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/a22b8f7d1f.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Candy 1.75mm 3D Filament 1KG', color: 'Red+Gold', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-silk-candy', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/b388994dfb.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Candy 1.75mm 3D Filament 1KG', color: 'Silver+Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-silk-candy', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/1a15f80a41.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Silk Candy 1.75mm 3D Filament 1KG', color: 'Blue+Green', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-silk-candy', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/d15177772c.jpg' },

  // PLA-Chameleon (5 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Chameleon 1.75mm 3D Filament 1KG', color: 'Galaxy Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-chameleon', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/9a0cb6976e.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Chameleon 1.75mm 3D Filament 1KG', color: 'Tech Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-chameleon', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/0a0c47a101.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Chameleon 1.75mm 3D Filament 1KG', color: 'Nebula Purple', colorHex: '#800080', productUrl: 'https://esun3dstore.com/products/epla-chameleon', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/8da7788927.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Chameleon 1.75mm 3D Filament 1KG', color: 'Polaris', colorHex: '#4682B4', productUrl: 'https://esun3dstore.com/products/epla-chameleon', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/5b02de05f4.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Chameleon 1.75mm 3D Filament 1KG', color: 'Raspberry Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-chameleon', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/ce53156a2b.jpg' },

  // PLA-Lite (9 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Lite 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-lite', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/070f6f8749.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Lite 1.75mm 3D Filament 1KG', color: 'Cold White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/epla-lite', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/8c5783aa3f.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Lite 1.75mm 3D Filament 1KG', color: 'Gray', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/epla-lite', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/df01d4b5ad.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Lite 1.75mm 3D Filament 1KG', color: 'Fire Engine Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-lite', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/f1ae6124e4.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Lite 1.75mm 3D Filament 1KG', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/epla-lite', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/749bd18664.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Lite 1.75mm 3D Filament 1KG', color: 'Periwinkle Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-lite', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/808343d38e.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Lite 1.75mm 3D Filament 1KG', color: 'Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-lite', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/bda491c373.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Lite 1.75mm 3D Filament 1KG', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/epla-lite', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/a07fb29fe8.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Lite 1.75mm 3D Filament 1KG', color: 'Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-lite', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/6329b2f83b.jpg' },

  // PETG-Basic (11 colors)
  { material: 'PETG', filamentLine: 'eSUN PETG-Basic 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/petg-basic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/16/products/84dcaa5568.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Basic 1.75mm 3D Filament 1KG', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/petg-basic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/16/products/bb6a26b336.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Basic 1.75mm 3D Filament 1KG', color: 'Clear', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/petg-basic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/16/products/976757fa5c.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Basic 1.75mm 3D Filament 1KG', color: 'Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/petg-basic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/16/products/29ea5955b3.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Basic 1.75mm 3D Filament 1KG', color: 'Silver', colorHex: '#C0C0C0', productUrl: 'https://esun3dstore.com/products/petg-basic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/16/products/4c939991b1.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Basic 1.75mm 3D Filament 1KG', color: 'Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/petg-basic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/16/products/e21437fea8.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Basic 1.75mm 3D Filament 1KG', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/petg-basic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/16/products/e9fbf81b44.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Basic 1.75mm 3D Filament 1KG', color: 'Translucent Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/petg-basic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/16/products/2b2171e4b1.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Basic 1.75mm 3D Filament 1KG', color: 'Translucent Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/petg-basic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/16/products/01aad22340.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Basic 1.75mm 3D Filament 1KG', color: 'Translucent Orange', colorHex: '#FFA500', productUrl: 'https://esun3dstore.com/products/petg-basic', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/16/products/97f0d30735.jpg' },

  // PA-CF (1 color - single variant)
  { material: 'PA', filamentLine: 'eSUN PA-CF 1.75mm 3D Filament 1KG', color: 'Default', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/epa-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/25/products/bc1296dcbd.jpg' },

  // PET (8 colors)
  { material: 'PET', filamentLine: 'eSUN PET 1.75mm 3D Filament 1KG', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://esun3dstore.com/products/pet', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/18/products/f51d3f0921.jpg' },
  { material: 'PET', filamentLine: 'eSUN PET 1.75mm 3D Filament 1KG', color: 'Solid Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/pet', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/18/products/ea48caf642.jpg' },
  { material: 'PET', filamentLine: 'eSUN PET 1.75mm 3D Filament 1KG', color: 'Solid White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/pet', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/18/products/d5a2886013.jpg' },
  { material: 'PET', filamentLine: 'eSUN PET 1.75mm 3D Filament 1KG', color: 'Solid Silver', colorHex: '#C0C0C0', productUrl: 'https://esun3dstore.com/products/pet', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/18/products/9e12b9c9c1.jpg' },
  { material: 'PET', filamentLine: 'eSUN PET 1.75mm 3D Filament 1KG', color: 'Solid Orange', colorHex: '#FFA500', productUrl: 'https://esun3dstore.com/products/pet', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/18/products/d5e5b76da2.jpg' },
  { material: 'PET', filamentLine: 'eSUN PET 1.75mm 3D Filament 1KG', color: 'Transparent Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/pet', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/18/products/9d13a0d432.jpg' },
  { material: 'PET', filamentLine: 'eSUN PET 1.75mm 3D Filament 1KG', color: 'Transparent Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/pet', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/18/products/f15ed8cfed.jpg' },
  { material: 'PET', filamentLine: 'eSUN PET 1.75mm 3D Filament 1KG', color: 'Transparent Orange', colorHex: '#FFA500', productUrl: 'https://esun3dstore.com/products/pet', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/18/products/8e7714909f.jpg' },

  // PLA-Marble (1 color - single variant)
  { material: 'PLA', filamentLine: 'eSUN PLA-Marble 1.7mm 3D Filament 1KG', color: 'Default', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/epla-marble', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/25/products/0b76d2d7e3.jpg' },

  // PLA-CF (5 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-CF 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/epla-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/21/products/4cb77f6ce1.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-CF 1.75mm 3D Filament 1KG', color: 'Brown', colorHex: '#8B4513', productUrl: 'https://esun3dstore.com/products/epla-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/21/products/a35f64cffc.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-CF 1.75mm 3D Filament 1KG', color: 'Purple', colorHex: '#800080', productUrl: 'https://esun3dstore.com/products/epla-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/21/products/95e73a05c3.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-CF 1.75mm 3D Filament 1KG', color: 'Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/epla-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/21/products/d212168fa2.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-CF 1.75mm 3D Filament 1KG', color: 'Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/epla-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/21/products/a8eff83d88.jpg' },

  // PETG-Matte (10 colors)
  { material: 'PETG', filamentLine: 'eSUN PETG-Matte 1.75mm 3D Filament 1KG', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/petg-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/30/products/0bd609d5a9.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Matte 1.75mm 3D Filament 1KG', color: 'Light Khaki', colorHex: '#F0E68C', productUrl: 'https://esun3dstore.com/products/petg-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/30/products/2bb234a950.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Matte 1.75mm 3D Filament 1KG', color: 'Peach Pink', colorHex: '#FFC0CB', productUrl: 'https://esun3dstore.com/products/petg-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/30/products/495c19d790.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Matte 1.75mm 3D Filament 1KG', color: 'Almond Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/petg-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/30/products/57c27e6f3c.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Matte 1.75mm 3D Filament 1KG', color: 'Apricot', colorHex: '#FBCEB1', productUrl: 'https://esun3dstore.com/products/petg-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/30/products/7df6568e8e.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Matte 1.75mm 3D Filament 1KG', color: 'Dark Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/petg-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/30/products/a1488272a3.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Matte 1.75mm 3D Filament 1KG', color: 'Light Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/petg-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/30/products/b97a42b3b4.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Matte 1.75mm 3D Filament 1KG', color: 'Lilac', colorHex: '#C8A2C8', productUrl: 'https://esun3dstore.com/products/petg-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/30/products/de51efa19a.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Matte 1.75mm 3D Filament 1KG', color: 'Mint Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/petg-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/30/products/5ad85656ed.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-Matte 1.75mm 3D Filament 1KG', color: 'Matcha Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/petg-matte', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2510/30/products/1fd0d78c4c.jpg' },

  // PETG-CF (5 colors)
  { material: 'PETG', filamentLine: 'eSUN PETG-CF 1.75mm 3D Filament 1KG', color: 'Dark Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/petg-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/29/products/c634dc1504.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-CF 1.75mm 3D Filament 1KG', color: 'Antique Brass', colorHex: '#CD9575', productUrl: 'https://esun3dstore.com/products/petg-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/29/products/ed758d2354.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-CF 1.75mm 3D Filament 1KG', color: 'Black Red', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/petg-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/29/products/084ab0d855.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-CF 1.75mm 3D Filament 1KG', color: 'Blackish Green', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/petg-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/29/products/be1de9185d.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG-CF 1.75mm 3D Filament 1KG', color: 'Deep Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/petg-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2411/29/products/0c6ac973b2.jpg' },

  // TPE-83A (2 colors)
  { material: 'TPE', filamentLine: 'eSUN TPE-83A 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/tpe-83a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/459a5a671d.jpg' },
  { material: 'TPE', filamentLine: 'eSUN TPE-83A 1.75mm 3D Filament 1KG', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/tpe-83a', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/9ae3ead1c0.jpg' },

  // PLA-Luminous Rainbow (1 color - single variant)
  { material: 'PLA', filamentLine: 'eSUN PLA-Luminous Rainbow 1.75mm 3D Filament 1KG', color: 'Default', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/epla-luminous-rainbow', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/a3fcca4a82.jpg' },

  // PLA-Rock (8 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Rock 1.75mm 3D Filament 1KG', color: 'Blueschist', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/pla-rock', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/28/products/4eeb8a452e.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Rock 1.75mm 3D Filament 1KG', color: 'Hornfels', colorHex: '#4A4A4A', productUrl: 'https://esun3dstore.com/products/pla-rock', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/28/products/ff6d33a2b0.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Rock 1.75mm 3D Filament 1KG', color: 'Limestone', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/pla-rock', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/28/products/42ee67ce82.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Rock 1.75mm 3D Filament 1KG', color: 'Pegmatite', colorHex: '#E8E8E8', productUrl: 'https://esun3dstore.com/products/pla-rock', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/28/products/1a7e9a1add.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Rock 1.75mm 3D Filament 1KG', color: 'Quartzite', colorHex: '#D4D4D4', productUrl: 'https://esun3dstore.com/products/pla-rock', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/28/products/8556a30083.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Rock 1.75mm 3D Filament 1KG', color: 'Tiger-Porphyry', colorHex: '#C88141', productUrl: 'https://esun3dstore.com/products/pla-rock', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2508/28/products/87446e16d7.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Rock 1.75mm 3D Filament 1KG', color: 'Granite', colorHex: '#837E7C', productUrl: 'https://esun3dstore.com/products/pla-rock', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/3fae5071f3.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Rock 1.75mm 3D Filament 1KG', color: 'Sandstone', colorHex: '#786D5F', productUrl: 'https://esun3dstore.com/products/pla-rock', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/7e98a92750.jpg' },

  // ABS-CF (5 colors)
  { material: 'ABS', filamentLine: 'eSUN ABS-CF 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/abs-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/bb68245a37.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS-CF 1.75mm 3D Filament 1KG', color: 'Dark Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/abs-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/070a5ffeb2.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS-CF 1.75mm 3D Filament 1KG', color: 'Dark Purple', colorHex: '#800080', productUrl: 'https://esun3dstore.com/products/abs-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/e541c49058.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS-CF 1.75mm 3D Filament 1KG', color: 'Dark Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/abs-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/82e75250a3.jpg' },
  { material: 'ABS', filamentLine: 'eSUN ABS-CF 1.75mm 3D Filament 1KG', color: 'Dark Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/abs-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2504/17/products/ce7a12ee79.jpg' },

  // TPU-LW (3 colors)
  { material: 'TPU', filamentLine: 'eSUN TPU-LW 1.75mm 3D Filament 0.75KG', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/tpu-lw', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/03/products/b824741896.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-LW 1.75mm 3D Filament 0.75KG', color: 'Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/tpu-lw', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/07/products/808183e350.jpg' },
  { material: 'TPU', filamentLine: 'eSUN TPU-LW 1.75mm 3D Filament 0.75KG', color: 'Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/tpu-lw', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2501/07/products/3aa916b0be.jpg' },

  // PLA+ CMYK Bundle (5 colors - skip promotional)
  
  // PLA-Wood (4 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Wood 1.75mm 3D Filament 1KG', color: 'Plain Wood', colorHex: '#DEB887', productUrl: 'https://esun3dstore.com/products/pla-wood', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/fce0f52c73.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Wood 1.75mm 3D Filament 1KG', color: 'Birch', colorHex: '#F5DEB3', productUrl: 'https://esun3dstore.com/products/pla-wood', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/52ffcf11a1.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Wood 1.75mm 3D Filament 1KG', color: 'Aspen', colorHex: '#F5F5DC', productUrl: 'https://esun3dstore.com/products/pla-wood', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/7d86c77de4.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Wood 1.75mm 3D Filament 1KG', color: 'Walnut', colorHex: '#5D432C', productUrl: 'https://esun3dstore.com/products/pla-wood', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2512/30/products/b513eb60c6.jpg' },

  // PLA-UV Color Change (7 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-UV Color Change 1.75mm 3D Filament 1KG', color: 'UV Change Orange', colorHex: '#FFA500', productUrl: 'https://esun3dstore.com/products/pla-uv-color-change', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2506/23/products/6077eac416.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-UV Color Change 1.75mm 3D Filament 1KG', color: 'UV Change Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/pla-uv-color-change', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2506/23/products/ac9ecdec6c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-UV Color Change 1.75mm 3D Filament 1KG', color: 'UV Change Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/pla-uv-color-change', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2506/23/products/4e81786975.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-UV Color Change 1.75mm 3D Filament 1KG', color: 'UV Change Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/pla-uv-color-change', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2506/23/products/7379258134.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-UV Color Change 1.75mm 3D Filament 1KG', color: 'UV Change Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/pla-uv-color-change', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2506/23/products/4c7a2788bd.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-UV Color Change 1.75mm 3D Filament 1KG', color: 'UV Change Purple', colorHex: '#800080', productUrl: 'https://esun3dstore.com/products/pla-uv-color-change', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2506/23/products/e2f3e56b43.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-UV Color Change 1.75mm 3D Filament 1KG', color: 'UV Change Fuchsia', colorHex: '#FF00FF', productUrl: 'https://esun3dstore.com/products/pla-uv-color-change', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2506/23/products/c49339e4a7.jpg' },

  // PLA-Stars (1 color - single variant)
  { material: 'PLA', filamentLine: 'eSUN PLA-Stars 1.75mm 3D Filament 1KG', color: 'Default', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/estars-pla', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/25/products/648816255c.jpg' },

  // PLA-Metal (2 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA-Metal 1.75mm 3D Filament 1KG', color: 'Bronze', colorHex: '#CD7F32', productUrl: 'https://esun3dstore.com/products/epla-metal', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/41b3235a40.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA-Metal 1.75mm 3D Filament 1KG', color: 'Gold', colorHex: '#FFD700', productUrl: 'https://esun3dstore.com/products/epla-metal', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/0e14eef9c1.jpg' },

  // PA (1 color - single variant)
  { material: 'PA', filamentLine: 'eSUN PA 1.75mm 3D Filament 1KG', color: 'Default', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/epa', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/24/products/df6f75fbaa.jpg' },

  // PA12-CF (1 color - single variant)
  { material: 'PA', filamentLine: 'eSUN PA12-CF 1.75mm 3D Filament 1KG', color: 'Default', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/epa12-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2412/25/products/400cc5519d.jpg' },

  // ePAHT-CF (1 color - single variant)
  { material: 'PA', filamentLine: 'eSUN ePAHT-CF 1.75mm 3D Filament 0.75KG', color: 'Default', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/epaht-cf', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/13/products/05867155e6.jpg' },

  // PLA+ (46 colors)
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Black', colorHex: '#25282A', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Cold White', colorHex: '#F8F8FF', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Milky White', colorHex: '#D9E1E2', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Bone White', colorHex: '#D1C1A8', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Beige', colorHex: '#F1C6A6', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Light Khaki', colorHex: '#D7D9D2', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Grey', colorHex: '#606E81', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Silver', colorHex: '#9D9C9E', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Fire Engine Red', colorHex: '#A50034', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Red', colorHex: '#DC3513', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'RGB Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Magenta', colorHex: '#DF1995', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Green', colorHex: '#1C4538', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Olive Green', colorHex: '#4F5C43', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Pine Green', colorHex: '#0D5D3F', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Peak Green', colorHex: '#8EDD65', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'RGB Green', colorHex: '#2CC84D', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Mint Green', colorHex: '#A2E4B8', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Matcha Green', colorHex: '#A9C47F', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Grass Green', colorHex: '#008522', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Holly Green', colorHex: '#00491E', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Jade Green', colorHex: '#00C389', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Mustard Green', colorHex: '#BFCC80', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Blue', colorHex: '#00358E', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'RGB Blue', colorHex: '#0032A0', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Dark blue', colorHex: '#00263A', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Light Blue', colorHex: '#28B5C7', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Space Blue', colorHex: '#41B6E6', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Soft Blue', colorHex: '#77C5D5', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Periwinkle Blue', colorHex: '#6068B2', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Haze Blue', colorHex: '#6191B4', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Aqua', colorHex: '#0DA4AF', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Brown', colorHex: '#785135', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Light Brown', colorHex: '#A8714E', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Pink', colorHex: '#F65C87', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Peach Pink', colorHex: '#F1BDC8', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Soft Pink', colorHex: '#E9A2B2', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Yellow', colorHex: '#FEDD00', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Almond Yellow', colorHex: '#F1EB9C', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Orange', colorHex: '#FF6720', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Coral Orange', colorHex: '#FA6E36', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Apricot', colorHex: '#FEAD77', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Gold', colorHex: '#D19000', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Lilac', colorHex: '#D7B9E4', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },
  { material: 'PLA', filamentLine: 'eSUN PLA+ 1.75mm 3D Filament 1KG', color: 'Purple', colorHex: '#500878', productUrl: 'https://esun3dstore.com/products/pla-pro', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2409/14/products/a4274f7c3c.jpg' },

  // PETG (16 colors)
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Solid Black', colorHex: '#000000', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/e48a384c02.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Solid White', colorHex: '#FFFFFF', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/b612eb63e3.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Solid Grey', colorHex: '#808080', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/4b3368131b.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Solid Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/f8daf81b2a.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Solid Gold', colorHex: '#FFD700', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/69d83bbde0.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Solid Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/f7d1746ef6.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Solid Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/efe8aa48a5.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Solid Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/e8d74d6f85.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Solid Silver', colorHex: '#C0C0C0', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/cf3720371b.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Solid Purple', colorHex: '#800080', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/5dc3ed88fa.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Fire Engine Red', colorHex: '#FF0000', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/9c2fd57a29.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Translucent Green', colorHex: '#00FF00', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/8ef444180e.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Natural', colorHex: '#F5F5DC', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/ac64461319.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Translucent Blue', colorHex: '#0000FF', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/0f9797a552.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Translucent Yellow', colorHex: '#FFFF00', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/470631ad34.jpg' },
  { material: 'PETG', filamentLine: 'eSUN PETG 1.75mm 3D Filament 1KG', color: 'Translucent Magenta', colorHex: '#FF00FF', productUrl: 'https://esun3dstore.com/products/petg', imageUrl: 'https://ueeshop.ly200-cdn.com/u_file/UPBB/UPBB609/2503/20/products/151d546b48.jpg' },
];

// Default prices by product line (USD)
export const ESUN_DEFAULT_PRICES: Record<string, number> = {
  'PLA-Basic': 17.99,
  'PLA-Matte': 19.99,
  'PLA-Silk': 19.99,
  'PLA-Silk Metal': 22.99,
  'PLA-Silk Magic': 24.99,
  'PLA-Silk Candy': 24.99,
  'PLA-Silk Rainbow': 22.99,
  'PLA-Luminous': 19.99,
  'PLA-Luminous Rainbow': 22.99,
  'PLA+': 22.99,
  'PLA+HS': 23.99,
  'PLA+ Refilament': 19.99,
  'PLA-LW': 29.99,
  'PLA-ST': 24.99,
  'PLA-CF': 34.99,
  'PLA-Magic': 22.99,
  'PLA-Chameleon': 24.99,
  'PLA-Lite': 16.99,
  'PLA-Rock': 24.99,
  'PLA-Wood': 24.99,
  'PLA-Metal': 24.99,
  'PLA-Marble': 22.99,
  'PLA-UV Color Change': 24.99,
  'PLA-Stars': 22.99,
  'PETG': 22.99,
  'PETG-Basic': 19.99,
  'PETG+HS': 24.99,
  'PETG-Matte': 22.99,
  'PETG-CF': 39.99,
  'ABS+': 22.99,
  'ABS+HS': 24.99,
  'ABS-CF': 39.99,
  'ASA+': 26.99,
  'TPU-95A': 29.99,
  'TPU-LW': 34.99,
  'TPE-83A': 29.99,
  'PA': 44.99,
  'PA-CF': 54.99,
  'PA12-CF': 59.99,
  'ePAHT-CF': 64.99,
  'PET': 24.99,
};

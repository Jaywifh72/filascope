/**
 * TreeD Filaments Seed Data
 * 
 * CSV-seeded sync architecture: ~210 color variants across ~47 product lines
 * Italian engineering filament manufacturer with extensive polymer range.
 * 
 * Key characteristics:
 * - Engineering focus: PEEK, PPS, PA-CF, PC-ABS, PP-GF
 * - Named product lines: Ecogenius, Shogun, Carbonio, Flexmark, etc.
 * - EUR pricing (Italy-based) - converted to USD at sync time
 * - 1.75mm only (2.85mm filtered out)
 * - Custom platform (not Shopify) - requires Firecrawl HTML scraping for live prices
 * 
 * Note: This file is the PRIMARY data source. Live scraping only enriches prices/availability.
 */

// ============================================================================
// COLOR-TO-HEX MAPPING
// ============================================================================

/**
 * TreeD-specific color-to-hex mapping.
 * Includes Italian color names and TreeD-specific color naming (e.g., "BLACK HOLE", "RED RACE").
 */
export const TREED_COLOR_HEX_MAP: Record<string, string> = {
  // TreeD branded color names
  'osso': 'F5F5DC',                  // Bone/Ivory (Italian)
  'black hole': '1A1A1A',            // Deep black
  'red race': 'DC2626',              // Racing red
  'neptune blue': '2563EB',          // Deep blue
  'yellow treed': 'FFD700',          // TreeD brand yellow
  'yellow lemon': 'FFF44F',          // Bright lemon yellow
  'anthracite grey': '383838',       // Dark charcoal
  'industrial grey': '6B6B6B',       // Medium industrial gray
  'green army': '4B5320',            // Military olive
  'oxford green': '002147',          // Dark Oxford blue-green
  'apple green': '8DB600',           // Bright apple green
  'red wine': '722F37',              // Burgundy/Wine red
  'carbon black': '1C1C1C',          // Carbon fiber black
  'carbon red': '4A1010',            // Dark carbon with red tint
  'carbon green': '104A10',          // Dark carbon with green tint
  'carbon blue': '10104A',           // Dark carbon with blue tint
  'grey cement': '9E9E9E',           // Cement/concrete gray
  'slate grey': '708090',            // Slate gray
  'salmon orange': 'FA8072',         // Salmon pink-orange
  
  // Standard colors
  'white': 'FFFFFF',
  'natural': 'F5E6D3',
  'black': '1A1A1A',
  'violet': '8B5CF6',
  'alluminium': 'A8A8A8',            // Italian spelling of aluminum
  'aluminium': 'A8A8A8',
  'aluminum': 'A8A8A8',
  'bronze': 'CD7F32',
  'aquamarine': '7FFFD4',
  'orange': 'FF6B00',
  'brown': '8B4513',
  'ruby': 'E0115F',
  'azul': '0047AB',                  // Spanish/Italian blue
  'chlorophyll green': '4AFF00',     // Bright chlorophyll
  'sand': 'C2B280',
  'white marble': 'F0F0F0',          // Marble white with slight texture
  
  // Transparent/translucent
  'seetrought': 'E8E8E8',            // Italian misspelling of "see-through"
  'see-through': 'E8E8E8',
  'transparent': 'E8E8E8',
  
  // Italian color names (fallback)
  'nero': '1A1A1A',
  'bianco': 'FFFFFF',
  'naturale': 'F5E6D3',
  'trasparente': 'E8E8E8',
  'grigio': '808080',
  'rosso': 'DC2626',
  'blu': '2563EB',
  'verde': '16A34A',
  'giallo': 'EAB308',
  'arancione': 'EA580C',
  'viola': '9333EA',
  'marrone': '78350F',
};

// ============================================================================
// SEED DATA INTERFACE
// ============================================================================

export interface TreeDSeedProduct {
  name: string;             // Product line name (e.g., "PLA Ecogenius")
  sku: string;              // SKU code (e.g., "PLAECO")
  material: string;         // CSV material (e.g., "PLA", "PA", "PC")
  color: string;            // Color name (e.g., "OSSO", "BLACK HOLE")
  colorHex: string;         // Hex code (resolved from TREED_COLOR_HEX_MAP)
  productUrl: string;       // Full product URL
  imageUrl: string;         // CloudFront image URL
  productLineId: string;    // Generated product line ID
  weight: number;           // Weight in grams (default 1000)
  basePrice: number;        // EUR base price (converted to USD at sync time)
}

// ============================================================================
// SEED DATA - 210 color variants
// ============================================================================

export const TREED_SEED_DATA: TreeDSeedProduct[] = [
  // PLA Ecogenius (20 colors)
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'OSSO', colorHex: 'F5F5DC', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'RED RACE', colorHex: 'DC2626', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'NEPTUNE BLUE', colorHex: '2563EB', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'NATURAL', colorHex: 'F5E6D3', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'YELLOW TREED', colorHex: 'FFD700', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'YELLOW LEMON', colorHex: 'FFF44F', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'VIOLET', colorHex: '8B5CF6', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'ALLUMINIUM', colorHex: 'A8A8A8', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'BRONZE', colorHex: 'CD7F32', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'ANTHRACITE GREY', colorHex: '383838', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'GREEN ARMY', colorHex: '4B5320', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'AQUAMARINE', colorHex: '7FFFD4', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'ORANGE', colorHex: 'FF6B00', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'RED WINE', colorHex: '722F37', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'BROWN', colorHex: '8B4513', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'Industrial Grey', colorHex: '6B6B6B', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'APPLE GREEN', colorHex: '8DB600', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },
  { name: 'PLA Ecogenius', sku: 'PLAECO', material: 'PLA', color: 'Oxford green', colorHex: '002147', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAECO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaecogenius.png', productLineId: 'treed__pla__ecogenius', weight: 1000, basePrice: 29.90 },

  // PLA Fusion (8 colors)
  { name: 'PLA Fusion', sku: 'PLAFUSI', material: 'PLA', color: 'Industrial Grey', colorHex: '6B6B6B', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFUSI', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafusion.png', productLineId: 'treed__pla__fusion', weight: 1000, basePrice: 32.90 },
  { name: 'PLA Fusion', sku: 'PLAFUSI', material: 'PLA', color: 'ALLUMINIUM', colorHex: 'A8A8A8', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFUSI', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafusion.png', productLineId: 'treed__pla__fusion', weight: 1000, basePrice: 32.90 },
  { name: 'PLA Fusion', sku: 'PLAFUSI', material: 'PLA', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFUSI', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafusion.png', productLineId: 'treed__pla__fusion', weight: 1000, basePrice: 32.90 },
  { name: 'PLA Fusion', sku: 'PLAFUSI', material: 'PLA', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFUSI', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafusion.png', productLineId: 'treed__pla__fusion', weight: 1000, basePrice: 32.90 },
  { name: 'PLA Fusion', sku: 'PLAFUSI', material: 'PLA', color: 'NATURAL', colorHex: 'F5E6D3', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFUSI', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafusion.png', productLineId: 'treed__pla__fusion', weight: 1000, basePrice: 32.90 },
  { name: 'PLA Fusion', sku: 'PLAFUSI', material: 'PLA', color: 'RED RACE', colorHex: 'DC2626', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFUSI', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafusion.png', productLineId: 'treed__pla__fusion', weight: 1000, basePrice: 32.90 },
  { name: 'PLA Fusion', sku: 'PLAFUSI', material: 'PLA', color: 'NEPTUNE BLUE', colorHex: '2563EB', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFUSI', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafusion.png', productLineId: 'treed__pla__fusion', weight: 1000, basePrice: 32.90 },
  { name: 'PLA Fusion', sku: 'PLAFUSI', material: 'PLA', color: 'YELLOW TREED', colorHex: 'FFD700', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFUSI', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafusion.png', productLineId: 'treed__pla__fusion', weight: 1000, basePrice: 32.90 },
  { name: 'PLA Fusion', sku: 'PLAFUSI', material: 'PLA', color: 'YELLOW LEMON', colorHex: 'FFF44F', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFUSI', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafusion.png', productLineId: 'treed__pla__fusion', weight: 1000, basePrice: 32.90 },
  { name: 'PLA Fusion', sku: 'PLAFUSI', material: 'PLA', color: 'VIOLET', colorHex: '8B5CF6', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFUSI', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafusion.png', productLineId: 'treed__pla__fusion', weight: 1000, basePrice: 32.90 },
  { name: 'PLA Fusion', sku: 'PLAFUSI', material: 'PLA', color: 'APPLE GREEN', colorHex: '8DB600', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFUSI', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafusion.png', productLineId: 'treed__pla__fusion', weight: 1000, basePrice: 32.90 },

  // PLA Gonzales (18 colors)
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'NEPTUNE BLUE', colorHex: '2563EB', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'RED RACE', colorHex: 'DC2626', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'YELLOW TREED', colorHex: 'FFD700', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'YELLOW LEMON', colorHex: 'FFF44F', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'VIOLET', colorHex: '8B5CF6', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'ALLUMINIUM', colorHex: 'A8A8A8', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'BRONZE', colorHex: 'CD7F32', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'ANTHRACITE GREY', colorHex: '383838', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'GREEN ARMY', colorHex: '4B5320', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'AQUAMARINE', colorHex: '7FFFD4', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'ORANGE', colorHex: 'FF6B00', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'RED WINE', colorHex: '722F37', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'BROWN', colorHex: '8B4513', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'Industrial Grey', colorHex: '6B6B6B', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'APPLE GREEN', colorHex: '8DB600', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Gonzales', sku: 'PLAGONZ', material: 'PLA', color: 'Oxford green', colorHex: '002147', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAGONZ', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplagonzales.png', productLineId: 'treed__pla__gonzales', weight: 1000, basePrice: 34.90 },

  // PLA Levigo (1 color)
  { name: 'PLA Levigo', sku: 'PLALEV', material: 'PLA', color: 'NATURAL', colorHex: 'F5E6D3', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLALEV', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplalevigo.png', productLineId: 'treed__pla__levigo', weight: 1000, basePrice: 34.90 },

  // PLA Shineless (2 colors) - Matte finish
  { name: 'PLA Shineless', sku: 'PLASHINE', material: 'PLA', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLASHINE', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplashineless.png', productLineId: 'treed__pla-matte__shineless', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Shineless', sku: 'PLASHINE', material: 'PLA', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLASHINE', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplashineless.png', productLineId: 'treed__pla-matte__shineless', weight: 1000, basePrice: 34.90 },

  // PLA Shogun (1 color)
  { name: 'PLA Shogun', sku: 'PLASHOG', material: 'PLA', color: 'NATURAL', colorHex: 'F5E6D3', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLASHOG', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplashogun.png', productLineId: 'treed__pla__shogun', weight: 1000, basePrice: 32.90 },

  // PLA Fast Forward (18 colors) - High-speed
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'RED RACE', colorHex: 'DC2626', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'NEPTUNE BLUE', colorHex: '2563EB', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'YELLOW TREED', colorHex: 'FFD700', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'YELLOW LEMON', colorHex: 'FFF44F', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'VIOLET', colorHex: '8B5CF6', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'ALLUMINIUM', colorHex: 'A8A8A8', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'BRONZE', colorHex: 'CD7F32', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'ANTHRACITE GREY', colorHex: '383838', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'GREEN ARMY', colorHex: '4B5320', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'AQUAMARINE', colorHex: '7FFFD4', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'ORANGE', colorHex: 'FF6B00', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'RED WINE', colorHex: '722F37', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'BROWN', colorHex: '8B4513', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'Industrial Grey', colorHex: '6B6B6B', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'APPLE GREEN', colorHex: '8DB600', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'PLA Fast Forward', sku: 'PLAFF', material: 'PLA', color: 'Oxford green', colorHex: '002147', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplafastforward.png', productLineId: 'treed__pla-hs__fast-forward', weight: 1000, basePrice: 34.90 },

  // PLA XRay (1 color) - Translucent
  { name: 'PLA XRay', sku: 'PLAXR', material: 'PLA', color: 'WHITE MARBLE', colorHex: 'F0F0F0', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAXR', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplaxray.png', productLineId: 'treed__pla__xray', weight: 1000, basePrice: 34.90 },

  // PLA Kyotoflex (15 colors) - Flexible PLA
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'CHLOROPHYLL GREEN', colorHex: '4AFF00', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'YELLOW TREED', colorHex: 'FFD700', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'YELLOW LEMON', colorHex: 'FFF44F', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'VIOLET', colorHex: '8B5CF6', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'ALLUMINIUM', colorHex: 'A8A8A8', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'BRONZE', colorHex: 'CD7F32', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'ANTHRACITE GREY', colorHex: '383838', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'GREEN ARMY', colorHex: '4B5320', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'AQUAMARINE', colorHex: '7FFFD4', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'ORANGE', colorHex: 'FF6B00', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'RED WINE', colorHex: '722F37', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'BROWN', colorHex: '8B4513', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'Industrial Grey', colorHex: '6B6B6B', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'APPLE GREEN', colorHex: '8DB600', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },
  { name: 'PLA Kyotoflex', sku: 'KYO', material: 'PLA', color: 'Oxford green', colorHex: '002147', productUrl: 'https://treedfilaments.com/shop/product/?sku=KYO', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplakyotoflex.png', productLineId: 'treed__pla-flex__kyotoflex', weight: 1000, basePrice: 39.90 },

  // PLA High Temperature (2 colors)
  { name: 'PLA High Temperature', sku: 'PLAHT', material: 'PLA', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAHT', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplahightemperature.png', productLineId: 'treed__pla-ht__high-temperature', weight: 1000, basePrice: 39.90 },
  { name: 'PLA High Temperature', sku: 'PLAHT', material: 'PLA', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=PLAHT', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedplahightemperature.png', productLineId: 'treed__pla-ht__high-temperature', weight: 1000, basePrice: 39.90 },

  // HIPS Decorative Lines
  { name: 'Monumental', sku: 'MONU', material: 'HIPS', color: 'WHITE MARBLE', colorHex: 'F0F0F0', productUrl: 'https://treedfilaments.com/shop/product/?sku=MONU', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedmonumental.png', productLineId: 'treed__hips__monumental', weight: 1000, basePrice: 29.90 },
  { name: 'Sandy', sku: 'SAND', material: 'HIPS', color: 'SAND', colorHex: 'C2B280', productUrl: 'https://treedfilaments.com/shop/product/?sku=SAND', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedsandy.png', productLineId: 'treed__hips__sandy', weight: 1000, basePrice: 29.90 },
  { name: 'Clay', sku: 'CLAY', material: 'HIPS', color: 'SALMON ORANGE', colorHex: 'FA8072', productUrl: 'https://treedfilaments.com/shop/product/?sku=CLAY', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedclay.png', productLineId: 'treed__hips__clay', weight: 1000, basePrice: 29.90 },
  { name: 'Dark Stone', sku: 'DARKST', material: 'HIPS', color: 'SLATE GREY', colorHex: '708090', productUrl: 'https://treedfilaments.com/shop/product/?sku=DARKST', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treeddarkstone.png', productLineId: 'treed__hips__dark-stone', weight: 1000, basePrice: 29.90 },
  { name: 'Heritage Brick', sku: 'HERBR', material: 'HIPS', color: 'BROWN', colorHex: '8B4513', productUrl: 'https://treedfilaments.com/shop/product/?sku=HERBR', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedheritagebrick.png', productLineId: 'treed__hips__heritage-brick', weight: 1000, basePrice: 29.90 },
  { name: 'Caementum', sku: 'CAEM', material: 'HIPS', color: 'GREY CEMENT', colorHex: '9E9E9E', productUrl: 'https://treedfilaments.com/shop/product/?sku=CAEM', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedcaementum.png', productLineId: 'treed__hips__caementum', weight: 1000, basePrice: 29.90 },
  { name: 'HIPS Stiron', sku: 'HIPS', material: 'HIPS', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=HIPS', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedhipsstiron.png', productLineId: 'treed__hips__stiron', weight: 1000, basePrice: 24.90 },
  { name: 'HIPS Stiron', sku: 'HIPS', material: 'HIPS', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=HIPS', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedhipsstiron.png', productLineId: 'treed__hips__stiron', weight: 1000, basePrice: 24.90 },

  // ASA UV-resistant Lines
  { name: 'Monumental Evo', sku: 'MONEV', material: 'ASA', color: 'WHITE MARBLE', colorHex: 'F0F0F0', productUrl: 'https://treedfilaments.com/shop/product/?sku=MONEV', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedmonumentalevo.png', productLineId: 'treed__asa__monumental-evo', weight: 1000, basePrice: 39.90 },
  { name: 'Clay Evo', sku: 'CLAEV', material: 'ASA', color: 'SALMON ORANGE', colorHex: 'FA8072', productUrl: 'https://treedfilaments.com/shop/product/?sku=CLAEV', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedclayevo.png', productLineId: 'treed__asa__clay-evo', weight: 1000, basePrice: 39.90 },
  { name: 'ASA Uv729', sku: 'ASA', material: 'ASA', color: 'NATURAL', colorHex: 'F5E6D3', productUrl: 'https://treedfilaments.com/shop/product/?sku=ASA', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedasauv729.png', productLineId: 'treed__asa__uv729', weight: 1000, basePrice: 34.90 },
  { name: 'ASA Uv729', sku: 'ASA', material: 'ASA', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=ASA', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedasauv729.png', productLineId: 'treed__asa__uv729', weight: 1000, basePrice: 34.90 },
  { name: 'ASA Uv729', sku: 'ASA', material: 'ASA', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=ASA', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedasauv729.png', productLineId: 'treed__asa__uv729', weight: 1000, basePrice: 34.90 },

  // ABS Lines
  { name: 'ABS T-MAT', sku: 'ABST', material: 'ABS', color: 'RED RACE', colorHex: 'DC2626', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABST', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabst-mat.png', productLineId: 'treed__abs__t-mat', weight: 1000, basePrice: 29.90 },
  { name: 'ABS T-MAT', sku: 'ABST', material: 'ABS', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABST', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabst-mat.png', productLineId: 'treed__abs__t-mat', weight: 1000, basePrice: 29.90 },
  { name: 'ABS T-MAT', sku: 'ABST', material: 'ABS', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABST', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabst-mat.png', productLineId: 'treed__abs__t-mat', weight: 1000, basePrice: 29.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'NATURAL', colorHex: 'F5E6D3', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'NEPTUNE BLUE', colorHex: '2563EB', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'RED RACE', colorHex: 'DC2626', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'Industrial Grey', colorHex: '6B6B6B', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'YELLOW TREED', colorHex: 'FFD700', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'YELLOW LEMON', colorHex: 'FFF44F', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'VIOLET', colorHex: '8B5CF6', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'ALLUMINIUM', colorHex: 'A8A8A8', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'BRONZE', colorHex: 'CD7F32', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'ANTHRACITE GREY', colorHex: '383838', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'GREEN ARMY', colorHex: '4B5320', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'AQUAMARINE', colorHex: '7FFFD4', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'ORANGE', colorHex: 'FF6B00', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'RED WINE', colorHex: '722F37', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'BROWN', colorHex: '8B4513', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Performance', sku: 'ABSP', material: 'ABS', color: 'APPLE GREEN', colorHex: '8DB600', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSP', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsperformance.png', productLineId: 'treed__abs__performance', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Zx', sku: 'ABSZX', material: 'ABS', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSZX', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabszx.png', productLineId: 'treed__abs__zx', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Zx', sku: 'ABSZX', material: 'ABS', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSZX', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabszx.png', productLineId: 'treed__abs__zx', weight: 1000, basePrice: 34.90 },
  { name: 'ABS King', sku: 'ABSK', material: 'ABS', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSK', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsking.png', productLineId: 'treed__abs__king', weight: 1000, basePrice: 39.90 },
  { name: 'ABS King', sku: 'ABSK', material: 'ABS', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSK', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsking.png', productLineId: 'treed__abs__king', weight: 1000, basePrice: 39.90 },
  { name: 'ABS Food', sku: 'ABSF', material: 'ABS', color: 'NATURAL', colorHex: 'F5E6D3', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsfood.png', productLineId: 'treed__abs__food', weight: 1000, basePrice: 44.90 },
  { name: 'ABS Med', sku: 'ABSM', material: 'ABS', color: 'NATURAL', colorHex: 'F5E6D3', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSM', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsmed.png', productLineId: 'treed__abs__med', weight: 1000, basePrice: 49.90 },
  { name: 'ABS ESD', sku: 'ABSES', material: 'ABS', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSES', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsesd.png', productLineId: 'treed__abs-esd__standard', weight: 1000, basePrice: 79.90 },
  { name: 'ABS CF', sku: 'ABSCF', material: 'ABS', color: 'CARBON BLACK', colorHex: '1C1C1C', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSCF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabscf.png', productLineId: 'treed__abs-cf__standard', weight: 1000, basePrice: 79.90 },
  { name: 'ABS Fast Forward', sku: 'ABSFF', material: 'ABS', color: 'NATURAL', colorHex: 'F5E6D3', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsfastforward.png', productLineId: 'treed__abs-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Fast Forward', sku: 'ABSFF', material: 'ABS', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsfastforward.png', productLineId: 'treed__abs-hs__fast-forward', weight: 1000, basePrice: 34.90 },
  { name: 'ABS Fast Forward', sku: 'ABSFF', material: 'ABS', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=ABSFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedabsfastforward.png', productLineId: 'treed__abs-hs__fast-forward', weight: 1000, basePrice: 34.90 },

  // PETG Lines (G-PET)
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'RUBY', colorHex: 'E0115F', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'SEETROUGHT', colorHex: 'E8E8E8', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'AZUL', colorHex: '0047AB', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'ALLUMINIUM', colorHex: 'A8A8A8', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'YELLOW TREED', colorHex: 'FFD700', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'YELLOW LEMON', colorHex: 'FFF44F', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'VIOLET', colorHex: '8B5CF6', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'BRONZE', colorHex: 'CD7F32', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'ANTHRACITE GREY', colorHex: '383838', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'GREEN ARMY', colorHex: '4B5320', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'AQUAMARINE', colorHex: '7FFFD4', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'ORANGE', colorHex: 'FF6B00', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'RED WINE', colorHex: '722F37', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'BROWN', colorHex: '8B4513', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'APPLE GREEN', colorHex: '8DB600', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'Industrial Grey', colorHex: '6B6B6B', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'G-PET', sku: 'GPET', material: 'PETG', color: 'Oxford green', colorHex: '002147', productUrl: 'https://treedfilaments.com/shop/product/?sku=GPET', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedg-pet.png', productLineId: 'treed__petg__standard', weight: 1000, basePrice: 29.90 },
  { name: 'PETG Fast Forward', sku: 'PETGFF', material: 'PETG', color: 'SEETROUGHT', colorHex: 'E8E8E8', productUrl: 'https://treedfilaments.com/shop/product/?sku=PETGFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpetgfastforward.png', productLineId: 'treed__petg-hs__fast-forward', weight: 1000, basePrice: 32.90 },
  { name: 'PETG Fast Forward', sku: 'PETGFF', material: 'PETG', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PETGFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpetgfastforward.png', productLineId: 'treed__petg-hs__fast-forward', weight: 1000, basePrice: 32.90 },
  { name: 'PETG Fast Forward', sku: 'PETGFF', material: 'PETG', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=PETGFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpetgfastforward.png', productLineId: 'treed__petg-hs__fast-forward', weight: 1000, basePrice: 32.90 },

  // PC Lines
  { name: 'Verum T', sku: 'VERU', material: 'PC', color: 'SEETROUGHT', colorHex: 'E8E8E8', productUrl: 'https://treedfilaments.com/shop/product/?sku=VERU', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedverumt.png', productLineId: 'treed__pc__verum-t', weight: 1000, basePrice: 59.90 },
  { name: 'PC P51', sku: 'PC51', material: 'PC', color: 'SEETROUGHT', colorHex: 'E8E8E8', productUrl: 'https://treedfilaments.com/shop/product/?sku=PC51', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpcp51.png', productLineId: 'treed__pc__p51', weight: 1000, basePrice: 54.90 },
  { name: 'PC ABS V0', sku: 'PCABV0', material: 'PC', color: 'Industrial Grey', colorHex: '6B6B6B', productUrl: 'https://treedfilaments.com/shop/product/?sku=PCABV0', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpcabsv0.png', productLineId: 'treed__pc-abs__v0', weight: 1000, basePrice: 69.90 },
  { name: 'PC ABS Tenax', sku: 'PCABT', material: 'PC', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PCABT', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpcabstenax.png', productLineId: 'treed__pc-abs__tenax', weight: 1000, basePrice: 64.90 },
  { name: 'PC ABS Tenax', sku: 'PCABT', material: 'PC', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=PCABT', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpcabstenax.png', productLineId: 'treed__pc-abs__tenax', weight: 1000, basePrice: 64.90 },
  { name: 'PC PBT B-mat', sku: 'BMAT', material: 'PC', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=BMAT', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpcpbtb-mat.png', productLineId: 'treed__pc-pbt__b-mat', weight: 1000, basePrice: 69.90 },
  { name: 'PC PBT GF', sku: 'PCPBTGF', material: 'PC', color: 'ANTHRACITE GREY', colorHex: '383838', productUrl: 'https://treedfilaments.com/shop/product/?sku=PCPBTGF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpcpbtgf.png', productLineId: 'treed__pc-pbt-gf__standard', weight: 1000, basePrice: 89.90 },

  // PA (Nylon) Lines
  { name: 'Structura MA', sku: 'STRUCT', material: 'PA', color: 'CARBON BLACK', colorHex: '1C1C1C', productUrl: 'https://treedfilaments.com/shop/product/?sku=STRUCT', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedstructurama.png', productLineId: 'treed__pa__structura-ma', weight: 1000, basePrice: 59.90 },
  { name: 'PA KK', sku: 'PAKK', material: 'PA', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PAKK', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpakk.png', productLineId: 'treed__pa__kk', weight: 1000, basePrice: 54.90 },
  { name: 'PA Lubratech', sku: 'LUBR', material: 'PA', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=LUBR', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpalubratech.png', productLineId: 'treed__pa__lubratech', weight: 1000, basePrice: 79.90 },
  { name: 'PA Longchain', sku: 'LONG', material: 'PA', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=LONG', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpalongchain.png', productLineId: 'treed__pa__longchain', weight: 1000, basePrice: 69.90 },
  { name: 'PA Longchain', sku: 'LONG', material: 'PA', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=LONG', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpalongchain.png', productLineId: 'treed__pa__longchain', weight: 1000, basePrice: 69.90 },
  { name: 'PA HP NAT', sku: 'PAHPN', material: 'PA', color: 'NATURAL', colorHex: 'F5E6D3', productUrl: 'https://treedfilaments.com/shop/product/?sku=PAHPN', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpahpnat.png', productLineId: 'treed__pa__hp-nat', weight: 1000, basePrice: 79.90 },
  { name: 'PA HP CF 15', sku: 'PAHPCF', material: 'PA', color: 'CARBON BLACK', colorHex: '1C1C1C', productUrl: 'https://treedfilaments.com/shop/product/?sku=PAHPCF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpahpcf15.png', productLineId: 'treed__pa-cf__hp-cf15', weight: 1000, basePrice: 129.90 },
  { name: 'PA HP GS10', sku: 'PAHPGS', material: 'PA', color: 'CARBON BLACK', colorHex: '1C1C1C', productUrl: 'https://treedfilaments.com/shop/product/?sku=PAHPGS', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpahpgs10.png', productLineId: 'treed__pa-gf__hp-gs10', weight: 1000, basePrice: 109.90 },
  { name: 'PA CF25', sku: 'PA25', material: 'PA', color: 'CARBON BLACK', colorHex: '1C1C1C', productUrl: 'https://treedfilaments.com/shop/product/?sku=PA25', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpacf25.png', productLineId: 'treed__pa-cf__cf25', weight: 1000, basePrice: 149.90 },
  { name: 'Carbonio CF15', sku: 'CARB', material: 'PA', color: 'CARBON BLACK', colorHex: '1C1C1C', productUrl: 'https://treedfilaments.com/shop/product/?sku=CARB', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedcarboniocf15.png', productLineId: 'treed__pa-cf__carbonio-cf15', weight: 1000, basePrice: 119.90 },
  { name: 'Carbonio CF15', sku: 'CARB', material: 'PA', color: 'CARBON RED', colorHex: '4A1010', productUrl: 'https://treedfilaments.com/shop/product/?sku=CARB', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedcarboniocf15.png', productLineId: 'treed__pa-cf__carbonio-cf15', weight: 1000, basePrice: 119.90 },
  { name: 'Carbonio CF15', sku: 'CARB', material: 'PA', color: 'CARBON GREEN', colorHex: '104A10', productUrl: 'https://treedfilaments.com/shop/product/?sku=CARB', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedcarboniocf15.png', productLineId: 'treed__pa-cf__carbonio-cf15', weight: 1000, basePrice: 119.90 },
  { name: 'Carbonio CF15', sku: 'CARB', material: 'PA', color: 'CARBON BLUE', colorHex: '10104A', productUrl: 'https://treedfilaments.com/shop/product/?sku=CARB', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedcarboniocf15.png', productLineId: 'treed__pa-cf__carbonio-cf15', weight: 1000, basePrice: 119.90 },
  { name: 'Carbonio FAST FORWARD', sku: 'CARBFF', material: 'PA', color: 'CARBON BLACK', colorHex: '1C1C1C', productUrl: 'https://treedfilaments.com/shop/product/?sku=CARBFF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedcarboniofastforward.png', productLineId: 'treed__pa-cf__carbonio-ff', weight: 1000, basePrice: 129.90 },

  // PP Lines
  { name: 'Fortis LL', sku: 'FORTLL', material: 'PP', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=FORTLL', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedfortisll.png', productLineId: 'treed__pp-ll__fortis-ll', weight: 1000, basePrice: 49.90 },
  { name: 'PP P-lene 4', sku: 'PP4', material: 'PP', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PP4', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedppp-lene4.png', productLineId: 'treed__pp__p-lene-4', weight: 1000, basePrice: 44.90 },
  { name: 'PP P-lene 4', sku: 'PP4', material: 'PP', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=PP4', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedppp-lene4.png', productLineId: 'treed__pp__p-lene-4', weight: 1000, basePrice: 44.90 },
  { name: 'PP P-lene 4', sku: 'PP4', material: 'PP', color: 'NATURAL', colorHex: 'F5E6D3', productUrl: 'https://treedfilaments.com/shop/product/?sku=PP4', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedppp-lene4.png', productLineId: 'treed__pp__p-lene-4', weight: 1000, basePrice: 44.90 },
  { name: 'PP P-Lene 5', sku: 'PP5', material: 'PP', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=PP5', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedppp-lene5.png', productLineId: 'treed__pp__p-lene-5', weight: 1000, basePrice: 49.90 },
  { name: 'PP P-Lene T15', sku: 'PPT15', material: 'PP', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=PPT15', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedppp-lenet15.png', productLineId: 'treed__pp__p-lene-t15', weight: 1000, basePrice: 54.90 },
  { name: 'PP GF30', sku: 'PPGF', material: 'PP', color: 'SLATE GREY', colorHex: '708090', productUrl: 'https://treedfilaments.com/shop/product/?sku=PPGF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedppgf30.png', productLineId: 'treed__pp-gf__gf30', weight: 1000, basePrice: 79.90 },
  { name: 'PP CF 18', sku: 'PPCF', material: 'PP', color: 'CARBON BLACK', colorHex: '1C1C1C', productUrl: 'https://treedfilaments.com/shop/product/?sku=PPCF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedppcf18.png', productLineId: 'treed__pp-cf__cf18', weight: 1000, basePrice: 89.90 },

  // PE Line
  { name: 'PE E-lene HD', sku: 'PEHD', material: 'PE', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=PEHD', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpee-lenehd.png', productLineId: 'treed__hdpe__e-lene-hd', weight: 1000, basePrice: 44.90 },

  // PET-CF Line
  { name: 'PET CF 15', sku: 'PETCF', material: 'PET', color: 'CARBON BLACK', colorHex: '1C1C1C', productUrl: 'https://treedfilaments.com/shop/product/?sku=PETCF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpetcf15.png', productLineId: 'treed__pet-cf__cf15', weight: 1000, basePrice: 99.90 },

  // High-performance Lines
  { name: 'PEEK NAT', sku: 'PEEKN', material: 'PEEK', color: 'NATURAL', colorHex: 'F5E6D3', productUrl: 'https://treedfilaments.com/shop/product/?sku=PEEKN', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpeeknat.png', productLineId: 'treed__peek__nat', weight: 500, basePrice: 399.90 },
  { name: 'PEEK CF 15', sku: 'PEEKCF', material: 'PEEK', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PEEKCF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpeekcf15.png', productLineId: 'treed__peek-cf__cf15', weight: 500, basePrice: 449.90 },
  { name: 'PPS GF 25', sku: 'PPSGF', material: 'PPS', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PPSGF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedppsgf25.png', productLineId: 'treed__pps-gf__gf25', weight: 500, basePrice: 299.90 },
  { name: 'PPS CF15', sku: 'PPSCF', material: 'PPS', color: 'CARBON BLACK', colorHex: '1C1C1C', productUrl: 'https://treedfilaments.com/shop/product/?sku=PPSCF', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedppscf15.png', productLineId: 'treed__pps-cf__cf15', weight: 500, basePrice: 329.90 },

  // PMMA Line
  { name: 'PMMA Hirma', sku: 'PMMA', material: 'PMMA', color: 'SEETROUGHT', colorHex: 'E8E8E8', productUrl: 'https://treedfilaments.com/shop/product/?sku=PMMA', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpmmahirma.png', productLineId: 'treed__pmma__hirma', weight: 1000, basePrice: 49.90 },

  // TPE/TPU Lines
  { name: 'TPE-U Flexmark 9', sku: 'FLEX9', material: 'TPU', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=FLEX9', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-uflexmark9.png', productLineId: 'treed__tpu__flexmark-9', weight: 500, basePrice: 54.90 },
  { name: 'TPE-U Flexmark 9', sku: 'FLEX9', material: 'TPU', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=FLEX9', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-uflexmark9.png', productLineId: 'treed__tpu__flexmark-9', weight: 500, basePrice: 54.90 },
  { name: 'TPE-U Flexmark 8', sku: 'FLEX8', material: 'TPU', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=FLEX8', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-uflexmark8.png', productLineId: 'treed__tpu__flexmark-8', weight: 500, basePrice: 54.90 },
  { name: 'TPE-U Flexmark 8', sku: 'FLEX8', material: 'TPU', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=FLEX8', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-uflexmark8.png', productLineId: 'treed__tpu__flexmark-8', weight: 500, basePrice: 54.90 },
  { name: 'TPE-U Flexmark 7', sku: 'FLEX7', material: 'TPU', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=FLEX7', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-uflexmark7.png', productLineId: 'treed__tpu__flexmark-7', weight: 500, basePrice: 54.90 },
  { name: 'TPE-U Flexmark 7', sku: 'FLEX7', material: 'TPU', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=FLEX7', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-uflexmark7.png', productLineId: 'treed__tpu__flexmark-7', weight: 500, basePrice: 54.90 },
  { name: 'TPE-E Ultraflex', sku: 'ULTRA', material: 'TPE', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=ULTRA', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-eultraflex.png', productLineId: 'treed__tpe-e__ultraflex', weight: 500, basePrice: 59.90 },
  { name: 'TPE-E Ultraflex', sku: 'ULTRA', material: 'TPE', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=ULTRA', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-eultraflex.png', productLineId: 'treed__tpe-e__ultraflex', weight: 500, basePrice: 59.90 },
  { name: 'TPE-E Ultraflex +', sku: 'ULTRA+', material: 'TPE', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=ULTRA+', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-eultraflexplus.png', productLineId: 'treed__tpe-e__ultraflex-plus', weight: 500, basePrice: 64.90 },
  { name: 'TPE-E Ultraflex +', sku: 'ULTRA+', material: 'TPE', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=ULTRA+', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-eultraflexplus.png', productLineId: 'treed__tpe-e__ultraflex-plus', weight: 500, basePrice: 64.90 },
  { name: 'TPE-A Flexability', sku: 'FLEXA', material: 'TPA', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=FLEXA', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-aflexability.png', productLineId: 'treed__tpa__flexability', weight: 500, basePrice: 59.90 },
  { name: 'TPE-A Flexability', sku: 'FLEXA', material: 'TPA', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=FLEXA', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-aflexability.png', productLineId: 'treed__tpa__flexability', weight: 500, basePrice: 59.90 },
  { name: 'TPE-A Flexability +', sku: 'FLEXA+', material: 'TPA', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=FLEXA+', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-aflexabilityplus.png', productLineId: 'treed__tpa__flexability-plus', weight: 500, basePrice: 64.90 },
  { name: 'TPE-A Flexability +', sku: 'FLEXA+', material: 'TPA', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=FLEXA+', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedtpe-aflexabilityplus.png', productLineId: 'treed__tpa__flexability-plus', weight: 500, basePrice: 64.90 },
  { name: 'Pneumatique', sku: 'PNEU', material: 'TPU', color: 'BLACK HOLE', colorHex: '1A1A1A', productUrl: 'https://treedfilaments.com/shop/product/?sku=PNEU', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpneumatique.png', productLineId: 'treed__tpu-foam__pneumatique', weight: 500, basePrice: 49.90 },
  { name: 'Pure FT', sku: 'PURE', material: 'TPU', color: 'OSSO', colorHex: 'F5F5DC', productUrl: 'https://treedfilaments.com/shop/product/?sku=PURE', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedpureft.png', productLineId: 'treed__tpu__pure-ft', weight: 500, basePrice: 59.90 },
  { name: 'Elasto A', sku: 'ELAST', material: 'TPA', color: 'WHITE', colorHex: 'FFFFFF', productUrl: 'https://treedfilaments.com/shop/product/?sku=ELAST', imageUrl: 'https://dlh2hyjriy9yy.cloudfront.net/filaments/treedelastoa.png', productLineId: 'treed__tpa__elasto-a', weight: 500, basePrice: 54.90 },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all unique product lines from the seed data
 */
export function getTreeDProductLines(): string[] {
  return [...new Set(TREED_SEED_DATA.map(p => p.productLineId))];
}

/**
 * Get variant count by product line
 */
export function getTreeDVariantCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const product of TREED_SEED_DATA) {
    counts[product.productLineId] = (counts[product.productLineId] || 0) + 1;
  }
  return counts;
}

/**
 * Get EUR to USD conversion rate (approximate)
 */
export const EUR_TO_USD_RATE = 1.10;

/**
 * Convert EUR price to USD
 */
export function convertEurToUsd(eurPrice: number): number {
  return Math.round(eurPrice * EUR_TO_USD_RATE * 100) / 100;
}

// Export stats
export const TREED_STATS = {
  totalVariants: TREED_SEED_DATA.length,
  productLines: getTreeDProductLines().length,
  materials: [...new Set(TREED_SEED_DATA.map(p => p.material))],
};

console.log(`[TreeD Seed] Loaded ${TREED_STATS.totalVariants} variants across ${TREED_STATS.productLines} product lines`);

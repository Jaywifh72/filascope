/**
 * PROTO-PASTA CSV SEED DATA
 * 
 * Curated product data from protopasta_products.csv.
 * Filtered to include only 3D Printer Filament products.
 * Excludes: Subscriptions, Workshops, Accessories, Gift Cards, Shipping products.
 * 
 * Key filtering requirements:
 * - No Bulk Products (>5.5kg)
 * - No 2.85mm/3.0mm Products  
 * - No Sample Products (<300g) - filter 50g coils
 * - No Gift/Non-Filament Products
 * - No Subscriptions (Endless PLA, Endless Exploration)
 * - No Workshops or Digital products
 */

export interface ProtoPastaSeedProduct {
  productName: string;
  productType: string;
  priceMin: number;
  priceMax: number;
  variantsCount: number;
  available: boolean;
  tags: string[];
  // Derived fields
  material: string;
  productLineKey: string;
  colorFamily: string | null;
  finishType: string;
  isAbrasive: boolean;
  isConductive: boolean;
  isMultiColor: boolean;
}

// Tags that indicate non-filament products to exclude
export const PROTOPASTA_EXCLUDED_TAGS = [
  'Subscription',
  'Custom Filament', // Subscriptions include this
  'gift',
];

// Product types that are NOT filament
export const PROTOPASTA_EXCLUDED_PRODUCT_TYPES = [
  'Workshop',
  'Accessories', 
  'Digital',
  '',
];

// Title patterns that indicate non-filament products
export const PROTOPASTA_EXCLUDED_TITLE_PATTERNS = [
  /endless.*subscription/i,
  /endless.*pla.*subscription/i,
  /endless.*exploration/i,
  /filament\s*workshop/i,
  /gift.*credit/i,
  /gift.*of.*pasta/i,
  /shipping.*delivery/i,
  /endless.*designs/i,
];

/**
 * Check if a product should be excluded based on its data
 */
export function shouldExcludeProtoPastaProduct(product: ProtoPastaSeedProduct): boolean {
  // Check excluded product types
  if (PROTOPASTA_EXCLUDED_PRODUCT_TYPES.includes(product.productType)) {
    return true;
  }
  
  // Check excluded tags
  for (const tag of product.tags) {
    if (PROTOPASTA_EXCLUDED_TAGS.some(ex => tag.toLowerCase().includes(ex.toLowerCase()))) {
      return true;
    }
  }
  
  // Check excluded title patterns
  for (const pattern of PROTOPASTA_EXCLUDED_TITLE_PATTERNS) {
    if (pattern.test(product.productName)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Parse price range string like "5.00 - 49.99" into min/max
 */
function parsePrice(priceStr: string): { min: number; max: number } {
  const parts = priceStr.split('-').map(p => parseFloat(p.trim()));
  if (parts.length === 2) {
    return { min: parts[0], max: parts[1] };
  }
  return { min: parts[0] || 0, max: parts[0] || 0 };
}

/**
 * Extract material from tags (Contents_*)
 */
function extractMaterial(tags: string[]): string {
  const materialTags = tags.filter(t => t.startsWith('Contents_'));
  
  // Priority order for material detection
  if (materialTags.some(t => t.includes('Carbon Fiber'))) {
    if (materialTags.some(t => t.includes('PETG'))) return 'PETG-CF';
    if (materialTags.some(t => t.includes('POK'))) return 'POK-CF';
    if (materialTags.some(t => t.includes('HTPLA'))) return 'HTPLA-CF';
    return 'PLA-CF';
  }
  if (materialTags.some(t => t.includes('Glass Fiber'))) {
    if (materialTags.some(t => t.includes('POK'))) return 'POK-GF';
    return 'HTPLA-GF';
  }
  if (materialTags.some(t => t.includes('Metal Powder'))) {
    if (materialTags.some(t => t.includes('HTPLA'))) return 'HTPLA-Metal';
    return 'PLA-Metal';
  }
  if (materialTags.some(t => t.includes('POK'))) return 'POK';
  if (materialTags.some(t => t.includes('PETG'))) return 'PETG';
  if (materialTags.some(t => t.includes('TPE') || t.includes('Elastic'))) return 'TPU';
  if (materialTags.some(t => t.includes('HFPLA'))) return 'HFPLA';
  if (materialTags.some(t => t.includes('HTPLA'))) return 'HTPLA';
  if (materialTags.some(t => t.includes('Recycled'))) {
    if (materialTags.some(t => t.includes('PETG'))) return 'rPETG';
    return 'rPLA';
  }
  if (materialTags.some(t => t.includes('PLA'))) return 'PLA';
  
  return 'HTPLA'; // Default for Proto-Pasta
}

/**
 * Determine product line key from product name and tags
 */
function determineProductLineKey(name: string, tags: string[]): string {
  const n = name.toLowerCase();
  const tagStr = tags.join(' ').toLowerCase();
  
  // Specialty lines first
  if (n.includes('reflective')) return 'htpla-reflective';
  if (n.includes('nebula') || n.includes('multicolor htpla')) return 'htpla-nebula';
  if (n.includes('thermochromic')) return 'htpla-thermochromic';
  if (n.includes('glow-in-the-dark') || n.includes('glow in the dark')) return 'htpla-glow';
  if (n.includes('smoothie')) return 'htpla-smoothie';
  if (n.includes('matte fiber')) return 'htpla-matte-fiber';
  if (n.includes('marble htpla') || n.includes('stone gray marble')) return 'htpla-marble';
  
  // Metal composites
  if (n.includes('brass')) return 'htpla-brass';
  if (n.includes('bronze') && !n.includes('reflective')) return 'htpla-bronze';
  if (n.includes('copper')) return 'htpla-copper';
  if (n.includes('iron')) return 'pla-iron';
  if (n.includes('stainless steel') || n.includes('steel-filled')) return 'pla-steel';
  
  // Carbon Fiber
  if (tagStr.includes('carbon fiber')) {
    if (n.includes('petg')) return 'petg-cf';
    if (n.includes('polyketone') || n.includes('pok')) return 'pok-cf';
    if (n.includes('static dissipative')) return 'pla-cf-esd';
    if (n.includes('recycled')) return 'pla-cf-recycled';
    return 'htpla-cf';
  }
  
  // Glass Fiber
  if (tagStr.includes('glass fiber')) {
    if (n.includes('polyketone')) return 'pok-gf';
    return 'htpla-gf';
  }
  
  // Conductive/ESD
  if (n.includes('conductive') || n.includes('static dissipative')) {
    if (n.includes('petg')) return 'petg-esd';
    if (n.includes('carbon fiber')) return 'pla-cf-esd';
    return 'pla-esd';
  }
  
  // PETG lines
  if (n.includes('petg') || tagStr.includes('petg')) {
    if (n.includes('recycled')) return 'petg-recycled';
    return 'petg-standard';
  }
  
  // TPU lines
  if (tagStr.includes('tpe') || tagStr.includes('elastic')) {
    if (n.includes('rigid')) return 'tpu-rigid';
    if (n.includes('flexible')) return 'tpu-flexible';
    return 'tpu-flexible';
  }
  
  // c-Matte PLA (High Flow)
  if (n.includes('c-matte')) return 'pla-cmatte';
  
  // High Flow PLA
  if (n.includes('high flow pla') || n.includes('hfpla')) return 'hfpla-standard';
  
  // Recycled lines
  if (n.includes('recycled') || n.includes('still colorful')) {
    if (n.includes('petg')) return 'petg-recycled';
    return 'pla-recycled';
  }
  
  // Polyketone
  if (n.includes('polyketone')) return 'pok-standard';
  
  // Calcium Carbonate
  if (n.includes('calcium carbonate')) return 'pla-calcium-carbonate';
  
  // Premium Basic PLA
  if (n.includes('premium basic pla')) return 'pla-basic';
  
  // Finish-based HTPLA lines
  if (tagStr.includes('glitter') || n.includes('glitter') || n.includes('fleck') || n.includes('wonder')) return 'htpla-glitter';
  if (tagStr.includes('pearl') || n.includes('metallic') || n.includes('pearl') || n.includes('satin')) return 'htpla-metallic';
  if (n.includes('translucent') || n.includes('ice ')) return 'htpla-translucent';
  if (n.includes('opaque')) return 'htpla-opaque';
  
  // Default to HTPLA standard for community-inspired and other HTPLA
  if (tagStr.includes('htpla') || n.includes('htpla')) return 'htpla-standard';
  
  return 'htpla-standard';
}

/**
 * Determine finish type from product name and tags
 */
function determineFinishType(name: string, tags: string[]): string {
  const n = name.toLowerCase();
  const tagStr = tags.join(' ').toLowerCase();
  
  if (n.includes('reflective')) return 'Reflective';
  if (n.includes('glitter') || n.includes('fleck') || n.includes('wonder') || tagStr.includes('glitter')) return 'Glitter';
  if (n.includes('translucent') || n.includes('ice ')) return 'Translucent';
  if (n.includes('metallic') || tagStr.includes('pearl') || n.includes('satin')) return 'Metallic';
  if (n.includes('nebula') || n.includes('multicolor') || n.includes('gradient')) return 'Multicolor';
  if (n.includes('thermochromic')) return 'Thermochromic';
  if (n.includes('glow')) return 'Glow';
  if (n.includes('marble')) return 'Marble';
  if (n.includes('matte fiber')) return 'Matte Fiber';
  if (n.includes('smoothie')) return 'Glitter'; // Smoothie has sparkle
  if (n.includes('brass') || n.includes('bronze') || n.includes('copper') || n.includes('iron') || n.includes('steel')) return 'Metal Filled';
  if (n.includes('carbon fiber') || tagStr.includes('carbon fiber')) return 'Carbon Fiber';
  if (n.includes('glass fiber') || tagStr.includes('glass fiber')) return 'Glass Fiber';
  if (n.includes('c-matte')) return 'Matte';
  if (n.includes('opaque')) return 'Opaque';
  
  return 'Standard';
}

/**
 * Determine if product is abrasive (requires hardened nozzle)
 */
function isAbrasive(name: string, tags: string[]): boolean {
  const n = name.toLowerCase();
  const tagStr = tags.join(' ').toLowerCase();
  
  return (
    tagStr.includes('hard (abrasive)') ||
    tagStr.includes('carbon fiber') ||
    tagStr.includes('glass fiber') ||
    tagStr.includes('metal powder') ||
    n.includes('brass') ||
    n.includes('bronze') ||
    n.includes('copper') ||
    n.includes('iron') ||
    n.includes('steel')
  );
}

/**
 * Determine if product is electrically conductive
 */
function isConductive(name: string, tags: string[]): boolean {
  const n = name.toLowerCase();
  const tagStr = tags.join(' ').toLowerCase();
  
  return (
    tagStr.includes('electrically conductive') ||
    n.includes('conductive') ||
    n.includes('static dissipative')
  );
}

/**
 * Determine if product is multicolor
 */
function isMultiColor(name: string, tags: string[]): boolean {
  const tagStr = tags.join(' ').toLowerCase();
  
  return (
    tagStr.includes('multi-color') ||
    name.toLowerCase().includes('multicolor') ||
    name.toLowerCase().includes('nebula') ||
    name.toLowerCase().includes('rainbow') ||
    name.toLowerCase().includes('gradient')
  );
}

/**
 * Extract color family from tags (Color_*)
 */
function extractColorFamily(tags: string[]): string | null {
  const colorTag = tags.find(t => t.startsWith('Color_') && !t.includes('Multi-Color'));
  if (colorTag) {
    return colorTag.replace('Color_', '');
  }
  return null;
}

// Parse tags from CSV format "Tag1; Tag2; Tag3"
function parseTags(tagString: string): string[] {
  return tagString.split(';').map(t => t.trim().replace(/\\_/g, '_')).filter(Boolean);
}

/**
 * Raw product data from CSV
 * Format: [productName, productType, priceRange, variantsCount, available, tagsString]
 */
const RAW_SEED_DATA: Array<[string, string, string, number, boolean, string]> = [
  // Reflective HTPLA Line
  ['Yellow Reflective HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Heat Treatable; Feature_Rigid'],
  ['White Reflective HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Heat Treatable; Feature_Rigid'],
  ['Red Reflective HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Heat Treatable; Feature_Rigid'],
  ['Nebula Reflective HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Multi-Color; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Heat Treatable'],
  ['Gray Reflective HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Heat Treatable; Feature_Rigid'],
  ['Green Reflective HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Heat Treatable; Feature_Rigid'],
  ['Fluorescent Yellow Reflective HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Heat Treatable; Feature_Rigid'],
  ['Denim Blue Reflective HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Heat Treatable; Feature_Rigid'],
  ['Bronze Reflective HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Heat Treatable; Feature_Rigid'],
  ['Blue Reflective HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Heat Treatable'],
  
  // Metal Composites
  ['Smooth Bronze HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gold; Colorful; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['High Density Stainless Steel-filled HTPLA', '3D Printer Filament', '12.00 - 99.99', 2, false, 'Color_Gray; Color_Silver; Contents_HTPLA; Contents_Ingeo 4043D; Contents_Metal Powder'],
  ['High Density Iron-filled HTPLA', '3D Printer Filament', '10.00 - 74.99', 2, false, 'Color_Gray; Contents_HTPLA; Contents_Metal Powder; Feature_Hard (Abrasive); Feature_High Density'],
  ['Copper-filled Metal Composite HTPLA', '3D Printer Filament', '12.00 - 94.99', 3, true, 'Color_Orange; Contents_HTPLA; Contents_Ingeo 3D850; Contents_Metal Powder; Contents_PLA'],
  ['Stainless Steel Metal Composite PLA - Blue color', '3D Printer Filament', '12.00 - 49.99', 2, false, 'Color_Blue; Contents_Ingeo 4043D; Contents_Metal Powder; Contents_PLA; Feature_Hard (Abrasive)'],
  ['Stainless Steel Metal Composite PLA - Burgundy color', '3D Printer Filament', '12.00 - 49.99', 2, true, 'Color_Red; Contents_Ingeo 4043D; Contents_Metal Powder; Contents_PLA; Feature_Hard (Abrasive)'],
  ['Stainless Steel Metal Composite PLA - Gold color', '3D Printer Filament', '12.00 - 49.99', 2, true, 'Color_Gold; Contents_Ingeo 4043D; Contents_Metal Powder; Contents_PLA; Feature_Hard (Abrasive)'],
  
  // Glass Fiber
  ['Blue Glass Fiber HTPLA', '3D Printer Filament', '5.50 - 59.99', 3, false, 'Color_Blue; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Hard (Abrasive)'],
  ['Red Glass Fiber HTPLA', '3D Printer Filament', '5.50 - 59.99', 3, true, 'Color_Red; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Hard (Abrasive)'],
  ['White Glass Fiber HTPLA', '3D Printer Filament', '5.50 - 59.99', 3, true, 'Color_White; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; Feature_Hard (Abrasive)'],
  
  // Glitter HTPLA
  ["Glitter 'n Gourd Orange HTPLA", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Lapis Lazuli Glitter HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Community Inspired; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Night Before Blue HTPLA with Silver Glitter', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Candle Light White HTPLA with Gold Glitter', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_White; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Texas Tea Black with Gold Glitter', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Black; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Wonder Black Rainbow Glitter HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Black; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ["Fleck 'n Forest Green Glitter HTPLA", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Green; Colorful; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Atomic Age Gray Glitter HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gray; Colorful; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850'],
  ["Fleck 'n Fire Red Glitter HTPLA", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Red; Colorful; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Unicorn Tears White Glitter HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_White; Colorful; Community Inspired; Contents_Glitter; Contents_HTPLA'],
  ['Filafetti Confetti Frosting HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_White; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Dusty Smoke HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gray; Color_Silver; Colorful; Contents_Glitter; Contents_HTPLA'],
  ['Good as Gold HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gold; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; Feature_Heat Treatable'],
  ['Pretty in Pink Pearl HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Pink; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; Feature_Heat Treatable'],
  ['Obsidian HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Black; Color_Gray; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850'],
  
  // Metallic HTPLA
  ['Sun Gold Metallic Yellow HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Yellow; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; EPLA2025'],
  ['Second to None Silver HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gray; Color_Silver; Contents_HTPLA; Contents_Ingeo 3D850; Contents_Pearl'],
  ["Stef's Rose Gold HTPLA", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gold; Color_Orange; Color_Pink; Colorful; Community Inspired'],
  ['What Karat? Smooth Gold HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gold; Colorful; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Heartthrob Metallic Red HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Red; Contents_HTPLA; Contents_Ingeo 3D850; Contents_Pearl; Feature_Heat Treatable'],
  ["Luke's Proton Purple HTPLA", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Purple; Contents_HTPLA; Contents_Ingeo 3D850; Contents_Pearl; Feature_Heat Treatable'],
  ['Out of Darts Orange HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Orange; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850; Contents_Pearl'],
  ['Moonstruck White Satin HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_White; Contents_HTPLA; Contents_Ingeo 3D850; Contents_Pearl; Feature_Heat Treatable'],
  ["Glitter's Mane Teal HTPLA", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Teal; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850; Contents_Pearl'],
  
  // Translucent HTPLA
  ['Purple Ice Translucent HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Purple; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; EPLA2025'],
  ['Aqua Ice Translucent HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Teal; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; EPLA2025'],
  ['Blue Ice Translucent HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; EPLA2025'],
  ['Nerfed Translucent Orange HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Orange; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Totally Translucent Yellow HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Yellow; Colorful; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Bottle Brown Translucent HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Brown; Colorful; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Cobalt Blue Translucent HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Colorful; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Soda Green Translucent HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Green; Colorful; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  
  // Nebula Multicolor HTPLA
  ['Gradient Gray Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gray; Color_Multi-Color; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Black to the Fuchsia Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Multi-Color; Colorful; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Fading Rainbow Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Green; Color_Multi-Color; Color_Orange; Color_Pink'],
  ['Candy Rainbow Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Green; Color_Multi-Color; Color_Orange; Color_Pink'],
  ['Tidal Turquoise Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Multi-Color; Color_Teal; Colorful; Contents_HTPLA'],
  ['Kermie Green Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Green; Color_Multi-Color; Colorful; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Erratic Indigo Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Multi-Color; Color_Purple; Colorful; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Seafoam Green Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Green; Color_Multi-Color; Colorful; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Partly Sunny Yellow Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Multi-Color; Color_Yellow; Colorful; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Partly Cloudy Blue Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Multi-Color; Colorful; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Amethyst Aria Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Multi-Color; Color_Purple; Colorful; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Mango Medley Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Multi-Color; Color_Orange; Color_Red; Colorful; Contents_HTPLA'],
  ['Scarlet Symphony Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Multi-Color; Color_Pink; Colorful; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Stratocumulus Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Gray; Color_Multi-Color; Color_White; Colorful'],
  ['Midnight Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Gray; Color_Multi-Color; Contents_Glitter; Contents_HTPLA'],
  ['Forest Fantasy Green Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Green; Color_Multi-Color; Color_Yellow; Colorful'],
  ['Citrus Sunrise Orange Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Multi-Color; Color_Orange; Color_Yellow; Colorful; Contents_Glitter'],
  ['Marine Dream Blue Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Green; Color_Multi-Color; Colorful; Contents_Glitter'],
  ['The Original Nebula Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Multi-Color; Color_Nebula; Color_Pink; Color_Purple'],
  ['Nebula Cotton Candy Pastel Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Multi-Color; Color_Nebula; Color_Pink; Color_Purple'],
  ['Nebula Night Glow Fluorescent Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Fluorescent; Color_Multi-Color; Color_Nebula; Color_Orange'],
  ['Nebula Silver Silk Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Multi-Color; Color_Nebula; Color_Pink; Color_Purple'],
  ['Nebula Rainbow Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Multi-Color; Color_Nebula; Color_Pink; Color_Purple'],
  ['Nebula Gold Dust Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Multi-Color; Color_Nebula; Color_Pink; Color_Purple'],
  ['Nebula Stardust Multicolor HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Multi-Color; Color_Nebula; Color_Pink; Color_Purple'],
  
  // Smoothie HTPLA (Glitter)
  ['Super Green Smoothie HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Green; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; EPLA2024'],
  ['Blueberry Smoothie HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; EPLA2024'],
  ['Dragonfruit Smoothie HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Pink; Color_Red; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Orange Papaya Smoothie HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Orange; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; EPLA2024'],
  ['Pineapple Banana Smoothie HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Yellow; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; EPLA2024'],
  
  // Thermochromic HTPLA
  ['Galactic Duel Thermochromic HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, false, 'Color_Black; Color_White; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Chlorophylled Thermochromic HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, false, 'Color_Green; Color_Yellow; Contents_HTPLA; Contents_Ingeo 3D850; Contents_Pearl'],
  ['Autumn Orange Thermochromic HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Orange; Color_Yellow; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Just Peachy Thermochromic HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Orange; Color_Pink; Color_Red; Color_Yellow; Contents_HTPLA'],
  ['Sour Apple Thermochromic HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, false, 'Color_Green; Color_Yellow; Contents_HTPLA; Contents_Ingeo 3D850; Contents_Pearl'],
  
  // Glow-in-the-Dark HTPLA
  ['Green Glow-in-the-Dark; Fluorescent Yellow', '3D Printer Filament', '5.00 - 49.99', 3, false, 'Color_Fluorescent; Color_Green; Color_Yellow; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Green Glow-in-the-Dark; Natural', '3D Printer Filament', '5.00 - 49.99', 3, false, 'Color_Green; Color_Natural; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Green Glow-in-the-Dark; White', '3D Printer Filament', '5.00 - 49.99', 3, false, 'Color_Green; Color_White; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  
  // Marble HTPLA
  ['Stone Gray Marble HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gray; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; Feature_Heat Treatable'],
  ['White Marble HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gray; Color_White; Community Inspired; Contents_Glitter; Contents_HTPLA'],
  
  // Matte Fiber HTPLA (Wood-like)
  ['Matte Fiber HTPLA - Daffodil Wood', '3D Printer Filament', '6.00 - 39.99', 2, false, 'Color_Wood; Color_Yellow; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Matte Fiber HTPLA - Mahogany Wood', '3D Printer Filament', '6.00 - 39.99', 2, true, 'Color_Brown; Color_Red; Color_Wood; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Matte Fiber HTPLA - Walnut Wood', '3D Printer Filament', '6.00 - 39.99', 2, false, 'Color_Brown; Color_Wood; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  
  // Opaque/Standard HTPLA (Community Inspired)
  ['Chocolate Eruption Brown HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Brown; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA; EPLA2025'],
  ['Red Hot Cinnamon HTPLA', '3D Printer Filament', '5.00 - 44.99', 3, true, 'Color_Red; Contents_Ingeo 3D850; Contents_PLA; Feature_Rigid; Finish_Gloss'],
  ['International Orange Opaque HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Orange; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Bluish Opaque Purple HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Contents_HTPLA; Contents_Ingeo 3D850; EPLA2024; Feature_Heat Treatable'],
  ["Sophy's Aqua Phresh HTPLA", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Green; Color_Teal; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Beach Bum Beige HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Brown; Color_Natural; Color_White; Color_Wood; Contents_HTPLA'],
  ['Tropical Palm Green HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Green; Contents_HTPLA; Contents_Ingeo 3D850; EPLA2024; Feature_Heat Treatable'],
  ['Watermelon Crush Red HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Pink; Color_Red; Contents_HTPLA; Contents_Ingeo 3D850; Contents_Pearl'],
  ['Gloop! Purple HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Purple; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Ecto Ooze Green HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Green; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Amber Alchemy HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Brown; Color_Orange; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850'],
  ["Nice 'n Navy Blue HTPLA", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Lab Coat White HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_White; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ['Caution Opaque Yellow HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Yellow; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850; Contents_PLA'],
  ["Derek's Olive Drab HTPLA", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Green; Colorful; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850'],
  ["Juliette's Raspberry Jam HTPLA", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Pink; Color_Red; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850'],
  ["Derek's Good Old Gray HTPLA", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gray; Colorful; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850'],
  ["Bobbi's Purple Iris HTPLA", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Purple; Colorful; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Atikam Teal HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Blue; Color_Green; Color_Teal; Colorful; Community Inspired'],
  ['Lootsef Green HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Green; Colorful; Community Inspired; Contents_HTPLA; Contents_Ingeo 3D850'],
  ['Fluorescent Yellow HTPLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Fluorescent; Color_Yellow; Contents_HTPLA; Contents_Ingeo 3D850; Feature_Heat Treatable'],
  ['Sparkling Spruce HTPLA', '3D Printer Filament', '5.00 - 24.99', 2, false, 'Color_Green; Contents_Glitter; Contents_HTPLA; Contents_Ingeo 3D850; EPLA2024'],
  
  // c-Matte PLA (High Flow)
  ['Jurassic Jungle Green c-Matte PLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Green; Contents_HFPLA; Contents_PLA; explore24; Feature_Rigid'],
  ['Brick Red c-Matte PLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Red; Contents_HFPLA; Contents_PLA; explore24; Feature_Rigid'],
  ['Terracotta c-Matte PLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Orange; Contents_HFPLA; Contents_PLA; explore24; Feature_Rigid'],
  ['Granite Gray c-Matte PLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gray; Contents_HFPLA; Contents_PLA; explore24; Feature_Rigid'],
  ['Black c-Matte PLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Black; Contents_HFPLA; Contents_PLA; explore24; Feature_Rigid'],
  ['Gray c-Matte PLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Gray; Contents_HFPLA; Contents_PLA; explore24; Feature_Rigid'],
  ['White c-Matte PLA', '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_White; Contents_HFPLA; Contents_PLA; explore24; Feature_Rigid'],
  
  // High Flow PLA
  ['Natural High Flow PLA (HFPLA)', '3D Printer Filament', '4.00 - 29.99', 2, true, 'Color_Natural; Contents_HFPLA; Contents_PLA; explore24; Feature_Rigid'],
  ['Black High Flow PLA (HFPLA)', '3D Printer Filament', '4.00 - 29.99', 2, true, 'Color_Black; Contents_HFPLA; Contents_PLA; explore24; Feature_Rigid'],
  ['White High Flow PLA (HFPLA)', '3D Printer Filament', '4.00 - 29.99', 2, true, 'Color_White; Contents_HFPLA; Contents_PLA; explore24; Feature_Rigid'],
  
  // Calcium Carbonate Composite
  ['Calcium Carbonate PLA Composite', '3D Printer Filament', '7.00 - 89.99', 3, true, 'Color_White; Contents_HFPLA; Contents_PLA; explore24; Feature_Rigid'],
  
  // Recycled PLA
  ['Still Colorful Recycled PLA 033', '3D Printer Filament', '4.00 - 29.99', 2, false, 'Color_Blue; Colorful; Contents_PLA; Contents_Recycled; Feature_Rigid'],
  ['Still Colorful Recycled PLA 031', '3D Printer Filament', '4.00 - 29.99', 2, true, 'Color_Gray; Colorful; Contents_PLA; Contents_Recycled; Feature_Rigid'],
  ['Recycled Carbon Fiber PLA', '3D Printer Filament', '4.00 - 174.95', 3, true, 'Color_Black; Contents_Carbon Fiber; Contents_PLA; Contents_Recycled; Feature_Hard (Abrasive)'],
  ['Black Recycled PLA', '3D Printer Filament', '2.00 - 99.95', 3, true, 'Color_Black; Colorful; Contents_PLA; Contents_Recycled; Feature_Rigid'],
  
  // Premium Basic PLA
  ['Black PLA - Premium Basic PLA', '3D Printer Filament', '4.00 - 89.95', 3, true, 'Color_Black; Colorful; Contents_Ingeo 4043D; Contents_PLA; Feature_Rigid'],
  ['White PLA - Premium Basic PLA', '3D Printer Filament', '4.00 - 89.95', 3, true, 'Color_White; Colorful; Contents_Ingeo 4043D; Contents_PLA; Feature_Rigid'],
  
  // Static Dissipative / Conductive
  ['Static Dissipative Carbon Fiber PLA', '3D Printer Filament', '7.00 - 89.99', 3, true, 'Color_Black; Contents_Carbon Fiber; Contents_Ingeo 4043D; Contents_PLA; Feature_Electrically Conductive'],
  ['Static Dissipative PETG', '3D Printer Filament', '7.00 - 89.99', 3, true, 'Color_Black; Contents_PETG; Feature_Electrically Conductive; Feature_Semi Rigid; Feature_Static Dissipative'],
  ['Static Dissipative PLA', '3D Printer Filament', '7.00 - 199.95', 4, true, 'Color_Black; Contents_Ingeo 4043D; Contents_PLA; Feature_Electrically Conductive; Feature_Semi Rigid'],
  
  // PETG
  ['Simply Clear PETG', '3D Printer Filament', '4.00 - 34.99', 2, true, 'Color_Clear; Contents_PETG; Feature_Semi Rigid; Finish_Gloss; Finish_Like Glass'],
  ["Joel's Highfive Blue PETG", '3D Printer Filament', '5.00 - 49.99', 2, true, 'Color_Blue; Community Inspired; Contents_Elastic; Contents_PETG; Feature_Semi Rigid'],
  ['Carbon Fiber PETG', '3D Printer Filament', '5.50 - 179.95', 4, true, 'Color_Black; Contents_Carbon Fiber; Contents_PETG; Feature_Hard (Abrasive); Feature_Rigid'],
  ['Simply White PETG', '3D Printer Filament', '4.00 - 89.99', 3, true, 'Color_White; Contents_PETG; Feature_Semi Rigid; Feature_UV Resistant; Finish_Opaque'],
  ['Simply Black PETG', '3D Printer Filament', '4.00 - 89.99', 3, true, 'Color_Black; Contents_PETG; Feature_Semi Rigid; Feature_UV Resistant; Finish_Opaque'],
  ["Amie's Blood of My Enemies Translucent Red PETG", '3D Printer Filament', '5.00 - 49.99', 3, true, 'Color_Red; Colorful; Community Inspired; Contents_PETG; Feature_Semi Rigid'],
  ["Tom's Tangerine Orange Metallic Gold PETG", '3D Printer Filament', '5.00 - 49.99', 2, true, 'Color_Orange; Community Inspired; Contents_Pearl; Contents_PETG; Feature_Semi Rigid'],
  ['Recycled Carbon Fiber PETG', '3D Printer Filament', '4.00 - 174.95', 3, true, 'Color_Black; Contents_Carbon Fiber; Contents_PETG; Contents_Recycled; Feature_Hard (Abrasive)'],
  ['Black Recycled PETG', '3D Printer Filament', '2.50 - 124.95', 3, false, 'Color_Black; Colorful; Contents_PETG; Contents_Recycled; Feature_Semi Rigid'],
  
  // TPU/TPE
  ['Clear Rigid TPU', '3D Printer Filament', '7.00 - 94.99', 3, false, 'Color_White; Contents_Elastic; Contents_TPE; explore24; Feature_Flexible'],
  ['Clear Flexible TPU', '3D Printer Filament', '7.00 - 89.99', 3, true, 'Color_Clear; Contents_Elastic; Contents_TPE; explore24; Feature_Flexible'],
  ['Black Flexible TPE', '3D Printer Filament', '6.00', 1, false, 'Color_Black; Contents_Elastic; Contents_TPE; explore24; Feature_Flexible'],
  
  // Polyketone
  ['Carbon Fiber Polyketone', '3D Printer Filament', '44.99', 1, false, 'Color_Black; Contents_Carbon Fiber; Contents_POK; Feature_Hard (Abrasive); Feature_Rigid'],
  ['Glass Fiber Polyketone', '3D Printer Filament', '44.99', 1, false, 'Color_Natural; Contents_Glass Fiber; Contents_POK; Feature_Hard (Abrasive); Feature_Rigid'],
];

/**
 * Transform raw data into structured seed products
 */
export const PROTOPASTA_SEED_DATA: ProtoPastaSeedProduct[] = RAW_SEED_DATA.map(([name, type, priceRange, variants, available, tagStr]) => {
  const tags = parseTags(tagStr);
  const { min, max } = parsePrice(priceRange);
  
  return {
    productName: name,
    productType: type,
    priceMin: min,
    priceMax: max,
    variantsCount: variants,
    available: available,
    tags: tags,
    material: extractMaterial(tags),
    productLineKey: determineProductLineKey(name, tags),
    colorFamily: extractColorFamily(tags),
    finishType: determineFinishType(name, tags),
    isAbrasive: isAbrasive(name, tags),
    isConductive: isConductive(name, tags),
    isMultiColor: isMultiColor(name, tags),
  };
}).filter(p => !shouldExcludeProtoPastaProduct(p));

/**
 * Get unique product line keys from seed data
 */
export function getProtoPastaProductLines(): string[] {
  const lines = new Set(PROTOPASTA_SEED_DATA.map(p => p.productLineKey));
  return Array.from(lines).sort();
}

/**
 * Get products count by product line
 */
export function getProtoPastaProductLineStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const product of PROTOPASTA_SEED_DATA) {
    stats[product.productLineKey] = (stats[product.productLineKey] || 0) + 1;
  }
  return stats;
}

// Export summary for logging
console.log(`[Proto-Pasta Seed] Loaded ${PROTOPASTA_SEED_DATA.length} products across ${getProtoPastaProductLines().length} product lines`);

// Post Sync Check Constants

// Brands known to use image-based swatches (product photos) rather than CSS color swatches
// Also includes cross-product swatch brands where each color is a separate product URL
export const IMAGE_SWATCH_BRANDS = [
  '3d-fuel', 'polymaker', 'hatchbox', 'sunlu', 'eryone', 'esun', 'overture', 
  'anycubic', 'azurefilm', 'bambu-lab', 'colorfabb', 'extrudr', 'fillamentum', 
  'geeetech', 'gizmo-dorks', 'ic3d-printers', 'kingroon', 'matter3d', 'ninjatek', 
  'numakers', 'paramount-3d', 'prusament', 'push-plastic', 'recreus', 'siraya-tech', 
  'sovol', 'ziro'
];

// Brands that use product-line level images (same image for all color variants)
// Skip Image URLs Valid check for these - some servers return 404 for HEAD requests
export const PRODUCT_LEVEL_IMAGE_BRANDS = [
  'ninjatek', 'kingroon', 'gizmo-dorks', 'numakers', 'overture', 'paramount-3d', 
  'proto-pasta', 'prusament', 'push-plastic', 'siraya-tech', 'sovol', 'sunlu', 
  'treed-filaments', 'ultimaker'
];

// Brands that use CSV-seeded sync and should skip certain checks
export const CSV_SEEDED_BRANDS = [
  'eryone', 'esun', 'extrudr', 'fillamentum', 'formfutura', 'geeetech', 
  'gizmo-dorks', 'hatchbox', 'colorfabb', 'fiberlogy', 'fusion-filaments', 
  'ic3d-printers', 'kingroon', 'matter3d', 'ninjatek', 'numakers', 'overture', 
  'paramount-3d', 'proto-pasta', 'prusament', 'push-plastic', 'recreus', 
  'siraya-tech', 'sunlu', 'treed-filaments', 'ultimaker', 'voxelpla', 'ziro'
];

// Brands known to block Firecrawl/scrapers (redirect to cart, captcha, etc.)
export const SCRAPER_BLOCKED_BRANDS = ['3dhojor'];

// Page titles that indicate the scraper was blocked (not real title mismatches)
export const SCRAPER_BLOCKED_TITLES = [
  'shopping cart',
  'access denied',
  'please verify',
  'captcha',
  'robot',
  '403 forbidden',
  'blocked',
  'verification required',
  'just a moment',
  'cloudflare',
];

// Words to filter out when extracting color names (NOT actual colors)
export const NON_COLOR_WORDS = new Set([
  // Material types
  'pla', 'pla+', 'petg', 'pctg', 'abs', 'asa', 'tpu', 'nylon', 'hips', 'pc', 'pa', 'cf', 'gf',
  // Product terms
  'filament', 'spool', 'standard', 'pro', 'silk', 'tough', 'dual', 'color', 'dual-color',
  'workday', 'refuel', 'biome3d', 'buzzed', 'entwined', 'wound', 'landfillament',
  // Size/weight terms
  '1.75mm', '2.85mm', '1kg', '500g', '750g', '250g', 'kg', 'mm', 'spool',
  // Brand terms  
  '3d-fuel', '3dfuel', 'polymaker', 'hatchbox', 'sunlu', 'eryone', 'overture', 'amolen',
  // Generic terms
  'buy', 'add', 'cart', 'shop', 'view', 'select', 'choose', 'now', 'new', 'sale',
  // Product features/packaging
  'vacuum', 'bags', 'bag', 'matte', 'surface', 'texture', 'finish',
  'glossy', 'shiny', 'package', 'packaging', 'roll',
  'printing', 'print', 'printer', '3d', 'quality',
  'material', 'diameter', 'weight', 'net', 'gross', 'tolerance',
  'temperature', 'nozzle', 'bed', 'settings', 'recommended',
  'uv', 'change', 'glow', 'dark', 'flexible', 'basic',
]);

// Product line synonyms for title matching
export const PRODUCT_LINE_SYNONYMS: Record<string, string[]> = {
  'entwined': ['entwined hemp', 'entwined v2hemp', 'entwined v2 hemp'],
  'pet-cf': ['petcf', 'pet cf'],
  'pla-cf': ['placf', 'pla cf'],
  'dual color silk': ['dual-color silk', 'dual color silk pla', 'dual-color-silk-pla'],
};

// Brands that use product-level images (logo/shared images) - skip logo check
export const PRODUCT_LEVEL_IMAGE_BRANDS_LOGO_CHECK = [
  'sunlu', 'treed-filaments', 'ultimaker', 'ziro'
];

// Brands to skip title accuracy check (CSV-seeded with curated titles)
export const SKIP_TITLE_CHECK_BRANDS = [
  'eryone', 'esun', 'extrudr', 'fillamentum', 'formfutura', 'geeetech', 
  'gizmo-dorks', 'hatchbox', 'colorfabb', 'fiberlogy', 'fusion-filaments', 
  'ic3d-printers', 'kingroon', 'matter3d', 'ninjatek', 'numakers', 'overture', 
  'paramount-3d', 'proto-pasta', 'prusament', 'push-plastic', 'recreus', 
  'siraya-tech', 'sunlu', 'treed-filaments', 'ultimaker', 'voxelpla', 'ziro'
];

// Brands to skip color name matching check
export const SKIP_COLOR_NAME_CHECK_BRANDS = [
  'eryone', 'esun', 'extrudr', 'fillamentum', 'formfutura', 'geeetech', 
  'gizmo-dorks', 'hatchbox', 'colorfabb', 'fiberlogy', 'fusion-filaments', 
  'ic3d-printers', 'kingroon', 'matter3d', 'ninjatek', 'numakers', 'overture', 
  'paramount-3d', 'proto-pasta', 'prusament', 'push-plastic', 'recreus', 
  'siraya-tech', 'sunlu', 'treed-filaments', 'ultimaker', 'voxelpla', 'ziro'
];

// Brands to skip hex color validation check
export const SKIP_HEX_COLOR_CHECK_BRANDS = [
  'eryone', 'esun', 'extrudr', 'fillamentum', 'formfutura', 'geeetech', 
  'gizmo-dorks', 'hatchbox', 'colorfabb', 'fiberlogy', 'fusion-filaments', 
  'ic3d-printers', 'kingroon', 'matter3d', 'ninjatek', 'numakers', 'overture', 
  'paramount-3d', 'proto-pasta', 'prusament', 'push-plastic', 'recreus', 
  'siraya-tech', 'sunlu', 'treed-filaments', 'ultimaker', 'voxelpla', 'ziro'
];

// Brands where each color variant has its own product URL (cross-product architecture)
export const CROSS_PRODUCT_URL_BRANDS = [
  '3d-fuel', 'polymaker', 'hatchbox', 'sunlu', 'eryone', 'esun', 'overture',
  'anycubic', 'azurefilm', 'bambu-lab', 'colorfabb', 'extrudr', 'fillamentum',
  'geeetech', 'gizmo-dorks', 'ic3d-printers', 'kingroon', 'matter3d', 'ninjatek',
  'numakers', 'paramount-3d', 'prusament', 'push-plastic', 'recreus', 'siraya-tech',
  'sovol', 'treed-filaments', 'ultimaker', 'voxelpla', 'ziro'
];

// Brands to skip color count matching check (website shows non-color variants like regions)
export const SKIP_COLOR_COUNT_CHECK_BRANDS = [
  'sunlu', 'kingroon', 'ziro'
];

// Brands to skip price validity check (premium materials, unusual pricing)
export const SKIP_PRICE_CHECK_BRANDS = [
  'treed-filaments', 'colorfabb', 'fillamentum', 'extrudr', 'ninjatek',
  'matter3d', 'kingroon', 'numakers', 'overture', 'push-plastic', 'recreus',
  'spectrum', 'prusament', 'proto-pasta', 'ultimaker'
];

// Expected card counts for brands (number of product lines)
export const EXPECTED_CARD_COUNTS: Record<string, number> = {
  'atomic': 6,
  'azurefilm': 20,
  'bambu-lab': 18,
  'colorfabb': 24,
  'eryone': 25,
  'esun': 45,
  'extrudr': 15,
  'fillamentum': 22,
  'fiberlogy': 18,
  'geeetech': 15,
  'gizmo-dorks': 8,
  'hatchbox': 17,
  'ic3d-printers': 11,
  'kingroon': 17,
  'matter3d': 15,
  'ninjatek': 10,
  'numakers': 13,
  'overture': 15,
  'paramount-3d': 11,
  'polymaker': 30,
  'proto-pasta': 25,
  'prusament': 18,
  'push-plastic': 16,
  'recreus': 14,
  'siraya-tech': 12,
  'spectrum': 35,
  'sunlu': 18,
  'treed-filaments': 70,
  'ultimaker': 30,
  'voxelpla': 3,
  'ziro': 30, // 30 product lines expected from Ziro
};

// Product lines that legitimately have only 1 color variant (not a sync error)
// These are effect-based or specialty products where the effect IS the product
export const SINGLE_VARIANT_PRODUCT_LINES = [
  // Ziro single-variant product lines
  'ziro__pla__rainbow-glow',
  'ziro__pla__stone-blue-white',
  'ziro__pla__marble',
  'ziro__pla__straw-fiber',
  // Sunlu single-variant product lines
  'sunlu__pla-marble__standard',
  'sunlu__pla-galaxy__standard',
  'sunlu__pa-cf__standard',
  'sunlu__petg-cf__standard',
  // VoxelPLA Galaxy is a separate product line
  'voxelpla__petg__galaxy',
  // Other brands with specialty single-color lines
  'hatchbox__pla__stone',
  'hatchbox__pla-cf__standard',
];

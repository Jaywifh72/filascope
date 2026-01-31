// Brand-specific configuration for Post Sync Check
// Split from main index.ts to reduce file size

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
  'shopping cart', 'access denied', 'please verify', 'captcha', 'robot',
  '403 forbidden', 'blocked', 'verification required', 'just a moment', 'cloudflare',
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

// Brands where URL consistency check should be skipped (cross-product swatch architecture)
export const SKIP_URL_CHECK_BRANDS = [
  'polymaker', 'hatchbox', '3d-fuel', 'push-plastic', 'proto-pasta', 
  'prusament', 'spectrum-filaments', 'atomic-filament', 'recreus'
];

// Brands where title check should be skipped (non-standard title formats)
export const SKIP_TITLE_CHECK_BRANDS = ['bambu-lab', 'formfutura', 'extrudr'];

// Brands where hex validation should be skipped (curated color mappings)
export const SKIP_HEX_CHECK_BRANDS = [
  'hatchbox', 'sunlu', 'recreus', 'spectrum-filaments', 
  'siraya-tech', 'atomic-filament', 'push-plastic'
];

// Brands where price check should be skipped (complex multi-region pricing)
export const SKIP_PRICE_CHECK_BRANDS = ['sunlu', 'recreus', 'formfutura', 'extrudr'];

// Brand-specific sync documentation for admin UI
// Documents exclusions, special behaviors, and filtering rules

export interface BrandSyncDoc {
  exclusions?: Array<{
    name: string;
    reason: string;
  }>;
  specialBehaviors?: Array<{
    name: string;
    description: string;
  }>;
  notes?: string[];
}

export const BRAND_SYNC_DOCS: Record<string, BrandSyncDoc> = {
  '3d-fuel': {
    exclusions: [
      { name: 'All ReFuel Products', reason: 'Recycled material with no color selection (mystery-color)' },
      { name: 'Protosthetics PETG Natural', reason: 'Non-consumer facing product' },
      { name: 'Entwined v2Hemp Natural', reason: 'Excluded from consumer catalog' },
      { name: '3D Clean', reason: 'Cleaning compound, not a filament' },
    ],
    specialBehaviors: [
      { name: 'Cross-Product Swatch Architecture', description: 'Each color is a separate product URL. Swatches are links to other products.' },
      { name: 'Title-Based Product Line Detection', description: 'Handles rebrandings (Pro PLA → Tough Pro PLA+) via title matching.' },
      { name: 'Hex Code Extraction', description: 'Extracts exact hex codes (e.g., #F3E2C7) from product titles.' },
      { name: 'Island Fuschia Typo Handling', description: 'Maps manufacturer typo "fuschia" to correct hex #C54B8C.' },
    ],
  },
  
  'sunlu': {
    specialBehaviors: [
      { name: 'High-Speed Meta Lines', description: 'Detects Meta PLA/PETG as high_speed_capable materials.' },
      { name: 'Regional Warehouse Filtering', description: 'Handles US, EU, CA warehouse availability.' },
      { name: 'Consolidated TDS', description: 'Uses single Sunlu Filament Guide PDF for all products.' },
    ],
    notes: [
      'Supports 25+ material types including E-ABS and PEEK',
      'Handles weights from 250g to 10kg',
    ],
  },
  
  'elegoo': {
    exclusions: [
      { name: 'Neptune/Saturn/Mars Printers', reason: 'Non-filament products (3D printers)' },
      { name: 'Resin Products', reason: 'Non-FDM materials' },
      { name: 'Dryers & Accessories', reason: 'Non-filament equipment' },
    ],
    specialBehaviors: [
      { name: 'Filament-Only Filtering', description: 'Validates products against FILAMENT_KEYWORDS and NON_COLOR_BLOCKLIST.' },
      { name: 'Regional Catalog Support', description: 'Syncs DE, IT, FR, ES markets with Impact.com catalog IDs.' },
    ],
    notes: [
      'Has dedicated sync tab with region selection',
    ],
  },
  
  'polymaker': {
    specialBehaviors: [
      { name: 'Brand Rebranding Logic', description: 'Handles PolyTerra→Panchroma, PolyMide→Fiberon rebrandings.' },
      { name: 'SKU-Based Data Extraction', description: 'Extracts HEX codes and Transmission Distance from SKUs.' },
      { name: 'Multi-Pattern TDS Discovery', description: 'Checks Shopify CDN and legacy WordPress paths for TDS URLs.' },
      { name: 'Regional Store Sync', description: 'Supports US (us.polymaker.com) and CA (ca.polymaker.com) markets.' },
    ],
    notes: [
      'Approx. 45 product lines across 5 families',
      'Cross-product swatch architecture',
    ],
  },
  
  'hatchbox': {
    specialBehaviors: [
      { name: 'Rich Sync Results Reference', description: 'Reference implementation for per-product tracking and field coverage.' },
      { name: 'PLA MAX Detection', description: 'Normalizes PLA MAX as distinct product line.' },
      { name: 'Reload Line Support', description: 'Handles Reload recycled product line.' },
    ],
    notes: [
      'Shopify API-based pipeline (not Amazon)',
    ],
  },
  
  'formfutura': {
    specialBehaviors: [
      { name: 'Complex Variant Matrix', description: 'Handles Diameter × Color × Weight × Format combinations.' },
      { name: 'ReFill Detection', description: 'Detects ReFill and Bambu Coil formats (sets is_refill: true).' },
      { name: 'RAL Color Mapping', description: 'Maps RAL-style color codes to hex values.' },
      { name: 'EUR→USD Conversion', description: 'Converts prices at 1.08 rate.' },
    ],
    notes: [
      '25+ product lines including EasyFil, ApolloX, HDglass',
      'Flags Volcano PLA as high_speed_capable',
    ],
  },
  
  'spectrum-filaments': {
    specialBehaviors: [
      { name: 'High-Capacity Batch Processing', description: 'Processes 1,170+ products in batches of 100.' },
      { name: 'ReFill Eco-Spool Detection', description: 'Identifies cardboard-based eco spools.' },
      { name: 'RAL Color Mapping', description: 'Maps ~100 colors using RAL codes.' },
      { name: 'Dual Diameter Support', description: 'Handles both 1.75mm and 2.85mm variants.' },
    ],
    notes: [
      '30+ engineering and aesthetic material families',
      'IdoSell platform with extended scrape times',
    ],
  },
  
  'treed-filaments': {
    specialBehaviors: [
      { name: 'Italian Color Translation', description: 'Translates Italian color names to English.' },
      { name: 'SKU-Based TDS Discovery', description: 'Constructs TDS URLs from SKU patterns.' },
    ],
    notes: [
      '15+ industrial polymers including PEEK, PPS',
      'Vendor name standardized as "TreeD"',
    ],
  },
  
  'ic3d-printers': {
    specialBehaviors: [
      { name: 'Made in USA Flag', description: 'Sets domestic manufacturing status.' },
      { name: 'Recycled Material Detection', description: 'Sets is_recycled flag for eco materials.' },
    ],
    notes: [
      '10 product lines including IM-PLA, R-PETG, PolyHex',
    ],
  },
  
  'overture': {
    specialBehaviors: [
      { name: 'Specialty Flags', description: 'Sets is_foaming (Air PLA), is_tough (Super PLA+, Rock PETG), high_speed_capable (HS TPU).' },
    ],
    notes: [
      '15+ product lines with stable Shopify IDs',
      '100% color/image coverage',
    ],
  },
  
  'paramount-3d': {
    specialBehaviors: [
      { name: 'Finish Type Enrichment', description: 'Detects Stone and Shimmer finishes.' },
      { name: 'Themed Color Mapping', description: '60+ colors including pop culture, military, and skin tones.' },
    ],
    notes: [
      'Enrichment sync (updates existing records)',
      'Uses 3 verified material-specific TDS PDFs',
    ],
  },
  
  'cc3d': {
    specialBehaviors: [
      { name: 'WooCommerce Multi-Category Scrape', description: 'Scrapes 18 category pages from cc3dglobal.com.' },
      { name: 'Material Normalization', description: 'Normalizes PLA MAX→PLA+, PA→Nylon.' },
      { name: 'Specialty Detection', description: 'Detects Ceramic, Metal, Marble, ColorChange finishes.' },
    ],
    notes: [
      'USD pricing only',
      'No TDS documents available',
    ],
  },
  
  'geeetech': {
    specialBehaviors: [
      { name: 'OpenCart Scrape', description: 'Firecrawl HTML pipeline for custom PHP platform.' },
      { name: 'URL Numeric IDs', description: 'Uses URL numeric IDs as product_ids.' },
    ],
    notes: [
      '12+ lines including ASA, ABS+, HS-PLA',
      'No TDS documents available',
    ],
  },
  
  '3dxtech': {
    exclusions: [
      { name: 'Nozzles & Accessories', reason: 'Non-filament products' },
      { name: 'Pellets (25kg)', reason: 'Industrial pellet feedstock' },
      { name: '2.85mm Diameter Variants', reason: 'Non-standard diameter (1.75mm only)' },
      { name: '10kg Bulk Spools', reason: 'Exceeds consumer spool limit (>5.5kg)' },
    ],
    specialBehaviors: [
      { name: 'Premium Material Small Spools', description: 'PEEK/PEKK/PEI/CeramiX 250g spools bypass sample filter due to high material cost ($200-$525).' },
      { name: 'TRITON Series Separation', description: 'Stratasys-compatible TRITON products grouped separately from standard materials.' },
      { name: 'Industrial Pricing Valid', description: 'High prices are normal for premium polymers (PEEK, PEKK, PEI, ESD materials).' },
      { name: 'ESD Material Detection', description: '3DXSTAT line flagged as static-dissipative with is_conductive property.' },
      { name: 'Composite Material Flags', description: 'CarbonX (CF) and FibreX (GF) flagged as is_nozzle_abrasive.' },
    ],
    notes: [
      'Premium industrial manufacturer - aerospace/electronics focus',
      '40+ material types including high-performance polymers',
      'US-based manufacturing with extensive TDS library',
    ],
  },
};

// Shared filter rules applied to ALL brands
export const SHARED_FILTER_RULES = [
  { name: 'Sample Products', description: 'Excluded if weight < 300g' },
  { name: 'Bulk Spools', description: 'Excluded if weight > 5.5kg' },
  { name: 'Non-Standard Diameters', description: 'Excluded if 2.85mm or 3.0mm' },
];

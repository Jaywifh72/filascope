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
  
  '3dhojor': {
    specialBehaviors: [
      { name: 'Unicode Sanitization', description: 'Aggressively cleans invisible Unicode characters from Shopify data.' },
      { name: 'Scraper Block Detection', description: 'Skipped by Post Sync Check due to anti-bot protection.' },
    ],
    notes: [
      'Known to block web scrapers - validation skipped',
      'Shopify API pipeline for data extraction',
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
      { name: 'V2 Version Preference', description: 'Skips legacy Obsidian V1 products when V2 exists.' },
    ],
    notes: [
      'Premium industrial manufacturer - aerospace/electronics focus',
      '40+ material types including high-performance polymers',
      'US-based manufacturing with extensive TDS library',
    ],
  },
  
  'amolen': {
    exclusions: [
      { name: 'Variety/Sample Packs', reason: 'Multi-color bundles excluded by global filter' },
      { name: 'Delivery Option Duplicates', reason: 'Only China-to-US variant synced (consistent pricing)' },
      { name: 'Non-Filament Accessories', reason: 'Dryers, nozzles, storage bags excluded' },
      { name: 'Default Title Variants', reason: 'Filtered as invalid color name' },
    ],
    specialBehaviors: [
      { name: 'Material-First Detection', description: 'TPU/PETG detected BEFORE glow/specialty patterns to prevent cross-material issues.' },
      { name: 'TPU Glow/Rainbow Separation', description: 'TPU Glow-in-Dark and TPU Rainbow have their own product_line_ids.' },
      { name: 'PETG Rainbow Separation', description: 'PETG Rainbow products grouped separately from PETG Transparent.' },
      { name: 'High-Speed Dual Separation', description: 'PLA Basic Dual Color High-Speed separate from PLA Basic High-Speed.' },
      { name: 'High-Speed Line Separation', description: 'PLA+ High-Speed and PLA High-Speed are separate product_line_ids.' },
      { name: 'Carbon Fiber Variety Pack', description: 'CF packs grouped as amolen__pla-cf__variety-pack, not with standard CF.' },
      { name: 'Delivery Option Filtering', description: 'Skips US-to-US variants, prefers China-to-US for international pricing.' },
      { name: 'Granular Silk Lines', description: 'S-Series, Dual, Triple, Rainbow, Galaxy all have distinct product_line_ids.' },
      { name: 'PEBA Separation', description: 'PEBA 90A flexible material always separate from PLA products.' },
      { name: 'Title Artifact Cleaning', description: 'Removes ", / -" patterns from constructed titles.' },
      { name: 'Prioritized Hex Lookup', description: 'Partial matching ensures distinct colors resolve correctly (longest match first).' },
    ],
    notes: [
      'Shopify API-based pipeline',
      'Uses actual Shopify product titles (not constructed)',
      '30+ product lines including TPU Glow/Rainbow variants',
      'Priority color matching (longest match first)',
    ],
  },
  
  'anycubic': {
    exclusions: [
      { name: 'Promotional Bundles', reason: 'Buy 2 Get 1, Flash Sale, Christmas Box variants filtered from product IDs and titles' },
      { name: 'Non-Filament Products', reason: 'Filament Hub accessories, prize claims, dryers excluded via ANYCUBIC_NON_FILAMENT_SLUGS' },
      { name: 'Non-Standard Sizes', reason: '2.85mm diameter and non-consumer weights excluded' },
    ],
    specialBehaviors: [
      { name: 'H1 Title Priority (Critical)', description: 'Product titles MUST be scraped from the <h1> tag on the Buy Now page URL. Shopify JSON title is never used. Whitelist displayName is fallback only if scrape fails.' },
      { name: 'Whitelist-Only Architecture', description: '19 official product lines defined in ANYCUBIC_PRODUCT_WHITELIST. Only these products are synced.' },
      { name: 'Multi-Region Fallback', description: 'US store checked first, then CA store for products like PETG and PLA Special that are CA-only.' },
      { name: 'Scraped Color Swatches', description: 'Colors extracted from page HTML (data-option-value, fieldset) rather than Shopify variant titles.' },
      { name: 'Product Line ID Generation', description: 'Uses productLineSlug from whitelist (e.g., pla-high-speed → anycubic__plahighspeed).' },
      { name: 'Promotional Text Stripping', description: 'Flash Sale, Buy X Get Y, Christmas Sale text stripped from titles and IDs.' },
    ],
    notes: [
      'CRITICAL: product_title must match page <h1> exactly - this is the "Names Match" consistency rule',
      'Firecrawl HTML scraping used for display titles and color swatches',
      'Shopify JSON API used only for variant metadata (prices, availability, images)',
      'Whitelist URL field is the canonical "Buy Now" page for title verification',
    ],
  },
  
  'atomic-filament': {
    exclusions: [
      { name: 'Sample Coils', reason: 'Products with "Sample Coil" in title - small test quantities excluded via isAtomicSampleProduct()' },
      { name: 'Sample Coil Packs', reason: 'Multi-sample variety packs (e.g., NEON Sample Pack)' },
      { name: 'Short Spools (70% min)', reason: 'Partial/clearance spools excluded via isAtomicNonFilamentProduct()' },
      { name: '10-Pack Bundles', reason: 'Bulk multi-packs (e.g., 10 Pack Carbon Fiber PLA) excluded' },
      { name: '3.5KG Jumbo Rolls', reason: 'Bulk variants linked separately from standard 1KG products' },
      { name: '2.85mm Diameter', reason: 'Non-standard diameter separated from 1.75mm products via is285mmDiameter()' },
      { name: 'Brand Shirts', reason: 'Non-filament merchandise (t-shirts, apparel) detected via isAtomicNonFilamentProduct()' },
      { name: 'Empty AMS Spools', reason: 'Non-filament accessories (AMS Compatible Spool--Empty)' },
    ],
    specialBehaviors: [
      { name: 'H1 Title Priority (Critical)', description: 'Product titles MUST be scraped from the <h1> tag on the product page URL. Shopify JSON title is never used.' },
      { name: 'Pre-Filter Cleanup', description: 'Sync function deletes non-filament products from DB before processing using isAtomicNonFilamentProduct() and isAtomicSampleProduct().' },
      { name: 'Collection-Based Discovery', description: 'Products discovered from 5 material collection URLs (PLA, PETG, ABS, ASA, PLA Silk).' },
      { name: 'Per-Color Product Pages', description: 'Each color variant is a separate product URL. Multiple URLs per product_line_id is EXPECTED behavior.' },
      { name: 'US-Made Focus', description: 'All products manufactured in Indiana, USA.' },
      { name: 'Specialty Color Mapping', description: 'Unique color names (Illusion Cherry, Mysterious Abyss, Chameleon Coastline, Bug Eyes) mapped to hex values.' },
      { name: 'AMS Compatible Variants', description: 'Most 1KG spools labeled as AMS Compatible in title.' },
      { name: 'Carbon Fiber Separation', description: 'CF-PLA, CF-PETG, CF-ABS, CF-ASA have separate product_line_ids.' },
      { name: 'MeltMiser Line', description: 'Premium high-temp products grouped under meltmiser product_line_id.' },
      { name: 'PETG Pro Line', description: 'PETG Pro products grouped separately from standard PETG.' },
    ],
    notes: [
      'CRITICAL: product_title must match page <h1> exactly - this is the "Names Match" consistency rule',
      'Firecrawl HTML scraping used for display titles from product pages',
      'Shopify JSON API used only for variant metadata (prices, availability, images)',
      'Collection URLs are the canonical source for product discovery',
      '5 official material collections: PLA, PETG, ABS, ASA, PLA Silk',
      'URL Consistency check shows multiple URLs per product_line - this is EXPECTED for Atomic architecture',
    ],
  },
  
  'azurefilm': {
    exclusions: [
      { name: '2.85mm Diameter Variants', reason: 'Non-standard diameter (1.75mm only) via is285mmDiameter()' },
      { name: 'Sample Products (<300g)', reason: 'Small test quantities excluded via shouldIncludeVariant() - "Sample" in title defaults to 50g' },
      { name: 'Bulk Products (>5.5kg)', reason: 'Industrial bulk spools excluded via MAX_WEIGHT_GRAMS' },
      { name: 'N-Pack Products', reason: 'Multi-pack bundles (10-pack, 4-pack) detected as N x 1000g, excluded as bulk or via isAzureFilmNonFilament()' },
      { name: 'SUPER PACK Products', reason: 'Bundle products excluded via /super\\s*pack/i pattern in NON_FILAMENT_PATTERNS' },
      { name: 'Magnets & Accessories', reason: 'Non-filament products excluded via /magnet/i and other NON_FILAMENT_PATTERNS' },
      { name: '3D Pens & Gift Cards', reason: 'Non-filament products excluded via isAzureFilmNonFilament()' },
      { name: 'Unlisted Categories', reason: 'Only 8 whitelisted categories synced (ABS, ASA, CF, PCTG, PETG, PLA, LumberLay, Support)' },
    ],
    specialBehaviors: [
      { name: 'Category-Based Discovery', description: 'Products discovered from 8 whitelisted category URLs, not site-wide mapping.' },
      { name: 'H1 Title Priority', description: 'Product titles scraped from <h1> tag on product page via Firecrawl.' },
      { name: 'EUR→USD Conversion', description: 'Converts prices at 1.08 rate from European store.' },
      { name: 'WooCommerce Platform', description: 'Firecrawl HTML pipeline for WooCommerce store (not Shopify).' },
      { name: 'Safe Delete Pattern', description: 'Requires 50+ products discovered before clean slate deletion.' },
      { name: 'Material-Based Product Line IDs', description: 'Groups by material and line (e.g., azurefilm__pla__original, azurefilm__petg__standard).' },
      { name: 'Color Extraction from Title', description: 'Extracts color name from product title suffix.' },
      { name: 'Carbon Fiber Material Detection', description: 'CF products normalized to appropriate base material (PAHT-CF, PLA-CF, PETG-CF).' },
      { name: 'LumberLay Wood Filament', description: 'Wood-composite materials categorized under LumberLay product line.' },
      { name: 'Support Material Detection', description: 'PVA and BVOH support materials properly categorized.' },
    ],
    notes: [
      'European manufacturer based in Slovenia',
      'WooCommerce platform (corrected from Shopify)',
      '8 category whitelist: ABS, ASA, Carbon Fiber, PCTG, PETG, PLA, LumberLay, Support',
      'Firecrawl HTML scraping for product discovery and title extraction',
      'URL Consistency check skipped (cross-product swatch architecture)',
      'Expected ~18-20 product line cards in UI (distinct lines: Plus, Prime, HS, Original, Silk, etc.)',
    ],
  },
  
  'bambu-lab': {
    exclusions: [
      { name: 'MakerWorld Models', reason: 'Non-filament products (clock kit, door stopper, coaster holder) filtered via nonColorPhrases in isValidColorName()' },
      { name: 'Promotional Bundles', reason: 'Refill bundles and multi-packs excluded from product_line_id generation' },
    ],
    specialBehaviors: [
      { name: 'S5 Product Gallery Images (CRITICAL)', description: 'Featured images MUST use S5 CDN URLs (store.bblcdn.com/s5/) NOT S7 swatch thumbnails (store.bblcdn.com/s7/). S5 images are 1920px full product photos, S7 are ~50px color swatches.' },
      { name: 'S5 Images Are JS-Loaded', description: 'S5 gallery images are loaded dynamically via JavaScript when clicking a color swatch. They CANNOT be scraped from static HTML. Must use hardcoded S5_PRODUCT_IMAGES mapping.' },
      { name: 'S5_PRODUCT_IMAGES Mapping', description: 'Hardcoded mapping in sync-bambulab-products/index.ts maps product slugs and colors to verified S5 gallery URLs. This is the PRIMARY source for featured_image.' },
      { name: 'Manual S5 Extraction Process', description: '1) Open product page in browser, 2) Click color swatch, 3) Right-click main product image → Copy Image Address, 4) Add GUID to S5_PRODUCT_IMAGES constant.' },
      { name: 'Next.js Platform', description: 'Bambu Lab uses custom Next.js, not Shopify. Product data is in __NEXT_DATA__ JSON embedded in page HTML.' },
      { name: 'Color Selector Pattern', description: 'Colors extracted from <li value="ColorName (SKU)"> elements with rounded-full CSS class. SKU in parentheses is stripped.' },
      { name: 'ABS Hardcoded Fallback', description: 'ABS product uses hardcoded S5_PRODUCT_IMAGES["abs-filament"] map with all 12 verified S5 gallery URLs.' },
      { name: 'Product Line ID Format', description: 'Uses bambulab__material__line format (e.g., bambulab__pla__silk, bambulab__petg__hf, bambulab__asa__aero).' },
      { name: 'H1 Title Priority', description: 'Product titles scraped from <h1> tag on product page. Base title stored without color suffix.' },
      { name: 'USD Pricing', description: 'Uses us.store.bambulab.com for USD prices and product discovery.' },
      { name: 'Firecrawl HTML Scraping', description: '5-second waitFor for JS content to load. Both HTML and markdown formats requested.' },
      { name: 'Variant-Specific Buy Now URLs (NEW)', description: 'Each color variant stores its own product_url with ?id=VARIANT_ID parameter. This ensures Buy Now buttons open directly to the selected color, not the default variant.' },
      { name: 'BAMBULAB_VARIANT_IDS Mapping', description: 'Hardcoded mapping in update-bambulab-urls/index.ts maps product slugs and color names to Bambu Lab variant IDs. Run this function after sync to backfill URLs.' },
      { name: 'Variant ID Format', description: 'URLs use format: us.store.bambulab.com/products/{slug}?id={variant_id}. Variant IDs are 17-digit numeric strings (e.g., 43115681841392).' },
      { name: 'PRODUCT_LINE_SLUG_MAP Format', description: 'Maps product_line_id (bambulab__material__variant) to product slugs. Keys use double underscores matching database format.' },
    ],
    notes: [
      'CRITICAL: S5 images are JS-loaded and cannot be scraped. Use S5_PRODUCT_IMAGES hardcoded mapping!',
      'S5 CDN URLs: store.bblcdn.com/s5/default/GUID.jpg__op__resize,m_lfit,w_1920...',
      'S7 CDN URLs: store.bblcdn.com/s7/default/GUID/filename.png (DO NOT USE - tiny thumbnails)',
      'Currently only ABS filament has verified S5 images. Other product lines need manual extraction.',
      'Post Sync Check will flag product lines using S7 swatch images instead of S5 gallery images.',
      '39 product lines across PLA, PETG, ABS, ASA, TPU, PA, PC, PPS, PVA materials',
      'Safe delete threshold: 30 products minimum before clean slate deletion',
      'Specialty materials (CF, GF, Support, PVA) are single-color products - whitelisted in variant count check',
      'Variant URLs: Each color variant has its own product_url with ?id= parameter for direct Buy Now linking',
      'Run update-bambulab-urls edge function after clean slate sync to backfill variant URLs',
      '~250 color variants have mapped variant IDs covering all major product lines',
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
  
  'colorfabb': {
    specialBehaviors: [
      { name: 'Dutch Manufacturer', description: 'European origin with specialty materials focus.' },
      { name: 'Specialty Material Detection', description: 'Identifies nGen, HT, XT copolyester lines.' },
      { name: 'Woodfill/Bronzefill Detection', description: 'Composite materials flagged as abrasive.' },
    ],
    notes: [
      'Premium European manufacturer',
      'Known for specialty composites and copolyesters',
    ],
  },
  
  'creality': {
    specialBehaviors: [
      { name: 'Hyper Series Detection', description: 'Hyper PLA/PETG flagged as high_speed_capable.' },
      { name: 'Ender Fast Line', description: 'Economy high-speed materials.' },
      { name: 'Stardust Finish Detection', description: 'Maps Stardust colors to Sparkle finish type.' },
      { name: 'Firecrawl HTML Pipeline', description: 'Shopify JSON API blocked - uses HTML scraping.' },
    ],
    notes: [
      'store.creality.com Shopify store',
      '12+ product lines',
      'TDS URLs from download.creality.com',
    ],
  },
  
  'duramic-3d': {
    specialBehaviors: [
      { name: 'Budget Line Focus', description: 'Consumer-focused affordable materials.' },
    ],
    notes: [
      'Shopify API pipeline',
      'Economy brand positioning',
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
      { name: 'Regional Catalog Support', description: 'Syncs DE, IT, FR, ES, UK, AU, CA, JP markets with Impact.com catalog IDs.' },
      { name: 'Dedicated Admin Tab', description: 'Uses custom ElegooProductManager component with region selection.' },
      { name: 'Any-Region Product Creation', description: 'Products created from first available region (not US-only).' },
      { name: 'URL Validation Safeguards', description: 'Multi-layer validation prevents regional URL contamination.' },
    ],
    notes: [
      'Impact.com affiliate catalog integration',
      'Has dedicated sync tab in admin UI',
      'Regional pricing consolidated to price_eur for EU markets',
    ],
  },
  
  'eryone': {
    specialBehaviors: [
      { name: 'Color Swatch Architecture', description: 'Shopify variant-based color swatches.' },
      { name: 'Silk Line Detection', description: 'Identifies Silk, Dual-Color, Tri-Color variants.' },
    ],
    notes: [
      'Shopify API pipeline',
      'Popular budget brand',
    ],
  },
  
  'esun': {
    specialBehaviors: [
      { name: 'Material Range', description: 'Wide material catalog including engineering grades.' },
      { name: 'eSilk Detection', description: 'Maps eSilk products to Silk finish type.' },
    ],
    notes: [
      'Major Chinese manufacturer',
      'Extensive material library',
    ],
  },
  
  'extrudr': {
    specialBehaviors: [
      { name: 'Next.js Platform Scraping', description: 'Firecrawl HTML pipeline for custom platform.' },
      { name: 'TPU Shore Hardness Normalization', description: 'Maps 88A, 92A, 98A Shore grades.' },
      { name: 'EUR→USD Conversion', description: 'Converts prices at 1.08 rate.' },
      { name: 'Cardboard Spool Material', description: 'Sets spool_material to "Cardboard".' },
      { name: 'EAN Barcode Extraction', description: 'Extracts EAN codes from product data.' },
    ],
    notes: [
      '25+ product lines including BioFusion, GreenTEC, DuraPro',
      'Austrian manufacturer',
      'ESD conductive materials available',
    ],
  },
  
  'fiberlogy': {
    specialBehaviors: [
      { name: 'WooCommerce Scraping', description: 'Firecrawl HTML pipeline for ShopArena platform.' },
      { name: 'Diameter Variant Handling', description: 'Separates 1.75mm and 2.85mm products.' },
      { name: 'Spec Extraction', description: 'Parses "Recommendations and tips" HTML sections.' },
    ],
    notes: [
      'Polish manufacturer',
      'Engineering and aesthetic materials',
    ],
  },
  
  'fillamentum': {
    specialBehaviors: [
      { name: 'Dual Store Sync', description: 'Syncs shop.fillamentum.com and fillamentumusa.com (USD priority).' },
      { name: 'Unique Material Normalization', description: 'Vinyl 303 → PVC normalization.' },
      { name: 'Extensive Color Mapping', description: '~60 unique colors including Traffic Black, Vertigo Grey.' },
      { name: 'Finish Capitalization Fix', description: 'Normalizes finish_type casing.' },
    ],
    notes: [
      '20+ lines including Extrafill, Flexfill, NonOilen',
      '100% TDS/color coverage',
      'Standard 750g spool weight',
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
  
  'fusion-filaments': {
    specialBehaviors: [
      { name: 'HT-PET Material Fix', description: 'Normalizes HT-PET to PETG (corrects legacy TPE miscategorization).' },
      { name: 'Science Color Themes', description: 'Maps Carbon Rod Black, Radioactive Orange, etc.' },
      { name: 'SKU-Based Product IDs', description: 'Uses SKUs for stable product identification.' },
    ],
    notes: [
      'Odoo platform with Firecrawl HTML pipeline',
      '11 product lines',
      'Cardboard spool material',
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
  
  'gizmo-dorks': {
    specialBehaviors: [
      { name: 'Shopify Pipeline', description: 'Standard Shopify API extraction.' },
    ],
    notes: [
      'US-based manufacturer',
      'Focus on specialty colors',
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
  
  'ic3d-printers': {
    specialBehaviors: [
      { name: 'Made in USA Flag', description: 'Sets domestic manufacturing status.' },
      { name: 'Recycled Material Detection', description: 'Sets is_recycled flag for eco materials.' },
    ],
    notes: [
      '10 product lines including IM-PLA, R-PETG, PolyHex',
    ],
  },
  
  'kingroon': {
    specialBehaviors: [
      { name: 'Shopify Pipeline', description: 'Standard Shopify API extraction.' },
    ],
    notes: [
      'Printer manufacturer with filament line',
    ],
  },
  
  'matter3d': {
    specialBehaviors: [
      { name: 'Performance Line Focus', description: 'Engineering-grade materials.' },
    ],
    notes: [
      'Shopify-based store',
    ],
  },
  
  'ninjatek': {
    specialBehaviors: [
      { name: 'TPU Shore Hardness Normalization', description: 'All materials normalized to specific Shore grades (e.g., NinjaFlex → TPU-85A).' },
      { name: 'Eel Conductivity Flag', description: 'Eel 90A product line flagged with is_conductive.' },
      { name: 'WooCommerce Scraping', description: 'Firecrawl HTML pipeline for custom platform.' },
    ],
    notes: [
      'TPU/flexible filament specialist',
      'Premium engineering materials',
    ],
  },
  
  'numakers': {
    specialBehaviors: [
      { name: 'Shopify Pipeline', description: 'Standard Shopify API extraction.' },
    ],
    notes: [
      'Canadian manufacturer',
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
  
  'proto-pasta': {
    specialBehaviors: [
      { name: 'Specialty Composite Materials', description: 'HTPLA (heat-treatable), HTPLA-CF, PLA-Conductive categories.' },
      { name: 'Abrasive Material Flags', description: 'Metal/carbon-filled materials flagged as is_nozzle_abrasive.' },
      { name: 'Conductive Properties', description: 'Conductive PLA flagged with is_conductive.' },
      { name: 'Consolidated TDS Page', description: 'All products link to unified Technical Data Sheets page.' },
    ],
    notes: [
      'Shopify API pipeline',
      'Premium specialty composites',
      'Unpredictable PDF versioning - uses consolidated TDS page',
    ],
  },
  
  'prusament': {
    specialBehaviors: [
      { name: 'Custom Platform Scraping', description: 'WordPress/WooCommerce with Firecrawl HTML pipeline.' },
      { name: 'Material Normalization', description: 'PLA Blend, rPLA, PA11-CF detection.' },
      { name: 'Galaxy/Mystic Finish Detection', description: 'Galaxy → Glitter, Mystic → Shimmer finishes.' },
      { name: 'NFC/Refill Consolidation', description: 'Merges NFC and non-NFC variants into unified entries.' },
    ],
    notes: [
      'Premium Prusa manufacturer',
      'Material-specific TDS PDFs from prusament.com/media/datasheet/',
    ],
  },
  
  'push-plastic': {
    specialBehaviors: [
      { name: 'Aggressive Variant Explosion', description: '135 products → 1,800+ variants through color/weight expansion.' },
      { name: 'Industrial Material Support', description: 'PEI (ULTEM), PC-PBT, Carbon Fiber composites.' },
      { name: 'Material-Based TDS Mapping', description: 'Maps to Shopify CDN PDF URLs by material.' },
      { name: 'Official HEX Chart', description: 'Colors mapped from manufacturer color chart.' },
      { name: 'Clean-Slate Sync', description: 'Deletes existing products before sync for data integrity.' },
    ],
    notes: [
      'US-based manufacturer',
      'Deep color catalog and bulk spool options',
      'Engineering-grade materials available',
    ],
  },
  
  'recreus': {
    specialBehaviors: [
      { name: 'TPU Specialist', description: 'FilaFlex line with Shore hardness grades.' },
      { name: 'Shore Hardness Normalization', description: 'Maps flexible materials to specific grades.' },
    ],
    notes: [
      'Spanish TPU manufacturer',
      'Premium flexible filaments',
    ],
  },
  
  'siraya-tech': {
    specialBehaviors: [
      { name: 'Engineering Filament Focus', description: 'Fibreheart line with PET-CF, PPA-CF materials.' },
      { name: 'Continuous Core Variants', description: 'Detects continuous fiber "Core" products.' },
      { name: 'Google Drive TDS Links', description: 'Extracts TDS URLs from Google Drive via Firecrawl.' },
      { name: 'Multi-Region Pricing', description: 'Syncs US, EU, AU, CA regional prices.' },
    ],
    notes: [
      'Shopify API pipeline',
      'Engineering and elastomer materials',
    ],
  },
  
  'sovol': {
    specialBehaviors: [
      { name: 'Regional Warehouse Filtering', description: 'Handles US, EU, CA warehouse variants.' },
      { name: 'Finish Detection', description: 'Silk, Matte, Shimmer, Glow finish types.' },
      { name: 'Silk PLA Mapping', description: 'Rainbow, Dual, Tri, Single silk variants.' },
      { name: 'Chameleon/Gradient Detection', description: 'Color-changing materials identified.' },
    ],
    notes: [
      'Consumer-focused brand',
      'No individual TDS documents',
      'Bulk bundle handling',
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
  
  'sunlu': {
    specialBehaviors: [
      { name: 'High-Speed Meta Lines', description: 'Detects Meta PLA/PETG as high_speed_capable materials.' },
      { name: 'Regional Warehouse Filtering', description: 'Handles US, EU, CA warehouse availability.' },
      { name: 'Consolidated TDS', description: 'Uses single Sunlu Filament Guide PDF for all products.' },
      { name: 'E-ABS Detection', description: 'Easy ABS material normalization.' },
    ],
    notes: [
      'Supports 25+ material types including E-ABS and PEEK',
      'Handles weights from 250g to 10kg',
      'MOQ bundle handling',
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
  
  'ultimaker': {
    specialBehaviors: [
      { name: 'Magento Platform Scraping', description: 'Firecrawl HTML pipeline for store.ultimaker.com.' },
      { name: 'Material Color Explosion', description: 'Explodes materials into color variants (e.g., PLA → 11 colors).' },
      { name: 'Engineering Material Normalization', description: 'Tough PLA → PLA+, Nylon CF Slide → PA-CF.' },
      { name: '2.85mm S-Series', description: 'All S-Series filaments are 2.85mm with Standard finish.' },
      { name: 'Verified TDS URLs', description: 'Material-based pattern from um-support-files.ultimaker.com.' },
    ],
    notes: [
      'Premium professional manufacturer',
      '2.85mm diameter only',
    ],
  },
  
  'voxelpla': {
    specialBehaviors: [
      { name: 'Shopify Pipeline', description: 'Standard Shopify API extraction.' },
    ],
    notes: [
      'PLA specialist brand',
    ],
  },
  
  'yousu': {
    specialBehaviors: [
      { name: 'Shopify Pipeline', description: 'Standard Shopify API extraction.' },
    ],
    notes: [
      'Budget brand',
    ],
  },
  
  'ziro': {
    specialBehaviors: [
      { name: 'Shopify Pipeline', description: 'Standard Shopify API extraction.' },
    ],
    notes: [
      'Consumer-focused materials',
    ],
  },
};

// Shared filter rules applied to ALL brands
export const SHARED_FILTER_RULES = [
  { name: 'Sample Products', description: 'Excluded if weight < 300g (except premium materials)' },
  { name: 'Bulk Spools', description: 'Excluded if weight > 5.5kg' },
  { name: 'Non-Standard Diameters', description: 'Excluded if 2.85mm or 3.0mm' },
  { name: 'Sample/Pack Keywords', description: 'Excluded if title contains: sample, pack, variety, bundle, combo, starter kit, trial' },
];

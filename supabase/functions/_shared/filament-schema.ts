/**
 * CANONICAL FILAMENT SCHEMA DEFINITION
 * 
 * This is the single source of truth for all filament data fields across Filascope.
 * All scrapers, exports, and data quality tools MUST use these definitions.
 * 
 * When adding a new field:
 * 1. Add it to the database via migration
 * 2. Add it here with all metadata
 * 3. Scrapers and exports will automatically pick it up
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FilamentCategory = 
  | 'basic_info'
  | 'identifiers'
  | 'pricing'
  | 'physical'
  | 'print_settings'
  | 'mechanical'
  | 'drying'
  | 'spool'
  | 'composition'
  | 'scores'
  | 'tags'
  | 'urls'
  | 'amazon'
  | 'system';

export type DataType = 'string' | 'number' | 'boolean' | 'array' | 'date' | 'json';

export type DataSource = 'api' | 'html' | 'tds' | 'manual' | 'calculated';

export interface FilamentFieldDefinition {
  /** Database column name */
  key: string;
  /** Human-readable label for UI/CSV */
  label: string;
  /** Logical category for grouping */
  category: FilamentCategory;
  /** Data type */
  dataType: DataType;
  /** Unit of measurement (e.g., 'mm', '°C', 'g') */
  unit?: string;
  /** Can be extracted from product API/page */
  scrapable: boolean;
  /** Can be parsed from TDS PDF */
  tdsExtractable: boolean;
  /** Required for a "complete" record */
  required: boolean;
  /** Preferred data source in order of priority */
  dataSources: DataSource[];
  /** Validation rules */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    allowedValues?: string[];
  };
  /** CSV export order (lower = earlier in CSV) */
  exportOrder: number;
  /** Description for documentation */
  description?: string;
}

export interface CategoryDefinition {
  id: FilamentCategory;
  label: string;
  description: string;
  order: number;
}

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================

export const FILAMENT_CATEGORIES: CategoryDefinition[] = [
  { id: 'basic_info', label: 'Basic Info', description: 'Core product identification', order: 1 },
  { id: 'identifiers', label: 'Identifiers', description: 'Product IDs, SKUs, barcodes', order: 2 },
  { id: 'pricing', label: 'Pricing', description: 'Prices across regions and retailers', order: 3 },
  { id: 'physical', label: 'Physical Properties', description: 'Dimensions, weight, density', order: 4 },
  { id: 'print_settings', label: 'Print Settings', description: 'Temperatures, speeds, nozzle requirements', order: 5 },
  { id: 'mechanical', label: 'Mechanical Properties', description: 'Strength, flexibility, hardness', order: 6 },
  { id: 'drying', label: 'Drying & Care', description: 'Moisture handling and storage', order: 7 },
  { id: 'spool', label: 'Spool Specifications', description: 'Spool dimensions and compatibility', order: 8 },
  { id: 'composition', label: 'Material Composition', description: 'Fiber content, additives', order: 9 },
  { id: 'scores', label: 'Scores & Ratings', description: 'Quality and performance metrics', order: 10 },
  { id: 'tags', label: 'Tags & Use Cases', description: 'Classification and applications', order: 11 },
  { id: 'urls', label: 'Product URLs', description: 'Regional store links and resources', order: 12 },
  { id: 'amazon', label: 'Amazon Links', description: 'Amazon marketplace data', order: 13 },
  { id: 'system', label: 'System Metadata', description: 'Sync status and timestamps', order: 14 },
];

// ============================================================================
// CANONICAL FIELD DEFINITIONS (101 fields)
// ============================================================================

export const FILAMENT_SCHEMA: FilamentFieldDefinition[] = [
  // ==================== BASIC INFO ====================
  {
    key: 'product_title',
    label: 'Product Name',
    category: 'basic_info',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: true,
    dataSources: ['api', 'html'],
    exportOrder: 1,
    description: 'Full product name as displayed on store'
  },
  {
    key: 'vendor',
    label: 'Brand',
    category: 'basic_info',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: true,
    dataSources: ['api', 'html', 'manual'],
    exportOrder: 2,
    description: 'Manufacturer/brand name'
  },
  {
    key: 'material',
    label: 'Material Type',
    category: 'basic_info',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: true,
    required: true,
    dataSources: ['api', 'html', 'tds'],
    validation: {
      allowedValues: [
        // Base materials
        'PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PA', 'PC', 'PVA', 'HIPS', 'PP', 'PET',
        // Enhanced variants
        'PLA+', 'ABS+', 'PETG+',
        // Carbon fiber composites
        'PLA-CF', 'PETG-CF', 'ABS-CF', 'ASA-CF', 'PA-CF', 'PC-CF', 'PET-CF',
        'PEEK-CF', 'PEI-CF', 'PEKK-CF', 'CPE-CF', 'PPA-CF', 'PP-CF',
        // Glass fiber composites
        'PA-GF', 'PP-GF', 'PLA-GF', 'PETG-GF', 'ABS-GF', 'ASA-GF', 'PET-GF', 'PPA-GF',
        // Engineering/specialty plastics
        'PCTG', 'CPE', 'CPE+', 'PEEK', 'PEI', 'PEBA', 'POM', 'PEKK', 'PPA', 'PPSU', 'PSU', 'PPS',
        // ESD (Electrostatic Discharge) variants
        'ESD-ABS', 'ESD-PETG', 'ESD-PLA', 'ESD-PC', 'ESD-PEEK', 'ESD-PEKK', 'ESD-PEI',
        // FR (Flame Retardant) variants
        'FR-ABS', 'FR-PC',
        // Blends
        'PC-ABS', 'PC-ASA', 'PC-PBT',
        // Flexible with hardness
        'TPE', 'TPU-95A', 'TPU-90A', 'TPU-85A', 'TPU-83A', 'TPU-98A', 'TPU-64D',
        'PEBA-95A', 'PEBA-85A',
        // Specialty/additive materials
        'PLA-Wood', 'PLA-Metal', 'PLA-Marble', 'PLA-Stone', 'PLA-Glow',
        'PVB', 'HTPLA', 'LW-PLA', 'LW-ASA',
        // Support materials
        'Support', 'Breakaway', 'Cleaning',
        // Other/Unknown
        'Other', 'Unknown'
      ]
    },
    exportOrder: 3,
    description: 'Base material type'
  },
  {
    key: 'color_family',
    label: 'Color Family',
    category: 'basic_info',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html', 'calculated'],
    validation: {
      allowedValues: ['Black', 'White', 'Gray', 'Red', 'Orange', 'Yellow', 'Gold', 'Green', 'Blue', 'Purple', 'Pink', 'Brown', 'Clear', 'Transparent', 'Metallic', 'Multi-color', 'Natural', 'Wood']
    },
    exportOrder: 4,
    description: 'Broad color category for filtering'
  },
  {
    key: 'color_hex',
    label: 'Color Hex Code',
    category: 'basic_info',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html', 'calculated'],
    validation: { pattern: '^#[0-9A-Fa-f]{6}$' },
    exportOrder: 5,
    description: 'Hex color code for display'
  },
  {
    key: 'finish_type',
    label: 'Finish Type',
    category: 'basic_info',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: {
      allowedValues: ['Matte', 'Glossy', 'Silk', 'Sparkle', 'Marble', 'Galaxy', 'Dual-color', 'Glow', 'Wood', 'Metal', 'Standard']
    },
    exportOrder: 6,
    description: 'Surface finish type'
  },
  {
    key: 'featured_image',
    label: 'Image URL',
    category: 'basic_info',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    exportOrder: 7,
    description: 'Primary product image URL'
  },
  {
    key: 'variant_available',
    label: 'Available',
    category: 'basic_info',
    dataType: 'boolean',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    exportOrder: 8,
    description: 'Whether product is in stock'
  },

  // ==================== IDENTIFIERS ====================
  {
    key: 'id',
    label: 'Database ID',
    category: 'identifiers',
    dataType: 'string',
    scrapable: false,
    tdsExtractable: false,
    required: true,
    dataSources: ['calculated'],
    exportOrder: 10,
    description: 'Unique Filascope database ID'
  },
  {
    key: 'product_id',
    label: 'Product ID',
    category: 'identifiers',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api'],
    exportOrder: 11,
    description: 'External product ID from source'
  },
  {
    key: 'product_handle',
    label: 'Product Handle',
    category: 'identifiers',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    exportOrder: 12,
    description: 'URL slug/handle'
  },
  {
    key: 'product_line_id',
    label: 'Product Line ID',
    category: 'identifiers',
    dataType: 'string',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['manual', 'calculated'],
    exportOrder: 13,
    description: 'Groups related products together'
  },
  {
    key: 'variant_sku',
    label: 'SKU',
    category: 'identifiers',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    exportOrder: 14,
    description: 'Stock keeping unit'
  },
  {
    key: 'mpn',
    label: 'MPN',
    category: 'identifiers',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    exportOrder: 15,
    description: 'Manufacturer part number'
  },
  {
    key: 'ean',
    label: 'EAN',
    category: 'identifiers',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: { pattern: '^[0-9]{13}$' },
    exportOrder: 16,
    description: 'European Article Number'
  },
  {
    key: 'gtin',
    label: 'GTIN',
    category: 'identifiers',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    exportOrder: 17,
    description: 'Global Trade Item Number'
  },
  {
    key: 'upc',
    label: 'UPC',
    category: 'identifiers',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: { pattern: '^[0-9]{12}$' },
    exportOrder: 18,
    description: 'Universal Product Code'
  },
  {
    key: 'brand_id',
    label: 'Brand ID',
    category: 'identifiers',
    dataType: 'string',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    exportOrder: 19,
    description: 'Link to automated_brands table'
  },

  // ==================== PRICING ====================
  {
    key: 'variant_price',
    label: 'Price (USD)',
    category: 'pricing',
    dataType: 'number',
    unit: '$',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: { min: 0, max: 1000 },
    exportOrder: 20,
    description: 'US store price in USD'
  },
  {
    key: 'variant_compare_at_price',
    label: 'Compare At Price',
    category: 'pricing',
    dataType: 'number',
    unit: '$',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: { min: 0, max: 1000 },
    exportOrder: 21,
    description: 'Original price before discount'
  },
  {
    key: 'price_eur',
    label: 'Price (EUR)',
    category: 'pricing',
    dataType: 'number',
    unit: '€',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: { min: 0, max: 1000 },
    exportOrder: 22,
    description: 'EU store price in EUR'
  },
  {
    key: 'price_gbp',
    label: 'Price (GBP)',
    category: 'pricing',
    dataType: 'number',
    unit: '£',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: { min: 0, max: 1000 },
    exportOrder: 23,
    description: 'UK store price in GBP'
  },
  {
    key: 'price_cad',
    label: 'Price (CAD)',
    category: 'pricing',
    dataType: 'number',
    unit: 'CA$',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: { min: 0, max: 1000 },
    exportOrder: 24,
    description: 'CA store price in CAD'
  },
  {
    key: 'price_aud',
    label: 'Price (AUD)',
    category: 'pricing',
    dataType: 'number',
    unit: 'A$',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: { min: 0, max: 1000 },
    exportOrder: 25,
    description: 'AU store price in AUD'
  },
  {
    key: 'price_jpy',
    label: 'Price (JPY)',
    category: 'pricing',
    dataType: 'number',
    unit: '¥',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: { min: 0, max: 100000 },
    exportOrder: 26,
    description: 'JP store price in JPY'
  },
  {
    key: 'amazon_price_usd',
    label: 'Amazon Price (USD)',
    category: 'pricing',
    dataType: 'number',
    unit: '$',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: { min: 0, max: 1000 },
    exportOrder: 27,
    description: 'Amazon US price'
  },
  {
    key: 'value_score',
    label: 'Value Score',
    category: 'pricing',
    dataType: 'number',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    validation: { min: 0, max: 100 },
    exportOrder: 28,
    description: 'Calculated price-to-quality ratio'
  },

  // ==================== PHYSICAL PROPERTIES ====================
  {
    key: 'diameter_nominal_mm',
    label: 'Diameter',
    category: 'physical',
    dataType: 'number',
    unit: 'mm',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 1.0, max: 3.0 },
    exportOrder: 30,
    description: 'Filament diameter (typically 1.75 or 2.85)'
  },
  {
    key: 'net_weight_g',
    label: 'Net Weight',
    category: 'physical',
    dataType: 'number',
    unit: 'g',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 100, max: 10000 },
    exportOrder: 31,
    description: 'Filament weight (excluding spool)'
  },
  {
    key: 'pack_quantity',
    label: 'Pack Quantity',
    category: 'physical',
    dataType: 'number',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: { min: 1, max: 100 },
    exportOrder: 32,
    description: 'Number of spools in pack'
  },
  {
    key: 'density_g_cm3',
    label: 'Density',
    category: 'physical',
    dataType: 'number',
    unit: 'g/cm³',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds'],
    validation: { min: 0.5, max: 3.0 },
    exportOrder: 33,
    description: 'Material density'
  },
  {
    key: 'transmission_distance',
    label: 'Transmission Distance',
    category: 'physical',
    dataType: 'number',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds'],
    exportOrder: 34,
    description: 'Light transmission distance (for transparent materials)'
  },

  // ==================== PRINT SETTINGS ====================
  {
    key: 'nozzle_temp_min_c',
    label: 'Nozzle Temp Min',
    category: 'print_settings',
    dataType: 'number',
    unit: '°C',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 150, max: 350 },
    exportOrder: 40,
    description: 'Minimum recommended nozzle temperature'
  },
  {
    key: 'nozzle_temp_max_c',
    label: 'Nozzle Temp Max',
    category: 'print_settings',
    dataType: 'number',
    unit: '°C',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 150, max: 350 },
    exportOrder: 41,
    description: 'Maximum recommended nozzle temperature'
  },
  {
    key: 'nozzle_temp_sweetspot_c',
    label: 'Nozzle Temp Sweetspot',
    category: 'print_settings',
    dataType: 'number',
    unit: '°C',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds', 'calculated'],
    validation: { min: 150, max: 350 },
    exportOrder: 42,
    description: 'Optimal nozzle temperature'
  },
  {
    key: 'bed_temp_min_c',
    label: 'Bed Temp Min',
    category: 'print_settings',
    dataType: 'number',
    unit: '°C',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 0, max: 150 },
    exportOrder: 43,
    description: 'Minimum recommended bed temperature'
  },
  {
    key: 'bed_temp_max_c',
    label: 'Bed Temp Max',
    category: 'print_settings',
    dataType: 'number',
    unit: '°C',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 0, max: 150 },
    exportOrder: 44,
    description: 'Maximum recommended bed temperature'
  },
  {
    key: 'melt_temp_c',
    label: 'Melt Temperature',
    category: 'print_settings',
    dataType: 'number',
    unit: '°C',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds'],
    validation: { min: 100, max: 400 },
    exportOrder: 45,
    description: 'Material melting point'
  },
  {
    key: 'tg_c',
    label: 'Glass Transition Temp (Tg)',
    category: 'print_settings',
    dataType: 'number',
    unit: '°C',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds'],
    validation: { min: 30, max: 200 },
    exportOrder: 46,
    description: 'Glass transition temperature'
  },
  {
    key: 'fan_min_percent',
    label: 'Fan Min',
    category: 'print_settings',
    dataType: 'number',
    unit: '%',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 0, max: 100 },
    exportOrder: 47,
    description: 'Minimum recommended part cooling fan speed'
  },
  {
    key: 'fan_max_percent',
    label: 'Fan Max',
    category: 'print_settings',
    dataType: 'number',
    unit: '%',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 0, max: 100 },
    exportOrder: 48,
    description: 'Maximum recommended part cooling fan speed'
  },
  {
    key: 'print_speed_max_mms',
    label: 'Max Print Speed',
    category: 'print_settings',
    dataType: 'number',
    unit: 'mm/s',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 10, max: 1000 },
    exportOrder: 49,
    description: 'Maximum recommended print speed'
  },
  {
    key: 'high_speed_capable',
    label: 'High Speed Capable',
    category: 'print_settings',
    dataType: 'boolean',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html', 'calculated'],
    exportOrder: 50,
    description: 'Whether filament is rated for high-speed printing'
  },
  {
    key: 'recommended_nozzle_type',
    label: 'Recommended Nozzle Type',
    category: 'print_settings',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { allowedValues: ['Brass', 'Hardened Steel', 'Ruby', 'Tungsten', 'Any'] },
    exportOrder: 51,
    description: 'Recommended nozzle material'
  },
  {
    key: 'is_nozzle_abrasive',
    label: 'Nozzle Abrasive',
    category: 'print_settings',
    dataType: 'boolean',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds', 'calculated'],
    exportOrder: 52,
    description: 'Whether filament is abrasive to brass nozzles'
  },
  {
    key: 'nozzle_care',
    label: 'Nozzle Care Notes',
    category: 'print_settings',
    dataType: 'string',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds', 'manual'],
    exportOrder: 53,
    description: 'Special nozzle maintenance notes'
  },

  // ==================== MECHANICAL PROPERTIES ====================
  {
    key: 'tensile_strength_xy_mpa',
    label: 'Tensile Strength (XY)',
    category: 'mechanical',
    dataType: 'number',
    unit: 'MPa',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds'],
    validation: { min: 0, max: 500 },
    exportOrder: 60,
    description: 'Tensile strength in XY plane'
  },
  {
    key: 'tensile_modulus_xy_mpa',
    label: 'Tensile Modulus (XY)',
    category: 'mechanical',
    dataType: 'number',
    unit: 'MPa',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds'],
    validation: { min: 0, max: 10000 },
    exportOrder: 61,
    description: 'Tensile modulus in XY plane'
  },
  {
    key: 'elongation_break_xy_percent',
    label: 'Elongation at Break (XY)',
    category: 'mechanical',
    dataType: 'number',
    unit: '%',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds'],
    validation: { min: 0, max: 1000 },
    exportOrder: 62,
    description: 'Elongation at break in XY plane'
  },
  {
    key: 'flexural_strength_mpa',
    label: 'Flexural Strength',
    category: 'mechanical',
    dataType: 'number',
    unit: 'MPa',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds'],
    validation: { min: 0, max: 500 },
    exportOrder: 63,
    description: 'Flexural strength'
  },
  {
    key: 'shore_hardness_d',
    label: 'Shore Hardness D',
    category: 'mechanical',
    dataType: 'number',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds'],
    validation: { min: 0, max: 100 },
    exportOrder: 64,
    description: 'Shore D hardness rating'
  },
  {
    key: 'strength_index',
    label: 'Strength Index',
    category: 'mechanical',
    dataType: 'number',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    validation: { min: 0, max: 100 },
    exportOrder: 65,
    description: 'Calculated overall strength rating'
  },

  // ==================== DRYING & CARE ====================
  {
    key: 'drying_temp_c',
    label: 'Drying Temperature',
    category: 'drying',
    dataType: 'number',
    unit: '°C',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 30, max: 120 },
    exportOrder: 70,
    description: 'Recommended drying temperature'
  },
  {
    key: 'drying_time_hours',
    label: 'Drying Time',
    category: 'drying',
    dataType: 'number',
    unit: 'hours',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 1, max: 24 },
    exportOrder: 71,
    description: 'Recommended drying duration'
  },
  {
    key: 'moisture_sensitivity_level',
    label: 'Moisture Sensitivity',
    category: 'drying',
    dataType: 'string',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds', 'manual'],
    validation: { allowedValues: ['Low', 'Medium', 'High', 'Very High'] },
    exportOrder: 72,
    description: 'How sensitive the material is to moisture'
  },
  {
    key: 'moisture_care',
    label: 'Moisture Care Notes',
    category: 'drying',
    dataType: 'string',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds', 'manual'],
    exportOrder: 73,
    description: 'Special moisture handling notes'
  },

  // ==================== SPOOL SPECIFICATIONS ====================
  {
    key: 'spool_outer_d_mm',
    label: 'Spool Outer Diameter',
    category: 'spool',
    dataType: 'number',
    unit: 'mm',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 100, max: 400 },
    exportOrder: 80,
    description: 'Outer diameter of spool'
  },
  {
    key: 'spool_width_mm',
    label: 'Spool Width',
    category: 'spool',
    dataType: 'number',
    unit: 'mm',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 30, max: 150 },
    exportOrder: 81,
    description: 'Width of spool'
  },
  {
    key: 'spool_material',
    label: 'Spool Material',
    category: 'spool',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    validation: { allowedValues: ['Plastic', 'Cardboard', 'Recycled Plastic', 'Metal', 'Refillable'] },
    exportOrder: 82,
    description: 'Material the spool is made from'
  },
  {
    key: 'spool_ams_fit',
    label: 'AMS Compatible',
    category: 'spool',
    dataType: 'boolean',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html', 'calculated'],
    exportOrder: 83,
    description: 'Whether spool fits Bambu Lab AMS'
  },

  // ==================== MATERIAL COMPOSITION ====================
  {
    key: 'carbon_fiber_percentage',
    label: 'Carbon Fiber Content',
    category: 'composition',
    dataType: 'number',
    unit: '%',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 0, max: 50 },
    exportOrder: 90,
    description: 'Carbon fiber content percentage'
  },
  {
    key: 'glass_fiber_percentage',
    label: 'Glass Fiber Content',
    category: 'composition',
    dataType: 'number',
    unit: '%',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 0, max: 50 },
    exportOrder: 91,
    description: 'Glass fiber content percentage'
  },
  {
    key: 'wood_powder_percentage',
    label: 'Wood Powder Content',
    category: 'composition',
    dataType: 'number',
    unit: '%',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { min: 0, max: 50 },
    exportOrder: 92,
    description: 'Wood powder content percentage'
  },
  {
    key: 'wood_type',
    label: 'Wood Type',
    category: 'composition',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    exportOrder: 93,
    description: 'Type of wood used in composite'
  },
  {
    key: 'wood_fiber_length_mm',
    label: 'Wood Fiber Length',
    category: 'composition',
    dataType: 'number',
    unit: 'mm',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds'],
    exportOrder: 94,
    description: 'Length of wood fibers'
  },
  {
    key: 'wood_particle_size_microns',
    label: 'Wood Particle Size',
    category: 'composition',
    dataType: 'number',
    unit: 'μm',
    scrapable: false,
    tdsExtractable: true,
    required: false,
    dataSources: ['tds'],
    exportOrder: 95,
    description: 'Size of wood particles in microns'
  },
  {
    key: 'wood_scent_level',
    label: 'Wood Scent Level',
    category: 'composition',
    dataType: 'string',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['manual'],
    validation: { allowedValues: ['None', 'Mild', 'Moderate', 'Strong'] },
    exportOrder: 96,
    description: 'Intensity of wood scent when printing'
  },

  // ==================== SCORES & RATINGS ====================
  {
    key: 'printability_index',
    label: 'Printability Index',
    category: 'scores',
    dataType: 'number',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    validation: { min: 0, max: 100 },
    exportOrder: 100,
    description: 'Overall ease of printing score'
  },
  {
    key: 'ease_of_printing_score',
    label: 'Ease of Printing Score',
    category: 'scores',
    dataType: 'number',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    validation: { min: 0, max: 100 },
    exportOrder: 101,
    description: 'User-rated ease of printing'
  },
  {
    key: 'dimensional_accuracy_score',
    label: 'Dimensional Accuracy Score',
    category: 'scores',
    dataType: 'number',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    validation: { min: 0, max: 100 },
    exportOrder: 102,
    description: 'Rating for dimensional accuracy'
  },
  {
    key: 'food_contact_rating',
    label: 'Food Contact Rating',
    category: 'scores',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: true,
    required: false,
    dataSources: ['api', 'html', 'tds'],
    validation: { allowedValues: ['Not Safe', 'Safe After Coating', 'FDA Approved', 'EU Certified'] },
    exportOrder: 103,
    description: 'Food safety certification level'
  },

  // ==================== TAGS & USE CASES ====================
  {
    key: 'use_case_tags',
    label: 'Use Case Tags',
    category: 'tags',
    dataType: 'array',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html', 'manual'],
    exportOrder: 110,
    description: 'Application-specific tags'
  },
  {
    key: 'industry_tags',
    label: 'Industry Tags',
    category: 'tags',
    dataType: 'array',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html', 'manual'],
    exportOrder: 111,
    description: 'Industry/sector tags'
  },
  {
    key: 'available_regions',
    label: 'Available Regions',
    category: 'tags',
    dataType: 'array',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html', 'calculated'],
    exportOrder: 112,
    description: 'Regions where product is available'
  },

  // ==================== PRODUCT URLs ====================
  {
    key: 'product_url',
    label: 'Product URL (US)',
    category: 'urls',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    exportOrder: 120,
    description: 'US store product page URL'
  },
  {
    key: 'product_url_eu',
    label: 'Product URL (EU)',
    category: 'urls',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    exportOrder: 121,
    description: 'EU store product page URL'
  },
  {
    key: 'product_url_uk',
    label: 'Product URL (UK)',
    category: 'urls',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    exportOrder: 122,
    description: 'UK store product page URL'
  },
  {
    key: 'product_url_ca',
    label: 'Product URL (CA)',
    category: 'urls',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    exportOrder: 123,
    description: 'CA store product page URL'
  },
  {
    key: 'product_url_au',
    label: 'Product URL (AU)',
    category: 'urls',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    exportOrder: 124,
    description: 'AU store product page URL'
  },
  {
    key: 'product_url_jp',
    label: 'Product URL (JP)',
    category: 'urls',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    exportOrder: 125,
    description: 'JP store product page URL'
  },
  {
    key: 'tds_url',
    label: 'Technical Data Sheet URL',
    category: 'urls',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html'],
    exportOrder: 126,
    description: 'Link to TDS PDF'
  },

  // ==================== AMAZON LINKS ====================
  {
    key: 'amazon_link_us',
    label: 'Amazon US Link',
    category: 'amazon',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html', 'manual'],
    exportOrder: 130,
    description: 'Amazon US product link'
  },
  {
    key: 'amazon_link_uk',
    label: 'Amazon UK Link',
    category: 'amazon',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html', 'manual'],
    exportOrder: 131,
    description: 'Amazon UK product link'
  },
  {
    key: 'amazon_link_de',
    label: 'Amazon DE Link',
    category: 'amazon',
    dataType: 'string',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api', 'html', 'manual'],
    exportOrder: 132,
    description: 'Amazon DE product link'
  },
  {
    key: 'amazon_match_confidence',
    label: 'Amazon Match Confidence',
    category: 'amazon',
    dataType: 'number',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    validation: { min: 0, max: 100 },
    exportOrder: 133,
    description: 'Confidence score for Amazon product matching'
  },
  {
    key: 'amazon_prices_last_updated_at',
    label: 'Amazon Prices Updated',
    category: 'amazon',
    dataType: 'date',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    exportOrder: 134,
    description: 'Last time Amazon prices were synced'
  },

  // ==================== SYSTEM METADATA ====================
  {
    key: 'created_at',
    label: 'Created At',
    category: 'system',
    dataType: 'date',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    exportOrder: 140,
    description: 'Record creation timestamp'
  },
  {
    key: 'updated_at',
    label: 'Updated At',
    category: 'system',
    dataType: 'date',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    exportOrder: 141,
    description: 'Record last update timestamp'
  },
  {
    key: 'published_at',
    label: 'Published At',
    category: 'system',
    dataType: 'date',
    scrapable: true,
    tdsExtractable: false,
    required: false,
    dataSources: ['api'],
    exportOrder: 142,
    description: 'When product was published on source'
  },
  {
    key: 'last_scraped_at',
    label: 'Last Scraped At',
    category: 'system',
    dataType: 'date',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    exportOrder: 143,
    description: 'Last time product was scraped'
  },
  {
    key: 'next_scrape_at',
    label: 'Next Scrape At',
    category: 'system',
    dataType: 'date',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    exportOrder: 144,
    description: 'Scheduled next scrape time'
  },
  {
    key: 'scrape_frequency_hours',
    label: 'Scrape Frequency',
    category: 'system',
    dataType: 'number',
    unit: 'hours',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['manual'],
    exportOrder: 145,
    description: 'How often to scrape this product'
  },
  {
    key: 'last_external_sync_at',
    label: 'Last External Sync',
    category: 'system',
    dataType: 'date',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    exportOrder: 146,
    description: 'Last external data sync timestamp'
  },
  {
    key: 'regional_prices_updated_at',
    label: 'Regional Prices Updated',
    category: 'system',
    dataType: 'date',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    exportOrder: 147,
    description: 'Last regional price update'
  },
  {
    key: 'url_validated_at',
    label: 'URL Validated At',
    category: 'system',
    dataType: 'date',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    exportOrder: 148,
    description: 'Last URL validation timestamp'
  },
  {
    key: 'url_validation_status',
    label: 'URL Validation Status',
    category: 'system',
    dataType: 'string',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    validation: { allowedValues: ['valid', 'invalid', 'pending', 'unknown'] },
    exportOrder: 149,
    description: 'URL validation result'
  },
  {
    key: 'sync_status',
    label: 'Sync Status',
    category: 'system',
    dataType: 'string',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    validation: { allowedValues: ['synced', 'pending', 'error', 'manual'] },
    exportOrder: 150,
    description: 'Current sync status'
  },
  {
    key: 'external_data_hash',
    label: 'External Data Hash',
    category: 'system',
    dataType: 'string',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    exportOrder: 151,
    description: 'Hash to detect data changes'
  },
  {
    key: 'auto_created',
    label: 'Auto Created',
    category: 'system',
    dataType: 'boolean',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    exportOrder: 152,
    description: 'Whether created by scraper'
  },
  {
    key: 'auto_updated',
    label: 'Auto Updated',
    category: 'system',
    dataType: 'boolean',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['calculated'],
    exportOrder: 153,
    description: 'Whether updated by scraper'
  },
  {
    key: 'user_override_fields',
    label: 'User Override Fields',
    category: 'system',
    dataType: 'array',
    scrapable: false,
    tdsExtractable: false,
    required: false,
    dataSources: ['manual'],
    exportOrder: 154,
    description: 'Fields manually overridden by admin'
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all fields that can be scraped from product pages/APIs
 */
export function getScrapableFields(): FilamentFieldDefinition[] {
  return FILAMENT_SCHEMA.filter(f => f.scrapable);
}

/**
 * Get all fields that can be extracted from TDS PDFs
 */
export function getTdsExtractableFields(): FilamentFieldDefinition[] {
  return FILAMENT_SCHEMA.filter(f => f.tdsExtractable);
}

/**
 * Get all required fields for a "complete" record
 */
export function getRequiredFields(): FilamentFieldDefinition[] {
  return FILAMENT_SCHEMA.filter(f => f.required);
}

/**
 * Get fields by category
 */
export function getFieldsByCategory(category: FilamentCategory): FilamentFieldDefinition[] {
  return FILAMENT_SCHEMA.filter(f => f.category === category);
}

/**
 * Get fields sorted by export order
 */
export function getFieldsForExport(): FilamentFieldDefinition[] {
  return [...FILAMENT_SCHEMA].sort((a, b) => a.exportOrder - b.exportOrder);
}

/**
 * Get field definition by key
 */
export function getFieldByKey(key: string): FilamentFieldDefinition | undefined {
  return FILAMENT_SCHEMA.find(f => f.key === key);
}

/**
 * Generate CSV headers from schema
 */
export function generateCSVHeaders(): string[] {
  return getFieldsForExport().map(f => f.label);
}

/**
 * Get all field keys in export order
 */
export function getFieldKeysForExport(): string[] {
  return getFieldsForExport().map(f => f.key);
}

/**
 * Get category definitions sorted by order
 */
export function getCategoriesSorted(): CategoryDefinition[] {
  return [...FILAMENT_CATEGORIES].sort((a, b) => a.order - b.order);
}

/**
 * Validate a value against field definition
 */
export function validateField(key: string, value: unknown): { valid: boolean; error?: string } {
  const field = getFieldByKey(key);
  if (!field) {
    return { valid: false, error: `Unknown field: ${key}` };
  }

  if (value === null || value === undefined) {
    return { valid: true }; // Null values are allowed (field is optional unless required)
  }

  const { validation } = field;
  if (!validation) {
    return { valid: true };
  }

  if (field.dataType === 'number' && typeof value === 'number') {
    if (validation.min !== undefined && value < validation.min) {
      return { valid: false, error: `${field.label} must be >= ${validation.min}` };
    }
    if (validation.max !== undefined && value > validation.max) {
      return { valid: false, error: `${field.label} must be <= ${validation.max}` };
    }
  }

  if (field.dataType === 'string' && typeof value === 'string') {
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return { valid: false, error: `${field.label} does not match pattern: ${validation.pattern}` };
      }
    }
    if (validation.allowedValues && !validation.allowedValues.includes(value)) {
      return { valid: false, error: `${field.label} must be one of: ${validation.allowedValues.join(', ')}` };
    }
  }

  return { valid: true };
}

// ============================================================================
// TYPE EXPORTS FOR SCRAPER INTEGRATION
// ============================================================================

/**
 * Partial filament data that can be scraped from product pages
 * Used as the output type for all scrapers
 */
export type ScrapedFilamentData = {
  [K in typeof FILAMENT_SCHEMA[number]['key']]?: 
    typeof FILAMENT_SCHEMA[number]['dataType'] extends 'string' ? string :
    typeof FILAMENT_SCHEMA[number]['dataType'] extends 'number' ? number :
    typeof FILAMENT_SCHEMA[number]['dataType'] extends 'boolean' ? boolean :
    typeof FILAMENT_SCHEMA[number]['dataType'] extends 'array' ? string[] :
    typeof FILAMENT_SCHEMA[number]['dataType'] extends 'date' ? Date | string :
    unknown;
};

/**
 * Complete filament record (all fields)
 */
export type FilamentRecord = {
  [K in typeof FILAMENT_SCHEMA[number]['key']]: unknown;
};

// ============================================================================
// REGION AND CURRENCY SUPPORT
// ============================================================================

// Core regions plus European sub-regions (DE, IT, FR, ES have separate catalogs but map to EUR/EU)
export type RegionCode = 'US' | 'CA' | 'UK' | 'EU' | 'AU' | 'JP' | 'DE' | 'IT' | 'FR' | 'ES';

export const REGION_CURRENCIES: Record<RegionCode, string> = {
  US: 'USD',
  CA: 'CAD',
  UK: 'GBP',
  EU: 'EUR',
  AU: 'AUD',
  JP: 'JPY',
  DE: 'EUR', // European sub-region
  IT: 'EUR', // European sub-region
  FR: 'EUR', // European sub-region
  ES: 'EUR', // European sub-region
};

// Mapping from EU sub-regions to main EU region for price/URL field storage
export const EU_SUB_REGION_TO_MAIN: Record<string, RegionCode> = {
  DE: 'EU',
  IT: 'EU',
  FR: 'EU',
  ES: 'EU',
};

// Get the main region for field storage (maps EU sub-regions to EU)
export function getMainRegion(region: string): RegionCode {
  const euSubRegion = EU_SUB_REGION_TO_MAIN[region as keyof typeof EU_SUB_REGION_TO_MAIN];
  return euSubRegion || (region as RegionCode);
}

export const REGIONAL_FIELD_MAPPING: Record<RegionCode, { priceField: string; urlField: string; compareAtPriceField?: string }> = {
  US: { priceField: 'variant_price', urlField: 'product_url', compareAtPriceField: 'variant_compare_at_price' },
  CA: { priceField: 'price_cad', urlField: 'product_url_ca' },
  UK: { priceField: 'price_gbp', urlField: 'product_url_uk' },
  EU: { priceField: 'price_eur', urlField: 'product_url_eu' },
  AU: { priceField: 'price_aud', urlField: 'product_url_au' },
  JP: { priceField: 'price_jpy', urlField: 'product_url_jp' },
  // EU sub-regions map to main EU fields
  DE: { priceField: 'price_eur', urlField: 'product_url_eu' },
  IT: { priceField: 'price_eur', urlField: 'product_url_eu' },
  FR: { priceField: 'price_eur', urlField: 'product_url_eu' },
  ES: { priceField: 'price_eur', urlField: 'product_url_eu' },
};

// Get regional field mapping for any region (including sub-regions)
export function getRegionalFieldMapping(region: string): { priceField: string; urlField: string; compareAtPriceField?: string } {
  const mapping = REGIONAL_FIELD_MAPPING[region as RegionCode];
  if (mapping) return mapping;
  
  // Fallback to US if unknown region
  console.warn(`Unknown region: ${region}, falling back to US field mapping`);
  return REGIONAL_FIELD_MAPPING.US;
}

// ============================================================================
// DATA EXTRACTION HELPERS
// ============================================================================

/**
 * Color family definitions for normalization
 */
export const COLOR_FAMILIES = [
  'Black', 'White', 'Gray', 'Red', 'Orange', 'Yellow', 'Green', 
  'Blue', 'Purple', 'Pink', 'Brown', 'Clear', 'Natural', 'Silver', 
  'Gold', 'Multi', 'Wood', 'Glow'
] as const;

export type ColorFamily = typeof COLOR_FAMILIES[number];

/**
 * Extract color family from a product title or color name
 */
export function extractColorFamily(text: string): ColorFamily | null {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  const colorMappings: Record<string, ColorFamily> = {
    'black': 'Black',
    'white': 'White',
    'grey': 'Gray',
    'gray': 'Gray',
    'silver': 'Silver',
    'gold': 'Gold',
    'red': 'Red',
    'scarlet': 'Red',
    'crimson': 'Red',
    'maroon': 'Red',
    'orange': 'Orange',
    'tangerine': 'Orange',
    'coral': 'Orange',
    'yellow': 'Yellow',
    'lemon': 'Yellow',
    'mustard': 'Yellow',
    'green': 'Green',
    'olive': 'Green',
    'lime': 'Green',
    'mint': 'Green',
    'forest': 'Green',
    'teal': 'Green',
    'blue': 'Blue',
    'navy': 'Blue',
    'cobalt': 'Blue',
    'sky': 'Blue',
    'azure': 'Blue',
    'cyan': 'Blue',
    'purple': 'Purple',
    'violet': 'Purple',
    'lavender': 'Purple',
    'plum': 'Purple',
    'magenta': 'Purple',
    'pink': 'Pink',
    'rose': 'Pink',
    'fuchsia': 'Pink',
    'salmon': 'Pink',
    'brown': 'Brown',
    'tan': 'Brown',
    'chocolate': 'Brown',
    'coffee': 'Brown',
    'bronze': 'Brown',
    'beige': 'Brown',
    'clear': 'Clear',
    'transparent': 'Clear',
    'translucent': 'Clear',
    'natural': 'Natural',
    'wood': 'Wood',
    'maple': 'Wood',
    'walnut': 'Wood',
    'oak': 'Wood',
    'glow': 'Glow',
    'phosphor': 'Glow',
    'luminous': 'Glow',
    'rainbow': 'Multi',
    'multicolor': 'Multi',
    'gradient': 'Multi',
  };
  
  for (const [keyword, family] of Object.entries(colorMappings)) {
    if (lowerText.includes(keyword)) {
      return family;
    }
  }
  
  return null;
}

/**
 * Extract net weight from product title or variant info
 */
export function extractWeight(title: string, variantGrams?: number): number | null {
  if (!title) return null;
  
  const lowerTitle = title.toLowerCase();
  
  // Check for kg patterns
  const kgMatch = lowerTitle.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kgMatch) {
    return Math.round(parseFloat(kgMatch[1]) * 1000);
  }
  
  // Check for gram patterns
  const gMatch = lowerTitle.match(/(\d+)\s*g(?:ram)?s?(?:\s|$|[^a-z])/i);
  if (gMatch) {
    const grams = parseInt(gMatch[1]);
    if (grams >= 100 && grams <= 5000) {
      return grams;
    }
  }
  
  // Fallback to variant.grams if reasonable
  if (variantGrams && variantGrams >= 100 && variantGrams <= 3000) {
    return variantGrams;
  }
  
  return 1000; // Default 1kg
}

/**
 * Generate consistent product line ID for grouping variants
 * 
 * @param brandSlug - Brand identifier (e.g., 'amolen')
 * @param material - Material type (e.g., 'PLA')
 * @param productName - Product title for extracting product type
 * @param weightGrams - Optional weight in grams; bulk packs (≥4kg) get separate IDs
 */
export function generateProductLineId(
  brandSlug: string,
  material: string | null | undefined,
  productName: string,
  weightGrams?: number | null
): string {
  const normalizedBrand = brandSlug.toLowerCase().replace(/\s+/g, '-');
  const normalizedMaterial = (material || 'unknown').toLowerCase().replace(/\s+/g, '-');
  
  const productType = extractProductType(productName);
  
  // Separate bulk packs (4kg+) from single-spool color variants
  // This prevents bulk packs from appearing as color swatches
  const isBulkPack = weightGrams && weightGrams >= 4000;
  const weightSuffix = isBulkPack ? `_${Math.round(weightGrams / 1000)}kg` : '';
  
  return `${normalizedBrand}__${normalizedMaterial}__${productType}${weightSuffix}`;
}

function extractProductType(name: string): string {
  const lowerName = name.toLowerCase();
  
  // AMOLEN-SPECIFIC: Check for sub-product-lines BEFORE base patterns
  // Order matters: longer/more specific patterns first
  const amelonSubLines = [
    // Gradient/Variety packs and sample packs (must be separate products)
    'gradient variety pack', 'variety pack',
    'crystal-transparent gradient', 'crystal transparent gradient',
    'all in one sample pack', 'sample pack',
    // Basic sub-lines (MUST be before matte/silk since "basic dual" won't match those)
    'basic dual', 'basic tri-color', 'basic triple', 'basic dual color',
    // Matte sub-lines
    'matte rainbow', 'matte triple', 'matte dual', 'matte basic', 'matte tri-color',
    // Silk sub-lines (specific variants before generic silk)
    'silk s-series', 's-series',
    'silk glow in the dark', 'glow in the dark',
    'silk shiny gradient', 'shiny gradient',
    'silk rainbow', 'silk triple', 'silk dual', 'silk starry', 'silk tri-color',
    // Transparent sub-lines
    'transparent rainbow', 'crystal-transparent',
  ];
  
  for (const subLine of amelonSubLines) {
    if (lowerName.includes(subLine)) {
      return subLine.replace(/\s+/g, '_').replace(/-/g, '_');
    }
  }
  
  // Standard product lines
  const productLines = [
    'polyterra', 'polylite', 'polymax', 'polywood', 'polycast', 'polysmooth',
    'basic', 'matte', 'silk', 'marble', 'metal', 'galaxy', 'glow', 'sparkle',
    'tough', 'pro', 'plus', 'premium', 'standard', 'eco', 'recycled',
    'cf', 'gf', 'high-speed', 'hs', 'rapid',
    'translucent', 'transparent', 'clear',
  ];
  
  for (const line of productLines) {
    if (lowerName.includes(line)) {
      return line.replace(/\s+/g, '-');
    }
  }
  
  return 'standard';
}

/**
 * Build available_regions array based on which regional data exists
 */
export function buildAvailableRegions(data: Record<string, unknown>): RegionCode[] {
  const regions: RegionCode[] = [];
  
  if (data.variant_price || data.product_url) regions.push('US');
  if (data.price_cad || data.product_url_ca) regions.push('CA');
  if (data.price_gbp || data.product_url_uk) regions.push('UK');
  if (data.price_eur || data.product_url_eu) regions.push('EU');
  if (data.price_aud || data.product_url_au) regions.push('AU');
  if (data.price_jpy || data.product_url_jp) regions.push('JP');
  
  return regions;
}

/**
 * Extract material from product title
 */
export function extractMaterial(title: string, productType?: string): string | null {
  const combined = `${title} ${productType || ''}`.toUpperCase();
  
  // Material normalization mappings (non-standard → canonical)
  // Order matters: check specific multi-word patterns before shorter patterns
  const normalizationMap: Record<string, string> = {
    // PLA specialty variants (check before base PLA)
    'PLA-WOOD': 'PLA-Wood',
    'PLA WOOD': 'PLA-Wood',
    'WOODFILL': 'PLA-Wood',
    'WOOD FILL': 'PLA-Wood',
    'WOOD PLA': 'PLA-Wood',
    'PLA-METAL': 'PLA-Metal',
    'PLA METAL': 'PLA-Metal',
    'METALFILL': 'PLA-Metal',
    'PLA-MARBLE': 'PLA-Marble',
    'PLA MARBLE': 'PLA-Marble',
    'MARBLE PLA': 'PLA-Marble',
    'PLA-STONE': 'PLA-Stone',
    'PLA STONE': 'PLA-Stone',
    'PLA-GLOW': 'PLA-Glow',
    'PLA GLOW': 'PLA-Glow',
    'GLOW PLA': 'PLA-Glow',
    'LUMINOUS PLA': 'PLA-Glow',
    // PLA enhanced variants
    'RAPID PLA+': 'PLA+',
    'RAPID PLA': 'PLA',
    'PLA PRO': 'PLA+',
    'PLA PLUS': 'PLA+',
    'PLA TOUGH': 'PLA+',
    'TOUGH PLA': 'PLA+',
    'PLA MATTE': 'PLA',
    'PLA SILK': 'PLA',
    'HYPER PLA': 'PLA',
    'HIGH SPEED PLA': 'PLA',
    'HS PLA': 'PLA',
    'HTPLA': 'HTPLA',
    'HT-PLA': 'HTPLA',
    'HT PLA': 'HTPLA',
    'LW-PLA': 'LW-PLA',
    'LW PLA': 'LW-PLA',
    'LIGHTWEIGHT PLA': 'LW-PLA',
    'FLEXPLA': 'TPU',
    // Nylon/PA variants
    'NYLON-CF': 'PA-CF',
    'NYLON CF': 'PA-CF',
    'NYLONX': 'PA-CF',
    'NYLON-GF': 'PA-GF',
    'NYLON GF': 'PA-GF',
    'NYLONG': 'PA-GF',
    'NYLON-AF': 'PA',
    'NYLON AF': 'PA',
    'NYLON': 'PA',
    'PA6-CF': 'PA-CF',
    'PA12-CF': 'PA-CF',
    'PA6-GF': 'PA-GF',
    'PA6': 'PA',
    'PA12': 'PA',
    // PETG variants
    'PETG+': 'PETG+',
    'PRO PETG': 'PETG+',
    'PETG PRO': 'PETG+',
    'RPETG': 'PETG',
    'R-PETG': 'PETG',
    // ABS variants
    'ABS+': 'ABS+',
    'ABS PRO': 'ABS+',
    'ABS HT': 'ABS',
    'LW-ASA': 'LW-ASA',
    'LW ASA': 'LW-ASA',
    'ASA+': 'ASA',
    // TPU variants with hardness
    'TPU 95A': 'TPU-95A',
    'TPU 90A': 'TPU-90A',
    'TPU 85A': 'TPU-85A',
    'TPU 83A': 'TPU-83A',
    'TPU 98A': 'TPU-98A',
    'TPU 64D': 'TPU-64D',
    'TPU95A': 'TPU-95A',
    'TPU90A': 'TPU-90A',
    'TPU85A': 'TPU-85A',
    'TPE-83A': 'TPU-83A',
    'TPU VARIOSHORE': 'TPU',
    'TPU AIR': 'TPU',
    'TPU GLOW': 'TPU',
    // PEBA variants
    'PEBA 95A': 'PEBA-95A',
    'PEBA 85A': 'PEBA-85A',
    'PEBA AIR': 'PEBA',
    // ESD variants (must come before base materials)
    'ESD-PEI 1010': 'ESD-PEI',
    'ESD-PEI 9085': 'ESD-PEI',
    'ESD-PEEK': 'ESD-PEEK',
    'ESD-PEKK': 'ESD-PEKK',
    'ESD-PETG': 'ESD-PETG',
    'ESD-PLA': 'ESD-PLA',
    'ESD-ABS': 'ESD-ABS',
    'ESD-PC': 'ESD-PC',
    'ESD ABS': 'ESD-ABS',
    'ESD PETG': 'ESD-PETG',
    'ESD PC': 'ESD-PC',
    // FR variants
    'FR-ABS': 'FR-ABS',
    'FR ABS': 'FR-ABS',
    'FIREWIRE ABS': 'FR-ABS',
    'FR-PC': 'FR-PC',
    'FR PC': 'FR-PC',
    'PC-FR': 'FR-PC',
    'FIREWIRE PC': 'FR-PC',
    // PEI variants
    'PEI 1010': 'PEI',
    'PEI 9085': 'PEI',
    'ULTEM': 'PEI',
    // PEKK variants
    'PEKK-A': 'PEKK',
    'PEKK-CF': 'PEKK-CF',
    'PEKK CF': 'PEKK-CF',
    // PC variants
    'PC PRO': 'PC',
    'EZPC': 'PC',
    'PC BLEND': 'PC',
    'PC-PBT': 'PC-PBT',
    'PC PBT': 'PC-PBT',
    // CPE variants
    'CPE+': 'CPE+',
    'CPE-CF': 'CPE-CF',
    'CPE CF': 'CPE-CF',
    // PPA variants
    'PPA-CF': 'PPA-CF',
    'PPA CF': 'PPA-CF',
    'PPA-GF': 'PPA-GF',
    'PPA GF': 'PPA-GF',
    // Other specialty
    'PRO PCTG': 'PCTG',
    'PVB': 'PVB',
    'PPS-CF': 'PPS',
    'PPS CF': 'PPS',
    'RPLA': 'PLA',
    'R-PLA': 'PLA',
    'ALLPHA': 'Other',
    'PLA/PHA': 'Other',
    'TITANX': 'ASA',
    'RYNO': 'ASA',
    // Support materials
    'BREAKAWAY': 'Breakaway',
    'BREAK AWAY': 'Breakaway',
    'CLEANING': 'Cleaning',
    'SUPPORT': 'Support',
    'SIMUBONE': 'Other',
    'CARBON': 'Other',
    'CARBON FIBER': 'Other',
    'METAL': 'Other',
    'UNKNOWN': 'Unknown',
  };
  
  // Check normalization mappings first (specific variants)
  for (const [pattern, canonical] of Object.entries(normalizationMap)) {
    if (combined.includes(pattern)) {
      return canonical;
    }
  }
  
  // Check for composite materials (must come before base materials)
  const composites = [
    // CF composites
    'PEEK-CF', 'PEI-CF', 'PEKK-CF', 'CPE-CF', 'PPA-CF', 'PP-CF',
    'PLA-CF', 'PETG-CF', 'ABS-CF', 'PA-CF', 'PC-CF', 'ASA-CF', 'PET-CF',
    // GF composites
    'PLA-GF', 'PETG-GF', 'ABS-GF', 'PA-GF', 'PP-GF', 'ASA-GF', 'PET-GF', 'PPA-GF',
    // Blends
    'PC-ABS', 'PC-ASA', 'PC-PBT',
  ];
  
  for (const mat of composites) {
    if (combined.includes(mat.replace(/-/g, ' ')) || combined.includes(mat)) {
      return mat;
    }
  }
  
  // Check for TPU with hardness
  const tpuMatch = combined.match(/TPU[\s-]?(95|90|85|83|98)A?/i);
  if (tpuMatch) {
    return `TPU-${tpuMatch[1]}A`;
  }
  
  // Check for TPU with D hardness
  const tpuDMatch = combined.match(/TPU[\s-]?(64)D/i);
  if (tpuDMatch) {
    return `TPU-${tpuDMatch[1]}D`;
  }
  
  // Check for PEBA with hardness
  const pebaMatch = combined.match(/PEBA[\s-]?(95|85)A?/i);
  if (pebaMatch) {
    return `PEBA-${pebaMatch[1]}A`;
  }
  
  // Check for base materials (order matters - check longer names first)
  const baseMaterials = [
    // Enhanced variants first
    'PETG+', 'PLA+', 'ABS+', 'CPE+',
    // Engineering plastics
    'PCTG', 'PEEK', 'PEKK', 'PEI', 'PEBA', 'CPE', 'POM', 'PPA', 'PPSU', 'PSU', 'PPS',
    // Common plastics
    'PETG', 'ABS', 'ASA', 'PLA',
    // Flexible
    'TPU', 'TPE',
    // Other base
    'PA', 'PC', 'PVA', 'HIPS', 'PP', 'PET', 'PVB',
  ];
  
  for (const mat of baseMaterials) {
    // Use word boundary matching for accuracy
    const regex = new RegExp(`\\b${mat}\\b`, 'i');
    if (regex.test(combined)) {
      return mat;
    }
  }
  
  return null;
}

/**
 * Normalize an existing material value to canonical form
 * This handles database values that may have been stored in non-canonical forms
 */
export function normalizeMaterial(material: string | null | undefined): string | null {
  if (!material) return null;
  
  const upper = material.toUpperCase().trim();
  
  const normMap: Record<string, string> = {
    // PLA specialty
    'PLA-WOOD': 'PLA-Wood',
    'WOOD': 'PLA-Wood',
    'PLA-METAL': 'PLA-Metal',
    'METAL': 'PLA-Metal',
    'PLA-MARBLE': 'PLA-Marble',
    'MARBLE PLA': 'PLA-Marble',
    'PLA-STONE': 'PLA-Stone',
    'PLA-GLOW': 'PLA-Glow',
    // PLA variants
    'RAPID PLA+': 'PLA+',
    'RAPID PLA': 'PLA',
    'PLA PRO': 'PLA+',
    'PLA PLUS': 'PLA+',
    'TOUGH PLA': 'PLA+',
    'HYPER PLA': 'PLA',
    'HIGH SPEED PLA': 'PLA',
    'HS PLA': 'PLA',
    'PLA-BASIC': 'PLA',
    'PLA-MATTE': 'PLA',
    'PLA MATTE': 'PLA',
    'PLA META': 'PLA',
    'PLA TEMP': 'PLA',
    'PLA UV': 'PLA',
    'PLA+ 2.0': 'PLA+',
    'VOLCANO PLA': 'PLA',
    'PEARLESCENT PLA': 'PLA',
    'PLA-GALAXY': 'PLA',
    'PLA BLEND': 'PLA',
    'PLA-CONDUCTIVE': 'ESD-PLA',
    'PLA/PHA': 'Other',
    'ALLPHA': 'Other',
    // HTPLA
    'HTPLA': 'HTPLA',
    'HT-PLA': 'HTPLA',
    'HTPLA-CF': 'PLA-CF',
    // LW variants
    'LW-PLA': 'LW-PLA',
    'LW-PLA-HT': 'LW-PLA',
    'LW-ASA': 'LW-ASA',
    // Nylon/PA
    'NYLON': 'PA',
    'NYLON-CF': 'PA-CF',
    'NYLON-GF': 'PA-GF',
    'NYLON-AF': 'PA',
    'NYLONX': 'PA-CF',
    'NYLONG': 'PA-GF',
    'PA6': 'PA',
    'PA12': 'PA',
    'PA6-CF': 'PA-CF',
    'PA12-CF': 'PA-CF',
    // PETG
    'PRO PETG': 'PETG+',
    'PETG PRO': 'PETG+',
    'RPETG': 'PETG',
    'PETG IRIDESCENT': 'PETG',
    // ABS
    'ABS PRO': 'ABS+',
    'ABS HT': 'ABS',
    // ASA
    'ASA+': 'ASA',
    'TITANX': 'ASA',
    'RYNO': 'ASA',
    // TPU with hardness
    'TPU 95A': 'TPU-95A',
    'TPU 90A': 'TPU-90A',
    'TPU 85A': 'TPU-85A',
    'TPU 83A': 'TPU-83A',
    'TPU 98A': 'TPU-98A',
    'TPU 64D': 'TPU-64D',
    'TPU95A': 'TPU-95A',
    'TPU90A': 'TPU-90A',
    'TPU85A': 'TPU-85A',
    'TPE-83A': 'TPU-83A',
    'TPU VARIOSHORE': 'TPU',
    'TPU AIR': 'TPU',
    'TPU GLOW': 'TPU',
    'FLEXPLA': 'TPU',
    // PEBA
    'PEBA 95A': 'PEBA-95A',
    'PEBA 85A': 'PEBA-85A',
    'PEBA AIR': 'PEBA',
    // ESD variants
    'ESD-ABS': 'ESD-ABS',
    'ESD-PETG': 'ESD-PETG',
    'ESD-PLA': 'ESD-PLA',
    'ESD-PC': 'ESD-PC',
    'ESD-PEEK': 'ESD-PEEK',
    'ESD-PEKK': 'ESD-PEKK',
    'ESD-PEI': 'ESD-PEI',
    'ESD PEI 1010': 'ESD-PEI',
    'ESD PEI 9085': 'ESD-PEI',
    // FR variants
    'FR-ABS': 'FR-ABS',
    'FR-PC': 'FR-PC',
    'PC-FR': 'FR-PC',
    // PEI
    'PEI 1010': 'PEI',
    'PEI 9085': 'PEI',
    'PEI-CF': 'PEI-CF',
    'ULTEM': 'PEI',
    // PEKK
    'PEKK-A': 'PEKK',
    'PEKK-CF': 'PEKK-CF',
    // PC variants
    'PC PRO': 'PC',
    'EZPC': 'PC',
    'PC BLEND': 'PC',
    'PC-PBT': 'PC-PBT',
    // CPE
    'CPE+': 'CPE+',
    'CPE-CF': 'CPE-CF',
    // CoPoly (ColorFabb)
    'COPOLY-CF': 'PETG-CF',
    'COPOLY-NGEN': 'PETG',
    'COPOLY-HT': 'PETG',
    'COPOLY-XT': 'PETG',
    'NGEN': 'PETG',
    // PPA
    'PPA-CF': 'PPA-CF',
    'PPA-GF': 'PPA-GF',
    // PPS
    'PPS-CF': 'PPS',
    // Other specialty
    'PRO PCTG': 'PCTG',
    'CARBON': 'Other',
    'CARBON FIBER': 'Other',
    'SIMUBONE': 'Other',
    'RPLA': 'PLA',
    // Support materials
    'SUPPORT': 'Support',
    'BREAKAWAY': 'Breakaway',
    'CLEANING': 'Cleaning',
    'UNKNOWN': 'Unknown',
  };
  
  // First check exact match
  if (normMap[upper]) {
    return normMap[upper];
  }
  
  // Then check if any key is contained in the material string
  for (const [key, value] of Object.entries(normMap)) {
    if (upper.includes(key)) {
      return value;
    }
  }
  
  return material;
}

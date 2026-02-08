import { Database } from "@/integrations/supabase/types";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface FieldMapping {
  key: keyof Filament;
  label: string;
  category: string;
  unit?: string;
}

// All 101 filament database columns organized into categories
export const FILAMENT_FIELD_MAPPINGS: FieldMapping[] = [
  // === BASIC INFO ===
  { key: 'product_title', label: 'Product Name', category: 'Basic Info' },
  { key: 'vendor', label: 'Brand', category: 'Basic Info' },
  { key: 'material', label: 'Material Type', category: 'Basic Info' },
  { key: 'color_family', label: 'Color Family', category: 'Basic Info' },
  { key: 'color_hex', label: 'Color Hex Code', category: 'Basic Info' },
  { key: 'finish_type', label: 'Finish Type', category: 'Basic Info' },
  { key: 'featured_image', label: 'Image URL', category: 'Basic Info' },
  { key: 'variant_available', label: 'Available', category: 'Basic Info' },
  
  // === IDENTIFIERS ===
  { key: 'id', label: 'Filament ID', category: 'Identifiers' },
  { key: 'product_id', label: 'Product ID', category: 'Identifiers' },
  { key: 'product_handle', label: 'Product Handle', category: 'Identifiers' },
  { key: 'product_line_id', label: 'Product Line ID', category: 'Identifiers' },
  { key: 'variant_sku', label: 'SKU', category: 'Identifiers' },
  { key: 'mpn', label: 'MPN', category: 'Identifiers' },
  { key: 'ean', label: 'EAN', category: 'Identifiers' },
  { key: 'gtin', label: 'GTIN', category: 'Identifiers' },
  { key: 'upc', label: 'UPC', category: 'Identifiers' },
  { key: 'brand_id', label: 'Brand ID', category: 'Identifiers' },
  
  // === PRICING ===
  { key: 'variant_price', label: 'Price (USD)', category: 'Pricing', unit: '$' },
  { key: 'variant_compare_at_price', label: 'Compare At Price', category: 'Pricing', unit: '$' },
  { key: 'price_eur', label: 'Price (EUR)', category: 'Pricing', unit: '€' },
  { key: 'price_gbp', label: 'Price (GBP)', category: 'Pricing', unit: '£' },
  { key: 'price_cad', label: 'Price (CAD)', category: 'Pricing', unit: 'CA$' },
  { key: 'price_aud', label: 'Price (AUD)', category: 'Pricing', unit: 'A$' },
  { key: 'price_jpy', label: 'Price (JPY)', category: 'Pricing', unit: '¥' },
  { key: 'amazon_price_usd', label: 'Amazon Price (USD)', category: 'Pricing', unit: '$' },
  { key: 'value_score', label: 'Value Score', category: 'Pricing' },
  
  // === PHYSICAL PROPERTIES ===
  { key: 'diameter_nominal_mm', label: 'Diameter', category: 'Physical Properties', unit: 'mm' },
  { key: 'net_weight_g', label: 'Net Weight', category: 'Physical Properties', unit: 'g' },
  { key: 'pack_quantity', label: 'Pack Quantity', category: 'Physical Properties' },
  { key: 'density_g_cm3', label: 'Density', category: 'Physical Properties', unit: 'g/cm³' },
  { key: 'transmission_distance', label: 'Transmission Distance', category: 'Physical Properties' },
  
  // === PRINT SETTINGS ===
  { key: 'nozzle_temp_min_c', label: 'Nozzle Temp Min', category: 'Print Settings', unit: '°C' },
  { key: 'nozzle_temp_max_c', label: 'Nozzle Temp Max', category: 'Print Settings', unit: '°C' },
  { key: 'nozzle_temp_sweetspot_c', label: 'Nozzle Temp Sweetspot', category: 'Print Settings', unit: '°C' },
  { key: 'bed_temp_min_c', label: 'Bed Temp Min', category: 'Print Settings', unit: '°C' },
  { key: 'bed_temp_max_c', label: 'Bed Temp Max', category: 'Print Settings', unit: '°C' },
  { key: 'melt_temp_c', label: 'Melt Temperature', category: 'Print Settings', unit: '°C' },
  { key: 'tg_c', label: 'Glass Transition Temp (Tg)', category: 'Print Settings', unit: '°C' },
  { key: 'fan_min_percent', label: 'Fan Min', category: 'Print Settings', unit: '%' },
  { key: 'fan_max_percent', label: 'Fan Max', category: 'Print Settings', unit: '%' },
  { key: 'print_speed_max_mms', label: 'Max Print Speed', category: 'Print Settings', unit: 'mm/s' },
  { key: 'high_speed_capable', label: 'High Speed Capable', category: 'Print Settings' },
  { key: 'recommended_nozzle_type', label: 'Recommended Nozzle Type', category: 'Print Settings' },
  { key: 'is_nozzle_abrasive', label: 'Nozzle Abrasive', category: 'Print Settings' },
  { key: 'nozzle_care', label: 'Nozzle Care Notes', category: 'Print Settings' },
  
  // === MECHANICAL PROPERTIES ===
  { key: 'tensile_strength_xy_mpa', label: 'Tensile Strength (XY)', category: 'Mechanical Properties', unit: 'MPa' },
  { key: 'tensile_modulus_xy_mpa', label: 'Tensile Modulus (XY)', category: 'Mechanical Properties', unit: 'MPa' },
  { key: 'elongation_break_xy_percent', label: 'Elongation at Break (XY)', category: 'Mechanical Properties', unit: '%' },
  { key: 'flexural_strength_mpa', label: 'Flexural Strength', category: 'Mechanical Properties', unit: 'MPa' },
  { key: 'shore_hardness_d', label: 'Shore Hardness D', category: 'Mechanical Properties' },
  { key: 'strength_index', label: 'Strength Index', category: 'Mechanical Properties' },
  
  // === DRYING & CARE ===
  { key: 'drying_temp_c', label: 'Drying Temperature', category: 'Drying & Care', unit: '°C' },
  { key: 'drying_time_hours', label: 'Drying Time', category: 'Drying & Care', unit: 'hours' },
  { key: 'moisture_sensitivity_level', label: 'Moisture Sensitivity', category: 'Drying & Care' },
  { key: 'moisture_care', label: 'Moisture Care Notes', category: 'Drying & Care' },
  
  // === SPOOL SPECIFICATIONS ===
  { key: 'spool_outer_d_mm', label: 'Spool Outer Diameter', category: 'Spool Specifications', unit: 'mm' },
  { key: 'spool_width_mm', label: 'Spool Width', category: 'Spool Specifications', unit: 'mm' },
  { key: 'spool_material', label: 'Spool Material', category: 'Spool Specifications' },
  { key: 'spool_ams_fit', label: 'AMS Compatible', category: 'Spool Specifications' },
  
  // === MATERIAL COMPOSITION ===
  { key: 'carbon_fiber_percentage', label: 'Carbon Fiber Content', category: 'Material Composition', unit: '%' },
  { key: 'glass_fiber_percentage', label: 'Glass Fiber Content', category: 'Material Composition', unit: '%' },
  { key: 'wood_powder_percentage', label: 'Wood Powder Content', category: 'Material Composition', unit: '%' },
  { key: 'wood_type', label: 'Wood Type', category: 'Material Composition' },
  { key: 'wood_fiber_length_mm', label: 'Wood Fiber Length', category: 'Material Composition', unit: 'mm' },
  { key: 'wood_particle_size_microns', label: 'Wood Particle Size', category: 'Material Composition', unit: 'μm' },
  { key: 'wood_scent_level', label: 'Wood Scent Level', category: 'Material Composition' },
  
  // === SCORES & RATINGS ===
  { key: 'printability_index', label: 'Printability Index', category: 'Scores & Ratings' },
  { key: 'ease_of_printing_score', label: 'Ease of Printing Score', category: 'Scores & Ratings' },
  { key: 'dimensional_accuracy_score', label: 'Dimensional Accuracy Score', category: 'Scores & Ratings' },
  { key: 'food_contact_rating', label: 'Food Contact Rating', category: 'Scores & Ratings' },
  
  // === TAGS & USE CASES ===
  { key: 'use_case_tags', label: 'Use Case Tags', category: 'Tags & Use Cases' },
  { key: 'industry_tags', label: 'Industry Tags', category: 'Tags & Use Cases' },
  { key: 'available_regions', label: 'Available Regions', category: 'Tags & Use Cases' },
  
  // === PRODUCT URLS ===
  { key: 'product_url', label: 'Product URL (US)', category: 'Product URLs' },
  { key: 'product_url_eu', label: 'Product URL (EU)', category: 'Product URLs' },
  { key: 'product_url_uk', label: 'Product URL (UK)', category: 'Product URLs' },
  { key: 'product_url_ca', label: 'Product URL (CA)', category: 'Product URLs' },
  { key: 'product_url_au', label: 'Product URL (AU)', category: 'Product URLs' },
  { key: 'product_url_jp', label: 'Product URL (JP)', category: 'Product URLs' },
  { key: 'tds_url', label: 'Technical Data Sheet URL', category: 'Product URLs' },
  
  // === AMAZON LINKS ===
  { key: 'amazon_link_us', label: 'Amazon US Link', category: 'Amazon Links' },
  { key: 'amazon_link_uk', label: 'Amazon UK Link', category: 'Amazon Links' },
  { key: 'amazon_link_de', label: 'Amazon DE Link', category: 'Amazon Links' },
  { key: 'amazon_match_confidence', label: 'Amazon Match Confidence', category: 'Amazon Links' },
  { key: 'amazon_prices_last_updated_at', label: 'Amazon Prices Updated', category: 'Amazon Links' },
  
  // === SYSTEM METADATA ===
  { key: 'created_at', label: 'Created At', category: 'System Metadata' },
  { key: 'updated_at', label: 'Updated At', category: 'System Metadata' },
  { key: 'published_at', label: 'Published At', category: 'System Metadata' },
  { key: 'last_scraped_at', label: 'Last Scraped At', category: 'System Metadata' },
  { key: 'next_scrape_at', label: 'Next Scrape At', category: 'System Metadata' },
  { key: 'scrape_frequency_hours', label: 'Scrape Frequency', category: 'System Metadata', unit: 'hours' },
  { key: 'last_external_sync_at', label: 'Last External Sync', category: 'System Metadata' },
  { key: 'regional_prices_updated_at', label: 'Regional Prices Updated', category: 'System Metadata' },
  { key: 'url_validated_at', label: 'URL Validated At', category: 'System Metadata' },
  { key: 'url_validation_status', label: 'URL Validation Status', category: 'System Metadata' },
  { key: 'sync_status', label: 'Sync Status', category: 'System Metadata' },
  { key: 'external_data_hash', label: 'External Data Hash', category: 'System Metadata' },
  { key: 'auto_created', label: 'Auto Created', category: 'System Metadata' },
  { key: 'auto_updated', label: 'Auto Updated', category: 'System Metadata' },
  { key: 'user_override_fields', label: 'User Override Fields', category: 'System Metadata' },
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

function escapeCSV(value: string): string {
  // Escape double quotes and wrap in quotes if contains comma, newline, or quote
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Exports all filament data to a vertical CSV format (key-value pairs)
 * This format is easier to read and compare across filaments
 */
export function exportFilamentToFullCSV(filament: Filament): void {
  const rows: string[][] = [
    ['Category', 'Field', 'Value', 'Unit']
  ];

  for (const mapping of FILAMENT_FIELD_MAPPINGS) {
    const value = filament[mapping.key];
    rows.push([
      mapping.category,
      mapping.label,
      formatValue(value),
      mapping.unit || ''
    ]);
  }

  const csv = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const filename = `${(filament.product_title || 'filament').replace(/[^a-z0-9]/gi, '_')}_full_data.csv`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Exports filament data to a flat CSV format (single row with all columns)
 * Useful for batch exports and spreadsheet analysis
 */
export function exportFilamentToFlatCSV(filament: Filament): void {
  const headers = FILAMENT_FIELD_MAPPINGS.map(m => m.label);
  const values = FILAMENT_FIELD_MAPPINGS.map(m => formatValue(filament[m.key]));

  const csv = [
    headers.map(escapeCSV).join(','),
    values.map(escapeCSV).join(',')
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const filename = `${(filament.product_title || 'filament').replace(/[^a-z0-9]/gi, '_')}_flat.csv`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Gets a summary of field categories and counts
 */
export function getFieldCategorySummary(): { category: string; count: number }[] {
  const categoryMap = new Map<string, number>();
  
  for (const mapping of FILAMENT_FIELD_MAPPINGS) {
    const count = categoryMap.get(mapping.category) || 0;
    categoryMap.set(mapping.category, count + 1);
  }
  
  return Array.from(categoryMap.entries()).map(([category, count]) => ({
    category,
    count
  }));
}

/**
 * FIELD GAP DETECTOR v2
 * 
 * Analyzes each filament to find which of the 161 fields are missing or empty.
 * Categorizes gaps by priority and estimates difficulty to fill.
 */

// ============================================================================
// FIELD DEFINITIONS (161 fields from database schema)
// ============================================================================

export const ALL_FIELDS = [
  // Core Identity (15 fields)
  'id', 'product_id', 'product_title', 'display_name', 'product_handle',
  'vendor', 'brand_id', 'material', 'material_id', 'product_line_id',
  'mpn', 'gtin', 'ean', 'upc', 'variant_sku',
  
  // Color & Appearance (5 fields)
  'color_family', 'color_family_id', 'color_hex', 'finish_type', 'finish_type_id',
  'featured_image', 'variant_image',
  
  // Pricing - Base (8 fields)
  'variant_price', 'variant_compare_at_price', 'msrp', 'price_confidence',
  'price_source', 'price_last_manual_refresh', 'regional_prices_updated_at',
  'amazon_price_usd',
  
  // Pricing - Regional (6 fields)
  'price_eur', 'price_gbp', 'price_cad', 'price_aud', 'price_jpy', 'price_cny',
  
  // Amazon Affiliate Links (12 fields)
  'amazon_link_us', 'amazon_link_ca', 'amazon_link_uk', 'amazon_link_de',
  'amazon_link_fr', 'amazon_link_es', 'amazon_link_it', 'amazon_link_nl',
  'amazon_link_be', 'amazon_link_jp', 'amazon_link_au', 'amazon_match_confidence',
  'amazon_prices_last_updated_at',
  
  // Product URLs - Regional (7 fields)
  'product_url', 'product_url_ca', 'product_url_eu', 'product_url_uk',
  'product_url_au', 'product_url_jp', 'product_url_cn',
  'has_regional_urls', 'available_regions', 'primary_region', 'cross_region_source',
  
  // Physical Properties (8 fields)
  'net_weight_g', 'pack_quantity', 'diameter_nominal_mm', 'diameter_is_assumed',
  'density_g_cm3', 'water_absorption_percent', 'shrinkage_annealed_percent',
  
  // Thermal Properties (12 fields)
  'nozzle_temp_min_c', 'nozzle_temp_max_c', 'nozzle_temp_sweetspot_c',
  'bed_temp_min_c', 'bed_temp_max_c', 'melt_temp_c', 'tg_c',
  'vicat_softening_temp_c', 'hdt_045_mpa_c', 'hdt_18_mpa_c',
  'annealing_temp_c', 'annealing_time_hours', 'drying_temp_c', 'drying_time_hours',
  
  // Mechanical Properties (15 fields)
  'tensile_strength_xy_mpa', 'tensile_strength_z_mpa',
  'tensile_modulus_xy_mpa', 'tensile_modulus_z_mpa',
  'elongation_break_xy_percent', 'elongation_break_z_percent',
  'bending_strength_mpa', 'bending_modulus_mpa', 'flexural_strength_mpa',
  'impact_strength_kj_m2', 'notched_izod_j_m', 'hardness_shore_a',
  'shore_hardness_d', 'youngs_modulus_mpa', 'poissons_ratio',
  
  // Optical Properties (2 fields)
  'haze_percent', 'light_transmission_percent',
  
  // Electrical Properties (2 fields)
  'surface_resistivity_ohm', 'volume_resistivity_ohm_cm',
  
  // Chemical Properties (2 fields)
  'chemical_resistance', 'food_contact_rating',
  
  // Printing Parameters (7 fields)
  'print_speed_max_mms', 'fan_min_percent', 'fan_max_percent',
  'retraction_length_mm', 'retraction_speed_mms',
  'max_bridging_length_mm', 'max_overhang_angle_deg',
  
  // Special Material Properties (8 fields)
  'carbon_fiber_percentage', 'glass_fiber_percentage',
  'wood_powder_percentage', 'wood_type', 'wood_particle_size_microns',
  'wood_fiber_length_mm', 'wood_scent_level', 'melt_index_g_10min',
  
  // Spool Information (4 fields)
  'spool_ams_fit', 'spool_material', 'spool_outer_d_mm', 'spool_width_mm',
  
  // HueForge TD (4 fields)
  'transmission_distance', 'td_confidence', 'td_source', 'td_matched_at', 'tds_url',
  
  // Scoring & Indexes (5 fields)
  'filascope_score', 'ease_of_printing_score', 'dimensional_accuracy_score',
  'printability_index', 'value_score', 'strength_index',
  
  // Use Case & Industry (4 fields)
  'use_case_tags', 'industry_tags', 'moisture_sensitivity_level',
  'moisture_care', 'nozzle_care',
  
  // Sync Metadata (15 fields)
  'sync_enabled', 'sync_source', 'sync_status', 'scrape_frequency_hours',
  'next_scrape_at', 'last_scraped_at', 'last_external_sync_at',
  'last_sync_error', 'auto_created', 'auto_updated', 'external_data_hash',
  'created_at', 'updated_at', 'published_at',
  
  // Validation & Admin (6 fields)
  'url_validation_status', 'url_validated_at', 'variant_available',
  'admin_notes', 'user_override_fields',
  
  // Other (5 fields)
  'high_speed_capable', 'is_nozzle_abrasive', 'search_vector',
  'scrape_frequency_hours', 'next_scrape_at',
];

// Remove duplicates
const uniqueFields = [...new Set(ALL_FIELDS)];

export const FIELD_COUNT = uniqueFields.length;
export const FIELD_LIST = uniqueFields;

// ============================================================================
// FIELD CATEGORIES
// ============================================================================

export const FIELD_CATEGORIES = {
  basic: {
    name: 'Basic Identity',
    fields: [
      'product_id', 'product_title', 'display_name', 'product_handle',
      'vendor', 'brand_id', 'material', 'material_id', 'product_line_id',
      'mpn', 'gtin', 'ean', 'upc', 'variant_sku',
      'color_family', 'color_family_id', 'color_hex', 'finish_type', 'finish_type_id',
      'featured_image', 'variant_image',
      'variant_price', 'variant_compare_at_price', 'msrp',
      'variant_available', 'product_url'
    ],
    total: 27,
    description: 'Core product information from Shopify/WooCommerce API'
  },
  
  technical: {
    name: 'Technical Specifications',
    fields: [
      // Thermal
      'nozzle_temp_min_c', 'nozzle_temp_max_c', 'nozzle_temp_sweetspot_c',
      'bed_temp_min_c', 'bed_temp_max_c', 'melt_temp_c', 'tg_c',
      'vicat_softening_temp_c', 'hdt_045_mpa_c', 'hdt_18_mpa_c',
      'annealing_temp_c', 'annealing_time_hours', 'drying_temp_c', 'drying_time_hours',
      // Mechanical
      'tensile_strength_xy_mpa', 'tensile_strength_z_mpa',
      'tensile_modulus_xy_mpa', 'tensile_modulus_z_mpa',
      'elongation_break_xy_percent', 'elongation_break_z_percent',
      'bending_strength_mpa', 'bending_modulus_mpa', 'flexural_strength_mpa',
      'impact_strength_kj_m2', 'notched_izod_j_m', 'hardness_shore_a',
      'shore_hardness_d', 'youngs_modulus_mpa', 'poissons_ratio',
      // Physical
      'net_weight_g', 'pack_quantity', 'diameter_nominal_mm', 'diameter_is_assumed',
      'density_g_cm3', 'water_absorption_percent', 'shrinkage_annealed_percent',
      // Printing
      'print_speed_max_mms', 'fan_min_percent', 'fan_max_percent',
      'retraction_length_mm', 'retraction_speed_mms',
      'max_bridging_length_mm', 'max_overhang_angle_deg',
      // Optical
      'haze_percent', 'light_transmission_percent',
      // Electrical
      'surface_resistivity_ohm', 'volume_resistivity_ohm_cm',
      // Chemical
      'chemical_resistance', 'food_contact_rating',
      // Special
      'carbon_fiber_percentage', 'glass_fiber_percentage',
      'wood_powder_percentage', 'wood_type', 'wood_particle_size_microns',
      'wood_fiber_length_mm', 'wood_scent_level', 'melt_index_g_10min',
      // Spool
      'spool_ams_fit', 'spool_material', 'spool_outer_d_mm', 'spool_width_mm',
      // TD
      'transmission_distance', 'td_confidence', 'td_source', 'td_matched_at', 'tds_url',
      // Care
      'moisture_sensitivity_level', 'moisture_care', 'nozzle_care',
      // Use case
      'use_case_tags', 'industry_tags',
      // Capability
      'high_speed_capable', 'is_nozzle_abrasive'
    ],
    total: 70,
    description: 'Technical specifications from TDS sheets and product pages'
  },
  
  regional: {
    name: 'Regional Data',
    fields: [
      // Regional prices
      'price_eur', 'price_gbp', 'price_cad', 'price_aud', 'price_jpy', 'price_cny',
      // Regional URLs
      'product_url_ca', 'product_url_eu', 'product_url_uk',
      'product_url_au', 'product_url_jp', 'product_url_cn',
      'has_regional_urls', 'available_regions', 'primary_region', 'cross_region_source',
      // Amazon links
      'amazon_link_us', 'amazon_link_ca', 'amazon_link_uk', 'amazon_link_de',
      'amazon_link_fr', 'amazon_link_es', 'amazon_link_it', 'amazon_link_nl',
      'amazon_link_be', 'amazon_link_jp', 'amazon_link_au',
      'amazon_match_confidence', 'amazon_price_usd', 'amazon_prices_last_updated_at'
    ],
    total: 30,
    description: 'Multi-region pricing and Amazon affiliate links'
  },
  
  scoring: {
    name: 'Scoring & Indexes',
    fields: [
      'filascope_score', 'ease_of_printing_score', 'dimensional_accuracy_score',
      'printability_index', 'value_score', 'strength_index'
    ],
    total: 6,
    description: 'Calculated scores and indexes'
  },
  
  metadata: {
    name: 'Sync Metadata',
    fields: [
      'price_confidence', 'price_source', 'price_last_manual_refresh',
      'regional_prices_updated_at', 'sync_enabled', 'sync_source', 'sync_status',
      'scrape_frequency_hours', 'next_scrape_at', 'last_scraped_at',
      'last_external_sync_at', 'last_sync_error', 'auto_created', 'auto_updated',
      'external_data_hash', 'created_at', 'updated_at', 'published_at',
      'url_validation_status', 'url_validated_at', 'admin_notes', 'user_override_fields'
    ],
    total: 22,
    description: 'Sync status and administrative metadata'
  }
};

// ============================================================================
// FIELD PRIORITIES
// ============================================================================

export const FIELD_PRIORITIES = {
  // P0 - Critical (Must have for basic functionality)
  P0: [
    'product_title', 'vendor', 'material', 'variant_price', 'featured_image',
    'color_hex', 'color_family', 'nozzle_temp_min_c', 'nozzle_temp_max_c',
    'bed_temp_min_c', 'bed_temp_max_c', 'product_url', 'variant_available',
    'net_weight_g', 'density_g_cm3'
  ],
  
  // P1 - Important (Should have for good user experience)
  P1: [
    'display_name', 'product_handle', 'finish_type', 'variant_compare_at_price',
    'msrp', 'material_id', 'product_line_id', 'mpn', 'variant_sku',
    'nozzle_temp_sweetspot_c', 'melt_temp_c', 'tg_c',
    'print_speed_max_mms', 'fan_min_percent', 'fan_max_percent',
    'retraction_length_mm', 'retraction_speed_mms',
    'diameter_nominal_mm', 'pack_quantity',
    'price_eur', 'price_gbp', 'price_cad', 'price_aud',
    'product_url_ca', 'product_url_eu', 'product_url_uk',
    'amazon_link_us', 'amazon_link_ca', 'amazon_link_uk',
    'moisture_sensitivity_level', 'high_speed_capable', 'is_nozzle_abrasive',
    'spool_ams_fit', 'transmission_distance', 'tds_url'
  ],
  
  // P2 - Nice to have (Enhances data quality)
  P2: [
    'display_name', 'brand_id', 'gtin', 'ean', 'upc',
    'vicat_softening_temp_c', 'hdt_045_mpa_c', 'hdt_18_mpa_c',
    'annealing_temp_c', 'annealing_time_hours', 'drying_temp_c', 'drying_time_hours',
    'tensile_strength_xy_mpa', 'tensile_strength_z_mpa',
    'tensile_modulus_xy_mpa', 'tensile_modulus_z_mpa',
    'elongation_break_xy_percent', 'elongation_break_z_percent',
    'bending_strength_mpa', 'bending_modulus_mpa', 'flexural_strength_mpa',
    'impact_strength_kj_m2', 'notched_izod_j_m', 'hardness_shore_a',
    'shore_hardness_d', 'youngs_modulus_mpa', 'poissons_ratio',
    'haze_percent', 'light_transmission_percent',
    'surface_resistivity_ohm', 'volume_resistivity_ohm_cm',
    'chemical_resistance', 'food_contact_rating',
    'carbon_fiber_percentage', 'glass_fiber_percentage',
    'wood_powder_percentage', 'wood_type', 'wood_particle_size_microns',
    'wood_fiber_length_mm', 'wood_scent_level', 'melt_index_g_10min',
    'spool_material', 'spool_outer_d_mm', 'spool_width_mm',
    'max_bridging_length_mm', 'max_overhang_angle_deg',
    'price_jpy', 'price_cny',
    'amazon_link_de', 'amazon_link_fr', 'amazon_link_es',
    'amazon_link_it', 'amazon_link_nl', 'amazon_link_be',
    'amazon_link_jp', 'amazon_link_au', 'amazon_match_confidence',
    'amazon_price_usd', 'amazon_prices_last_updated_at',
    'product_url_au', 'product_url_jp', 'product_url_cn',
    'has_regional_urls', 'available_regions', 'primary_region',
    'td_confidence', 'td_source', 'td_matched_at',
    'use_case_tags', 'industry_tags', 'moisture_care', 'nozzle_care',
    'water_absorption_percent', 'shrinkage_annealed_percent'
  ],
  
  // P3 - Metadata (Administrative)
  P3: [
    'price_confidence', 'price_source', 'price_last_manual_refresh',
    'regional_prices_updated_at', 'sync_enabled', 'sync_source', 'sync_status',
    'scrape_frequency_hours', 'next_scrape_at', 'last_scraped_at',
    'last_external_sync_at', 'last_sync_error', 'auto_created', 'auto_updated',
    'external_data_hash', 'created_at', 'updated_at', 'published_at',
    'url_validation_status', 'url_validated_at', 'admin_notes', 'user_override_fields',
    'search_vector'
  ]
};

// ============================================================================
// FIELD DIFFICULTY ESTIMATION
// ============================================================================

export const FIELD_DIFFICULTY = {
  // Easy - Available from Shopify API
  easy: [
    'product_id', 'product_title', 'product_handle', 'vendor', 'material',
    'variant_price', 'variant_compare_at_price', 'variant_sku', 'variant_available',
    'featured_image', 'variant_image', 'color_family', 'finish_type',
    'product_url', 'display_name', 'material_id', 'product_line_id',
    'mpn', 'gtin', 'ean', 'upc', 'net_weight_g', 'diameter_nominal_mm',
    'pack_quantity', 'spool_ams_fit', 'spool_material', 'spool_outer_d_mm',
    'spool_width_mm', 'high_speed_capable', 'is_nozzle_abrasive',
    'moisture_sensitivity_level', 'use_case_tags', 'industry_tags'
  ],
  
  // Medium - Requires Firecrawl or product page scraping
  medium: [
    'nozzle_temp_min_c', 'nozzle_temp_max_c', 'nozzle_temp_sweetspot_c',
    'bed_temp_min_c', 'bed_temp_max_c', 'density_g_cm3',
    'print_speed_max_mms', 'fan_min_percent', 'fan_max_percent',
    'retraction_length_mm', 'retraction_speed_mms',
    'max_bridging_length_mm', 'max_overhang_angle_deg',
    'moisture_care', 'nozzle_care', 'color_hex'
  ],
  
  // Hard - Requires TDS sheet extraction or complex calculation
  hard: [
    'melt_temp_c', 'tg_c', 'vicat_softening_temp_c', 'hdt_045_mpa_c', 'hdt_18_mpa_c',
    'annealing_temp_c', 'annealing_time_hours', 'drying_temp_c', 'drying_time_hours',
    'tensile_strength_xy_mpa', 'tensile_strength_z_mpa',
    'tensile_modulus_xy_mpa', 'tensile_modulus_z_mpa',
    'elongation_break_xy_percent', 'elongation_break_z_percent',
    'bending_strength_mpa', 'bending_modulus_mpa', 'flexural_strength_mpa',
    'impact_strength_kj_m2', 'notched_izod_j_m', 'hardness_shore_a',
    'shore_hardness_d', 'youngs_modulus_mpa', 'poissons_ratio',
    'haze_percent', 'light_transmission_percent',
    'surface_resistivity_ohm', 'volume_resistivity_ohm_cm',
    'chemical_resistance', 'food_contact_rating',
    'carbon_fiber_percentage', 'glass_fiber_percentage',
    'wood_powder_percentage', 'wood_type', 'wood_particle_size_microns',
    'wood_fiber_length_mm', 'wood_scent_level', 'melt_index_g_10min',
    'water_absorption_percent', 'shrinkage_annealed_percent',
    'transmission_distance', 'td_confidence', 'td_source', 'td_matched_at', 'tds_url'
  ],
  
  // Very Hard - Requires Amazon PA-API or manual curation
  very_hard: [
    'price_eur', 'price_gbp', 'price_cad', 'price_aud', 'price_jpy', 'price_cny',
    'product_url_ca', 'product_url_eu', 'product_url_uk',
    'product_url_au', 'product_url_jp', 'product_url_cn',
    'has_regional_urls', 'available_regions', 'primary_region', 'cross_region_source',
    'amazon_link_us', 'amazon_link_ca', 'amazon_link_uk', 'amazon_link_de',
    'amazon_link_fr', 'amazon_link_es', 'amazon_link_it', 'amazon_link_nl',
    'amazon_link_be', 'amazon_link_jp', 'amazon_link_au',
    'amazon_match_confidence', 'amazon_price_usd', 'amazon_prices_last_updated_at',
    'filascope_score', 'ease_of_printing_score', 'dimensional_accuracy_score',
    'printability_index', 'value_score', 'strength_index'
  ]
};

// ============================================================================
// GAP DETECTION INTERFACE
// ============================================================================

export interface FieldGap {
  field: string;
  category: 'basic' | 'technical' | 'regional' | 'scoring' | 'metadata';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  currentValue: any;
  source: 'shopify' | 'firecrawl' | 'tds' | 'amazon' | 'manual' | 'calculate' | 'unknown';
  estimatedDifficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
  dependencies: string[]; // Other fields that should be filled first
}

export interface FilamentGaps {
  filament_id: string;
  product_title: string;
  vendor: string;
  total_fields: number;
  populated_fields: number;
  missing_fields: number;
  coverage_percentage: number;
  gaps: FieldGap[];
  summary: {
    basic: { total: number; populated: number; percentage: number };
    technical: { total: number; populated: number; percentage: number };
    regional: { total: number; populated: number; percentage: number };
    scoring: { total: number; populated: number; percentage: number };
    metadata: { total: number; populated: number; percentage: number };
  };
}

// ============================================================================
// GAP DETECTION FUNCTIONS
// ============================================================================

/**
 * Determine field category
 */
export function getFieldCategory(field: string): 'basic' | 'technical' | 'regional' | 'scoring' | 'metadata' {
  for (const [category, config] of Object.entries(FIELD_CATEGORIES)) {
    if (config.fields.includes(field)) {
      return category as any;
    }
  }
  return 'metadata'; // Default
}

/**
 * Determine field priority
 */
export function getFieldPriority(field: string): 'P0' | 'P1' | 'P2' | 'P3' {
  for (const [priority, fields] of Object.entries(FIELD_PRIORITIES)) {
    if (fields.includes(field)) {
      return priority as any;
    }
  }
  return 'P3'; // Default
}

/**
 * Determine field source
 */
export function determineSource(field: string, filament: any): 'shopify' | 'firecrawl' | 'tds' | 'amazon' | 'manual' | 'calculate' | 'unknown' {
  // Shopify API fields
  const shopifyFields = [
    'product_id', 'product_title', 'product_handle', 'vendor', 'material',
    'variant_price', 'variant_compare_at_price', 'variant_sku', 'variant_available',
    'featured_image', 'variant_image', 'color_family', 'finish_type',
    'product_url', 'display_name', 'material_id', 'product_line_id',
    'mpn', 'gtin', 'ean', 'upc', 'net_weight_g', 'diameter_nominal_mm',
    'pack_quantity', 'spool_ams_fit', 'spool_material', 'spool_outer_d_mm',
    'spool_width_mm', 'high_speed_capable', 'is_nozzle_abrasive',
    'moisture_sensitivity_level', 'use_case_tags', 'industry_tags'
  ];
  
  if (shopifyFields.includes(field)) {
    return 'shopify';
  }
  
  // Firecrawl fields (technical specs from product pages)
  const firecrawlFields = [
    'nozzle_temp_min_c', 'nozzle_temp_max_c', 'nozzle_temp_sweetspot_c',
    'bed_temp_min_c', 'bed_temp_max_c', 'density_g_cm3',
    'print_speed_max_mms', 'fan_min_percent', 'fan_max_percent',
    'retraction_length_mm', 'retraction_speed_mms',
    'max_bridging_length_mm', 'max_overhang_angle_deg',
    'moisture_care', 'nozzle_care', 'color_hex'
  ];
  
  if (firecrawlFields.includes(field)) {
    return 'firecrawl';
  }
  
  // TDS fields (technical data sheets)
  const tdsFields = [
    'melt_temp_c', 'tg_c', 'vicat_softening_temp_c', 'hdt_045_mpa_c', 'hdt_18_mpa_c',
    'annealing_temp_c', 'annealing_time_hours', 'drying_temp_c', 'drying_time_hours',
    'tensile_strength_xy_mpa', 'tensile_strength_z_mpa',
    'tensile_modulus_xy_mpa', 'tensile_modulus_z_mpa',
    'elongation_break_xy_percent', 'elongation_break_z_percent',
    'bending_strength_mpa', 'bending_modulus_mpa', 'flexural_strength_mpa',
    'impact_strength_kj_m2', 'notched_izod_j_m', 'hardness_shore_a',
    'shore_hardness_d', 'youngs_modulus_mpa', 'poissons_ratio',
    'haze_percent', 'light_transmission_percent',
    'surface_resistivity_ohm', 'volume_resistivity_ohm_cm',
    'chemical_resistance', 'food_contact_rating',
    'carbon_fiber_percentage', 'glass_fiber_percentage',
    'wood_powder_percentage', 'wood_type', 'wood_particle_size_microns',
    'wood_fiber_length_mm', 'wood_scent_level', 'melt_index_g_10min',
    'water_absorption_percent', 'shrinkage_annealed_percent',
    'transmission_distance', 'td_confidence', 'td_source', 'td_matched_at', 'tds_url'
  ];
  
  if (tdsFields.includes(field)) {
    return 'tds';
  }
  
  // Amazon fields
  const amazonFields = [
    'amazon_link_us', 'amazon_link_ca', 'amazon_link_uk', 'amazon_link_de',
    'amazon_link_fr', 'amazon_link_es', 'amazon_link_it', 'amazon_link_nl',
    'amazon_link_be', 'amazon_link_jp', 'amazon_link_au',
    'amazon_match_confidence', 'amazon_price_usd', 'amazon_prices_last_updated_at'
  ];
  
  if (amazonFields.includes(field)) {
    return 'amazon';
  }
  
  // Calculated fields
  const calculatedFields = [
    'filascope_score', 'ease_of_printing_score', 'dimensional_accuracy_score',
    'printability_index', 'value_score', 'strength_index'
  ];
  
  if (calculatedFields.includes(field)) {
    return 'calculate';
  }
  
  // Regional fields
  const regionalFields = [
    'price_eur', 'price_gbp', 'price_cad', 'price_aud', 'price_jpy', 'price_cny',
    'product_url_ca', 'product_url_eu', 'product_url_uk',
    'product_url_au', 'product_url_jp', 'product_url_cn',
    'has_regional_urls', 'available_regions', 'primary_region', 'cross_region_source'
  ];
  
  if (regionalFields.includes(field)) {
    return 'manual'; // Regional data requires manual setup or specialized logic
  }
  
  return 'unknown';
}

/**
 * Estimate difficulty to fill a field
 */
export function estimateDifficulty(field: string): 'easy' | 'medium' | 'hard' | 'very_hard' {
  for (const [difficulty, fields] of Object.entries(FIELD_DIFFICULTY)) {
    if (fields.includes(field)) {
      return difficulty as any;
    }
  }
  return 'medium'; // Default
}

/**
 * Get field dependencies
 */
export function getFieldDependencies(field: string): string[] {
  const dependencies: Record<string, string[]> = {
    // Regional prices depend on base price
    'price_eur': ['variant_price'],
    'price_gbp': ['variant_price'],
    'price_cad': ['variant_price'],
    'price_aud': ['variant_price'],
    'price_jpy': ['variant_price'],
    'price_cny': ['variant_price'],
    
    // Amazon links depend on product title and vendor
    'amazon_link_us': ['product_title', 'vendor'],
    'amazon_link_ca': ['product_title', 'vendor'],
    'amazon_link_uk': ['product_title', 'vendor'],
    
    // Scoring depends on multiple technical fields
    'filascope_score': [
      'variant_price', 'nozzle_temp_min_c', 'nozzle_temp_max_c',
      'bed_temp_min_c', 'bed_temp_max_c', 'density_g_cm3'
    ],
    'ease_of_printing_score': [
      'nozzle_temp_min_c', 'nozzle_temp_max_c', 'bed_temp_min_c', 'bed_temp_max_c',
      'print_speed_max_mms', 'fan_min_percent', 'fan_max_percent'
    ],
    
    // TD confidence depends on TD value
    'td_confidence': ['transmission_distance'],
    'td_source': ['transmission_distance'],
    'td_matched_at': ['transmission_distance'],
  };
  
  return dependencies[field] || [];
}

/**
 * Detect gaps for a single filament
 */
export function detectFilamentGaps(filament: any): FilamentGaps {
  const gaps: FieldGap[] = [];
  let populatedCount = 0;
  
  // Check each field
  for (const field of FIELD_LIST) {
    const value = filament[field];
    const isEmpty = value === null || value === undefined || value === '' || 
                   (Array.isArray(value) && value.length === 0);
    
    if (!isEmpty) {
      populatedCount++;
    } else {
      gaps.push({
        field,
        category: getFieldCategory(field),
        priority: getFieldPriority(field),
        currentValue: value,
        source: determineSource(field, filament),
        estimatedDifficulty: estimateDifficulty(field),
        dependencies: getFieldDependencies(field)
      });
    }
  }
  
  // Calculate category summaries
  const categorySummary = {
    basic: { total: 0, populated: 0, percentage: 0 },
    technical: { total: 0, populated: 0, percentage: 0 },
    regional: { total: 0, populated: 0, percentage: 0 },
    scoring: { total: 0, populated: 0, percentage: 0 },
    metadata: { total: 0, populated: 0, percentage: 0 }
  };
  
  for (const field of FIELD_LIST) {
    const category = getFieldCategory(field);
    categorySummary[category].total++;
    
    const value = filament[field];
    const isEmpty = value === null || value === undefined || value === '' ||
                   (Array.isArray(value) && value.length === 0);
    
    if (!isEmpty) {
      categorySummary[category].populated++;
    }
  }
  
  // Calculate percentages
  for (const category of Object.keys(categorySummary)) {
    const { total, populated } = categorySummary[category as keyof typeof categorySummary];
    categorySummary[category as keyof typeof categorySummary].percentage = 
      total > 0 ? Math.round((populated / total) * 100 * 10) / 10 : 0;
  }
  
  return {
    filament_id: filament.id,
    product_title: filament.product_title || 'Unknown',
    vendor: filament.vendor || 'Unknown',
    total_fields: FIELD_LIST.length,
    populated_fields: populatedCount,
    missing_fields: gaps.length,
    coverage_percentage: Math.round((populatedCount / FIELD_LIST.length) * 100 * 10) / 10,
    gaps,
    summary: categorySummary
  };
}

/**
 * Detect gaps for multiple filaments
 */
export function detectMultipleFilamentGaps(filaments: any[]): FilamentGaps[] {
  return filaments.map(detectFilamentGaps);
}

/**
 * Get priority gaps for a filament
 */
export function getPriorityGaps(filamentGaps: FilamentGaps, maxPriority: 'P0' | 'P1' | 'P2' | 'P3' = 'P1'): FieldGap[] {
  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const maxPriorityValue = priorityOrder[maxPriority];
  
  return filamentGaps.gaps
    .filter(gap => priorityOrder[gap.priority] <= maxPriorityValue)
    .sort((a, b) => {
      // Sort by priority first
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Then by difficulty (easy first)
      const difficultyOrder = { easy: 0, medium: 1, hard: 2, very_hard: 3 };
      return difficultyOrder[a.estimatedDifficulty] - difficultyOrder[b.estimatedDifficulty];
    });
}

/**
 * Generate gap report for a brand
 */
export function generateBrandGapReport(filamentGaps: FilamentGaps[]): {
  brand_slug: string;
  total_filaments: number;
  average_coverage: number;
  total_gaps: number;
  gaps_by_priority: Record<string, number>;
  gaps_by_category: Record<string, number>;
  gaps_by_source: Record<string, number>;
  worst_filaments: Array<{ filament_id: string; product_title: string; coverage: number }>;
  recommendations: string[];
} {
  if (filamentGaps.length === 0) {
    return {
      brand_slug: 'unknown',
      total_filaments: 0,
      average_coverage: 0,
      total_gaps: 0,
      gaps_by_priority: {},
      gaps_by_category: {},
      gaps_by_source: {},
      worst_filaments: [],
      recommendations: []
    };
  }
  
  const brand_slug = filamentGaps[0].vendor.toLowerCase().replace(/\s+/g, '-');
  
  // Calculate totals
  const totalGaps = filamentGaps.reduce((sum, fg) => sum + fg.missing_fields, 0);
  const averageCoverage = filamentGaps.reduce((sum, fg) => sum + fg.coverage_percentage, 0) / filamentGaps.length;
  
  // Count gaps by priority
  const gapsByPriority: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
  const gapsByCategory: Record<string, number> = { basic: 0, technical: 0, regional: 0, scoring: 0, metadata: 0 };
  const gapsBySource: Record<string, number> = { shopify: 0, firecrawl: 0, tds: 0, amazon: 0, manual: 0, calculate: 0, unknown: 0 };
  
  for (const fg of filamentGaps) {
    for (const gap of fg.gaps) {
      gapsByPriority[gap.priority]++;
      gapsByCategory[gap.category]++;
      gapsBySource[gap.source]++;
    }
  }
  
  // Find worst filaments (lowest coverage)
  const sortedByCoverage = [...filamentGaps].sort((a, b) => a.coverage_percentage - b.coverage_percentage);
  const worstFilaments = sortedByCoverage.slice(0, 10).map(fg => ({
    filament_id: fg.filament_id,
    product_title: fg.product_title,
    coverage: fg.coverage_percentage
  }));
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (gapsByPriority.P0 > 0) {
    recommendations.push(`Fix ${gapsByPriority.P0} P0 gaps (critical fields)`);
  }
  
  if (gapsByCategory.technical > 100) {
    recommendations.push(`Extract technical specs for ${gapsByCategory.technical} fields using Firecrawl`);
  }
  
  if (gapsByCategory.regional > 50) {
    recommendations.push(`Add regional pricing for ${gapsByCategory.regional} fields`);
  }
  
  if (gapsBySource.amazon > 20) {
    recommendations.push(`Add Amazon affiliate links for ${gapsBySource.amazon} fields`);
  }
  
  if (averageCoverage < 30) {
    recommendations.push('Overall coverage is low — prioritize basic field extraction');
  }
  
  return {
    brand_slug,
    total_filaments: filamentGaps.length,
    average_coverage: Math.round(averageCoverage * 10) / 10,
    total_gaps: totalGaps,
    gaps_by_priority: gapsByPriority,
    gaps_by_category: gapsByCategory,
    gaps_by_source: gapsBySource,
    worst_filaments: worstFilaments,
    recommendations
  };
}

console.log(`✅ Field Gap Detector loaded: ${FIELD_COUNT} fields, ${Object.keys(FIELD_CATEGORIES).length} categories`);
console.log(`   P0 fields: ${FIELD_PRIORITIES.P0.length}`);
console.log(`   P1 fields: ${FIELD_PRIORITIES.P1.length}`);
console.log(`   P2 fields: ${FIELD_PRIORITIES.P2.length}`);
console.log(`   P3 fields: ${FIELD_PRIORITIES.P3.length}`);

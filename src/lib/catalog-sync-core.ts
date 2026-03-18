/**
 * Catalog Sync Core — Self-contained processing utilities
 *
 * Contains classification, extraction, and diff logic for brand catalog sync.
 * This file has ZERO imports — works in both Deno (edge functions) and browser.
 *
 * IMPORTANT: This is a copy of supabase/functions/_shared/catalog-sync-core.ts
 * for client-side use while the Supabase edge function deployment pipeline is
 * broken (500 internal error on all deploys for project cfqfavmhdbyjzejipiwa).
 * When edge functions are restored, the canonical version is in _shared/.
 *
 * Used by: src/hooks/useCatalogSync.ts (client-side fallback)
 */

// ============================================================
// Types
// ============================================================

export interface ScrapingConfig {
  id: string;
  brand_id: string;
  brand_name: string;
  platform: string;
  base_url: string;
  scrape_method: string;
  adapter_key: string;
  catalog_strategy?: string;
  regional_url_pattern: Record<string, string> | null;
  variant_mapping: Record<string, any>;
  spec_extraction: Record<string, string> | null;
  default_material_type: string | null;
}

export interface ExtractedFilament {
  brand_id: string;
  material: string;
  product_title: string;
  display_name: string;
  color_family: string | null;
  color_hex: string | null;
  featured_image: string | null;
  variant_image: string | null;
  nozzle_temp_min_c: number | null;
  nozzle_temp_max_c: number | null;
  bed_temp_min_c: number | null;
  bed_temp_max_c: number | null;
  diameter_nominal_mm: number;
  net_weight_g: number | null;
  product_url: string;
  product_url_us: string | null;
  product_url_eu: string | null;
  product_url_uk: string | null;
  product_url_ca: string | null;
  product_url_au: string | null;
  price_usd: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_cad: number | null;
  price_aud: number | null;
  product_handle: string;
  variant_sku: string | null;
  finish_type: string | null;
  spool_material: string | null;
  spool_outer_d_mm: number | null;
  spool_width_mm: number | null;
  pack_quantity: number;
  print_speed_max_mms: number | null;
  high_speed_capable: boolean | null;
  drying_temp_c: number | null;
  drying_time_hours: number | null;
  variant_available: boolean;
  available_regions: string[];
  weight_source: "body_html" | "variant_title" | "product_title" | null;
  // Enrichment fields (populated from material defaults + body_html parsing)
  tg_c: number | null;
  moisture_sensitivity_level: string | null;
  is_nozzle_abrasive: boolean | null;
  recommended_nozzle_type: string | null;
  fan_min_percent: number | null;
  fan_max_percent: number | null;
  density_g_cm3: number | null;
  nozzle_temp_sweetspot_c: number | null;
  use_case_tags: string[] | null;
  food_contact_rating: string | null;
  retraction_length_mm: number | null;
  retraction_speed_mms: number | null;
  spool_ams_fit: string | null;
  tds_url: string | null;
  // Mechanical properties
  tensile_strength_xy_mpa: number | null;
  elongation_break_xy_percent: number | null;
  flexural_strength_mpa: number | null;
  impact_strength_kj_m2: number | null;
  shore_hardness_d: number | null;
  hardness_shore_a: number | null;
  // Thermal properties
  melt_temp_c: number | null;
  hdt_045_mpa_c: number | null;
  vicat_softening_temp_c: number | null;
  water_absorption_percent: number | null;
  // Product line grouping
  product_line_id: string;
}

// ============================================================
// Constants — Compact color maps (core colors only)
// ============================================================

const CHX: Record<string, string> = {
  white:"#FFFFFF",black:"#000000",red:"#E53E3E",blue:"#3B82F6",green:"#22C55E",
  yellow:"#FACC15",orange:"#F97316",pink:"#EC4899",purple:"#8B5CF6",
  grey:"#9CA3AF",gray:"#9CA3AF",brown:"#92400E",beige:"#D2B48C",ivory:"#FFFFF0",
  gold:"#FFD700",silver:"#C0C0C0",bronze:"#CD7F32",copper:"#B87333",
  navy:"#001F3F",teal:"#008080",cyan:"#00BCD4",coral:"#FF7F50",
  salmon:"#FA8072",lavender:"#E6E6FA",turquoise:"#40E0D0",olive:"#808000",
  maroon:"#800000",crimson:"#DC143C",indigo:"#4B0082",lime:"#00FF00",
  mint:"#98FB98",charcoal:"#36454F",cream:"#FFFDD0",rose:"#FF007F",
  transparent:"#FFFFFF",clear:"#FFFFFF",natural:"#F5F5DC",peach:"#FFCBA4",
};

const CFM: Record<string, string> = {
  white:"White",black:"Black",red:"Red",blue:"Blue",green:"Green",
  yellow:"Yellow",orange:"Orange",pink:"Pink",purple:"Purple",
  grey:"Grey",gray:"Grey",brown:"Brown",beige:"Beige",gold:"Gold/Silver",
  silver:"Gold/Silver",navy:"Blue",teal:"Green",cyan:"Blue",coral:"Orange",
  salmon:"Pink",lavender:"Purple",maroon:"Red",crimson:"Red",indigo:"Purple",
  olive:"Green",lime:"Green",mint:"Green",turquoise:"Blue",charcoal:"Black",
  transparent:"Transparent",clear:"Transparent",natural:"Beige",cream:"Beige",
  rose:"Pink",bronze:"Gold/Silver",copper:"Gold/Silver",peach:"Pink",
};

const FILAMENT_KEYWORDS = [
  "filament","pla","petg","abs","tpu","asa","nylon","pa",
  "silk","hspla","pva","hips","pc ","pla+","pla plus",
  "carbon fiber","wood fill","marble","glow","matte pla",
];

const NON_FILAMENT_KEYWORDS = [
  "dryer","printer","resin","enclosure","nozzle","tool",
  "upgrade","accessories","board","protection","warranty",
  "worry-free","wash","cure","lcd","screen","plate",
  "extruder","hotend","hot end","bed leveling","spool holder",
];

const MATERIAL_KEYWORDS_ORDERED = [
  "Silk PLA","Matte PLA","PLA Meta","PLA Galaxy","High Speed PLA",
  "PLA Transparent Series","PLA Neon Series","Wood PLA",
  "PLA+","PLA Plus","PLA Strongman","PLA Prime","PLA Lumos","PLA Pearl",
  "Matte HS","PLA Matte HS","PETG Hyper Speed","PET-CF","PAHT-CF","LumberLay",
  // Composite / filled materials (must come before base materials)
  "PEKK-A+CF","PEKK-A","PEEK+CF","PEEK+GF","PEI+GF","PEI 9085+CF","PEI 9085","PEI 1010",
  "PETG+CF","PETG-CF","PETG CF","PLA+CF","PLA-CF","PLA CF",
  "ABS+CF","ABS+GF","ABS-GF","ASA+CF",
  "PC+CF","PC-ABS","Nylon 12+CF","Nylon 12+GF","Nylon 6+CF","PA6+GF",
  "PP+CF","PP+GF","PPA+GF","PA-CF","PA-GF",
  "FR-ABS","FR-PC-ABS","FR-PC",
  "ESD-TPU","ESD-PLA","ESD-ABS","ESD-PC","ESD-PETG","ESD-PEI","ESD-PEKK",
  "R-PETG","Tough PLA",
  // Base materials
  "PEEK","PEKK","PPSU","PSU","PPS","PES","PPE","TPI","PVDF","PCTG",
  "PETG","ABS","TPU","ASA","PEBA","Nylon","PA","PC","PVA","HIPS",
  "HSPLA","HS-PLA","HS PLA","PLA",
];

const MATERIAL_NORMALIZE: Record<string, string> = {
  "pla neon series":"PLA","pla transparent series":"PLA","high speed pla":"HSPLA",
  "hs-pla":"HSPLA","hs pla":"HSPLA","pla plus":"PLA+","pla+":"PLA+",
  "silk pla":"Silk PLA","matte pla":"Matte PLA","pla meta":"PLA Meta",
  "pla galaxy":"PLA Galaxy","wood pla":"Wood PLA","petg-cf":"PETG-CF",
  "petg cf":"PETG-CF","pla-cf":"PLA-CF","pla cf":"PLA-CF",
  "abs-gf":"ABS-GF","pa-cf":"PA-CF","pa-gf":"PA-GF",
  // 3D-Fuel brand-specific material names
  "pro pctg":"PCTG","pro pctg-cf10":"PCTG-CF","tough pro pla+":"PLA+",
  "standard pla+":"PLA+","silk pla+":"Silk PLA","pro petg":"PETG",
  "pro abs":"ABS","pro asa":"ASA","pet-cf":"PET-CF",
  "entwined v2hemp":"Hemp-PLA","entwined v2 hemp":"Hemp-PLA",
  // 3DXTech composite material normalizations
  "pekk-a+cf":"PEKK-CF","pekk-a+cf15":"PEKK-CF","pekk-a":"PEKK",
  "peek+cf":"PEEK-CF","peek+cf10":"PEEK-CF","peek+gf20":"PEEK-GF",
  "pei+gf30":"PEI-GF","pei+gf":"PEI-GF","pei 9085+cf":"PEI-CF","pei 9085":"PEI","pei 1010":"PEI",
  "abs+cf":"ABS-CF","abs+gf":"ABS-GF","asa+cf":"ASA-CF",
  "pc+cf":"PC-CF","pc-abs":"PC-ABS",
  "pp+cf":"PP-CF","pp+gf30":"PP-GF","pp+gf":"PP-GF",
  "ppa+gf15":"PPA-GF","ppa+gf":"PPA-GF",
  "nylon 12+cf":"Nylon-CF","nylon 12+gf30":"Nylon-GF","nylon 12+gf":"Nylon-GF",
  "nylon 6+cf":"Nylon-CF","nylon 6-66":"Nylon",
  "pa6+gf30":"PA6-GF","pa6+gf":"PA6-GF",
  "petg+cf":"PETG-CF","pla+cf":"PLA-CF",
  "fr-abs":"FR-ABS","fr-pc-abs":"FR-PC-ABS","fr-pc":"FR-PC",
  "esd-tpu":"ESD-TPU","esd-pla":"ESD-PLA","esd-abs":"ESD-ABS",
  "esd-pc":"ESD-PC","esd-petg":"ESD-PETG","esd-pei":"ESD-PEI","esd-pekk":"ESD-PEKK",
  "esd-pekk-a":"ESD-PEKK","emi-abs":"EMI-ABS","emi-petg":"EMI-PETG",
  "r-petg":"rPETG","tough pla":"Tough PLA",
  "ppe+ps":"PPE","htn+cf":"HTN-CF",
  // 3DHOJOR material normalizations
  "pla pro":"PLA+","pla lite":"PLA","pla basic":"PLA","pla high speed":"HSPLA",
  "rapid pla":"HSPLA","crystal rainbow pla":"PLA","silk rainbow pla":"Silk PLA",
  "silk dual/tri color pla":"Silk PLA","silk magic":"Silk PLA",
  // AzureFilm material normalizations
  "pla strongman":"PLA+","pla prime":"PLA+","pla lumos":"PLA-Glow","pla pearl":"Silk PLA",
  "matte hs":"Matte PLA","pla matte hs":"Matte PLA","petg hyper speed":"PETG",
  "paht-cf":"PA-CF","lumberlay":"Wood PLA",
  "lumberlay pine":"Wood PLA","lumberlay bamboo":"Wood PLA","lumberlay cork":"Wood PLA",
  "lumberlay ebony":"Wood PLA","lumberlay oak":"Wood PLA","lumberlay poplar":"Wood PLA",
  "abs plus":"ABS","abs prime":"ABS","asa prime":"ASA",
  "petg original hs":"PETG","pla original":"PLA","petg pastel":"PETG",
  "pla skin":"PLA","pla pastel":"PLA","pla neon":"PLA","pla glitter":"PLA",
  // Amolen material normalizations
  "peba":"PEBA","pla silk":"Silk PLA","pla matte":"Matte PLA",
  "pla glow":"PLA-Glow","pla marble":"PLA","pla crystal":"PLA",
  "pla dual color":"PLA","pla silk dual color":"Silk PLA",
  "silk shiny gradient":"Silk PLA","pla basic-high speed":"HSPLA",
};

const KNOWN_COLOR_WORDS = [
  "black","white","red","blue","green","yellow","orange","purple",
  "pink","brown","grey","gray","silver","gold","cyan","magenta",
  "transparent","clear","natural","ivory","beige","tan","olive",
  "teal","navy","maroon","coral","salmon","lavender","turquoise",
  "crimson","charcoal","mint","lime","aqua","indigo","violet",
  "rose","peach","cream","chocolate","bronze","copper","platinum",
];

const REGION_KEYWORDS = ["ship","shipment","country","region","destination","shop from","delivery"];
const MATERIAL_OPT_KEYWORDS = ["material","type","types","category"];
const COLOR_OPT_KEYWORDS = ["color","colour"];

// ============================================================
// Material Defaults — Scientifically consistent per-material specs
// ============================================================

interface MaterialDefaults {
  tg_c: number | null;
  drying_temp_c: number;
  drying_time_hours: number;
  moisture_sensitivity_level: string;
  is_nozzle_abrasive: boolean;
  recommended_nozzle_type: string;
  fan_min_percent: number;
  fan_max_percent: number;
  density_g_cm3: number;
  nozzle_temp_sweetspot_c: number;
  use_case_tags: string[];
  food_contact_rating: string;
  // Mechanical properties (typical values for 3D-printed parts, XY orientation)
  tensile_strength_xy_mpa: number | null;
  elongation_break_xy_percent: number | null;
  flexural_strength_mpa: number | null;
  impact_strength_kj_m2: number | null;
  shore_hardness_d: number | null;
  hardness_shore_a: number | null;
  // Thermal properties
  melt_temp_c: number | null;
  hdt_045_mpa_c: number | null;
  vicat_softening_temp_c: number | null;
  water_absorption_percent: number | null;
}

const MATERIAL_DEFAULTS: Record<string, MaterialDefaults> = {
  PLA: {
    tg_c: 60, drying_temp_c: 45, drying_time_hours: 4,
    moisture_sensitivity_level: "Low",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 80, fan_max_percent: 100, density_g_cm3: 1.24,
    nozzle_temp_sweetspot_c: 210,
    use_case_tags: ["Prototyping", "Visual models", "HueForge", "Low-warp prints"],
    food_contact_rating: "Conditional",
    tensile_strength_xy_mpa: 50, elongation_break_xy_percent: 6,
    flexural_strength_mpa: 80, impact_strength_kj_m2: 3.5,
    shore_hardness_d: 83, hardness_shore_a: null,
    melt_temp_c: 175, hdt_045_mpa_c: 55, vicat_softening_temp_c: 57,
    water_absorption_percent: 0.5,
  },
  "PLA+": {
    tg_c: 60, drying_temp_c: 45, drying_time_hours: 4,
    moisture_sensitivity_level: "Low",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 80, fan_max_percent: 100, density_g_cm3: 1.24,
    nozzle_temp_sweetspot_c: 215,
    use_case_tags: ["Functional parts", "Improved toughness", "Prototyping"],
    food_contact_rating: "Conditional",
    tensile_strength_xy_mpa: 55, elongation_break_xy_percent: 10,
    flexural_strength_mpa: 85, impact_strength_kj_m2: 6,
    shore_hardness_d: 83, hardness_shore_a: null,
    melt_temp_c: 175, hdt_045_mpa_c: 55, vicat_softening_temp_c: 57,
    water_absorption_percent: 0.5,
  },
  "Silk PLA": {
    tg_c: 60, drying_temp_c: 45, drying_time_hours: 4,
    moisture_sensitivity_level: "Low",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 80, fan_max_percent: 100, density_g_cm3: 1.24,
    nozzle_temp_sweetspot_c: 215,
    use_case_tags: ["Decorative", "Visual models", "Vases", "Display pieces"],
    food_contact_rating: "No",
    tensile_strength_xy_mpa: 46, elongation_break_xy_percent: 5,
    flexural_strength_mpa: 70, impact_strength_kj_m2: 3,
    shore_hardness_d: 80, hardness_shore_a: null,
    melt_temp_c: 175, hdt_045_mpa_c: 52, vicat_softening_temp_c: 55,
    water_absorption_percent: 0.5,
  },
  "Matte PLA": {
    tg_c: 60, drying_temp_c: 45, drying_time_hours: 4,
    moisture_sensitivity_level: "Low",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 80, fan_max_percent: 100, density_g_cm3: 1.24,
    nozzle_temp_sweetspot_c: 215,
    use_case_tags: ["Visual models", "Low-layer-line finish", "Prototyping"],
    food_contact_rating: "No",
    tensile_strength_xy_mpa: 48, elongation_break_xy_percent: 5,
    flexural_strength_mpa: 75, impact_strength_kj_m2: 3.2,
    shore_hardness_d: 82, hardness_shore_a: null,
    melt_temp_c: 175, hdt_045_mpa_c: 53, vicat_softening_temp_c: 56,
    water_absorption_percent: 0.5,
  },
  "Tough PLA": {
    tg_c: 60, drying_temp_c: 45, drying_time_hours: 4,
    moisture_sensitivity_level: "Low",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 70, fan_max_percent: 100, density_g_cm3: 1.24,
    nozzle_temp_sweetspot_c: 215,
    use_case_tags: ["Functional parts", "Impact resistance", "Engineering"],
    food_contact_rating: "No",
    tensile_strength_xy_mpa: 56, elongation_break_xy_percent: 15,
    flexural_strength_mpa: 85, impact_strength_kj_m2: 8,
    shore_hardness_d: 82, hardness_shore_a: null,
    melt_temp_c: 175, hdt_045_mpa_c: 55, vicat_softening_temp_c: 57,
    water_absorption_percent: 0.5,
  },
  HSPLA: {
    tg_c: 60, drying_temp_c: 45, drying_time_hours: 4,
    moisture_sensitivity_level: "Low",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 50, fan_max_percent: 100, density_g_cm3: 1.24,
    nozzle_temp_sweetspot_c: 220,
    use_case_tags: ["High-speed printing", "Rapid prototyping", "Batch production"],
    food_contact_rating: "Conditional",
    tensile_strength_xy_mpa: 50, elongation_break_xy_percent: 8,
    flexural_strength_mpa: 78, impact_strength_kj_m2: 4,
    shore_hardness_d: 83, hardness_shore_a: null,
    melt_temp_c: 175, hdt_045_mpa_c: 55, vicat_softening_temp_c: 57,
    water_absorption_percent: 0.5,
  },
  PETG: {
    tg_c: 80, drying_temp_c: 65, drying_time_hours: 4,
    moisture_sensitivity_level: "Moderate",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 30, fan_max_percent: 60, density_g_cm3: 1.27,
    nozzle_temp_sweetspot_c: 235,
    use_case_tags: ["Functional parts", "Chemical resistance", "Outdoor use", "Food containers"],
    food_contact_rating: "Conditional",
    tensile_strength_xy_mpa: 47, elongation_break_xy_percent: 23,
    flexural_strength_mpa: 70, impact_strength_kj_m2: 5.5,
    shore_hardness_d: 75, hardness_shore_a: null,
    melt_temp_c: 245, hdt_045_mpa_c: 70, vicat_softening_temp_c: 78,
    water_absorption_percent: 0.2,
  },
  ABS: {
    tg_c: 105, drying_temp_c: 80, drying_time_hours: 4,
    moisture_sensitivity_level: "Moderate",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 0, fan_max_percent: 30, density_g_cm3: 1.04,
    nozzle_temp_sweetspot_c: 245,
    use_case_tags: ["Functional parts", "Heat resistance", "Post-processing", "Enclosure required"],
    food_contact_rating: "No",
    tensile_strength_xy_mpa: 40, elongation_break_xy_percent: 25,
    flexural_strength_mpa: 65, impact_strength_kj_m2: 20,
    shore_hardness_d: 76, hardness_shore_a: null,
    melt_temp_c: 230, hdt_045_mpa_c: 98, vicat_softening_temp_c: 100,
    water_absorption_percent: 0.3,
  },
  TPU: {
    tg_c: -40, drying_temp_c: 50, drying_time_hours: 4,
    moisture_sensitivity_level: "Moderate",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 30, fan_max_percent: 60, density_g_cm3: 1.21,
    nozzle_temp_sweetspot_c: 230,
    use_case_tags: ["Flexible parts", "Phone cases", "Gaskets", "Vibration dampening"],
    food_contact_rating: "No",
    tensile_strength_xy_mpa: 35, elongation_break_xy_percent: 450,
    flexural_strength_mpa: null, impact_strength_kj_m2: null,
    shore_hardness_d: null, hardness_shore_a: 95,
    melt_temp_c: 220, hdt_045_mpa_c: null, vicat_softening_temp_c: null,
    water_absorption_percent: 0.8,
  },
  ASA: {
    tg_c: 100, drying_temp_c: 80, drying_time_hours: 4,
    moisture_sensitivity_level: "Moderate",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 0, fan_max_percent: 30, density_g_cm3: 1.07,
    nozzle_temp_sweetspot_c: 250,
    use_case_tags: ["Outdoor use", "UV resistance", "Automotive", "Enclosure required"],
    food_contact_rating: "No",
    tensile_strength_xy_mpa: 42, elongation_break_xy_percent: 30,
    flexural_strength_mpa: 68, impact_strength_kj_m2: 18,
    shore_hardness_d: 76, hardness_shore_a: null,
    melt_temp_c: 240, hdt_045_mpa_c: 95, vicat_softening_temp_c: 96,
    water_absorption_percent: 0.3,
  },
  Nylon: {
    tg_c: 70, drying_temp_c: 70, drying_time_hours: 12,
    moisture_sensitivity_level: "High",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 0, fan_max_percent: 30, density_g_cm3: 1.14,
    nozzle_temp_sweetspot_c: 255,
    use_case_tags: ["Mechanical parts", "Gears", "Bearings", "High strength"],
    food_contact_rating: "No",
    tensile_strength_xy_mpa: 70, elongation_break_xy_percent: 30,
    flexural_strength_mpa: 50, impact_strength_kj_m2: 12,
    shore_hardness_d: 75, hardness_shore_a: null,
    melt_temp_c: 260, hdt_045_mpa_c: 180, vicat_softening_temp_c: null,
    water_absorption_percent: 2.5,
  },
  PA: {
    tg_c: 70, drying_temp_c: 70, drying_time_hours: 12,
    moisture_sensitivity_level: "High",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 0, fan_max_percent: 30, density_g_cm3: 1.14,
    nozzle_temp_sweetspot_c: 260,
    use_case_tags: ["Mechanical parts", "High strength", "Engineering"],
    food_contact_rating: "No",
    tensile_strength_xy_mpa: 70, elongation_break_xy_percent: 30,
    flexural_strength_mpa: 50, impact_strength_kj_m2: 12,
    shore_hardness_d: 75, hardness_shore_a: null,
    melt_temp_c: 260, hdt_045_mpa_c: 180, vicat_softening_temp_c: null,
    water_absorption_percent: 2.5,
  },
  PC: {
    tg_c: 147, drying_temp_c: 80, drying_time_hours: 8,
    moisture_sensitivity_level: "High",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 0, fan_max_percent: 20, density_g_cm3: 1.20,
    nozzle_temp_sweetspot_c: 275,
    use_case_tags: ["Heat resistance", "Impact resistance", "Enclosure required", "Engineering"],
    food_contact_rating: "No",
    tensile_strength_xy_mpa: 60, elongation_break_xy_percent: 80,
    flexural_strength_mpa: 90, impact_strength_kj_m2: 50,
    shore_hardness_d: 80, hardness_shore_a: null,
    melt_temp_c: 280, hdt_045_mpa_c: 132, vicat_softening_temp_c: 145,
    water_absorption_percent: 0.2,
  },
  PVA: {
    tg_c: 85, drying_temp_c: 45, drying_time_hours: 8,
    moisture_sensitivity_level: "Very High",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 80, fan_max_percent: 100, density_g_cm3: 1.23,
    nozzle_temp_sweetspot_c: 200,
    use_case_tags: ["Support material", "Water-soluble", "Dual extrusion"],
    food_contact_rating: "No",
    tensile_strength_xy_mpa: 30, elongation_break_xy_percent: 10,
    flexural_strength_mpa: null, impact_strength_kj_m2: null,
    shore_hardness_d: null, hardness_shore_a: null,
    melt_temp_c: 200, hdt_045_mpa_c: null, vicat_softening_temp_c: null,
    water_absorption_percent: null,
  },
  HIPS: {
    tg_c: 100, drying_temp_c: 70, drying_time_hours: 4,
    moisture_sensitivity_level: "Low",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 0, fan_max_percent: 50, density_g_cm3: 1.05,
    nozzle_temp_sweetspot_c: 235,
    use_case_tags: ["Support material", "Limonene-soluble", "ABS companion"],
    food_contact_rating: "No",
    tensile_strength_xy_mpa: 25, elongation_break_xy_percent: 40,
    flexural_strength_mpa: 35, impact_strength_kj_m2: 10,
    shore_hardness_d: 70, hardness_shore_a: null,
    melt_temp_c: 230, hdt_045_mpa_c: 85, vicat_softening_temp_c: 94,
    water_absorption_percent: 0.1,
  },
  PEBA: {
    tg_c: -50, drying_temp_c: 55, drying_time_hours: 6,
    moisture_sensitivity_level: "High",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 20, fan_max_percent: 50, density_g_cm3: 1.01,
    nozzle_temp_sweetspot_c: 240,
    use_case_tags: ["Flexible parts", "High elasticity", "Wearables"],
    food_contact_rating: "No",
    tensile_strength_xy_mpa: 25, elongation_break_xy_percent: 600,
    flexural_strength_mpa: null, impact_strength_kj_m2: null,
    shore_hardness_d: null, hardness_shore_a: 63,
    melt_temp_c: 155, hdt_045_mpa_c: null, vicat_softening_temp_c: null,
    water_absorption_percent: 1.2,
  },
  PEEK: {
    tg_c: 143, drying_temp_c: 150, drying_time_hours: 4,
    moisture_sensitivity_level: "High",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Hardened Steel",
    fan_min_percent: 0, fan_max_percent: 0, density_g_cm3: 1.30,
    nozzle_temp_sweetspot_c: 400,
    use_case_tags: ["Aerospace", "Medical", "Extreme heat", "Industrial"],
    food_contact_rating: "Conditional",
    tensile_strength_xy_mpa: 100, elongation_break_xy_percent: 30,
    flexural_strength_mpa: 165, impact_strength_kj_m2: 7,
    shore_hardness_d: 85, hardness_shore_a: null,
    melt_temp_c: 343, hdt_045_mpa_c: 260, vicat_softening_temp_c: null,
    water_absorption_percent: 0.5,
  },
  PCTG: {
    tg_c: 84, drying_temp_c: 65, drying_time_hours: 4,
    moisture_sensitivity_level: "Moderate",
    is_nozzle_abrasive: false, recommended_nozzle_type: "Brass",
    fan_min_percent: 30, fan_max_percent: 60, density_g_cm3: 1.23,
    nozzle_temp_sweetspot_c: 240,
    use_case_tags: ["Impact resistance", "Chemical resistance", "Functional parts"],
    food_contact_rating: "Conditional",
    tensile_strength_xy_mpa: 50, elongation_break_xy_percent: 200,
    flexural_strength_mpa: 70, impact_strength_kj_m2: 65,
    shore_hardness_d: 75, hardness_shore_a: null,
    melt_temp_c: 250, hdt_045_mpa_c: 72, vicat_softening_temp_c: 80,
    water_absorption_percent: 0.2,
  },
};

/**
 * Resolve a material string (e.g. "Silk PLA", "PETG-CF", "Nylon 12+CF")
 * to its base material defaults. Applies CF/GF overrides for composite materials.
 */
function resolveMaterialDefaults(material: string): MaterialDefaults | null {
  // Direct match first
  if (MATERIAL_DEFAULTS[material]) return { ...MATERIAL_DEFAULTS[material] };

  const upper = material.toUpperCase();
  const lower = material.toLowerCase();

  // Check for composite indicators (must apply before base material match)
  const isCF = upper.includes("CF") || upper.includes("CARBON");
  const isGF = upper.includes("GF") || upper.includes("GLASS");

  // Fuzzy match: strip suffixes/prefixes to find base material
  // Order matters — check more specific materials first
  const baseMaterialOrder = [
    "Silk PLA", "Matte PLA", "Tough PLA", "HSPLA",
    "PLA+", "PCTG", "PETG", "PEBA", "PEEK", "HIPS",
    "PVA", "ABS", "ASA", "TPU", "PLA",
    "Nylon", "PA", "PC",
  ];

  let baseMat: string | null = null;
  for (const bm of baseMaterialOrder) {
    const bmLower = bm.toLowerCase();
    // Word-boundary check for short materials
    if (bmLower.length <= 3) {
      const re = new RegExp(`\\b${bmLower.replace(/[+]/g, "\\+")}\\b`);
      if (re.test(lower)) { baseMat = bm; break; }
    } else {
      if (lower.includes(bmLower)) { baseMat = bm; break; }
    }
  }

  if (!baseMat || !MATERIAL_DEFAULTS[baseMat]) return null;

  const defaults = { ...MATERIAL_DEFAULTS[baseMat] };

  // CF/GF composite overrides
  if (isCF || isGF) {
    defaults.is_nozzle_abrasive = true;
    defaults.recommended_nozzle_type = "Hardened Steel";
    defaults.fan_min_percent = Math.max(0, defaults.fan_min_percent - 20);
    defaults.fan_max_percent = Math.max(20, defaults.fan_max_percent - 20);
    // CF composites have different use cases
    if (isCF) {
      defaults.use_case_tags = [...defaults.use_case_tags.filter(t =>
        !t.includes("Visual") && !t.includes("Decorative") && !t.includes("HueForge")
      ), "Carbon fiber reinforced", "Structural parts", "Stiffness"];
    }
    if (isGF) {
      defaults.use_case_tags = [...defaults.use_case_tags.filter(t =>
        !t.includes("Visual") && !t.includes("Decorative") && !t.includes("HueForge")
      ), "Glass fiber reinforced", "Impact resistance", "Structural parts"];
    }
  }

  return defaults;
}

// ============================================================
// Product Line ID — deterministic grouping for color variants
// ============================================================

/**
 * Compute a deterministic product_line_id for grouping color variants.
 * Format: {adapter_key}_{normalized_material}_{diameter}_{finish_type}
 *
 * Examples:
 *   eryone_pla_1.75_standard
 *   bambu-lab_silk-pla_1.75_silk
 *   3dxtech_petg-cf_1.75_carbon-fiber
 */
export function computeProductLineId(
  adapterKey: string, material: string, diameter: number, finishType: string
): string {
  const matSlug = material.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
  const finishSlug = finishType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
  const diaStr = diameter.toString();
  return `${adapterKey}_${matSlug}_${diaStr}_${finishSlug}`;
}

// ============================================================
// Helpers
// ============================================================

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

export function mapRegionToCode(rv: string | null, rm: Record<string, string>): string | null {
  if (!rv) return null;
  for (const [k, c] of Object.entries(rm)) { if (rv.includes(k)) return c; }
  const l = rv.toLowerCase().trim();
  if (l.includes("usa") || l.includes("united states") || l.includes("u.s.")) return "US";
  if (l.includes("europe") || l.includes("eu to eu")) return "EU";
  if (l.includes("canada") || l === "ca") return "CA";
  if (l.includes("australia") || l === "au") return "AU";
  if (l.includes("uk") || l.includes("united kingdom")) return "UK";
  if (l === "de" || l.includes("germany") || l.includes("deutschland")) return "EU";
  if (l.includes("china to") || l.includes("worldwide")) return "US";
  if (/\beu\b/.test(l)) return "EU";
  if (/\bus\b/.test(l)) return "US";
  return null;
}

function cleanMaterialAggressive(raw: string): string {
  let s = raw;
  if (s.includes("|")) s = s.split("|")[0];
  s = s.replace(/\(.*?\)/g, "").replace(/\d+(\.\d+)?\s*[kK][gG]/g, "")
    .replace(/\d+[gG]\b/g, "").replace(/\d+\*[A-Z0-9]+/gi, "");
  for (const cw of KNOWN_COLOR_WORDS) s = s.replace(new RegExp(`\\b${cw}\\b`, "gi"), "");
  s = s.replace(/\s+/g, " ").trim();
  const lower = s.toLowerCase();
  if (MATERIAL_NORMALIZE[lower]) return MATERIAL_NORMALIZE[lower];
  if (s.length >= 2 && s.length <= 30) return s.toUpperCase();
  return "";
}

function parseMaterialFromTitle(title: string): string | null {
  const l = title.toLowerCase();
  for (const kw of MATERIAL_KEYWORDS_ORDERED) {
    const kwLower = kw.toLowerCase();
    // Short keywords (≤3 chars like PA, PC, PLA) need word-boundary matching
    // to prevent "PA" matching inside "pack", "PC" inside "specs", etc.
    if (kwLower.length <= 3) {
      const re = new RegExp(`\\b${kwLower.replace(/[+]/g, "\\+")}\\b`);
      if (re.test(l)) return MATERIAL_NORMALIZE[kwLower] || kw.toUpperCase();
    } else {
      if (l.includes(kwLower)) return MATERIAL_NORMALIZE[kwLower] || kw.toUpperCase();
    }
  }
  return null;
}

function stripMaterialPrefix(colorName: string, material: string): string {
  const prefixes = [material, material.toUpperCase(), material.toLowerCase()];
  let c = colorName.trim();
  for (const p of prefixes) { if (c.startsWith(p + " ")) { c = c.slice(p.length + 1).trim(); break; } }
  return c.replace(/\s*\d+\s*(?:kg|g)\s*$/i, "").trim() || colorName;
}

function cleanColorName(raw: string, material: string): string {
  let s = stripMaterialPrefix(raw, material);
  if (s.includes("|")) {
    const parts = s.split("|").map((p) => p.trim());
    const colorPart = parts.find((p) => KNOWN_COLOR_WORDS.some((cw) => p.toLowerCase().includes(cw)));
    s = colorPart || parts.reduce((a, b) => (a.length <= b.length ? a : b));
  }
  s = s.replace(/\d+(\.\d+)?\s*[kK][gG]/g, "").replace(/\d+[gG]\b/g, "")
    .replace(/\((AU|EU|US|UK|CA)\s*PLUG\)/gi, "").replace(/\(.*?PLUG.*?\)/gi, "")
    .replace(/\d+\*[A-Z0-9]+/gi, "").replace(/DLZ-\w+/gi, "").replace(/\(.*?\)/g, "")
    .replace(/\bRefill\b/gi, "").replace(/\bfilament\b/gi, "")
    .replace(/\bHyper\s*Speed\b/gi, "").replace(/\bOriginal\b/gi, "")
    .replace(/\bHS\b/g, "").replace(/\b1\.75\s*mm\b/gi, "").replace(/\b2\.85\s*mm\b/gi, "")
    .replace(/\s*\+\s*/g, " ").replace(/\s+/g, " ").trim()
    .replace(/^[-–—]+|[-–—]+$/g, "").trim();
  return s.length > 0 ? titleCase(s) : "Default";
}

function makeDisplayName(material: string, color: string): string {
  return !color || color === "Default" ? material : `${material} - ${color}`;
}

/** Check if a value looks like size/spec data or a shipping/region label rather than a color name */
function looksLikeSizeSpec(value: string): boolean {
  const l = value.toLowerCase().trim();
  return l === "default title" || l.includes("mm") || l.includes("kg") ||
    l.includes("ams") || l.includes("lb") || l.includes("sample") ||
    /^\d/.test(l) || l === "default" ||
    // Shipping/region values (Amolen "U.S. to U.S.", "China to U.S. & Worldwide", "EU to EU")
    l.includes("u.s.") || l.includes("china to") || l.includes("worldwide") ||
    l.includes("eu to") || l.includes("ship to") || l.includes("ship from");
}

/** Extract color from a product title by stripping material, brand, and common suffixes */
function parseColorFromTitle(title: string, material: string): string {
  let s = title;
  // Strip common suffixes
  s = s.replace(/\bAMS\s*Compatible\b/gi, "")
    .replace(/\bFilament\b/gi, "")
    .replace(/\b1\.75\s*mm\b/gi, "")
    .replace(/\b2\.85\s*mm\b/gi, "")
    .replace(/\b\d+\s*[kK][gG]\b/g, "")
    .replace(/\b\d+\s*[gG]\b/g, "")
    .replace(/\bPRO\b/gi, "")
    .replace(/\bv\d+\b/gi, "");
  // Strip material name (case insensitive)
  const matVariants = [material, material.toUpperCase(), material.toLowerCase()];
  for (const mv of matVariants) {
    s = s.replace(new RegExp(`\\b${mv.replace(/[+]/g, "\\+")}\\b`, "gi"), "");
  }
  // Also strip base materials that might appear in title but aren't the detected material
  for (const baseMat of ["PLA", "PETG", "ABS", "ASA", "TPU", "Nylon", "PC", "PVA", "HIPS", "PEBA"]) {
    if (baseMat.toUpperCase() !== material.toUpperCase()) continue;
    // Already handled above
  }
  s = s.replace(/\s+/g, " ").trim().replace(/^[-–—\s]+|[-–—\s]+$/g, "").trim();
  return s.length > 0 ? titleCase(s) : "Default";
}

function guessColorHex(name: string): string | null {
  const l = name.toLowerCase().trim();
  if (CHX[l]) return CHX[l];
  let best = "";
  for (const k of Object.keys(CHX)) { if (l.includes(k) && k.length > best.length) best = k; }
  return best ? CHX[best] : null;
}

function guessColorFamily(name: string): string | null {
  const l = name.toLowerCase().trim();
  for (const [k, f] of Object.entries(CFM)) { if (l.includes(k)) return f; }
  return null;
}

function guessFinishType(material: string, title: string): string {
  const c = `${material} ${title}`.toLowerCase();
  if (c.includes("silk")) return "Silk";
  if (c.includes("matte") || c.includes("matt ")) return "Matte";
  if (c.includes("marble")) return "Marble";
  if (c.includes("galaxy")) return "Galaxy";
  if (c.includes("sparkle") || c.includes("glitter") || c.includes("shimmer") || c.includes("starlight")) return "Sparkle";
  if (c.includes("glow") || c.includes("luminous") || c.includes("phosphor")) return "Glow-in-the-Dark";
  if (c.includes("transparent") || c.includes("translucent")) return "Transparent";
  if (c.includes("neon")) return "Neon";
  if (c.includes("wood")) return "Wood Fill";
  if (c.includes("carbon")) return "Carbon Fiber";
  if (c.includes("rainbow") || c.includes("multicolor") || c.includes("multi-color")) return "Rainbow";
  if (c.includes("metallic") || c.includes("metal ")) return "Metallic";
  return "Standard";
}

function extractWeightFromText(text: string): number | null {
  if (!text) return null;
  const kg = text.match(/(\d+(?:\.\d+)?)\s*kg/i);
  if (kg?.[1]) { const w = parseFloat(kg[1]) * 1000; if (w > 0 && w <= 50000) return Math.round(w); }
  const g = text.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  if (g?.[1]) { const w = parseFloat(g[1]); if (w > 0 && w <= 50000) return Math.round(w); }
  const lb = text.match(/(\d+(?:\.\d+)?)\s*lb/i);
  if (lb?.[1]) { const w = parseFloat(lb[1]) * 453.592; if (w > 0 && w <= 50000) return Math.round(w); }
  return null;
}

function detectOptionPositions(product: any, config: ScrapingConfig): {
  regionKey: string | null; materialKey: string | null; colorKey: string | null;
} {
  const fb = {
    regionKey: config.variant_mapping?.region_option || "option1",
    materialKey: config.variant_mapping?.material_option || null,
    colorKey: config.variant_mapping?.color_option || "option3",
  };
  if (!product?.options?.length) return fb;

  let regionKey: string | null = null;
  let materialKey: string | null = null;
  let colorKey: string | null = null;

  for (const opt of product.options) {
    const name = (opt.name || "").toLowerCase().trim();
    const key = `option${opt.position}`;

    if (name.includes("material") && name.includes("color")) { colorKey = key; continue; }
    if (!regionKey && REGION_KEYWORDS.some((kw) => name.includes(kw))) regionKey = key;
    else if (!colorKey && COLOR_OPT_KEYWORDS.some((kw) => name.includes(kw))) colorKey = key;
    // "Spool Type" / "Spool" should NOT be treated as a material option
    else if (!materialKey && MATERIAL_OPT_KEYWORDS.some((kw) => name.includes(kw)) && !name.includes("spool")) materialKey = key;
  }

  return {
    // Only fall back to config's region_option if it was explicitly set.
    // Don't assume a region option exists — brands like Bambu Lab have no region variants.
    regionKey: regionKey ?? (config.variant_mapping?.region_option || null),
    materialKey: materialKey || fb.materialKey,
    colorKey: colorKey || fb.colorKey,
  };
}

// ── Simplified spec extraction from body_html ──

interface ParsedSpecs {
  nozzleTempMin: number | null; nozzleTempMax: number | null;
  bedTempMin: number | null; bedTempMax: number | null;
  netWeight: number | null; diameter: number | null;
  printSpeedMax: number | null; weightSource: "body_html" | null;
  // Enhanced spec fields
  dryingTempC: number | null; dryingTimeHours: number | null;
  tgC: number | null; densityGCm3: number | null;
  fanMinPercent: number | null; fanMaxPercent: number | null;
  retractionLengthMm: number | null; retractionSpeedMms: number | null;
  tdsUrl: string | null;
  // Mechanical & thermal properties from body_html
  tensileStrengthMpa: number | null;
  elongationBreakPercent: number | null;
  flexuralStrengthMpa: number | null;
  impactStrengthKjM2: number | null;
  shoreHardnessD: number | null;
  hardnessShoreA: number | null;
  meltTempC: number | null;
  hdtC: number | null;
  vicatC: number | null;
  waterAbsorptionPercent: number | null;
}

function parseSpecsFromHtml(bodyHtml: string, specConfig: Record<string, string> | null): ParsedSpecs {
  const r: ParsedSpecs = {
    nozzleTempMin: null, nozzleTempMax: null,
    bedTempMin: null, bedTempMax: null,
    netWeight: null, diameter: null,
    printSpeedMax: null, weightSource: null,
    dryingTempC: null, dryingTimeHours: null,
    tgC: null, densityGCm3: null,
    fanMinPercent: null, fanMaxPercent: null,
    retractionLengthMm: null, retractionSpeedMms: null,
    tdsUrl: null,
    tensileStrengthMpa: null, elongationBreakPercent: null,
    flexuralStrengthMpa: null, impactStrengthKjM2: null,
    shoreHardnessD: null, hardnessShoreA: null,
    meltTempC: null, hdtC: null, vicatC: null,
    waterAbsorptionPercent: null,
  };
  if (!bodyHtml) return r;

  const text = bodyHtml.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
  const tryRe = (p: string) => { try { return text.match(new RegExp(p, "i")); } catch { return null; } };

  // ── Existing spec extraction ──
  const dRe = specConfig?.diameter_regex || "(?:Diameter|Filament\\s+Diameter)[:\\s]*([\\d.]+)";
  const dm = tryRe(dRe);
  if (dm?.[1]) r.diameter = parseFloat(dm[1]);

  const nRe = specConfig?.nozzle_temp_regex || "(?:Printing|Nozzle|Extruder)\\s*(?:Temp(?:erature)?)[:\\s]*([\\d]+)\\s*[°℃]?\\s*[–\\-~to]+\\s*([\\d]+)";
  const nm = tryRe(nRe);
  if (nm?.[1] && nm?.[2]) { r.nozzleTempMin = parseInt(nm[1]); r.nozzleTempMax = parseInt(nm[2]); }

  const bRe = specConfig?.bed_temp_regex || "(?:Bed|Platform|Heated\\s*Bed)\\s*(?:Temp(?:erature)?)[:\\s]*([\\d]+)\\s*[°℃]?\\s*[–\\-~to]+\\s*([\\d]+)";
  const bm = tryRe(bRe);
  if (bm?.[1] && bm?.[2]) { r.bedTempMin = parseInt(bm[1]); r.bedTempMax = parseInt(bm[2]); }

  const wRe = specConfig?.weight_regex || "(?:Net\\s+Weight|Weight)[:\\s]*([\\d.]+)\\s*(?:kg|g)";
  const wm = tryRe(wRe);
  if (wm?.[1]) {
    const w = parseFloat(wm[1]);
    r.netWeight = w < 50 ? Math.round(w * 1000) : Math.round(w);
    r.weightSource = "body_html";
  }

  const sRe = specConfig?.speed_regex || "(?:Print(?:ing)?\\s+Speed)[:\\s]*(?:up\\s+to\\s+)?([\\d]+)\\s*(?:mm/s|mm\\/s)";
  const sm = tryRe(sRe);
  if (sm?.[1]) r.printSpeedMax = parseInt(sm[1]);

  // ── Enhanced spec extraction ──

  // Drying temperature: "Drying Temp: 45°C", "Dry at 50°C", "Recommended Drying Temperature: 65°C"
  const dryTempM = tryRe("(?:Dry(?:ing)?\\s*(?:Temp(?:erature)?)?|Recommended\\s+Dry(?:ing)?\\s*Temp(?:erature)?)[:\\s]*([\\d]+)\\s*[°℃]");
  if (dryTempM?.[1]) {
    const dt = parseInt(dryTempM[1]);
    if (dt >= 30 && dt <= 200) r.dryingTempC = dt;
  }

  // Drying time: "Drying Time: 4 hours", "Dry for 4-6 hours", "Dry Time: 8h"
  const dryTimeM = tryRe("(?:Dry(?:ing)?\\s*Time)[:\\s]*([\\d]+)\\s*(?:[-–~to]+\\s*[\\d]+\\s*)?(?:h(?:ours?|rs?)?|H)");
  if (dryTimeM?.[1]) {
    const dt = parseInt(dryTimeM[1]);
    if (dt >= 1 && dt <= 48) r.dryingTimeHours = dt;
  }

  // Glass transition temperature: "Tg: 60°C", "Glass Transition: 80°C", "Vicat: 58°C"
  const tgM = tryRe("(?:Tg|Glass\\s*Transition(?:\\s*Temp(?:erature)?)?|Vicat)[:\\s]*([\\d]+)\\s*[°℃]");
  if (tgM?.[1]) {
    const tg = parseInt(tgM[1]);
    if (tg >= -60 && tg <= 400) r.tgC = tg;
  }

  // Density: "Density: 1.24 g/cm³", "Specific Gravity: 1.27", "1.04 g/cc"
  const densityM = tryRe("(?:Density|Specific\\s*Gravity)[:\\s]*([\\d]+\\.?[\\d]*)\\s*(?:g\\/cm[³3]?|g\\/cc)?");
  if (densityM?.[1]) {
    const d = parseFloat(densityM[1]);
    if (d >= 0.8 && d <= 2.5) r.densityGCm3 = d;
  }

  // Fan speed: "Fan Speed: 50-100%", "Cooling Fan: 80~100%", "Part Cooling: 30-60%"
  const fanM = tryRe("(?:Fan\\s*Speed|Cool(?:ing)?\\s*Fan|Part\\s*Cool(?:ing)?)[:\\s]*([\\d]+)\\s*[%]?\\s*[–\\-~to]+\\s*([\\d]+)\\s*[%]?");
  if (fanM?.[1] && fanM?.[2]) {
    const fMin = parseInt(fanM[1]);
    const fMax = parseInt(fanM[2]);
    if (fMin >= 0 && fMin <= 100 && fMax >= 0 && fMax <= 100) {
      r.fanMinPercent = fMin; r.fanMaxPercent = fMax;
    }
  }

  // Retraction length: "Retraction: 0.8mm", "Retraction Distance: 1.0mm", "Retraction Length: 0.5-1.0mm"
  const retLenM = tryRe("(?:Retraction)\\s*(?:Distance|Length)?[:\\s]*([\\d]+\\.?[\\d]*)\\s*(?:mm)");
  if (retLenM?.[1]) {
    const rl = parseFloat(retLenM[1]);
    if (rl >= 0.1 && rl <= 15) r.retractionLengthMm = rl;
  }

  // Retraction speed: "Retraction Speed: 25mm/s", "Retract Speed: 30mm/s"
  const retSpdM = tryRe("(?:Retract(?:ion)?\\s*Speed)[:\\s]*([\\d]+)\\s*(?:mm\\/s|mm/s)");
  if (retSpdM?.[1]) {
    const rs = parseInt(retSpdM[1]);
    if (rs >= 5 && rs <= 100) r.retractionSpeedMms = rs;
  }

  // TDS URL: look for links to PDFs containing "tds", "technical", "datasheet", "safety"
  const tdsLinkM = bodyHtml.match(/<a[^>]+href=["']([^"']*(?:tds|technical|datasheet|safety)[^"']*\.pdf[^"']*)["']/i);
  if (tdsLinkM?.[1]) r.tdsUrl = tdsLinkM[1];

  // ── Mechanical & thermal property extraction ──

  // Tensile strength: "Tensile Strength: 50 MPa", "Tensile Strength (XY): 48 MPa"
  const tensileM = tryRe("(?:Tensile\\s+Strength)\\s*(?:\\(XY\\))?[:\\s]*([\\d]+\\.?[\\d]*)\\s*(?:MPa|mpa|N\\/mm)");
  if (tensileM?.[1]) {
    const v = parseFloat(tensileM[1]);
    if (v >= 1 && v <= 500) r.tensileStrengthMpa = v;
  }

  // Elongation at break: "Elongation at Break: 6%", "Elongation: 25%"
  const elongM = tryRe("(?:Elongation)\\s*(?:at\\s+Break)?[:\\s]*([\\d]+\\.?[\\d]*)\\s*[%]");
  if (elongM?.[1]) {
    const v = parseFloat(elongM[1]);
    if (v >= 0.5 && v <= 1000) r.elongationBreakPercent = v;
  }

  // Flexural strength: "Flexural Strength: 80 MPa", "Bending Strength: 70 MPa"
  const flexM = tryRe("(?:Flexural|Bending)\\s+Strength[:\\s]*([\\d]+\\.?[\\d]*)\\s*(?:MPa|mpa|N\\/mm)");
  if (flexM?.[1]) {
    const v = parseFloat(flexM[1]);
    if (v >= 1 && v <= 500) r.flexuralStrengthMpa = v;
  }

  // Impact strength: "Impact Strength: 20 kJ/m²", "Charpy Impact: 5.5 kJ/m²", "Izod Impact: 8 kJ/m²"
  const impactM = tryRe("(?:(?:Charpy|Izod|Notched)?\\s*Impact\\s+Strength)[:\\s]*([\\d]+\\.?[\\d]*)\\s*(?:kJ\\/m|KJ\\/m)");
  if (impactM?.[1]) {
    const v = parseFloat(impactM[1]);
    if (v >= 0.1 && v <= 200) r.impactStrengthKjM2 = v;
  }

  // Shore Hardness D: "Shore D Hardness: 83", "Hardness (Shore D): 76"
  const shoreD = tryRe("(?:Shore\\s*D\\s*(?:Hardness)?|Hardness\\s*\\(Shore\\s*D\\))[:\\s]*([\\d]+)");
  if (shoreD?.[1]) {
    const v = parseInt(shoreD[1]);
    if (v >= 10 && v <= 100) r.shoreHardnessD = v;
  }

  // Shore Hardness A: "Shore A Hardness: 95", "Hardness (Shore A): 85"
  const shoreA = tryRe("(?:Shore\\s*A\\s*(?:Hardness)?|Hardness\\s*\\(Shore\\s*A\\))[:\\s]*([\\d]+)");
  if (shoreA?.[1]) {
    const v = parseInt(shoreA[1]);
    if (v >= 10 && v <= 100) r.hardnessShoreA = v;
  }

  // Melt temperature: "Melt Temperature: 175°C", "Melting Point: 260°C"
  const meltM = tryRe("(?:Melt(?:ing)?\\s*(?:Temp(?:erature)?|Point))[:\\s]*([\\d]+)\\s*[°℃]");
  if (meltM?.[1]) {
    const v = parseInt(meltM[1]);
    if (v >= 100 && v <= 500) r.meltTempC = v;
  }

  // HDT: "HDT @ 0.45 MPa: 55°C", "Heat Deflection: 98°C", "HDT (0.45MPa): 70°C"
  const hdtM = tryRe("(?:HDT|Heat\\s*Deflection(?:\\s*Temp(?:erature)?)?)\\s*(?:@|\\()?\\s*(?:0\\.45\\s*MPa)?\\s*(?:\\))?[:\\s]*([\\d]+)\\s*[°℃]");
  if (hdtM?.[1]) {
    const v = parseInt(hdtM[1]);
    if (v >= 30 && v <= 400) r.hdtC = v;
  }

  // Vicat softening: "Vicat Softening: 57°C", "Vicat B/50: 100°C"
  const vicatM = tryRe("(?:Vicat)\\s*(?:Softening(?:\\s*Temp(?:erature)?)?|[AB]\\/\\d+)?[:\\s]*([\\d]+)\\s*[°℃]");
  if (vicatM?.[1]) {
    const v = parseInt(vicatM[1]);
    if (v >= 30 && v <= 400) r.vicatC = v;
  }

  // Water absorption: "Water Absorption: 0.5%", "Moisture Absorption: 2.5%"
  const waterM = tryRe("(?:Water|Moisture)\\s*Absorption[:\\s]*([\\d]+\\.?[\\d]*)\\s*[%]");
  if (waterM?.[1]) {
    const v = parseFloat(waterM[1]);
    if (v >= 0 && v <= 20) r.waterAbsorptionPercent = v;
  }

  return r;
}

// ============================================================
// Classification
// ============================================================

export interface ClassifyResult { isFilament: boolean; reason: string; }

export function classifyProduct(product: any): ClassifyResult {
  const rawTitle = product.title || "";
  const title = rawTitle.toLowerCase();
  const productType = (product.product_type || "").toLowerCase();
  // tags can be an array (Shopify /products.json) or comma-separated string (/products/{handle}.json)
  const rawTags = product.tags || [];
  const tagsArray = typeof rawTags === 'string' ? rawTags.split(',').map((s: string) => s.trim()) : rawTags;
  const tags = tagsArray.map((t: string) => t.toLowerCase());
  const optionNames = (product.options || []).map((o: any) => (o.name || "").toLowerCase());

  if (/^\[.+only\]/i.test(rawTitle)) return { isFilament: false, reason: "regional_clearance" };
  if (title.includes("clearance")) return { isFilament: false, reason: "clearance" };
  if (title.includes("combo") && (title.includes("mix") || title.includes("sampler")))
    return { isFilament: false, reason: "combo_sampler" };
  if (title.includes("bundle") && (/\d+g?\s*[*×x]\s*\d+/i.test(title) || title.includes("pack") || /\d+\s*[×x]\s*\d+/i.test(title)))
    return { isFilament: false, reason: "bundle" };
  if (/\b12\s*kg\b/i.test(title)) return { isFilament: false, reason: "bulk_pack" };
  if (optionNames.some((n: string) => n === "price" || n === "note"))
    return { isFilament: false, reason: "service_product" };

  const HARD_EXCLUSIONS = [
    "dryer","filadryer","printer","enclosure","resin","nozzle","extruder",
    "hotend","hot end","build plate","pei","bed leveling","spool holder",
    "filament holder","filament connector","splicer","warranty","worry-free",
    "wash","cure","lcd","screen","upgrade","accessories","board","protection",
    "storage kit","storage bag","vacuum bag","misc charge",
  ];
  for (const kw of HARD_EXCLUSIONS) { if (title.includes(kw)) return { isFilament: false, reason: "non_filament" }; }
  if (title.includes("resin") && !title.includes("filament")) return { isFilament: false, reason: "non_filament" };

  const hasRelevantOpt = optionNames.some((n: string) =>
    n.includes("color") || n.includes("material") || n.includes("ship") ||
    n.includes("region") || n.includes("type") || n.includes("variant") ||
    n.includes("delivery") || n.includes("size")
  );
  const hasFKW = FILAMENT_KEYWORDS.some((fk) => title.includes(fk));
  if (!hasRelevantOpt && !hasFKW) return { isFilament: false, reason: "no_relevant_options" };
  if (["3d printers","resin","printer","accessories","gift card","storage bag","bundlepack"].includes(productType) && !hasFKW)
    return { isFilament: false, reason: "non_filament" };
  if (title.includes("sample coil") || title.includes("sample pack") ||
      title.includes("t-shirt") || title.includes("hoodie") || title.includes("gift card"))
    return { isFilament: false, reason: "non_filament" };
  if (/\b\d+\s*pack\b/i.test(title) || title.includes("variety pack") || title.includes("greatest hits"))
    return { isFilament: false, reason: "bundle" };
  // Multi-spool sets (4KG = 4×1KG, etc.) — exclude only when weight > 2kg AND title contains "pack" or "bundle" or multi-spool indicators
  if (/\b[4-9]\s*kg\b/i.test(title) && (title.includes("pack") || title.includes("bundle") || title.includes("package") || title.includes("set") || /\d+\s*×\s*\d+/i.test(title)))
    return { isFilament: false, reason: "bulk_pack" };
  if (hasFKW) return { isFilament: true, reason: "title_keyword" };
  if (optionNames.some((n: string) => n.includes("material") || n.includes("color"))) {
    if (product.variants?.some((v: any) => v.grams > 500)) return { isFilament: true, reason: "option_heuristic" };
  }
  for (const tag of tags) {
    if (FILAMENT_KEYWORDS.some((kw) => tag.includes(kw))) return { isFilament: true, reason: "tag_keyword" };
  }
  return { isFilament: false, reason: "non_filament" };
}

// ============================================================
// Extraction
// ============================================================

export function extractFilamentsFromProduct(
  product: any, config: ScrapingConfig
): { filaments: ExtractedFilament[]; warnings: string[] } {
  const warnings: string[] = [];
  const filaments: ExtractedFilament[] = [];
  const handle = product.handle || "unknown";

  if (!product.variants?.length) { warnings.push(`'${handle}': no variants`); return { filaments, warnings }; }

  const det = detectOptionPositions(product, config);
  warnings.push(`'${handle}': R=${det.regionKey}, M=${det.materialKey}, C=${det.colorKey}`);

  const regionMap: Record<string, string> = config.variant_mapping?.region_map || {};
  const regionalUrls = config.regional_url_pattern || {};
  const buildUrl = (r: string): string | null => {
    const base = regionalUrls[r]; return base ? `${base.replace(/\/$/, "")}/products/${handle}` : null;
  };

  // Spec extraction from body_html
  const specs = parseSpecsFromHtml(product.body_html || "", config.spec_extraction || null);

  // Weight fallback from variant/product title
  let netWeight = specs.netWeight;
  let weightSource: ExtractedFilament["weight_source"] = specs.weightSource;
  if (netWeight == null) {
    const vw = extractWeightFromText(product.variants?.[0]?.title || "");
    if (vw != null) { netWeight = vw; weightSource = "variant_title"; }
    else {
      const tw = extractWeightFromText(product.title || "");
      if (tw != null) { netWeight = tw; weightSource = "product_title"; }
    }
  }

  function getMaterial(variant: any): string {
    if (det.materialKey) {
      const raw = variant[det.materialKey!];
      if (raw) { const c = cleanMaterialAggressive(raw); if (c && c.length >= 2) return c; }
    }
    return parseMaterialFromTitle(product.title || "") || (config.default_material_type || "PLA").toUpperCase();
  }

  // Should we extract color from product title instead of variant options?
  const colorFromTitle = !!config.variant_mapping?.color_from_title;

  // Group variants by material + color
  const groups: Record<string, any[]> = {};
  for (const v of product.variants) {
    const mat = getMaterial(v);
    let rawColor: string;
    if (colorFromTitle) {
      // Color is embedded in the product title (e.g., Atomic Filament: "Army Green ASA Filament")
      rawColor = parseColorFromTitle(product.title || "", mat);
    } else {
      rawColor = det.colorKey ? (v[det.colorKey] || v.title || "Default") : (v.title || "Default");
      // If the color value looks like size specs, fall back to product title
      if (looksLikeSizeSpec(rawColor)) {
        rawColor = parseColorFromTitle(product.title || "", mat);
      }
    }
    const color = cleanColorName(rawColor, mat);
    const key = `${mat}|${color}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(v);
  }

  for (const [groupKey, variants] of Object.entries(groups)) {
    const [material, colorName] = groupKey.split("|");
    let priceUsd: number | null = null, priceEur: number | null = null;
    let priceCad: number | null = null, priceAud: number | null = null, priceGbp: number | null = null;
    const availableRegions: string[] = [];
    let anyAvailable = false;

    if (det.regionKey) {
      for (const v of variants) {
        const rl = v[det.regionKey!] || "";
        const rc = mapRegionToCode(rl, regionMap);
        const price = parseFloat(v.price);
        if (rc && !isNaN(price) && price > 0) {
          if (rc === "US") priceUsd = price; else if (rc === "EU") priceEur = price;
          else if (rc === "CA") priceCad = price; else if (rc === "AU") priceAud = price;
          else if (rc === "UK") priceGbp = price;
          if (v.available && !availableRegions.includes(rc)) { availableRegions.push(rc); anyAvailable = true; }
        }
      }
    } else {
      const price = parseFloat(variants[0].price);
      if (!isNaN(price) && price > 0) {
        priceUsd = price;
        if (variants[0].available) { availableRegions.push("US"); anyAvailable = true; }
      }
    }

    // Images
    const variantIds = variants.map((v: any) => v.id);
    let variantImage: string | null = null;
    for (const v of variants) { if (v.featured_image?.src) { variantImage = v.featured_image.src; break; } }
    if (!variantImage && product.images?.length) {
      const mi = product.images.find((img: any) => img.variant_ids?.some((vid: number) => variantIds.includes(vid)));
      if (mi) variantImage = mi.src;
    }
    const featuredImage = product.images?.[0]?.src || variantImage || null;
    if (!variantImage) variantImage = featuredImage;

    // SKU — prefer US variant
    const usV = det.regionKey
      ? variants.find((v: any) => mapRegionToCode(v[det.regionKey!] || "", regionMap) === "US")
      : null;
    const variantSku = usV?.sku || variants[0]?.sku || null;

    const displayName = makeDisplayName(material, colorName);

    // Resolve material defaults for enrichment fields
    const matDefaults = resolveMaterialDefaults(material);

    // Title-keyword based CF/GF detection (overrides material defaults)
    const titleUpper = product.title?.toUpperCase() || "";
    const titleHasCF = titleUpper.includes("CF") || titleUpper.includes("CARBON FIBER");
    const titleHasGF = titleUpper.includes("GF") || titleUpper.includes("GLASS FIBER");

    // Priority: body_html extraction > material defaults > title keywords
    const isAbrasive = titleHasCF || titleHasGF || matDefaults?.is_nozzle_abrasive || null;
    const nozzleType = isAbrasive ? "Hardened Steel" : (matDefaults?.recommended_nozzle_type ?? null);

    filaments.push({
      brand_id: config.brand_id,
      material,
      product_title: displayName,
      display_name: displayName,
      color_family: guessColorFamily(colorName),
      color_hex: guessColorHex(colorName),
      featured_image: featuredImage,
      variant_image: variantImage,
      nozzle_temp_min_c: specs.nozzleTempMin,
      nozzle_temp_max_c: specs.nozzleTempMax,
      bed_temp_min_c: specs.bedTempMin,
      bed_temp_max_c: specs.bedTempMax,
      diameter_nominal_mm: specs.diameter || 1.75,
      net_weight_g: netWeight,
      weight_source: weightSource,
      product_url: buildUrl("US") || `${config.base_url}/products/${handle}`,
      product_url_us: buildUrl("US"),
      product_url_eu: buildUrl("EU"),
      product_url_uk: buildUrl("UK"),
      product_url_ca: buildUrl("CA"),
      product_url_au: buildUrl("AU"),
      price_usd: priceUsd, price_eur: priceEur, price_gbp: priceGbp,
      price_cad: priceCad, price_aud: priceAud,
      product_handle: handle,
      variant_sku: variantSku,
      finish_type: guessFinishType(material, colorName),
      spool_material: null,
      spool_outer_d_mm: null,
      spool_width_mm: null,
      print_speed_max_mms: specs.printSpeedMax,
      high_speed_capable: material.includes("HSPLA") || material.includes("HS") ||
        (specs.printSpeedMax !== null && specs.printSpeedMax >= 300),
      drying_temp_c: specs.dryingTempC ?? matDefaults?.drying_temp_c ?? null,
      drying_time_hours: specs.dryingTimeHours ?? matDefaults?.drying_time_hours ?? null,
      pack_quantity: 1,
      variant_available: anyAvailable,
      available_regions: availableRegions,
      // Enrichment fields
      tg_c: specs.tgC ?? matDefaults?.tg_c ?? null,
      moisture_sensitivity_level: matDefaults?.moisture_sensitivity_level ?? null,
      is_nozzle_abrasive: isAbrasive,
      recommended_nozzle_type: nozzleType,
      fan_min_percent: specs.fanMinPercent ?? matDefaults?.fan_min_percent ?? null,
      fan_max_percent: specs.fanMaxPercent ?? matDefaults?.fan_max_percent ?? null,
      density_g_cm3: specs.densityGCm3 ?? matDefaults?.density_g_cm3 ?? null,
      nozzle_temp_sweetspot_c: matDefaults?.nozzle_temp_sweetspot_c ?? null,
      use_case_tags: matDefaults?.use_case_tags ?? null,
      food_contact_rating: matDefaults?.food_contact_rating ?? null,
      retraction_length_mm: specs.retractionLengthMm ?? null,
      retraction_speed_mms: specs.retractionSpeedMms ?? null,
      spool_ams_fit: null,
      tds_url: specs.tdsUrl ?? null,
      // Mechanical properties (body_html > material defaults)
      tensile_strength_xy_mpa: specs.tensileStrengthMpa ?? matDefaults?.tensile_strength_xy_mpa ?? null,
      elongation_break_xy_percent: specs.elongationBreakPercent ?? matDefaults?.elongation_break_xy_percent ?? null,
      flexural_strength_mpa: specs.flexuralStrengthMpa ?? matDefaults?.flexural_strength_mpa ?? null,
      impact_strength_kj_m2: specs.impactStrengthKjM2 ?? matDefaults?.impact_strength_kj_m2 ?? null,
      shore_hardness_d: specs.shoreHardnessD ?? matDefaults?.shore_hardness_d ?? null,
      hardness_shore_a: specs.hardnessShoreA ?? matDefaults?.hardness_shore_a ?? null,
      // Thermal properties (body_html > material defaults)
      melt_temp_c: specs.meltTempC ?? matDefaults?.melt_temp_c ?? null,
      hdt_045_mpa_c: specs.hdtC ?? matDefaults?.hdt_045_mpa_c ?? null,
      vicat_softening_temp_c: specs.vicatC ?? matDefaults?.vicat_softening_temp_c ?? null,
      water_absorption_percent: specs.waterAbsorptionPercent ?? matDefaults?.water_absorption_percent ?? null,
      // Product line grouping
      product_line_id: computeProductLineId(
        config.adapter_key, material, specs.diameter || 1.75, guessFinishType(material, colorName)
      ),
    });
  }

  return { filaments, warnings };
}

// ============================================================
// Diff
// ============================================================

export interface DiffResult {
  filament: ExtractedFilament;
  status: "new" | "matched" | "price_changed" | "error";
  existingId: string | null;
  priceDiff: { field: string; old: number | null; new: number | null }[] | null;
}

export async function diffAgainstDatabase(
  supabase: any, filaments: ExtractedFilament[], brandId: string, brandName?: string
): Promise<DiffResult[]> {
  const results: DiffResult[] = [];

  const selectFields = "id, variant_sku, material, display_name, product_title, color_family, product_handle, variant_price, price_eur, price_gbp, price_cad, price_aud";

  // Primary: match by brand_id (automated_brands FK)
  const { data: existingById } = await supabase
    .from("filaments")
    .select(selectFields)
    .eq("brand_id", brandId).limit(1000);

  let existing = existingById || [];

  // Fallback: if no matches by brand_id, try matching by vendor name
  // (existing filaments may have been imported with a different brand_id)
  if (existing.length === 0 && brandName) {
    const { data: existingByVendor } = await supabase
      .from("filaments")
      .select(selectFields)
      .eq("vendor", brandName).limit(1000);
    existing = existingByVendor || [];
    if (existing.length > 0) {
      console.log(`[diff] Found ${existing.length} existing filaments by vendor="${brandName}" (brand_id had 0 matches)`);
    }
  }

  // Track which existing IDs have already been matched (avoid N:1 matching)
  const matchedIds = new Set<string>();

  for (const filament of filaments) {
    let match: any = null;

    // Strategy 1: exact variant_sku match
    if (filament.variant_sku) {
      match = existing.find((e: any) => e.variant_sku && e.variant_sku === filament.variant_sku && !matchedIds.has(e.id));
    }

    // Strategy 2: material + color in display_name/product_title
    if (!match) {
      const cp = (filament.display_name.split(" - ").pop() || "").toLowerCase();
      if (cp) {
        match = existing.find((e: any) =>
          !matchedIds.has(e.id) &&
          e.material?.toLowerCase() === filament.material.toLowerCase() &&
          (e.display_name?.toLowerCase().includes(cp) || e.product_title?.toLowerCase().includes(cp))
        );
      }
    }

    // Strategy 3: product_handle + color_family match
    // (handles cases where existing data has null display_name/variant_sku but has handle+color)
    if (!match && filament.product_handle) {
      const colorPart = (filament.display_name.split(" - ").pop() || "").toLowerCase();
      if (colorPart) {
        match = existing.find((e: any) =>
          !matchedIds.has(e.id) &&
          e.product_handle === filament.product_handle &&
          e.color_family?.toLowerCase() === colorPart
        );
      }
    }

    if (match) matchedIds.add(match.id);

    if (match) {
      const diffs: { field: string; old: number | null; new: number | null }[] = [];
      const cmp: [string, number | null, number | null][] = [
        ["price_usd", match.variant_price, filament.price_usd],
        ["price_eur", match.price_eur, filament.price_eur],
        ["price_gbp", match.price_gbp, filament.price_gbp],
        ["price_cad", match.price_cad, filament.price_cad],
        ["price_aud", match.price_aud, filament.price_aud],
      ];
      for (const [f, o, n] of cmp) {
        if (n !== null && o !== null && o > 0 && Math.abs(o - n) > 0.01)
          diffs.push({ field: f, old: o, new: n });
      }
      results.push({ filament, status: diffs.length > 0 ? "price_changed" : "matched", existingId: match.id, priceDiff: diffs.length > 0 ? diffs : null });
    } else {
      results.push({ filament, status: "new", existingId: null, priceDiff: null });
    }
  }

  return results;
}

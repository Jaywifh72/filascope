/**
 * Types for the Printer Catalog Sync workflow.
 *
 * Mirrors the filament sync types (SyncItem, SyncJob, DeltaStats)
 * but with printer-specific display fields.
 *
 * The printer sync pipeline runs fully in-memory (React state) — no
 * brand_sync_jobs/brand_sync_items DB writes. This avoids FK constraint
 * issues with the shared sync tables (which reference automated_brands
 * and filaments, not printer_brands and printers).
 */

// Re-use the same Phase type from filament sync
export type { Phase, DeltaStats, ImportError, ImportResult } from '@/hooks/useCatalogSync';

/**
 * A printer sync item — held in React state (not persisted to DB).
 * Generic fields (id, status, pricing) mirror SyncItem.
 * Printer-specific display fields replace filament-specific ones.
 */
export type PrinterSyncItem = {
  id: string;
  job_id: string;
  status: string; // 'new' | 'price_changed' | 'matched' | 'error'
  is_new: boolean;
  extracted_data: Record<string, unknown>;
  admin_override_data: Record<string, unknown> | null;

  // ── Display fields (printer-specific) ──
  display_name: string | null;
  model_name: string | null;
  printer_technology: string | null; // FDM, SLA, DLP, MSLA, etc.
  image_url: string | null;

  // Build volume
  build_volume_x_mm: number | null;
  build_volume_y_mm: number | null;
  build_volume_z_mm: number | null;

  // Performance
  max_print_speed_mms: number | null;
  max_nozzle_temp_c: number | null;
  bed_max_temp_c: number | null;

  // Key features (booleans)
  has_enclosure: boolean | null;
  has_wifi: boolean | null;
  multi_material_supported: boolean | null;
  multi_material_max_spools: number | null;
  auto_bed_leveling: boolean | null;

  // Extruder
  extruder_type: string | null; // 'direct-drive' | 'bowden'
  extruder_count: number | null;
  filament_diameter_mm: number | null;

  // Pricing (multi-regional — same columns as filament sync)
  price_usd: number | null;
  price_eur: number | null;
  price_cad: number | null;
  price_gbp: number | null;
  price_aud: number | null;

  // Status tracking
  existing_printer_id: string | null;
  inserted_printer_id: string | null;
  price_diff: Record<string, unknown> | null;
  error_message: string | null;

  // Metadata
  variant_sku: string | null;
  product_handle: string | null;
  available_regions: string[] | null;
  discontinued: boolean | null;
  created_at: string | null;
};

/**
 * A printer sync job summary — held in React state (not persisted to DB).
 */
export type PrinterSyncJob = {
  id: string;
  brand_id: string;
  config_id: string | null;
  status: string; // 'scanning' | 'processing' | 'completed' | 'failed'

  // Counters
  total_store_products: number | null;
  printer_products_found: number | null;
  skipped_products: number | null;
  new_count: number | null;
  changed_count: number | null;
  matched_count: number | null;
  error_count: number | null;
  imported_count: number | null;

  // Results & timestamps
  post_import_results: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  warnings: string[] | null;
};

/**
 * The rich extracted model for a printer — all fields we can pull from a store listing.
 * This is the printer equivalent of ExtractedFilament in catalog-sync-core.ts.
 */
export interface ExtractedPrinter {
  // Core identification
  brand_id: string;
  model_name: string;
  display_name: string;
  product_title: string;
  product_handle: string;
  printer_technology: string | null; // FDM, SLA, DLP, MSLA

  // Images
  featured_image: string | null;

  // ── Dimensions ──
  build_volume_x_mm: number | null;
  build_volume_y_mm: number | null;
  build_volume_z_mm: number | null;
  machine_footprint_x_mm: number | null;
  machine_footprint_y_mm: number | null;
  machine_footprint_z_mm: number | null;
  machine_weight_kg: number | null;

  // ── Temperature ──
  max_nozzle_temp_c: number | null;
  sustained_nozzle_temp_c: number | null;
  bed_max_temp_c: number | null;
  bed_heated: boolean | null;

  // ── Performance ──
  max_print_speed_mms: number | null;
  max_travel_speed_xy_mms: number | null;
  recommended_quality_speed_mms: number | null;
  max_acceleration_xy_mmss: number | null;
  max_acceleration_z_mmss: number | null;
  layer_height_min_um: number | null;
  layer_height_max_um: number | null;
  layer_height_default_um: number | null;

  // ── Extruder & Hotend ──
  extruder_count: number | null;
  extruder_type: string | null; // 'direct-drive' | 'bowden'
  filament_diameter_mm: number | null;
  hotend_type: string | null;
  max_flow_rate_mm3s: number | null;
  stock_nozzle_diameter_mm: number | null;
  nozzle_material: string | null;

  // ── Build Plate ──
  bed_size_x_mm: number | null;
  bed_size_y_mm: number | null;
  bed_type: string | null;
  auto_bed_leveling: boolean | null;
  auto_bed_leveling_method: string | null;

  // ── Enclosure ──
  has_enclosure: boolean | null;
  enclosure_type: string | null;
  enclosure_heated: boolean | null;
  filter_type: string | null;
  internal_lighting: boolean | null;

  // ── Connectivity ──
  has_wifi: boolean | null;
  has_usb: boolean | null;
  has_sd_card: boolean | null;
  has_ethernet: boolean | null;

  // ── Multi-Material ──
  multi_material_supported: boolean | null;
  multi_material_max_spools: number | null;

  // ── Power & Safety ──
  rated_power_w: number | null;
  power_input_voltage: string | null;
  thermal_runaway_protection: boolean | null;
  power_loss_recovery: boolean | null;

  // ── Frame & Assembly ──
  frame_material: string | null;
  assembly_required: boolean | null;

  // ── Firmware ──
  firmware_family: string | null;
  firmware_open_source: boolean | null;

  // ── Features ──
  input_shaping_supported: boolean | null;
  filament_runout_detection: boolean | null;

  // ── Pricing (multi-regional) ──
  price_usd: number | null;
  price_eur: number | null;
  price_gbp: number | null;
  price_cad: number | null;
  price_aud: number | null;

  // ── Product URLs ──
  product_url: string;
  product_url_us: string | null;
  product_url_eu: string | null;
  product_url_uk: string | null;
  product_url_ca: string | null;
  product_url_au: string | null;

  // ── Metadata ──
  variant_sku: string | null;
  available_regions: string[];
  sku: string | null;
  release_date: string | null;
  discontinued: boolean | null;
  target_user_segment: string | null;
  price_tier: string | null;
}

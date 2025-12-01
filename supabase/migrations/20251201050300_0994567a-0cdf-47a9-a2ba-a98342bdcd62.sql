-- Drop existing simple printers table
DROP TABLE IF EXISTS public.printers CASCADE;

-- Create printer brands table
CREATE TABLE public.printer_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create printer series table
CREATE TABLE public.printer_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.printer_brands(id) ON DELETE CASCADE,
  series_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, series_name)
);

-- Create printers table with comprehensive specs
CREATE TABLE public.printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_id TEXT UNIQUE NOT NULL,
  brand_id UUID REFERENCES public.printer_brands(id) ON DELETE CASCADE,
  series_id UUID REFERENCES public.printer_series(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL,
  variant_or_bundle_name TEXT,
  printer_technology TEXT,
  sku TEXT,
  ean_upc TEXT,
  release_date DATE,
  discontinued BOOLEAN DEFAULT false,
  discontinued_date DATE,
  firmware_family TEXT,
  firmware_open_source BOOLEAN,
  official_product_url TEXT,
  official_store_url TEXT,
  amazon_url_us TEXT,
  amazon_url_ca TEXT,
  amazon_url_uk TEXT,
  other_retailer_urls TEXT,
  build_volume_x_mm INTEGER,
  build_volume_y_mm INTEGER,
  build_volume_z_mm INTEGER,
  build_volume_shape TEXT,
  max_build_height_with_ams_mm INTEGER,
  machine_width_mm NUMERIC,
  machine_depth_mm NUMERIC,
  machine_height_mm NUMERIC,
  machine_weight_kg NUMERIC,
  machine_style TEXT,
  frame_material TEXT,
  has_enclosure BOOLEAN,
  enclosure_type TEXT,
  enclosure_heated BOOLEAN,
  enclosure_max_temp_c INTEGER,
  max_travel_speed_xy_mms NUMERIC,
  max_print_speed_mms NUMERIC,
  recommended_quality_speed_mms NUMERIC,
  max_acceleration_xy_mmss INTEGER,
  max_acceleration_z_mmss INTEGER,
  input_shaping_supported BOOLEAN,
  linear_rails_on_axes TEXT,
  motion_system_notes TEXT,
  extruder_count INTEGER,
  extruder_type TEXT,
  extruder_drive_type TEXT,
  filament_diameter_mm NUMERIC,
  max_nozzle_temp_c INTEGER,
  sustained_nozzle_temp_c INTEGER,
  hotend_type TEXT,
  hotend_brand_model TEXT,
  stock_nozzle_diameter_mm NUMERIC,
  supported_nozzle_diameters_mm TEXT,
  nozzle_material TEXT,
  max_flow_rate_mm3s NUMERIC,
  abrasive_filament_support BOOLEAN,
  extruder_notes TEXT,
  bed_size_x_mm NUMERIC,
  bed_size_y_mm NUMERIC,
  bed_type TEXT,
  bed_heated BOOLEAN,
  bed_max_temp_c INTEGER,
  bed_heater_power_w INTEGER,
  stock_plate_types TEXT,
  supported_plate_types TEXT,
  auto_bed_leveling BOOLEAN,
  abl_technique TEXT,
  auto_bed_leveling_method TEXT,
  first_layer_assist_features TEXT,
  filter_type TEXT,
  internal_lighting BOOLEAN,
  door_sensor BOOLEAN,
  smoke_sensor BOOLEAN,
  temperature_sensors TEXT,
  official_supported_materials TEXT,
  recommended_materials TEXT,
  abrasive_materials_supported BOOLEAN,
  max_recommended_material_temp_c INTEGER,
  materials_notes TEXT,
  multi_material_supported BOOLEAN,
  native_multi_material_system BOOLEAN,
  compatible_multi_material_systems TEXT,
  multi_material_max_spools INTEGER,
  multi_material_spool_chamber_max_temp_c INTEGER,
  multi_material_drying_capability BOOLEAN,
  multi_material_limitations_notes TEXT,
  has_wifi BOOLEAN,
  has_ethernet BOOLEAN,
  has_bluetooth BOOLEAN,
  has_usb_a_port BOOLEAN,
  has_usb_c_port BOOLEAN,
  has_sd_card BOOLEAN,
  has_micro_sd_card BOOLEAN,
  onboard_storage_gb NUMERIC,
  cloud_platforms TEXT,
  remote_monitoring_supported BOOLEAN,
  remote_control_supported BOOLEAN,
  screen_type TEXT,
  screen_size_inch NUMERIC,
  screen_resolution TEXT,
  control_knob BOOLEAN,
  ui_language_options TEXT,
  assembly_required BOOLEAN,
  average_assembly_time_min INTEGER,
  maintenance_interval_hours INTEGER,
  nozzle_change_ease TEXT,
  belt_tensioning_method TEXT,
  common_failure_points TEXT,
  recommended_upgrades TEXT,
  noise_level_printing_db NUMERIC,
  noise_level_idle_db NUMERIC,
  power_input_voltage TEXT,
  rated_power_w INTEGER,
  typical_power_pla_w INTEGER,
  typical_power_abs_w INTEGER,
  power_supply_type TEXT,
  thermal_runaway_protection BOOLEAN,
  power_loss_recovery BOOLEAN,
  safety_certifications TEXT,
  safety_notes TEXT,
  msrp_usd NUMERIC,
  msrp_cad NUMERIC,
  msrp_eur NUMERIC,
  current_price_usd_store NUMERIC,
  current_price_usd_amazon NUMERIC,
  price_tier TEXT,
  target_user_segment TEXT,
  marketing_tags TEXT,
  rating_community_overall NUMERIC,
  rating_ease_of_use NUMERIC,
  rating_print_quality NUMERIC,
  rating_reliability NUMERIC,
  rating_value_for_money NUMERIC,
  review_count_aggregated INTEGER,
  community_popularity_score NUMERIC,
  common_mods_tags TEXT,
  compatible_plate_types TEXT,
  default_plate_type TEXT,
  printer_profile_slug_in_slicers TEXT,
  data_source_urls TEXT,
  data_source_priority TEXT,
  data_quality_notes TEXT,
  last_verified_utc TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_printers_updated_at
BEFORE UPDATE ON public.printers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_printer_brands_updated_at
BEFORE UPDATE ON public.printer_brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_printers_brand_id ON public.printers(brand_id);
CREATE INDEX idx_printers_series_id ON public.printers(series_id);
CREATE INDEX idx_printers_printer_id ON public.printers(printer_id);
CREATE INDEX idx_printers_model_name ON public.printers(model_name);
CREATE INDEX idx_printer_series_brand_id ON public.printer_series(brand_id);

-- Enable RLS
ALTER TABLE public.printer_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printer_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Printer brands publicly readable"
ON public.printer_brands FOR SELECT
USING (true);

CREATE POLICY "Printer series publicly readable"
ON public.printer_series FOR SELECT
USING (true);

CREATE POLICY "Printers publicly readable"
ON public.printers FOR SELECT
USING (true);

-- Admin write policies
CREATE POLICY "Admins manage printer brands"
ON public.printer_brands FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage printer series"
ON public.printer_series FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage printers"
ON public.printers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
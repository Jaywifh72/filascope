-- Add advanced feature tracking fields
ALTER TABLE printers 
  ADD COLUMN IF NOT EXISTS pressure_advance_supported boolean,
  ADD COLUMN IF NOT EXISTS flow_calibration_supported boolean,
  ADD COLUMN IF NOT EXISTS filament_runout_detection boolean,
  ADD COLUMN IF NOT EXISTS filament_entanglement_detection boolean,
  ADD COLUMN IF NOT EXISTS ai_spaghetti_detection boolean,
  ADD COLUMN IF NOT EXISTS object_skip_supported boolean,
  ADD COLUMN IF NOT EXISTS area_leveling_supported boolean,
  ADD COLUMN IF NOT EXISTS z_offset_supported boolean;

-- Add hotend details
ALTER TABLE printers
  ADD COLUMN IF NOT EXISTS quick_release_hotend boolean,
  ADD COLUMN IF NOT EXISTS hotend_material_composition text;

-- Add package specifications
ALTER TABLE printers
  ADD COLUMN IF NOT EXISTS package_width_mm numeric,
  ADD COLUMN IF NOT EXISTS package_depth_mm numeric,
  ADD COLUMN IF NOT EXISTS package_height_mm numeric,
  ADD COLUMN IF NOT EXISTS package_weight_kg numeric;
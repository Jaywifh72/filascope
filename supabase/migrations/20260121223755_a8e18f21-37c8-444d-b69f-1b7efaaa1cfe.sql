UPDATE printers 
SET 
  -- CRITICAL CORRECTIONS
  rated_power_w = 1530,
  extruder_count = 1,
  package_width_mm = 1180,
  package_depth_mm = 1220,
  package_height_mm = 830,
  machine_style = 'CoreXY',
  official_supported_materials = 'PLA, PLA+, PETG, TPU, ABS, ASA, Wood, Carbon Fiber',
  nozzle_material = 'Brass (0.6mm default)',
  
  -- PERFORMANCE SPECS
  max_print_speed_mms = 300,
  max_acceleration_xy_mmss = 5000,
  msrp_usd = 2499,
  
  -- LAYER HEIGHT (micrometers)
  layer_height_min_um = 100,
  layer_height_max_um = 400,
  layer_height_default_um = 200,
  
  -- POSITIONING ACCURACY
  xy_positioning_accuracy_um = 100,
  z_positioning_accuracy_um = 100,
  
  -- MACHINE DIMENSIONS
  machine_width_mm = 1224,
  machine_depth_mm = 1164,
  machine_height_mm = 1425,
  
  -- FEATURES & HARDWARE
  auto_bed_leveling = true,
  auto_bed_leveling_method = '100-Point (10x10) Inductive Sensor Mesh Leveling',
  input_shaping_supported = true,
  linear_rails_on_axes = 'X, Y',
  extruder_type = 'Direct Drive Dual-Gear',
  extruder_drive_type = 'Direct Drive',
  hotend_brand_model = 'ELEGOO 60W Ceramic Heater with Titanium Heat Break',
  screen_type = '7" Removable Capacitive Color Touchscreen',
  screen_size_inch = 7.0,
  internal_lighting = true,
  power_loss_recovery = true,
  power_input_voltage = '100-240 VAC',
  bed_type = '4x Independent PEI Magnetic Spring Steel (410x410mm each)',
  bed_heater_power_w = 1200,
  frame_material = 'Heavy-duty CNC Aluminum Extrusion with Linear Rails',
  
  -- METADATA
  extruder_notes = 'Supports 1-4 independent print heads for simultaneous multi-part printing. Each head has dual-gear direct drive extruder with 5.2:1 ratio. 60W ceramic heater with titanium heat break. Default 0.6mm brass nozzle (0.4/0.8mm optional).',
  marketing_tags = 'Industrial, Ultra-Large Format, 800x800x1000mm, Klipper, Input Shaper, Pressure Advance, Multi-Head Printing, 4-Zone Heated Bed, Linear Rails, CoreXY, 300mm/s Speed, Direct Drive, 300°C Nozzle, 7" Touchscreen, WiFi, LAN, Filament Sensor',
  materials_notes = '4 independently heated bed zones (410x410mm each) allow energy-efficient printing of smaller parts. High-temp hotend (300°C) with titanium heat break supports engineering materials.',
  
  -- VERIFICATION
  last_verified_utc = NOW(),
  updated_at = NOW()

WHERE id = '99481025-5386-43fa-8a05-44ac79f6a3f6';
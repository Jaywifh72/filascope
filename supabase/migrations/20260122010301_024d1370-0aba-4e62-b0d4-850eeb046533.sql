-- FLSUN Super Racer (SR): Complete data enrichment
UPDATE printers 
SET 
  -- TEMPERATURE
  bed_max_temp_c = 100,
  
  -- PERFORMANCE
  max_acceleration_xy_mmss = 2800,
  max_travel_speed_xy_mms = 200,
  max_flow_rate_mm3s = 24,
  
  -- PHYSICAL DIMENSIONS (440x390x960mm, 14.5kg)
  machine_width_mm = 440,
  machine_depth_mm = 390,
  machine_height_mm = 960,
  machine_weight_kg = 14.5,
  package_weight_kg = 16.5,
  
  -- LAYER HEIGHT (micrometers)
  layer_height_min_um = 50,
  layer_height_max_um = 400,
  layer_height_default_um = 200,
  
  -- POSITIONING ACCURACY (micrometers)
  xy_positioning_accuracy_um = 12,
  z_positioning_accuracy_um = 4,
  
  -- EXTRUDER & HOTEND
  extruder_type = 'BMG-style Dual-Gear Direct Drive (3:1 ratio)',
  hotend_brand_model = 'Volcano-style High-Flow Hotend (V6 Clone)',
  stock_nozzle_diameter_mm = 0.4,
  nozzle_material = 'Brass',
  quick_release_hotend = false,
  
  -- SCREEN
  screen_type = '3.5-inch Capacitive Color Touchscreen (Removable)',
  screen_size_inch = 3.5,
  
  -- CONNECTIVITY
  has_sd_card = true,
  has_usb_a_port = true,
  has_micro_sd_card = false,
  
  -- POWER
  rated_power_w = 360,
  power_input_voltage = '115/230V AC, 50/60Hz',
  power_loss_recovery = true,
  
  -- BED & LEVELING
  auto_bed_leveling_method = 'Detachable Magnetic Sensor',
  default_plate_type = 'Textured Carborundum Glass',
  bed_type = 'Carborundum Glass Plate (Removable)',
  
  -- MATERIALS
  official_supported_materials = 'PLA, PLA+, ABS, PETG, TPU, Wood-fill, Carbon-fill',
  recommended_materials = 'PLA, PLA+, PETG',
  abrasive_materials_supported = false,
  materials_notes = 'PTFE-lined hotend limits max temperature to 260°C. For higher temps or abrasive materials, upgrade to all-metal heat break. Volcano-style high-flow nozzle enables fast printing. BMG dual-gear extruder handles flexible TPU well.',
  
  -- SAFETY
  thermal_runaway_protection = true,
  
  -- FIRMWARE
  firmware_family = 'Marlin',
  firmware_open_source = true,
  
  -- METADATA
  motion_system_notes = 'Delta kinematics with 3 vertical towers using linear guide rails and 10mm high-torque belts. 32-bit motherboard (MKS Robin Nano V3) with TMC2209 silent stepper drivers. Popular Klipper upgrade path enables 300+ mm/s speeds.',
  extruder_notes = 'BMG-style dual-gear direct drive with 3:1 gear ratio for high torque. Volcano-style high-flow hotend with PTFE-lined heat break. Good TPU handling due to short filament path.',
  marketing_tags = 'Delta, High-Speed, 200mm/s, Budget, Linear Rails, TMC2209, Silent, Tall Build Volume, Removable Touchscreen, Volcano Hotend, BMG Clone, Klipper-Ready, Fast Heating, Carborundum Glass',
  
  -- VERIFICATION
  last_verified_utc = NOW(),
  updated_at = NOW()

WHERE id = '86a0dbd8-aa41-45d5-986b-03fea30d7d2c';
-- Sovol SV07: Complete data correction and enrichment (fixing corrupted fields)
UPDATE printers 
SET 
  -- BUILD VOLUME CORRECTIONS (220x220x250mm)
  build_volume_x_mm = 220,
  build_volume_y_mm = 220,
  build_volume_z_mm = 250,
  build_volume_shape = 'Rectangular',
  
  -- BED CONFIGURATION (235x235mm heated)
  bed_heated = true,
  bed_size_x_mm = 235,
  bed_size_y_mm = 235,
  bed_max_temp_c = 100,
  bed_type = 'Textured PEI Spring Steel',
  default_plate_type = 'Textured PEI Spring Steel',
  
  -- PERFORMANCE (High-speed Klipper!)
  max_nozzle_temp_c = 300,
  max_print_speed_mms = 500,
  max_acceleration_xy_mmss = 8000,
  max_acceleration_z_mmss = 500,
  max_travel_speed_xy_mms = 500,
  max_flow_rate_mm3s = 25,
  
  -- EXTRUDER (GARBAGE CLEANUP)
  extruder_count = 1,
  extruder_drive_type = 'Direct',
  extruder_type = 'Sovol Planetary Dual-Gear Direct Drive',
  hotend_brand_model = 'Sovol All-Metal High-Flow Hotend (Creality K1-style nozzle)',
  stock_nozzle_diameter_mm = 0.4,
  nozzle_material = 'Brass',
  filament_diameter_mm = 1.75,
  extruder_notes = 'Sovol self-developed planetary dual-gear direct drive extruder. All-metal construction with high-flow hotend. Uses Creality K1-style nozzle compatibility. Short filament path ideal for TPU and flexible materials.',
  
  -- MOTION SYSTEM (Linear Rails on all axes!)
  linear_rails_on_axes = 'X, Y, Z',
  motion_system_notes = 'Cartesian bed-slinger with linear guide rails on X/Y/Z axes for high-speed precision. Dual Z-axis with independent stepper motors. 5-inch integrated KlipperScreen pad with Fluidd interface. Includes ADXL345 accelerometer for input shaping calibration. Large curtain fan on X-gantry for high-speed cooling.',
  
  -- GARBAGE FIELD CLEANUP
  enclosure_type = NULL,
  enclosure_max_temp_c = NULL,
  filter_type = NULL,
  amazon_url_uk = NULL,
  other_retailer_urls = NULL,
  common_failure_points = NULL,
  compatible_multi_material_systems = NULL,
  multi_material_limitations_notes = NULL,
  recommended_upgrades = NULL,
  rating_value_for_money = NULL,
  
  -- PHYSICAL DIMENSIONS (460x457x625mm, 9.7kg)
  machine_width_mm = 460,
  machine_depth_mm = 457,
  machine_height_mm = 625,
  machine_weight_kg = 9.7,
  machine_style = 'Cartesian',
  frame_material = 'Aluminum Extrusion',
  
  -- CONNECTIVITY (Major corrections!)
  has_wifi = true,
  has_ethernet = true,
  has_usb_c_port = true,
  has_usb_a_port = true,
  has_sd_card = true,
  has_micro_sd_card = false,
  has_bluetooth = false,
  cloud_platforms = 'Fluidd, Mainsail (via Klipper)',
  remote_monitoring_supported = true,
  
  -- SCREEN (5-inch KlipperScreen!)
  screen_type = '5-inch Color Touchscreen (KlipperScreen + Fluidd)',
  screen_size_inch = 5.0,
  
  -- LEVELING & FEATURES
  auto_bed_leveling = true,
  auto_bed_leveling_method = '25-Point Inductive Sensor Auto-Leveling',
  filament_runout_detection = true,
  power_loss_recovery = true,
  
  -- FIRMWARE FEATURES (Klipper!)
  firmware_family = 'Klipper',
  firmware_open_source = true,
  input_shaping_supported = true,
  pressure_advance_supported = true,
  
  -- LAYER HEIGHT (micrometers)
  layer_height_min_um = 50,
  layer_height_max_um = 400,
  layer_height_default_um = 200,
  
  -- POWER (350W MeanWell)
  rated_power_w = 350,
  power_input_voltage = '115/230V AC, 50/60Hz',
  power_supply_type = 'MeanWell 24V/350W',
  
  -- MATERIALS
  official_supported_materials = 'PLA, PETG, TPU, ABS, ASA, PC, Nylon, Carbon Fiber (hardened nozzle)',
  recommended_materials = 'PLA, PETG',
  abrasive_materials_supported = true,
  materials_notes = 'All-metal hotend supports high-temp materials up to 300C. Planetary dual-gear extruder handles TPU well. K1-style nozzle compatible. For abrasive filaments, upgrade to hardened steel nozzle.',
  
  -- ENCLOSURE (None)
  has_enclosure = false,
  enclosure_heated = false,
  
  -- METADATA
  marketing_tags = 'Klipper, High-Speed, 500mm/s, 8000mm/s², Linear Rails, KlipperScreen, 5-inch Display, Fluidd, Direct Drive, All-Metal Hotend, 300C, Auto-Leveling, WiFi, Ethernet, Open-Source, Input Shaping, Accelerometer Included',
  
  -- VERIFICATION
  last_verified_utc = NOW(),
  updated_at = NOW()

WHERE id = '139e43df-c8c7-4b50-8e74-fcc0980a528f';
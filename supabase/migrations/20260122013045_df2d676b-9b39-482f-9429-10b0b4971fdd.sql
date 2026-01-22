-- Sovol SV07 Plus: Comprehensive data correction (fixing ~79 corrupted/missing fields)
UPDATE printers 
SET 
  -- BUILD VOLUME CORRECTIONS (300x300x350mm)
  build_volume_x_mm = 300,
  build_volume_y_mm = 300,
  build_volume_z_mm = 350,
  build_volume_shape = 'Rectangular',
  
  -- BED CONFIGURATION (310x310mm, 420W heated)
  bed_heated = true,
  bed_size_x_mm = 310,
  bed_size_y_mm = 310,
  bed_max_temp_c = 100,
  bed_heater_power_w = 420,
  bed_type = 'Textured PEI Spring Steel',
  default_plate_type = 'Textured PEI Spring Steel',
  
  -- PERFORMANCE (Klipper High-Speed)
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
  hotend_brand_model = 'Sovol All-Metal High-Flow Hotend (K1-style nozzle)',
  stock_nozzle_diameter_mm = 0.4,
  nozzle_material = 'Brass',
  filament_diameter_mm = 1.75,
  extruder_notes = 'Sovol self-developed planetary dual-gear direct drive extruder. All-metal construction with high gear ratio for increased torque. All-metal high-flow hotend with extended melt zone for high-speed printing. Uses Creality K1-style nozzle compatibility.',
  
  -- MOTION SYSTEM (POM V-wheels, NOT linear rails)
  linear_rails_on_axes = NULL,
  machine_style = 'Cartesian',
  frame_material = 'Aluminum Extrusion',
  motion_system_notes = 'Cartesian bed-slinger with POM V-guide rails on X/Y axes (not linear rails). Dual Z-axis lead screws with independent stepper motors for G34 Auto Z Align. 5-inch KlipperScreen touchscreen with Fluidd interface. Triple-fan cooling system with large curtain fan for high-speed printing. Includes ADXL345 accelerometer for input shaping calibration. 600W MeanWell PSU supports faster bed heating for larger build volume.',
  
  -- GARBAGE FIELD CLEANUP
  enclosure_type = NULL,
  enclosure_max_temp_c = NULL,
  filter_type = NULL,
  common_failure_points = NULL,
  compatible_multi_material_systems = NULL,
  multi_material_limitations_notes = NULL,
  multi_material_drying_capability = false,
  amazon_url_uk = NULL,
  other_retailer_urls = NULL,
  recommended_upgrades = NULL,
  msrp_eur = NULL,
  rating_community_overall = NULL,
  
  -- PHYSICAL DIMENSIONS (632x532x735mm, 14kg)
  machine_width_mm = 632,
  machine_depth_mm = 532,
  machine_height_mm = 735,
  machine_weight_kg = 14,
  
  -- CONNECTIVITY (Major corrections!)
  has_wifi = true,
  has_ethernet = true,
  has_usb_a_port = true,
  has_usb_c_port = true,
  has_sd_card = true,
  has_micro_sd_card = false,
  has_bluetooth = false,
  cloud_platforms = 'Fluidd, Mainsail (via Klipper)',
  remote_monitoring_supported = true,
  
  -- SCREEN (5-inch KlipperScreen)
  screen_type = '5-inch Color Touchscreen (KlipperScreen + Fluidd)',
  screen_size_inch = 5.0,
  
  -- LEVELING & FEATURES
  auto_bed_leveling = true,
  auto_bed_leveling_method = '25-Point Inductive Sensor with G34 Auto Z Align',
  filament_runout_detection = true,
  power_loss_recovery = true,
  thermal_runaway_protection = true,
  door_sensor = false,
  
  -- FIRMWARE FEATURES (Klipper!)
  firmware_family = 'Klipper',
  firmware_open_source = true,
  input_shaping_supported = true,
  pressure_advance_supported = true,
  
  -- LAYER HEIGHT (micrometers)
  layer_height_min_um = 50,
  layer_height_max_um = 400,
  layer_height_default_um = 200,
  
  -- POWER (600W MeanWell)
  rated_power_w = 600,
  power_input_voltage = '115/230V AC, 50/60Hz',
  power_supply_type = 'MeanWell 24V/600W',
  
  -- MATERIALS
  official_supported_materials = 'PLA, PETG, TPU, ABS, ASA, PC, Nylon, Carbon Fiber (hardened nozzle)',
  recommended_materials = 'PLA, PETG',
  abrasive_materials_supported = true,
  materials_notes = 'All-metal hotend supports high-temp materials up to 300C. Planetary dual-gear extruder handles TPU well. K1-style nozzle compatible. For abrasive filaments, upgrade to hardened steel nozzle. 420W heated bed with 600W MeanWell PSU enables fast heating for ABS/ASA.',
  
  -- ENCLOSURE (None)
  has_enclosure = false,
  enclosure_heated = false,
  
  -- METADATA
  marketing_tags = 'Large-Format, 300x300x350, Klipper, High-Speed, 500mm/s, 8000mm/s², KlipperScreen, 5-inch Display, Fluidd, Direct Drive, All-Metal Hotend, 300C, Auto-Leveling, WiFi, Ethernet, G34 Auto Z Align, Open-Source, Input Shaping, Accelerometer Included, 600W MeanWell, Budget Large Printer',
  
  -- VERIFICATION
  last_verified_utc = NOW(),
  updated_at = NOW()

WHERE id = '760a73f0-430c-47c8-aeea-153e552fd275';
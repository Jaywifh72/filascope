-- Fix Creality Sermoon D3: Complete data correction and enrichment
UPDATE printers 
SET 
  -- CRITICAL FIRMWARE CORRECTION (was "UltiMaker Firmware"!)
  firmware_family = 'Creality Firmware',
  
  -- PHYSICAL DIMENSIONS (Official: 553×578×656mm, 45kg)
  machine_width_mm = 553,
  machine_depth_mm = 578,
  machine_height_mm = 656,
  machine_weight_kg = 45,
  machine_style = 'CoreXY',
  build_volume_shape = 'Rectangular',
  
  -- TEMPERATURE CORRECTIONS
  bed_max_temp_c = 110,
  
  -- PERFORMANCE CORRECTIONS
  max_print_speed_mms = 250,
  max_acceleration_xy_mmss = 5000,
  rated_power_w = 500,
  
  -- ENCLOSURE CORRECTION (D3 is NOT actively heated)
  enclosure_heated = false,
  enclosure_type = 'Fully Enclosed',
  
  -- LAYER HEIGHT (micrometers)
  layer_height_min_um = 100,
  layer_height_max_um = 400,
  layer_height_default_um = 200,
  
  -- POSITIONING ACCURACY
  repeatability_um = 100,
  xy_positioning_accuracy_um = 100,
  
  -- CAMERA & MONITORING (Built-in 1080p camera)
  camera_type = 'Built-in 1080p Live Camera',
  camera_count = 1,
  camera_resolution = '1080p',
  remote_monitoring_supported = true,
  remote_control_supported = true,
  timelapse_supported = true,
  
  -- AIR QUALITY (HEPA filter)
  filter_type = 'HEPA Air Filtration System',
  internal_lighting = true,
  
  -- SAFETY SENSORS
  door_sensor = true,
  thermal_runaway_protection = true,
  
  -- EXTRUDER DETAILS
  extruder_count = 1,
  extruder_drive_type = 'Direct',
  extruder_type = 'Sprite Dual-Gear Direct Drive',
  hotend_brand_model = 'Creality Sprite All-Metal Hotend',
  
  -- CONNECTIVITY
  has_usb_a_port = true,
  cloud_platforms = 'Creality Cloud',
  
  -- BED DETAILS
  auto_bed_leveling_method = 'CR-Touch',
  default_plate_type = 'PEI Spring Steel',
  
  -- POWER
  power_input_voltage = '100-240V AC, 50-60Hz',
  
  -- MATERIALS
  official_supported_materials = 'PLA, ABS, PETG, ASA, PET, TPU 95A, PA, PC, PC-ABS, PLA-CF, PA-CF, PET-CF',
  recommended_materials = 'PLA, ABS, PETG, ASA',
  abrasive_materials_supported = true,
  materials_notes = 'Industrial-grade enclosed printer supporting engineering and composite materials. All-metal hotend rated to 300°C for high-temp filaments. Carbon fiber composites supported. HEPA filtration for ABS/ASA fume extraction.',
  
  -- SCREEN
  screen_type = '4.3-inch TFT Color Touchscreen',
  
  -- METADATA
  marketing_tags = 'Industrial, Enclosed, HEPA Filter, 1080p Camera, Creality Cloud, Direct Drive, All-Metal Hotend, 300C, WiFi, Ethernet, Remote Monitoring, Carbon Fiber Ready, Professional',
  motion_system_notes = 'CNC-machined integrated XY gantry with 0.01mm precision. 60HRC stainless steel linear shafts with 1/256 microstepping stepper drivers for smooth high-speed printing. Up to 5x standard speed with ABS.',
  extruder_notes = 'Sprite dual-gear all-metal direct drive extruder. High torque for flexible and composite filaments. 300°C max temperature for engineering materials.',
  official_product_url = 'https://www.creality.com/products/sermoon-d3-3d-printer',
  
  -- VERIFICATION
  last_verified_utc = NOW(),
  updated_at = NOW()

WHERE id = 'ebaad9c6-2667-43c1-8640-481bfd6d0ef1';
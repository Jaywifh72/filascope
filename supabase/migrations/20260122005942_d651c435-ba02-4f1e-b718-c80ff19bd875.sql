-- Fix Creality Sermoon D3 Pro: Complete data correction and enrichment
UPDATE printers 
SET 
  -- BUILD VOLUME CORRECTIONS
  build_volume_x_mm = 290,
  build_volume_y_mm = 220,
  
  -- PHYSICAL DIMENSIONS (Official: 553x578x656mm, 43kg)
  machine_width_mm = 553,
  machine_depth_mm = 578,
  machine_weight_kg = 43,
  
  -- PERFORMANCE CORRECTIONS
  bed_max_temp_c = 120,
  max_print_speed_mms = 300,
  max_acceleration_xy_mmss = 5000,
  rated_power_w = 1300,
  
  -- DUAL EXTRUSION (Critical!)
  extruder_count = 2,
  multi_material_supported = true,
  multi_material_max_spools = 2,
  
  -- HEATED CHAMBER (Active 60C!)
  enclosure_max_temp_c = 60,
  enclosure_type = 'Fully Enclosed with Active Heating',
  
  -- LAYER HEIGHT (micrometers)
  layer_height_min_um = 100,
  layer_height_max_um = 350,
  layer_height_default_um = 200,
  
  -- POSITIONING ACCURACY
  repeatability_um = 100,
  xy_positioning_accuracy_um = 100,
  
  -- CAMERA & MONITORING
  camera_type = 'Built-in 1080p HD Camera',
  camera_count = 1,
  camera_resolution = '1080p',
  remote_monitoring_supported = true,
  remote_control_supported = true,
  timelapse_supported = true,
  
  -- AIR QUALITY
  filter_type = 'Built-in HEPA Air Purifier',
  internal_lighting = true,
  
  -- SAFETY SENSORS
  door_sensor = true,
  thermal_runaway_protection = true,
  
  -- EXTRUDER DETAILS
  extruder_type = 'Direct Drive All-Metal Dual-Gear Extruder (Dual Independent Nozzles)',
  hotend_brand_model = 'Creality All-Metal Dual-Gear Hotend',
  quick_release_hotend = false,
  
  -- BED DETAILS
  auto_bed_leveling_method = 'Strain Sensor Auto-Leveling (No Z-offset required)',
  default_plate_type = 'Flexible PEI Spring Steel',
  bed_type = 'Flexible PEI Spring Steel',
  
  -- CONNECTIVITY
  has_usb_a_port = true,
  cloud_platforms = 'Creality Cloud',
  
  -- POWER
  power_input_voltage = '100-240V AC, 50/60Hz',
  
  -- MATERIALS (Dual Extrusion + Soluble Support)
  official_supported_materials = 'PLA, PETG, PET, TPU, PVA, BVOH, HIPS, PA, ABS, ASA, PC, PC-ABS, PLA-CF, PA-CF, PET-CF, Metal-filled',
  recommended_materials = 'PLA, PETG, ABS, ASA, TPU',
  abrasive_materials_supported = true,
  materials_notes = 'Dual independent nozzle system with auto XYZ offset and single-side nozzle lifting. Supports soluble support materials (PVA, BVOH) for complex geometries. Active 60C heated chamber for engineering materials. Hardened steel nozzles for carbon fiber composites.',
  
  -- SCREEN
  screen_type = '4.3-inch Color Touchscreen',
  
  -- METADATA
  marketing_tags = 'Industrial, Dual Extrusion, Soluble Support, PVA, BVOH, Heated Chamber, 60C Active Heating, HEPA Filter, 1080p Camera, Creality Cloud, Direct Drive, All-Metal, 300mm/s, WiFi, Ethernet, Remote Monitoring, Carbon Fiber Ready, Professional, Auto XYZ Offset',
  motion_system_notes = 'Cartesian gantry with high-torque motors and stainless steel linear shafts rated for 8,000 hours continuous operation. 32-bit silent mainboard. Up to 300mm/s print speed and 5,000mm/s² acceleration.',
  extruder_notes = 'Independent dual-nozzle direct drive system with auto XYZ offset calibration and single-side nozzle lifting for clean material transitions. All-metal dual-gear design supports flexible and abrasive filaments. Hardened steel 0.4mm nozzles included.',
  
  -- VERIFICATION
  last_verified_utc = NOW(),
  updated_at = NOW()

WHERE id = '8b32f1e1-a04b-4c4c-a8df-6b4d2ad37a1f';
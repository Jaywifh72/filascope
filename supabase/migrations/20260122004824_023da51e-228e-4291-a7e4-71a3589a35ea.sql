-- Fix "Secure" → S6 Secure: Complete data correction and enrichment
UPDATE printers 
SET 
  -- MODEL IDENTITY
  model_name = 'S6 Secure',
  
  -- SECURITY (AIR-GAPPED) - Critical fixes
  has_wifi = false,
  has_ethernet = false,
  remote_monitoring_supported = false,
  remote_control_supported = false,
  camera_type = NULL,
  camera_count = 0,
  camera_resolution = NULL,
  
  -- PERFORMANCE (CHEETAH MOTION PLANNER)
  max_print_speed_mms = 500,
  max_travel_speed_xy_mms = 500,
  max_acceleration_xy_mmss = 50000,
  max_flow_rate_mm3s = 35,
  
  -- TEMPERATURES
  max_nozzle_temp_c = 340,
  bed_max_temp_c = 120,
  
  -- EXTRUDER CORRECTIONS
  extruder_count = 2,
  extruder_drive_type = 'Bowden',
  extruder_type = 'Dual Gripper Feeder with Tension Adjustment',
  
  -- PHYSICAL DIMENSIONS (S6 Secure specs)
  machine_width_mm = 495,
  machine_depth_mm = 585,
  machine_height_mm = 780,
  machine_weight_kg = 22,
  machine_style = 'Cartesian',
  build_volume_shape = 'Rectangular',
  
  -- LAYER HEIGHT (micrometers)
  layer_height_min_um = 60,
  layer_height_max_um = 300,
  layer_height_default_um = 150,
  
  -- POSITIONING ACCURACY (micrometers)
  xy_positioning_accuracy_um = 6.9,
  z_positioning_accuracy_um = 2.5,
  repeatability_um = 150,
  
  -- SCREEN & INTERFACE
  screen_type = '4.7-inch Color Touchscreen',
  screen_size_inch = 4.7,
  
  -- GARBAGE DATA CLEANUP
  auto_bed_leveling = true,
  auto_bed_leveling_method = 'Advanced Active Leveling with Inductive Sensors',
  noise_level_printing_db = 50,
  rated_power_w = 500,
  quick_release_hotend = true,
  package_height_mm = NULL,
  
  -- HOTEND SYSTEM
  hotend_brand_model = 'Ultimaker Print Core (Quick-Swap System)',
  nozzle_material = 'Brass (AA+ cores) / Hardened Steel (CC+ cores)',
  stock_nozzle_diameter_mm = 0.4,
  
  -- BED & LEVELING
  bed_type = 'PEI-coated Flexible Steel Plate',
  
  -- ENCLOSURE & AIR QUALITY
  enclosure_heated = false,
  enclosure_max_temp_c = 50,
  filter_type = 'Optional EPA Filter (Air Manager sold separately)',
  internal_lighting = true,
  
  -- MULTI-MATERIAL
  multi_material_max_spools = 2,
  
  -- CONNECTIVITY (USB ONLY)
  has_usb_a_port = true,
  has_usb_c_port = false,
  has_sd_card = false,
  
  -- POWER
  power_input_voltage = '100-240V AC, 50-60Hz',
  
  -- MATERIALS
  official_supported_materials = 'PLA, Tough PLA, PETG, ABS, CPE, CPE+, Nylon, TPU 95A, PC, PP, PVA, Breakaway, PET-CF, Nylon CF, 280+ materials',
  recommended_materials = 'PLA, Tough PLA, PETG, ABS, Nylon',
  materials_notes = 'NFC material recognition for automatic print profile loading. Air-gapped operation means profiles must be transferred via USB - no cloud downloads. Uses 2.85mm filament. CC+ cores support carbon fiber composites. Camera removed for security compliance.',
  
  -- SECURITY-SPECIFIC METADATA
  safety_notes = 'TAA (Trade Agreements Act) compliant for U.S. government procurement. Available on GSA (General Services Administration) schedule. NATO-certified. Designed for classified environments, defense contractors, and organizations requiring air-gapped 3D printing. Camera removed for security. USB-only file transfer.',
  motion_system_notes = 'UltiMaker Cheetah motion planner with 3rd order continuous smooth motion and corner blending. Up to 500mm/s XY speed, 50,000mm/s² acceleration, 100,000,000mm/s³ jerk. AIR-GAPPED VARIANT: No WiFi or Ethernet connectivity - USB file transfer only for secure/classified environments.',
  extruder_notes = 'Dual gripper feeder inherited from Factor 4 with tension adjustment. Compatible print cores: AA+ 0.4 (included), CC+ 0.4 (included), BB 0.4, DD 0.4 (sold separately). 2.85mm filament ecosystem with NFC recognition (profiles must be loaded via USB on Secure variant).',
  marketing_tags = 'Professional, TAA Compliant, GSA Available, NATO-Certified, Air-Gapped, Secure, Government, Defense, ITAR, Dual Extrusion, Print Core System, Cheetah Motion Planner, 500mm/s, No Camera, USB-Only, Offline Operation, Enclosed, 340C Hotend, Composite-Ready, PEI Flex Plate',
  
  -- VERIFICATION
  last_verified_utc = NOW(),
  updated_at = NOW()

WHERE id = '40bd9952-e056-4e3f-be08-9157f4b881d6';
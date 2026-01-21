UPDATE printers 
SET 
  -- FIX CRITICAL ERRORS
  bed_max_temp_c = 110,
  msrp_usd = 499,
  package_width_mm = 540,
  package_height_mm = 290,
  has_wifi = true,
  
  -- MACHINE DIMENSIONS
  machine_width_mm = 453,
  machine_depth_mm = 505,
  machine_height_mm = 483,
  machine_weight_kg = 9.2,
  
  -- PERFORMANCE
  max_acceleration_xy_mmss = 20000,
  recommended_quality_speed_mms = 300,
  input_shaping_supported = true,
  
  -- DISPLAY & ELECTRONICS
  onboard_storage_gb = 8,
  screen_size_inch = 4.3,
  screen_type = 'Capacitive Touch Screen',
  power_input_voltage = '110/220V AC, 50/60Hz',
  
  -- MULTI-MATERIAL (ACE Pro Included)
  multi_material_supported = true,
  native_multi_material_system = true,
  multi_material_max_spools = 4,
  compatible_multi_material_systems = 'ACE Pro, ACE Pro (x2 for 8 colors)',
  
  -- BUILD PLATFORM
  build_volume_shape = 'rectangular',
  bed_size_x_mm = 250,
  bed_size_y_mm = 250,
  bed_heated = true,
  default_plate_type = 'PEI Spring Steel',
  compatible_plate_types = 'PEI Spring Steel',
  
  -- HOTEND & NOZZLE
  hotend_brand_model = 'Anycubic Unicorn Quick-Release All-Metal',
  hotend_type = 'All-metal',
  nozzle_material = 'Brass',
  stock_nozzle_diameter_mm = 0.4,
  extruder_count = 1,
  extruder_drive_type = 'Direct Drive Double Gear',
  
  -- CONNECTIVITY
  cloud_platforms = 'Anycubic Cloud, Anycubic App',
  remote_control_supported = true,
  remote_monitoring_supported = true,
  
  -- AUTO LEVELING
  auto_bed_leveling_method = 'LeviQ 3.0 Auto-leveling with Auto Z-Offset',
  
  -- SAFETY
  power_loss_recovery = true,
  
  -- URLs
  official_product_url = 'https://www.anycubic.com/products/kobra-3-combo',
  
  -- PACKAGING
  package_depth_mm = 490,
  package_weight_kg = 15,
  
  -- MATERIALS
  official_supported_materials = 'PLA, ABS, PETG, TPU, ASA, PA, PC',
  recommended_materials = 'PLA, PETG',
  
  -- MOTION SYSTEM
  motion_system_notes = 'X/Y double metal spindles with SG15 bearings, Dual Z-axis synchronized leadscrews, G-sensor for vibration compensation',
  
  -- ASSEMBLY
  assembly_required = true,
  average_assembly_time_min = 30,
  
  -- MARKETING
  marketing_tags = 'High-Speed, 600mm/s, LeviQ 3.0, ACE Pro Included, Multi-Material, 4-Color, WiFi, Klipper-Based, Direct Drive, All-Metal Hotend, Quick-Release Nozzle, Combo Bundle',
  
  -- VERIFICATION
  last_verified_utc = NOW()

WHERE id = '8f0a2338-f321-4f97-bb68-18208c3b4e26';
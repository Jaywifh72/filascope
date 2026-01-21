UPDATE printers 
SET 
  -- FIX CRITICAL ERRORS
  noise_level_printing_db = 48,
  machine_weight_kg = 25.7,
  bed_max_temp_c = 120,
  build_volume_x_mm = 350,
  build_volume_y_mm = 350,
  build_volume_z_mm = 350,
  package_width_mm = 583,
  package_height_mm = 693,
  package_depth_mm = 560,
  has_ethernet = true,
  
  -- FIX MACHINE DIMENSIONS
  machine_width_mm = 502.7,
  machine_depth_mm = 483,
  machine_height_mm = 584,
  
  -- ENCLOSURE HEATING
  enclosure_heated = true,
  enclosure_max_temp_c = 65,
  enclosure_type = 'Fully Enclosed Active Heating',
  
  -- MULTI-MATERIAL (ACE 2 Pro)
  multi_material_spool_chamber_max_temp_c = 65,
  multi_material_drying_capability = true,
  compatible_multi_material_systems = 'ACE 2 Pro, ACE 2 Pro (x4 for 16 colors)',
  multi_material_limitations_notes = 'Supports up to 4 ACE 2 Pro units for 16-color printing. Active drying while printing.',
  
  -- PERFORMANCE
  recommended_quality_speed_mms = 300,
  max_flow_rate_mm3s = 32,
  noise_level_idle_db = 45,
  machine_style = 'CoreXY',
  
  -- DISPLAY & ELECTRONICS
  screen_size_inch = 7,
  screen_type = 'Capacitive Touch Screen',
  power_input_voltage = '110V (1000W) / 220V (2200W)',
  onboard_storage_gb = 8,
  
  -- BUILD PLATFORM
  build_volume_shape = 'rectangular',
  bed_size_x_mm = 350,
  bed_size_y_mm = 350,
  default_plate_type = 'PEI Spring Steel',
  compatible_plate_types = 'PEI Spring Steel',
  
  -- HOTEND & NOZZLE
  hotend_brand_model = 'Anycubic Quick-Release All-Metal 350°C',
  nozzle_material = 'Hardened Steel',
  stock_nozzle_diameter_mm = 0.4,
  extruder_drive_type = 'Direct Drive Dual-Gear',
  
  -- CLOUD & CONNECTIVITY
  cloud_platforms = 'Anycubic Cloud, Anycubic App, Anycubic Slicer Next',
  
  -- MOTION SYSTEM
  frame_material = 'Aluminum Alloy',
  motion_system_notes = 'Fully enclosed CoreXY architecture, Dual Z-axis synchronized leadscrews, G-sensor vibration compensation, Belt tension monitoring',
  
  -- SAFETY
  filter_type = 'Activated Carbon',
  
  -- PACKAGING & ASSEMBLY
  package_weight_kg = 35,
  assembly_required = true,
  average_assembly_time_min = 30,
  
  -- MATERIALS
  recommended_materials = 'PLA, PETG, ABS, ASA, PA, PC',
  
  -- MARKETING & VERIFICATION
  marketing_tags = 'Large-Format, High-Speed, 600mm/s, CoreXY, Fully Enclosed, Active Chamber Heating 65°C, 350°C All-Metal Hotend, LeviQ 3.0, ACE 2 Pro Included, 4-Color, 88L Build Volume, AI Spaghetti Detection, Belt Tension Monitoring, Vibration Compensation, Quick-Release Hotend, Activated Carbon Filter, WiFi 6, Ethernet, Cloud Control, 7-inch Touchscreen',
  last_verified_utc = NOW()

WHERE id = 'f901fd5f-3ca3-47e8-81f9-4ec23b8ad42c';
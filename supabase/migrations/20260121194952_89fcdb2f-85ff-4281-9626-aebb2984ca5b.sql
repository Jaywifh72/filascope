UPDATE printers 
SET 
  -- FIX CRITICAL ERRORS
  extruder_count = 1,
  has_wifi = true,
  max_acceleration_xy_mmss = 20000,
  machine_width_mm = 453,
  machine_depth_mm = 505,
  machine_height_mm = 483,
  machine_weight_kg = 9.2,
  
  -- IMPROVE EXISTING DATA
  auto_bed_leveling_method = 'LeviQ 3.0 Auto-leveling with Auto Z-Offset',
  
  -- DISPLAY & ELECTRONICS
  onboard_storage_gb = 8,
  screen_size_inch = 4.3,
  screen_type = 'Capacitive Touch Screen',
  
  -- POWER
  power_input_voltage = '110/220V AC, 50/60Hz',
  
  -- BUILD PLATFORM
  build_volume_shape = 'rectangular',
  bed_size_x_mm = 250,
  bed_size_y_mm = 250,
  default_plate_type = 'PEI Spring Steel',
  compatible_plate_types = 'PEI Spring Steel',
  
  -- HOTEND & NOZZLE
  hotend_brand_model = 'Anycubic Unicorn Quick-Release All-Metal',
  nozzle_material = 'Brass',
  stock_nozzle_diameter_mm = 0.4,
  
  -- CONNECTIVITY
  cloud_platforms = 'Anycubic Cloud, Anycubic App',
  
  -- PERFORMANCE
  recommended_quality_speed_mms = 300,
  motion_system_notes = 'X/Y double metal spindles with SG15 bearings, Dual Z-axis synchronized leadscrews, G-sensor for vibration compensation',
  
  -- MATERIALS
  recommended_materials = 'PLA, PETG',
  
  -- PACKAGING
  package_weight_kg = 12,
  package_width_mm = 540,
  package_depth_mm = 490,
  package_height_mm = 290,
  
  -- ASSEMBLY
  assembly_required = true,
  average_assembly_time_min = 20,
  
  -- MARKETING
  marketing_tags = 'High-Speed, 600mm/s, LeviQ 3.0, ACE Pro Compatible, Multi-Material, WiFi, Klipper-Based, Direct Drive, All-Metal Hotend, Quick-Release Nozzle',
  
  -- VERIFICATION
  last_verified_utc = NOW()

WHERE id = 'ed049fad-a30b-4d31-9d0d-38350baf31dc';
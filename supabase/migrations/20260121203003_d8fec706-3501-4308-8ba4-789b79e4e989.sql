UPDATE printers 
SET 
  -- FIX CRITICAL ERRORS
  bed_max_temp_c = 120,
  has_enclosure = true,
  package_width_mm = 490,
  package_height_mm = 593,
  
  -- MACHINE DIMENSIONS
  machine_width_mm = 400,
  machine_depth_mm = 410,
  machine_height_mm = 490,
  machine_weight_kg = 18,
  
  -- CONNECTIVITY
  has_wifi = true,
  has_ethernet = true,
  has_usb_a_port = true,
  
  -- PERFORMANCE
  max_acceleration_xy_mmss = 20000,
  recommended_quality_speed_mms = 300,
  noise_level_printing_db = 46,
  input_shaping_supported = true,
  
  -- DISPLAY & ELECTRONICS
  screen_size_inch = 4.3,
  screen_type = 'Capacitive Touch Screen',
  power_input_voltage = '100-120V/200-240V AC, 50/60Hz',
  onboard_storage_gb = 8,
  
  -- MULTI-MATERIAL (ACE Pro Included)
  multi_material_supported = true,
  native_multi_material_system = true,
  multi_material_max_spools = 4,
  compatible_multi_material_systems = 'ACE Pro, ACE Pro (x2 for 8 colors)',
  multi_material_spool_chamber_max_temp_c = 55,
  
  -- BUILD PLATFORM
  build_volume_shape = 'rectangular',
  bed_size_x_mm = 250,
  bed_size_y_mm = 250,
  bed_heated = true,
  default_plate_type = 'PEI Spring Steel',
  compatible_plate_types = 'PEI Spring Steel',
  
  -- HOTEND & NOZZLE
  hotend_brand_model = 'Anycubic Quick-Release All-Metal 320°C',
  hotend_type = 'All-metal',
  nozzle_material = 'Hardened Steel',
  stock_nozzle_diameter_mm = 0.4,
  extruder_count = 1,
  extruder_drive_type = 'Direct Drive Dual-Gear',
  
  -- AUTO LEVELING & SAFETY
  auto_bed_leveling = true,
  auto_bed_leveling_method = 'LeviQ 3.0 Auto-leveling with Auto Z-Offset and Vibration Compensation',
  power_loss_recovery = true,
  filter_type = 'Activated Carbon',
  
  -- CLOUD & CONNECTIVITY
  cloud_platforms = 'Anycubic Cloud, Anycubic App',
  remote_control_supported = true,
  remote_monitoring_supported = true,
  
  -- MOTION SYSTEM
  machine_style = 'CoreXY',
  motion_system_notes = 'Fully enclosed CoreXY architecture, Dual Z-axis synchronized leadscrews, G-sensor for intelligent vibration compensation, Belt tension monitoring',
  
  -- MATERIALS
  official_supported_materials = 'PLA, PETG, TPU, ABS, ASA',
  recommended_materials = 'PLA, PETG, ABS, ASA',
  filament_diameter_mm = 1.75,
  
  -- PACKAGING
  package_depth_mm = 484,
  package_weight_kg = 25.9,
  assembly_required = true,
  
  -- MARKETING & VERIFICATION
  marketing_tags = 'High-Speed, 600mm/s, CoreXY, Fully Enclosed, 320°C All-Metal Hotend, LeviQ 3.0, ACE Pro Included, 4-Color, AI Spaghetti Detection, Belt Tension Monitoring, Vibration Compensation, Quick-Release Hotend, Activated Carbon Filter, WiFi, Cloud Control, 480p Camera, Quiet Operation',
  official_product_url = 'https://www.anycubic.com/products/kobra-s1-combo',
  last_verified_utc = NOW()

WHERE id = 'ba6f1a7c-4cdc-4944-b14f-64cce37759a7';
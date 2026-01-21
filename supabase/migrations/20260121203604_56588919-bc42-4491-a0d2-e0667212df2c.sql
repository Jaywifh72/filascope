UPDATE printers 
SET 
  -- FIX CRITICAL ERRORS
  max_acceleration_xy_mmss = 2500,
  package_width_mm = 560,
  package_height_mm = 570,
  package_depth_mm = 500,
  
  -- CONNECTIVITY
  has_bluetooth = true,
  has_usb_c_port = true,
  has_micro_sd_card = false,
  has_ethernet = false,
  
  -- DISPLAY & ELECTRONICS
  screen_size_inch = 4.3,
  screen_type = 'Touch Screen',
  rated_power_w = 350,
  power_input_voltage = 'AC 100-240V',
  onboard_storage_gb = 8,
  
  -- PERFORMANCE
  recommended_quality_speed_mms = 250,
  machine_style = 'Cartesian',
  motion_system_notes = 'Double-belt Y-axis driveshaft, Dual Z-axis leadscrews, PowerBoost™ stabilized-motion algorithm, 9.37:1 gear reduction extruder',
  
  -- HOTEND & EXTRUSION
  hotend_brand_model = 'AnkerMake Ultra Direct Extruder',
  stock_nozzle_diameter_mm = 0.4,
  filament_diameter_mm = 1.75,
  extruder_count = 1,
  extruder_drive_type = 'Direct Drive Dual-Gear',
  
  -- BUILD PLATFORM
  build_volume_shape = 'rectangular',
  bed_size_x_mm = 235,
  bed_size_y_mm = 235,
  bed_heated = true,
  default_plate_type = 'PEI Soft Magnetic Steel',
  compatible_plate_types = 'PEI Soft Magnetic Steel (Double-sided)',
  
  -- AUTO LEVELING
  auto_bed_leveling_method = '49-point (7×7) Auto-leveling',
  
  -- SAFETY & RECOVERY
  power_loss_recovery = true,
  
  -- CAMERA & MONITORING
  ai_spaghetti_detection = true,
  remote_control_supported = true,
  internal_lighting = true,
  
  -- CLOUD & VOICE
  cloud_platforms = 'AnkerMake App, AnkerMake Slicer, Google Assistant, Amazon Alexa',
  
  -- MATERIALS
  official_supported_materials = 'PLA, PETG, TPU, ABS',
  recommended_materials = 'PLA, PETG',
  
  -- PACKAGING
  package_weight_kg = 15.7,
  
  -- MARKETING & VERIFICATION
  marketing_tags = 'High-Speed, 500mm/s, PowerBoost, Ultra-Direct Extruder, AI Camera, 1080p Timelapse, 720p Monitoring, Night Vision, Voice Control, Google Assistant, Alexa, 49-Point Auto-Leveling, WiFi, App Control, Remote Printing',
  last_verified_utc = NOW()

WHERE id = '2ae75e33-9616-4397-9c86-9ae62f97d3fe';
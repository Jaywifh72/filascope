-- Sovol SV08: Comprehensive data correction (fixing ~86 corrupted/missing fields)
-- This is Sovol's flagship CoreXY Voron-style high-speed printer
UPDATE printers 
SET 
  -- BUILD VOLUME (350x350x345mm)
  build_volume_x_mm = 350,
  build_volume_y_mm = 350,
  build_volume_z_mm = 345,
  build_volume_shape = 'Rectangular',
  
  -- BED CONFIGURATION (AC heated, 100°C max)
  bed_heated = true,
  bed_size_x_mm = 355,
  bed_size_y_mm = 355,
  bed_max_temp_c = 100,
  bed_type = 'Powder-Coated PEI Spring Steel',
  default_plate_type = 'Powder-Coated PEI',
  
  -- PERFORMANCE (700mm/s, 40000mm/s² - one of the fastest!)
  max_print_speed_mms = 700,
  max_acceleration_xy_mmss = 40000,
  max_acceleration_z_mmss = 500,
  max_travel_speed_xy_mms = 700,
  max_flow_rate_mm3s = 30,
  max_nozzle_temp_c = 300,
  
  -- EXTRUDER & HOTEND (Cleanup garbage values)
  extruder_count = 1,
  extruder_drive_type = 'Direct',
  extruder_type = 'Planetary Dual-Gear Direct Drive (5.2:1 ratio)',
  hotend_brand_model = 'Sovol Ceramic Heater Block All-Metal Hotend',
  stock_nozzle_diameter_mm = 0.4,
  nozzle_material = 'Hardened Steel',
  filament_diameter_mm = 1.75,
  extruder_notes = 'Self-developed planetary dual-gear direct drive extruder with 5.2:1 gear ratio for high extrusion force. All-metal construction with ceramic heater block for rapid heating. Uses Bambu-style hardened steel nozzle system for easy swaps. High-flow design supports up to 30mm³/s.',
  
  -- MOTION SYSTEM (CoreXY with 7 Linear Rails!)
  machine_style = 'CoreXY',
  linear_rails_on_axes = 'X, 2Y, 4Z (7 total)',
  frame_material = 'Aluminum Extrusion (Voron-style)',
  motion_system_notes = 'CoreXY architecture based on Voron 2.4 design. 7 linear guide rails (4Z+2Y+1X) for exceptional rigidity. Quad Gantry Leveling (QGL) with 4 independent Z-motors for automatic gantry alignment. Dual B-motor setup for Y-axis. Hybrid cooling system with 5020 blower (10,000 RPM) and 3010 auxiliary fan (15,000 RPM) for 3-sided filament cooling. Built-in camera for monitoring and timelapses. H616 Quad-core ARM CPU with 1GB RAM and 8GB eMMC.',
  
  -- PHYSICAL DIMENSIONS (550x537x575mm, 17.7kg)
  machine_width_mm = 550,
  machine_depth_mm = 537,
  machine_height_mm = 575,
  machine_weight_kg = 17.7,
  
  -- CONNECTIVITY (Major corrections!)
  has_wifi = true,
  has_ethernet = true,
  has_usb_a_port = true,
  has_usb_c_port = true,
  has_sd_card = false,
  has_micro_sd_card = false,
  has_bluetooth = false,
  cloud_platforms = 'Mainsail, Fluidd (via Klipper)',
  remote_monitoring_supported = true,
  
  -- SCREEN & INTERFACE
  screen_type = 'LCD Display with Rotary Knob (upgradeable to 5-inch Touch)',
  screen_size_inch = NULL,
  control_knob = true,
  
  -- CAMERA (Built-in!)
  camera_type = 'Built-in Camera',
  camera_count = 1,
  
  -- LEVELING & AUTO FEATURES
  auto_bed_leveling = true,
  auto_bed_leveling_method = 'Inductive Sensor + Pressure Sensor (Auto Z-Offset) + Quad Gantry Leveling',
  filament_runout_detection = true,
  power_loss_recovery = true,
  thermal_runaway_protection = true,
  door_sensor = false,
  
  -- FIRMWARE (Vanilla Klipper!)
  firmware_family = 'Klipper',
  firmware_open_source = true,
  input_shaping_supported = true,
  pressure_advance_supported = true,
  
  -- LAYER HEIGHT (micrometers)
  layer_height_min_um = 50,
  layer_height_max_um = 400,
  layer_height_default_um = 200,
  
  -- POWER (1000W AC PSU)
  rated_power_w = 1000,
  power_input_voltage = '100-240V AC, 50/60Hz',
  power_supply_type = '1000W AC PSU',
  
  -- MATERIALS
  official_supported_materials = 'PLA, PETG, TPU, ABS, ASA, PC, PA, CF-reinforced (hardened nozzle included)',
  recommended_materials = 'PLA, PETG, ABS, ASA',
  abrasive_materials_supported = true,
  materials_notes = 'All-metal hotend with ceramic heater block supports temperatures up to 300°C. Ships with 0.4mm hardened steel Bambu-style nozzle. AC heated bed reaches 100°C quickly. Klipper firmware enables material-specific profiles.',
  
  -- ENCLOSURE (Open Frame)
  has_enclosure = false,
  enclosure_heated = false,
  enclosure_type = NULL,
  enclosure_max_temp_c = NULL,
  
  -- GARBAGE FIELD CLEANUP (Critical!)
  noise_level_idle_db = NULL,
  noise_level_printing_db = NULL,
  max_build_height_with_ams_mm = NULL,
  amazon_url_uk = NULL,
  other_retailer_urls = NULL,
  safety_certifications = NULL,
  multi_material_drying_capability = false,
  multi_material_limitations_notes = NULL,
  msrp_cad = NULL,
  review_count_aggregated = NULL,
  
  -- METADATA
  marketing_tags = 'CoreXY, Voron-Style, Open-Source, 700mm/s, 40000mm/s², Large-Format, 350x350x345, Klipper, Quad Gantry Leveling, Linear Rails, 7-Axis Rails, Camera, Timelapse, Input Shaping, Direct Drive, Ceramic Hotend, 300C, AC Heated Bed, 1000W PSU, Budget CoreXY',
  
  -- VERIFICATION
  last_verified_utc = NOW(),
  updated_at = NOW()

WHERE id = '8ce79bd1-f103-446a-850e-f38bf4aaa473';
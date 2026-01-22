-- Sovol SV06: Complete data correction and enrichment (fixing corrupted fields)
UPDATE printers 
SET 
  -- BUILD VOLUME CORRECTIONS (220x220x250mm)
  build_volume_x_mm = 220,
  build_volume_y_mm = 220,
  build_volume_z_mm = 250,
  build_volume_shape = 'Rectangular',
  
  -- BED CONFIGURATION (235x235mm heated)
  bed_heated = true,
  bed_size_x_mm = 235,
  bed_size_y_mm = 235,
  bed_max_temp_c = 100,
  bed_type = 'Flexible PEI Spring Steel',
  default_plate_type = 'Flexible PEI Spring Steel',
  
  -- TEMPERATURE & PERFORMANCE
  max_nozzle_temp_c = 300,
  max_print_speed_mms = 150,
  max_acceleration_xy_mmss = 2500,
  max_acceleration_z_mmss = 500,
  max_flow_rate_mm3s = 20,
  
  -- EXTRUDER (GARBAGE CLEANUP)
  extruder_count = 1,
  extruder_drive_type = 'Direct',
  extruder_type = 'Sovol Planetary Dual-Gear Direct Drive (All-Metal)',
  hotend_brand_model = 'Sovol All-Metal Hotend (V6-style)',
  stock_nozzle_diameter_mm = 0.4,
  nozzle_material = 'Brass',
  filament_diameter_mm = 1.75,
  
  -- GARBAGE FIELD CLEANUP
  cloud_platforms = NULL,
  enclosure_type = NULL,
  linear_rails_on_axes = NULL,
  other_retailer_urls = NULL,
  safety_certifications = NULL,
  
  -- PHYSICAL DIMENSIONS (497x388x610mm, 9kg)
  machine_width_mm = 497,
  machine_depth_mm = 388,
  machine_height_mm = 610,
  machine_weight_kg = 9,
  machine_style = 'Cartesian',
  frame_material = 'Aluminum Extrusion',
  
  -- LAYER HEIGHT (micrometers)
  layer_height_min_um = 50,
  layer_height_max_um = 400,
  layer_height_default_um = 200,
  
  -- CONNECTIVITY
  has_sd_card = true,
  has_micro_sd_card = true,
  has_usb_a_port = false,
  has_wifi = false,
  has_ethernet = false,
  has_bluetooth = false,
  
  -- LEVELING & FEATURES
  auto_bed_leveling = true,
  auto_bed_leveling_method = '25-Point Inductive Sensor Auto-Leveling',
  filament_runout_detection = true,
  power_loss_recovery = true,
  
  -- FIRMWARE
  firmware_family = 'Marlin',
  firmware_open_source = true,
  input_shaping_supported = true,
  pressure_advance_supported = true,
  
  -- SCREEN
  screen_type = '4.3-inch Color LCD Touchscreen',
  screen_size_inch = 4.3,
  
  -- POWER
  rated_power_w = 350,
  power_input_voltage = '115/230V AC, 50/60Hz',
  
  -- MATERIALS
  official_supported_materials = 'PLA, ABS, ASA, PETG, TPU, PC, Nylon, Carbon Fiber (hardened nozzle)',
  recommended_materials = 'PLA, PETG, TPU',
  abrasive_materials_supported = true,
  materials_notes = 'All-metal hotend supports high-temp materials up to 300°C. For abrasive filaments like Carbon Fiber, upgrade to hardened steel nozzle. Planetary dual-gear extruder provides excellent TPU handling.',
  
  -- METADATA
  motion_system_notes = 'Cartesian bed-slinger with dual Z-axis lead screws and independent stepper motors. 32-bit silent mainboard with TMC2209 drivers in UART mode. Sensorless X/Y homing via stall detection. Popular Klipper upgrade enables 500mm/s speeds.',
  extruder_notes = 'Sovol self-developed all-metal planetary dual-gear direct drive extruder. Higher gear ratio than standard BMG design provides increased torque for flexible and composite filaments. Short filament path ideal for TPU.',
  marketing_tags = 'Budget, Open-Source, Prusa Clone, All-Metal Hotend, 300C, Direct Drive, Planetary Extruder, TMC2209, Silent, Dual Z, Klipper-Ready, PEI Bed, Auto-Leveling, Beginner-Friendly',
  
  -- ENCLOSURE (None)
  has_enclosure = false,
  enclosure_heated = false,
  
  -- VERIFICATION
  last_verified_utc = NOW(),
  updated_at = NOW()

WHERE id = '37db0d4d-1979-4e8c-82ed-10d056f21814';
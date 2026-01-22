-- Sovol SV07 KLIPPER DIRECT DRIVE: Critical data correction (fixing garbage values and adding missing specs)
UPDATE printers 
SET 
  -- CRITICAL GARBAGE CLEANUP
  extruder_count = 1,
  has_enclosure = false,
  enclosure_heated = false,
  multi_material_supported = false,
  multi_material_max_spools = NULL,
  compatible_multi_material_systems = NULL,
  
  -- PERFORMANCE CORRECTIONS
  max_print_speed_mms = 500,
  max_acceleration_xy_mmss = 8000,
  max_acceleration_z_mmss = 500,
  max_flow_rate_mm3s = 25,
  
  -- BUILD VOLUME
  build_volume_shape = 'Rectangular',
  
  -- BED
  bed_size_x_mm = 235,
  bed_size_y_mm = 235,
  bed_type = 'Double-Sided Magnetic PEI Spring Steel',
  default_plate_type = 'Double-Sided Magnetic PEI',
  
  -- MOTION SYSTEM
  linear_rails_on_axes = 'X, Y, Z',
  machine_style = 'Cartesian',
  frame_material = 'Aluminum Extrusion',
  motion_system_notes = 'Cartesian bed-slinger with linear guide rails on X/Y/Z axes. Dual Z-axis with independent stepper motors. 5-inch KlipperScreen touchscreen with Fluidd interface. Triple-fan cooling system with large curtain fan for high-speed printing. Includes ADXL345 accelerometer for input shaping calibration.',
  
  -- GARBAGE CLEANUP
  auto_bed_leveling_method = '25-Point Inductive Sensor Auto-Leveling',
  package_width_mm = NULL,
  
  -- SCREEN
  screen_type = '5-inch HD Klipper Touchscreen (KlipperScreen)',
  
  -- EXTRUDER
  extruder_type = 'Sovol Planetary Dual-Gear Direct Drive',
  hotend_brand_model = 'Sovol All-Metal High-Flow Hotend',
  extruder_notes = 'Self-developed planetary gear direct drive extruder with all-metal construction. High gear ratio for increased torque. All-metal high-flow hotend for high-speed printing.',
  
  -- LAYER HEIGHT
  layer_height_min_um = 50,
  layer_height_max_um = 400,
  layer_height_default_um = 200,
  
  -- POWER
  power_input_voltage = '115/230V AC, 50/60Hz',
  power_supply_type = 'MeanWell 24V/350W',
  
  -- FIRMWARE
  firmware_open_source = true,
  
  -- CONNECTIVITY
  has_usb_a_port = true,
  has_usb_c_port = true,
  cloud_platforms = 'Fluidd, Mainsail (via Klipper)',
  remote_monitoring_supported = true,
  
  -- MATERIALS
  recommended_materials = 'PLA, PETG',
  abrasive_materials_supported = true,
  materials_notes = 'All-metal hotend supports temperatures up to 300°C for engineering materials. For abrasive filaments like carbon fiber, upgrade to hardened steel nozzle.',
  
  -- METADATA
  marketing_tags = 'Klipper, High-Speed, 500mm/s, 8000mm/s², Linear Rails, KlipperScreen, 5-inch Display, Fluidd, Direct Drive, All-Metal Hotend, 300C, Auto-Leveling, WiFi, Open-Source, Input Shaping, Budget High-Speed',
  
  -- VERIFICATION
  last_verified_utc = NOW(),
  updated_at = NOW()

WHERE id = '8f8c6a4b-555f-4c4a-99c2-a887d9d54dbd';
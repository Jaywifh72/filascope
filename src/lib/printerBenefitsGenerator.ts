// Generates compelling, user-focused benefits based on printer specs
// Format: "[Quantifiable claim] - [Real-world outcome]"

interface PrinterSpecs {
  max_print_speed_mms?: number | null;
  build_volume_x_mm?: number | null;
  build_volume_y_mm?: number | null;
  build_volume_z_mm?: number | null;
  multi_material_supported?: boolean | null;
  max_colors?: number | null;
  auto_bed_leveling?: boolean | null;
  has_enclosure?: boolean | null;
  max_nozzle_temp_c?: number | null;
  max_accel_mms2?: number | null;
  input_shaping_supported?: boolean | null;
  abrasive_materials_supported?: boolean | null;
  has_wifi?: boolean | null;
  has_camera?: boolean | null;
  filament_runout_sensor?: boolean | null;
  power_loss_recovery?: boolean | null;
  assembly_required?: boolean | null;
  average_assembly_time_min?: number | null;
  noise_level_db?: number | null;
}

export function generatePrinterBenefits(printer: PrinterSpecs): string[] {
  const benefits: string[] = [];

  // Speed benefit
  if (printer.max_print_speed_mms && printer.max_print_speed_mms >= 300) {
    if (printer.max_print_speed_mms >= 500) {
      benefits.push("3x faster than standard FDM - prints in hours, not days");
    } else {
      benefits.push("2x faster than standard FDM printers");
    }
  }

  // Build volume benefit
  if (printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm) {
    const volumeLiters = (printer.build_volume_x_mm * printer.build_volume_y_mm * printer.build_volume_z_mm) / 1000000;
    if (volumeLiters >= 30) {
      benefits.push(`${Math.round(volumeLiters)}L build volume - print full-size helmets`);
    } else if (volumeLiters >= 20) {
      benefits.push(`${Math.round(volumeLiters)}L build volume - large format capability`);
    } else if (volumeLiters >= 10) {
      benefits.push(`${Math.round(volumeLiters)}L build volume - room for big projects`);
    }
  }

  // Multi-material benefit
  if (printer.multi_material_supported) {
    if (printer.max_colors && printer.max_colors >= 4) {
      benefits.push(`${printer.max_colors}-color printing ready - no manual swaps`);
    } else {
      benefits.push("Multi-material printing - soluble supports & dual colors");
    }
  }

  // Ease of use benefit
  if (printer.auto_bed_leveling && printer.assembly_required === false) {
    benefits.push("Plug-and-play setup - printing in under 30 minutes");
  } else if (printer.auto_bed_leveling) {
    benefits.push("Auto bed leveling - perfect first layers every time");
  }

  // Enclosure benefit
  if (printer.has_enclosure) {
    benefits.push("Fully enclosed - safer home use & better prints");
  }

  // High-temp capability
  if (printer.max_nozzle_temp_c && printer.max_nozzle_temp_c >= 300) {
    if (printer.max_nozzle_temp_c >= 350) {
      benefits.push("350°C+ capable - prints PEEK, PEI, and PA-CF");
    } else {
      benefits.push("High-temp nozzle - prints engineering materials");
    }
  }

  // Input shaping / high acceleration
  if (printer.input_shaping_supported && printer.max_accel_mms2 && printer.max_accel_mms2 >= 10000) {
    benefits.push("Input shaping - ultra-fast with zero ringing");
  }

  // Abrasive materials
  if (printer.abrasive_materials_supported) {
    benefits.push("Abrasive-ready - prints carbon fiber & glass-filled");
  }

  // Smart features
  if (printer.has_wifi && printer.has_camera) {
    benefits.push("Remote monitoring - watch prints from your phone");
  } else if (printer.has_wifi) {
    benefits.push("WiFi connected - send prints wirelessly");
  }

  // Reliability features
  if (printer.filament_runout_sensor && printer.power_loss_recovery) {
    benefits.push("Never lose a print - power loss & runout recovery");
  }

  // Quiet operation
  if (printer.noise_level_db && printer.noise_level_db <= 50) {
    benefits.push(`Only ${printer.noise_level_db}dB - quiet enough for your office`);
  }

  // Return top 5 benefits (prioritized by order of generation)
  return benefits.slice(0, 5);
}

// Generate a short product description based on printer characteristics
export function generatePrinterDescription(printer: PrinterSpecs & { model_name?: string; brand?: string }): string {
  const attributes: string[] = [];

  // Size category
  if (printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm) {
    const volumeLiters = (printer.build_volume_x_mm * printer.build_volume_y_mm * printer.build_volume_z_mm) / 1000000;
    if (volumeLiters >= 25) {
      attributes.push("Large-Format");
    } else if (volumeLiters <= 5) {
      attributes.push("Compact");
    }
  }

  // Speed category
  if (printer.max_print_speed_mms && printer.max_print_speed_mms >= 300) {
    attributes.push("High-Speed");
  }

  // Material capability
  if (printer.multi_material_supported) {
    attributes.push("Multi-Material");
  } else if (printer.max_nozzle_temp_c && printer.max_nozzle_temp_c >= 300) {
    attributes.push("High-Temperature");
  }

  // Enclosure
  if (printer.has_enclosure) {
    attributes.push("Enclosed");
  }

  // Default attribute if none found
  if (attributes.length === 0) {
    attributes.push("Desktop");
  }

  return `${attributes.join(" ")} 3D Printer`;
}

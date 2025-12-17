// Utility to generate dynamic preview text for specs drawers

interface Printer {
  build_volume_x_mm?: number | null;
  build_volume_y_mm?: number | null;
  build_volume_z_mm?: number | null;
  has_enclosure?: boolean | null;
  enclosure_type?: string | null;
  max_print_speed_mms?: number | null;
  max_nozzle_temp_c?: number | null;
  bed_max_temp_c?: number | null;
  official_supported_materials?: string | null;
  multi_material_supported?: boolean | null;
  multi_material_max_spools?: number | null;
  auto_bed_leveling?: boolean | null;
  has_wifi?: boolean | null;
  has_ethernet?: boolean | null;
  screen_size_inch?: number | null;
  screen_type?: string | null;
  rated_power_w?: number | null;
  power_input_voltage?: string | null;
  power_loss_recovery?: boolean | null;
  frame_material?: string | null;
}

interface Accessory {
  accessory_type: string;
  id: string;
}

export const calculateVolumeLiters = (printer: Printer): string => {
  const x = printer.build_volume_x_mm || 0;
  const y = printer.build_volume_y_mm || 0;
  const z = printer.build_volume_z_mm || 0;
  const volumeMm3 = x * y * z;
  const volumeL = volumeMm3 / 1000000; // mm³ to liters
  return volumeL.toFixed(1);
};

export const generateBuildVolumePreview = (printer: Printer): string => {
  const parts: string[] = [];
  
  if (printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm) {
    parts.push(`${printer.build_volume_x_mm}×${printer.build_volume_y_mm}×${printer.build_volume_z_mm}mm`);
    parts.push(`${calculateVolumeLiters(printer)}L`);
  }
  
  if (printer.has_enclosure) {
    parts.push('Enclosed');
  } else {
    parts.push('Open frame');
  }
  
  return parts.join(' • ') || 'Build volume specifications';
};

export const generatePrintCapabilitiesPreview = (printer: Printer): string => {
  const parts: string[] = [];
  
  if (printer.max_print_speed_mms) {
    parts.push(`${printer.max_print_speed_mms}mm/s max`);
  }
  
  if (printer.max_nozzle_temp_c) {
    parts.push(`${printer.max_nozzle_temp_c}°C nozzle`);
  }
  
  if (printer.bed_max_temp_c) {
    parts.push(`${printer.bed_max_temp_c}°C bed`);
  }
  
  return parts.join(' • ') || 'Print speed and temperature specs';
};

export const generateMaterialsFeaturesPreview = (printer: Printer): string => {
  const parts: string[] = [];
  
  if (printer.official_supported_materials) {
    const materials = printer.official_supported_materials.split(',').map(m => m.trim());
    if (materials.length > 3) {
      parts.push(`${materials.length} materials`);
    } else {
      parts.push(materials.slice(0, 3).join(', '));
    }
  }
  
  if (printer.multi_material_supported && printer.multi_material_max_spools) {
    parts.push(`${printer.multi_material_max_spools}-color AMS`);
  }
  
  if (printer.auto_bed_leveling) {
    parts.push('Auto-leveling');
  }
  
  return parts.join(' • ') || 'Materials and feature support';
};

export const generateConnectivityPreview = (printer: Printer): string => {
  const parts: string[] = [];
  const connectivity: string[] = [];
  
  if (printer.has_wifi) connectivity.push('Wi-Fi');
  if (printer.has_ethernet) connectivity.push('Ethernet');
  
  if (connectivity.length > 0) {
    parts.push(connectivity.join(', '));
  }
  
  if (printer.screen_size_inch) {
    parts.push(`${printer.screen_size_inch}" ${printer.screen_type || 'display'}`);
  }
  
  return parts.join(' • ') || 'Connectivity and control options';
};

export const generatePowerConstructionPreview = (printer: Printer): string => {
  const parts: string[] = [];
  
  if (printer.rated_power_w) {
    parts.push(`${printer.rated_power_w}W`);
  }
  
  if (printer.frame_material) {
    parts.push(printer.frame_material);
  }
  
  if (printer.power_loss_recovery) {
    parts.push('Power loss recovery');
  }
  
  return parts.join(' • ') || 'Power and construction details';
};

export const generateAccessoriesPreview = (accessories: Accessory[]): string => {
  const hotends = accessories.filter(a => a.accessory_type === 'nozzle').length;
  const plates = accessories.filter(a => a.accessory_type === 'build_plate').length;
  const ams = accessories.filter(a => a.accessory_type === 'ams_mmu').length;
  
  const parts: string[] = [];
  
  if (hotends > 0) parts.push(`${hotends} hotends`);
  if (plates > 0) parts.push(`${plates} build plates`);
  if (ams > 0) parts.push(`${ams} AMS/MMU`);
  
  return parts.join(' • ') || 'Compatible accessories';
};

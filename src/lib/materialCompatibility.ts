export interface MaterialCompatibility {
  compatible: boolean;
  warning?: string;
}

const ENCLOSURE_MATERIALS = ['ABS', 'ASA', 'PC', 'Polycarbonate', 'Nylon', 'PA'];
const FLEXIBLE_MATERIALS = ['TPU', 'TPE', 'Flexible'];

export interface PrinterSpecsForMaterial {
  max_nozzle_temp_c?: number | null;
  has_enclosure?: boolean | null;
  extruder_type?: string | null;
}

const MATERIAL_MIN_TEMPS: Record<string, number> = {
  'PLA': 190, 'PETG': 220, 'ABS': 230, 'ASA': 230,
  'TPU': 220, 'TPE': 220, 'Nylon': 240, 'PA': 240,
  'PC': 260, 'Polycarbonate': 260, 'PVA': 190, 'HIPS': 230,
};

export function checkMaterialCompatibility(
  materialName: string,
  printer: PrinterSpecsForMaterial
): MaterialCompatibility {
  const upper = materialName.toUpperCase();

  const minTemp = MATERIAL_MIN_TEMPS[materialName];
  if (minTemp && printer.max_nozzle_temp_c && printer.max_nozzle_temp_c < minTemp) {
    return {
      compatible: false,
      warning: `${materialName} needs ${minTemp}°C+ nozzle, your printer maxes at ${printer.max_nozzle_temp_c}°C`,
    };
  }

  if (ENCLOSURE_MATERIALS.some(m => upper.includes(m.toUpperCase())) && printer.has_enclosure === false) {
    return {
      compatible: false,
      warning: `${materialName} typically requires an enclosed printer`,
    };
  }

  if (
    FLEXIBLE_MATERIALS.some(m => upper.includes(m.toUpperCase())) &&
    printer.extruder_type?.toLowerCase()?.includes('bowden')
  ) {
    return {
      compatible: true,
      warning: `${materialName} may be difficult with a bowden extruder`,
    };
  }

  return { compatible: true };
}

export type SlicerType = 'bambu' | 'prusaslicer' | 'orcaslicer' | 'cura' | 'simplify3d';

export interface SlicerInfo {
  id: SlicerType;
  name: string;
  extension: string;
  icon?: string;
}

export const SLICERS: Record<SlicerType, SlicerInfo> = {
  bambu: { id: 'bambu', name: 'Bambu Studio', extension: '.json' },
  prusaslicer: { id: 'prusaslicer', name: 'PrusaSlicer', extension: '.ini' },
  orcaslicer: { id: 'orcaslicer', name: 'OrcaSlicer', extension: '.json' },
  cura: { id: 'cura', name: 'UltiMaker Cura', extension: '.curaprofile' },
  simplify3d: { id: 'simplify3d', name: 'Simplify3D', extension: '.fff' },
};

export interface SlicerMapping {
  primary: SlicerType;
  alternatives: SlicerType[];
  reason: string;
}

export const PRINTER_SLICER_MAP: Record<string, SlicerMapping> = {
  'Bambu Lab': {
    primary: 'bambu',
    alternatives: ['orcaslicer'],
    reason: 'Bambu Studio is optimized for Bambu Lab printers with AMS support',
  },
  'Prusa Research': {
    primary: 'prusaslicer',
    alternatives: ['orcaslicer', 'cura'],
    reason: 'PrusaSlicer is developed by Prusa for their printers',
  },
  'Creality': {
    primary: 'cura',
    alternatives: ['orcaslicer', 'prusaslicer'],
    reason: 'Cura has extensive Creality printer profiles',
  },
  'QIDI Tech': {
    primary: 'orcaslicer',
    alternatives: ['cura', 'prusaslicer'],
    reason: 'OrcaSlicer has native QIDI support',
  },
  'Qidi': {
    primary: 'orcaslicer',
    alternatives: ['cura', 'prusaslicer'],
    reason: 'OrcaSlicer has native QIDI support',
  },
  'Anycubic': {
    primary: 'cura',
    alternatives: ['prusaslicer', 'orcaslicer'],
    reason: 'Cura supports most Anycubic printers',
  },
  'Elegoo': {
    primary: 'cura',
    alternatives: ['orcaslicer', 'prusaslicer'],
    reason: 'Cura has Elegoo printer profiles',
  },
  'Voron Design': {
    primary: 'orcaslicer',
    alternatives: ['prusaslicer', 'cura'],
    reason: 'OrcaSlicer has excellent Klipper/Voron integration',
  },
  'FlashForge': {
    primary: 'cura',
    alternatives: ['prusaslicer'],
    reason: 'Cura supports FlashForge printers',
  },
  'Sovol': {
    primary: 'cura',
    alternatives: ['orcaslicer', 'prusaslicer'],
    reason: 'Cura has Sovol printer profiles',
  },
  'FLSUN': {
    primary: 'cura',
    alternatives: ['orcaslicer', 'prusaslicer'],
    reason: 'Cura supports delta printers like FLSUN',
  },
  'Snapmaker': {
    primary: 'cura',
    alternatives: ['prusaslicer'],
    reason: 'Cura has Snapmaker profiles',
  },
  'Raise3D': {
    primary: 'cura',
    alternatives: ['simplify3d', 'prusaslicer'],
    reason: 'ideaMaker or Cura recommended for Raise3D',
  },
  'UltiMaker': {
    primary: 'cura',
    alternatives: [],
    reason: 'Cura is developed by UltiMaker',
  },
  'LDO Motors': {
    primary: 'orcaslicer',
    alternatives: ['prusaslicer'],
    reason: 'OrcaSlicer for Voron-based LDO kits',
  },
};

const DEFAULT_MAPPING: SlicerMapping = {
  primary: 'cura',
  alternatives: ['prusaslicer', 'orcaslicer'],
  reason: 'Cura has the widest printer compatibility',
};

export function getRecommendedSlicer(
  printerBrand?: string | null,
  userPreference?: SlicerType | null
): SlicerMapping & { isUserPreference: boolean } {
  // If user has a preference, use it but keep brand context
  if (userPreference && SLICERS[userPreference]) {
    const brandMapping = printerBrand ? PRINTER_SLICER_MAP[printerBrand] : null;
    return {
      primary: userPreference,
      alternatives: brandMapping?.alternatives.filter(s => s !== userPreference) || [],
      reason: `Your preferred slicer`,
      isUserPreference: true,
    };
  }

  // Use brand-based detection
  if (printerBrand && PRINTER_SLICER_MAP[printerBrand]) {
    return {
      ...PRINTER_SLICER_MAP[printerBrand],
      isUserPreference: false,
    };
  }

  return { ...DEFAULT_MAPPING, isUserPreference: false };
}

export function getAllSlicers(): SlicerInfo[] {
  return Object.values(SLICERS);
}

export interface ProfileData {
  // Temperature settings
  nozzle_temp: number;
  nozzle_temp_first_layer: number;
  bed_temp: number;
  bed_temp_first_layer: number;
  
  // Cooling settings
  fan_min_speed: number;
  fan_max_speed: number;
  disable_fan_first_layers: number;
  
  // Retraction settings
  retraction_length: number;
  retraction_speed: number;
  z_hop: number;
  
  // Speed settings
  print_speed: number;
  first_layer_speed: number;
  travel_speed: number;
  
  // Flow settings
  flow_ratio: number;
  
  // Material info
  material_name: string;
  material_type: string;
  vendor: string;
  
  // Filament settings
  filament_diameter: number;
  filament_density: number;
}

export function generateDefaultProfile(filament: {
  product_title: string;
  vendor?: string | null;
  material?: string | null;
  nozzle_temp_min_c?: number | null;
  nozzle_temp_max_c?: number | null;
  nozzle_temp_sweetspot_c?: number | null;
  bed_temp_min_c?: number | null;
  bed_temp_max_c?: number | null;
  fan_min_percent?: number | null;
  fan_max_percent?: number | null;
  diameter_nominal_mm?: number | null;
  density_g_cm3?: number | null;
  print_speed_max_mms?: number | null;
}): ProfileData {
  const nozzleTemp = filament.nozzle_temp_sweetspot_c || 
    (filament.nozzle_temp_min_c && filament.nozzle_temp_max_c 
      ? Math.round((filament.nozzle_temp_min_c + filament.nozzle_temp_max_c) / 2)
      : 200);
  
  const bedTemp = filament.bed_temp_min_c && filament.bed_temp_max_c
    ? Math.round((filament.bed_temp_min_c + filament.bed_temp_max_c) / 2)
    : 60;

  return {
    nozzle_temp: nozzleTemp,
    nozzle_temp_first_layer: nozzleTemp + 5,
    bed_temp: bedTemp,
    bed_temp_first_layer: bedTemp + 5,
    fan_min_speed: filament.fan_min_percent ?? 20,
    fan_max_speed: filament.fan_max_percent ?? 100,
    disable_fan_first_layers: 1,
    retraction_length: 0.8,
    retraction_speed: 35,
    z_hop: 0.2,
    print_speed: filament.print_speed_max_mms ? Math.min(filament.print_speed_max_mms, 80) : 50,
    first_layer_speed: 25,
    travel_speed: 150,
    flow_ratio: 1.0,
    material_name: filament.product_title,
    material_type: filament.material || 'PLA',
    vendor: filament.vendor || 'Unknown',
    filament_diameter: filament.diameter_nominal_mm || 1.75,
    filament_density: filament.density_g_cm3 || 1.24,
  };
}

export function getDefaultProfileForMaterial(material: string): Partial<ProfileData> {
  const defaults: Record<string, Partial<ProfileData>> = {
    PLA: { nozzle_temp: 210, bed_temp: 60, fan_max_speed: 100, retraction_length: 0.8 },
    'PLA+': { nozzle_temp: 215, bed_temp: 60, fan_max_speed: 100, retraction_length: 0.8 },
    PETG: { nozzle_temp: 240, bed_temp: 80, fan_max_speed: 50, retraction_length: 1.0 },
    ABS: { nozzle_temp: 250, bed_temp: 100, fan_max_speed: 0, retraction_length: 0.8 },
    ASA: { nozzle_temp: 250, bed_temp: 100, fan_max_speed: 0, retraction_length: 0.8 },
    TPU: { nozzle_temp: 230, bed_temp: 50, fan_max_speed: 50, retraction_length: 0.5, print_speed: 30 },
    Nylon: { nozzle_temp: 260, bed_temp: 80, fan_max_speed: 30, retraction_length: 1.2 },
    PC: { nozzle_temp: 280, bed_temp: 110, fan_max_speed: 30, retraction_length: 1.0 },
  };
  
  return defaults[material] || defaults['PLA'];
}

export function formatProfileForSlicer(profile: ProfileData, slicer: SlicerType): string {
  switch (slicer) {
    case 'prusaslicer':
    case 'orcaslicer':
      return formatPrusaSlicerProfile(profile);
    case 'bambu':
      return formatBambuProfile(profile);
    case 'cura':
      return formatCuraProfile(profile);
    case 'simplify3d':
      return formatSimplify3DProfile(profile);
    default:
      return JSON.stringify(profile, null, 2);
  }
}

function formatPrusaSlicerProfile(profile: ProfileData): string {
  return `; ${profile.material_name} - Generated by FilaScope
; Material: ${profile.material_type}
; Vendor: ${profile.vendor}

[filament:${profile.material_name}]
filament_colour = #FFFFFF
filament_diameter = ${profile.filament_diameter}
filament_density = ${profile.filament_density}
filament_type = ${profile.material_type}
filament_vendor = ${profile.vendor}

; Temperature
temperature = ${profile.nozzle_temp}
first_layer_temperature = ${profile.nozzle_temp_first_layer}
bed_temperature = ${profile.bed_temp}
first_layer_bed_temperature = ${profile.bed_temp_first_layer}

; Cooling
fan_always_on = 1
min_fan_speed = ${profile.fan_min_speed}
max_fan_speed = ${profile.fan_max_speed}
disable_fan_first_layers = ${profile.disable_fan_first_layers}

; Retraction
retract_length = ${profile.retraction_length}
retract_speed = ${profile.retraction_speed}
retract_lift = ${profile.z_hop}

; Speed
external_perimeter_speed = ${Math.round(profile.print_speed * 0.5)}
perimeter_speed = ${profile.print_speed}
infill_speed = ${Math.round(profile.print_speed * 1.2)}
first_layer_speed = ${profile.first_layer_speed}
travel_speed = ${profile.travel_speed}

; Flow
extrusion_multiplier = ${profile.flow_ratio}
`;
}

function formatBambuProfile(profile: ProfileData): string {
  return JSON.stringify({
    name: profile.material_name,
    type: 'filament',
    inherits: 'Generic PLA',
    from: 'filascope',
    filament_vendor: [profile.vendor],
    filament_type: [profile.material_type],
    nozzle_temperature: [profile.nozzle_temp],
    nozzle_temperature_initial_layer: [profile.nozzle_temp_first_layer],
    hot_plate_temp: [profile.bed_temp],
    hot_plate_temp_initial_layer: [profile.bed_temp_first_layer],
    fan_min_speed: [profile.fan_min_speed],
    fan_max_speed: [profile.fan_max_speed],
    close_fan_the_first_x_layers: [profile.disable_fan_first_layers],
    filament_retraction_length: [profile.retraction_length],
    filament_retraction_speed: [profile.retraction_speed],
    filament_z_hop: [profile.z_hop],
    filament_flow_ratio: [profile.flow_ratio],
    filament_diameter: [profile.filament_diameter],
    filament_density: [profile.filament_density],
  }, null, 2);
}

function formatCuraProfile(profile: ProfileData): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<fdmmaterial xmlns="http://www.ultimaker.com/material" version="1.3">
  <metadata>
    <name>
      <brand>${profile.vendor}</brand>
      <material>${profile.material_type}</material>
      <color>Generic</color>
    </name>
    <GUID>filascope-${Date.now()}</GUID>
    <version>1</version>
    <color_code>#FFFFFF</color_code>
    <description>Generated by FilaScope for ${profile.material_name}</description>
  </metadata>
  <properties>
    <density>${profile.filament_density}</density>
    <diameter>${profile.filament_diameter}</diameter>
  </properties>
  <settings>
    <setting key="print temperature">${profile.nozzle_temp}</setting>
    <setting key="heated bed temperature">${profile.bed_temp}</setting>
    <setting key="standby temperature">${profile.nozzle_temp - 50}</setting>
    <setting key="retraction amount">${profile.retraction_length}</setting>
    <setting key="retraction speed">${profile.retraction_speed}</setting>
  </settings>
</fdmmaterial>`;
}

function formatSimplify3DProfile(profile: ProfileData): string {
  return `; ${profile.material_name} - Simplify3D Profile
; Generated by FilaScope

[profile]
profileName=${profile.material_name}
profileVersion=2023-01-01

[filament]
filamentDiameter=${profile.filament_diameter}
filamentDensity=${profile.filament_density}
filamentType=${profile.material_type}

[temperature]
extruderTemp=${profile.nozzle_temp}
extruderTempFirstLayer=${profile.nozzle_temp_first_layer}
bedTemp=${profile.bed_temp}
bedTempFirstLayer=${profile.bed_temp_first_layer}

[cooling]
fanSpeed=${profile.fan_max_speed}
fanSpeedMin=${profile.fan_min_speed}
disableFanFirstLayers=${profile.disable_fan_first_layers}

[retraction]
retractionDistance=${profile.retraction_length}
retractionSpeed=${profile.retraction_speed}
zLift=${profile.z_hop}

[speed]
defaultSpeed=${profile.print_speed}
firstLayerSpeed=${profile.first_layer_speed}
travelSpeed=${profile.travel_speed}
`;
}

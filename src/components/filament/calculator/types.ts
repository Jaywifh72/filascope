// Calculator input/output interfaces

export interface FilamentUsageInput {
  calculationMethod: 'dimensions' | 'weight' | 'gcode';
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'mm' | 'cm' | 'inches';
  };
  estimatedWeight?: number;
  infillPercent: number;
  wallCount: number;
  layerHeight: number;
  supportEnabled: boolean;
  supportDensity?: number;
}

export interface MaterialRecommendedSettings {
  nozzleTemp: [number, number];
  bedTemp: [number, number];
  printSpeed: [number, number];
  coolingFan: [number, number];
}

export interface FilamentUsageOutput {
  totalGrams: number;
  totalMeters: number;
  spoolsNeeded: number;
  spoolPercentUsed: number;
  wasteEstimate: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  breakdown: {
    walls: number;
    infill: number;
    topBottom: number;
    support: number;
    brim: number;
  };
}

export interface PrintCostInput {
  filamentGrams: number;
  pricePerKg: number;
  printTimeHours?: number;
  electricityRate?: number; // cost per kWh
  printerWattage?: number;
}

export interface PrintCostOutput {
  materialCost: number;
  electricityCost: number;
  wearCost: number;
  totalCost: number;
  costPerGram: number;
}

export interface PrintSettingsOutput {
  temperatures: {
    nozzle: number;
    bed: number;
  };
  speeds: {
    print: number;
    travel: number;
    firstLayer: number;
  };
  retraction: {
    distance: number;
    speed: number;
  };
  cooling: {
    fanSpeed: number;
    minLayerTime: number;
  };
  quality: {
    layerHeight: number;
    wallCount: number;
    infillPercent: number;
  };
  confidenceLevel: 'verified' | 'recommended' | 'experimental';
}

export interface PrinterProfile {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  buildVolume: {
    x: number;
    y: number;
    z: number;
  };
  directDrive: boolean;
  maxPrintSpeed: number;
}

export interface MaterialData {
  type: string;
  name: string;
  properties: {
    strength: number;
    flexibility: number;
    heatResistance: number;
    easeOfPrint: number;
    surfaceFinish: number;
    durability: number;
    foodSafe: boolean;
  };
  bestFor: string[];
  avoidFor: string[];
  priceRange: string;
  printDifficulty: 'easy' | 'moderate' | 'advanced';
}

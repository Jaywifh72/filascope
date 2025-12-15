/**
 * Printer Stock Hardware Configuration
 * Maps printer models to their default/stock hardware
 */

export interface StockHotend {
  material: string;
  diameter: number;
  maxTemp: number;
  type: string;
}

export interface StockBuildPlate {
  type: string;
  surface: string;
  sizeX: number;
  sizeY: number;
}

export interface StockAms {
  installed: boolean;
  compatible: boolean;
  name?: string;
  slots?: number;
}

export interface PrinterHardwareConfig {
  hotend: StockHotend;
  buildPlate: StockBuildPlate;
  ams: StockAms;
}

// Pattern-based matching for printer stock hardware
interface PrinterPattern {
  pattern: RegExp;
  config: PrinterHardwareConfig;
}

const PRINTER_PATTERNS: PrinterPattern[] = [
  // Bambu Lab
  {
    pattern: /bambu\s*lab\s*(x1|x1c|x1\s*carbon)/i,
    config: {
      hotend: { material: 'brass', diameter: 0.4, maxTemp: 300, type: 'Standard 0.4mm brass' },
      buildPlate: { type: 'Textured PEI', surface: 'Textured PEI', sizeX: 256, sizeY: 256 },
      ams: { installed: false, compatible: true, name: 'Bambu AMS', slots: 4 }
    }
  },
  {
    pattern: /bambu\s*lab\s*(p1p|p1s|p1\s*s|p1\s*p)/i,
    config: {
      hotend: { material: 'brass', diameter: 0.4, maxTemp: 300, type: 'Standard 0.4mm brass' },
      buildPlate: { type: 'Textured PEI', surface: 'Textured PEI', sizeX: 256, sizeY: 256 },
      ams: { installed: false, compatible: true, name: 'Bambu AMS', slots: 4 }
    }
  },
  {
    pattern: /bambu\s*lab\s*(a1\s*mini)/i,
    config: {
      hotend: { material: 'brass', diameter: 0.4, maxTemp: 300, type: 'Standard 0.4mm brass' },
      buildPlate: { type: 'Textured PEI', surface: 'Textured PEI', sizeX: 180, sizeY: 180 },
      ams: { installed: false, compatible: true, name: 'Bambu AMS Lite', slots: 4 }
    }
  },
  {
    pattern: /bambu\s*lab\s*a1(?!\s*mini)/i,
    config: {
      hotend: { material: 'brass', diameter: 0.4, maxTemp: 300, type: 'Standard 0.4mm brass' },
      buildPlate: { type: 'Textured PEI', surface: 'Textured PEI', sizeX: 256, sizeY: 256 },
      ams: { installed: false, compatible: true, name: 'Bambu AMS Lite', slots: 4 }
    }
  },
  // Prusa
  {
    pattern: /prusa\s*(mk4|mk4s)/i,
    config: {
      hotend: { material: 'brass', diameter: 0.4, maxTemp: 290, type: 'Nextruder 0.4mm brass' },
      buildPlate: { type: 'Satin PEI', surface: 'Satin PEI', sizeX: 250, sizeY: 210 },
      ams: { installed: false, compatible: true, name: 'Prusa MMU3', slots: 5 }
    }
  },
  {
    pattern: /prusa\s*mini/i,
    config: {
      hotend: { material: 'brass', diameter: 0.4, maxTemp: 280, type: 'E3D V6 brass' },
      buildPlate: { type: 'Smooth PEI', surface: 'Smooth PEI', sizeX: 180, sizeY: 180 },
      ams: { installed: false, compatible: false }
    }
  },
  // Creality
  {
    pattern: /creality\s*(k1|k1c|k1\s*max)/i,
    config: {
      hotend: { material: 'brass', diameter: 0.4, maxTemp: 300, type: 'Quick-swap 0.4mm brass' },
      buildPlate: { type: 'PEI', surface: 'Smooth PEI', sizeX: 220, sizeY: 220 },
      ams: { installed: false, compatible: false }
    }
  },
  {
    pattern: /creality\s*ender\s*3/i,
    config: {
      hotend: { material: 'brass', diameter: 0.4, maxTemp: 260, type: 'MK8 0.4mm brass' },
      buildPlate: { type: 'Glass', surface: 'Glass', sizeX: 220, sizeY: 220 },
      ams: { installed: false, compatible: false }
    }
  },
  // QIDI
  {
    pattern: /qidi\s*(x-?max|max)/i,
    config: {
      hotend: { material: 'hardened', diameter: 0.4, maxTemp: 350, type: 'Hardened 0.4mm' },
      buildPlate: { type: 'PEI', surface: 'Textured PEI', sizeX: 325, sizeY: 325 },
      ams: { installed: false, compatible: false }
    }
  },
  // Anycubic
  {
    pattern: /anycubic\s*kobra\s*(2|3)/i,
    config: {
      hotend: { material: 'brass', diameter: 0.4, maxTemp: 260, type: 'Standard 0.4mm brass' },
      buildPlate: { type: 'PEI', surface: 'Textured PEI', sizeX: 220, sizeY: 220 },
      ams: { installed: false, compatible: false }
    }
  },
];

// Default configuration for unknown printers
const DEFAULT_CONFIG: PrinterHardwareConfig = {
  hotend: { material: 'brass', diameter: 0.4, maxTemp: 260, type: 'Standard 0.4mm brass nozzle' },
  buildPlate: { type: 'PEI', surface: 'Build plate', sizeX: 220, sizeY: 220 },
  ams: { installed: false, compatible: false }
};

/**
 * Get stock hardware configuration for a printer model
 */
export function getPrinterStockHardware(printerModel: string): PrinterHardwareConfig {
  for (const { pattern, config } of PRINTER_PATTERNS) {
    if (pattern.test(printerModel)) {
      return config;
    }
  }
  return DEFAULT_CONFIG;
}

/**
 * Check if current hardware is compatible with filament
 */
export interface HardwareCompatibilityStatus {
  hotend: {
    installed: string;
    compatible: boolean;
    reason: string;
    upgradeNeeded?: string;
  };
  buildPlate: {
    installed: string;
    compatible: boolean;
    reason: string;
  };
  ams: {
    installed: boolean;
    compatible: boolean;
    reason: string;
  };
  overallCompatible: boolean;
  futureSuggestion?: string;
}

export function checkHardwareCompatibility(
  printerModel: string,
  filamentMaterial: string,
  isAbrasive: boolean,
  requiredNozzleTemp: number
): HardwareCompatibilityStatus {
  const config = getPrinterStockHardware(printerModel);
  const material = filamentMaterial.toUpperCase();
  
  // Hotend compatibility
  let hotendCompatible = true;
  let hotendReason = "Works perfectly for this material";
  let upgradeNeeded: string | undefined;
  
  if (requiredNozzleTemp > config.hotend.maxTemp) {
    hotendCompatible = false;
    hotendReason = `Max temp ${config.hotend.maxTemp}°C is below required ${requiredNozzleTemp}°C`;
    upgradeNeeded = "High-temperature hotend";
  } else if (isAbrasive && config.hotend.material === 'brass') {
    hotendCompatible = false;
    hotendReason = "Brass nozzle will wear quickly with abrasive filament";
    upgradeNeeded = "Hardened steel or ruby nozzle";
  }
  
  // Build plate compatibility (simplified)
  const buildPlateCompatible = true;
  let buildPlateReason = "Excellent choice for this material";
  
  if (material.includes('PETG') && config.buildPlate.surface.toLowerCase().includes('smooth')) {
    buildPlateReason = "Works well - consider using release agent for PETG";
  }
  
  // AMS compatibility
  const amsCompatible = config.ams.compatible;
  const amsReason = config.ams.compatible 
    ? "Multi-material printing available" 
    : "No compatible AMS/MMU for this printer";
  
  // Future suggestion
  let futureSuggestion: string | undefined;
  if (!isAbrasive && config.hotend.material === 'brass') {
    futureSuggestion = "Consider a hardened steel nozzle for future abrasive filaments like carbon fiber";
  }
  
  return {
    hotend: {
      installed: config.hotend.type,
      compatible: hotendCompatible,
      reason: hotendReason,
      upgradeNeeded
    },
    buildPlate: {
      installed: config.buildPlate.surface,
      compatible: buildPlateCompatible,
      reason: buildPlateReason
    },
    ams: {
      installed: config.ams.installed,
      compatible: amsCompatible,
      reason: amsReason
    },
    overallCompatible: hotendCompatible && buildPlateCompatible,
    futureSuggestion
  };
}

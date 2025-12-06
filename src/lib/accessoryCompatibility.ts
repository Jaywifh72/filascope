/**
 * Accessory Compatibility Service
 * 
 * Provides unified compatibility checking for:
 * 1. Hotends - Temperature and material compatibility with filaments
 * 2. Build Plates - Size and surface compatibility with printers and filaments
 * 3. AMS/MMU - Printer compatibility for multi-material systems
 */

import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"];
type Filament = Database["public"]["Tables"]["filaments"]["Row"];
type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface AccessoryCompatibilityResult {
  is_compatible: boolean;
  rating: "green" | "orange" | "red";
  reason: string;
  details?: string[];
}

export interface HotendSpecs {
  material?: string;
  diameter_mm?: number;
  max_temp_c?: number;
  abrasion_resistant?: boolean;
  compatible_models?: string[];
}

export interface BuildPlateSpecs {
  size_x_mm?: number;
  size_y_mm?: number;
  max_temp_c?: number;
  surface_type?: string;
  compatible_models?: string[];
}

export interface AmsSpecs {
  max_colors?: number;
  max_spools?: number;
  drying_capability?: boolean;
  compatible_models?: string[];
}

// ============================================================================
// HOTEND COMPATIBILITY
// ============================================================================

/**
 * Check hotend compatibility with a filament
 * Green = Best choice, Orange = Acceptable, Red = Not recommended
 */
export function checkHotendFilamentCompatibility(
  hotend: Accessory,
  filament: Filament
): AccessoryCompatibilityResult {
  const specs = hotend.specs as HotendSpecs | null;
  const maxTemp = specs?.max_temp_c || 0;
  const material = (specs?.material || "").toLowerCase();
  const diameter = specs?.diameter_mm || 0;
  const isAbrasionResistant = specs?.abrasion_resistant === true;
  
  const requiredTemp = filament.nozzle_temp_sweetspot_c || filament.nozzle_temp_max_c || 0;
  const isAbrasive = filament.is_nozzle_abrasive || false;
  
  // Detect material types
  const isStainless = material.includes("stainless");
  const isBrass = material.includes("brass") || material.includes("standard");
  const hasKnownMaterial = isAbrasionResistant || isStainless || isBrass || material.length > 0;
  
  // Build reason with diameter info if available
  const diameterInfo = diameter > 0 ? ` (${diameter}mm)` : "";

  // Temperature check - if can't handle temp, it's not recommended
  if (maxTemp > 0 && requiredTemp > maxTemp) {
    return {
      is_compatible: false,
      rating: "red",
      reason: `Max temp ${maxTemp}°C below required ${requiredTemp}°C`,
      details: [`This hotend cannot reach the ${requiredTemp}°C needed for ${filament.material || 'this filament'}`]
    };
  }

  // For ABRASIVE filaments (CF, GF, etc.)
  if (isAbrasive) {
    if (isAbrasionResistant) {
      if (diameter >= 0.6) {
        return {
          is_compatible: true,
          rating: "green",
          reason: `Hardened + larger nozzle${diameterInfo} - ideal for abrasive filament`,
          details: [
            "Abrasion-resistant material will not wear",
            "Larger diameter reduces clogging with fiber-filled materials"
          ]
        };
      }
      return {
        is_compatible: true,
        rating: "green",
        reason: `Hardened material${diameterInfo} - best for abrasive filament`,
        details: ["Abrasion-resistant material will not wear from fiber-filled filaments"]
      };
    }
    if (isStainless) {
      return {
        is_compatible: true,
        rating: "orange",
        reason: `Stainless steel${diameterInfo} - acceptable but will wear over time`,
        details: [
          "Stainless steel is more durable than brass",
          "Will eventually wear with extended use of abrasive filaments"
        ]
      };
    }
    if (isBrass) {
      return {
        is_compatible: false,
        rating: "red",
        reason: `Brass${diameterInfo} not recommended for abrasive filament`,
        details: [
          "Brass wears very quickly with abrasive materials",
          "Consider a hardened steel or ruby-tipped hotend"
        ]
      };
    }
    // Unknown material with abrasive filament
    if (!hasKnownMaterial) {
      return {
        is_compatible: true,
        rating: "orange",
        reason: `Unknown material - verify abrasion resistance before use`,
        details: ["Check manufacturer specs for compatibility with abrasive filaments"]
      };
    }
  }

  // For NON-ABRASIVE filaments
  if (isAbrasionResistant) {
    return {
      is_compatible: true,
      rating: "green",
      reason: `Hardened material${diameterInfo} - excellent for all materials`,
      details: ["Works well with all filament types including future abrasive materials"]
    };
  }
  if (isStainless || isBrass) {
    return {
      is_compatible: true,
      rating: "green",
      reason: `${isStainless ? 'Stainless steel' : 'Brass'}${diameterInfo} - perfect for non-abrasive filament`,
      details: ["Standard material works well with PLA, PETG, ABS, and similar filaments"]
    };
  }
  if (!hasKnownMaterial) {
    return {
      is_compatible: true,
      rating: "orange",
      reason: `Material not specified - likely compatible`,
      details: ["Check manufacturer specifications for detailed compatibility"]
    };
  }

  return {
    is_compatible: true,
    rating: "green",
    reason: `Compatible with ${filament.material || 'this filament'}${diameterInfo}`,
    details: ["Standard compatibility - no issues expected"]
  };
}

/**
 * Check hotend compatibility with a printer (model-level matching)
 */
export function checkHotendPrinterCompatibility(
  hotend: Accessory,
  printer: Printer
): AccessoryCompatibilityResult {
  const specs = hotend.specs as HotendSpecs | null;
  const compatibleModels = specs?.compatible_models || [];
  const compatibleBrands = hotend.compatible_printer_brands || [];
  
  const printerModel = printer.model_name || "";
  const printerBrandId = printer.brand_id || "";
  
  // Check model-level compatibility first (most precise)
  if (compatibleModels.length > 0) {
    const isModelMatch = compatibleModels.some(model => {
      const modelLower = model.toLowerCase();
      const printerLower = printerModel.toLowerCase();
      return printerLower.includes(modelLower) || modelLower.includes(printerLower);
    });
    
    if (isModelMatch) {
      return {
        is_compatible: true,
        rating: "green",
        reason: `Designed for ${printerModel}`,
        details: [`This hotend is specifically compatible with ${printerModel}`]
      };
    }
  }
  
  // Check brand-level compatibility (for third-party universal hotends)
  if (compatibleBrands.length > 0 && printerBrandId) {
    // Brand matching would require brand name lookup
    // For now, return uncertain if there are compatible brands listed
    return {
      is_compatible: true,
      rating: "orange",
      reason: "Check brand compatibility",
      details: ["This hotend may be compatible - verify with manufacturer specs"]
    };
  }
  
  return {
    is_compatible: false,
    rating: "red",
    reason: "Not listed as compatible",
    details: [`This hotend is not designed for ${printerModel}`]
  };
}

// ============================================================================
// BUILD PLATE COMPATIBILITY
// ============================================================================

/**
 * Check build plate compatibility with a printer (size-based matching)
 * Uses 25mm tolerance for size matching
 */
export function checkBuildPlatePrinterCompatibility(
  buildPlate: Accessory,
  printer: Printer,
  toleranceMm: number = 25
): AccessoryCompatibilityResult {
  const specs = buildPlate.specs as BuildPlateSpecs | null;
  const plateX = specs?.size_x_mm || 0;
  const plateY = specs?.size_y_mm || 0;
  const compatibleModels = specs?.compatible_models || [];
  
  const printerX = printer.build_volume_x_mm || printer.bed_size_x_mm || 0;
  const printerY = printer.build_volume_y_mm || printer.bed_size_y_mm || 0;
  const printerModel = printer.model_name || "";
  
  // Check model-level compatibility first
  if (compatibleModels.length > 0) {
    const isModelMatch = compatibleModels.some(model => {
      const modelLower = model.toLowerCase();
      const printerLower = printerModel.toLowerCase();
      return printerLower.includes(modelLower) || modelLower.includes(printerLower);
    });
    
    if (isModelMatch) {
      return {
        is_compatible: true,
        rating: "green",
        reason: `Designed for ${printerModel}`,
        details: [`This build plate is specifically designed for ${printerModel}`]
      };
    }
  }
  
  // Size-based compatibility check
  if (plateX > 0 && plateY > 0 && printerX > 0 && printerY > 0) {
    const xDiff = Math.abs(plateX - printerX);
    const yDiff = Math.abs(plateY - printerY);
    
    if (xDiff <= toleranceMm && yDiff <= toleranceMm) {
      if (xDiff <= 5 && yDiff <= 5) {
        return {
          is_compatible: true,
          rating: "green",
          reason: `Perfect size match (${plateX}x${plateY}mm)`,
          details: ["Dimensions match your printer's bed size exactly"]
        };
      }
      return {
        is_compatible: true,
        rating: "orange",
        reason: `Close size match (${plateX}x${plateY}mm vs ${printerX}x${printerY}mm)`,
        details: [
          `Size difference: ${xDiff}mm x ${yDiff}mm`,
          "May require adjustment or may not cover full bed"
        ]
      };
    }
    
    return {
      is_compatible: false,
      rating: "red",
      reason: `Size mismatch (${plateX}x${plateY}mm vs ${printerX}x${printerY}mm)`,
      details: ["This build plate is too large or too small for your printer"]
    };
  }
  
  return {
    is_compatible: true,
    rating: "orange",
    reason: "Size compatibility uncertain",
    details: ["Unable to verify size - check dimensions manually"]
  };
}

/**
 * Check build plate surface compatibility with a filament
 */
export function checkBuildPlateFilamentCompatibility(
  buildPlate: Accessory,
  filament: Filament
): AccessoryCompatibilityResult {
  const specs = buildPlate.specs as BuildPlateSpecs | null;
  const surface = (specs?.surface_type || "").toLowerCase();
  const maxTemp = specs?.max_temp_c || 100;
  const material = (filament.material || "").toUpperCase();
  const requiredBedTemp = filament.bed_temp_min_c || 0;
  
  // Temperature check
  if (requiredBedTemp > maxTemp) {
    return {
      is_compatible: false,
      rating: "red",
      reason: `Bed temp ${requiredBedTemp}°C exceeds plate max ${maxTemp}°C`,
      details: ["This build plate cannot handle the required bed temperature"]
    };
  }
  
  // Surface compatibility matrix
  const isPEI = surface.includes("pei");
  const isTextured = surface.includes("textured") || surface.includes("frosted");
  const isSmooth = surface.includes("smooth") || surface.includes("glass");
  const isEngineering = surface.includes("engineering") || surface.includes("garolite");
  
  // PLA - works on almost everything
  if (material.includes("PLA")) {
    return {
      is_compatible: true,
      rating: "green",
      reason: "Excellent adhesion for PLA",
      details: ["PLA adheres well to most build surfaces"]
    };
  }
  
  // PETG - prefers textured PEI
  if (material.includes("PETG")) {
    if (isTextured && isPEI) {
      return {
        is_compatible: true,
        rating: "green",
        reason: "Textured PEI - ideal for PETG",
        details: ["Easy release without damage to the surface"]
      };
    }
    if (isSmooth && isPEI) {
      return {
        is_compatible: true,
        rating: "orange",
        reason: "Smooth PEI - use release agent for PETG",
        details: ["PETG bonds strongly to smooth PEI - use glue stick as release agent"]
      };
    }
  }
  
  // ABS/ASA - needs high temp and good adhesion
  if (material.includes("ABS") || material.includes("ASA")) {
    if (isPEI) {
      return {
        is_compatible: true,
        rating: "green",
        reason: "PEI works well for ABS/ASA",
        details: ["Good adhesion with proper bed temperature"]
      };
    }
    if (isEngineering) {
      return {
        is_compatible: true,
        rating: "green",
        reason: "Engineering plate - excellent for high-temp materials",
        details: ["Designed for ABS, ASA, and engineering materials"]
      };
    }
  }
  
  // Nylon/PA
  if (material.includes("NYLON") || material.includes("PA")) {
    if (isEngineering) {
      return {
        is_compatible: true,
        rating: "green",
        reason: "Engineering plate - best for Nylon",
        details: ["Garolite/G10 provides excellent Nylon adhesion"]
      };
    }
    return {
      is_compatible: true,
      rating: "orange",
      reason: "Nylon adhesion may be challenging",
      details: ["Consider using glue stick or Magigoo for better adhesion"]
    };
  }
  
  // TPU/Flex
  if (material.includes("TPU") || material.includes("FLEX")) {
    if (isTextured) {
      return {
        is_compatible: true,
        rating: "green",
        reason: "Textured surface - good for TPU",
        details: ["Easy release for flexible materials"]
      };
    }
    return {
      is_compatible: true,
      rating: "orange",
      reason: "Flexible material may stick too well",
      details: ["Use release agent if parts are difficult to remove"]
    };
  }
  
  // Default - probably compatible
  return {
    is_compatible: true,
    rating: "green",
    reason: "Standard compatibility",
    details: ["Should work with default settings"]
  };
}

// ============================================================================
// AMS/MMU COMPATIBILITY
// ============================================================================

/**
 * Check AMS/MMU compatibility with a printer
 */
export function checkAmsPrinterCompatibility(
  ams: Accessory,
  printer: Printer
): AccessoryCompatibilityResult {
  const specs = ams.specs as AmsSpecs | null;
  const compatibleModels = specs?.compatible_models || [];
  const compatibleBrands = ams.compatible_printer_brands || [];
  const printerModel = printer.model_name || "";
  const isUniversal = compatibleModels.some(m => 
    m.toLowerCase().includes("universal") || m.toLowerCase().includes("klipper")
  );
  
  // Universal systems (ERCF, Box Turtle, etc.)
  if (isUniversal) {
    return {
      is_compatible: true,
      rating: "orange",
      reason: "Universal system - requires Klipper firmware",
      details: [
        "This is a universal multi-material system",
        "Requires Klipper firmware and custom configuration",
        "May require additional hardware modifications"
      ]
    };
  }
  
  // Check model-level compatibility
  if (compatibleModels.length > 0) {
    const isModelMatch = compatibleModels.some(model => {
      const modelLower = model.toLowerCase();
      const printerLower = printerModel.toLowerCase();
      // More flexible matching for model names
      return printerLower.includes(modelLower) || 
             modelLower.includes(printerLower) ||
             // Handle variations like "X1C" matching "X1 Carbon"
             modelLower.replace(/\s+/g, '').includes(printerLower.replace(/\s+/g, ''));
    });
    
    if (isModelMatch) {
      const maxColors = specs?.max_colors || 0;
      const hasDrying = specs?.drying_capability || false;
      const details = [`Supports up to ${maxColors} colors`];
      if (hasDrying) details.push("Includes filament drying capability");
      
      return {
        is_compatible: true,
        rating: "green",
        reason: `Designed for ${printerModel}`,
        details
      };
    }
  }
  
  // Check brand compatibility
  if (compatibleBrands.length > 0) {
    return {
      is_compatible: true,
      rating: "orange",
      reason: "May be compatible - verify model support",
      details: ["This AMS/MMU supports some models from your printer's brand"]
    };
  }
  
  return {
    is_compatible: false,
    rating: "red",
    reason: "Not compatible with this printer",
    details: [`This multi-material system is not designed for ${printerModel}`]
  };
}

/**
 * Check if AMS/MMU supports a specific filament type
 */
export function checkAmsFilamentCompatibility(
  ams: Accessory,
  filament: Filament
): AccessoryCompatibilityResult {
  const specs = ams.specs as AmsSpecs | null;
  const hasDrying = specs?.drying_capability || false;
  const material = (filament.material || "").toUpperCase();
  const moistureSensitive = filament.moisture_sensitivity_level || "";
  
  // Check moisture-sensitive materials
  const highMoistureMaterials = ["NYLON", "PA", "PVA", "TPU"];
  const isMoistureSensitive = highMoistureMaterials.some(m => material.includes(m)) ||
                              moistureSensitive.toLowerCase().includes("high");
  
  if (isMoistureSensitive && !hasDrying) {
    return {
      is_compatible: true,
      rating: "orange",
      reason: "Moisture-sensitive material without drying",
      details: [
        `${filament.material} is moisture-sensitive`,
        "This AMS/MMU does not have built-in drying",
        "Consider pre-drying filament before use"
      ]
    };
  }
  
  if (isMoistureSensitive && hasDrying) {
    return {
      is_compatible: true,
      rating: "green",
      reason: "Drying capability available",
      details: [
        `${filament.material} will be kept dry`,
        "Built-in drying helps maintain print quality"
      ]
    };
  }
  
  // Check for abrasive materials (may wear PTFE tubes faster)
  if (filament.is_nozzle_abrasive) {
    return {
      is_compatible: true,
      rating: "orange",
      reason: "Abrasive material may wear feed tubes",
      details: [
        "Carbon fiber and glass-filled materials are abrasive",
        "PTFE tubes may wear faster with extended use",
        "Consider using reinforced tubes if available"
      ]
    };
  }
  
  return {
    is_compatible: true,
    rating: "green",
    reason: `Compatible with ${filament.material || 'this filament'}`,
    details: ["Standard filament should work without issues"]
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all compatibility results for a hotend with a printer and filament
 */
export function getFullHotendCompatibility(
  hotend: Accessory,
  printer: Printer | null,
  filament: Filament | null
): {
  printer: AccessoryCompatibilityResult | null;
  filament: AccessoryCompatibilityResult | null;
} {
  return {
    printer: printer ? checkHotendPrinterCompatibility(hotend, printer) : null,
    filament: filament ? checkHotendFilamentCompatibility(hotend, filament) : null,
  };
}

/**
 * Get all compatibility results for a build plate with a printer and filament
 */
export function getFullBuildPlateCompatibility(
  buildPlate: Accessory,
  printer: Printer | null,
  filament: Filament | null
): {
  printer: AccessoryCompatibilityResult | null;
  filament: AccessoryCompatibilityResult | null;
} {
  return {
    printer: printer ? checkBuildPlatePrinterCompatibility(buildPlate, printer) : null,
    filament: filament ? checkBuildPlateFilamentCompatibility(buildPlate, filament) : null,
  };
}

/**
 * Get all compatibility results for an AMS/MMU with a printer and filament
 */
export function getFullAmsCompatibility(
  ams: Accessory,
  printer: Printer | null,
  filament: Filament | null
): {
  printer: AccessoryCompatibilityResult | null;
  filament: AccessoryCompatibilityResult | null;
} {
  return {
    printer: printer ? checkAmsPrinterCompatibility(ams, printer) : null,
    filament: filament ? checkAmsFilamentCompatibility(ams, filament) : null,
  };
}

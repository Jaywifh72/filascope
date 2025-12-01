/**
 * Printer-Filament Compatibility Service
 * 
 * This module provides reusable logic to determine:
 * 1. Whether a filament can be printed on a specific printer
 * 2. How easy/difficult it would be (Easy/Medium/Hard)
 * 3. Specific limitations and reasons for incompatibility
 * 4. Recommendations for nozzle, bed, and slicer settings
 */

import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"];
type Filament = Database["public"]["Tables"]["filaments"]["Row"];

export interface CompatibilityResult {
  is_supported: boolean;
  ease_rating: "Easy" | "Medium" | "Hard" | "Not Possible";
  limitations: string[];
  recommendations: {
    nozzle: {
      size: string[];
      material: string;
      notes: string;
    };
    bed: {
      plate_types: string[];
      notes: string;
    };
    slicer: {
      nozzle_temp_range: string;
      bed_temp_range: string;
      notes: string[];
    };
    warnings: string[];
  };
}

/**
 * Main compatibility check function
 * Takes a printer and filament object and returns comprehensive compatibility analysis
 */
export function checkPrinterFilamentCompatibility(
  printer: Printer,
  filament: Filament
): CompatibilityResult {
  const limitations: string[] = [];
  const warnings: string[] = [];
  let easeScore = 100; // Start with perfect score, deduct for issues

  // 1. Check nozzle temperature compatibility
  const requiredNozzleTemp = filament.nozzle_temp_sweetspot_c || 
    filament.nozzle_temp_min_c || 
    ((filament.nozzle_temp_max_c || 0) + (filament.nozzle_temp_min_c || 0)) / 2;
  
  const printerMaxNozzleTemp = printer.max_nozzle_temp_c || 0;
  
  if (requiredNozzleTemp && printerMaxNozzleTemp < requiredNozzleTemp) {
    limitations.push(
      `Required nozzle temp ${requiredNozzleTemp}°C exceeds printer max ${printerMaxNozzleTemp}°C`
    );
    return {
      is_supported: false,
      ease_rating: "Not Possible",
      limitations,
      recommendations: getDefaultRecommendations(printer, filament, warnings),
    };
  }

  // Warn if close to limit (within 10°C)
  if (requiredNozzleTemp && printerMaxNozzleTemp - requiredNozzleTemp < 10) {
    warnings.push("Operating close to printer's maximum nozzle temperature");
    easeScore -= 20;
  }

  // 2. Check bed temperature compatibility
  const requiredBedTemp = filament.bed_temp_min_c || 0;
  const printerMaxBedTemp = printer.bed_max_temp_c || 0;
  
  if (requiredBedTemp && printerMaxBedTemp < requiredBedTemp) {
    limitations.push(
      `Required bed temp ${requiredBedTemp}°C exceeds printer max ${printerMaxBedTemp}°C`
    );
    return {
      is_supported: false,
      ease_rating: "Not Possible",
      limitations,
      recommendations: getDefaultRecommendations(printer, filament, warnings),
    };
  }

  if (!printer.bed_heated && requiredBedTemp > 0) {
    warnings.push("Filament requires heated bed, but printer has no heated bed");
    easeScore -= 30;
  }

  // 3. Check abrasive filament compatibility
  if (filament.is_nozzle_abrasive) {
    if (!printer.abrasive_filament_support) {
      warnings.push(
        "Abrasive filament detected. Printer may not have hardened steel nozzle. Brass nozzle will wear quickly."
      );
      easeScore -= 25;
    }
    if (printer.nozzle_material?.toLowerCase().includes("brass")) {
      warnings.push("Brass nozzle will wear out quickly with this abrasive material");
      easeScore -= 15;
    }
  }

  // 4. Check enclosure requirements for high-temp materials
  const highTempMaterials = ["ABS", "ASA", "PC", "Nylon", "PA", "PEEK", "PPS"];
  const isHighTempMaterial = highTempMaterials.some((mat) =>
    filament.material?.includes(mat)
  );

  if (isHighTempMaterial) {
    if (!printer.has_enclosure) {
      warnings.push(
        `${filament.material} prints best with an enclosure to prevent warping. This printer is open-frame.`
      );
      easeScore -= 30;
    } else if (printer.enclosure_heated) {
      easeScore += 10; // Bonus for heated enclosure
    }
  }

  // 5. Check material officially supported
  const officialMaterials = printer.official_supported_materials?.toLowerCase() || "";
  const recommendedMaterials = printer.recommended_materials?.toLowerCase() || "";
  const filamentMaterial = filament.material?.toLowerCase() || "";
  
  if (officialMaterials.includes(filamentMaterial) || 
      recommendedMaterials.includes(filamentMaterial)) {
    easeScore += 15; // Bonus for official support
  } else {
    easeScore -= 10;
    warnings.push("Material not officially listed as supported by printer manufacturer");
  }

  // 6. Check build volume (for context, not a hard limitation)
  if (printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm) {
    const volume = printer.build_volume_x_mm * printer.build_volume_y_mm * printer.build_volume_z_mm;
    if (volume < 50000) { // Small printer
      warnings.push("Small build volume may limit print size");
    }
  }

  // 7. Add notes from printer if relevant
  if (printer.materials_notes) {
    warnings.push(`Note: ${printer.materials_notes}`);
  }

  // Determine ease rating based on score
  let easeRating: "Easy" | "Medium" | "Hard";
  if (easeScore >= 80) {
    easeRating = "Easy";
  } else if (easeScore >= 60) {
    easeRating = "Medium";
  } else {
    easeRating = "Hard";
  }

  return {
    is_supported: true,
    ease_rating: easeRating,
    limitations,
    recommendations: getRecommendations(printer, filament, warnings),
  };
}

/**
 * Generate nozzle, bed, and slicer recommendations
 */
function getRecommendations(
  printer: Printer,
  filament: Filament,
  warnings: string[]
): CompatibilityResult["recommendations"] {
  // Nozzle recommendations
  const nozzleSizes: string[] = [];
  const isAbrasive = filament.is_nozzle_abrasive || false;
  
  if (isAbrasive) {
    nozzleSizes.push("0.6mm", "0.8mm");
  } else {
    nozzleSizes.push("0.4mm");
    if (filament.material?.includes("TPU") || filament.material?.includes("Flex")) {
      nozzleSizes.push("0.6mm");
    }
  }

  const nozzleMaterial = isAbrasive
    ? "Hardened Steel or Ruby-tipped"
    : printer.nozzle_material || "Brass (standard)";

  const nozzleNotes = isAbrasive
    ? "Abrasive materials require hardened nozzles to prevent wear."
    : "Standard brass nozzle is suitable for this material.";

  // Bed recommendations
  const supportedPlates = printer.supported_plate_types?.split(",").map(p => p.trim()) || [];
  const plateTypes = supportedPlates.length > 0 ? supportedPlates : ["PEI (if available)"];
  
  let bedNotes = "";
  if (filament.material?.includes("ABS") || filament.material?.includes("ASA")) {
    bedNotes = "Textured PEI or PEI with glue stick recommended for ABS/ASA adhesion.";
  } else if (filament.material?.includes("PETG")) {
    bedNotes = "Smooth or textured PEI works well. Avoid too much squish.";
  } else if (filament.material?.includes("TPU")) {
    bedNotes = "Textured PEI or direct on glass with glue stick.";
  } else {
    bedNotes = "Standard PEI sheet should work well.";
  }

  // Slicer settings
  const nozzleTempRange = filament.nozzle_temp_min_c && filament.nozzle_temp_max_c
    ? `${filament.nozzle_temp_min_c}°C - ${filament.nozzle_temp_max_c}°C`
    : filament.nozzle_temp_sweetspot_c
    ? `~${filament.nozzle_temp_sweetspot_c}°C`
    : "See filament specifications";

  const bedTempRange = filament.bed_temp_min_c && filament.bed_temp_max_c
    ? `${filament.bed_temp_min_c}°C - ${filament.bed_temp_max_c}°C`
    : filament.bed_temp_min_c
    ? `${filament.bed_temp_min_c}°C+`
    : "60°C (default)";

  const slicerNotes: string[] = [];
  
  if (printer.max_print_speed_mms) {
    slicerNotes.push(
      `Max print speed: ${printer.max_print_speed_mms} mm/s (reduce for better quality)`
    );
  }

  if (filament.material?.includes("TPU") || filament.material?.includes("Flex")) {
    slicerNotes.push("Use slower speeds (20-40 mm/s) and reduce retraction for flexible materials");
  }

  if (filament.material?.includes("ABS") || filament.material?.includes("ASA")) {
    slicerNotes.push("Disable part cooling fan or keep very low (<20%) to prevent warping");
  }

  if (printer.auto_bed_leveling) {
    slicerNotes.push("Printer has auto bed leveling - ensure it's calibrated");
  }

  return {
    nozzle: {
      size: nozzleSizes,
      material: nozzleMaterial,
      notes: nozzleNotes,
    },
    bed: {
      plate_types: plateTypes,
      notes: bedNotes,
    },
    slicer: {
      nozzle_temp_range: nozzleTempRange,
      bed_temp_range: bedTempRange,
      notes: slicerNotes,
    },
    warnings,
  };
}

/**
 * Default recommendations when printer/filament incompatible
 */
function getDefaultRecommendations(
  printer: Printer,
  filament: Filament,
  warnings: string[]
): CompatibilityResult["recommendations"] {
  return {
    nozzle: {
      size: ["0.4mm"],
      material: "N/A",
      notes: "This filament is not compatible with this printer.",
    },
    bed: {
      plate_types: ["N/A"],
      notes: "N/A",
    },
    slicer: {
      nozzle_temp_range: "N/A",
      bed_temp_range: "N/A",
      notes: ["This combination is not recommended."],
    },
    warnings,
  };
}
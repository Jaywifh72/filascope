/**
 * AMS/MMU Compatibility Service
 * 
 * Dynamically determines if a filament is compatible with AMS/MMU systems
 * based on material type, drying requirements, and spool dimensions.
 */

import type { Database } from "@/integrations/supabase/types";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];
type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];

export interface AMSCompatibilityResult {
  isCompatible: boolean;
  compatibleSystems: string[];
  limitations: string[];
  confidence: "high" | "medium" | "low";
}

// Standard spool dimensions that fit most AMS systems (Bambu Lab AMS spec: 197-202mm diameter, 50-68mm width)
const STANDARD_SPOOL_MAX_DIAMETER = 202;
const STANDARD_SPOOL_MAX_WIDTH = 68;
const STANDARD_SPOOL_MIN_DIAMETER = 165;

// Materials commonly supported by AMS systems
const AMS_FRIENDLY_MATERIALS = [
  "PLA", "PETG", "ABS", "ASA", "TPU", "PA", "PC", "PVA", "BVOH", "HIPS"
];

// Materials that may have issues with AMS (flexible, very abrasive, moisture-sensitive)
const AMS_PROBLEMATIC_MATERIALS = [
  "TPU 85A", // Too flexible
  "PEEK", "PPS", "PSU", // Ultra high temp - need special handling
];

// Materials that are abrasive and may wear AMS PTFE tubes
const ABRASIVE_MATERIALS = ["CF", "GF", "Carbon Fiber", "Glass Fiber"];

/**
 * Check if a filament is compatible with AMS/MMU systems
 */
export function checkAMSCompatibility(
  filament: Filament,
  amsAccessories?: Accessory[]
): AMSCompatibilityResult {
  const limitations: string[] = [];
  const compatibleSystems: string[] = [];
  let isCompatible = true;
  let confidence: "high" | "medium" | "low" = "high";

  const material = filament.material?.toUpperCase() || "";
  const baseMaterial = getBaseMaterial(material);

  // 1. Check if material is AMS-friendly
  const isFriendlyMaterial = AMS_FRIENDLY_MATERIALS.some(m => 
    baseMaterial.includes(m.toUpperCase())
  );

  // 2. Check if material is problematic
  const isProblematic = AMS_PROBLEMATIC_MATERIALS.some(m => 
    material.includes(m.toUpperCase())
  );

  // 3. Check if material is abrasive (carbon fiber, glass fiber)
  const isAbrasive = ABRASIVE_MATERIALS.some(m => 
    material.includes(m.toUpperCase())
  );

  // 4. Check spool dimensions if available
  const spoolDiameter = filament.spool_outer_d_mm;
  const spoolWidth = filament.spool_width_mm;
  
  // Validate spool dimensions (ignore obviously wrong values like 1000mm)
  const hasValidSpoolDimensions = 
    spoolDiameter && spoolDiameter > 50 && spoolDiameter < 300 &&
    spoolWidth && spoolWidth > 20 && spoolWidth < 100;

  if (hasValidSpoolDimensions) {
    if (spoolDiameter && spoolDiameter > STANDARD_SPOOL_MAX_DIAMETER) {
      limitations.push(`Spool diameter (${spoolDiameter}mm) may exceed AMS capacity`);
      confidence = "medium";
    }
    if (spoolWidth && spoolWidth > STANDARD_SPOOL_MAX_WIDTH) {
      limitations.push(`Spool width (${spoolWidth}mm) may not fit standard AMS`);
      confidence = "medium";
    }
  }

  // 5. Check drying requirements vs AMS capabilities
  const dryingTemp = filament.drying_temp_c;
  if (dryingTemp && dryingTemp > 55) {
    // Most AMS systems don't have active heating or max at 55°C
    // Only Bambu Lab AMS HT supports up to 85°C
    limitations.push(`High drying temp (${dryingTemp}°C) - may need external dryer`);
  }

  // 6. Evaluate based on material type
  if (isProblematic) {
    isCompatible = false;
    limitations.push(`${baseMaterial} typically not recommended for AMS feeding`);
  } else if (!isFriendlyMaterial) {
    // Unknown material - be cautious
    confidence = "low";
    limitations.push("Specialty material - verify with AMS specs");
  }

  // 7. Handle abrasive materials
  if (isAbrasive) {
    limitations.push("Abrasive filament may wear PTFE tubes in AMS over time");
    confidence = confidence === "high" ? "medium" : confidence;
  }

  // 8. Handle flexible materials (TPU)
  if (baseMaterial.includes("TPU") || baseMaterial.includes("FLEX")) {
    if (material.includes("85A") || material.includes("80A")) {
      isCompatible = false;
      limitations.push("Very soft TPU (85A or below) doesn't feed reliably in AMS");
    } else {
      limitations.push("TPU works in AMS but may need slower retraction settings");
      confidence = "medium";
    }
  }

  // 9. Match against actual AMS systems in database
  if (amsAccessories && amsAccessories.length > 0) {
    for (const ams of amsAccessories) {
      const specs = ams.specs as Record<string, unknown> | null;
      if (!specs) continue;

      const supportedTypes = (specs.filament_types as string || "").toUpperCase();
      const hasHumidityControl = specs.humidity_control === true;
      const hasDrying = specs.drying_capability === true;
      const maxDryingTemp = specs.max_drying_temp_c as number | null;
      const spoolSpec = specs.spool_size as string || "";

      // Check if this AMS supports the material
      const materialSupported = supportedTypes.includes(baseMaterial) || 
        (isFriendlyMaterial && supportedTypes.length > 0);

      if (materialSupported) {
        compatibleSystems.push(ams.name);
        
        // Bonus: if AMS has humidity control, it's better for hygroscopic materials
        if (hasHumidityControl && isHygroscopic(baseMaterial)) {
          // Extra compatible - has humidity control
        }
        
        // Check if AMS can dry this filament
        if (dryingTemp && hasDrying && maxDryingTemp && dryingTemp <= maxDryingTemp) {
          // Can dry in this AMS
        }
      }
    }
  }

  // If no specific AMS accessories to check against, assume general compatibility
  if (!amsAccessories || amsAccessories.length === 0) {
    if (isFriendlyMaterial && !isProblematic) {
      compatibleSystems.push("Most AMS/MMU systems");
    }
  }

  return {
    isCompatible: isCompatible && compatibleSystems.length > 0,
    compatibleSystems,
    limitations,
    confidence
  };
}

/**
 * Simple check if a filament is likely AMS compatible
 * Used for filtering in the Finder page
 */
export function isAMSCompatible(filament: Filament): boolean {
  const material = filament.material?.toUpperCase() || "";
  const baseMaterial = getBaseMaterial(material);

  // Check if material is friendly
  const isFriendlyMaterial = AMS_FRIENDLY_MATERIALS.some(m => 
    baseMaterial.includes(m.toUpperCase())
  );

  // Check if material is problematic
  const isProblematic = AMS_PROBLEMATIC_MATERIALS.some(m => 
    material.includes(m.toUpperCase())
  );

  // Very soft TPU is not compatible
  if (baseMaterial.includes("TPU") || baseMaterial.includes("FLEX")) {
    if (material.includes("85A") || material.includes("80A") || material.includes("75A")) {
      return false;
    }
  }

  // PEEK, PPS, PSU not compatible
  if (material.includes("PEEK") || material.includes("PPS") || material.includes("PSU")) {
    return false;
  }

  return isFriendlyMaterial && !isProblematic;
}

/**
 * Extract base material from full material name
 */
function getBaseMaterial(material: string): string {
  // Remove common suffixes
  const cleaned = material
    .replace(/[-_\s]*(CF|GF|HF|HT|ESD|FR|PRO|PLUS|\+).*$/i, "")
    .replace(/[-_\s]*CARBON FIBER.*$/i, "")
    .replace(/[-_\s]*GLASS FIBER.*$/i, "")
    .trim();
  
  // Map common variants to base
  if (cleaned.includes("PLA")) return "PLA";
  if (cleaned.includes("PETG") || cleaned.includes("PET-G")) return "PETG";
  if (cleaned.includes("ABS")) return "ABS";
  if (cleaned.includes("ASA")) return "ASA";
  if (cleaned.includes("TPU") || cleaned.includes("TPE") || cleaned.includes("FLEX")) return "TPU";
  if (cleaned.includes("NYLON") || cleaned.includes("PA")) return "PA";
  if (cleaned.includes("PC") && !cleaned.includes("PPC")) return "PC";
  if (cleaned.includes("PVA")) return "PVA";
  if (cleaned.includes("BVOH")) return "BVOH";
  if (cleaned.includes("HIPS")) return "HIPS";
  if (cleaned.includes("PEEK")) return "PEEK";
  if (cleaned.includes("PPS")) return "PPS";
  if (cleaned.includes("PP") && cleaned.length <= 4) return "PP";
  
  return cleaned || material;
}

/**
 * Check if material is hygroscopic (absorbs moisture)
 */
function isHygroscopic(material: string): boolean {
  const hygroscopicMaterials = ["PA", "NYLON", "PVA", "BVOH", "PC", "TPU", "PETG", "ABS", "ASA"];
  return hygroscopicMaterials.some(m => material.includes(m));
}

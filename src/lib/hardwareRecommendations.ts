/**
 * Hardware Recommendations Service
 * Generates intelligent recommendations with reasoning for accessories
 */

import type { Database } from "@/integrations/supabase/types";

type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];
type Filament = Database["public"]["Tables"]["filaments"]["Row"];
type Printer = Database["public"]["Tables"]["printers"]["Row"];

export interface RecommendationReason {
  icon: '✓' | '⚠' | '✗' | '💡';
  text: string;
  priority: number;
}

export interface SpeedTempRecommendation {
  minTemp: number;
  maxTemp: number;
  note: string;
}

// Bundle/related item suggestions based on accessory type
export interface RelatedItem {
  name: string;
  description: string;
  estimatedPrice: string;
}

export const RELATED_ITEMS: Record<string, RelatedItem[]> = {
  hotend: [
    { name: "Nozzle cleaning kit", description: "Keep your nozzle clean", estimatedPrice: "$12.99" },
    { name: "Thermal paste", description: "For optimal heat transfer", estimatedPrice: "$8.99" },
    { name: "Silicone sock", description: "Heat retention & protection", estimatedPrice: "$5.99" },
  ],
  build_plate: [
    { name: "IPA cleaning solution", description: "Essential for adhesion", estimatedPrice: "$8.99" },
    { name: "Scraper tool", description: "Safe print removal", estimatedPrice: "$6.99" },
    { name: "Glue stick", description: "For tricky materials", estimatedPrice: "$4.99" },
  ],
  ams_mmu: [
    { name: "PTFE tube kit", description: "Replacement tubes", estimatedPrice: "$9.99" },
    { name: "Filament cutter", description: "Clean filament ends", estimatedPrice: "$7.99" },
    { name: "Desiccant packs", description: "Keep filament dry", estimatedPrice: "$12.99" },
  ],
};

/**
 * Generate recommendation reasons for an accessory based on filament and printer context
 */
export function generateRecommendationReasons(
  accessory: Accessory,
  filament: Filament | null,
  printer: Printer | null,
  rating: 'green' | 'orange' | 'red'
): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];
  const specs = accessory.specs as Record<string, unknown> | null;
  const material = filament?.material?.toUpperCase() || "";
  const accessoryType = accessory.accessory_type;
  
  // Type-specific reasoning
  if (accessoryType === 'hotend') {
    const hotendMaterial = (specs?.material as string || "").toLowerCase();
    const maxTemp = specs?.max_temp_c as number || 0;
    const isAbrasionResistant = specs?.abrasion_resistant === true;
    const diameter = specs?.diameter_mm as number || 0;
    
    if (rating === 'green') {
      if (isAbrasionResistant) {
        reasons.push({
          icon: '✓',
          text: "Abrasion-resistant - handles all filament types",
          priority: 1
        });
      }
      if (maxTemp >= 300) {
        reasons.push({
          icon: '✓',
          text: `High temperature capability (${maxTemp}°C)`,
          priority: 2
        });
      }
      if (diameter >= 0.6 && filament?.is_nozzle_abrasive) {
        reasons.push({
          icon: '✓',
          text: "Larger diameter reduces clogging with fiber filaments",
          priority: 3
        });
      }
      if (hotendMaterial.includes('copper')) {
        reasons.push({
          icon: '✓',
          text: "Copper core for excellent heat transfer",
          priority: 4
        });
      }
    } else if (rating === 'orange') {
      reasons.push({
        icon: '⚠',
        text: "Acceptable but will wear faster over time",
        priority: 1
      });
    } else {
      reasons.push({
        icon: '✗',
        text: "Not recommended for this filament type",
        priority: 1
      });
    }
  }
  
  if (accessoryType === 'build_plate') {
    const surfaceType = (specs?.surface_type as string || "").toLowerCase();
    const isPEI = surfaceType.includes('pei');
    const isTextured = surfaceType.includes('textured');
    
    if (rating === 'green') {
      if (isPEI) {
        reasons.push({
          icon: '✓',
          text: `Excellent adhesion for ${material || 'most materials'}`,
          priority: 1
        });
      }
      if (isTextured) {
        reasons.push({
          icon: '✓',
          text: "Easy print removal when cooled",
          priority: 2
        });
        if (material.includes('PETG')) {
          reasons.push({
            icon: '✓',
            text: "No release agent required for PETG",
            priority: 3
          });
        }
      }
      reasons.push({
        icon: '✓',
        text: "No glue stick required for standard use",
        priority: 4
      });
    }
  }
  
  if (accessoryType === 'ams_mmu') {
    const maxColors = specs?.max_colors as number || specs?.filament_slots as number || 0;
    const hasDrying = specs?.drying_capability === true;
    
    if (rating === 'green') {
      if (maxColors > 0) {
        reasons.push({
          icon: '✓',
          text: `Supports up to ${maxColors} colors/materials`,
          priority: 1
        });
      }
      if (hasDrying) {
        reasons.push({
          icon: '✓',
          text: "Built-in filament drying capability",
          priority: 2
        });
      }
      if (filament?.spool_ams_fit) {
        reasons.push({
          icon: '✓',
          text: "This filament's spool fits perfectly in the system",
          priority: 3
        });
      }
    }
  }
  
  // Printer-specific reasons
  if (printer && rating === 'green') {
    reasons.push({
      icon: '✓',
      text: `Designed specifically for your ${printer.model_name}`,
      priority: 5
    });
  }
  
  // Sort by priority
  return reasons.sort((a, b) => a.priority - b.priority);
}

/**
 * Get related/bundle suggestions for an accessory
 */
export function getRelatedItems(accessoryType: string): RelatedItem[] {
  return RELATED_ITEMS[accessoryType] || [];
}

/**
 * Get upgrade requirement when current hardware is insufficient
 */
export interface UpgradeRequirement {
  reason: string;
  currentLimit: string;
  required: string;
  upgradeType: 'hotend' | 'build_plate' | 'enclosure';
  urgency: 'required' | 'recommended' | 'optional';
}

export function checkUpgradeRequirements(
  printer: Printer | null,
  filament: Filament
): UpgradeRequirement[] {
  const upgrades: UpgradeRequirement[] = [];
  
  if (!printer) return upgrades;
  
  const maxNozzleTemp = printer.max_nozzle_temp_c || 260;
  const requiredNozzleTemp = filament.nozzle_temp_max_c || filament.nozzle_temp_sweetspot_c || 0;
  const hasEnclosure = printer.has_enclosure || false;
  const material = (filament.material || "").toUpperCase();
  
  // Temperature upgrade needed
  if (requiredNozzleTemp > maxNozzleTemp) {
    upgrades.push({
      reason: `This material requires ${requiredNozzleTemp}°C but your hotend maxes at ${maxNozzleTemp}°C`,
      currentLimit: `${maxNozzleTemp}°C max`,
      required: `${requiredNozzleTemp}°C needed`,
      upgradeType: 'hotend',
      urgency: 'required'
    });
  }
  
  // Enclosure needed for certain materials
  if (!hasEnclosure && (material.includes('ABS') || material.includes('ASA') || material.includes('PC') || material.includes('NYLON'))) {
    upgrades.push({
      reason: `${material} prints best in an enclosed environment to prevent warping`,
      currentLimit: 'Open frame printer',
      required: 'Enclosure recommended',
      upgradeType: 'enclosure',
      urgency: 'recommended'
    });
  }
  
  // Hardened nozzle for abrasive
  if (filament.is_nozzle_abrasive && !printer.abrasive_materials_supported) {
    upgrades.push({
      reason: 'Abrasive filaments will quickly wear a brass nozzle',
      currentLimit: 'Standard brass nozzle',
      required: 'Hardened steel or ruby nozzle',
      upgradeType: 'hotend',
      urgency: 'required'
    });
  }
  
  return upgrades;
}

/**
 * Filter options for hardware
 */
export interface HardwareFilterOptions {
  materials: string[];
  priceRanges: { label: string; min: number; max: number }[];
  features: { id: string; label: string }[];
  sortOptions: { value: string; label: string }[];
}

export const HARDWARE_FILTER_OPTIONS: Record<string, HardwareFilterOptions> = {
  hotend: {
    materials: ['Brass', 'Stainless Steel', 'Hardened Steel', 'Copper', 'Tungsten', 'Ruby'],
    priceRanges: [
      { label: 'Under $30', min: 0, max: 30 },
      { label: '$30 - $75', min: 30, max: 75 },
      { label: '$75 - $150', min: 75, max: 150 },
      { label: '$150+', min: 150, max: 9999 },
    ],
    features: [
      { id: 'high_flow', label: 'High-flow' },
      { id: 'abrasion_resistant', label: 'Abrasion-resistant' },
      { id: 'quick_swap', label: 'Quick-swap' },
    ],
    sortOptions: [
      { value: 'recommended', label: 'Recommended' },
      { value: 'price_asc', label: 'Price: Low to High' },
      { value: 'price_desc', label: 'Price: High to Low' },
      { value: 'name', label: 'Alphabetical' },
    ],
  },
  build_plate: {
    materials: ['PEI', 'Glass', 'Steel', 'Garolite', 'FR4'],
    priceRanges: [
      { label: 'Under $20', min: 0, max: 20 },
      { label: '$20 - $40', min: 20, max: 40 },
      { label: '$40 - $80', min: 40, max: 80 },
      { label: '$80+', min: 80, max: 9999 },
    ],
    features: [
      { id: 'textured', label: 'Textured surface' },
      { id: 'magnetic', label: 'Magnetic' },
      { id: 'dual_sided', label: 'Dual-sided' },
    ],
    sortOptions: [
      { value: 'recommended', label: 'Recommended' },
      { value: 'price_asc', label: 'Price: Low to High' },
      { value: 'price_desc', label: 'Price: High to Low' },
      { value: 'name', label: 'Alphabetical' },
    ],
  },
  ams_mmu: {
    materials: [],
    priceRanges: [
      { label: 'Under $100', min: 0, max: 100 },
      { label: '$100 - $200', min: 100, max: 200 },
      { label: '$200 - $400', min: 200, max: 400 },
      { label: '$400+', min: 400, max: 9999 },
    ],
    features: [
      { id: 'drying', label: 'Has drying' },
      { id: 'humidity_control', label: 'Humidity control' },
    ],
    sortOptions: [
      { value: 'recommended', label: 'Recommended' },
      { value: 'price_asc', label: 'Price: Low to High' },
      { value: 'price_desc', label: 'Price: High to Low' },
      { value: 'name', label: 'Alphabetical' },
    ],
  },
};

import { MATERIAL_INFO, type MaterialInfo } from '@/lib/materialHierarchy';
import type { MaterialData } from './types';

// Convert text-based properties to numeric scores (1-10 scale)
const PRINTABILITY_SCORES: Record<string, number> = {
  'Easy': 9,
  'Medium': 6,
  'Moderate': 6,
  'Hard': 3,
  'Difficult': 3,
  'Expert': 1,
  'Very Easy': 10,
};

const STRENGTH_SCORES: Record<string, number> = {
  'Low': 2,
  'Medium': 5,
  'Moderate': 5,
  'High': 7,
  'Very High': 9,
  'Excellent': 9,
};

const FLEXIBILITY_SCORES: Record<string, number> = {
  'Rigid': 2,
  'Low': 2,
  'Semi-Flexible': 5,
  'Medium': 5,
  'Moderate': 5,
  'Flexible': 7,
  'High': 7,
  'Very Flexible': 9,
  'Excellent': 9,
};

const HEAT_RESISTANCE_SCORES: Record<string, number> = {
  'Low': 2,
  'Medium': 5,
  'Moderate': 5,
  'High': 7,
  'Very High': 9,
  'Excellent': 10,
};

const SURFACE_FINISH_SCORES: Record<string, number> = {
  'Low': 2,
  'Poor': 2,
  'Medium': 5,
  'Moderate': 5,
  'Good': 7,
  'High': 7,
  'Very High': 9,
  'Excellent': 9,
};

const DURABILITY_SCORES: Record<string, number> = {
  'Low': 2,
  'Medium': 5,
  'Moderate': 5,
  'High': 7,
  'Very High': 9,
  'Excellent': 9,
};

// Price range mapping based on material category
const PRICE_RANGES: Record<string, string> = {
  'PLA': '$15-25/kg',
  'PLA+': '$18-28/kg',
  'PETG': '$18-30/kg',
  'ABS': '$15-25/kg',
  'ASA': '$25-40/kg',
  'TPU': '$25-45/kg',
  'TPE': '$30-50/kg',
  'Nylon': '$35-60/kg',
  'PA': '$35-60/kg',
  'PC': '$35-55/kg',
  'PEEK': '$300-600/kg',
  'PEI': '$150-300/kg',
  'PEKK': '$400-700/kg',
  'PVA': '$40-80/kg',
  'HIPS': '$20-35/kg',
  'PP': '$25-45/kg',
  'CPE': '$30-50/kg',
  'PVB': '$35-55/kg',
  'Wood': '$25-45/kg',
};

// Best use cases for materials
const MATERIAL_BEST_FOR: Record<string, string[]> = {
  'PLA': ['Prototypes', 'Decorative items', 'Low-stress parts', 'Beginners'],
  'PLA+': ['Functional prototypes', 'Improved durability', 'General use'],
  'PETG': ['Mechanical parts', 'Outdoor use', 'Food containers', 'Chemical resistance'],
  'ABS': ['Functional parts', 'Heat-resistant items', 'Automotive', 'Post-processing'],
  'ASA': ['Outdoor parts', 'UV exposure', 'Automotive', 'Weather resistance'],
  'TPU': ['Flexible parts', 'Phone cases', 'Gaskets', 'Wearables'],
  'TPE': ['Soft touch parts', 'Flexible hinges', 'Grips'],
  'Nylon': ['Gears', 'Bearings', 'High-stress parts', 'Wear resistance'],
  'PA': ['Engineering parts', 'High strength', 'Chemical resistance'],
  'PC': ['Transparent parts', 'High impact', 'Heat resistance', 'Structural'],
  'PEEK': ['Aerospace', 'Medical implants', 'Extreme conditions'],
  'PEI': ['Aerospace', 'High temp applications', 'Chemical resistance'],
  'PEKK': ['Aerospace', 'Industrial', 'Extreme performance'],
  'PVA': ['Support material', 'Water-soluble', 'Complex geometries'],
  'HIPS': ['Support material', 'Prototypes', 'Packaging'],
  'PP': ['Living hinges', 'Chemical containers', 'Food safe'],
  'CPE': ['Chemical resistance', 'Clarity', 'Toughness'],
  'PVB': ['Transparent parts', 'Post-processing', 'Smooth finish'],
  'Wood': ['Decorative', 'Aesthetic parts', 'Wood-like finish'],
};

// Things to avoid for materials
const MATERIAL_AVOID_FOR: Record<string, string[]> = {
  'PLA': ['High heat', 'Outdoor use', 'Mechanical stress', 'Food contact (hot)'],
  'PLA+': ['High heat', 'Prolonged outdoor use'],
  'PETG': ['Tight tolerances', 'Fine details', 'Stringing-sensitive parts'],
  'ABS': ['Unventilated areas', 'Biodegradable needs', 'Cold environments'],
  'ASA': ['Indoor-only projects', 'Cost-sensitive', 'Beginners'],
  'TPU': ['Rigid parts', 'High precision', 'Fast printing'],
  'TPE': ['Structural parts', 'High temp', 'Dimensional accuracy'],
  'Nylon': ['Moisture-sensitive apps', 'No enclosure', 'Beginners'],
  'PA': ['Humidity exposure', 'Simple parts', 'Budget projects'],
  'PC': ['Easy printing', 'No enclosure', 'Low-temp printers'],
  'PEEK': ['Budget projects', 'Standard printers', 'Beginners'],
  'PEI': ['Cost-sensitive', 'Standard equipment', 'Quick prototypes'],
  'PEKK': ['Budget constraints', 'Standard printers', 'Simple parts'],
  'PVA': ['Structural parts', 'Primary material', 'Dry storage issues'],
  'HIPS': ['Structural parts', 'Outdoor use', 'Chemical exposure'],
  'PP': ['High precision', 'Adhesion-critical', 'Fine details'],
  'CPE': ['Budget projects', 'Simple parts', 'High temp'],
  'PVB': ['Structural parts', 'Outdoor use', 'Cost-sensitive'],
  'Wood': ['Mechanical parts', 'Precision', 'Durability needs'],
};

function getScoreFromText(text: string | undefined, scoreMap: Record<string, number>, defaultScore: number = 5): number {
  if (!text) return defaultScore;
  const normalizedText = text.trim();
  return scoreMap[normalizedText] ?? defaultScore;
}

function getPrintDifficulty(printability: string | undefined): 'easy' | 'moderate' | 'advanced' {
  const score = getScoreFromText(printability, PRINTABILITY_SCORES, 5);
  if (score >= 7) return 'easy';
  if (score >= 4) return 'moderate';
  return 'advanced';
}

function getMaterialType(materialName: string): string {
  // Extract base material type from name
  const upperName = materialName.toUpperCase();
  
  if (upperName.includes('PLA+') || upperName.includes('PLA PLUS')) return 'PLA+';
  if (upperName.includes('PLA')) return 'PLA';
  if (upperName.includes('PETG')) return 'PETG';
  if (upperName.includes('ABS')) return 'ABS';
  if (upperName.includes('ASA')) return 'ASA';
  if (upperName.includes('TPU')) return 'TPU';
  if (upperName.includes('TPE')) return 'TPE';
  if (upperName.includes('NYLON') || upperName.includes('PA-')) return 'Nylon';
  if (upperName.includes('PC') || upperName.includes('POLYCARBONATE')) return 'PC';
  if (upperName.includes('PEEK')) return 'PEEK';
  if (upperName.includes('PEI') || upperName.includes('ULTEM')) return 'PEI';
  if (upperName.includes('PEKK')) return 'PEKK';
  if (upperName.includes('PVA')) return 'PVA';
  if (upperName.includes('HIPS')) return 'HIPS';
  if (upperName.includes('PP') || upperName.includes('POLYPROPYLENE')) return 'PP';
  if (upperName.includes('CPE')) return 'CPE';
  if (upperName.includes('PVB')) return 'PVB';
  if (upperName.includes('WOOD')) return 'Wood';
  
  return materialName;
}

export function getMaterialDataFromType(materialType: string): MaterialData | null {
  const info = MATERIAL_INFO[materialType];
  if (!info) return null;
  
  const type = getMaterialType(materialType);
  
  // Derive surface finish and durability from strength (since MaterialInfo doesn't have these)
  const strengthScore = getScoreFromText(info.properties?.strength, STRENGTH_SCORES);
  const printabilityScore = getScoreFromText(info.properties?.printability, PRINTABILITY_SCORES);
  
  // Surface finish correlates with ease of printing
  const surfaceFinishScore = Math.round((printabilityScore + 5) / 2);
  // Durability correlates with strength
  const durabilityScore = strengthScore;
  
  // Determine food safety based on material type
  const foodSafeMaterials = ['PP', 'PETG', 'PLA'];
  const isFoodSafe = foodSafeMaterials.includes(type);
  
  return {
    type: materialType,
    name: info.name || materialType,
    properties: {
      strength: strengthScore,
      flexibility: getScoreFromText(info.properties?.flexibility, FLEXIBILITY_SCORES),
      heatResistance: getScoreFromText(info.properties?.heatResistance, HEAT_RESISTANCE_SCORES),
      easeOfPrint: printabilityScore,
      surfaceFinish: surfaceFinishScore,
      durability: durabilityScore,
      foodSafe: isFoodSafe,
    },
    bestFor: MATERIAL_BEST_FOR[type] || info.useCases || [],
    avoidFor: MATERIAL_AVOID_FOR[type] || [],
    priceRange: PRICE_RANGES[type] || '$20-40/kg',
    printDifficulty: getPrintDifficulty(info.properties?.printability),
  };
}

export function getAllMaterialsAsData(): MaterialData[] {
  const materials: MaterialData[] = [];
  const seenTypes = new Set<string>();
  
  // Get unique material types
  const priorityMaterials = ['PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'PC', 'PEEK', 'PEI', 'PVA', 'HIPS', 'PP', 'CPE', 'Wood'];
  
  for (const type of priorityMaterials) {
    if (MATERIAL_INFO[type] && !seenTypes.has(type)) {
      const data = getMaterialDataFromType(type);
      if (data) {
        materials.push(data);
        seenTypes.add(type);
      }
    }
  }
  
  // Add any remaining materials from MATERIAL_INFO
  for (const key of Object.keys(MATERIAL_INFO)) {
    if (!seenTypes.has(key)) {
      const data = getMaterialDataFromType(key);
      if (data) {
        materials.push(data);
        seenTypes.add(key);
      }
    }
  }
  
  return materials;
}

export function getMaterialRecommendedSettings(materialType: string): {
  nozzleTemp: [number, number];
  bedTemp: [number, number];
  printSpeed: [number, number];
  coolingFan: [number, number];
} {
  // Default recommended settings by material type
  const settings: Record<string, { nozzleTemp: [number, number]; bedTemp: [number, number]; printSpeed: [number, number]; coolingFan: [number, number] }> = {
    'PLA': { nozzleTemp: [190, 220], bedTemp: [50, 70], printSpeed: [40, 80], coolingFan: [80, 100] },
    'PLA+': { nozzleTemp: [200, 230], bedTemp: [55, 70], printSpeed: [40, 70], coolingFan: [70, 100] },
    'PETG': { nozzleTemp: [220, 250], bedTemp: [70, 85], printSpeed: [30, 60], coolingFan: [30, 60] },
    'ABS': { nozzleTemp: [230, 260], bedTemp: [90, 110], printSpeed: [40, 60], coolingFan: [0, 30] },
    'ASA': { nozzleTemp: [240, 260], bedTemp: [90, 110], printSpeed: [40, 60], coolingFan: [0, 30] },
    'TPU': { nozzleTemp: [210, 240], bedTemp: [40, 60], printSpeed: [15, 35], coolingFan: [50, 80] },
    'TPE': { nozzleTemp: [200, 230], bedTemp: [30, 50], printSpeed: [15, 30], coolingFan: [50, 80] },
    'Nylon': { nozzleTemp: [240, 280], bedTemp: [70, 90], printSpeed: [30, 50], coolingFan: [0, 30] },
    'PA': { nozzleTemp: [250, 280], bedTemp: [80, 100], printSpeed: [30, 50], coolingFan: [0, 20] },
    'PC': { nozzleTemp: [260, 300], bedTemp: [100, 120], printSpeed: [30, 50], coolingFan: [0, 20] },
    'PEEK': { nozzleTemp: [380, 420], bedTemp: [120, 160], printSpeed: [20, 40], coolingFan: [0, 10] },
    'PEI': { nozzleTemp: [340, 380], bedTemp: [120, 150], printSpeed: [20, 40], coolingFan: [0, 10] },
    'PEKK': { nozzleTemp: [360, 400], bedTemp: [120, 160], printSpeed: [20, 40], coolingFan: [0, 10] },
    'PVA': { nozzleTemp: [180, 210], bedTemp: [45, 60], printSpeed: [20, 40], coolingFan: [80, 100] },
    'HIPS': { nozzleTemp: [220, 250], bedTemp: [90, 110], printSpeed: [40, 60], coolingFan: [20, 50] },
    'PP': { nozzleTemp: [220, 250], bedTemp: [80, 100], printSpeed: [30, 50], coolingFan: [20, 50] },
    'CPE': { nozzleTemp: [240, 270], bedTemp: [70, 90], printSpeed: [30, 50], coolingFan: [30, 60] },
    'PVB': { nozzleTemp: [200, 230], bedTemp: [50, 70], printSpeed: [30, 50], coolingFan: [50, 80] },
    'Wood': { nozzleTemp: [180, 220], bedTemp: [50, 70], printSpeed: [30, 50], coolingFan: [80, 100] },
  };
  
  const type = getMaterialType(materialType);
  return settings[type] || settings['PLA'];
}

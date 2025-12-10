// Material hierarchy for organizing filaments into logical categories

export interface MaterialCategory {
  id: string;
  name: string;
  description: string;
  materials: string[];
  icon?: string;
}

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    id: 'pla-family',
    name: 'PLA Family',
    description: 'Beginner-friendly, biodegradable materials',
    materials: [
      'PLA',
      'PLA+',
      'PLA+ 2.0',
      'PLA-Basic',
      'PLA-CF',
      'PLA-Wood',
      'PLA-Marble',
      'PLA-Silk',
      'PLA-Matte',
      'PLA-Metal',
      'PLA-Glow',
      'PLA-Stone',
      'PLA-Galaxy',
      'PLA-Conductive',
      'PLA Blend',
      'PLA/PHA',
      'PLA UV',
      'PLA Temp',
      'PLA Meta',
      'PLA Iridescent',
      'HTPLA',
      'HTPLA-CF',
      'FlexPLA',
      'LW-PLA',
      'LW-PLA-HT',
      'rPLA',
      'Standard PLA+',
      'Silk PLA+',
    ],
  },
  {
    id: 'petg-family',
    name: 'PETG Family',
    description: 'Durable, chemical-resistant, easy to print',
    materials: [
      'PETG',
      'PETG-CF',
      'PETG Iridescent',
      'Pro PETG',
      'rPETG',
      'ESD-PETG',
    ],
  },
  {
    id: 'abs-family',
    name: 'ABS Family',
    description: 'Heat-resistant, strong, requires enclosure',
    materials: [
      'ABS',
      'ABS+',
      'ABS-CF',
      'ABS-GF',
      'ABS HT',
      'ESD-ABS',
      'FR-ABS',
    ],
  },
  {
    id: 'asa-family',
    name: 'ASA Family',
    description: 'UV-resistant, outdoor-suitable ABS alternative',
    materials: [
      'ASA',
      'ASA+',
      'ASA-CF',
      'ASA-GF',
      'LW-ASA',
    ],
  },
  {
    id: 'flexible',
    name: 'Flexible/TPU',
    description: 'Rubber-like, flexible materials',
    materials: [
      'TPU',
      'TPU-CF',
      'TPE',
      'TPC',
      'PEBA',
      'PEBA 85A',
      'PEBA 95A',
      'PEBA Air',
    ],
  },
  {
    id: 'nylon-family',
    name: 'Nylon/PA Family',
    description: 'Strong, wear-resistant engineering materials',
    materials: [
      'Nylon',
      'Nylon-CF',
      'Nylon-GF',
      'Nylon-AF',
      'NylonG',
      'NylonX',
    ],
  },
  {
    id: 'polycarbonate',
    name: 'Polycarbonate',
    description: 'High-strength, high-temperature engineering plastic',
    materials: [
      'PC',
      'PC-CF',
      'PC-FR',
      'PC-ABS',
      'PC-PBT',
      'PC Blend',
      'PC Pro',
      'ESD-PC',
      'ezPC',
    ],
  },
  {
    id: 'high-performance',
    name: 'High Performance',
    description: 'Industrial-grade, extreme temperature materials',
    materials: [
      'PEEK',
      'PEEK-CF',
      'PEKK',
      'PEKK-CF',
      'PEKK-A',
      'PEI',
      'PEI-CF',
      'PEI 1010',
      'PEI 9085',
      'ESD-PEI',
      'ESD-PEKK',
      'PPS',
      'PPS-CF',
      'PPSU',
      'PSU',
    ],
  },
  {
    id: 'copolyester',
    name: 'Copolyester',
    description: 'Enhanced PETG variants with improved properties',
    materials: [
      'CPE',
      'CPE+',
      'CPE-CF',
      'Pro PCTG',
      'CoPoly-CF',
      'CoPoly-HT',
      'CoPoly-nGen',
      'CoPoly-XT',
    ],
  },
  {
    id: 'pet-family',
    name: 'PET Family',
    description: 'Food-safe compatible polyester materials',
    materials: [
      'PET',
      'PET-CF',
      'PET-GF',
    ],
  },
  {
    id: 'polypropylene',
    name: 'Polypropylene',
    description: 'Chemical-resistant, fatigue-resistant',
    materials: [
      'PP',
      'PP-CF',
      'PP-GF',
      'PPA',
      'PPA-CF',
      'PPA-GF',
    ],
  },
  {
    id: 'support-materials',
    name: 'Support Materials',
    description: 'Water-soluble and breakaway supports',
    materials: [
      'PVA',
      'PVB',
      'HIPS',
      'Breakaway',
    ],
  },
  {
    id: 'specialty',
    name: 'Specialty',
    description: 'Unique materials for specific applications',
    materials: [
      'PVC',
      'allPHA',
      'Carbon Fiber',
      'Cleaning',
      'SimuBone',
      'Ryno',
      'Wood PLA',
    ],
  },
];

// Flat map of material to category for quick lookup
export const MATERIAL_TO_CATEGORY: Record<string, string> = {};
MATERIAL_CATEGORIES.forEach(category => {
  category.materials.forEach(material => {
    MATERIAL_TO_CATEGORY[material] = category.id;
  });
});

/**
 * Get the category for a given material
 */
export function getMaterialCategory(material: string): MaterialCategory | undefined {
  const categoryId = MATERIAL_TO_CATEGORY[material];
  if (!categoryId) return undefined;
  return MATERIAL_CATEGORIES.find(c => c.id === categoryId);
}

/**
 * Get all materials in a category
 */
export function getMaterialsInCategory(categoryId: string): string[] {
  const category = MATERIAL_CATEGORIES.find(c => c.id === categoryId);
  return category?.materials || [];
}

/**
 * Check if a material belongs to a category
 */
export function isMaterialInCategory(material: string, categoryId: string): boolean {
  return MATERIAL_TO_CATEGORY[material] === categoryId;
}

/**
 * Get category display info for UI
 */
export function getCategoryDisplayInfo(categoryId: string): { name: string; description: string } | undefined {
  const category = MATERIAL_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return undefined;
  return { name: category.name, description: category.description };
}

/**
 * Group materials by their categories
 */
export function groupMaterialsByCategory(materials: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  materials.forEach(material => {
    const categoryId = MATERIAL_TO_CATEGORY[material] || 'other';
    if (!grouped[categoryId]) {
      grouped[categoryId] = [];
    }
    grouped[categoryId].push(material);
  });
  
  return grouped;
}

/**
 * Get core/primary materials for quick filtering
 */
export const CORE_MATERIAL_CATEGORIES = [
  'pla-family',
  'petg-family',
  'abs-family',
  'asa-family',
  'flexible',
  'nylon-family',
  'polycarbonate',
] as const;

/**
 * Get engineering materials for advanced filtering
 */
export const ENGINEERING_CATEGORIES = [
  'nylon-family',
  'polycarbonate',
  'high-performance',
  'copolyester',
  'polypropylene',
] as const;

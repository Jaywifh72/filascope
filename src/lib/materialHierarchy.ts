// Material hierarchy for organizing filaments into logical categories

export interface MaterialCategory {
  id: string;
  name: string;
  description: string;
  materials: string[];
  icon?: string;
}

export interface MaterialRequirements {
  minNozzleTemp?: number;
  maxNozzleTemp?: number;
  minBedTemp?: number;
  maxBedTemp?: number;
  needsEnclosure?: boolean;
  isAbrasive?: boolean;
  needsDirectDrive?: boolean;
}

export interface MaterialInfo {
  name: string;
  category: string;
  description: string;
  properties: {
    printability: 'Easy' | 'Medium' | 'Hard' | 'Expert';
    strength: 'Low' | 'Medium' | 'High' | 'Very High';
    flexibility: 'Rigid' | 'Semi-Flexible' | 'Flexible' | 'Very Flexible';
    heatResistance: 'Low' | 'Medium' | 'High' | 'Very High';
  };
  useCases: string[];
  requirements?: string[];
  specs?: MaterialRequirements;
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
      'PLA-MARBLE',
      'PLA-Silk',
      'PLA-SILK',
      'PLA-Matte',
      'PLA-MATTE',
      'PLA-Metal',
      'PLA-Glow',
      'PLA-GLOW',
      'PLA-Stone',
      'PLA-Galaxy',
      'PLA-Conductive',
      'PLA-Blend',
      'PLA/PHA',
      'PLA-UV',
      'PLA-Temp',
      'PLA-Meta',
      'PLA-Iridescent',
      'PLA-Starlight',
      'PLA-Tough',
      'PLA-HS',
      'PLA-HT',
      'PLA-HP',
      'HTPLA',
      'HTPLA-CF',
      'FlexPLA',
      'LW-PLA',
      'LW-PLA-HT',
      'rPLA',
      'r-PLA',
      'Standard PLA+',
      'EasyPrint PLA',
      'Silk PLA+',
      'PLA Premium',
      'PLA Pro',
      'PLA Economy',
      'PLA High Speed Pro',
      'Premium PLA High Speed',
      'PLA Hi-Flow Pro',
      'PLA Silk',
      'PLA SILK',
      'PLA Magic SILK',
      'PLA SILK Rainbow',
      'PLA Matte',
      'PLA Matte Dual-Color',
      'PLA Glow',
      'PLA Glow in the Dark',
      'PLA Glitter',
      'PLA Galaxy',
      'PLA Crystal',
      'PLA Marble',
      'PLA Metal',
      'PLA Carbon',
      'PLA Stone Age',
      'PLA Thermoactive',
      'Pastello PLA',
      'The Filament PLA',
      'The Filament PLA HS',
      'The Filament PLA CF',
      'AquaPrint PLA',
      'Bio-PLA',
      'SafeGuard PLA',
      'FlameGuard PLA',
      'ESD-PLA',
    ],
  },
  {
    id: 'petg-family',
    name: 'PETG Family',
    description: 'Durable, chemical-resistant, easy to print',
    materials: [
      'PETG',
      'PETG+',
      'PETG-CF',
      'PETG-GF',
      'PETG-HS',
      'PETG-TRANSLUCENT',
      'PETG Iridescent',
      'Pro PETG',
      'rPETG',
      'ESD-PETG',
      'PET-G',
      'PET-G Premium',
      'PET-G Premium High Speed',
      'PETG Economy',
      'PET-G Glow in the Dark',
      'PET-G FR V0',
      'The Filament PETG',
      'The Filament PETG CF',
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
      'ABS-HT',
      'ABS-HS',
      'ABS-R',
      'ABS-ESD',
      'ABS-PC',
      'ABS-CF-Core',
      'ABS Medical',
      'Easy ABS',
      'Smart ABS',
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
      'ASA 275',
      'ASA Kevlar',
      'ASA-X CF10',
      'ASA-X GF10',
      'LW-ASA',
      'FlameGuard ASA 275',
    ],
  },
  {
    id: 'flexible',
    name: 'Flexible/TPU',
    description: 'Rubber-like, flexible materials',
    materials: [
      'TPU',
      'TPU 95A',
      'TPU 85A',
      'TPU 75A',
      'TPU-CF',
      'TPU-30D',
      'TPU-40D',
      'TPU-60A',
      'TPU-64D',
      'TPU-70A',
      'TPU-75A',
      'TPU-75D',
      'TPU-82A',
      'TPU-85A',
      'TPU-88A',
      'TPU-90A',
      'TPU-92A',
      'TPU-98A',
      'TPU-FOAM',
      'TPU-95A-FOAM',
      'TPU-Bio',
      'TPU-SEBS',
      'ESD-TPU',
      'TPE',
      'TPE-E',
      'TPE-90A',
      'TPE-96A',
      'TPC',
      'PEBA',
      'PEBA 85A',
      'PEBA 95A',
      'PEBA Air',
      'PEBA-85A',
      'PEBA-95A',
      'PEBA-FOAM',
      'S-Flex 85A',
      'S-Flex 90A',
      'S-Flex 98A',
    ],
  },
  {
    id: 'nylon-family',
    name: 'Nylon/PA Family',
    description: 'Strong, wear-resistant engineering materials',
    materials: [
      'Nylon',
      'PA',
      'PA6',
      'PA12',
      'PA-CF',
      'PA-GF',
      'PA-AF',
      'PA6-CF',
      'PA6-GF',
      'PA6 Neat',
      'PA6-66',
      'PA6-Wear',
      'PA6 CF15',
      'PA6 CS20 FR V0',
      'PA11-CF',
      'PA12-CF',
      'PA12-GF',
      'PA12 CF15',
      'PA612-CF',
      'PAHT-CF',
      'Nylon PA6 Low Warp',
      'Nylon-CF',
      'Nylon-GF',
      'Nylon-AF',
      'NylonG',
      'NylonX',
      'TPA',
      'ESD-PA12',
      'ThermaTech PA',
      'PPA',
      'PPA-CF',
      'PPA-GF',
      'PPA-CF-Core',
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
      'PC-275',
      'PC PTFE',
      'PC-ABS-FR',
      'PC-PBT-GF',
      'PC+PBT',
      'FR-PC',
      'FR-PC-ABS',
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
      'PEI-1010',
      'PEI-9085',
      'ESD-PEI',
      'ESD-PEI-1010',
      'ESD-PEKK',
      'PPS',
      'PPS-CF',
      'PPSU',
      'PSU',
      'PES',
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
      'PCTG',
      'PCTG Premium',
      'PCTG CF10',
      'PCTG GF10',
      'Pro PCTG',
      'Copolyester',
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
    id: 'bio-materials',
    name: 'Bio-Based',
    description: 'Environmentally friendly and biodegradable materials',
    materials: [
      'BIO',
      'BIO-CF',
      'PHA',
      'allPHA',
      'PCL',
    ],
  },
  {
    id: 'engineering-polymers',
    name: 'Engineering Polymers',
    description: 'Specialized engineering materials for demanding applications',
    materials: [
      'POM',
      'PMMA',
      'HDPE',
      'HTN',
      'HTS',
      'MTS',
    ],
  },
  {
    id: 'specialty',
    name: 'Specialty',
    description: 'Unique materials for specific applications',
    materials: [
      'PVC',
      'Carbon Fiber',
      'Cleaning',
      'SimuBone',
      'Ryno',
      'Wood PLA',
    ],
  },
];

// Material information with properties and use cases
export const MATERIAL_INFO: Record<string, MaterialInfo> = {
  // PLA Family
  'PLA': {
    name: 'PLA',
    category: 'pla-family',
    description: 'Polylactic acid - the most popular 3D printing material. Biodegradable, easy to print.',
    properties: { printability: 'Easy', strength: 'Medium', flexibility: 'Rigid', heatResistance: 'Low' },
    useCases: ['Prototypes', 'Decorative items', 'Low-stress parts', 'Beginner projects'],
  },
  'PLA+': {
    name: 'PLA+',
    category: 'pla-family',
    description: 'Enhanced PLA with improved strength and layer adhesion.',
    properties: { printability: 'Easy', strength: 'Medium', flexibility: 'Rigid', heatResistance: 'Low' },
    useCases: ['Functional prototypes', 'Mechanical parts', 'Improved durability needs'],
  },
  'PLA-CF': {
    name: 'PLA-CF',
    category: 'pla-family',
    description: 'Carbon fiber reinforced PLA for increased stiffness and reduced weight.',
    properties: { printability: 'Medium', strength: 'High', flexibility: 'Rigid', heatResistance: 'Low' },
    useCases: ['RC parts', 'Drone frames', 'Lightweight structural parts'],
    requirements: ['Hardened nozzle recommended'],
  },
  'PLA-Wood': {
    name: 'PLA-Wood',
    category: 'pla-family',
    description: 'Wood-filled PLA for a natural wood-like appearance and texture.',
    properties: { printability: 'Medium', strength: 'Low', flexibility: 'Rigid', heatResistance: 'Low' },
    useCases: ['Decorative items', 'Art projects', 'Wood-look finishes'],
  },
  'PLA-Silk': {
    name: 'PLA-Silk',
    category: 'pla-family',
    description: 'Shiny, silk-like finish PLA for aesthetic prints.',
    properties: { printability: 'Easy', strength: 'Medium', flexibility: 'Rigid', heatResistance: 'Low' },
    useCases: ['Display pieces', 'Decorative prints', 'Gifts'],
  },
  'PLA-Glow': {
    name: 'PLA-Glow',
    category: 'pla-family',
    description: 'Glow-in-the-dark PLA with phosphorescent additives.',
    properties: { printability: 'Medium', strength: 'Medium', flexibility: 'Rigid', heatResistance: 'Low' },
    useCases: ['Night visibility items', 'Toys', 'Decorative pieces'],
    requirements: ['Hardened nozzle recommended'],
  },
  'HTPLA': {
    name: 'HTPLA',
    category: 'pla-family',
    description: 'High-temperature PLA that can be heat-treated for improved thermal resistance.',
    properties: { printability: 'Easy', strength: 'Medium', flexibility: 'Rigid', heatResistance: 'Medium' },
    useCases: ['Heat-resistant parts', 'Automotive interior', 'Functional parts'],
    requirements: ['Annealing required for heat resistance'],
  },
  
  // PETG Family
  'PETG': {
    name: 'PETG',
    category: 'petg-family',
    description: 'Glycol-modified PET - excellent balance of printability, strength, and chemical resistance.',
    properties: { printability: 'Easy', strength: 'High', flexibility: 'Semi-Flexible', heatResistance: 'Medium' },
    useCases: ['Functional parts', 'Food containers', 'Outdoor use', 'Mechanical parts'],
  },
  'PETG-CF': {
    name: 'PETG-CF',
    category: 'petg-family',
    description: 'Carbon fiber reinforced PETG for enhanced stiffness and dimensional stability.',
    properties: { printability: 'Medium', strength: 'Very High', flexibility: 'Rigid', heatResistance: 'Medium' },
    useCases: ['Structural parts', 'Tool handles', 'High-stress applications'],
    requirements: ['Hardened nozzle required'],
  },
  'Pro PETG': {
    name: 'Pro PETG',
    category: 'petg-family',
    description: 'Professional-grade PETG with improved clarity and layer adhesion.',
    properties: { printability: 'Easy', strength: 'High', flexibility: 'Semi-Flexible', heatResistance: 'Medium' },
    useCases: ['Production parts', 'Clear containers', 'Professional prototypes'],
  },
  
  // ABS Family
  'ABS': {
    name: 'ABS',
    category: 'abs-family',
    description: 'Acrylonitrile Butadiene Styrene - strong, heat-resistant, widely used in industry.',
    properties: { printability: 'Hard', strength: 'High', flexibility: 'Semi-Flexible', heatResistance: 'High' },
    useCases: ['Automotive parts', 'Electronics housings', 'Functional prototypes'],
    requirements: ['Enclosed printer recommended', 'Heated bed required'],
  },
  'ABS-CF': {
    name: 'ABS-CF',
    category: 'abs-family',
    description: 'Carbon fiber reinforced ABS for maximum stiffness and heat resistance.',
    properties: { printability: 'Hard', strength: 'Very High', flexibility: 'Rigid', heatResistance: 'High' },
    useCases: ['High-performance parts', 'Automotive', 'Aerospace prototypes'],
    requirements: ['Hardened nozzle required', 'Enclosure required'],
  },
  
  // ASA Family
  'ASA': {
    name: 'ASA',
    category: 'asa-family',
    description: 'Acrylonitrile Styrene Acrylate - UV-resistant alternative to ABS for outdoor use.',
    properties: { printability: 'Medium', strength: 'High', flexibility: 'Semi-Flexible', heatResistance: 'High' },
    useCases: ['Outdoor parts', 'Automotive exterior', 'Weather-exposed items'],
    requirements: ['Enclosed printer recommended'],
  },
  'ASA-CF': {
    name: 'ASA-CF',
    category: 'asa-family',
    description: 'Carbon fiber reinforced ASA for outdoor structural applications.',
    properties: { printability: 'Hard', strength: 'Very High', flexibility: 'Rigid', heatResistance: 'High' },
    useCases: ['Outdoor structural parts', 'Automotive', 'Drone frames'],
    requirements: ['Hardened nozzle required', 'Enclosure required'],
  },
  
  // Flexible
  'TPU': {
    name: 'TPU',
    category: 'flexible',
    description: 'Thermoplastic Polyurethane - flexible, rubber-like material with excellent abrasion resistance.',
    properties: { printability: 'Medium', strength: 'High', flexibility: 'Flexible', heatResistance: 'Medium' },
    useCases: ['Phone cases', 'Gaskets', 'Shoe soles', 'Flexible hinges'],
    requirements: ['Direct drive extruder recommended', 'Slow print speeds'],
  },
  'TPE': {
    name: 'TPE',
    category: 'flexible',
    description: 'Thermoplastic Elastomer - softer and more flexible than TPU.',
    properties: { printability: 'Hard', strength: 'Medium', flexibility: 'Very Flexible', heatResistance: 'Low' },
    useCases: ['Soft grips', 'Seals', 'Flexible parts'],
    requirements: ['Direct drive extruder required'],
  },
  'PEBA': {
    name: 'PEBA',
    category: 'flexible',
    description: 'Polyether Block Amide - premium flexible material with excellent recovery.',
    properties: { printability: 'Hard', strength: 'High', flexibility: 'Flexible', heatResistance: 'Medium' },
    useCases: ['Athletic footwear', 'Medical devices', 'High-performance flexible parts'],
  },
  
  // Nylon Family
  'Nylon': {
    name: 'Nylon',
    category: 'nylon-family',
    description: 'Polyamide - strong, wear-resistant engineering plastic with excellent durability.',
    properties: { printability: 'Hard', strength: 'Very High', flexibility: 'Semi-Flexible', heatResistance: 'High' },
    useCases: ['Gears', 'Bearings', 'Hinges', 'Functional mechanical parts'],
    requirements: ['Dry storage required', 'Enclosure recommended'],
  },
  'Nylon-CF': {
    name: 'Nylon-CF',
    category: 'nylon-family',
    description: 'Carbon fiber reinforced Nylon for maximum strength and dimensional stability.',
    properties: { printability: 'Hard', strength: 'Very High', flexibility: 'Rigid', heatResistance: 'High' },
    useCases: ['Load-bearing parts', 'Jigs and fixtures', 'End-use parts'],
    requirements: ['Hardened nozzle required', 'Dry storage essential'],
  },
  'Nylon-GF': {
    name: 'Nylon-GF',
    category: 'nylon-family',
    description: 'Glass fiber reinforced Nylon for improved stiffness at lower cost.',
    properties: { printability: 'Hard', strength: 'Very High', flexibility: 'Rigid', heatResistance: 'High' },
    useCases: ['Industrial parts', 'Structural components', 'Cost-effective reinforced parts'],
    requirements: ['Hardened nozzle required'],
  },
  
  // Polycarbonate
  'PC': {
    name: 'PC',
    category: 'polycarbonate',
    description: 'Polycarbonate - extremely strong and heat-resistant engineering thermoplastic.',
    properties: { printability: 'Expert', strength: 'Very High', flexibility: 'Semi-Flexible', heatResistance: 'Very High' },
    useCases: ['Impact-resistant parts', 'High-temp applications', 'Safety equipment'],
    requirements: ['High-temp hotend', 'Enclosure required', '110°C+ bed'],
  },
  'PC-CF': {
    name: 'PC-CF',
    category: 'polycarbonate',
    description: 'Carbon fiber reinforced Polycarbonate for ultimate performance.',
    properties: { printability: 'Expert', strength: 'Very High', flexibility: 'Rigid', heatResistance: 'Very High' },
    useCases: ['Aerospace', 'Automotive', 'High-performance tooling'],
    requirements: ['Hardened nozzle required', 'All-metal hotend', 'Enclosure required'],
  },
  'PC-ABS': {
    name: 'PC-ABS',
    category: 'polycarbonate',
    description: 'Polycarbonate-ABS blend combining strength of PC with printability of ABS.',
    properties: { printability: 'Hard', strength: 'Very High', flexibility: 'Semi-Flexible', heatResistance: 'High' },
    useCases: ['Automotive interior', 'Electronics housings', 'Functional prototypes'],
    requirements: ['Enclosure recommended'],
  },
  
  // High Performance
  'PEEK': {
    name: 'PEEK',
    category: 'high-performance',
    description: 'Polyether Ether Ketone - premium industrial polymer with exceptional properties.',
    properties: { printability: 'Expert', strength: 'Very High', flexibility: 'Rigid', heatResistance: 'Very High' },
    useCases: ['Aerospace', 'Medical implants', 'High-temp industrial parts'],
    requirements: ['400°C+ hotend', 'Heated chamber required', 'Special equipment'],
  },
  'PEI': {
    name: 'PEI',
    category: 'high-performance',
    description: 'Polyetherimide (Ultem) - high-performance thermoplastic for demanding applications.',
    properties: { printability: 'Expert', strength: 'Very High', flexibility: 'Rigid', heatResistance: 'Very High' },
    useCases: ['Aerospace components', 'Automotive under-hood', 'Medical devices'],
    requirements: ['High-temp printer required', 'Heated chamber'],
  },
  
  // Copolyester
  'CPE': {
    name: 'CPE',
    category: 'copolyester',
    description: 'Copolyester - enhanced PETG with improved chemical resistance and clarity.',
    properties: { printability: 'Easy', strength: 'High', flexibility: 'Semi-Flexible', heatResistance: 'Medium' },
    useCases: ['Clear parts', 'Chemical containers', 'Professional prototypes'],
  },
  'Pro PCTG': {
    name: 'Pro PCTG',
    category: 'copolyester',
    description: 'Professional PCTG copolyester with excellent impact resistance and clarity.',
    properties: { printability: 'Easy', strength: 'High', flexibility: 'Semi-Flexible', heatResistance: 'Medium' },
    useCases: ['Impact-resistant parts', 'Clear containers', 'Food-safe applications'],
  },
  
  // Polypropylene
  'PP': {
    name: 'PP',
    category: 'polypropylene',
    description: 'Polypropylene - chemical-resistant, fatigue-resistant with living hinge capability.',
    properties: { printability: 'Hard', strength: 'Medium', flexibility: 'Semi-Flexible', heatResistance: 'Medium' },
    useCases: ['Living hinges', 'Chemical containers', 'Food packaging'],
    requirements: ['PP-specific bed adhesion solution'],
  },
  
  // Support Materials
  'PVA': {
    name: 'PVA',
    category: 'support-materials',
    description: 'Polyvinyl Alcohol - water-soluble support material for complex geometries.',
    properties: { printability: 'Medium', strength: 'Low', flexibility: 'Rigid', heatResistance: 'Low' },
    useCases: ['Dissolvable supports', 'Complex overhangs', 'Multi-material printing'],
    requirements: ['Dry storage essential', 'Dual extrusion printer'],
  },
  'HIPS': {
    name: 'HIPS',
    category: 'support-materials',
    description: 'High Impact Polystyrene - limonene-soluble support for ABS prints.',
    properties: { printability: 'Medium', strength: 'Low', flexibility: 'Rigid', heatResistance: 'Low' },
    useCases: ['Supports for ABS', 'Complex geometries'],
    requirements: ['Dual extrusion printer', 'Limonene for dissolving'],
  },
};

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
 * Get detailed info for a material
 */
export function getMaterialInfo(material: string): MaterialInfo | undefined {
  // Try exact match first
  if (MATERIAL_INFO[material]) {
    return MATERIAL_INFO[material];
  }
  
  // Try to find base material (e.g., "PLA-Marble" -> "PLA")
  const baseMaterial = material.split('-')[0].split(' ')[0];
  if (MATERIAL_INFO[baseMaterial]) {
    return {
      ...MATERIAL_INFO[baseMaterial],
      name: material,
      description: `Variant of ${baseMaterial}. ${MATERIAL_INFO[baseMaterial].description}`,
    };
  }
  
  // Return a generic info based on category
  const category = getMaterialCategory(material);
  if (category) {
    return {
      name: material,
      category: category.id,
      description: category.description,
      properties: {
        printability: 'Medium',
        strength: 'Medium',
        flexibility: 'Rigid',
        heatResistance: 'Medium',
      },
      useCases: ['General purpose'],
    };
  }
  
  return undefined;
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

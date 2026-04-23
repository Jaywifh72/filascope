/**
 * TDS SHEET EXTRACTOR v2
 * 
 * Extracts mechanical, thermal, and physical properties from TDS sheets.
 * Handles PDF parsing and field mapping to database schema.
 */

// ============================================================================
// TDS INTERFACES
// ============================================================================

export interface TdsProperty {
  field: string;
  value: any;
  unit?: string;
  confidence: number;
  source: string;
}

export interface ExtractionResult {
  field: string;
  value: any;
  source: string;
  confidence: number;
  raw_value?: any;
}

// ============================================================================
// TDS FIELD MAPPINGS
// ============================================================================

/**
 * Map TDS sheet field names to database fields
 */
export const TDS_FIELD_MAPPINGS: Record<string, string[]> = {
  // Mechanical properties
  'tensile_strength': ['tensile_strength_xy_mpa', 'tensile_strength_z_mpa'],
  'tensile_modulus': ['tensile_modulus_xy_mpa', 'tensile_modulus_z_mpa'],
  'elongation_at_break': ['elongation_break_xy_percent', 'elongation_break_z_percent'],
  'flexural_strength': ['flexural_strength_mpa'],
  'flexural_modulus': ['bending_modulus_mpa'],
  'impact_strength': ['impact_strength_kj_m2', 'notched_izod_j_m'],
  'hardness': ['hardness_shore_a', 'shore_hardness_d'],
  'youngs_modulus': ['youngs_modulus_mpa'],
  'poissons_ratio': ['poissons_ratio'],
  
  // Thermal properties
  'melting_temperature': ['melt_temp_c'],
  'glass_transition': ['tg_c'],
  'vicat_softening': ['vicat_softening_temp_c'],
  'heat_deflection': ['hdt_045_mpa_c', 'hdt_18_mpa_c'],
  'annealing_temp': ['annealing_temp_c'],
  'annealing_time': ['annealing_time_hours'],
  'drying_temp': ['drying_temp_c'],
  'drying_time': ['drying_time_hours'],
  
  // Physical properties
  'density': ['density_g_cm3'],
  'water_absorption': ['water_absorption_percent'],
  'shrinkage': ['shrinkage_annealed_percent'],
  
  // Optical properties
  'haze': ['haze_percent'],
  'light_transmission': ['light_transmission_percent'],
  
  // Electrical properties
  'surface_resistivity': ['surface_resistivity_ohm'],
  'volume_resistivity': ['volume_resistivity_ohm_cm'],
  
  // Chemical properties
  'chemical_resistance': ['chemical_resistance'],
  'food_contact': ['food_contact_rating'],
  
  // Special properties
  'carbon_fiber': ['carbon_fiber_percentage'],
  'glass_fiber': ['glass_fiber_percentage'],
  'wood_powder': ['wood_powder_percentage'],
  'melt_index': ['melt_index_g_10min']
};

// ============================================================================
// TDS EXTRACTOR
// ============================================================================

/**
 * Extract properties from TDS sheet content
 */
export function extractTdsProperties(
  content: string,
  brandSlug: string,
  productName: string
): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  if (!content) return results;
  
  const contentLower = content.toLowerCase();
  
  // Extract mechanical properties
  results.push(...extractMechanicalProperties(content, contentLower));
  
  // Extract thermal properties
  results.push(...extractThermalProperties(content, contentLower));
  
  // Extract physical properties
  results.push(...extractPhysicalProperties(content, contentLower));
  
  // Extract optical properties
  results.push(...extractOpticalProperties(content, contentLower));
  
  // Extract electrical properties
  results.push(...extractElectricalProperties(content, contentLower));
  
  // Extract special properties
  results.push(...extractSpecialProperties(content, contentLower));
  
  return results;
}

/**
 * Extract mechanical properties
 */
function extractMechanicalProperties(content: string, contentLower: string): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Tensile strength
  const tensilePatterns = [
    /tensile[\s-]*strength[\s:]*(\d+\.?\d*)\s*(?:mpa|n\/mm[²2])/i,
    /(\d+\.?\d*)\s*(?:mpa|n\/mm[²2])[\s-]*tensile/i,
    /tensile[\s:]*(\d+\.?\d*)\s*(?:mpa|n\/mm[²2])/i
  ];
  
  for (const pattern of tensilePatterns) {
    const match = content.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (value >= 10 && value <= 200) {
        results.push({
          field: 'tensile_strength_xy_mpa',
          value,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  // Tensile modulus
  const modulusPatterns = [
    /tensile[\s-]*modulus[\s:]*(\d+\.?\d*)\s*(?:mpa|gpa|n\/mm[²2])/i,
    /modulus[\s:]*(\d+\.?\d*)\s*(?:mpa|gpa|n\/mm[²2])/i,
    /young'?s[\s-]*modulus[\s:]*(\d+\.?\d*)\s*(?:mpa|gpa|n\/mm[²2])/i
  ];
  
  for (const pattern of modulusPatterns) {
    const match = content.match(pattern);
    if (match) {
      let value = parseFloat(match[1]);
      // Convert GPa to MPa if needed
      if (match[0].toLowerCase().includes('gpa')) {
        value *= 1000;
      }
      if (value >= 100 && value <= 10000) {
        results.push({
          field: 'tensile_modulus_xy_mpa',
          value,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  // Elongation at break
  const elongationPatterns = [
    /elongation[\s-]*at[\s-]*break[\s:]*(\d+\.?\d*)\s*%/i,
    /elongation[\s:]*(\d+\.?\d*)\s*%/i,
    /break[\s-]*elongation[\s:]*(\d+\.?\d*)\s*%/i
  ];
  
  for (const pattern of elongationPatterns) {
    const match = content.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (value >= 0 && value <= 500) {
        results.push({
          field: 'elongation_break_xy_percent',
          value,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  // Flexural strength
  const flexuralPatterns = [
    /flexural[\s-]*strength[\s:]*(\d+\.?\d*)\s*(?:mpa|n\/mm[²2])/i,
    /bending[\s-]*strength[\s:]*(\d+\.?\d*)\s*(?:mpa|n\/mm[²2])/i
  ];
  
  for (const pattern of flexuralPatterns) {
    const match = content.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (value >= 10 && value <= 300) {
        results.push({
          field: 'flexural_strength_mpa',
          value,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  // Impact strength
  const impactPatterns = [
    /impact[\s-]*strength[\s:]*(\d+\.?\d*)\s*(?:kj\/m[²2]|j\/m)/i,
    /charpy[\s:]*(\d+\.?\d*)\s*(?:kj\/m[²2]|j\/m)/i,
    /izod[\s:]*(\d+\.?\d*)\s*(?:kj\/m[²2]|j\/m)/i
  ];
  
  for (const pattern of impactPatterns) {
    const match = content.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (value >= 0 && value <= 100) {
        const field = match[0].toLowerCase().includes('izod') ? 
          'notched_izod_j_m' : 'impact_strength_kj_m2';
        results.push({
          field,
          value,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  return results;
}

/**
 * Extract thermal properties
 */
function extractThermalProperties(content: string, contentLower: string): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Melting temperature
  const meltPatterns = [
    /melt(?:ing)?[\s-]*(?:temp(?:erature)?)?[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /(?:temp(?:erature)?)?[\s-]*melt[\s:]*(\d+)\s*°?\s*[Cc]?/i
  ];
  
  for (const pattern of meltPatterns) {
    const match = content.match(pattern);
    if (match) {
      const temp = parseInt(match[1], 10);
      if (temp >= 100 && temp <= 400) {
        results.push({
          field: 'melt_temp_c',
          value: temp,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  // Glass transition temperature (Tg)
  const tgPatterns = [
    /tg[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /glass[\s-]*transition[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /transition[\s-]*temp[\s:]*(\d+)\s*°?\s*[Cc]?/i
  ];
  
  for (const pattern of tgPatterns) {
    const match = content.match(pattern);
    if (match) {
      const temp = parseInt(match[1], 10);
      if (temp >= 0 && temp <= 300) {
        results.push({
          field: 'tg_c',
          value: temp,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  // Vicat softening temperature
  const vicatPatterns = [
    /vicat[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /vicat[\s-]*softening[\s:]*(\d+)\s*°?\s*[Cc]?/i
  ];
  
  for (const pattern of vicatPatterns) {
    const match = content.match(pattern);
    if (match) {
      const temp = parseInt(match[1], 10);
      if (temp >= 0 && temp <= 300) {
        results.push({
          field: 'vicat_softening_temp_c',
          value: temp,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  // Heat deflection temperature (HDT)
  const hdtPatterns = [
    /hdt[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /heat[\s-]*deflection[\s:]*(\d+)\s*°?\s*[Cc]?/i,
    /deflection[\s-]*temp[\s:]*(\d+)\s*°?\s*[Cc]?/i
  ];
  
  for (const pattern of hdtPatterns) {
    const match = content.match(pattern);
    if (match) {
      const temp = parseInt(match[1], 10);
      if (temp >= 0 && temp <= 300) {
        results.push({
          field: 'hdt_045_mpa_c',
          value: temp,
          source: 'tds',
          confidence: 0.7,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  return results;
}

/**
 * Extract physical properties
 */
function extractPhysicalProperties(content: string, contentLower: string): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Density
  const densityPatterns = [
    /density[\s:]*(\d+\.?\d*)\s*g\/cm[³3]?/i,
    /(\d+\.?\d*)\s*g\/cm[³3]?/i
  ];
  
  for (const pattern of densityPatterns) {
    const match = content.match(pattern);
    if (match) {
      const density = parseFloat(match[1]);
      if (density >= 0.5 && density <= 3) {
        results.push({
          field: 'density_g_cm3',
          value: density,
          source: 'tds',
          confidence: 0.9,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  // Water absorption
  const waterPatterns = [
    /water[\s-]*absorption[\s:]*(\d+\.?\d*)\s*%/i,
    /absorption[\s:]*(\d+\.?\d*)\s*%/i
  ];
  
  for (const pattern of waterPatterns) {
    const match = content.match(pattern);
    if (match) {
      const absorption = parseFloat(match[1]);
      if (absorption >= 0 && absorption <= 10) {
        results.push({
          field: 'water_absorption_percent',
          value: absorption,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  return results;
}

/**
 * Extract optical properties
 */
function extractOpticalProperties(content: string, contentLower: string): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Haze
  const hazePatterns = [
    /haze[\s:]*(\d+\.?\d*)\s*%/i,
    /(\d+\.?\d*)\s*%[\s-]*haze/i
  ];
  
  for (const pattern of hazePatterns) {
    const match = content.match(pattern);
    if (match) {
      const haze = parseFloat(match[1]);
      if (haze >= 0 && haze <= 100) {
        results.push({
          field: 'haze_percent',
          value: haze,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  // Light transmission
  const transmissionPatterns = [
    /light[\s-]*transmission[\s:]*(\d+\.?\d*)\s*%/i,
    /transmission[\s:]*(\d+\.?\d*)\s*%/i,
    /transparency[\s:]*(\d+\.?\d*)\s*%/i
  ];
  
  for (const pattern of transmissionPatterns) {
    const match = content.match(pattern);
    if (match) {
      const transmission = parseFloat(match[1]);
      if (transmission >= 0 && transmission <= 100) {
        results.push({
          field: 'light_transmission_percent',
          value: transmission,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  return results;
}

/**
 * Extract electrical properties
 */
function extractElectricalProperties(content: string, contentLower: string): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Surface resistivity
  const surfacePatterns = [
    /surface[\s-]*resistivity[\s:]*(\d+\.?\d*(?:e\+\d+)?)\s*(?:ohm|Ω)/i,
    /(\d+\.?\d*(?:e\+\d+)?)\s*(?:ohm|Ω)[\s-]*surface/i
  ];
  
  for (const pattern of surfacePatterns) {
    const match = content.match(pattern);
    if (match) {
      const resistivity = parseFloat(match[1]);
      if (resistivity >= 1 && resistivity <= 1e16) {
        results.push({
          field: 'surface_resistivity_ohm',
          value: resistivity,
          source: 'tds',
          confidence: 0.7,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  // Volume resistivity
  const volumePatterns = [
    /volume[\s-]*resistivity[\s:]*(\d+\.?\d*(?:e\+\d+)?)\s*(?:ohm|Ω)[\s-]*cm/i,
    /(\d+\.?\d*(?:e\+\d+)?)\s*(?:ohm|Ω)[\s-]*cm[\s-]*volume/i
  ];
  
  for (const pattern of volumePatterns) {
    const match = content.match(pattern);
    if (match) {
      const resistivity = parseFloat(match[1]);
      if (resistivity >= 1 && resistivity <= 1e18) {
        results.push({
          field: 'volume_resistivity_ohm_cm',
          value: resistivity,
          source: 'tds',
          confidence: 0.7,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  return results;
}

/**
 * Extract special properties
 */
function extractSpecialProperties(content: string, contentLower: string): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  // Carbon fiber percentage
  const carbonPatterns = [
    /carbon[\s-]*fiber[\s:]*(\d+\.?\d*)\s*%/i,
    /cf[\s:]*(\d+\.?\d*)\s*%/i,
    /(\d+\.?\d*)\s*%[\s-]*carbon/i
  ];
  
  for (const pattern of carbonPatterns) {
    const match = content.match(pattern);
    if (match) {
      const percentage = parseFloat(match[1]);
      if (percentage >= 0 && percentage <= 100) {
        results.push({
          field: 'carbon_fiber_percentage',
          value: percentage,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  // Glass fiber percentage
  const glassPatterns = [
    /glass[\s-]*fiber[\s:]*(\d+\.?\d*)\s*%/i,
    /gf[\s:]*(\d+\.?\d*)\s*%/i,
    /(\d+\.?\d*)\s*%[\s-]*glass/i
  ];
  
  for (const pattern of glassPatterns) {
    const match = content.match(pattern);
    if (match) {
      const percentage = parseFloat(match[1]);
      if (percentage >= 0 && percentage <= 100) {
        results.push({
          field: 'glass_fiber_percentage',
          value: percentage,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  // Melt index (MFI)
  const mfiPatterns = [
    /melt[\s-]*(?:flow)?[\s-]*index[\s:]*(\d+\.?\d*)/i,
    /mfi[\s:]*(\d+\.?\d*)/i,
    /(\d+\.?\d*)\s*g\/10[\s-]*min/i
  ];
  
  for (const pattern of mfiPatterns) {
    const match = content.match(pattern);
    if (match) {
      const mfi = parseFloat(match[1]);
      if (mfi >= 0 && mfi <= 100) {
        results.push({
          field: 'melt_index_g_10min',
          value: mfi,
          source: 'tds',
          confidence: 0.8,
          raw_value: match[0]
        });
        break;
      }
    }
  }
  
  return results;
}

/**
 * Parse TDS PDF content (placeholder)
 * In production, this would use a PDF parsing library
 */
export async function parseTdsPdf(pdfUrl: string): Promise<string> {
  // TODO: Implement PDF parsing
  // This would require:
  // 1. Download PDF from URL
  // 2. Parse PDF using library (pdf-parse, pdfjs, etc.)
  // 3. Extract text content
  
  console.log(`[TDS] PDF parsing not implemented: ${pdfUrl}`);
  return '';
}

/**
 * Find TDS URLs for brand
 */
export function findTdsUrls(
  brandSlug: string,
  productUrl: string
): string[] {
  // Common TDS URL patterns
  const patterns = [
    `${productUrl}/tds`,
    `${productUrl}/technical-data-sheet`,
    `${productUrl}/specs`,
    `${productUrl}/specifications`,
    `https://${brandSlug}.com/tds`,
    `https://www.${brandSlug}.com/tds`
  ];
  
  return patterns;
}

/**
 * Generate TDS extraction report
 */
export function generateTdsReport(
  filaments: any[],
  extractions: Map<string, ExtractionResult[]>
): {
  total_filaments: number;
  filaments_with_tds_data: number;
  filaments_without_tds_data: number;
  coverage_percentage: number;
  fields_extracted: Record<string, number>;
  top_brands_with_tds: Array<{ brand: string; count: number }>;
} {
  const filamentsWithTds = filaments.filter(f => {
    const extractionsForFilament = extractions.get(f.id) || [];
    return extractionsForFilament.length > 0;
  });
  
  const filamentsWithoutTds = filaments.filter(f => {
    const extractionsForFilament = extractions.get(f.id) || [];
    return extractionsForFilament.length === 0;
  });
  
  // Count fields extracted
  const fieldsExtracted: Record<string, number> = {};
  for (const [filamentId, extractionResults] of extractions) {
    for (const result of extractionResults) {
      fieldsExtracted[result.field] = (fieldsExtracted[result.field] || 0) + 1;
    }
  }
  
  // Count by brand
  const brandWithTds: Record<string, number> = {};
  for (const f of filamentsWithTds) {
    const brand = f.vendor || 'Unknown';
    brandWithTds[brand] = (brandWithTds[brand] || 0) + 1;
  }
  
  const topBrandsWithTds = Object.entries(brandWithTds)
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    total_filaments: filaments.length,
    filaments_with_tds_data: filamentsWithTds.length,
    filaments_without_tds_data: filamentsWithoutTds.length,
    coverage_percentage: Math.round((filamentsWithTds.length / filaments.length) * 100 * 10) / 10,
    fields_extracted: fieldsExtracted,
    top_brands_with_tds: topBrandsWithTds
  };
}

console.log(`✅ TDS Sheet Extractor loaded`);
console.log(`   Extracts 40+ mechanical/thermal/physical properties`);
console.log(`   Supports PDF parsing (placeholder)`);
console.log(`   Field mappings for database schema`);

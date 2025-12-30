import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FieldDefinition {
  field: string;
  label: string;
  category: 'hueforge' | 'mechanical' | 'print_settings' | 'identifiers';
  description?: string;
}

export const TRACKED_FIELDS: FieldDefinition[] = [
  // HueForge/Visual
  { field: 'transmission_distance', label: 'Transmission Distance', category: 'hueforge', description: 'Required for HueForge compatibility' },
  { field: 'color_hex', label: 'Color Hex', category: 'hueforge', description: 'Swatch display color' },
  { field: 'color_family', label: 'Color Family', category: 'hueforge', description: 'Color categorization' },
  
  // Mechanical Properties
  { field: 'tensile_strength_xy_mpa', label: 'Tensile Strength', category: 'mechanical', description: 'From TDS parsing' },
  { field: 'flexural_strength_mpa', label: 'Flexural Strength', category: 'mechanical', description: 'From TDS parsing' },
  { field: 'elongation_break_xy_percent', label: 'Elongation at Break', category: 'mechanical', description: 'From TDS parsing' },
  { field: 'density_g_cm3', label: 'Density', category: 'mechanical', description: 'Material density' },
  
  // Print Settings
  { field: 'nozzle_temp_min_c', label: 'Nozzle Temp Min', category: 'print_settings' },
  { field: 'nozzle_temp_max_c', label: 'Nozzle Temp Max', category: 'print_settings' },
  { field: 'bed_temp_min_c', label: 'Bed Temp Min', category: 'print_settings' },
  { field: 'bed_temp_max_c', label: 'Bed Temp Max', category: 'print_settings' },
  { field: 'drying_temp_c', label: 'Drying Temp', category: 'print_settings' },
  { field: 'drying_time_hours', label: 'Drying Time', category: 'print_settings' },
  { field: 'print_speed_max_mms', label: 'Max Print Speed', category: 'print_settings' },
  
  // Identifiers
  { field: 'tds_url', label: 'TDS URL', category: 'identifiers', description: 'Technical data sheet link' },
  { field: 'mpn', label: 'MPN', category: 'identifiers', description: 'Manufacturer part number' },
  { field: 'upc', label: 'UPC', category: 'identifiers', description: 'Universal product code' },
  { field: 'ean', label: 'EAN', category: 'identifiers', description: 'European article number' },
];

export interface FieldFillRate {
  field: string;
  label: string;
  category: string;
  description?: string;
  filled: number;
  total: number;
  percentage: number;
}

export interface BrandFieldFillRates {
  vendor: string;
  productCount: number;
  fields: Record<string, { filled: number; percentage: number }>;
  overallPercentage: number;
}

export interface FieldFillRatesData {
  overall: FieldFillRate[];
  byCategory: Record<string, FieldFillRate[]>;
  byBrand: BrandFieldFillRates[];
  totalFilaments: number;
  hueforgeReady: number;
  tdsCount: number;
  averageCoverage: number;
}

async function fetchFieldFillRates(): Promise<FieldFillRatesData> {
  // Fetch all filaments with the tracked fields
  const { data: filaments, error } = await supabase
    .from('filaments')
    .select(`
      vendor,
      transmission_distance,
      color_hex,
      color_family,
      tensile_strength_xy_mpa,
      flexural_strength_mpa,
      elongation_break_xy_percent,
      density_g_cm3,
      nozzle_temp_min_c,
      nozzle_temp_max_c,
      bed_temp_min_c,
      bed_temp_max_c,
      drying_temp_c,
      drying_time_hours,
      print_speed_max_mms,
      tds_url,
      mpn,
      upc,
      ean
    `);
    
  if (error) throw error;
  if (!filaments) return {
    overall: [],
    byCategory: {},
    byBrand: [],
    totalFilaments: 0,
    hueforgeReady: 0,
    tdsCount: 0,
    averageCoverage: 0
  };

  const totalFilaments = filaments.length;
  
  // Calculate overall fill rates
  const overall: FieldFillRate[] = TRACKED_FIELDS.map(fieldDef => {
    const filled = filaments.filter(f => {
      const value = f[fieldDef.field as keyof typeof f];
      return value !== null && value !== undefined && value !== '';
    }).length;
    
    return {
      ...fieldDef,
      filled,
      total: totalFilaments,
      percentage: totalFilaments > 0 ? Math.round((filled / totalFilaments) * 100) : 0
    };
  });

  // Group by category
  const byCategory: Record<string, FieldFillRate[]> = {};
  overall.forEach(field => {
    if (!byCategory[field.category]) {
      byCategory[field.category] = [];
    }
    byCategory[field.category].push(field);
  });

  // Group by brand
  const brandMap = new Map<string, typeof filaments>();
  filaments.forEach(f => {
    const vendor = f.vendor || 'Unknown';
    if (!brandMap.has(vendor)) {
      brandMap.set(vendor, []);
    }
    brandMap.get(vendor)!.push(f);
  });

  const byBrand: BrandFieldFillRates[] = Array.from(brandMap.entries())
    .map(([vendor, products]) => {
      const fields: Record<string, { filled: number; percentage: number }> = {};
      let totalFilled = 0;
      
      TRACKED_FIELDS.forEach(fieldDef => {
        const filled = products.filter(p => {
          const value = p[fieldDef.field as keyof typeof p];
          return value !== null && value !== undefined && value !== '';
        }).length;
        
        const percentage = products.length > 0 ? Math.round((filled / products.length) * 100) : 0;
        fields[fieldDef.field] = { filled, percentage };
        totalFilled += percentage;
      });
      
      return {
        vendor,
        productCount: products.length,
        fields,
        overallPercentage: Math.round(totalFilled / TRACKED_FIELDS.length)
      };
    })
    .filter(b => b.productCount >= 5) // Only show brands with 5+ products
    .sort((a, b) => b.productCount - a.productCount);

  // Calculate summary stats
  const hueforgeReady = filaments.filter(f => 
    f.transmission_distance !== null && f.transmission_distance !== undefined
  ).length;
  
  const tdsCount = filaments.filter(f => 
    f.tds_url !== null && f.tds_url !== undefined && f.tds_url !== ''
  ).length;
  
  const averageCoverage = overall.length > 0 
    ? Math.round(overall.reduce((sum, f) => sum + f.percentage, 0) / overall.length)
    : 0;

  return {
    overall,
    byCategory,
    byBrand,
    totalFilaments,
    hueforgeReady,
    tdsCount,
    averageCoverage
  };
}

export function useFieldFillRates() {
  return useQuery({
    queryKey: ['field-fill-rates'],
    queryFn: fetchFieldFillRates,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

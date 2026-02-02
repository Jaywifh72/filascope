// Brand regional availability for stores and Amazon
// Comprehensive availability data for all 51+ filament brands

export interface RegionalAvailability {
  store: boolean;
  amazon: boolean;
}

export interface BrandRegions {
  US: RegionalAvailability;
  CA: RegionalAvailability;
  UK: RegionalAvailability;
  EU: RegionalAvailability;
  AU: RegionalAvailability;
  JP: RegionalAvailability;
}

export type RegionCode = 'US' | 'CA' | 'UK' | 'EU' | 'AU' | 'JP';

export const REGION_FLAGS: Record<RegionCode, string> = {
  US: '🇺🇸',
  CA: '🇨🇦',
  UK: '🇬🇧',
  EU: '🇪🇺',
  AU: '🇦🇺',
  JP: '🇯🇵',
};

export const REGION_CURRENCIES: Record<RegionCode, string> = {
  US: 'USD',
  CA: 'CAD',
  UK: 'GBP',
  EU: 'EUR',
  AU: 'AUD',
  JP: 'JPY',
};

export const REGION_NAMES: Record<RegionCode, string> = {
  US: 'United States',
  CA: 'Canada',
  UK: 'United Kingdom',
  EU: 'Europe',
  AU: 'Australia',
  JP: 'Japan',
};

// Default for brands not explicitly listed
const DEFAULT_US_ONLY: BrandRegions = {
  US: { store: true, amazon: false },
  CA: { store: false, amazon: false },
  UK: { store: false, amazon: false },
  EU: { store: false, amazon: false },
  AU: { store: false, amazon: false },
  JP: { store: false, amazon: false },
};

const US_AMAZON_ONLY: BrandRegions = {
  US: { store: false, amazon: true },
  CA: { store: false, amazon: false },
  UK: { store: false, amazon: false },
  EU: { store: false, amazon: false },
  AU: { store: false, amazon: false },
  JP: { store: false, amazon: false },
};

export const BRAND_REGIONAL_AVAILABILITY: Record<string, BrandRegions> = {
  // ============================================
  // MULTI-REGION BRANDS (with regional stores)
  // ============================================
  'Bambu Lab': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: true, amazon: true },
  },
  'Elegoo': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: false, amazon: true },
  },
  'Creality': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: false, amazon: true },
  },
  'Anycubic': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: false, amazon: true },
  },
  'Polymaker': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
  },
  'Flashforge': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
  },
  'Prusament': {
    US: { store: true, amazon: false },
    CA: { store: true, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: true, amazon: false },
    JP: { store: true, amazon: false },
  },
  'Prusa Research': {
    US: { store: true, amazon: false },
    CA: { store: true, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: true, amazon: false },
    JP: { store: true, amazon: false },
  },

  // ============================================
  // EUROPEAN BRANDS (EUR-native, ship globally)
  // ============================================
  'ColorFabb': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: true, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Fillamentum': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'FormFutura': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Fiberlogy': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Extrudr': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'AzureFilm': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Recreus': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Rigid.ink': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },

  // ============================================
  // CANADIAN BRANDS
  // ============================================
  'Filaments.ca': {
    US: { store: false, amazon: false },
    CA: { store: true, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },

  // ============================================
  // ASIAN BRANDS (with regional stores or Amazon)
  // ============================================
  'eSun': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
  },
  'Jayo': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
  },
  'Sunlu': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
  },
  'Sovol': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
  },
  'Kingroon': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Eryone': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
  },
  'GEEETECH': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },

  // ============================================
  // US BRANDS (store only)
  // ============================================
  '3D-Fuel': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  '3DXTech': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Atomic Filament': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'NinjaTek': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: true },
    EU: { store: false, amazon: true },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Proto-Pasta': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Push Plastic': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'MatterHackers': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Printed Solid': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'IC3D Printers': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Fusion Filaments': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Gizmo Dorks': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'SainSmart': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: false, amazon: true },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: true },
  },
  'Duramic 3D': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Amolen': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: false, amazon: true },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'GST3D': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'IIID Max': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Numakers': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Matter3D': {
    US: { store: true, amazon: false },
    CA: { store: true, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Siraya Tech': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Recycling Fabrik': {
    US: { store: true, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },

  // ============================================
  // AMAZON-ONLY BRANDS
  // ============================================
  'Hatchbox': {
    US: { store: false, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: false, amazon: true },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: true },
  },
  'Overture': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: false, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: true },
  },
  'Amazon Basics': {
    US: { store: false, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: false, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: true },
  },
  'Inland': {
    US: { store: false, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  '3D Solutech': {
    US: { store: false, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'PRILINE': {
    US: { store: false, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Paramount 3D': {
    US: { store: false, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Giantarm': {
    US: { store: false, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: true },
    EU: { store: false, amazon: true },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'Dikale': {
    US: { store: false, amazon: true },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  '3DHOJOR': {
    US: { store: true, amazon: true },  // Has Shopify store + Amazon
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },

  // ============================================
  // PRINTER BRANDS (for reference)
  // ============================================
  'UltiMaker': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: false },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'FLSUN': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
  },
  'QIDI Tech': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: false, amazon: false },
  },
  'Snapmaker': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: false },
    JP: { store: true, amazon: false },
  },
  'Raise3D': {
    US: { store: true, amazon: false },
    CA: { store: true, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: true, amazon: false },
    JP: { store: true, amazon: false },
  },
  'Voron Design': {
    US: { store: false, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'AnkerMake': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: true, amazon: true },
  },
  'Markforged': {
    US: { store: true, amazon: false },
    CA: { store: true, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
  'LDO Motors': {
    US: { store: false, amazon: false },
    CA: { store: false, amazon: false },
    UK: { store: false, amazon: false },
    EU: { store: false, amazon: false },
    AU: { store: false, amazon: false },
    JP: { store: false, amazon: false },
  },
};

export function getBrandAvailability(brand: string): BrandRegions | null {
  // Try exact match first
  if (BRAND_REGIONAL_AVAILABILITY[brand]) {
    return BRAND_REGIONAL_AVAILABILITY[brand];
  }
  
  // Try case-insensitive match
  const normalizedBrand = brand.toLowerCase();
  for (const [key, value] of Object.entries(BRAND_REGIONAL_AVAILABILITY)) {
    if (key.toLowerCase() === normalizedBrand) {
      return value;
    }
  }
  
  return null;
}

export function isBrandAvailableInRegion(
  brand: string, 
  region: RegionCode, 
  source: 'store' | 'amazon'
): boolean {
  const availability = getBrandAvailability(brand);
  if (!availability) return false;
  return availability[region]?.[source] ?? false;
}

export function getAvailableRegionsForBrand(brand: string): {
  storeRegions: RegionCode[];
  amazonRegions: RegionCode[];
} {
  const availability = getBrandAvailability(brand);
  if (!availability) {
    return { storeRegions: [], amazonRegions: [] };
  }
  
  const regions: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU', 'JP'];
  const storeRegions = regions.filter(r => availability[r]?.store);
  const amazonRegions = regions.filter(r => availability[r]?.amazon);
  
  return { storeRegions, amazonRegions };
}

export function getBrandsWithMultipleRegions(): string[] {
  return Object.entries(BRAND_REGIONAL_AVAILABILITY)
    .filter(([_, regions]) => {
      const allRegions: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU', 'JP'];
      const storeCount = allRegions.filter(r => regions[r]?.store).length;
      return storeCount > 1;
    })
    .map(([brand]) => brand);
}

export function getRegionCount(brand: string): number {
  const availability = getBrandAvailability(brand);
  if (!availability) return 0;
  
  const regions: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU', 'JP'];
  return regions.filter(r => availability[r]?.store || availability[r]?.amazon).length;
}

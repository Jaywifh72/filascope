// Brand regional availability for stores and Amazon
// Based on research of each brand's official store presence and Amazon availability

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

export const BRAND_REGIONAL_AVAILABILITY: Record<string, BrandRegions> = {
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
  'Bambu Lab': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: true, amazon: true },
  },
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
  'Sovol': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
  },
  'Prusa Research': {
    US: { store: true, amazon: false },
    CA: { store: true, amazon: false },
    UK: { store: true, amazon: false },
    EU: { store: true, amazon: false },
    AU: { store: true, amazon: false },
    JP: { store: true, amazon: false },
  },
  'Elegoo': {
    US: { store: true, amazon: true },
    CA: { store: true, amazon: true },
    UK: { store: true, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: true, amazon: true },
    JP: { store: false, amazon: true },
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
  'FlashForge': {
    US: { store: true, amazon: true },
    CA: { store: false, amazon: true },
    UK: { store: false, amazon: true },
    EU: { store: true, amazon: true },
    AU: { store: false, amazon: true },
    JP: { store: false, amazon: false },
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

export type RegionCode = 'US' | 'CA' | 'UK' | 'EU' | 'AU' | 'JP';

export function getBrandAvailability(brand: string): BrandRegions | null {
  return BRAND_REGIONAL_AVAILABILITY[brand] || null;
}

export function isBrandAvailableInRegion(
  brand: string, 
  region: RegionCode, 
  source: 'store' | 'amazon'
): boolean {
  const availability = BRAND_REGIONAL_AVAILABILITY[brand];
  if (!availability) return false;
  return availability[region]?.[source] ?? false;
}

export function getAvailableRegionsForBrand(brand: string): {
  storeRegions: RegionCode[];
  amazonRegions: RegionCode[];
} {
  const availability = BRAND_REGIONAL_AVAILABILITY[brand];
  if (!availability) {
    return { storeRegions: [], amazonRegions: [] };
  }
  
  const regions: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU', 'JP'];
  const storeRegions = regions.filter(r => availability[r]?.store);
  const amazonRegions = regions.filter(r => availability[r]?.amazon);
  
  return { storeRegions, amazonRegions };
}

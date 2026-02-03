/**
 * Country codes grouped by region for form dropdowns
 */

export interface Country {
  code: string;
  name: string;
}

export const REGION_COUNTRIES: Record<string, Country[]> = {
  US: [{ code: 'US', name: 'United States' }],
  CA: [{ code: 'CA', name: 'Canada' }],
  EU: [
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'AT', name: 'Austria' },
    { code: 'BE', name: 'Belgium' },
    { code: 'PL', name: 'Poland' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'SE', name: 'Sweden' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'IE', name: 'Ireland' },
    { code: 'GR', name: 'Greece' },
  ],
  UK: [{ code: 'GB', name: 'United Kingdom' }],
  AU: [
    { code: 'AU', name: 'Australia' },
    { code: 'NZ', name: 'New Zealand' },
  ],
  JP: [{ code: 'JP', name: 'Japan' }],
  CN: [{ code: 'CN', name: 'China' }],
  GLOBAL: [],
};

export const ALL_COUNTRIES: Country[] = [
  ...REGION_COUNTRIES.US,
  ...REGION_COUNTRIES.CA,
  ...REGION_COUNTRIES.EU,
  ...REGION_COUNTRIES.UK,
  ...REGION_COUNTRIES.AU,
  ...REGION_COUNTRIES.JP,
  ...REGION_COUNTRIES.CN,
];

export const REGION_DISPLAY: Record<string, { flag: string; name: string }> = {
  US: { flag: '🇺🇸', name: 'United States' },
  CA: { flag: '🇨🇦', name: 'Canada' },
  EU: { flag: '🇪🇺', name: 'European Union' },
  UK: { flag: '🇬🇧', name: 'United Kingdom' },
  AU: { flag: '🇦🇺', name: 'Australia' },
  JP: { flag: '🇯🇵', name: 'Japan' },
  CN: { flag: '🇨🇳', name: 'China' },
  GLOBAL: { flag: '🌐', name: 'Global' },
};

export const REGION_CURRENCIES: Record<string, string> = {
  US: 'USD',
  CA: 'CAD',
  EU: 'EUR',
  UK: 'GBP',
  AU: 'AUD',
  JP: 'JPY',
  CN: 'CNY',
  GLOBAL: 'USD',
};

export function getRegionFlag(region: string): string {
  return REGION_DISPLAY[region]?.flag || '🌐';
}

export function getCountriesForRegion(region: string): Country[] {
  return REGION_COUNTRIES[region] || [];
}

export function getDefaultCurrency(region: string): string {
  return REGION_CURRENCIES[region] || 'USD';
}

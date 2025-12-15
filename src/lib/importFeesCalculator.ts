// Import fees calculator for international orders

export interface ImportFees {
  duties: number;
  taxes: number;
  total: number;
  currency: string;
  disclaimer: string;
}

// Approximate duty rates by category and destination
const DUTY_RATES: Record<string, Record<string, number>> = {
  // Filament is typically classified under plastics (HS 3916)
  filament: {
    CA: 0.0, // Canada has 0% duty on many plastic products
    UK: 0.065, // UK ~6.5%
    EU: 0.065, // EU ~6.5%
    AU: 0.05, // Australia ~5%
    JP: 0.0, // Japan 0% on many plastics
  },
  // Printers fall under machinery
  printer: {
    CA: 0.0,
    UK: 0.0,
    EU: 0.0,
    AU: 0.05,
    JP: 0.0,
  },
};

// VAT/GST rates by country
const TAX_RATES: Record<string, number> = {
  CA: 0.05, // GST 5% (plus provincial taxes vary)
  UK: 0.20, // VAT 20%
  DE: 0.19, // VAT 19%
  FR: 0.20, // VAT 20%
  IT: 0.22, // VAT 22%
  ES: 0.21, // VAT 21%
  NL: 0.21, // VAT 21%
  AU: 0.10, // GST 10%
  JP: 0.10, // Consumption tax 10%
  EU: 0.20, // Default EU VAT
};

// De minimis thresholds (below which no duties apply)
const DE_MINIMIS: Record<string, number> = {
  US: 800, // USD
  CA: 20, // CAD - very low threshold
  UK: 135, // GBP
  EU: 150, // EUR
  AU: 1000, // AUD
  JP: 10000, // JPY (~$67 USD)
};

export function calculateImportFees(
  productValue: number,
  productCurrency: string,
  destinationCountry: string,
  productType: 'filament' | 'printer' | 'accessory' = 'filament'
): ImportFees {
  // Convert to destination currency (simplified - in production use real exchange rates)
  const convertedValue = productValue; // Assuming same currency for now
  
  // Check de minimis
  const threshold = DE_MINIMIS[destinationCountry] || 150;
  
  if (convertedValue < threshold && destinationCountry !== 'CA') {
    return {
      duties: 0,
      taxes: 0,
      total: 0,
      currency: productCurrency,
      disclaimer: 'Below de minimis threshold - no import fees expected',
    };
  }
  
  // Calculate duties
  const dutyRates = DUTY_RATES[productType] || DUTY_RATES.filament;
  const dutyRate = dutyRates[destinationCountry] || 0.05;
  const duties = convertedValue * dutyRate;
  
  // Calculate taxes (applied to value + duties)
  const taxRate = TAX_RATES[destinationCountry] || TAX_RATES.EU;
  const taxes = (convertedValue + duties) * taxRate;
  
  return {
    duties: Math.round(duties * 100) / 100,
    taxes: Math.round(taxes * 100) / 100,
    total: Math.round((duties + taxes) * 100) / 100,
    currency: productCurrency,
    disclaimer: 'Estimated fees. Actual charges may vary based on customs classification.',
  };
}

export function formatImportFees(fees: ImportFees): string {
  if (fees.total === 0) {
    return 'No import fees expected';
  }
  
  return `Est. duties & taxes: ${fees.currency} ${fees.total.toFixed(2)}`;
}

export function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    US: 'United States',
    CA: 'Canada',
    UK: 'United Kingdom',
    GB: 'United Kingdom',
    DE: 'Germany',
    FR: 'France',
    IT: 'Italy',
    ES: 'Spain',
    NL: 'Netherlands',
    BE: 'Belgium',
    AT: 'Austria',
    CH: 'Switzerland',
    SE: 'Sweden',
    DK: 'Denmark',
    NO: 'Norway',
    FI: 'Finland',
    PL: 'Poland',
    CZ: 'Czech Republic',
    AU: 'Australia',
    NZ: 'New Zealand',
    JP: 'Japan',
    KR: 'South Korea',
    CN: 'China',
    SG: 'Singapore',
    HK: 'Hong Kong',
    TW: 'Taiwan',
    MX: 'Mexico',
    BR: 'Brazil',
    IN: 'India',
  };
  
  return countries[code] || code;
}

export const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
];

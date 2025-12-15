// Shipping zone data for estimating delivery times and costs

export interface ShippingZone {
  zone: number;
  minDays: number;
  maxDays: number;
  baseCost: number; // For standard shipping
  expeditedCost: number; // For faster shipping
}

// US ZIP prefix to shipping zone mapping (simplified)
export const US_ZIP_ZONES: Record<string, ShippingZone> = {
  // West Coast (California, Oregon, Washington)
  '9': { zone: 1, minDays: 2, maxDays: 4, baseCost: 5.99, expeditedCost: 12.99 },
  // Mountain (Colorado, Utah, Nevada, Arizona)
  '8': { zone: 2, minDays: 3, maxDays: 5, baseCost: 6.99, expeditedCost: 14.99 },
  // Central (Texas, Oklahoma, Kansas)
  '7': { zone: 3, minDays: 3, maxDays: 5, baseCost: 6.99, expeditedCost: 14.99 },
  // Midwest (Illinois, Ohio, Michigan)
  '4': { zone: 4, minDays: 3, maxDays: 6, baseCost: 7.99, expeditedCost: 15.99 },
  '5': { zone: 4, minDays: 3, maxDays: 6, baseCost: 7.99, expeditedCost: 15.99 },
  '6': { zone: 4, minDays: 3, maxDays: 6, baseCost: 7.99, expeditedCost: 15.99 },
  // East Coast (New York, Massachusetts, Florida)
  '0': { zone: 5, minDays: 4, maxDays: 7, baseCost: 8.99, expeditedCost: 16.99 },
  '1': { zone: 5, minDays: 4, maxDays: 7, baseCost: 8.99, expeditedCost: 16.99 },
  '2': { zone: 5, minDays: 4, maxDays: 7, baseCost: 8.99, expeditedCost: 16.99 },
  '3': { zone: 5, minDays: 4, maxDays: 7, baseCost: 8.99, expeditedCost: 16.99 },
};

// Country to region mapping
export const COUNTRY_REGIONS: Record<string, string> = {
  US: 'North America',
  CA: 'North America',
  MX: 'North America',
  UK: 'Europe',
  GB: 'Europe',
  DE: 'Europe',
  FR: 'Europe',
  ES: 'Europe',
  IT: 'Europe',
  NL: 'Europe',
  BE: 'Europe',
  AT: 'Europe',
  CH: 'Europe',
  SE: 'Europe',
  DK: 'Europe',
  NO: 'Europe',
  FI: 'Europe',
  PL: 'Europe',
  CZ: 'Europe',
  AU: 'Oceania',
  NZ: 'Oceania',
  JP: 'Asia',
  KR: 'Asia',
  CN: 'Asia',
  SG: 'Asia',
  HK: 'Asia',
  TW: 'Asia',
};

// International shipping estimates by region
export const INTERNATIONAL_SHIPPING: Record<string, { minDays: number; maxDays: number; baseCost: number }> = {
  'North America': { minDays: 3, maxDays: 7, baseCost: 12.99 },
  'Europe': { minDays: 5, maxDays: 12, baseCost: 19.99 },
  'Asia': { minDays: 7, maxDays: 14, baseCost: 24.99 },
  'Oceania': { minDays: 7, maxDays: 14, baseCost: 29.99 },
};

export interface ShippingEstimate {
  minDays: number;
  maxDays: number;
  cost: number;
  carrier?: string;
  isFree: boolean;
  arrivalDate: {
    min: Date;
    max: Date;
  };
}

export function getShippingZone(zipCode: string): ShippingZone {
  const prefix = zipCode.charAt(0);
  return US_ZIP_ZONES[prefix] || US_ZIP_ZONES['5']; // Default to midwest if unknown
}

export function estimateShipping(
  zipCode: string,
  country: string,
  cartTotal: number,
  freeShippingThreshold: number | null,
  flatRateShipping: number | null,
  retailerOrigin: string = 'US'
): ShippingEstimate {
  const today = new Date();
  const isFree = freeShippingThreshold !== null && cartTotal >= freeShippingThreshold;
  
  // Same country shipping
  if (country === retailerOrigin || (country === 'US' && retailerOrigin === 'US')) {
    const zone = getShippingZone(zipCode);
    const cost = isFree ? 0 : (flatRateShipping ?? zone.baseCost);
    
    const minDate = new Date(today);
    const maxDate = new Date(today);
    
    // Add business days (skip weekends)
    let daysToAdd = zone.minDays;
    while (daysToAdd > 0) {
      minDate.setDate(minDate.getDate() + 1);
      if (minDate.getDay() !== 0 && minDate.getDay() !== 6) daysToAdd--;
    }
    
    daysToAdd = zone.maxDays;
    while (daysToAdd > 0) {
      maxDate.setDate(maxDate.getDate() + 1);
      if (maxDate.getDay() !== 0 && maxDate.getDay() !== 6) daysToAdd--;
    }
    
    return {
      minDays: zone.minDays,
      maxDays: zone.maxDays,
      cost,
      carrier: 'Standard Shipping',
      isFree,
      arrivalDate: { min: minDate, max: maxDate },
    };
  }
  
  // International shipping
  const region = COUNTRY_REGIONS[country] || 'Europe';
  const intlShipping = INTERNATIONAL_SHIPPING[region];
  const cost = isFree ? 0 : (flatRateShipping ?? intlShipping.baseCost);
  
  const minDate = new Date(today);
  const maxDate = new Date(today);
  minDate.setDate(minDate.getDate() + intlShipping.minDays);
  maxDate.setDate(maxDate.getDate() + intlShipping.maxDays);
  
  return {
    minDays: intlShipping.minDays,
    maxDays: intlShipping.maxDays,
    cost,
    carrier: 'International Shipping',
    isFree,
    arrivalDate: { min: minDate, max: maxDate },
  };
}

export function formatDeliveryDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
}

export function formatDeliveryRange(min: Date, max: Date): string {
  if (min.toDateString() === max.toDateString()) {
    return formatDeliveryDate(min);
  }
  
  const minStr = formatDeliveryDate(min);
  const maxStr = formatDeliveryDate(max);
  
  // If same month, abbreviate
  if (min.getMonth() === max.getMonth()) {
    return `${min.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} - ${max.getDate()}`;
  }
  
  return `${minStr} - ${maxStr}`;
}

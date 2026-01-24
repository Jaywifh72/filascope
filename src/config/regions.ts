import { RegionCode, RegionConfig } from '@/types/regional';

export const REGIONS: Record<RegionCode, RegionConfig> = {
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    defaultCurrency: 'USD',
    languages: ['en-US'],
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    defaultCurrency: 'CAD',
    languages: ['en-CA', 'fr-CA'],
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    defaultCurrency: 'GBP',
    languages: ['en-GB'],
  },
  EU: {
    code: 'EU',
    name: 'Europe',
    flag: '🇪🇺',
    defaultCurrency: 'EUR',
    languages: ['de', 'fr', 'es', 'it', 'nl', 'pl'],
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    defaultCurrency: 'AUD',
    languages: ['en-AU'],
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    defaultCurrency: 'JPY',
    languages: ['ja'],
  },
  CN: {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    defaultCurrency: 'CNY',
    languages: ['zh-CN'],
  },
};

// Priority order for fallback when user's regional store unavailable
export const REGION_FALLBACK_ORDER: Record<RegionCode, RegionCode[]> = {
  US: ['CA', 'UK', 'EU', 'AU'],
  CA: ['US', 'UK', 'EU', 'AU'],
  UK: ['EU', 'US', 'CA', 'AU'],
  EU: ['UK', 'US', 'CA', 'AU'],
  AU: ['US', 'UK', 'EU', 'CA'],
  JP: ['US', 'CN', 'AU', 'EU'],
  CN: ['US', 'JP', 'EU', 'AU'],
};

export const REGION_LIST = Object.values(REGIONS);

export function getRegionByCode(code: string): RegionConfig | undefined {
  return REGIONS[code as RegionCode];
}

export function detectRegionFromLocale(locale: string): RegionCode {
  const localeMap: Record<string, RegionCode> = {
    'en-US': 'US',
    'en-CA': 'CA',
    'fr-CA': 'CA',
    'en-GB': 'UK',
    'en-AU': 'AU',
    'de': 'EU',
    'de-DE': 'EU',
    'de-AT': 'EU',
    'fr': 'EU',
    'fr-FR': 'EU',
    'es': 'EU',
    'es-ES': 'EU',
    'it': 'EU',
    'it-IT': 'EU',
    'nl': 'EU',
    'nl-NL': 'EU',
    'pl': 'EU',
    'ja': 'JP',
    'ja-JP': 'JP',
    'zh': 'CN',
    'zh-CN': 'CN',
  };
  
  // Try exact match first
  if (localeMap[locale]) return localeMap[locale];
  
  // Try language code only
  const lang = locale.split('-')[0];
  if (localeMap[lang]) return localeMap[lang];
  
  // Default to US
  return 'US';
}

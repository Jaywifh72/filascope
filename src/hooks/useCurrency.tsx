import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rate: number; // Rate relative to USD
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.50 },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  currencyInfo: CurrencyInfo;
  formatPrice: (priceInUSD: number | null | undefined, showCurrency?: boolean) => string;
  convertPrice: (priceInUSD: number | null | undefined) => number | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'filascope-currency';

// Map browser locales to currency codes
const LOCALE_CURRENCY_MAP: Record<string, CurrencyCode> = {
  'en-US': 'USD',
  'en-CA': 'CAD',
  'en-GB': 'GBP',
  'en-AU': 'AUD',
  'de': 'EUR',
  'de-DE': 'EUR',
  'de-AT': 'EUR',
  'fr': 'EUR',
  'fr-FR': 'EUR',
  'es': 'EUR',
  'es-ES': 'EUR',
  'it': 'EUR',
  'it-IT': 'EUR',
  'nl': 'EUR',
  'nl-NL': 'EUR',
  'pt': 'EUR',
  'pt-PT': 'EUR',
  'ja': 'JPY',
  'ja-JP': 'JPY',
};

function detectCurrencyFromLocale(): CurrencyCode {
  if (typeof window === 'undefined') return 'USD';
  
  const languages = navigator.languages || [navigator.language];
  
  for (const lang of languages) {
    // Try exact match first
    if (lang in LOCALE_CURRENCY_MAP) {
      return LOCALE_CURRENCY_MAP[lang];
    }
    // Try language prefix (e.g., 'de' from 'de-CH')
    const prefix = lang.split('-')[0];
    if (prefix in LOCALE_CURRENCY_MAP) {
      return LOCALE_CURRENCY_MAP[prefix];
    }
  }
  
  return 'USD';
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in CURRENCIES) {
        return stored as CurrencyCode;
      }
      // No stored preference, detect from browser locale
      return detectCurrencyFromLocale();
    }
    return 'USD';
  });

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(STORAGE_KEY, newCurrency);
  };

  const currencyInfo = CURRENCIES[currency];

  const convertPrice = (priceInUSD: number | null | undefined): number | null => {
    if (priceInUSD == null) return null;
    return priceInUSD * currencyInfo.rate;
  };

  const formatPrice = (priceInUSD: number | null | undefined, showCurrency = true): string => {
    if (priceInUSD == null) return 'N/A';
    
    const converted = priceInUSD * currencyInfo.rate;
    
    // JPY doesn't use decimals
    const decimals = currency === 'JPY' ? 0 : 2;
    const formatted = converted.toFixed(decimals);
    
    if (showCurrency) {
      return `${currencyInfo.symbol}${formatted} ${currency}`;
    }
    return `${currencyInfo.symbol}${formatted}`;
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in CURRENCIES) {
      setCurrencyState(stored as CurrencyCode);
    }
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencyInfo, formatPrice, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

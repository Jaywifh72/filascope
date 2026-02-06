/**
 * @deprecated — For price formatting and conversion, use `useRegion()` from `@/contexts/RegionContext` instead.
 * 
 * This hook uses hardcoded fallback exchange rates that diverge from the live DB rates
 * in RegionContext, causing subtle price inconsistencies across views.
 * 
 * All price display should use:
 *   - `useRegion().formatPrice(amount, { showApproximate })` for formatting
 *   - `useRegion().convertPrice(amount, fromCurrency)` for conversion
 *   - `resolveFilamentPrice()` from `@/lib/resolveFilamentPrice` for full resolution
 * 
 * This hook is kept for backward compatibility with non-pricing uses (e.g., user currency preference storage).
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF' | 'SEK' | 'CNY' | 'KRW' | 'INR' | 'MXN' | 'BRL' | 'NZD' | 'PLN' | 'CZK';

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
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', rate: 0.88 },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', rate: 10.45 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24 },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', rate: 1320 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.50 },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', rate: 17.15 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rate: 4.97 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', rate: 1.62 },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', rate: 4.05 },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', rate: 23.50 },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  currencyInfo: CurrencyInfo;
  formatPrice: (priceInUSD: number | null | undefined, showCurrency?: boolean) => string;
  convertPrice: (priceInUSD: number | null | undefined) => number | null;
  formatRegionalPrice: (priceInLocalCurrency: number | null | undefined, showCurrency?: boolean, overrideCurrency?: CurrencyCode) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'filascope-currency';

// Map browser locales to currency codes
const LOCALE_CURRENCY_MAP: Record<string, CurrencyCode> = {
  'en-US': 'USD',
  'en-CA': 'CAD',
  'en-GB': 'GBP',
  'en-AU': 'AUD',
  'en-NZ': 'NZD',
  'de': 'EUR',
  'de-DE': 'EUR',
  'de-AT': 'EUR',
  'de-CH': 'CHF',
  'fr': 'EUR',
  'fr-FR': 'EUR',
  'fr-CH': 'CHF',
  'it': 'EUR',
  'it-IT': 'EUR',
  'it-CH': 'CHF',
  'es': 'EUR',
  'es-ES': 'EUR',
  'es-MX': 'MXN',
  'nl': 'EUR',
  'nl-NL': 'EUR',
  'pt': 'EUR',
  'pt-PT': 'EUR',
  'pt-BR': 'BRL',
  'ja': 'JPY',
  'ja-JP': 'JPY',
  'zh': 'CNY',
  'zh-CN': 'CNY',
  'zh-TW': 'CNY',
  'ko': 'KRW',
  'ko-KR': 'KRW',
  'hi': 'INR',
  'hi-IN': 'INR',
  'sv': 'SEK',
  'sv-SE': 'SEK',
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

function isValidCurrency(value: string | null | undefined): value is CurrencyCode {
  return value !== null && value !== undefined && value in CURRENCIES;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isValidCurrency(stored)) {
        return stored;
      }
      // No stored preference, detect from browser locale
      return detectCurrencyFromLocale();
    }
    return 'USD';
  });

  const [userId, setUserId] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load currency preference from profile when user logs in
  useEffect(() => {
    if (!userId) return;

    const loadProfileCurrency = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_currency')
        .eq('id', userId)
        .single();

      if (!error && data?.preferred_currency && isValidCurrency(data.preferred_currency)) {
        setCurrencyState(data.preferred_currency);
        localStorage.setItem(STORAGE_KEY, data.preferred_currency);
      }
    };

    loadProfileCurrency();
  }, [userId]);

  const setCurrency = async (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(STORAGE_KEY, newCurrency);

    // If user is logged in, save to profile
    if (userId) {
      await supabase
        .from('profiles')
        .update({ preferred_currency: newCurrency })
        .eq('id', userId);
    }
  };

  const currencyInfo = CURRENCIES[currency];

  const convertPrice = (priceInUSD: number | null | undefined): number | null => {
    if (priceInUSD == null) return null;
    return priceInUSD * currencyInfo.rate;
  };

  const formatPrice = (priceInUSD: number | null | undefined, showCurrency = true): string => {
    if (priceInUSD == null) return 'N/A';
    
    const converted = priceInUSD * currencyInfo.rate;
    
    // Currencies that don't use decimals
    const noDecimalCurrencies: CurrencyCode[] = ['JPY', 'KRW'];
    const decimals = noDecimalCurrencies.includes(currency) ? 0 : 2;
    const formatted = converted.toFixed(decimals);
    
    if (showCurrency) {
      return `${currencyInfo.symbol}${formatted} ${currency}`;
    }
    return `${currencyInfo.symbol}${formatted}`;
  };

  // Format a price that's ALREADY in the user's selected currency (no conversion needed)
  // Use this for actual scraped regional prices from the database
  // Optional overrideCurrency allows formatting in a different currency (e.g., for fallback prices)
  const formatRegionalPrice = (priceInLocalCurrency: number | null | undefined, showCurrency = true, overrideCurrency?: CurrencyCode): string => {
    if (priceInLocalCurrency == null) return 'N/A';
    
    const displayCurrency = overrideCurrency || currency;
    const displayInfo = overrideCurrency ? CURRENCIES[overrideCurrency] : currencyInfo;
    
    // Currencies that don't use decimals
    const noDecimalCurrencies: CurrencyCode[] = ['JPY', 'KRW'];
    const decimals = noDecimalCurrencies.includes(displayCurrency) ? 0 : 2;
    const formatted = priceInLocalCurrency.toFixed(decimals);
    
    if (showCurrency) {
      return `${displayInfo.symbol}${formatted} ${displayCurrency}`;
    }
    return `${displayInfo.symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencyInfo, formatPrice, convertPrice, formatRegionalPrice }}>
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

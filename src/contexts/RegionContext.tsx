import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { RegionCode, CurrencyCode } from '@/types/regional';
import { REGIONS, detectRegionFromLocale, REGION_FALLBACK_ORDER } from '@/config/regions';
import { CURRENCIES, formatPrice as formatPriceUtil } from '@/config/currencies';
import { supabase } from '@/integrations/supabase/client';
import { getRegionFromUrl, setRegionInUrl } from '@/utils/regionUrl';

interface RegionContextType {
  // Current selections
  region: RegionCode;
  currency: CurrencyCode;
  
  // Setters
  setRegion: (region: RegionCode) => void;
  setCurrency: (currency: CurrencyCode) => void;
  
  // Config helpers
  regionConfig: typeof REGIONS[RegionCode];
  currencyConfig: typeof CURRENCIES[CurrencyCode];
  
  // Utility functions
  formatPrice: (amount: number, options?: { showApproximate?: boolean; compact?: boolean }) => string;
  convertPrice: (amount: number, fromCurrency: CurrencyCode) => number;
  getConversionRate: (fromCurrency: CurrencyCode, toCurrency: CurrencyCode) => number;
  getFallbackRegions: () => RegionCode[];
  
  // State
  isLoading: boolean;
  hasRates: boolean;
  exchangeRates: Map<string, number>;
}

const RegionContext = createContext<RegionContextType | null>(null);

const STORAGE_KEY = 'filascope_region_prefs';

interface StoredPreferences {
  region: RegionCode;
  currency: CurrencyCode;
  timestamp: number;
}

// Simple function to get initial region - URL first, then localStorage, then detect
function getInitialRegion(): RegionCode {
  // Priority 1: URL parameter
  try {
    const params = new URLSearchParams(window.location.search);
    const urlRegion = params.get('region');
    if (urlRegion && REGIONS[urlRegion as RegionCode]) {
      return urlRegion as RegionCode;
    }
  } catch (e) {
    // Ignore URL parsing errors
  }
  
  // Priority 2: localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const prefs: StoredPreferences = JSON.parse(stored);
      if (Date.now() - prefs.timestamp < 30 * 24 * 60 * 60 * 1000) {
        if (REGIONS[prefs.region]) {
          return prefs.region;
        }
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Priority 3: Browser locale detection
  const browserLocale = navigator.language || 'en-US';
  return detectRegionFromLocale(browserLocale);
}

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const initialRegion = getInitialRegion();
  const [region, setRegionState] = useState<RegionCode>(initialRegion);
  const [currency, setCurrencyState] = useState<CurrencyCode>(REGIONS[initialRegion].defaultCurrency);
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<Map<string, number>>(new Map());

  // Load exchange rates from Supabase
  const loadExchangeRates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('currency_exchange_rates')
        .select('base_currency, target_currency, rate');
      
      if (error) throw error;
      
      const rates = new Map<string, number>();
      data?.forEach(row => {
        rates.set(`${row.base_currency}_${row.target_currency}`, row.rate);
        // Also store inverse for convenience
        if (row.rate > 0) {
          rates.set(`${row.target_currency}_${row.base_currency}`, 1 / row.rate);
        }
      });
      // USD to USD is always 1
      rates.set('USD_USD', 1);
      
      setExchangeRates(rates);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
      // Set default rates as fallback
      const defaultRates = new Map<string, number>([
        ['USD_USD', 1],
        ['USD_CAD', 1.36],
        ['USD_EUR', 0.92],
        ['USD_GBP', 0.79],
        ['USD_AUD', 1.53],
        ['USD_JPY', 149.50],
        ['USD_CNY', 7.24],
      ]);
      setExchangeRates(defaultRates);
    }
  }, []);

  const savePreferences = useCallback((reg: RegionCode, curr: CurrencyCode) => {
    try {
      const prefs: StoredPreferences = {
        region: reg,
        currency: curr,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Initial load - just load exchange rates and save initial prefs
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await loadExchangeRates();
      savePreferences(region, currency);
      setIsLoading(false);
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const setRegion = useCallback((newRegion: RegionCode) => {
    setRegionState(newRegion);
    const newCurrency = REGIONS[newRegion].defaultCurrency;
    setCurrencyState(newCurrency);
    savePreferences(newRegion, newCurrency);
    // Update URL for shareability
    setRegionInUrl(newRegion);
  }, [savePreferences]);

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    savePreferences(region, newCurrency);
  }, [region, savePreferences]);

  // Whether exchange rates have been loaded (prevents 1:1 fallback bug)
  const hasRates = exchangeRates.size > 1; // At least USD_USD + one real rate

  const getConversionRate = useCallback((
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): number => {
    if (fromCurrency === toCurrency) return 1;
    
    // Direct rate
    const directKey = `${fromCurrency}_${toCurrency}`;
    if (exchangeRates.has(directKey)) {
      return exchangeRates.get(directKey)!;
    }
    
    // Via USD
    const toUsdKey = `${fromCurrency}_USD`;
    const fromUsdKey = `USD_${toCurrency}`;
    
    const toUsd = exchangeRates.get(toUsdKey);
    const fromUsd = exchangeRates.get(fromUsdKey);
    
    // If we can't find either leg, return 1 as fallback
    // Components should check `hasRates` before trusting conversion results
    if (toUsd === undefined || fromUsd === undefined) {
      return 1;
    }
    
    return toUsd * fromUsd;
  }, [exchangeRates]);

  const convertPrice = useCallback((
    amount: number,
    fromCurrency: CurrencyCode
  ): number => {
    if (fromCurrency === currency) return amount;
    const rate = getConversionRate(fromCurrency, currency);
    return Math.round(amount * rate * 100) / 100;
  }, [currency, getConversionRate]);

  const formatPriceInCurrency = useCallback((
    amount: number,
    options?: { showApproximate?: boolean; compact?: boolean }
  ): string => {
    return formatPriceUtil(amount, currency, options);
  }, [currency]);

  const getFallbackRegions = useCallback((): RegionCode[] => {
    return REGION_FALLBACK_ORDER[region] || ['US'];
  }, [region]);

  const value = useMemo(() => ({
    region,
    currency,
    setRegion,
    setCurrency,
    regionConfig: REGIONS[region],
    currencyConfig: CURRENCIES[currency],
    formatPrice: formatPriceInCurrency,
    convertPrice,
    getConversionRate,
    getFallbackRegions,
    isLoading,
    hasRates,
    exchangeRates,
  }), [
    region,
    currency,
    setRegion,
    setCurrency,
    formatPriceInCurrency,
    convertPrice,
    getConversionRate,
    getFallbackRegions,
    isLoading,
    hasRates,
    exchangeRates,
  ]);

  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
}

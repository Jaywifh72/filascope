import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { trackRegionChange } from '@/lib/analytics';
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
  ratesLastUpdated: Date | null;
}

const RegionContext = createContext<RegionContextType | null>(null);

// ─── Storage Keys ───
const PREFS_KEY = 'filascope_region_prefs';
const RATES_KEY = 'filascope_fx_rates';
const RATES_TTL = 4 * 60 * 60 * 1000; // 4 hours

interface StoredPreferences {
  region: RegionCode;
  currency: CurrencyCode;
  timestamp: number;
}

interface CachedRates {
  data: Array<{ currency_code: string; rate_to_usd: number }>;
  timestamp: number;
}

// ─── Initial Region Resolution ───
// URL param → localStorage → logged-in profile → browser locale
function getInitialRegion(): RegionCode {
  // Priority 1: URL parameter
  try {
    const params = new URLSearchParams(window.location.search);
    const urlRegion = params.get('region');
    if (urlRegion && REGIONS[urlRegion as RegionCode]) {
      return urlRegion as RegionCode;
    }
  } catch {
    // Ignore
  }
  
  // Priority 2: localStorage (cached region)
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) {
      const prefs: StoredPreferences = JSON.parse(stored);
      // Valid for 30 days
      if (Date.now() - prefs.timestamp < 30 * 24 * 60 * 60 * 1000 && REGIONS[prefs.region]) {
        return prefs.region;
      }
    }
  } catch {
    // Ignore
  }
  
  // Priority 3: Browser locale detection
  const browserLocale = navigator.language || 'en-US';
  return detectRegionFromLocale(browserLocale);
}

// ─── Rate Map Builder ───
function buildRateMap(rawRates: Array<{ currency_code: string; rate_to_usd: number }>): Map<string, number> {
  const rates = new Map<string, number>();
  rates.set('USD_USD', 1);
  
  const rateMap: Record<string, number> = { USD: 1 };
  rawRates.forEach(row => {
    if (row.rate_to_usd > 0) {
      rateMap[row.currency_code] = row.rate_to_usd;
    }
  });
  
  // Build USD↔X pairs
  for (const [code, rateToUsd] of Object.entries(rateMap)) {
    if (code === 'USD') continue;
    rates.set(`USD_${code}`, 1 / rateToUsd);
    rates.set(`${code}_USD`, rateToUsd);
  }
  
  // Build cross-currency pairs via USD pivot
  const codes = Object.keys(rateMap);
  for (const from of codes) {
    for (const to of codes) {
      if (from === to) continue;
      const key = `${from}_${to}`;
      if (!rates.has(key)) {
        const fromRate = rateMap[from];
        const toRate = rateMap[to];
        if (fromRate > 0 && toRate > 0) {
          rates.set(key, fromRate / toRate);
        }
      }
    }
  }
  
  return rates;
}

// ─── localStorage helpers ───
function readCachedRates(): CachedRates | null {
  try {
    const raw = localStorage.getItem(RATES_KEY);
    if (!raw) return null;
    const cached: CachedRates = JSON.parse(raw);
    if (!Array.isArray(cached.data) || cached.data.length === 0) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeCachedRates(data: CachedRates['data']) {
  try {
    const cached: CachedRates = { data, timestamp: Date.now() };
    localStorage.setItem(RATES_KEY, JSON.stringify(cached));
  } catch {
    // localStorage may be full or unavailable
  }
}

function savePrefsToStorage(region: RegionCode, currency: CurrencyCode) {
  try {
    const prefs: StoredPreferences = { region, currency, timestamp: Date.now() };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore
  }
}

// Default fallback rates (approximate, for offline/error scenarios)
const DEFAULT_RATES = new Map<string, number>([
  ['USD_USD', 1],
  ['USD_CAD', 1.36], ['CAD_USD', 1 / 1.36],
  ['USD_EUR', 0.92], ['EUR_USD', 1 / 0.92],
  ['USD_GBP', 0.79], ['GBP_USD', 1 / 0.79],
  ['USD_AUD', 1.53], ['AUD_USD', 1 / 1.53],
  ['USD_JPY', 149.50], ['JPY_USD', 1 / 149.50],
  ['USD_CNY', 7.24], ['CNY_USD', 1 / 7.24],
]);

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const initialRegion = getInitialRegion();
  const [region, setRegionState] = useState<RegionCode>(initialRegion);
  const [currency, setCurrencyState] = useState<CurrencyCode>(REGIONS[initialRegion].defaultCurrency);
  const [isLoading, setIsLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<Map<string, number>>(new Map());
  const [ratesLastUpdated, setRatesLastUpdated] = useState<Date | null>(null);
  const profileSyncRef = useRef(false);

  // ─── Load Exchange Rates (single call, localStorage-first) ───
  const loadExchangeRates = useCallback(async () => {
    const cached = readCachedRates();
    const isFresh = cached && (Date.now() - cached.timestamp < RATES_TTL);

    if (cached) {
      // Use cached rates immediately (even if stale)
      const rates = buildRateMap(cached.data);
      setExchangeRates(rates);
      setRatesLastUpdated(new Date(cached.timestamp));

      if (isFresh) {
        // Cache is fresh — no network call needed
        return;
      }

      // Cache is stale — background refresh (stale-while-revalidate)
      supabase
        .from('exchange_rates')
        .select('currency_code, rate_to_usd')
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const freshRates = buildRateMap(data);
            setExchangeRates(freshRates);
            setRatesLastUpdated(new Date());
            writeCachedRates(data);
          }
        });
      return;
    }

    // No cache at all — must fetch
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('currency_code, rate_to_usd');
      
      if (error) throw error;
      
      const rates = buildRateMap(data || []);
      setExchangeRates(rates);
      setRatesLastUpdated(new Date());
      writeCachedRates(data || []);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
      setExchangeRates(DEFAULT_RATES);
    }
  }, []);

  // ─── Sync region to profile (fire-and-forget, once per session) ───
  const syncRegionToProfile = useCallback(async (reg: RegionCode, curr: CurrencyCode) => {
    if (profileSyncRef.current) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      profileSyncRef.current = true;
      await supabase
        .from('profiles')
        .update({ 
          preferred_region: reg,
          preferred_currency: curr,
        })
        .eq('id', user.id);
    } catch {
      // Non-critical — silently fail
    }
  }, []);

  // ─── Load profile prefs for logged-in users (on mount) ───
  const loadProfilePrefs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Only use profile prefs if no URL param and no localStorage override
      const params = new URLSearchParams(window.location.search);
      if (params.get('region')) return;

      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) return; // localStorage takes priority over profile

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_region, preferred_currency')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.preferred_region && REGIONS[profile.preferred_region as RegionCode]) {
        const profileRegion = profile.preferred_region as RegionCode;
        const profileCurrency = (profile.preferred_currency as CurrencyCode) || REGIONS[profileRegion].defaultCurrency;
        setRegionState(profileRegion);
        setCurrencyState(profileCurrency);
        savePrefsToStorage(profileRegion, profileCurrency);
      }
    } catch {
      // Non-critical
    }
  }, []);

  // ─── Initialize ───
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      // Run rate loading and profile pref loading in parallel
      await Promise.all([
        loadExchangeRates(),
        loadProfilePrefs(),
      ]);
      savePrefsToStorage(region, currency);
      setIsLoading(false);
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Setters ───
  const setRegion = useCallback((newRegion: RegionCode) => {
    setRegionState(newRegion);
    const newCurrency = REGIONS[newRegion].defaultCurrency;
    setCurrencyState(newCurrency);
    savePrefsToStorage(newRegion, newCurrency);
    setRegionInUrl(newRegion);
    trackRegionChange(region, newRegion);
    // Sync to profile in background
    syncRegionToProfile(newRegion, newCurrency);
    profileSyncRef.current = false; // Allow re-sync on next manual change
  }, [syncRegionToProfile]);

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    savePrefsToStorage(region, newCurrency);
    syncRegionToProfile(region, newCurrency);
    profileSyncRef.current = false;
  }, [region, syncRegionToProfile]);

  // ─── Derived State ───
  const hasRates = exchangeRates.size > 1;

  const getConversionRate = useCallback((
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): number => {
    if (fromCurrency === toCurrency) return 1;
    
    const directKey = `${fromCurrency}_${toCurrency}`;
    if (exchangeRates.has(directKey)) {
      return exchangeRates.get(directKey)!;
    }
    
    const toUsd = exchangeRates.get(`${fromCurrency}_USD`);
    const fromUsd = exchangeRates.get(`USD_${toCurrency}`);
    
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
    ratesLastUpdated,
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
    ratesLastUpdated,
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

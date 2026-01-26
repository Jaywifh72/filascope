import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { RegionCode, CurrencyCode, RegionConfig } from '@/types/regional';
import { REGIONS } from '@/config/regions';
import { formatPrice, CURRENCIES } from '@/config/currencies';

const STORAGE_KEY = 'filascope_admin_region_prefs';
const DEFAULT_REGION: RegionCode = 'US';
const DEFAULT_CURRENCY: CurrencyCode = 'USD';

interface AdminRegionPrefs {
  selectedRegion: RegionCode;
  viewCurrency: CurrencyCode;
  showAllRegions: boolean;
}

interface AdminRegionContextType {
  selectedRegion: RegionCode;
  viewCurrency: CurrencyCode;
  showAllRegions: boolean;
  setSelectedRegion: (region: RegionCode) => void;
  setViewCurrency: (currency: CurrencyCode) => void;
  setShowAllRegions: (show: boolean) => void;
  formatAdminPrice: (amount: number | null | undefined, sourceCurrency?: CurrencyCode) => string;
  regionConfig: RegionConfig;
  allRegions: RegionCode[];
  allCurrencies: CurrencyCode[];
}

const AdminRegionContext = createContext<AdminRegionContextType | undefined>(undefined);

function loadPrefs(): AdminRegionPrefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        selectedRegion: parsed.selectedRegion || DEFAULT_REGION,
        viewCurrency: parsed.viewCurrency || DEFAULT_CURRENCY,
        showAllRegions: parsed.showAllRegions || false,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return {
    selectedRegion: DEFAULT_REGION,
    viewCurrency: DEFAULT_CURRENCY,
    showAllRegions: false,
  };
}

function savePrefs(prefs: AdminRegionPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

export function AdminRegionProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AdminRegionPrefs>(loadPrefs);

  // Persist to localStorage when prefs change
  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const setSelectedRegion = useCallback((region: RegionCode) => {
    setPrefs((prev) => {
      // Update currency to match region's default if currently using a matching currency
      const regionDefaultCurrency = REGIONS[region]?.defaultCurrency || 'USD';
      const newCurrency = REGIONS[prev.selectedRegion]?.defaultCurrency === prev.viewCurrency
        ? regionDefaultCurrency
        : prev.viewCurrency;
      
      return {
        ...prev,
        selectedRegion: region,
        viewCurrency: newCurrency as CurrencyCode,
      };
    });
  }, []);

  const setViewCurrency = useCallback((currency: CurrencyCode) => {
    setPrefs((prev) => ({
      ...prev,
      viewCurrency: currency,
    }));
  }, []);

  const setShowAllRegions = useCallback((show: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      showAllRegions: show,
    }));
  }, []);

  const formatAdminPrice = useCallback(
    (amount: number | null | undefined, sourceCurrency?: CurrencyCode): string => {
      if (amount == null) return '—';
      // For now, just format in the view currency (no conversion - that's handled elsewhere)
      return formatPrice(amount, sourceCurrency || prefs.viewCurrency);
    },
    [prefs.viewCurrency]
  );

  const regionConfig = REGIONS[prefs.selectedRegion] || REGIONS.US;

  const allRegions: RegionCode[] = ['US', 'CA', 'UK', 'EU', 'AU', 'JP', 'CN'];
  const allCurrencies: CurrencyCode[] = Object.keys(CURRENCIES) as CurrencyCode[];

  return (
    <AdminRegionContext.Provider
      value={{
        selectedRegion: prefs.selectedRegion,
        viewCurrency: prefs.viewCurrency,
        showAllRegions: prefs.showAllRegions,
        setSelectedRegion,
        setViewCurrency,
        setShowAllRegions,
        formatAdminPrice,
        regionConfig,
        allRegions,
        allCurrencies,
      }}
    >
      {children}
    </AdminRegionContext.Provider>
  );
}

export function useAdminRegion(): AdminRegionContextType {
  const context = useContext(AdminRegionContext);
  if (!context) {
    throw new Error('useAdminRegion must be used within an AdminRegionProvider');
  }
  return context;
}

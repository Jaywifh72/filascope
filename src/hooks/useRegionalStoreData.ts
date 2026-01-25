import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRegion } from '@/contexts/RegionContext';
import { RegionCode, CurrencyCode, BrandRegionalStore, REGION_CONFIGS } from '@/types/regional';

/**
 * Regional store information with computed fields
 */
export interface RegionalStoreData {
  id: string;
  storeName: string;
  regionCode: RegionCode;
  baseUrl: string;
  productUrlPattern: string | null;
  currencyCode: CurrencyCode;
  shipsFrom: string | null;
  freeShippingThreshold: number | null;
  estimatedShippingDays: number | null;
  isLocal: boolean;
  flag: string;
}

interface UseRegionalStoreDataResult {
  /** Store matching user's region or best fallback */
  primaryStore: RegionalStoreData | null;
  /** All available stores for the brand */
  allStores: RegionalStoreData[];
  /** Stores sorted by user's region priority */
  sortedStores: RegionalStoreData[];
  /** Whether brand has a store in user's region */
  hasLocalStore: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Generate product URL for a specific store */
  getProductUrl: (store: RegionalStoreData, productSku?: string) => string;
}

/**
 * useRegionalStoreData - Fetches and caches regional store data for a brand
 * 
 * Automatically sorts stores by user's region priority and identifies local stores.
 * Uses React Query for efficient caching across components.
 * 
 * @example
 * const { primaryStore, allStores, hasLocalStore, isLoading } = useRegionalStoreData('Bambu Lab');
 */
export function useRegionalStoreData(brandName: string | null): UseRegionalStoreDataResult {
  const { region, getFallbackRegions } = useRegion();

  // Query for brand ID first, then stores
  const { data: brandData, isLoading: brandLoading } = useQuery({
    queryKey: ['brand-id', brandName?.toLowerCase()],
    queryFn: async () => {
      if (!brandName) return null;
      
      const { data, error } = await supabase
        .from('automated_brands')
        .select('id, brand_name')
        .ilike('brand_name', brandName)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!brandName,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Query stores once we have brand ID
  const { data: rawStores, isLoading: storesLoading, error } = useQuery({
    queryKey: ['regional-stores', brandData?.id],
    queryFn: async () => {
      if (!brandData?.id) return [];
      
      const { data, error } = await supabase
        .from('brand_regional_stores')
        .select('*')
        .eq('brand_id', brandData.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!brandData?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Transform and sort stores
  const processedData = useMemo(() => {
    if (!rawStores || rawStores.length === 0) {
      return {
        primaryStore: null,
        allStores: [],
        sortedStores: [],
        hasLocalStore: false,
      };
    }

    // Transform raw data to RegionalStoreData
    const stores: RegionalStoreData[] = rawStores.map((store) => ({
      id: store.id,
      storeName: store.store_name,
      regionCode: store.region_code as RegionCode,
      baseUrl: store.base_url,
      productUrlPattern: store.product_url_pattern,
      currencyCode: store.currency_code as CurrencyCode,
      shipsFrom: store.ships_from_country,
      freeShippingThreshold: store.free_shipping_threshold,
      estimatedShippingDays: store.estimated_shipping_days,
      isLocal: store.region_code === region,
      flag: REGION_CONFIGS[store.region_code as RegionCode]?.flag || '🌐',
    }));

    // Check if local store exists
    const hasLocalStore = stores.some((s) => s.regionCode === region);

    // Sort by region priority
    const fallbackOrder = getFallbackRegions();
    const regionPriority = [region, ...fallbackOrder];
    
    const sortedStores = [...stores].sort((a, b) => {
      const aIndex = regionPriority.indexOf(a.regionCode);
      const bIndex = regionPriority.indexOf(b.regionCode);
      const aPriority = aIndex === -1 ? 999 : aIndex;
      const bPriority = bIndex === -1 ? 999 : bIndex;
      return aPriority - bPriority;
    });

    // Primary store is the first in sorted order
    const primaryStore = sortedStores[0] || null;

    return {
      primaryStore,
      allStores: stores,
      sortedStores,
      hasLocalStore,
    };
  }, [rawStores, region, getFallbackRegions]);

  // URL generation helper
  const getProductUrl = useCallback(
    (store: RegionalStoreData, productSku?: string): string => {
      if (!productSku || !store.productUrlPattern) {
        return store.baseUrl;
      }
      
      return store.productUrlPattern
        .replace('{sku}', productSku)
        .replace('{handle}', productSku)
        .replace('{product_id}', productSku);
    },
    []
  );

  return {
    ...processedData,
    isLoading: brandLoading || storesLoading,
    error: error as Error | null,
    getProductUrl,
  };
}

/**
 * useRegionalStoreDataById - Same as useRegionalStoreData but takes brand ID directly
 */
export function useRegionalStoreDataById(brandId: string | null): UseRegionalStoreDataResult {
  const { region, getFallbackRegions } = useRegion();

  const { data: rawStores, isLoading, error } = useQuery({
    queryKey: ['regional-stores', brandId],
    queryFn: async () => {
      if (!brandId) return [];
      
      const { data, error } = await supabase
        .from('brand_regional_stores')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!brandId,
    staleTime: 1000 * 60 * 10,
  });

  const processedData = useMemo(() => {
    if (!rawStores || rawStores.length === 0) {
      return {
        primaryStore: null,
        allStores: [],
        sortedStores: [],
        hasLocalStore: false,
      };
    }

    const stores: RegionalStoreData[] = rawStores.map((store) => ({
      id: store.id,
      storeName: store.store_name,
      regionCode: store.region_code as RegionCode,
      baseUrl: store.base_url,
      productUrlPattern: store.product_url_pattern,
      currencyCode: store.currency_code as CurrencyCode,
      shipsFrom: store.ships_from_country,
      freeShippingThreshold: store.free_shipping_threshold,
      estimatedShippingDays: store.estimated_shipping_days,
      isLocal: store.region_code === region,
      flag: REGION_CONFIGS[store.region_code as RegionCode]?.flag || '🌐',
    }));

    const hasLocalStore = stores.some((s) => s.regionCode === region);
    const fallbackOrder = getFallbackRegions();
    const regionPriority = [region, ...fallbackOrder];
    
    const sortedStores = [...stores].sort((a, b) => {
      const aIndex = regionPriority.indexOf(a.regionCode);
      const bIndex = regionPriority.indexOf(b.regionCode);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    return {
      primaryStore: sortedStores[0] || null,
      allStores: stores,
      sortedStores,
      hasLocalStore,
    };
  }, [rawStores, region, getFallbackRegions]);

  const getProductUrl = useCallback(
    (store: RegionalStoreData, productSku?: string): string => {
      if (!productSku || !store.productUrlPattern) {
        return store.baseUrl;
      }
      return store.productUrlPattern
        .replace('{sku}', productSku)
        .replace('{handle}', productSku)
        .replace('{product_id}', productSku);
    },
    []
  );

  return {
    ...processedData,
    isLoading,
    error: error as Error | null,
    getProductUrl,
  };
}

export default useRegionalStoreData;

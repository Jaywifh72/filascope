import { useState, useEffect } from 'react';
import { useRegion } from '@/contexts/RegionContext';
import { supabase } from '@/integrations/supabase/client';
import { RegionCode, CurrencyCode, RegionalPriceResult } from '@/types/regional';
import { formatPrice } from '@/config/currencies';

interface BrandRegionalStoreRow {
  id: string;
  brand_id: string;
  region_code: string;
  store_name: string;
  base_url: string;
  product_url_pattern: string | null;
  currency_code: string;
  ships_from_country: string | null;
  free_shipping_threshold: number | null;
  estimated_shipping_days: number | null;
  is_primary: boolean | null;
  is_active: boolean | null;
}

interface UseRegionalPriceV2Options {
  brandId: string;
  basePrice?: number;
  baseCurrency?: CurrencyCode;
}

export function useRegionalPriceV2({
  brandId,
  basePrice,
  baseCurrency = 'USD',
}: UseRegionalPriceV2Options) {
  const { region, currency, getFallbackRegions, convertPrice, getConversionRate } = useRegion();
  const [priceResult, setPriceResult] = useState<RegionalPriceResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allStores, setAllStores] = useState<BrandRegionalStoreRow[]>([]);

  useEffect(() => {
    const fetchRegionalPrice = async () => {
      if (!brandId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        // Fetch all stores for this brand
        const { data: stores, error } = await supabase
          .from('brand_regional_stores')
          .select('*')
          .eq('brand_id', brandId)
          .eq('is_active', true);
        
        if (error) throw error;
        
        setAllStores(stores || []);
        
        if (!stores || stores.length === 0) {
          // No regional stores, use base price with conversion
          if (basePrice !== undefined) {
            const converted = convertPrice(basePrice, baseCurrency);
            const rate = getConversionRate(baseCurrency, currency);
            
            setPriceResult({
              displayPrice: converted,
              displayCurrency: currency,
              formattedPrice: formatPrice(converted, currency, { showApproximate: baseCurrency !== currency }),
              originalPrice: basePrice,
              originalCurrency: baseCurrency,
              isConverted: baseCurrency !== currency,
              conversionRate: rate,
              store: {
                id: '',
                name: 'Direct',
                url: '',
                regionCode: 'US',
                shipsFrom: null,
                freeShippingThreshold: null,
              },
            });
          }
          setIsLoading(false);
          return;
        }
        
        // Try to find store in user's region first
        let matchedStore = stores.find(s => s.region_code === region);
        let isConverted = false;
        
        // If no exact match, try fallback regions
        if (!matchedStore) {
          const fallbacks = getFallbackRegions();
          for (const fallbackRegion of fallbacks) {
            matchedStore = stores.find(s => s.region_code === fallbackRegion);
            if (matchedStore) {
              isConverted = true;
              break;
            }
          }
        }
        
        // If still no match, use first available store
        if (!matchedStore) {
          matchedStore = stores[0];
          isConverted = matchedStore.currency_code !== currency;
        }
        
        // Calculate price
        const storePrice = basePrice || 0;
        const storeCurrency = matchedStore.currency_code as CurrencyCode;
        
        let displayPrice = storePrice;
        let conversionRate: number | null = null;
        
        if (storeCurrency !== currency) {
          conversionRate = getConversionRate(storeCurrency, currency);
          displayPrice = Math.round(storePrice * conversionRate * 100) / 100;
          isConverted = true;
        }
        
        setPriceResult({
          displayPrice,
          displayCurrency: currency,
          formattedPrice: formatPrice(displayPrice, currency, { showApproximate: isConverted }),
          originalPrice: storePrice,
          originalCurrency: storeCurrency,
          isConverted,
          conversionRate,
          store: {
            id: matchedStore.id,
            name: matchedStore.store_name,
            url: matchedStore.base_url,
            regionCode: matchedStore.region_code as RegionCode,
            shipsFrom: matchedStore.ships_from_country,
            freeShippingThreshold: matchedStore.free_shipping_threshold,
          },
        });
        
      } catch (error) {
        console.error('Error fetching regional price:', error);
        // Fallback to base price
        if (basePrice !== undefined) {
          setPriceResult({
            displayPrice: basePrice,
            displayCurrency: baseCurrency,
            formattedPrice: formatPrice(basePrice, baseCurrency),
            originalPrice: basePrice,
            originalCurrency: baseCurrency,
            isConverted: false,
            conversionRate: null,
            store: {
              id: '',
              name: 'Unknown',
              url: '',
              regionCode: 'US',
              shipsFrom: null,
              freeShippingThreshold: null,
            },
          });
        }
      }
      
      setIsLoading(false);
    };
    
    fetchRegionalPrice();
  }, [brandId, basePrice, baseCurrency, region, currency, getFallbackRegions, convertPrice, getConversionRate]);

  return {
    priceResult,
    isLoading,
    allStores,
    hasRegionalStore: allStores.some(s => s.region_code === region),
  };
}

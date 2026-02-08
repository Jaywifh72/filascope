/**
 * useFilamentStorePricing Hook
 * 
 * Fetches and transforms store pricing data from the filament_prices table
 * using the existing get_filament_regional_prices RPC function.
 * 
 * Returns the best price for the user's region along with all available prices.
 */

import { useMemo } from 'react';
import { useFilamentRegionalPrices } from './useFilamentPrices';
import { useExchangeRateMap, convertPrice } from './useExchangeRates';
import { useRegion } from '@/contexts/RegionContext';
import { formatCents } from '@/utils/formatPrice';
import type { RegionalPriceRpcResult, CurrencyCode, RegionCode, StoreType } from '@/types/regional';
import { REGIONS } from '@/config/regions';

// =============================================
// Types
// =============================================

export interface StorePrice {
  /** Price in the smallest currency unit (cents) */
  priceCents: number;
  /** Price as a display number (price_cents / 100) */
  priceDisplay: number;
  /** Currency code of the price */
  currencyCode: CurrencyCode;
  /** Formatted price string for display */
  formattedPrice: string;
  /** Store name */
  storeName: string;
  /** Store slug identifier */
  storeSlug: string;
  /** Type of store */
  storeType: StoreType;
  /** Store region code */
  storeRegion: RegionCode;
  /** Country code of the store */
  countryCode: string | null;
  /** Product URL at this store */
  productUrl: string | null;
  /** Countries/regions the store ships from */
  shipsFrom: string[] | null;
  /** Whether the store ships to the user's region */
  shipsToUser: boolean;
  /** Whether this is a local store (in user's region) */
  isLocalStore: boolean;
  /** Whether the price was converted from another currency */
  isConverted: boolean;
  /** Original price before conversion (if converted) */
  originalPrice?: number;
  /** Original currency before conversion (if converted) */
  originalCurrency?: CurrencyCode;
  /** Last time the price was verified */
  lastVerifiedAt: string | null;
}

export interface UseFilamentStorePricingResult {
  /** Best price for the user's region (first result) */
  bestPrice: StorePrice | null;
  /** All available prices sorted by relevance */
  allPrices: StorePrice[];
  /** Loading state (first load, no cache) */
  isLoading: boolean;
  /** Fetching state (background refetch) */
  isFetching: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether any price data exists in the store listings */
  hasPriceData: boolean;
}

// =============================================
// Helper Functions
// =============================================

/**
 * Transform RPC result to StorePrice format
 */
function transformRpcResult(
  rpcResult: RegionalPriceRpcResult,
  userCurrency: CurrencyCode,
  exchangeRates: Record<string, number>
): StorePrice {
  const priceDisplay = rpcResult.price_cents / 100;
  const storeCurrency = rpcResult.currency_code as CurrencyCode;
  
  // Check if we need to convert the price to user's currency
  let displayPrice = priceDisplay;
  let displayCurrency = storeCurrency;
  let isConverted = rpcResult.converted_price;
  let originalPrice: number | undefined;
  let originalCurrency: CurrencyCode | undefined;
  
  // If the store currency differs from user's preferred currency, convert
  if (storeCurrency !== userCurrency && exchangeRates[storeCurrency] && exchangeRates[userCurrency]) {
    originalPrice = priceDisplay;
    originalCurrency = storeCurrency;
    displayPrice = convertPrice(priceDisplay, storeCurrency, userCurrency, exchangeRates) ?? priceDisplay;
    displayCurrency = userCurrency;
    isConverted = true;
  }
  
  const formattedPrice = formatCents(
    Math.round(displayPrice * 100),
    displayCurrency,
    { showApproximate: isConverted }
  );
  
  return {
    priceCents: rpcResult.price_cents,
    priceDisplay: displayPrice,
    currencyCode: displayCurrency,
    formattedPrice,
    storeName: rpcResult.store_name,
    storeSlug: rpcResult.store_slug,
    storeType: rpcResult.store_type as StoreType,
    storeRegion: rpcResult.region as RegionCode,
    countryCode: rpcResult.country_code,
    productUrl: rpcResult.product_url,
    shipsFrom: rpcResult.ships_from,
    shipsToUser: rpcResult.ships_to_user,
    isLocalStore: rpcResult.is_local_store,
    isConverted,
    originalPrice,
    originalCurrency,
    lastVerifiedAt: null, // RPC doesn't return this yet
  };
}

// =============================================
// Hook
// =============================================

/**
 * Get store-based pricing for a filament from the filament_prices table
 * 
 * @param filamentId - The filament ID to get prices for
 * @returns Store pricing result with best price and all prices
 */
export function useFilamentStorePricing(
  filamentId: string | undefined
): UseFilamentStorePricingResult {
  const { region, currency } = useRegion();
  const { data: exchangeRates, isLoading: ratesLoading } = useExchangeRateMap();
  
  // Fetch regional prices from the RPC function
  const { 
    data: rpcResults, 
    isLoading: pricesLoading,
    isFetching: pricesFetching,
    error 
  } = useFilamentRegionalPrices(filamentId, region);
  
  const isLoading = pricesLoading || ratesLoading;
  const isFetching = pricesFetching;
  
  // Memoize the transformed prices to prevent reference instability
  // (previously created a new array every render, triggering downstream useMemo recalcs)
  const allPrices = useMemo(() => {
    if (!rpcResults || rpcResults.length === 0 || !exchangeRates) return [];
    
    const prices: StorePrice[] = [];
    for (const result of rpcResults) {
      if (result.price_cents > 0) {
        prices.push(transformRpcResult(result, currency, exchangeRates));
      }
    }
    return prices;
  }, [rpcResults, exchangeRates, currency]);
  
  const bestPrice = allPrices.length > 0 ? allPrices[0] : null;
  const hasPriceData = allPrices.length > 0;
  
  return {
    bestPrice,
    allPrices,
    isLoading,
    isFetching,
    error: error?.message ?? null,
    hasPriceData,
  };
}
/**
 * Get shipping display text for a store price
 */
export function getShippingDisplayText(storePrice: StorePrice): string | null {
  if (storePrice.isLocalStore) {
    return null; // No shipping message for local stores
  }
  
  const regionConfig = REGIONS[storePrice.storeRegion];
  const regionName = regionConfig?.name || storePrice.storeRegion;
  
  if (storePrice.shipsFrom && storePrice.shipsFrom.length > 0) {
    return `Ships from ${storePrice.shipsFrom.join(', ')}`;
  }
  
  return `Ships from ${regionName}`;
}

/**
 * Get store type badge configuration
 */
export function getStoreTypeBadge(storeType: StoreType): {
  label: string;
  variant: 'default' | 'secondary' | 'outline';
  className: string;
} {
  switch (storeType) {
    case 'marketplace':
      return {
        label: 'Marketplace',
        variant: 'secondary',
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      };
    case 'brand_direct':
      return {
        label: 'Official Store',
        variant: 'secondary',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      };
    case 'retailer':
      return {
        label: 'Retailer',
        variant: 'secondary',
        className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      };
    default:
      return {
        label: 'Store',
        variant: 'outline',
        className: '',
      };
  }
}

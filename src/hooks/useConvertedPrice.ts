import { useMemo } from 'react';
import { useRegion } from '@/contexts/RegionContext';
import { CurrencyCode, CURRENCY_CONFIGS, formatCurrencyPrice } from '@/types/regional';

/**
 * Conversion info for tooltip display
 */
export interface ConversionInfo {
  /** Original price in source currency */
  originalPrice: number;
  /** Formatted original price string */
  formattedOriginalPrice: string;
  /** Source currency code */
  sourceCurrency: CurrencyCode;
  /** Target currency code */
  targetCurrency: CurrencyCode;
  /** Conversion rate applied */
  rate: number;
  /** Rate string for display (e.g., "1 USD = 1.35 CAD") */
  rateString: string;
  /** When exchange rate was last updated */
  lastUpdated: string | null;
}

/**
 * Result from useConvertedPrice hook
 */
export interface UseConvertedPriceResult {
  /** Final display price in user's currency */
  displayPrice: number;
  /** Formatted price string (e.g., "$12.00", "C$15.60") */
  formattedPrice: string;
  /** Whether price was converted from another currency */
  isConverted: boolean;
  /** Conversion details for tooltip (null if not converted) */
  conversionInfo: ConversionInfo | null;
  /** User's selected currency */
  userCurrency: CurrencyCode;
  /** Prefix to use for converted prices */
  approximatePrefix: string;
}

/**
 * useConvertedPrice - Converts a price to user's selected currency
 * 
 * Returns formatted price with conversion metadata for tooltips.
 * Handles all currency conversion logic centrally.
 * 
 * @example
 * // Price stored as 12.00 CAD, user viewing in USD
 * const { formattedPrice, isConverted, conversionInfo } = useConvertedPrice(12.00, 'CAD');
 * // formattedPrice: "~$8.89"
 * // isConverted: true
 * // conversionInfo: { originalPrice: 12, rate: 0.74, ... }
 * 
 * @example
 * // Price stored as 12.00 CAD, user viewing in CAD
 * const { formattedPrice, isConverted } = useConvertedPrice(12.00, 'CAD');
 * // formattedPrice: "C$12.00"
 * // isConverted: false
 */
export function useConvertedPrice(
  amount: number | null | undefined,
  sourceCurrency: CurrencyCode = 'USD'
): UseConvertedPriceResult {
  const { currency, getConversionRate, exchangeRates } = useRegion();

  return useMemo(() => {
    // Handle null/undefined amounts
    if (amount === null || amount === undefined) {
      return {
        displayPrice: 0,
        formattedPrice: '—',
        isConverted: false,
        conversionInfo: null,
        userCurrency: currency,
        approximatePrefix: '',
      };
    }

    const isConverted = sourceCurrency !== currency;
    const rate = isConverted ? getConversionRate(sourceCurrency, currency) : 1;
    const displayPrice = isConverted ? amount * rate : amount;
    
    // Format the display price
    const formattedPrice = isConverted
      ? `~${formatCurrencyPrice(displayPrice, currency)}`
      : formatCurrencyPrice(displayPrice, currency);

    // Build conversion info if converted
    let conversionInfo: ConversionInfo | null = null;
    
    if (isConverted) {
      const lastUpdated = exchangeRates?.[currency]?.fetched_at || null;
      
      conversionInfo = {
        originalPrice: amount,
        formattedOriginalPrice: formatCurrencyPrice(amount, sourceCurrency),
        sourceCurrency,
        targetCurrency: currency,
        rate,
        rateString: `1 ${sourceCurrency} = ${rate.toFixed(4)} ${currency}`,
        lastUpdated: lastUpdated
          ? new Date(lastUpdated).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : null,
      };
    }

    return {
      displayPrice,
      formattedPrice,
      isConverted,
      conversionInfo,
      userCurrency: currency,
      approximatePrefix: isConverted ? '~' : '',
    };
  }, [amount, sourceCurrency, currency, getConversionRate, exchangeRates]);
}

/**
 * useConvertedPriceRange - Converts a price range to user's currency
 * 
 * Useful for filter sliders and price range displays.
 */
export function useConvertedPriceRange(
  min: number,
  max: number,
  sourceCurrency: CurrencyCode = 'USD'
): {
  displayMin: number;
  displayMax: number;
  formattedMin: string;
  formattedMax: string;
  isConverted: boolean;
} {
  const { currency, getConversionRate } = useRegion();

  return useMemo(() => {
    const isConverted = sourceCurrency !== currency;
    const rate = isConverted ? getConversionRate(sourceCurrency, currency) : 1;
    
    const displayMin = isConverted ? min * rate : min;
    const displayMax = isConverted ? max * rate : max;
    
    return {
      displayMin,
      displayMax,
      formattedMin: formatCurrencyPrice(displayMin, currency),
      formattedMax: formatCurrencyPrice(displayMax, currency),
      isConverted,
    };
  }, [min, max, sourceCurrency, currency, getConversionRate]);
}

/**
 * useFormatPrice - Simple price formatting in user's currency
 * 
 * For when you already have the price in the correct currency
 * and just need formatting.
 */
export function useFormatPrice() {
  const { currency } = useRegion();

  return useMemo(
    () => ({
      format: (amount: number) => formatCurrencyPrice(amount, currency),
      currency,
      symbol: CURRENCY_CONFIGS[currency]?.symbol || '$',
    }),
    [currency]
  );
}

export default useConvertedPrice;

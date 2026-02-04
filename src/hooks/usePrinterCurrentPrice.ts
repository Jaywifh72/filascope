import { useState } from 'react';
import { useCurrency } from './useCurrency';

interface PrinterCurrentPriceResult {
  currentPrice: number | null;
  compareAtPrice: number | null;
  currency: string;
  isLoading: boolean;
  isLivePrice: boolean;
  error: string | null;
  fetchedAt: string | null;
  /** True if the scraped currency doesn't match the requested currency */
  currencyMismatch: boolean;
  /** The URL that was actually scraped (may differ after regional transformation) */
  sourceUrl: string | null;
}

/**
 * Hook for printer pricing
 * 
 * TEMPORARY FIX: Live scraping is disabled for printers because the scraper
 * incorrectly picks up accessory/filament prices ($11.04) instead of the
 * main printer price ($399). This hook now returns the database fallback
 * price directly, which is accurate and manually verified.
 * 
 * TODO: Re-enable live scraping once the edge function can reliably
 * extract printer prices from complex product pages.
 */
export function usePrinterCurrentPrice(
  _productUrl: string | null | undefined,
  fallbackPrice: number | null
): PrinterCurrentPriceResult {
  const { currency } = useCurrency();
  
  // Return database price directly - live scraping disabled
  const [state] = useState<PrinterCurrentPriceResult>({
    currentPrice: fallbackPrice,
    compareAtPrice: null,
    currency: currency,
    isLoading: false,
    isLivePrice: false,
    error: null,
    fetchedAt: null,
    currencyMismatch: false,
    sourceUrl: null,
  });
  
  return state;
}

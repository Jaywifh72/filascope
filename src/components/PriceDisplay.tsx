/**
 * PriceDisplay — region-aware price component
 *
 * Priority:
 *  1. Native price in user's currency (no conversion needed)
 *  2. USD price converted via RegionContext exchange rates (shown as "~CAD 20.00 (est.)")
 *  3. "—" if no price data available
 *
 * Uses the canonical RegionContext for currency state and conversion so it stays
 * in sync with the RegionSelector in the Navbar.
 */
import React from 'react';
import { useRegion } from '@/contexts/RegionContext';
import type { Currency } from '@/lib/exchange-rates';
import { formatPrice } from '@/lib/exchange-rates';

interface PriceDisplayProps {
  priceUsd?: number | null;
  priceCad?: number | null;
  priceGbp?: number | null;
  priceEur?: number | null;
  priceAud?: number | null;
  priceJpy?: number | null;
  showConvertedNote?: boolean;
  className?: string;
}

type PriceKey = keyof PriceDisplayProps;

const NATIVE_PRICE_KEY: Record<Currency, PriceKey> = {
  USD: 'priceUsd',
  CAD: 'priceCad',
  GBP: 'priceGbp',
  EUR: 'priceEur',
  AUD: 'priceAud',
  JPY: 'priceJpy',
};

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  priceUsd,
  priceCad,
  priceGbp,
  priceEur,
  priceAud,
  priceJpy,
  showConvertedNote = true,
  className = '',
}) => {
  const { currency, convertPrice, hasRates } = useRegion();
  const cur = currency as Currency;

  const priceMap: Partial<Record<PriceKey, number | null | undefined>> = {
    priceUsd,
    priceCad,
    priceGbp,
    priceEur,
    priceAud,
    priceJpy,
  };

  // 1. Native price in user's currency
  const nativeKey = NATIVE_PRICE_KEY[cur];
  const nativePrice = priceMap[nativeKey];
  if (nativePrice != null && nativePrice > 0) {
    return <span className={className}>{formatPrice(nativePrice, cur)}</span>;
  }

  // 2. Converted USD price
  if (priceUsd != null && priceUsd > 0 && hasRates) {
    const converted = convertPrice(priceUsd, 'USD');
    return (
      <span className={`${className} opacity-75`} title="Estimated price based on exchange rate">
        ~{formatPrice(converted, cur)}
        {showConvertedNote && (
          <span className="text-xs ml-1 text-muted-foreground">(est.)</span>
        )}
      </span>
    );
  }

  // 3. Fallback: show USD if available (rates not loaded yet)
  if (priceUsd != null && priceUsd > 0) {
    return <span className={className}>{formatPrice(priceUsd, 'USD')}</span>;
  }

  return <span className={`${className} text-muted-foreground`}>—</span>;
};

export default PriceDisplay;

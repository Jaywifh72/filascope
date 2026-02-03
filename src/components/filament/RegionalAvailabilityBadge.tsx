import React from 'react';
import { AlertTriangle, Globe, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyCode, CURRENCIES } from '@/hooks/useCurrency';

/**
 * Maps currency codes to human-readable region names
 */
const CURRENCY_TO_REGION_NAME: Record<CurrencyCode, string> = {
  USD: 'United States',
  CAD: 'Canada',
  GBP: 'United Kingdom',
  EUR: 'Europe',
  AUD: 'Australia',
  JPY: 'Japan',
  CHF: 'Switzerland',
  SEK: 'Sweden',
  CNY: 'China',
  KRW: 'South Korea',
  INR: 'India',
  MXN: 'Mexico',
  BRL: 'Brazil',
  NZD: 'New Zealand',
  PLN: 'Poland',
  CZK: 'Czech Republic',
};

interface RegionalAvailabilityBadgeProps {
  /** Whether the product is available in the user's selected region */
  isAvailableInRegion: boolean;
  /** User's selected currency */
  userCurrency: CurrencyCode;
  /** The actual currency of the URL being used (fallback region) */
  fallbackCurrency: CurrencyCode | null;
  /** Whether this is a regional brand (vs global brand that ships everywhere) */
  isRegionalBrand: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional classes */
  className?: string;
}

/**
 * Displays regional availability status for products
 * 
 * For regional brands (Elegoo, Bambu Lab, etc.), shows:
 * - "Not available in your region" if no regional URL/price exists
 * - "Ships from [Country] store" if using a fallback region
 * 
 * For global brands, shows nothing (they ship worldwide)
 */
export function RegionalAvailabilityBadge({
  isAvailableInRegion,
  userCurrency,
  fallbackCurrency,
  isRegionalBrand,
  size = 'md',
  className,
}: RegionalAvailabilityBadgeProps) {
  // Global brands ship everywhere - no badge needed
  if (!isRegionalBrand) {
    return null;
  }

  // Product IS available in user's region - no warning needed
  if (isAvailableInRegion && (!fallbackCurrency || fallbackCurrency === userCurrency)) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
  };

  // Using fallback region (e.g., Canadian user seeing US store)
  if (fallbackCurrency && fallbackCurrency !== userCurrency) {
    const fallbackRegionName = CURRENCY_TO_REGION_NAME[fallbackCurrency] || fallbackCurrency;
    
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-md font-medium',
          'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          sizeClasses[size],
          className
        )}
      >
        <Globe className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
        <span>
          Ships from {fallbackRegionName} store
        </span>
      </div>
    );
  }

  // Not available in region at all
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md font-medium',
        'bg-destructive/10 text-destructive border border-destructive/20',
        sizeClasses[size],
        className
      )}
    >
      <AlertTriangle className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      <span>
        Not available in {CURRENCY_TO_REGION_NAME[userCurrency] || 'your region'}
      </span>
    </div>
  );
}

/**
 * Simple inline text for indicating cross-border shipping
 */
export function CrossBorderNote({
  fallbackCurrency,
  userCurrency,
  className,
}: {
  fallbackCurrency: CurrencyCode | null;
  userCurrency: CurrencyCode;
  className?: string;
}) {
  if (!fallbackCurrency || fallbackCurrency === userCurrency) {
    return null;
  }

  const fallbackRegionName = CURRENCIES[fallbackCurrency]?.name || fallbackCurrency;

  return (
    <span className={cn('text-xs text-muted-foreground', className)}>
      Price from {fallbackRegionName} store • May incur import fees
    </span>
  );
}

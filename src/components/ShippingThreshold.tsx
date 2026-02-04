import { useRegion } from "@/contexts/RegionContext";
import { CURRENCIES } from "@/config/currencies";

interface ShippingThresholdProps {
  thresholdUSD?: number;
  className?: string;
}

/**
 * Displays a free shipping threshold converted to the user's selected currency.
 * Rounds to a "nice" number (nearest 5 for most currencies, nearest 500 for JPY/KRW).
 */
export function ShippingThreshold({ 
  thresholdUSD = 49, 
  className 
}: ShippingThresholdProps) {
  const { currency, convertPrice, currencyConfig } = useRegion();
  
  // Convert USD threshold to user's currency
  const converted = convertPrice(thresholdUSD, 'USD');
  
  // Round to a "nice" number based on currency
  // For JPY/KRW (no decimals), round to nearest 500
  // For others, round to nearest 5
  const roundTo = currencyConfig.decimalPlaces === 0 ? 500 : 5;
  const niceValue = Math.ceil(converted / roundTo) * roundTo;
  
  // Format with currency symbol (no decimals for threshold)
  const formattedValue = currencyConfig.decimalPlaces === 0 
    ? niceValue.toLocaleString()
    : niceValue.toString();
  
  const display = currencyConfig.symbolPosition === 'before'
    ? `${currencyConfig.symbol}${formattedValue}`
    : `${formattedValue}${currencyConfig.symbol}`;
  
  return (
    <span className={className}>
      Free shipping on orders {display}+
    </span>
  );
}

/**
 * Returns just the formatted threshold value (e.g., "£40") for custom usage
 */
export function useShippingThreshold(thresholdUSD: number = 49): string {
  const { convertPrice, currencyConfig } = useRegion();
  
  const converted = convertPrice(thresholdUSD, 'USD');
  const roundTo = currencyConfig.decimalPlaces === 0 ? 500 : 5;
  const niceValue = Math.ceil(converted / roundTo) * roundTo;
  
  const formattedValue = currencyConfig.decimalPlaces === 0 
    ? niceValue.toLocaleString()
    : niceValue.toString();
  
  return currencyConfig.symbolPosition === 'before'
    ? `${currencyConfig.symbol}${formattedValue}`
    : `${formattedValue}${currencyConfig.symbol}`;
}

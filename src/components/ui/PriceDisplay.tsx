import { formatPrice, convertPrice, DEFAULT_RATES, type SupportedCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  priceUsd?: number | null;
  priceCad?: number | null;
  priceGbp?: number | null;
  priceEur?: number | null;
  priceAud?: number | null;
  priceJpy?: number | null;
  currency?: string;
  rates?: Record<string, number>;
  className?: string;
}

const NATIVE_PRICE_MAP: Record<string, keyof PriceDisplayProps> = {
  USD: "priceUsd",
  CAD: "priceCad",
  GBP: "priceGbp",
  EUR: "priceEur",
  AUD: "priceAud",
  JPY: "priceJpy",
};

export function PriceDisplay({
  priceUsd,
  priceCad,
  priceGbp,
  priceEur,
  priceAud,
  priceJpy,
  currency = "USD",
  rates = DEFAULT_RATES,
  className,
}: PriceDisplayProps) {
  const curr = currency as SupportedCurrency;
  const nativeKey = NATIVE_PRICE_MAP[curr];
  const nativePrices = { priceUsd, priceCad, priceGbp, priceEur, priceAud, priceJpy };
  const nativeValue = nativeKey ? (nativePrices[nativeKey] as number | null | undefined) : undefined;

  // Use native price if available
  if (nativeValue != null) {
    return (
      <span className={className}>
        {formatPrice(nativeValue, curr)}
      </span>
    );
  }

  // Fall back to converting from USD
  if (priceUsd != null) {
    const converted = convertPrice(priceUsd, curr, rates);
    return (
      <span className={cn("opacity-70", className)}>
        ~{formatPrice(converted, curr)}
      </span>
    );
  }

  // No price available
  return <span className={cn("text-muted-foreground", className)}>—</span>;
}

import { ArrowRight, Check, ShoppingCart, Activity } from "lucide-react";
import { usePrinterCompare, PrinterCompareItem } from "@/hooks/usePrinterCompare";
import { useCurrency } from "@/hooks/useCurrency";
import { useTrackPrinterEvent } from "@/hooks/usePrinterAnalytics";

interface CTAButtonsProps {
  printer: PrinterCompareItem;
  officialStoreUrl?: string | null;
  storePrice?: number | null;
  getAffiliateUrl?: (url: string, brand: string | null) => string | null;
  brand?: string | null;
  isDiscontinued?: boolean;
  largeButtons?: boolean;
}

export function CTAButtons({
  printer,
  officialStoreUrl,
  storePrice,
  getAffiliateUrl,
  brand,
  isDiscontinued,
  largeButtons = false,
}: CTAButtonsProps) {
  const { addPrinter, isSelected, isMaxReached } = usePrinterCompare();
  const { formatPrice } = useCurrency();
  const { mutate: trackEvent } = useTrackPrinterEvent();

  const isAlreadySelected = isSelected(printer.id);

  const handleAddToCompare = () => {
    if (!isAlreadySelected) {
      addPrinter(printer);
      // Track comparison event
      trackEvent({ printerId: printer.id, eventType: 'comparison' });
    }
  };

  const handleBuyClick = () => {
    // Track buy click event
    trackEvent({ printerId: printer.id, eventType: 'click_buy' });
  };

  const affiliateUrl = officialStoreUrl && getAffiliateUrl
    ? getAffiliateUrl(officialStoreUrl, brand)
    : officialStoreUrl;

  const buttonHeight = largeButtons ? 'h-14' : 'h-12';
  const buttonPadding = largeButtons ? 'px-8' : 'px-6';
  const fontSize = largeButtons ? 'text-base' : 'text-sm';
  const iconSize = largeButtons ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <div className="flex flex-wrap gap-4">
      {/* Primary: Buy Now */}
      {affiliateUrl && (
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 min-w-[160px]"
          onClick={handleBuyClick}
        >
          <button
            className={`w-full ${buttonHeight} ${buttonPadding} bg-primary text-primary-foreground ${fontSize} font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group`}
          >
            <ShoppingCart className={iconSize} />
            Buy Now
            {storePrice && !isDiscontinued && (
              <span className="text-primary-foreground/80">
                ({formatPrice(storePrice, false)})
              </span>
            )}
            <ArrowRight className={`${iconSize} transition-transform group-hover:translate-x-1`} />
          </button>
        </a>
      )}

      {/* Secondary: Compare */}
      <button
        className={`flex-1 min-w-[140px] ${buttonHeight} ${largeButtons ? 'px-6' : 'px-5'} ${fontSize} font-semibold rounded-lg flex items-center justify-center gap-2 border transition-all duration-200 ${
          isAlreadySelected || isMaxReached
            ? 'border-border text-muted-foreground cursor-not-allowed bg-muted/30'
            : 'border-primary/40 text-primary hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5'
        }`}
        onClick={handleAddToCompare}
        disabled={isAlreadySelected || isMaxReached}
      >
        {isAlreadySelected ? (
          <>
            <Check className={iconSize} />
            Added to Compare
          </>
        ) : (
          <>
            <Activity className={iconSize} />
            Compare
          </>
        )}
      </button>
    </div>
  );
}
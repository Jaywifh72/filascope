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
}

export function CTAButtons({
  printer,
  officialStoreUrl,
  storePrice,
  getAffiliateUrl,
  brand,
  isDiscontinued,
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

  return (
    <div className="flex flex-wrap gap-3">
      {/* Primary: Buy Now */}
      {affiliateUrl && (
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
          onClick={handleBuyClick}
        >
          <button
            className="h-12 px-6 bg-primary text-primary-foreground text-sm font-semibold rounded-lg flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group"
          >
            <ShoppingCart className="h-4 w-4" />
            Buy Now
            {storePrice && !isDiscontinued && (
              <span className="text-primary-foreground/80">
                ({formatPrice(storePrice, false)})
              </span>
            )}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </a>
      )}

      {/* Secondary: Compare */}
      <button
        className={`h-12 px-5 text-sm font-semibold rounded-lg flex items-center gap-2 border transition-all duration-200 ${
          isAlreadySelected || isMaxReached
            ? 'border-border text-muted-foreground cursor-not-allowed bg-muted/30'
            : 'border-primary/40 text-primary hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5'
        }`}
        onClick={handleAddToCompare}
        disabled={isAlreadySelected || isMaxReached}
      >
        {isAlreadySelected ? (
          <>
            <Check className="h-4 w-4" />
            Added to Compare
          </>
        ) : (
          <>
            <Activity className="h-4 w-4" />
            Compare
          </>
        )}
      </button>
    </div>
  );
}
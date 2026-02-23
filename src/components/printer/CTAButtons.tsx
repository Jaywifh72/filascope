import { ArrowRight, Check, ShoppingCart, Activity, ExternalLink } from "lucide-react";
import { usePrinterCompare, PrinterCompareItem } from "@/hooks/usePrinterCompare";
import { useTrackPrinterEvent } from "@/hooks/usePrinterAnalytics";

interface CTAButtonsProps {
  printer: PrinterCompareItem;
  officialStoreUrl?: string | null;
  storePrice?: number | null;
  getAffiliateUrl?: (url: string, brand: string | null) => string | null;
  brand?: string | null;
  isDiscontinued?: boolean;
  largeButtons?: boolean;
  /** Stack buttons vertically for sidebar */
  stackedButtons?: boolean;
  /** Store name for Buy button label */
  storeName?: string | null;
}

export function CTAButtons({
  printer,
  officialStoreUrl,
  storePrice,
  getAffiliateUrl,
  brand,
  isDiscontinued,
  largeButtons = false,
  stackedButtons = false,
  storeName,
}: CTAButtonsProps) {
  const { addPrinter, isSelected, isMaxReached } = usePrinterCompare();
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

  const buttonHeight = stackedButtons ? 'h-11' : largeButtons ? 'h-14' : 'h-12';
  const buttonPadding = stackedButtons ? 'px-4' : largeButtons ? 'px-8' : 'px-6';
  const fontSize = stackedButtons ? 'text-sm' : largeButtons ? 'text-base' : 'text-sm';
  const iconSize = stackedButtons ? 'h-4 w-4' : largeButtons ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <div className={stackedButtons ? "flex flex-col gap-3" : "flex flex-wrap gap-4"}>
      {/* Primary: Buy Now — hidden for discontinued printers */}
      {affiliateUrl && !isDiscontinued && (
        <div className={stackedButtons ? "w-full" : "inline-flex flex-col flex-1 min-w-[160px]"}>
          <a
            href={affiliateUrl}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="block w-full"
            onClick={handleBuyClick}
          >
            <button
              className={`w-full ${buttonHeight} ${buttonPadding} bg-primary text-primary-foreground ${fontSize} font-semibold rounded-lg flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group`}
            >
              <ShoppingCart className={iconSize} />
              {storeName ? `Buy at ${storeName}` : 'Buy Now'}
              <ExternalLink className={`${iconSize} opacity-70`} />
            </button>
          </a>
        </div>
      )}

      {/* Secondary: Compare */}
      <button
        className={`${stackedButtons ? 'w-full' : 'flex-1 min-w-[140px]'} ${buttonHeight} ${stackedButtons ? 'px-4' : largeButtons ? 'px-6' : 'px-5'} ${fontSize} font-semibold rounded-lg flex items-center justify-center gap-2 border transition-all duration-200 ${
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
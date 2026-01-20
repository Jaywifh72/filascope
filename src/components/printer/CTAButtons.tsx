import { ArrowRight, Plus, Check, Crosshair, Activity, RefreshCw, CheckCircle2 } from "lucide-react";
import { usePrinterCompare, PrinterCompareItem } from "@/hooks/usePrinterCompare";
import { useCurrency } from "@/hooks/useCurrency";
import { useTrackPrinterEvent } from "@/hooks/usePrinterAnalytics";
import { usePrinterCurrentPrice } from "@/hooks/usePrinterCurrentPrice";

interface CTAButtonsProps {
  printer: PrinterCompareItem;
  officialStoreUrl?: string | null;
  storePrice?: number | null;
  getAffiliateUrl?: (url: string, brand: string | null) => string | null;
  brand?: string | null;
}

export function CTAButtons({
  printer,
  officialStoreUrl,
  storePrice,
  getAffiliateUrl,
  brand,
}: CTAButtonsProps) {
  const { addPrinter, isSelected, isMaxReached } = usePrinterCompare();
  const { formatPrice } = useCurrency();
  const { mutate: trackEvent } = useTrackPrinterEvent();

  // Fetch live price from the store
  const { 
    currentPrice: livePrice, 
    isLoading: priceLoading, 
    isLivePrice 
  } = usePrinterCurrentPrice(officialStoreUrl, storePrice ?? null);

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

  // Use live price if available, otherwise fall back to stored price
  const displayPrice = isLivePrice && livePrice !== null ? livePrice : storePrice;

  return (
    <div className="flex flex-wrap gap-3">
      {/* Primary: Initiate Requisition */}
      {affiliateUrl && (
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
          onClick={handleBuyClick}
        >
          <button
            className="h-[52px] px-8 bg-primary text-primary-foreground font-mono text-sm uppercase tracking-wider font-bold flex items-center gap-3 border-2 border-primary transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(0,207,232,0.4)] group"
          >
            <Crosshair className="h-5 w-5" />
            INITIATE REQUISITION
            {priceLoading ? (
              <span className="ml-1 text-primary-foreground/80 flex items-center gap-1">
                [<RefreshCw className="h-3 w-3 animate-spin" />]
              </span>
            ) : displayPrice ? (
              <span className="ml-1 text-primary-foreground/80 flex items-center gap-1">
                [{formatPrice(displayPrice, false)}]
                {isLivePrice && <CheckCircle2 className="h-3 w-3 text-emerald-300" />}
              </span>
            ) : null}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </a>
      )}

      {/* Secondary: Run Diagnostic Compare */}
      <button
        className={`h-[52px] px-6 bg-transparent font-mono text-sm uppercase tracking-wider font-bold flex items-center gap-2 border-2 transition-all duration-200 ${
          isAlreadySelected || isMaxReached
            ? 'border-white/20 text-muted-foreground cursor-not-allowed'
            : 'border-primary/40 text-primary hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5'
        }`}
        onClick={handleAddToCompare}
        disabled={isAlreadySelected || isMaxReached}
      >
        {isAlreadySelected ? (
          <>
            <Check className="h-5 w-5" />
            DIAGNOSTIC_QUEUED
          </>
        ) : (
          <>
            <Activity className="h-5 w-5" />
            RUN DIAGNOSTIC COMPARE
          </>
        )}
      </button>
    </div>
  );
}
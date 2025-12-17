import { ArrowRight, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrinterCompare, PrinterCompareItem } from "@/hooks/usePrinterCompare";

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

  const isAlreadySelected = isSelected(printer.id);

  const handleAddToCompare = () => {
    if (!isAlreadySelected) {
      addPrinter(printer);
    }
  };

  const affiliateUrl = officialStoreUrl && getAffiliateUrl
    ? getAffiliateUrl(officialStoreUrl, brand)
    : officialStoreUrl;

  return (
    <div className="flex flex-wrap gap-3">
      {/* Secondary: Add to Comparison */}
      <Button
        variant="outline"
        size="lg"
        className="h-[52px] px-6 gap-2 border-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary"
        onClick={handleAddToCompare}
        disabled={isAlreadySelected || isMaxReached}
      >
        {isAlreadySelected ? (
          <>
            <Check className="h-5 w-5" />
            Added to Compare
          </>
        ) : (
          <>
            <Plus className="h-5 w-5" />
            Add to Comparison
          </>
        )}
      </Button>

      {/* Primary: View Official Store */}
      {affiliateUrl && (
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button
            size="lg"
            className="h-[52px] px-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          >
            View Official Store
            {storePrice && (
              <span className="ml-1">- ${storePrice.toLocaleString()}</span>
            )}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </a>
      )}
    </div>
  );
}

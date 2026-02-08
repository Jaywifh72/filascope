import { ArrowRight, Shield, Sparkles, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PriceSection } from "./PriceSection";
import { CTAButtons } from "./CTAButtons";
import { REGIONS } from "@/config/regions";
import { RegionCode, CurrencyCode } from "@/types/regional";
import { PrivateNotePopover } from "@/components/notes/PrivateNotePopover";
import { PrivateNoteIndicator } from "@/components/notes/PrivateNoteIndicator";

import { PriceConfidence } from "@/hooks/usePriceFreshness";

interface PurchaseSidebarProps {
  printer: {
    id: string;
    model_name: string;
    official_store_url?: string | null;
    discontinued?: boolean;
    prices_last_updated_at?: string | null;
    price_source?: string | null;
    price_confidence?: string | null;
  };
  brand: string | null;
  displayPrice: number | null | undefined;
  displayMsrp: number | null | undefined;
  displayImageUrl: string | null;
  isLivePrice: boolean;
  livePriceCurrency?: string;
  liveCompareAtPrice?: number | null;
  warrantyYears: number | null;
  warrantyCoverage: string | null;
  getAffiliateUrl: (url: string | null | undefined, vendor?: string | null) => string | null;
  isLocalStore?: boolean;
  storeRegion?: string | null;
  shipsFromCountry?: string | null;
  /** Whether the displayed price is a conversion estimate */
  isConverted?: boolean;
  /** Original price before conversion (shown in parentheses) */
  originalPrice?: number | null;
  /** Original currency code before conversion */
  originalCurrency?: CurrencyCode | null;
}

export function PurchaseSidebar({
  printer,
  brand,
  displayPrice,
  displayMsrp,
  displayImageUrl,
  isLivePrice,
  livePriceCurrency,
  liveCompareAtPrice,
  warrantyYears,
  warrantyCoverage,
  getAffiliateUrl,
  isLocalStore,
  storeRegion,
  shipsFromCountry,
  isConverted = false,
  originalPrice,
  originalCurrency,
}: PurchaseSidebarProps) {
  const navigate = useNavigate();

  const handleTakeQuiz = () => {
    navigate("/wizard");
  };

  return (
    <aside className="hidden lg:block w-[280px] flex-shrink-0">
      <div 
        className="sticky top-20 w-[280px] rounded-xl border border-border/60 p-6 space-y-6"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        {/* Price Section */}
        <div>
          <PriceSection
            price={displayPrice}
            msrp={displayMsrp}
            trend={isLivePrice ? { 
              direction: 'down' as const, 
              percentage: liveCompareAtPrice && displayPrice 
                ? Math.round((1 - displayPrice / liveCompareAtPrice) * 100) 
                : undefined, 
              period: 'sale' 
            } : undefined}
            isDiscontinued={printer.discontinued}
            compact
            pricesLastUpdatedAt={printer.prices_last_updated_at}
            priceSource={printer.price_source}
            priceConfidence={printer.price_confidence as PriceConfidence | null}
            isRegionalPrice
            isConverted={isConverted}
            originalPrice={originalPrice}
            originalCurrency={originalCurrency}
          />
        </div>

        {/* Fallback Region Warning */}
        {!isLocalStore && storeRegion && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-2 rounded-md">
            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">
                {REGIONS[storeRegion as RegionCode]?.flag} {REGIONS[storeRegion as RegionCode]?.name || storeRegion} store
              </span>
              {shipsFromCountry && (
                <span className="text-amber-400/80">
                  Ships from {shipsFromCountry}
                </span>
              )}
              {/* International shipping notice */}
              <span className="text-amber-400/60 text-[10px]">
                International shipping • Duties may apply
              </span>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="space-y-3">
          <CTAButtons
            printer={{
              id: printer.id,
              name: printer.model_name,
              imageUrl: displayImageUrl,
              brand: brand,
            }}
            officialStoreUrl={printer.official_store_url}
            storePrice={displayPrice}
            getAffiliateUrl={getAffiliateUrl}
            brand={brand}
            isDiscontinued={printer.discontinued}
            stackedButtons
          />
        </div>

        {/* Private Note Button */}
        <PrivateNotePopover
          productId={printer.id}
          productType="printer"
          productTitle={printer.model_name}
        />

        {/* Private Note Indicator (shows existing note) */}
        <PrivateNoteIndicator
          productId={printer.id}
          productType="printer"
          productTitle={printer.model_name}
        />

        {/* Warranty Summary */}
        {warrantyYears && (
          <div className="pt-3 border-t border-border/40">
            <div className="flex items-center gap-3 py-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium text-foreground">
                  {warrantyYears} Year{warrantyYears > 1 ? 's' : ''} Warranty
                </span>
                <span className="text-xs text-muted-foreground">
                  From {brand || 'manufacturer'}
                </span>
              </div>
            </div>
            {warrantyCoverage && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {warrantyCoverage}
              </p>
            )}
          </div>
        )}

        {/* Take the Quiz CTA */}
        <div className="pt-2 border-t border-border/40">
          <button
            onClick={handleTakeQuiz}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg bg-primary/5 border border-primary/20 text-sm font-medium text-primary hover:bg-primary/10 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Not sure? Take the Quiz</span>
            </div>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </aside>
  );
}

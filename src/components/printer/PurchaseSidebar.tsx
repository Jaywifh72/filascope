import { ArrowRight, Shield, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PriceSection } from "./PriceSection";
import { CTAButtons } from "./CTAButtons";

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
            priceCurrency={isLivePrice ? livePriceCurrency : 'USD'}
            compact
            pricesLastUpdatedAt={printer.prices_last_updated_at}
            priceSource={printer.price_source}
            priceConfidence={printer.price_confidence as PriceConfidence | null}
          />
        </div>

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

        {/* Warranty Summary */}
        {warrantyYears && (
          <div className="pt-3 border-t border-border/40">
            <div className="flex items-center gap-3 py-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium text-white">
                  {warrantyYears} Year{warrantyYears > 1 ? 's' : ''} Warranty
                </span>
                <span className="text-xs text-gray-500">
                  From {brand || 'manufacturer'}
                </span>
              </div>
            </div>
            {warrantyCoverage && (
              <p className="text-xs text-gray-500 leading-relaxed mt-1">
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

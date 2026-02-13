import { ArrowRight, Shield, Sparkles, Globe, Layers } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { PriceSection } from "./PriceSection";
import { CTAButtons } from "./CTAButtons";
import { REGIONS } from "@/config/regions";
import { RegionCode, CurrencyCode } from "@/types/regional";
import { PrivateNotePopover } from "@/components/notes/PrivateNotePopover";
import { PrivateNoteIndicator } from "@/components/notes/PrivateNoteIndicator";
import { MarkPurchasedButton } from "@/components/purchases/MarkPurchasedDialog";

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
  /** Store name for attribution */
  storeName?: string | null;
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
  storeName,
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
          {displayPrice || displayMsrp ? (
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
              storeName={storeName}
            />
          ) : !printer.discontinued ? (
            <div className="space-y-1">
              <span className="text-sm text-gray-400 font-mono italic">Price not listed</span>
              <p className="text-xs text-gray-500">Check manufacturer's site for current pricing</p>
            </div>
          ) : null}
        </div>

        {/* Fallback Region Warning */}
        {!isLocalStore && storeRegion && (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 bg-amber-900/10 border border-amber-700/20 px-2 py-1.5 rounded-md">
            <Globe className="w-3 h-3 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">
                {REGIONS[storeRegion as RegionCode]?.flag} {REGIONS[storeRegion as RegionCode]?.name || storeRegion} store
              </span>
              {shipsFromCountry && (
                <span className="text-gray-500">
                  Ships from {shipsFromCountry}
                </span>
              )}
              <span className="text-gray-500">
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
            storeName={storeName}
          />
          {!displayPrice && !displayMsrp && !printer.discontinued && (
            <p className="text-[10px] text-gray-600 text-center mt-1">Opens manufacturer website</p>
          )}
        </div>

        {/* Mark as Purchased */}
        <MarkPurchasedButton
          productId={printer.id}
          productType="printer"
          productName={printer.model_name}
          currentPrice={displayPrice}
          storeName={brand || undefined}
        />

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

        {/* Browse Compatible Filaments CTA */}
        <Link
          to={`/filaments?printer=${encodeURIComponent(printer.model_name)}`}
          className="block bg-gradient-to-r from-teal-500/10 to-purple-500/10 border border-teal-500/20 rounded-xl p-3 hover:border-teal-500/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-teal-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground/90 block">Compatible Filaments</span>
              <span className="text-xs text-muted-foreground">Find filaments for this printer</span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-teal-400 text-xs font-medium group-hover:text-teal-300 transition-colors">
            <span>Browse Filaments</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

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

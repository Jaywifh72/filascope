import { useState } from "react";
import { Database } from "@/integrations/supabase/types";
import { PrimaryBuyButton } from "./PrimaryBuyButton";
import { SecondaryRetailers } from "./SecondaryRetailers";
import { SlicerActions } from "./SlicerActions";
import { QuickActions } from "./QuickActions";
import { PriceTrendBadge } from "./PriceTrendBadge";
import { TotalCostCalculator } from "./TotalCostCalculator";
import { VolumeDiscountSlider } from "./VolumeDiscountSlider";
import { PricingTips } from "./PricingTips";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useCurrency } from "@/hooks/useCurrency";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { useCurrentPrice } from "@/hooks/useCurrentPrice";
import { useRegionalPrice } from "@/hooks/useRegionalPrice";
import { useFilamentListings } from "@/hooks/useFilamentListings";
import { isDiscontinuedUrl } from "@/lib/urlValidation";
import { Badge } from "@/components/ui/badge";
import { Ban, Loader2, ExternalLinkIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface RetailerInfo {
  id: string;
  name: string;
  region?: string;
  url: string;
  price: number | null;
  currency: string;
  isPrimary: boolean;
  available: boolean;
  flag?: string;
}

// Helper to get region flag emoji
function getRegionFlag(region: string): string | undefined {
  const flags: Record<string, string> = {
    'US': '🇺🇸',
    'UK': '🇬🇧',
    'DE': '🇩🇪',
    'EU': '🇪🇺',
    'CA': '🇨🇦',
    'AU': '🇦🇺',
    'JP': '🇯🇵',
  };
  return flags[region];
}

interface PurchaseSectionProps {
  filament: Filament;
  printerBrand?: string | null;
  printerName?: string | null;
}

export function PurchaseSection({ filament, printerBrand, printerName }: PurchaseSectionProps) {
  const [quantity, setQuantity] = useState(1);
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
  
  const { getAffiliateUrl } = useAffiliateLinks();
  const { currencyInfo, currency } = useCurrency();
  const { trackAffiliateClick, trackStoreClick } = useConversionTracking();
  
  // Map currency to region for listings query
  const regionFromCurrency: Record<string, string> = {
    'USD': 'US', 'GBP': 'UK', 'EUR': 'DE', 'CAD': 'CA', 'AUD': 'AU', 'JPY': 'JP'
  };
  const listingsRegion = regionFromCurrency[currency] || 'US';
  
  // Fetch listings from the new filament_listings table
  const { data: listings, isLoading: listingsLoading } = useFilamentListings(filament.id, {
    region: listingsRegion,
    currency: currency,
    includeUnavailable: false,
  });
  
  // Get regional price and URL based on user's currency preference (fallback)
  const { regionalPrice, regionalUrl, fallbackUrl, isActualRegionalPrice, currency: regionalCurrency } = useRegionalPrice(filament);
  
  // Fetch live price using Firecrawl for the regional URL
  const {
    currentPrice: livePrice,
    compareAtPrice,
    isLoading: isPriceLoading,
    isLivePrice,
    currency: liveCurrency,
  } = useCurrentPrice(
    regionalUrl || filament.product_url,
    regionalPrice || filament.variant_price,
    fallbackUrl
  );
  
  // Check if discontinued
  const isDiscontinued = filament.product_url && isDiscontinuedUrl(filament.product_url);
  
  // Build retailer list from listings OR fallback to legacy data
  const retailers: RetailerInfo[] = [];
  
  if (listings && listings.length > 0) {
    // Use new listings data
    listings.forEach((listing, index) => {
      const affiliateUrl = listing.affiliate_url || getAffiliateUrl(listing.product_url, listing.retailer_name);
      retailers.push({
        id: listing.listing_id,
        name: listing.retailer_name,
        region: listing.region,
        url: affiliateUrl || listing.product_url,
        price: listing.current_price,
        currency: listing.currency,
        isPrimary: listing.is_primary || index === 0, // First listing is primary if none marked
        available: listing.available,
        flag: getRegionFlag(listing.region),
      });
    });
  } else if (!listingsLoading) {
    // Fallback to legacy filament columns
    const displayPrice = livePrice ?? regionalPrice ?? filament.variant_price;
    const displayCurrency = isLivePrice ? liveCurrency : (isActualRegionalPrice ? regionalCurrency : 'USD');
    const productUrl = regionalUrl || filament.product_url;
    
    if (productUrl && !isDiscontinued) {
      retailers.push({
        id: 'store',
        name: filament.vendor || 'Store',
        url: getAffiliateUrl(productUrl, filament.vendor) || productUrl,
        price: displayPrice,
        currency: displayCurrency,
        isPrimary: true,
        available: true,
      });
    }
    
    // Legacy Amazon links
    if (filament.amazon_link_us) {
      retailers.push({
        id: 'amazon_us',
        name: 'Amazon',
        region: 'US',
        url: getAffiliateUrl(filament.amazon_link_us, 'Amazon') || filament.amazon_link_us,
        price: null,
        currency: 'USD',
        isPrimary: false,
        available: true,
        flag: '🇺🇸',
      });
    }
  }
  
  const primaryRetailer = retailers.find(r => r.isPrimary) || retailers[0];
  const secondaryRetailers = retailers.filter(r => r !== primaryRetailer);
  
  // Calculate best price indicator
  const hasBestPrice = primaryRetailer && primaryRetailer.price !== null;
  
  const handlePrimaryClick = () => {
    if (primaryRetailer) {
      trackStoreClick({
        moduleName: 'purchase_section',
        entityId: filament.id,
        entityType: 'filament',
      });
    }
  };
  
  const handleSecondaryClick = (retailerId: string) => {
    trackAffiliateClick({
      moduleName: 'purchase_section',
      entityId: filament.id,
      entityType: 'filament',
      metadata: { retailer: retailerId },
    });
  };

  if (isDiscontinued) {
    return (
      <div className="bg-card/50 border border-border/50 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-center">
          <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 py-2 px-4 text-sm">
            <Ban className="w-4 h-4 mr-2" />
            This product has been discontinued
          </Badge>
        </div>
        
        <SlicerActions 
          filament={filament}
          printerBrand={printerBrand}
          printerName={printerName}
        />
        
        <div className="border-t border-border/30 pt-4">
          <QuickActions 
            filamentId={filament.id}
            tdsUrl={filament.tds_url}
            productTitle={filament.product_title}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/50 border border-primary/20 rounded-xl p-6 space-y-5">
      {/* Live Price Loading Indicator */}
      {isPriceLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Fetching live price...</span>
        </div>
      )}
      
      {/* Price Source Badge */}
      {!isPriceLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ExternalLinkIcon className="h-3 w-3" />
          <span>Click to verify current price at store</span>
        </div>
      )}
      
      {/* Price Trend Display */}
      {primaryRetailer?.price && !isPriceLoading && (
        <PriceTrendBadge 
          filamentId={filament.id}
          currentPrice={primaryRetailer.price}
        />
      )}
      
      {/* Total Cost Calculator (collapsible for advanced options) */}
      {primaryRetailer?.price && (
        <Collapsible open={showAdvancedPricing} onOpenChange={setShowAdvancedPricing}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-between">
            <span>Calculate total cost</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedPricing ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            <TotalCostCalculator
              price={primaryRetailer.price}
              vendor={filament.vendor || 'default'}
              quantity={quantity}
              onQuantityChange={setQuantity}
            />
            
            <VolumeDiscountSlider
              price={primaryRetailer.price}
              vendor={filament.vendor || 'default'}
              quantity={quantity}
              onQuantityChange={setQuantity}
            />
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {/* Primary CTA */}
      {primaryRetailer && (
        <PrimaryBuyButton
          retailerName={primaryRetailer.name}
          url={primaryRetailer.url}
          price={primaryRetailer.price}
          currency={primaryRetailer.currency}
          quantity={quantity}
          hasBestPrice={hasBestPrice}
          onClick={handlePrimaryClick}
          isLoading={isPriceLoading}
          compareAtPrice={compareAtPrice}
        />
      )}
      
      {/* Pricing Tips */}
      {primaryRetailer?.price && (
        <PricingTips
          filamentId={filament.id}
          price={primaryRetailer.price}
          vendor={filament.vendor || 'default'}
          quantity={quantity}
        />
      )}
      
      {/* Secondary Retailers */}
      {secondaryRetailers.length > 0 && (
        <>
          <div className="border-t border-border/30" />
          <SecondaryRetailers
            retailers={secondaryRetailers}
            onRetailerClick={handleSecondaryClick}
          />
        </>
      )}
      
      {/* Slicer Actions */}
      <div className="border-t border-border/30 pt-4">
        <SlicerActions 
          filament={filament}
          printerBrand={printerBrand}
          printerName={printerName}
        />
      </div>
      
      {/* Quick Actions */}
      <div className="border-t border-border/30 pt-4">
        <QuickActions 
          filamentId={filament.id}
          tdsUrl={filament.tds_url}
          productTitle={filament.product_title}
        />
      </div>
    </div>
  );
}

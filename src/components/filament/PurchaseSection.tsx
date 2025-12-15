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
import { isDiscontinuedUrl } from "@/lib/urlValidation";
import { Badge } from "@/components/ui/badge";
import { Ban } from "lucide-react";
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

interface PurchaseSectionProps {
  filament: Filament;
  printerBrand?: string | null;
  printerName?: string | null;
}

export function PurchaseSection({ filament, printerBrand, printerName }: PurchaseSectionProps) {
  const [quantity, setQuantity] = useState(1);
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
  
  const { getAffiliateUrl, getAmazonUrl } = useAffiliateLinks();
  const { formatPrice, convertPrice, currencyInfo } = useCurrency();
  const { trackAffiliateClick, trackStoreClick } = useConversionTracking();
  
  // Build retailer list with availability
  const retailers: RetailerInfo[] = [];
  
  // Primary retailer (manufacturer direct)
  const isDiscontinued = filament.product_url && isDiscontinuedUrl(filament.product_url);
  
  if (filament.product_url && !isDiscontinued) {
    retailers.push({
      id: 'store',
      name: filament.vendor || 'Store',
      url: getAffiliateUrl(filament.product_url, filament.vendor) || filament.product_url,
      price: filament.variant_price,
      currency: 'USD',
      isPrimary: true,
      available: true,
    });
  }
  
  // Amazon retailers
  if (filament.amazon_link_us) {
    retailers.push({
      id: 'amazon_us',
      name: 'Amazon',
      region: 'US',
      url: getAmazonUrl(filament.amazon_link_us, "us") || filament.amazon_link_us,
      price: null,
      currency: 'USD',
      isPrimary: false,
      available: true,
      flag: '🇺🇸',
    });
  }
  
  if (filament.amazon_link_uk) {
    retailers.push({
      id: 'amazon_uk',
      name: 'Amazon',
      region: 'UK',
      url: getAmazonUrl(filament.amazon_link_uk, "uk") || filament.amazon_link_uk,
      price: null,
      currency: 'GBP',
      isPrimary: false,
      available: true,
      flag: '🇬🇧',
    });
  }
  
  if (filament.amazon_link_de) {
    retailers.push({
      id: 'amazon_de',
      name: 'Amazon',
      region: 'DE',
      url: getAmazonUrl(filament.amazon_link_de, "de") || filament.amazon_link_de,
      price: null,
      currency: 'EUR',
      isPrimary: false,
      available: true,
      flag: '🇩🇪',
    });
  }
  
  const primaryRetailer = retailers.find(r => r.isPrimary);
  const secondaryRetailers = retailers.filter(r => !r.isPrimary);
  
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
      {/* Price Trend Display */}
      {primaryRetailer?.price && (
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

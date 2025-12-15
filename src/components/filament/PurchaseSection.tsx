import { useState } from "react";
import { Database } from "@/integrations/supabase/types";
import { PrimaryBuyButton } from "./PrimaryBuyButton";
import { SecondaryRetailers } from "./SecondaryRetailers";
import { SlicerActions } from "./SlicerActions";
import { QuickActions } from "./QuickActions";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useCurrency } from "@/hooks/useCurrency";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { isDiscontinuedUrl } from "@/lib/urlValidation";
import { Badge } from "@/components/ui/badge";
import { Ban } from "lucide-react";

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
  onProfileDownload: (slicerType: 'prusaslicer' | 'orcaslicer' | 'cura' | 'bambu') => void;
  onCopyProfile: () => void;
}

export function PurchaseSection({ filament, onProfileDownload, onCopyProfile }: PurchaseSectionProps) {
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
      price: null, // We don't have Amazon prices stored
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
        
        {/* Still show slicer actions and quick actions */}
        <SlicerActions 
          onDownload={onProfileDownload}
          onCopy={onCopyProfile}
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
      {/* Primary CTA */}
      {primaryRetailer && (
        <PrimaryBuyButton
          retailerName={primaryRetailer.name}
          url={primaryRetailer.url}
          price={primaryRetailer.price}
          currency={primaryRetailer.currency}
          hasBestPrice={hasBestPrice}
          onClick={handlePrimaryClick}
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
          onDownload={onProfileDownload}
          onCopy={onCopyProfile}
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

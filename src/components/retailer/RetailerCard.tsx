import { cn } from "@/lib/utils";
import { ExternalLink, Truck, Clock, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Retailer } from "@/hooks/useRetailerData";
import { InventoryBadge } from "./InventoryBadge";
import { RetailerRating } from "./RetailerRating";
import { ReturnPolicyBadge } from "./ReturnPolicyBadge";
import { MembershipBenefits, PrimeBadge } from "./MembershipBenefits";
import { ShipsToIndicator } from "./RegionalAvailability";
import { ShippingEstimate, formatDeliveryRange } from "@/lib/shippingZones";
import { useUserShipping } from "@/hooks/useUserShipping";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";

interface RetailerCardProps {
  retailer: Retailer;
  productUrl?: string;
  price?: number;
  currency?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder' | 'unknown';
  stockQuantity?: number | null;
  shippingEstimate?: ShippingEstimate;
  className?: string;
}

export function RetailerCard({
  retailer,
  productUrl,
  price,
  currency = 'USD',
  stockStatus = 'unknown',
  stockQuantity,
  shippingEstimate,
  className,
}: RetailerCardProps) {
  const { preferences } = useUserShipping();
  const { getAffiliateUrl, getAmazonUrl } = useAffiliateLinks();
  
  const isAmazon = retailer.slug === 'amazon';
  const isPrimeMember = preferences.amazonPrimeMember;
  
  // Build affiliate URL
  const affiliateUrl = productUrl
    ? isAmazon
      ? getAmazonUrl(productUrl)
      : getAffiliateUrl(productUrl, retailer.name)
    : retailer.website_url;

  const handleBuyClick = () => {
    if (affiliateUrl) {
      // DEBUG: Verify Creality URLs are using direct product links, not search
      if (retailer.name.toLowerCase().includes('creality') || affiliateUrl.includes('creality')) {
        console.log('🔗 Creality Buy Now URL:', affiliateUrl);
        console.log('   Expected: Direct product URL (e.g., /products/hyper-rainbow-pla...)');
        console.log('   Should NOT be: Search URL (/search?keyword=...)');
      }
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className={cn(
      "bg-card/50 border-border/30 overflow-hidden transition-all hover:border-primary/30",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-background/50 border border-border/30 flex items-center justify-center overflow-hidden">
            {retailer.logo_url ? (
              <img 
                src={retailer.logo_url} 
                alt={retailer.name}
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm truncate">{retailer.name}</h3>
              {isAmazon && isPrimeMember && <PrimeBadge small />}
            </div>

            {/* Rating */}
            <RetailerRating
              trustScore={retailer.trust_score}
              shippingSpeedRating={retailer.shipping_speed_rating}
              customerServiceRating={retailer.customer_service_rating}
              returnPolicyDays={retailer.return_policy_days}
              compact
            />

            {/* Stock Status */}
            <div className="mt-2">
              <InventoryBadge 
                status={stockStatus} 
                quantity={stockQuantity}
                retailerName={retailer.name}
              />
            </div>

            {/* Shipping */}
            {shippingEstimate && (
              <div className="flex items-center gap-2 mt-2 text-xs">
                <Truck className="h-3 w-3 text-muted-foreground" />
                <span className={shippingEstimate.isFree ? "text-emerald-400" : "text-muted-foreground"}>
                  {shippingEstimate.isFree 
                    ? (isAmazon && isPrimeMember ? 'Free with Prime' : 'Free Shipping')
                    : `$${shippingEstimate.cost.toFixed(2)}`
                  }
                </span>
                <span className="text-muted-foreground">•</span>
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {formatDeliveryRange(shippingEstimate.arrivalDate.min, shippingEstimate.arrivalDate.max)}
                </span>
              </div>
            )}

            {/* Regional availability */}
            <div className="mt-2">
              <ShipsToIndicator
                regionsServed={retailer.regions_served}
                userCountry={preferences.country}
                compact
              />
            </div>
          </div>

          {/* Price & Buy */}
          <div className="flex-shrink-0 text-right">
            {price !== undefined && (
              <div className="mb-2">
                <p className="text-lg font-bold text-primary">
                  ${price.toFixed(2)}
                </p>
                {shippingEstimate && !shippingEstimate.isFree && (
                  <p className="text-xs text-muted-foreground">
                    +${shippingEstimate.cost.toFixed(2)} ship
                  </p>
                )}
              </div>
            )}
            
            <Button
              size="sm"
              onClick={handleBuyClick}
              disabled={stockStatus === 'out_of_stock' || !affiliateUrl}
              className="gap-1.5"
            >
              {stockStatus === 'out_of_stock' ? 'Sold Out' : 'Buy'}
              <ExternalLink className="h-3 w-3" />
            </Button>

            {/* Return policy */}
            <div className="mt-2">
              <ReturnPolicyBadge
                returnDays={retailer.return_policy_days}
                returnType={retailer.return_policy_type}
                restockingFee={retailer.restocking_fee_percent}
              />
            </div>
          </div>
        </div>

        {/* Membership benefits */}
        {retailer.membership_program && (
          <div className="mt-3 pt-3 border-t border-border/20">
            <MembershipBenefits
              isPrimeMember={isPrimeMember}
              membershipProgram={retailer.membership_program}
              hasMembership={preferences.retailerMemberships[retailer.slug] || false}
              freeShipping={shippingEstimate?.isFree}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

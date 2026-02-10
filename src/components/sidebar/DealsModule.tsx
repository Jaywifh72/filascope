import { DollarSign, ArrowDown, ChevronRight, Plus, ExternalLink } from "lucide-react";
import { SidebarModule } from "./SidebarModule";
import { useTopDeals, TopDeal } from "@/hooks/useTopDeals";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/hooks/useCompare";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { getOptimizedImageUrl, getImageSrcSet } from "@/utils/imageOptimization";

export function DealsModule() {
  const { data: deals, isLoading, error } = useTopDeals();
  const navigate = useNavigate();
  const { addItem, isInCompare } = useCompare();
  const { getAffiliateUrl } = useAffiliateLinks();
  const { trackDealClick } = useConversionTracking();

  const handleAddToCompare = (deal: TopDeal) => {
    addItem({
      id: deal.id,
      product_title: deal.product_title,
      vendor: deal.vendor,
      material: deal.material,
      color_hex: null,
      featured_image: deal.featured_image,
      variant_price: deal.current_price,
      net_weight_g: deal.net_weight_g,
    });
  };

  const handleViewDeal = (dealId: string) => {
    navigate(`/filament/${dealId}`);
  };

  // Get timestamp for display
  const now = new Date();
  const updateTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")} ${now.getHours() >= 12 ? "PM" : "AM"}`;

  const handleAffiliateClick = (deal: TopDeal) => {
    trackDealClick(deal.id, deal.current_price, 'store');
  };

  return (
    <SidebarModule
      icon={<DollarSign className="h-5 w-5" />}
      title="Best Deals Today"
      moduleName="deals"
      isLoading={isLoading}
      isEmpty={!deals || deals.length === 0}
      emptyMessage="No significant deals found today"
      accentColor="green"
      className="bg-gradient-to-br from-green-950/10 to-transparent"
      headerAction={
        <span className="text-xs text-muted-foreground">Updated at {updateTime}</span>
      }
    >
      <div className="space-y-3">
        {deals?.map((deal, index) => (
          <div key={deal.id}>
            {index > 0 && (
              <div className="flex items-center justify-center gap-2 mb-3 text-muted-foreground/50">
                <span className="h-1 w-1 rounded-full bg-current" />
              </div>
            )}
            
            <div className="flex gap-3">
              {/* Product image */}
              <div className="w-12 h-12 rounded-md bg-muted overflow-hidden shrink-0">
                {deal.featured_image ? (
                  <img
                    src={getOptimizedImageUrl(deal.featured_image, 96)}
                    srcSet={getImageSrcSet(deal.featured_image, [96, 192]) || undefined}
                    sizes="48px"
                    alt={deal.product_title}
                    className="w-full h-full object-cover"
                    width={48}
                    height={48}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <DollarSign className="h-5 w-5" />
                  </div>
                )}
              </div>

              {/* Deal info */}
              <div className="flex-1 min-w-0 space-y-1">
                <button
                  onClick={() => handleViewDeal(deal.id)}
                  className="text-left w-full"
                >
                  <h4 className="font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-1">
                    {deal.product_title}
                  </h4>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">
                    ${deal.price_per_kg.toFixed(2)}
                    <span className="text-xs font-normal text-muted-foreground">/kg</span>
                  </span>
                  <span className="flex items-center gap-0.5 text-green-400 text-sm font-semibold">
                    <ArrowDown className="h-3 w-3" />
                    {deal.savings_percent}%
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Was: ${deal.previous_price.toFixed(2)} • Save ${deal.savings_amount.toFixed(2)}
                </div>

                {/* CTAs */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleAddToCompare(deal)}
                    disabled={isInCompare(deal.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Compare
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleViewDeal(deal.id)}
                  >
                    View
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                  {deal.product_url && (
                    <a
                      href={getAffiliateUrl(deal.product_url, deal.vendor || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto"
                      onClick={() => handleAffiliateClick(deal)}
                    >
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* View all deals link */}
        <button
          onClick={() => navigate("/deals")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center pt-2"
        >
          View all deals
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </SidebarModule>
  );
}

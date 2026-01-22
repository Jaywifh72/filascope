import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  TrendingDown, 
  Store, 
  ShoppingCart,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import type { Retailer } from '../hero/RetailersModal';

type Filament = Database["public"]["Tables"]["filaments"]["Row"];

interface PricingTabContentProps {
  filament: Filament;
  retailers: Retailer[];
  pricePerKg: number | null;
  pricePerSpool: number | null;
  affiliateUrl: string | null;
  hasActualRegionalPrice: boolean;
  onViewRetailers: () => void;
  onRetailerClick: (retailer: Retailer) => void;
}

export function PricingTabContent({
  filament,
  retailers,
  pricePerKg,
  pricePerSpool,
  affiliateUrl,
  hasActualRegionalPrice,
  onViewRetailers,
  onRetailerClick,
}: PricingTabContentProps) {
  const { formatPrice, formatRegionalPrice } = useCurrency();

  const formatDisplayPrice = (price: number | null) => {
    if (!price) return null;
    return hasActualRegionalPrice ? formatRegionalPrice(price) : formatPrice(price);
  };

  return (
    <div className="space-y-6">
      {/* Current Best Price */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-400">Best Price Available</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  {formatDisplayPrice(pricePerKg) || 'N/A'}
                </span>
                <span className="text-lg text-muted-foreground">/kg</span>
              </div>
              {pricePerSpool && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDisplayPrice(pricePerSpool)} per spool ({filament.net_weight_g}g)
                </p>
              )}
            </div>
            {affiliateUrl && (
              <Button
                onClick={() => window.open(affiliateUrl, '_blank')}
                className="gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Buy Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Retailers */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Available Retailers</h3>
            </div>
            {retailers.length > 3 && (
              <Button variant="ghost" size="sm" onClick={onViewRetailers}>
                View All ({retailers.length})
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {retailers.slice(0, 5).map((retailer, idx) => (
              <div 
                key={retailer.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer",
                  idx === 0 
                    ? "bg-primary/5 border-primary/20 hover:bg-primary/10" 
                    : "bg-muted/20 border-border hover:bg-muted/40"
                )}
                onClick={() => {
                  onRetailerClick(retailer);
                  if (retailer.url) window.open(retailer.url, '_blank');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    retailer.inStock ? "bg-emerald-500" : "bg-red-500"
                  )} />
                  <div>
                    <div className="font-medium">{retailer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {retailer.inStock ? retailer.shippingEstimate : 'Out of stock'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {retailer.price && (
                    <div className="text-right">
                      <div className="font-bold">
                        {formatDisplayPrice(retailer.price)}
                      </div>
                    </div>
                  )}
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}

            {retailers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No retailers available for this region</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price History Placeholder */}
      <Card className="bg-card/50 border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold">Price History</h3>
          </div>
          <div className="h-48 flex items-center justify-center bg-muted/20 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground text-sm">
              Price history chart coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

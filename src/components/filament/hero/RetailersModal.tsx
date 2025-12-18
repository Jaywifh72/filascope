import React, { useMemo } from 'react';
import { X, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

export interface Retailer {
  id: string;
  name: string;
  price: number | null;
  originalPrice?: number | null;
  inStock: boolean;
  shippingEstimate?: string;
  url: string | null;
  logo?: string;
}

interface RetailersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  retailers: Retailer[];
  onRetailerClick: (retailer: Retailer) => void;
}

export function RetailersModal({
  open,
  onOpenChange,
  productName,
  retailers,
  onRetailerClick
}: RetailersModalProps) {
  const { formatPrice } = useCurrency();

  // Sort by price (in-stock first, then by price)
  const sortedRetailers = useMemo(() => {
    return [...retailers].sort((a, b) => {
      // In-stock items first
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      // Then by price (nulls last)
      if (a.price === null && b.price === null) return 0;
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return a.price - b.price;
    });
  }, [retailers]);

  // Find lowest price among in-stock retailers
  const lowestPrice = useMemo(() => {
    const inStockWithPrice = sortedRetailers.filter(r => r.inStock && r.price !== null);
    if (inStockWithPrice.length === 0) return null;
    return Math.min(...inStockWithPrice.map(r => r.price!));
  }, [sortedRetailers]);

  const handleRetailerClick = (retailer: Retailer) => {
    if (!retailer.url || !retailer.inStock) return;
    onRetailerClick(retailer);
    window.open(retailer.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-[560px] max-h-[85vh] p-0 gap-0",
        "bg-card border-border",
        // Mobile bottom sheet
        "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto",
        "max-md:translate-x-0 max-md:translate-y-0 max-md:left-0",
        "max-md:rounded-t-2xl max-md:rounded-b-none",
        "max-md:max-h-[90vh]"
      )}>
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                All Retailers
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {productName}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Retailers List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {sortedRetailers.map((retailer) => {
            const isBestPrice = retailer.price === lowestPrice && retailer.inStock && lowestPrice !== null;
            const savings = retailer.originalPrice && retailer.price
              ? retailer.originalPrice - retailer.price
              : null;

            return (
              <div
                key={retailer.id}
                className={cn(
                  "relative rounded-xl p-4 transition-all duration-200",
                  isBestPrice
                    ? "bg-primary/5 border border-primary/20"
                    : "bg-muted/30 border border-border/50",
                  !retailer.inStock && "opacity-60"
                )}
              >
                {/* Best Price Badge */}
                {isBestPrice && (
                  <span className={cn(
                    "absolute -top-2.5 left-4",
                    "inline-flex items-center gap-1 px-2.5 py-1",
                    "bg-gradient-to-r from-primary to-primary/80 rounded-md",
                    "text-[10px] font-extrabold text-primary-foreground uppercase tracking-wider"
                  )}>
                    <Check className="w-2.5 h-2.5" />
                    Best Price
                  </span>
                )}

                <div className="flex items-center justify-between gap-4">
                  {/* Left: Retailer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-foreground">
                      {retailer.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold",
                        retailer.inStock ? "text-emerald-400" : "text-destructive"
                      )}>
                        {retailer.inStock ? (
                          <>
                            <Check className="w-3 h-3" />
                            In Stock
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Out of Stock
                          </>
                        )}
                      </span>
                      {retailer.inStock && retailer.shippingEstimate && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {retailer.shippingEstimate}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Center: Price */}
                  <div className="text-right">
                    <div className="flex items-baseline gap-2 justify-end">
                      <span className="text-xl font-extrabold text-foreground">
                        {retailer.price !== null ? formatPrice(retailer.price) : '—'}
                      </span>
                      {retailer.originalPrice && retailer.originalPrice > (retailer.price || 0) && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(retailer.originalPrice)}
                        </span>
                      )}
                    </div>
                    {savings && savings > 0 && (
                      <span className="text-xs font-semibold text-emerald-400">
                        Save {formatPrice(savings)}
                      </span>
                    )}
                  </div>

                  {/* Right: Buy Button */}
                  <Button
                    onClick={() => handleRetailerClick(retailer)}
                    disabled={!retailer.inStock || !retailer.url}
                    size="sm"
                    className={cn(
                      "min-w-[100px]",
                      retailer.inStock && retailer.url
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {retailer.inStock && retailer.url ? (
                      <>
                        Buy Now
                        <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                      </>
                    ) : (
                      'Unavailable'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          {sortedRetailers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No retailers available for this product.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Prices verified within the last 24 hours. Prices may vary.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

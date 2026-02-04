import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useRegion } from "@/contexts/RegionContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StorePriceBadge } from "@/components/price/StorePriceDisplay";
import type { CurrencyCode } from "@/types/regional";

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

interface SecondaryRetailersProps {
  retailers: RetailerInfo[];
  onRetailerClick?: (retailerId: string) => void;
}

export function SecondaryRetailers({ retailers, onRetailerClick }: SecondaryRetailersProps) {
  const [expanded, setExpanded] = useState(false);
  const { currency: userCurrency } = useRegion();
  
  // On mobile, show first 2, collapse rest
  const visibleRetailers = expanded ? retailers : retailers.slice(0, 2);
  const hasMore = retailers.length > 2;
  
  if (retailers.length === 0) return null;

  return (
    <div className="space-y-3">
      <span className="text-sm text-muted-foreground">Also available at:</span>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleRetailers.map((retailer) => (
          <a
            key={retailer.id}
            href={retailer.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onRetailerClick?.(retailer.id)}
            className={cn(
              "flex items-center justify-between",
              "h-11 px-4 rounded-md",
              "bg-transparent border border-primary/30",
              "text-primary text-sm font-medium",
              "hover:border-primary hover:bg-primary/10",
              "active:scale-[0.98]",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
              !retailer.available && "opacity-50 pointer-events-none"
            )}
          >
            <span className="flex items-center gap-2">
              {retailer.flag && <span className="text-base">{retailer.flag}</span>}
              <span>{retailer.name}</span>
              {retailer.region && <span className="text-muted-foreground">{retailer.region}</span>}
            </span>
            
            <span className="flex items-center gap-2">
              {retailer.price !== null ? (
                <StorePriceBadge
                  price={retailer.price}
                  isDollars={true}
                  currency={userCurrency}
                  originalCurrency={retailer.currency as CurrencyCode}
                  size="sm"
                  className="tabular-nums"
                />
              ) : !retailer.available ? (
                <span className="text-xs text-muted-foreground">Out of Stock</span>
              ) : null}
              <span className="text-xs font-medium">Buy</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </span>
          </a>
        ))}
      </div>
      
      {/* Mobile expand/collapse */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full sm:hidden text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <span className="flex items-center">
              Show less <ChevronUp className="w-4 h-4 ml-1" />
            </span>
          ) : (
            <span className="flex items-center">
              View {retailers.length - 2} more options <ChevronDown className="w-4 h-4 ml-1" />
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

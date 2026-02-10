import { Check, AlertTriangle, X, Star, ExternalLink, Store, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";
import { generateRecommendationReasons, getRelatedItems, type RecommendationReason } from "@/lib/hardwareRecommendations";
import type { Database } from "@/integrations/supabase/types";

type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];
type Filament = Database["public"]["Tables"]["filaments"]["Row"];
type Printer = Database["public"]["Tables"]["printers"]["Row"];

interface HardwareRecommendationCardProps {
  item: {
    id: string;
    name: string;
    brand: string | null;
    image_url: string | null;
    product_url: string | null;
    price?: number | null;
    currency?: string | null;
    compatibility: {
      rating: 'green' | 'orange' | 'red';
      reason: string;
      details?: string[];
    };
  };
  accessory?: Accessory;
  filament?: Filament | null;
  printer?: Printer | null;
  isRecommended?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  detailPath: string;
  getAffiliateUrl?: (url: string, brand: string | null) => string | null;
  icon?: React.ReactNode;
}

export function HardwareRecommendationCard({
  item,
  accessory,
  filament,
  printer,
  isRecommended,
  isExpanded,
  onToggleExpand,
  detailPath,
  getAffiliateUrl,
  icon,
}: HardwareRecommendationCardProps) {
  const rating = item.compatibility.rating;
  
  // Generate detailed reasons if we have full accessory data
  const reasons = accessory 
    ? generateRecommendationReasons(accessory, filament || null, printer || null, rating)
    : item.compatibility.details?.map((d, i) => ({ 
        icon: rating === 'green' ? '✓' : rating === 'orange' ? '⚠' : '✗',
        text: d,
        priority: i
      } as RecommendationReason)) || [];

  const relatedItems = accessory ? getRelatedItems(accessory.accessory_type) : [];

  const ratingIcon = {
    green: <Check className="w-4 h-4 text-green-500" />,
    orange: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    red: <X className="w-4 h-4 text-red-500" />,
  };
  
  const ratingBg = {
    green: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15',
    orange: 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15',
    red: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15',
  };

  const formatPrice = (price: number | null | undefined, currency: string | null | undefined) => {
    if (!price) return null;
    const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    return `${symbol}${price.toFixed(2)}`;
  };

  return (
    <div 
      className={cn(
        "rounded-lg border transition-all duration-200",
        ratingBg[rating],
        isExpanded && "ring-1 ring-primary/30"
      )}
    >
      {/* Compact View */}
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Rating Icon */}
        {ratingIcon[rating]}
        
        {/* Image */}
        <div className="w-12 h-12 rounded bg-muted/50 overflow-hidden flex-shrink-0">
          {item.image_url ? (
            <img src={getOptimizedImageUrl(item.image_url, 96)} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
              {icon}
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate flex items-center gap-2">
            {item.name}
            {isRecommended && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                <Star className="w-3 h-3 mr-0.5 fill-amber-400" />
                Top Pick
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
            {item.brand}
            {item.price && (
              <span className="font-medium text-foreground">
                {formatPrice(item.price, item.currency)}
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            to={`${detailPath}/${item.id}`}
            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          {item.product_url && (
            <a
              href={getAffiliateUrl?.(item.product_url, item.brand) || item.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Store className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
          {/* Why we recommend section */}
          {reasons.length > 0 && rating !== 'red' && (
            <div className="bg-background/50 rounded-lg p-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                Why we recommend this{filament?.material ? ` for ${filament.material}` : ''}:
              </div>
              <ul className="space-y-1.5">
                {reasons.slice(0, 5).map((reason, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className={cn(
                      "flex-shrink-0",
                      reason.icon === '✓' ? 'text-green-500' :
                      reason.icon === '⚠' ? 'text-amber-500' :
                      reason.icon === '✗' ? 'text-red-500' : 'text-primary'
                    )}>
                      {reason.icon}
                    </span>
                    <span className="text-foreground">{reason.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Red rating warning */}
          {rating === 'red' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="text-sm text-red-400">
                <span className="font-medium">Not recommended:</span> {item.compatibility.reason}
              </div>
            </div>
          )}

          {/* Purchase section */}
          {item.product_url && (
            <div className="flex items-center justify-between gap-2">
              <a
                href={getAffiliateUrl?.(item.product_url, item.brand) || item.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button size="sm" className="w-full gap-2">
                  <Store className="w-4 h-4" />
                  Buy from {item.brand || 'Store'}
                  {item.price && (
                    <span className="ml-1 font-bold">
                      {formatPrice(item.price, item.currency)}
                    </span>
                  )}
                </Button>
              </a>
              <Link to={`${detailPath}/${item.id}`} onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </Link>
            </div>
          )}

          {/* Related items */}
          {relatedItems.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground mb-2">
                🛒 Frequently bought together:
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedItems.slice(0, 3).map((related, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="text-xs font-normal"
                  >
                    {related.name} ({related.estimatedPrice})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import { Search, ChevronDown, ExternalLink, Store, Check, AlertTriangle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface HardwareItem {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  product_url: string | null;
  compatibility: {
    rating: 'green' | 'orange' | 'red';
    reason: string;
    details?: string[];
  };
}

interface HardwareSearchListProps {
  title: string;
  icon: React.ReactNode;
  items: HardwareItem[];
  printerStatus: string;
  recommendedItems?: string[];
  detailPath: string;
  emptyMessage?: string;
  getAffiliateUrl?: (url: string, brand: string | null) => string | null;
}

export function HardwareSearchList({
  title,
  icon,
  items,
  printerStatus,
  recommendedItems = [],
  detailPath,
  emptyMessage = "No compatible items found",
  getAffiliateUrl,
}: HardwareSearchListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      item => 
        item.name.toLowerCase().includes(query) ||
        (item.brand?.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);
  
  const displayedItems = showAll ? filteredItems : filteredItems.slice(0, 5);
  const hasMore = filteredItems.length > 5;

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

  if (items.length === 0) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-background/50 border border-border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground flex items-center gap-2">
          {icon}
          {title}
          <Badge variant="secondary" className="text-xs">{items.length}</Badge>
        </h4>
      </div>
      
      {/* Printer Status */}
      <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded border border-green-500/20">
        <Check className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-400">Your printer: {printerStatus}</span>
      </div>
      
      {/* Search */}
      {items.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
      )}
      
      {/* Items List */}
      <TooltipProvider delayDuration={200}>
        <div className="space-y-2">
          {displayedItems.map((item) => {
            const isRecommended = recommendedItems.includes(item.id);
            
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    ratingBg[item.compatibility.rating]
                  )}>
                    {/* Rating Icon */}
                    {ratingIcon[item.compatibility.rating]}
                    
                    {/* Image */}
                    <div className="w-10 h-10 rounded bg-muted/50 overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
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
                          <span className="text-amber-500">⭐</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.brand}
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
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className={cn(
                      "text-xs",
                      item.compatibility.rating === 'green' ? 'text-green-500' :
                      item.compatibility.rating === 'orange' ? 'text-amber-500' : 'text-red-500'
                    )}>
                      {item.compatibility.reason}
                    </p>
                    {item.compatibility.details && item.compatibility.details.length > 0 && (
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {item.compatibility.details.slice(0, 3).map((detail, i) => (
                          <li key={i}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      
      {/* Show More/Less */}
      {hasMore && !searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full text-muted-foreground"
        >
          {showAll ? (
            <>Hide <ChevronDown className="w-4 h-4 ml-1 rotate-180" /></>
          ) : (
            <>Show all {items.length} <ChevronDown className="w-4 h-4 ml-1" /></>
          )}
        </Button>
      )}
    </div>
  );
}

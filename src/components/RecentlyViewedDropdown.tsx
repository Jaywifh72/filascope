import { Link } from "react-router-dom";
import { Clock, X, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecentlyViewed, formatTimeAgo } from "@/hooks/useRecentlyViewed";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

export function RecentlyViewedDropdown() {
  const { items, clearAll } = useRecentlyViewed();
  const { toast } = useToast();
  const count = items.length;

  const handleClear = () => {
    clearAll();
    toast({ title: "Recently viewed cleared" });
  };

  return (
    <Popover>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "relative p-2 rounded-lg transition-colors duration-150",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                count === 0 && "opacity-50"
              )}
              aria-label={count > 0 ? `Recently viewed (${count})` : "No recently viewed items"}
            >
              <Clock className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-muted-foreground/60" />
              )}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-md">
          Recently Viewed
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        className="w-80 p-0 bg-popover border-border shadow-xl z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Recently Viewed</span>
          {count > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Items */}
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Clock className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm font-medium">No recent items yet</p>
            <p className="text-xs mt-1">Products you view will appear here</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((item) => {
              if (!item.name || !item.id) return null;
              return (
                <Link
                  key={item.id}
                  to={item.url || `/filament/${item.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded object-cover bg-muted shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  {!item.image && (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name || "Unknown Product"}</p>
                    <p className="text-xs text-muted-foreground">{item.brand || "Unknown Brand"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {item.price && (
                      <p className="text-sm text-primary font-semibold">{item.price}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60">{formatTimeAgo(item.timestamp)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

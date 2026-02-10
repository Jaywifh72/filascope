import { Heart, ExternalLink, TrendingDown, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWatchlistUpdates } from "@/hooks/useWatchlistUpdates";
import { useAuth } from "@/hooks/useAuth";
import { SidebarModule } from "./SidebarModule";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cleanFilamentDisplayName } from "@/lib/productNameUtils";

export function WatchlistModule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useWatchlistUpdates();

  // Don't show if not logged in
  if (!user) return null;

  const { onSale, backInStock, totalUpdates } = data || { onSale: [], backInStock: [], totalUpdates: 0 };

  // Don't show if no favorites or no updates
  if (!isLoading && totalUpdates === 0) return null;

  return (
    <SidebarModule
      title="Your Watchlist"
      moduleName="watchlist"
      icon={<Heart className="h-4 w-4 fill-red-500 text-red-500" />}
      badge={totalUpdates > 0 ? (
        <Badge variant="secondary" className="bg-red-500/10 text-red-500 text-xs">
          {totalUpdates} update{totalUpdates !== 1 ? "s" : ""}
        </Badge>
      ) : undefined}
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Price drops */}
          {onSale.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-500">
                <TrendingDown className="h-3 w-3" />
                <span>{onSale.length} item{onSale.length !== 1 ? "s" : ""} on sale!</span>
              </div>
              
              {onSale.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate(`/filament/${item.filament_id}`)}
                >
                  {item.featured_image ? (
                    <img
                      src={item.featured_image}
                      alt={`${cleanFilamentDisplayName(item.product_title)} filament`}
                      className="w-10 h-10 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded shrink-0"
                      style={{ backgroundColor: item.color_hex || "#ccc" }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {cleanFilamentDisplayName(item.product_title)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-green-500">
                        ${((item.current_price || 0) / ((item.net_weight_g || 1000) / 1000)).toFixed(2)}/kg
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-green-500/10 text-green-500">
                        ⬇ {item.priceDropPercent}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Back in stock */}
          {backInStock.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-500">
                <Package className="h-3 w-3" />
                <span>Back in stock</span>
              </div>
              
              {backInStock.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate(`/filament/${item.filament_id}`)}
                >
                  <div
                    className="w-8 h-8 rounded shrink-0"
                    style={{ backgroundColor: item.color_hex || "#ccc" }}
                  />
                  <p className="text-xs truncate flex-1">{cleanFilamentDisplayName(item.product_title)}</p>
                </div>
              ))}
            </div>
          )}

          {/* View all link */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-8"
            onClick={() => navigate("/vault")}
          >
            View all saved ({(onSale.length + backInStock.length) || "0"})
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
      )}
    </SidebarModule>
  );
}

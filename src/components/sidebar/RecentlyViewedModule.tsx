import { History, ArrowRight, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBrowseHistory } from "@/hooks/useBrowseHistory";
import { useCompare } from "@/hooks/useCompare";
import { SidebarModule } from "./SidebarModule";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function RecentlyViewedModule() {
  const navigate = useNavigate();
  const { history, isLoading } = useBrowseHistory(5);
  const { items: compareItems } = useCompare();

  // Don't show if no history
  if (!isLoading && history.length === 0) return null;

  return (
    <SidebarModule
      title="Recently Viewed"
      icon={<History className="h-4 w-4" />}
    >
      <div className="space-y-3">
        {/* Thumbnail strip */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {history.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/filament/${item.filament_id}`)}
              className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
              title={item.filament?.product_title || "View filament"}
            >
              {item.filament?.featured_image ? (
                <img
                  src={item.filament.featured_image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: item.filament?.color_hex || "#ccc" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Continue comparison prompt */}
        {compareItems.length > 0 && (
          <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-xs font-medium">
                  Continue comparison
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {compareItems.length} item{compareItems.length !== 1 ? "s" : ""} in tray
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => navigate("/compare")}
              >
                Resume
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Recent list with details */}
        <div className="space-y-1.5">
          {history.slice(0, 3).map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/filament/${item.filament_id}`)}
              className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors text-left"
            >
              <div
                className="w-6 h-6 rounded shrink-0"
                style={{ backgroundColor: item.filament?.color_hex || "#ccc" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">
                  {item.filament?.product_title || "Unknown"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {item.filament?.material} • {item.filament?.vendor}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </SidebarModule>
  );
}

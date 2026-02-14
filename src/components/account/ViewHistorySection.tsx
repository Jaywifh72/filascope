import { Link } from "react-router-dom";
import { History, Trash2, ExternalLink } from "lucide-react";
import { useBrowseHistory, getPrinterImageFromHistory, type BrowseHistoryItem } from "@/hooks/useBrowseHistory";
import { useRegion } from "@/contexts/RegionContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

function HistoryListItem({ item }: { item: BrowseHistoryItem }) {
  const { formatPrice, convertPrice, hasRates, currency } = useRegion();

  const isFilament = item.product_type === "filament" && item.filament;
  const isPrinter = item.product_type === "printer" && item.printer;

  if (!isFilament && !isPrinter) return null;

  const href = isFilament
    ? `/filament/${item.product_id}`
    : `/printers/${item.product_id}`;

  const title = isFilament
    ? item.filament!.product_title
    : item.printer!.display_name || item.printer!.model_name;

  const image = isFilament ? item.filament!.featured_image : getPrinterImageFromHistory(item.printer);
  const colorHex = isFilament ? item.filament!.color_hex : null;

  const rawPrice = isFilament
    ? item.filament!.variant_price
    : item.printer!.current_price_usd_store;

  const displayPrice = rawPrice && hasRates
    ? formatPrice(convertPrice(rawPrice, "USD"), { showApproximate: currency !== "USD" })
    : rawPrice
      ? `$${rawPrice.toFixed(2)}`
      : null;

  return (
    <Link
      to={href}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-border bg-muted/30">
        {image ? (
          <img src={getOptimizedImageUrl(image, 112)} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : colorHex ? (
          <div className="w-full h-full" style={{ backgroundColor: colorHex }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <History className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {isFilament && item.filament!.material && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {item.filament!.material}
            </Badge>
          )}
          {isPrinter && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Printer
            </Badge>
          )}
          {isFilament && item.filament!.vendor && (
            <span className="text-xs text-muted-foreground">{item.filament!.vendor}</span>
          )}
        </div>
      </div>

      {/* Price + Time */}
      <div className="shrink-0 text-right">
        {displayPrice && (
          <p className="text-sm font-semibold text-foreground">{displayPrice}</p>
        )}
        <p className="text-xs text-muted-foreground">{formatTimeAgo(item.viewed_at)}</p>
      </div>

      {/* Arrow */}
      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}

export function ViewHistorySection() {
  const { history, isLoading, clearHistory } = useBrowseHistory(20);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading view history...
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No browsing history yet. Visit filament or printer pages to build your history.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clear button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {history.length} item{history.length !== 1 ? "s" : ""} viewed
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => clearHistory()}
          className="text-destructive hover:text-destructive gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear History
        </Button>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-2 divide-y divide-border">
          {history.map((item) => (
            <HistoryListItem key={item.id} item={item} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

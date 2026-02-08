import { useMemo } from "react";
import { Link } from "react-router-dom";
import { History, X, ChevronRight } from "lucide-react";
import { useBrowseHistory, getPrinterImageFromHistory, type BrowseHistoryItem } from "@/hooks/useBrowseHistory";
import { useRegion } from "@/contexts/RegionContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface RecentlyViewedSectionProps {
  /** Max items to show */
  limit?: number;
  /** Product ID to exclude (current product) */
  excludeId?: string;
  /** Show "Clear History" link */
  showClear?: boolean;
  /** Compact mode for detail pages */
  compact?: boolean;
  /** Section title override */
  title?: string;
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function ProductCard({ item, compact }: { item: BrowseHistoryItem; compact?: boolean }) {
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
  const subtitle = isFilament
    ? `${item.filament!.material || ""}${item.filament!.vendor ? ` • ${item.filament!.vendor}` : ""}`
    : "Printer";

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
      className={`group shrink-0 block rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 overflow-hidden ${
        compact ? "w-[140px]" : "w-[160px]"
      }`}
    >
      {/* Image / Color Swatch */}
      <div className={`relative w-full bg-muted/30 ${compact ? "h-[90px]" : "h-[100px]"}`}>
        {image ? (
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : colorHex ? (
          <div className="w-full h-full" style={{ backgroundColor: colorHex }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <History className="w-6 h-6" />
          </div>
        )}
        {/* Product type badge */}
        {isPrinter && (
          <Badge
            variant="secondary"
            className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0"
          >
            Printer
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className={`p-2.5 space-y-1 ${compact ? "p-2" : ""}`}>
        <p className="text-xs font-medium truncate text-foreground leading-tight">
          {title}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
        {displayPrice && (
          <p className="text-xs font-semibold text-primary">{displayPrice}</p>
        )}
      </div>
    </Link>
  );
}

export function RecentlyViewedSection({
  limit = 10,
  excludeId,
  showClear = true,
  compact = false,
  title = "Recently Viewed",
}: RecentlyViewedSectionProps) {
  const { history, isLoading, clearHistory } = useBrowseHistory(limit + 1);

  const filtered = useMemo(() => {
    let items = history;
    if (excludeId) {
      items = items.filter((i) => i.product_id !== excludeId);
    }
    return items.slice(0, limit);
  }, [history, excludeId, limit]);

  // Don't render if no history
  if (!isLoading && filtered.length === 0) return null;
  // Show loading skeleton briefly
  if (isLoading) return null;

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground">({filtered.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {showClear && (
            <button
              onClick={() => clearHistory()}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
          <Link
            to="/vault?tab=history"
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Horizontal scroll */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {filtered.map((item) => (
            <ProductCard key={item.id} item={item} compact={compact} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}

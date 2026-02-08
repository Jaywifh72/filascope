import { useMemo } from "react";
import { Link } from "react-router-dom";
import { History, ChevronRight } from "lucide-react";
import { useBrowseHistory, getPrinterImageFromHistory, type BrowseHistoryItem } from "@/hooks/useBrowseHistory";
import { useAuth } from "@/hooks/useAuth";
import { useRegion } from "@/contexts/RegionContext";
import { Badge } from "@/components/ui/badge";

function ContinueCard({ item }: { item: BrowseHistoryItem }) {
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
    ? item.filament!.vendor || ""
    : "Printer";

  const rawPrice = isFilament
    ? item.filament!.variant_price
    : item.printer!.current_price_usd_store;

  const displayPrice =
    rawPrice && hasRates
      ? formatPrice(convertPrice(rawPrice, "USD"), {
          showApproximate: currency !== "USD",
        })
      : rawPrice
        ? `$${rawPrice.toFixed(2)}`
        : null;

  return (
    <Link
      to={href}
      className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all group min-w-0"
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden border border-border bg-muted/30">
        {image ? (
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : colorHex ? (
          <div className="w-full h-full" style={{ backgroundColor: colorHex }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <History className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
      </div>

      {displayPrice && (
        <span className="text-xs font-semibold text-primary shrink-0">
          {displayPrice}
        </span>
      )}
    </Link>
  );
}

/**
 * Shows the last 3 viewed products for logged-in users.
 * Only renders if user has viewed products in the current session.
 */
export function ContinueBrowsingSection() {
  const { user } = useAuth();
  const { history, isLoading, localItems } = useBrowseHistory(5);

  // Only show for logged-in users with recent activity
  // Use localItems to check current-session views
  const hasSessionViews = localItems.length > 0;

  const recentItems = useMemo(() => {
    return history.slice(0, 3);
  }, [history]);

  if (!user || isLoading || !hasSessionViews || recentItems.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Continue Browsing
          </h3>
        </div>
        <Link
          to="/vault?tab=history"
          className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {recentItems.map((item) => (
          <ContinueCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

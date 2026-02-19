import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Clock, X, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { useBrowseHistory, getPrinterImageFromHistory, type BrowseHistoryItem } from "@/hooks/useBrowseHistory";
import { useRegion } from "@/contexts/RegionContext";
import { Badge } from "@/components/ui/badge";
import { cn, normalizeColorHex } from "@/lib/utils";
import { getOptimizedImageUrl, getImageSrcSet } from "@/utils/imageOptimization";
import { getFilamentHref } from "@/lib/filamentUrl";

const COLLAPSED_KEY = "filascope_recently_viewed_collapsed";

function getCollapsedState(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

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
  /** Filter to only show a specific product type */
  filterType?: "filament" | "printer";
}

function CompactFilamentCard({ item }: { item: BrowseHistoryItem }) {
  const { formatPrice, convertPrice, hasRates, currency } = useRegion();

  const isFilament = item.product_type === "filament" && item.filament;
  const isPrinter = item.product_type === "printer" && item.printer;

  if (!isFilament && !isPrinter) return null;

  const href = isFilament
    ? getFilamentHref(item.product_id, (item.filament as any)?.product_handle)
    : `/printers/${(item.printer as any)?.printer_id || item.product_id}`;

  const title = isFilament
    ? item.filament!.product_title
    : item.printer!.display_name || item.printer!.model_name;

  const image = isFilament ? item.filament!.featured_image : getPrinterImageFromHistory(item.printer);
  const colorHex = isFilament ? normalizeColorHex(item.filament!.color_hex) : null;
  const brand = isFilament ? item.filament!.vendor : null;
  const material = isFilament ? item.filament!.material : null;

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
      className="group/rv shrink-0 flex items-center gap-3 rounded-xl border border-border bg-card/60 hover:border-primary/40 hover:bg-card transition-all duration-150 ease-out overflow-hidden p-2.5 w-[220px] snap-start"
    >
      {/* Image or color swatch */}
      <div className="relative flex-shrink-0 w-12 h-12 rounded-lg bg-muted/30 overflow-hidden">
        {image ? (
          <img
            src={getOptimizedImageUrl(image, 112)}
            alt={`${title} thumbnail`}
            className="w-full h-full object-contain"
            loading="lazy"
            width={48}
            height={48}
          />
        ) : colorHex ? (
          <div className="w-full h-full rounded-lg" style={{ backgroundColor: colorHex }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Clock className="w-5 h-5" />
          </div>
        )}
        {/* Color swatch badge overlay */}
        {colorHex && image && (
          <div
            className="absolute -top-0.5 -left-0.5 w-5 h-5 rounded-full ring-2 ring-background"
            style={{ backgroundColor: colorHex }}
          />
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-xs font-medium text-foreground truncate leading-tight group-hover/rv:text-primary transition-colors">
          {title}
        </p>
        {brand && (
          <p className="text-[10px] text-muted-foreground truncate">{brand}</p>
        )}
        <div className="flex items-center gap-1.5">
          {material && (
            <span className="text-[10px] font-medium text-violet-400 bg-violet-500/15 border border-violet-500/30 px-1.5 py-0 rounded-full leading-relaxed">
              {material.split(/[\s\-+]/)[0]}
            </span>
          )}
          {displayPrice && (
            <span className="text-[11px] font-semibold text-primary">{displayPrice}</span>
          )}
        </div>
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
  filterType,
}: RecentlyViewedSectionProps) {
  const { history, isLoading, clearHistory } = useBrowseHistory(limit + 20);
  const [isCollapsed, setIsCollapsed] = useState(getCollapsedState);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let items = history;
    if (excludeId) {
      items = items.filter((i) => i.product_id !== excludeId);
    }
    if (filterType) {
      items = items.filter((i) => i.product_type === filterType);
    }
    return items.slice(0, limit);
  }, [history, excludeId, limit, filterType]);

  // Don't render if no history — avoid layout shift
  if (!isLoading && filtered.length === 0) return null;
  if (isLoading) return null;

  return (
    <section className="w-full mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={toggleCollapsed}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground">({filtered.length})</span>
          {isCollapsed ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>
        <div className="flex items-center gap-2">
          {showClear && !isCollapsed && (
            <button
              onClick={() => clearHistory()}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Horizontal scroll with gradient fade */}
      {!isCollapsed && (
        <div className="relative">
          <div className="flex gap-3 pb-2 overflow-x-auto scrollbar-none snap-x snap-mandatory">
            {filtered.map((item) => (
              <CompactFilamentCard key={item.id} item={item} />
            ))}
          </div>
          {/* Right-edge gradient fade */}
          <div className="absolute top-0 right-0 bottom-2 w-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />
        </div>
      )}
    </section>
  );
}

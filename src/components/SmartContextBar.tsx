import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDealsCount } from "@/hooks/useDealsCount";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { useCompare } from "@/hooks/useCompare";
import { cn } from "@/lib/utils";

const chipBase =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap snap-start";
const chipDefault =
  "bg-muted/40 text-muted-foreground border border-border/20 hover:bg-muted/70 hover:text-foreground hover:border-border/50";
const chipPrimary =
  "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/40";

type Chip =
  | { type: "link"; label: string; to: string; variant?: "default" | "primary"; badge?: string; badgeColor?: string }
  | { type: "button"; label: string; onClick: () => void; variant?: "default" | "primary"; badge?: string; badgeColor?: string };

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }
}

export function SmartContextBar() {
  const { data: dealsData } = useDealsCount();
  const dealsCount = dealsData?.uniqueProducts || 0;
  const { selectedPrinter } = usePrinterSelection();
  const { items: compareItems } = useCompare();

  // Determine user state
  const hasHistory = useMemo(() => {
    try {
      const recent = localStorage.getItem("recently_viewed_items");
      return !!recent && JSON.parse(recent).length > 0;
    } catch { return false; }
  }, []);

  const hasPrinter = !!selectedPrinter;

  const chips = useMemo<Chip[]>(() => {
    // Printer set
    if (hasPrinter) {
      const chips: Chip[] = [
        { type: "button", label: `🖨️ ${selectedPrinter!.model_name}`, onClick: () => scrollToId("filament-filters"), variant: "primary" },
        { type: "button", label: "🔥 Trending Now", onClick: () => scrollToId("trending-section") },
      ];
      if (dealsCount > 0) {
        chips.push({ type: "link", label: "💰 Deals", to: "/deals", badge: String(dealsCount), badgeColor: "bg-emerald-500/20 text-emerald-400" });
      }
      if (compareItems.length > 0) {
        chips.push({ type: "link", label: `📊 Compare`, to: "/compare", badge: String(compareItems.length) });
      }
      return chips;
    }

    // Returning visitor
    if (hasHistory) {
      const chips: Chip[] = [
        { type: "button", label: "🔄 Continue Browsing", onClick: () => scrollToId("filament-filters") },
        { type: "button", label: "🔥 Trending Now", onClick: () => scrollToId("trending-section") },
      ];
      if (dealsCount > 0) {
        chips.push({ type: "link", label: "💰 Today's Deals", to: "/deals", badge: String(dealsCount), badgeColor: "bg-emerald-500/20 text-emerald-400" });
      }
      if (compareItems.length > 0) {
        chips.push({ type: "link", label: `📊 Compare`, to: "/compare", badge: String(compareItems.length) });
      }
      return chips;
    }

    // First-time visitor
    const chips: Chip[] = [
      { type: "link", label: "🆕 New here? Take the Quiz", to: "/wizard", variant: "primary" },
      { type: "button", label: "🔥 Trending Now", onClick: () => scrollToId("trending-section") },
    ];
    if (dealsCount > 0) {
      chips.push({ type: "link", label: "💰 Today's Deals", to: "/deals", badge: String(dealsCount), badgeColor: "bg-emerald-500/20 text-emerald-400" });
    }
    chips.push({ type: "link", label: "📖 How to Choose", to: "/guides/pla-vs-petg" });
    return chips;
  }, [hasPrinter, hasHistory, selectedPrinter, dealsCount, compareItems.length]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2 snap-x snap-mandatory animate-fade-in" style={{ animationDelay: "0.35s" }}>
      {chips.map((chip) => {
        const classes = cn(chipBase, chip.variant === "primary" ? chipPrimary : chipDefault);
        const badgeEl = chip.badge ? (
          <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none", chip.badgeColor || "bg-muted text-muted-foreground")}>
            {chip.badge}
          </span>
        ) : null;

        if (chip.type === "link") {
          return (
            <Link key={chip.label} to={chip.to} className={classes}>
              {chip.label}
              {badgeEl}
            </Link>
          );
        }
        return (
          <button key={chip.label} onClick={chip.onClick} className={classes}>
            {chip.label}
            {badgeEl}
          </button>
        );
      })}
    </div>
  );
}

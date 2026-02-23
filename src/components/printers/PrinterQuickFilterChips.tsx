import { cn } from "@/lib/utils";
import { useRegion } from "@/contexts/RegionContext";
import { formatPrice } from "@/config/currencies";

export type PrinterQuickFilter = 
  | "popular"
  | "under500"
  | "enclosed"
  | "multicolor"
  | "highspeed"
  | "large"
  | "new";

// Crawlable hrefs for each chip — Googlebot follows these to category pages
const CHIP_HREFS: Record<PrinterQuickFilter, string> = {
  popular:    "/printers?sort=popular",
  under500:   "/printers/under-500",
  enclosed:   "/printers/enclosed",
  multicolor: "/printers/multi-color",
  highspeed:  "/printers/high-speed",
  large:      "/printers/large-format",
  new:        "/printers?sort=newest",
};

interface ChipDef {
  id: PrinterQuickFilter;
  emoji: string;
  label: string;
  /** Dynamic label function for currency-aware chips */
  getLabel?: (currencySymbol: string, convertedAmount: string) => string;
}

const CHIPS: ChipDef[] = [
  { id: "popular", emoji: "🔥", label: "Popular" },
  { id: "under500", emoji: "💰", label: "Under $500", getLabel: (_, amount) => `Under ${amount}` },
  { id: "enclosed", emoji: "🏠", label: "Enclosed" },
  { id: "multicolor", emoji: "🎨", label: "Multi-Color" },
  { id: "highspeed", emoji: "⚡", label: "High Speed" },
  { id: "large", emoji: "📦", label: "Large Format" },
  { id: "new", emoji: "🆕", label: "New Arrivals" },
];

interface PrinterQuickFilterChipsProps {
  active: PrinterQuickFilter | null;
  onChange: (chip: PrinterQuickFilter | null) => void;
}

export function PrinterQuickFilterChips({ active, onChange }: PrinterQuickFilterChipsProps) {
  const { currency, getConversionRate } = useRegion();
  
  // Convert $500 USD to user's currency for the "Under $500" chip
  const under500Label = (() => {
    if ((currency as string) === 'USD') return 'Under $500';
    const rate = getConversionRate('USD', currency);
    if (rate === 1) return 'Under $500'; // rates not loaded yet
    const converted = Math.round(500 * rate / 10) * 10; // round to nearest 10
    return `Under ${formatPrice(converted, currency)}`;
  })();

  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-none pb-1 mb-4">
      {CHIPS.map((chip) => {
        const isActive = active === chip.id;
        const displayLabel = chip.id === 'under500' ? under500Label : chip.label;
        return (
          <a
            key={chip.id}
            href={CHIP_HREFS[chip.id]}
            onClick={(e) => {
              e.preventDefault();
              onChange(isActive ? null : chip.id);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border flex-shrink-0 no-underline",
              isActive
                ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                : "bg-gray-800/60 text-gray-400 border-gray-700 [@media(hover:hover)]:hover:border-gray-600"
            )}
          >
            <span>{chip.emoji}</span>
            {displayLabel}
          </a>
        );
      })}
    </div>
  );
}

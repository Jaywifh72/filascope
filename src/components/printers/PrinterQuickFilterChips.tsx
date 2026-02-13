import { cn } from "@/lib/utils";

export type PrinterQuickFilter = 
  | "popular"
  | "under500"
  | "enclosed"
  | "multicolor"
  | "highspeed"
  | "large"
  | "new";

interface ChipDef {
  id: PrinterQuickFilter;
  emoji: string;
  label: string;
}

const CHIPS: ChipDef[] = [
  { id: "popular", emoji: "🔥", label: "Popular" },
  { id: "under500", emoji: "💰", label: "Under $500" },
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
  return (
    <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-none pb-1 mb-4">
      {CHIPS.map((chip) => {
        const isActive = active === chip.id;
        return (
          <button
            key={chip.id}
            onClick={() => onChange(isActive ? null : chip.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border flex-shrink-0",
              isActive
                ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                : "bg-gray-800/60 text-gray-400 border-gray-700 [@media(hover:hover)]:hover:border-gray-600"
            )}
          >
            <span>{chip.emoji}</span>
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

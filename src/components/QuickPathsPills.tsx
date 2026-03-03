import { Link } from "react-router-dom";
import type { FilamentFiltersState } from "@/hooks/useSessionFilters";

interface QuickPathsPillsProps {
  resetFilters: () => void;
  updateFilter: <K extends keyof FilamentFiltersState>(key: K, value: FilamentFiltersState[K]) => void;
}

const pillClass =
  "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground border border-border/30 hover:border-border/60 transition-all whitespace-nowrap";

interface FilterPill {
  label: string;
  apply: (reset: QuickPathsPillsProps["resetFilters"], update: QuickPathsPillsProps["updateFilter"]) => void;
}

interface LinkPill {
  label: string;
  href: string;
}

const FILTER_PILLS: FilterPill[] = [
  {
    label: "Best for Beginners",
    apply: (reset, update) => { reset(); update("selectedMaterials", ["PLA", "PETG"]); update("sortBy", "score"); },
  },
  {
    label: "HueForge Ready",
    apply: (reset, update) => { reset(); update("hasTdData", true); },
  },
  {
    label: "Engineering Grade",
    apply: (reset, update) => { reset(); update("selectedMaterials", ["PC", "Nylon", "ASA"]); },
  },
  {
    label: "Under $20/kg",
    apply: (reset, update) => { reset(); update("priceRange", [0, 20]); },
  },
  {
    label: "Best PETG under $25",
    apply: (reset, update) => { reset(); update("selectedMaterials", ["PETG"]); update("priceRange", [0, 25]); },
  },
  {
    label: "Silk PLA",
    apply: (reset, update) => { reset(); update("selectedMaterials", ["PLA"]); update("silk", true); },
  },
];

const LINK_PILLS: LinkPill[] = [
  { label: "PLA vs PETG", href: "/guides/pla-vs-petg" },
];

function scrollToCatalog() {
  const el = document.getElementById("filament-filters");
  if (el) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }
}

export function QuickPathsPills({ resetFilters, updateFilter }: QuickPathsPillsProps) {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 py-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.label}
            className={pillClass}
            onClick={() => {
              pill.apply(resetFilters, updateFilter);
              scrollToCatalog();
            }}
          >
            {pill.label}
          </button>
        ))}
        {LINK_PILLS.map((pill) => (
          <Link key={pill.label} to={pill.href} className={pillClass}>
            {pill.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

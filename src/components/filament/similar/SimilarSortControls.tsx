import { cn } from "@/lib/utils";
import type { SimilarSortOption } from "@/hooks/useSimilarFilamentsEnhanced";

interface SimilarSortControlsProps {
  value: SimilarSortOption;
  onChange: (value: SimilarSortOption) => void;
}

const SORT_OPTIONS: { value: SimilarSortOption; label: string }[] = [
  { value: "lowest_price", label: "Lowest Price" },
  { value: "highest_rated", label: "Highest Rated" },
  { value: "most_popular", label: "Most Popular" },
];

export function SimilarSortControls({ value, onChange }: SimilarSortControlsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
            value === opt.value
              ? "bg-primary/20 text-primary border border-primary/40"
              : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50 hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

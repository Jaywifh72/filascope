import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = 
  | "popularity" 
  | "price_asc" 
  | "rating" 
  | "nozzle_temp" 
  | "bed_temp";

interface DataInventoryControlBarProps {
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  resultCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "price_asc", label: "Price (Low to High)" },
  { value: "rating", label: "Rating" },
  { value: "nozzle_temp", label: "Nozzle Temp" },
  { value: "bed_temp", label: "Bed Temp" },
];

export function DataInventoryControlBar({ 
  sortBy, 
  onSortChange, 
  resultCount 
}: DataInventoryControlBarProps) {
  return (
    <div className="w-full bg-white/[0.02] border border-white/10 rounded-lg px-4 py-3 mb-6 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Result count */}
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
            Data Inventory
          </span>
          <div className="h-4 w-px bg-white/10" />
          <span className="font-mono text-sm text-primary font-bold">
            {resultCount.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">entries</span>
        </div>

        {/* Right: Sort control */}
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground hidden sm:inline">
            Sort By
          </span>
          <Select value={sortBy} onValueChange={(val) => onSortChange(val as SortOption)}>
            <SelectTrigger className="w-[180px] h-9 bg-white/[0.03] border-white/10 text-sm font-mono hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              {SORT_OPTIONS.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="font-mono text-sm cursor-pointer hover:bg-primary/10"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export default DataInventoryControlBar;

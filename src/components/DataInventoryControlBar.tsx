import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SortOption = 
  | "scoring-asc" 
  | "scoring-desc"
  | "alpha-asc"
  | "alpha-desc"
  | "price-asc"
  | "price-desc"
  | "strength-desc"
  | "heat-desc"
  | "print-desc"
  | "td-desc";

interface DataInventoryControlBarProps {
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  resultCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "scoring-desc", label: "Scoring: High to Low" },
  { value: "scoring-asc", label: "Scoring: Low to High" },
  { value: "alpha-asc", label: "A-Z" },
  { value: "alpha-desc", label: "Z-A" },
  { value: "price-asc", label: "Price/KG: Low to High" },
  { value: "price-desc", label: "Price/KG: High to Low" },
  { value: "strength-desc", label: "Strength" },
  { value: "heat-desc", label: "Heat Resistance" },
  { value: "print-desc", label: "Printability" },
  { value: "td-desc", label: "HueForge TD" },
];

export function DataInventoryControlBar({ 
  sortBy, 
  onSortChange, 
  resultCount 
}: DataInventoryControlBarProps) {
  const selectedLabel = SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || "Sort";
  
  return (
    <div className="w-full bg-gray-800/30 border border-gray-700 rounded-lg px-4 py-3 mb-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Result count */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Results
          </span>
          <span className="text-sm font-semibold text-primary">
            {resultCount.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">entries</span>
        </div>

        {/* Right: Sort control */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:inline">
            Sort By
          </span>
          <Select value={sortBy} onValueChange={(val) => onSortChange(val as SortOption)}>
            <SelectTrigger className={cn(
              "w-[200px] h-9 text-sm rounded-lg border transition-all duration-200",
              "bg-gray-800/50 border-gray-700 text-gray-300",
              "hover:bg-gray-800 hover:border-gray-600"
            )}>
              <SelectValue>{selectedLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 z-50">
              {SORT_OPTIONS.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="text-sm cursor-pointer text-gray-300 hover:bg-primary/10 focus:bg-primary/10 focus:text-primary"
                >
                  <div className="flex items-center gap-2">
                    {sortBy === option.value && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span className={sortBy === option.value ? "text-primary font-medium" : ""}>
                      {option.label}
                    </span>
                  </div>
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

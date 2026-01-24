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
  | "truecost-asc" 
  | "truecost-desc"
  | "print-desc"
  | "print-asc"
  | "strength-desc"
  | "strength-asc"
  | "heat-desc"
  | "heat-asc"
  | "score-desc"
  | "score-asc"
  | "price-asc"
  | "price-desc";

interface DataInventoryControlBarProps {
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  resultCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "truecost-asc", label: "True Cost: Low to High" },
  { value: "truecost-desc", label: "True Cost: High to Low" },
  { value: "print-desc", label: "Printability: High to Low" },
  { value: "strength-desc", label: "Strength: High to Low" },
  { value: "heat-desc", label: "Heat Resistance: High to Low" },
  { value: "score-desc", label: "Value Score: High to Low" },
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

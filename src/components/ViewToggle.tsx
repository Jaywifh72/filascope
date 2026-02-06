import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  className?: string;
}

export function ViewToggle({ viewMode, onViewModeChange, className }: ViewToggleProps) {
  return (
    <div 
      className={cn(
        "relative flex items-center bg-gray-800 rounded-lg p-1",
        className
      )}
      role="tablist"
      aria-label="View mode selector"
    >
      {/* Sliding indicator */}
      <div 
        className={cn(
          "absolute h-[calc(100%-8px)] w-[calc(50%-2px)] bg-primary rounded-md transition-transform duration-300 ease-out",
          viewMode === "list" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
        )}
        aria-hidden="true"
      />
      
      {/* Grid button */}
      <button
        onClick={() => onViewModeChange("grid")}
        className={cn(
          "relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200",
          viewMode === "grid" 
            ? "text-white" 
            : "text-gray-400 hover:text-white"
        )}
        role="tab"
        aria-selected={viewMode === "grid"}
        aria-controls="filament-grid"
        aria-label="Card view"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Cards</span>
      </button>
      
      {/* List button */}
      <button
        onClick={() => onViewModeChange("list")}
        className={cn(
          "relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200",
          viewMode === "list" 
            ? "text-white" 
            : "text-gray-400 hover:text-white"
        )}
        role="tab"
        aria-selected={viewMode === "list"}
        aria-controls="filament-table"
        aria-label="Table view"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Table</span>
      </button>
    </div>
  );
}

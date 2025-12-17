import { SearchX, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CADEmptyStateProps {
  onClear: () => void;
}

const CADEmptyState = ({ onClear }: CADEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
      {/* Icon */}
      <div className={cn(
        "w-16 h-16 mb-5 flex items-center justify-center",
        "bg-white/[0.03] border border-dashed border-white/15 rounded-2xl"
      )}>
        <SearchX size={28} className="text-muted-foreground/50" />
      </div>

      {/* Title */}
      <h4 className="text-lg font-bold text-foreground mb-2">
        No software matches your filters
      </h4>

      {/* Description */}
      <p className="text-sm font-medium text-muted-foreground mb-5 max-w-[400px]">
        Try adjusting your filter criteria or clear all filters to see all available options.
      </p>

      {/* Action Button */}
      <button
        onClick={onClear}
        className={cn(
          "inline-flex items-center gap-2 px-5 py-3",
          "bg-transparent border border-cyan-400/30 rounded-lg",
          "text-sm font-semibold text-cyan-400",
          "transition-all duration-200",
          "hover:bg-cyan-400/10 hover:border-cyan-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <RefreshCw size={16} />
        Clear All Filters
      </button>
    </div>
  );
};

export default CADEmptyState;

import { X, BarChart3, SlidersHorizontal, Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCADComparison } from '@/contexts/CADComparisonContext';
import { Button } from '@/components/ui/button';
import { cadLogos, needsBrightness } from '@/lib/cadLogos';

export function CADCompareTray() {
  const { 
    selectedSoftware, 
    removeSoftware, 
    clearAll,
    canCompare, 
    openComparison,
    maxSoftware 
  } = useCADComparison();
  
  const isVisible = selectedSoftware.length > 0;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[70]",
        "bg-gray-900 border-t border-gray-700",
        "shadow-2xl shadow-black/50",
        "transition-all duration-300 ease-out",
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Label with count + filter icon */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-foreground hidden sm:inline">
                Compare Tray
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                {selectedSoftware.length}/{maxSoftware}
              </span>
            </div>
            <button
              className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 transition-colors"
              aria-label="Filter options"
            >
              <SlidersHorizontal size={16} className="text-muted-foreground" />
            </button>
          </div>

          {/* Center: Selected items + placeholder slots */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 justify-center">
            {selectedSoftware.map((item) => (
              <div
                key={item.id}
                className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-primary/50 transition-colors flex-shrink-0"
              >
                {cadLogos[item.name] && (
                  <img
                    src={cadLogos[item.name]}
                    alt={item.name}
                    className={cn(
                      "w-5 h-5 object-contain",
                      needsBrightness(item.name) && "brightness-150 invert"
                    )}
                  />
                )}
                <span className="text-sm font-medium text-foreground max-w-[80px] truncate hidden sm:inline">
                  {item.name}
                </span>
                <button
                  onClick={() => removeSoftware(item.id)}
                  className="p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label={`Remove ${item.name} from comparison`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            {/* Empty placeholder slots */}
            {Array.from({ length: maxSoftware - selectedSoftware.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center flex-shrink-0"
              >
                <Plus size={14} className="text-muted-foreground" />
              </div>
            ))}
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-destructive text-xs hidden sm:flex"
            >
              Clear
            </Button>
            <Button
              onClick={openComparison}
              disabled={!canCompare}
              className={cn(
                "px-4 py-2 font-semibold text-sm transition-all flex items-center gap-2",
                canCompare 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <span className="hidden sm:inline">Compare Now</span>
              <span className="sm:hidden">Compare</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CADCompareTray;

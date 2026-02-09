import { X, BarChart3, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCADComparison } from '@/contexts/CADComparisonContext';
import { cadLogos, needsBrightness } from '@/lib/cadLogos';

const CADComparisonSidebar = () => {
  const { 
    selectedSoftware, 
    removeSoftware, 
    clearAll, 
    canCompare, 
    openComparison,
    maxSoftware,
    announcement
  } = useCADComparison();
  
  const isVisible = selectedSoftware.length > 0;
  const emptySlots = Math.max(0, maxSoftware - selectedSoftware.length);

  return (
    <aside
      aria-label="Comparison builder"
      aria-live="polite"
      className={cn(
        "fixed top-24 right-5 z-50 w-[280px] hidden lg:block",
        "bg-background/98 backdrop-blur-xl border border-border rounded-2xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        "transition-all duration-300",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-[320px] opacity-0 pointer-events-none"
      )}
    >
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Header */}
      <div className="p-5 border-b border-border">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
          <BarChart3 size={18} className="text-cyan-400" />
          Compare Software
        </h3>
        <p className="text-xs font-medium text-muted-foreground">
          Select 2-4 items to compare
        </p>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {selectedSoftware.map(item => (
          <div 
            key={item.id}
            className="flex items-center gap-3 p-3 bg-white/[0.03] border border-border rounded-[10px] transition-all hover:bg-white/[0.05]"
          >
            <div className="w-9 h-9 flex-shrink-0 bg-white/[0.03] rounded-md p-1 flex items-center justify-center">
              {cadLogos[item.name] && (
                <img 
                  src={cadLogos[item.name]} 
                  alt={item.name}
                  className={cn(
                    "w-full h-full object-contain",
                    needsBrightness(item.name) && "brightness-150 invert"
                  )}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-foreground truncate">
                {item.name}
              </div>
              <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
                {item.priceType === 'free' ? 'Free' : 
                 item.priceType === 'freemium' ? 'Freemium' : 
                 item.priceValue || 'Paid'}
              </div>
            </div>
            <button
              onClick={() => removeSoftware(item.id)}
              aria-label={`Remove ${item.name} from comparison`}
              className="w-7 h-7 flex-shrink-0 bg-transparent border border-border rounded-md text-muted-foreground flex items-center justify-center transition-all hover:bg-destructive/15 hover:border-destructive/30 hover:text-destructive"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {Array.from({ length: emptySlots }).map((_, index) => (
          <div 
            key={`empty-${index}`}
            className="flex items-center justify-center gap-2 h-[60px] border border-dashed border-border/40 rounded-[10px] text-xs font-medium text-muted-foreground/60"
          >
            <Plus size={14} />
            <span>Add another item</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 pt-4 border-t border-border">
        <button
          onClick={canCompare ? openComparison : undefined}
          disabled={!canCompare}
          aria-label={canCompare ? `Compare ${selectedSoftware.length} items` : 'Select at least 2 items to compare'}
          className={cn(
            "w-full h-12 rounded-[10px] text-sm font-bold flex items-center justify-center gap-2 transition-all",
            canCompare 
              ? "bg-cyan-400 text-background hover:bg-cyan-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,217,217,0.3)] cursor-pointer"
              : "bg-white/[0.05] text-muted-foreground cursor-not-allowed"
          )}
        >
          <BarChart3 size={18} />
          Compare Now ({selectedSoftware.length})
        </button>

        {selectedSoftware.length > 0 && (
          <button
            onClick={clearAll}
            className="w-full p-2.5 mt-2.5 bg-transparent border-none text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
          >
            Clear All
          </button>
        )}
      </div>
    </aside>
  );
};

export default CADComparisonSidebar;

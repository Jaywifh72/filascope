import { GitCompare, X, ArrowRight, Trash2 } from 'lucide-react';
import { useSlicerComparison } from '@/contexts/SlicerComparisonContext';
import { cn } from '@/lib/utils';

export function ComparisonBuilderSidebar() {
  const {
    selectedSlicers,
    removeSlicer,
    clearAll,
    openComparison,
    maxSlicers,
  } = useSlicerComparison();

  const emptySlots = maxSlicers - selectedSlicers.length;
  const canCompare = selectedSlicers.length >= 2;

  const getSubtitle = () => {
    const count = selectedSlicers.length;
    if (count === 0) return "Select 2-4 to compare";
    if (count === 1) return "Select 1-3 more";
    if (count === maxSlicers) return `${maxSlicers} of ${maxSlicers} selected (max)`;
    return `${count} of ${maxSlicers} selected`;
  };

  const getButtonText = () => {
    const count = selectedSlicers.length;
    if (count === 0) return "Select Slicers to Compare";
    if (count === 1) return "Select 1 More to Compare";
    return `Compare ${count} Slicers`;
  };

  return (
    <div className="w-[280px] bg-card/50 border border-border rounded-xl p-5 shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wide">
          <GitCompare size={16} className="text-primary" />
          Compare Slicers
        </div>
        <div className="text-xs font-medium text-muted-foreground">
          {getSubtitle()}
        </div>
      </div>

      {/* Slicers List */}
      <div className="flex flex-col gap-2.5 min-h-[240px] mb-4">
        {selectedSlicers.length === 0 ? (
          <div className="min-h-[240px] p-6 flex flex-col items-center justify-center gap-3 text-center bg-muted/20 border border-dashed border-border rounded-lg">
            <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full">
              <GitCompare size={24} className="text-primary" />
            </div>
            <div className="text-[13px] font-medium text-muted-foreground leading-relaxed">
              No slicers selected yet.<br />
              Click "Add to Compare" on any card below.
            </div>
          </div>
        ) : (
          <>
            {selectedSlicers.map(slicer => (
              <div
                key={slicer.id}
                className="h-[50px] px-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2.5 transition-all hover:bg-primary/15 hover:border-primary/30"
              >
                {slicer.logo ? (
                  <img
                    src={slicer.logo}
                    alt={`${slicer.name} logo`}
                    className="w-8 h-8 object-contain rounded bg-muted/30 p-1 flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary/20 rounded flex-shrink-0" />
                )}
                <span className="flex-1 text-[13px] font-semibold text-foreground truncate">
                  {slicer.name}
                </span>
                <button
                  onClick={() => removeSlicer(slicer.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-all flex-shrink-0"
                  aria-label={`Remove ${slicer.name} from comparison`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            
            {Array.from({ length: emptySlots }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="h-[50px] px-3 bg-muted/10 border border-dashed border-border/50 rounded-lg flex items-center justify-center"
              >
                <span className="text-xs font-medium text-muted-foreground/60">
                  (Empty Slot)
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Compare Button */}
      <button
        onClick={() => canCompare && openComparison()}
        disabled={!canCompare}
        className={cn(
          "w-full h-12 rounded-lg text-[15px] font-bold inline-flex items-center justify-center gap-2.5 transition-all",
          canCompare
            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg"
            : "bg-muted/30 border border-border text-muted-foreground cursor-not-allowed"
        )}
        aria-label={getButtonText()}
      >
        <GitCompare size={18} />
        {getButtonText()}
        {canCompare && <ArrowRight size={18} />}
      </button>

      {/* Clear All */}
      {selectedSlicers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border flex justify-center">
          <button
            onClick={clearAll}
            className="px-4 py-2 text-xs font-semibold text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 hover:border-destructive/50 transition-all inline-flex items-center gap-2"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

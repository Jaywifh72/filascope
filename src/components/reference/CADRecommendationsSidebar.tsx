import { GitCompare, X, ArrowRight, Trash2, Box } from 'lucide-react';
import { useCADComparison } from '@/contexts/CADComparisonContext';
import { cn } from '@/lib/utils';
import { cadLogos, needsBrightness } from '@/lib/cadLogos';

export function CADRecommendationsSidebar() {
  const {
    selectedSoftware,
    removeSoftware,
    clearAll,
    openComparison,
    maxSoftware,
    canCompare,
  } = useCADComparison();

  const emptySlots = maxSoftware - selectedSoftware.length;
  const hasItems = selectedSoftware.length > 0;

  const getSubtitle = () => {
    const count = selectedSoftware.length;
    if (count === 0) return "Select 2-4 to compare";
    if (count === 1) return "Select 1-3 more";
    if (count === maxSoftware) return `${maxSoftware} of ${maxSoftware} selected (max)`;
    return `${count} of ${maxSoftware} selected`;
  };

  const getButtonText = () => {
    const count = selectedSoftware.length;
    if (count === 0) return "Select Software to Compare";
    if (count === 1) return "Select 1 More to Compare";
    return `Compare ${count} Software`;
  };

  return (
    <div className="w-[280px] bg-gray-900/60 border border-gray-700 rounded-xl p-5 shadow-lg">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-5 border-l-2 border-primary pl-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wide">
          <GitCompare size={16} className="text-primary" />
          Compare CAD Software
        </div>
        <div className="text-xs text-gray-400">
          {getSubtitle()}
        </div>
      </div>

      {/* Software List */}
      <div className="flex flex-col gap-2.5 min-h-[240px] mb-4">
        {selectedSoftware.length === 0 ? (
          <div className="min-h-[240px] p-6 flex flex-col items-center justify-center gap-3 text-center bg-gray-800/50 border border-dashed border-gray-600 rounded-lg">
            <div className="w-14 h-14 flex items-center justify-center bg-primary/20 rounded-full">
              <Box size={28} className="text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-400">No software selected yet.</span>
              <span className="text-xs text-gray-500">Click "+ Compare" on any card.</span>
            </div>
          </div>
        ) : (
          <>
            {selectedSoftware.map(software => (
              <div
                key={software.id}
                className="h-[50px] px-3 bg-gray-800 border border-gray-600 rounded-lg flex items-center gap-2.5 transition-all hover:border-primary/50 hover:bg-gray-800/80"
              >
                {software.logo ? (
                  <img
                    src={software.logo}
                    alt={`${software.name} logo`}
                    className={cn(
                      "w-8 h-8 object-contain rounded bg-gray-900/50 p-1 flex-shrink-0",
                      needsBrightness(software.name) && "brightness-150 invert"
                    )}
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary/20 rounded flex-shrink-0" />
                )}
                <span className="flex-1 text-sm font-semibold text-white truncate">
                  {software.name}
                </span>
                <button
                  onClick={() => removeSoftware(software.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-red-500/15 hover:text-red-400 transition-all flex-shrink-0"
                  aria-label={`Remove ${software.name} from comparison`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            
            {Array.from({ length: emptySlots }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="h-[50px] px-3 bg-gray-800/30 border border-dashed border-gray-700 rounded-lg flex items-center justify-center"
              >
                <span className="text-xs text-gray-500">
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
          "w-full h-12 rounded-lg text-sm font-bold inline-flex items-center justify-center gap-2 transition-all",
          canCompare
            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
            : "bg-gray-700 border border-gray-600 text-gray-400 cursor-not-allowed"
        )}
        aria-label={getButtonText()}
      >
        <GitCompare size={18} />
        {getButtonText()}
        {canCompare && <ArrowRight size={18} />}
      </button>

      {/* Clear All */}
      {hasItems && (
        <div className="mt-4 pt-4 border-t border-gray-700 flex justify-center">
          <button
            onClick={clearAll}
            className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-red-400 transition-colors inline-flex items-center gap-2"
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

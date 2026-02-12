import { GitCompare, ArrowRight } from 'lucide-react';
import { useSlicerComparison } from '@/contexts/SlicerComparisonContext';
import { SlicerLogo } from './SlicerLogoFallback';

export function ComparisonBuilderMobile() {
  const { selectedSlicers, openComparison } = useSlicerComparison();

  if (selectedSlicers.length === 0) {
    return null;
  }

  const canCompare = selectedSlicers.length >= 2;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[60px] px-5 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.3)] lg:hidden flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="w-8 h-8 flex items-center justify-center bg-primary/15 rounded-md flex-shrink-0">
          <GitCompare size={18} className="text-primary" />
        </div>
        
        <span className="text-sm font-semibold text-foreground whitespace-nowrap">
          Comparing ({selectedSlicers.length})
        </span>
        
        <div className="flex -space-x-2 ml-1">
          {selectedSlicers.slice(0, 3).map(slicer => (
            <SlicerLogo
              key={slicer.id}
              src={slicer.logo}
              name={slicer.name}
              className="w-7 h-7 rounded-full border-2 border-background"
            />
          ))}
          {selectedSlicers.length > 3 && (
            <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[11px] font-bold text-primary">
              +{selectedSlicers.length - 3}
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={openComparison}
        disabled={!canCompare}
        className="h-10 px-5 bg-primary rounded-lg text-sm font-bold text-primary-foreground inline-flex items-center gap-1.5 flex-shrink-0 active:scale-[0.97] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>Compare</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

import { X, GitCompare } from 'lucide-react';
import { useSlicerComparison } from '@/contexts/SlicerComparisonContext';
import { SlicerLogo } from './SlicerLogoFallback';
import { cn } from '@/lib/utils';

export function SlicerComparisonTray() {
  const {
    selectedSlicers,
    removeSlicer,
    openComparison,
    maxSlicers,
  } = useSlicerComparison();

  if (selectedSlicers.length === 0) return null;

  const canCompare = selectedSlicers.length >= 2;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-cyan-500/30 px-6 py-3 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Left: selected slicer avatars */}
        <div className="flex items-center gap-2">
          {selectedSlicers.map((slicer) => (
            <div key={slicer.id} className="relative group">
              <SlicerLogo
                src={slicer.logo}
                name={slicer.name}
                className="w-9 h-9 rounded-lg"
              />
              <button
                onClick={() => removeSlicer(slicer.id)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 hover:border-red-500"
                aria-label={`Remove ${slicer.name}`}
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>

        {/* Center: count */}
        <span className="text-sm text-slate-400">
          {selectedSlicers.length} of {maxSlicers} selected
        </span>

        {/* Right: Compare button */}
        <button
          onClick={() => canCompare && openComparison()}
          disabled={!canCompare}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-all",
            canCompare
              ? "bg-cyan-500 hover:bg-cyan-600 text-black"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          )}
        >
          <GitCompare className="w-4 h-4" />
          Compare Now
        </button>
      </div>
    </div>
  );
}

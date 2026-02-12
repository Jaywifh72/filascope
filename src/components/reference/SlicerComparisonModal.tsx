import { useEffect } from 'react';
import { X, Star, Check, ExternalLink } from 'lucide-react';
import { SlicerLogo } from './SlicerLogoFallback';
import { useSlicerComparison, SelectedSlicer } from '@/contexts/SlicerComparisonContext';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const priceTypeColors = {
  free: 'text-green-500',
  freemium: 'text-orange-400',
  paid: 'text-pink-400',
};

export function SlicerComparisonModal() {
  const { selectedSlicers, isComparisonOpen, closeComparison } = useSlicerComparison();

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isComparisonOpen) {
        closeComparison();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isComparisonOpen, closeComparison]);

  if (selectedSlicers.length < 2) return null;

  const comparisonRows = [
    { label: 'Price', key: 'price' },
    { label: 'Platform', key: 'platforms' },
    { label: 'Multi-Material', key: 'multiMaterial' },
    { label: 'Overall Score', key: 'overallScore' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 9.0) return 'text-green-500';
    if (score >= 7.0) return 'text-primary';
    return 'text-yellow-500';
  };

  const renderValue = (slicer: SelectedSlicer, key: string) => {
    switch (key) {
      case 'price':
        const priceText = slicer.priceType === 'paid' && slicer.priceValue 
          ? slicer.priceValue 
          : slicer.priceType.charAt(0).toUpperCase() + slicer.priceType.slice(1);
        return (
          <span className={priceTypeColors[slicer.priceType]}>
            {priceText}
          </span>
        );
      case 'platforms':
        return slicer.platforms.join(', ');
      case 'multiMaterial':
        return slicer.multiMaterial ? (
          <Check size={18} className="text-green-500" />
        ) : (
          <span className="text-muted-foreground">–</span>
        );
      case 'overallScore':
        return (
          <span className={cn('inline-flex items-center gap-1 font-bold', getScoreColor(slicer.overallScore))}>
            {slicer.overallScore}/10
            <Star size={14} fill="currentColor" />
          </span>
        );
      default:
        return '–';
    }
  };

  // Find max features count for consistent display
  const maxFeatures = Math.max(...selectedSlicers.map(s => s.topFeatures.length));

  return (
    <Dialog open={isComparisonOpen} onOpenChange={(open) => !open && closeComparison()}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-foreground">
            Comparing: {selectedSlicers.map(s => s.name).join(' vs ')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Slicer Column Headers */}
          <div 
            className="grid gap-4 mb-6"
            style={{ gridTemplateColumns: `repeat(${selectedSlicers.length}, 1fr)` }}
          >
            {selectedSlicers.map(slicer => (
              <div
                key={slicer.id}
                className="flex flex-col items-center gap-3 p-5 bg-primary/5 border border-primary/20 rounded-xl text-center"
              >
                <SlicerLogo src={slicer.logo} name={slicer.name} className="w-16 h-16 rounded-lg p-2" />
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {slicer.brand}
                </div>
                <div className="text-lg font-bold text-foreground">
                  {slicer.name}
                </div>
                <div className={cn('text-sm font-semibold', priceTypeColors[slicer.priceType])}>
                  {slicer.priceType === 'paid' && slicer.priceValue 
                    ? slicer.priceValue 
                    : slicer.priceType.charAt(0).toUpperCase() + slicer.priceType.slice(1)}
                </div>
                <div className={cn('text-base font-bold inline-flex items-center gap-1', getScoreColor(slicer.overallScore))}>
                  {slicer.overallScore}/10
                  <Star size={14} fill="currentColor" />
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            {/* Basic Info Rows */}
            {comparisonRows.map((row, rowIndex) => (
              <div
                key={row.key}
                className={cn(
                  "grid items-center",
                  rowIndex % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'
                )}
                style={{ gridTemplateColumns: `200px repeat(${selectedSlicers.length}, 1fr)` }}
              >
                <div className="p-3 text-sm font-semibold text-muted-foreground border-r border-border">
                  {row.label}
                </div>
                {selectedSlicers.map(slicer => (
                  <div
                    key={slicer.id}
                    className="p-3 text-sm font-medium text-foreground text-center flex items-center justify-center"
                  >
                    {renderValue(slicer, row.key)}
                  </div>
                ))}
              </div>
            ))}

            {/* Features Rows */}
            {Array.from({ length: maxFeatures }).map((_, featureIndex) => (
              <div
                key={`feature-${featureIndex}`}
                className={cn(
                  "grid items-center",
                  (comparisonRows.length + featureIndex) % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'
                )}
                style={{ gridTemplateColumns: `200px repeat(${selectedSlicers.length}, 1fr)` }}
              >
                <div className="p-3 text-sm font-semibold text-muted-foreground border-r border-border">
                  {featureIndex === 0 ? 'Top Features' : ''}
                </div>
                {selectedSlicers.map(slicer => (
                  <div
                    key={slicer.id}
                    className="p-3 text-sm font-medium text-foreground text-center"
                  >
                    {slicer.topFeatures[featureIndex] ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Check size={14} className="text-green-500" />
                        {slicer.topFeatures[featureIndex]}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">–</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* View Details Buttons */}
          <div 
            className="grid gap-4 mt-6"
            style={{ gridTemplateColumns: `repeat(${selectedSlicers.length}, 1fr)` }}
          >
            {selectedSlicers.map(slicer => (
              <button
                key={slicer.id}
                onClick={() => {
                  const element = document.getElementById(`slicer-${slicer.id}`);
                  if (element) {
                    closeComparison();
                    setTimeout(() => {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }
                }}
                className="h-11 px-6 bg-primary/10 border border-primary/30 rounded-lg text-sm font-semibold text-primary hover:bg-primary/15 hover:border-primary/50 transition-all inline-flex items-center justify-center gap-2"
              >
                View {slicer.name} Details
                <ExternalLink size={14} />
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

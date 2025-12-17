import { ArrowRight, Check, X, Star } from 'lucide-react';
import { SlicerTierInfo, PriceType } from '@/lib/slicerTierData';
import { cn } from '@/lib/utils';

interface SlicerSimplifiedTableProps {
  slicers: SlicerTierInfo[];
  logos: Record<string, string>;
  onViewDetails: (name: string) => void;
}

const priceTypeConfig: Record<PriceType, string> = {
  free: 'bg-green-500/15 border-green-500/30 text-green-500',
  freemium: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
  paid: 'bg-pink-500/15 border-pink-500/30 text-pink-400',
};

export function SlicerSimplifiedTable({ slicers, logos, onViewDetails }: SlicerSimplifiedTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-3 bg-muted/50 border-b border-border text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Name
            </th>
            <th className="px-4 py-3 bg-muted/50 border-b border-border text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Price
            </th>
            <th className="px-4 py-3 bg-muted/50 border-b border-border text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Platform
            </th>
            <th className="px-4 py-3 bg-muted/50 border-b border-border text-center text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Multi-Material
            </th>
            <th className="px-4 py-3 bg-muted/50 border-b border-border text-center text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Score
            </th>
            <th className="px-4 py-3 bg-muted/50 border-b border-border text-center text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {slicers.map((slicer) => {
            const scoreColor = slicer.overallScore >= 9.0 
              ? 'text-green-500' 
              : slicer.overallScore >= 7.0 
                ? 'text-primary' 
                : 'text-yellow-500';

            return (
              <tr 
                key={slicer.name}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted/30 rounded p-1 flex items-center justify-center flex-shrink-0">
                      {logos[slicer.name] ? (
                        <img 
                          src={logos[slicer.name]} 
                          alt={`${slicer.name} logo`} 
                          className="max-w-full max-h-full object-contain" 
                        />
                      ) : (
                        <div className="w-5 h-5 bg-primary/20 rounded" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">{slicer.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 border-b border-border/50">
                  <span className={cn(
                    'inline-flex px-2 py-1 rounded text-xs font-semibold border',
                    priceTypeConfig[slicer.priceType]
                  )}>
                    {slicer.priceType === 'paid' && slicer.priceValue 
                      ? slicer.priceValue 
                      : slicer.priceType.charAt(0).toUpperCase() + slicer.priceType.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 border-b border-border/50 text-sm text-muted-foreground">
                  {slicer.platforms.join(', ')}
                </td>
                <td className="px-4 py-3 border-b border-border/50 text-center">
                  {slicer.multiMaterial ? (
                    <Check size={18} className="text-green-500 mx-auto" />
                  ) : (
                    <X size={18} className="text-muted-foreground/50 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 border-b border-border/50 text-center">
                  <span className={cn('inline-flex items-center gap-1 text-sm font-semibold', scoreColor)}>
                    {slicer.overallScore}/10
                    <Star size={12} fill="currentColor" />
                  </span>
                </td>
                <td className="px-4 py-3 border-b border-border/50 text-center">
                  <button
                    onClick={() => onViewDetails(slicer.name)}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors"
                    title={`View ${slicer.name} details`}
                  >
                    <ArrowRight size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

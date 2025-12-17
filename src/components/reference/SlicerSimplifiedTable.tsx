import { useState, useMemo } from 'react';
import { ArrowRight, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import { SlicerTierInfo, PriceType } from '@/lib/slicerTierData';
import { cn } from '@/lib/utils';
import { ExpandableScoreCell } from './ExpandableScoreCell';
import { getSlicerSubscores, getScoreColor } from '@/lib/slicerScoreUtils';

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

type SortDirection = 'asc' | 'desc' | null;

export function SlicerSimplifiedTable({ slicers, logos, onViewDetails }: SlicerSimplifiedTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const toggleExpanded = (name: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const toggleSort = () => {
    setSortDirection(prev => {
      if (prev === 'desc') return 'asc';
      if (prev === 'asc') return null;
      return 'desc';
    });
  };

  const sortedSlicers = useMemo(() => {
    if (!sortDirection) return slicers;
    return [...slicers].sort((a, b) => {
      const diff = a.overallScore - b.overallScore;
      return sortDirection === 'desc' ? -diff : diff;
    });
  }, [slicers, sortDirection]);

  const getSortAriaLabel = () => {
    if (!sortDirection) return 'Overall Score. Sortable column. Press Enter to sort descending.';
    return `Overall Score. Sortable column. Currently sorted ${sortDirection === 'desc' ? 'descending' : 'ascending'}. Press Enter to ${sortDirection === 'desc' ? 'sort ascending' : 'clear sort'}.`;
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse" role="table">
        <thead>
          <tr role="row">
            <th role="columnheader" className="px-4 py-3 bg-muted/50 border-b border-border text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Name
            </th>
            <th 
              role="columnheader"
              aria-sort={sortDirection === 'desc' ? 'descending' : sortDirection === 'asc' ? 'ascending' : 'none'}
              aria-label={getSortAriaLabel()}
              className="px-4 py-3 bg-muted/50 border-b border-border text-center text-[13px] font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:bg-muted/70 transition-colors select-none"
              onClick={toggleSort}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSort();
                }
              }}
              tabIndex={0}
            >
              <div className="flex items-center justify-center gap-1">
                <span>Score</span>
                <div className="flex flex-col -space-y-1">
                  <ChevronUp 
                    size={12} 
                    className={cn(
                      'transition-colors',
                      sortDirection === 'asc' ? 'text-primary' : 'text-muted-foreground/40'
                    )} 
                  />
                  <ChevronDown 
                    size={12} 
                    className={cn(
                      'transition-colors',
                      sortDirection === 'desc' ? 'text-primary' : 'text-muted-foreground/40'
                    )} 
                  />
                </div>
              </div>
            </th>
            <th role="columnheader" className="px-4 py-3 bg-muted/50 border-b border-border text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Price
            </th>
            <th role="columnheader" className="px-4 py-3 bg-muted/50 border-b border-border text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Platform
            </th>
            <th role="columnheader" className="px-4 py-3 bg-muted/50 border-b border-border text-center text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Multi-Material
            </th>
            <th role="columnheader" className="px-4 py-3 bg-muted/50 border-b border-border text-center text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSlicers.map((slicer) => {
            const subscores = getSlicerSubscores(slicer.name);
            const isExpanded = expandedRows.has(slicer.name);

            return (
              <tr 
                key={slicer.name}
                role="row"
                className="hover:bg-muted/30 transition-colors"
              >
                <td role="cell" className="px-4 py-3 border-b border-border/50">
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
                <td role="cell" className="px-4 py-3 border-b border-border/50 text-center relative">
                  <ExpandableScoreCell
                    slicerName={slicer.name}
                    overallScore={slicer.overallScore}
                    subscores={subscores}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpanded(slicer.name)}
                  />
                </td>
                <td role="cell" className="px-4 py-3 border-b border-border/50">
                  <span className={cn(
                    'inline-flex px-2 py-1 rounded text-xs font-semibold border',
                    priceTypeConfig[slicer.priceType]
                  )}>
                    {slicer.priceType === 'paid' && slicer.priceValue 
                      ? slicer.priceValue 
                      : slicer.priceType.charAt(0).toUpperCase() + slicer.priceType.slice(1)}
                  </span>
                </td>
                <td role="cell" className="px-4 py-3 border-b border-border/50 text-sm text-muted-foreground">
                  {slicer.platforms.join(', ')}
                </td>
                <td role="cell" className="px-4 py-3 border-b border-border/50 text-center">
                  {slicer.multiMaterial ? (
                    <Check size={18} className="text-green-500 mx-auto" />
                  ) : (
                    <X size={18} className="text-muted-foreground/50 mx-auto" />
                  )}
                </td>
                <td role="cell" className="px-4 py-3 border-b border-border/50 text-center">
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

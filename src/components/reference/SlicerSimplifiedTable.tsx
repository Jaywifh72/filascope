import { useState, useMemo } from 'react';
import { ArrowRight, Check, X, ChevronUp, ChevronDown, ChevronsUpDown, HelpCircle } from 'lucide-react';
import { SlicerTierInfo, PriceType } from '@/lib/slicerTierData';
import { cn } from '@/lib/utils';
import { ExpandableScoreCell } from './ExpandableScoreCell';
import { ScoreBreakdownRow } from './ScoreBreakdownRow';
import { getSlicerSubscores, calculateOverallScore } from '@/lib/slicerScoreUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

type SortColumn = 'name' | 'overall' | 'price' | 'platform' | 'multiMaterial' | null;
type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

const COLUMN_COUNT = 6;

// Tooltip content for each column
const COLUMN_TOOLTIPS: Record<string, string> = {
  name: "The name of the slicing software. Click to sort alphabetically.",
  overall: "Weighted average: Ease of Use (30%), Feature Set (25%), Performance (20%), Support Quality (15%), UI Polish (10%). Click to sort by score.",
  price: "Free = No cost, Freemium = Free with paid upgrades, Paid = Purchase required. Click to sort by price tier.",
  platform: "Operating systems supported: Windows, Mac, Linux, and Web. Click to sort by platform count.",
  multiMaterial: "Indicates whether the slicer supports multi-material printing (multiple filaments/colors in one print). Click to sort.",
  details: "Click arrow to view full details page for this slicer."
};

// Sort icon component
const SortIcon = ({ column, sortState }: { column: SortColumn; sortState: SortState }) => {
  const isActive = sortState.column === column;
  
  if (!isActive) {
    return <ChevronsUpDown size={14} className="text-muted-foreground/40" />;
  }
  
  return (
    <div className="flex flex-col -space-y-1">
      <ChevronUp 
        size={12} 
        className={cn(
          'transition-colors',
          sortState.direction === 'asc' ? 'text-primary' : 'text-muted-foreground/40'
        )} 
      />
      <ChevronDown 
        size={12} 
        className={cn(
          'transition-colors',
          sortState.direction === 'desc' ? 'text-primary' : 'text-muted-foreground/40'
        )} 
      />
    </div>
  );
};

// Sortable header component
interface SortableHeaderProps {
  label: string;
  column: SortColumn;
  tooltip: string;
  sortState: SortState;
  onSort: (column: SortColumn) => void;
  center?: boolean;
}

const SortableHeader = ({ label, column, tooltip, sortState, onSort, center = false }: SortableHeaderProps) => {
  const isActive = sortState.column === column;
  
  const getAriaSort = () => {
    if (!isActive || !sortState.direction) return 'none';
    return sortState.direction === 'desc' ? 'descending' : 'ascending';
  };
  
  const getAriaLabel = () => {
    if (!isActive || !sortState.direction) {
      return `${label}. Sortable column. Press Enter to sort descending.`;
    }
    return `${label}. Sortable column. Currently sorted ${sortState.direction === 'desc' ? 'descending' : 'ascending'}. Press Enter to ${sortState.direction === 'desc' ? 'sort ascending' : 'clear sort'}.`;
  };

  return (
    <th 
      role="columnheader"
      aria-sort={getAriaSort()}
      aria-label={getAriaLabel()}
      className={cn(
        'px-4 py-3 bg-slate-800/50 border-b border-slate-700',
        'text-xs font-semibold uppercase tracking-wider',
        'cursor-pointer hover:bg-muted/50 transition-colors select-none',
        center ? 'text-center' : 'text-left',
        isActive ? 'text-primary' : 'text-slate-400'
      )}
      onClick={() => onSort(column)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSort(column);
        }
      }}
      tabIndex={0}
    >
      <div className={cn('flex items-center gap-1.5', center && 'justify-center')}>
        <span>{label}</span>
        <SortIcon column={column} sortState={sortState} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-primary ml-0.5"
                aria-label={`${label} info`}
              >
                <HelpCircle size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </th>
  );
};

export function SlicerSimplifiedTable({ slicers, logos, onViewDetails }: SlicerSimplifiedTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortState, setSortState] = useState<SortState>({ 
    column: 'overall', 
    direction: 'desc' 
  });

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

  const handleSort = (column: SortColumn) => {
    setSortState(prev => {
      // If clicking same column, toggle direction
      if (prev.column === column) {
        if (prev.direction === 'desc') return { column, direction: 'asc' };
        if (prev.direction === 'asc') return { column: null, direction: null };
      }
      // New column, start with descending
      return { column, direction: 'desc' };
    });
  };

  // Calculate overall scores
  const slicersWithScores = useMemo(() => {
    return slicers.map(slicer => {
      const subscores = getSlicerSubscores(slicer.name);
      const calculatedScore = calculateOverallScore(subscores);
      return {
        ...slicer,
        subscores,
        calculatedScore,
      };
    });
  }, [slicers]);

  // Sort slicers based on current sort state
  const sortedSlicers = useMemo(() => {
    if (!sortState.column || !sortState.direction) return slicersWithScores;
    
    return [...slicersWithScores].sort((a, b) => {
      let comparison = 0;
      
      switch (sortState.column) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'overall':
          comparison = a.calculatedScore - b.calculatedScore;
          break;
        case 'price':
          const priceOrder: Record<PriceType, number> = { free: 0, freemium: 1, paid: 2 };
          comparison = priceOrder[a.priceType] - priceOrder[b.priceType];
          break;
        case 'platform':
          comparison = a.platforms.length - b.platforms.length;
          break;
        case 'multiMaterial':
          comparison = (a.multiMaterial ? 1 : 0) - (b.multiMaterial ? 1 : 0);
          break;
        default:
          return 0;
      }
      
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [slicersWithScores, sortState]);

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse" role="table">
        <thead className="sticky top-0 z-10">
          <tr role="row" className="bg-slate-800/50 border-b border-slate-700 shadow-sm">
            <SortableHeader
              label="Name"
              column="name"
              tooltip={COLUMN_TOOLTIPS.name}
              sortState={sortState}
              onSort={handleSort}
            />
            <SortableHeader
              label="Overall Score"
              column="overall"
              tooltip={COLUMN_TOOLTIPS.overall}
              sortState={sortState}
              onSort={handleSort}
              center
            />
            <SortableHeader
              label="Price"
              column="price"
              tooltip={COLUMN_TOOLTIPS.price}
              sortState={sortState}
              onSort={handleSort}
            />
            <SortableHeader
              label="Platform"
              column="platform"
              tooltip={COLUMN_TOOLTIPS.platform}
              sortState={sortState}
              onSort={handleSort}
            />
            <SortableHeader
              label="Multi-Material"
              column="multiMaterial"
              tooltip={COLUMN_TOOLTIPS.multiMaterial}
              sortState={sortState}
              onSort={handleSort}
              center
            />
            {/* Details column - not sortable */}
            <th 
              role="columnheader" 
              className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>Details</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="text-muted-foreground hover:text-primary ml-0.5"
                        aria-label="Details info"
                      >
                        <HelpCircle size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-xs">{COLUMN_TOOLTIPS.details}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSlicers.map((slicer, index) => {
            const isExpanded = expandedRows.has(slicer.name);

            return (
              <>
                <tr 
                  key={slicer.name}
                  role="row"
                  className={cn(
                    'hover:bg-cyan-500/5 transition-colors duration-200 cursor-pointer',
                    index % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'
                  )}
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
                  <td role="cell" className="px-4 py-3 border-b border-border/50">
                    <ExpandableScoreCell
                      slicerName={slicer.name}
                      overallScore={slicer.calculatedScore}
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
                <ScoreBreakdownRow
                  key={`${slicer.name}-breakdown`}
                  slicerName={slicer.name}
                  overallScore={slicer.calculatedScore}
                  subscores={slicer.subscores}
                  isExpanded={isExpanded}
                  onCollapse={() => toggleExpanded(slicer.name)}
                  columnCount={COLUMN_COUNT}
                />
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

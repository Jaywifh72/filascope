import { useState } from "react";
import { ChevronDown, ChevronUp, X, Zap, ExternalLink, Info, Sparkles, Palette, Server, Ruler, Box, Database, Wifi, Wrench, List, LayoutGrid } from "lucide-react";
import { categoryLabels, pricingLabels, SpecialtyTool } from "@/lib/specialtyData";
import { numericToRating, specialtyMetricTooltips } from "@/lib/platformData";
import { useSpecialtyFilters } from "@/contexts/SpecialtyFilterContext";
import RatingValue from "@/components/reference/repos/shared/RatingValue";
import RatingScaleLegend from "@/components/reference/repos/shared/RatingScaleLegend";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortField = 'name' | 'category' | 'easeOfUse' | 'featureDepth' | 'valueForMoney' | 'communitySupport' | 'printFocus' | 'pricingModel';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'simplified' | 'detailed';

const getCategoryIcon = (category: SpecialtyTool['category']) => {
  switch (category) {
    case 'ai-generation': return <Sparkles className="h-4 w-4" />;
    case 'filament-art': return <Palette className="h-4 w-4" />;
    case 'farm-management': return <Server className="h-4 w-4" />;
    case 'calibration': return <Ruler className="h-4 w-4" />;
    case 'cad': return <Box className="h-4 w-4" />;
    case 'repository': return <Database className="h-4 w-4" />;
    case 'remote-control': return <Wifi className="h-4 w-4" />;
    case 'mesh-tools': return <Wrench className="h-4 w-4" />;
    default: return null;
  }
};

const getPricingBadgeColor = (pricing: SpecialtyTool['pricingModel']) => {
  switch (pricing) {
    case 'free': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'freemium': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'one-time': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'subscription': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default: return '';
  }
};

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
  tooltip?: string;
  className?: string;
}

const SortableHeader = ({ label, field, currentSort, currentDirection, onSort, tooltip, className }: SortableHeaderProps) => (
  <TableHead 
    className={cn("cursor-pointer hover:bg-muted/50 transition-colors select-none", className)}
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">
      <span>{label}</span>
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <span className={cn("ml-0.5 transition-opacity", currentSort === field ? "opacity-100" : "opacity-0")}>
        {currentDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </span>
    </div>
  </TableHead>
);

interface SpecialtyComparisonTableProps {
  onLearnMore?: (toolId: string) => void;
}

export default function SpecialtyComparisonTable({ onLearnMore }: SpecialtyComparisonTableProps) {
  const { filteredTools, totalCount, hasActiveFilters, clearFilters } = useSpecialtyFilters();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('simplified');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to desc for ratings (higher is better)
    }
  };

  const sortedTools = [...filteredTools].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortField) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'category':
        aVal = categoryLabels[a.category];
        bVal = categoryLabels[b.category];
        break;
      case 'pricingModel':
        const pricingOrder = { free: 0, freemium: 1, 'one-time': 2, subscription: 3 };
        aVal = pricingOrder[a.pricingModel];
        bVal = pricingOrder[b.pricingModel];
        break;
      case 'easeOfUse':
        aVal = a.ratings.easeOfUse;
        bVal = b.ratings.easeOfUse;
        break;
      case 'featureDepth':
        aVal = a.ratings.featureDepth;
        bVal = b.ratings.featureDepth;
        break;
      case 'valueForMoney':
        aVal = a.ratings.valueForMoney;
        bVal = b.ratings.valueForMoney;
        break;
      case 'communitySupport':
        aVal = a.ratings.communitySupport;
        bVal = b.ratings.communitySupport;
        break;
      case 'printFocus':
        aVal = a.ratings.printFocus;
        bVal = b.ratings.printFocus;
        break;
      default:
        return 0;
    }

    if (typeof aVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal);
    }
    return sortDirection === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
  });

  return (
    <div id="specialty-comparison-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Full Comparison</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Compare all {totalCount} tools across rating categories
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
          
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-800 rounded-lg">
            <button
              onClick={() => setViewMode('simplified')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                viewMode === 'simplified' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Simplified
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                viewMode === 'detailed' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Rating Scale Legend */}
      <div className="mb-6">
        <RatingScaleLegend />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border/30">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800/50">
              <TableHead className="w-12 font-semibold">#</TableHead>
              <SortableHeader label="Tool" field="name" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} className="min-w-[140px]" />
              <SortableHeader label="Category" field="category" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
              <SortableHeader 
                label="Ease of Use" 
                field="easeOfUse" 
                currentSort={sortField} 
                currentDirection={sortDirection} 
                onSort={handleSort}
                tooltip={specialtyMetricTooltips.easeOfUse}
              />
              <SortableHeader 
                label="Features" 
                field="featureDepth" 
                currentSort={sortField} 
                currentDirection={sortDirection} 
                onSort={handleSort}
                tooltip={specialtyMetricTooltips.featureDepth}
              />
              <SortableHeader 
                label="Value" 
                field="valueForMoney" 
                currentSort={sortField} 
                currentDirection={sortDirection} 
                onSort={handleSort}
                tooltip={specialtyMetricTooltips.valueForMoney}
              />
              <SortableHeader label="Pricing" field="pricingModel" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
              <TableHead className="min-w-[160px]">Best For</TableHead>
              
              {/* Detailed view columns */}
              {viewMode === 'detailed' && (
                <>
                  <SortableHeader 
                    label="Community" 
                    field="communitySupport" 
                    currentSort={sortField} 
                    currentDirection={sortDirection} 
                    onSort={handleSort}
                    tooltip={specialtyMetricTooltips.communitySupport}
                  />
                  <SortableHeader 
                    label="Print Focus" 
                    field="printFocus" 
                    currentSort={sortField} 
                    currentDirection={sortDirection} 
                    onSort={handleSort}
                    tooltip={specialtyMetricTooltips.printFocus}
                  />
                  <TableHead>
                    <div className="flex items-center gap-1.5 text-warning">
                      <Zap className="h-4 w-4" />
                      <span>Standout</span>
                    </div>
                  </TableHead>
                </>
              )}
              
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTools.map((tool, index) => (
              <TableRow 
                key={tool.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    {tool.name}
                    {tool.tier === 'featured' && (
                      <span className="text-amber-400 text-sm">⭐</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="flex items-center gap-1.5 w-fit text-xs">
                    {getCategoryIcon(tool.category)}
                    <span className="hidden sm:inline">{categoryLabels[tool.category]}</span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <RatingValue rating={numericToRating(tool.ratings.easeOfUse)} size="small" />
                </TableCell>
                <TableCell>
                  <RatingValue rating={numericToRating(tool.ratings.featureDepth)} size="small" />
                </TableCell>
                <TableCell>
                  <RatingValue rating={numericToRating(tool.ratings.valueForMoney)} size="small" />
                </TableCell>
                <TableCell>
                  <Badge className={cn("border text-xs font-medium", getPricingBadgeColor(tool.pricingModel))}>
                    {pricingLabels[tool.pricingModel]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {tool.bestFor.slice(0, 2).join(', ')}
                  </span>
                </TableCell>
                
                {/* Detailed view cells */}
                {viewMode === 'detailed' && (
                  <>
                    <TableCell>
                      <RatingValue rating={numericToRating(tool.ratings.communitySupport)} size="small" />
                    </TableCell>
                    <TableCell>
                      <RatingValue rating={numericToRating(tool.ratings.printFocus)} size="small" />
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-warning/10 border border-warning/30 cursor-help">
                              <Zap className="h-3 w-3 text-warning flex-shrink-0" />
                              <span className="text-[11px] font-medium text-warning truncate max-w-[140px]">
                                {tool.standoutFeature.title}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">{tool.standoutFeature.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </>
                )}
                
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    {onLearnMore && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLearnMore(tool.id)}
                        className="h-7 px-2 text-xs text-primary hover:text-primary"
                      >
                        Learn More
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-7 px-2 text-xs"
                    >
                      <a 
                        href={tool.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        Visit
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Results count */}
      <div className="mt-4 text-sm text-muted-foreground text-right">
        Showing {sortedTools.length} of {totalCount} tools
      </div>
    </div>
  );
}

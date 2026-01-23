import { useState } from "react";
import { ChevronDown, ChevronUp, X, Zap, ExternalLink, Info, Sparkles, Palette, Server, Ruler, Box, Database, Wifi, Wrench } from "lucide-react";
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

type SortField = 'name' | 'easeOfUse' | 'featureDepth' | 'valueForMoney' | 'communitySupport' | 'printFocus';
type SortDirection = 'asc' | 'desc';

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

interface MetricHeaderProps {
  label: string;
  field: SortField;
  metricKey: string;
  currentSort: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const MetricHeader = ({ label, field, metricKey, currentSort, currentDirection, onSort }: MetricHeaderProps) => (
  <TableHead 
    className="cursor-pointer hover:bg-muted/50 transition-colors"
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">
      <span>{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{specialtyMetricTooltips[metricKey]}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {currentSort === field && (
        currentDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      )}
    </div>
  </TableHead>
);

const SortHeader = ({ 
  label, 
  field, 
  currentSort, 
  currentDirection, 
  onSort 
}: { 
  label: string; 
  field: SortField; 
  currentSort: SortField; 
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
}) => (
  <TableHead 
    className="cursor-pointer hover:bg-muted/50 transition-colors"
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">
      {label}
      {currentSort === field && (
        currentDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      )}
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Full Comparison</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Compare all {totalCount} tools across all rating categories
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Showing {sortedTools.length} of {totalCount} tools
          </span>
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
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <SortHeader label="Tool" field="name" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
              <TableHead>Category</TableHead>
              <TableHead>
                <div className="flex items-center gap-1.5 text-warning">
                  <Zap className="h-4 w-4" />
                  <span>Standout Feature</span>
                </div>
              </TableHead>
              <TableHead>Pricing</TableHead>
              <MetricHeader label="Ease of Use" field="easeOfUse" metricKey="easeOfUse" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
              <MetricHeader label="Features" field="featureDepth" metricKey="featureDepth" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
              <MetricHeader label="Value" field="valueForMoney" metricKey="valueForMoney" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
              <MetricHeader label="Community" field="communitySupport" metricKey="communitySupport" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
              <MetricHeader label="Print Focus" field="printFocus" metricKey="printFocus" currentSort={sortField} currentDirection={sortDirection} onSort={handleSort} />
              <TableHead>Actions</TableHead>
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
                      <span className="text-amber-400">⭐</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    {getCategoryIcon(tool.category)}
                    {categoryLabels[tool.category]}
                  </Badge>
                </TableCell>
                <TableCell className="min-w-[180px] max-w-[240px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-warning/10 border border-warning/30 cursor-help max-w-full">
                          <Zap className="h-3 w-3 text-warning flex-shrink-0" />
                          <span className="text-[11px] font-semibold text-warning truncate">
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
                <TableCell>
                  <Badge variant="outline">{pricingLabels[tool.pricingModel]}</Badge>
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
                  <RatingValue rating={numericToRating(tool.ratings.communitySupport)} size="small" />
                </TableCell>
                <TableCell>
                  <RatingValue rating={numericToRating(tool.ratings.printFocus)} size="small" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {onLearnMore && (
                      <button
                        onClick={() => onLearnMore(tool.id)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Learn More
                      </button>
                    )}
                    <a 
                      href={tool.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

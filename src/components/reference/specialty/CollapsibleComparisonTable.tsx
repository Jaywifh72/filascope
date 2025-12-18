import { useState } from "react";
import { ChevronDown, Table as TableIcon, X, Zap } from "lucide-react";
import { specialtyTools, categoryLabels, pricingLabels, SpecialtyTool } from "@/lib/specialtyData";
import { numericToRating, specialtyMetricTooltips } from "@/lib/platformData";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronUp, ExternalLink, Info, Sparkles, Palette, Server, Ruler, Box, Database, Wifi, Wrench } from "lucide-react";

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

export default function CollapsibleComparisonTable() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pricingFilter, setPricingFilter] = useState<string>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setCategoryFilter('all');
    setPricingFilter('all');
  };

  const hasActiveFilters = categoryFilter !== 'all' || pricingFilter !== 'all';

  const filteredAndSortedTools = [...specialtyTools]
    .filter(t => categoryFilter === 'all' || t.category === categoryFilter)
    .filter(t => pricingFilter === 'all' || t.pricingModel === pricingFilter)
    .sort((a, b) => {
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

  const categories = Object.entries(categoryLabels);
  const pricingModels = Object.entries(pricingLabels);

  return (
    <div className="mb-12 border border-border/50 rounded-2xl overflow-hidden">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between px-6 py-4",
          "bg-card/30 hover:bg-card/50 transition-colors",
          "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px]"
        )}
        aria-expanded={isExpanded}
        aria-controls="full-comparison-table"
      >
        <div className="flex items-center gap-3 text-muted-foreground">
          <TableIcon className="h-5 w-5" />
          <span className="text-[15px] font-semibold text-foreground">
            {isExpanded ? 'Hide' : 'View'} Full Comparison Table
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Compare all {specialtyTools.length} tools across all rating categories
          </span>
          <ChevronDown 
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-300",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        id="full-comparison-table"
        className={cn(
          "overflow-hidden transition-all duration-400 ease-out",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-6 border-t border-border/30">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={pricingFilter} onValueChange={setPricingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pricing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pricing</SelectItem>
                {pricingModels.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}

            <span className="text-sm text-muted-foreground ml-auto">
              Showing {filteredAndSortedTools.length} of {specialtyTools.length} tools
            </span>
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
                  <TableHead>Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell className="font-medium">{tool.name}</TableCell>
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
                      <a 
                        href={tool.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

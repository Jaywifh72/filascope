import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Check, X, HelpCircle, Zap, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RatingLevel, metricTooltips } from '@/lib/platformData';
import { getStandoutByName } from '@/lib/standoutFeatures';
import RatingValue from './shared/RatingValue';
import RatingScaleLegend from './shared/RatingScaleLegend';
import StandoutBadge from './shared/StandoutBadge';

interface RepoComparisonItem {
  name: string;
  owner: string;
  model: string;
  free: boolean;
  paid: boolean;
  quality: number;
  community: number;
  monetization: number;
  search: number;
  ux: number;
  mobile: boolean;
  fileTypes: string;
  standout: string;
}

interface ReposComparisonTableProps {
  data: RepoComparisonItem[];
  logos: Record<string, string>;
}

type SortKey = "name" | "owner" | "model" | "quality" | "community" | "monetization" | "search" | "ux";
type SortDir = "asc" | "desc";

const modelOrder = { "Loss-Leader": 0, "Hybrid": 1, "Ad-Supported": 2, "Marketplace": 3, "Premium": 4, "Search + Sub": 5, "Mobile Sub": 6, "Lead Gen": 7 };
const businessModels = ["All", "Loss-Leader", "Hybrid", "Ad-Supported", "Marketplace", "Premium", "Search + Sub", "Mobile Sub", "Lead Gen"];
const fileFormats = ["All", "STL", "3MF", "OBJ", "G-code", "CAD/STEP"];

const mapNumberToSemantic = (num: number): RatingLevel => {
  if (num >= 5) return 'excellent';
  if (num >= 4) return 'great';
  if (num >= 3) return 'good';
  if (num >= 2) return 'average';
  return 'limited';
};

const BoolBadge = ({ value }: { value: boolean }) => {
  return value ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-muted-foreground" />;
};

interface SortHeaderProps {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey | null;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  center?: boolean;
  tooltip?: string;
}

const SortHeader: React.FC<SortHeaderProps> = ({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  center = false,
  tooltip,
}) => {
  const isActive = currentSort === sortKey;
  return (
    <th
      className={`py-3 px-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors select-none ${center ? "text-center" : "text-left"}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${center ? "justify-center" : ""}`}>
        <span>{label}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                <HelpCircle className="w-3 h-3 text-muted-foreground/60 hover:text-primary cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {isActive ? (
          currentDir === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 text-muted-foreground/50" />
        )}
      </div>
    </th>
  );
};

const ReposComparisonTable: React.FC<ReposComparisonTableProps> = ({ data, logos }) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [modelFilter, setModelFilter] = useState<string>("All");
  const [formatFilter, setFormatFilter] = useState<string>("All");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filteredAndSortedRepos = useMemo(() => {
    let result = [...data];

    if (modelFilter !== "All") {
      result = result.filter(repo => repo.model === modelFilter);
    }

    if (formatFilter !== "All") {
      result = result.filter(repo => {
        const fileTypes = repo.fileTypes.toLowerCase();
        switch (formatFilter) {
          case "STL": return fileTypes.includes("stl");
          case "3MF": return fileTypes.includes("3mf");
          case "OBJ": return fileTypes.includes("obj");
          case "G-code": return fileTypes.includes("g-code") || fileTypes.includes("gcode");
          case "CAD/STEP": return fileTypes.includes("step") || fileTypes.includes("iges") || fileTypes.includes("cad") || fileTypes.includes("30+");
          default: return true;
        }
      });
    }

    if (!sortKey) return result;

    return result.sort((a, b) => {
      let aVal: number | string = a[sortKey];
      let bVal: number | string = b[sortKey];

      if (sortKey === "model") {
        aVal = modelOrder[a.model as keyof typeof modelOrder] ?? 99;
        bVal = modelOrder[b.model as keyof typeof modelOrder] ?? 99;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortKey, sortDir, modelFilter, formatFilter]);

  const clearFilters = () => {
    setModelFilter("All");
    setFormatFilter("All");
  };

  const hasActiveFilters = modelFilter !== "All" || formatFilter !== "All";

  const getModelColor = (model: string) => {
    if (model === "Loss-Leader" || model === "Ad-Supported" || model === "Lead Gen") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
    if (model === "Hybrid" || model === "Search + Sub") {
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
    return "bg-purple-500/10 text-purple-400 border-purple-500/30";
  };

  return (
    <div className="border border-border rounded-xl bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border/50">
        <h2 className="text-xl font-bold text-foreground mb-2">Full Comparison Matrix</h2>
        <p className="text-sm text-muted-foreground mb-4">
          All {data.length} platforms with detailed metrics and ratings
        </p>

        {/* Filter Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filters:</span>
          </div>
          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-background border-border">
              <SelectValue placeholder="Business Model" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              {businessModels.map((model) => (
                <SelectItem key={model} value={model} className="text-xs">
                  {model === "All" ? "All Models" : model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border">
              <SelectValue placeholder="File Format" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              {fileFormats.map((format) => (
                <SelectItem key={format} value={format} className="text-xs">
                  {format === "All" ? "All Formats" : format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground hover:text-foreground">
              Clear filters
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            Showing {filteredAndSortedRepos.length} of {data.length} platforms
          </span>
        </div>

        {/* Rating Legend */}
        <div className="mt-4">
          <RatingScaleLegend />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <SortHeader label="Platform" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <th className="text-left py-3 px-3 font-semibold text-amber-400 bg-amber-500/5">
                <div className="flex items-center gap-1.5">
                  <Zap size={14} />
                  <span>Standout</span>
                </div>
              </th>
              <SortHeader label="Model" sortKey="model" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <th className="text-center py-3 px-3 font-semibold text-foreground">Free</th>
              <th className="text-center py-3 px-3 font-semibold text-foreground">Paid</th>
              <SortHeader label="Quality" sortKey="quality" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.quality} />
              <SortHeader label="Community" sortKey="community" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.community} />
              <SortHeader label="Search" sortKey="search" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.search} />
              <SortHeader label="UX" sortKey="ux" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.ux} />
              <th className="text-center py-3 px-3 font-semibold text-foreground">Mobile</th>
              <th className="text-left py-3 px-3 font-semibold text-foreground">Files</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedRepos.map((repo, index) => (
              <tr
                key={index}
                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
              >
                <td className="py-3 px-3 font-medium text-foreground sticky left-0 bg-card z-10 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {logos[repo.name] && (
                      <img
                        src={logos[repo.name]}
                        alt={`${repo.name} logo`}
                        className="w-5 h-5 rounded object-contain"
                      />
                    )}
                    {repo.name}
                  </div>
                </td>
                <td className="py-3 px-3 bg-amber-500/3">
                  {(() => {
                    const standout = getStandoutByName(repo.name);
                    return standout ? (
                      <StandoutBadge standout={standout} variant="compact" />
                    ) : (
                      <span className="text-amber-400 text-xs">{repo.standout}</span>
                    );
                  })()}
                </td>
                <td className="py-3 px-3">
                  <Badge variant="outline" className={getModelColor(repo.model)}>
                    {repo.model}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-center"><BoolBadge value={repo.free} /></td>
                <td className="py-3 px-3 text-center"><BoolBadge value={repo.paid} /></td>
                <td className="py-3 px-3"><RatingValue rating={mapNumberToSemantic(repo.quality)} size="small" showTooltip tooltipContent={metricTooltips.quality} /></td>
                <td className="py-3 px-3"><RatingValue rating={mapNumberToSemantic(repo.community)} size="small" showTooltip tooltipContent={metricTooltips.community} /></td>
                <td className="py-3 px-3"><RatingValue rating={mapNumberToSemantic(repo.search)} size="small" showTooltip tooltipContent={metricTooltips.search} /></td>
                <td className="py-3 px-3"><RatingValue rating={mapNumberToSemantic(repo.ux)} size="small" showTooltip tooltipContent={metricTooltips.ux} /></td>
                <td className="py-3 px-3 text-center"><BoolBadge value={repo.mobile} /></td>
                <td className="py-3 px-3 text-muted-foreground text-xs">{repo.fileTypes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReposComparisonTable;

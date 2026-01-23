import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Check, X, HelpCircle, ExternalLink, Plus, LayoutList, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RatingLevel, metricTooltips } from '@/lib/platformData';
import RatingValue from './shared/RatingValue';
import RatingScaleLegend from './shared/RatingScaleLegend';
import { cn } from '@/lib/utils';

export interface RepoComparisonItem {
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
  bestFor?: string;
  websiteUrl?: string;
  hasApi?: boolean;
}

interface ReposComparisonTableProps {
  data: RepoComparisonItem[];
  logos: Record<string, string>;
}

type SortKey = "name" | "quality" | "community" | "search" | "ux" | "price";
type SortDir = "asc" | "desc";

const mapNumberToSemantic = (num: number): RatingLevel => {
  if (num >= 5) return 'excellent';
  if (num >= 4) return 'great';
  if (num >= 3) return 'good';
  if (num >= 2) return 'average';
  return 'limited';
};

const getPriceType = (repo: RepoComparisonItem): string => {
  if (repo.free && !repo.paid) return 'Free';
  if (repo.free && repo.paid) return 'Freemium';
  if (!repo.free && repo.paid) return 'Premium';
  return 'Paid';
};

const getPriceBadgeColor = (priceType: string): string => {
  switch (priceType) {
    case 'Free': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'Freemium': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'Premium': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  }
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

interface ViewToggleProps {
  isDetailed: boolean;
  onToggle: (detailed: boolean) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ isDetailed, onToggle }) => (
  <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
    <button
      onClick={() => onToggle(false)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
        !isDetailed
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <LayoutList className="w-3.5 h-3.5" />
      Simplified
    </button>
    <button
      onClick={() => onToggle(true)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
        isDetailed
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <LayoutGrid className="w-3.5 h-3.5" />
      Detailed
    </button>
  </div>
);

const ReposComparisonTable: React.FC<ReposComparisonTableProps> = ({ data, logos }) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [isDetailedView, setIsDetailedView] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedRepos = useMemo(() => {
    let result = [...data];

    if (!sortKey) return result;

    return result.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      if (sortKey === "price") {
        // Sort by free first, then freemium, then premium
        const priceOrder = { Free: 0, Freemium: 1, Premium: 2, Paid: 3 };
        aVal = priceOrder[getPriceType(a) as keyof typeof priceOrder] ?? 99;
        bVal = priceOrder[getPriceType(b) as keyof typeof priceOrder] ?? 99;
      } else {
        aVal = a[sortKey];
        bVal = b[sortKey];
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortKey, sortDir]);

  const handleVisitSite = (name: string) => {
    const urls: Record<string, string> = {
      "MakerWorld": "https://makerworld.com",
      "Printables": "https://printables.com",
      "Thingiverse": "https://thingiverse.com",
      "Cults3D": "https://cults3d.com",
      "MyMiniFactory": "https://myminifactory.com",
      "Thangs": "https://thangs.com",
      "Creality Cloud": "https://crealitycloud.com",
      "GrabCAD": "https://grabcad.com",
    };
    window.open(urls[name] || '#', '_blank');
  };

  const getBestFor = (name: string): string => {
    const bestForMap: Record<string, string> = {
      "MakerWorld": "Bambu Lab users",
      "Printables": "Community & quality",
      "Thingiverse": "Largest archive",
      "Cults3D": "Designers selling",
      "MyMiniFactory": "Premium quality",
      "Thangs": "AI-powered search",
      "Creality Cloud": "Mobile printing",
      "GrabCAD": "Engineering CAD",
    };
    return bestForMap[name] || '';
  };

  return (
    <div className="border border-border rounded-xl bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Full Comparison Matrix</h2>
            <p className="text-sm text-muted-foreground">
              All {data.length} platforms with detailed metrics and ratings
            </p>
          </div>
          <ViewToggle isDetailed={isDetailedView} onToggle={setIsDetailedView} />
        </div>

        {/* Rating Legend */}
        <RatingScaleLegend />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="py-3 px-3 font-semibold text-foreground text-center w-12">#</th>
              <SortHeader label="Platform" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortHeader label="Quality" sortKey="quality" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.quality} />
              <SortHeader label="Community" sortKey="community" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.community} />
              <SortHeader label="Search" sortKey="search" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.search} />
              <SortHeader label="UX" sortKey="ux" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.ux} />
              <SortHeader label="Price" sortKey="price" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
              <th className="py-3 px-3 font-semibold text-foreground text-left">Best For</th>
              {isDetailedView && (
                <>
                  <th className="py-3 px-3 font-semibold text-foreground text-left">File Types</th>
                  <th className="py-3 px-3 font-semibold text-foreground text-center">Mobile App</th>
                  <th className="py-3 px-3 font-semibold text-foreground text-center">API Access</th>
                </>
              )}
              <th className="py-3 px-3 font-semibold text-foreground text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRepos.map((repo, index) => {
              const priceType = getPriceType(repo);
              return (
                <tr
                  key={repo.name}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 px-3 text-center text-muted-foreground font-medium">
                    {index + 1}
                  </td>
                  <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">
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
                  <td className="py-3 px-3">
                    <RatingValue rating={mapNumberToSemantic(repo.quality)} size="small" showTooltip tooltipContent={metricTooltips.quality} />
                  </td>
                  <td className="py-3 px-3">
                    <RatingValue rating={mapNumberToSemantic(repo.community)} size="small" showTooltip tooltipContent={metricTooltips.community} />
                  </td>
                  <td className="py-3 px-3">
                    <RatingValue rating={mapNumberToSemantic(repo.search)} size="small" showTooltip tooltipContent={metricTooltips.search} />
                  </td>
                  <td className="py-3 px-3">
                    <RatingValue rating={mapNumberToSemantic(repo.ux)} size="small" showTooltip tooltipContent={metricTooltips.ux} />
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant="outline" className={cn("text-xs", getPriceBadgeColor(priceType))}>
                      {priceType}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground text-sm">
                    {getBestFor(repo.name)}
                  </td>
                  {isDetailedView && (
                    <>
                      <td className="py-3 px-3 text-muted-foreground text-xs">{repo.fileTypes}</td>
                      <td className="py-3 px-3 text-center"><BoolBadge value={repo.mobile} /></td>
                      <td className="py-3 px-3 text-center"><BoolBadge value={repo.hasApi ?? false} /></td>
                    </>
                  )}
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1.5"
                        onClick={() => handleVisitSite(repo.name)}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Visit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Plus className="w-3 h-3" />
                        Compare
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReposComparisonTable;

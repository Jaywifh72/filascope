import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FolderGit2, Check, X, BarChart3, ChevronUp, ChevronDown, ChevronsUpDown, Filter, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { repoData } from "@/lib/repoData";
import { RatingLevel, metricTooltips } from "@/lib/platformData";
import { FilterProvider } from "@/contexts/PlatformFilterContext";
import ReposHeroSection from "@/components/reference/ReposHeroSection";
import StaffPicksSection from "@/components/reference/repos/StaffPicksSection";
import SpecializedSection from "@/components/reference/repos/SpecializedSection";
import RatingValue from "@/components/reference/repos/shared/RatingValue";
import RatingScaleLegend from "@/components/reference/repos/shared/RatingScaleLegend";
import ExpandedPlatformCard from "@/components/reference/repos/ExpandedPlatformCard";
import PlatformFilterBar from "@/components/reference/repos/PlatformFilterBar";
import NoResultsEmpty from "@/components/reference/repos/NoResultsEmpty";
// Helper to convert numeric ratings (1-5) to semantic labels
const mapNumberToSemantic = (num: number): RatingLevel => {
  if (num >= 5) return 'excellent';
  if (num >= 4) return 'great';
  if (num >= 3) return 'good';
  if (num >= 2) return 'average';
  return 'limited';
};

// Logo mapping for repositories
const repoLogos: Record<string, string> = {
  "MakerWorld": "/images/repos/makerworld.png",
  "Printables": "/images/repos/printables.png",
  "Thingiverse": "/images/repos/thingiverse.png",
  "Cults3D": "/images/repos/cults3d.png",
  "MyMiniFactory": "/images/repos/myminifactory.png",
  "Thangs": "/images/repos/thangs.png",
  "Creality Cloud": "/images/repos/crealitycloud.png",
  "GrabCAD": "/images/repos/grabcad.png",
};

const repoComparison = [
  { name: "MakerWorld", owner: "Bambu Lab", model: "Loss-Leader", free: true, paid: false, quality: 4, community: 3, monetization: 5, search: 4, ux: 5, mobile: true, fileTypes: "3MF/STL", standout: "One-Click Print Profiles" },
  { name: "Printables", owner: "Prusa Research", model: "Hybrid", free: true, paid: true, quality: 5, community: 5, monetization: 4, search: 5, ux: 5, mobile: false, fileTypes: "STL/3MF/G-code", standout: "Prusameters & Clubs" },
  { name: "Thingiverse", owner: "UltiMaker", model: "Ad-Supported", free: true, paid: false, quality: 2, community: 3, monetization: 1, search: 2, ux: 2, mobile: false, fileTypes: "STL/OBJ", standout: "Largest Archive (6.7M+)" },
  { name: "Cults3D", owner: "Independent", model: "Marketplace", free: true, paid: true, quality: 4, community: 3, monetization: 5, search: 4, ux: 4, mobile: false, fileTypes: "STL/OBJ/3MF", standout: "80/20 Commission Split" },
  { name: "MyMiniFactory", owner: "MMF (UK)", model: "Premium", free: false, paid: true, quality: 5, community: 4, monetization: 5, search: 4, ux: 4, mobile: false, fileTypes: "STL/OBJ", standout: "Guaranteed Printable" },
  { name: "Thangs", owner: "Physna", model: "Search + Sub", free: true, paid: true, quality: 4, community: 3, monetization: 4, search: 5, ux: 4, mobile: false, fileTypes: "30+ formats", standout: "Geometric AI Search" },
  { name: "Creality Cloud", owner: "Creality", model: "Mobile Sub", free: true, paid: true, quality: 2, community: 2, monetization: 3, search: 3, ux: 3, mobile: true, fileTypes: "STL/G-code", standout: "Phone-to-Print" },
  { name: "GrabCAD", owner: "Stratasys", model: "Lead Gen", free: true, paid: false, quality: 5, community: 4, monetization: 1, search: 4, ux: 4, mobile: false, fileTypes: "STEP/IGES/CAD", standout: "Engineering CAD Files" },
];

const businessModels = ["All", "Loss-Leader", "Hybrid", "Ad-Supported", "Marketplace", "Premium", "Search + Sub", "Mobile Sub", "Lead Gen"];
const fileFormats = ["All", "STL", "3MF", "OBJ", "G-code", "CAD/STEP"];

type SortKey = "name" | "owner" | "model" | "quality" | "community" | "monetization" | "search" | "ux";
type SortDir = "asc" | "desc";

const modelOrder = { "Loss-Leader": 0, "Hybrid": 1, "Ad-Supported": 2, "Marketplace": 3, "Premium": 4, "Search + Sub": 5, "Mobile Sub": 6, "Lead Gen": 7 };

// RatingDots removed - now using semantic RatingValue component

const BoolBadge = ({ value }: { value: boolean }) => {
  return value ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-muted-foreground" />;
};

const SortHeader = ({ 
  label, 
  sortKey, 
  currentSort, 
  currentDir, 
  onSort,
  center = false,
  tooltip
}: { 
  label: string; 
  sortKey: SortKey; 
  currentSort: SortKey | null; 
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  center?: boolean;
  tooltip?: string;
}) => {
  const isActive = currentSort === sortKey;
  return (
    <th 
      className={`py-2 px-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors select-none ${center ? "text-center" : "text-left"}`}
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
          currentDir === "asc" ? <ChevronUp className="w-3 h-3 text-purple-400" /> : <ChevronDown className="w-3 h-3 text-purple-400" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 text-muted-foreground/50" />
        )}
      </div>
    </th>
  );
};

const ReferenceRepos = () => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [modelFilter, setModelFilter] = useState<string>("All");
  const [formatFilter, setFormatFilter] = useState<string>("All");
  const [isTableExpanded, setIsTableExpanded] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filteredAndSortedRepos = useMemo(() => {
    let result = [...repoComparison];
    
    // Apply model filter
    if (modelFilter !== "All") {
      result = result.filter(repo => repo.model === modelFilter);
    }
    
    // Apply format filter
    if (formatFilter !== "All") {
      result = result.filter(repo => {
        const fileTypes = repo.fileTypes.toLowerCase();
        switch (formatFilter) {
          case "STL":
            return fileTypes.includes("stl");
          case "3MF":
            return fileTypes.includes("3mf");
          case "OBJ":
            return fileTypes.includes("obj");
          case "G-code":
            return fileTypes.includes("g-code") || fileTypes.includes("gcode");
          case "CAD/STEP":
            return fileTypes.includes("step") || fileTypes.includes("iges") || fileTypes.includes("cad") || fileTypes.includes("30+");
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
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
  }, [sortKey, sortDir, modelFilter, formatFilter]);

  const clearFilters = () => {
    setModelFilter("All");
    setFormatFilter("All");
  };

  const hasActiveFilters = modelFilter !== "All" || formatFilter !== "All";

  const scrollToComparison = useCallback(() => {
    const element = document.getElementById('comparison-matrix');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <FilterProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <FolderGit2 className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground font-mono">3D Model Repositories</h1>
                <p className="text-muted-foreground">Complete reference guide to 3D print file platforms & marketplaces</p>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                {repoData.length} Platforms
              </Badge>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                Free & Premium
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                Marketplaces & Archives
              </Badge>
            </div>
          </div>

          {/* Hero Section */}
          <ReposHeroSection 
            platformCount={repoData.length} 
            onScrollToComparison={scrollToComparison} 
          />

          {/* Platform Filter Bar */}
          <PlatformFilterBar />

          {/* Tier 1: Staff Picks */}
          <StaffPicksSection />

          {/* Tier 2: Specialized Options */}
          <SpecializedSection />

          {/* Empty State */}
          <NoResultsEmpty />

        {/* Tier 3: Collapsible Comparative Features Table */}
        <Collapsible
          open={isTableExpanded}
          onOpenChange={setIsTableExpanded}
          className="mb-8"
        >
          <div 
            id="comparison-matrix" 
            className="border border-border rounded-lg bg-card scroll-mt-4"
            role="region"
            aria-labelledby="comparison-matrix-title"
          >
            <CollapsibleTrigger asChild>
              <button 
                className="w-full p-6 flex items-center justify-between hover:bg-muted/20 transition-all duration-200 rounded-lg"
                aria-expanded={isTableExpanded}
                aria-controls="comparison-table-content"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                  <div className="text-left">
                    <h2 id="comparison-matrix-title" className="text-xl font-bold font-mono text-foreground">Full Comparison Matrix</h2>
                    <p className="text-sm text-muted-foreground">
                      All 8 platforms with detailed metrics and ratings
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <span className="text-sm font-medium">
                    {isTableExpanded ? 'Collapse' : 'Expand'}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isTableExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent id="comparison-table-content" className="animate-accordion-down">
              <div className="px-6 pb-6 border-t border-border/50">

                {/* Filter Controls */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
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
                    Showing {filteredAndSortedRepos.length} of {repoComparison.length} platforms
                  </span>
                </div>

                {/* Rating Scale Legend */}
                <div className="mb-4">
                  <RatingScaleLegend />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <SortHeader label="Platform" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                        <SortHeader label="Owner" sortKey="owner" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                        <SortHeader label="Model" sortKey="model" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                        <th className="text-center py-2 px-3 font-semibold text-foreground">Free</th>
                        <th className="text-center py-2 px-3 font-semibold text-foreground">Paid</th>
                        <SortHeader label="Quality" sortKey="quality" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.quality} />
                        <SortHeader label="Community" sortKey="community" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.community} />
                        <SortHeader label="Monetize" sortKey="monetization" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.monetize} />
                        <SortHeader label="Search" sortKey="search" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.search} />
                        <SortHeader label="UX" sortKey="ux" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center tooltip={metricTooltips.ux} />
                        <th className="text-center py-2 px-3 font-semibold text-foreground">Mobile</th>
                        <th className="text-left py-2 px-3 font-semibold text-foreground">File Types</th>
                        <th className="text-left py-2 px-3 font-semibold text-foreground">Standout Feature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedRepos.map((repo, index) => (
                        <tr 
                          key={index} 
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-2 px-3 font-medium text-foreground sticky left-0 bg-card z-10 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {repoLogos[repo.name] && (
                                <img 
                                  src={repoLogos[repo.name]} 
                                  alt={`${repo.name} logo`}
                                  className="w-5 h-5 rounded object-contain"
                                />
                              )}
                              {repo.name}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">{repo.owner}</td>
                          <td className="py-2 px-3">
                            <Badge 
                              variant="outline" 
                              className={
                                repo.model === "Loss-Leader" || repo.model === "Ad-Supported" || repo.model === "Lead Gen"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                  : repo.model === "Hybrid" || repo.model === "Search + Sub"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              }
                            >
                              {repo.model}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-center"><BoolBadge value={repo.free} /></td>
                          <td className="py-2 px-3 text-center"><BoolBadge value={repo.paid} /></td>
                          <td className="py-2 px-3"><RatingValue rating={mapNumberToSemantic(repo.quality)} size="small" showTooltip tooltipContent={metricTooltips.quality} /></td>
                          <td className="py-2 px-3"><RatingValue rating={mapNumberToSemantic(repo.community)} size="small" showTooltip tooltipContent={metricTooltips.community} /></td>
                          <td className="py-2 px-3"><RatingValue rating={mapNumberToSemantic(repo.monetization)} size="small" showTooltip tooltipContent={metricTooltips.monetize} /></td>
                          <td className="py-2 px-3"><RatingValue rating={mapNumberToSemantic(repo.search)} size="small" showTooltip tooltipContent={metricTooltips.search} /></td>
                          <td className="py-2 px-3"><RatingValue rating={mapNumberToSemantic(repo.ux)} size="small" showTooltip tooltipContent={metricTooltips.ux} /></td>
                          <td className="py-2 px-3 text-center"><BoolBadge value={repo.mobile} /></td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">{repo.fileTypes}</td>
                          <td className="py-2 px-3 text-cyan-400 text-xs whitespace-nowrap">{repo.standout}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Repository List - Progressive Disclosure Cards */}
        <div className="space-y-3">
          {repoData.map((repo, index) => (
            <ExpandedPlatformCard
              key={repo.id}
              repo={repo}
              rank={index + 1}
              logo={repoLogos[repo.name]}
              comparisonData={repoComparison.find(r => r.name === repo.name)}
            />
          ))}
        </div>
        </div>
      </div>
    </FilterProvider>
  );
};

export default ReferenceRepos;

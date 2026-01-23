import { useState, useMemo, useCallback } from "react";
import { ExternalLink, DollarSign, Monitor, FileCode, Wifi, Clock, Check, X, Star, Zap, BarChart3, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { slicerData } from "@/lib/slicerData";
import { getSlicersByTier, getSlicerTierInfo, SlicerTierInfo } from "@/lib/slicerTierData";
import { 
  SlicerFilterState, 
  INITIAL_FILTER_STATE,
  getAllSlicers,
  filterSlicers,
  calculateFilterCounts,
  getActiveFiltersArray,
  getActiveFilterCount 
} from "@/lib/slicerFilterUtils";
import SlicerHeroSection from "@/components/reference/SlicerHeroSection";
import { SlicerTopPickCard } from "@/components/reference/SlicerTopPickCard";
import { SlicerPopularCard } from "@/components/reference/SlicerPopularCard";
import { CollapsibleSection } from "@/components/reference/CollapsibleSection";
import { SlicerSimplifiedTable } from "@/components/reference/SlicerSimplifiedTable";
import { SlicerComparisonProvider } from "@/contexts/SlicerComparisonContext";
import { ComparisonBuilderSidebar } from "@/components/reference/ComparisonBuilderSidebar";
import { ComparisonBuilderMobile } from "@/components/reference/ComparisonBuilderMobile";
import { SlicerComparisonModal } from "@/components/reference/SlicerComparisonModal";
import { SlicerFilterPanel } from "@/components/reference/SlicerFilterPanel";
import { MobileFilterPanel } from "@/components/reference/MobileFilterPanel";
import { ActiveFilterBadges } from "@/components/reference/ActiveFilterBadges";

// Logo mapping for slicers
const slicerLogos: Record<string, string> = {
  "UltiMaker Cura": "/images/slicers/cura.png",
  "PrusaSlicer": "/images/slicers/prusaslicer.png",
  "OrcaSlicer": "/images/slicers/orcaslicer.png",
  "Bambu Studio": "/images/slicers/bambustudio.png",
  "Simplify3D": "/images/slicers/simplify3d.png",
  "Creality Print": "/images/slicers/crealityprint.png",
  "ideaMaker": "/images/slicers/ideamaker.png",
  "SuperSlicer": "/images/slicers/superslicer.png",
  "FlashPrint": "/images/slicers/flashprint.png",
  "Anycubic Slicer": "/images/brands/anycubic.webp",
  "Lychee Slicer": "/images/slicers/lychee.jpg",
  "ChiTuBox": "/images/slicers/chitubox.png",
  "VoxelDance Tango": "/images/slicers/voxeldance.png",
  "Repetier-Host": "/images/slicers/repetier.png",
  "Slic3r": "/images/slicers/slic3r.png",
  "KISSlicer": "/images/slicers/kisslicer.png",
  "MatterControl": "/images/slicers/mattercontrol.png",
  "CraftWare": "/images/slicers/craftware.png",
  "Kiri:Moto": "/images/slicers/kirimoto.png",
  "3DPrinterOS": "/images/slicers/3dprinteros.png",
};

const slicerComparison = [
  { name: "UltiMaker Cura", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 5, control: 5, support: 4, speed: 3, ui: 5, connectivity: "Cloud/LAN/USB", step: "Yes", multiMat: 5, standout: "Marketplace Ecosystem" },
  { name: "PrusaSlicer", price: "Free", focus: "Both", os: "Win/Mac/Lin", ease: 5, control: 5, support: 5, speed: 5, ui: 5, connectivity: "LAN/USB", step: "Yes", multiMat: 5, standout: "Organic Supports" },
  { name: "OrcaSlicer", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 4, control: 5, support: 5, speed: 5, ui: 5, connectivity: "LAN/WiFi", step: "Yes", multiMat: 5, standout: "Built-in Calibration" },
  { name: "Bambu Studio", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 5, control: 4, support: 4, speed: 5, ui: 5, connectivity: "Cloud/LAN", step: "Yes", multiMat: 5, standout: "Multi-Color Painting" },
  { name: "Simplify3D", price: "Paid", focus: "FDM", os: "Win/Mac/Lin", ease: 3, control: 5, support: 4, speed: 5, ui: 3, connectivity: "USB", step: "No", multiMat: 4, standout: "Process Architecture" },
  { name: "Creality Print", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 3, control: 3, support: 3, speed: 4, ui: 4, connectivity: "Cloud/LAN", step: "Yes", multiMat: 3, standout: "Cloud Model Integration" },
  { name: "ideaMaker", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 4, control: 4, support: 4, speed: 4, ui: 4, connectivity: "Cloud/LAN", step: "Yes", multiMat: 5, standout: "Texture Generation" },
  { name: "SuperSlicer", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 2, control: 5, support: 4, speed: 4, ui: 3, connectivity: "LAN/USB", step: "Yes", multiMat: 4, standout: "Dense Infill Control" },
  { name: "FlashPrint", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 4, control: 2, support: 3, speed: 3, ui: 4, connectivity: "Cloud/USB", step: "No", multiMat: 4, standout: "Dimensional Compensation" },
  { name: "Anycubic Slicer", price: "Free", focus: "FDM", os: "Win/Mac", ease: 4, control: 4, support: 4, speed: 4, ui: 4, connectivity: "Cloud", step: "Yes", multiMat: 3, standout: "High Speed Optimization" },
  { name: "Lychee Slicer", price: "Freemium", focus: "Both", os: "Win/Mac/Lin", ease: 5, control: 4, support: 5, speed: 3, ui: 5, connectivity: "WiFi", step: "No", multiMat: 3, standout: "Magic Menu Automation" },
  { name: "ChiTuBox", price: "Freemium", focus: "SLA", os: "Win/Mac/Lin", ease: 3, control: 4, support: 4, speed: 3, ui: 3, connectivity: "LAN", step: "Pro Only", multiMat: 1, standout: "Native Hardware Support" },
  { name: "VoxelDance Tango", price: "Paid", focus: "SLA", os: "Win/Mac", ease: 4, control: 5, support: 5, speed: 5, ui: 4, connectivity: "WiFi", step: "Yes", multiMat: 1, standout: "Smart Support Scripts" },
  { name: "Repetier-Host", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 2, control: 5, support: 3, speed: 3, ui: 2, connectivity: "USB/Server", step: "No", multiMat: 3, standout: "Host Manual Control" },
  { name: "Slic3r", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 2, control: 3, support: 2, speed: 2, ui: 2, connectivity: "Offline", step: "No", multiMat: 3, standout: "Command Line Interface" },
  { name: "KISSlicer", price: "Freemium", focus: "FDM", os: "Win/Mac/Lin", ease: 1, control: 5, support: 3, speed: 4, ui: 1, connectivity: "Offline", step: "No", multiMat: 2, standout: "Stepover Control" },
  { name: "MatterControl", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 4, control: 3, support: 3, speed: 3, ui: 4, connectivity: "USB/Cloud", step: "No", multiMat: 3, standout: "Integrated Design Apps" },
  { name: "CraftWare", price: "Freemium", focus: "FDM", os: "Win/Mac/Lin", ease: 4, control: 4, support: 4, speed: 5, ui: 4, connectivity: "Cloud", step: "No", multiMat: 5, standout: "G-Code Visualizer" },
  { name: "Kiri:Moto", price: "Free", focus: "All", os: "Browser", ease: 4, control: 3, support: 2, speed: 3, ui: 4, connectivity: "Export/Onshape", step: "No", multiMat: 2, standout: "Browser-Based CAM" },
  { name: "3DPrinterOS", price: "Paid", focus: "FDM", os: "Web", ease: 5, control: 3, support: 3, speed: 3, ui: 4, connectivity: "Cloud", step: "Yes", multiMat: 3, standout: "Fleet Management" },
];

type SortKey = "name" | "price" | "focus" | "ease" | "control" | "support" | "speed" | "ui" | "step" | "multiMat";
type SortDir = "asc" | "desc";

const priceOrder = { "Free": 0, "Freemium": 1, "Paid": 2 };
const stepOrder = { "Yes": 0, "Pro Only": 1, "Paid Plugin": 2, "No": 3 };

const RatingDots = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= rating
              ? rating >= 4 ? "bg-emerald-400" : rating >= 3 ? "bg-amber-400" : "bg-red-400"
              : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
};

const StepBadge = ({ value }: { value: string }) => {
  if (value === "Yes") return <Check className="w-4 h-4 text-emerald-400" />;
  if (value === "No") return <X className="w-4 h-4 text-muted-foreground" />;
  return <span className="text-xs text-amber-400">{value}</span>;
};

const SortHeader = ({ 
  label, 
  sortKey, 
  currentSort, 
  currentDir, 
  onSort,
  center = false 
}: { 
  label: string; 
  sortKey: SortKey; 
  currentSort: SortKey | null; 
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  center?: boolean;
}) => {
  const isActive = currentSort === sortKey;
  return (
    <th 
      className={`py-2 px-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors select-none ${center ? "text-center" : "text-left"}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${center ? "justify-center" : ""}`}>
        <span>{label}</span>
        {isActive ? (
          currentDir === "asc" ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3 text-emerald-400" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 text-muted-foreground/50" />
        )}
      </div>
    </th>
  );
};

const ReferenceSlicers = () => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [focusFilter, setFocusFilter] = useState<string>("all");
  const [showDetailedTable, setShowDetailedTable] = useState(false);
  
  // New filter state
  const [filters, setFilters] = useState<SlicerFilterState>(INITIAL_FILTER_STATE);

  // Get all slicers for filtering
  const allSlicers = useMemo(() => getAllSlicers(), []);

  // Get slicers by tier (unfiltered for base data)
  const topPickSlicersBase = useMemo(() => getSlicersByTier('top-pick'), []);
  const popularSlicersBase = useMemo(() => getSlicersByTier('popular'), []);
  const otherSlicersBase = useMemo(() => getSlicersByTier('other'), []);

  // Apply filters to each tier
  const filteredSlicers = useMemo(() => filterSlicers(allSlicers, filters), [allSlicers, filters]);
  const topPickSlicers = useMemo(() => filterSlicers(topPickSlicersBase, filters), [topPickSlicersBase, filters]);
  const popularSlicers = useMemo(() => filterSlicers(popularSlicersBase, filters), [popularSlicersBase, filters]);
  const otherSlicers = useMemo(() => filterSlicers(otherSlicersBase, filters), [otherSlicersBase, filters]);

  // Calculate filter counts
  const filterCounts = useMemo(() => calculateFilterCounts(allSlicers, filters), [allSlicers, filters]);
  
  // Get active filters for badges
  const activeFilters = useMemo(() => getActiveFiltersArray(filters), [filters]);

  // Filter handlers
  const handleFilterChange = useCallback((categoryId: string, value: string, checked: boolean) => {
    setFilters(prev => {
      const categoryKey = categoryId as keyof SlicerFilterState;
      const currentValues = prev[categoryKey];
      
      const newValues = checked
        ? [...currentValues, value]
        : currentValues.filter(v => v !== value);
      
      return {
        ...prev,
        [categoryKey]: newValues,
      };
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters(INITIAL_FILTER_STATE);
  }, []);

  const handleRemoveFilter = useCallback((categoryId: string, optionValue: string) => {
    setFilters(prev => ({
      ...prev,
      [categoryId]: prev[categoryId as keyof SlicerFilterState].filter(v => v !== optionValue),
    }));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const clearFilters = () => {
    setPriceFilter("all");
    setFocusFilter("all");
  };

  const hasFilters = priceFilter !== "all" || focusFilter !== "all";

  const filteredAndSortedSlicers = useMemo(() => {
    let filtered = [...slicerComparison];

    // Apply filters
    if (priceFilter !== "all") {
      filtered = filtered.filter(s => s.price === priceFilter);
    }
    if (focusFilter !== "all") {
      filtered = filtered.filter(s => s.focus === focusFilter || s.focus === "Both" || s.focus === "All");
    }

    // Apply sorting
    if (!sortKey) return filtered;
    
    return filtered.sort((a, b) => {
      let aVal: number | string = a[sortKey];
      let bVal: number | string = b[sortKey];
      
      // Handle special sorting for price and step
      if (sortKey === "price") {
        aVal = priceOrder[a.price as keyof typeof priceOrder] ?? 99;
        bVal = priceOrder[b.price as keyof typeof priceOrder] ?? 99;
      } else if (sortKey === "step") {
        aVal = stepOrder[a.step as keyof typeof stepOrder] ?? 99;
        bVal = stepOrder[b.step as keyof typeof stepOrder] ?? 99;
      }
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      return sortDir === "asc" 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [sortKey, sortDir, priceFilter, focusFilter]);

  const scrollToComparison = () => {
    const element = document.getElementById('comparison-table');
    if (element) {
      const offset = 80;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleLearnMore = (slicerName: string) => {
    // Scroll to the accordion item for this slicer
    const element = document.getElementById(`slicer-${slicerName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
    if (element) {
      const offset = 80;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleAddToCompare = (slicerName: string) => {
    // This is handled by the SlicerTopPickCard component via context
    // The onAddToCompare prop triggers the card's internal comparison logic
  };

  return (
    <SlicerComparisonProvider>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <SlicerHeroSection 
          slicerCount={slicerComparison.length}
          onScrollToComparison={scrollToComparison}
        />

        {/* Main Content with 3-Column Layout */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-8 lg:gap-10 items-start">
          
          {/* Left Sidebar: Filter Panel (Desktop) */}
          <SlicerFilterPanel
            filters={filters}
            counts={filterCounts}
            totalCount={allSlicers.length}
            filteredCount={filteredSlicers.length}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAllFilters}
          />

          {/* Main Content */}
          <main>
            {/* Mobile Filter Panel */}
            <MobileFilterPanel
              filters={filters}
              counts={filterCounts}
              totalCount={allSlicers.length}
              filteredCount={filteredSlicers.length}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAllFilters}
            />

            {/* Active Filter Badges */}
            <ActiveFilterBadges
              activeFilters={activeFilters}
              onRemove={handleRemoveFilter}
            />

            {/* TIER 1: Top Picks */}
            <section className="py-[60px] max-md:py-10">
              <h2 className="text-2xl font-bold text-white max-md:text-xl mb-2">Our Top Picks</h2>
              <p className="text-gray-400 mb-6">
                Staff-curated recommendations based on use case and performance
              </p>
              
              {topPickSlicers.length > 0 ? (
                <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-muted/10 max-lg:flex-col max-lg:overflow-visible items-stretch">
                  {topPickSlicers.map((slicer) => (
                    <SlicerTopPickCard
                      key={slicer.name}
                      slicer={slicer}
                      logo={slicerLogos[slicer.name]}
                      onLearnMore={() => handleLearnMore(slicer.name)}
                      onAddToCompare={() => handleAddToCompare(slicer.name)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No top picks match your filters
                </div>
              )}
            </section>

            {/* TIER 2: Popular Choices */}
            <CollapsibleSection
              title="Popular Choices"
              subtitle="Widely-used slicers with strong community support"
              defaultExpanded={true}
            >
              {popularSlicers.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1 items-stretch">
                  {popularSlicers.map((slicer) => (
                    <SlicerPopularCard
                      key={slicer.name}
                      slicer={slicer}
                      logo={slicerLogos[slicer.name]}
                      onLearnMore={() => handleLearnMore(slicer.name)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No popular choices match your filters
                </div>
              )}
            </CollapsibleSection>

            {/* TIER 3: Full Comparison Table */}
            <CollapsibleSection
              id="comparison-table"
              title="Full Comparison Table"
              subtitle={`View all ${filteredSlicers.length} slicers with detailed specifications`}
              defaultExpanded={false}
            >
              {/* View Toggle */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setShowDetailedTable(false)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                    !showDetailedTable 
                      ? 'bg-primary/15 border-primary/50 text-primary' 
                      : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  Simplified View
                </button>
                <button
                  onClick={() => setShowDetailedTable(true)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                    showDetailedTable 
                      ? 'bg-primary/15 border-primary/50 text-primary' 
                      : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  Detailed View
                </button>
              </div>

              {showDetailedTable ? (
                /* Detailed Table (Original) */
                <div className="border border-border rounded-lg bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-lg font-bold font-mono text-foreground">Comparative Features Matrix</h3>
                  </div>
                  {/* Filters */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <Select value={priceFilter} onValueChange={setPriceFilter}>
                        <SelectTrigger className="w-32 bg-background">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="Free">Free</SelectItem>
                          <SelectItem value="Freemium">Freemium</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Focus:</span>
                      <Select value={focusFilter} onValueChange={setFocusFilter}>
                        <SelectTrigger className="w-32 bg-background">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="FDM">FDM</SelectItem>
                          <SelectItem value="SLA">SLA</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {hasFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                        <X className="h-4 w-4 mr-1" />
                        Clear filters
                      </Button>
                    )}
                    <span className="text-sm text-muted-foreground ml-auto">
                      Showing {filteredAndSortedSlicers.length} of {slicerComparison.length} slicers
                    </span>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                    <p className="text-muted-foreground text-sm">
                      Side-by-side comparison of slicer capabilities, ratings (1-5), and standout features.
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">Rating:</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-muted-foreground">4-5 (Excellent)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-muted-foreground">3 (Average)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-muted-foreground">1-2 (Limited)</span>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <SortHeader label="Software" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                          <SortHeader label="Price" sortKey="price" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                          <SortHeader label="Focus" sortKey="focus" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                          <th className="text-left py-2 px-3 font-semibold text-foreground">OS</th>
                          <SortHeader label="Ease" sortKey="ease" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                          <SortHeader label="Control" sortKey="control" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                          <SortHeader label="Supports" sortKey="support" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                          <SortHeader label="Speed" sortKey="speed" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                          <SortHeader label="UI" sortKey="ui" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                          <th className="text-left py-2 px-3 font-semibold text-foreground">Connect</th>
                          <SortHeader label="STEP" sortKey="step" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                          <SortHeader label="Multi-Mat" sortKey="multiMat" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                          <th className="text-left py-2 px-3 font-semibold text-foreground">Standout Feature</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedSlicers.map((slicer, index) => (
                          <tr 
                            key={index} 
                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                          >
                            <td className="py-2 px-3 font-medium text-foreground sticky left-0 bg-card z-10 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {slicerLogos[slicer.name] && (
                                  <img 
                                    src={slicerLogos[slicer.name]} 
                                    alt={`${slicer.name} logo`}
                                    className="w-5 h-5 rounded object-contain"
                                  />
                                )}
                                {slicer.name}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <Badge 
                                variant="outline" 
                                className={
                                  slicer.price === "Free" 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                                    : slicer.price === "Freemium"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    : "bg-red-500/10 text-red-400 border-red-500/30"
                                }
                              >
                                {slicer.price}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">{slicer.focus}</td>
                            <td className="py-2 px-3 text-muted-foreground text-xs">{slicer.os}</td>
                            <td className="py-2 px-3"><RatingDots rating={slicer.ease} /></td>
                            <td className="py-2 px-3"><RatingDots rating={slicer.control} /></td>
                            <td className="py-2 px-3"><RatingDots rating={slicer.support} /></td>
                            <td className="py-2 px-3"><RatingDots rating={slicer.speed} /></td>
                            <td className="py-2 px-3"><RatingDots rating={slicer.ui} /></td>
                            <td className="py-2 px-3 text-muted-foreground text-xs">{slicer.connectivity}</td>
                            <td className="py-2 px-3 text-center"><StepBadge value={slicer.step} /></td>
                            <td className="py-2 px-3"><RatingDots rating={slicer.multiMat} /></td>
                            <td className="py-2 px-3 text-cyan-400 text-xs whitespace-nowrap">{slicer.standout}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Simplified Table */
                otherSlicers.length > 0 ? (
                  <SlicerSimplifiedTable
                    slicers={otherSlicers}
                    logos={slicerLogos}
                    onViewDetails={handleLearnMore}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No slicers match your filters
                  </div>
                )
              )}
            </CollapsibleSection>

            {/* Slicer Profiles Accordion */}
            <div className="py-8">
              <h2 className="text-2xl font-bold text-white max-md:text-xl mb-2">Detailed Slicer Profiles ({slicerData.length})</h2>
              <p className="text-gray-400 mb-6">In-depth analysis of each slicer's features and capabilities</p>
              <Accordion type="single" collapsible className="space-y-2">
                {slicerData.map((slicer, index) => (
                  <AccordionItem 
                    key={slicer.id} 
                    value={slicer.id}
                    id={`slicer-${slicer.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 transition-all duration-200 hover:bg-gray-800 hover:border-gray-600 data-[state=open]:border-primary/50 data-[state=open]:bg-gray-800"
                  >
                    <AccordionTrigger className="hover:no-underline py-4 [&>svg]:text-gray-400 [&>svg]:transition-transform [&>svg]:duration-300 [&[data-state=open]>svg]:rotate-180">
                      <div className="flex items-center gap-4 text-left">
                        <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {slicerLogos[slicer.name] ? (
                          <img 
                            src={slicerLogos[slicer.name]} 
                            alt={`${slicer.name} logo`}
                            className="w-10 h-10 rounded-lg object-contain bg-gray-900/50 p-1 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-white">{slicer.name}</h3>
                          <p className="text-sm text-gray-400 line-clamp-1 max-w-2xl">
                            {slicer.summary.substring(0, 80)}...
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="pb-6">
                      <div className="space-y-6 pt-2">
                        {/* Summary */}
                        <div>
                          <h4 className="text-sm font-semibold text-primary mb-2">Summary</h4>
                          <p className="text-gray-300 leading-relaxed">{slicer.summary}</p>
                        </div>

                        {/* History */}
                        <div>
                          <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            History
                          </h4>
                          <p className="text-gray-300 leading-relaxed">{slicer.history}</p>
                        </div>

                        {/* Key Strengths */}
                        <div>
                          <h4 className="text-sm font-semibold text-amber-400 mb-3">Key Strengths</h4>
                          <div className="grid gap-3 md:grid-cols-3">
                            {slicer.keyStrengths.map((strength, idx) => (
                              <div key={idx} className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
                                <h5 className="font-medium text-white mb-1">{strength.title}</h5>
                                <p className="text-sm text-gray-400">{strength.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Technical Specifications */}
                        <div>
                          <h4 className="text-sm font-semibold text-primary mb-3">Technical Specifications</h4>
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                <DollarSign className="w-3 h-3" />
                                Price
                              </div>
                              <p className="text-sm text-white">{slicer.technicalSpecs.price}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                <Monitor className="w-3 h-3" />
                                Supported OS
                              </div>
                              <p className="text-sm text-white">{slicer.technicalSpecs.supportedOS}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                <FileCode className="w-3 h-3" />
                                File Support
                              </div>
                              <p className="text-sm text-white">{slicer.technicalSpecs.fileSupport}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-900/50 border border-gray-700">
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                <Wifi className="w-3 h-3" />
                                Connectivity
                              </div>
                              <p className="text-sm text-white">{slicer.technicalSpecs.connectivity}</p>
                            </div>
                          </div>
                          {slicer.technicalSpecs.status && (
                            <div className="mt-3">
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                {slicer.technicalSpecs.status}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Links */}
                        <div>
                          <h4 className="text-sm font-semibold text-purple-400 mb-3">Important Links</h4>
                          <div className="flex flex-wrap gap-2">
                            {slicer.links.map((link, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                asChild
                                className="gap-2 border-gray-600 hover:border-primary hover:text-primary"
                              >
                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                  {link.label}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </main>

          {/* Right Sidebar: Comparison Builder (Desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[100px]">
              <ComparisonBuilderSidebar />
            </div>
          </aside>
        </div>

        {/* Mobile Footer */}
        <ComparisonBuilderMobile />

        {/* Comparison Modal */}
        <SlicerComparisonModal />
        
        {/* Spacer for mobile footer */}
        <div className="h-[60px] lg:hidden" />
      </div>
    </SlicerComparisonProvider>
  );
};

export default ReferenceSlicers;

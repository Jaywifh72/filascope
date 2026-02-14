import { useState, useMemo, useCallback } from "react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { ExternalLink, DollarSign, Monitor, FileCode, Wifi, Clock, Check, X, Star, BarChart3, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, Table, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { slicerData } from "@/lib/slicerData";
import { getSlicersByTier, getSlicerTierInfo, slicerTierData, SlicerTierInfo } from "@/lib/slicerTierData";
import { SoftwareApplicationSchema } from "@/components/seo";
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

import { SlicerSimplifiedTable } from "@/components/reference/SlicerSimplifiedTable";
import { SlicerComparisonProvider } from "@/contexts/SlicerComparisonContext";
import { SlicerComparisonTray } from "@/components/reference/SlicerComparisonTray";
import { SlicerComparisonModal } from "@/components/reference/SlicerComparisonModal";
import { SlicerFilterPanel } from "@/components/reference/SlicerFilterPanel";
import { MobileFilterPanel } from "@/components/reference/MobileFilterPanel";
import { ActiveFilterBadges } from "@/components/reference/ActiveFilterBadges";
import { SlicerLogo } from '@/components/reference/SlicerLogoFallback';

// Logo mapping for slicers — served from /public/slicers/
const slicerLogos: Record<string, string> = {
  "UltiMaker Cura": "/slicers/cura.png",
  "PrusaSlicer": "/slicers/prusaslicer.png",
  "OrcaSlicer": "/slicers/orcaslicer.png",
  "Bambu Studio": "/slicers/bambustudio.png",
  "Simplify3D": "/slicers/simplify3d.png",
  "Creality Print": "/slicers/crealityprint.png",
  "ideaMaker": "/slicers/ideamaker.png",
  "SuperSlicer": "/slicers/superslicer.png",
  "FlashPrint": "/slicers/flashprint.png",
  "Anycubic Slicer": "/slicers/anycubic.png",
  "Lychee Slicer": "/slicers/lychee.png",
  "ChiTuBox": "/slicers/chitubox.png",
  "VoxelDance Tango": "/slicers/voxeldance.png",
  "Repetier-Host": "/slicers/repetier.png",
  "Slic3r": "/slicers/slic3r.png",
  "KISSlicer": "/slicers/kisslicer.png",
  "MatterControl": "/slicers/mattercontrol.png",
  "CraftWare": "/slicers/craftware.png",
  "Kiri:Moto": "/slicers/kirimoto.png",
  "3DPrinterOS": "/slicers/3dprinteros.png",
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
      className={`py-2 px-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors select-none ${center ? "text-center" : "text-left"} ${isActive ? "text-primary" : "text-slate-400"}`}
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

type SlicerTab = "recommendations" | "comparison" | "profiles";

const ReferenceSlicers = () => {
  const [activeTab, setActiveTab] = useState<SlicerTab>("recommendations");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [focusFilter, setFocusFilter] = useState<string>("all");
  const [showDetailedTable, setShowDetailedTable] = useState(false);
  const [openProfileId, setOpenProfileId] = useState<string | undefined>(undefined);
  
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
    setActiveTab("comparison");
    // Scroll to the tab bar area after switching tabs
    requestAnimationFrame(() => {
      const tabBar = document.querySelector('[role="tablist"]');
      if (tabBar) {
        const top = tabBar.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  };

  const handleLearnMore = (slicerName: string) => {
    // Find matching slicer id from slicerData
    const match = slicerData.find(s => s.name === slicerName);
    const targetId = match?.id || slicerName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    setActiveTab("profiles");
    setOpenProfileId(targetId);
    
    // Wait for tab content to render, then scroll
    requestAnimationFrame(() => {
      setTimeout(() => {
        const element = document.getElementById(`slicer-${slicerName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
        if (element) {
          const top = element.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    });
  };

  const handleAddToCompare = (slicerName: string) => {
    // This is handled by the SlicerTopPickCard component via context
    // The onAddToCompare prop triggers the card's internal comparison logic
  };

  return (
    <SlicerComparisonProvider>
      <DocumentHead
        title="Slicer Guide — Compare 3D Printing Slicers | FilaScope"
        description="Compare 20 3D printing slicers with expert ratings across 15 features. Find your perfect slicer software — free and paid options reviewed."
        ogDescription="Compare 20 3D printing slicers with expert ratings across 15 features. Find your perfect slicer software — free and paid options reviewed."
      />
      {/* SoftwareApplication JSON-LD for each slicer */}
      {Object.values(slicerTierData).map((slicer) => {
        const priceValue = slicer.priceType === 'paid' && slicer.priceValue
          ? slicer.priceValue.replace(/[^0-9.]/g, '')
          : '0';
        return (
          <SoftwareApplicationSchema
            key={slicer.name}
            name={slicer.name}
            description={slicer.editorialQuote}
            operatingSystem={slicer.platforms.join(', ')}
            applicationCategory="DesignApplication"
            offers={{ price: priceValue, priceCurrency: 'USD' }}
            aggregateRating={{ ratingValue: slicer.overallScore, bestRating: 10, worstRating: 0 }}
          />
        );
      })}
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <SlicerHeroSection 
          slicerCount={slicerComparison.length}
          onScrollToComparison={scrollToComparison}
          onSlicerClick={handleLearnMore}
        />

        {/* Sticky Tab Navigation */}
        <div className="sticky top-[64px] z-30 bg-[#0d1117]/95 backdrop-blur-md border-b border-white/5 pb-3">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
            <nav className="flex gap-2" role="tablist">
              {[
                { id: "recommendations" as SlicerTab, label: "Recommendations", icon: Star, count: 3 },
                { id: "comparison" as SlicerTab, label: "Full Comparison", icon: Table, count: 20 },
                { id: "profiles" as SlicerTab, label: "Detailed Profiles", icon: FileText, count: slicerData.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-4 text-sm transition-all relative",
                    "border-b-[3px] -mb-[1px]",
                    activeTab === tab.id
                      ? "border-cyan-500 text-white font-semibold"
                      : "border-transparent text-slate-400 hover:text-slate-200 transition-colors"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content with 3-Column Layout */}
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-10 items-start">
          
          {/* Left Sidebar: Filter Panel (Desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[72px]">
              <SlicerFilterPanel
                filters={filters}
                counts={filterCounts}
                totalCount={allSlicers.length}
                filteredCount={filteredSlicers.length}
                onFilterChange={handleFilterChange}
                onClearAll={handleClearAllFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <section role="region" aria-label="Slicer software listings">
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

            {/* RECOMMENDATIONS TAB */}
            {activeTab === "recommendations" && (
              <section className="py-8 animate-fade-in">
                <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white max-md:text-xl mb-2">Our Recommendations</h2>
                  <p className="text-gray-400 mb-6">
                    Staff-curated recommendations based on use case and performance
                  </p>
                  
                  {/* Top 3 Featured Cards */}
                  {topPickSlicers.length > 0 ? (
                    <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-muted/10 max-lg:flex-col max-lg:overflow-visible items-stretch">
                      {topPickSlicers.slice(0, 3).map((slicer) => {
                        const bestForMap: Record<string, string> = {
                          'Bambu Studio': 'Beginners & Bambu printers',
                          'PrusaSlicer': 'Open-source enthusiasts & tinkerers',
                          'OrcaSlicer': 'Power users & multi-printer setups',
                        };
                        return (
                          <SlicerTopPickCard
                            key={slicer.name}
                            slicer={slicer}
                            logo={slicerLogos[slicer.name]}
                            bestFor={bestForMap[slicer.name]}
                            onLearnMore={() => handleLearnMore(slicer.name)}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No recommendations match your filters
                    </div>
                  )}

                  {/* See More Recommendations - Expandable */}
                  {popularSlicers.length > 0 && (
                    <Accordion type="single" collapsible className="mt-6">
                      <AccordionItem value="more-recommendations" className="border-none">
                        <AccordionTrigger className="group hover:no-underline py-3 px-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 [&>svg]:hidden data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <Star className="w-4 h-4 text-primary" />
                              </div>
                              <div className="text-left">
                                <span className="text-sm font-semibold text-white">See More Recommendations</span>
                                <span className="text-xs text-gray-400 ml-2">
                                  ({popularSlicers.length} additional slicers)
                                </span>
                              </div>
                            </div>
                            <ChevronDown className="w-5 h-5 text-gray-400 transition-transform duration-300" />
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 pb-4 px-4 bg-gray-800/30 border border-t-0 border-gray-700 rounded-b-lg">
                          <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1 items-stretch">
                            {popularSlicers.map((slicer) => {
                              const compactBestFor: Record<string, string> = {
                                'UltiMaker Cura': 'Plugin ecosystem',
                                'Simplify3D': 'Professionals',
                                'ideaMaker': 'Raise3D users',
                                'SuperSlicer': 'Advanced calibration',
                                'Creality Print': 'Creality printers',
                                'Lychee Slicer': 'Resin printing',
                              };
                              return (
                              <SlicerPopularCard
                                key={slicer.name}
                                slicer={slicer}
                                logo={slicerLogos[slicer.name]}
                                bestFor={compactBestFor[slicer.name]}
                                onLearnMore={() => handleLearnMore(slicer.name)}
                              />
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {/* Quick Picks Section */}
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-white">Quick Picks</h3>
                    <p className="text-sm text-slate-400 mt-1 mb-4">Not sure where to start? Here are our top picks by category</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { emoji: '🏆', title: 'Best Free Slicer', slicer: 'PrusaSlicer', border: 'border-emerald-500' },
                        { emoji: '🚀', title: 'Easiest to Learn', slicer: 'Bambu Studio', border: 'border-cyan-500' },
                        { emoji: '⚙️', title: 'Most Customizable', slicer: 'OrcaSlicer', border: 'border-purple-500' },
                        { emoji: '🎨', title: 'Best for Resin', slicer: 'Lychee Slicer', border: 'border-amber-500' },
                      ].map((pick) => (
                        <div
                          key={pick.title}
                          className={`bg-slate-800/50 rounded-lg p-4 flex items-center justify-between border-l-4 ${pick.border}`}
                        >
                          <div>
                            <div className="text-sm font-semibold text-white">{pick.emoji} {pick.title}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{pick.slicer}</div>
                          </div>
                          <button
                            onClick={() => handleLearnMore(pick.slicer)}
                            className="text-cyan-400 text-sm hover:underline whitespace-nowrap"
                          >
                            View →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* FULL COMPARISON TAB */}
            {activeTab === "comparison" && (
              <section className="py-8 animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white max-md:text-xl mb-2">Full Comparison Table</h2>
                  <p className="text-gray-400">
                    View all {filteredSlicers.length} slicers with detailed specifications
                  </p>
                </div>

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
                    <p className="text-xs text-slate-500 italic mb-2">Scroll for more →</p>
                    <div className="relative">
                      <div className="overflow-x-auto max-w-full" id="detailed-table-scroll">
                        <table className="w-full border-collapse text-sm min-w-[900px]">
                          <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700">
                              <SortHeader label="Software" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                              <SortHeader label="Price" sortKey="price" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                              <SortHeader label="Focus" sortKey="focus" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                              <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">OS</th>
                              <SortHeader label="Ease" sortKey="ease" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                              <SortHeader label="Control" sortKey="control" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                              <SortHeader label="Supports" sortKey="support" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                              <SortHeader label="Speed" sortKey="speed" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                              <SortHeader label="UI" sortKey="ui" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                              <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Connect</th>
                              <SortHeader label="STEP" sortKey="step" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                              <SortHeader label="Multi-Mat" sortKey="multiMat" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} center />
                              <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Standout Feature</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAndSortedSlicers.map((slicer, index) => (
                              <tr 
                                key={index} 
                                className={cn(
                                  'border-b border-border/50 hover:bg-cyan-500/5 transition-colors duration-200 cursor-pointer',
                                  index % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'
                                )}
                              >
                                <td className="py-2 px-3 font-medium text-foreground sticky left-0 z-10 whitespace-nowrap bg-card">
                                  <div className="flex items-center gap-2">
                                    <SlicerLogo src={slicerLogos[slicer.name]} name={slicer.name} className="w-5 h-5 rounded" />
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
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-1">
                                    {slicer.os === "Browser" || slicer.os === "Web" ? (
                                      <span className="text-[10px] font-mono bg-slate-800 rounded px-1 py-0.5 text-slate-400" title={slicer.os}>{slicer.os}</span>
                                    ) : (
                                      <>
                                        {slicer.os.includes("Win") && <span className="text-[10px] font-mono bg-slate-800 rounded px-1 py-0.5 text-slate-400" title="Windows">W</span>}
                                        {slicer.os.includes("Mac") && <span className="text-[10px] font-mono bg-slate-800 rounded px-1 py-0.5 text-slate-400" title="macOS">M</span>}
                                        {slicer.os.includes("Lin") && <span className="text-[10px] font-mono bg-slate-800 rounded px-1 py-0.5 text-slate-400" title="Linux">L</span>}
                                      </>
                                    )}
                                  </div>
                                </td>
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
                      {/* Right edge fade gradient */}
                      <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-card to-transparent pointer-events-none z-10" />
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
              </section>
            )}

            {/* DETAILED PROFILES TAB */}
            {activeTab === "profiles" && (
              <section className="py-8 animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white max-md:text-xl mb-2">Detailed Slicer Profiles</h2>
                  <p className="text-gray-400">In-depth analysis of each slicer's features and capabilities</p>
                </div>
                <Accordion type="single" collapsible className="space-y-2" value={openProfileId} onValueChange={setOpenProfileId}>
                  {slicerData.map((slicer, index) => (
                    <AccordionItem 
                      key={slicer.id} 
                      value={slicer.id}
                      id={`slicer-${slicer.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      className="bg-gray-800/50 border border-gray-700 border-b-slate-800 rounded-lg px-4 transition-all duration-200 hover:bg-slate-800/50 hover:border-gray-600 data-[state=open]:border-primary/50 data-[state=open]:bg-gray-800"
                    >
                      <AccordionTrigger className="hover:no-underline py-4 [&>svg]:text-gray-400 [&>svg]:transition-transform [&>svg]:duration-300 [&[data-state=open]>svg]:rotate-180">
                        <div className="flex items-center gap-4 text-left flex-1 min-w-0">
                          <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm text-cyan-500 flex-shrink-0">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <SlicerLogo src={slicerLogos[slicer.name]} name={slicer.name} className="w-10 h-10 rounded-lg p-1" />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-bold text-white">{slicer.name}</h3>
                            <p className="text-sm text-gray-400 line-clamp-2 max-w-2xl">
                              {slicer.summary}
                            </p>
                            {(() => {
                              const tierInfo = getSlicerTierInfo(slicer.name);
                              const standout = tierInfo?.topFeatures?.[0];
                              return standout ? (
                                <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded inline-block mt-1">
                                  {standout}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          {(() => {
                            const tierInfo = getSlicerTierInfo(slicer.name);
                            if (!tierInfo) return null;
                            const priceClass = tierInfo.priceType === 'free'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : tierInfo.priceType === 'freemium'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400';
                            return (
                              <div className="flex items-center gap-3 shrink-0 mr-2">
                                <span className="text-sm text-cyan-400 font-medium whitespace-nowrap">{tierInfo.overallScore}/10</span>
                                <span className={cn('px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap', priceClass)}>
                                  {tierInfo.priceType === 'paid' && tierInfo.priceValue ? tierInfo.priceValue : tierInfo.priceType.charAt(0).toUpperCase() + tierInfo.priceType.slice(1)}
                                </span>
                              </div>
                            );
                          })()}
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
                                <div key={idx} className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/30 transition-colors">
                                  <h5 className="text-sm font-semibold text-cyan-400 mb-2">{strength.title}</h5>
                                  <p className="text-xs text-slate-300 leading-relaxed">{strength.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Technical Specifications */}
                          <div>
                            <h4 className="text-sm font-semibold text-primary mb-3">Technical Specifications</h4>
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                              <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                  <DollarSign className="w-3 h-3" />
                                  Price
                                </div>
                                <p className="text-sm text-slate-200">{slicer.technicalSpecs.price}</p>
                              </div>
                              <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                  <Monitor className="w-3 h-3" />
                                  Supported OS
                                </div>
                                <p className="text-sm text-slate-200">{slicer.technicalSpecs.supportedOS}</p>
                              </div>
                              <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                  <FileCode className="w-3 h-3" />
                                  File Support
                                </div>
                                <p className="text-sm text-slate-200">{slicer.technicalSpecs.fileSupport}</p>
                              </div>
                              <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                  <Wifi className="w-3 h-3" />
                                  Connectivity
                                </div>
                                <p className="text-sm text-slate-200">{slicer.technicalSpecs.connectivity}</p>
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
              </section>
            )}
          </section>

        </div>

        {/* Floating Comparison Tray */}
        <SlicerComparisonTray />

        {/* Comparison Modal */}
        <SlicerComparisonModal />
      </div>
    </SlicerComparisonProvider>
  );
};

export default ReferenceSlicers;

// Filament comparison page
import { MATERIAL_CATEGORIES } from "@/lib/materialHierarchy";
import { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, RefreshCcw, BookOpen, ShoppingCart, ExternalLink, Lightbulb, X, Eye } from "lucide-react";
import { GitCompare, ArrowLeft, Trophy, Share2, Plus, Loader2 } from "lucide-react";
import { SharePopover } from "@/components/sharing/SharePopover";
import { FilamentComparisonEmptyState } from "@/components/compare/FilamentComparisonEmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MaterialReference from "@/components/MaterialReference";
import { getBrandLogo } from "@/lib/brandLogos";
import { ExportMenu } from "@/components/compare/ExportMenu";
import { CompareActionRow, TDValueBadge } from "@/components/compare/CompareActionRow";
import { MobileCompareView } from "@/components/compare/MobileCompareView";
import { MobileStickyBuyBar } from "@/components/compare/MobileStickyBuyBar";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useCompare } from "@/hooks/useCompare";
import { useCompareRegionalPrices } from "@/hooks/useCompareRegionalPrices";
import { useRegion } from "@/contexts/RegionContext";
import type { Tables } from "@/integrations/supabase/types";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Filament = Tables<"filaments">;

type CompareMode = "higher" | "lower" | "none";

const Compare = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diffMode, setDiffMode] = useState(false);
  const { getAffiliateUrl } = useAffiliateLinks();
  const { formatPrice, currency } = useRegion();
  
  // Resolve regional prices for all filaments
  const { prices: resolvedPrices, bestPriceIndices: regionalBestPriceIndices, isLoading: pricesLoading } = useCompareRegionalPrices(filaments);
  
  // Access the compare tray context
  const { items: compareItems, removeItem: removeFromContext } = useCompare();
  const hasSyncedRef = useRef(false);
  
  // Sync compare tray items to URL if no URL params exist
  useEffect(() => {
    const urlIds = searchParams.get("ids");
    
    // If no IDs in URL but we have items in context, sync them to URL
    if (!urlIds && compareItems.length > 0 && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      const ids = compareItems.map(item => item.id).join(',');
      const newParams = new URLSearchParams(searchParams);
      newParams.set("ids", ids);
      // Also switch to comparison tab when syncing
      if (!newParams.get("tab")) {
        newParams.set("tab", "comparison");
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [compareItems, searchParams, setSearchParams]);
  
  // Tab state - default to reference, but switch to comparison if filament IDs exist
  const urlIds = searchParams.get("ids");
  const hasItems = urlIds || compareItems.length > 0;
  const activeTab = searchParams.get("tab") || (hasItems ? "comparison" : "reference");
  
  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", value);
    setSearchParams(newParams);
  };

  const fetchFilaments = async () => {
    // Get IDs from URL, fall back to compare context items
    let ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    
    // If no URL IDs, use compare context items
    if (ids.length === 0 && compareItems.length > 0) {
      ids = compareItems.map(item => item.id);
    }
    
    if (ids.length === 0) {
      setLoading(false);
      setFilaments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("filaments")
        .select("*")
        .in("id", ids);

      if (fetchError) throw fetchError;
      
      setFilaments(data || []);
      // Cache for offline access
      const cacheKey = `compare_cache_${ids.join(',')}`;
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error("Error fetching filaments:", err);
      setError("Unable to load comparison. Please try again.");
      
      // Try loading from cache
      const cacheKey = `compare_cache_${ids.join(',')}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setFilaments(JSON.parse(cached));
        toast.info("Showing cached data", {
          description: "Some information may be outdated"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilaments();
  }, [searchParams, compareItems]);

  const handleBack = () => {
    const lastParams = sessionStorage.getItem('finder_last_params');
    navigate(lastParams ? `/?${lastParams}` : '/');
  };

  const getShareUrl = () => window.location.href;
  const getShareText = () => {
    if (filaments.length >= 2) {
      const names = filaments.map(f => `${f.vendor} ${f.material}`).slice(0, 3);
      const label = names.length > 2 ? `${names.slice(0, 2).join(', ')} & more` : names.join(' vs ');
      return `Comparing ${label} on FilaScope`;
    }
    return "Check out this filament comparison on FilaScope";
  };

  const handleAddMore = () => {
    const lastParams = sessionStorage.getItem('finder_last_params');
    navigate(lastParams ? `/?${lastParams}` : '/');
  };

  // Render comparison loading state
  const renderComparisonLoading = () => (
    <div className="py-8">
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-5 w-96 mb-8" />
      <div className="grid gap-4 grid-cols-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg mb-6" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );

  // Render comparison error state
  const renderComparisonError = () => (
    <Card className="bg-destructive/10 border-destructive/30">
      <CardContent className="py-12 text-center">
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
        <p className="text-destructive font-medium text-lg mb-2">{error}</p>
        <p className="text-muted-foreground text-sm mb-6">Check your connection and try again</p>
        <Button onClick={fetchFilaments} className="gap-2">
          <RefreshCcw className="w-4 h-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );

  // Render empty comparison state
  const renderComparisonEmpty = () => (
    <FilamentComparisonEmptyState onBrowseMaterials={handleBack} />
  );

  // Handle removing a filament from comparison - sync both URL and context
  const handleRemoveFilament = (id: string) => {
    // Remove from context as well
    removeFromContext(id);
    
    const currentIds = searchParams.get("ids")?.split(",") || [];
    const newIds = currentIds.filter(fid => fid !== id);
    const newParams = new URLSearchParams(searchParams);
    if (newIds.length > 0) {
      newParams.set("ids", newIds.join(","));
    } else {
      newParams.delete("ids");
    }
    setSearchParams(newParams);
  };

  // Use regional prices for best price calculation
  const pricesPerKg = filaments.map(f => resolvedPrices.get(f.id)?.pricePerKg ?? null);
  const bestPriceIndices = regionalBestPriceIndices;

  // Find best values: "higher" = higher is better, "lower" = lower is better
  const findBestIndices = (values: (string | number | null | boolean)[], mode: CompareMode): number[] => {
    if (mode === "none") return [];
    
    const numericValues = values.map(v => {
      if (v === null || v === undefined) return null;
      if (typeof v === "boolean") return v ? 1 : 0;
      if (typeof v === "number") return v;
      const parsed = parseFloat(String(v));
      return isNaN(parsed) ? null : parsed;
    });

    const validValues = numericValues.filter((v): v is number => v !== null);
    if (validValues.length === 0) return [];

    const bestValue = mode === "higher" 
      ? Math.max(...validValues) 
      : Math.min(...validValues);

    // Find all indices that have the best value (handles ties)
    return numericValues
      .map((v, idx) => (v === bestValue ? idx : -1))
      .filter(idx => idx !== -1);
  };

  // Define all comparison categories for win counting
  type ComparisonCategory = {
    label: string;
    values: (string | number | null | boolean)[];
    mode: CompareMode;
  };

  const allCategories: ComparisonCategory[] = [
    // Price (special case - lower is better)
    { label: "Price per kg", values: pricesPerKg, mode: "lower" },
    // Print Settings
    { label: "Nozzle Temp Min", values: filaments.map(f => f.nozzle_temp_min_c), mode: "lower" },
    { label: "Bed Temp Min", values: filaments.map(f => f.bed_temp_min_c), mode: "lower" },
    { label: "Max Print Speed", values: filaments.map(f => f.print_speed_max_mms), mode: "higher" },
    // Material Properties
    { label: "Tensile Strength", values: filaments.map(f => f.tensile_strength_xy_mpa), mode: "higher" },
    { label: "Tensile Modulus", values: filaments.map(f => f.tensile_modulus_xy_mpa), mode: "higher" },
    { label: "Elongation at Break", values: filaments.map(f => f.elongation_break_xy_percent), mode: "higher" },
    { label: "Flexural Strength", values: filaments.map(f => f.flexural_strength_mpa), mode: "higher" },
    { label: "Shore Hardness", values: filaments.map(f => f.shore_hardness_d), mode: "higher" },
    { label: "Glass Transition Temp", values: filaments.map(f => f.tg_c), mode: "higher" },
    { label: "Density", values: filaments.map(f => f.density_g_cm3), mode: "lower" },
    // Performance Scores
    { label: "Ease of Printing", values: filaments.map(f => f.ease_of_printing_score), mode: "higher" },
    { label: "Dimensional Accuracy", values: filaments.map(f => f.dimensional_accuracy_score), mode: "higher" },
    { label: "Strength Index", values: filaments.map(f => f.strength_index), mode: "higher" },
    { label: "Printability Index", values: filaments.map(f => f.printability_index), mode: "higher" },
    { label: "Value Score", values: filaments.map(f => f.value_score), mode: "higher" },
    // Spool
    { label: "Net Weight", values: filaments.map(f => f.net_weight_g), mode: "higher" },
    { label: "AMS Compatible", values: filaments.map(f => f.spool_ams_fit), mode: "higher" },
    // Care
    { label: "Nozzle Abrasive", values: filaments.map(f => f.is_nozzle_abrasive), mode: "lower" },
    { label: "Drying Temperature", values: filaments.map(f => f.drying_temp_c), mode: "lower" },
    { label: "Drying Time", values: filaments.map(f => f.drying_time_hours), mode: "lower" },
  ];

  // Count wins for each filament
  const winCounts = filaments.map((_, idx) => {
    let wins = 0;
    allCategories.forEach(cat => {
      const bestIndices = findBestIndices(cat.values, cat.mode);
      if (bestIndices.includes(idx)) wins++;
    });
    return wins;
  });

  const maxWins = Math.max(...winCounts);
  const overallWinnerIndices = winCounts
    .map((count, idx) => (count === maxWins ? idx : -1))
    .filter(idx => idx !== -1);
  
  const totalCategories = allCategories.filter(cat => {
    const bestIndices = findBestIndices(cat.values, cat.mode);
    return bestIndices.length > 0;
  }).length;

  // Prepare radar chart data - normalize values to 0-100 scale
  const radarMetrics = [
    { key: "strength", label: "Strength", getValue: (f: Filament) => f.strength_index, mode: "higher" as CompareMode },
    { key: "printability", label: "Printability", getValue: (f: Filament) => f.printability_index, mode: "higher" as CompareMode },
    { key: "value", label: "Value", getValue: (f: Filament) => f.value_score, mode: "higher" as CompareMode },
    { key: "heatResist", label: "Heat Resistance", getValue: (f: Filament) => f.tg_c, mode: "higher" as CompareMode },
    { key: "flexibility", label: "Flexibility", getValue: (f: Filament) => f.elongation_break_xy_percent, mode: "higher" as CompareMode },
    { key: "easeOfPrint", label: "Ease of Printing", getValue: (f: Filament) => f.ease_of_printing_score, mode: "higher" as CompareMode },
  ];

  const normalizeValue = (value: number | null, allValues: (number | null)[], mode: CompareMode): number => {
    if (value === null) return 0;
    const validValues = allValues.filter((v): v is number => v !== null);
    if (validValues.length === 0) return 0;
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    if (max === min) return 50;
    const normalized = ((value - min) / (max - min)) * 100;
    return mode === "lower" ? 100 - normalized : normalized;
  };

  const radarData = radarMetrics.map(metric => {
    const allValues = filaments.map(f => metric.getValue(f));
    const dataPoint: Record<string, string | number> = { metric: metric.label };
    filaments.forEach((f, idx) => {
      dataPoint[`filament${idx}`] = normalizeValue(metric.getValue(f), allValues, metric.mode);
    });
    return dataPoint;
  });

  // Colors for radar chart lines
  const chartColors = [
    "hsl(var(--primary))",
    "hsl(45, 93%, 47%)", // amber
    "hsl(142, 71%, 45%)", // green
    "hsl(271, 91%, 65%)", // purple
    "hsl(199, 89%, 48%)", // blue
  ];

  // Check if values are different across filaments
  const hasDifference = (values: (string | number | null | boolean)[]): boolean => {
    const validValues = values.filter(v => v !== null && v !== undefined);
    if (validValues.length < 2) return false;
    const uniqueValues = new Set(validValues.map(v => String(v)));
    return uniqueValues.size > 1;
  };

  const ComparisonRow = ({ 
    label, 
    values, 
    unit = "",
    compareMode = "none"
  }: { 
    label: string; 
    values: (string | number | null | boolean)[]; 
    unit?: string;
    compareMode?: CompareMode;
  }) => {
    const bestIndices = findBestIndices(values, compareMode);
    const isDifferent = hasDifference(values);
    
    // In diff mode, hide rows that are identical
    if (diffMode && !isDifferent) {
      return null;
    }
    
    return (
      <div 
        className={`grid gap-4 py-3 px-2 -mx-2 rounded-md transition-colors ${isDifferent ? "bg-primary/5" : ""}`} 
        style={{ gridTemplateColumns: `200px repeat(${filaments.length}, 1fr)` }}
      >
        <div className="font-medium text-sm text-muted-foreground">{label}</div>
        {values.map((value, idx) => {
          const isBest = bestIndices.includes(idx);
          const displayValue = value !== null && value !== undefined 
            ? (typeof value === "boolean" ? (value ? "Yes" : "No") : `${value}${unit}`)
            : "—";
          
          return (
            <div key={idx} className={`text-sm flex items-center justify-center gap-2 ${isBest ? "font-semibold" : ""}`}>
              {isBest && compareMode !== "none" && (
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span className={isBest && compareMode !== "none" ? "text-amber-500" : ""}>
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const maxSlots = 4;
  const emptySlots = maxSlots - filaments.length;

  return (
    <>
      <Helmet>
        <title>Compare 3D Filaments Side-by-Side | FilaScope</title>
        <meta name="description" content="Compare 3D printer filaments side by side. Specs, prices, TD values, printer compatibility & material properties. Make data-driven filament choices." />
        <meta property="og:title" content="Compare 3D Filaments Side-by-Side | FilaScope" />
        <meta property="og:description" content="Compare 3D printer filaments side by side. Specs, prices, TD values, printer compatibility & material properties. Make data-driven filament choices." />
      </Helmet>
      <div className="min-h-screen bg-background relative">
      {/* Subtle background pattern matching site design */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,207,232,0.03)_0%,_transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,0,85,0.02)_0%,_transparent_40%)] pointer-events-none" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm mb-4" aria-label="Breadcrumb">
          <a href="/learn" className="text-slate-400 hover:text-cyan-400 transition-colors">Learn</a>
          <span className="text-slate-600">/</span>
          <span className="text-foreground font-medium">Material Knowledge Base</span>
        </nav>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8">
          <div className="flex-1 min-w-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-4">
              <BookOpen className="w-4 h-4" />
              <span>KNOWLEDGE BASE</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Material <span className="text-primary">Knowledge Base</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-muted-foreground text-lg mb-4">
              Explore material reference information or compare filaments side-by-side.
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                45+ Material Types
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                12 Property Categories
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Detailed Print Settings
              </span>
            </div>
          </div>

          {/* Material Families Quick Nav */}
          <div className="hidden lg:block w-[280px] flex-shrink-0 bg-slate-800/30 border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Material Families</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {MATERIAL_CATEGORIES.map((cat) => {
                // Use short display name
                const shortName = cat.name.replace(/ Family$/i, '');
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      handleTabChange("reference");
                      // Dispatch event for MaterialReference to expand this family
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('expand-material-family', { detail: cat.name }));
                      }, 100);
                    }}
                    className="text-xs px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 cursor-pointer transition-colors"
                  >
                    {shortName}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">45+ materials · 12 categories</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Custom underline-style tabs */}
          <div className="sticky top-16 z-30 -mx-4 lg:-mx-0 px-4 lg:px-0 bg-background/95 backdrop-blur-md border-b border-border/50 mb-6">
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
              <nav className="flex gap-1 min-w-max py-3" role="tablist" aria-label="Compare page tabs">
                <button
                  role="tab"
                  aria-selected={activeTab === "reference"}
                  onClick={() => handleTabChange("reference")}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-colors touch-manipulation",
                    "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "active:scale-95 transition-transform",
                    activeTab === "reference"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BookOpen className="w-4 h-4" />
                  Material Reference
                  {activeTab === "reference" && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
                <button
                  role="tab"
                  aria-selected={activeTab === "comparison"}
                  onClick={() => handleTabChange("comparison")}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-colors touch-manipulation",
                    "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "active:scale-95 transition-transform",
                    activeTab === "comparison"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GitCompare className="w-4 h-4" />
                  Filament Comparison
                  {filaments.length > 0 && (
                    <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                      {filaments.length}
                    </span>
                  )}
                  {activeTab === "comparison" && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              </nav>
            </div>
          </div>

          <TabsContent value="reference" className="animate-in fade-in-0 duration-200">
            <MaterialReference />
          </TabsContent>

          <TabsContent value="comparison" className="animate-in fade-in-0 duration-200">
            {loading ? renderComparisonLoading() : 
             error && filaments.length === 0 ? renderComparisonError() :
             filaments.length === 0 ? renderComparisonEmpty() : (
              <>
                {/* Comparison header actions */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Compare Filaments</h2>
                    <p className="text-muted-foreground">Side-by-side comparison of {filaments.length} filaments</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {emptySlots > 0 && (
                      <Button variant="outline" onClick={handleAddMore} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add More ({emptySlots} slots)
                      </Button>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                      <Switch 
                        id="diff-mode" 
                        checked={diffMode} 
                        onCheckedChange={setDiffMode}
                      />
                      <Label htmlFor="diff-mode" className="text-sm cursor-pointer">
                        Differences only
                      </Label>
                    </div>
                    <ExportMenu filaments={filaments} />
                    <SharePopover
                      shareUrl={getShareUrl()}
                      shareText={getShareText()}
                      title="Share comparison"
                    >
                      <Button variant="outline" className="gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>
                    </SharePopover>
                  </div>
                </div>

        {/* Mobile Comparison View */}
        <MobileCompareView 
          filaments={filaments}
          winCounts={winCounts}
          bestPriceIndices={bestPriceIndices}
          overallWinnerIndices={overallWinnerIndices}
          totalCategories={totalCategories}
          resolvedPrices={resolvedPrices}
        />

        {/* Mobile Sticky Buy Bar */}
        <MobileStickyBuyBar 
          filaments={filaments}
          overallWinnerIndices={overallWinnerIndices}
          bestPriceIndices={bestPriceIndices}
          resolvedPrices={resolvedPrices}
        />

        {/* Desktop Sticky Filament Headers */}
        <div className="sticky top-0 z-20 bg-background pb-4 -mx-8 px-8 pt-2 border-b border-border/50 hidden md:block">
          <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${maxSlots}, 1fr)` }}>
            <div></div>
            {filaments.map((filament, idx) => {
              const resolved = resolvedPrices.get(filament.id);
              const inStock = resolved?.inStock ?? filament.variant_available !== false;
              const isWinner = overallWinnerIndices.includes(idx);
              const filamentSlug = filament.product_handle || filament.id;
              
              return (
                <Card key={filament.id} className={cn(
                  "bg-card border-border shadow-md relative group",
                  isWinner && "border-amber-500/50 bg-gradient-to-b from-amber-500/5 to-transparent"
                )}>
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveFilament(filament.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 hover:bg-destructive border border-gray-700 hover:border-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                    aria-label="Remove from comparison"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Winner badge */}
                      {isWinner && (
                        <div className="flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-medium text-amber-400">Winner</span>
                        </div>
                      )}
                      
                      {/* Image and brand row */}
                      <div className="flex items-start gap-3">
                        <div className="shrink-0">
                          {filament.featured_image ? (
                            <img
                              src={filament.featured_image}
                              alt={filament.product_title}
                              className="w-14 h-14 rounded-lg object-cover border border-border"
                            />
                          ) : filament.color_hex ? (
                            <div 
                              className="w-14 h-14 rounded-lg border border-border"
                              style={{ backgroundColor: filament.color_hex }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-muted border border-border flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">No img</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {filament.vendor && getBrandLogo(filament.vendor) ? (
                            <img
                              src={getBrandLogo(filament.vendor)!}
                              alt={filament.vendor}
                              className="h-5 object-contain mb-1"
                            />
                          ) : filament.vendor && (
                            <span className="text-xs text-muted-foreground">{filament.vendor}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-semibold text-sm line-clamp-2">{filament.product_title}</h3>
                      
                      {/* Material badge and price */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1 flex-wrap">
                          {filament.material && <Badge variant="outline" className="text-xs">{filament.material}</Badge>}
                        </div>
                        {resolved?.formattedPricePerKg && (
                          <div className={`text-lg font-bold shrink-0 ${bestPriceIndices.includes(idx) ? "text-amber-500" : "text-primary"}`}>
                            <div className="flex items-center gap-1">
                              {bestPriceIndices.includes(idx) && (
                                <Trophy className="w-4 h-4 shrink-0" />
                              )}
                              <span>{resolved.formattedPricePerKg}/kg</span>
                            </div>
                            {resolved.isConverted && (
                              <span className="text-[10px] text-muted-foreground font-normal">(converted)</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons row */}
                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="flex-1 gap-1.5 text-muted-foreground hover:text-primary"
                        >
                          <a href={`/filaments/${filamentSlug}`}>
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </a>
                        </Button>
                        
                        {resolved?.affiliateUrl && (
                          <Button
                            asChild
                            size="sm"
                            disabled={!inStock}
                            className={cn(
                              "flex-1 gap-1.5 font-semibold",
                              isWinner && "bg-amber-500 hover:bg-amber-400 text-amber-950",
                              !inStock && "opacity-50"
                            )}
                          >
                            <a 
                              href={resolved.affiliateUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                if (!inStock) e.preventDefault();
                              }}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              {inStock ? (resolved.storeName ? `Buy` : "Buy") : "Out"}
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {/* Empty slots */}
            {Array.from({ length: emptySlots }).map((_, idx) => (
              <Card 
                key={`empty-${idx}`} 
                className="bg-card/50 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors"
                onClick={handleAddMore}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[140px] text-muted-foreground">
                  <Plus className="w-6 h-6 mb-2" />
                  <span className="text-sm">Add Material</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Print Settings - Desktop only */}
        <Card className="mb-6 hidden md:block">
          <CardHeader>
            <CardTitle>Print Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonRow 
              label="Nozzle Temp Min" 
              values={filaments.map(f => f.nozzle_temp_min_c)} 
              unit="°C"
              compareMode="lower"
            />
            <Separator />
            <ComparisonRow 
              label="Nozzle Temp Max" 
              values={filaments.map(f => f.nozzle_temp_max_c)} 
              unit="°C"
            />
            <Separator />
            <ComparisonRow 
              label="Nozzle Temp Sweetspot" 
              values={filaments.map(f => f.nozzle_temp_sweetspot_c)} 
              unit="°C"
            />
            <Separator />
            <ComparisonRow 
              label="Bed Temp Min" 
              values={filaments.map(f => f.bed_temp_min_c)} 
              unit="°C"
              compareMode="lower"
            />
            <Separator />
            <ComparisonRow 
              label="Bed Temp Max" 
              values={filaments.map(f => f.bed_temp_max_c)} 
              unit="°C"
            />
            <Separator />
            <ComparisonRow 
              label="Max Print Speed" 
              values={filaments.map(f => f.print_speed_max_mms)} 
              unit=" mm/s"
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Fan Min" 
              values={filaments.map(f => f.fan_min_percent)} 
              unit="%"
            />
            <Separator />
            <ComparisonRow 
              label="Fan Max" 
              values={filaments.map(f => f.fan_max_percent)} 
              unit="%"
            />
          </CardContent>
        </Card>

        {/* Material Properties - Desktop only */}
        <Card className="mb-6 hidden md:block">
          <CardHeader>
            <CardTitle>Material Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonRow 
              label="Transmission Distance (TD)" 
              values={filaments.map(f => f.transmission_distance)} 
              unit=" mm"
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Tensile Strength (XY)" 
              values={filaments.map(f => f.tensile_strength_xy_mpa)} 
              unit=" MPa"
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Tensile Modulus (XY)" 
              values={filaments.map(f => f.tensile_modulus_xy_mpa)} 
              unit=" MPa"
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Elongation at Break" 
              values={filaments.map(f => f.elongation_break_xy_percent)} 
              unit="%"
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Flexural Strength" 
              values={filaments.map(f => f.flexural_strength_mpa)} 
              unit=" MPa"
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Shore Hardness D" 
              values={filaments.map(f => f.shore_hardness_d)} 
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Glass Transition Temp" 
              values={filaments.map(f => f.tg_c)} 
              unit="°C"
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Density" 
              values={filaments.map(f => f.density_g_cm3)} 
              unit=" g/cm³"
              compareMode="lower"
            />
          </CardContent>
        </Card>

        {/* Scores & Ratings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonRow 
              label="Ease of Printing" 
              values={filaments.map(f => f.ease_of_printing_score)} 
              unit="/10"
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Dimensional Accuracy" 
              values={filaments.map(f => f.dimensional_accuracy_score)} 
              unit="/10"
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Strength Index" 
              values={filaments.map(f => f.strength_index)} 
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Printability Index" 
              values={filaments.map(f => f.printability_index)} 
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Value Score" 
              values={filaments.map(f => f.value_score)} 
              compareMode="higher"
            />
          </CardContent>
        </Card>

        {/* Spool Specifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Spool Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonRow 
              label="Net Weight" 
              values={filaments.map(f => f.net_weight_g)} 
              unit="g"
              compareMode="higher"
            />
            <Separator />
            <ComparisonRow 
              label="Diameter" 
              values={filaments.map(f => f.diameter_nominal_mm)} 
              unit=" mm"
            />
            <Separator />
            <ComparisonRow 
              label="Spool Outer Diameter" 
              values={filaments.map(f => f.spool_outer_d_mm)} 
              unit=" mm"
            />
            <Separator />
            <ComparisonRow 
              label="Spool Width" 
              values={filaments.map(f => f.spool_width_mm)} 
              unit=" mm"
            />
            <Separator />
            <ComparisonRow 
              label="AMS Compatible" 
              values={filaments.map(f => f.spool_ams_fit)} 
              compareMode="higher"
            />
          </CardContent>
        </Card>

        {/* Compatibility & Care */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Compatibility & Care</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonRow 
              label="Nozzle Abrasive" 
              values={filaments.map(f => f.is_nozzle_abrasive)} 
              compareMode="lower"
            />
            <Separator />
            <ComparisonRow 
              label="Recommended Nozzle" 
              values={filaments.map(f => f.recommended_nozzle_type)} 
            />
            <Separator />
            <ComparisonRow 
              label="Food Contact Rating" 
              values={filaments.map(f => f.food_contact_rating)} 
            />
            <Separator />
            <ComparisonRow 
              label="Drying Temperature" 
              values={filaments.map(f => f.drying_temp_c)} 
              unit="°C"
              compareMode="lower"
            />
            <Separator />
            <ComparisonRow 
              label="Drying Time" 
              values={filaments.map(f => f.drying_time_hours)} 
              unit=" hours"
              compareMode="lower"
            />
            <Separator />
            <ComparisonRow 
              label="Moisture Sensitivity" 
              values={filaments.map(f => f.moisture_sensitivity_level)} 
            />
          </CardContent>
        </Card>

        {/* Overall Winner Summary */}
        <Card className="mb-6 border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-amber-500" />
              Overall Winner Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${filaments.length}, 1fr)` }}>
              {filaments.map((filament, idx) => {
                const isOverallWinner = overallWinnerIndices.includes(idx);
                return (
                  <div 
                    key={filament.id} 
                    className={`p-4 rounded-lg text-center ${
                      isOverallWinner 
                        ? "bg-amber-500/20 border-2 border-amber-500" 
                        : "bg-muted/50 border border-border"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {isOverallWinner && <Trophy className="w-6 h-6 text-amber-500" />}
                      <span className={`text-3xl font-bold ${isOverallWinner ? "text-amber-500" : "text-foreground"}`}>
                        {winCounts[idx]}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      wins out of {totalCategories}
                    </div>
                    <div className="text-xs font-medium mt-1 line-clamp-1">
                      {filament.product_title}
                    </div>
                    {isOverallWinner && (
                      <Badge className="mt-2 bg-amber-500 text-amber-950 hover:bg-amber-400">
                        Overall Winner
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart Visualization */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickCount={5}
                  />
                  {filaments.map((filament, idx) => (
                    <Radar
                      key={filament.id}
                      name={filament.product_title?.substring(0, 30) || `Filament ${idx + 1}`}
                      dataKey={`filament${idx}`}
                      stroke={chartColors[idx % chartColors.length]}
                      fill={chartColors[idx % chartColors.length]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number) => [`${Math.round(value)}%`, "Score"]}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Values normalized to 0-100% scale relative to compared filaments
            </p>
          </CardContent>
        </Card>

        {/* Bar Chart - Raw Values Comparison */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Direct Value Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Strength Metrics */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Mechanical Properties</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          metric: "Tensile Strength (MPa)",
                          ...Object.fromEntries(filaments.map((f, i) => [`f${i}`, f.tensile_strength_xy_mpa || 0]))
                        },
                        {
                          metric: "Flexural Strength (MPa)",
                          ...Object.fromEntries(filaments.map((f, i) => [`f${i}`, f.flexural_strength_mpa || 0]))
                        },
                        {
                          metric: "Elongation (%)",
                          ...Object.fromEntries(filaments.map((f, i) => [`f${i}`, f.elongation_break_xy_percent || 0]))
                        },
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      {filaments.map((f, idx) => (
                        <Bar key={f.id} dataKey={`f${idx}`} name={f.product_title?.substring(0, 25) || `Filament ${idx + 1}`} fill={chartColors[idx % chartColors.length]} />
                      ))}
                      <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Scores */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Performance Scores</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          metric: "Strength Index",
                          ...Object.fromEntries(filaments.map((f, i) => [`f${i}`, f.strength_index || 0]))
                        },
                        {
                          metric: "Printability",
                          ...Object.fromEntries(filaments.map((f, i) => [`f${i}`, f.printability_index || 0]))
                        },
                        {
                          metric: "Value Score",
                          ...Object.fromEntries(filaments.map((f, i) => [`f${i}`, f.value_score || 0]))
                        },
                        {
                          metric: "Ease of Print",
                          ...Object.fromEntries(filaments.map((f, i) => [`f${i}`, f.ease_of_printing_score || 0]))
                        },
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      {filaments.map((f, idx) => (
                        <Bar key={f.id} dataKey={`f${idx}`} name={f.product_title?.substring(0, 25) || `Filament ${idx + 1}`} fill={chartColors[idx % chartColors.length]} />
                      ))}
                      <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Thermal Properties */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Thermal & Print Settings</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          metric: "Glass Transition (°C)",
                          ...Object.fromEntries(filaments.map((f, i) => [`f${i}`, f.tg_c || 0]))
                        },
                        {
                          metric: "Max Nozzle Temp (°C)",
                          ...Object.fromEntries(filaments.map((f, i) => [`f${i}`, f.nozzle_temp_max_c || 0]))
                        },
                        {
                          metric: "Max Print Speed (mm/s)",
                          ...Object.fromEntries(filaments.map((f, i) => [`f${i}`, f.print_speed_max_mms || 0]))
                        },
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      {filaments.map((f, idx) => (
                        <Bar key={f.id} dataKey={`f${idx}`} name={f.product_title?.substring(0, 25) || `Filament ${idx + 1}`} fill={chartColors[idx % chartColors.length]} />
                      ))}
                      <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
};

export default Compare;

// Filament comparison page
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { GitCompare, ArrowLeft, Trophy, Share2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getBrandLogo } from "@/lib/brandLogos";
import { ExportMenu } from "@/components/compare/ExportMenu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilaments = async () => {
      const ids = searchParams.get("ids")?.split(",") || [];
      
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .in("id", ids);

      if (error) {
        console.error("Error fetching filaments:", error);
      } else {
        setFilaments(data || []);
      }
      setLoading(false);
    };

    fetchFilaments();
  }, [searchParams]);

  const handleBack = () => {
    const lastParams = sessionStorage.getItem('finder_last_params');
    navigate(lastParams ? `/?${lastParams}` : '/');
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!", {
        description: "Share this comparison with others"
      });
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleAddMore = () => {
    const lastParams = sessionStorage.getItem('finder_last_params');
    navigate(lastParams ? `/?${lastParams}` : '/');
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-6 w-48 mb-6" />
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
      </div>
    );
  }

  if (filaments.length === 0) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Materials
          </Button>
          
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <GitCompare className="w-6 h-6 text-primary" />
                Select Filaments to Compare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>No filaments selected for comparison</p>
                <p className="text-sm mt-2">Select filaments from the Materials page to compare their properties</p>
                <Button onClick={handleBack} className="mt-4">
                  Browse Materials
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getPricePerKg = (price: number | null, weight: number | null): number | null => {
    if (!price || !weight) return null;
    return (price / weight) * 1000;
  };

  const getPricePerKgFormatted = (price: number | null, weight: number | null): string | null => {
    const pricePerKg = getPricePerKg(price, weight);
    return pricePerKg !== null ? pricePerKg.toFixed(2) : null;
  };

  // Find the index of the filament with the best (lowest) price per kg
  const pricesPerKg = filaments.map(f => getPricePerKg(f.variant_price, f.net_weight_g));
  const validPrices = pricesPerKg.filter((p): p is number => p !== null);
  const bestPricePerKg = validPrices.length > 0 ? Math.min(...validPrices) : null;
  const bestPriceIndices = pricesPerKg
    .map((p, idx) => (p !== null && p === bestPricePerKg ? idx : -1))
    .filter(idx => idx !== -1);

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
    <div className="min-h-screen p-8 compare-page-enter">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={handleBack} className="cursor-pointer hover:text-primary">
                Materials
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Comparison</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header with actions */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={handleBack} className="mb-4 -ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Materials
            </Button>
            <h1 className="text-4xl font-bold mb-2">Compare Filaments</h1>
            <p className="text-muted-foreground">Side-by-side comparison of {filaments.length} filaments</p>
          </div>
          <div className="flex items-center gap-3">
            {emptySlots > 0 && (
              <Button variant="outline" onClick={handleAddMore} className="gap-2">
                <Plus className="w-4 h-4" />
                Add More ({emptySlots} slots)
              </Button>
            )}
            <ExportMenu filaments={filaments} />
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Sticky Filament Headers */}
        <div className="sticky top-0 z-20 bg-background pb-4 -mx-8 px-8 pt-2 border-b border-border/50">
          <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${maxSlots}, 1fr)` }}>
            <div></div>
            {filaments.map((filament) => (
              <Card key={filament.id} className="bg-card border-border shadow-md">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {filament.color_hex && (
                        <div 
                          className="w-8 h-8 rounded-full border border-border shrink-0"
                          style={{ backgroundColor: filament.color_hex }}
                        />
                      )}
                      {filament.vendor && getBrandLogo(filament.vendor) && (
                        <img
                          src={getBrandLogo(filament.vendor)!}
                          alt={filament.vendor}
                          className="h-6 object-contain shrink-0"
                        />
                      )}
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2">{filament.product_title}</h3>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-1 flex-wrap">
                        {filament.material && <Badge variant="outline" className="text-xs">{filament.material}</Badge>}
                      </div>
                      {filament.variant_price && filament.net_weight_g && (
                        <div className={`text-lg font-bold shrink-0 ${bestPriceIndices.includes(filaments.indexOf(filament)) ? "text-amber-500" : "text-primary"}`}>
                          <div className="flex items-center gap-1">
                            {bestPriceIndices.includes(filaments.indexOf(filament)) && (
                              <Trophy className="w-4 h-4 shrink-0" />
                            )}
                            <span>${getPricePerKgFormatted(filament.variant_price, filament.net_weight_g)}/kg</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Empty slots */}
            {Array.from({ length: emptySlots }).map((_, idx) => (
              <Card 
                key={`empty-${idx}`} 
                className="bg-card/50 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors"
                onClick={handleAddMore}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[120px] text-muted-foreground">
                  <Plus className="w-6 h-6 mb-2" />
                  <span className="text-sm">Add Material</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Print Settings */}
        <Card className="mb-6">
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

        {/* Material Properties */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Material Properties</CardTitle>
          </CardHeader>
          <CardContent>
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
      </div>
    </div>
  );
};

export default Compare;

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Printer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrinterProfileCard } from "./PrinterProfileCard";

interface GuidedPrinterWizardProps {
  onSelect: (printerId: string, brand: string, modelName: string) => void;
  onBack: () => void;
}

// Brand info with logos
const BRAND_INFO: Record<string, { logo?: string; description: string }> = {
  "Bambu Lab": { description: "High-speed enclosed printers" },
  "Prusa Research": { description: "Reliable open-source printers" },
  "Creality": { description: "Wide range of affordable options" },
  "Anycubic": { description: "FDM and resin printers" },
  "Elegoo": { description: "Budget-friendly resin experts" },
  "QIDI": { description: "Enclosed industrial-quality" },
  "Sovol": { description: "Feature-packed value printers" },
  "FlashForge": { description: "Professional desktop printers" },
};

const TOP_BRANDS = Object.keys(BRAND_INFO);

type WizardStep = "brand" | "series" | "model";

export function GuidedPrinterWizard({ onSelect, onBack }: GuidedPrinterWizardProps) {
  const [step, setStep] = useState<WizardStep>("brand");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

  // Fetch all brands
  const { data: brands } = useQuery({
    queryKey: ["wizard-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_brands")
        .select("brand")
        .order("brand");
      if (error) throw error;
      return data.map((b) => b.brand);
    },
  });

  // Fetch series for selected brand
  const { data: series, isLoading: seriesLoading } = useQuery({
    queryKey: ["wizard-series", selectedBrand],
    enabled: !!selectedBrand && step === "series",
    queryFn: async () => {
      const { data: brandData } = await supabase
        .from("printer_brands")
        .select("id")
        .eq("brand", selectedBrand!)
        .single();

      if (!brandData) return [];

      const { data, error } = await supabase
        .from("printer_series")
        .select("series_name")
        .eq("brand_id", brandData.id)
        .order("series_name");

      if (error) throw error;
      return data.map((s) => s.series_name);
    },
  });

  // Fetch models for selected brand/series
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ["wizard-models", selectedBrand, selectedSeries],
    enabled: !!selectedBrand && step === "model",
    queryFn: async () => {
      const { data: brandData } = await supabase
        .from("printer_brands")
        .select("id")
        .eq("brand", selectedBrand!)
        .single();

      if (!brandData) return [];

      let query = supabase
        .from("printers")
        .select(`
          printer_id,
          model_name,
          scraped_data,
          build_volume_x_mm,
          build_volume_y_mm,
          build_volume_z_mm,
          max_nozzle_temp_c,
          current_price_usd_store,
          series:printer_series(series_name)
        `)
        .eq("brand_id", brandData.id)
        .eq("status", "active")
        .order("model_name");

      if (selectedSeries) {
        const { data: seriesData } = await supabase
          .from("printer_series")
          .select("id")
          .eq("brand_id", brandData.id)
          .eq("series_name", selectedSeries)
          .single();

        if (seriesData) {
          query = query.eq("series_id", seriesData.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Sort brands: top brands first
  const sortedBrands = useMemo(() => {
    if (!brands) return TOP_BRANDS;
    const topSet = new Set(TOP_BRANDS);
    const top = TOP_BRANDS.filter((b) => brands.includes(b));
    const others = brands.filter((b) => !topSet.has(b)).sort();
    return [...top, ...others];
  }, [brands]);

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedSeries(null);
    // Check if brand has series, if not skip to models
    setStep("series");
  };

  const handleSeriesSelect = (seriesName: string | null) => {
    setSelectedSeries(seriesName);
    setStep("model");
  };

  const handleModelSelect = (printer: {
    printer_id: string;
    model_name: string;
  }) => {
    onSelect(printer.printer_id, selectedBrand || "", printer.model_name);
  };

  const handleBack = () => {
    if (step === "model") {
      // If we skipped series (no series available), go back to brand
      if (!series || series.length === 0) {
        setStep("brand");
      } else {
        setStep("series");
      }
    } else if (step === "series") {
      setStep("brand");
    } else {
      onBack();
    }
  };

  // Auto-skip series if none available
  useMemo(() => {
    if (step === "series" && series !== undefined && series.length === 0) {
      setStep("model");
    }
  }, [series, step]);

  return (
    <div className="space-y-4">
      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-6">
        {["brand", "series", "model"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step === s
                  ? "bg-primary text-primary-foreground"
                  : i < ["brand", "series", "model"].indexOf(step)
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
            {i < 2 && (
              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
            )}
          </div>
        ))}
        <span className="text-sm text-muted-foreground ml-2">
          {step === "brand" && "Choose your brand"}
          {step === "series" && "Select series"}
          {step === "model" && "Pick your model"}
        </span>
      </div>

      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5">
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Step Content */}
      {step === "brand" && (
        <div className="grid grid-cols-2 gap-3">
          {sortedBrands.slice(0, 12).map((brand) => (
            <button
              key={brand}
              onClick={() => handleBrandSelect(brand)}
              className={cn(
                "flex flex-col items-start p-4 rounded-lg border transition-all text-left",
                "hover:bg-primary/5 hover:border-primary/30",
                "border-border/50 bg-card"
              )}
            >
              <span className="font-medium text-foreground">{brand}</span>
              {BRAND_INFO[brand] && (
                <span className="text-xs text-muted-foreground mt-1">
                  {BRAND_INFO[brand].description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {step === "series" && (
        <>
          {seriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : series && series.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSeriesSelect(null)}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-left"
              >
                <span className="font-medium text-foreground">All Models</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              {series.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSeriesSelect(s)}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-left"
                >
                  <span className="font-medium text-foreground">{s}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}

      {step === "model" && (
        <>
          {modelsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : models && models.length > 0 ? (
            <div className="space-y-2">
              {models.map((printer) => {
                const scrapedData = printer.scraped_data as { images?: { product_images?: string[] } } | null;
                return (
                  <PrinterProfileCard
                    key={printer.printer_id}
                    printerId={printer.printer_id}
                    modelName={printer.model_name}
                    brand={selectedBrand || ""}
                    imageUrl={scrapedData?.images?.product_images?.[0]}
                    buildVolume={
                      printer.build_volume_x_mm && printer.build_volume_y_mm && printer.build_volume_z_mm
                        ? {
                            x: printer.build_volume_x_mm,
                            y: printer.build_volume_y_mm,
                            z: printer.build_volume_z_mm,
                          }
                        : undefined
                    }
                    maxTemp={printer.max_nozzle_temp_c || undefined}
                    price={printer.current_price_usd_store || undefined}
                    onClick={() => handleModelSelect(printer)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Printer className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No models found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"];
type PrinterBrand = Database["public"]["Tables"]["printer_brands"]["Row"];
type PrinterAccessory = Database["public"]["Tables"]["printer_accessories"]["Row"];

export function usePrinterSelection() {
  const [selectedBrand, setSelectedBrand] = useState<string>(() => {
    return localStorage.getItem("selected_printer_brand") || "";
  });
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>(() => {
    return localStorage.getItem("selected_printer_id") || "";
  });
  const [selectedHotendId, setSelectedHotendId] = useState<string>(() => {
    return localStorage.getItem("selected_hotend_id") || "";
  });
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Fetch brands
  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ["printer-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_brands")
        .select("*")
        .order("brand");
      
      if (error) throw error;
      return data as PrinterBrand[];
    },
  });

  // Fetch models for selected brand
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ["printer-models", selectedBrand],
    enabled: !!selectedBrand,
    queryFn: async () => {
      const { data: brandData } = await supabase
        .from("printer_brands")
        .select("id")
        .eq("brand", selectedBrand)
        .single();

      if (!brandData) return [];

      const { data, error } = await supabase
        .from("printers")
        .select(`
          *,
          series:printer_series(series_name)
        `)
        .eq("brand_id", brandData.id)
        .order("model_name");
      
      if (error) throw error;
      return data as (Printer & { series: { series_name: string } | null })[];
    },
  });

  // Fetch full printer details when selected
  const { data: selectedPrinter, isLoading: printerLoading } = useQuery({
    queryKey: ["printer-details", selectedPrinterId],
    enabled: !!selectedPrinterId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers")
        .select(`
          *,
          brand:printer_brands(brand),
          series:printer_series(series_name)
        `)
        .eq("printer_id", selectedPrinterId)
        .single();
      
      if (error) throw error;
      return data as Printer & {
        brand: { brand: string } | null;
        series: { series_name: string } | null;
      };
    },
  });

  // Fetch compatible hotends for selected printer
  const { data: compatibleHotends, isLoading: hotendsLoading } = useQuery({
    queryKey: ["compatible-hotends", selectedPrinterId, selectedBrand],
    enabled: !!selectedPrinterId && !!selectedPrinter,
    queryFn: async () => {
      if (!selectedPrinter) return [];

      const printerBrand = selectedPrinter.brand?.brand || selectedBrand;
      const printerModel = selectedPrinter.model_name;

      // Fetch hotends that are compatible with this printer
      const { data, error } = await supabase
        .from("printer_accessories")
        .select("*")
        .eq("accessory_type", "hotend");

      if (error) throw error;

      // Helper function to check if a model string matches the printer
      const modelMatches = (modelStr: string): boolean => {
        if (!modelStr) return false;
        const modelLower = modelStr.toLowerCase().trim();
        const printerModelLower = printerModel.toLowerCase();
        
        // Check for exact or partial match
        return printerModelLower.includes(modelLower) || 
               modelLower.includes(printerModelLower) ||
               // Check for series matches like "X1" matching "X1 Carbon"
               printerModelLower.split(/[\s-]+/).some(part => 
                 part.length >= 2 && modelLower.includes(part)
               );
      };

      // Filter hotends based on model-level compatibility
      const filtered = (data || []).filter((hotend) => {
        const specs = hotend.specs as Record<string, unknown> | null;
        
        // Priority 1: Check specs.compatible_models (array or comma-separated string)
        if (specs?.compatible_models) {
          const models = specs.compatible_models;
          if (Array.isArray(models)) {
            if (models.some(m => modelMatches(String(m)))) return true;
          } else if (typeof models === 'string') {
            const modelList = models.split(',').map(m => m.trim());
            if (modelList.some(m => modelMatches(m))) return true;
          }
        }

        // Priority 2: Check specs.compatible_printers (string with model names)
        if (specs?.compatible_printers) {
          const printers = String(specs.compatible_printers);
          const printerList = printers.split(',').map(p => p.trim());
          if (printerList.some(p => modelMatches(p))) return true;
        }

        // Priority 3: Check if hotend brand matches printer brand AND no specific model restrictions
        if (hotend.brand === printerBrand) {
          // Only include if there are no model restrictions, or we matched above
          const hasModelRestrictions = specs?.compatible_models || specs?.compatible_printers;
          if (!hasModelRestrictions) {
            // Generic brand-level compatibility (no specific models defined)
            return true;
          }
        }

        // Priority 4: Check compatible_printer_brands with "Universal" support
        if (hotend.compatible_printer_brands?.includes("Universal")) {
          return true;
        }

        return false;
      });

      // Sort by brand: printer brand first, then alphabetically by brand, then by name
      const sorted = filtered.sort((a, b) => {
        const aIsPrinterBrand = a.brand === printerBrand;
        const bIsPrinterBrand = b.brand === printerBrand;

        // Printer brand hotends come first
        if (aIsPrinterBrand && !bIsPrinterBrand) return -1;
        if (!aIsPrinterBrand && bIsPrinterBrand) return 1;

        // Then sort by brand name alphabetically
        const brandCompare = (a.brand || "").localeCompare(b.brand || "");
        if (brandCompare !== 0) return brandCompare;

        // Finally sort by hotend name
        return (a.name || "").localeCompare(b.name || "");
      });

      return sorted as PrinterAccessory[];
    },
  });

  // Fetch selected hotend details
  const { data: selectedHotend, isLoading: hotendLoading } = useQuery({
    queryKey: ["hotend-details", selectedHotendId],
    enabled: !!selectedHotendId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_accessories")
        .select("*")
        .eq("id", selectedHotendId)
        .single();

      if (error) throw error;
      return data as PrinterAccessory;
    },
  });

  // Clear model selection when brand changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
    } else {
      setSelectedPrinterId("");
      setSelectedHotendId("");
    }
  }, [selectedBrand]);

  // Clear hotend selection when printer changes (but not on initial mount)
  useEffect(() => {
    if (!isInitialMount && selectedPrinterId) {
      setSelectedHotendId("");
    }
  }, [selectedPrinterId]);

  // Store selection in localStorage
  useEffect(() => {
    if (selectedBrand) {
      localStorage.setItem("selected_printer_brand", selectedBrand);
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedPrinterId) {
      localStorage.setItem("selected_printer_id", selectedPrinterId);
    }
  }, [selectedPrinterId]);

  useEffect(() => {
    if (selectedHotendId) {
      localStorage.setItem("selected_hotend_id", selectedHotendId);
    } else {
      localStorage.removeItem("selected_hotend_id");
    }
  }, [selectedHotendId]);

  return {
    brands,
    brandsLoading,
    selectedBrand,
    setSelectedBrand,
    models,
    modelsLoading,
    selectedPrinterId,
    setSelectedPrinterId,
    selectedPrinter,
    printerLoading,
    compatibleHotends,
    hotendsLoading,
    selectedHotendId,
    setSelectedHotendId,
    selectedHotend,
    hotendLoading,
  };
}

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

      // Filter hotends based on compatibility
      const filtered = (data || []).filter((hotend) => {
        // Check compatible_printer_brands array
        if (hotend.compatible_printer_brands?.includes(printerBrand)) {
          return true;
        }

        // Check specs.compatible_models if available
        const specs = hotend.specs as Record<string, unknown> | null;
        if (specs?.compatible_models) {
          const compatibleModels = specs.compatible_models as string[];
          if (Array.isArray(compatibleModels)) {
            return compatibleModels.some((model) =>
              printerModel.toLowerCase().includes(model.toLowerCase()) ||
              model.toLowerCase().includes(printerModel.toLowerCase())
            );
          }
        }

        // Check if brand matches the hotend brand
        if (hotend.brand === printerBrand) {
          return true;
        }

        return false;
      });

      return filtered as PrinterAccessory[];
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

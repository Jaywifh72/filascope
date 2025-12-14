import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"];
type PrinterBrand = Database["public"]["Tables"]["printer_brands"]["Row"];
type PrinterAccessory = Database["public"]["Tables"]["printer_accessories"]["Row"];
type PrinterFirmware = Database["public"]["Tables"]["printer_firmware"]["Row"];

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
  const [selectedFirmwareVersion, setSelectedFirmwareVersion] = useState<string>(() => {
    return localStorage.getItem("selected_firmware_version") || "";
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

  // Fetch firmware versions for selected printer
  const { data: firmwareVersions, isLoading: firmwareLoading } = useQuery({
    queryKey: ["printer-firmware-versions", selectedPrinter?.id],
    enabled: !!selectedPrinter?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_firmware")
        .select("*")
        .eq("printer_id", selectedPrinter!.id)
        .order("release_date", { ascending: false });

      if (error) throw error;
      return data as PrinterFirmware[];
    },
  });

  // Get latest firmware version
  const latestFirmware = firmwareVersions?.[0] || null;
  
  // Check if there's a newer firmware available
  const hasNewerFirmware = selectedFirmwareVersion && latestFirmware && 
    selectedFirmwareVersion !== latestFirmware.version;

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
        
        // Exact match
        if (modelLower === printerModelLower) return true;
        
        // Check if model is contained in printer name or vice versa
        if (printerModelLower.includes(modelLower) && modelLower.length >= 2) return true;
        if (modelLower.includes(printerModelLower)) return true;
        
        return false;
      };

      // Helper to extract series info from hotend name like "(X1/P1)" or "(A1)" or "(H2/P2S)"
      const extractSeriesFromName = (name: string): string[] => {
        const match = name.match(/\(([^)]+)\)\s*$/);
        if (!match) return [];
        // Split by "/" and clean up
        return match[1].split('/').map(s => s.trim().toLowerCase());
      };

      // Helper to check if printer model matches any series in the list
      const matchesSeries = (seriesList: string[], printerModelLower: string): boolean => {
        return seriesList.some(series => {
          // Direct match: "p2s" matches "p2s"
          if (printerModelLower.includes(series) || series.includes(printerModelLower)) {
            return true;
          }
          // Series family match: "x1" matches "x1 carbon", "p1" matches "p1s", "p1p"
          if (printerModelLower.startsWith(series) || 
              printerModelLower.replace(/\s+/g, '').startsWith(series)) {
            return true;
          }
          return false;
        });
      };

      // Filter hotends based on model-level compatibility
      const filtered = (data || []).filter((hotend) => {
        const specs = hotend.specs as Record<string, unknown> | null;
        const printerModelLower = printerModel.toLowerCase();
        
        // Priority 1: Check specs.compatible_models (array or comma-separated string)
        if (specs?.compatible_models) {
          const models = specs.compatible_models;
          if (Array.isArray(models)) {
            if (models.some(m => modelMatches(String(m)))) return true;
          } else if (typeof models === 'string') {
            const modelList = models.split(',').map(m => m.trim());
            if (modelList.some(m => modelMatches(m))) return true;
          }
          // If compatible_models is defined but doesn't match, don't include
          return false;
        }

        // Priority 2: Check specs.compatible_printers (string with model names)
        if (specs?.compatible_printers) {
          const printers = String(specs.compatible_printers);
          const printerList = printers.split(',').map(p => p.trim());
          if (printerList.some(p => modelMatches(p))) return true;
          // If compatible_printers is defined but doesn't match, don't include
          return false;
        }

        // Priority 3: For brand-matching hotends, check series info in the name
        if (hotend.brand === printerBrand || hotend.compatible_printer_brands?.includes(printerBrand)) {
          const seriesFromName = extractSeriesFromName(hotend.name);
          if (seriesFromName.length > 0) {
            // Has series info in name - must match
            return matchesSeries(seriesFromName, printerModelLower);
          }
          // No series info in name - this is a generic hotend for the brand, include it
          return true;
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
      setSelectedFirmwareVersion("");
    }
  }, [selectedBrand]);

  // Clear hotend and firmware selection when printer changes (but not on initial mount)
  useEffect(() => {
    if (!isInitialMount && selectedPrinterId) {
      setSelectedHotendId("");
      setSelectedFirmwareVersion("");
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

  useEffect(() => {
    if (selectedFirmwareVersion) {
      localStorage.setItem("selected_firmware_version", selectedFirmwareVersion);
    } else {
      localStorage.removeItem("selected_firmware_version");
    }
  }, [selectedFirmwareVersion]);

  // Clear printer selection
  const clearPrinter = () => {
    setSelectedBrand("");
    setSelectedPrinterId("");
    setSelectedHotendId("");
    setSelectedFirmwareVersion("");
    localStorage.removeItem("selected_printer_brand");
    localStorage.removeItem("selected_printer_id");
    localStorage.removeItem("selected_hotend_id");
    localStorage.removeItem("selected_firmware_version");
    localStorage.removeItem("generic_printer_profile");
  };

  // Set a generic printer profile (for users who don't know their exact model)
  const setGenericProfile = (profileType: string) => {
    clearPrinter();
    localStorage.setItem("generic_printer_profile", profileType);
  };

  // Get current generic profile if set
  const genericProfile = localStorage.getItem("generic_printer_profile") || null;

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
    firmwareVersions,
    firmwareLoading,
    selectedFirmwareVersion,
    setSelectedFirmwareVersion,
    latestFirmware,
    hasNewerFirmware,
    clearPrinter,
    setGenericProfile,
    genericProfile,
  };
}

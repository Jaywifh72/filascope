import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"];
type PrinterBrand = Database["public"]["Tables"]["printer_brands"]["Row"];

export function usePrinterSelection() {
  const [selectedBrand, setSelectedBrand] = useState<string>(() => {
    return localStorage.getItem("selected_printer_brand") || "";
  });
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>(() => {
    return localStorage.getItem("selected_printer_id") || "";
  });

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

  // Clear model selection when brand changes
  useEffect(() => {
    setSelectedPrinterId("");
  }, [selectedBrand]);

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
  };
}
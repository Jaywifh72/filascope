import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const SESSION_KEY = "filascope_session_id";

interface DetectionResult {
  printerId: string;
  modelName: string;
  brand: string;
  confidence: number;
  reason: string;
  imageUrl?: string;
}

export function useSmartPrinterDetection() {
  const { user } = useAuth();

  // Fetch user's browsing activity for printers
  const { data: printerViews } = useQuery({
    queryKey: ["printer-activity", user?.id],
    queryFn: async () => {
      const userId = user?.id;
      const sessionId = localStorage.getItem(SESSION_KEY);

      if (!userId && !sessionId) return [];

      // Get printer page views from user_activity
      let query = supabase
        .from("user_activity")
        .select("entity_id, created_at")
        .eq("entity_type", "printer")
        .order("created_at", { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq("user_id", userId);
      } else {
        query = query.eq("session_id", sessionId);
      }

      const { data, error } = await query;
      if (error) return [];
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Get previously saved printer from localStorage
  const savedPrinterId = localStorage.getItem("selected_printer_id");
  const savedBrand = localStorage.getItem("selected_printer_brand");

  // Fetch saved printer details
  const { data: savedPrinter } = useQuery({
    queryKey: ["saved-printer-detection", savedPrinterId],
    enabled: !!savedPrinterId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers")
        .select(`
          printer_id,
          model_name,
          brand:printer_brands(brand),
          scraped_data
        `)
        .eq("printer_id", savedPrinterId!)
        .single();

      if (error) return null;
      return data;
    },
  });

  // Fetch most viewed printer if no saved printer
  const mostViewedPrinterId = useMemo(() => {
    if (!printerViews || printerViews.length === 0) return null;

    // Count views per printer
    const viewCounts = printerViews.reduce((acc, view) => {
      if (view.entity_id) {
        acc[view.entity_id] = (acc[view.entity_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get the most viewed
    const sorted = Object.entries(viewCounts).sort(([, a], [, b]) => b - a);
    return sorted[0]?.[0] || null;
  }, [printerViews]);

  const { data: viewedPrinter } = useQuery({
    queryKey: ["viewed-printer-detection", mostViewedPrinterId],
    enabled: !!mostViewedPrinterId && !savedPrinterId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers")
        .select(`
          printer_id,
          model_name,
          brand:printer_brands(brand),
          scraped_data
        `)
        .eq("printer_id", mostViewedPrinterId!)
        .single();

      if (error) return null;
      return data;
    },
  });

  // Build detection result
  const detection = useMemo((): DetectionResult | null => {
    // Priority 1: Previously saved printer
    if (savedPrinter) {
      const scrapedData = savedPrinter.scraped_data as { images?: { product_images?: string[] } } | null;
      return {
        printerId: savedPrinter.printer_id,
        modelName: savedPrinter.model_name,
        brand: savedPrinter.brand?.brand || savedBrand || "",
        confidence: 95,
        reason: "Based on your previous selection",
        imageUrl: scrapedData?.images?.product_images?.[0],
      };
    }

    // Priority 2: Most viewed printer
    if (viewedPrinter) {
      const scrapedData = viewedPrinter.scraped_data as { images?: { product_images?: string[] } } | null;
      const viewCount = printerViews?.filter((v) => v.entity_id === mostViewedPrinterId).length || 0;
      return {
        printerId: viewedPrinter.printer_id,
        modelName: viewedPrinter.model_name,
        brand: viewedPrinter.brand?.brand || "",
        confidence: Math.min(50 + viewCount * 10, 85),
        reason: `Based on viewing ${viewCount} compatible filaments`,
        imageUrl: scrapedData?.images?.product_images?.[0],
      };
    }

    return null;
  }, [savedPrinter, viewedPrinter, savedBrand, printerViews, mostViewedPrinterId]);

  return {
    detection,
    hasDetection: !!detection,
  };
}

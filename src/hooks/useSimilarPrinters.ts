import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SimilarPrinter {
  id: string;
  brand: string;
  model: string;
  price: number | null;
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string | null;
  buildVolume: number | null;
  maxSpeed: number | null;
  maxNozzleTemp: number | null;
  hasEnclosure: boolean;
  multiMaterialSupported: boolean;
  multiMaterialMaxSpools: number | null;
  priceTier: string | null;
  // New: similarity reasons for badges
  similarityReasons: SimilarityReason[];
}

export type SimilarityReason = 
  | 'similar_price' 
  | 'same_size' 
  | 'same_features' 
  | 'highly_rated' 
  | 'budget_option' 
  | 'upgrade_pick'
  | 'same_brand';

interface UseSimilarPrintersResult {
  similarPrinters: SimilarPrinter[];
  isLoading: boolean;
}

// Calculate build volume in liters
const calculateBuildVolume = (x: number | null, y: number | null, z: number | null): number | null => {
  if (!x || !y || !z) return null;
  return (x * y * z) / 1000000; // mm³ to liters
};

interface CurrentPrinterContext {
  price: number | null | undefined;
  buildVolume: number | null;
  hasEnclosure: boolean | undefined;
  multiMaterialSupported: boolean | undefined;
  brand: string | null | undefined;
}

// Determine similarity reasons for a printer
const getSimilarityReasons = (
  printer: {
    price: number | null;
    buildVolume: number | null;
    rating: number | null;
    hasEnclosure: boolean;
    multiMaterialSupported: boolean;
    brand: string;
  },
  context: CurrentPrinterContext
): SimilarityReason[] => {
  const reasons: SimilarityReason[] = [];

  // Similar price (within 15%)
  if (context.price && printer.price) {
    const priceDiff = Math.abs(printer.price - context.price) / context.price;
    if (priceDiff <= 0.15) {
      reasons.push('similar_price');
    } else if (printer.price < context.price * 0.85) {
      reasons.push('budget_option');
    } else if (printer.price > context.price * 1.15) {
      reasons.push('upgrade_pick');
    }
  }

  // Same build size (within 20%)
  if (context.buildVolume && printer.buildVolume) {
    const volumeDiff = Math.abs(printer.buildVolume - context.buildVolume) / context.buildVolume;
    if (volumeDiff <= 0.20) {
      reasons.push('same_size');
    }
  }

  // Same features (enclosure + multi-material match)
  const enclosureMatch = printer.hasEnclosure === !!context.hasEnclosure;
  const multiMaterialMatch = printer.multiMaterialSupported === !!context.multiMaterialSupported;
  if (enclosureMatch && multiMaterialMatch) {
    reasons.push('same_features');
  }

  // Highly rated (4.5+)
  if (printer.rating && printer.rating >= 4.5) {
    reasons.push('highly_rated');
  }

  // Same brand
  if (context.brand && printer.brand && 
      printer.brand.toLowerCase() === context.brand.toLowerCase()) {
    reasons.push('same_brand');
  }

  return reasons;
};

export function useSimilarPrinters(
  printerId: string,
  priceTier: string | null | undefined,
  price: number | null | undefined,
  buildVolumeX: number | null | undefined,
  buildVolumeY: number | null | undefined,
  buildVolumeZ: number | null | undefined,
  brand: string | null | undefined,
  hasEnclosure?: boolean,
  multiMaterialSupported?: boolean
): UseSimilarPrintersResult {
  const [data, setData] = useState<UseSimilarPrintersResult>({
    similarPrinters: [],
    isLoading: true,
  });

  useEffect(() => {
    if (!printerId) {
      setData({ similarPrinters: [], isLoading: false });
      return;
    }

    const fetchSimilar = async () => {
      try {
        const currentBuildVolume = calculateBuildVolume(
          buildVolumeX ?? null, 
          buildVolumeY ?? null, 
          buildVolumeZ ?? null
        );

        const context: CurrentPrinterContext = {
          price,
          buildVolume: currentBuildVolume,
          hasEnclosure,
          multiMaterialSupported,
          brand,
        };

        // Build query for similar printers
        let query = supabase
          .from("printers")
          .select(`
            id,
            model_name,
            current_price_usd_store,
            rating_community_overall,
            review_count_aggregated,
            scraped_data,
            build_volume_x_mm,
            build_volume_y_mm,
            build_volume_z_mm,
            max_print_speed_mms,
            max_nozzle_temp_c,
            has_enclosure,
            multi_material_supported,
            multi_material_max_spools,
            price_tier,
            brand_id
          `)
          .neq("id", printerId)
          .not("current_price_usd_store", "is", null)
          .gte("rating_community_overall", 3.5);

        // Filter by price tier if available
        if (priceTier) {
          query = query.eq("price_tier", priceTier);
        }

        // Filter by price range (±50%) if available
        if (price && price > 0) {
          query = query
            .gte("current_price_usd_store", price * 0.5)
            .lte("current_price_usd_store", price * 1.5);
        }

        query = query.limit(30); // Increased from 20 to get more candidates

        const { data: printers, error } = await query;

        if (error) {
          console.error("Error fetching similar printers:", error);
          setData({ similarPrinters: [], isLoading: false });
          return;
        }

        // Fetch brand names
        const brandIds = [...new Set(printers?.map(p => p.brand_id).filter(Boolean))];
        let brandsMap: Record<string, string> = {};
        
        if (brandIds.length > 0) {
          const { data: brands } = await supabase
            .from("printer_brands")
            .select("id, brand")
            .in("id", brandIds);
          
          brands?.forEach(b => {
            brandsMap[b.id] = b.brand;
          });
        }

        // Score and sort printers
        const scored = (printers || []).map(printer => {
          let score = 0;
          const printerBuildVolume = calculateBuildVolume(
            printer.build_volume_x_mm,
            printer.build_volume_y_mm,
            printer.build_volume_z_mm
          );
          const printerBrand = brandsMap[printer.brand_id || ""] || "";

          // Price similarity (0-40 points)
          if (price && printer.current_price_usd_store) {
            const priceDiff = Math.abs(printer.current_price_usd_store - price) / price;
            if (priceDiff <= 0.15) score += 40;
            else if (priceDiff <= 0.30) score += 25;
            else if (priceDiff <= 0.50) score += 10;
          }

          // Build volume similarity (0-30 points)
          if (currentBuildVolume && printerBuildVolume) {
            const volumeDiff = Math.abs(printerBuildVolume - currentBuildVolume) / currentBuildVolume;
            if (volumeDiff <= 0.20) score += 30;
            else if (volumeDiff <= 0.40) score += 20;
            else if (volumeDiff <= 0.60) score += 10;
          }

          // Rating bonus (0-20 points)
          if (printer.rating_community_overall) {
            score += (printer.rating_community_overall - 3.5) * 13.3;
          }

          // Enclosure match bonus (0-15 points)
          if (hasEnclosure !== undefined) {
            if (printer.has_enclosure === hasEnclosure) {
              score += 15;
            }
          }

          // Multi-material match bonus (0-15 points)
          if (multiMaterialSupported !== undefined) {
            if (printer.multi_material_supported === multiMaterialSupported) {
              score += 15;
            }
          }

          // Different brand bonus (encourage variety, but not for same brand)
          if (printerBrand && brand && printerBrand.toLowerCase() !== brand.toLowerCase()) {
            score += 10;
          }

          // Get image from scraped_data
          let imageUrl: string | null = null;
          if (printer.scraped_data && typeof printer.scraped_data === 'object') {
            const scrapedData = printer.scraped_data as Record<string, any>;
            imageUrl = scrapedData.image_url || scrapedData.imageUrl || null;
          }

          // Calculate similarity reasons
          const similarityReasons = getSimilarityReasons(
            {
              price: printer.current_price_usd_store,
              buildVolume: printerBuildVolume,
              rating: printer.rating_community_overall,
              hasEnclosure: printer.has_enclosure || false,
              multiMaterialSupported: printer.multi_material_supported || false,
              brand: printerBrand,
            },
            context
          );

          return {
            printer: {
              id: printer.id,
              brand: printerBrand,
              model: printer.model_name,
              price: printer.current_price_usd_store,
              rating: printer.rating_community_overall,
              reviewCount: printer.review_count_aggregated,
              imageUrl,
              buildVolume: printerBuildVolume,
              maxSpeed: printer.max_print_speed_mms,
              maxNozzleTemp: printer.max_nozzle_temp_c,
              hasEnclosure: printer.has_enclosure || false,
              multiMaterialSupported: printer.multi_material_supported || false,
              multiMaterialMaxSpools: printer.multi_material_max_spools,
              priceTier: printer.price_tier,
              similarityReasons,
            } as SimilarPrinter,
            score,
          };
        });

        // Sort by score and select diverse options
        scored.sort((a, b) => b.score - a.score);

        const selected: SimilarPrinter[] = [];
        const usedBrands = new Set<string>();

        // Try to get one cheaper option (budget pick)
        const cheaper = scored.find(s => 
          price && s.printer.price && s.printer.price < price * 0.85
        );
        if (cheaper) {
          selected.push(cheaper.printer);
          if (cheaper.printer.brand) usedBrands.add(cheaper.printer.brand.toLowerCase());
        }

        // Try to get one similar price option
        const similar = scored.find(s =>
          !selected.some(sel => sel.id === s.printer.id) &&
          price && s.printer.price &&
          Math.abs(s.printer.price - price) / price <= 0.20
        );
        if (similar) {
          selected.push(similar.printer);
          if (similar.printer.brand) usedBrands.add(similar.printer.brand.toLowerCase());
        }

        // Try to get one more expensive option (upgrade pick)
        const expensive = scored.find(s =>
          !selected.some(sel => sel.id === s.printer.id) &&
          price && s.printer.price && s.printer.price > price * 1.15
        );
        if (expensive) {
          selected.push(expensive.printer);
          if (expensive.printer.brand) usedBrands.add(expensive.printer.brand.toLowerCase());
        }

        // Try to add a highly-rated option from a different brand
        const highlyRated = scored.find(s =>
          !selected.some(sel => sel.id === s.printer.id) &&
          s.printer.rating && s.printer.rating >= 4.5 &&
          s.printer.brand && !usedBrands.has(s.printer.brand.toLowerCase())
        );
        if (highlyRated && selected.length < 5) {
          selected.push(highlyRated.printer);
          if (highlyRated.printer.brand) usedBrands.add(highlyRated.printer.brand.toLowerCase());
        }

        // Fill remaining slots with highest scoring (up to 5 total)
        while (selected.length < 5) {
          const next = scored.find(s => !selected.some(sel => sel.id === s.printer.id));
          if (!next) break;
          selected.push(next.printer);
        }

        setData({
          similarPrinters: selected,
          isLoading: false,
        });
      } catch (err) {
        console.error("Error in useSimilarPrinters:", err);
        setData({ similarPrinters: [], isLoading: false });
      }
    };

    fetchSimilar();
  }, [printerId, priceTier, price, buildVolumeX, buildVolumeY, buildVolumeZ, brand, hasEnclosure, multiMaterialSupported]);

  return data;
}

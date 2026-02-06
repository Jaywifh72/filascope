import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SimilarPrinter {
  id: string;
  printerId: string | null; // SEO-friendly slug (printer_id column)
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
  | 'same_brand'
  | 'same_motion'
  | 'high_speed';

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
  motionSystem: string | null | undefined;
  maxSpeed: number | null | undefined;
}

// Determine if a printer is "high-speed" (≥300mm/s)
const isHighSpeed = (speed: number | null | undefined): boolean => {
  return !!speed && speed >= 300;
};

// Normalize motion system types for comparison
const normalizeMotionSystem = (motion: string | null | undefined): string | null => {
  if (!motion) return null;
  const lower = motion.toLowerCase();
  if (lower.includes('corexy') || lower.includes('core xy')) return 'corexy';
  if (lower.includes('delta')) return 'delta';
  if (lower.includes('bedslinger') || lower.includes('bed-slinger') || lower.includes('cartesian')) return 'bedslinger';
  return lower;
};

// Determine similarity reasons for a printer
const getSimilarityReasons = (
  printer: {
    price: number | null;
    buildVolume: number | null;
    rating: number | null;
    hasEnclosure: boolean;
    multiMaterialSupported: boolean;
    brand: string;
    motionSystem: string | null;
    maxSpeed: number | null;
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

  // Highly rated (4.0+ with new threshold)
  if (printer.rating && printer.rating >= 4.0) {
    reasons.push('highly_rated');
  }

  // Same brand
  if (context.brand && printer.brand && 
      printer.brand.toLowerCase() === context.brand.toLowerCase()) {
    reasons.push('same_brand');
  }

  // Same motion system
  const contextMotion = normalizeMotionSystem(context.motionSystem);
  const printerMotion = normalizeMotionSystem(printer.motionSystem);
  if (contextMotion && printerMotion && contextMotion === printerMotion) {
    reasons.push('same_motion');
  }

  // Both high-speed printers
  if (isHighSpeed(context.maxSpeed) && isHighSpeed(printer.maxSpeed)) {
    reasons.push('high_speed');
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
  multiMaterialSupported?: boolean,
  motionSystem?: string | null,
  maxSpeed?: number | null
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
          motionSystem,
          maxSpeed,
        };

        // Build query for similar printers - relaxed filters to get more results
        let query = supabase
          .from("printers")
          .select(`
            id,
            printer_id,
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
          .not("current_price_usd_store", "is", null);

        // Only filter by price range if available - wider range (±100%)
        if (price && price > 0) {
          query = query
            .gte("current_price_usd_store", price * 0.25)
            .lte("current_price_usd_store", price * 3);
        }

        query = query.limit(50); // Increased to get more candidates for scoring

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
        // Max possible score: ~100-110 points
        // - Price: 35pts, Volume: 30pts, Rating: 10pts, Enclosure: 12pts, 
        // - Multi-material: 8pts, Different brand: 10pts, Motion: 5pts, Speed: 5pts
        const scored = (printers || []).map(printer => {
          let score = 0;
          const printerBuildVolume = calculateBuildVolume(
            printer.build_volume_x_mm,
            printer.build_volume_y_mm,
            printer.build_volume_z_mm
          );
          const printerBrand = brandsMap[printer.brand_id || ""] || "";

          // Price similarity (0-35 points) - refined tiers
          if (price && printer.current_price_usd_store) {
            const priceDiff = Math.abs(printer.current_price_usd_store - price) / price;
            if (priceDiff <= 0.15) score += 35;
            else if (priceDiff <= 0.25) score += 25;
            else if (priceDiff <= 0.40) score += 15;
            // >40% difference: 0 points
          }

          // Build volume similarity (0-30 points) - unchanged
          if (currentBuildVolume && printerBuildVolume) {
            const volumeDiff = Math.abs(printerBuildVolume - currentBuildVolume) / currentBuildVolume;
            if (volumeDiff <= 0.20) score += 30;
            else if (volumeDiff <= 0.40) score += 20;
            else if (volumeDiff <= 0.60) score += 10;
          }

          // Rating bonus (0-10 points) - new threshold at 4.0
          // Formula: (rating - 4.0) * 10 for ratings >= 4.0
          // Max ~10 points for 5-star rated printers
          if (printer.rating_community_overall && printer.rating_community_overall >= 4.0) {
            score += Math.min(10, (printer.rating_community_overall - 4.0) * 10);
          }

          // Enclosure match bonus (0-12 points) - reduced from 15
          if (hasEnclosure !== undefined) {
            if (printer.has_enclosure === hasEnclosure) {
              score += 12;
            }
          }

          // Multi-material match bonus (0-8 points) - reduced from 15
          if (multiMaterialSupported !== undefined) {
            if (printer.multi_material_supported === multiMaterialSupported) {
              score += 8;
            }
          }

          // Different brand bonus (10 points) - unchanged
          if (printerBrand && brand && printerBrand.toLowerCase() !== brand.toLowerCase()) {
            score += 10;
          }

          // Motion system match bonus (0-5 points) - NEW
          // Note: motion_system column not available yet, using motionSystem param if provided
          const contextMotion = normalizeMotionSystem(motionSystem);
          // For now, skip motion matching since column doesn't exist
          // TODO: Enable when motion_system column is added to printers table
          // const printerMotion = normalizeMotionSystem(printer.motion_system);
          // if (contextMotion && printerMotion && contextMotion === printerMotion) {
          //   score += 5;
          // }

          // Speed tier match bonus (0-5 points) - NEW
          // Both high-speed (≥300mm/s) or both standard
          const contextIsHighSpeed = isHighSpeed(maxSpeed);
          const printerIsHighSpeed = isHighSpeed(printer.max_print_speed_mms);
          if (contextIsHighSpeed === printerIsHighSpeed) {
            score += 5;
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
              motionSystem: null, // Column not available yet
              maxSpeed: printer.max_print_speed_mms,
            },
            context
          );

          return {
            printer: {
              id: printer.id,
              printerId: printer.printer_id,
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
  }, [printerId, priceTier, price, buildVolumeX, buildVolumeY, buildVolumeZ, brand, hasEnclosure, multiMaterialSupported, motionSystem, maxSpeed]);

  return data;
}

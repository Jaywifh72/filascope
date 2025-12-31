import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SimilarFilament {
  id: string;
  product_title: string;
  vendor: string | null;
  variant_price: number | null;
  color_hex: string | null;
  material: string | null;
  net_weight_g: number | null;
}

interface UseSimilarFilamentsResult {
  similars: SimilarFilament[];
  count: number;
  isLoading: boolean;
}

export function useSimilarFilaments(
  filamentId: string,
  material: string | null | undefined,
  colorFamily: string | null | undefined,
  vendor: string | null | undefined,
  price: number | null | undefined
): UseSimilarFilamentsResult {
  const [data, setData] = useState<UseSimilarFilamentsResult>({
    similars: [],
    count: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!filamentId || !material) {
      setData({ similars: [], count: 0, isLoading: false });
      return;
    }

    const fetchSimilar = async () => {
      try {
        let query = supabase
          .from("filaments")
          .select("id, product_title, vendor, variant_price, color_hex, material, net_weight_g")
          .eq("material", material)
          .neq("id", filamentId)
          .not("vendor", "eq", vendor || "")
          .or("net_weight_g.is.null,net_weight_g.gte.300") // Exclude small/sample spools
          .limit(5);

        // Filter by similar color family if available
        if (colorFamily) {
          query = query.eq("color_family", colorFamily);
        }

        // Filter by price range if available (±30%)
        if (price && price > 0) {
          query = query
            .gte("variant_price", price * 0.7)
            .lte("variant_price", price * 1.3);
        }

        const { data: filaments, error } = await query;

        if (error) {
          console.error("Error fetching similar filaments:", error);
          setData({ similars: [], count: 0, isLoading: false });
          return;
        }

        setData({
          similars: filaments || [],
          count: filaments?.length || 0,
          isLoading: false,
        });
      } catch (err) {
        console.error("Error in useSimilarFilaments:", err);
        setData({ similars: [], count: 0, isLoading: false });
      }
    };

    fetchSimilar();
  }, [filamentId, material, colorFamily, vendor, price]);

  return data;
}

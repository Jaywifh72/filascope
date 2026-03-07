import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatProductLineIdForDisplay } from "@/lib/productNameUtils";
import type { Tables } from "@/integrations/supabase/types";

type Filament = Tables<"filaments">;

export interface GroupedProduct {
  baseName: string;
  material: string | null;
  variants: Filament[];
  representativeImage: string | null;
  priceRange: { min: number | null; max: number | null };
  productUrl: string | null;
  categoryUrl: string | null;
}

// Brand-specific category URL patterns for grouped products
function getCategoryUrl(brand: string, material: string | null): string | null {
  if (!material) return null;
  const materialLower = material.toLowerCase();
  const brandLower = brand.toLowerCase();

  if (brandLower === "prusament") {
    const map: Record<string, string> = {
      asa: "prusament-asa",
      petg: "prusament-petg",
      pla: "prusament-pla",
      "pc blend": "prusament-pc-blend",
      pvb: "prusament-pvb",
      "pa11 carbon fiber": "prusament-pa11-cf",
    };
    const slug = map[materialLower];
    if (slug) return `https://www.prusa3d.com/category/${slug}/`;
  }

  if (brandLower === "polymaker") {
    return `https://us.polymaker.com/collections/${materialLower}`;
  }

  if (brandLower === "bambu lab") {
    return `https://us.store.bambulab.com/collections/filament`;
  }

  return null;
}

interface RpcGroupItem {
  group_key: string;
  product_line_id: string | null;
  material: string | null;
  variant_count: number;
  group_colors: string[] | null;
  group_weights: number[] | null;
  price_min: number | null;
  price_max: number | null;
  representative_id: string;
  variant_ids: string[];
  representative: Record<string, unknown>;
}

function mapRpcToGroupedProducts(
  items: RpcGroupItem[],
  allVariants: Filament[],
  brandName: string
): GroupedProduct[] {
  // Build a lookup for variant filaments
  const variantMap = new Map<string, Filament>();
  for (const v of allVariants) {
    variantMap.set(v.id, v);
  }

  return items.map((item) => {
    const rep = item.representative as unknown as Filament;

    // Determine display name
    const baseName = item.product_line_id
      ? formatProductLineIdForDisplay(item.product_line_id, rep.product_title)
      : rep.display_name || rep.product_title || "";

    // Collect variant filaments from the map
    const variants: Filament[] = [];
    for (const vid of item.variant_ids) {
      const v = variantMap.get(vid);
      if (v) variants.push(v);
    }
    // If variant fetch hasn't loaded yet, at least include the representative
    if (variants.length === 0) {
      variants.push(rep);
    }

    return {
      baseName,
      material: item.material,
      variants,
      representativeImage: rep.featured_image || null,
      priceRange: { min: item.price_min, max: item.price_max },
      productUrl: rep.product_url || null,
      categoryUrl: getCategoryUrl(brandName, item.material),
    };
  });
}

export interface UseBrandFilamentsResult {
  groupedProducts: GroupedProduct[];
  filaments: Filament[];
  availableMaterials: string[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useBrandFilaments(
  brandName: string,
  selectedMaterial: string | null
): UseBrandFilamentsResult {
  // Query 1: Get grouped data from RPC
  const {
    data: rpcData,
    isLoading: rpcLoading,
    isError: rpcError,
    refetch,
  } = useQuery({
    queryKey: ["brand-filaments-grouped", brandName, selectedMaterial],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_brand_filaments_grouped" as any,
        {
          p_brand_name: brandName,
          p_material: selectedMaterial || undefined,
        }
      );
      if (error) throw error;
      return data as unknown as { total: number; items: RpcGroupItem[] };
    },
    enabled: !!brandName,
  });

  const items = rpcData?.items || [];

  // Collect all variant IDs from all groups
  const allVariantIds = items.flatMap((item) => item.variant_ids);

  // Query 2: Fetch all variant filaments in one query
  const { data: allVariants, isLoading: variantsLoading } = useQuery({
    queryKey: ["brand-filament-variants", brandName, selectedMaterial, allVariantIds.length],
    queryFn: async () => {
      if (allVariantIds.length === 0) return [];

      // Supabase .in() has a limit; batch if needed
      const BATCH_SIZE = 500;
      const results: Filament[] = [];

      for (let i = 0; i < allVariantIds.length; i += BATCH_SIZE) {
        const batch = allVariantIds.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from("filaments")
          .select("*")
          .in("id", batch);
        if (error) throw error;
        if (data) results.push(...(data as Filament[]));
      }

      return results;
    },
    enabled: allVariantIds.length > 0,
  });

  const filaments = allVariants || [];

  // Derive available materials from ALL groups (not filtered)
  // We need a separate query for unfiltered materials
  const { data: unfilteredRpc } = useQuery({
    queryKey: ["brand-filaments-grouped", brandName, null],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_brand_filaments_grouped" as any,
        {
          p_brand_name: brandName,
        }
      );
      if (error) throw error;
      return data as unknown as { total: number; items: RpcGroupItem[] };
    },
    enabled: !!brandName && selectedMaterial !== null,
  });

  const materialsSource = selectedMaterial !== null && unfilteredRpc
    ? unfilteredRpc.items
    : items;

  const availableMaterials = Array.from(
    new Set(
      materialsSource
        .map((item) => item.material)
        .filter((m): m is string => m !== null)
    )
  ).sort();

  const groupedProducts = mapRpcToGroupedProducts(
    items,
    filaments,
    brandName
  );

  return {
    groupedProducts,
    filaments,
    availableMaterials,
    isLoading: rpcLoading || variantsLoading,
    isError: rpcError,
    refetch,
  };
}

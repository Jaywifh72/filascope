import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BRAND_SPECIFIC_FUNCTIONS } from "@/lib/brand-sync-config";

interface BrandFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  shopify: "bg-green-500",
  amazon: "bg-orange-500",
  woocommerce: "bg-purple-500",
  bigcommerce: "bg-blue-500",
  magento: "bg-red-500",
  custom: "bg-zinc-500",
};

// Create a Set for O(1) lookup
const SYNC_MANAGER_BRANDS = new Set<string>(BRAND_SPECIFIC_FUNCTIONS);

export function BrandFilter({
  value,
  onChange,
  placeholder = "All Brands",
}: BrandFilterProps) {
  const { data: brands, isLoading } = useQuery({
    queryKey: ["automated-brands-filter-synced"],
    queryFn: async () => {
      // Get brand metadata from v_brand_directory
      const { data: brandData, error: brandError } = await supabase
        .from("v_brand_directory")
        .select("brand_slug, display_name");

      if (brandError) throw brandError;

      // Get live counts from the RPC
      const { data: countData, error: countError } = await supabase
        .rpc("get_catalog_counts_by_brand");

      const countsMap: Record<string, number> = {};
      if (!countError && countData) {
        (countData as any[]).forEach((row: any) => {
          countsMap[row.vendor_lower] = Number(row.variant_count);
        });
      }

      // Filter to only include brands in the sync manager, then sort
      const filtered = (brandData || [])
        .filter(brand => SYNC_MANAGER_BRANDS.has(brand.brand_slug))
        .map(brand => ({
          ...brand,
          variant_count: countsMap[brand.brand_slug] ?? 0,
        }));

      return filtered.sort((a, b) => {
        const aStartsWithNumber = /^\d/.test(a.display_name);
        const bStartsWithNumber = /^\d/.test(b.display_name);
        if (aStartsWithNumber && !bStartsWithNumber) return -1;
        if (!aStartsWithNumber && bStartsWithNumber) return 1;
        return a.display_name.localeCompare(b.display_name);
      });
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return (
    <Select
      value={value || "all"}
      onValueChange={(v) => onChange(v === "all" ? null : v)}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {brands?.map((brand) => (
          <SelectItem key={brand.brand_slug} value={brand.brand_slug}>
            <div className="flex items-center justify-between gap-2 w-full">
              <span>{brand.display_name}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {brand.variant_count}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

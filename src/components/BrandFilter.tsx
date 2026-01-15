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
      // Use public view to avoid exposing scraping configuration
      const { data, error } = await supabase
        .from("v_public_brands")
        .select("brand_slug, display_name, product_count")
        .order("display_name");

      if (error) throw error;
      // Filter to only include brands in the sync manager
      return data?.filter(brand => SYNC_MANAGER_BRANDS.has(brand.brand_slug)) || [];
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
                {brand.product_count}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
